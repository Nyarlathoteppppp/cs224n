/* Part 5 · 注意力与 Transformer (W26 Lecture 5; COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
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
