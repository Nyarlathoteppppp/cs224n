# Document digest spec (for delegate models)

Base dir: `/Users/ywbw/unimelboure_course/cs224n/reference`

Inputs for a document KEY (e.g. L03, N02, A2):
- `text/KEY.md` — PDF text, one `## pN` section per page. Pages marked `[picture]` are mostly images.
  Maths in this text is often **missing or garbled**: many slide equations are images, so the text may show only
  "Update equation:" with nothing after it.
- `pages/KEY/pNN.jpg` — the rendered page N (two digits: p03.jpg; three digits are not used — p100 would be p100.jpg).
  **Open the image for every page that has any formula, table, plot, diagram, code or number, every `[picture]` page,
  and every page whose text looks incomplete.** The image is the ground truth; the text is only a helper.
- Extra inputs listed in your task (LaTeX sources of assignments, the A1 notebook text).
  Lecture transcripts are digested separately (tools/TRANSCRIPT_SPEC.md); do not read them for this task.

Output: exactly one file per document, `digests/KEY.md`. Do not modify or create any other file.
Write each digest as soon as that document is done, before starting the next one, so partial progress is saved.

Digest format (Markdown; English for all technical content; keep the document's exact terms and notation):

```
# KEY — <title> (<speaker/author if shown>, <N> pages)

## 1. Outline
- p1–p4: <topic>
- ...

## 2. Definitions
- **<Term>** (pN): <definition as given, faithful paraphrase>

## 3. Formulas
- (pN) <name>: $<LaTeX>$ — symbols: <what each symbol means, as stated in the document>
  (Reconstruct LaTeX from the page IMAGE. Keep exact notation: indices, hats, transposes, bold, sums' ranges.)

## 4. Worked examples & concrete numbers
- (pN) <every concrete numeric example, table, toy sentence/corpus, matrix with numbers, plot values, model sizes,
  dataset sizes, benchmark scores, step-by-step computation — reproduce ALL numbers and example words/sentences>
- (pN, figure) <for diagrams without numbers: what is drawn (boxes, arrows, labels) and the point it makes>

## 5. Algorithms / procedures
- (pN) <name>: numbered steps as given (pseudo-code ok)

## 6. Key claims, comparisons, intuitions
- (pN) <pros/cons, X vs Y, why X fails, when to use, complexity, historical claims, "the key idea is …" statements>

## 7. Questions / exercises in the document
- (pN) <any question posed to the audience, quiz, exercise, assignment question — with answer if given>

## 8. Possible errors / ambiguities / unreadable parts
- (pN) <inconsistencies, typos, notation clashes; unreadable images; "none found" if none>

## 9. Assumed background
- (pN) <concepts, notation or facts USED in this document without being defined or explained in it, e.g.
  "uses the chain rule", "assumes the reader knows what softmax is", "Hessian mentioned without definition",
  "refers to RNNs from an earlier lecture". This list drives what a beginner must be taught first.>
```

Rules:
- **Fidelity is the whole point.** Write only what is visibly on the page. The most common failure is adding your
  own textbook knowledge: a definition, a formula the slide does not show, "this works because…", the steps of a
  method the slide only names. Do not. If a page uses a term without defining it, it goes under section 9
  (assumed background), not section 2. If a page only names a method, say "named, not explained".
- Every bullet cites its page. Do not invent anything that is not in the document.
  No outside knowledge, no textbook additions, no "this is commonly known as".
- Completeness over brevity: never drop numbers, example words, or formula details. Skip only title/logo/
  copyright/"questions?" boilerplate.
- If an image is unreadable, say so in section 8.
- When all assigned documents are done, reply with a short report: files written, pages covered,
  pages you could not read.
