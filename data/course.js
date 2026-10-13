/* Course structure, home page text and the shared content containers.
 * Chapter files call CS224N.content.addChapters([...]); visual specs live in data/visuals.js. */
(function (root) {
  'use strict';
  const C = root.CS224N = root.CS224N || {};
  const content = C.content = C.content || {};
  content.chapters = content.chapters || [];
  content.visuals = content.visuals || {};
  content.videoSpecs = content.videoSpecs || {};
  content.videos = content.videos || {};
  content.glossary = content.glossary || [];

  /** Chapters are kept in course order: by part, then by their position in the file. */
  content.addChapters = function (list) {
    list.forEach((c) => {
      if (content.chapters.some((x) => x.id === c.id)) throw new Error('duplicate chapter id ' + c.id);
      content.chapters.push(c);
    });
    const order = content.parts.map((p) => p.id);
    content.chapters.sort((a, b) => order.indexOf(a.part) - order.indexOf(b.part) || a.seq - b.seq);
  };

  content.parts = [
    { id: 'p0', num: '0', title: '数学工具箱', intro: '后面马上要用的向量、矩阵、概率、对数和导数。每一节都先说清楚“后面哪里会用到它”。' },
    { id: 'p1', num: '1', title: '词向量', intro: '怎么把“词的意思”变成一串数：从 one-hot 到 word2vec 和 GloVe，以及怎么评价它们。对应 CS224N 第 1–2 讲。' },
    { id: 'p2', num: '2', title: '神经网络与反向传播', intro: '从一个判断“Paris 是不是地名”的小网络出发，学会自己推梯度，再看计算机怎么自动推。对应第 3 讲。' },
    { id: 'p3', num: '3', title: '依存句法分析', intro: '句子里谁修饰谁？用一个栈和一个缓冲区一步步把句子的结构建出来。对应作业 2 的第三题。' },
    { id: 'p4', num: '4', title: '语言模型与 RNN', intro: '预测下一个词：从数次数的 n-gram，到能看任意长度的 RNN、LSTM，再到机器翻译。对应第 4 讲。' },
    { id: 'p5', num: '5', title: '注意力与 Transformer', intro: '让模型直接“看”任何位置的词：从 seq2seq 的注意力到自注意力，再拼出完整的 Transformer。对应第 5 讲。' },
    { id: 'p6', num: '6', title: '预训练', intro: 'BERT、T5、GPT 是怎么在海量文本上学出来的。对应第 7 讲。' },
    { id: 'p7', num: '7', title: '后训练', intro: '指令微调、RLHF 与 DPO：怎么把续写模型变成助手。对应第 8 讲。' },
    { id: 'p8', num: '8', title: '提示与参数高效微调', intro: '不改或少改参数，怎么让模型做新任务。对应第 9 讲。' },
    { id: 'p9', num: '9', title: 'RAG 与语言 Agent', intro: '检索增强与能使用工具的 Agent。对应第 10 讲。' },
    { id: 'p10', num: '10', title: '评测', intro: '基准、指标、人工评测与它们的陷阱。对应第 11 讲。' },
    { id: 'p11', num: '11', title: '推理', intro: '解码方法、用强化学习训练推理、投机解码与长上下文。对应第 12–13 讲。' },
    { id: 'p12', num: '12', title: '分词与多语言', intro: 'BPE 与多语言模型。对应第 14 讲。' },
    { id: 'p13', num: '13', title: '影响、延伸与开放问题', intro: '幻觉、AI 对社会的影响，以及可解释性、多模态的延伸。对应第 15–19 讲。' },
  ];

  content.chain = [
    { label: '向量与概率', ch: 'c0-1' }, { label: '词向量', ch: 'c1-2' }, { label: 'word2vec', ch: 'c1-3' },
    { label: '神经网络', ch: 'c2-1' }, { label: '反向传播', ch: 'c2-5' }, { label: '依存句法', ch: 'c3-1' },
    { label: '语言模型', ch: 'c4-1' }, { label: 'RNN', ch: 'c4-2' }, { label: 'LSTM', ch: 'c4-5' }, { label: 'seq2seq', ch: 'c4-6' },
    { label: '注意力', ch: 'c5-1' }, { label: 'Transformer', ch: 'c5-3' }, { label: '预训练' }, { label: '后训练' }, { label: '推理' },
  ];

  content.home = {
    kicker: '斯坦福 NLP 课的中文交互教程',
    title: '从“词是一串数”到 Transformer：只看这个网站学懂 CS224N',
    lead: '按 Stanford CS224N（Winter 2026）的讲次顺序，一章一个问题地讲。每个模型都先给画面和直觉，再给公式，再用具体的数字走一遍；课件里的数字都能在交互实验里亲手复现。',
    firstTime: [
      '**只需要高中数学。** 向量、矩阵、概率、导数这些，第 0 部分会从头讲，而且只讲后面要用的部分。后面的章节如果用到你没学过的东西，会在章首的“开始之前，你需要知道”里列出来，并当场补课。',
      '',
      '**每一章怎么读：**',
      '1. 先看“这一章要回答”的问题，自己猜一下答案。',
      '2. 每个小节回答一个问题，顺序是 **直觉 → 定义与公式 → 算一遍**。',
      '3. 公式框可以点“下一步”，逐项看每一部分在干什么。',
      '4. 交互实验里拖一拖、点一点，验证你的猜测。',
      '5. 最后做小测，每题都有解释。',
      '',
      '**作业**：每个部分的最后一章是作业精讲，题目完整写出来了，不用另找原题。',
    ].join('\n'),
    howTo: [
      '- 左边目录里，圆点空心 = 没看过，蓝圈 = 看过，绿点 = 你勾选了“能讲清楚”。',
      '- 进度、笔记、答题记录都只保存在这个浏览器里，不需要联网，也不用登录。左下角可以把笔记导出成 Markdown。',
      '- 键盘 `Alt + ←/→` 切换上一章、下一章。',
      '- 右上角可以切换深色和字号。',
      '- 标“课件外”的内容是为了讲清楚而补充的，不是 CS224N 课件里的原话；标“延伸”的章节依据往年材料。',
    ].join('\n'),
  };
})(window);
