/* Part 2 · 神经网络与反向传播 (W26 Lecture 3; COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
    {
      id: 'c2-6', part: 'p2', seq: 6, num: '2.6', stub: true,
      title: '训练技巧与优化器', en: 'Training tricks and optimizers',
      hook: '梯度会算了，可网络还是容易过拟合、训练得慢。实际训练时还要用到哪些办法？',
      goals: ['解释 L2 正则和 dropout 各在防止什么', '说出好的初始化为什么重要', '说出动量和 Adam 比普通 SGD 多做了什么'],
      prereq: [{ text: '梯度下降', ch: 'c0-3' }, { text: '反向传播', ch: 'c2-5' }],
      topics: [
        { id: 'reg', title: '正则化与 dropout', question: '训练集上很好、新数据上很差，怎么办？' },
        { id: 'init', title: '参数初始化', question: '参数一开始该设成多少？' },
        { id: 'optim', title: '动量、AdaGrad 与 Adam', question: '为什么大家训练时几乎都用 Adam？', visuals: [{ id: 'optimizers' }] },
      ],
      source: '官方 notes（神经网络，第 2 节“技巧”）；作业 2 第二题。这一章的内容 W26 的讲座里没有讲。',
    },
    {
      id: 'c2-7', part: 'p2', seq: 7, num: '2.7', stub: true, kind: 'homework', lectures: '作业 2',
      title: '作业思路：A2 第一、二题', en: 'Assignment 2, Q1–Q2: approach',
      hook: '作业 2 前两题：推出 word2vec 的全部梯度，再解释 Adam 和 dropout 为什么有用。',
      goals: ['独立完成 A2 Q1（a–g）与 Q2，并说清每一步的理由'],
      prereq: [{ text: 'word2vec 的梯度', ch: 'c1-4' }, { text: '矩阵微积分与形状约定', ch: 'c2-4' }, { text: '训练技巧与优化器', ch: 'c2-6' }],
      topics: [
        { id: 'q1', title: 'Q1：理解 word2vec', question: '(a) 损失等于交叉熵；(b) 对 $v_c$ 求导；(c) L2 归一化；(d)(e) 对 $U$ 和 $u_w$ 求导；(f)(g) Leaky ReLU 和 sigmoid 的导数。' },
        { id: 'q2', title: 'Q2：神经网络优化', question: '(a) 动量和 Adam 的作用；(b) dropout 的缩放系数 $\\gamma$，以及为什么只在训练时用 dropout。' },
      ],
      source: 'CS224N 作业 2 第一、二题。',
    },
  ]);
})(window);
