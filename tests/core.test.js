/* Core algorithm tests. Run: node tests/core.test.js
 * Expected numbers come from the course material (Lxx pN = lecture slides, Nxx = notes, Ax = assignment) or are
 * checked against numerical derivatives. The modules in js/core/ load in the browser (window.CS224N.core) and in
 * Node (module.exports). No dependencies. */
'use strict';
const path = require('path');
const load = (name) => require(path.join(__dirname, '..', 'js', 'core', name + '.js'));

let pass = 0, fail = 0;
const failures = [];
function test(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; failures.push(name + '\n    ' + (e && e.message)); }
}
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error((msg || '') + ' expected ' + b + ' got ' + a);
}
function near(actual, expected, tol, msg) {
  if (typeof actual !== 'number' || !Number.isFinite(actual) || !(Math.abs(actual - expected) <= (tol === undefined ? 1e-9 : tol)))
    throw new Error((msg || '') + ' expected ≈' + expected + ' got ' + actual);
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function nearAll(a, b, tol, msg) {
  const fa = [a].flat(Infinity), fb = [b].flat(Infinity);
  eq(fa.length, fb.length, (msg || '') + ' size');
  fa.forEach((v, i) => near(v, fb[i], tol, (msg || '') + ' [' + i + ']'));
}

const L = load('linalg'), P = load('prob'), C = load('calculus');
const W2V = load('word2vec'), CO = load('cooccur'), NN = load('nn'), AD = load('autodiff');
const OPT = load('optim'), DP = load('depparse'), NG = load('ngram'), RNN = load('rnn');
const G = load('gated'), ATT = load('attention'), BPE = load('bpe');

const rand = OPT.rng(224);
const randVec = (n, s) => Array.from({ length: n }, () => (rand() * 2 - 1) * (s || 1));
const randMat = (r, c, s) => Array.from({ length: r }, () => randVec(c, s));

/* ───────── Part 0–1: vectors, softmax, word vectors ───────── */

test('L02 p7–p8: one-hot motel · hotel = 0 (orthogonal)', () => {
  const motel = P.oneHot(15, 10), hotel = P.oneHot(15, 7);
  eq(L.dot(motel, hotel), 0);
});

test('Chapter 0.1 numbers: [3,1]·[1,2] = 5 at 45°, Wx = [4,1,5], quiz answers 4 and [7,2]', () => {
  eq(L.dot([3, 1], [1, 2]), 5);
  near(L.norm([3, 1]), Math.sqrt(10)); near(L.norm([1, 2]), Math.sqrt(5));
  near(Math.acos(L.cosine([3, 1], [1, 2])) * 180 / Math.PI, 45, 1e-9);
  eq(L.matvec([[1, 2], [0, 1], [3, -1]], [2, 1]), [4, 1, 5]);
  eq(L.dot([2, -1, 3], [1, 4, 2]), 4);
  eq(L.matvec([[1, 0, 2], [-1, 3, 1]], [3, 1, 2]), [7, 2]);
  eq(L.shape(L.matmul(L.zerosMat(4, 3), L.zerosMat(3, 5))), [4, 5]);
});

test('Chapter 0.2 numbers: 0.02·0.1·0.3·0.4 = 0.00024, log-sum −8.335, J ≈ 2.084, softmax [2,0,−2] and [1,0,0]', () => {
  const p = [0.02, 0.1, 0.3, 0.4];
  near(p.reduce((a, b) => a * b, 1), 0.00024, 1e-15);
  const logs = p.map(Math.log), sum = logs.reduce((a, b) => a + b, 0);
  nearAll(logs, [-3.912, -2.303, -1.204, -0.916], 5e-4);
  near(sum, Math.log(0.00024), 1e-12); near(sum, -8.335, 5e-4); near(-sum / 4, 2.084, 5e-4);
  nearAll([0.9, 0.5, 0.1, 0.01].map((x) => -Math.log(x)), [0.105, 0.693, 2.303, 4.605], 5e-4);
  nearAll([2, 0, -2].map(Math.exp), [7.389, 1, 0.135], 5e-4);
  nearAll(P.softmax([2, 0, -2]), [0.867, 0.117, 0.016], 5e-4);
  near(P.softmax([1, 0, 0])[0], 0.576, 5e-4);
  near(400 / 1000, 0.4); near(100 / 1000, 0.1);
});

test('L01b p36 (chapter 1.1): spelling correction scores from the four conditionals on the slide', () => {
  const actress = 0.0019 * 0.0043, across = 0.000092 * 0.000026;
  near(actress, 8.17e-6, 1e-12); near(across, 2.392e-9, 1e-15);
  near(actress / across, 3416, 1);
});

test('L02 p10: banking · monetary = 1.031696, cosine ≈ 0.857', () => {
  const banking = [0.286, 0.792, -0.177, -0.107, 0.109, -0.542, 0.349, 0.271];
  const monetary = [0.413, 0.582, -0.007, 0.247, 0.216, -0.718, 0.147, 0.051];
  near(L.dot(banking, monetary), 1.031696, 1e-9);
  near(L.cosine(banking, monetary), 0.857, 1e-3);
});

test('softmax: sums to 1, keeps the order, temperature limits (L02 p17, L12 p18)', () => {
  const x = [2, 1, 0.1, -1];
  const p = P.softmax(x);
  near(L.sum(p), 1, 1e-12);
  ok(p[0] > p[1] && p[1] > p[2] && p[2] > p[3], 'order');
  ok(P.softmax(x, 0.01)[0] > 0.999, 'τ → 0 approaches argmax');
  const hot = P.softmax(x, 1000);
  ok(Math.max(...hot) - Math.min(...hot) < 1e-3, 'large τ approaches uniform');
  near(P.softmax([1000, 1000])[0], 0.5, 1e-12, 'no overflow');
});

test('L02 p12: window size 2 around "into" gives problems, turning, banking, crises', () => {
  const tokens = ['problems', 'turning', 'into', 'banking', 'crises', 'as'];
  const pairs = W2V.windowPairs(tokens, 2).filter((p) => p.center === 'into');
  eq(pairs.map((p) => p.outside), ['problems', 'turning', 'banking', 'crises']);
  eq(pairs.map((p) => p.offset), [-2, -1, 1, 2]);
});

test('word2vec naive softmax: gradients = observed − expected and match numerical gradients (N01 p11, A2 Q1)', () => {
  const V = 6, d = 4, o = 2;
  const U = randMat(V, d), vc = randVec(d);
  const r = W2V.naiveSoftmax(vc, o, U);
  near(r.loss, -Math.log(r.yhat[o]), 1e-12);
  nearAll(r.gradCenter, L.sub(r.expected, U[o]), 1e-12, 'observed − expected');
  const yMinusYhat = r.yhat.map((v, w) => v - (w === o ? 1 : 0));
  nearAll(r.gradCenter, L.vecmat(yMinusYhat, U), 1e-12, 'vector form Uᵀ(ŷ − y)');
  const numCenter = C.gradient((v) => W2V.naiveSoftmax(v, o, U).loss, vc);
  ok(C.maxRelError(r.gradCenter, numCenter) < 1e-6, 'center gradient check');
  const numOutside = C.gradientMatrix((M) => W2V.naiveSoftmax(vc, o, M).loss, U);
  ok(C.maxRelError(r.gradOutside, numOutside) < 1e-6, 'outside gradient check');
});

test('word2vec negative sampling: gradients match numerical gradients, repeated negatives count twice (L02 p27)', () => {
  const V = 7, d = 3, o = 1, negs = [3, 5, 3];
  const U = randMat(V, d), vc = randVec(d);
  const r = W2V.negSampling(vc, o, U, negs);
  const numCenter = C.gradient((v) => W2V.negSampling(v, o, U, negs).loss, vc);
  ok(C.maxRelError(r.gradCenter, numCenter) < 1e-6, 'center');
  const numOutside = C.gradientMatrix((M) => W2V.negSampling(vc, o, M, negs).loss, U);
  ok(C.maxRelError(r.gradOutside, numOutside) < 1e-6, 'outside');
});

test('Chapter 1.3 numbers: 18 window pairs, toy softmax table, −log terms, quiz answers', () => {
  eq(W2V.windowPairs('problems turning into banking crises as'.split(' '), 2).length, 18);
  eq(W2V.windowPairs('problems turning into banking crises as'.split(' '), 2).filter((p) => p.center === 'into').map((p) => p.outside), ['problems', 'turning', 'banking', 'crises']);
  const v = [1, 0.5], U = [[1, 1], [0.8, 0.6], [0.5, 0.2], [0, 0.1], [-1, 0.3]];
  const scores = U.map((u) => L.dot(u, v));
  nearAll(scores, [1.5, 1.1, 0.6, 0.05, -0.85], 1e-12);
  nearAll(scores.map(Math.exp), [4.482, 3.004, 1.822, 1.051, 0.427], 5e-4);
  near(scores.map(Math.exp).reduce((a, b) => a + b, 0), 10.787, 5e-4);
  const p = P.softmax(scores);
  nearAll(p, [0.415, 0.279, 0.169, 0.097, 0.040], 5e-4);
  near(-Math.log(p[0]), 0.88, 5e-3); near(-Math.log(0.415), 0.88, 5e-3); near(-Math.log(p[4]), 3.2, 0.05); near(-Math.log(0.04), 3.2, 0.05);
  near(P.softmax([2, 1, 0])[0], 0.665, 5e-4);
  eq(2 * 100 * 10000, 2000000);
});

test('Chapter 1.4 numbers: observed − expected, one SGD step, negative-sampling terms, σ values, 3/4 power', () => {
  const v = [1, 0.5], U = [[1, 1], [0.8, 0.6], [0.5, 0.2], [0, 0.1], [-1, 0.3]];
  const r = W2V.naiveSoftmax(v, 0, U);
  nearAll(r.expected, [0.683, 0.638], 5e-4);
  nearAll(r.gradCenter, [-0.317, -0.362], 5e-4);
  near(r.loss, 0.878, 5e-4);
  const v2 = L.sub(v, L.scale(r.gradCenter, 0.5));
  nearAll(v2, [1.158, 0.681], 5e-4);
  const r2 = W2V.naiveSoftmax(v2, 0, U);
  near(r2.yhat[0], 0.463, 5e-4); near(r2.loss, 0.770, 5e-4);
  const n = W2V.negSampling(v, 0, U, [4, 3]);
  near(n.loss, 1.28, 5e-3);
  nearAll([-Math.log(P.sigmoid(1.5)), -Math.log(P.sigmoid(0.85)), -Math.log(P.sigmoid(-0.05))], [0.20, 0.36, 0.72], 5e-3);
  nearAll([P.sigmoid(1.5), P.sigmoid(0.85), P.sigmoid(-0.05)], [0.818, 0.701, 0.488], 5e-4);
  nearAll([P.sigmoid(2), P.sigmoid(0), P.sigmoid(-2)], [0.881, 0.5, 0.119], 5e-4);
  nearAll(W2V.unigramPower([0.9, 0.09, 0.01], 0.75), [0.825, 0.147, 0.028], 5e-4);
  eq((2 * 2 + 1) + 2 * 10 * 2, 45); near(45 * 100 / 2000000, 0.00225, 1e-12);
});

test('L02 p27: the 3/4 power gives rare words a larger share', () => {
  const counts = [900, 90, 10];
  const p1 = W2V.unigramPower(counts, 1), p34 = W2V.unigramPower(counts, 0.75);
  nearAll(p1, [0.9, 0.09, 0.01], 1e-12);
  ok(p34[2] > p1[2] && p34[0] < p1[0], 'rare up, frequent down');
  near(L.sum(p34), 1, 1e-12);
});

test('L02 p31: window-1 co-occurrence matrix of the three sentences', () => {
  const sentences = [['I', 'like', 'deep', 'learning', '.'], ['I', 'like', 'NLP', '.'], ['I', 'enjoy', 'flying', '.']];
  const order = ['I', 'like', 'enjoy', 'deep', 'learning', 'NLP', 'flying', '.'];
  const { X } = CO.cooccurrence(sentences, 1, order);
  eq(X, [
    [0, 2, 1, 0, 0, 0, 0, 0],
    [2, 0, 0, 1, 0, 1, 0, 0],
    [1, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 1],
    [0, 1, 0, 0, 0, 0, 0, 1],
    [0, 0, 1, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1, 1, 1, 0],
  ]);
});

test('SVD of the L02 p31 matrix: eigenpairs hold, full rank reconstructs X, values sorted (L02 p33)', () => {
  const sentences = [['I', 'like', 'deep', 'learning', '.'], ['I', 'like', 'NLP', '.'], ['I', 'enjoy', 'flying', '.']];
  const { X } = CO.cooccurrence(sentences, 1, ['I', 'like', 'enjoy', 'deep', 'learning', 'NLP', 'flying', '.']);
  const A = L.matmul(L.transpose(X), X);
  const { values, vectors } = CO.symmetricEigen(A);
  vectors.forEach((v, i) => nearAll(L.matvec(A, v), L.scale(v, values[i]), 1e-9, 'A v = λ v #' + i));
  for (let i = 1; i < values.length; i++) ok(values[i - 1] >= values[i] - 1e-12, 'sorted');
  const full = CO.truncatedSVD(X, 8);
  const back = full.reduced.map((row) => L.vecmat(row, full.V));      // (X V) Vᵀ = X when V is orthogonal
  nearAll(back, X, 1e-9, 'reconstruction');
  const two = CO.truncatedSVD(X, 2);
  eq(L.shape(two.reduced), [8, 2]);
});

test('Chapter 1.5 numbers: row cosines, singular values and 2-D SVD coordinates of the L02 p31 matrix', () => {
  const vocab = ['I', 'like', 'enjoy', 'deep', 'learning', 'NLP', 'flying', '.'];
  const X = CO.cooccurrence(['I like deep learning .', 'I like NLP .', 'I enjoy flying .'].map((x) => x.split(' ')), 1, vocab).X;
  const row = (w) => X[vocab.indexOf(w)];
  near(L.cosine(row('deep'), row('NLP')), 0.5, 1e-12); near(L.cosine(row('deep'), row('flying')), 0, 1e-12);
  const r = CO.truncatedSVD(X, 2);
  nearAll(r.allSingularValues.slice(0, 3), [2.757, 2.678, 1.892], 5e-4);
  // signs of singular vectors are arbitrary: compare up to a sign per column
  const fix = (pt) => pt.map((v, k) => v * Math.sign(r.reduced[vocab.indexOf('like')][k]) * [1, -1][k]);
  nearAll(fix(r.reduced[vocab.indexOf('like')]), [1.639, -1.688], 5e-4);
  nearAll(fix(r.reduced[vocab.indexOf('enjoy')]), [0.707, -0.734], 5e-4);
  nearAll(fix(r.reduced[vocab.indexOf('deep')]), [0.788, 0.664], 5e-4);
  nearAll(fix(r.reduced[vocab.indexOf('NLP')]), [0.841, 0.787], 5e-4);
  near(Math.log(8), 2.079, 5e-4);
});

test('L02 p39: analogy man : woman :: king : ? on toy vectors, input words excluded', () => {
  const vecs = { man: [1, 0], woman: [1, 1], king: [3, 0.2], queen: [3, 1.2], apple: [-2, 0.5] };
  eq(CO.analogy(vecs, 'man', 'woman', 'king').answer, 'queen');
  eq(CO.analogy(vecs, 'man', 'woman', 'king', 'cosine').answer, 'queen');
});

/* ───────── Part 0 & 2: derivatives, neural networks, backprop ───────── */

test('Chapter 1.6 numbers: toy analogy ranking with and without the input words; correlation example', () => {
  const vecs = { man: [1, 1], woman: [1.2, 2.2], king: [3.5, 1.4], queen: [3.6, 2.5], boy: [0.5, 0.8], girl: [0.6, 1.8], apple: [2, -1.2] };
  const r = CO.analogy(vecs, 'man', 'woman', 'king', 'cosine');
  nearAll(r.target, [3.7, 2.6], 1e-12);
  eq(r.answer, 'queen'); near(r.ranked[0].score, 1.000, 5e-4); eq(r.ranked[1].word, 'boy'); near(r.ranked[1].score, 0.921, 5e-4);
  const cos = (w) => L.cosine(r.target, vecs[w]);
  near(cos('man'), 0.985, 5e-4); near(cos('king'), 0.973, 5e-4);
  ok(cos('man') > cos('boy') && cos('king') > cos('boy'), 'inputs crowd the top when not excluded');
  const pearson = (x, y) => { const mx = P.mean(x), my = P.mean(y); let a = 0, b = 0, c = 0; x.forEach((_, i) => { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; }); return a / Math.sqrt(b * c); };
  near(pearson([7.35, 7.46, 5.77, 0.92], [0.8, 0.7, 0.5, 0.1]), 0.979, 5e-4);
  near(pearson([7.35, 7.46, 5.77, 0.92], [0.1, 0.5, 0.7, 0.8]), -0.718, 5e-4);
});

test('L03 p21: f(x) = x³ has slope 3 at x = 1 and 48 at x = 4; 1.01³ ≈ 1.03, 4.01³ ≈ 64.48', () => {
  const f = (x) => x * x * x;
  near(C.derivative(f, 1), 3, 1e-6);
  near(C.derivative(f, 4), 48, 1e-6);
  near(f(1.01), 1.030301, 1e-12);
  near(f(4.01), 64.481201, 1e-9);
});

test('Chapter 2.3 numbers: a 2×2 Jacobian, diag times vector, the ReLU layer Jacobian (checked numerically)', () => {
  const f = (v) => [v[0] * v[1], v[0] + 3 * v[1]];
  nearAll([0, 1].map((i) => C.gradient((v) => f(v)[i], [2, 1])), [[1, 2], [1, 3]], 1e-6);
  eq(f([2.01, 1]).map((v) => +v.toFixed(10)), [2.01, 5.01]);
  eq(L.hadamard([2, 3], [1, 4]), [2, 12]);
  eq(L.matvec([[2, 0], [0, 3]], [1, 4]), [2, 12]);
  const W = [[1, -1], [2, 0.5]], b = [0, -1], x = [1, 2];
  const relu = (v) => v.map((t) => Math.max(t, 0)), z = L.add(L.matvec(W, x), b);
  eq(z, [-1, 2]);
  const analytic = L.matmul([[z[0] > 0 ? 1 : 0, 0], [0, z[1] > 0 ? 1 : 0]], W);
  eq(analytic, [[0, 0], [2, 0.5]]);
  nearAll([0, 1].map((i) => C.gradient((v) => relu(L.add(L.matvec(W, v), b))[i], x)), analytic, 1e-6);
});

test('L03 p24: z = 3y, y = x² gives dz/dx = 6x', () => {
  [-2, 0.5, 3].forEach((x) => near(C.derivative((t) => 3 * t * t, x), 6 * x, 1e-6));
});

test('Chapter 0.3 numbers: θ² descent from 3 with α = 0.1, 0.5, 1.1; ∇(x² + 2y²); quiz answers', () => {
  const run = (alpha, n) => { let t = 3; const out = [t]; for (let i = 0; i < n; i++) { t = OPT.sgd([t], [2 * t], alpha).theta[0]; out.push(t); } return out; };
  nearAll(run(0.1, 3), [3, 2.4, 1.92, 1.536], 1e-12);
  nearAll(run(0.5, 1), [3, 0], 1e-12);
  nearAll(run(1.1, 3), [3, -3.6, 4.32, -5.184], 1e-12);
  const f = (v) => v[0] * v[0] + 2 * v[1] * v[1];
  nearAll(C.gradient(f, [1, 1]), [2, 4], 1e-6);
  nearAll(C.gradient(f, [2, 1]), [4, 4], 1e-6);
  nearAll(OPT.sgd([2, 1], [4, 4], 0.1).theta, [1.6, 0.6], 1e-12);
  near(C.derivative((x) => x ** 3, 3), 27, 1e-6);
  near(Math.pow(2.01, 3) - 8, 0.120601, 1e-12);
  near(C.derivative((x) => 3 * x * x, 5), 30, 1e-6);
});

test('L03 p78: centered difference beats the one-sided one', () => {
  const f = (x) => x * x * x;
  const central = Math.abs(C.derivative(f, 4, 1e-4) - 48), oneSided = Math.abs(C.derivative(f, 4, 1e-4, 'forward') - 48);
  ok(central < 1e-6 && oneSided > 1e-3 && central < oneSided);
});

test('A2 Q1(f)(g): Leaky ReLU and sigmoid derivatives', () => {
  const a = 0.2, lr = NN.activations.leakyRelu;
  near(lr.df(3, a), 1); near(lr.df(-3, a), a);
  [-2, -0.3, 0.7, 2.5].forEach((x) => {
    const s = P.sigmoid(x);
    near(NN.activations.sigmoid.df(x), s * (1 - s), 1e-15);
    near(C.derivative(P.sigmoid, x), s * (1 - s), 1e-8);
    near(C.derivative((t) => lr.f(t, a), x), lr.df(x, a), 1e-8);
  });
});

test('Chapter 2.1 numbers: window sizes, parameter counts, the hand-made window classifier', () => {
  eq(5 * 50, 250); eq(8 * 20, 160); eq(8 * 20 + 8 + 8, 176);
  const SENT = ['the', 'museums', 'in', 'Paris', 'are', 'amazing', 'to', 'see', '.'];
  const VEC = { the: [0, 1], museums: [0.3, 0], in: [0, 1], Paris: [1, 0], are: [0, 0.6], amazing: [0, 0], to: [0, 1], see: [0, 0.3], '.': [0, 0.5], '<pad>': [0, 0] };
  const params = { W: [[0, 0, 0, 0, 7, 0, 0, 0, 0, 0], [0, 0, 0, 6, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, -7, 0, 0, 0, 0, 0]], b: [-4.5, -3, 3], u: [4, 1.5, -4] };
  const prob = (c) => NN.windowForward(params, [].concat(...[-2, -1, 0, 1, 2].map((j) => VEC[SENT[c + j] || '<pad>'])), 'sigmoid').prob;
  ok(prob(3) > 0.99, 'Paris after "in" is a place');
  ok(prob(1) < 0.3 && prob(2) < 0.05, 'museums and in are not');
  const oneHot = [0, 0, 1], Lmat = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]];
  eq(L.matvec(Lmat, oneHot), [0.3, 0.6], 'x = Le picks the column');
});

