/* 负采样的 3/4 次方：made-up word frequencies (课件外) raised to a power and renormalised (js/core/word2vec.js). */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, slider } = C.dom;
  const W2V = C.core.word2vec;

  // the three frequencies of the chapter's example (0.9, 0.09, 0.01 → 0.825, 0.147, 0.028 at the 3/4 power)
  const WORDS = ['the', 'banking', 'oolong'];
  const FREQ = [0.9, 0.09, 0.01];
  const pct = (v) => (v * 100).toFixed(1) + '%';

  function mount(el) {
    let power = 0.75;
    const rows = h('div.ns-rows'), note = h('p.viz-note');
    const sp = slider('取几次方', { min: 0, max: 1, step: 0.05, value: power, format: (v) => v.toFixed(2), onInput: (v) => { power = v; render(); } });
    const powKey = h('span.ns-k.pow');
    el.append(h('div.viz-row', sp, h('span.viz-note', '1 = 按原始词频；0 = 所有词等概率；word2vec 用 0.75（就是 3/4）')),
      h('div.ns-legend', h('span.ns-k.raw', '原始词频（编的，课件外）'), powKey), rows, note);
    function render() {
      const p = W2V.unigramPower(FREQ, power);
      rows.innerHTML = '';
      FREQ.forEach((q, i) => rows.append(h('div.ns-row', h('span.ns-w', WORDS[i]),
        h('div.ns-bars', h('span.ns-bar.raw', { style: { width: (q * 100) + '%' } }), h('span.ns-bar.pow', { style: { width: (p[i] * 100) + '%' } })),
        h('span.ns-v', pct(q) + ' → ' + pct(p[i])))));
      powKey.textContent = '每个词频取 ' + power.toFixed(2) + ' 次方，再除以总和（归一化）';
      const last = FREQ.length - 1;
      note.textContent = power === 1 ? '取 1 次方等于不变：和原始词频一样。'
        : power === 0 ? '任何正数的 0 次方都是 1：所有词被抽中的概率相同，原来谁常见、谁少见的区别没有了。'
        : '最少见的 oolong：' + pct(FREQ[last]) + ' → ' + pct(p[last]) + '（×' + (p[last] / FREQ[last]).toFixed(1) + '）；最常见的 the：' + pct(FREQ[0]) + ' → ' + pct(p[0]) + '。谁常见谁少见的顺序不变，差距被拉小。';
    }
    render();
  }

  C.viz.register('neg-sampling', { title: '负采样的 3/4 次方', mount });
})(window);
