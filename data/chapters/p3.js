/* Part 3 · 依存句法分析 (W26 Assignment 2 Q3; 2019 notes; COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
    {
      id: 'c3-2', part: 'p3', seq: 2, num: '3.2', stub: true, lectures: '作业 2',
      title: '神经依存分析器', en: 'A neural dependency parser',
      hook: '每一步该 SHIFT、LEFT-ARC 还是 RIGHT-ARC？这其实是一个三选一的分类问题，可以交给神经网络来判断。',
      goals: ['说出分析器从当前状态里取哪些特征', '写出“特征 → 嵌入 → 隐藏层 → softmax”的前向过程', '解释 UAS 怎么算'],
      prereq: [{ text: '转移系统', ch: 'c3-1' }, { text: '神经网络与交叉熵', ch: 'c2-2' }],
      topics: [
        { id: 'features', title: '从状态里取特征', question: '栈顶、缓冲区开头的哪些词、词性、弧标签对判断下一步最有用？' },
        { id: 'model', title: '分类网络', question: '这些特征怎么变成三个转移的概率？' },
        { id: 'uas', title: '怎么评价：UAS', question: '分析出来的树对了多少？' },
      ],
      source: 'CS224N 作业 2 第三题；2019 年官方 notes（依存句法）。',
    },
    {
      id: 'c3-3', part: 'p3', seq: 3, num: '3.3', stub: true, kind: 'homework', lectures: '作业 2',
      title: '作业思路：A2 第三题', en: 'Assignment 2, Q3: approach',
      hook: '作业 2 第三题：手动分析一个句子，实现转移系统和批量分析，再推两个导数、训练一个分析器。',
      goals: ['独立完成 A2 Q3（a–e），并说清每一步的理由'],
      prereq: [{ text: '转移系统', ch: 'c3-1' }, { text: '神经依存分析器', ch: 'c3-2' }],
      topics: [
        { id: 'a', title: '(a) 手动走完转移表', question: '“I presented my findings at the NLP conference” 每一步的栈、缓冲区和新弧是什么？' },
        { id: 'b', title: '(b) 一共要多少步', question: 'n 个词的句子要走多少步？为什么？' },
        { id: 'cd', title: '(c)(d) 实现转移与批量分析', question: 'PartialParse 和 minibatch_parse 怎么写？' },
        { id: 'e', title: '(e) 两个导数与训练', question: 'ReLU 层和交叉熵对输入的导数是什么？训练时要注意什么？' },
      ],
      source: 'CS224N 作业 2 第三题。',
    },
  ]);
})(window);