test('L03 p15–p16: tanh = 2·sigmoid(2z) − 1; GELU ≈ x·σ(1.702x)', () => {
  [-2, -0.5, 0, 1.3].forEach((z) => near(Math.tanh(z), 2 * P.sigmoid(2 * z) - 1, 1e-12));
  [-2, -0.5, 0.5, 2].forEach((z) => near(NN.activations.gelu.f(z), NN.activations.geluLogistic.f(z), 0.03));
});

test('Chapter 2.2 numbers: activation values and slopes, the merged matrix, the ReLU fix, cross-entropy', () => {
  const A = NN.activations;
  nearAll([A.sigmoid.f(2), A.sigmoid.df(2), A.sigmoid.df(0)], [0.881, 0.105, 0.25], 5e-4);
  nearAll([A.tanh.f(2), A.tanh.df(2), A.tanh.df(0)], [0.964, 0.071, 1], 5e-4);
  eq([A.relu.df(2), A.relu.f(2)], [1, 2]);
  eq(L.matmul([[1, 2], [0, 1]], [[2, 0], [1, 1]]), [[4, 2], [1, 1]]);
  eq(L.matvec([[4, 2], [1, 1]], [1, 1]), [6, 2]);
  const s = (x, y) => A.relu.f(x + y) + A.relu.f(-x - y) - 1;
  eq([s(1, 1), s(-1, -1), s(1, -1), s(-1, 1)], [1, 1, -1, -1]);
  near(-Math.log(0.7), 0.357, 5e-4); near(-Math.log(0.1), 2.303, 5e-4);
  near(-0.5 * Math.log(0.7) - 0.5 * Math.log(0.2), 0.983, 5e-4); near(-Math.log(0.3), 1.204, 5e-4);
  near(P.crossEntropy([0, 1, 0], [0.5, 0.3, 0.2]), -Math.log(0.3), 1e-12);
});

