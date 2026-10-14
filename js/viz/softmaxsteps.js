/* softmax 的三步：draggable scores → exp → normalised probabilities, with the chapter's toy numbers (课件外).
 * Probabilities from js/core/prob.js softmax. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, slider } = C.dom;
  const P = C.core.prob;

  const WORDS = ['banking', 'crises', 'problems', 'the', 'zebra'];
  const START = [1.5, 1.1, 0.6, 0.05, -0.85];
  const f = (v, d) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d) || 0).toFixed(d).replace('-', '−');

  function mount(el) {
    const s = START.slice();
    const sliders = WORDS.map((w, i) => slider(w, { min: -3, max: 3, step: 0.05, value: s[i], format: (v) => f(v, 2), onInput: (v) => { s[i] = v; render(); } }));
    const cols = ['① 点积（分数）', '② exp（最大的那根画满格）', '③ 除以总和 = 概率（满格是 1）'].map((t) => h('div.sm-col', h('div.sm-head', t), h('div.sm-bars')));
    const foot = h('p.viz-note');
    el.append(h('p.viz-note', '中心词是 into，假设词表只有这 5 个词。初始分数就是上面表里那 5 个编出来的点积（课件外），可以随意拖动。'), h('div.sm-sliders', sliders), h('div.sm-cols', cols), foot);

    function bars(col, values, scale, signed, digits, cls) {
      const box = col.querySelector('.sm-bars');
      box.innerHTML = '';
      values.forEach((v, i) => {
        const width = Math.min(100, Math.abs(v) / scale * (signed ? 50 : 100));
        const bar = h('span.sm-bar' + (v < 0 ? '.neg' : '') + (cls ? '.' + cls : ''), { style: signed ? { width: width + '%', [v < 0 ? 'right' : 'left']: '50%' } : { width: width + '%', left: '0' } });
        box.append(h('div.sm-row', h('span.sm-word', WORDS[i]), h('span.sm-track' + (signed ? '.signed' : ''), bar), h('span.sm-val', f(v, digits))));
      });
    }
    function render() {
      const ex = s.map(Math.exp), total = ex.reduce((a, b) => a + b, 0), p = P.softmax(s);
      bars(cols[0], s, 3, true, 2);
      bars(cols[1], ex, Math.max(...ex), false, 3, 'exp');
      bars(cols[2], p, 1, false, 3, 'prob');
      const top = p.indexOf(Math.max(...p));
      foot.textContent = 'exp 之和 = ' + f(total, 3) + '，概率之和 = ' + f(p.reduce((a, b) => a + b, 0), 3) + '。最大的是 ' + WORDS[top] + '（' + f(p[top], 3) + '）；分数最低的也还有 ' + f(Math.min(...p), 3) + '。';
    }
    render();
  }

  C.viz.register('softmax', { title: 'softmax 的三步', mount });
})(window);
