/* Part 0 · 数学工具箱 (COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
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
