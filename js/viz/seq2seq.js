/* 编码器-解码器 (L04 p53–p58; L05 p16–p21): “il m' a entarté” → “he hit me with a pie”. Step through the encoder
 * reading the source, the hand-over of its last state (the only channel: the bottleneck), and the decoder writing.
 * Two modes as on the slides: test time (each output fed back as the next input) and training time (true target
 * words as inputs, one loss J_t per step, backpropagation end to end). Structure only, no numbers. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, segmented, button, clear } = C.dom;

  const SRC = ['il', 'm’', 'a', 'entarté'];
  const TGT_IN = ['<START>', 'he', 'hit', 'me', 'with', 'a', 'pie'];
  const TGT_OUT = ['he', 'hit', 'me', 'with', 'a', 'pie', '<END>'];
  // test time: a made-up slip at step 5 (“the” for “a”, 课件外) shows that the decoder's own output, right or wrong,
  // becomes its next input; at training time the input is always the true word
  const TEST_OUT = ['he', 'hit', 'me', 'with', 'the', 'pie', '<END>'];
  const TEST_IN = ['<START>'].concat(TEST_OUT.slice(0, 6));

  function mount(el) {
    let mode = 'test', k = 0;
    const N = SRC.length + 1 + TGT_IN.length;   // encoder steps, hand-over, decoder steps
    const W = 760, H = 270;
    const svg = s('svg', { class: 'viz-svg s2-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': '编码器-解码器' });
    const cap = h('div.s2-cap');
    const prev = button('← 上一步', () => { k = Math.max(0, k - 1); render(); });
    const next = button('下一步 →', () => { k = Math.min(N, k + 1); render(); });
    const all = button('全部走完', () => { k = N; render(); });
    const reset = button('重来', () => { k = 0; render(); });
    el.append(h('p.viz-note', '这是计算流程示意，没有运行翻译模型。测试模式的英文词是预设的示例；训练模式上方列出的是真实译文，作为计算损失的监督目标，不代表模型已经预测正确。'), h('div.viz-row', segmented([{ value: 'test', label: '测试时：逐词生成' }, { value: 'train', label: '训练时：算损失' }], mode, (v) => { mode = v; k = 0; render(); }, '模式'), prev, next, all, reset), svg, cap);

    const ex = (i) => 40 + i * 64, dx = (j) => 330 + j * 60, cy = 150;
    function cell(x, y, cls, on) { return s('rect', { x: x - 20, y: y - 18, width: 40, height: 36, rx: 7, class: 's2-cell ' + cls + (on ? ' is-on' : '') }); }
    function arrow(x1, y1, x2, y2, cls) { return s('line', { x1, y1, x2, y2, class: 's2-arrow ' + cls, 'marker-end': 'url(#s2-head-' + cls.split(' ')[0] + ')' }); }

    function render() {
      clear(svg);
      const defs = s('defs');
      ['enc', 'dec', 'feed', 'bot', 'back'].forEach((c) => defs.append(s('marker', { id: 's2-head-' + c, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, s('path', { d: 'M0,0 L10,5 L0,10 z', class: 's2-headp-' + c }))));
      svg.append(defs);
      svg.append(s('text', { x: ex(0) - 20, y: 28, class: 's2-title is-enc', text: '编码器 RNN：读法语' }), s('text', { x: dx(0) - 20, y: 28, class: 's2-title is-dec', text: '解码器 RNN：写英语（一个条件语言模型）' }));
      // encoder
      SRC.forEach((w, i) => {
        const on = k > i;
        if (i > 0) svg.append(arrow(ex(i - 1) + 21, cy, ex(i) - 22, cy, 'enc' + (on ? '' : ' is-off')));
        svg.append(cell(ex(i), cy, 'is-enc' + (i === SRC.length - 1 ? ' is-last' : ''), on));
        svg.append(arrow(ex(i), cy + 52, ex(i), cy + 20, 'enc' + (on ? '' : ' is-off')), s('text', { x: ex(i), y: cy + 68, class: 's2-word' + (on ? '' : ' is-off'), text: w }));
      });
      // hand-over: the bottleneck
      const handed = k > SRC.length;
      svg.append(s('path', { d: 'M' + (ex(3) + 21) + ',' + cy + ' C' + (ex(3) + 50) + ',' + (cy - 60) + ' ' + (dx(0) - 60) + ',' + (cy - 60) + ' ' + (dx(0) - 22) + ',' + cy, class: 's2-arrow bot' + (handed ? '' : ' is-off'), 'marker-end': 'url(#s2-head-bot)' }));
      svg.append(s('text', { x: dx(0) - 34, y: cy - 62, style: 'text-anchor:end', class: 's2-bot-label' + (handed ? '' : ' is-off'), text: '唯一的通道：最后一个隐状态' }));
      svg.append(s('text', { x: dx(0) - 20, y: 46, class: 's2-sub', text: mode === 'test' ? '输入行：上一步自己生成的词（粉色虚线送回来），对错都照用' : '输入行：平行语料里的真实译文，不管模型猜了什么' }));
      if (mode === 'train') svg.append(s('text', { x: dx(0) - 20, y: 62, class: 's2-sub', text: '输出上方的词：监督目标；J 用模型给目标词的概率来算' }));
      const IN = mode === 'test' ? TEST_IN : TGT_IN, OUT = mode === 'test' ? TEST_OUT : TGT_OUT;
      // decoder
      IN.forEach((w, j) => {
        const step = SRC.length + 1 + j, on = k >= step + 1, cur = k === step + 1;
        if (j > 0) svg.append(arrow(dx(j - 1) + 21, cy, dx(j) - 22, cy, 'dec' + (on ? '' : ' is-off')));
        svg.append(cell(dx(j), cy, 'is-dec' + (cur ? ' is-cur' : ''), on));
        svg.append(arrow(dx(j), cy + 52, dx(j), cy + 20, 'dec' + (on ? '' : ' is-off')));
        svg.append(s('text', { x: dx(j), y: cy + 68, class: 's2-word' + (on ? '' : ' is-off') + (mode === 'test' && j > 0 ? ' is-fed' : '') + (w !== TGT_IN[j] ? ' is-wrong' : ''), text: w }));
        svg.append(arrow(dx(j), cy - 20, dx(j), cy - 44, 'dec' + (on ? '' : ' is-off')));
        svg.append(s('text', { x: dx(j), y: cy - 52, class: 's2-out' + (on ? '' : ' is-off') + (OUT[j] !== TGT_OUT[j] ? ' is-wrong' : ''), text: OUT[j] }));
        if (mode === 'test' && j < IN.length - 1 && on) {
          svg.append(s('path', { d: 'M' + (dx(j) + 14) + ',' + (cy - 56) + ' C' + (dx(j) + 34) + ',' + (cy - 56) + ' ' + (dx(j) + 26) + ',' + (cy + 62) + ' ' + (dx(j + 1) - 16) + ',' + (cy + 62), class: 's2-arrow feed', 'marker-end': 'url(#s2-head-feed)' }));
        }
        if (mode === 'train' && on) svg.append(s('text', { x: dx(j), y: cy - 72, class: 's2-loss', text: 'J' + (j + 1) }));
      });
      if (mode === 'test') svg.append(s('text', { x: dx(6) + 20, y: cy - 75, class: 's2-note-t', text: '每步取概率最大的词（argmax），作为下一步的输入' }));
      if (mode === 'train' && k === N) {
        svg.append(s('line', { x1: dx(6) + 10, y1: cy + 92, x2: ex(0) - 10, y2: cy + 92, class: 's2-arrow back', 'marker-end': 'url(#s2-head-back)' }));
        svg.append(s('text', { x: (ex(0) + dx(6)) / 2, y: cy + 108, class: 's2-back-label', text: 'J = (J1 + … + J7) / 7，从解码器一直反向传播到编码器（端到端）' }));
      }
      // caption
      clear(cap);
      let title, text;
      if (k === 0) { title = '开始'; text = '编码器的隐状态从全 0 开始。点“下一步”。'; }
      else if (k <= SRC.length) { title = '编码器读入 “' + SRC[k - 1] + '”'; text = '编码器就是一个 RNN（实际中常是 LSTM），一个词一个词地读法语。它不输出任何词，只更新隐状态。' + (k === SRC.length ? '读完最后一个词，它的隐状态就是“整句法语的编码”。' : ''); }
      else if (k === SRC.length + 1) { title = '交接：瓶颈'; text = '编码器最后一个隐状态，作为解码器的初始隐状态。整句法语的所有信息，都只能通过这一个向量交给解码器。课件把它叫作“瓶颈”。'; }
      else {
        const j = k - SRC.length - 2;
        const IN = mode === 'test' ? TEST_IN : TGT_IN, OUT = mode === 'test' ? TEST_OUT : TGT_OUT;
        title = '解码器第 ' + (j + 1) + ' 步：输入 “' + IN[j] + '”，' + (mode === 'test' ? '输出' : '监督目标') + ' “' + OUT[j] + '”';
        text = mode === 'test'
          ? (j === 0 ? '第一个输入是表示“开始”的 <START>。' : OUT[j - 1] !== TGT_OUT[j - 1] ? '输入的是上一步自己生成的词，哪怕它是错的：上一步把 a 写成了 the（课件外的示意），这一步只能接着它往下写。' : OUT[j] !== TGT_OUT[j] ? '这一步生成错了：该是 a，却写成了 the（课件外的示意）。测试时没有正确答案可看，这个错词会成为下一步的输入。' : '输入的是上一步自己生成的词。') + '解码器是一个语言模型，但它的起点是法语的编码，所以叫条件语言模型。' + (TGT_OUT[j] === '<END>' ? '生成 <END>，翻译结束。' : '')
          : '训练时，输入的是平行语料里真实的英文词（teacher forcing）；输出处算一个损失 J' + (j + 1) + ' = −log P(真实的 “' + TGT_OUT[j] + '”)。' + (j === TGT_IN.length - 1 ? '七个损失取平均，就是这一句的损失。' : '');
      }
      cap.append(h('div.s2-cap-title', title), h('div.s2-cap-text', text));
      prev.disabled = k === 0; next.disabled = all.disabled = k === N;
    }
    render();
  }

  C.viz.register('seq2seq', { title: '编码器-解码器', mount });
})(window);
