/* Part 1 · 词向量 (W26 Lectures 1–2; COURSE_MAP §3). */
(function (root) {
  'use strict';
  root.CS224N.content.addChapters([
    {
      id: 'c1-2', part: 'p1', seq: 2, num: '1.2', stub: true, lectures: '第 2 讲',
      title: '计算机里怎么放“词义”', en: 'Representing word meaning',
      hook: '搜索 “Seattle motel” 时，我们也想找到写着 “Seattle hotel” 的网页。计算机怎么知道 motel 和 hotel 意思相近？',
      goals: ['说出 WordNet 这类人工词典的问题', '解释为什么 one-hot 向量之间没有“相似”的概念', '用一句话说清分布式语义的想法'],
      prereq: [{ text: '向量与点积', ch: 'c0-1' }],
      topics: [
        { id: 'wordnet', title: 'WordNet 为什么不够用', question: '人工整理的同义词词典，缺了什么？' },
        { id: 'onehot', title: 'one-hot 为什么不行', question: '给每个词一个只有一个 1 的向量，motel 和 hotel 的点积是多少？', visuals: [{ id: 'onehot-dense' }] },
        { id: 'distributional', title: '分布式语义', question: '一个词的意思，能不能从它周围经常出现的词里看出来？', visuals: [{ id: 'distributional', type: 'video' }] },
      ],
      source: 'CS224N 第 2 讲；官方 notes（词向量）。',
    },
    {
      id: 'c1-3', part: 'p1', seq: 3, num: '1.3', stub: true, lectures: '第 2 讲',
      title: 'word2vec：任务、softmax 与目标函数', en: 'word2vec: task, softmax, objective',
      hook: '怎么让计算机自己学出词向量？word2vec 的办法是：给它一个“猜周围是什么词”的练习题。',
      goals: ['说出 skip-gram 的训练样本是什么', '写出 $P(o\\mid c)$ 的 softmax 公式，并解释三步各自的作用', '从似然一步步推到平均负对数似然 $J(\\theta)$'],
      prereq: [{ text: '点积', ch: 'c0-1' }, { text: '条件概率、exp 与 log', ch: 'c0-2' }],
      topics: [
        { id: 'task', title: '训练任务：用中心词猜上下文', question: '在一句话上滑动一个窗口，能得到哪些 (中心词, 上下文词) 对？', visuals: [{ id: 'skipgram-window' }] },
        { id: 'softmax', title: 'softmax：把点积变成概率', question: '点积可正可负，怎么把它变成一个合法的概率分布？', visuals: [{ id: 'softmax' }] },
        { id: 'objective', title: '目标函数：似然与平均负对数似然', question: '“让所有真实的上下文词概率都高”怎么写成一个要最小化的数？' },
      ],
      source: 'CS224N 第 2 讲；官方 notes（词向量）。',
    },
    {
      id: 'c1-4', part: 'p1', seq: 4, num: '1.4', stub: true, lectures: '第 2 讲',
      title: '训练 word2vec：梯度、SGD 与负采样', en: 'Training word2vec: gradients, SGD, negative sampling',
      hook: '目标函数写好了。每一个词向量该往哪边挪？语料有几十亿个窗口，算得过来吗？',
      goals: ['推出 $\\partial J/\\partial v_c$，并用“观察到的 − 期望的”解释它', '解释为什么用随机梯度下降', '写出负采样的损失，并说出它比 softmax 省在哪里'],
      prereq: [{ text: '梯度与梯度下降', ch: 'c0-3' }, { text: 'softmax 与目标函数', ch: 'c1-3' }, { text: 'sigmoid 函数', here: 'sigmoid' }],
      topics: [
        { id: 'grad', title: '中心词向量的梯度', question: '$\\partial J/\\partial v_c$ 长什么样？它把 $v_c$ 往哪里推？', visuals: [{ id: 'w2v-grad' }, { id: 'w2v-observed-expected', type: 'video' }] },
        { id: 'sgd', title: '随机梯度下降', question: '为什么不等整个语料算完一次梯度再更新？' },
        { id: 'sigmoid', title: 'sigmoid 函数', question: '负采样要用到一个把任意数压到 0 和 1 之间的函数，它长什么样？', remedial: true },
        { id: 'neg', title: '负采样', question: 'softmax 的分母要对整个词表求和，太贵了，怎么办？', visuals: [{ id: 'neg-sampling' }] },
      ],
      source: 'CS224N 第 2 讲；官方 notes（词向量）。',
    },
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
