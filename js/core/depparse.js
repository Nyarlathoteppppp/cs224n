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

  /** Static arc-standard oracle over word positions (ROOT = 0, words 1..n; heads[i] is the head of word i).
   * Returns every configuration and the transition that leads out of it, ending in the terminal one.
   * Throws if the tree cannot be built by arc-standard transitions (non-projective trees). */
  function oracleTrace(words, heads, labels) {
    const n = words.length;
    const name = (i) => (i === 0 ? 'ROOT' : words[i - 1]);
    const children = new Array(n + 1).fill(0), attached = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) children[heads[i]] += 1;
    const stack = [0], buffer = Array.from({ length: n }, (_, i) => i + 1);
    const steps = [];
    const snap = (transition, arc) => steps.push({
      stack: stack.map(name), buffer: buffer.map(name), transition,
      arc: arc ? { head: name(arc[0]), dependent: name(arc[1]), label: labels ? labels[arc[1]] : null } : null,
    });
    snap('init', null);
    while (buffer.length || stack.length > 1) {
      const s1 = stack[stack.length - 1], s2 = stack.length >= 2 ? stack[stack.length - 2] : -1;
      if (s2 > 0 && heads[s2] === s1) {
        stack.splice(stack.length - 2, 1);
        attached[s1] += 1;
        snap('LA', [s1, s2]);
      } else if (s2 >= 0 && heads[s1] === s2 && attached[s1] === children[s1]) {
        stack.pop();
        attached[s2] += 1;
        snap('RA', [s2, s1]);
      } else if (buffer.length) {
        stack.push(buffer.shift());
        snap('S', null);
      } else {
        throw new Error('tree is not reachable with arc-standard transitions (non-projective?)');
      }
    }
    return steps;
  }

  /** Unlabeled attachment score: share of words whose predicted head equals the gold head. */
  function uas(predHeads, goldHeads) {
    let right = 0, total = 0;
    for (let i = 1; i < goldHeads.length; i++) { total += 1; if (predHeads[i] === goldHeads[i]) right += 1; }
    return right / total;
  }

  const api = { partialParse, parseStep, parse, minibatchParse, legalTransitions, oracleTrace, uas, finished };
  root.CS224N = root.CS224N || {};
  root.CS224N.core = root.CS224N.core || {};
  root.CS224N.core.depparse = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
