/* 梯度 = 观察到的 − 期望的：a 2-D toy (课件外) with the chapter's five outside vectors. Drag v_c or take SGD steps;
 * the expected vector Σ P(x|c) u_x and the step α(u_o − expected) are recomputed with js/core/word2vec.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider, button } = C.dom;
  const W2V = C.core.word2vec, L = C.core.linalg;

  const WORDS = ['banking', 'crises', 'problems', 'the', 'zebra'];
  const U = [[1, 1], [0.8, 0.6], [0.5, 0.2], [0, 0.1], [-1, 0.3]];
  const SIZE_W = 440, SIZE_H = 360, UNIT = 120, OX = 160, OY = 270;
  const X = (v) => OX + v * UNIT, Y = (v) => OY - v * UNIT;
  const f = (v, d) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d) || 0).toFixed(d).replace('-', '−');

  function mount(el) {
    let vc = [1, 0.5], o = 0, alpha = 0.5, trail = [vc.slice()];
    const head = (id, cls) => s('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, s('path', { d: 'M0,1 L9,5 L0,9 z', class: cls }));
    const uid = Math.random().toString(36).slice(2, 7);
    const grid = [];
    for (let i = -2; i <= 4; i++) grid.push(s('line', { x1: X(i / 2), y1: Y(-0.8), x2: X(i / 2), y2: Y(2.3), class: i === 0 ? 'wg-axis' : 'wg-grid' }));
    for (let i = -1; i <= 4; i++) grid.push(s('line', { x1: X(-1.4), y1: Y(i / 2), x2: X(2.4), y2: Y(i / 2), class: i === 0 ? 'wg-axis' : 'wg-grid' }));
    const LABEL_AT = [[-8, -12, 'end'], [12, 4, 'start'], [10, 16, 'start'], [-8, -10, 'end'], [0, -12, 'middle']];
    const uDots = U.map((u, i) => s('g', { class: 'wg-u', onclick: () => { o = i; trail = [vc.slice()]; render(); } },
      s('circle', { cx: X(u[0]), cy: Y(u[1]), r: 6 }),
      s('text', { x: X(u[0]) + LABEL_AT[i][0], y: Y(u[1]) + LABEL_AT[i][1], 'text-anchor': LABEL_AT[i][2] }, WORDS[i])));
    const trailPath = s('polyline', { class: 'wg-trail' });
    const vArrow = s('line', { x1: X(0), y1: Y(0), class: 'wg-v', 'marker-end': 'url(#wg-hv-' + uid + ')' });
    const vHandle = s('circle', { r: 11, class: 'wg-handle', tabindex: 0, 'aria-label': '拖动中心词向量 v_c' });
    const vLabel = s('text', { class: 'wg-vlabel' }, 'v_c');
    const expDot = s('circle', { r: 6, class: 'wg-exp' }), expLabel = s('text', { class: 'wg-explabel', 'text-anchor': 'end' }, '期望的');
    const stepArrow = s('line', { class: 'wg-step', 'marker-end': 'url(#wg-hs-' + uid + ')' });
    const pull = s('line', { class: 'wg-pull' });
    const svg = s('svg', { viewBox: '0 0 ' + SIZE_W + ' ' + SIZE_H, class: 'viz-svg wg-svg', role: 'img', 'aria-label': '中心词向量与上下文词向量' },
      s('defs', head('wg-hv-' + uid, 'wg-hv'), head('wg-hs-' + uid, 'wg-hs')), grid, trailPath, pull, uDots, expDot, expLabel, vArrow, stepArrow, vLabel, vHandle);

    const probs = h('div.wg-probs'), read = h('div.wg-read');
    const sa = slider('学习率 α', { min: 0.1, max: 2, step: 0.1, value: alpha, format: (v) => v.toFixed(1), onInput: (v) => { alpha = v; render(); } });
    el.append(
      h('div.viz-row', sa, button('走一步', () => step(1), 'primary'), button('走五步', () => step(5)), button('重来', () => { vc = [1, 0.5]; trail = [vc.slice()]; render(); }),
        h('span.viz-note', '点一个 u 换成真实的上下文词')),
      h('div.wg-layout', svg, h('div', probs, read)));

    function step(n) {
      for (let i = 0; i < n; i++) {
        const r = W2V.naiveSoftmax(vc, o, U);
        vc = L.sub(vc, L.scale(r.gradCenter, alpha));
        trail.push(vc.slice());
      }
      render();
    }
    let drag = false;
    vHandle.addEventListener('pointerdown', (e) => { drag = true; vHandle.setPointerCapture(e.pointerId); e.preventDefault(); });
    vHandle.addEventListener('pointerup', () => { drag = false; });
    vHandle.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      vc = [Math.max(-1.3, Math.min(2.3, (p.x - OX) / UNIT)), Math.max(-0.7, Math.min(2.2, (OY - p.y) / UNIT))];
      trail = [vc.slice()]; render();
    });

    function render() {
      const r = W2V.naiveSoftmax(vc, o, U), ex = r.expected, stepVec = L.scale(r.gradCenter, -alpha);
      vArrow.setAttribute('x2', X(vc[0])); vArrow.setAttribute('y2', Y(vc[1]));
      vHandle.setAttribute('cx', X(vc[0])); vHandle.setAttribute('cy', Y(vc[1]));
      vLabel.setAttribute('x', X(vc[0]) + 14); vLabel.setAttribute('y', Y(vc[1]) + 22);
      expDot.setAttribute('cx', X(ex[0])); expDot.setAttribute('cy', Y(ex[1]));
      expLabel.setAttribute('x', X(ex[0]) - 10); expLabel.setAttribute('y', Y(ex[1]) + 4);
      pull.setAttribute('x1', X(ex[0])); pull.setAttribute('y1', Y(ex[1])); pull.setAttribute('x2', X(U[o][0])); pull.setAttribute('y2', Y(U[o][1]));
      stepArrow.setAttribute('x1', X(vc[0])); stepArrow.setAttribute('y1', Y(vc[1]));
      stepArrow.setAttribute('x2', X(vc[0] + stepVec[0])); stepArrow.setAttribute('y2', Y(vc[1] + stepVec[1]));
      trailPath.setAttribute('points', trail.map((p) => X(p[0]) + ',' + Y(p[1])).join(' '));
      uDots.forEach((g, i) => g.classList.toggle('true', i === o));
      probs.innerHTML = '';
      r.yhat.forEach((p, i) => probs.append(h('div.wg-prow' + (i === o ? '.true' : ''),
        h('span.wg-pw', WORDS[i] + (i === o ? '（真实）' : '')), h('span.wg-ptrack', h('span.wg-pbar', { style: { width: (p * 100).toFixed(1) + '%' } })), h('span.wg-pv', f(p, 3)))));
      read.innerHTML = 'v_c = [' + f(vc[0], 3) + ', ' + f(vc[1], 3) + ']　损失 −log P(' + WORDS[o] + '|c) = <b>' + f(r.loss, 3) + '</b><br>' +
        '观察到的 − 期望的 = [' + f(U[o][0] - ex[0], 3) + ', ' + f(U[o][1] - ex[1], 3) + ']，乘以 α 就是绿色箭头（下一步）。<br>' +
        '<span class="viz-note">虚线：从“期望的”指向“观察到的”。更新方向和它一样。</span>';
    }
    render();
  }

  C.viz.register('w2v-grad', { title: '梯度 = 观察到的 − 期望的', mount });
})(window);
