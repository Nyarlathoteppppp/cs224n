/* Structure and formula check for the site content. Run: node tests/site.check.js
 * Loads data/*.js with a fake window, then checks chapter structure, links, visual specs, quizzes, and renders
 * every $…$ / $$…$$ and every formula with KaTeX (throwOnError). Exit code 1 when anything is wrong. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const problems = [];
const warnings = [];
const bad = (where, msg) => problems.push(where + ': ' + msg);
const warn = (where, msg) => warnings.push(where + ': ' + msg);

global.window = global;
const katex = require(path.join(ROOT, 'vendor/katex/dist/katex.min.js'));
const KATEX = { throwOnError: true, strict: 'ignore', trust: (c) => c.command === '\\htmlClass' };

/* ---------- load the files index.html loads, in order ---------- */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1]);
refs.forEach((r) => { if (!fs.existsSync(path.join(ROOT, r))) bad('index.html', 'missing file ' + r); });
const scripts = refs.filter((r) => r.endsWith('.js'));
['data/chapters', 'js/viz'].forEach((dir) => {
  if (!fs.existsSync(path.join(ROOT, dir))) return;
  fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.js')).forEach((f) => {
    if (!scripts.includes(dir + '/' + f)) bad('index.html', 'does not load ' + dir + '/' + f);
  });
});
const dataScripts = scripts.filter((s) => s.startsWith('data/'));
dataScripts.forEach((s) => {
  try { vm.runInThisContext(fs.readFileSync(path.join(ROOT, s), 'utf8'), { filename: s }); }
  catch (e) { bad(s, 'does not load: ' + e.message); }
});
const content = global.CS224N && global.CS224N.content;
if (!content) { console.log('content did not load'); process.exit(1); }

/* ---------- helpers ---------- */
// Bold that would not render: CommonMark will not close ** between full-width punctuation and a Chinese character.
// Mirrors js/ui/markdown.js: maths becomes @@M@@ placeholders, then key terms are glossed, then markdown-it renders.
const markdownit = require(path.join(ROOT, 'vendor/markdown-it/dist/markdown-it.min.js'));
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js/ui/terms.js'), 'utf8'), { filename: 'js/ui/terms.js' });
const mdit = markdownit({ html: true });
function checkBold(where, text) {
  if (!text.includes('**')) return;
  const prose = text.split(/(```[\s\S]*?```)/g).filter((_, i) => i % 2 === 0).join('\n')
    .replace(/\$\$[\s\S]+?\$\$/g, '@@M@@').replace(/\$[^\n$]+?\$/g, '@@M@@');
  if (mdit.render(global.CS224N.terms.apply(prose)).includes('**')) bad(where, 'bold markers would show as literal ** (punctuation right inside the closing **, followed by Chinese?)');
}
function checkMath(where, text) {
  if (typeof text !== 'string') return;
  checkBold(where, text);
  const math = [];
  text.split(/(```[\s\S]*?```)/g).forEach((chunk, i) => {
    if (i % 2) return;
    chunk.replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => { math.push([t, true]); return ''; })
      .replace(/\$([^\n$]+?)\$/g, (_, t) => { math.push([t, false]); return ''; });
  });
  math.forEach(([t, display]) => {
    try { katex.renderToString(t, Object.assign({ displayMode: display }, KATEX)); }
    catch (e) { bad(where, 'KaTeX: ' + e.message.split('\n')[0] + ' in «' + t.slice(0, 60) + '»'); }
  });
  if (/[一-鿿][^\n]*"|"[^\n]*[一-鿿]/.test(text.replace(/\$[^$]*\$/g, ''))) warn(where, 'straight double quote in Chinese text (use “ ”)');
}
const TEXT_FIELDS = ['hook', 'background', 'usedIn', 'compare', 'source', 'extNote'];
const TOPIC_FIELDS = ['question', 'intuition', 'math', 'example', 'extra', 'story', 'takeaway'];

