/* 窗口分类器 (L03 p11–p14): pick a centre word, concatenate the five 2-d word vectors, then h = σ(Wx + b),
 * s = uᵀh, P = σ(s). Vectors and weights are hand-made so each hidden unit means something (课件外):
 * dimension 1 = "looks like a place", dimension 2 = "looks like a function word". Forward pass: js/core/nn.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h } = C.dom;
  const NN = C.core.nn;

  // Two sentences from the lecture: the same Paris is a place after “in” and a person in “Paris Hilton”.
  const SENTS = [
    ['the', 'museums', 'in', 'Paris', 'are', 'amazing', 'to', 'see', '.'],
    ['Last', 'night', ',', 'Paris', 'Hilton', 'wowed', 'in', 'a', 'sequin', 'gown', '.'],
  ];
  // Paris only half looks like a place on its own (0.5): the word alone cannot decide.
  const VEC = { the: [0, 1], museums: [0.1, 0], in: [0, 1], Paris: [0.5, 0], are: [0, 0.6], amazing: [0, 0], to: [0, 1], see: [0, 0.3], '.': [0, 0.5],
    Last: [0, 0.2], night: [0, 0], ',': [0, 0], Hilton: [0.3, 0], wowed: [0, 0], a: [0, 1], sequin: [0, 0], gown: [0, 0], '<pad>': [0, 0] };
  // x = [x_{-2}; x_{-1}; x_0; x_{+1}; x_{+2}], 10 numbers; index 2p + k (p = position 0..4, k = 0 place / 1 function)
  const W = [
    [0, 0, 0, 6, 7, 0, 0, 0, 0, 0],    // h1: centre looks like a place AND the left neighbour is a function word (“in Paris”)
    [0, 0, 0, 6, 0, 0, 0, 0, 0, 0],    // h2: left neighbour looks like a function word (“in”, “the”)
    [0, 0, 0, 0, -7, 0, 0, 0, 0, 0],   // h3: centre does NOT look like a place
  ];
  const PARAMS = { W, b: [-7, -3, 3], u: [6, 1, -6] };
  const UNITS = ['中心词像地点，且左边是功能词', '左边是功能词', '中心词不像地点'];
  const f2 = (v) => (Math.round(v * 100) / 100 || 0).toFixed(2).replace('-', '−');
  const f3 = (v) => (Math.round(v * 1000) / 1000 || 0).toFixed(3).replace('-', '−');

  function mount(el) {
    let center = 3, si = 0, SENT = SENTS[0], words = [];
    const sentRow = h('div.sg-sentence');
    const pick = C.dom.segmented([{ value: 0, label: '句子 1：the museums in Paris …' }, { value: 1, label: '句子 2：Last night , Paris Hilton …' }], si,
      (v) => { si = v; SENT = SENTS[v]; center = 3; build(); render(); }, '句子');
    function build() {
      words = SENT.map((w, i) => h('button.sg-word', { type: 'button', onclick: () => { center = i; render(); } }, h('span.sg-text', w)));
      sentRow.innerHTML = ''; sentRow.append(...words);
    }
    build();
    const xRow = h('div.wn-x'), layers = h('div.wn-layers'), out = h('div.wn-out');
    el.append(h('div.viz-row', pick), sentRow, h('div.wn-head', '① 输入 x：窗口里 5 个词向量拼起来（每个词 2 维：像地点、像功能词）'), xRow,
      h('div.wn-head', '② 隐藏层 h = σ(Wx + b)：3 个神经元'), layers, h('div.wn-head', '③ 得分 s = uᵀh，概率 σ(s)'), out);

    function render() {
      const win = [-2, -1, 0, 1, 2].map((j) => SENT[center + j] || '<pad>');
      const x = [].concat(...win.map((w) => VEC[w]));
      const r = NN.windowForward(PARAMS, x, 'sigmoid');
      words.forEach((b, i) => { b.classList.toggle('center', i === center); b.classList.toggle('ctx', i !== center && Math.abs(i - center) <= 2); });
      xRow.innerHTML = '';
      win.forEach((w, p) => xRow.append(h('div.wn-word' + (p === 2 ? '.center' : ''), h('div.wn-wl', w), h('div.wn-nums', VEC[w].map((v) => h('span', f2(v)))))));
      layers.innerHTML = '';
      r.h.forEach((v, i) => layers.append(h('div.wn-unit',
        h('span.wn-uname', UNITS[i]), h('span.wn-z', 'z = ' + f2(r.z[i])), h('span.wn-track', h('span.wn-bar', { style: { width: (v * 100).toFixed(1) + '%' } })),
        h('span.wn-v', 'h = ' + f3(v)), h('span.wn-u', '× u = ' + f2(PARAMS.u[i])))));
      out.innerHTML = '';
      // h with three decimals, so the sum can be checked by hand; a negative term is written “− 6.00×0.378”
      const terms = PARAMS.u.map((u, i) => (i === 0 ? (u < 0 ? '−' : '') : u < 0 ? ' − ' : ' + ') + f2(Math.abs(u)) + '×' + f3(r.h[i])).join('');
      out.append(h('span', 's = ' + terms + ' = ' + f2(r.s)),
        h('span.wn-p', 'P(“' + SENT[center] + '” 是地名) = ' + (r.prob * 100).toFixed(1) + '%'));
    }
    render();
  }

  C.viz.register('window-ner', { title: '窗口分类器', mount });
})(window);
