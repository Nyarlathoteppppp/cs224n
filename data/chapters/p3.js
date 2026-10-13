/* Part 3 · 依存句法分析 (W26 Assignment 2 Q3; 2019 notes; COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
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
