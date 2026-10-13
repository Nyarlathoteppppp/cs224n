/* Specs of every planned experiment and video (COURSE_MAP §4). A chapter shows the live experiment once it is
 * registered in js/viz/, and this spec card until then. “自造” numbers are labelled 课件外 on the page. */
(function (root) {
  'use strict';
  const content = root.CS224N.content;

  Object.assign(content.visuals, {
    'dot-product': { title: '点积为什么能衡量相似', question: '两个向量的点积，为什么能告诉我们它们“像不像”？', what: '两个可以拖动的二维箭头；实时显示 $a\\cdot b$、$\\|a\\|\\|b\\|\\cos\\theta$ 和投影；拖到互相垂直时点积变成 0。', data: '读者自己拖。' },
    'matvec': { title: '矩阵乘向量', question: '矩阵乘一个向量，到底在算什么？', what: '一个 3×2 矩阵乘一个 2 维向量：逐行高亮“这一行和向量做点积”；也可以切换成“按向量的分量把各列加权相加”的视角。', data: '自造数字（课件外）。' },
    'exp-log': { title: '为什么要取对数', question: '为什么目标函数里到处是 log 和 exp？', what: '左边：几个概率连乘，结果越来越接近 0；右边：取 log 之后变成连加，数值稳定。下面一条 exp 曲线，可以拖一个点看任何数经过 exp 都变成正数。', data: '自造数字（课件外）。' },
    'slope-descent': { title: '斜率与梯度下降', question: '导数怎么告诉我们“往哪走、走多远”？', what: '$f(x)=x^3$ 的切线跟着 $x$ 移动，显示斜率（$x=1$ 时为 3，$x=4$ 时为 48）；再在一个碗形曲线上按学习率 $\\alpha$ 一步步往下走，$\\alpha$ 太大时会来回跳。', data: 'CS224N 第 3 讲的 $x^3$ 例子 + 自造的碗形函数。' },
    'onehot-dense': { title: 'one-hot 与稠密向量', question: '为什么 one-hot 表示看不出 motel 和 hotel 很像？', what: 'motel、hotel 的 15 维 one-hot 向量逐位相乘，点积为 0；再把 banking、monetary 的 8 维稠密向量逐维相乘相加，得到明显为正的点积。', data: 'CS224N 第 2 讲的原数。' },
    'skipgram-window': { title: 'word2vec 的训练样本', question: 'word2vec 每一步拿什么数据来训练？', what: '在“…problems turning into banking crises as…”上滑动中心词；窗口大小 $m$ 可调；列出所有 (中心词, 上下文词) 对，并画出 $P(o\\mid c)$ 箭头。', data: 'CS224N 第 2 讲的原句。' },
    'softmax': { title: 'softmax 的三步', question: 'softmax 的每一步分别在做什么？', what: '可以拖动的分数条 → 经过 exp 的条 → 归一化后的概率条，三步之间用动画衔接；可以看到“最大的被放大，小的也留一点”。', data: '自造数字（课件外）。' },
    'w2v-grad': { title: '更新方向 = 观察到的 − 期望的', question: '为什么中心词向量的更新方向（负梯度）是“观察到的减去期望的”？', what: '二维平面上画出中心向量 $v_c$、真实上下文词的 $u_o$ 和其他词的 $u_w$；期望向量 = 按模型概率加权的平均；每点一次“下一步”，$v_c$ 沿负梯度移动，概率条随之更新。', data: '自造数字（课件外）。' },
    'neg-sampling': { title: '负采样的 3/4 次方', question: '采样分布为什么要取 3/4 次方？', what: '一组词频条：原始分布和取 3/4 次方后的分布并排；滑块把指数从 0 调到 1。', data: '自造词频（课件外）。' },
    'cooccur-svd': { title: '共现矩阵与 SVD', question: '共现矩阵怎么数出来？降维之后长什么样？', what: '逐词扫描三句话，矩阵的格子一格一格加 1；然后用 SVD 取前两维，把 8 个词画成散点。', data: 'CS224N 第 2 讲的三句话；SVD 由代码算出。' },
    'analogy': { title: '用向量做类比', question: 'man : woman :: king : ? 是怎么算出来的？', what: '二维平面上的 man→woman 箭头，平移到 king；画出 $x_b-x_a+x_c$，高亮离它最近的词（输入的三个词不算）。', data: '自造坐标（课件外）。' },
    'window-ner': { title: '窗口分类器', question: '一个小网络怎么判断 “Paris” 是不是地名？', what: '5 个词向量拼接 → $h=f(Wx+b)$ → $s=u^\\top h$ → $\\sigma(s)$；每一层的数值都可以展开看。', data: '自造数字（课件外）。' },
    'activations': { title: '激活函数一览', question: '各种激活函数长什么样？它们的导数呢？', what: '函数曲线和导数曲线并排；拖动 $x$ 看两者的值；可以切换 sigmoid、tanh、ReLU、Leaky ReLU、GELU。', data: 'CS224N 第 3 讲的公式。' },
    'why-nonlinear': { title: '为什么必须有非线性', question: '多叠几层线性层，为什么还是一条直线？', what: '二维平面上两类点；只用线性层时，叠几层分界都是直线；加上 ReLU 之后分界可以弯。', data: '自造数据（课件外）。' },
    'shape-check': { title: '梯度的形状', question: '每个梯度应该是什么形状？', what: '输入 $n$、$m$；列出 $W$、$x$、$z$、$\\delta$、$\\partial s/\\partial W$ 的形状；$\\delta$（$n\\times1$）乘 $x^\\top$（$1\\times m$）的外积逐格填出来。', data: '符号来自 CS224N 第 3 讲。' },
    'compgraph': { title: '计算图上的反向传播', question: '反向传播在计算图上是怎么一步步走的？', what: '$f=(x+y)\\cdot\\max(y,z)$ 的计算图：先前向一步步算出值，再反向一步步算出梯度；加法门、max 门、乘法门分别标出“分发、路由、互换”；$y$ 的两条支路梯度相加 $2+3=5$。输入值可以改。', data: 'CS224N 第 3 讲的原数 $x=1,y=2,z=0$。' },
    'grad-check': { title: '数值梯度检查', question: '用差分近似导数，准不准？', what: '在 $x^3$ 上比较解析导数、单侧差分、双侧差分；把 $h$ 从 $10^{-1}$ 拖到 $10^{-6}$，看误差怎么变。', data: 'CS224N 第 3 讲 + $x^3$。' },
    'optimizers': { title: 'SGD、动量与 Adam', question: '不同优化器走的路有什么不同？', what: '一个斜放的椭圆碗，三种优化器的轨迹同时画出；可以调学习率和 $\\beta$。', data: '自造函数（课件外）；更新公式来自官方 notes 和作业 2。' },
    'arc-standard': { title: '转移式依存分析', question: '转移系统怎么一步步把依存树建出来？', what: '栈、缓冲区、已建的弧三栏；读者自己点 SHIFT / LEFT-ARC / RIGHT-ARC 试，“提示”按钮给出正确的下一步。', data: '官方 notes 的例句 “He has good control .”（完整的树由我们补全，课件外）。' },
    'ngram': { title: 'n-gram 语言模型', question: 'n-gram 的概率怎么数？会在哪里失败？', what: '计数表 → 条件概率；把分子或分母改成 0，看会发生什么；用 Reuters 三元模型逐词采样生成一句话。', data: 'CS224N 第 4 讲的原数。' },
    'rnn-unroll': { title: 'RNN 一步步展开', question: 'RNN 每一步在干什么？', what: '“the students opened their” 逐步展开；同一个 $W$ 每一步都高亮；显示每一步的预测分布和损失 $J^{(t)}$。', data: '课件原句 + 自造参数（课件外）。' },
    'perplexity': { title: '困惑度', question: '困惑度怎么算？为什么像掷骰子？', what: '每一步正确词的概率可以拖动 → 平均负对数 → exp；均匀分布时困惑度正好等于候选词的个数。', data: '自造数字（课件外）。' },
    'vanishing': { title: '梯度消失与爆炸', question: '梯度为什么会消失或爆炸？', what: '一排时间步，梯度条从右往左传，每一步乘一个系数 $\\beta$；$\\beta<1$ 时越传越小，$\\beta>1$ 时越传越大；可以打开梯度裁剪。', data: '公式来自官方 notes。' },
    'lstm-cell': { title: 'LSTM 的三个门', question: 'LSTM 的三个门分别在管什么？', what: 'cell 状态是一条横穿的线，三个门是可以调的阀门；手动调门的值，看 $c^{(t)}$ 和 $h^{(t)}$ 怎么变；和“每一步整个重写”的普通 RNN 并排对比。', data: '公式来自官方 notes + 自造数字（课件外）。' },
    'seq2seq': { title: '编码器-解码器', question: 'seq2seq 怎么翻译一句话？瓶颈在哪？', what: '“il m\' a entarté” → “he hit me with a pie”；编码器最后的状态被高亮成唯一的通道。', data: 'CS224N 第 4 讲的原句。' },
    'attention-steps': { title: '注意力每一步算了什么', question: '解码器每一步怎么决定看原文的哪里？', what: '解码器 6 步，每步依次展示：点积分数 → softmax 柱状图 → 加权求和 → 输出词；最后汇成对齐热力图。', data: '课件原句；权重是自造数字（课件外），按课件热力图的明暗模式设定。' },
    'soft-lookup': { title: '软查找与字典查找', question: '注意力和查字典差在哪？', what: '左边是字典：query 只命中一个 key；右边是注意力：query 对每个 key 都有一个 0 到 1 之间的权重。', data: '结构来自 CS224N 第 5 讲。' },
    'self-attn': { title: '自注意力的 Q、K、V', question: 'Q、K、V 和 n×n 分数矩阵是怎么来的？', what: '“Zuko made his uncle tea”：嵌入 → Q/K/V → 分数矩阵 → softmax → 输出；点任意一格，看它是哪两个向量算出来的。', data: '课件原句 + 自造数字（课件外）。' },
    'order-mask': { title: '位置向量与掩码', question: '为什么需要位置向量和掩码？', what: '① 打乱词序：没有位置向量时，输出只是跟着换位；加了位置向量就不一样了。② 4×4 掩码（[START] The chef who）：上三角是 −∞，softmax 之后变成 0。③ 正弦位置编码的热力图。', data: '课件原句 + 自造数字（课件外）。' },
    'scaling': { title: '为什么要除以 √d', question: '为什么点积要除以 $\\sqrt{d/h}$？', what: '维度 $d$ 滑块：随机向量点积的分布越来越宽，softmax 越来越尖，梯度越来越小；勾选“缩放”后恢复平缓。', data: '自造随机数（固定种子，课件外）。' },
    'layernorm': { title: 'LayerNorm', question: 'LayerNorm 对一个向量做了什么？', what: '一个词向量 → 减均值 → 除标准差 → 乘 $\\gamma$ 加 $\\beta$；明确画出“只对这一个向量的 $d$ 个数求统计量”。', data: '自造数字（课件外）。' },
    'transformer-block': { title: '三种 Transformer', question: 'decoder、encoder、encoder-decoder 的结构差在哪？', what: '方块图；在三种形态之间切换，只有掩码和交叉注意力这两处会变；数据流动画。', data: '结构来自 CS224N 第 5 讲。' },
    'bpe': { title: 'BPE 一步步合并', question: 'BPE 每一步合并了什么？', what: '左边是语料的当前切分，右边是相邻对的频率表；点“下一步”合并频率最高的一对；最后用学到的规则切分新词 “_pier”。', data: 'CS224N 第 14 讲的 “Peter Piper” 例子。' },
  });

  Object.assign(content.videoSpecs, {
    'distributional': { title: '一个词的意思从哪里来', question: '只看一个词周围的词，能知道它的意思吗？', aha: 'banking 的三个上下文叠在一起，“意思”就浮现出来了。' },
    'w2v-observed-expected': { title: '把词向量推来推去的两股力', question: '训练 word2vec 时，每个词向量是被什么力量推着走的？', aha: '更新方向（负梯度）= 观察到的 − 期望的：被真实的上下文拉过去，被模型自己的猜测推开。' },
    'glove-ratio': { title: '为什么看概率之比', question: '为什么 GloVe 关心“概率之比”，而不是概率本身？', aha: '比值把和两个词都无关的部分抵消掉，只留下它们的区别。' },
    'outer-product': { title: '外积从哪里来', question: '$\\partial s/\\partial W$ 为什么是 $\\delta$ 和 $x$ 的外积？', aha: '$W_{ij}$ 只连着 $z_i$ 和 $x_j$，所以它的梯度就是 $\\delta_i x_j$。' },
    'backprop-graph': { title: '一次算出所有梯度', question: '一个复杂函数的梯度，怎么一次全部算出来？', aha: '加法分发、max 路由、乘法互换；分叉的地方梯度相加。' },
    'rnn-vanishing': { title: '记不住的 tickets', question: '为什么 RNN 记不住 7 步之前的 “tickets”？', aha: '梯度每往回走一步就乘一次，乘到最后几乎为 0。' },
    'lstm-plus': { title: 'LSTM 的那个加号', question: 'LSTM 凭什么能记得更久？', aha: '关键是那个加号：记忆是加上去的，不是每一步重写的。' },
    'seq2seq-attention': { title: '翻译时在看哪里', question: '解码器翻译每个词时，在看原文的哪里？', aha: '一条直通原文的路；权重热力图就是对齐。' },
    'self-attention': { title: '每个词同时看到所有词', question: '每个词怎么同时看到句子里所有的词？', aha: '一次矩阵乘法得到 $n\\times n$ 的分数表，所有词对一起算，可以并行。' },
    'transformer-assemble': { title: '拼出一个 Transformer block', question: '光有自注意力为什么还不够？', aha: '三道坎各配一个补丁，拼起来就是 Transformer 的一个 block。' },
  });
})(window);
