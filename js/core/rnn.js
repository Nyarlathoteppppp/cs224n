(function (root) {
  'use strict';
  /* Simple RNN language model (L04 p23–p39; N06 p3–p7):
   *   e(t) = E x(t)               the embedding of the word at step t (E holds one row per word here)
   *   h(t) = σ(W_h h(t−1) + W_e e(t) + b₁)
   *   ŷ(t) = softmax(U h(t) + b₂)  a distribution over the next word
   * Loss: J = (1/T) Σ_t −log ŷ(t)[x(t+1)], i.e. teacher forcing (L04 p26–p31). */

  function dep(name) {
    const ns = root.CS224N && root.CS224N.core && root.CS224N.core[name];
    if (ns) return ns;
    if (typeof require === 'function') return require('./' + name + '.js');
    throw new Error('missing core module ' + name);
  }
  const L = dep('linalg'), P = dep('prob');

  /** Runs the RNN over ids[0..T−1], predicting ids[1..T] (one fewer prediction than inputs). */
  function forward(p, ids) {
    let h = p.h0.slice();
    const steps = [];
    for (let t = 0; t + 1 < ids.length; t++) {
      const e = p.E[ids[t]];
      const z = L.add(L.add(L.matvec(p.Wh, h), L.matvec(p.We, e)), p.b1);
      const hNew = z.map(P.sigmoid);
      const logits = L.add(L.matvec(p.U, hNew), p.b2);
      const yhat = P.softmax(logits);
      const target = ids[t + 1];
      steps.push({ t, input: ids[t], target, e, hPrev: h, z, h: hNew, yhat, loss: -Math.log(yhat[target]) });
      h = hNew;
    }
    const J = steps.reduce((s, st) => s + st.loss, 0) / steps.length;
    return { steps, J, perplexity: Math.exp(J) };
  }

  /** Backpropagation through time for the mean loss J. The shared W_h collects one contribution per step
   * (L04 p33–p35): that is the "+=" inside the loop. Gradients follow the shape convention. */
  function bptt(p, ids) {
    const { steps, J } = forward(p, ids);
    const T = steps.length;
    const g = {
      E: L.zerosMat(p.E.length, p.E[0].length), Wh: L.zerosMat(p.Wh.length, p.Wh[0].length),
      We: L.zerosMat(p.We.length, p.We[0].length), b1: L.zeros(p.b1.length),
      U: L.zerosMat(p.U.length, p.U[0].length), b2: L.zeros(p.b2.length), h0: L.zeros(p.h0.length),
    };
    let dhNext = L.zeros(p.h0.length);
    for (let t = T - 1; t >= 0; t--) {
      const st = steps[t];
      const dLogits = st.yhat.map((v, w) => (v - (w === st.target ? 1 : 0)) / T);
      g.U = L.matAdd(g.U, L.outer(dLogits, st.h));
      g.b2 = L.add(g.b2, dLogits);
      const dh = L.add(L.vecmat(dLogits, p.U), dhNext);
      const dz = dh.map((v, i) => v * st.h[i] * (1 - st.h[i]));      // σ′(z) = σ(z)(1 − σ(z))
      g.Wh = L.matAdd(g.Wh, L.outer(dz, st.hPrev));
      g.We = L.matAdd(g.We, L.outer(dz, st.e));
      g.b1 = L.add(g.b1, dz);
      g.E[st.input] = L.add(g.E[st.input], L.vecmat(dz, p.We));
      dhNext = L.vecmat(dz, p.Wh);
    }
    g.h0 = dhNext;
    return { J, grads: g };
  }

  /** ‖∂J(last)/∂h(k)‖ for every step k, using only the loss at the final step: how much the last prediction's
   * gradient still reaches earlier hidden states (L04 p40–p46). */
  function gradientReach(p, ids) {
    const { steps } = forward(p, ids);
    const last = steps[steps.length - 1];
    let dh = L.vecmat(last.yhat.map((v, w) => v - (w === last.target ? 1 : 0)), p.U);
    const norms = new Array(steps.length);
    for (let k = steps.length - 1; k >= 0; k--) {
      norms[k] = L.norm(dh);
      const dz = dh.map((v, i) => v * steps[k].h[i] * (1 - steps[k].h[i]));
      dh = L.vecmat(dz, p.Wh);
    }
    return norms;
  }

  const api = { forward, bptt, gradientReach };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.rnn = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
