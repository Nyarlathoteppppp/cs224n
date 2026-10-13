/* 为什么必须有非线性: the four-point example of chapters 2.1/2.2 (课件外). "Linear only" shows the best a straight line can
 * do (it misclassifies at least one point); "with ReLU" uses h1 = ReLU(x1 + x2), h2 = ReLU(−x1 − x2), s = h1 + h2 − 1. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, segmented } = C.dom;

  const PTS = [[1, 1, 1], [-1, -1, 1], [1, -1, 0], [-1, 1, 0]];
  const relu = (v) => Math.max(v, 0);
  const MODELS = {
    linear: { label: '只有线性层', score: (x, y) => x + 0.2 * y - 0.0001, note: '无论怎么调权重，线性层（叠几层都一样）给出的分界都是一条直线。这里画的是其中一种：右边判“是”，左边判“不是”。四个点里总有分错的。' },
    relu: { label: '中间加一层 ReLU', score: (x, y) => relu(x + y) + relu(-x - y) - 1, note: 's = ReLU(x₁ + x₂) + ReLU(−x₁ − x₂) − 1。分界是两条平行线，中间一条带判“不是”，两边判“是”：四个点全对。' },
  };
  const SIZE = 300, R = 2;
  const X = (v) => SIZE / 2 + v / R * (SIZE / 2 - 14), Y = (v) => SIZE / 2 - v / R * (SIZE / 2 - 14);

  function mount(el) {
    let key = 'linear';
    const cells = s('g'), pts = s('g');
    const svg = s('svg', { viewBox: '0 0 ' + SIZE + ' ' + SIZE, class: 'viz-svg wl-svg', role: 'img', 'aria-label': '四个点和分界' }, cells,
      s('line', { x1: X(-R), x2: X(R), y1: Y(0), y2: Y(0), class: 'wl-axis' }), s('line', { y1: Y(-R), y2: Y(R), x1: X(0), x2: X(0), class: 'wl-axis' }), pts);
    const note = h('p.viz-note'), score = h('p.wl-score');
    el.append(h('div.viz-row', segmented(Object.entries(MODELS).map(([k, v]) => ({ value: k, label: v.label })), key, (v) => { key = v; render(); }, '模型')),
      h('div.wl-layout', svg, h('div', note, score)));
    function render() {
      const M = MODELS[key], n = 80, step = 2 * R / n;
      cells.innerHTML = ''; pts.innerHTML = '';
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const x = -R + (i + 0.5) * step, y = -R + (j + 0.5) * step;
        cells.append(s('rect', { x: X(x - step / 2), y: Y(y + step / 2), width: X(step) - X(0) + 0.5, height: X(step) - X(0) + 0.5, class: M.score(x, y) > 0 ? 'wl-yes' : 'wl-no' }));
      }
      let right = 0;
      PTS.forEach(([x, y, lab]) => {
        const ok = (M.score(x, y) > 0) === (lab === 1); if (ok) right++;
        pts.append(s('circle', { cx: X(x), cy: Y(y), r: 9, class: (lab ? 'wl-pyes' : 'wl-pno') + (ok ? '' : ' wrong') }));
      });
      note.textContent = M.note;
      score.textContent = '分对 ' + right + ' / 4 个点。（实心圆是“是”，空心圆是“不是”；红圈是分错的点；浅蓝区域判“是”。）';
    }
    render();
  }

  C.viz.register('why-nonlinear', { title: '为什么必须有非线性', mount });
})(window);
