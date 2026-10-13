/* 三种 Transformer (L05 p52–p66; T08 [66:31]–[71:55]; N07 §3.5–3.7): block diagrams of the decoder, the encoder and
 * the encoder-decoder. Switching between them changes only the mask on self-attention and the cross-attention
 * layer; those two are highlighted. Clicking a box explains it. Structure only, no numbers. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, segmented, clear } = C.dom;

  const INFO = {
    emb: ['嵌入 + 位置向量', '查出每个词的词向量，加上位置向量（第 5.3 章）。'],
    mself: ['带掩码的多头自注意力', '每个词只看自己和前面的词（第 5.3 章的掩码），用多个头、缩放点积（第 5.4 章）。'],
    self: ['多头自注意力（不带掩码）', '每个词看整句话里的所有词，两边的上下文都能用，就像双向 RNN（第 4.5 章）。'],
    cross: ['交叉注意力', 'query 来自解码器这一层的向量，key 和 value 来自编码器最后的输出。解码器的每个词都能看源句子的每个词（第 5.1 章的注意力）。'],
    norm: ['Add & Norm', '残差连接加上输入，再做层归一化（第 5.4 章）。'],
    ff: ['前馈网络', '每个位置各自过同一个两层网络，提供非线性（第 5.3 章）。'],
    out: ['线性层 + softmax', '把最上面的向量变成词表大小的分数，softmax 得到下一个词的概率。'],
  };
  const STACK = {
    decoder: ['emb', 'mself', 'norm', 'ff', 'norm', 'out'],
    encoder: ['emb', 'self', 'norm', 'ff', 'norm'],
    dec2: ['emb', 'mself', 'norm', 'cross', 'norm', 'ff', 'norm', 'out'],
  };
  const NOTE = {
    decoder: '解码器：用来做语言模型，一个词一个词地生成。GPT-2、GPT-3 都是这种结构（官方 notes）。',
    encoder: '编码器：和解码器只差一处，去掉了掩码，每个词都能看两边。第 6 部分的 BERT 就是这种结构。',
    'enc-dec': '编码器-解码器：Transformer 论文最初的样子，用于机器翻译。左边编码器读源句子（不带掩码），右边解码器生成译文（带掩码），中间多了一层交叉注意力。',
  };

  function mount(el) {
    let form = 'decoder', sel = null;
    const svg = s('svg', { class: 'viz-svg tb-svg', viewBox: '0 0 760 420', role: 'img', 'aria-label': 'Transformer 结构图' });
    const note = h('div.vg-note');
    el.append(h('div.viz-row', segmented([{ value: 'decoder', label: '解码器' }, { value: 'encoder', label: '编码器' }, { value: 'enc-dec', label: '编码器-解码器' }], form, (v) => { form = v; sel = null; render(); }, '形态')), svg, note);

    function stack(keys, x, title, blockFrom, blockTo) {
      const g = s('g');
      const bh = 34, gap = 10, y0 = 380;
      const ys = keys.map((_, i) => y0 - i * (bh + gap));
      g.append(s('text', { x: x + 110, y: 18, class: 'sl-title', style: 'text-anchor:middle', text: title }));
      g.append(s('text', { x: x + 110, y: 412, class: 'vg-tick mid', style: 'fill:var(--muted)', text: '输入的词' }));
      // the repeated block
      const top = ys[blockTo] - 6, bottom = ys[blockFrom] + bh + 6;
      g.append(s('rect', { x: x - 10, y: top, width: 240, height: bottom - top, rx: 10, class: 'tb-block' }));
      g.append(s('text', { x: x - 4, y: top - 4, class: 'vg-tick', style: 'text-anchor:start', text: '× N 层（每层参数各不相同）' }));
      keys.forEach((k, i) => {
        if (i > 0) g.append(s('line', { x1: x + 110, y1: ys[i - 1], x2: x + 110, y2: ys[i] + bh, class: 'tb-flow' }));
        const cls = 'tb-box is-' + k + (sel === k ? ' is-sel' : '');
        const box = s('g', { class: cls, style: 'cursor:pointer' });
        box.append(s('rect', { x, y: ys[i], width: 220, height: bh, rx: 7 }), s('text', { x: x + 110, y: ys[i] + 22, text: INFO[k][0] }));
        if (k === 'mself') box.append(s('text', { x: x + 226, y: ys[i] + 22, class: 'tb-tag is-mask', text: '掩码' }));
        if (k === 'cross') box.append(s('text', { x: x + 226, y: ys[i] + 22, class: 'tb-tag is-cross', text: '交叉' }));
        box.addEventListener('click', () => { sel = k; render(); });
        g.append(box);
      });
      return { g, ys, bh };
    }

    function render() {
      clear(svg);
      svg.append(s('defs', s('marker', { id: 'tb-head', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' }, s('path', { d: 'M0,0 L10,5 L0,10 z', class: 'tb-headp' }))));
      if (form === 'enc-dec') {
        const e = stack(STACK.encoder, 40, '编码器', 1, 4);
        const d = stack(STACK.dec2, 450, '解码器', 1, 6);
        svg.append(e.g, d.g);
        const fromY = e.ys[4] + 4, toY = d.ys[3] + d.bh / 2;
        svg.append(s('path', { d: 'M260,' + fromY + ' C 360,' + (fromY - 60) + ' 380,' + toY + ' 448,' + toY, class: 'tb-cross', 'marker-end': 'url(#tb-head)' }));
        svg.append(s('text', { x: 350, y: Math.min(fromY, toY) - 30, class: 'tb-tag is-cross', style: 'text-anchor:middle', text: '编码器的输出 → key、value' }));
      } else {
        const keys = STACK[form];
        const st = stack(keys, 270, form === 'decoder' ? '解码器' : '编码器', 1, 4);
        svg.append(st.g);
      }
      clear(note);
      note.append(sel ? h('div', h('b', INFO[sel][0] + '：'), INFO[sel][1]) : h('div', NOTE[form]));
      note.append(h('div.viz-note', '红色“掩码”和橙色“交叉”标出了三种形态之间仅有的两处不同。点任意一个方块看说明。'));
    }
    render();
  }

  C.viz.register('transformer-block', { title: '三种 Transformer', mount });
})(window);
