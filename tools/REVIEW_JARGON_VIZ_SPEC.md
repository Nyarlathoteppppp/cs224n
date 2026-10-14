# Review spec: unexplained jargon and visualization problems (for delegate models)

Project: a Chinese tutorial website for Stanford CS224N, at `/Users/ywbw/unimelboure_course/cs224n`.
Chapters are JavaScript data files in `data/chapters/` (one object per chapter; text is Markdown with `$…$` LaTeX).
Interactive visualizations are in `js/viz/*.js`; a chapter mounts one through `visuals: [{ id, at, guide, props }]`
inside a topic, and `guide` is the instruction text printed next to it. `C.viz.register('<id>', …)` names the id.
Shared DOM helpers: `js/ui/dom.js`. Algorithms: `js/core/*.js` (loadable in Node with `require`, see `tests/core.test.js`).

**The reader**: knows only Chinese high-school maths (functions, plane vectors and the dot product, basic
probability, exponential and log functions, simple derivatives). No linear algebra beyond that, no machine learning,
no NLP, no programming. They read the chapters in order (0.1 → 0.2 → … → 5.6, file `cX-Y.js` is chapter X.Y) and
may rely only on the current chapter and earlier ones. `tests/taught.js` records where many terms are formally taught
(incomplete). Chapters with `kind: 'homework'` explain an assignment's approach only and never give answers.

This review has exactly two goals. Do not report anything else (style, typos, facts unrelated to these goals).

## Goal 1 — 黑话: words the text uses as if every beginner already knew them

Report every word or phrase a high-school reader would not understand at that point, **in chapter text and in the
on-screen text of the chapter's visualizations** (labels, buttons, legends, captions, notes inside `js/viz/*.js`).
Typical kinds:
- ML / NLP vocabulary: 训练, 模型, 样本, 特征, 权重, 收敛, 拟合, 推理, 采样, 批量 / batch, 前向, 嵌入, 表示, 上下文,
  时间步, 指标, 基准, 优化器, 衰减, token, logits, baseline, end-to-end …
- Programming vocabulary: 实现, 调用, 接口, 数组, 索引, 张量, 内存, 框架, Python, PyTorch, 函数 in the programming
  sense, 变量, 类 …
- Maths beyond high school: 矩阵 (before 0.1 teaches it), 秩, 投影, 线性变换, 特征值, 期望, 方差, 均值 of a
  vector, 正态分布, 归一化, 降维 …
- Abbreviations and names used as if known: NLP, AI, GPT, BERT, MLP, L2, NaN, Inf …
- Insider metaphors and slang: 喂给, 打分, 跑一遍, 炸了, 学到, 调参, 信息流, 表达能力, 容量 …
- A gloss that is itself jargon (“即 logits 的归一化” explains nothing to a beginner).

A word is **fine** when: it is everyday Chinese; it is explained in the same sentence or earlier in the same
chapter; an earlier chapter teaches it (check the chapter, not only taught.js); or the sentence points forward
(“第 X 章会讲”). English words that are clearly example data (words in an example sentence like “students opened
their books”) and people's names are fine. A model or system name (GPT-3, LLaMA) is fine when the sentence says what
it is or does not need the reader to know.

For each finding, say what a beginner would actually fail to understand, and give a concrete fix: the exact
Chinese explanation to insert, or which earlier/later chapter to point to. **Length is not a concern** (the author
wants the tutorial detailed): when a bracket gloss would be too thin for a beginner, propose one or two full
sentences, with a small example if it helps.

A mechanical candidate list is at `reference/reviews/jargon-candidates.tsv` (columns: first chapter, word, count,
context; English words glued to Chinese text plus a fixed list of Chinese jargon, minus taught.js entries). It is
noisy and incomplete: use it as a starting point, judge every entry yourself, and look for jargon it missed.

## Goal 2 — problems in the visualizations

You cannot see the rendered page (the main author checks rendering and layout separately). Read the viz source, the
chapter topic that mounts it (its `intuition`, `formulas`, `example`, `guide`, `props`), and the `js/core` code it
calls. Report:
1. **Mismatch with the text**: the viz shows different numbers, symbols, notation, index order, row/column
   convention, or names than the chapter text and `guide`; the guide mentions a control, label, colour or behaviour
   the viz does not have (or names it differently); `props` the viz ignores.
2. **Wrong maths or drawing**: a computed value or formula that is wrong; axes, scales or bar lengths that are not
   proportional without saying so; arrows pointing the wrong way; colours that mean different things in the text and
   in the viz; a legend or axis label that is missing where the reader needs it.
3. **Misleading or confusing for a beginner**: the reader cannot tell what to do or what to look at; a state where the
   viz shows something that contradicts the lesson; made-up numbers not labelled as such (课件外 / 编的); a caption
   that refers to something not on screen.
4. **Interaction bugs visible in code**: slider ranges that produce NaN, Infinity, division by zero, or numbers too
   long to fit; state not reset when a control changes; off-by-one step counters; buttons that do nothing at the ends;
   event handlers that select elements outside the viz container; `el.append(null)`-style stray text.
5. On-screen viz text with jargon (Goal 1 applies to it too).

You may run Node (`node -e`, small scripts that `require` files in `js/core/`) to check numbers. Do not run a
browser. **Do not modify any file** except the report.

## Output

Write exactly one Markdown file at the path given in your task, in Chinese.

```
# 黑话与可视化审查 — <chapters>

## <chapter id> <title>
### 黑话
- **[severity]** <field / topic id> — “<quote, at most 15 Chinese characters or 10 words>”
  - 问题：<what the beginner cannot understand>
  - 改法：<one concrete sentence: the gloss to add, or the pointer>
### 可视化 <viz id>（js/viz/<file>.js）
- **[severity]** <file:line or guide/props> — <what is wrong>
  - 后果：<what the reader sees or concludes wrongly>
  - 改法：<one concrete sentence>
```

severity: `blocker` (the reader cannot follow, or the viz teaches something wrong), `major` (likely confusion),
`minor` (small gap). Blockers first. Write “未发现问题。” under an empty heading. Do not repeat the same word in later
chapters once reported (say “同上，另见 c?-?” at most once). End with a 3-line summary: counts per severity per goal,
and the single most important fix.
