/* 窗口分类器 (L03 p11–p14): pick a centre word, concatenate the five 2-d word vectors, then h = σ(Wx + b),
 * s = uᵀh, P = σ(s). Vectors and weights are hand-made so each hidden unit means something (课件外):
 * dimension 1 = "looks like a place", dimension 2 = "looks like a function word". Forward pass: js/core/nn.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h } = C.dom;
  const NN = C.core.nn;

  const SENT = ['the', 'museums', 'in', 'Paris', 'are', 'amazing', 'to', 'see', '.'];
  const VEC = { the: [0, 1], museums: [0.3, 0], in: [0, 1], Paris: [1, 0], are: [0, 0.6], amazing: [0, 0], to: [0, 1], see: [0, 0.3], '.': [0, 0.5], '<pad>': [0, 0] };
  // x = [x_{-2}; x_{-1}; x_0; x_{+1}; x_{+2}], 10 numbers; index 2p + k (p = position 0..4, k = 0 place / 1 function)
  const W = [
    [0, 0, 0, 0, 7, 0, 0, 0, 0, 0],    // h1: centre looks like a place
    [0, 0, 0, 6, 0, 0, 0, 0, 0, 0],    // h2: left neighbour looks like a function word ("in", "the")
    [0, 0, 0, 0, -7, 0, 0, 0, 0, 0],   // h3: centre does NOT look like a place
  ];
  const PARAMS = { W, b: [-4.5, -3, 3], u: [4, 1.5, -4] };
  const UNITS = ['中心词像地点', '左边是功能词', '中心词不像地点'];
  const f2 = (v) => (Math.round(v * 100) / 100 || 0).toFixed(2).replace('-', '−');

  function mount(el) {
    let center = 3;
    const words = SENT.map((w, i) => h('button.sg-word', { type: 'button', onclick: () => { center = i; render(); } }, h('span.sg-text', w)));
    const xRow = h('div.wn-x'), layers = h('div.wn-layers'), out = h('div.wn-out');
    el.append(h('div.sg-sentence', words), h('div.wn-head', '① 输入 x：窗口里 5 个词向量拼起来（每个词 2 维：像地点、像功能词）'), xRow,
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
        h('span.wn-v', 'h = ' + f2(v)), h('span.wn-u', '× u = ' + f2(PARAMS.u[i])))));
      out.innerHTML = '';
      out.append(h('span', 's = ' + PARAMS.u.map((u, i) => f2(u) + '×' + f2(r.h[i])).join(' + ') + ' = ' + f2(r.s)),
        h('span.wn-p', 'P(“' + SENT[center] + '” 是地名) = ' + (r.prob * 100).toFixed(1) + '%'));
    }
    render();
  }

  C.viz.register('window-ner', { title: '窗口分类器', mount });
})(window);