test('L03 p17: two linear layers collapse into one (W₁W₂x = Wx)', () => {
  const W1 = randMat(3, 4), W2 = randMat(4, 2), x = randVec(2);
  nearAll(L.matvec(W1, L.matvec(W2, x)), L.matvec(L.matmul(W1, W2), x), 1e-12);
});

test('L03 p41–p53: window classifier score gradients (δ, ∂s/∂b = δ, ∂s/∂W = δxᵀ) match numerical gradients', () => {
  const d = 2, win = 5, n = 3, x = randVec(d * win);
  const params = { W: randMat(n, d * win), b: randVec(n), u: randVec(n) };
  ['sigmoid', 'tanh'].forEach((f) => {
    const g = NN.windowScoreGrad(params, x, f);
    const score = (p, xx) => NN.windowForward(p, xx, f).s;
    ok(C.maxRelError(g.dB, C.gradient((b) => score({ ...params, b }, x), params.b)) < 1e-6, f + ' b');
    ok(C.maxRelError(g.dW, C.gradientMatrix((W) => score({ ...params, W }, x), params.W)) < 1e-6, f + ' W');
    ok(C.maxRelError(g.dU, C.gradient((u) => score({ ...params, u }, x), params.u)) < 1e-6, f + ' u');
    ok(C.maxRelError(g.dX, C.gradient((xx) => score(params, xx), x)) < 1e-6, f + ' x');
    eq(L.shape(g.dW), [n, d * win], 'shape convention');
  });
});