/* ---------- chapters ---------- */
const parts = new Set(content.parts.map((p) => p.id));
const ids = new Set(), nums = new Set();
content.chapters.forEach((c) => {
  const where = c.id || '(chapter without id)';
  global.CS224N.terms.begin(c.id);
  if (ids.has(c.id)) bad(where, 'duplicate id'); ids.add(c.id);
  if (nums.has(c.num)) bad(where, 'duplicate number ' + c.num); nums.add(c.num);
  if (!parts.has(c.part)) bad(where, 'unknown part ' + c.part);
  ['title', 'num', 'hook'].forEach((k) => { if (!c[k]) bad(where, 'missing ' + k); });
  if (!(c.topics || []).length) bad(where, 'no topics');
  TEXT_FIELDS.forEach((k) => checkMath(where + '.' + k, c[k]));
  (c.goals || []).forEach((g, i) => checkMath(where + '.goals[' + i + ']', g));
  (c.takeaways || []).forEach((g, i) => checkMath(where + '.takeaways[' + i + ']', g));

  const topicIds = new Set();
  (c.topics || []).forEach((t) => {
    const tw = where + '#' + t.id;
    if (!t.id) bad(where, 'topic without id');
    if (topicIds.has(t.id)) bad(tw, 'duplicate topic id'); topicIds.add(t.id);
    if (!t.title) bad(tw, 'missing title');
    if (!t.question) bad(tw, 'missing question');
    TOPIC_FIELDS.forEach((k) => checkMath(tw + '.' + k, t[k]));
    (t.visuals || []).forEach((v) => {
      const known = v.type === 'video' ? content.videoSpecs[v.id] || content.videos[v.id] : content.visuals[v.id];
      if (!known) bad(tw, (v.type === 'video' ? 'video' : 'visual') + ' "' + v.id + '" has no spec');
    });
    (t.formulas || []).forEach((f, i) => {
      const fw = tw + '.formulas[' + i + ']';
      try { katex.renderToString(f.latex, Object.assign({ displayMode: true }, KATEX)); }
      catch (e) { bad(fw, 'KaTeX: ' + e.message.split('\n')[0]); }
      const marked = new Set([...f.latex.matchAll(/\\htmlClass\{fx-([\w-]+)\}/g)].map((m) => m[1]));
      const keys = new Set((f.parts || []).map((p) => p.key));
      keys.forEach((k) => { if (!marked.has(k)) bad(fw, 'part "' + k + '" is not marked in the latex'); });
      marked.forEach((k) => { if (!keys.has(k)) bad(fw, 'latex marks "' + k + '" but no part describes it'); });
      (f.parts || []).forEach((p) => { checkMath(fw + '.' + p.key, p.text); checkMath(fw + '.' + p.key + '.label', p.label); });
      (f.steps || []).forEach((s, k) => {
        s.keys.forEach((key) => { if (!keys.has(key)) bad(fw, 'step ' + k + ' uses unknown part ' + key); });
        checkMath(fw + '.steps[' + k + ']', s.text);
      });
    });
  });
  (c.prereq || []).forEach((p) => {
    if (p.ch && !content.chapters.some((x) => x.id === p.ch)) bad(where, 'prereq links to unknown chapter ' + p.ch);
    if (p.here && !topicIds.has(p.here)) bad(where, 'prereq points to unknown topic ' + p.here);
    if (p.here && !(c.topics.find((t) => t.id === p.here) || {}).remedial) warn(where, 'prereq "' + p.text + '" points to a topic that is not marked remedial');
  });
  (c.pitfalls || []).forEach((p, i) => { checkMath(where + '.pitfalls[' + i + ']', p.wrong); checkMath(where + '.pitfalls[' + i + ']', p.right); });
  (c.quiz || []).forEach((q, i) => {
    const qw = where + '.quiz[' + i + ']';
    const type = q.type || (Array.isArray(q.answer) ? 'multi' : typeof q.answer === 'number' && !q.options ? 'numeric' : 'single');
    if (!q.q) bad(qw, 'missing question text');
    if (!q.explain) bad(qw, 'missing explanation');
    if (type === 'numeric') { if (typeof q.answer !== 'number') bad(qw, 'numeric answer is not a number'); }
    else {
      if (!(q.options || []).length) bad(qw, 'no options');
      [].concat(q.answer).forEach((a) => { if (!(Number.isInteger(a) && a >= 0 && a < (q.options || []).length)) bad(qw, 'answer index ' + a + ' out of range'); });
      if (q.why && q.why.length !== q.options.length) bad(qw, 'why[] length differs from options');
    }
    checkMath(qw, q.q); checkMath(qw, q.explain); (q.options || []).forEach((o) => checkMath(qw, o)); (q.why || []).forEach((o) => checkMath(qw, o));
  });
  if (!c.stub) {
    if ((c.quiz || []).length < 3) bad(where, 'fewer than 3 quiz questions');
    if (!(c.takeaways || []).length) bad(where, 'no chapter summary');
    if (!(c.goals || []).length) bad(where, 'no goals');
    (c.topics || []).forEach((t) => { if (!t.intuition) bad(where + '#' + t.id, 'no intuition text'); });
  }
});

