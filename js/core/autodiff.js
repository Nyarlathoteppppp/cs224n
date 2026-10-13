(function (root) {
  'use strict';
  /* A tiny reverse-mode automatic differentiator for scalar computation graphs (L03 p56–p77).
   * Each node stores its forward value and the local gradient towards each input; backward() walks the graph in
   * reverse topological order and multiplies upstream × local (the chain rule), summing at branches (L03 p68, p75).
   * The trace it returns is what the site's computation-graph animation replays step by step. */

  let nextId = 0;
  function node(value, inputs, local, op, name) {
    return { id: nextId++, value, inputs: inputs || [], local: local || [], op: op || 'input', name: name || null, grad: 0 };
  }
  const input = (value, name) => node(value, [], [], 'input', name);
  const add = (a, b, name) => node(a.value + b.value, [a, b], [1, 1], '+', name);
  const mul = (a, b, name) => node(a.value * b.value, [a, b], [b.value, a.value], '*', name);
  /** max routes the whole gradient to the larger input (ties go to the first one). */
  const max = (a, b, name) => {
    const first = a.value >= b.value;
    return node(first ? a.value : b.value, [a, b], first ? [1, 0] : [0, 1], 'max', name);
  };
  const pow = (a, k, name) => node(Math.pow(a.value, k), [a], [k * Math.pow(a.value, k - 1)], '^' + k, name);
  const exp = (a, name) => node(Math.exp(a.value), [a], [Math.exp(a.value)], 'exp', name);
  const log = (a, name) => node(Math.log(a.value), [a], [1 / a.value], 'log', name);
  const scale = (a, c, name) => node(c * a.value, [a], [c], '×' + c, name);

  function topoOrder(out) {
    const order = [], seen = new Set();
    (function visit(n) {
      if (seen.has(n.id)) return;
      seen.add(n.id);
      n.inputs.forEach(visit);
      order.push(n);
    })(out);
    return order;
  }

  /** Runs the backward pass from `out` (∂out/∂out = 1) and returns the forward order plus every edge's
   * contribution (upstream × local), in the order they are computed. */
  function backward(out) {
    const order = topoOrder(out);
    order.forEach((n) => { n.grad = 0; });
    out.grad = 1;
    const edges = [];
    for (let i = order.length - 1; i >= 0; i--) {
      const n = order[i];
      n.inputs.forEach((inp, k) => {
        const contribution = n.grad * n.local[k];
        inp.grad += contribution;
        edges.push({ from: n.name || n.op, to: inp.name || inp.op, upstream: n.grad, local: n.local[k], contribution });
      });
    }
    return { order, edges };
  }

  const api = { input, add, mul, max, pow, exp, log, scale, backward, topoOrder };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.autodiff = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