test('L03 p69–p71: f = (x+y)·max(y,z) at (1, 2, 0): forward 3, 2, 6; backward 2, 5 (= 2 + 3), 0', () => {
  const x = AD.input(1, 'x'), y = AD.input(2, 'y'), z = AD.input(0, 'z');
  const a = AD.add(x, y, 'a'), b = AD.max(y, z, 'b'), f = AD.mul(a, b, 'f');
  eq([a.value, b.value, f.value], [3, 2, 6]);
  const { edges } = AD.backward(f);
  eq([a.grad, b.grad], [2, 3], 'multiply swaps: ∂f/∂a = b, ∂f/∂b = a');
  eq([x.grad, y.grad, z.grad], [2, 5, 0]);
  const toY = edges.filter((e) => e.to === 'y').map((e) => e.contribution).sort();
  eq(toY, [2, 3], 'plus distributes 2, max routes 3; they add up at y');
});

test('Chapter 2.4 numbers: δ, ∂s/∂b, ∂s/∂W (outer product), ∂s/∂u, ∂s/∂x for the tanh example, all checked numerically', () => {
  const params = { W: [[0.5, -1, 0.2], [1, 0.3, -0.5]], b: [0.1, -0.2], u: [2, -1] }, x = [1, 2, -1];
  const g = NN.windowScoreGrad(params, x, 'tanh');
  nearAll(g.forward.z, [-1.6, 1.9], 1e-12);
  nearAll(g.forward.h, [-0.922, 0.956], 5e-4); near(g.forward.s, -2.800, 5e-4);
  nearAll(g.forward.z.map((z) => 1 - Math.tanh(z) ** 2), [0.151, 0.086], 5e-4);
  nearAll(g.delta, [0.301, -0.086], 5e-4);
  nearAll(g.dW, [[0.301, 0.602, -0.301], [-0.086, -0.171, 0.086]], 5e-4);
  nearAll(g.dU, [-0.922, 0.956], 5e-4); nearAll(g.dX, [0.065, -0.327, 0.103], 5e-4);
  const score = (W, b, u, xx) => NN.windowForward({ W, b, u }, xx, 'tanh').s;
  nearAll(C.gradient((bb) => score(params.W, bb, params.u, x), params.b), g.dB, 1e-7);
  nearAll(C.gradientMatrix((W) => score(W, params.b, params.u, x), params.W), g.dW, 1e-7);
  nearAll(C.gradient((xx) => score(params.W, params.b, params.u, xx), x), g.dX, 1e-7);
  eq(L.outer([1, 2], [3, 4, 5]), [[3, 4, 5], [6, 8, 10]]);
  eq(L.outer([0.5, -2], [3, 1, 4])[1][2], -8);
  eq(L.hadamard([2, -1], [0.25, 0.5]), [0.5, -0.5]);
});

test('Chapter 2.5 numbers: nudges 6.2 / 6.51 / 6 (T03), z = 3 variant, multiply gate with upstream 0.5', () => {
  const run = (xv, yv, zv) => {
    const x = AD.input(xv, 'x'), y = AD.input(yv, 'y'), z = AD.input(zv, 'z');
    const f = AD.mul(AD.add(x, y, 'a'), AD.max(y, z, 'b'), 'f');
    AD.backward(f);
    return { f: f.value, dx: x.grad, dy: y.grad, dz: z.grad };
  };
  near(run(1.1, 2, 0).f, 6.2, 1e-12); near(run(1, 2.1, 0).f, 6.51, 1e-12); eq(run(1, 2, 0.1).f, 6);
  eq(run(1, 2, 3), { f: 9, dx: 3, dy: 3, dz: 3 }, 'max now routes to z, so y keeps only the plus branch');
  const a = AD.input(4, 'a'), b = AD.input(-2, 'b'), m = AD.mul(a, b, 'm');
  AD.backward(AD.scale(m, 0.5));
  eq([a.grad, b.grad], [-1, 2], 'upstream 0.5 × the other input');
  const f = (x) => x * x * x;
  near(Math.abs(C.derivative(f, 4, 1e-4) - 48), 1e-8, 1e-10, 'centered error ≈ h²');
  near(Math.abs(C.derivative(f, 4, 1e-4, 'forward') - 48), 1.2e-3, 1e-7, 'one-sided error ≈ 12h');
});

test('autodiff agrees with numerical derivatives on a deeper graph', () => {
  const build = (xv, yv) => {
    const x = AD.input(xv, 'x'), y = AD.input(yv, 'y');
    return { x, y, out: AD.log(AD.add(AD.exp(AD.mul(x, y)), AD.pow(x, 2))) };
  };
  const g = build(0.7, -1.3);
  AD.backward(g.out);
  near(g.x.grad, C.derivative((t) => build(t, -1.3).out.value, 0.7), 1e-7);
  near(g.y.grad, C.derivative((t) => build(0.7, t).out.value, -1.3), 1e-7);
});

test('Chapter 2.6 numbers: momentum averages, Xavier ranges, exponential decay, Adam equalising two step sizes', () => {
  let st = {}, th = [0]; const ms = [];
  [2, 2, -2, 2].forEach((g) => { const r = OPT.momentum(st, th, [g], 0.1, 0.9); st = r.state; th = r.theta; ms.push(st.m[0]); });
  nearAll(ms, [0.2, 0.38, 0.142, 0.328], 5e-4);
  near(Math.sqrt(6 / 400), 0.122, 5e-4); near(Math.sqrt(6 / 600), 0.1, 1e-12);
  near(0.1 * Math.exp(-0.5 * 2), 0.037, 5e-4);
  let sa = {}, ta = [0, 0], ts = [0, 0]; const moves = [];
  for (let i = 0; i < 3; i++) { const r = OPT.adam(sa, ta, [10, 0.1], 0.01); moves.push(ta[0] - r.theta[0]); sa = r.state; ta = r.theta; ts = OPT.sgd(ts, [10, 0.1], 0.01).theta; }
  nearAll(moves, [0.01, 0.0135, 0.0157], 5e-5, 'm and v start at 0: the first step is exactly α, the next two a bit larger');
  nearAll(ts, [-0.3, -0.003], 1e-12);
  nearAll(ta, [-0.039, -0.039], 5e-4);
});

