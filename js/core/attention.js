(function (root) {
  'use strict';
  /* Attention and the Transformer block (L05 p22–p66; N07; A3).
   * Row convention, as in the matrix form of L05 p56 and A3 Q2: X is n × d (one row per word) and the queries are
   * XQ, the keys XK, the values XV. The per-word form q_i = Q x_i of L05 p42 is the same thing written for columns. */

  function dep(name) {
    const ns = root.CS224N && root.CS224N.core && root.CS224N.core[name];
    if (ns) return ns;
    if (typeof require === 'function') return require('./' + name + '.js');
    throw new Error('missing core module ' + name);
  }
  const L = dep('linalg'), P = dep('prob');

  /** One query against keys and values: scores k_iᵀq, weights softmax(scores · scale), output Σ α_i v_i
   * (L05 p25–p30; A3 Q1 eq. 1–2). */
  function attend(q, keys, values, scale) {
    const s = scale === undefined ? 1 : scale;
    const scores = keys.map((k) => L.dot(k, q) * s);
    const weights = P.softmax(scores);
    const output = L.zeros(values[0].length);
    values.forEach((v, i) => { for (let j = 0; j < v.length; j++) output[j] += weights[i] * v[j]; });
    return { scores, weights, output };
  }

  /** n × n mask: 0 where position i may look at j (j ≤ i), −∞ for the future (L05 p50). */
  function causalMask(n) {
    return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j <= i ? 0 : -Infinity)));
  }

  /** softmax(XQ (XK)ᵀ · scale + mask) XV   (L05 p56, p59). opts.scale defaults to 1; opts.causal adds the mask. */
  function selfAttention(X, Q, K, V, opts) {
    const o = opts || {};
    const queries = L.matmul(X, Q), keys = L.matmul(X, K), values = L.matmul(X, V);
    const s = o.scale === undefined ? 1 : o.scale;
    const mask = o.causal ? causalMask(X.length) : null;
    const scores = L.matmul(queries, L.transpose(keys)).map((row, i) => row.map((v, j) => v * s + (mask ? mask[i][j] : 0)));
    const weights = scores.map((row) => P.softmax(row));
    const output = L.matmul(weights, values);
    return { queries, keys, values, scores, weights, output };
  }

  /** Multi-head attention (L05 p57): each head has its own d × (d/h) Q, K, V; the head outputs are concatenated
   * and mixed by Y (d × d). Scaling by 1/√(d/h) is applied when opts.scaled is true (L05 p59). */
  function multiHead(X, heads, Y, opts) {
    const o = opts || {};
    const per = heads.map((hd) => {
      const dk = hd.Q[0].length;
      return selfAttention(X, hd.Q, hd.K, hd.V, { causal: o.causal, scale: o.scaled ? 1 / Math.sqrt(dk) : 1 });
    });
    const concat = X.map((_, i) => [].concat(...per.map((r) => r.output[i])));
    return { heads: per, concat, output: L.matmul(concat, Y) };
  }

  /** Layer normalisation of one vector (L05 p62): μ = mean, σ = mean squared deviation (the slide calls it the
   * variance), output = (x − μ) / √(σ + ε) ∘ γ + β. Statistics are taken over this vector's d entries only. */
  function layerNorm(x, gamma, beta, eps) {
    const e = eps === undefined ? 1e-5 : eps;
    const mu = P.mean(x);
    const sigma = x.reduce((s, v) => s + (v - mu) * (v - mu), 0) / x.length;
    const g = gamma || x.map(() => 1), b = beta || x.map(() => 0);
    return { mu, sigma, output: x.map((v, i) => ((v - mu) / Math.sqrt(sigma + e)) * g[i] + b[i]) };
  }

  /** Sinusoidal position vectors, n positions × d dimensions (d even).
   * variant 'a3' (default): Φ(t, 2i) = sin(t / 10000^{2i/d}), Φ(t, 2i+1) = cos(…), t = 0…n−1, i = 0…d/2−1 (A3 Q2).
   * variant 'l05': positions i = 1…n and frequencies k = 1…d/2, i.e. sin(i / 10000^{2k/d}) (L05 p45 as printed). */
  function sinusoidal(n, d, variant) {
    if (d % 2) throw new Error('sinusoidal: d must be even');
    const slide = variant === 'l05';
    return Array.from({ length: n }, (_, r) => {
      const pos = slide ? r + 1 : r;
      const row = new Array(d);
      for (let i = 0; i < d / 2; i++) {
        const k = slide ? i + 1 : i;
        const angle = pos / Math.pow(10000, (2 * k) / d);
        row[2 * i] = Math.sin(angle);
        row[2 * i + 1] = Math.cos(angle);
      }
      return row;
    });
  }

  /** Position-wise feed-forward network applied to every row (A3 Q2): ReLU(H W₁ + b₁) W₂ + b₂. */
  function feedForward(H, W1, b1, W2, b2) {
    return H.map((row) => L.add(L.vecmat(L.add(L.vecmat(row, W1), b1).map((v) => Math.max(v, 0)), W2), b2));
  }

  /** Rows of X in a new order: output row i is X[perm[i]]. */
  function permuteRows(X, perm) { return perm.map((i) => X[i].slice()); }

  const api = { attend, causalMask, selfAttention, multiHead, layerNorm, sinusoidal, feedForward, permuteRows };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.attention = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
