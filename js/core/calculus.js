(function (root) {
  'use strict';
  /* Numerical derivatives, used to check every hand-derived gradient on the site (L03 p78). */

  /** Two-sided ("centered") difference (f(x+h) − f(x−h)) / 2h, or the one-sided (f(x+h) − f(x)) / h. */
  function derivative(f, x, h, mode) {
    const step = h === undefined ? 1e-4 : h;
    if (mode === 'forward') return (f(x + step) - f(x)) / step;
    return (f(x + step) - f(x - step)) / (2 * step);
  }
  /** Gradient of a scalar function of a vector, one coordinate at a time. */
  function gradient(f, xs, h) {
    const step = h === undefined ? 1e-4 : h;
    return xs.map((_, i) => {
      const plus = xs.slice(), minus = xs.slice();
      plus[i] += step;
      minus[i] -= step;
      return (f(plus) - f(minus)) / (2 * step);
    });
  }
  /** Gradient of a scalar function of a matrix, returned in the matrix's own shape (the "shape convention"). */
  function gradientMatrix(f, M, h) {
    const step = h === undefined ? 1e-4 : h;
    return M.map((row, i) => row.map((_, j) => {
      const plus = M.map((r) => r.slice()), minus = M.map((r) => r.slice());
      plus[i][j] += step;
      minus[i][j] -= step;
      return (f(plus) - f(minus)) / (2 * step);
    }));
  }
  /** Largest relative error between two arrays (nested or flat), as used in gradient checks. */
  function maxRelError(a, b) {
    const fa = [].concat(...[a].flat(Infinity)), fb = [].concat(...[b].flat(Infinity));
    if (fa.length !== fb.length) throw new Error('maxRelError: size mismatch');
    let worst = 0;
    for (let i = 0; i < fa.length; i++) {
      const denom = Math.max(1e-8, Math.abs(fa[i]) + Math.abs(fb[i]));
      worst = Math.max(worst, Math.abs(fa[i] - fb[i]) / denom);
    }
    return worst;
  }

  const api = { derivative, gradient, gradientMatrix, maxRelError };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.calculus = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
