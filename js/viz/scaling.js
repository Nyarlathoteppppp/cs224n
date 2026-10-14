/* 为什么要除以 √d (L05 p59; T08 [56:27]; N07 p12): random query and key vectors with standard-normal entries
 * (fixed seed, 课件外). Left: the spread of 300 dot products grows like √d. Right: 300 queries, each against 8 keys;
 * the average of the largest softmax weight rises with d unscaled and stays near 0.35 scaled. One query alone jumps
 * around too much to show the trend. The bars show the query whose largest weights are closest to the averages.
 * Uses js/core/optim.js rng and gaussian, js/core/prob.js softmax and std; the same numbers are in tests/core.test.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider, fmt, clear } = C.dom;
  const OPT = C.core.optim, P = C.core.prob, L = C.core.linalg;

  const DIMS = [2, 4, 8, 16, 32, 64, 128, 256, 512];

  const TRIALS = 300, cache = {};
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  function sample(dim, seed) {
    if (cache[dim]) return cache[dim];
    const r = OPT.rng(seed);
    const vec = () => Array.from({ length: dim }, () => OPT.gaussian(r));
    const pairs = Array.from({ length: 300 }, () => L.dot(vec(), vec()));
    const trials = Array.from({ length: TRIALS }, () => { const q = vec(); return Array.from({ length: 8 }, () => L.dot(q, vec())); });
    const top = trials.map((sc) => Math.max(...P.softmax(sc)));
    const topS = trials.map((sc) => Math.max(...P.softmax(sc.map((v) => v / Math.sqrt(dim)))));
    const mean = avg(top), meanS = avg(topS);
    let best = 0;
    top.forEach((t, i) => { if (Math.abs(t - mean) + Math.abs(topS[i] - meanS) < Math.abs(top[best] - mean) + Math.abs(topS[best] - meanS)) best = i; });
    return (cache[dim] = { pairs, scores: trials[best], mean, meanS });
  }

  function mount(el) {
    let di = 5, scaled = false;
    const svgL = s('svg', { class: 'viz-svg', viewBox: '0 0 360 220', role: 'img', 'aria-label': '点积的分布' });
    const svgR = s('svg', { class: 'viz-svg', viewBox: '0 0 360 220', role: 'img', 'aria-label': 'softmax 后的权重' });
    const note = h('div.vg-note');
    const sd = slider('每个头的 query / key 维数 dₖ', { min: 0, max: DIMS.length - 1, step: 1, value: di, format: (v) => String(DIMS[v]), onInput: (v) => { di = v; render(); } });
    const cb = h('label.as-check', h('input', { type: 'checkbox', onchange: (e) => { scaled = e.target.checked; render(); } }), ' 分数除以 √(向量维数)（缩放）');
    el.append(h('p.viz-note', 'dₖ 是单个头的维数；模型总维数是 d、头数是 h 时，dₖ = d/h。这里除以 √dₖ，不是再除一次 √(dₖ/h)。'), h('div.viz-row', sd, cb), h('div.sc2-grid', h('figure.sa-fig', h('figcaption', '300 对随机向量的点积（除以 √dₖ 前）：横轴是点积的值，每根柱子管宽 4 的一小段，柱子越高，落在这一段的点积越多（按最高的一根缩放；超出 ±60 的几个画在最边上那一格）。柱子摊得越开，点积越容易离 0 很远。'), svgL),
      h('figure.sa-fig', h('figcaption', '一个 query 对 8 个 key：softmax 后的权重（从 300 个随机 query 里挑最有代表性的一个画出来）'), svgR)), note);

    function render() {
      const d = DIMS[di], { pairs, scores, mean, meanS } = sample(d, 7);
      const sdv = P.std(pairs);
      // left: histogram on a fixed axis −60 … 60
      clear(svgL);
      const lo = -60, hi = 60, bins = 30, bw = (hi - lo) / bins, counts = new Array(bins).fill(0);
      pairs.forEach((v) => { const k = Math.floor((Math.max(lo, Math.min(hi - 1e-9, v)) - lo) / bw); counts[k] += 1; });
      const maxC = Math.max(...counts);
      counts.forEach((c, k) => svgL.append(s('rect', { x: 20 + k * 10.6, y: 190 - 160 * c / maxC, width: 9.6, height: 160 * c / maxC, class: 'sc2-bar' })));
      svgL.append(s('line', { x1: 20, y1: 190, x2: 340, y2: 190, class: 'vg-grid is-one' }));
      [-60, -30, 0, 30, 60].forEach((v) => svgL.append(s('text', { x: 20 + (v - lo) / (hi - lo) * 318, y: 206, class: 'vg-tick mid', style: 'fill:var(--muted)', text: String(v) })));
      svgL.append(s('text', { x: 340, y: 22, class: 'vg-tick', text: '标准差 ≈ ' + fmt(sdv, 1) + '（√dₖ = ' + fmt(Math.sqrt(d), 1) + '）' }));
      // right: softmax weights
      clear(svgR);
      const w = P.softmax(scores.map((v) => (scaled ? v / Math.sqrt(d) : v)));
      w.forEach((a, k) => {
        svgR.append(s('rect', { x: 30 + k * 40, y: 190 - 160 * a, width: 28, height: 160 * a, class: 'sc2-w' }));
        svgR.append(s('text', { x: 44 + k * 40, y: Math.max(14, 184 - 160 * a), class: 'vg-tick mid', style: 'fill:var(--text-2)', text: fmt(a, 2) }));
        svgR.append(s('text', { x: 44 + k * 40, y: 206, class: 'vg-tick mid', style: 'fill:var(--muted)', text: 'k' + (k + 1) }));
      });
      svgR.append(s('line', { x1: 24, y1: 190, x2: 350, y2: 190, class: 'vg-grid is-one' }));
      clear(note);
      note.append('dₖ = ' + d + ' 时，随机向量点积的标准差约 ' + fmt(sdv, 1) + '，大约是 √dₖ。300 个随机 query 里，最大的那个权重平均是 ' + fmt(scaled ? meanS : mean, 3) + '（' + (scaled ? '缩放后' : '不缩放') + '）。');
      note.append(scaled
        ? '在这里独立抽样、每个分量均值为 0、方差为 1 的设定下，除以 √dₖ 后分数的标准差不再随维数增长。实验中最大权重的平均值都在 0.35 左右；这不是对任意已训练的 query、key 都成立的保证。'
        : d >= 16 ? '不缩放时，分数差距很大，softmax 容易把大部分权重给一个 key，其他的接近 0：softmax 的权重对分数变化就不敏感。维数越大越明显（dₖ = 512 时最大权重平均 0.95）。'
        : '维数还小，最大权重还不算太大；把 dₖ 调大，看它怎样一路升高。');
      const sensitivity = w.reduce((sum, a) => sum + a * (1 - a), 0);
      note.append(h('div', '右图这一个 query 的 Σ αᵢ(1 − αᵢ) = ' + fmt(sensitivity, 3) + '：每项 αᵢ(1 − αᵢ) 是该权重对它对应的 softmax 输入分数的导数（勾选缩放时，指除以 √dₖ 之后的分数）。权重接近只选一个位置时，这些导数都接近 0；这说明的是 softmax 这一步，不是整个网络的所有梯度都为 0。'));
    }
    render();
  }

  C.viz.register('scaling', { title: '为什么要除以 √dₖ', mount });
})(window);
