/* 位置向量与掩码 (L05 p43–p50; T08 [21:06]–[35:00]). Three tabs:
 * (1) “Zuko made his uncle” vs “his uncle made Zuko”: without positions every word's self-attention output is the
 *     same in both orders (only the rows move); adding position vectors breaks that.
 * (2) the 4 × 4 future mask on “[START] The chef who”: −∞ above the diagonal, 0 after softmax, rows sum to 1.
 * (3) a heatmap of sinusoidal position vectors (L05 p45).
 * Embeddings, Q, K, V, the position vectors of tab 1 and the scores of tab 2 are made-up (课件外);
 * all maths from js/core/attention.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, segmented, fmt, clear } = C.dom;
  const ATT = C.core.attention, P = C.core.prob, L = C.core.linalg;

  const EMB = { Zuko: [1, 0, 0.5], made: [0, 1, 0], his: [0.8, 0.2, 0.4], uncle: [0.3, 0, 1] };
  const Q = [[1, 0.5, 0], [0, 1, 0.5], [0.5, 0, 1]], K = [[1, 0, 0.5], [0.5, 1, 0], [0, 0.5, 1]];
  const POS = [[0.6, 0, 0], [0, 0.6, 0], [0, 0, 0.6], [0.4, 0.4, 0]];   // learned-style position vectors (made up)
  const A = ['Zuko', 'made', 'his', 'uncle'], B = ['his', 'uncle', 'made', 'Zuko'];
  const MW = ['[START]', 'The', 'chef', 'who'];
  const MS = [[1.2, 0.3, -0.5, 0.8], [0.4, 1.0, 0.2, -0.3], [0.1, 0.9, 1.5, 0.6], [0.3, 0.5, 1.1, 0.9]];

  function mount(el) {
    let tab = 'order', usePos = false, useMask = true;
    const body = h('div');
    el.append(h('div.viz-row', segmented([{ value: 'order', label: '① 打乱词序' }, { value: 'mask', label: '② 不能偷看未来' }, { value: 'sin', label: '③ 正弦位置编码' }], tab, (v) => { tab = v; render(); }, '实验')), body);

    function outputs(words) {
      const X = words.map((w, i) => (usePos ? L.add(EMB[w], POS[i]) : EMB[w].slice()));
      return ATT.selfAttention(X, Q, K, L.identity(3)).output;
    }
    function renderOrder() {
      const oa = outputs(A), ob = outputs(B);
      const toggle = h('label.as-check', h('input', { type: 'checkbox', checked: usePos || null, onchange: (e) => { usePos = e.target.checked; render(); } }), ' 给每个位置加上位置向量 p₁…p₄');
      const posNote = h('p.viz-note', 'p₁ = [0.6, 0, 0]，p₂ = [0, 0.6, 0]，p₃ = [0, 0, 0.6]，p₄ = [0.4, 0.4, 0]（编的，课件外；相当于可学习的位置向量，不是第三个标签页的正弦编码）。');
      const t = h('table.om-table');
      t.append(h('tr', h('th', '词'), h('th', '在 “Zuko made his uncle” 里的输出'), h('th', '在 “his uncle made Zuko” 里的输出'), h('th', '一样吗')));
      A.forEach((w, i) => {
        const j = B.indexOf(w), same = oa[i].every((v, d) => Math.abs(v - ob[j][d]) < 1e-9);
        t.append(h('tr', h('td', w), h('td', '[' + oa[i].map((v) => fmt(v, 3)).join(', ') + ']'), h('td', '[' + ob[j].map((v) => fmt(v, 3)).join(', ') + ']'), h('td' + (same ? '.is-same' : '.is-diff'), same ? '完全一样' : '不一样')));
      });
      body.append(h('p.viz-note', '两句话用的词完全相同，只是顺序不同（意思也不同：谁做给谁）。看每个词经过一层自注意力后的输出。'), toggle, posNote, t,
        h('div.vg-note', usePos
          ? '加上位置向量以后，同一个词在不同位置的输入不一样了，输出也就不一样：模型能区分词序了。'
          : '不加位置向量时，每个词的输出在两句话里一模一样，只是排在不同的行。自注意力只看“有哪些词”，看不出它们的先后。'));
    }
    function renderMask() {
      const toggle = h('label.as-check', h('input', { type: 'checkbox', checked: useMask || null, onchange: (e) => { useMask = e.target.checked; render(); } }), ' 打开掩码');
      const scores = MS.map((row, i) => row.map((v, j) => (useMask && j > i ? -Infinity : v)));
      const weights = scores.map((row) => P.softmax(row));
      const grid = (title, M, isW) => {
        const t = h('table.om-mask');
        t.append(h('tr', h('th', ''), MW.map((w) => h('th', w))));
        M.forEach((row, i) => t.append(h('tr', h('th', MW[i]), row.map((v, j) => h('td' + (useMask && j > i ? '.is-masked' : ''), { style: isW ? { background: 'color-mix(in srgb, var(--c-blue) ' + Math.round(v * 100) + '%, var(--surface))' } : null }, v === -Infinity ? '−∞' : fmt(v, 2))))));
        return h('figure.sa-fig', h('figcaption', title), t);
      };
      body.append(h('p.viz-note', '算 “[START] The chef who” 每个位置的表示时，每一行是一个词作为 query，每一列是它可以看的词。'), toggle,
        h('div.sa-grid', grid(useMask ? '分数（未来的位置设为 −∞）' : '分数（没有掩码，未来的位置照常打分）', scores, false), grid('softmax 后的权重（每行和为 1）', weights, true)),
        h('div.vg-note', useMask
          ? '对角线右上方都是 −∞，e^(−∞) = 0，所以这些位置的权重正好是 0。chef 这一行只看 [START]、The、chef，用它来预测下一个词 who 不算作弊。整张表仍然一次算完，并行没有受影响。'
          : '没有掩码时，The 这一行也能看到后面的 chef、who。训练时让它预测下一个词 chef，等于把答案给它看了。'));
    }
    function renderSin() {
      const n = 50, d = 32, PE = ATT.sinusoidal(n, d, 'l05');
      const W = 760, H = 230, cw = (W - 80) / n, ch = (H - 30) / d;
      const svg = s('svg', { class: 'viz-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': '正弦位置编码热力图' });
      PE.forEach((row, i) => row.forEach((v, k) => svg.append(s('rect', { x: 60 + i * cw, y: 4 + k * ch, width: cw + 0.5, height: ch + 0.5, style: 'fill:' + (v >= 0 ? 'var(--c-blue)' : 'var(--c-red)') + ';fill-opacity:' + Math.abs(v).toFixed(3) }))));
      svg.append(s('text', { x: 60, y: H - 6, class: 'vg-tick', style: 'text-anchor:start', text: '位置 1' }), s('text', { x: W - 20, y: H - 6, class: 'vg-tick', text: '位置 50 →' }));
      svg.append(s('text', { x: 52, y: 14, class: 'vg-tick', text: '第 1 维' }), s('text', { x: 52, y: H - 28, class: 'vg-tick', text: '第 32 维' }));
      body.append(h('p.viz-note', '每一列是一个位置的位置向量（32 维），每一行是一维。蓝正红负，颜色越深绝对值越大。'), svg,
        h('div.vg-note', '每两维一组（一个正弦、一个余弦，周期相同），上面几组变化得快，下面几组变化得慢。每个位置得到一个独一无二的向量。'));
    }
    function render() {
      clear(body);
      if (tab === 'order') renderOrder(); else if (tab === 'mask') renderMask(); else renderSin();
    }
    render();
  }

  C.viz.register('order-mask', { title: '位置向量与掩码', mount });
})(window);
