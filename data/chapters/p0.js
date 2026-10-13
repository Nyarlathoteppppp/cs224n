/* Part 0 · 数学工具箱 (COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
    {
      id: 'c0-2', part: 'p0', seq: 2, num: '0.2', stub: true,
      title: '概率、指数与对数', en: 'Probability, exp and log',
      hook: '模型说“下一个词是 books 的概率是 0.4”，这个数是怎么来的？为什么几乎所有的训练目标里都有 log？',
      goals: ['写出条件概率 $P(o\\mid c)$ 的含义', '用“连乘拆成一个个条件概率”的方式写一句话的概率', '解释 exp 为什么能把任意数变成正数、log 为什么能把连乘变成连加'],
      prereq: [{ text: '分数、乘方', where: '高中数学' }],
      topics: [
        { id: 'prob', title: '概率与条件概率', question: '“在已知中心词是 into 的情况下，旁边出现 banking 的概率”该怎么写、怎么理解？' },
        { id: 'explog', title: '指数与对数', question: '很多个小于 1 的数连乘会越来越小，取了 log 之后会发生什么？', visuals: [{ id: 'exp-log' }] },
      ],
      source: 'CS224N 第 2、4 讲用到的概率记号。',
    },
    {
      id: 'c0-3', part: 'p0', seq: 3, num: '0.3', stub: true,
      title: '导数、梯度与梯度下降', en: 'Derivatives, gradients and gradient descent',
      hook: '训练一个模型，就是不断调参数让损失变小。参数有成千上万个，每一个该往哪边调、调多少？',
      goals: ['把导数理解成“输入动一点，输出动多少”', '写出一个多元函数的梯度，并说出它指向哪里', '用“复合函数求导 = 各层导数相乘”算出 $z=3y,\\ y=x^2$ 的 $dz/dx$', '解释梯度下降的一步，以及学习率太大或太小会怎样'],
      prereq: [{ text: '函数图像、斜率', where: '高中数学' }, { text: '向量', ch: 'c0-1' }],
      topics: [
        { id: 'derivative', title: '导数就是斜率', question: '$f(x)=x^3$ 在 $x=1$ 和 $x=4$ 处，输入变化 0.01，输出分别变化多少？', visuals: [{ id: 'slope-descent' }] },
        { id: 'gradient', title: '偏导数、梯度与链式法则', question: '有很多个输入时，“斜率”变成了什么？一层套一层的函数怎么求导？' },
        { id: 'descent', title: '梯度下降', question: '知道了梯度，参数该怎么更新？步子迈多大合适？' },
      ],
      source: 'CS224N 第 2 讲（梯度下降）、第 3 讲（导数与链式法则）。',
    },
  ]);
})(window);
