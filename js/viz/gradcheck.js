/* 数值梯度检查：f(x) = x³ 在 x = 4（真实导数 48）。L03 p21 的例子 + L03 p78 / N03 p9 的双侧差分。
 * Left: the curve with the tangent and the two secants. Right: error against h on log–log axes, computed live in
 * floating point, so the rise for very small h (round-off, 课件外) is real, not drawn by hand. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider } = C.dom;
  const D = C.core.calculus;

  const f = (x) => x * x * x, X0 = 4, TRUE = 48;
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sup = (n) => String(n).split('').map((c) => SUP[c]).join('');
  /** 0.000123 → "1.2 × 10⁻⁴" */
  function sci(v) {
    if (v === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
    if (Math.abs(m) >= 9.95) { m /= 10; e += 1; }
    // 1 ≤ |v| < 100 reads better as a plain number (13, not 1.3 × 10¹)
    return e === 0 || e === 1 ? String(+v.toPrecision(2)) : m.toFixed(1) + ' × 10' + sup(e);
  }
  const estimates = (hv) => ({ one: D.derivative(f, X0, hv, 'forward'), two: D.derivative(f, X0, hv) });
  const P_MAX = 11, LOG_MIN = -13, LOG_MAX = 1;

  function mount(el) {
    let p = 0;   // h = 10^(−p); start at h = 1 so the secants visibly differ

    /* ---------- left: the curve ---------- */
    const W = 360, H = 270, L = { l: 44, r: 10, t: 12, b: 30 };
    const xd = [2.7, 5.3], yd = [10, 155];
    const X = (x) => L.l + (x - xd[0]) / (xd[1] - xd[0]) * (W - L.l - L.r);
    const Y = (y) => H - L.b - (y - yd[0]) / (yd[1] - yd[0]) * (H - L.t - L.b);
    const clipId = 'gc-clip-' + Math.random().toString(36).slice(2, 8);
    const curve = [];
    for (let x = xd[0]; x <= xd[1] + 1e-9; x += 0.02) curve.push(X(x).toFixed(1) + ',' + Y(f(x)).toFixed(1));
    const lineThrough = (x0, y0, m, cls) => s('line', { x1: X(xd[0]), y1: Y(y0 + m * (xd[0] - x0)), x2: X(xd[1]), y2: Y(y0 + m * (xd[1] - x0)), class: cls });
    const tangent = lineThrough(X0, f(X0), TRUE, 'gc-tangent');
    const one = s('line', { class: 'gc-one' }), two = s('line', { class: 'gc-two' });
    const dots = [0, 1, 2].map(() => s('circle', { r: 4.5, class: 'gc-dot' }));
    const ticks = [-1, 0, 1].map(() => s('text', { class: 'gc-tick', y: H - L.b + 18 }));
    const tickLines = [-1, 0, 1].map(() => s('line', { class: 'gc-tickline', y1: H - L.b, y2: H - L.b + 5 }));
    const tooSmall = s('text', { x: X(4) - 8, y: L.t + 20, class: 'gc-hint', 'text-anchor': 'end' }, '三条线已经重合，看右图');
    const left = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viz-svg', role: 'img', 'aria-label': 'x³ 的切线与两条割线' },
      s('defs', s('clipPath', { id: clipId }, s('rect', { x: L.l, y: L.t, width: W - L.l - L.r, height: H - L.t - L.b }))),
      s('line', { x1: L.l, y1: H - L.b, x2: W - L.r, y2: H - L.b, class: 'gc-axis' }),
      s('line', { x1: L.l, y1: L.t, x2: L.l, y2: H - L.b, class: 'gc-axis' }),
      s('text', { x: L.l - 6, y: Y(64), class: 'gc-tick', 'text-anchor': 'end', 'dominant-baseline': 'central' }, '64'),
      s('line', { x1: L.l, y1: Y(64), x2: X(4), y2: Y(64), class: 'gc-guide' }),
      s('g', { 'clip-path': 'url(#' + clipId + ')' },
        s('polyline', { points: curve.join(' '), class: 'gc-curve' }), tangent, one, two),
      tickLines, ticks, dots, tooSmall,
      s('text', { x: X(5.05), y: Y(f(5.05)) - 6, class: 'gc-curve-label', 'text-anchor': 'end' }, 'y = x³'));

    /* ---------- right: error vs h ---------- */
    const R = { l: 52, r: 12, t: 12, b: 38 };
    const PX = (q) => R.l + q / P_MAX * (W - R.l - R.r);
    const PY = (lg) => R.t + (LOG_MAX - lg) / (LOG_MAX - LOG_MIN) * (H - R.t - R.b);
    const logErr = (v) => Math.max(LOG_MIN, Math.log10(Math.abs(v - TRUE) || Math.pow(10, LOG_MIN)));
    const ptsOne = [], ptsTwo = [];
    for (let q = 0; q <= P_MAX + 1e-9; q += 0.05) {
      const e = estimates(Math.pow(10, -q));
      ptsOne.push(PX(q).toFixed(1) + ',' + PY(logErr(e.one)).toFixed(1));
      ptsTwo.push(PX(q).toFixed(1) + ',' + PY(logErr(e.two)).toFixed(1));
    }
    const grid = [];
    [0, -3, -6, -9, -12].forEach((lg) => grid.push(
      s('line', { x1: R.l, x2: W - R.r, y1: PY(lg), y2: PY(lg), class: 'gc-grid' }),
      s('text', { x: R.l - 6, y: PY(lg), class: 'gc-tick', 'text-anchor': 'end', 'dominant-baseline': 'central' }, lg === 0 ? '1' : '10' + sup(lg))));
    [0, 2, 4, 6, 8, 10].forEach((q) => grid.push(
      s('line', { x1: PX(q), x2: PX(q), y1: H - R.b, y2: H - R.b + 5, class: 'gc-tickline' }),
      s('text', { x: PX(q), y: H - R.b + 18, class: 'gc-tick' }, q === 0 ? '1' : '10' + sup(-q))));
    const marker = s('line', { y1: R.t, y2: H - R.b, class: 'gc-marker' });
    const mOne = s('circle', { r: 5, class: 'gc-mone' }), mTwo = s('circle', { r: 5, class: 'gc-mtwo' });
    const right = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viz-svg', role: 'img', 'aria-label': '误差随 h 变化的对数图' },
      grid,
      s('line', { x1: R.l, y1: H - R.b, x2: W - R.r, y2: H - R.b, class: 'gc-axis' }),
      s('line', { x1: R.l, y1: R.t, x2: R.l, y2: H - R.b, class: 'gc-axis' }),
      s('polyline', { points: ptsOne.join(' '), class: 'gc-one' }),
      s('polyline', { points: ptsTwo.join(' '), class: 'gc-two' }),
      s('text', { x: PX(2.5), y: PY(0.3), class: 'gc-lab one' }, '单侧：误差与 h 成正比'),
      s('text', { x: PX(0.3), y: PY(-9), class: 'gc-lab two' }, '双侧：误差与 h² 成正比'),
      s('text', { x: PX(10.8), y: PY(-1.2), class: 'gc-lab note', 'text-anchor': 'end' }, 'h 太小：相减丢掉有效数字，误差回升'),
      s('text', { x: PX(10.8), y: PY(-2.2), class: 'gc-lab note', 'text-anchor': 'end' }, '（课件外）'),
      s('text', { x: (R.l + W - R.r) / 2, y: H - 4, class: 'gc-axis-label' }, 'h（越往右越小）'),
      marker, mOne, mTwo);

    /* ---------- readout ---------- */
    const cell = () => h('td.num');
    const rows = { one: [cell(), cell()], two: [cell(), cell()] };
    const table = h('table.gc-table',
      h('thead', h('tr', h('th', ''), h('th', '算法'), h('th', '结果'), h('th', '与 48 的误差'))),
      h('tbody',
        h('tr', h('td', h('span.gc-swatch.tangent')), h('td', '真实导数 3x²'), h('td.num', '48'), h('td.num', '—')),
        h('tr', h('td', h('span.gc-swatch.one')), h('td', '单侧差分 (f(x+h) − f(x)) / h'), rows.one),
        h('tr', h('td', h('span.gc-swatch.two')), h('td', '双侧差分 (f(x+h) − f(x−h)) / 2h'), rows.two)));
    const note = h('p.viz-note.gc-note');

    const hSlider = slider('h', { min: 0, max: P_MAX, step: 0.1, value: p, format: (q) => sci(Math.pow(10, -q)),
      onInput: (q) => { p = q; render(); } });
    el.append(
      h('div.viz-row', hSlider, h('span.viz-note', '往右拖，h 越来越小')),
      h('div.gc-panels', h('figure', left, h('figcaption', '在 x = 4 附近：切线与两条割线')), h('figure', right, h('figcaption', '误差随 h 的变化（两条轴都是对数刻度）'))),
      table, note);

    function render() {
      const hv = Math.pow(10, -p), e = estimates(hv);
      one.setAttribute('x1', X(xd[0])); one.setAttribute('y1', Y(f(X0) + e.one * (xd[0] - X0)));
      one.setAttribute('x2', X(xd[1])); one.setAttribute('y2', Y(f(X0) + e.one * (xd[1] - X0)));
      two.setAttribute('x1', X(xd[0])); two.setAttribute('y1', Y(f(X0 - hv) + e.two * (xd[0] - X0 + hv)));
      two.setAttribute('x2', X(xd[1])); two.setAttribute('y2', Y(f(X0 - hv) + e.two * (xd[1] - X0 + hv)));
      [X0 - hv, X0, X0 + hv].forEach((x, i) => {
        dots[i].setAttribute('cx', X(x)); dots[i].setAttribute('cy', Y(f(x)));
        ticks[i].setAttribute('x', X(x)); tickLines[i].setAttribute('x1', X(x)); tickLines[i].setAttribute('x2', X(x));
        ticks[i].textContent = ['x − h', 'x = 4', 'x + h'][i];
        const spread = hv >= 0.3 || i === 1;
        ticks[i].style.opacity = spread ? 1 : 0; tickLines[i].style.opacity = spread ? 1 : 0;
      });
      tooSmall.style.opacity = hv < 0.04 ? 1 : 0;

      marker.setAttribute('x1', PX(p)); marker.setAttribute('x2', PX(p));
      mOne.setAttribute('cx', PX(p)); mOne.setAttribute('cy', PY(logErr(e.one)));
      mTwo.setAttribute('cx', PX(p)); mTwo.setAttribute('cy', PY(logErr(e.two)));

      // up to 10 decimals, without trailing zeros: 61, 48.0000300001
      rows.one[0].textContent = String(+e.one.toFixed(10)); rows.one[1].textContent = sci(Math.abs(e.one - TRUE));
      rows.two[0].textContent = String(+e.two.toFixed(10)); rows.two[1].textContent = sci(Math.abs(e.two - TRUE));
      // from about h = 10^−4.3 on, the two-sided error stops shrinking: rounding takes over
      note.textContent = p <= 4.3
        ? 'h 每缩小 10 倍，单侧差分的误差缩小约 10 倍，双侧差分的误差缩小约 100 倍。所以同一个 h 下，双侧准得多。'
        : 'h 太小了：计算机只保留大约 16 位有效数字，f(x+h) 和 f(x−h) 几乎一样，一相减有效数字就丢了，误差反而回升（课件外）。这也是 h 一般取 10⁻⁴ 到 10⁻⁵、不取更小的原因之一。';
    }
    render();
  }

  C.viz.register('grad-check', { title: '数值梯度检查', mount });
})(window);
