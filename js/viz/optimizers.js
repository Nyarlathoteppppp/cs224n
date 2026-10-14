/* SGD、动量与 Adam: a tilted, elongated bowl f = ½u² + 8w² (u, w = coordinates rotated by 30°; 课件外). The three paths
 * start from the same point; update rules from js/core/optim.js (momentum and the simplified Adam of A2 p4). */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider } = C.dom;
  const O = C.core.optim;

  const TH = Math.PI / 6, CO = Math.cos(TH), SI = Math.sin(TH), A = 0.5, B = 8;
  const rot = ([x, y]) => [CO * x + SI * y, -SI * x + CO * y];
  const f = (p) => { const [u, w] = rot(p); return A * u * u + B * w * w; };
  const grad = (p) => { const [u, w] = rot(p), du = 2 * A * u, dw = 2 * B * w; return [CO * du - SI * dw, SI * du + CO * dw]; };
  const START = [-4.2, 1.2], STEPS = 60;
  const W = 520, H = 360, SC = 52, OX = W / 2, OY = H / 2;
  const X = (v) => OX + v * SC, Y = (v) => OY - v * SC;
  const METHODS = [
    { key: 'sgd', label: 'SGD', cls: 'sgd' },
    { key: 'mom', label: '动量', cls: 'mom' },
    { key: 'adam', label: 'Adam', cls: 'adam' },
  ];

  /* Each step's gradient gets the same seeded random error for all three methods: the “one small batch of data”
   * of SGD (第 1.4 章). Without it, plain SGD is the steadiest of the three on this bowl. */
  const SIGMA = 6;
  function noiseFor(seed) {
    const rand = O.rng(seed), out = [];
    for (let i = 0; i < STEPS; i++) out.push([O.gaussian(rand) * SIGMA, O.gaussian(rand) * SIGMA]);
    return out;
  }
  function run(key, lr, lrAdam, beta1, noise) {
    let p = START.slice(), st = {};
    const path = [p.slice()];
    for (let i = 0; i < STEPS; i++) {
      const g0 = grad(p), g = noise ? [g0[0] + noise[i][0], g0[1] + noise[i][1]] : g0;
      let r;
      if (key === 'sgd') r = O.sgd(p, g, lr);
      else if (key === 'mom') r = O.momentum(st, p, g, lr, beta1);
      else r = O.adam(st, p, g, lrAdam, 0.9, 0.99);   // Adam keeps β₁ = 0.9: in this simplified Adam the first step is α(1 − β₁)/0.1
      p = r.theta; st = r.state || {};
      path.push(p.slice());
      if (!isFinite(p[0]) || Math.abs(p[0]) + Math.abs(p[1]) > 1e3) break;
    }
    return path;
  }

  function mount(el) {
    let lr = 0.05, lrAdam = 0.3, beta1 = 0.9, noisy = true, seed = 7;
    const contours = [0.5, 2, 5, 10, 18, 30].map((c) => {
      const pts = [];
      for (let i = 0; i <= 120; i++) {
        const t = 2 * Math.PI * i / 120, u = Math.sqrt(c / A) * Math.cos(t), w = Math.sqrt(c / B) * Math.sin(t);
        pts.push(X(CO * u - SI * w).toFixed(1) + ',' + Y(SI * u + CO * w).toFixed(1));
      }
      return s('polyline', { points: pts.join(' '), class: 'op-contour' });
    });
    const lines = {};
    METHODS.forEach((m) => { lines[m.key] = s('polyline', { class: 'op-path ' + m.cls }); });
    const clip = 'op-clip-' + Math.random().toString(36).slice(2, 7);
    const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viz-svg op-svg', role: 'img', 'aria-label': '三种优化方法在同一只碗上走的路' },
      s('defs', s('clipPath', { id: clip }, s('rect', { x: 0, y: 0, width: W, height: H }))),
      s('g', { 'clip-path': 'url(#' + clip + ')' }, contours, Object.values(lines)),
      s('circle', { cx: X(START[0]), cy: Y(START[1]), r: 6, class: 'op-start' }), s('circle', { cx: X(0), cy: Y(0), r: 5, class: 'op-min' }),
      s('text', { x: X(START[0]) - 8, y: Y(START[1]) - 10, class: 'op-label' }, '起点'), s('text', { x: X(0) + 8, y: Y(0) + 16, class: 'op-label' }, '谷底'));
    const legend = h('div.op-legend', METHODS.map((m) => h('span.op-key.' + m.cls, m.label)));
    const table = h('div.op-table');
    const s1 = slider('SGD / 动量的学习率 α', { min: 0.005, max: 0.13, step: 0.005, value: lr, format: (v) => v.toFixed(3), onInput: (v) => { lr = v; render(); } });
    const s2 = slider('Adam 的学习率 α', { min: 0.02, max: 0.5, step: 0.01, value: lrAdam, format: (v) => v.toFixed(2), onInput: (v) => { lrAdam = v; render(); } });
    const s3 = slider('动量的 β₁', { min: 0, max: 0.99, step: 0.01, value: beta1, format: (v) => v.toFixed(2), onInput: (v) => { beta1 = v; render(); } });
    const noiseBox = h('input', { type: 'checkbox', checked: true });
    noiseBox.addEventListener('change', () => { noisy = noiseBox.checked; render(); });
    const reseed = C.dom.button('换一批随机误差', () => { seed += 1; render(); });
    const status = h('p.viz-note.op-status');
    el.append(h('div.viz-row', s1, s2, s3), h('div.viz-row', h('label.as-check', noiseBox, ' 每一步的梯度带随机误差（模拟每次只看一小批数据，编的，课件外）'), reseed), legend, svg, table, status,
      h('p.viz-note', '碗在一个方向上很陡（等高线挤在一起），另一个方向很平缓。Adam 的学习率和 SGD 的含义不同（它每步大约走 α 那么远），所以单独调；它到了谷底附近不会自动放慢，会在附近徘徊，实际训练中常配合学习率逐渐变小（课件外）。'));
    function render() {
      table.innerHTML = '';
      const noise = noisy ? noiseFor(seed) : null;
      reseed.disabled = !noisy;
      METHODS.forEach((m) => {
        const path = run(m.key, lr, lrAdam, beta1, noise);
        lines[m.key].setAttribute('points', path.map((p) => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' '));
        const tail = path.slice(-20).map(f), avg = tail.reduce((a, b) => a + b, 0) / tail.length;
        let len = 0;
        for (let i = 1; i < path.length; i++) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
        table.append(h('span.op-row.' + m.cls, m.label + '：最后 20 步的平均损失 ' + (isFinite(avg) && avg < 1e4 ? avg.toFixed(2) : '发散') +
          '，路线总长 ' + (isFinite(len) && len < 1e4 ? len.toFixed(1) : '—')));
      });
      status.textContent = noisy
        ? '路线越长、越弯，说明被误差推得越厉害。SGD 每一步都完全听这一次的梯度；动量把最近许多步平均起来，误差互相抵消，路线短而平稳。'
        : '没有随机误差时，SGD 在这只碗上反而最稳；动量像有惯性的球，会冲过谷底再荡回来。把“SGD / 动量的学习率”调到 0.065 以上，SGD 也开始在陡的方向上来回跳。';
    }
    render();
  }

  C.viz.register('optimizers', { title: 'SGD、动量与 Adam', mount });
})(window);
