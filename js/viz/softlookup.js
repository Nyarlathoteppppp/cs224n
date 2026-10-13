/* 软查找与字典查找 (L05 p24): a lookup table returns the one value whose key matches the query; attention gives
 * every key a weight between 0 and 1 and returns the weighted sum of the values. A slider scales the scores
 * (how strongly the query prefers key 4): small → nearly an average, large → nearly the dictionary's answer.
 * Values and score pattern are made up (课件外); softmax from js/core/prob.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider, fmt, clear } = C.dom;
  const P = C.core.prob;

  const VALS = [[1, 0], [0, 1], [-1, 0], [0.5, 0.5], [0, -1]];
  const PATTERN = [0.2, -0.3, 0.1, 1, -0.5];   // query · key_j before scaling: key 4 matches best

  function mount(el) {
    let k = 2;
    const svg = s('svg', { class: 'viz-svg sl-svg', viewBox: '0 0 760 250', role: 'img', 'aria-label': '字典查找和注意力' });
    const note = h('div.vg-note');
    el.append(h('div.viz-row', slider('分数的差距（query 有多偏爱 k4）', { min: 0, max: 8, step: 0.1, value: k, format: (v) => fmt(v, 1), onInput: (v) => { k = v; render(); } })), svg, note);

    const vec = (v) => '[' + v.map((x) => fmt(x, 2)).join(', ') + ']';
    function render() {
      clear(svg);
      // left: lookup table
      svg.append(s('text', { x: 40, y: 22, class: 'sl-title', text: '字典查找：只命中一个' }));
      ['a', 'b', 'c', 'd', 'e'].forEach((key, j) => {
        const y = 50 + j * 38, hit = key === 'd';
        svg.append(s('rect', { x: 140, y: y - 14, width: 46, height: 28, rx: 5, class: 'sl-key' + (hit ? ' is-hit' : '') }), s('text', { x: 163, y: y + 5, class: 'sl-t', text: key }));
        svg.append(s('rect', { x: 196, y: y - 14, width: 46, height: 28, rx: 5, class: 'sl-val' + (hit ? ' is-hit' : '') }), s('text', { x: 219, y: y + 5, class: 'sl-t', text: 'v' + (j + 1) }));
        if (hit) svg.append(s('line', { x1: 78, y1: 126, x2: 138, y2: y, class: 'sl-link is-hit' }));
      });
      svg.append(s('rect', { x: 40, y: 112, width: 38, height: 28, rx: 5, class: 'sl-q' }), s('text', { x: 59, y: 131, class: 'sl-t', text: 'd' }));
      svg.append(s('line', { x1: 244, y1: 164, x2: 290, y2: 126, class: 'sl-link is-hit' }), s('rect', { x: 292, y: 112, width: 40, height: 28, rx: 5, class: 'sl-out' }), s('text', { x: 312, y: 131, class: 'sl-t', text: 'v4' }));
      // right: attention
      const scores = PATTERN.map((p) => k * p), w = P.softmax(scores);
      const out = [0, 1].map((d) => w.reduce((sum, a, j) => sum + a * VALS[j][d], 0));
      svg.append(s('text', { x: 390, y: 22, class: 'sl-title', text: '注意力：软查找，每个都给一个权重' }));
      svg.append(s('rect', { x: 390, y: 112, width: 38, height: 28, rx: 5, class: 'sl-q' }), s('text', { x: 409, y: 131, class: 'sl-t', text: 'q' }));
      VALS.forEach((v, j) => {
        const y = 50 + j * 38;
        svg.append(s('line', { x1: 428, y1: 126, x2: 488, y2: y, class: 'sl-link', style: 'stroke-width:' + (0.6 + 9 * w[j]) }));
        svg.append(s('rect', { x: 490, y: y - 14, width: 40, height: 28, rx: 5, class: 'sl-key' }), s('text', { x: 510, y: y + 5, class: 'sl-t', text: 'k' + (j + 1) }));
        svg.append(s('rect', { x: 536, y: y - 9, width: 70 * w[j], height: 18, class: 'sl-bar' }), s('text', { x: 540 + 70 * w[j], y: y + 5, class: 'sl-w', text: fmt(w[j], 2) }));
        svg.append(s('text', { x: 640, y: y + 5, class: 'sl-v', text: 'v' + (j + 1) + ' ' + vec(v) }));
      });
      svg.append(s('text', { x: 560, y: 245, class: 'sl-sum', text: 'Σ 权重 × v = ' + vec(out) }));
      clear(note);
      note.append('右边的权重 = softmax(query 和每个 key 的点积)，都在 0 到 1 之间，加起来是 1；输出是按权重把所有 value 加起来。');
      note.append(w[3] > 0.95 ? ' 现在几乎所有权重都在 k4 上，输出几乎就是 v4，和查字典一样。' : w[3] < 0.35 ? ' 分数差距很小时，权重接近平均，输出接近所有 value 的平均。' : ' k4 拿到最大的权重，但别的 value 也掺进来一些。');
    }
    render();
  }

  C.viz.register('soft-lookup', { title: '软查找与字典查找', mount });
})(window);
