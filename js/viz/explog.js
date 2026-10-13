/* 为什么要取对数：(1) many probabilities multiplied in real floating point underflow to 0, their logs added do not;
 * (2) exp maps any number to a positive one; (3) −log p as a penalty. All values are computed live. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider } = C.dom;

  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sup = (n) => String(n).split('').map((c) => SUP[c]).join('');
  function sci(v) {
    if (v === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
    if (Math.abs(m) >= 9.995) { m /= 10; e += 1; }
    return e >= -3 && e <= 3 ? String(+v.toPrecision(4)) : m.toFixed(2) + ' × 10' + sup(e);
  }
  const f3 = (v) => v.toFixed(3).replace('-', '−');

  /** A small function plot with a movable point. */
  function plot({ fn, xd, yd, label, cls }) {
    const W = 340, H = 220, P = { l: 34, r: 10, t: 10, b: 26 };
    const X = (x) => P.l + (x - xd[0]) / (xd[1] - xd[0]) * (W - P.l - P.r);
    const Y = (y) => H - P.b - (Math.min(Math.max(y, yd[0]), yd[1] * 1.2) - yd[0]) / (yd[1] - yd[0]) * (H - P.t - P.b);
    const pts = [];
    for (let i = 0; i <= 300; i++) {
      const x = xd[0] + (xd[1] - xd[0]) * i / 300, y = fn(x);
      if (Number.isFinite(y)) pts.push(X(x).toFixed(1) + ',' + Y(y).toFixed(1));
    }
    const dot = s('circle', { r: 6, class: 'el-dot ' + cls });
    const vx = s('line', { class: 'el-guide' }), hy = s('line', { class: 'el-guide' });
    const txt = s('text', { class: 'el-val ' + cls });
    const ticks = (d, axis) => {
      const out = [];
      for (let v = Math.ceil(d[0]); v <= d[1]; v += (d[1] - d[0] > 8 ? 5 : 1)) {
        out.push(axis === 'x'
          ? s('text', { x: X(v), y: H - P.b + 16, class: 'el-tick' }, String(v).replace('-', '−'))
          : s('text', { x: P.l - 6, y: Y(v), class: 'el-tick', 'text-anchor': 'end', 'dominant-baseline': 'central' }, String(v)));
      }
      return out;
    };
    const clip = 'el-clip-' + Math.random().toString(36).slice(2, 8);
    const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viz-svg', role: 'img', 'aria-label': label },
      s('defs', s('clipPath', { id: clip }, s('rect', { x: P.l, y: P.t, width: W - P.l - P.r, height: H - P.t - P.b }))),
      s('line', { x1: P.l, y1: Y(0), x2: W - P.r, y2: Y(0), class: 'el-axis' }),
      s('line', { x1: X(Math.max(0, xd[0])), y1: P.t, x2: X(Math.max(0, xd[0])), y2: H - P.b, class: 'el-axis' }),
      ticks(xd, 'x'), ticks(yd, 'y'),
      s('g', { 'clip-path': 'url(#' + clip + ')' }, s('polyline', { points: pts.join(' '), class: 'el-curve ' + cls }), vx, hy),
      dot, txt);
    svg.place = (x, text) => {
      const y = fn(x), cy = Y(y);
      dot.setAttribute('cx', X(x)); dot.setAttribute('cy', cy);
      vx.setAttribute('x1', X(x)); vx.setAttribute('x2', X(x)); vx.setAttribute('y1', Y(0)); vx.setAttribute('y2', cy);
      hy.setAttribute('x1', X(Math.max(0, xd[0]))); hy.setAttribute('x2', X(x)); hy.setAttribute('y1', cy); hy.setAttribute('y2', cy);
      const right = X(x) < W * 0.62;
      txt.setAttribute('x', X(x) + (right ? 10 : -10)); txt.setAttribute('y', Math.max(P.t + 12, cy - 12));
      txt.setAttribute('text-anchor', right ? 'start' : 'end');
      txt.textContent = text;
    };
    return svg;
  }

  function mount(el) {
    /* 1. product vs sum of logs */
    let p = 0.3, T = 10;
    const prodOut = h('div.el-big'), sumOut = h('div.el-big'), verdict = h('p.viz-note.el-verdict');
    const sP = slider('每一步的概率 p', { min: 0.01, max: 0.99, step: 0.01, value: p, format: (v) => v.toFixed(2), onInput: (v) => { p = v; renderProd(); } });
    const sT = slider('词数 T', { min: 1, max: 500, step: 1, value: T, format: String, onInput: (v) => { T = v; renderProd(); } });
    function renderProd() {
      let prod = 1, sum = 0;
      for (let i = 0; i < T; i++) { prod *= p; sum += Math.log(p); }   // literally what a computer would do
      prodOut.innerHTML = '<span class="el-k">连乘 p × p × … × p</span><span class="el-v' + (prod === 0 ? ' under' : '') + '">' + (prod === 0 ? '0（下溢）' : sci(prod)) + '</span>';
      sumOut.innerHTML = '<span class="el-k">取 log 后连加 log p + … + log p</span><span class="el-v">' + f3(sum) + '</span>';
      verdict.textContent = prod === 0
        ? '连乘的结果小于计算机能表示的最小正数，被存成了 0：所有句子的概率都一样是 0，没法比较了。取 log 的那一边还是一个普通的数。'
        : '把 T 拖大，或者把 p 拖小，看连乘多快变得极小；p = 0.1 时，T 到 324 就会被存成 0。取 log 的那一边只是均匀地越来越负。';
    }

    /* 2. exp makes everything positive */
    let x = 1;
    const expPlot = plot({ fn: Math.exp, xd: [-4, 3], yd: [0, 20], label: 'y = exp(x) 的曲线', cls: 'exp' });
    const sX = slider('分数 x', { min: -4, max: 3, step: 0.1, value: x, format: (v) => v.toFixed(1).replace('-', '−'), onInput: (v) => { x = v; renderExp(); } });
    function renderExp() { expPlot.place(x, 'exp(' + x.toFixed(1).replace('-', '−') + ') = ' + sci(Math.exp(x))); }

    /* 3. −log p as a penalty */
    let q = 0.5;
    const nlPlot = plot({ fn: (v) => -Math.log(v), xd: [0, 1], yd: [0, 5], label: 'y = −log p 的曲线', cls: 'nll' });
    const sQ = slider('正确答案的概率 p', { min: 0.01, max: 1, step: 0.01, value: q, format: (v) => v.toFixed(2), onInput: (v) => { q = v; renderNll(); } });
    function renderNll() { nlPlot.place(q, '−log ' + q.toFixed(2) + ' = ' + f3(-Math.log(q) + 0)); }

    el.append(
      h('div.el-section', h('div.el-title', '① 连乘会下溢（小到被存成 0），取 log 不会'), h('div.viz-row', sP, sT), h('div.el-pair', prodOut, sumOut), verdict),
      h('div.el-two',
        h('div.el-section', h('div.el-title', '② exp：任何分数都变成正数'), h('div.viz-row', sX), expPlot,
          h('p.viz-note', '曲线永远在横轴上方；分数越大，结果越大。')),
        h('div.el-section', h('div.el-title', '③ 负对数：概率越小，惩罚越大'), h('div.viz-row', sQ), nlPlot,
          h('p.viz-note', 'p = 1 时惩罚为 0；p 趋近 0 时，惩罚没有上限。'))));
    renderProd(); renderExp(); renderNll();
  }

  C.viz.register('exp-log', { title: '为什么要取对数', mount });
})(window);
