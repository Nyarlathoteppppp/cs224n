(function (root) {
  'use strict';
  /* n-gram language models (L04 p9–p18; N06 p1–p2). */

  /** Counts every n-gram (as a space-joined key) in a token list. */
  function counts(tokens, n) {
    const c = new Map();
    for (let i = 0; i + n <= tokens.length; i++) {
      const key = tokens.slice(i, i + n).join(' ');
      c.set(key, (c.get(key) || 0) + 1);
    }
    return c;
  }

  /** P(w | context) ≈ count(context w) / count(context)   (L04 p10–p11).
   * Returns null when the context never occurred: the probability cannot be computed (L04 p12). */
  function conditional(countTable, context, w) {
    const ctx = countTable[context] || 0;
    if (ctx === 0) return null;
    return (countTable[context + ' ' + w] || 0) / ctx;
  }

  /** Draws one word from a { word: probability } table with a uniform number u in [0, 1). Probabilities that do
   * not add up to 1 (the slides list only the top words) are renormalised over the listed words. */
  function sample(dist, u) {
    const words = Object.keys(dist);
    const total = words.reduce((s, w) => s + dist[w], 0);
    let acc = 0;
    for (const w of words) {
      acc += dist[w] / total;
      if (u < acc) return w;
    }
    return words[words.length - 1];
  }

  const api = { counts, conditional, sample };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.ngram = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
