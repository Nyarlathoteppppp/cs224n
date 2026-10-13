(function (root) {
  'use strict';
  /* LSTM and GRU cells exactly as written in N06 p11 and p13 (no bias terms, ∘ = elementwise product). */

  function dep(name) {
    const ns = root.CS224N && root.CS224N.core && root.CS224N.core[name];
    if (ns) return ns;
    if (typeof require === 'function') return require('./' + name + '.js');
    throw new Error('missing core module ' + name);
  }
  const L = dep('linalg'), P = dep('prob');
  const affine = (W, x, U, h) => L.add(L.matvec(W, x), L.matvec(U, h));

  /** N06 p13:  i = σ(W⁽ⁱ⁾x + U⁽ⁱ⁾h),  f = σ(W⁽ᶠ⁾x + U⁽ᶠ⁾h),  o = σ(W⁽ᵒ⁾x + U⁽ᵒ⁾h),
   *  c̃ = tanh(W⁽ᶜ⁾x + U⁽ᶜ⁾h),  c = f ∘ c₋₁ + i ∘ c̃,  h = o ∘ tanh(c). */
  function lstmStep(p, x, hPrev, cPrev) {
    const i = affine(p.Wi, x, p.Ui, hPrev).map(P.sigmoid);
    const f = affine(p.Wf, x, p.Uf, hPrev).map(P.sigmoid);
    const o = affine(p.Wo, x, p.Uo, hPrev).map(P.sigmoid);
    const cTilde = affine(p.Wc, x, p.Uc, hPrev).map(Math.tanh);
    const c = L.add(L.hadamard(f, cPrev), L.hadamard(i, cTilde));
    const h = L.hadamard(o, c.map(Math.tanh));
    return { i, f, o, cTilde, c, h };
  }

  /** N06 p11:  z = σ(W⁽ᶻ⁾x + U⁽ᶻ⁾h),  r = σ(W⁽ʳ⁾x + U⁽ʳ⁾h),  h̃ = tanh(r ∘ Uh + Wx),  h = (1 − z) ∘ h̃ + z ∘ h₋₁. */
  function gruStep(p, x, hPrev) {
    const z = affine(p.Wz, x, p.Uz, hPrev).map(P.sigmoid);
    const r = affine(p.Wr, x, p.Ur, hPrev).map(P.sigmoid);
    const hTilde = L.add(L.hadamard(r, L.matvec(p.U, hPrev)), L.matvec(p.W, x)).map(Math.tanh);
    const h = hTilde.map((v, k) => (1 - z[k]) * v + z[k] * hPrev[k]);
    return { z, r, hTilde, h };
  }

  const api = { lstmStep, gruStep };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.gated = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
