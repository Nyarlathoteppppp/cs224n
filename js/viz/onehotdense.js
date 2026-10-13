/* 独热向量与稠密向量：motel·hotel (15-dim one-hot, L02 p7–p8) next to banking·monetary (8-dim, L02 p10).
 * Each dimension's product is drawn as a bar; the dot product is their sum. Numbers from js/core/linalg.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h } = C.dom;
  const L = C.core.linalg;

  const onehot = (i, n) => Array.from({ length: n }, (_, k) => (k === i ? 1 : 0));
  const PAIRS = [
    { title: '独热向量：motel 和 hotel（15 维）', a: ['motel', onehot(10, 15)], b: ['hotel', onehot(7, 15)], digits: 0 },
    { title: '稠密向量：banking 和 monetary（8 维）', a: ['banking', [0.286, 0.792, -0.177, -0.107, 0.109, -0.542, 0.349, 0.271]],
      b: ['monetary', [0.413, 0.582, -0.007, 0.247, 0.216, -0.718, 0.147, 0.051]], digits: 3 },
  ];
  const f = (v, d) => (Math.round(v * 1000) / 1000 || 0).toFixed(d).replace('-', '−');

  function panel(p) {
    const a = p.a[1], b = p.b[1], prod = a.map((x, i) => x * b[i]);
    const dot = L.dot(a, b), cos = L.cosine(a, b);
    const max = Math.max(0.5, ...prod.map(Math.abs));
    const row = (label, v, cls) => h('div.od-row', h('span.od-name', label),
      h('div.od-cells', v.map((x) => h('span.od-cell' + (cls ? '.' + cls : '') + (x !== 0 && p.digits === 0 ? '.one' : ''), f(x, p.digits)))));
    const bars = h('div.od-cells', prod.map((x) => h('span.od-barcell',
      h('span.od-bar' + (x < 0 ? '.neg' : ''), { style: { height: (Math.abs(x) / max * 100).toFixed(1) + '%' }, title: f(x, 3) }))));
    return h('div.od-panel',
      h('div.od-title', p.title),
      row(p.a[0], a), row(p.b[0], b),
      h('div.od-row', h('span.od-name', '逐维相乘'), bars),
      h('div.od-sum', '加起来：点积 = ', h('b', f(dot, 3)), '，余弦相似度 = ', h('b', f(cos, 3)),
        dot === 0 ? '：每一维至少有一个是 0，乘积全是 0。' : '：大多数维度的乘积是正的，两个词方向接近。'));
  }

  C.viz.register('onehot-dense', { title: 'one-hot 与稠密向量', mount(el) { el.append(...PAIRS.map(panel)); } });
})(window);
