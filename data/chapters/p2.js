/* Part 2 · 神经网络与反向传播 (W26 Lecture 3; COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
    {
      id: 'c2-3', part: 'p2', seq: 3, num: '2.3', stub: true, lectures: '第 3 讲',
      title: '矩阵微积分：梯度、Jacobian 与链式法则', en: 'Matrix calculus: gradients, Jacobians, chain rule',
      hook: '一层网络有 $n$ 个输入、$m$ 个输出。这时候“导数”该是一个数、一个向量，还是一张表？',
      goals: ['区分梯度（一个输出）和 Jacobian（多个输出）', '用“Jacobian 相乘”写出复合函数的导数', '写出逐元素激活、$Wx+b$ 这几个常用的 Jacobian'],
      prereq: [{ text: '偏导数与链式法则', ch: 'c0-3' }, { text: '矩阵乘法', ch: 'c0-1' }, { text: '对角矩阵与单位矩阵', here: 'diag' }],
      topics: [
        { id: 'jacobian', title: '梯度与 Jacobian', question: '多个输入、多个输出时，“输入动一点、输出动多少”该怎么记？' },
        { id: 'diag', title: '对角矩阵与单位矩阵', question: '除了对角线全是 0 的矩阵，乘上去有什么特别？', remedial: true },
        { id: 'chain', title: '链式法则与常用 Jacobian', question: '一层层套起来的函数，导数怎么算？', visuals: [{ id: 'shape-check' }] },
      ],
      source: 'CS224N 第 3 讲；官方 notes（梯度计算、微积分复习）。',
    },
    {
      id: 'c2-4', part: 'p2', seq: 4, num: '2.4', stub: true, lectures: '第 3 讲',
      title: '手推一个小网络的梯度', en: 'Deriving the gradients of a small network',
      hook: '窗口分类器的得分 $s=u^\\top f(Wx+b)$。$\\partial s/\\partial b$ 和 $\\partial s/\\partial W$ 各是多少？为什么算第二个时，前一个的大半结果可以直接拿来用？',
      goals: ['推出 $\\partial s/\\partial b=\\delta$', '推出 $\\partial s/\\partial W=\\delta^\\top x^\\top$ 并解释它为什么是外积', '说出“形状约定”是什么、为什么作业要求这么写'],
      prereq: [{ text: '链式法则与常用 Jacobian', ch: 'c2-3' }, { text: '窗口分类器', ch: 'c2-1' }, { text: '外积', here: 'outer' }],
      topics: [
        { id: 'db', title: '对偏置求导', question: '$\\partial s/\\partial b$ 由哪三个 Jacobian 相乘得到？' },
        { id: 'outer', title: '外积', question: '一个列向量乘一个行向量，会得到什么？', remedial: true },
        { id: 'dw', title: '对权重求导，复用 δ', question: '$\\partial s/\\partial W$ 和 $\\partial s/\\partial b$ 共用了哪一部分？', visuals: [{ id: 'outer-product', type: 'video' }] },
        { id: 'shape', title: '形状约定', question: '为什么梯度要和参数长得一样？什么时候需要转置？' },
      ],
      source: 'CS224N 第 3 讲；官方 notes（梯度计算）。',
    },
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
