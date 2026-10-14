/* n-gram 语言模型 (L04 p11–p18): (1) drag the counts of “students opened their (w)” and watch the conditional
 * probabilities, including the two failure cases (numerator 0, denominator 0); (2) walk the Reuters trigram model's
 * generation “today the price of gold …” with the slide's own next-word probabilities, and sample from them.
 * Probabilities come from js/core/ngram.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, slider, button, segmented, fmt } = C.dom;
  const NG = C.core.ngram;

  // L04 p14–p17: top five next words after each context (the rest of the mass is “其他词”). Ordered [word, p] pairs:
  // as object keys, “18” would jump to the front.
  const STEPS = [
    { ctx: 'today the', dist: [['company', 0.153], ['bank', 0.153], ['price', 0.077], ['italian', 0.039], ['emirate', 0.039]], pick: 'price' },
    { ctx: 'today the price', dist: [['of', 0.308], ['for', 0.050], ['it', 0.046], ['to', 0.046], ['is', 0.031]], pick: 'of' },
    { ctx: 'today the price of', dist: [['the', 0.072], ['18', 0.043], ['oil', 0.043], ['its', 0.036], ['gold', 0.018]], pick: 'gold' },
  ];
  const FULL = 'today the price of gold per ton , while production of shoe lasts and shoe industry , the bank intervened just after it considered and rejected an imf demand to rebuild depleted european stocks , sept 30 end primary 76 cts a share .';

  function mount(el) {
    const part = h('div');
    el.append(h('div.viz-row', segmented([{ value: 'count', label: '① 数次数' }, { value: 'gen', label: '② 逐词生成' }], 'count', (v) => show(v), '实验'), part));
    const countPane = countView(), genPane = genView();
    function show(v) { part.innerHTML = ''; part.append(v === 'count' ? countPane : genPane); }
    show('count');
  }

  function bar(label, p, cls) {
    return h('div.ng-bar' + (cls ? '.' + cls : ''),
      h('span.ng-label', label),
      h('span.ng-track', h('span.ng-fill', { style: { width: Math.max(0, Math.min(1, p)) * 100 + '%' } })),
      h('span.ng-val', fmt(p, 3)));
  }

  function countView() {
    let ctx = 1000, books = 400, exams = 100;
    const out = h('div.ng-out'), note = h('div.ng-note');
    const sCtx = slider('count(students opened their)', { min: 0, max: 1000, step: 10, value: ctx, format: String, onInput: (v) => { ctx = v; clamp(); render(); } });
    const sBooks = slider('count(… books)', { min: 0, max: 1000, step: 10, value: books, format: String, onInput: (v) => { books = v; clamp(); render(); } });
    const sExams = slider('count(… exams)', { min: 0, max: 1000, step: 10, value: exams, format: String, onInput: (v) => { exams = v; clamp(); render(); } });
    function clamp() {   // a continuation can't be seen more often than its context
      if (books > ctx) { books = ctx; sBooks.set(books); }
      if (exams > ctx - books) { exams = Math.max(0, ctx - books); sExams.set(exams); }
    }
    const reset = button('恢复课件的数', () => { ctx = 1000; books = 400; exams = 100; sCtx.set(ctx); sBooks.set(books); sExams.set(exams); render(); });
    const pane = h('div.ng-pane',
      h('p.viz-note', '语料里数出的次数（课件的原数：1000、400、100）。拖动滑块，看条件概率怎么变；把某个计数拖到 0 试试。后面接 books 和接 exams 的次数加起来，不能超过前文出现的次数，所以拖动时另一个计数可能被自动调小。'),
      h('div.ng-sliders', sCtx, sBooks, sExams, reset), out, note);
    function render() {
      const table = { 'students opened their': ctx, 'students opened their books': books, 'students opened their exams': exams };
      const pb = NG.conditional(table, 'students opened their', 'books'), pe = NG.conditional(table, 'students opened their', 'exams');
      out.innerHTML = '';
      note.innerHTML = '';
      note.className = 'ng-note';
      if (pb == null) {
        out.append(h('div.ng-formula', 'P(w | students opened their) = count(students opened their w) / 0'));
        note.classList.add('is-bad');
        note.append(h('b', '分母是 0：'), '语料里从来没出现过 “students opened their”，对任何词都算不出概率。课件给的补救是', h('b', '回退'), '：改用更短的前文，比如只看 “opened their”。');
        return;
      }
      const other = Math.max(0, 1 - pb - pe);
      out.append(bar('books', pb, 'is-a'), bar('exams', pe, 'is-b'), bar('其他各种词', other, 'is-c'),
        h('div.ng-formula', 'P(books | students opened their) = ' + books + ' / ' + ctx + ' = ' + fmt(pb, 3) + '，  P(exams | …) = ' + exams + ' / ' + ctx + ' = ' + fmt(pe, 3)));
      const zero = [books === 0 ? 'books' : null, exams === 0 ? 'exams' : null].filter(Boolean);
      if (zero.length) {
        note.classList.add('is-bad');
        note.append(h('b', '分子是 0：'), '语料里没出现过 “students opened their ' + zero.join('” 或 “students opened their ') + '”，模型就认定它的概率是 0，哪怕它完全说得通。课件给的补救是', h('b', '平滑'), '：给词表里每个词的计数都加上一个很小的 δ。');
      } else {
        note.append('4-gram 模型只看最近 3 个词，更前面的词（包括 proctor）都被扔掉了。有了 proctor（监考老师）这条线索，exams 本该更可能。');
      }
    }
    render();
    return pane;
  }

  function genView() {
    let k = 0;
    const text = h('div.ng-text'), bars = h('div.ng-out'), sim = h('div.ng-sim'), note = h('div.ng-note');
    const nextBtn = button('按课件抽到的词往下走', () => { if (k < STEPS.length) { k += 1; render(); } });
    const simBtn = button('按这个分布随机抽 100 次', () => simulate());
    const resetBtn = button('重来', () => { k = 0; render(); });
    const pane = h('div.ng-pane',
      h('p.viz-note', 'Reuters 财经新闻语料（170 万词）上训练的三元模型：只看前两个词，给出下一个词的概率，抽一个，接上，再重复。柱子是课件列出的前五个词，“其他词”是剩下的概率。'),
      text, bars, h('div.viz-row', nextBtn, simBtn, resetBtn), sim, note);
    function words() { return STEPS[Math.min(k, STEPS.length - 1)]; }
    function render() {
      sim.innerHTML = '';
      note.innerHTML = '';
      bars.innerHTML = '';
      if (k >= STEPS.length) {
        text.innerHTML = '';
        text.append(h('span.ng-done', FULL));
        note.append('这是课件给出的完整生成结果。一句一句读，语法大体通顺；整段读下来，意思前后不连贯。看更多的前文会好些，可 n 一大，稀疏和存储问题就更严重。');
        nextBtn.disabled = simBtn.disabled = true;
        return;
      }
      nextBtn.disabled = simBtn.disabled = false;
      const st = words(), ctxWords = st.ctx.split(' ');
      text.innerHTML = '';
      ctxWords.forEach((w, i) => text.append(h('span.ng-w' + (i >= ctxWords.length - 2 ? '.is-ctx' : ''), w)));
      text.append(h('span.ng-blank', '___'));
      const other = 1 - st.dist.reduce((a, d) => a + d[1], 0);
      st.dist.forEach(([w, p]) => bars.append(bar(w, p, w === st.pick ? 'is-a' : '')));
      bars.append(bar('其他词', other, 'is-c'));
      note.append('三元模型只看最近两个词：“' + ctxWords.slice(-2).join(' ') + '”。课件这一步抽到的是 “' + st.pick + '”。');
    }
    function simulate() {
      const st = words(), pairs = st.dist.concat([['其他词', 1 - st.dist.reduce((a, d) => a + d[1], 0)]]);
      const dist = Object.fromEntries(pairs), tally = new Map(pairs.map(([w]) => [w, 0]));
      for (let i = 0; i < 100; i++) { const w = NG.sample(dist, Math.random()); tally.set(w, tally.get(w) + 1); }
      sim.innerHTML = '';
      sim.append(h('span.viz-note', '100 次里各抽到几次：'), ...[...tally].map(([w, n]) => h('span.ng-chip', w + ' × ' + n)));
      sim.append(h('span.viz-note', '　概率大的词抽到得多，但概率小的词也有机会。'));
    }
    render();
    return pane;
  }

  C.viz.register('ngram', { title: 'n-gram 语言模型', mount });
})(window);