test('A2 Q2: momentum and Adam follow the handout equations; dropout keeps the expectation', () => {
  const theta = [1, -2], grad = [0.5, -4];
  const m1 = OPT.momentum({}, theta, grad, 0.1, 0.9);
  nearAll(m1.state.m, [0.05, -0.4], 1e-12);
  nearAll(m1.theta, [1 - 0.1 * 0.05, -2 + 0.1 * 0.4], 1e-12);
  const a1 = OPT.adam({}, theta, grad, 0.1, 0.9, 0.99, 0);
  nearAll(a1.state.v, [0.01 * 0.25, 0.01 * 16], 1e-12);
  nearAll(a1.theta, [1 - 0.1 * 0.05 / 0.05, -2 + 0.1 * 0.4 / 0.4], 1e-12, 'first step moves each coordinate by α');
  const h = [2, -1, 0.5], pDrop = 0.3, r = OPT.rng(7), N = 40000, sums = [0, 0, 0];
  for (let k = 0; k < N; k++) OPT.dropout(h, pDrop, r).hDrop.forEach((v, i) => { sums[i] += v; });
  near(OPT.dropout(h, pDrop, r).gamma, 1 / 0.7, 1e-12);
  sums.forEach((s, i) => near(s / N, h[i], 0.03, 'E[h_drop] = h #' + i));
});

test('L04 p49: gradient clipping keeps the direction and caps the norm', () => {
  const r = OPT.clipByNorm([3, 4], 1);
  ok(r.clipped); near(r.norm, 5); nearAll(r.grad, [0.6, 0.8], 1e-12);
  ok(!OPT.clipByNorm([0.3, 0.4], 1).clipped);
});

/* ───────── Part 3: dependency parsing ───────── */

test('A2 starter tests: SHIFT, LEFT-ARC, RIGHT-ARC single steps', () => {
  let pp = { stack: ['ROOT', 'the'], buffer: ['cat', 'sat'], dependencies: [] };
  DP.parseStep(pp, 'S');
  eq([pp.stack, pp.buffer, pp.dependencies], [['ROOT', 'the', 'cat'], ['sat'], []]);
  pp = { stack: ['ROOT', 'the', 'cat'], buffer: ['sat'], dependencies: [] };
  DP.parseStep(pp, 'LA');
  eq([pp.stack, pp.buffer, pp.dependencies], [['ROOT', 'cat'], ['sat'], [['cat', 'the']]]);
  pp = { stack: ['ROOT', 'run', 'fast'], buffer: [], dependencies: [] };
  DP.parseStep(pp, 'RA');
  eq([pp.stack, pp.buffer, pp.dependencies], [['ROOT', 'run'], [], [['run', 'fast']]]);
});

test('A2 starter test: parse("parse this sentence") with S S S LA RA RA', () => {
  const sentence = ['parse', 'this', 'sentence'];
  const deps = DP.parse(sentence, ['S', 'S', 'S', 'LA', 'RA', 'RA']);
  eq(deps.map((d) => d.join()).sort(), ['ROOT,parse', 'parse,sentence', 'sentence,this']);
  eq(sentence, ['parse', 'this', 'sentence'], 'input unchanged');
});

test('A2 starter tests: minibatch parsing with the dummy models', () => {
  const uni = (batch) => batch.map((pp) => (pp.buffer.length ? 'S' : pp.stack[1] === 'right' ? 'RA' : 'LA'));
  const sents = [['right', 'arcs', 'only'], ['right', 'arcs', 'only', 'again'], ['left', 'arcs', 'only'], ['left', 'arcs', 'only', 'again']];
  const deps = DP.minibatchParse(sents, uni, 2).map((ds) => ds.map((d) => d.join()).sort());
  eq(deps[0], ['ROOT,right', 'arcs,only', 'right,arcs']);
  eq(deps[1], ['ROOT,right', 'arcs,only', 'only,again', 'right,arcs']);
  eq(deps[2], ['only,ROOT', 'only,arcs', 'only,left']);
  eq(deps[3], ['again,ROOT', 'again,arcs', 'again,left', 'again,only']);
  eq(DP.minibatchParse([['right']], uni, 2)[0].map((d) => d.join()), ['ROOT,right'], 'out of bound');
  const inter = (batch) => batch.map((pp) => (pp.buffer.length ? 'S' : pp.stack.length % 2 === 0 ? 'RA' : 'LA'));
  const d2 = DP.minibatchParse([['this', 'is', 'interleaving', 'dependency', 'test']], inter, 1)[0].map((d) => d.join()).sort();
  eq(d2, ['ROOT,is', 'dependency,interleaving', 'dependency,test', 'is,dependency', 'is,this']);
});

test('N08 p3 Figure 3: the oracle passes through stack [ROOT has good], buffer [control .], He ← has (nsubj)', () => {
  // He has good control .  — heads completed from N08's Figure 3 (has is the root; control ← good; has → control, .)
  const words = ['He', 'has', 'good', 'control', '.'];
  const heads = [null, 2, 0, 4, 2, 2];
  const labels = [null, 'nsubj', 'root', 'amod', 'obj', 'punct'];
  const steps = DP.oracleTrace(words, heads, labels);
  const fig3 = steps.find((s) => s.stack.join(' ') === 'ROOT has good' && s.buffer.join(' ') === 'control .');
  ok(fig3, 'configuration of Figure 3 is reached');
  const arcsSoFar = steps.slice(0, steps.indexOf(fig3) + 1).filter((s) => s.arc).map((s) => s.arc);
  eq(arcsSoFar, [{ head: 'has', dependent: 'He', label: 'nsubj' }]);
  eq(steps.slice(1).map((s) => s.transition), ['S', 'S', 'LA', 'S', 'S', 'LA', 'RA', 'S', 'RA', 'RA']);
});

test('A2 Q3(a): the oracle reproduces the three given rows of the transition table', () => {
  const words = ['I', 'presented', 'my', 'findings', 'at', 'the', 'NLP', 'conference'];
  // presented is the root; arcs from the handout figure (A2 p5)
  const heads = [null, 2, 0, 4, 2, 8, 8, 8, 2];
  const steps = DP.oracleTrace(words, heads);
  eq(steps[0].stack, ['ROOT']); eq(steps[0].buffer, words);
  eq([steps[1].transition, steps[1].stack], ['S', ['ROOT', 'I']]);
  eq([steps[2].transition, steps[2].stack], ['S', ['ROOT', 'I', 'presented']]);
  eq([steps[3].transition, steps[3].stack, steps[3].arc.head, steps[3].arc.dependent], ['LA', ['ROOT', 'presented'], 'presented', 'I']);
  const last = steps[steps.length - 1];
  eq([last.stack, last.buffer], [['ROOT'], []]);
});

test('TW04: “I ate fish” takes S S LA S RA RA; a wrong arc makes the oracle give up', () => {
  const heads = [null, 2, 0, 2];   // I ← ate → fish, ROOT → ate
  const steps = DP.oracleTrace(['I', 'ate', 'fish'], heads, [null, 'nsubj', 'root', 'obj']);
  eq(steps.slice(1).map((s) => s.transition), ['S', 'S', 'LA', 'S', 'RA', 'RA']);
  eq(steps.slice(1).map((s) => s.stack.join(' ')), ['ROOT I', 'ROOT I ate', 'ROOT ate', 'ROOT ate fish', 'ROOT ate', 'ROOT']);
  // [ROOT, ate] with fish still in the buffer: RIGHT-ARC is legal but premature, the oracle shifts
  eq(DP.oracleNext([0, 2], [3], [[2, 1]], heads), 'S');
  eq(DP.oracleNext([0], [3], [[2, 1], [0, 2]], heads), null, 'RIGHT-ARC too early: ate left the stack before fish was attached');
  eq(DP.oracleNext([0, 1], [2, 3], [], heads), 'S', 'with [ROOT, I] the LEFT/RIGHT arcs would be wrong');
  eq(DP.oracleNext([0], [2, 3], [[0, 1]], heads), null, 'I attached to ROOT: gold tree unreachable');
});

