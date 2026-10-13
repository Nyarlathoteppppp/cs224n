/* Markdown + KaTeX + callouts + code highlighting for chapter prose.
 *   $...$ and $$...$$ maths (protected before markdown parsing)
 *   :::kind Title … :::  callout blocks; kind ∈ note | tip | warn | key | example | remedial | ext | teacher
 *   ```python fenced code with a tiny local highlighter */
(function (root) {
  'use strict';
  const C = root.CS224N = root.CS224N || {};
  let md = null;

  const PY_KEYWORDS = /\b(def|return|for|in|if|elif|else|while|and|or|not|import|from|as|True|False|None|break|continue|lambda|range|max|min|sum|len|with|class|self)\b/g;
  function escapeHTML(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function highlight(code, lang) {
    if (!/^(python|py|pseudo|text)$/.test(lang || 'python')) return escapeHTML(code);
    const out = [];
    const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|([\s\S])/gm;
    let m;
    while ((m = re.exec(code))) {
      if (m[1]) out.push('<span class="tok-com">' + escapeHTML(m[1]) + '</span>');
      else if (m[2]) out.push('<span class="tok-str">' + escapeHTML(m[2]) + '</span>');
      else if (m[3]) out.push('<span class="tok-num">' + m[3] + '</span>');
      else if (m[4]) out.push(PY_KEYWORDS.test(m[4]) ? '<span class="tok-kw">' + m[4] + '</span>' : m[4]);
      else out.push(escapeHTML(m[5]));
      PY_KEYWORDS.lastIndex = 0;
    }
    return out.join('');
  }

  function parser() {
    if (md) return md;
    md = root.markdownit({ html: true, linkify: false, typographer: false,
      highlight: (str, lang) => '<pre class="code"><code class="lang-' + (lang || 'text') + '">' + highlight(str.replace(/\n$/, ''), lang) + '</code></pre>' });
    return md;
  }

  const LABELS = { note: '说明', tip: '直觉', warn: '注意', key: '关键结论', example: '例子', remedial: '补课', ext: '延伸（课件外）', teacher: '老师的讲法', story: '小故事', history: '研究背景' };

  /** opts.terms === false skips the "中文（English）" annotation (author notes such as visual spec cards). */
  function render(src, opts) {
    if (!src) return '';
    const withTerms = !(opts && opts.terms === false);
    // 1. callouts are rendered on their own and kept as placeholders so later passes never touch their HTML
    const blocks = [];
    src = src.replace(/^:::(\w+)[ \t]*(.*)\n([\s\S]*?)\n:::[ \t]*$/gm, (_, kind, title, body) => {
      const head = title.trim() || LABELS[kind] || '';
      blocks.push('<div class="callout callout-' + kind + '">' + (head ? '<div class="callout-title">' + renderInline(head, opts) + '</div>' : '') + render(body, opts) + '</div>');
      return '\n\n@@C' + (blocks.length - 1) + '@@\n\n';
    });
    // 2. protect maths (outside fenced code), then annotate terms in the remaining text
    const math = [];
    const parts = src.split(/(```[\s\S]*?```)/g).map((chunk, i) => {
      if (i % 2) return chunk;
      const protectedChunk = chunk
        .replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => { math.push([t, true]); return '@@M' + (math.length - 1) + '@@'; })
        .replace(/\$([^\n$]+?)\$/g, (_, t) => { math.push([t, false]); return '@@M' + (math.length - 1) + '@@'; });
      return C.terms && withTerms ? C.terms.apply(protectedChunk) : protectedChunk;
    });
    let html = parser().render(parts.join(''));
    html = html.replace(/<p>@@M(\d+)@@<\/p>/g, (_, i) => C.dom.texHTML(math[i][0], true));
    html = html.replace(/@@M(\d+)@@/g, (_, i) => C.dom.texHTML(math[i][0], math[i][1]));
    html = html.replace(/<p>@@C(\d+)@@<\/p>/g, (_, i) => blocks[i]).replace(/@@C(\d+)@@/g, (_, i) => blocks[i]);
    return html;
  }
  function renderInline(src, opts) { return render(src, opts).replace(/^<p>|<\/p>\s*$/g, ''); }

  C.md = { render, renderInline, highlight, escapeHTML };
})(window);
