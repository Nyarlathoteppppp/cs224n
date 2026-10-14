/* 激活函数一览 (L03 p15–p16, N03 p12–p14): a function and its derivative side by side, with a draggable z.
 * Values from js/core/nn.js; GELU's derivative is taken numerically (js/core/calculus.js). */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider, segmented } = C.dom;
  const NN = C.core.nn, CAL = C.core.calculus;

  const FNS = {
    sigmoid: { label: 'sigmoid', f: NN.activations.sigmoid.f, df: NN.activations.sigmoid.df, yd: [-0.2, 1.2] },
    tanh: { label: 'tanh', f: NN.activations.tanh.f, df: NN.activations.tanh.df, yd: [-1.2, 1.2] },
    relu: { label: 'ReLU', f: NN.activations.relu.f, df: NN.activations.relu.df, yd: [-1, 4] },
    leaky: { label: 'leaky ReLU（k = 0.1）', f: (z) => NN.activations.leakyRelu.f(z, 0.1), df: (z) => NN.activations.leakyRelu.df(z, 0.1), yd: [-1, 4] },
    // the form in the chapter's table, z·σ(1.702z), so the numbers can be checked against it
    gelu: { label: 'GELU（近似）', f: NN.activations.geluLogistic.f, df: (z) => CAL.derivative(NN.activations.geluLogistic.f, z, 1e-5), yd: [-1, 4] },
    step: { label: '阈值函数', f: (z) => (z > 0 ? 1 : 0), df: () => 0, yd: [-0.2, 1.2] },
  };
  const W = 300, H = 210, P = { l: 32, r: 10, t: 10, b: 24 }, XD = [-4, 4];
  const f2 = (v) => (Math.round(v * 1000) / 1000 || 0).toFixed(3).replace('-', '−');

  function panel(title) {
    const g = s('g'), dot = s('circle', { r: 5, class: 'ac-dot' }), vline = s('line', { class: 'ac-v' });
    const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viz-svg', role: 'img', 'aria-label': title }, g, vline, dot);
    return { svg, g, dot, vline, box: h('figure.ac-fig', svg, h('figcaption', title)) };
  }
  function draw(p, fn, yd, z, cls, jump) {
    const X = (x) => P.l + (x - XD[0]) / (XD[1] - XD[0]) * (W - P.l - P.r);
    const Y = (y) => H - P.b - (Math.max(yd[0], Math.min(yd[1], y)) - yd[0]) / (yd[1] - yd[0]) * (H - P.t - P.b);
    p.g.innerHTML = '';
    p.g.append(s('line', { x1: P.l, x2: W - P.r, y1: Y(0), y2: Y(0), class: 'ac-axis' }), s('line', { x1: X(0), x2: X(0), y1: P.t, y2: H - P.b, class: 'ac-axis' }));
    [-4, -2, 2, 4].forEach((t) => p.g.append(s('text', { x: X(t), y: H - 6, class: 'ac-tick' }, String(t).replace('-', '−'))));
    [yd[0] < -0.5 ? -1 : null, 1].filter((v) => v !== null).forEach((t) => p.g.append(s('text', { x: P.l - 4, y: Y(t), class: 'ac-tick', 'text-anchor': 'end', 'dominant-baseline': 'central' }, String(t).replace('-', '−'))));
    const segments = [[]];
    for (let i = 0; i <= 400; i++) {
      const x = XD[0] + (XD[1] - XD[0]) * i / 400;
      if (jump && x === 0) {
        segments[0].push(X(0) + ',' + Y(jump[0]));
        segments.push([X(0) + ',' + Y(jump[1])]);
      } else segments[segments.length - 1].push(X(x).toFixed(1) + ',' + Y(fn(x)).toFixed(1));
    }
    segments.forEach((pts) => p.g.append(s('polyline', { points: pts.join(' '), class: 'ac-curve ' + cls })));
    if (jump) [...new Set(jump)].forEach((v) => p.g.append(s('circle', { cx: X(0), cy: Y(v), r: 3.5, class: 'ac-curve ' + cls, style: 'fill:var(--surface)' })));
    if (jump && cls === 'f') p.g.append(s('circle', { cx: X(0), cy: Y(fn(0)), r: 3, class: 'ac-dot' }));
    p.dot.style.display = jump && cls === 'df' && Math.abs(z) < 1e-9 ? 'none' : '';
    p.dot.setAttribute('cx', X(z)); p.dot.setAttribute('cy', Y(fn(z)));
    p.vline.setAttribute('x1', X(z)); p.vline.setAttribute('x2', X(z)); p.vline.setAttribute('y1', P.t); p.vline.setAttribute('y2', H - P.b);
  }

  function mount(el) {
    let key = 'sigmoid', z = 2;
    const left = panel('函数 f(z)'), right = panel('导数 f′(z)：斜率');
    const read = h('p.ac-read');
    const pick = segmented(Object.entries(FNS).map(([k, v]) => ({ value: k, label: v.label })), key, (v) => { key = v; render(); }, '激活函数');
    const sz = slider('z', { min: -4, max: 4, step: 0.05, value: z, format: (v) => v.toFixed(2).replace('-', '−'), onInput: (v) => { z = v; render(); } });
    el.append(h('div.viz-row', pick), h('div.viz-row', sz), h('div.ac-two', left.box, right.box), read);
    function render() {
      const F = FNS[key];
      draw(left, F.f, F.yd, z, 'f', key === 'step' ? [0, 1] : null);
      draw(right, F.df, [-0.2, 1.2], z, 'df', key === 'step' ? [0, 0] : key === 'relu' ? [0, 1] : key === 'leaky' ? [0.1, 1] : null);
      const at0 = Math.abs(z) < 1e-9, kinked = key === 'relu' || key === 'leaky' || key === 'step';
      const slope = at0 && kinked ? '—' : f2(F.df(z));
      let note = '';
      if (key === 'step') note = '。除门槛 z = 0 处斜率没有定义外，其他地方斜率都是 0：梯度下降不知道往哪边走。图上的空心圆表示这一端点不取值。';
      else if (key === 'relu' && at0) note = '。这一点左右两边的斜率不同（左边 0，右边 1），斜率没有定义；程序里按惯例取 0（课件外）。';
      else if (key === 'relu' && z < 0) note = '。斜率正好是 0：这一侧是“死区”，梯度传到这里就断了。';
      else if (key === 'leaky' && at0) note = '。这一点左右两边的斜率不同（左边 0.1，右边 1），斜率没有定义。';
      else if (Math.abs(F.df(z)) < 0.02) note = '。这里几乎是平的，梯度传到这里几乎就没了。';
      read.innerHTML = F.label + '：f(' + z.toFixed(2).replace('-', '−') + ') = <b>' + f2(F.f(z)) + '</b>，斜率 f′ = <b>' + slope + '</b>' + note;
    }
    render();
  }

  C.viz.register('activations', { title: '激活函数一览', mount });
})(window);
