/* 矩阵乘向量：W (3×2) times x (2). Two views of the same product: each row dotted with x, or the columns of W
 * weighted by the entries of x and added. Numbers from js/core/linalg.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, slider, segmented, button } = C.dom;
  const L = C.core.linalg;

  const W = [[1, 2], [0, 1], [3, -1]];
  const n = (v) => String(Math.round(v * 100) / 100 || 0).replace('-', '−');
  const p = (v) => (v < 0 ? '(' + n(v) + ')' : n(v));

  function mount(el) {
    let x = [2, 1], view = 'rows', row = 0;

    const cellsW = W.map((r, i) => r.map((v, j) => h('span.mv-cell', { dataset: { i, j } }, n(v))));
    const cellsX = [0, 1].map((j) => h('span.mv-cell.x', { dataset: { j } }));
    const cellsY = [0, 1, 2].map((i) => h('span.mv-cell.y', { dataset: { i } }));
    const grid = h('div.mv-eq',
      h('div.mv-block', h('div.mv-name', 'W（3×2）'), h('div.mv-mat.w', cellsW.flat())),
      h('div.mv-op', '×'),
      h('div.mv-block', h('div.mv-name', 'x（2 维）'), h('div.mv-mat.col', cellsX)),
      h('div.mv-op', '='),
      h('div.mv-block', h('div.mv-name', 'Wx（3 维）'), h('div.mv-mat.col', cellsY)));
    const work = h('div.mv-work');
    const rowNav = h('div.viz-row',
      button('◀ 上一行', () => { row = (row + 2) % 3; render(); }),
      button('下一行 ▶', () => { row = (row + 1) % 3; render(); }, 'primary'));
    const views = segmented([{ value: 'rows', label: '看行：每一行和 x 做点积' }, { value: 'cols', label: '看列：用 x 给各列加权再相加' }], view,
      (v) => { view = v; render(); }, '两种看法');
    const sliders = [0, 1].map((j) => slider('x' + (j + 1), { min: -3, max: 3, step: 0.5, value: x[j], format: n, onInput: (v) => { x[j] = v; render(); } }));

    el.append(h('div.viz-row', views), h('div.viz-row', sliders), grid, rowNav, work);

    function render() {
      const y = L.matvec(W, x);
      cellsX.forEach((c, j) => { c.textContent = n(x[j]); });
      cellsY.forEach((c, i) => { c.textContent = n(y[i]); });
      rowNav.style.display = view === 'rows' ? '' : 'none';
      const all = [...cellsW.flat(), ...cellsX, ...cellsY];
      all.forEach((c) => c.classList.remove('hl', 'hl2', 'dim'));
      if (view === 'rows') {
        cellsW.forEach((r, i) => r.forEach((c) => c.classList.add(i === row ? 'hl' : 'dim')));
        cellsX.forEach((c) => c.classList.add('hl'));
        cellsY.forEach((c, i) => c.classList.add(i === row ? 'hl' : 'dim'));
        const terms = W[row].map((w, j) => n(w) + '×' + p(x[j])).join(' + ');
        work.innerHTML = '第 ' + (row + 1) + ' 行 <b>[' + W[row].map(n).join(', ') + ']</b> 和 x 做点积：' + terms + ' = <b>' + n(y[row]) + '</b>，这就是结果的第 ' + (row + 1) + ' 个数。';
      } else {
        cellsW.forEach((r) => r.forEach((c, j) => c.classList.add(j === 0 ? 'hl' : 'hl2')));
        cellsX.forEach((c, j) => c.classList.add(j === 0 ? 'hl' : 'hl2'));
        const col = (j) => '[' + W.map((r) => n(r[j])).join(', ') + ']';
        work.innerHTML = '<span class="mv-c1">' + p(x[0]) + ' × 第 1 列 ' + col(0) + '</span> + <span class="mv-c2">' + p(x[1]) + ' × 第 2 列 ' + col(1) + '</span> = <b>[' + y.map(n).join(', ') + ']</b>。' +
          '结果和逐行点积完全一样：x 的每个数决定对应那一列“用多少”。';
      }
    }
    render();
  }

  C.viz.register('matvec', { title: '矩阵乘向量', mount });
})(window);