test('N08 p4 feature example at Figure 3 (stack ROOT has good, buffer control .): 18 word slots, 12 label slots', () => {
  // positions: ROOT 0, He 1, has 2, good 3, control 4, . 5; arcs so far: has → He
  const f = DP.features([0, 2, 3], [4, 5], [[2, 1]]);
  eq(f.length, 18);
  eq(f.filter((x) => x.hasLabel).length, 12);
  eq(f.slice(0, 6).map((x) => x.word), [3, 2, 0, 4, 5, null], 's1 s2 s3 b1 b2 b3');
  eq(f.filter((x) => x.word != null).map((x) => x.slot), ['s1', 's2', 's3', 'b1', 'b2', 'lc1(s2)']);
  eq(f.find((x) => x.slot === 'lc1(s2)').word, 1, 'He is the leftmost child of has');
  const total = f.length * 2 + f.filter((x) => x.hasLabel).length;   // words + their tags + labels of the 12 child slots
  eq(total, 48);
  eq(total * 50, 2400, 'input length with d = 50 (Chen & Manning 2014, 课件外)');
  eq(total * 50 * 200, 480000, 'W1 numbers with a 200-unit hidden layer');
});

test('UAS and LAS on “He has good control .”: one wrong head, two wrong labels → 80% / 40% (课件外 example)', () => {
  const goldH = [null, 2, 0, 4, 2, 2], goldL = [null, 'nsubj', 'root', 'amod', 'obj', 'punct'];
  const predH = [null, 2, 0, 2, 2, 2], predL = [null, 'nsubj', 'root', 'amod', 'nsubj', 'obj'];
  near(DP.uas(predH, goldH), 0.8);
  near(DP.las(predH, predL, goldH, goldL), 0.4);
});

/* ───────── Part 4: language models, RNNs ───────── */

test('L04 p11: P(books | students opened their) = 0.4, P(exams | …) = 0.1', () => {
  const table = { 'students opened their': 1000, 'students opened their books': 400, 'students opened their exams': 100 };
  near(NG.conditional(table, 'students opened their', 'books'), 0.4);
  near(NG.conditional(table, 'students opened their', 'exams'), 0.1);
  eq(NG.conditional(table, 'students opened their', 'minds'), 0, 'never seen after the context: probability 0');
  eq(NG.conditional(table, 'proctor started the', 'clock'), null, 'unseen context: cannot be computed (L04 p12)');
});

test('ngram counts and sampling', () => {
  const c = NG.counts(['the', 'cat', 'the', 'cat', 'sat'], 2);
  eq(c.get('the cat'), 2); eq(c.get('cat sat'), 1);
  const dist = { company: 0.153, bank: 0.153, price: 0.077 };       // L04 p14, top three words
  eq(NG.sample(dist, 0), 'company'); eq(NG.sample(dist, 0.999), 'price');
});

test('L04 p39: perplexity = exp(mean cross-entropy); a uniform 64-way guess has perplexity 64 (T06)', () => {
  near(P.perplexity(new Array(10).fill(1 / 64)), 64, 1e-9);
  const probs = [0.5, 0.25, 0.1];
  near(P.perplexity(probs), Math.exp((-Math.log(0.5) - Math.log(0.25) - Math.log(0.1)) / 3), 1e-12);
});

test('Chapter 4.2 numbers: window W grows with the window, W_h does not grow with the sentence (N06 p5)', () => {
  const windowW = (words, d, hidden) => hidden * words * d;
  eq(windowW(4, 50, 100), 20000); eq(windowW(10, 50, 100), 50000);
  eq(1000 * 1000, 1000000, 'W_h for a 1000-dimensional hidden state');
  // the column view: W e = sum of the four d-column blocks times each word vector
  const W = [[1, 2, 3, 4, 5, 6, 7, 8]], e = [1, 0, 0, 1, 2, 0, 0, 1];
  const blocks = [0, 1, 2, 3].map((k) => W[0][2 * k] * e[2 * k] + W[0][2 * k + 1] * e[2 * k + 1]);
  eq(L.matvec(W, e)[0], blocks.reduce((a, b) => a + b, 0));
});

test('Chapter 4.3 perplexity example: P = 0.5, 0.25, 0.2, 0.4 → J ≈ 1.151, perplexity = 100^(1/4) ≈ 3.162', () => {
  const probs = [0.5, 0.25, 0.2, 0.4];
  near(probs.reduce((s, p) => s - Math.log(p), 0) / 4, 1.1513, 5e-5);
  near(P.perplexity(probs), Math.pow(100, 0.25), 1e-12);
  near(P.perplexity(probs), 3.162, 5e-4);
  near(1 / 0.002, 500, 1e-9, 'T06: inverting 0.002 gives 500');
});

function smallRnn(Vsize, d, Dh) {
  return { E: randMat(Vsize, d), Wh: randMat(Dh, Dh), We: randMat(Dh, d), b1: randVec(Dh), U: randMat(Vsize, Dh), b2: randVec(Vsize), h0: randVec(Dh, 0.1) };
}

test('RNN LM: J is the mean step loss, perplexity = exp(J) (L04 p26, p39)', () => {
  const p = smallRnn(5, 3, 4), ids = [0, 3, 1, 4, 2];
  const r = RNN.forward(p, ids);
  eq(r.steps.length, 4);
  near(r.J, r.steps.reduce((s, st) => s + st.loss, 0) / 4, 1e-12);
  near(r.perplexity, Math.exp(r.J), 1e-12);
});

test('BPTT gradients (shared W_h summed over steps) match numerical gradients (L04 p33–p35)', () => {
  const p = smallRnn(5, 3, 4), ids = [1, 0, 3, 2, 4, 1];
  const { grads } = RNN.bptt(p, ids);
  ['Wh', 'We', 'U', 'E'].forEach((k) => {
    const num = C.gradientMatrix((M) => RNN.forward({ ...p, [k]: M }, ids).J, p[k]);
    ok(C.maxRelError(grads[k], num) < 1e-5, k);
  });
  ['b1', 'b2', 'h0'].forEach((k) => {
    const num = C.gradient((v) => RNN.forward({ ...p, [k]: v }, ids).J, p[k]);
    ok(C.maxRelError(grads[k], num) < 1e-5, k);
  });
});

test('L04 p40–p46: with small recurrent weights the gradient reaching early steps shrinks', () => {
  const p = smallRnn(4, 2, 3);
  p.Wh = p.Wh.map((row) => row.map((v) => v * 0.3));
  const norms = RNN.gradientReach(p, [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2]);
  for (let k = 1; k < norms.length; k++) ok(norms[k - 1] < norms[k], 'earlier steps get less gradient');
  ok(norms[0] < norms[norms.length - 1] * 1e-3, 'many orders of magnitude smaller');
});

test('Chapter 4.4 numbers: powers of a per-step factor, and clipping [3, 4] to length 1', () => {
  near(Math.pow(0.5, 10), 0.000977, 5e-7); near(Math.pow(1.5, 10), 57.67, 5e-3);
  near(Math.pow(0.9, 20), 0.1216, 5e-5); near(Math.pow(0.25, 7), 0.000061, 5e-7);
  const r = OPT.clipByNorm([3, 4], 1); nearAll(r.grad, [0.6, 0.8], 1e-12); near(r.norm, 5);
  ok(!OPT.clipByNorm([3, 4], 10).clipped, 'norm 5 is below threshold 10: unchanged');
});

