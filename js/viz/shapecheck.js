/* 梯度的形状 (L03 p49–p52): choose the hidden size n and input size m; list each quantity's shape, then fill the
 * outer product δᵀxᵀ cell by cell. The numbers are small made-up values (课件外); products from js/core/linalg.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, slider, texHTML } = C.dom;
  const L = C.core.linalg;

  // δ₁, δ₂ and x₁…x₃ are the chapter's example (δ ≈ [0.301, −0.086], x = [1, 2, −1]); the rest are made up (课件外)
  const DELTA = [0.301, -0.086, 0.5, 0.2, -0.4], X = [1, 2, -1, 0.5, 3, -2];
  const f = (v) => (Math.round(v * 100) / 100 || 0).toString().replace('-', '−');

  function mount(el) {
    let n = 2, m = 3, sel = [0, 0];
    const shapes = h('table.sc-table'), grid = h('div.sc-grid'), note = h('p.sc-note');
    const sn = slider('隐藏层大小 n', { min: 1, max: 5, step: 1, value: n, format: String, onInput: (v) => { n = v; sel = [0, 0]; render(); } });
    const sm = slider('输入长度 m', { min: 1, max: 6, step: 1, value: m, format: String, onInput: (v) => { m = v; sel = [0, 0]; render(); } });
    el.append(h('div.viz-row', sn, sm), shapes, h('div.sc-head', { html: '外积 ' + texHTML('\\partial s/\\partial W = \\delta^\\top x^\\top') + '：点一个格子' }),
      h('p.viz-note', 'n = 2、m = 3 时就是上一节的例子：δ ≈ [0.301, −0.086]（这里显示两位小数），x = [1, 2, −1]。把 n、m 调大后多出来的数是编的（课件外）。'), grid, note);
    function render() {
      const rows = [
        ['W', n + ' × ' + m, '参数'], ['x', m + ' × 1', '输入'], ['z = Wx + b', n + ' × 1', '（' + n + ' × ' + m + '）（' + m + ' × 1）→ ' + n + ' × 1'],
        ['\\delta^\\top', n + ' × 1', '误差信号，转置成一列'], ['x^\\top', '1 × ' + m, '输入，转置成一行'],
        ['\\partial s/\\partial W = \\delta^\\top x^\\top', n + ' × ' + m, '（' + n + ' × 1）（1 × ' + m + '）→ ' + n + ' × ' + m + '，和 W 同形 ✓'],
        ['\\partial s/\\partial b = \\delta^\\top', n + ' × 1', '和 b 同形 ✓'], ['\\partial s/\\partial x = W^\\top\\delta^\\top', m + ' × 1', '（' + m + ' × ' + n + '）（' + n + ' × 1）→ ' + m + ' × 1，和 x 同形 ✓'],
      ];
      shapes.innerHTML = '<tr><th>量</th><th>形状</th><th>怎么来的</th></tr>' + rows.map((r) => '<tr><td>' + texHTML(r[0]) + '</td><td class="sc-shape">' + r[1] + '</td><td>' + r[2] + '</td></tr>').join('');
      const d = DELTA.slice(0, n), x = X.slice(0, m), G = L.outer(d, x);
      grid.innerHTML = '';
      grid.style.gridTemplateColumns = '84px repeat(' + m + ', minmax(0, 64px))';
      grid.append(h('span.sc-corner', ''), ...x.map((v, j) => h('span.sc-x' + (j === sel[1] ? '.on' : ''), 'x' + (j + 1) + ' = ' + f(v))));
      d.forEach((dv, i) => {
        grid.append(h('span.sc-d' + (i === sel[0] ? '.on' : ''), 'δ' + (i + 1) + ' = ' + f(dv)));
        x.forEach((xv, j) => grid.append(h('button.sc-cell' + (i === sel[0] && j === sel[1] ? '.on' : ''), { type: 'button', onclick: () => { sel = [i, j]; render(); } }, f(G[i][j]))));
      });
      const [i, j] = sel;
      note.innerHTML = '第 ' + (i + 1) + ' 行第 ' + (j + 1) + ' 列：' + texHTML('\\partial s/\\partial W_{' + (i + 1) + (j + 1) + '} = \\delta_' + (i + 1) + ' x_' + (j + 1)) + ' = ' + f(d[i]) + ' × ' + f(x[j]) + ' = <b>' + f(G[i][j]) + '</b>。权重 W' + (i + 1) + (j + 1) + ' 把输入 x' + (j + 1) + ' 送进 z' + (i + 1) + '，所以它的梯度是“z' + (i + 1) + ' 处的误差信号 × x' + (j + 1) + '”。';
    }
    render();
  }

  C.viz.register('shape-check', { title: '梯度的形状', mount });
})(window);
