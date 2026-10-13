/* 困惑度 (L04 p39; T06 [03:19]–[06:00]): drag the probability the model gave each true next word; see each step's
 * inverse probability and −log, their average, and exp of the average. A “uniform guess over k words” switch shows
 * that perplexity is then exactly k (the k-sided die). Numbers from js/core/prob.js; the sentence is from L04 p36. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, slider, segmented, fmt, texHTML, clear } = C.dom;
  const P = C.core.prob;

  const WORDS = ['my', 'favorite', 'season', 'is'];
  const START = [0.5, 0.25, 0.2, 0.4];   // the chapter's worked example: perplexity √(√100) ≈ 3.162

  function mount(el) {
    let probs = START.slice(), mode = 'free', k = 64;
    const table = h('table.pp-table'), sum = h('div.pp-sum'), die = h('div.pp-die');
    const sliders = WORDS.map((w, i) => slider('P(' + w + ' | 前文)', { min: 0.01, max: 1, step: 0.01, value: probs[i], format: (v) => fmt(v, 2), onInput: (v) => { probs[i] = v; render(); } }));
    const sk = slider('候选词个数 k', { min: 2, max: 100, step: 1, value: k, format: String, onInput: (v) => { k = v; render(); } });
    const free = h('div.pp-sliders', sliders), uni = h('div.pp-sliders', sk);
    el.append(
      h('div.viz-row', segmented([{ value: 'free', label: '自己拖概率' }, { value: 'uniform', label: '在 k 个词里均匀乱猜' }], mode, (v) => { mode = v; render(); }, '模式')),
      h('p.viz-note', '句子 “<s> my favorite season is …”。每一步，模型给真实的下一个词多少概率？'),
      free, uni, table, sum, die);

    function render() {
      free.style.display = mode === 'free' ? '' : 'none';
      uni.style.display = mode === 'uniform' ? '' : 'none';
      const ps = mode === 'free' ? probs : WORDS.map(() => 1 / k);
      clear(table);
      table.append(h('tr', h('th', '真实的下一个词'), h('th', '模型给的概率 P'), h('th', '倒数 1/P'), h('th', { html: '−ln P' })));
      ps.forEach((p, i) => table.append(h('tr', h('td', WORDS[i]), h('td', fmt(p, 3)), h('td', fmt(1 / p, 2)), h('td', fmt(-Math.log(p), 3)))));
      const J = ps.reduce((s, p) => s - Math.log(p), 0) / ps.length, ppl = P.perplexity(ps);
      const prod = ps.reduce((s, p) => s / p, 1);
      clear(sum);
      sum.append(
        h('div', { html: '平均交叉熵 ' + texHTML('J = \\tfrac{1}{4}\\sum_t (-\\ln P_t) = ' + fmt(J, 3)) }),
        h('div', { html: '困惑度 ' + texHTML('e^{J} = ' + fmt(ppl, 3)) + '，也等于 ' + texHTML('\\big(\\prod_t 1/P_t\\big)^{1/4} = (' + fmt(prod, 1) + ')^{1/4} = ' + fmt(ppl, 3)) }),
      );
      clear(die);
      die.append(h('span.pp-die-icon', '🎲'), h('span', '平均来说，模型每一步就像在 ', h('b', fmt(ppl, 1)), ' 个面的骰子里挑一个面' + (mode === 'uniform' ? '：在 ' + k + ' 个词里均匀乱猜，困惑度正好是 ' + k + '。' : '。概率给得越高，骰子的面越少，困惑度越低。')));
    }
    render();
  }

  C.viz.register('perplexity', { title: '困惑度', mount });
})(window);
