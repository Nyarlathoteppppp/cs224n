(function (root) {
  'use strict';
  /* Count-based word vectors (L02 p30–p37; A1): window co-occurrence counts, truncated SVD, analogies. */

  function dep(name) {
    const ns = root.CS224N && root.CS224N.core && root.CS224N.core[name];
    if (ns) return ns;
    if (typeof require === 'function') return require('./' + name + '.js');
    throw new Error('missing core module ' + name);
  }
  const L = dep('linalg');

  /** Symmetric window co-occurrence matrix (L02 p31). Each sentence is counted on its own, so a window never
   * reaches across a sentence boundary. `vocab` fixes the row/column order; omitted, it is first-seen order. */
  function cooccurrence(sentences, window, vocab) {
    const words = vocab || [];
    if (!vocab) sentences.forEach((s) => s.forEach((w) => { if (words.indexOf(w) < 0) words.push(w); }));
    const index = new Map(words.map((w, i) => [w, i]));
    const X = L.zerosMat(words.length, words.length);
    sentences.forEach((s) => {
      for (let t = 0; t < s.length; t++) {
        for (let j = 1; j <= window && t + j < s.length; j++) {
          const a = index.get(s[t]), b = index.get(s[t + j]);
          X[a][b] += 1;
          X[b][a] += 1;
        }
      }
    });
    return { words, X };
  }

  /** Eigen-decomposition of a symmetric matrix by cyclic Jacobi rotations. Eigenvalues sorted largest first;
   * each eigenvector's sign is fixed so its largest-magnitude entry is positive (makes plots reproducible). */
  function symmetricEigen(A, maxSweeps) {
    const n = A.length;
    const a = A.map((r) => r.slice());
    let V = L.identity(n);
    for (let sweep = 0; sweep < (maxSweeps || 100); sweep++) {
      let off = 0;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
      if (off < 1e-22) break;
      for (let p = 0; p < n; p++) {
        for (let q = p + 1; q < n; q++) {
          if (Math.abs(a[p][q]) < 1e-15) continue;
          const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
          const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
          const c = 1 / Math.sqrt(t * t + 1), s = t * c;
          for (let k = 0; k < n; k++) {
            const akp = a[k][p], akq = a[k][q];
            a[k][p] = c * akp - s * akq;
            a[k][q] = s * akp + c * akq;
          }
          for (let k = 0; k < n; k++) {
            const apk = a[p][k], aqk = a[q][k];
            a[p][k] = c * apk - s * aqk;
            a[q][k] = s * apk + c * aqk;
          }
          for (let k = 0; k < n; k++) {
            const vkp = V[k][p], vkq = V[k][q];
            V[k][p] = c * vkp - s * vkq;
            V[k][q] = s * vkp + c * vkq;
          }
        }
      }
    }
    const order = a.map((r, i) => i).sort((i, j) => a[j][j] - a[i][i]);
    const values = order.map((i) => a[i][i]);
    const vectors = order.map((i) => {
      const col = V.map((r) => r[i]);
      const big = col.reduce((b, v, k) => (Math.abs(v) > Math.abs(col[b]) ? k : b), 0);
      return col[big] < 0 ? col.map((v) => -v) : col;
    });
    return { values, vectors };                       // vectors[i] is the i-th eigenvector
  }

  /** Truncated SVD X ≈ U_k Σ_k V_kᵀ (L02 p33), via the eigen-decomposition of XᵀX.
   * reduced = X V_k = U_k Σ_k: the k-dimensional word vectors (what A1's reduce_to_k_dim plots). */
  function truncatedSVD(X, k) {
    const { values, vectors } = symmetricEigen(L.matmul(L.transpose(X), X));
    const sigma = values.slice(0, k).map((v) => Math.sqrt(Math.max(0, v)));
    const Vk = vectors.slice(0, k);                    // k rows, each a right singular vector
    const reduced = X.map((row) => Vk.map((v) => L.dot(row, v)));
    return { sigma, V: Vk, reduced, allSingularValues: values.map((v) => Math.sqrt(Math.max(0, v))) };
  }

  /** a : b :: c : ?  →  argmax_i (x_b − x_a + x_c)ᵀ x_i / ‖x_b − x_a + x_c‖, the input words excluded (L02 p39).
   * mode 'cosine' also divides by ‖x_i‖ (what "cosine distance" on the slide usually means). */
  function analogy(vectors, a, b, c, mode) {
    const target = L.add(L.sub(vectors[b], vectors[a]), vectors[c]);
    const tn = L.norm(target);
    const ranked = Object.keys(vectors)
      .filter((w) => w !== a && w !== b && w !== c)
      .map((w) => {
        const x = vectors[w];
        const score = mode === 'cosine' ? L.dot(target, x) / (tn * L.norm(x)) : L.dot(target, x) / tn;
        return { word: w, score };
      })
      .sort((p, q) => q.score - p.score);
    return { target, ranked, answer: ranked.length ? ranked[0].word : null };
  }

  const api = { cooccurrence, symmetricEigen, truncatedSVD, analogy };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.cooccur = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
