/* Part 4 · 语言模型与 RNN (W26 Lecture 4, start of Lecture 5; COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
    {
      id: 'c4-2', part: 'p4', seq: 2, num: '4.2', stub: true, lectures: '第 4 讲',
      title: '从固定窗口到 RNN', en: 'From fixed windows to RNNs',
      hook: '用神经网络代替数次数，没有了稀疏问题。可窗口永远不够大，怎么办？',
      goals: ['说出固定窗口语言模型的结构和缺点', '写出 RNN 一步的计算', '说出 RNN 的四个优点和两个缺点'],
      prereq: [{ text: 'n-gram 语言模型', ch: 'c4-1' }, { text: '神经网络', ch: 'c2-1' }, { text: 'softmax', ch: 'c1-3' }],
      topics: [
        { id: 'window', title: '固定窗口的神经语言模型', question: '把前 4 个词拼起来喂给网络，还剩什么问题？' },
        { id: 'rnn', title: 'RNN：同一个 W 反复用', question: '怎么处理任意长度的输入，又不让参数跟着变多？', visuals: [{ id: 'rnn-unroll' }] },
      ],
      source: 'CS224N 第 4 讲；官方 notes（语言模型与 RNN）。',
    },
    {
      id: 'c4-3', part: 'p4', seq: 3, num: '4.3', stub: true, lectures: '第 4 讲',
      title: '训练与评价 RNN 语言模型', en: 'Training and evaluating RNN language models',
      hook: '一个 RNN 在每一步都会猜下一个词。损失怎么算？同一个 $W_h$ 在每一步都出现，它的梯度怎么求？',
      goals: ['写出逐步交叉熵的平均损失，并解释 teacher forcing', '解释 BPTT 为什么要把每一步的梯度加起来', '用训练好的模型逐词生成', '算困惑度，并解释它的含义'],
      prereq: [{ text: 'RNN', ch: 'c4-2' }, { text: '交叉熵', ch: 'c2-2' }, { text: '反向传播与分叉相加', ch: 'c2-5' }],
      topics: [
        { id: 'loss', title: '损失与 teacher forcing', question: '训练时每一步喂进去的是模型猜的词，还是真实的词？' },
        { id: 'bptt', title: '沿时间反向传播（BPTT）', question: '同一个 $W_h$ 出现了 $t$ 次，它的梯度是什么？' },
        { id: 'generate', title: '逐词生成', question: '训练好的模型怎么“写”一句话？' },
        { id: 'ppl', title: '困惑度', question: '怎么用一个数量化语言模型的好坏？', visuals: [{ id: 'perplexity' }] },
      ],
      source: 'CS224N 第 4 讲；官方 notes（语言模型与 RNN）。',
    },
    {
      id: 'c4-4', part: 'p4', seq: 4, num: '4.4', stub: true, lectures: '第 4–5 讲',
      title: '梯度消失与梯度爆炸', en: 'Vanishing and exploding gradients',
      hook: '“…she finally printed her ___”，答案 tickets 在 7 步之前出现过。为什么 RNN 很难学会这种远距离的联系？',
      goals: ['用链式法则说明梯度为什么会指数级变小或变大', '解释梯度消失为什么比爆炸更危险', '说出梯度裁剪怎么做'],
      prereq: [{ text: 'BPTT', ch: 'c4-3' }, { text: '向量长度（范数）', ch: 'c0-1' }],
      topics: [
        { id: 'vanish', title: '梯度消失', question: '一串小于 1 的数连乘，会变成什么？', visuals: [{ id: 'vanishing' }, { id: 'rnn-vanishing', type: 'video' }] },
        { id: 'explode', title: '梯度爆炸与裁剪', question: '梯度太大会发生什么？怎么补救？' },
      ],
      source: 'CS224N 第 4–5 讲；官方 notes（语言模型与 RNN）。',
    },
    {
      id: 'c4-5', part: 'p4', seq: 5, num: '4.5', stub: true, lectures: '第 5 讲（只点名）',
      title: 'LSTM、GRU 与双向、多层 RNN', en: 'LSTMs, GRUs, bidirectional and multi-layer RNNs',
      hook: '普通 RNN 每一步都把隐状态整个重写一遍，所以记不久。能不能给它一块“只往上加、不轻易擦掉”的记忆？',
      goals: ['写出 LSTM 的门和 cell 的更新', '解释那个“加号”为什么能缓解梯度消失', '说出 GRU 和 LSTM 的区别', '说出双向 RNN 和多层 RNN 各在解决什么'],
      prereq: [{ text: '梯度消失', ch: 'c4-4' }, { text: 'sigmoid 与 tanh', ch: 'c2-2' }, { text: '逐元素乘法', ch: 'c2-4' }],
      topics: [
        { id: 'lstm', title: 'LSTM', question: 'cell、遗忘门、输入门、输出门分别在管什么？', visuals: [{ id: 'lstm-cell' }, { id: 'lstm-plus', type: 'video' }] },
        { id: 'gru', title: 'GRU', question: '只用两个门，能不能达到类似的效果？' },
        { id: 'bidir', title: '双向与多层', question: '怎么同时利用左右两边的信息？怎么把 RNN 叠深？' },
      ],
      source: '官方 notes（语言模型与 RNN，GRU 与 LSTM 部分）；2024 年 CS224N 第 6 讲字幕。W26 第 5 讲只提到了 LSTM 的名字。',
    },
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
