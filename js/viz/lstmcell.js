/* LSTM 的三个门 (N06 p13–p14; T06 [28:25]–[43:10]; TW06 [52:00]–[63:15]). One memory dimension, so every wire
 * carries a single number. (1) A cell drawn after Olah's picture: the reader sets the forget/input/output gates,
 * the candidate and the old cell; c = f·c_old + i·c̃, h = o·tanh(c). (2) How long a fact written at step 1 survives:
 * LSTM cell with constant forget gate f and no new input, against a plain RNN h(t) = tanh(w·h(t−1)).
 * The values are chosen by the reader (课件外); the update rule is the official one. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider, fmt, clear, texHTML } = C.dom;

  function mount(el) {
    let f = 0.9, i = 0.3, o = 0.8, cand = 0.6, cOld = 1.0, keepF = 0.95, w = 0.9;
    const W = 760, H = 250;
    const svg = s('svg', { class: 'viz-svg lc-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'LSTM 单元' });
    const eq = h('div.lc-eq');
    const mk = (label, min, max, val, set) => slider(label, { min, max, step: 0.05, value: val, format: (v) => fmt(v, 2), onInput: (v) => { set(v); render(); } });
    const gates = h('div.lc-sliders',
      mk('遗忘门 f（记住多少）', 0, 1, f, (v) => { f = v; }),
      mk('输入门 i（写进多少）', 0, 1, i, (v) => { i = v; }),
      mk('输出门 o（露出多少）', 0, 1, o, (v) => { o = v; }),
      mk('候选内容 c̃', -1, 1, cand, (v) => { cand = v; }),
      mk('旧记忆 c(t−1)', -2, 2, cOld, (v) => { cOld = v; }));
    const chart = s('svg', { class: 'viz-svg lc-chart', viewBox: '0 0 820 210', role: 'img', 'aria-label': '记忆能保存多少步' });
    const chartNote = h('div.lc-note');
    const keep = h('div.lc-sliders',
      slider('LSTM 的遗忘门 f', { min: 0.5, max: 1, step: 0.01, value: keepF, format: (v) => fmt(v, 2), onInput: (v) => { keepF = v; renderChart(); } }),
      slider('普通 RNN 的权重 w', { min: 0.5, max: 2.5, step: 0.05, value: w, format: (v) => fmt(v, 2), onInput: (v) => { w = v; renderChart(); } }));
    el.append(svg, gates, eq, h('h4.vg-h', '一条信息能保存多少步'), h('p.viz-note', '第 1 步写进一条信息（值为 1），之后不再有新输入。LSTM 每一步只乘遗忘门 f；普通 RNN 每一步都要整个重写：h ← tanh(w · h)（只看一个分量、用 tanh 代替 sigmoid，是为了好看的简化，课件外）。'), keep, chart, chartNote);

    function wire(x1, y1, x2, y2, cls) { return s('line', { x1, y1, x2, y2, class: 'lc-wire ' + (cls || '') }); }
    function node(x, y, label, cls) {
      return s('g', { class: 'lc-node ' + (cls || '') }, s('circle', { cx: x, cy: y, r: 15 }), s('text', { x, y: y + 5, text: label }));
    }
    function gate(x, y, name, val, cls) {
      const g = s('g', { class: 'lc-gate ' + cls });
      g.append(s('rect', { x: x - 26, y: y - 15, width: 52, height: 30, rx: 6 }));
      g.append(s('rect', { x: x - 24, y: y + 9, width: 48 * Math.max(0, Math.min(1, val)), height: 4, rx: 2, class: 'lc-fill' }));
      g.append(s('text', { x, y: y + 4, text: name }));
      return g;
    }
    function val(x, y, v, cls) { return s('text', { x, y, class: 'lc-val ' + (cls || ''), text: fmt(v, 2) }); }

    function render() {
      const c = f * cOld + i * cand, hNew = o * Math.tanh(c);
      clear(svg);
      // cell line (top)
      svg.append(wire(40, 50, 720, 50, 'is-cell'));
      svg.append(s('text', { x: 40, y: 36, class: 'lc-name', text: 'c(t−1)' }), val(40, 74, cOld, 'is-cell'));
      svg.append(node(250, 50, '×', 'is-f'), node(430, 50, '+', 'is-plus'));
      svg.append(s('text', { x: 720, y: 36, class: 'lc-name end', text: 'c(t)' }), val(720, 74, c, 'is-cell end'));
      // forget gate
      svg.append(wire(250, 65, 250, 150, 'is-f'), gate(250, 165, 'σ → f', f, 'is-f'), val(272, 112, f, 'is-f'));
      // input gate and candidate
      svg.append(node(430, 120, '×', 'is-i'), wire(430, 105, 430, 65, 'is-i'), val(452, 92, i * cand, 'is-i'));
      svg.append(wire(380, 150, 420, 128, 'is-i'), gate(370, 165, 'σ → i', i, 'is-i'));
      svg.append(wire(490, 150, 440, 128, 'is-c'), gate(500, 165, 'tanh → c̃', (cand + 1) / 2, 'is-c'), val(530, 132, cand, 'is-c'));
      // output
      svg.append(wire(610, 50, 610, 95, 'is-cell'), node(610, 110, 'tanh', 'is-tanh'), wire(610, 125, 610, 150, ''));
      svg.append(node(610, 165, '×', 'is-o'), wire(660, 165, 625, 165, 'is-o'), gate(690, 165, 'σ → o', o, 'is-o'));
      svg.append(wire(610, 180, 610, 225, 'is-h'), s('text', { x: 622, y: 222, class: 'lc-name', text: 'h(t)' }), val(660, 222, hNew, 'is-h'));
      // inputs
      svg.append(s('text', { x: 40, y: 222, class: 'lc-name', text: 'h(t−1)、x(t) → 算出三个门和 c̃' }));
      clear(eq);
      eq.append(h('div', { html: texHTML('c^{(t)} = \\htmlClass{lc-tf}{f}\\,c^{(t-1)} + \\htmlClass{lc-ti}{i}\\,\\tilde c = ' + fmt(f, 2) + '\\times' + fmt(cOld, 2) + ' + ' + fmt(i, 2) + '\\times' + fmt(cand, 2) + ' = ' + fmt(c, 3)) }),
        h('div', { html: texHTML('h^{(t)} = \\htmlClass{lc-to}{o}\\,\\tanh(c^{(t)}) = ' + fmt(o, 2) + '\\times\\tanh(' + fmt(c, 3) + ') = ' + fmt(hNew, 3)) }),
        h('div.viz-note', f > 0.95 && i < 0.05 ? '遗忘门开满、输入门关死：记忆原样往下传，这正是 LSTM 能长期保存信息的情形。' : f < 0.05 ? '遗忘门关死：旧记忆被整个擦掉，只剩新写进去的内容。' : '旧记忆按 f 保留一部分，新内容按 i 加进来：两者是相加，不是相乘。'));
    }

    function renderChart() {
      const N = 20, x0 = 50, dx = 34, y0 = 180, hgt = 150;
      const lstm = [1], rnn = [1];
      for (let t = 1; t < N; t++) { lstm.push(keepF * lstm[t - 1]); rnn.push(Math.tanh(w * rnn[t - 1])); }
      clear(chart);
      [0, 0.5, 1].forEach((v) => {
        chart.append(s('line', { x1: x0 - 8, y1: y0 - v * hgt, x2: x0 + (N - 1) * dx + 8, y2: y0 - v * hgt, class: 'vg-grid' + (v === 1 ? ' is-one' : '') }));
        chart.append(s('text', { x: x0 - 12, y: y0 - v * hgt + 4, class: 'vg-tick', text: String(v) }));
      });
      const path = (arr) => arr.map((v, t) => (t ? 'L' : 'M') + (x0 + t * dx) + ',' + (y0 - Math.max(0, Math.min(1.1, v)) * hgt)).join(' ');
      chart.append(s('path', { d: path(rnn), class: 'lc-line is-rnn' }), s('path', { d: path(lstm), class: 'lc-line is-lstm' }));
      lstm.forEach((v, t) => chart.append(s('circle', { cx: x0 + t * dx, cy: y0 - Math.min(1.1, v) * hgt, r: 3, class: 'lc-dot is-lstm' })));
      rnn.forEach((v, t) => chart.append(s('circle', { cx: x0 + t * dx, cy: y0 - Math.max(0, Math.min(1.1, v)) * hgt, r: 3, class: 'lc-dot is-rnn' })));
      for (let t = 0; t < N; t += 3) chart.append(s('text', { x: x0 + t * dx, y: y0 + 18, class: 'vg-step', text: '第 ' + (t + 1) + ' 步' }));
      // legends to the right of the last points, pushed apart when the two values are close
      let yl = y0 - Math.min(1.1, lstm[N - 1]) * hgt + 4, yr = y0 - Math.max(0, Math.min(1.1, rnn[N - 1])) * hgt + 4;
      if (Math.abs(yl - yr) < 15) { const mid = (yl + yr) / 2, up = lstm[N - 1] >= rnn[N - 1]; yl = mid + (up ? -8 : 8); yr = mid + (up ? 8 : -8); }
      chart.append(s('text', { x: x0 + (N - 1) * dx + 10, y: yl, class: 'lc-legend is-lstm', text: 'LSTM：' + fmt(lstm[N - 1], 3) }));
      chart.append(s('text', { x: x0 + (N - 1) * dx + 10, y: yr, class: 'lc-legend is-rnn', text: '普通 RNN：' + fmt(rnn[N - 1], 3) }));
      chart.append(s('text', { x: x0 - 30, y: 10, class: 'lc-ytitle', text: '这条信息还剩多少（第 1 步写入时为 1）' }));
      clear(chartNote);
      chartNote.append('第 20 步时，LSTM 还剩 ' + fmt(lstm[N - 1], 3) + '（就是 f 的 19 次方），普通 RNN 剩 ' + fmt(rnn[N - 1], 3) + '。');
      chartNote.append(keepF === 1 ? '遗忘门是 1 时，记忆一点不少地一直传下去。' : w > 1
        ? '普通 RNN 的 w 大于 1 时，值不再趋向 0，而是停在一个只由 w 决定的数上：最初写进去的是 1 还是 0.3，最后都停在差不多同一个数，信息的大小被每一步的重写抹掉了（只剩正负号）。图上的数大，不等于它还记得最初写进去的是什么。'
        : '普通 RNN 每一步都乘 w 再过 tanh，信息很快就被冲淡了。');
      chartNote.append(' 反向传播时也一样：LSTM 从 c(20) 传回 c(1) 只是乘 19 次 f，中间没有矩阵乘法。');
    }
    render(); renderChart();
  }

  C.viz.register('lstm-cell', { title: 'LSTM 的三个门', mount });
})(window);
