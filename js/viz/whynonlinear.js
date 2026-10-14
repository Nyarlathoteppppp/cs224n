/* 为什么必须有非线性: the four-point example of chapters 2.1/2.2 (课件外). "Linear only" lets the reader turn and shift a
 * straight line (at best three points right); "with ReLU" uses h1 = ReLU(x1 + x2), h2 = ReLU(−x1 − x2), s = h1 + h2 − 1.
 * Regions are drawn as exact polygons (half-planes clipped to the square), so a straight boundary looks straight. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, segmented } = C.dom;

  const PTS = [[1, 1, 1], [-1, -1, 1], [1, -1, 0], [-1, 1, 0]];
  const relu = (v) => Math.max(v, 0);
  const SIZE = 300, R = 2;
  const X = (v) => SIZE / 2 + v / R * (SIZE / 2 - 14), Y = (v) => SIZE / 2 - v / R * (SIZE / 2 - 14);
  const SQUARE = [[-R, -R], [R, -R], [R, R], [-R, R]];
  /** The part of the square where a·x + b·y + c > 0 (one clipping pass of Sutherland–Hodgman). */
  function clip(poly, [a, b, c]) {
    const out = [], val = (p) => a * p[0] + b * p[1] + c;
    poly.forEach((p, i) => {
      const q = poly[(i + 1) % poly.length], vp = val(p), vq = val(q);
      if (vp > 0) out.push(p);
      if ((vp > 0) !== (vq > 0)) { const t = vp / (vp - vq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
    });
    return out;
  }
  const toPts = (poly) => poly.map((p) => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ');

  function mount(el) {
    let key = 'linear', theta = 45, off = 1.06;   // the best a line can do: x₁ + x₂ > 1.5, three points right
    // each model: the half-planes [a, b, c] (a·x + b·y + c > 0) whose union is the “yes” region, and its score
    const model = () => {
      if (key === 'relu') return { regions: [[1, 1, -1], [-1, -1, -1]], score: (x, y) => relu(x + y) + relu(-x - y) - 1 };
      const t = theta * Math.PI / 180, a = Math.cos(t), b = Math.sin(t);
      return { regions: [[a, b, -off]], score: (x, y) => a * x + b * y - off };
    };
    const area = s('g'), lines = s('g'), pts = s('g');
    const svg = s('svg', { viewBox: '0 0 ' + SIZE + ' ' + SIZE, class: 'viz-svg wl-svg', role: 'img', 'aria-label': '四个点和分界' },
      s('rect', { x: X(-R), y: Y(R), width: X(R) - X(-R), height: Y(-R) - Y(R), class: 'wl-no' }), area,
      s('line', { x1: X(-R), x2: X(R), y1: Y(0), y2: Y(0), class: 'wl-axis' }), s('line', { y1: Y(-R), y2: Y(R), x1: X(0), x2: X(0), class: 'wl-axis' }), lines, pts);
    const note = h('p.viz-note'), score = h('p.wl-score');
    const sTheta = C.dom.slider('直线的方向', { min: 0, max: 355, step: 5, value: theta, format: (v) => v + '°', onInput: (v) => { theta = v; render(); } });
    const sOff = C.dom.slider('直线的平移', { min: -2, max: 2, step: 0.02, value: off, format: (v) => v.toFixed(2).replace('-', '−'), onInput: (v) => { off = v; render(); } });
    const lineCtl = h('div.viz-row', sTheta, sOff);
    el.append(h('div.viz-row', segmented([{ value: 'linear', label: '只有线性层' }, { value: 'relu', label: '中间加一层 ReLU' }], key, (v) => { key = v; render(); }, '模型')),
      lineCtl, h('div.wl-layout', svg, h('div', note, score)));
    function render() {
      const M = model();
      lineCtl.style.display = key === 'linear' ? '' : 'none';
      area.innerHTML = ''; lines.innerHTML = ''; pts.innerHTML = '';
      M.regions.forEach((hp) => {
        const poly = clip(SQUARE, hp);
        if (poly.length > 2) area.append(s('polygon', { points: toPts(poly), class: 'wl-yes' }));
        // the boundary a·x + b·y + c = 0, drawn across the square
        const [a, b, c] = hp, ends = clip(SQUARE, [a, b, c + 1e-9]).filter((p) => Math.abs(a * p[0] + b * p[1] + c) < 1e-6);
        if (ends.length >= 2) lines.append(s('line', { x1: X(ends[0][0]), y1: Y(ends[0][1]), x2: X(ends[1][0]), y2: Y(ends[1][1]), class: 'wl-line' }));
      });
      let right = 0;
      PTS.forEach(([x, y, lab]) => {
        const ok = (M.score(x, y) > 0) === (lab === 1); if (ok) right++;
        pts.append(s('circle', { cx: X(x), cy: Y(y), r: 9, class: (lab ? 'wl-pyes' : 'wl-pno') + (ok ? '' : ' wrong') }));
      });
      note.textContent = key === 'linear'
        ? '线性层（叠几层都一样）给出的分界只能是一条直线：直线一侧判“是”（浅蓝），另一侧判“不是”。拖动两个滑块，自己转一转、挪一挪：最多只能分对 3 个点，四个点里总有分错的。'
        : 's = ReLU(x₁ + x₂) + ReLU(−x₁ − x₂) − 1。分界是两条平行线，中间一条带判“不是”，两边判“是”：四个点全对。';
      score.textContent = '分对 ' + right + ' / 4 个点' + (key === 'linear' ? '（直线最多只能分对 3 个）' : '') + '。（实心圆是“是”，空心圆是“不是”；红圈是分错的点；浅蓝区域判“是”。）';
    }
    render();
  }

  C.viz.register('why-nonlinear', { title: '为什么必须有非线性', mount });
})(window);