test('Chapter 4.5 example: gates f = 0.9, i = 0.3, o = 0.8, candidate 0.6, old cell 1 → c = 1.08, h ≈ 0.635', () => {
  const logit = (q) => Math.log(q / (1 - q));
  const p = { Wf: [[logit(0.9)]], Uf: [[0]], Wi: [[logit(0.3)]], Ui: [[0]], Wo: [[logit(0.8)]], Uo: [[0]], Wc: [[Math.atanh(0.6)]], Uc: [[0]] };
  const r = G.lstmStep(p, [1], [0], [1]);
  nearAll([r.f[0], r.i[0], r.o[0], r.cTilde[0]], [0.9, 0.3, 0.8, 0.6], 1e-12);
  near(r.c[0], 1.08, 1e-12); near(r.h[0], 0.8 * Math.tanh(1.08), 1e-12); near(r.h[0], 0.635, 5e-4);
  near(Math.pow(0.95, 19), 0.377, 5e-4, 'forget gate 0.95 kept for 19 steps');
  const gp = { Wz: [[logit(0.9)]], Uz: [[0]], Wr: [[0]], Ur: [[0]], W: [[Math.atanh(0.5)]], U: [[0]] };
  const g = G.gruStep(gp, [1], [-0.4]);
  near(g.h[0], 0.1 * 0.5 + 0.9 * -0.4, 1e-12, 'GRU: h = (1 − z) h̃ + z h_prev = −0.31');
});

test('N06 p13: an LSTM with all-zero weights halves the cell (gates σ(0) = 0.5, c̃ = 0)', () => {
  const Z = (r, c) => L.zerosMat(r, c);
  const p = { Wi: Z(2, 3), Ui: Z(2, 2), Wf: Z(2, 3), Uf: Z(2, 2), Wo: Z(2, 3), Uo: Z(2, 2), Wc: Z(2, 3), Uc: Z(2, 2) };
  const r = G.lstmStep(p, [1, 2, 3], [0.4, -0.2], [1, -2]);
  nearAll(r.c, [0.5, -1], 1e-12);
  nearAll(r.h, [0.5 * Math.tanh(0.5), 0.5 * Math.tanh(-1)], 1e-12);
});

test('N06 p11–p12: a GRU with update gate z ≈ 1 copies the previous state', () => {
  const big = [[50, 50], [50, 50]];
  const p = { Wz: big, Uz: L.zerosMat(2, 2), Wr: L.zerosMat(2, 2), Ur: L.zerosMat(2, 2), W: randMat(2, 2), U: randMat(2, 2) };
  const r = G.gruStep(p, [1, 1], [0.3, -0.7]);
  nearAll(r.h, [0.3, -0.7], 1e-12);
});

/* ───────── Part 5: attention and Transformers ───────── */

test('Chapter 5.1 numbers: scores [3.84, 1, 1, 1] → weights ≈ [0.851, 0.050, 0.050, 0.050]; weighted sum of the encoder states', () => {
  const w = P.softmax([3.84, 1, 1, 1]);
  near(w[0], 0.851, 5e-4); near(w[1], 0.050, 5e-4);
  const H = [[0.9, 0.1, -0.3], [0.2, 0.7, 0.4], [-0.4, 0.8, 0.1], [0.1, -0.5, 0.9]];
  const a = [0, 1, 2].map((d) => w.reduce((s, x, j) => s + x * H[j][d], 0));
  nearAll(a, [0.761, 0.135, -0.186], 5e-4);
  near(P.softmax([2, 0, 0])[0], 0.787, 5e-4);
  near(0.5 * 2 + 0.5 * 4 + 0 * 10, 3);
});

test('Chapter 5.2 example: “his” in “Zuko made his uncle tea” (made-up X, Q, K, V = I)', () => {
  const X = [[1, 0, 0.5], [0, 1, 0], [0.8, 0.2, 0.4], [0.3, 0, 1], [0, 0.6, 0.8]];
  const Q = [[1, 0.5, 0], [0, 1, 0.5], [0.5, 0, 1]], K = [[1, 0, 0.5], [0.5, 1, 0], [0, 0.5, 1]];
  const r = ATT.selfAttention(X, Q, K, L.identity(3));
  nearAll(r.queries[2], [1, 0.6, 0.5], 1e-12); nearAll(r.keys[0], [1, 0.25, 1], 1e-12);
  nearAll(r.scores[2], [1.65, 1.1, 1.54, 1.175, 1.3], 1e-12);
  nearAll(r.weights[2], [0.263, 0.152, 0.236, 0.164, 0.185], 5e-4);
  nearAll(r.output[2], [0.501, 0.310, 0.538], 5e-4);
  eq(r.scores.length, 5); eq(r.scores[0].length, 5, 'n × n scores');
});

test('L05 p50: causal mask on [START] The chef who: future weights are 0, rows sum to 1', () => {
  const M = ATT.causalMask(4);
  eq(M.map((row) => row.map((v) => (v === 0 ? 0 : 'x'))), [[0, 'x', 'x', 'x'], [0, 0, 'x', 'x'], [0, 0, 0, 'x'], [0, 0, 0, 0]]);
  const X = randMat(4, 3), I = L.identity(3);
  const r = ATT.selfAttention(X, I, I, I, { causal: true });
  r.weights.forEach((row, i) => {
    near(L.sum(row), 1, 1e-12);
    row.forEach((w, j) => { if (j > i) eq(w, 0); });
  });
  nearAll(r.weights[0], [1, 0, 0, 0], 0, 'the first word can only look at itself');
});

test('Chapter 5.3 example: masked softmax on [START] The chef who (made-up scores)', () => {
  const S = [[1.2, 0.3, -0.5, 0.8], [0.4, 1.0, 0.2, -0.3], [0.1, 0.9, 1.5, 0.6], [0.3, 0.5, 1.1, 0.9]];
  const M = ATT.causalMask(4);
  const W = S.map((row, i) => P.softmax(row.map((v, j) => v + M[i][j])));
  nearAll(W[0], [1, 0, 0, 0], 1e-12);
  nearAll(W[1], [0.354, 0.646, 0, 0], 5e-4);
  nearAll(W[2], [0.137, 0.306, 0.557, 0], 5e-4);
  nearAll(W[3], [0.160, 0.195, 0.355, 0.291], 5e-4);
  W.forEach((row) => near(row.reduce((a, b) => a + b, 0), 1, 1e-12));
  // without positions, swapping word order only swaps the output rows (L05 p43)
  const E = { Zuko: [1, 0, 0.5], made: [0, 1, 0], his: [0.8, 0.2, 0.4], uncle: [0.3, 0, 1] };
  const Q = [[1, 0.5, 0], [0, 1, 0.5], [0.5, 0, 1]], K = [[1, 0, 0.5], [0.5, 1, 0], [0, 0.5, 1]];
  const a = ATT.selfAttention(['Zuko', 'made', 'his', 'uncle'].map((w) => E[w]), Q, K, L.identity(3)).output;
  const b = ATT.selfAttention(['his', 'uncle', 'made', 'Zuko'].map((w) => E[w]), Q, K, L.identity(3)).output;
  nearAll(a[0], b[3], 1e-12, 'Zuko gets the same output in both orders');
  const P4 = [[0.6, 0, 0], [0, 0.6, 0], [0, 0, 0.6], [0.4, 0.4, 0]];
  const ap = ATT.selfAttention(['Zuko', 'made', 'his', 'uncle'].map((w, i) => L.add(E[w], P4[i])), Q, K, L.identity(3)).output;
  const bp = ATT.selfAttention(['his', 'uncle', 'made', 'Zuko'].map((w, i) => L.add(E[w], P4[i])), Q, K, L.identity(3)).output;
  ok(Math.abs(ap[0][0] - bp[3][0]) > 1e-3, 'with position vectors the outputs differ');
});

test('A3 Q1(a): when one key matches the query much better, attention copies that value', () => {
  const keys = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], values = [[1, 2], [3, 4], [5, 6]];
  const r = ATT.attend([0, 30, 0], keys, values);
  ok(r.weights[1] > 0.999999);
  nearAll(r.output, [3, 4], 1e-6);
});

