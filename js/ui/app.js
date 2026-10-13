/* Application shell: routing, table of contents, progress, theme and page rendering.
 * Routes: #/ home · #/c/<id> chapter · #/glossary · #/formulas · #/review
 * A chapter is a list of topics; each topic answers one question with intuition → maths → example. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, clear, store } = C.dom;
  const md = (s) => C.md.render(s || '');
  const inline = (s) => C.md.renderInline(s || '');
  const plainInline = (s) => C.md.escapeHTML(s || '');            // titles: no term annotation, no markdown

  const chapters = () => C.content.chapters;
  const byId = (id) => chapters().find((c) => c.id === id);
  const indexOf = (id) => chapters().findIndex((c) => c.id === id);
  const partOf = (c) => C.content.parts.find((p) => p.id === c.part);
  const mastered = () => new Set(store.get('mastered', []));
  const quizOf = (c) => [].concat(c.quiz || []);
  let observer = null;

  /* ---------- theme and font ---------- */
  function currentTheme() { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function paintThemeButton() {
    const dark = currentTheme() === 'dark', btn = document.getElementById('theme-toggle');
    btn.textContent = dark ? '浅色' : '深色';
    btn.setAttribute('aria-label', dark ? '切换到浅色' : '切换到深色');
  }
  function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store.set('theme', next);
    paintThemeButton();
    root.dispatchEvent(new CustomEvent('cs224n:theme'));
  }
  const FONT_SIZES = [16.5, 18, 19.5];
  function applyFont(i) {
    document.documentElement.style.fontSize = (FONT_SIZES[i] / 16.5 * 100) + '%';
    document.getElementById('font-toggle').textContent = i === FONT_SIZES.length - 1 ? '字号 A−' : '字号 A+';
  }

  /* ---------- table of contents ---------- */
  function chapterTag(c) {
    if (c.kind === 'homework') return h('span.toc-tag', '作业');
    if (c.kind === 'extension') return h('span.toc-tag', '延伸');
    if (c.kind === 'appendix') return h('span.toc-tag', '附录');
    return null;
  }
  function buildTOC() {
    const nav = clear(document.getElementById('toc-list'));
    const done = mastered(), visited = new Set(store.get('visited', []));
    nav.appendChild(h('a.toc-home', { href: '#/' }, '课程总览'));
    C.content.parts.forEach((part) => {
      const list = chapters().filter((c) => c.part === part.id);
      if (!list.length) {
        nav.appendChild(h('div.toc-part.later', h('div.toc-part-head', h('span.toc-part-num', part.num), h('span.toc-part-title', part.title), h('span.toc-part-count', '编写中'))));
        return;
      }
      const n = list.filter((c) => done.has(c.id)).length;
      nav.appendChild(h('div.toc-part',
        h('div.toc-part-head', h('span.toc-part-num', part.num), h('span.toc-part-title', part.title), h('span.toc-part-count', n + '/' + list.length)),
        h('ol.toc-chapters', list.map((c) => h('li', h('a.toc-link', { href: '#/c/' + c.id, dataset: { id: c.id } },
          h('span.toc-dot' + (done.has(c.id) ? '.done' : visited.has(c.id) ? '.seen' : ''), { 'aria-hidden': 'true' }),
          h('span.toc-num', c.num), h('span.toc-title', c.title), chapterTag(c)))))));
    });
    nav.appendChild(h('div.toc-part', h('div.toc-part-head', h('span.toc-part-num', '工具'), h('span.toc-part-title', '复习工具')),
      h('ol.toc-chapters', [['#/glossary', '术语表'], ['#/formulas', '公式速查'], ['#/review', '综合测验']].map(([href, t]) =>
        h('li', h('a.toc-link', { href }, h('span.toc-dot', { 'aria-hidden': 'true' }), h('span.toc-title', t)))))));
    markActiveTOC();
  }
  function markActiveTOC() {
    const hash = location.hash || '#/';
    document.querySelectorAll('#toc-list a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === hash.split('?')[0]));
    const active = document.querySelector('#toc-list a.active');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- progress ---------- */
  function updateProgress() {
    const real = chapters().filter((c) => !c.stub);
    const total = chapters().length, done = mastered().size;
    let questions = 0, right = 0;
    real.forEach((c) => { questions += quizOf(c).length; right += Object.values(C.quiz.results(c.id)).filter((x) => x.correct).length; });
    document.getElementById('progress-bar').style.width = (total ? 100 * done / total : 0).toFixed(1) + '%';
    document.getElementById('progress-text').textContent = '已掌握 ' + done + '/' + total + ' 章 · 小测 ' + right + '/' + questions;
  }

  /* ---------- search ---------- */
  function plainText(c) {
    const topics = (c.topics || []).map((t) => [t.title, t.question, t.intuition, t.math, t.example, t.extra, t.story, t.takeaway].join(' '));
    return [c.title, c.en, c.hook, c.background, c.usedIn].concat(topics).join(' ').replace(/\$[^$]*\$/g, ' ').replace(/[#*|>`_:]/g, ' ').replace(/\s+/g, ' ');
  }
  function search(q) {
    const box = document.getElementById('toc-results'), list = document.getElementById('toc-list');
    q = q.trim().toLowerCase();
    if (!q) { box.hidden = true; list.hidden = false; return; }
    const hits = [];
    chapters().forEach((c) => {
      const text = plainText(c), i = text.toLowerCase().indexOf(q);
      if (i >= 0) hits.push({ c, snippet: text.slice(Math.max(0, i - 18), i + q.length + 30) });
    });
    clear(box).put(hits.length
      ? hits.map((x) => h('a.toc-hit', { href: '#/c/' + x.c.id }, h('b', x.c.num + ' ' + x.c.title), h('small', '…' + x.snippet + '…')))
      : h('p.muted', '没有找到“' + q + '”。'));
    box.hidden = false; list.hidden = true;
  }

  /* ---------- notes export ---------- */
  function exportNotes() {
    const done = mastered(), lines = ['# CS224N 中文教程 · 学习记录', '', '导出时间：' + new Date().toLocaleString(), ''];
    chapters().forEach((c) => {
      const r = C.quiz.results(c.id), right = Object.values(r).filter((x) => x.correct).length;
      lines.push('## ' + c.num + ' ' + c.title, '', '- 掌握：' + (done.has(c.id) ? '✓' : '—') + '　小测：' + right + '/' + quizOf(c).length);
      const note = store.get('note:' + c.id, '');
      if (note.trim()) lines.push('', note.trim());
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'CS224N学习记录.md'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---------- chapter page ---------- */
  function visuals(list) {
    return (list || []).map((v) => (v.type === 'video' ? C.viz.video(v) : C.viz.experiment(v)));
  }
  function block(label, content) {
    if (!content || (Array.isArray(content) && !content.length)) return null;
    return h('div.block', label ? h('div.block-label', label) : null, content);
  }
  function prose(src) { return src ? h('div.prose', { html: md(src) }) : null; }

  /** Display labels for a chapter's topics: 1, 2, 3 … with remedial topics shown as 补 and not counted. */
  function topicLabels(topics) {
    let n = 0;
    return topics.map((t) => (t.remedial ? '补' : String(++n)));
  }

  function renderTopic(c, t, label) {
    const at = (where) => visuals((t.visuals || []).filter((v) => (v.at || 'intuition') === where));
    return h('section.topic' + (t.remedial ? '.remedial' : ''), { id: 't-' + t.id, dataset: { flow: 't-' + t.id } },
      h('h2.topic-title', h('span.topic-num', label), h('span', { html: plainInline(t.title) }), t.remedial ? h('span.topic-tag', '补课') : null),
      t.question ? h('div.topic-question', h('div', { html: md(t.question) })) : null,
      block(null, [prose(t.intuition), at('intuition')]),
      block(t.math || (t.formulas || []).length ? '定义与公式' : null, [prose(t.math), (t.formulas || []).map((f) => C.formula.mount(f)), at('math')]),
      block(t.example ? '算一遍' : null, [prose(t.example), at('example')]),
      block(null, [prose(t.extra), at('extra')]),
      t.story ? h('aside.topic-story', h('span.topic-story-label', '小故事'), h('div', { html: md(t.story) })) : null,
      t.takeaway ? h('div.takeaway', h('span.takeaway-label', '一句话记住'), h('span', { html: inline(t.takeaway) })) : null);
  }

  function renderPitfalls(list) {
    return h('div.pitfalls', list.map((p) => h('div.pitfall',
      h('div.pitfall-wrong', h('span.pitfall-tag', '误区'), h('span', { html: inline(p.wrong) })),
      h('div.pitfall-right', h('span.pitfall-tag', '正解'), h('div', { html: md(p.right) })))));
  }

  function prereqBox(c) {
    if (!c.prereq || !c.prereq.length) return null;
    return h('div.prereq',
      h('div.prereq-title', '开始之前，你需要知道'),
      h('ul', c.prereq.map((p) => {
        const target = p.ch && byId(p.ch);
        const where = p.here ? h('a.prereq-where.prereq-here', { href: '#t-' + p.here, onclick: (e) => { e.preventDefault(); scrollToId('t-' + p.here); } }, '本章补课 ↓')
          : target ? h('a.prereq-where', { href: '#/c/' + target.id }, target.num + ' ' + target.title) : h('span.prereq-where.muted', p.where || '');
        return h('li', h('span', { html: inline(p.text) }), where);
      })));
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderChapter(c) {
    C.viz.unmountAll();
    C.terms.begin(c.id);
    try { renderChapterBody(c); } finally { C.terms.end(); }
    observeFlow();
  }

  function renderChapterBody(c) {
    const i = indexOf(c.id), prev = chapters()[i - 1], next = chapters()[i + 1];
    const part = partOf(c), done = mastered();
    const visited = new Set(store.get('visited', [])); visited.add(c.id); store.set('visited', [...visited]);
    store.set('last', c.id);
    document.title = c.num + ' ' + c.title + ' · CS224N 中文教程';
    const crumb = clear(document.getElementById('crumb'));
    crumb.put(h('span.crumb-part', '第 ' + part.num + ' 部分'), ' ', h('b', c.num + ' ' + c.title), h('span#crumb-sec.crumb-sec'));

    const topics = c.topics || [];
    const endParts = [
      c.compare ? { id: 'compare', label: '比较' } : null,
      (c.pitfalls || []).length ? { id: 'pitfalls', label: '常见误区' } : null,
      quizOf(c).length ? { id: 'quiz', label: '小测' } : null,
      (c.takeaways || []).length ? { id: 'summary', label: '本章小结' } : null,
    ].filter(Boolean);
    const labels = topicLabels(topics);
    const flow = topics.map((t, k) => ({ id: 't-' + t.id, label: t.title, num: labels[k] }))
      .concat(endParts.map((p) => ({ id: 'end-' + p.id, label: p.label, num: '✓' })));
    const flowbar = flow.length ? h('nav.flowbar', { 'aria-label': '本章的问题' }, flow.map((f, k) => [
      k ? h('span.flow-arrow', { 'aria-hidden': 'true' }, '›') : null,
      h('a', { href: '#' + f.id, dataset: { flow: f.id }, onclick: (e) => { e.preventDefault(); scrollToId(f.id); } }, h('b', f.num), f.label)])) : null;

    const masteredBox = h('input', { type: 'checkbox', id: 'mastered' });
    masteredBox.checked = done.has(c.id);
    masteredBox.addEventListener('change', () => {
      const set = mastered(); if (masteredBox.checked) set.add(c.id); else set.delete(c.id);
      store.set('mastered', [...set]); buildTOC(); updateProgress();
    });
    const noteArea = h('textarea.note-area', { id: 'note-' + c.id, rows: 4, placeholder: '这一章我理解了…… / 我还不确定……（自动保存在这个浏览器里）' });
    noteArea.value = store.get('note:' + c.id, '');
    const noteStatus = h('span.note-status');
    let noteTimer = null;
    noteArea.addEventListener('input', () => {
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => { store.set('note:' + c.id, noteArea.value); noteStatus.textContent = '已保存 ' + new Date().toLocaleTimeString(); }, 400);
    });

    const main = clear(document.getElementById('main-inner'));
    main.put(
      h('header.ch-header',
        h('div.ch-kicker', h('span.badge' + (c.kind === 'extension' ? '.ext' : c.kind === 'homework' ? '.hw' : ''), '第 ' + part.num + ' 部分 · ' + part.title),
          c.lectures ? h('span', '对应 CS224N ' + c.lectures) : null),
        h('h1.ch-title', h('span', { html: plainInline(c.num + ' ' + c.title) }), c.en ? h('span.ch-en', c.en) : null),
        (c.kind === 'extension' || c.extNote) ? h('div.ext-banner', { html: inline(c.extNote || '延伸章节：依据的是往年的讲课材料，不属于 CS224N Winter 2026 的课件。') }) : null,
        c.stub ? h('div.stub-banner', '这一章的正文还在写。下面先列出本章要回答的问题和计划用到的可视化。') : null,
        c.hook ? h('div.ch-hook', h('span.ch-hook-label', '这一章要回答'), h('div', { html: md(c.hook) })) : null,
        c.background ? h('aside.ch-background', h('span.ch-background-label', '研究背景'), h('div', { html: md(c.background) })) : null,
        c.usedIn ? h('aside.ch-background.usedin', h('span.ch-background-label', '后面哪里会用到'), h('div', { html: md(c.usedIn) })) : null,
        (c.goals || []).length ? h('div.ch-goals', h('b', '学完这一章，你能：'), h('ul', c.goals.map((g) => h('li', { html: inline(g) })))) : null,
        prereqBox(c)),
      flowbar,
      topics.map((t, k) => renderTopic(c, t, labels[k])),
      c.compare ? h('section.ch-part#end-compare', { dataset: { flow: 'end-compare' } }, h('h2', '比较'), prose(c.compare)) : null,
      (c.pitfalls || []).length ? h('section.ch-part#end-pitfalls', { dataset: { flow: 'end-pitfalls' } }, h('h2', '常见误区'), renderPitfalls(c.pitfalls)) : null,
      quizOf(c).length ? h('section.ch-part#end-quiz', { dataset: { flow: 'end-quiz' } }, h('h2', '小测'), C.quiz.mount(quizOf(c), c.id)) : null,
      (c.takeaways || []).length ? h('section.ch-part#end-summary', { dataset: { flow: 'end-summary' } }, h('h2', '本章小结'),
        h('ol.summary-list', c.takeaways.map((t) => h('li', { html: inline(t) })))) : null,
      h('div.ch-footer',
        h('section.notes', h('label', { for: 'note-' + c.id }, '用自己的话记下来'), h('p.muted', '哪里还没想通？先写下你的猜测，再去实验里验证。'), noteArea, noteStatus),
        h('label.mastered', masteredBox, ' 我能不看网站，用自己的话讲清这一章'),
        c.source ? h('p.source-note', { html: '内容依据：' + inline(c.source) }) : null,
        h('nav.ch-pager',
          prev ? h('a.pager.prev', { href: '#/c/' + prev.id }, h('small', '← 上一章'), h('span', prev.num + ' ' + prev.title)) : h('span'),
          next ? h('a.pager.next', { href: '#/c/' + next.id }, h('small', '下一章 →'), h('span', next.num + ' ' + next.title)) : h('a.pager.next', { href: '#/review' }, h('small', '下一步 →'), h('span', '综合测验')))));
  }

  function observeFlow() {
    if (observer) observer.disconnect();
    const label = document.getElementById('crumb-sec');
    const links = [...document.querySelectorAll('.flowbar a')];
    const sections = [...document.querySelectorAll('[data-flow].topic, [data-flow].ch-part')];
    if (!sections.length) { document.getElementById('chapter-progress').style.width = '0%'; return; }
    observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const key = e.target.dataset.flow, idx = sections.findIndex((s) => s.dataset.flow === key);
        links.forEach((a, k) => { a.classList.toggle('active', a.dataset.flow === key); a.classList.toggle('done', k < idx); });
        const link = links.find((a) => a.dataset.flow === key);
        if (link && link.scrollIntoView) link.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        if (label && link) label.textContent = ' · ' + link.textContent.replace(/^\S+/, '').trim();
        document.getElementById('chapter-progress').style.width = ((idx + 1) / sections.length * 100) + '%';
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach((s) => observer.observe(s));
  }

  /* ---------- other pages ---------- */
  function setPage(title) {
    C.viz.unmountAll();
    if (observer) observer.disconnect();
    document.title = title + ' · CS224N 中文教程';
    clear(document.getElementById('crumb')).put(h('b', title));
    document.getElementById('chapter-progress').style.width = '0%';
    return clear(document.getElementById('main-inner'));
  }

  function renderHome() {
    const main = setPage('课程总览');
    const home = C.content.home, last = store.get('last', null), done = mastered();
    const first = chapters()[0];
    main.put(
      h('header.home-hero',
        h('p.ch-kicker', h('span.badge', 'CS224N · Winter 2026'), h('span', home.kicker)),
        h('h1', home.title),
        h('p.lead', { html: inline(home.lead) }),
        h('div.home-actions',
          h('a.btn.primary', { href: '#/c/' + (last && byId(last) ? last : first.id) }, last && byId(last) ? '继续：' + byId(last).num + ' ' + byId(last).title : '从 ' + first.num + ' ' + first.title + ' 开始'),
          h('a.btn', { href: '#/formulas' }, '公式速查'), h('a.btn', { href: '#/review' }, '综合测验'))),
      h('section.home-section.home-start', h('h2', '第一次来先看这里'), h('div.prose', { html: md(home.firstTime) })),
      h('section.home-section', h('h2', '整条路线'), h('div.chain', C.content.chain.map((x, k) => [k ? h('span.chain-arrow', '→') : null,
        x.ch && byId(x.ch) ? h('a.chain-node', { href: '#/c/' + x.ch }, x.label) : h('span.chain-node.muted', x.label)]))),
      h('section.home-section.home-parts', C.content.parts.map((part) => {
        const list = chapters().filter((c) => c.part === part.id);
        return h('div.part-card' + (list.length ? '' : '.later'),
          h('div.part-card-head', h('span.badge', '第 ' + part.num + ' 部分'), h('h3', part.title)),
          h('p', { html: inline(part.intro) }),
          list.length ? h('ol', list.map((c) => h('li', h('a', { href: '#/c/' + c.id }, (done.has(c.id) ? '✓ ' : '') + c.title)))) : h('p.muted', '编写中'));
      })),
      h('section.home-section', h('h2', '怎么用这个网站'), h('div.prose', { html: md(home.howTo) })));
  }

  function renderGlossary() {
    const main = setPage('术语表');
    const input = h('input.search', { type: 'search', placeholder: '搜索中文、英文或符号…', 'aria-label': '搜索术语' });
    const list = h('div.glossary');
    const entries = C.content.glossary || [];
    function draw() {
      const q = input.value.trim().toLowerCase();
      clear(list);
      const hits = entries.filter((g) => !q || (g.zh + g.en + (g.sym || '') + g.def).toLowerCase().includes(q));
      if (!hits.length) list.appendChild(h('p.muted', entries.length ? '没有匹配的术语。' : '术语表还在整理。'));
      hits.forEach((g) => list.appendChild(h('div.gl-item',
        h('div.gl-head', h('b', g.zh), h('span.gl-en', g.en), g.sym ? h('span.gl-sym', { html: C.dom.texHTML(g.sym) }) : null),
        h('div.gl-def', { html: md(g.def) }),
        g.ch && byId(g.ch) ? h('a.gl-link', { href: '#/c/' + g.ch }, '→ ' + byId(g.ch).num + ' ' + byId(g.ch).title) : null)));
    }
    input.addEventListener('input', draw);
    main.put(h('h1', '术语表'), h('p.lead', '每个术语给出中文、英文、符号和一句话定义，并链接到讲它的那一章。'), input, list);
    draw();
  }

  function renderFormulas() {
    const main = setPage('公式速查');
    main.put(h('h1', '公式速查'), h('p.lead', '按章节顺序列出每章的核心公式。想看逐项解释，点右边的链接回到那一章。'));
    let any = false;
    C.content.parts.forEach((part) => {
      const items = [];
      chapters().filter((c) => c.part === part.id).forEach((c) => (c.topics || []).forEach((t) => (t.formulas || []).forEach((f) => {
        if (f.sheet === false) return;
        items.push(h('div.fs-item', h('div.fs-name', h('span', { html: inline(f.title || t.title) }), h('a.fs-link', { href: '#/c/' + c.id }, c.num + ' ' + c.title)),
          h('div', { html: C.dom.texHTML(f.latex.replace(/\\htmlClass\{[^}]*\}/g, ''), true) })));
      })));
      if (items.length) { any = true; main.put(h('section.fs-group', h('h2', '第 ' + part.num + ' 部分 · ' + part.title), items)); }
    });
    if (!any) main.put(h('p.muted', '公式会随章节正文一起加入。'));
  }

  function renderReview() {
    const main = setPage('综合测验');
    let part = 'all', scope = 'all';
    const holder = h('div');
    function draw() {
      const pool = [];
      chapters().forEach((c) => {
        if (part !== 'all' && c.part !== part) return;
        const done = C.quiz.results(c.id);
        quizOf(c).forEach((q, i) => {
          if (scope === 'todo' && done[i]) return;
          if (scope === 'wrong' && !(done[i] && !done[i].correct)) return;
          pool.push({ q, c, i });
        });
      });
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      const pick = pool.slice(0, 10);
      clear(holder).put(h('p.muted', pool.length ? '这一轮从 ' + pool.length + ' 道题里随机抽了 ' + pick.length + ' 道，答题结果记到各章。' : '这个范围里没有符合条件的题。'),
        pick.map(({ q, c, i }) => h('div.review-item', h('a.review-src', { href: '#/c/' + c.id }, '来自 ' + c.num + ' ' + c.title),
          C.quiz.mount([q], c.id, [i]).querySelector('.quiz-card'))));
    }
    const withQuiz = C.content.parts.filter((p) => chapters().some((c) => c.part === p.id && quizOf(c).length));
    main.put(h('h1', '综合测验'), h('p.lead', '按部分、按状态抽题：可以只做没做过的，或者只做上次答错的。'),
      h('div.row', h('span.muted', '范围'), C.dom.segmented([{ value: 'all', label: '全部' }].concat(withQuiz.map((p) => ({ value: p.id, label: '第 ' + p.num + ' 部分' }))), part, (v) => { part = v; draw(); }, '范围')),
      h('div.row', h('span.muted', '筛选'), C.dom.segmented([{ value: 'all', label: '全部题' }, { value: 'todo', label: '没做过' }, { value: 'wrong', label: '上次答错' }], scope, (v) => { scope = v; draw(); }, '筛选'),
        h('button.btn', { type: 'button', onclick: draw }, '换一组')), holder);
    draw();
  }

  /* ---------- router ---------- */
  function route() {
    const hash = location.hash || '#/';
    if (/^#(t|end)-/.test(hash)) return;                               // in-page anchors
    const m = hash.match(/^#\/c\/([\w-]+)/);
    if (m && byId(m[1])) renderChapter(byId(m[1]));
    else if (hash.startsWith('#/glossary')) renderGlossary();
    else if (hash.startsWith('#/formulas')) renderFormulas();
    else if (hash.startsWith('#/review')) renderReview();
    else renderHome();
    markActiveTOC(); updateProgress();
    document.body.classList.remove('toc-open');
    document.getElementById('main').scrollTop = 0; root.scrollTo(0, 0);
  }

  function init() {
    paintThemeButton();
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    let font = store.get('font', 0); applyFont(font);
    document.getElementById('font-toggle').addEventListener('click', () => { font = (font + 1) % FONT_SIZES.length; store.set('font', font); applyFont(font); });
    document.getElementById('toc-search').addEventListener('input', (e) => search(e.target.value));
    document.getElementById('toc-results').addEventListener('click', (e) => { if (e.target.closest('a')) { document.getElementById('toc-search').value = ''; search(''); } });
    document.getElementById('export-notes').addEventListener('click', exportNotes);
    document.getElementById('toc-toggle').addEventListener('click', () => document.body.classList.toggle('toc-open'));
    document.getElementById('scrim').addEventListener('click', () => document.body.classList.remove('toc-open'));
    root.addEventListener('cs224n:progress', updateProgress);
    root.addEventListener('hashchange', route);
    document.addEventListener('keydown', (e) => {
      if (!(e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))) return;
      const m = (location.hash || '').match(/^#\/c\/([\w-]+)/); if (!m) return;
      const target = chapters()[indexOf(m[1]) + (e.key === 'ArrowRight' ? 1 : -1)];
      if (target) location.hash = '#/c/' + target.id;
    });
    buildTOC(); route();
  }

  C.app = { init, buildTOC };
  document.addEventListener('DOMContentLoaded', init);
})(window);
