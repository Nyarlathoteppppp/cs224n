(function (root) {
  'use strict';
  /* Byte-pair encoding as walked through in L14 p25–p54 (and named in L07 p5–p7).
   * Pre-tokens: split on whitespace; every word after the first starts with "_" (L14 p27).
   * Ties in pair frequency are broken by comparing (left, right) case-insensitively, then by code point. That rule
   * reproduces every choice the slides make (_+p before p+e, c+k before e+r, _p+e before _p+i …) and also the row
   * order of the slides' frequency tables. */

  function pretokenize(text) {
    return text.trim().split(/\s+/).map((w, i) => (i === 0 ? w : '_' + w));
  }

  function comparePairs(a, b) {
    if (b.count !== a.count) return b.count - a.count;
    const la = a.left.toLowerCase(), lb = b.left.toLowerCase();
    if (la !== lb) return la < lb ? -1 : 1;
    const ra = a.right.toLowerCase(), rb = b.right.toLowerCase();
    if (ra !== rb) return ra < rb ? -1 : 1;
    const ka = a.left + '\u0000' + a.right, kb = b.left + '\u0000' + b.right;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  }

  /** Adjacent-pair frequencies over a corpus of pre-tokens (each an array of symbols), sorted as on the slides. */
  function pairTable(corpus) {
    const m = new Map();
    corpus.forEach((word) => {
      for (let i = 0; i + 1 < word.length; i++) {
        const key = word[i] + '\u0000' + word[i + 1];
        const e = m.get(key) || { left: word[i], right: word[i + 1], count: 0 };
        e.count += 1;
        m.set(key, e);
      }
    });
    return Array.from(m.values()).sort(comparePairs);
  }

  /** Replaces every non-overlapping occurrence of (left, right), scanning left to right. */
  function applyMerge(word, left, right) {
    const out = [];
    for (let i = 0; i < word.length; i++) {
      if (i + 1 < word.length && word[i] === left && word[i + 1] === right) { out.push(left + right); i += 1; }
      else out.push(word[i]);
    }
    return out;
  }

  /** Learns `numMerges` merge rules and records every step (table before the merge, the merge, the new corpus). */
  function train(text, numMerges) {
    let corpus = pretokenize(text).map((w) => Array.from(w));
    const vocab = [];
    corpus.forEach((w) => w.forEach((ch) => { if (vocab.indexOf(ch) < 0) vocab.push(ch); }));
    const initialVocab = vocab.slice();
    const merges = [], steps = [];
    for (let k = 0; k < numMerges; k++) {
      const table = pairTable(corpus);
      if (!table.length) break;
      const best = table[0];
      corpus = corpus.map((w) => applyMerge(w, best.left, best.right));
      merges.push([best.left, best.right]);
      vocab.push(best.left + best.right);
      steps.push({ table, merge: [best.left, best.right], count: best.count, corpus: corpus.map((w) => w.slice()), vocab: vocab.slice() });
    }
    return { initialVocab, merges, steps, corpus, finalTable: pairTable(corpus) };
  }

  /** Test-time tokenisation (L14 p54): split into symbols, then apply the merge rules in the order learned. */
  function encode(word, merges) {
    let symbols = Array.from(word);
    const trace = [];
    merges.forEach(([l, r], k) => {
      const next = applyMerge(symbols, l, r);
      if (next.length !== symbols.length) trace.push({ rule: k + 1, merge: [l, r], symbols: next.slice() });
      symbols = next;
    });
    return { symbols, trace };
  }

  const api = { pretokenize, pairTable, applyMerge, train, encode, comparePairs };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.bpe = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
