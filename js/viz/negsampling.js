/* 负采样的 3/4 次方：made-up word frequencies (课件外) raised to a power and renormalised (js/core/word2vec.js). */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, slider } = C.dom;
  const W2V = C.core.word2vec;

  const WORDS = ['the', 'banking', 'crises', 'zebra', 'oolong'];
  const FREQ = [0.6, 0.25, 0.1, 0.04, 0.01];
  const pct = (v) => (v * 100).toFixed(1) + '%';

  function mount(el) {
    let power = 0.75;
    const rows = h('div.ns-rows'), note = h('p.viz-note');
    const sp = slider('指数', { min: 0, max: 1, step: 0.05, value: power, format: (v) => v.toFixed(2), onInput: (v) => { power = v; render(); } });
    el.append(h('div.viz-row', sp, h('span.viz-note', '1 = 按原始词频；0 = 所有词等概率；word2vec 用 0.75')), h('div.ns-legend', h('span.ns-k.raw', '原始词频'), h('span.ns-k.pow', '取指数后再归一化')), rows, note);
    function render() {
      const p = W2V.unigramPower(FREQ, power);
      rows.innerHTML = '';
      FREQ.forEach((q, i) => rows.append(h('div.ns-row', h('span.ns-w', WORDS[i]),
        h('div.ns-bars', h('span.ns-bar.raw', { style: { width: (q * 100) + '%' } }), h('span.ns-bar.pow', { style: { width: (p[i] * 100) + '%' } })),
        h('span.ns-v', pct(q) + ' → ' + pct(p[i])))));
      note.textContent = '最少见的 oolong：' + pct(FREQ[4]) + ' → ' + pct(p[4]) + '（×' + (p[4] / FREQ[4]).toFixed(1) + '）；最常见的 the：' + pct(FREQ[0]) + ' → ' + pct(p[0]) + '。顺序不变，差距被拉小。';
    }
    render();
  }

  C.viz.register('neg-sampling', { title: '负采样的 3/4 次方', mount });
})(window);
