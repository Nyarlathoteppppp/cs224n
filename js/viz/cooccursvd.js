/* 共现矩阵与 SVD：scan the L02 p31 corpus one centre word at a time, filling the window co-occurrence matrix;
 * when it is complete, plot each word's 2-D truncated-SVD coordinates (js/core/cooccur.js). */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, button, segmented } = C.dom;
  const CO = C.core.cooccur;

  const SENTS = ['I like deep learning .', 'I like NLP .', 'I enjoy flying .'].map((x) => x.split(' '));
  const VOCAB = ['I', 'like', 'enjoy', 'deep', 'learning', 'NLP', 'flying', '.'];
  const POS = [];
  SENTS.forEach((sent, si) => sent.forEach((_, t) => POS.push([si, t])));

  function mount(el) {
    let m = 1, done = 0, X, last = [];
    const sentEls = SENTS.map((sent) => h('div.cs-sent', sent.map((w) => h('span.cs-tok', w))));
    const cells = VOCAB.map(() => VOCAB.map(() => h('td.cs-cell')));
    const table = h('table.cs-table', h('thead', h('tr', h('th', ''), VOCAB.map((w) => h('th', w)))),
      h('tbody', VOCAB.map((w, i) => h('tr', h('th', w), cells[i]))));
    const status = h('p.viz-note'), plot = h('div.cs-plot');
    const win = segmented([{ value: 1, label: '窗口 1（课件）' }, { value: 2, label: '窗口 2' }], m, (v) => { m = v; reset(); }, '窗口大小');
    el.append(h('div.viz-row', win, button('扫一个窗口', () => step(1), 'primary'), button('全部数完', () => step(POS.length)), button('重来', reset)),
      h('div.cs-layout', h('div', sentEls, status), h('div.cs-tablewrap', table)), plot);

    function reset() { done = 0; X = VOCAB.map(() => VOCAB.map(() => 0)); last = []; render(); }
    function step(n) {
      for (let k = 0; k < n && done < POS.length; k++) {
        const [si, t] = POS[done++], sent = SENTS[si], c = VOCAB.indexOf(sent[t]);
        last = [];
        for (let j = -m; j <= m; j++) {
          if (j === 0 || t + j < 0 || t + j >= sent.length) continue;
          const o = VOCAB.indexOf(sent[t + j]);
          X[c][o] += 1; last.push([c, o]);
        }
      }
      render();
    }
    function render() {
      cells.forEach((row, i) => row.forEach((td, j) => {
        td.textContent = X[i][j];
        td.classList.toggle('nz', X[i][j] > 0);
        td.classList.toggle('new', last.some(([a, b]) => a === i && b === j));
      }));
      sentEls.forEach((se) => [...se.children].forEach((t) => t.className = 'cs-tok'));
      if (done > 0 && done <= POS.length) {
        const [si, t] = POS[done - 1];
        const toks = sentEls[si].children;
        toks[t].classList.add('center');
        for (let j = -m; j <= m; j++) if (j && toks[t + j]) toks[t + j].classList.add('ctx');
      }
      status.textContent = done === 0 ? '还没开始数。' : done < POS.length
        ? '已经扫过 ' + done + ' / ' + POS.length + ' 个中心词。刚加 1 的格子是高亮的：中心词那一行，邻居那一列。'
        : '数完了。和 CS224N 第 2 讲的表' + (m === 1 && sameAsCore() ? '完全一致' : '对照：窗口 2 时每个词的邻居更多') + '。';
      drawPlot();
    }
    function sameAsCore() { return JSON.stringify(CO.cooccurrence(SENTS, 1, VOCAB).X) === JSON.stringify(X); }
    function drawPlot() {
      plot.innerHTML = '';
      if (done < POS.length) { plot.append(h('p.viz-note', '数完以后，这里用 SVD 把每个词（每一行）压到两维画出来。')); return; }
      const { reduced, sigma } = CO.truncatedSVD(X, 2);
      const W = 520, H = 300, P = 36;
      const xs = reduced.map((r) => r[0]), ys = reduced.map((r) => r[1]);
      const pad = (a) => { const lo = Math.min(...a, 0), hi = Math.max(...a, 0), d = (hi - lo) * 0.15 || 1; return [lo - d, hi + d]; };
      const xd = pad(xs), yd = pad(ys);
      const X_ = (v) => P + (v - xd[0]) / (xd[1] - xd[0]) * (W - 2 * P), Y_ = (v) => H - P - (v - yd[0]) / (yd[1] - yd[0]) * (H - 2 * P);
      // labels sit above-right of their point; a label that would overlap an earlier one moves below its point
      const labelY = [], placed = [];
      reduced.forEach((r, i) => {
        const x = X_(r[0]) + 8; let y = Y_(r[1]) - 7;
        if (placed.some(([px, py]) => Math.abs(px - x) < 48 && Math.abs(py - y) < 14)) y = Y_(r[1]) + 17;
        labelY[i] = y; placed.push([x, y]);
      });
      const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viz-svg cs-svg', role: 'img', 'aria-label': 'SVD 降到两维后的词' },
        s('line', { x1: P, x2: W - P, y1: Y_(0), y2: Y_(0), class: 'cs-axis' }), s('line', { y1: P, y2: H - P, x1: X_(0), x2: X_(0), class: 'cs-axis' }),
        reduced.map((r, i) => s('g', s('circle', { cx: X_(r[0]), cy: Y_(r[1]), r: 5, class: 'cs-pt' }),
          s('text', { x: X_(r[0]) + 8, y: labelY[i], class: 'cs-lab' }, VOCAB[i]))));
      plot.append(h('div.cs-plot-head', '每一行用 SVD 压成两维（前两个奇异值 ' + sigma.map((v) => v.toFixed(3)).join('、') + '）'), svg);
    }
    reset();
  }

  C.viz.register('cooccur-svd', { title: '共现矩阵与 SVD', mount });
})(window);
