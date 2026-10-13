(function (root) {
  'use strict';
  /* Probability helpers shared by every chapter: softmax, sigmoid, cross-entropy, entropy, KL, perplexity. */

  /** softmax(x)_i = exp(x_i / τ) / Σ_j exp(x_j / τ)   (L02 p17; temperature τ from L12 p18).
   * Subtracting the max first changes nothing mathematically but avoids overflow. Entries equal to −∞
   * (masked attention scores, L05 p50) get probability exactly 0. */
  function softmax(x, tau) {
    const t = tau === undefined ? 1 : tau;
    if (!(t > 0)) throw new Error('softmax: temperature must be > 0');
    const scaled = x.map((v) => v / t);
    const m = Math.max(...scaled);
    if (m === -Infinity) throw new Error('softmax: every entry is −∞');
    const e = scaled.map((v) => (v === -Infinity ? 0 : Math.exp(v - m)));
    const z = e.reduce((s, v) => s + v, 0);
    return e.map((v) => v / z);
  }
  function logSumExp(x) {
    const m = Math.max(...x);
    if (m === -Infinity) return -Infinity;
    return m + Math.log(x.reduce((s, v) => s + Math.exp(v - m), 0));
  }
  /** σ(x) = 1 / (1 + e^{−x})   (L02 p27). Written two ways so that large |x| never overflows. */
  function sigmoid(x) {
    if (x >= 0) return 1 / (1 + Math.exp(-x));
    const e = Math.exp(x);
    return e / (1 + e);
  }
  /** H(p, q) = −Σ_c p(c) log q(c)   (L03 p18). Terms with p(c) = 0 contribute 0. */
  function crossEntropy(p, q) {
    if (p.length !== q.length) throw new Error('crossEntropy: length mismatch');
    let h = 0;
    for (let i = 0; i < p.length; i++) if (p[i] > 0) h -= p[i] * Math.log(q[i]);
    return h;
  }
  /** −log q[i]: cross-entropy against a one-hot target that puts all mass on class i. */
  function nll(q, i) { return -Math.log(q[i]); }
  function oneHot(n, i) { const v = new Array(n).fill(0); v[i] = 1; return v; }
  /** H(p) = −Σ p_i log p_i   (L11 p43), natural log. */
  function entropy(p) { return crossEntropy(p, p); }
  /** KL(P‖Q) = Σ p_i log(p_i / q_i) = H(P, Q) − H(P)   (L11 p47). */
  function kl(p, q) {
    let d = 0;
    for (let i = 0; i < p.length; i++) if (p[i] > 0) d += p[i] * Math.log(p[i] / q[i]);
    return d;
  }
  /** Perplexity = exp(average of −log P(true next word))   (L04 p39). */
  function perplexity(trueProbs) {
    const mean = trueProbs.reduce((s, p) => s - Math.log(p), 0) / trueProbs.length;
    return Math.exp(mean);
  }
  function normalize(w) {
    const z = w.reduce((s, v) => s + v, 0);
    return w.map((v) => v / z);
  }
  function mean(a) { return a.reduce((s, v) => s + v, 0) / a.length; }
  /** Population standard deviation (divide by n). */
  function std(a) {
    const m = mean(a);
    return Math.sqrt(a.reduce((s, v) => s + (v - m) * (v - m), 0) / a.length);
  }

  const api = { softmax, logSumExp, sigmoid, crossEntropy, nll, oneHot, entropy, kl, perplexity, normalize, mean, std };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.prob = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
