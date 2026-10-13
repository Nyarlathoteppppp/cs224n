(function (root) {
  'use strict';
  /* Arc-standard transition-based dependency parsing (N08 p2–p3; A2 Q3).
   * A partial parse is { stack, buffer, dependencies } with words as strings and dependencies as [head, dependent]
   * pairs, the same representation as A2's starter code so that the starter tests can be mirrored exactly.
   * parseStep does not enforce N08's "the dependent of LEFT-ARC cannot be ROOT" rule, because the A2 starter tests
   * expect it not to; legalTransitions() applies the N08 preconditions for the interactive parser. */

  function partialParse(sentence) {
    return { sentence: sentence.slice(), stack: ['ROOT'], buffer: sentence.slice(), dependencies: [] };
  }

  /** Applies 'S' (SHIFT), 'LA' (LEFT-ARC) or 'RA' (RIGHT-ARC) in place and returns the parse. */
  function parseStep(pp, transition) {
    if (transition === 'S') {
      if (!pp.buffer.length) throw new Error('SHIFT needs a non-empty buffer');
      pp.stack.push(pp.buffer.shift());
    } else if (transition === 'LA' || transition === 'RA') {
      if (pp.stack.length < 2) throw new Error(transition + ' needs two words on the stack');
      const top = pp.stack.pop(), second = pp.stack.pop();
      if (transition === 'LA') { pp.dependencies.push([top, second]); pp.stack.push(top); }
      else { pp.dependencies.push([second, top]); pp.stack.push(second); }
    } else {
      throw new Error('unknown transition ' + transition);
    }
    return pp;
  }

  function parse(sentence, transitions) {
    const pp = partialParse(sentence);
    transitions.forEach((t) => parseStep(pp, t));
    return pp.dependencies;
  }

  const finished = (pp) => pp.buffer.length === 0 && pp.stack.length === 1;

  /** A2 Algorithm 1: parse sentences in minibatches; `model(batch)` returns one transition per partial parse. */
  function minibatchParse(sentences, model, batchSize) {
    const partial = sentences.map(partialParse);
    let unfinished = partial.slice();
    while (unfinished.length) {
      const batch = unfinished.slice(0, batchSize);
      const transitions = model(batch);
      batch.forEach((pp, i) => parseStep(pp, transitions[i]));
      unfinished = unfinished.filter((pp) => !finished(pp));
    }
    return partial.map((pp) => pp.dependencies);
  }

  /** Transitions allowed by N08's preconditions. */
  function legalTransitions(pp) {
    const out = [];
    if (pp.buffer.length) out.push('S');
    if (pp.stack.length >= 2 && pp.stack[pp.stack.length - 2] !== 'ROOT') out.push('LA');
    if (pp.stack.length >= 2) out.push('RA');
    return out;
  }

  /** Static arc-standard oracle (the rule behind the interactive “提示”; the exact rule is outside the course notes).
   * Positions: ROOT = 0, words 1..n; heads[i] is the gold head of word i. stack/buffer hold positions and arcs is a
   * list of [head, dependent] positions built so far. Returns 'LA', 'RA', 'S', or null when the gold tree can no
   * longer be reached from here (a wrong arc was built, or the tree is non-projective).
   *   LEFT-ARC  when the second word on the stack is a dependent of the top word;
   *   RIGHT-ARC when the top word is a dependent of the second one and already has all of its own dependents;
   *   SHIFT     otherwise. */
  function oracleNext(stack, buffer, arcs, heads) {
    const kids = (w, list) => list.filter((hd) => hd === w).length;
    const built = arcs.map(([hd]) => hd);
    // every arc must be gold, and a word that has left the stack can never get another dependent
    if (arcs.some(([hd, d]) => heads[d] !== hd || kids(d, built) !== kids(d, heads))) return null;
    const s1 = stack[stack.length - 1], s2 = stack.length >= 2 ? stack[stack.length - 2] : -1;
    if (s2 > 0 && heads[s2] === s1) return 'LA';
    if (s2 >= 0 && heads[s1] === s2) {
      if (kids(s1, built) === kids(s1, heads)) return 'RA';
    }
    return buffer.length ? 'S' : null;
  }

  /** Runs oracleNext from the initial configuration. Returns every configuration and the transition that leads out
   * of it, ending in the terminal one. Throws if the tree cannot be built by arc-standard transitions. */
  function oracleTrace(words, heads, labels) {
    const n = words.length;
    const name = (i) => (i === 0 ? 'ROOT' : words[i - 1]);
    const stack = [0], buffer = Array.from({ length: n }, (_, i) => i + 1), arcs = [];
    const steps = [];
    const snap = (transition, arc) => steps.push({
      stack: stack.map(name), buffer: buffer.map(name), transition,
      arc: arc ? { head: name(arc[0]), dependent: name(arc[1]), label: labels ? labels[arc[1]] : null } : null,
    });
    snap('init', null);
    while (buffer.length || stack.length > 1) {
      const t = oracleNext(stack, buffer, arcs, heads);
      if (!t) throw new Error('tree is not reachable with arc-standard transitions (non-projective?)');
      let arc = null;
      if (t === 'S') stack.push(buffer.shift());
      else {
        const top = stack.pop(), second = stack.pop();
        arc = t === 'LA' ? [top, second] : [second, top];
        stack.push(t === 'LA' ? top : second);
        arcs.push(arc);
      }
      snap(t, arc);
    }
    return steps;
  }

  /** The 18 word slots of N08's feature example (Chen & Manning 2014), as positions or null (the NULL token):
   * s1–s3, b1–b3; lc1, rc1, lc2, rc2 of s1 and s2; lc1(lc1(·)) and rc1(rc1(·)) of s1 and s2.
   * lc1/lc2 = leftmost / second leftmost child among the children to the word's left, rc1/rc2 = rightmost / second
   * rightmost among those to its right, using only the arcs built so far (that reading of “leftmost child” is 课件外).
   * The label features are the arc labels of slots 7–18 (N08: “excluding those 6 words on the stack/buffer”). */
  function features(stack, buffer, arcs) {
    const left = (w) => (w == null ? [] : arcs.filter(([hd, d]) => hd === w && d < w).map(([, d]) => d).sort((a, b) => a - b));
    const right = (w) => (w == null ? [] : arcs.filter(([hd, d]) => hd === w && d > w).map(([, d]) => d).sort((a, b) => b - a));
    const at = (list, k) => (list.length > k ? list[k] : null);
    const lc = (w, k) => at(left(w), k - 1), rc = (w, k) => at(right(w), k - 1);
    const s = (k) => at(stack.slice().reverse(), k - 1), b = (k) => at(buffer, k - 1);
    const slots = [['s1', s(1)], ['s2', s(2)], ['s3', s(3)], ['b1', b(1)], ['b2', b(2)], ['b3', b(3)]];
    [1, 2].forEach((i) => {
      const w = s(i);
      slots.push(['lc1(s' + i + ')', lc(w, 1)], ['rc1(s' + i + ')', rc(w, 1)], ['lc2(s' + i + ')', lc(w, 2)], ['rc2(s' + i + ')', rc(w, 2)]);
    });
    [1, 2].forEach((i) => {
      const w = s(i);
      slots.push(['lc1(lc1(s' + i + '))', lc(lc(w, 1), 1)], ['rc1(rc1(s' + i + '))', rc(rc(w, 1), 1)]);
    });
    return slots.map(([slot, word], k) => ({ slot, word, hasLabel: k >= 6 }));
  }

  /** Labeled attachment score: head and label both right. */
  function las(predHeads, predLabels, goldHeads, goldLabels) {
    let right = 0, total = 0;
    for (let i = 1; i < goldHeads.length; i++) { total += 1; if (predHeads[i] === goldHeads[i] && predLabels[i] === goldLabels[i]) right += 1; }
    return right / total;
  }

  /** Unlabeled attachment score: share of words whose predicted head equals the gold head. */
  function uas(predHeads, goldHeads) {
    let right = 0, total = 0;
    for (let i = 1; i < goldHeads.length; i++) { total += 1; if (predHeads[i] === goldHeads[i]) right += 1; }
    return right / total;
  }

  const api = { partialParse, parseStep, parse, minibatchParse, legalTransitions, oracleNext, oracleTrace, features, uas, las, finished };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.depparse = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
