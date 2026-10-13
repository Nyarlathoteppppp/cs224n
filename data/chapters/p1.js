/* Part 1 · 词向量 (W26 Lectures 1–2; COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
    {
      id: 'c1-5', part: 'p1', seq: 5, num: '1.5', stub: true, lectures: '第 2 讲',
      title: '基于计数的方法：共现矩阵、SVD 与 GloVe', en: 'Count-based methods: co-occurrence, SVD, GloVe',
      hook: 'word2vec 要一遍遍扫语料。能不能一次把“谁和谁挨着”全数出来，直接从计数里得到词向量？',
      goals: ['手算一个小语料的窗口共现矩阵', '用直觉说出 SVD 降维在做什么', '解释 GloVe 为什么关心“共现概率之比”'],
      prereq: [{ text: '矩阵', ch: 'c0-1' }, { text: 'word2vec 的目标函数', ch: 'c1-3' }],
      topics: [
        { id: 'cooccur', title: '共现矩阵', question: '“I like deep learning / I like NLP / I enjoy flying”，窗口为 1 时，谁和谁挨着几次？', visuals: [{ id: 'cooccur-svd' }] },
        { id: 'svd', title: 'SVD 降维', question: '一个又大又稀疏的计数矩阵，怎么压成每个词几十维的稠密向量？' },
        { id: 'glove', title: 'GloVe', question: '怎么把“共现概率之比”变成“向量之差”？', visuals: [{ id: 'glove-ratio', type: 'video' }] },
      ],
      source: 'CS224N 第 2 讲；官方 notes（词向量 2）；作业 1。',
    },
    {
      id: 'c1-6', part: 'p1', seq: 6, num: '1.6', stub: true, lectures: '第 2–3 讲',
      title: '怎么评价词向量', en: 'Evaluating word vectors',
      hook: '两套词向量，哪一套更好？可以考它们做类比题，也可以直接拿去做真实任务。',
      goals: ['区分内在评测和外在评测，各说出一个优缺点', '用向量算出 man : woman :: king : ?', '解释“和人工相似度打分做相关”在比较什么'],
      prereq: [{ text: '余弦相似度', ch: 'c0-1' }, { text: '相关系数', here: 'corr' }],
      topics: [
        { id: 'intrinsic', title: '内在评测：类比与相似度', question: '怎么用一道类比题考词向量？', visuals: [{ id: 'analogy' }] },
        { id: 'corr', title: '相关系数', question: '两组打分“趋势一致”该怎么量？', remedial: true },
        { id: 'extrinsic', title: '外在评测：放进真实任务', question: '为什么最终还是要看它在真实任务（比如找出人名地名）上的表现？' },
      ],
      source: 'CS224N 第 2–3 讲；官方 notes（词向量 2）。',
    },
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
