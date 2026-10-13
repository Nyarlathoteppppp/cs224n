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

  function run(key, lr, lrAdam, beta1) {
    let p = START.slice(), st = {};
    const path = [p.slice()];
    for (let i = 0; i < STEPS; i++) {
      const g = grad(p);
      let r;
      if (key === 'sgd') r = O.sgd(p, g, lr);
      else if (key === 'mom') r = O.momentum(st, p, g, lr, beta1);
      else r = O.adam(st, p, g, lrAdam, beta1, 0.99);
      p = r.theta; st = r.state || {};
      path.push(p.slice());
      if (!isFinite(p[0]) || Math.abs(p[0]) + Math.abs(p[1]) > 1e3) break;
    }
    return path;
  }

  function mount(el) {
    let lr = 0.05, lrAdam = 0.15, beta1 = 0.9;
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
    const s3 = slider('β₁', { min: 0, max: 0.99, step: 0.01, value: beta1, format: (v) => v.toFixed(2), onInput: (v) => { beta1 = v; render(); } });
    el.append(h('div.viz-row', s1, s2, s3), legend, svg, table,
      h('p.viz-note', '碗在一个方向上很陡（等高线挤在一起），另一个方向很平缓。陡的方向梯度大，SGD 容易在那个方向上来回跳；平缓的方向梯度小，SGD 走得很慢。Adam 的学习率和 SGD 的含义不同（它的步长大致就是 α），所以单独调。也因为步长大致固定，Adam 走到谷底附近不会自动放慢，会在附近徘徊，所以这里它最后的损失反而偏大；把 Adam 的 α 调小就能看到它贴近谷底。实际训练中常配合学习率逐渐变小（课件外）。'));
    function render() {
      table.innerHTML = '';
      METHODS.forEach((m) => {
        const path = run(m.key, lr, lrAdam, beta1);
        lines[m.key].setAttribute('points', path.map((p) => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' '));
        const last = path[path.length - 1], loss = f(last);
        table.append(h('span.op-row.' + m.cls, m.label + '：走 ' + (path.length - 1) + ' 步后损失 ' + (isFinite(loss) && loss < 1e4 ? loss.toFixed(4) : '发散')));
      });
    }
    render();
  }

  C.viz.register('optimizers', { title: 'SGD、动量与 Adam', mount });
})(window);
