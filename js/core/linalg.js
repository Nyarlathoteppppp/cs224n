(function (root) {
  'use strict';
  /* Dense linear algebra on plain arrays. Vectors are number[]; matrices are number[][] stored row by row.
   * Every function returns new arrays and never mutates its inputs. */

  function zeros(n) { return new Array(n).fill(0); }
  function zerosMat(rows, cols) { return Array.from({ length: rows }, () => zeros(cols)); }
  function identity(n) { return Array.from({ length: n }, (_, i) => zeros(n).map((_, j) => (i === j ? 1 : 0))); }

  function sameLength(a, b, what) {
    if (a.length !== b.length) throw new Error(what + ': length ' + a.length + ' vs ' + b.length);
  }

  function dot(a, b) {
    sameLength(a, b, 'dot');
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  }
  function add(a, b) { sameLength(a, b, 'add'); return a.map((v, i) => v + b[i]); }
  function sub(a, b) { sameLength(a, b, 'sub'); return a.map((v, i) => v - b[i]); }
  function scale(a, s) { return a.map((v) => v * s); }
  function hadamard(a, b) { sameLength(a, b, 'hadamard'); return a.map((v, i) => v * b[i]); }
  function sum(a) { return a.reduce((s, v) => s + v, 0); }
  function norm(a) { return Math.sqrt(dot(a, a)); }
  function cosine(a, b) { return dot(a, b) / (norm(a) * norm(b)); }
  function argmax(a) {
    let best = 0;
    for (let i = 1; i < a.length; i++) if (a[i] > a[best]) best = i;
    return best;
  }

  function shape(M) { return [M.length, M.length ? M[0].length : 0]; }
  function transpose(M) {
    const [r, c] = shape(M);
    return Array.from({ length: c }, (_, j) => Array.from({ length: r }, (_, i) => M[i][j]));
  }
  /** M x: each output entry is (row i of M) · x. */
  function matvec(M, x) { return M.map((row) => dot(row, x)); }
  /** xᵀ M: a row vector times a matrix (the row convention used by XW in the slides). */
  function vecmat(x, M) {
    if (x.length !== M.length) throw new Error('vecmat: length ' + x.length + ' vs ' + M.length + ' rows');
    const out = zeros(M[0].length);
    for (let i = 0; i < M.length; i++) for (let j = 0; j < out.length; j++) out[j] += x[i] * M[i][j];
    return out;
  }
  function matmul(A, B) {
    if (shape(A)[1] !== B.length) throw new Error('matmul: ' + shape(A) + ' times ' + shape(B));
    return A.map((row) => vecmat(row, B));
  }
  function matAdd(A, B) { return A.map((row, i) => add(row, B[i])); }
  function matSub(A, B) { return A.map((row, i) => sub(row, B[i])); }
  function matScale(A, s) { return A.map((row) => scale(row, s)); }
  /** a bᵀ: entry (i, j) is a_i b_j. */
  function outer(a, b) { return a.map((ai) => b.map((bj) => ai * bj)); }
  function flatten(M) { return [].concat(...M); }

  const api = {
    zeros, zerosMat, identity, dot, add, sub, scale, hadamard, sum, norm, cosine, argmax,
    shape, transpose, matvec, vecmat, matmul, matAdd, matSub, matScale, outer, flatten,
  };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.linalg = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
