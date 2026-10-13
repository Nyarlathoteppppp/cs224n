(function (root) {
  'use strict';
  /* Optimisers and dropout (L02 p21–p22; N03 p11–p18; A2 Q2). Parameters and gradients are flat number arrays.
   * Each step function returns the new parameters and the new optimiser state; nothing is mutated. */

  /** θ ← θ − α ∇J   (L02 p21). */
  function sgd(theta, grad, lr) { return { theta: theta.map((t, i) => t - lr * grad[i]) }; }

  /** A2 Q2(a)i: m ← β₁m + (1−β₁)∇J,  θ ← θ − α m. */
  function momentum(state, theta, grad, lr, beta1) {
    const b1 = beta1 === undefined ? 0.9 : beta1;
    const m = (state.m || theta.map(() => 0)).map((mi, i) => b1 * mi + (1 - b1) * grad[i]);
    return { theta: theta.map((t, i) => t - lr * m[i]), state: { m } };
  }

  /** A2 Q2(a)ii, the simplified Adam of the handout (no bias correction):
   * m ← β₁m + (1−β₁)∇J,  v ← β₂v + (1−β₂)(∇J ⊙ ∇J),  θ ← θ − α m / √v.
   * eps only guards the division when v is 0; the handout's formula has no eps. */
  function adam(state, theta, grad, lr, beta1, beta2, eps) {
    const b1 = beta1 === undefined ? 0.9 : beta1, b2 = beta2 === undefined ? 0.99 : beta2;
    const e = eps === undefined ? 1e-8 : eps;
    const m = (state.m || theta.map(() => 0)).map((mi, i) => b1 * mi + (1 - b1) * grad[i]);
    const v = (state.v || theta.map(() => 0)).map((vi, i) => b2 * vi + (1 - b2) * grad[i] * grad[i]);
    return { theta: theta.map((t, i) => t - lr * m[i] / (Math.sqrt(v[i]) + e)), state: { m, v } };
  }

  /** N03 p17 snippet 2.3: cache += dx², x −= lr · dx / √(cache + 1e−8). */
  function adagrad(state, theta, grad, lr) {
    const cache = (state.cache || theta.map(() => 0)).map((c, i) => c + grad[i] * grad[i]);
    return { theta: theta.map((t, i) => t - lr * grad[i] / Math.sqrt(cache[i] + 1e-8)), state: { cache } };
  }

  /** Dropout (A2 Q2(b)): h_drop = γ d ⊙ h, each d_i = 0 with probability p_drop.
   * γ = 1 / (1 − p_drop) makes E[h_drop]_i = h_i. `rand` is a function returning numbers in [0, 1). */
  function dropout(h, pDrop, rand) {
    const gamma = 1 / (1 - pDrop);
    const d = h.map(() => (rand() < pDrop ? 0 : 1));
    return { d, gamma, hDrop: h.map((v, i) => gamma * d[i] * v) };
  }

  /** Gradient clipping by norm (L04 p49): if ‖g‖ ≥ threshold, g ← (threshold / ‖g‖) g. */
  function clipByNorm(grad, threshold) {
    const n = Math.sqrt(grad.reduce((s, v) => s + v * v, 0));
    if (n < threshold) return { grad: grad.slice(), clipped: false, norm: n };
    return { grad: grad.map((v) => (threshold / n) * v), clipped: true, norm: n };
  }

  /** Deterministic pseudo-random numbers (mulberry32), so every "random" example on the site is reproducible. */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /** Standard normal samples from a uniform generator (Box–Muller). */
  function gaussian(rand) {
    const u = Math.max(rand(), 1e-12), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  const api = { sgd, momentum, adam, adagrad, dropout, clipByNorm, rng, gaussian };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.optim = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