test('L05 p43, A3 Q2: without positions self-attention + FFN is permutation-equivariant; with positions it is not', () => {
  const n = 4, d = 4, X = randMat(n, d);
  const Wq = randMat(d, d), Wk = randMat(d, d), Wv = randMat(d, d), W1 = randMat(d, d), W2 = randMat(d, d), b1 = randVec(d), b2 = randVec(d);
  const block = (Xin) => ATT.feedForward(ATT.selfAttention(Xin, Wq, Wk, Wv, { scale: 1 / Math.sqrt(d) }).output, W1, b1, W2, b2);
  const perm = [2, 0, 3, 1];
  nearAll(block(ATT.permuteRows(X, perm)), ATT.permuteRows(block(X), perm), 1e-12, 'Z_perm = P Z');
  const Phi = ATT.sinusoidal(n, d);
  const withPos = (Xin) => block(L.matAdd(Xin, Phi));
  const a = withPos(ATT.permuteRows(X, perm)), b = ATT.permuteRows(withPos(X), perm);
  ok(C.maxRelError(a, b) > 1e-3, 'positions break the symmetry');
});

test('A3 Q2 and L05 p45: sinusoidal position vectors', () => {
  const a3 = ATT.sinusoidal(3, 4);
  nearAll(a3[0], [0, 1, 0, 1], 1e-15, 'position 0 is sin 0, cos 0 in every pair');
  nearAll(a3[1], [Math.sin(1), Math.cos(1), Math.sin(1 / 100), Math.cos(1 / 100)], 1e-15);
  const l05 = ATT.sinusoidal(2, 4, 'l05');
  nearAll(l05[0], [Math.sin(1 / 100), Math.cos(1 / 100), Math.sin(1 / 10000), Math.cos(1 / 10000)], 1e-15, 'i = 1, k = 1, 2');
});

test('L05 p62: layer norm gives mean 0 and variance ≈ 1 per vector, then applies γ and β', () => {
  const x = [2, -1, 4, 7];
  const r = ATT.layerNorm(x, null, null, 0);
  near(P.mean(r.output), 0, 1e-12);
  near(r.output.reduce((s, v) => s + v * v, 0) / x.length, 1, 1e-12);
  const g = ATT.layerNorm(x, [2, 2, 2, 2], [1, 1, 1, 1], 0);
  nearAll(g.output, r.output.map((v) => 2 * v + 1), 1e-12);
});

test('L05 p57–p59: multi-head output = concat(heads) Y; scaling divides scores by √(d/h)', () => {
  const n = 3, d = 4, h = 2, X = randMat(n, d);
  const heads = Array.from({ length: h }, () => ({ Q: randMat(d, d / h), K: randMat(d, d / h), V: randMat(d, d / h) }));
  const Y = randMat(d, d);
  const r = ATT.multiHead(X, heads, Y, { scaled: true });
  eq(L.shape(r.output), [n, d]);
  const single = ATT.selfAttention(X, heads[0].Q, heads[0].K, heads[0].V);
  nearAll(r.heads[0].scores, single.scores.map((row) => row.map((v) => v / Math.sqrt(d / h))), 1e-12);
  nearAll(r.output, L.matmul(r.concat, Y), 1e-12);
});

test('L05 p59: dot products of random vectors grow with d, so unscaled softmax gets peakier', () => {
  const r = OPT.rng(11), spread = (dim) => {
    const s = Array.from({ length: 400 }, () => {
      const a = Array.from({ length: dim }, () => OPT.gaussian(r)), b = Array.from({ length: dim }, () => OPT.gaussian(r));
      return L.dot(a, b);
    });
    return P.std(s);
  };
  const s4 = spread(4), s256 = spread(256);
  ok(s256 > 5 * s4, 'std grows like √d');
  near(s256 / Math.sqrt(256), s4 / Math.sqrt(4), 0.35, 'dividing by √d brings them back');
});

test('Chapter 5.4 numbers: random dot products spread like √d; softmax of 8 scores peaks unless scaled (seed 7)', () => {
  const run = (d) => {
    const r = OPT.rng(7), vec = () => Array.from({ length: d }, () => OPT.gaussian(r));
    const pairs = Array.from({ length: 300 }, () => L.dot(vec(), vec()));
    const q = vec(), keys = Array.from({ length: 8 }, vec), sc = keys.map((k) => L.dot(q, k));
    return { sd: P.std(pairs), top: Math.max(...P.softmax(sc)), topScaled: Math.max(...P.softmax(sc.map((v) => v / Math.sqrt(d)))) };
  };
  const a = run(4), b = run(64), c = run(512);
  near(a.sd, 2.1, 0.05); near(b.sd, 7.8, 0.05); near(c.sd, 23.0, 0.05);
  near(a.top, 0.652, 5e-4); near(b.top, 0.837, 5e-4); near(c.top, 0.976, 5e-4);
  near(a.topScaled, 0.408, 5e-4); near(b.topScaled, 0.257, 5e-4); near(c.topScaled, 0.209, 5e-4);
  // layer norm of [2, −1, 4, 7]: μ = 3, σ (mean squared deviation) = 8.5
  const ln = ATT.layerNorm([2, -1, 4, 7], null, null, 0);
  near(ln.mu, 3); near(ln.sigma, 8.5); nearAll(ln.output, [-0.343, -1.372, 0.343, 1.372], 5e-4);
  eq(512 / 8, 64, 'd = 512 with 8 heads: 64 dimensions per head');
});

/* ───────── Part 6 preview: BPE (needed early because 6.1 uses it) ───────── */

test('L14 p26–p53: BPE on "Peter Piper picked a peck of pickled peppers" — merges, corpus and tables', () => {
  const text = 'Peter Piper picked a peck of pickled peppers';
  eq(BPE.pretokenize(text), ['Peter', '_Piper', '_picked', '_a', '_peck', '_of', '_pickled', '_peppers']);
  const r = BPE.train(text, 6);
  eq(r.initialVocab.slice().sort(), ['P', '_', 'a', 'c', 'd', 'e', 'f', 'i', 'k', 'l', 'o', 'p', 'r', 's', 't']);
  eq(r.merges, [['_', 'p'], ['c', 'k'], ['e', 'r'], ['_p', 'e'], ['_p', 'i'], ['_pi', 'ck']]);
  const show = (t) => t.slice(0, 7).map((e) => e.left + ' + ' + e.right + ' ' + e.count);
  eq(show(r.steps[0].table), ['_ + p 4', 'p + e 4', 'c + k 3', 'e + r 3', 'e + d 2', 'i + c 2', 'p + i 2'], 'p30');
  eq(show(r.steps[1].table), ['c + k 3', 'e + r 3', '_p + e 2', '_p + i 2', 'e + d 2', 'i + c 2', 'p + e 2'], 'p34');
  eq(show(r.steps[2].table), ['e + r 3', '_p + e 2', '_p + i 2', 'e + d 2', 'i + ck 2', 'p + e 2', '_ + a 1'], 'p38');
  eq(show(r.steps[3].table), ['_p + e 2', '_p + i 2', 'e + d 2', 'i + ck 2', 'p + er 2', '_ + a 1', '_ + o 1'], 'p42');
  eq(show(r.steps[4].table), ['_p + i 2', 'e + d 2', 'i + ck 2', 'p + er 2', '_ + a 1', '_ + o 1', '_ + P 1'], 'p46');
  eq(show(r.steps[5].table), ['_pi + ck 2', 'e + d 2', 'p + er 2', '_ + a 1', '_ + o 1', '_ + P 1', '_pe + ck 1'], 'p50');
  eq(r.corpus.map((w) => w.join(' ')), ['P e t er', '_ P i p er', '_pick e d', '_ a', '_pe ck', '_ o f', '_pick l e d', '_pe p p er s'], 'p52');
});

test('L14 p54: "_pier" is tokenised as _pi + er by rules 1, 3, 5', () => {
  const merges = [['_', 'p'], ['c', 'k'], ['e', 'r'], ['_p', 'e'], ['_p', 'i'], ['_pi', 'ck']];
  const r = BPE.encode('_pier', merges);
  eq(r.symbols, ['_pi', 'er']);
  eq(r.trace.map((t) => t.rule), [1, 3, 5]);
});

/* ───────── report ───────── */
console.log(pass + ' passed, ' + fail + ' failed');
if (fail) { console.log('\n' + failures.join('\n\n')); process.exitCode = 1; }
