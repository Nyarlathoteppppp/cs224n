/* RNN 一步步展开 (L04 p23–p31): “the students opened their exams” over an 8-word vocabulary. The same W_h, W_e, U
 * are drawn at every step; each step shows its predicted distribution, the true next word and J(t).
 * props.mode = 'unroll' (4.2: just the computation) or 'train' (4.3: teacher forcing, losses, and SGD on this one
 * sentence with BPTT). Parameters are small seeded random numbers (课件外); all maths from js/core/rnn.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, button, fmt, clear, texHTML } = C.dom;
  const RNN = C.core.rnn, L = C.core.linalg;

  const VOCAB = ['the', 'students', 'opened', 'their', 'exams', 'books', 'laptops', 'minds'];
  const SENT = [0, 1, 2, 3, 4];   // the students opened their exams
  const D = 3, DH = 4;

  function rng(seed) {   // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function init(seed) {
    const r = rng(seed), u = () => (r() * 2 - 1) * 0.8;
    const M = (a, b) => Array.from({ length: a }, () => Array.from({ length: b }, u));
    const v = (a) => Array.from({ length: a }, u);
    return { E: M(VOCAB.length, D), Wh: M(DH, DH), We: M(DH, D), b1: v(DH), U: M(VOCAB.length, DH), b2: v(VOCAB.length), h0: new Array(DH).fill(0) };
  }

  function mount(el, props) {
    const mode = (props && props.mode) || 'unroll';
    let p = init(7), shown = 1, trained = 0;
    const W = 760, H = 430, X = [175, 320, 465, 610], X0 = 50;
    const svg = s('svg', { class: 'viz-svg ru-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'RNN 按时间展开' });
    const cap = h('div.ru-cap');
    const stat = h('div.ru-stat');
    const prev = button('← 上一步', () => { shown = Math.max(1, shown - 1); render(); });
    const next = button('下一步 →', () => { shown = Math.min(4, shown + 1); render(); });
    const all = button('全部展开', () => { shown = 4; render(); });
    const trainBtn = button('训练 20 轮', () => train(20));
    const resetBtn = button('重置参数', () => { p = init(7); trained = 0; render(); });
    el.append(h('div.viz-row', prev, next, all, mode === 'train' ? [h('span.as-sep'), trainBtn, resetBtn] : null), svg, cap);
    if (mode === 'train') el.append(stat);

    function train(n) {
      for (let i = 0; i < n; i++) {
        const { grads } = RNN.bptt(p, SENT);
        Object.keys(grads).forEach((k) => {
          if (Array.isArray(p[k][0])) p[k] = p[k].map((row, a) => row.map((x, b) => x - 1.0 * grads[k][a][b]));
          else p[k] = p[k].map((x, a) => x - 1.0 * grads[k][a]);
        });
      }
      trained += n; shown = 4; render();
    }

    function cells(vals, x, y, w, cls) {
      const g = s('g', { class: 'ru-cells ' + cls });
      const n = vals.length, total = n * w;
      vals.forEach((v, i) => {
        const a = Math.max(-1, Math.min(1, v));
        g.append(s('rect', { x: x - total / 2 + i * w, y, width: w - 2, height: w - 2, rx: 2, class: 'ru-cell', style: 'fill:' + (a >= 0 ? 'var(--c-blue)' : 'var(--c-red)') + ';fill-opacity:' + (0.15 + 0.85 * Math.abs(a)) }));
      });
      return g;
    }
    function sub(base, idx, x, y, cls) {   // W_h with a real subscript
      const t = s('text', { x, y, class: cls });
      t.append(document.createTextNode(base));
      if (idx) t.append(s('tspan', { 'baseline-shift': 'sub', 'font-size': '9' }, idx));
      return t;
    }
    function arrow(x1, y1, x2, y2, cls, label, lx, ly) {
      const g = s('g', { class: 'ru-arrow ' + cls });
      g.append(s('line', { x1, y1, x2, y2, 'marker-end': 'url(#ru-head-' + cls + ')' }));
      if (label) g.append(sub(label[0], label[1], lx, ly, 'ru-alabel'));
      return g;
    }

    function render() {
      const r = RNN.forward(p, SENT);
      clear(svg);
      const defs = s('defs');
      ['wh', 'we', 'u'].forEach((k) => defs.append(s('marker', { id: 'ru-head-' + k, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, s('path', { d: 'M0,0 L10,5 L0,10 z', class: 'ru-head-' + k }))));
      svg.append(defs);
      // h(0)
      svg.append(s('text', { x: X0, y: 280, class: 'ru-name mid', text: 'h(0)' }), cells(p.h0, X0, 240, 14, 'is-h'));
      r.steps.forEach((st, t) => {
        const x = X[t], on = t < shown, cur = t === shown - 1;
        const g = s('g', { class: 'ru-step' + (on ? '' : ' is-off') + (cur ? ' is-cur' : '') });
        // input word and embedding
        g.append(s('text', { x, y: 418, class: 'ru-word', text: VOCAB[st.input] }));
        g.append(s('text', { x: x - 58, y: 418, class: 'ru-name', text: 'x(' + (t + 1) + ')' }));
        g.append(cells(st.e, x, 352, 16, 'is-e'), s('text', { x: x + 30, y: 364, class: 'ru-name', text: 'e(' + (t + 1) + ')' }));
        g.append(arrow(x, 348, x, 268, 'we', ['W', 'e'], x + 18, 312));
        // hidden state
        g.append(s('rect', { x: x - 36, y: 234, width: 72, height: 28, rx: 6, class: 'ru-hbox' }), cells(st.h, x, 240, 14, 'is-h'));
        g.append(s('text', { x: x - 8, y: 280, class: 'ru-name end', text: 'h(' + (t + 1) + ')' }));
        const px = t === 0 ? X0 : X[t - 1];
        g.append(arrow(px + 38, 248, x - 40, 248, 'wh', ['W', 'h'], (px + x) / 2, 238));
        g.append(arrow(x, 232, x, 178, 'u', ['U', ''], x + 14, 208));
        // output distribution
        const bw = 12, base = 168, top = 40, chartW = VOCAB.length * bw;
        const chart = s('g', { class: 'ru-chart' });
        chart.append(s('line', { x1: x - chartW / 2, y1: base, x2: x + chartW / 2, y2: base, class: 'ru-axis' }));
        st.yhat.forEach((pv, w) => {
          const hgt = (base - top) * pv;
          chart.append(s('rect', { x: x - chartW / 2 + w * bw + 1, y: base - hgt, width: bw - 2, height: hgt, class: 'ru-bar' + (mode === 'train' && w === st.target ? ' is-target' : '') }));
        });
        if (mode === 'train') {
          chart.append(s('text', { x, y: 28, class: 'ru-target', text: '真实下一个词：' + VOCAB[st.target] }));
          chart.append(s('text', { x, y: 14, class: 'ru-loss', text: 'P = ' + fmt(st.yhat[st.target], 2) + '，J(' + (t + 1) + ') = ' + fmt(st.loss, 2) }));
        }
        g.append(chart);
        svg.append(g);
      });
      svg.append(s('text', { x: 12, y: 104, class: 'ru-name', text: 'ŷ(t)' }), s('text', { x: 12, y: 120, class: 'ru-name small', text: '8 个词的概率' }));

      const st = r.steps[shown - 1];
      clear(cap);
      cap.append(h('div.ru-cap-title', '第 ' + shown + ' 步：输入 “' + VOCAB[st.input] + '”'),
        h('div.ru-cap-text', { html: texHTML('h^{(' + shown + ')} = \\sigma\\big(W_h\\,h^{(' + (shown - 1) + ')} + W_e\\,e^{(' + shown + ')} + b_1\\big)') + '：把上一步的隐状态和这个词的嵌入合起来。' + texHTML('\\hat y^{(' + shown + ')} = \\mathrm{softmax}(U\\,h^{(' + shown + ')} + b_2)') + ' 是对下一个词的预测（上面的 8 根柱子，顺序是 ' + VOCAB.join('、') + '）。' }),
        mode === 'train'
          ? h('div.ru-cap-text', '真实的下一个词是 “' + VOCAB[st.target] + '”，模型给了它 ' + fmt(st.yhat[st.target], 3) + '，这一步的损失 J(' + shown + ') = −log ' + fmt(st.yhat[st.target], 3) + ' = ' + fmt(st.loss, 3) + '。下一步输入的是真实的词 “' + VOCAB[st.target] + '”，不管模型猜了什么（teacher forcing）。')
          : h('div.ru-cap-text', { html: '每一步用的都是同一组 ' + texHTML('W_h') + '、' + texHTML('W_e') + '、' + texHTML('U') + '（图里同色的箭头）。句子再长，也只是把这一步多重复几次，参数一个也不会多。' }));
      if (mode === 'train') {
        clear(stat);
        stat.append(h('span', '已训练 ' + trained + ' 轮。'), h('span', { html: '平均损失 ' + texHTML('J = \\tfrac14\\sum_t J^{(t)} = ' + fmt(r.J, 3)) + '，困惑度 ' + texHTML('e^{J} = ' + fmt(r.perplexity, 2)) + '。' }),
          h('span.viz-note', trained ? '每一轮：前向算出 4 个损失，沿时间反向传播求梯度，再用梯度下降更新所有参数。只在这一句话上训练，所以模型很快就把它背下来了。' : '参数是随机的，模型还什么都没学：真实的下一个词拿到的概率都不高。点“训练 20 轮”看看会怎样。'));
      }
      prev.disabled = shown === 1; next.disabled = shown === 4;
    }
    render();
  }

  C.viz.register('rnn-unroll', { title: 'RNN 一步步展开', mount });
})(window);
