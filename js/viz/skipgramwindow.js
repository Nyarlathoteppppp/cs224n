/* word2vec 的训练样本：slide a window over a real fragment from L02 p9/p12 and list the (center, outside) pairs.
 * Pairs come from js/core/word2vec.js windowPairs. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, slider, texHTML } = C.dom;
  const W2V = C.core.word2vec;

  const TOKENS = 'government debt problems turning into banking crises as happened in 2009'.split(' ');

  function mount(el) {
    let center = 4, m = 2;   // "into", window 2 as on the slide
    const words = TOKENS.map((w, i) => h('button.sg-word', { type: 'button', onclick: () => { center = i; render(); } }, h('span.sg-text', w), h('span.sg-tag')));
    const pairs = h('div.sg-pairs'), total = h('p.viz-note');
    const sm = slider('窗口大小 m', { min: 1, max: 4, step: 1, value: m, format: String, onInput: (v) => { m = v; render(); } });
    el.append(h('div.viz-row', sm, h('span.viz-note', '点任意一个词，把它设成中心词')), h('div.sg-sentence', words), pairs, total);

    function render() {
      words.forEach((b, i) => {
        const j = i - center, inWin = j !== 0 && Math.abs(j) <= m;
        b.classList.toggle('center', i === center);
        b.classList.toggle('ctx', inWin);
        b.querySelector('.sg-tag').innerHTML = i === center ? '中心词 c' : inWin ? texHTML('w_{t' + (j > 0 ? '+' : '') + j + '}') : '';
      });
      const mine = W2V.windowPairs(TOKENS, m).filter((p) => p.t === center);
      pairs.innerHTML = '';
      mine.forEach((p) => pairs.append(h('div.sg-pair',
        h('span.sg-c', p.center), h('span.sg-arrow', '→'), h('span.sg-o', p.outside),
        h('span.sg-p', { html: texHTML('P(w_{t' + (p.offset > 0 ? '+' : '') + p.offset + '}\\mid w_t) = P(\\text{' + p.outside + '}\\mid\\text{' + p.center + '})') }))));
      const all = W2V.windowPairs(TOKENS, m).length;
      total.textContent = '中心词 “' + TOKENS[center] + '” 产生 ' + mine.length + ' 个样本。这段 ' + TOKENS.length + ' 个词的文字，窗口为 ' + m + ' 时一共产生 ' + all + ' 个样本；两端的词凑不满窗口，样本少一些。';
    }
    render();
  }

  C.viz.register('skipgram-window', { title: 'word2vec 的训练样本', mount });
})(window);
