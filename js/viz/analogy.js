/* 用向量做类比：toy 2-D vectors (课件外). Draw x_b − x_a as an arrow, move it to x_c, and rank words by cosine
 * similarity with x_b − x_a + x_c, optionally excluding the three input words (L02 p39). Ranking from js/core/cooccur.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, segmented } = C.dom;
  const CO = C.core.cooccur;

  const VECS = { man: [1, 1], woman: [1.2, 2.2], king: [3.5, 1.4], queen: [3.6, 2.5], boy: [0.5, 0.8], girl: [0.6, 1.8], apple: [2, -1.2] };
  // the last task brings its own word, prince, so the other tasks keep the chapter's numbers; without excluding the
  // inputs, king itself wins it (cosine 1.000 against prince's 0.999), which is the point of excluding them
  const TASKS = [['man', 'woman', 'king'], ['man', 'woman', 'boy'], ['king', 'queen', 'man'], ['boy', 'girl', 'king'], ['man', 'boy', 'king', { prince: [1.6, 0.7] }]];
  const ALL = Object.assign({}, VECS, { prince: [1.6, 0.7] });
  const W = 460, H = 420, UNIT = 90, OX = 70, OY = 300;
  const X = (v) => OX + v * UNIT, Y = (v) => OY - v * UNIT;

  function mount(el) {
    let task = 0, exclude = true;
    const uid = Math.random().toString(36).slice(2, 7);
    const head = (id, cls) => s('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, s('path', { d: 'M0,1 L9,5 L0,9 z', class: cls }));
    const grid = [];
    for (let i = 0; i <= 4; i++) grid.push(s('line', { x1: X(i), y1: Y(-1.3), x2: X(i), y2: Y(3.2), class: i === 0 ? 'an-axis' : 'an-grid' }));
    for (let i = -1; i <= 3; i++) grid.push(s('line', { x1: X(-0.6), y1: Y(i), x2: X(4.3), y2: Y(i), class: i === 0 ? 'an-axis' : 'an-grid' }));
    const dots = {};
    Object.entries(ALL).forEach(([w, v]) => {
      dots[w] = s('g', { class: 'an-word' }, s('circle', { cx: X(v[0]), cy: Y(v[1]), r: 6 }), s('text', { x: X(v[0]) + 9, y: Y(v[1]) - 8 }, w));
    });
    const ab = s('line', { class: 'an-ab', 'marker-end': 'url(#an-h1-' + uid + ')' });
    const ct = s('line', { class: 'an-ct', 'marker-end': 'url(#an-h2-' + uid + ')' });
    const sub = (t) => s('tspan', { 'baseline-shift': 'sub', 'font-size': '75%' }, t);
    const target = s('g', { class: 'an-target' }, s('circle', { r: 8 }), s('text', {}, 'x', sub('b'), ' − x', sub('a'), ' + x', sub('c')));
    const ray = s('line', { class: 'an-ray', x1: X(0), y1: Y(0) });
    const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viz-svg an-svg', role: 'img', 'aria-label': '二维词向量上的类比' },
      s('defs', head('an-h1-' + uid, 'an-h1'), head('an-h2-' + uid, 'an-h2')), grid, ray, Object.values(dots), ab, ct, target);
    const list = h('ol.an-rank'), question = h('div.an-q');
    const pick = segmented(TASKS.map((t, i) => ({ value: i, label: t[0] + ' : ' + t[1] + ' :: ' + t[2] + ' : ?' })), task, (v) => { task = v; render(); }, '类比题');
    const ex = segmented([{ value: true, label: '排除输入词' }, { value: false, label: '不排除' }], exclude, (v) => { exclude = v; render(); }, '是否排除输入词');
    el.append(h('div.viz-row', pick), h('div.viz-row', ex), h('div.an-layout', svg, h('div', question, h('div.an-rank-head', '和目标的余弦相似度（越接近 1，方向越一致）'), list,
      h('p.viz-note', '淡蓝色的线从原点穿过目标。排名比的是方向，也就是和原点连线的夹角，不是图上的距离：离目标点远的词，只要在这条线附近，分数也高。'))));

    function render() {
      const [a, b, c, extra] = TASKS[task];
      const V = Object.assign({}, VECS, extra || {});
      const r = CO.analogy(V, a, b, c, 'cosine');
      const t = r.target;
      let ranked = r.ranked;
      if (!exclude) {
        const tn = Math.hypot(t[0], t[1]);
        ranked = Object.entries(V).map(([w, x]) => ({ word: w, score: (t[0] * x[0] + t[1] * x[1]) / (tn * Math.hypot(x[0], x[1])) })).sort((p, q) => q.score - p.score);
      }
      ab.setAttribute('x1', X(V[a][0])); ab.setAttribute('y1', Y(V[a][1])); ab.setAttribute('x2', X(V[b][0])); ab.setAttribute('y2', Y(V[b][1]));
      ct.setAttribute('x1', X(V[c][0])); ct.setAttribute('y1', Y(V[c][1]));
      // stretch the ray to the edge of the grid (x from −0.6 to 4.3, y from −1.3 to 3.2)
      const lim = (v, lo, hi) => (v > 0 ? hi / v : v < 0 ? lo / -v : Infinity), far = Math.min(lim(t[0], 0.6, 4.3), lim(t[1], 1.3, 3.2));
      ray.setAttribute('x2', X(t[0] * far)); ray.setAttribute('y2', Y(t[1] * far)); ct.setAttribute('x2', X(t[0])); ct.setAttribute('y2', Y(t[1]));
      target.querySelector('circle').setAttribute('cx', X(t[0])); target.querySelector('circle').setAttribute('cy', Y(t[1]));
      const tl = target.querySelector('text'); tl.setAttribute('x', X(t[0]) - 12); tl.setAttribute('y', Y(t[1]) - 12); tl.setAttribute('text-anchor', 'end');
      Object.entries(dots).forEach(([w, g]) => {
        g.style.display = w in V ? '' : 'none';
        g.classList.toggle('input', [a, b, c].includes(w));
        g.classList.toggle('answer', w === ranked[0].word);
      });
      question.innerHTML = a + ' : ' + b + ' :: ' + c + ' : <b>' + ranked[0].word + '</b><br><span class="viz-note">目标 = [' + t.map((v) => v.toFixed(2)).join(', ') + ']</span>';
      list.innerHTML = '';
      ranked.forEach((p) => list.append(h('li' + ([a, b, c].includes(p.word) ? '.input' : ''), h('span', p.word), h('span.an-score', p.score.toFixed(3)))));
    }
    render();
  }

  C.viz.register('analogy', { title: '用向量做类比', mount });
})(window);
