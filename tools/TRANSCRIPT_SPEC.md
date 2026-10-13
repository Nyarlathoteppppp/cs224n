# Lecture transcript digest spec (for delegate models)

Base dir: `/Users/ywbw/unimelboure_course/cs224n/reference`

Purpose: we are writing a step-by-step tutorial and want to borrow **how a human teacher teaches** each topic:
the order of explanation, how each idea is motivated, the examples and analogies, where the teacher slows down,
what students got confused about. The slides say WHAT; this digest must capture HOW and IN WHAT ORDER.

Input: `transcripts/clean/NN.txt` — YouTube auto-captions of one CS224N lecture (Spring 2024 or 2023 offering),
one paragraph per ~30 s, each starting with `[mm:ss]`. Auto-captions mis-hear technical words
(e.g. "newal networks" = neural networks, "dependency paing" = dependency parsing, "soft Max" = softmax).
Fix them in your digest using the context, and list the fixes you were unsure about in section 8.

Output: exactly one file per transcript, `digests/TNN.md` (NN = the transcript number). Do not modify or create any
other file. Write each digest as soon as that transcript is done, before starting the next one.

Format (Markdown, English):

```
# TNN — <lecture title> (<lecturer>, <offering>, ~<duration> min)

## 1. Teaching flow (in order)
- [mm:ss] <one line per move the teacher makes: "opens with the question …", "shows the example …",
  "derives … step by step", "goes back to …", "answers a student question about …", "switches to topic …">
  Cover the whole lecture. Aim for one bullet per 1–3 minutes; more where the teacher is explaining maths.

## 2. How each concept is introduced
For every concept that gets real explanation time, in the order taught:
- **<Concept>** [mm:ss–mm:ss]
  - Motivation: <the problem or question the teacher uses to make you want this concept>
  - Intuition / picture: <the informal explanation, analogy, or mental image>
  - Formal step: <the definition / equation as the teacher states it in words>
  - Example: <the concrete example used — words, sentences, numbers, toy data>
  - Connects to: <what earlier idea it builds on, what later idea it sets up>

## 3. Analogies, intuitions and mental pictures
- [mm:ss] <every analogy or vivid explanation, with a short quote>

## 4. Emphasis, warnings and common confusions
- [mm:ss] <"the important thing is …", "people often get confused by …", "this is the key idea", tips for the
  assignment, things the teacher repeats>

## 5. Student questions and the answers
- [mm:ss] Q: <question> — A: <the teacher's answer, condensed>

## 6. Worked examples spoken aloud
- [mm:ss] <any numbers, example words/sentences, step-by-step calculations the teacher talks through>

## 7. Assumed background
- [mm:ss] <what the teacher assumes students already know, or says "you should have seen this in …">

## 8. Transcription problems
- [mm:ss] <garbled passages, uncertain term fixes, places where the teacher points at a slide and the words alone
  do not make sense>
```

Rules:
- Only report what is in the transcript. No outside knowledge, no filling gaps from your own understanding.
- Keep the teacher's order. Section 1 must read as the lecture's storyline from start to end.
- Short quotes (under 20 words) are fine for flavour; do not copy long passages.
- Skip administrivia (deadlines, office hours, logistics) except one line in section 1 noting that it happened.
- When all assigned transcripts are done, reply with a short report: files written, anything you could not cover.