/* ---------- never assume what hasn't been taught ---------- */
// For every written chapter, the first use of a term that is taught in a later chapter (tests/taught.js) must come with a
// bracketed explanation right after it, or a forward pointer (第 N 部分 / 第 N.M 章 / 下一章 …) in the same sentence.
const TAUGHT = require('./taught.js');
const order = (id) => { const m = /^c(\d+)-(\d+)$/.exec(id || ''); return m ? +m[1] * 100 + +m[2] : Infinity; };
const POINTER = /第\s*\d[\d、，,.\s–-]*\s*(部分|章)|下一章|下一节|下一个补课|后面会|会讲|会补讲|会介绍|会正式讲|会详细讲|会单独/;
const GLOSS = /^(\s*[（(]|，?\s*(也就是|即|就是|指的是|意思是))/;
function chapterText(c) {
  const out = [c.hook, c.background, c.usedIn].concat(c.goals || []);
  (c.topics || []).forEach((t) => {
    out.push(t.question, t.intuition);
    (t.formulas || []).forEach((f) => (f.parts || []).forEach((p) => out.push(p.label, p.text)));
    out.push(t.math, t.example, t.extra, t.story, t.takeaway);
  });
  out.push(c.compare);
  (c.pitfalls || []).forEach((p) => out.push(p.wrong, p.right));
  (c.quiz || []).forEach((q) => out.push(q.q, q.explain));
  return out.concat(c.takeaways || []).filter((x) => typeof x === 'string').join('\n')
    .replace(/```[\s\S]*?```/g, ' ').replace(/\$\$[\s\S]+?\$\$/g, ' ').replace(/\$[^\n$]+?\$/g, ' ');
}
const forward = [];
content.chapters.filter((c) => !c.stub).forEach((c) => {
  const text = chapterText(c);
  Object.entries(TAUGHT).forEach(([term, where]) => {
    if (where === c.id || (where && order(where) <= order(c.id))) return;
    // first occurrence that is not part of a longer listed term (自监督学习 is not 监督学习)
    const longer = Object.keys(TAUGHT).filter((t) => t !== term && t.includes(term));
    let i = text.indexOf(term);
    while (i >= 0 && longer.some((t) => { const k = t.indexOf(term); return text.slice(i - k, i - k + t.length) === t; })) i = text.indexOf(term, i + 1);
    if (i < 0) return;
    const after = text.slice(i + term.length).replace(/^\*+/, '');
    const start = Math.max(text.lastIndexOf('。', i), text.lastIndexOf('\n', i), text.lastIndexOf('？', i)) + 1;
    const ends = ['。', '\n', '？'].map((p) => text.indexOf(p, i)).filter((k) => k >= 0);
    const sentence = text.slice(start, ends.length ? Math.min(...ends) : text.length);
    const before = text.slice(0, i);
    const inBrackets = before.lastIndexOf('（') > before.lastIndexOf('）');   // the term itself names a bracketed gloss
    const routeRow = /^\|\s*\d/.test(sentence.trim());                      // a row of a “部分 | 内容” route table
    if (GLOSS.test(after) || inBrackets || routeRow || POINTER.test(sentence)) return;
    forward.push(c.id + ': “' + term + '”' + (where ? '（第 ' + where.slice(1).replace('-', '.') + ' 章才讲）' : '（本站不单独讲）') + '没有解释或指引：' + sentence.trim().slice(0, 60));
  });
});
forward.forEach((f) => warn('先用后讲', f));

/* ---------- visual specs ---------- */
Object.entries(content.visuals).forEach(([id, s]) => {
  ['title', 'question', 'what', 'data'].forEach((k) => { if (!s[k]) bad('visuals.' + id, 'missing ' + k); });
  ['question', 'what', 'data'].forEach((k) => checkMath('visuals.' + id + '.' + k, s[k]));
});
Object.entries(content.videoSpecs).forEach(([id, s]) => {
  ['title', 'question', 'aha'].forEach((k) => { if (!s[k]) bad('videos.' + id, 'missing ' + k); });
  ['question', 'aha'].forEach((k) => checkMath('videos.' + id + '.' + k, s[k]));
});
const used = new Set();
content.chapters.forEach((c) => (c.topics || []).forEach((t) => (t.visuals || []).forEach((v) => used.add(v.id))));
Object.keys(content.visuals).concat(Object.keys(content.videoSpecs)).forEach((id) => { if (!used.has(id)) warn('visuals', '"' + id + '" is specified but no chapter uses it'); });

/* ---------- report ---------- */
const real = content.chapters.filter((c) => !c.stub).length;
console.log(content.chapters.length + ' chapters (' + real + ' written, ' + (content.chapters.length - real) + ' outlines), ' +
  Object.keys(content.visuals).length + ' experiment specs, ' + Object.keys(content.videoSpecs).length + ' video specs');
if (warnings.length) console.log('\nwarnings:\n  ' + warnings.join('\n  '));
if (problems.length) { console.log('\nproblems:\n  ' + problems.join('\n  ')); process.exitCode = 1; }
else console.log('site check passed');
