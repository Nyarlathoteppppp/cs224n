/* 为什么要除以 √d (L05 p59; T08 [56:27]; N07 p12): random query and key vectors with standard-normal entries
 * (fixed seed, 课件外). Left: the spread of their dot products grows like √d. Right: one query against 8 keys; the
 * softmax of the raw scores gets peakier as d grows, dividing by √d keeps it flat. Uses js/core/optim.js rng and
 * gaussian, js/core/prob.js softmax and std. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider, fmt, clear } = C.dom;
  const OPT = C.core.optim, P = C.core.prob, L = C.core.linalg;

  const DIMS = [2, 4, 8, 16, 32, 64, 128, 256, 512];

  function sample(dim, seed) {
    const r = OPT.rng(seed);
    const vec = () => Array.from({ length: dim }, () => OPT.gaussian(r));
    const pairs = Array.from({ length: 300 }, () => L.dot(vec(), vec()));
    const q = vec(), keys = Array.from({ length: 8 }, vec);
    return { pairs, scores: keys.map((k) => L.dot(q, k)) };
  }

  function mount(el) {
    let di = 5, scaled = false;
    const svgL = s('svg', { class: 'viz-svg', viewBox: '0 0 360 220', role: 'img', 'aria-label': '点积的分布' });
    const svgR = s('svg', { class: 'viz-svg', viewBox: '0 0 360 220', role: 'img', 'aria-label': 'softmax 后的权重' });
    const note = h('div.vg-note');
    const sd = slider('向量维数 d', { min: 0, max: DIMS.length - 1, step: 1, value: di, format: (v) => String(DIMS[v]), onInput: (v) => { di = v; render(); } });
    const cb = h('label.as-check', h('input', { type: 'checkbox', onchange: (e) => { scaled = e.target.checked; render(); } }), ' 分数除以 √(向量维数)（缩放）');
    el.append(h('div.viz-row', sd, cb), h('div.sc2-grid', h('figure.sa-fig', h('figcaption', '300 对随机向量的点积（除以 √d 前）'), svgL), h('figure.sa-fig', h('figcaption', '一个 query 对 8 个 key：softmax 后的权重'), svgR)), note);

    function render() {
      const d = DIMS[di], { pairs, scores } = sample(d, 7);
      const sdv = P.std(pairs);
      // left: histogram on a fixed axis −60 … 60
      clear(svgL);
      const lo = -60, hi = 60, bins = 30, bw = (hi - lo) / bins, counts = new Array(bins).fill(0);
      pairs.forEach((v) => { const k = Math.floor((Math.max(lo, Math.min(hi - 1e-9, v)) - lo) / bw); counts[k] += 1; });
      const maxC = Math.max(...counts);
      counts.forEach((c, k) => svgL.append(s('rect', { x: 20 + k * 10.6, y: 190 - 160 * c / maxC, width: 9.6, height: 160 * c / maxC, class: 'sc2-bar' })));
      svgL.append(s('line', { x1: 20, y1: 190, x2: 340, y2: 190, class: 'vg-grid is-one' }));
      [-60, -30, 0, 30, 60].forEach((v) => svgL.append(s('text', { x: 20 + (v - lo) / (hi - lo) * 318, y: 206, class: 'vg-tick mid', style: 'fill:var(--muted)', text: String(v) })));
      svgL.append(s('text', { x: 340, y: 22, class: 'vg-tick', text: '标准差 ≈ ' + fmt(sdv, 1) + '（√d = ' + fmt(Math.sqrt(d), 1) + '）' }));
      // right: softmax weights
      clear(svgR);
      const w = P.softmax(scores.map((v) => (scaled ? v / Math.sqrt(d) : v)));
      w.forEach((a, k) => {
        svgR.append(s('rect', { x: 30 + k * 40, y: 190 - 160 * a, width: 28, height: 160 * a, class: 'sc2-w' }));
        svgR.append(s('text', { x: 44 + k * 40, y: Math.max(14, 184 - 160 * a), class: 'vg-tick mid', style: 'fill:var(--text-2)', text: fmt(a, 2) }));
        svgR.append(s('text', { x: 44 + k * 40, y: 206, class: 'vg-tick mid', style: 'fill:var(--muted)', text: 'k' + (k + 1) }));
      });
      svgR.append(s('line', { x1: 24, y1: 190, x2: 350, y2: 190, class: 'vg-grid is-one' }));
      const top = Math.max(...w);
      clear(note);
      note.append('d = ' + d + ' 时，随机向量点积的标准差约 ' + fmt(sdv, 1) + '，大约是 √d。');
      note.append(scaled
        ? '除以 √d 以后，分数的大小不再随维数变化，权重保持平缓（最大的一个是 ' + fmt(top, 2) + '）。'
        : top > 0.75 ? '不缩放时，分数差距很大，softmax 把大部分权重给了一个 key（' + fmt(top, 2) + '），其他的接近 0：这时梯度很小，很难学。维数越大越严重。' : '维数还小，权重还算平缓；把 d 调大看看。');
    }
    render();
  }

  C.viz.register('scaling', { title: '为什么要除以 √d', mount });
})(window);
