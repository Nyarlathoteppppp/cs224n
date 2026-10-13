/* Part 1 · 词向量 (W26 Lectures 1–2; COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
    {
      id: 'c1-7', part: 'p1', seq: 7, num: '1.7', stub: true, kind: 'homework', lectures: '作业 1',
      title: '作业精讲：A1 探索词向量', en: 'Assignment 1 walkthrough',
      hook: '作业 1 让你亲手做一遍共现矩阵和 SVD，再拿预训练好的 GloVe 向量做相似度、多义词、类比和偏见的分析。',
      goals: ['独立完成 A1 的每一道题，并说清每一步为什么这么做'],
      prereq: [{ text: '共现矩阵与 SVD', ch: 'c1-5' }, { text: '词向量评测', ch: 'c1-6' }],
      topics: [
        { id: 'part1', title: '第一部分：基于计数的词向量', question: '怎么从语料构建共现矩阵、用 SVD 降到二维并作图？' },
        { id: 'part2', title: '第二部分：预测式词向量（GloVe）', question: '余弦相似度、多义词、近义词与反义词、类比、偏见分别怎么分析？' },
      ],
      source: 'CS224N 作业 1。',
    },
  ]);
})(window);
