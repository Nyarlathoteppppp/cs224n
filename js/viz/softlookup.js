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
    const svg = s('svg', { class: 'viz-svg sl-svg', viewBox: '0 0 810 280', role: 'img', 'aria-label': '字典查找和注意力' });
    const note = h('div.vg-note');
    el.append(h('div.viz-row', slider('分数放大几倍（越大，k4 领先得越多）', { min: 0, max: 8, step: 0.1, value: k, format: (v) => fmt(v, 1), onInput: (v) => { k = v; render(); } })), svg, note);

    const vec = (v) => '[' + v.map((x) => fmt(x, 2)).join(', ') + ']';
    const Y = (j) => 70 + j * 38, MID = Y(2);
    function render() {
      clear(svg);
      // left: lookup table — the query k4 matches exactly one key
      svg.append(s('text', { x: 40, y: 22, class: 'sl-title', text: '字典查找：只命中一个' }));
      [0, 1, 2, 3, 4].forEach((j) => {
        const y = Y(j), hit = j === 3;
        svg.append(s('rect', { x: 140, y: y - 14, width: 46, height: 28, rx: 5, class: 'sl-key' + (hit ? ' is-hit' : '') }), s('text', { x: 163, y: y + 5, class: 'sl-t', text: 'k' + (j + 1) }));
        svg.append(s('rect', { x: 196, y: y - 14, width: 46, height: 28, rx: 5, class: 'sl-val' + (hit ? ' is-hit' : '') }), s('text', { x: 219, y: y + 5, class: 'sl-t', text: 'v' + (j + 1) }));
        if (hit) svg.append(s('line', { x1: 78, y1: MID, x2: 138, y2: y, class: 'sl-link is-hit' }));
      });
      svg.append(s('rect', { x: 40, y: MID - 14, width: 38, height: 28, rx: 5, class: 'sl-q' }), s('text', { x: 59, y: MID + 5, class: 'sl-t', text: 'k4' }));
      svg.append(s('line', { x1: 244, y1: Y(3), x2: 290, y2: MID, class: 'sl-link is-hit' }), s('rect', { x: 292, y: MID - 14, width: 40, height: 28, rx: 5, class: 'sl-out' }), s('text', { x: 312, y: MID + 5, class: 'sl-t', text: 'v4' }));
      // right: attention — every key gets a score, softmax turns the scores into weights
      const scores = PATTERN.map((p) => k * p), w = P.softmax(scores);
      const out = [0, 1].map((d) => w.reduce((sum, a, j) => sum + a * VALS[j][d], 0));
      svg.append(s('text', { x: 390, y: 22, class: 'sl-title', text: '注意力：软查找，每个都给一个权重' }));
      svg.append(s('text', { x: 530, y: 44, class: 'sl-head', text: 'key：分数' }), s('text', { x: 600, y: 44, class: 'sl-head', style: 'text-anchor:start', text: '权重' }), s('text', { x: 690, y: 44, class: 'sl-head', style: 'text-anchor:start', text: 'value' }));
      svg.append(s('rect', { x: 390, y: MID - 14, width: 38, height: 28, rx: 5, class: 'sl-q' }), s('text', { x: 409, y: MID + 5, class: 'sl-t', text: 'q' }));
      VALS.forEach((v, j) => {
        const y = Y(j);
        svg.append(s('line', { x1: 428, y1: MID, x2: 488, y2: y, class: 'sl-link', style: 'stroke-width:' + (0.6 + 9 * w[j]) }));
        svg.append(s('rect', { x: 490, y: y - 14, width: 84, height: 28, rx: 5, class: 'sl-key' }), s('text', { x: 532, y: y + 5, class: 'sl-t', text: 'k' + (j + 1) + '：' + fmt(scores[j], 2) }));
        svg.append(s('rect', { x: 600, y: y - 9, width: 60 * w[j], height: 18, class: 'sl-bar' }), s('text', { x: 604 + 60 * w[j], y: y + 5, class: 'sl-w', text: fmt(w[j], 2) }));
        svg.append(s('text', { x: 690, y: y + 5, class: 'sl-v', text: 'v' + (j + 1) + ' ' + vec(v) }));
      });
      svg.append(s('text', { x: 600, y: 270, class: 'sl-sum', text: 'Σ 权重 × v = ' + vec(out) }));
      clear(note);
      note.append('右边每个 key 旁边的数是分数（query 和这个 key 的点积，编的，课件外）；权重 = softmax(分数)，都在 0 到 1 之间，加起来是 1；输出是按权重把所有 value 加起来。滑块把所有分数一起放大，差距也跟着变大。');
      note.append(w[3] > 0.95 ? ' 现在几乎所有权重都在 k4 上，输出几乎就是 v4，和查字典一样。' : w[3] < 0.35 ? ' 分数差距很小时，权重接近平均，输出接近所有 value 的平均。' : ' k4 拿到最大的权重，但别的 value 也掺进来一些。');
    }
    render();
  }

  C.viz.register('soft-lookup', { title: '软查找与字典查找', mount });
})(window);
