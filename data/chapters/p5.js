/* Part 5 · 注意力与 Transformer (W26 Lecture 5; COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
    {
      id: 'c5-1', part: 'p5', seq: 1, num: '5.1', stub: true, lectures: '第 5 讲',
      title: '注意力', en: 'Attention',
      hook: '解码器每写一个词，都可以回头看一眼原文的任意位置。它怎么决定看哪里、看多少？',
      goals: ['一步步算出 seq2seq 注意力：分数 → 权重 → 加权和', '解释注意力怎么解决瓶颈和梯度消失', '用 query、key、value 说出注意力的一般形式'],
      prereq: [{ text: 'seq2seq 与瓶颈', ch: 'c4-6' }, { text: '点积', ch: 'c0-1' }, { text: 'softmax', ch: 'c1-3' }],
      topics: [
        { id: 'seq2seq-attn', title: '给解码器一条直通原文的路', question: '翻译 “he” 的时候，解码器在看原文的哪个词？', visuals: [{ id: 'attention-steps' }, { id: 'seq2seq-attention', type: 'video' }] },
        { id: 'qkv', title: '注意力的一般形式', question: '抛开翻译，注意力本质上是在做什么？', visuals: [{ id: 'soft-lookup' }] },
      ],
      source: 'CS224N 第 5 讲；官方 notes（NMT 与注意力）。',
    },
    {
      id: 'c5-2', part: 'p5', seq: 2, num: '5.2', stub: true, lectures: '第 5 讲',
      title: '自注意力', en: 'Self-attention',
      hook: '如果注意力这么好用，能不能干脆把 RNN 扔掉，让句子里的每个词直接看所有的词？',
      goals: ['说出 RNN 的两个根本问题', '写出自注意力的三步：Q/K/V → 分数与权重 → 加权和', '把自注意力写成矩阵形式，并说出它为什么能并行'],
      prereq: [{ text: '注意力', ch: 'c5-1' }, { text: '矩阵乘法', ch: 'c0-1' }],
      topics: [
        { id: 'why', title: 'RNN 的两个根本问题', question: '离得远的词要隔多少步才能交互？为什么 RNN 没法并行？' },
        { id: 'selfattn', title: 'Q、K、V', question: '每个词怎么同时扮演“提问者”、“被比较者”和“被取用的内容”？', visuals: [{ id: 'self-attn' }, { id: 'self-attention', type: 'video' }] },
        { id: 'matrix', title: '矩阵形式', question: '怎么用一次矩阵乘法算出所有词对的分数？' },
      ],
      source: 'CS224N 第 5 讲；官方 notes（自注意力与 Transformer）。',
    },
    {
      id: 'c5-3', part: 'p5', seq: 3, num: '5.3', stub: true, lectures: '第 5 讲',
      title: '从自注意力到 Transformer block：三道坎', en: 'From self-attention to a Transformer block',
      hook: '光有自注意力，还不能当积木用：它分不清词序，全是加权平均，还会偷看未来。三道坎，各配一个补丁。',
      goals: ['说明为什么自注意力对词序没感觉，以及位置向量怎么补上', '解释为什么要在每个位置后面接一个 MLP', '写出因果掩码，并说明 −∞ 经过 softmax 变成 0'],
      prereq: [{ text: '自注意力', ch: 'c5-2' }, { text: '激活函数与非线性', ch: 'c2-2' }],
      topics: [
        { id: 'order', title: '第一道坎：词序', question: '“Zuko made his uncle” 和 “his uncle made Zuko” 的自注意力输出有什么区别？', visuals: [{ id: 'order-mask' }] },
        { id: 'mlp', title: '第二道坎：非线性', question: '全是加权平均，叠多少层会怎样？' },
        { id: 'mask', title: '第三道坎：不能偷看未来', question: '预测下一个词时，怎么让模型看不到后面的词，又不牺牲并行？', visuals: [{ id: 'transformer-assemble', type: 'video' }] },
      ],
      source: 'CS224N 第 5 讲；官方 notes（自注意力与 Transformer）。',
    },
    {
      id: 'c5-4', part: 'p5', seq: 4, num: '5.4', stub: true, lectures: '第 5 讲',
      title: '多头、缩放、残差与 LayerNorm', en: 'Multi-head attention, scaling, residuals, LayerNorm',
      hook: '真正的 Transformer 在最小可用的版本上还多了四样东西。每一样各在解决什么问题？',
      goals: ['解释多头注意力为什么几乎不增加计算', '说明为什么要除以 $\\sqrt{d/h}$', '解释残差连接为什么让梯度好传', '说清 LayerNorm 在哪个维度上求统计量'],
      prereq: [{ text: '自注意力的矩阵形式', ch: 'c5-2' }, { text: '梯度消失', ch: 'c4-4' }, { text: '均值与标准差', here: 'stats' }],
      topics: [
        { id: 'multihead', title: '多头注意力', question: '一个词为什么要同时用好几种方式去看别的词？' },
        { id: 'scale', title: '缩放点积', question: '维度越大，点积越大，softmax 会怎样？', visuals: [{ id: 'scaling' }] },
        { id: 'residual', title: '残差连接', question: '为什么“只学差值”更容易训练？' },
        { id: 'stats', title: '均值与标准差', question: '一组数的“中心”和“散开程度”怎么量？', remedial: true },
        { id: 'layernorm', title: '层归一化', question: 'LayerNorm 对一个词向量做了什么？', visuals: [{ id: 'layernorm' }] },
      ],
      source: 'CS224N 第 5 讲；官方 notes（自注意力与 Transformer）。',
    },
    {
      id: 'c5-5', part: 'p5', seq: 5, num: '5.5', stub: true, lectures: '第 5 讲',
      title: 'Transformer 的三种形态与代价', en: 'Encoder, decoder, encoder-decoder, and the cost',
      hook: 'GPT、BERT、T5 用的都是 Transformer，结构却不一样。差别其实只在两处。',
      goals: ['说出 decoder、encoder、encoder-decoder 的区别', '解释交叉注意力里 query 和 key/value 分别来自哪里', '说出 Transformer 的二次复杂度从哪里来'],
      prereq: [{ text: 'Transformer block', ch: 'c5-4' }, { text: '掩码', ch: 'c5-3' }],
      topics: [
        { id: 'forms', title: '三种形态', question: '去掉掩码、加上交叉注意力，结构会怎么变？', visuals: [{ id: 'transformer-block' }] },
        { id: 'cross', title: '交叉注意力', question: '解码器怎么“看”编码器的输出？' },
        { id: 'cost', title: '效果与代价', question: 'Transformer 好在哪？序列很长时会遇到什么问题？' },
      ],
      source: 'CS224N 第 5 讲；官方 notes（自注意力与 Transformer）。',
    },
    {
      id: 'c5-6', part: 'p5', seq: 6, num: '5.6', stub: true, kind: 'homework', lectures: '作业 3',
      title: '作业精讲：A3', en: 'Assignment 3 walkthrough',
      hook: '作业 3：先用数学弄清注意力和位置编码的性质，再从零写一个 GPT-2 式的 Transformer。',
      goals: ['独立完成 A3 的数学题和编程题，并说清每一步的理由'],
      prereq: [{ text: '注意力', ch: 'c5-1' }, { text: '三道坎与位置编码', ch: 'c5-3' }, { text: '多头注意力', ch: 'c5-4' }],
      topics: [
        { id: 'q1', title: 'Q1：注意力的性质', question: '什么时候注意力会“复制”某一个值？怎么让它平均两个值？单头和多头差在哪？' },
        { id: 'q2', title: 'Q2：位置编码', question: '为什么没有位置编码时打乱输入、输出只是跟着打乱？正弦位置编码能解决吗？' },
        { id: 'q3', title: 'Q3：从零写一个 Transformer', question: 'MLP、因果注意力、decoder block、前向与贪心生成、损失分别怎么写？' },
      ],
      source: 'CS224N 作业 3。',
    },
  ]);
})(window);
