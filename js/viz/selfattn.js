/* 自注意力的 Q、K、V (L05 p42, p56; T08 [14:56]–[19:59], [45:17]–[47:00]): “Zuko made his uncle tea”.
 * X (one row per word) → XQ, XK, XV → all-pairs scores XQ(XK)ᵀ → softmax per row → weights · XV. Clicking a score
 * cell shows which query row and key row it came from. Embeddings and Q, K, V are made-up 3 × 3 numbers (课件外);
 * every number is computed by js/core/attention.js selfAttention. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, segmented, fmt, clear, texHTML } = C.dom;
  const ATT = C.core.attention;

  const WORDS = ['Zuko', 'made', 'his', 'uncle', 'tea'];
  const X = [[1, 0, 0.5], [0, 1, 0], [0.8, 0.2, 0.4], [0.3, 0, 1], [0, 0.6, 0.8]];
  const Q = [[1, 0.5, 0], [0, 1, 0.5], [0.5, 0, 1]];
  const K = [[1, 0, 0.5], [0.5, 1, 0], [0, 0.5, 1]];
  const V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const R = ATT.selfAttention(X, Q, K, V);

  function mount(el) {
    let sel = [2, 0], show = 'scores';
    const top = h('div.sa-grid'), bottom = h('div.sa-grid'), note = h('div.sa-note');
    el.append(
      h('div.viz-row', segmented([{ value: 'scores', label: '分数 XQ(XK)ᵀ' }, { value: 'weights', label: 'softmax 后的权重' }], show, (v) => { show = v; render(); }, '显示'), h('span.viz-note', '点表里的任意一格')),
      top, bottom, note);

    function matrix(title, M, opts) {
      const o = opts || {};
      const t = h('table.sa-mat' + (o.cls ? '.' + o.cls : ''));
      if (o.cols) t.append(h('tr', h('th', ''), o.cols.map((c, j) => h('th' + (o.selCol === j ? '.is-sel' : ''), c))));
      M.forEach((row, i) => {
        const tr = h('tr', h('th' + (o.selRow === i ? '.is-sel' : ''), o.rows ? o.rows[i] : ''));
        row.forEach((v, j) => {
          const on = (o.selRow === i && (o.selCol === undefined || o.selCol === j)) || (o.selCol === j && o.colHighlight);
          const heat = o.heat ? { background: 'color-mix(in srgb, var(--c-blue) ' + Math.round(Math.max(0, Math.min(1, o.heat(v))) * 100) + '%, var(--surface))' } : null;
          const td = h('td' + (on ? '.is-sel' : ''), { style: heat }, fmt(v, 2));
          if (o.click) td.addEventListener('click', () => o.click(i, j));
          tr.append(td);
        });
        t.append(tr);
      });
      return h('figure.sa-fig', h('figcaption', { html: title }), t);
    }

    function render() {
      const [i, j] = sel;
      clear(top); clear(bottom); clear(note);
      const dcols = ['1', '2', '3'];
      top.append(
        matrix(texHTML('X') + '：每行一个词', X, { rows: WORDS, cols: dcols, selRow: i }),
        matrix(texHTML('XQ') + '：每行是 query', R.queries, { rows: WORDS.map((w, k) => 'q' + (k + 1)), cols: dcols, selRow: i, cls: 'is-q' }),
        matrix(texHTML('XK') + '：每行是 key', R.keys, { rows: WORDS.map((w, k) => 'k' + (k + 1)), cols: dcols, selRow: j, cls: 'is-k' }),
        matrix(texHTML('XV') + '：每行是 value', R.values, { rows: WORDS.map((w, k) => 'v' + (k + 1)), cols: dcols, cls: 'is-v' }));
      const M = show === 'scores' ? R.scores : R.weights;
      const maxS = Math.max(...R.scores.flat());
      bottom.append(
        matrix(show === 'scores' ? '分数：第 i 行第 j 列 = ' + texHTML('q_i^\\top k_j') : '权重：每一行 softmax，行和为 1', M, { rows: WORDS, cols: WORDS, selRow: i, selCol: j, click: (a, b) => { sel = [a, b]; render(); }, heat: show === 'scores' ? (v) => v / maxS : (v) => v, cls: 'is-big' }),
        matrix('输出 = 权重 × ' + texHTML('XV') + '：每行是一个词的新表示', R.output, { rows: WORDS, cols: dcols, selRow: i, cls: 'is-o' }));
      const q = R.queries[i], k = R.keys[j];
      note.append(
        h('div', { html: '第 ' + (i + 1) + ' 行第 ' + (j + 1) + ' 列：' + texHTML('q_{' + (i + 1) + '}^\\top k_{' + (j + 1) + '}') + ' = ' + q.map((x, d) => fmt(x, 2) + '×' + fmt(k[d], 2)).join(' + ') + ' = <b>' + fmt(R.scores[i][j], 2) + '</b>：“' + WORDS[i] + '” 的 query 和 “' + WORDS[j] + '” 的 key 有多像。' }),
        h('div', '“' + WORDS[i] + '” 这一行 softmax 后，给 “' + WORDS[j] + '” 的权重是 ' + fmt(R.weights[i][j], 3) + '；“' + WORDS[i] + '” 的输出是 5 个 value 按这一行的权重加起来。'),
        h('div.viz-note', '五个词的分数一次矩阵乘法就全算出来了，不用按顺序一个词一个词地等。数字是编的（课件外），这里 V 取了单位矩阵，所以 value 就是词向量本身。'));
    }
    render();
  }

  C.viz.register('self-attn', { title: '自注意力的 Q、K、V', mount });
})(window);
