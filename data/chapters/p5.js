/* Part 5 · 注意力与 Transformer (W26 Lecture 5; COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
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
      title: '作业思路：A3', en: 'Assignment 3: approach',
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
