# Review spec: “never assume what hasn't been taught” (for delegate models)

Project: a Chinese tutorial website for Stanford CS224N, at `/Users/ywbw/unimelboure_course/cs224n`.
Chapters are JavaScript data files in `data/chapters/` (one object per chapter; text is Markdown with `$…$` LaTeX).

**The reader**: knows only Chinese high-school maths (functions, plane vectors and the dot product, basic
probability, exponential and log functions, simple derivatives). Knows no linear algebra beyond that, no machine
learning, no NLP, no programming jargon.

**Reading order** (a chapter may rely only on itself and the chapters before it):
0.1 `c0-1.js` → 0.2 `c0-2.js` → 0.3 `c0-3.js` → 1.1 `c1-1.js` → … → 1.7 `c1-7.js` → 2.1 `c2-1.js` → … → 2.7 `c2-7.js`.
Later chapters (part 3 onwards) follow the same pattern as they get written; `COURSE_MAP.md` §3 lists them all.
Chapters with `kind: 'homework'` only explain the approach to an assignment, never the answers; do not ask them to
give answers.

## What to look for
For each chapter you are given, read every field (hook, background, usedIn, goals, prereq, topics: question,
intuition, formulas[].parts[].label/text, math, example, story, takeaway; compare; pitfalls; quiz q/options/explain/why;
takeaways). Report every place where the reader would need something they have not been taught yet:

1. A term, name or abbreviation used without explanation (Chinese or English), e.g. 参数, 泛化, logistic 回归, NER.
2. A symbol or notation used without explanation, e.g. $\nabla$, $\partial$, $\arg\max$, $\odot$, $\|x\|$, $\hat X$, $\top$, $\sum$, $\prod$, $\mathbb R^d$.
3. A derivation step that silently uses a rule the reader has not seen (e.g. the derivative of $\log$, of $u^\top v$ with respect to $v$).
4. A sentence that only makes sense if you already know the idea (e.g. “like PCA”, “as in logistic regression”).
5. An explanation that exists but is too terse for a high-school reader to follow (say what is missing).

Something is fine if it is explained **in the same chapter before or at its first use**, or in an earlier chapter, or
if the sentence explicitly points forward (“第 X 章会讲”, “下一节”). The file `tests/taught.js` lists where many terms
are taught; it is not complete.

Do NOT report: style preferences, things that are explained correctly, typos unrelated to understanding, factual
disagreements (unless they would confuse a beginner).

## Output
Write exactly one Markdown file at the path given in your task. Do not modify any other file.

```
# Prerequisite review — <chapters>

## <chapter id> <title>
- **[severity]** <field / topic id> — “<quote of at most 15 Chinese characters or 10 words>”
  - Assumes: <what the reader would need to know>
  - Fix: <one sentence: where to explain it, or what forward pointer to add>
```

severity: `blocker` (the reader cannot follow without it), `major` (likely confusion), `minor` (small gap).
List blockers first in each chapter. If a chapter has no problems, write “No issues found.” under its heading.
End with a 3-line summary: counts per severity and the single most important fix.
