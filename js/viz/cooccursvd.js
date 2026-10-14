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
      if (done === POS.length) last = [];   // finished: nothing is “just added” any more
      render();
    }
    function render() {
      cells.forEach((row, i) => row.forEach((td, j) => {
        td.textContent = X[i][j];
        td.classList.toggle('nz', X[i][j] > 0);
        td.classList.toggle('new', last.some(([a, b]) => a === i && b === j));
      }));
      sentEls.forEach((se) => [...se.children].forEach((t) => t.className = 'cs-tok'));
      if (done > 0 && done < POS.length) {
        const [si, t] = POS[done - 1];
        const toks = sentEls[si].children;
        toks[t].classList.add('center');
        for (let j = -m; j <= m; j++) if (j && toks[t + j]) toks[t + j].classList.add('ctx');
      }
      status.textContent = done === 0 ? '还没开始数。' : done < POS.length
        ? '已经扫过 ' + done + ' / ' + POS.length + ' 个中心词。刚加 1 的格子是高亮的：中心词那一行，邻居那一列。'
        : m === 1 && sameAsCore() ? '数完了。和上面正文里的表完全一致。' : '数完了。窗口 2 时每个词的邻居更多，表里的非零格也更多。';
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
      // each label tries above-right, below-right, above-left, below-left of its point, and takes the first spot
      // that covers neither an earlier label nor any other point
      const pts = reduced.map((r) => [X_(r[0]), Y_(r[1])]), boxes = [], labs = [];
      const hit = (b, c) => b[0] < c[2] && c[0] < b[2] && b[1] < c[3] && c[1] < b[3];
      reduced.forEach((r, i) => {
        const [px, py] = pts[i], w = VOCAB[i].length * 7.5 + 4;
        const cand = [[px + 8, py - 7, 'start'], [px + 8, py + 17, 'start'], [px - 8, py - 7, 'end'], [px - 8, py + 17, 'end']];
        const box = ([x, y, a]) => (a === 'start' ? [x, y - 12, x + w, y + 2] : [x - w, y - 12, x, y + 2]);
        const ok = (c) => !boxes.some((b) => hit(b, box(c))) && !pts.some((q, j) => j !== i && hit(box(c), [q[0] - 6, q[1] - 6, q[0] + 6, q[1] + 6]));
        const c = cand.find(ok) || cand[0];
        labs[i] = c; boxes.push(box(c));
      });
      const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viz-svg cs-svg', role: 'img', 'aria-label': 'SVD 降到两维后的词' },
        s('line', { x1: P, x2: W - P, y1: Y_(0), y2: Y_(0), class: 'cs-axis' }), s('line', { y1: P, y2: H - P, x1: X_(0), x2: X_(0), class: 'cs-axis' }),
        s('text', { x: W - P, y: Y_(0) - 6, class: 'cs-axname', 'text-anchor': 'end' }, '第 1 维'),
        s('text', { x: X_(0) + 6, y: P - 6, class: 'cs-axname' }, '第 2 维'),
        reduced.map((r, i) => s('g', s('title', VOCAB[i] + '：(' + r[0].toFixed(3) + ', ' + r[1].toFixed(3) + ')'),
          s('circle', { cx: pts[i][0], cy: pts[i][1], r: 5, class: 'cs-pt' }),
          s('text', { x: labs[i][0], y: labs[i][1], 'text-anchor': labs[i][2], class: 'cs-lab' }, VOCAB[i]))));
      plot.append(h('div.cs-plot-head', '每一行用 SVD 压成两维（前两个奇异值 ' + sigma.map((v) => v.toFixed(3)).join('、') + '，奇异值是什么见下一节；鼠标停在点上可以看坐标）'), svg);
    }
    reset();
  }

  C.viz.register('cooccur-svd', { title: '共现矩阵与 SVD', mount });
})(window);
