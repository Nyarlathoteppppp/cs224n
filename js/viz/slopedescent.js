/* 斜率与梯度下降. props.mode = 'slope': the tangent of f(x) = x³ follows x (L03 p21: slope 3 at x = 1, 48 at x = 4).
 * props.mode = 'descent': gradient descent with one learning rate on the bowl θ² and on x² + 2y² (the L02 p18 bowl).
 * Updates use js/core/optim.js (sgd); derivatives are the analytic ones checked in tests/core.test.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider, button } = C.dom;
  const OPT = C.core.optim;

  const fmt = (v, d) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d) || 0).toFixed(d).replace('-', '−');

  function frame(W, H, P, xd, yd) {
    const X = (x) => P.l + (x - xd[0]) / (xd[1] - xd[0]) * (W - P.l - P.r);
    const Y = (y) => H - P.b - (y - yd[0]) / (yd[1] - yd[0]) * (H - P.t - P.b);
    return { X, Y };
  }
  const uid = () => Math.random().toString(36).slice(2, 8);

  /* ---------- mode 'slope' ---------- */
  function mountSlope(el) {
    const W = 640, H = 300, P = { l: 40, r: 14, t: 12, b: 28 }, xd = [-2.2, 4.6], yd = [-12, 100];
    const { X, Y } = frame(W, H, P, xd, yd);
    const f = (x) => x * x * x, df = (x) => 3 * x * x;
    const pts = [];
    for (let i = 0; i <= 300; i++) { const x = xd[0] + (xd[1] - xd[0]) * i / 300; pts.push(X(x).toFixed(1) + ',' + Y(f(x)).toFixed(1)); }
    const clip = 'sd-clip-' + uid();
    const tangent = s('line', { class: 'sd-tangent' }), dot = s('circle', { r: 6, class: 'sd-dot' });
    const rise = s('path', { class: 'sd-rise' }), riseText = s('text', { class: 'sd-rise-text' });
    const ticks = [];
    for (let x = -2; x <= 4; x++) ticks.push(s('text', { x: X(x), y: H - P.b + 17, class: 'sd-tick' }, String(x).replace('-', '−')));
    [0, 25, 50, 75, 100].forEach((y) => ticks.push(s('text', { x: P.l - 6, y: Y(y), class: 'sd-tick', 'text-anchor': 'end', 'dominant-baseline': 'central' }, String(y))));
    const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viz-svg', role: 'img', 'aria-label': 'f(x) = x³ 和它的切线' },
      s('defs', s('clipPath', { id: clip }, s('rect', { x: P.l, y: P.t, width: W - P.l - P.r, height: H - P.t - P.b }))),
      s('line', { x1: P.l, y1: Y(0), x2: W - P.r, y2: Y(0), class: 'sd-axis' }),
      s('line', { x1: X(0), y1: P.t, x2: X(0), y2: H - P.b, class: 'sd-axis' }), ticks,
      s('g', { 'clip-path': 'url(#' + clip + ')' }, s('polyline', { points: pts.join(' '), class: 'sd-curve' }), tangent, rise),
      dot, riseText, s('text', { x: X(4.45), y: Y(f(4.45)) + 4, class: 'sd-curve-label', 'text-anchor': 'end' }, 'f(x) = x³'));
    let x = 1;
    const read = h('div.sd-read');
    const sx = slider('x', { min: -2, max: 4.5, step: 0.1, value: x, format: (v) => fmt(v, 1), onInput: (v) => { x = v; render(); } });
    el.append(h('div.viz-row', sx, button('x = 1', () => { x = 1; sx.set(1); render(); }), button('x = 4', () => { x = 4; sx.set(4); render(); })), svg, read);
    function render() {
      const y = f(x), m = df(x), span = 1.2;
      tangent.setAttribute('x1', X(x - span)); tangent.setAttribute('y1', Y(y - m * span));
      tangent.setAttribute('x2', X(x + span)); tangent.setAttribute('y2', Y(y + m * span));
      dot.setAttribute('cx', X(x)); dot.setAttribute('cy', Y(y));
      /* a "step 1 to the right, rise = slope" triangle on the tangent, drawn at a readable size */
      const run = 0.5;
      rise.setAttribute('d', 'M' + X(x) + ',' + Y(y) + ' H' + X(x + run) + ' V' + Y(y + m * run));
      riseText.setAttribute('x', X(x + run) + 6); riseText.setAttribute('y', (Y(y) + Y(y + m * run)) / 2);
      riseText.textContent = '右移 0.5，升高 ' + fmt(m * run, 2);
      read.innerHTML = '斜率 <b>f′(' + fmt(x, 1) + ') = 3 × ' + fmt(x, 1) + '² = ' + fmt(m, 2) + '</b>。输入增加 0.01，输出大约增加 ' +
        fmt(m, 2) + ' × 0.01 = <b>' + fmt(m * 0.01, 4) + '</b>（实际是 ' + fmt(f(x + 0.01) - y, 4) + '）。';
    }
    render();
  }

  /* ---------- mode 'descent' ---------- */
  function mountDescent(el) {
    let alpha = 0.1;
    const start1 = 3, start2 = [2, 1];
    let path1 = [start1], path2 = [start2.slice()];

    /* left: J(θ) = θ² */
    const W = 330, H = 260, P = { l: 30, r: 10, t: 10, b: 26 }, xd = [-6, 6], yd = [0, 36];
    const L = frame(W, H, P, xd, yd);
    const curve = [];
    for (let i = 0; i <= 200; i++) { const t = xd[0] + (xd[1] - xd[0]) * i / 200; curve.push(L.X(t).toFixed(1) + ',' + L.Y(t * t).toFixed(1)); }
    const clipL = 'sd-cl-' + uid(), clipR = 'sd-cr-' + uid();
    const g1 = s('g'), ticksL = [];
    for (let t = -6; t <= 6; t += 2) ticksL.push(s('text', { x: L.X(t), y: H - P.b + 16, class: 'sd-tick' }, String(t).replace('-', '−')));
    const left = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viz-svg', role: 'img', 'aria-label': '一维的碗 θ² 上的梯度下降' },
      s('defs', s('clipPath', { id: clipL }, s('rect', { x: P.l, y: P.t, width: W - P.l - P.r, height: H - P.t - P.b }))),
      s('line', { x1: P.l, y1: L.Y(0), x2: W - P.r, y2: L.Y(0), class: 'sd-axis' }), ticksL,
      s('g', { 'clip-path': 'url(#' + clipL + ')' }, s('polyline', { points: curve.join(' '), class: 'sd-curve' }), g1),
      s('text', { x: L.X(5.6), y: L.Y(33), class: 'sd-curve-label', 'text-anchor': 'end' }, 'J(θ) = θ²'));

    /* right: contours of x² + 2y² */
    const R = { l: 14, r: 14, t: 10, b: 26 }, rx = [-3.4, 3.4], ry = [-2.4, 2.4];
    const RR = frame(W, H, R, rx, ry);
    const sx = (W - R.l - R.r) / (rx[1] - rx[0]), sy = (H - R.t - R.b) / (ry[1] - ry[0]);
    const ellipses = [0.25, 1, 2.25, 4, 6.25, 9].map((c) => s('ellipse', { cx: RR.X(0), cy: RR.Y(0), rx: Math.sqrt(c) * sx, ry: Math.sqrt(c / 2) * sy, class: 'sd-contour' }));
    const g2 = s('g');
    const right = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viz-svg', role: 'img', 'aria-label': '二维的碗 x² + 2y² 的等高线和梯度下降的路径' },
      s('defs', s('clipPath', { id: clipR }, s('rect', { x: R.l, y: R.t, width: W - R.l - R.r, height: H - R.t - R.b }))),
      s('line', { x1: R.l, y1: RR.Y(0), x2: W - R.r, y2: RR.Y(0), class: 'sd-axis faint' }),
      s('line', { x1: RR.X(0), y1: R.t, x2: RR.X(0), y2: H - R.b, class: 'sd-axis faint' }),
      s('g', { 'clip-path': 'url(#' + clipR + ')' }, ellipses, g2),
      s('text', { x: W - R.r - 4, y: H - 8, class: 'sd-curve-label', 'text-anchor': 'end' }, 'f(x, y) = x² + 2y² 的等高线'));

    const read1 = h('div.sd-read'), read2 = h('div.sd-read');
    const sa = slider('学习率 α', { min: 0.02, max: 1.2, step: 0.01, value: alpha, format: (v) => v.toFixed(2), onInput: (v) => { alpha = v; reset(); } });
    el.append(
      h('div.viz-row', sa, button('走一步', () => step(1), 'primary'), button('走十步', () => step(10)), button('重来', reset)),
      h('div.sd-two', h('figure', left, read1), h('figure', right, read2)));

    function step(n) {
      for (let i = 0; i < n; i++) {
        const t = path1[path1.length - 1];
        if (Math.abs(t) < 1e6) path1.push(OPT.sgd([t], [2 * t], alpha).theta[0]);
        const [x, y] = path2[path2.length - 1];
        if (Math.abs(x) + Math.abs(y) < 1e6) path2.push(OPT.sgd([x, y], [2 * x, 4 * y], alpha).theta);
      }
      render();
    }
    function reset() { path1 = [start1]; path2 = [start2.slice()]; render(); }

    function render() {
      while (g1.firstChild) g1.removeChild(g1.firstChild);
      while (g2.firstChild) g2.removeChild(g2.firstChild);
      path1.forEach((t, i) => {
        if (i > 0) { const a = path1[i - 1]; g1.append(s('line', { x1: L.X(a), y1: L.Y(a * a), x2: L.X(t), y2: L.Y(t * t), class: 'sd-step' })); }
        g1.append(s('circle', { cx: L.X(t), cy: L.Y(t * t), r: i === path1.length - 1 ? 6 : 3.5, class: 'sd-pt' + (i === path1.length - 1 ? ' cur' : '') }));
      });
      path2.forEach((p, i) => {
        if (i > 0) { const a = path2[i - 1]; g2.append(s('line', { x1: RR.X(a[0]), y1: RR.Y(a[1]), x2: RR.X(p[0]), y2: RR.Y(p[1]), class: 'sd-step' })); }
        g2.append(s('circle', { cx: RR.X(p[0]), cy: RR.Y(p[1]), r: i === path2.length - 1 ? 6 : 3.5, class: 'sd-pt' + (i === path2.length - 1 ? ' cur' : '') }));
      });
      const t = path1[path1.length - 1], p = path2[path2.length - 1];
      const verdict = (k) => (Math.abs(Math.abs(k) - 1) < 1e-9 ? (k < 0 ? '在谷底两边来回跳，永远到不了' : '原地不动')
        : Math.abs(k) > 1 ? '发散：每步都跨过谷底，而且越跳越远'
        : k < -0.8 ? '来回跳着，慢慢靠近谷底' : k < 0 ? '跨过谷底再跳回来，但在靠近'
        : k >= 0.9 ? '每步只挪一点，走得很慢' : '稳稳地靠近谷底');
      const k1 = 1 - 2 * alpha;   // θ ← (1 − 2α) θ
      read1.innerHTML = '第 ' + (path1.length - 1) + ' 步：θ = <b>' + (Math.abs(t) > 999 ? t.toExponential(1) : fmt(t, 3)) + '</b>，J = ' + (t * t > 9999 ? (t * t).toExponential(1) : fmt(t * t, 3)) +
        '<br>每步 θ 乘以 1 − 2α = ' + fmt(k1, 2) + '：' + verdict(k1);
      const kx = 1 - 2 * alpha, ky = 1 - 4 * alpha;   // x ← (1 − 2α) x,  y ← (1 − 4α) y
      read2.innerHTML = '第 ' + (path2.length - 1) + ' 步：(x, y) = <b>(' + fmt(p[0], 3) + ', ' + fmt(p[1], 3) + ')</b>' +
        '<br>x 方向每步乘 ' + fmt(kx, 2) + '，y 方向（更陡）每步乘 ' + fmt(ky, 2) + '：y 方向' + verdict(ky);
    }
    render();
  }

  C.viz.register('slope-descent', {
    title: '斜率与梯度下降',
    mount(el, props) { return (props && props.mode === 'descent' ? mountDescent : mountSlope)(el); },
  });
})(window);
