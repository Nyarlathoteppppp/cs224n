/* 用向量做类比：toy 2-D vectors (课件外). Draw x_b − x_a as an arrow, move it to x_c, and rank words by cosine
 * similarity with x_b − x_a + x_c, optionally excluding the three input words (L02 p39). Ranking from js/core/cooccur.js. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, segmented } = C.dom;
  const CO = C.core.cooccur;

  const VECS = { man: [1, 1], woman: [1.2, 2.2], king: [3.5, 1.4], queen: [3.6, 2.5], boy: [0.5, 0.8], girl: [0.6, 1.8], apple: [2, -1.2] };
  const TASKS = [['man', 'woman', 'king'], ['man', 'woman', 'boy'], ['king', 'queen', 'man'], ['boy', 'girl', 'king']];
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
    Object.entries(VECS).forEach(([w, v]) => {
      dots[w] = s('g', { class: 'an-word' }, s('circle', { cx: X(v[0]), cy: Y(v[1]), r: 6 }), s('text', { x: X(v[0]) + 9, y: Y(v[1]) - 8 }, w));
    });
    const ab = s('line', { class: 'an-ab', 'marker-end': 'url(#an-h1-' + uid + ')' });
    const ct = s('line', { class: 'an-ct', 'marker-end': 'url(#an-h2-' + uid + ')' });
    const target = s('g', { class: 'an-target' }, s('circle', { r: 8 }), s('text', {}, 'x_b − x_a + x_c'));
    const svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viz-svg an-svg', role: 'img', 'aria-label': '二维词向量上的类比' },
      s('defs', head('an-h1-' + uid, 'an-h1'), head('an-h2-' + uid, 'an-h2')), grid, Object.values(dots), ab, ct, target);
    const list = h('ol.an-rank'), question = h('div.an-q');
    const pick = segmented(TASKS.map((t, i) => ({ value: i, label: t[0] + ' : ' + t[1] + ' :: ' + t[2] + ' : ?' })), task, (v) => { task = v; render(); }, '类比题');
    const ex = segmented([{ value: true, label: '排除输入词' }, { value: false, label: '不排除' }], exclude, (v) => { exclude = v; render(); }, '是否排除输入词');
    el.append(h('div.viz-row', pick), h('div.viz-row', ex), h('div.an-layout', svg, h('div', question, list)));

    function render() {
      const [a, b, c] = TASKS[task];
      const r = CO.analogy(VECS, a, b, c, 'cosine');
      const t = r.target;
      let ranked = r.ranked;
      if (!exclude) {
        const tn = Math.hypot(t[0], t[1]);
        ranked = Object.entries(VECS).map(([w, x]) => ({ word: w, score: (t[0] * x[0] + t[1] * x[1]) / (tn * Math.hypot(x[0], x[1])) })).sort((p, q) => q.score - p.score);
      }
      ab.setAttribute('x1', X(VECS[a][0])); ab.setAttribute('y1', Y(VECS[a][1])); ab.setAttribute('x2', X(VECS[b][0])); ab.setAttribute('y2', Y(VECS[b][1]));
      ct.setAttribute('x1', X(VECS[c][0])); ct.setAttribute('y1', Y(VECS[c][1])); ct.setAttribute('x2', X(t[0])); ct.setAttribute('y2', Y(t[1]));
      target.querySelector('circle').setAttribute('cx', X(t[0])); target.querySelector('circle').setAttribute('cy', Y(t[1]));
      const tl = target.querySelector('text'); tl.setAttribute('x', X(t[0]) - 12); tl.setAttribute('y', Y(t[1]) - 12); tl.setAttribute('text-anchor', 'end');
      Object.entries(dots).forEach(([w, g]) => {
        g.classList.toggle('input', [a, b, c].includes(w));
        g.classList.toggle('answer', w === ranked[0].word);
      });
      question.innerHTML = a + ' : ' + b + ' :: ' + c + ' : <b>' + ranked[0].word + '</b>　目标 = [' + t.map((v) => v.toFixed(2)).join(', ') + ']';
      list.innerHTML = '';
      ranked.forEach((p) => list.append(h('li' + ([a, b, c].includes(p.word) ? '.input' : ''), h('span', p.word), h('span.an-score', p.score.toFixed(3)))));
    }
    render();
  }

  C.viz.register('analogy', { title: '用向量做类比', mount });
})(window);
