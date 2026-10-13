/* Part 4 · 语言模型与 RNN (W26 Lecture 4, start of Lecture 5; COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
    {
      id: 'c4-6', part: 'p4', seq: 6, num: '4.6', stub: true, lectures: '第 4–5 讲',
      title: '机器翻译与 seq2seq', en: 'Machine translation and seq2seq',
      hook: '把 “il m\' a entarté” 翻成 “he hit me with a pie”。一个网络读，另一个网络写，中间只通过一个向量交接。',
      goals: ['画出编码器-解码器的结构', '解释训练时怎么算损失、测试时怎么逐词生成', '说出“瓶颈”指的是什么'],
      prereq: [{ text: 'RNN 语言模型', ch: 'c4-3' }, { text: 'LSTM', ch: 'c4-5' }],
      topics: [
        { id: 'mt', title: '机器翻译', question: '翻译这件事为什么难？神经机器翻译是怎么在两年内取代旧方法的？' },
        { id: 'seq2seq', title: '编码器-解码器', question: '一个网络读、一个网络写，两者怎么配合？', visuals: [{ id: 'seq2seq' }] },
        { id: 'bottleneck', title: '瓶颈', question: '整句话只压成一个向量，会丢掉什么？' },
      ],
      source: 'CS224N 第 4–5 讲；官方 notes（NMT 与 seq2seq）。',
    },
  ]);
})(window);
