/* 点积为什么能衡量相似：two draggable 2-D arrows, with the dot product computed both ways and the projection of a
 * onto b drawn in (a·b = (length of that projection) × |b|). Numbers from js/core/linalg.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, button } = C.dom;
  const L = C.core.linalg;

  const SIZE = 420, UNIT = 42, O = SIZE / 2, LIM = 4.5;
  const X = (v) => O + v * UNIT, Y = (v) => O - v * UNIT;
  const f1 = (v) => (Math.round(v * 10) / 10 || 0).toFixed(1).replace('-', '−');
  const f2 = (v) => (Math.round(v * 100) / 100 || 0).toFixed(2).replace('-', '−');

  function mount(el) {
    const vec = { a: [3, 1], b: [1, 2] };

    const grid = [];
    for (let i = -4; i <= 4; i++) {
      grid.push(s('line', { x1: X(i), y1: Y(-LIM), x2: X(i), y2: Y(LIM), class: i === 0 ? 'dp-axis' : 'dp-grid' }));
      grid.push(s('line', { x1: X(-LIM), y1: Y(i), x2: X(LIM), y2: Y(i), class: i === 0 ? 'dp-axis' : 'dp-grid' }));
    }
    const projLine = s('line', { class: 'dp-proj' });          // along b: the shadow of a
    const dropLine = s('line', { class: 'dp-drop' });          // from the tip of a, perpendicular to b
    const bLine = s('line', { class: 'dp-bline' });            // b extended through the origin
    const arc = s('path', { class: 'dp-arc' });
    const arcLabel = s('text', { class: 'dp-arc-label' });
    const shadowLabel = s('text', { class: 'dp-shadow-label' });
    const arrows = {}, handles = {}, labels = {};
    ['a', 'b'].forEach((k) => {
      arrows[k] = s('line', { x1: O, y1: O, class: 'dp-vec ' + k, 'marker-end': 'url(#dp-head-' + k + ')' });
      handles[k] = s('circle', { r: 11, class: 'dp-handle ' + k, tabindex: 0, 'aria-label': '拖动向量 ' + k });
      labels[k] = s('text', { class: 'dp-label ' + k });
    });
    const head = (k) => s('marker', { id: 'dp-head-' + k, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' },
      s('path', { d: 'M0,1 L9,5 L0,9 z', class: 'dp-headfill ' + k }));
    const svg = s('svg', { viewBox: '0 0 ' + SIZE + ' ' + SIZE, class: 'viz-svg dp-svg', role: 'img', 'aria-label': '两个可以拖动的二维向量' },
      s('defs', head('a'), head('b')), grid, bLine, projLine, dropLine, arc, arcLabel, shadowLabel,
      arrows.b, arrows.a, labels.a, labels.b, handles.b, handles.a);

    const out = {
      vecs: h('div.dp-row'), alg: h('div.dp-row'), geo: h('div.dp-row'), proj: h('div.dp-row'), cos: h('div.dp-row'), verdict: h('div.dp-verdict'),
    };
    const presets = h('div.viz-row',
      button('正文的例子', () => set([3, 1], [1, 2])),
      button('转到垂直', () => set([3, 1], [-1, 3])),
      button('转到反向', () => set([3, 1], [-2, -1])),
      button('同方向、更长', () => set([3, 1], [3.9, 1.3])));
    el.append(presets, h('div.dp-layout', svg, h('div.dp-panel', out.vecs, out.alg, out.geo, out.proj, out.cos, out.verdict)));

    function set(a, b) { vec.a = a; vec.b = b; render(); }

    /* dragging */
    let dragging = null;
    function toVec(evt) {
      const pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      const clamp = (v) => Math.max(-4, Math.min(4, Math.round(v * 10) / 10));
      return [clamp((p.x - O) / UNIT), clamp((O - p.y) / UNIT)];
    }
    ['a', 'b'].forEach((k) => {
      handles[k].addEventListener('pointerdown', (e) => { dragging = k; handles[k].setPointerCapture(e.pointerId); e.preventDefault(); });
      handles[k].addEventListener('pointermove', (e) => {
        if (dragging !== k) return;
        const v = toVec(e);
        if (Math.hypot(v[0], v[1]) < 0.3) return;   // keep away from the zero vector, whose direction is undefined
        vec[k] = v; render();
      });
      handles[k].addEventListener('pointerup', () => { dragging = null; });
      handles[k].addEventListener('keydown', (e) => {
        const step = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] }[e.key];
        if (!step) return;
        e.preventDefault();
        const v = [vec[k][0] + step[0], vec[k][1] + step[1]].map((t) => Math.max(-4, Math.min(4, Math.round(t * 10) / 10)));
        if (Math.hypot(v[0], v[1]) >= 0.3) { vec[k] = v; render(); }
      });
    });

    function render() {
      const a = vec.a, b = vec.b;
      const dot = L.dot(a, b), na = L.norm(a), nb = L.norm(b), cos = L.cosine(a, b);
      const theta = Math.acos(Math.max(-1, Math.min(1, cos)));
      ['a', 'b'].forEach((k) => {
        const v = vec[k];
        arrows[k].setAttribute('x2', X(v[0])); arrows[k].setAttribute('y2', Y(v[1]));
        handles[k].setAttribute('cx', X(v[0])); handles[k].setAttribute('cy', Y(v[1]));
        // just the letter, a little beyond the tip (the coordinates are in the panel), so it never covers the other arrow
        const len = Math.hypot(v[0], v[1]);
        labels[k].setAttribute('x', X(v[0] + v[0] / len * 0.5)); labels[k].setAttribute('y', Y(v[1] + v[1] / len * 0.5));
        labels[k].setAttribute('text-anchor', 'middle');
        labels[k].textContent = k;
      });
      /* b's line through the origin, and the projection of a onto it */
      const ub = [b[0] / nb, b[1] / nb], t = dot / nb, foot = [ub[0] * t, ub[1] * t];
      bLine.setAttribute('x1', X(-ub[0] * 6)); bLine.setAttribute('y1', Y(-ub[1] * 6));
      bLine.setAttribute('x2', X(ub[0] * 6)); bLine.setAttribute('y2', Y(ub[1] * 6));
      projLine.setAttribute('x1', O); projLine.setAttribute('y1', O);
      projLine.setAttribute('x2', X(foot[0])); projLine.setAttribute('y2', Y(foot[1]));
      projLine.classList.toggle('neg', dot < 0);
      dropLine.setAttribute('x1', X(a[0])); dropLine.setAttribute('y1', Y(a[1]));
      dropLine.setAttribute('x2', X(foot[0])); dropLine.setAttribute('y2', Y(foot[1]));
      // name the shadow: halfway along it, on the side of b's line away from a
      const nrm = [-ub[1], ub[0]], away = (a[0] * nrm[0] + a[1] * nrm[1]) > 0 ? -0.4 : 0.4;
      shadowLabel.setAttribute('x', X(foot[0] / 2 + nrm[0] * away)); shadowLabel.setAttribute('y', Y(foot[1] / 2 + nrm[1] * away));
      shadowLabel.textContent = Math.abs(t) > 0.5 ? '影子' : '';
      shadowLabel.classList.toggle('neg', dot < 0);
      /* angle arc from a to b, radius 0.9 units, the short way round */
      const angA = Math.atan2(a[1], a[0]), angB = Math.atan2(b[1], b[0]);
      let d = angB - angA; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const r = 0.9, p0 = [r * Math.cos(angA), r * Math.sin(angA)], p1 = [r * Math.cos(angA + d), r * Math.sin(angA + d)];
      arc.setAttribute('d', 'M' + X(p0[0]) + ',' + Y(p0[1]) + ' A' + r * UNIT + ',' + r * UNIT + ' 0 0 ' + (d > 0 ? 0 : 1) + ' ' + X(p1[0]) + ',' + Y(p1[1]));
      const mid = angA + d / 2;
      arcLabel.setAttribute('x', X(1.3 * Math.cos(mid))); arcLabel.setAttribute('y', Y(1.3 * Math.sin(mid)));
      arcLabel.textContent = 'θ = ' + (theta * 180 / Math.PI).toFixed(0) + '°';

      out.vecs.innerHTML = '<span class="dp-v"><b class="dp-a">a = [' + f1(a[0]) + ', ' + f1(a[1]) + ']</b>　<b class="dp-b">b = [' + f1(b[0]) + ', ' + f1(b[1]) + ']</b></span>';
      out.alg.innerHTML = '<span class="dp-k">对应相乘再相加</span><span class="dp-v">' + f1(a[0]) + '×' + f1(b[0]) + ' + ' + f1(a[1]) + '×' + f1(b[1]) + ' = <b>' + f2(dot) + '</b></span>';
      out.geo.innerHTML = '<span class="dp-k">长度 × 长度 × cos θ</span><span class="dp-v">' + f2(na) + ' × ' + f2(nb) + ' × cos ' + (theta * 180 / Math.PI).toFixed(1) + '° = <b>' + f2(na * nb * cos) + '</b></span>';
      out.proj.innerHTML = '<span class="dp-k">a 在 b 方向上的影子</span><span class="dp-v">' + f2(t) + '，再乘 b 的长度 ' + f2(nb) + ' = <b>' + f2(t * nb) + '</b></span>';
      out.cos.innerHTML = '<span class="dp-k">余弦相似度</span><span class="dp-v"><b>' + f2(cos) + '</b>（只看方向）</span>';
      // coordinates are multiples of 0.1, so a dot product of exactly 0 is reachable
      const zero = Math.abs(dot) < 1e-9, near = !zero && Math.abs(cos) < 0.05;
      out.verdict.textContent = zero ? '垂直：点积为 0，两个方向“毫无关系”。'
        : near ? '接近垂直：余弦相似度接近 0；点积的大小还受向量长度影响。'
        : cos < -0.9995 ? '方向正好相反（180°）：在两向量长度固定时，点积最小。'
        : dot > 0 ? '夹角小于 90°：点积为正。两向量长度固定时，方向越一致，点积越大。' : '夹角大于 90°：点积为负；两向量长度固定时，越接近反方向（180°），点积越小。';
      out.verdict.className = 'dp-verdict ' + (zero || near ? 'zero' : dot > 0 ? 'pos' : 'neg');
    }
    render();
  }

  C.viz.register('dot-product', { title: '点积为什么能衡量相似', mount });
})(window);
