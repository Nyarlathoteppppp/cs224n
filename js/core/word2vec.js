(function (root) {
  'use strict';
  /* word2vec skip-gram (L02 p11–p29; N01 p8–p12; A2 Q1).
   * Every word w has a center vector v_w and an outside vector u_w. U holds the outside vectors as rows, so
   * U is |V| × d and row w is u_w (N01 p8: U, V ∈ R^{|V|×d}). */

  function dep(name) {
    const ns = root.CS224N && root.CS224N.core && root.CS224N.core[name];
    if (ns) return ns;
    if (typeof require === 'function') return require('./' + name + '.js');
    throw new Error('missing core module ' + name);
  }
  const L = dep('linalg'), P = dep('prob');

  /** Every (center, outside) pair in a window of m words on each side (L02 p12–p16). */
  function windowPairs(tokens, m) {
    const pairs = [];
    for (let t = 0; t < tokens.length; t++) {
      for (let j = -m; j <= m; j++) {
        if (j === 0 || t + j < 0 || t + j >= tokens.length) continue;
        pairs.push({ t, offset: j, center: tokens[t], outside: tokens[t + j] });
      }
    }
    return pairs;
  }

  /** Naive-softmax loss J = −log P(o|c) with P(o|c) = exp(u_oᵀv_c) / Σ_w exp(u_wᵀv_c)   (L02 p15; A2 eq. 1–2).
   * gradCenter = −u_o + Σ_x P(x|c) u_x: "observed minus expected" (N01 p11), returned with the sign of ∂J/∂v_c.
   * gradOutside row w = (P(w|c) − [w = o]) v_c. */
  function naiveSoftmax(vc, o, U) {
    const scores = U.map((u) => L.dot(u, vc));
    const yhat = P.softmax(scores);
    const loss = -Math.log(yhat[o]);
    const expected = L.zeros(vc.length);
    U.forEach((u, x) => { for (let k = 0; k < u.length; k++) expected[k] += yhat[x] * u[k]; });
    const gradCenter = L.sub(expected, U[o]);
    const gradOutside = U.map((_, w) => L.scale(vc, yhat[w] - (w === o ? 1 : 0)));
    return { scores, yhat, loss, expected, gradCenter, gradOutside };
  }

  /** Negative sampling: J = −log σ(u_oᵀv_c) − Σ_{k∈K} log σ(−u_kᵀv_c)   (L02 p27).
   * A repeated negative index contributes once per occurrence, to the loss and to its gradient row. */
  function negSampling(vc, o, U, negatives) {
    const so = P.sigmoid(L.dot(U[o], vc));
    let loss = -Math.log(so);
    let gradCenter = L.scale(U[o], -(1 - so));
    const gradOutside = U.map(() => L.zeros(vc.length));
    gradOutside[o] = L.scale(vc, -(1 - so));
    negatives.forEach((k) => {
      const sk = P.sigmoid(-L.dot(U[k], vc));
      loss -= Math.log(sk);
      gradCenter = L.add(gradCenter, L.scale(U[k], 1 - sk));
      gradOutside[k] = L.add(gradOutside[k], L.scale(vc, 1 - sk));
    });
    return { loss, gradCenter, gradOutside };
  }

  /** Sampling distribution P(w) = U(w)^power / Z, with power 3/4 in word2vec (L02 p27). */
  function unigramPower(counts, power) {
    const p = power === undefined ? 0.75 : power;
    return P.normalize(counts.map((c) => Math.pow(c, p)));
  }

  const api = { windowPairs, naiveSoftmax, negSampling, unigramPower };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.word2vec = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
