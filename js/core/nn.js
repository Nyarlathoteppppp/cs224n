(function (root) {
  'use strict';
  /* Neural-network building blocks for Part 2 (L03; N03; A2 Q1 f–g). */

  function dep(name) {
    const ns = root.CS224N && root.CS224N.core && root.CS224N.core[name];
    if (ns) return ns;
    if (typeof require === 'function') return require('./' + name + '.js');
    throw new Error('missing core module ' + name);
  }
  const L = dep('linalg'), P = dep('prob');

  /** erf by Abramowitz & Stegun 7.1.26 (absolute error < 1.5e−7). JavaScript has no built-in erf. */
  function erf(x) {
    const s = Math.sign(x), a = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * a);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
    return s * y;
  }
  const normalCdf = (x) => 0.5 * (1 + erf(x / Math.SQRT2));

  /** Activation functions and their derivatives (L03 p15–p16; A2 Q1 f–g). */
  const activations = {
    sigmoid: { f: P.sigmoid, df: (z) => { const s = P.sigmoid(z); return s * (1 - s); } },
    tanh: { f: Math.tanh, df: (z) => 1 - Math.tanh(z) ** 2 },
    relu: { f: (z) => Math.max(z, 0), df: (z) => (z > 0 ? 1 : 0) },
    leakyRelu: { f: (z, a) => Math.max((a === undefined ? 0.01 : a) * z, z), df: (z, a) => (z > 0 ? 1 : (a === undefined ? 0.01 : a)) },
    gelu: { f: (z) => z * normalCdf(z) },                                   // x · P(X ≤ x), X ~ N(0,1)
    geluLogistic: { f: (z) => z * P.sigmoid(1.702 * z) },                   // the slide's approximation
    silu: { f: (z) => z * P.sigmoid(z) },
    swish: { f: (z, beta) => z * P.sigmoid((beta === undefined ? 1 : beta) * z) },
    cube: { f: (z) => z * z * z, df: (z) => 3 * z * z },                    // Chen & Manning's parser (N08 p5)
  };
  function act(name) {
    const a = activations[name];
    if (!a) throw new Error('unknown activation ' + name);
    return a;
  }

  /** Window classifier (L03 p14): z = Wx + b, h = f(z), s = uᵀh, probability σ(s). */
  function windowForward(params, x, fName) {
    const a = act(fName || 'sigmoid');
    const z = L.add(L.matvec(params.W, x), params.b);
    const h = z.map((v) => a.f(v));
    const s = L.dot(params.u, h);
    return { z, h, s, prob: P.sigmoid(s) };
  }

  /** Gradients of the score s (L03 p41–p53), all in the shape convention (gradient has the parameter's shape):
   * δ = u ∘ f′(z) (the slide writes the row uᵀ ∘ f′(z)); ∂s/∂b = δ; ∂s/∂W = δ xᵀ (outer product);
   * ∂s/∂u = h; ∂s/∂x = Wᵀ δ. */
  function windowScoreGrad(params, x, fName) {
    const a = act(fName || 'sigmoid');
    const fwd = windowForward(params, x, fName);
    const delta = L.hadamard(params.u, fwd.z.map((v) => a.df(v)));
    return {
      forward: fwd,
      delta,
      dB: delta,
      dW: L.outer(delta, x),
      dU: fwd.h,
      dX: L.vecmat(delta, params.W),
    };
  }

  const api = { erf, normalCdf, activations, act, windowForward, windowScoreGrad };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.nn = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
