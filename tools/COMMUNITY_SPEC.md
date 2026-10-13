# Community-notes digest spec (for delegate models)

Base dir: `/Users/ywbw/unimelboure_course/cs224n/reference`

We are writing a Chinese step-by-step tutorial that follows Stanford CS224N **Winter 2026 (W26)**. The official
material is already digested in `digests/` (slides `Lxx.md`, notes `Nxx.md`, assignments `Ax.md`, lecture
transcripts `Txx.md` / `TWxx.md`). Two third-party Chinese note sets were added as **secondary references**. They have
no licence: never copy their sentences into your output beyond a short quote (≤ 15 Chinese characters or ≤ 10 English
words) when a quote is needed to pin down a term or analogy. Summarise in your own words, in English.

Sources:
- `community/looperxx/ocr/NN.md` — OCR of LooperXX's 2019 CS224N reading notes (2019 lecture NN). They follow the
  lecture videos, so they record classroom explanations that are not on the slides. Page markers look like
  `<!-- p07.png -->`; cite pages as `p07`. OCR is good for Chinese prose and bad for formulas: never take a formula from
  here.
- `community/lvsir18/lectures/NN-*.md` — short Chinese notes for all 19 W26 lectures, written by a student from a
  personal notes site. Treat them as a topic checklist only, not as a source of facts.

Mapping of 2019 lectures to W26 digests you must check against:

| 2019 note | Topic | W26 digests to compare with |
|---|---|---|
| 01 | Introduction and word vectors | L01a, L01b, L02, N01 |
| 02 | Word vectors 2, word senses | L02, N01, N02 |
| 03 | Window classification, neural nets, matrix calculus | L03, N03, N04, T03 |
| 04 | Backpropagation and computation graphs | L03, N03, N05, T03 |
| 05 | Dependency parsing | N08, A2, TW04 |
| 06 | Language models and RNNs | L04, N06, T06 |
| 07 | Vanishing gradients, LSTM/GRU | L04, L05, N06, TW06, T06 |
| 08 | Machine translation, seq2seq, attention | L04, L05, N09, T07 |
| 12 | Subword models | L07, L14 |
| 14 | Transformers and self-attention | L05, N07, T07, T08 |

## Output for LooperXX: one file per note, `digests/LX<NN>.md` (e.g. `digests/LX06.md`)

Do not create or modify any other file. Write each file as soon as that note is done.

```
# LX<NN> — <2019 lecture title> (LooperXX notes, 2019)

## 1. Teaching order in the notes
- p<NN>: <one line per step: what is explained, in what order, motivated by what question>

## 2. Explanations, analogies and examples worth borrowing
For each item that helps a beginner understand (an analogy, an intuition, a worked example, a "why"):
- **<short name>** (p<NN>) — <what it says, in your words>
  - Status: one of
    - `W26: <digest file> <page/section>` — the same idea is in the official W26 material (say where)
    - `Official older: <digest file>` — only in the 2019 notes N08/N09 or a transcript T/TW digest
    - `NOT FOUND` — not in any digest you checked (we will mark it 课件外 or drop it)

## 3. Where 2019 differs from W26
- <notation, ordering, content that W26 dropped or added; cite both sides>

## 4. Chinese terminology used by the notes
| English | Chinese in the notes | page |
(only technical terms; 10–40 rows)

## 5. OCR problems
- <places where the OCR text was too broken to read>
```

Rules:
- Check every Status claim by searching the digest files (grep for the key English term). Do not guess.
- Skip course logistics, assignments' admin details and code listings.
- If the notes state something that contradicts the W26 digests, report it in section 3; do not resolve it yourself.

## Output for lvsir18: `digests/community-lvsir18.md`

```
# lvsir18 W26 notes — topic check

## Per lecture
### L<NN> <title>
- <topic mentioned in the note> → `COURSE_MAP §3 <chapter number>` if covered | `W26 digest only: <file>` if the
  official material has it but COURSE_MAP has no chapter for it | `not in W26 material` otherwise

## Gaps worth attention
- <topics that ARE in the W26 digests but missing from COURSE_MAP §3, most important first>

## Chinese terminology
| English | Chinese in the notes |
```

Use `/Users/ywbw/unimelboure_course/cs224n/COURSE_MAP.md` §3 for the chapter list.
