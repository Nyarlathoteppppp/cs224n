/* Key terms are written "中文（English）" the first time they appear in a chapter.
 * Authors may write the English themselves; otherwise the first Chinese-only occurrence inside a chapter
 * (between begin() and end()) gets "（English）" appended. Later occurrences stay as written.
 * Applied by CS224N.md.render to markdown text whose maths has already been replaced by placeholders.
 * Entries: [中文, English, scope?, notFollowedBy?]; notFollowedBy is a regex for false matches such as 词表 in “词表示”. Basic maths words used everywhere ('p0') are only glossed in Part 0, where they
 * are taught; elsewhere a gloss on every chapter's first "向量" would just be noise.
 * Longer Chinese terms are matched before the shorter ones they contain. */
(function (root) {
  'use strict';
  const C = root.CS224N = root.CS224N || {};
  const LIST = [
    // Part 0 (glossed only in Part 0 chapters)
    ['向量', 'vector', 'p0'], ['点积', 'dot product', 'p0'], ['余弦相似度', 'cosine similarity'], ['矩阵', 'matrix', 'p0'], ['转置', 'transpose', 'p0'],
    ['独热向量', 'one-hot vector'], ['正交', 'orthogonal', 'p0'], ['维度', 'dimension', 'p0'],
    ['条件概率', 'conditional probability', 'p0'], ['概率分布', 'probability distribution', 'p0'], ['似然', 'likelihood'],
    ['导数', 'derivative', 'p0'], ['偏导数', 'partial derivative', 'p0'], ['梯度下降', 'gradient descent'], ['梯度', 'gradient', 'p0'],
    ['学习率', 'learning rate'], ['链式法则', 'chain rule'],
    // Part 1
    ['自然语言处理', 'natural language processing, NLP'], ['分布式语义', 'distributional semantics'], ['词向量', 'word vector'],
    ['词嵌入', 'word embedding'], ['中心词', 'center word'], ['上下文词', 'context word'], ['语料库', 'corpus'], ['词表', 'vocabulary', null, /^示/],
    ['目标函数', 'objective function'], ['负对数似然', 'negative log-likelihood'], ['随机梯度下降', 'stochastic gradient descent, SGD'],
    ['负采样', 'negative sampling'], ['共现矩阵', 'co-occurrence matrix'], ['奇异值分解', 'singular value decomposition, SVD'],
    ['内在评测', 'intrinsic evaluation'], ['外在评测', 'extrinsic evaluation'], ['词类比', 'word analogy'],
    // Part 2
    ['命名实体识别', 'named entity recognition, NER'], ['激活函数', 'activation function'], ['交叉熵', 'cross-entropy'],
    ['神经元', 'neuron'], ['隐藏层', 'hidden layer'], ['非线性', 'nonlinearity'], ['雅可比矩阵', 'Jacobian'],
    ['反向传播', 'backpropagation'], ['计算图', 'computation graph'], ['自动微分', 'automatic differentiation'],
    ['梯度检查', 'gradient check'], ['正则化', 'regularization'], ['过拟合', 'overfitting'], ['动量', 'momentum'],
    // Part 3
    ['依存句法分析', 'dependency parsing'], ['依存关系', 'dependency'], ['中心语', 'head'], ['依存词', 'dependent'],
    ['转移系统', 'transition system'], ['缓冲区', 'buffer'], ['依存结构', 'dependency structure'], ['依存树', 'dependency tree'],
    ['栈', 'stack', null, /^顶/], ['树库', 'treebank'], ['贪心', 'greedy'], ['介词短语', 'prepositional phrase'], ['短语结构', 'phrase structure'], ['词性标注', 'part-of-speech tagging'], ['词性', 'part of speech, POS'], ['指示特征', 'indicator feature'], ['嵌入矩阵', 'embedding matrix'],
    // Part 4
    ['语言模型', 'language model'], ['马尔可夫假设', 'Markov assumption'], ['沿时间反向传播', 'backpropagation through time, BPTT'], ['暴露偏差', 'exposure bias'], ['长短时记忆', 'long short-term memory, LSTM'], ['遗忘门', 'forget gate'], ['输入门', 'input gate'], ['输出门', 'output gate'], ['更新门', 'update gate'], ['重置门', 'reset gate'], ['双向 RNN', 'bidirectional RNN'], ['平行语料', 'parallel corpus'], ['注意力分数', 'attention scores'], ['注意力分布', 'attention distribution'], ['注意力输出', 'attention output'], ['对齐', 'alignment'], ['位置向量', 'position vector'], ['正弦位置编码', 'sinusoidal position encoding'], ['前馈网络', 'feed-forward network'], ['端到端', 'end-to-end'], ['平滑', 'smoothing'], ['回退', 'backoff'], ['指代', 'coreference'], ['大语言模型', 'large language model, LLM'], ['循环神经网络', 'recurrent neural network, RNN'], ['隐状态', 'hidden state'],
    ['困惑度', 'perplexity'], ['梯度消失', 'vanishing gradient'], ['梯度爆炸', 'exploding gradient'], ['梯度裁剪', 'gradient clipping'],
    ['长短期记忆网络', 'long short-term memory, LSTM'], ['机器翻译', 'machine translation'], ['编码器', 'encoder'], ['解码器', 'decoder'],
    // Part 5
    ['注意力', 'attention'], ['自注意力', 'self-attention'], ['交叉注意力', 'cross-attention'], ['多头注意力', 'multi-head attention'],
    ['位置编码', 'position encoding'], ['残差连接', 'residual connection'], ['层归一化', 'layer normalization'], ['掩码', 'mask'],
  ];
  const items = LIST.map(([zh, en, scope, not]) => ({ zh, en, key: zh, scope, not })).sort((a, b) => b.zh.length - a.zh.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // A term right before a closing ** gets its gloss after the **: “**点积（dot product）**衡量” would not render as bold,
  // because CommonMark does not close emphasis between full-width punctuation and a following Chinese character.
  const big = new RegExp('(' + items.map((it) => esc(it.zh)).join('|') + ')(\\*\\*(?!\\*))?', 'g');
  const byZh = new Map(items.map((it) => [it.zh, it]));

  let ctx = null;
  function begin(chapterId) { ctx = { ch: chapterId, seen: new Set() }; }
  function end() { ctx = null; }

  function applyText(text) {
    if (!ctx) return text;
    return text.replace(big, (whole, match, stars, offset) => {
      const it = byZh.get(match);
      const after = text.slice(offset + whole.length, offset + whole.length + 4);
      if (it.not && it.not.test(after)) return whole;                               // a different word, e.g. 词表示
      if (/^\**\s*[（(]/.test(after)) { ctx.seen.add(it.key); return whole; }       // author already glossed it
      if (ctx.seen.has(it.key)) return whole;
      if (it.scope === 'p0' && !/^c0-/.test(ctx.ch)) return whole;
      const before = text.slice(Math.max(0, offset - 60), offset);
      if (before.lastIndexOf('（') > before.lastIndexOf('）')) return whole;         // inside someone else's brackets
      if (/^\s*#/.test(before.split('\n').pop())) return whole;                      // headings stay clean
      ctx.seen.add(it.key);
      const closing = stars && ((text.slice(0, offset).match(/\*\*/g) || []).length % 2 === 1);
      return stars && !closing ? match + '（' + it.en + '）' + stars : whole + '（' + it.en + '）';
    });
  }
  /** Leaves HTML tags, inline code and link targets untouched. */
  function apply(src) {
    return src.split(/(<[^>]+>|`[^`]*`|\]\([^)]*\))/g).map((part, i) => (i % 2 ? part : applyText(part))).join('');
  }

  C.terms = { begin, end, apply, LIST };
})(window);
