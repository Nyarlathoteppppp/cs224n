/* 计算图上的反向传播：f = (x+y)·max(y,z)，CS224N 第 3 讲的原例 (L03 p69–p71)。
 * Steps through the forward pass node by node, then the backward pass gate by gate, then the sum at the branch.
 * Every number comes from js/core/autodiff.js; the step order is its reverse topological order (×, max, +). */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider, button, texHTML } = C.dom;
  const AD = C.core.autodiff;

  /* ---------- numbers ---------- */
  const round = (v) => Math.round(v * 100) / 100 || 0;
  const numS = (v) => String(round(v)).replace('-', '−');
  const numT = (v, paren) => { const r = round(v); return paren && r < 0 ? '(' + r + ')' : String(r); };
  const up = (t) => '\\htmlClass{cg-up}{' + t + '}';
  const loc = (t) => '\\htmlClass{cg-loc}{' + t + '}';
  const down = (t) => '\\htmlClass{cg-down}{' + t + '}';

  function compute(v) {
    const x = AD.input(v.x, 'x'), y = AD.input(v.y, 'y'), z = AD.input(v.z, 'z');
    const a = AD.add(x, y, 'a'), b = AD.max(y, z, 'b'), f = AD.mul(a, b, 'f');
    const g = {};
    AD.backward(f).edges.forEach((e) => { g[e.from + '>' + e.to] = e.contribution; });
    return { x: v.x, y: v.y, z: v.z, a: a.value, b: b.value, f: f.value, gx: x.grad, gy: y.grad, gz: z.grad,
      ga: g['f>a'], gb: g['f>b'], gyMax: g['b>y'], gzMax: g['b>z'], gyPlus: g['a>y'], yWins: b.local[0] === 1, tie: v.y === v.z };
  }

  /* ---------- layout (viewBox 760 × 300) ---------- */
  const N = {
    x: { x: 80, y: 62, r: 20, label: 'x', input: true },
    y: { x: 80, y: 160, r: 20, label: 'y', input: true },
    z: { x: 80, y: 258, r: 20, label: 'z', input: true },
    br: { x: 178, y: 160, r: 0, junction: true },
    a: { x: 340, y: 100, r: 25, label: '+' },
    b: { x: 340, y: 220, r: 25, label: 'max' },
    f: { x: 560, y: 160, r: 25, label: '×' },
    out: { x: 690, y: 160, r: 20, label: 'f', input: true },
  };
  /* [id, from, to, label position along the edge, forward value, gradient] */
  const EDGES = [
    ['x-a', 'x', 'a', 0.5, (d) => d.x, (d) => d.gx],
    ['y-br', 'y', 'br', 0.5, (d) => d.y, (d) => d.gy],
    ['br-a', 'br', 'a', 0.62, null, (d) => d.gyPlus],
    ['br-b', 'br', 'b', 0.62, null, (d) => d.gyMax],
    ['z-b', 'z', 'b', 0.5, (d) => d.z, (d) => d.gz],
    ['a-f', 'a', 'f', 0.4, (d) => d.a, (d) => d.ga],
    ['b-f', 'b', 'f', 0.65, (d) => d.b, (d) => d.gb],
    ['f-out', 'f', 'out', 0.5, (d) => d.f, () => 1],
  ];
  function geometry(A, B, t) {
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const sa = A.junction ? 0 : A.r + 3, sb = B.junction ? 0 : B.r + 5;
    const p = { x: A.x + ux * sa, y: A.y + uy * sa }, q = { x: B.x - ux * sb, y: B.y - uy * sb };
    const m = { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
    return { p, q, m, ux, uy, nx: -uy, ny: ux };
  }

  /* ---------- steps: which labels are visible, what is new, what the caption says ---------- */
  const STEPS = [
    { key: 'start', stage: 0, vals: ['x-a', 'y-br', 'z-b'] },
    { key: 'fa', stage: 1, vals: ['a-f'], active: 'a', live: ['x-a', 'br-a'] },
    { key: 'fb', stage: 1, vals: ['b-f'], active: 'b', live: ['br-b', 'z-b'] },
    { key: 'ff', stage: 1, vals: ['f-out'], active: 'f', live: ['a-f', 'b-f'] },
    { key: 'bout', stage: 2, grads: ['f-out'], active: 'out' },
    { key: 'bmul', stage: 2, grads: ['a-f', 'b-f'], active: 'f', badge: 'f' },
    { key: 'bmax', stage: 2, grads: ['br-b', 'z-b'], active: 'b', badge: 'b' },
    { key: 'bplus', stage: 2, grads: ['x-a', 'br-a'], active: 'a', badge: 'a' },
    { key: 'sum', stage: 3, grads: ['y-br'], active: 'br' },
  ];
  const STAGES = ['准备', '前向', '反向', '分叉相加'];
  const BADGES = { a: { text: '分发', dx: 0, dy: -40 }, b: { text: '路由', dx: 0, dy: 44 }, f: { text: '互换', dx: 0, dy: -40 } };

  function caption(key, d) {
    const T = numT;
    const winner = d.yWins ? 'y' : 'z';
    const tie = d.tie ? '（$y$ 和 $z$ 一样大，这里约定梯度给 $y$；这是实现上的约定，课件外。）' : '';
    switch (key) {
      case 'start': return ['准备', 'x = ' + T(d.x) + ',\\quad y = ' + T(d.y) + ',\\quad z = ' + T(d.z),
        '三个输入已经给定。先从左往右做前向：一个节点的输入都有值了，才能算它。'];
      case 'fa': return ['前向 ①　加法节点', 'a = x + y = ' + T(d.x) + ' + ' + T(d.y, 1) + ' = ' + T(d.a),
        '把结果 $a$ 存下来，反向时乘法门要用到它。'];
      case 'fb': return ['前向 ②　max 节点', 'b = \\max(y, z) = \\max(' + T(d.y) + ', ' + T(d.z) + ') = ' + T(d.b),
        '较大的是 $' + winner + '$。max 节点要记住是谁胜出，反向时要用。' + tie];
      case 'ff': return ['前向 ③　乘法节点', 'f = a \\cdot b = ' + T(d.a, 1) + ' \\times ' + T(d.b, 1) + ' = ' + T(d.f),
        '前向结束，每个节点的值都存了下来。现在从右往左做反向。'];
      case 'bout': return ['反向起点', '\\frac{\\partial f}{\\partial f} = ' + down('1'),
        '输出对它自己的梯度是 $1$：$f$ 动一点，$f$ 自己当然也动一点。'];
      case 'bmul': return ['反向 ①　乘法门：互换',
        '\\frac{\\partial f}{\\partial a} = ' + up('1') + ' \\times ' + loc('b') + ' = ' + up('1') + ' \\times ' + loc(T(d.b, 1)) + ' = ' + down(T(d.ga)) +
        '\\qquad \\frac{\\partial f}{\\partial b} = ' + up('1') + ' \\times ' + loc('a') + ' = ' + up('1') + ' \\times ' + loc(T(d.a, 1)) + ' = ' + down(T(d.gb)),
        '乘法门对 $a$ 的局部梯度是另一个输入 $b$ 的值，对 $b$ 的局部梯度是 $a$ 的值：每个输入拿到“上游 × 另一个输入”。'];
      case 'bmax': return ['反向 ②　max 门：路由',
        '\\frac{\\partial f}{\\partial y}\\Big|_{\\text{经 max}} = ' + up(T(d.gb)) + ' \\times ' + loc(d.yWins ? '1' : '0') + ' = ' + down(T(d.gyMax)) +
        '\\qquad \\frac{\\partial f}{\\partial z} = ' + up(T(d.gb)) + ' \\times ' + loc(d.yWins ? '0' : '1') + ' = ' + down(T(d.gzMax)),
        '前向时 $' + winner + '$ 胜出，所以上游梯度全部交给 $' + winner + '$，另一个输入拿到 $0$。' + tie];
      case 'bplus': return ['反向 ③　加法门：分发',
        '\\frac{\\partial f}{\\partial x} = ' + up(T(d.ga)) + ' \\times ' + loc('1') + ' = ' + down(T(d.gx)) +
        '\\qquad \\frac{\\partial f}{\\partial y}\\Big|_{\\text{经 +}} = ' + up(T(d.ga)) + ' \\times ' + loc('1') + ' = ' + down(T(d.gyPlus)),
        '加法门对两个输入的局部梯度都是 $1$，上游梯度原样复制给每个输入。'];
      default: return ['分叉处相加',
        '\\frac{\\partial f}{\\partial y} = \\underbrace{' + T(d.gyPlus) + '}_{\\text{经 +}} + \\underbrace{' + T(d.gyMax, 1) + '}_{\\text{经 max}} = ' + down(T(d.gy)),
        '$y$ 同时流向加法门和 max 门，两条路的梯度在分叉点相加。三个梯度全部算完：$\\partial f/\\partial x = ' + T(d.gx) +
        '$，$\\partial f/\\partial y = ' + T(d.gy) + '$，$\\partial f/\\partial z = ' + T(d.gz) + '$。'];
    }
  }

  let count = 0;
  function mount(el) {
    const uid = 'cg' + (++count);
    const vals = { x: 1, y: 2, z: 0 };
    let step = 0, d = compute(vals);

    /* SVG skeleton, built once */
    const marker = (id, cls) => s('marker', { id: uid + '-' + id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
      s('path', { d: 'M0,1 L9,5 L0,9 z', class: cls }));
    const svg = s('svg', { viewBox: '0 0 760 300', class: 'viz-svg cg-svg', role: 'img', 'aria-label': '计算图 f = (x + y) · max(y, z)' },
      s('defs', marker('fwd', 'cg-head'), marker('back', 'cg-head-back'), marker('backnew', 'cg-head-new')));
    const gEdges = s('g'), gLabels = s('g'), gNodes = s('g');
    svg.append(gEdges, gNodes, gLabels);

    const E = {};
    EDGES.forEach(([id, from, to, t]) => {
      const g = geometry(N[from], N[to], t);
      const line = s('line', { x1: g.p.x, y1: g.p.y, x2: g.q.x, y2: g.q.y, class: 'cg-edge', 'marker-end': N[to].junction ? null : 'url(#' + uid + '-fwd)' });
      const o = 8, cut = 0.16;
      const bx1 = g.q.x + g.nx * o - (g.q.x - g.p.x) * cut, by1 = g.q.y + g.ny * o - (g.q.y - g.p.y) * cut;
      const bx2 = g.p.x + g.nx * o + (g.q.x - g.p.x) * cut, by2 = g.p.y + g.ny * o + (g.q.y - g.p.y) * cut;
      const back = s('line', { x1: bx1, y1: by1, x2: bx2, y2: by2, class: 'cg-back' });
      const val = s('text', { x: g.m.x - g.nx * 13, y: g.m.y - g.ny * 13, class: 'cg-val' });
      const grad = s('text', { x: g.m.x + g.nx * 26, y: g.m.y + g.ny * 26, class: 'cg-grad' });
      gEdges.append(line, back);
      gLabels.append(val, grad);
      E[id] = { line, back, val, grad };
    });
    const NODE = {};
    Object.entries(N).forEach(([id, n]) => {
      if (n.junction) { NODE[id] = s('circle', { cx: n.x, cy: n.y, r: 5, class: 'cg-junction' }); gNodes.append(NODE[id]); return; }
      NODE[id] = s('g', { class: 'cg-node' + (n.input ? ' input' : '') },
        s('circle', { cx: n.x, cy: n.y, r: n.r }),
        s('text', { x: n.x, y: n.y, class: n.label === 'max' ? 'small' : null }, n.label));
      gNodes.append(NODE[id]);
    });
    const BADGE = {};
    Object.entries(BADGES).forEach(([id, b]) => {
      BADGE[id] = s('text', { x: N[id].x + b.dx, y: N[id].y + b.dy, class: 'cg-badge' }, b.text);
      gLabels.append(BADGE[id]);
    });

    /* controls and caption */
    const stageBar = h('div.cg-stages', STAGES.map((t) => h('span.cg-stage', t)));
    const dots = STEPS.map((st, i) => h('button.cg-dot', { type: 'button', 'aria-label': '跳到第 ' + i + ' 步', onclick: () => go(i) }));
    const counter = h('span.cg-counter');
    const prev = button('◀ 上一步', () => go(step - 1));
    const next = button('下一步 ▶', () => go(step + 1), 'primary');
    const capTitle = h('div.cg-cap-title'), capTex = h('div.cg-cap-tex'), capText = h('div.cg-cap-text');
    const sliders = ['x', 'y', 'z'].map((k) => slider(k, { min: -3, max: 3, step: 0.5, value: vals[k], format: numS,
      onInput: (v) => { vals[k] = v; d = compute(vals); render(); } }));

    el.append(
      h('div.viz-row', sliders, h('span.viz-note', '拖动可以改输入，梯度会跟着重算')),
      stageBar, svg,
      h('div.cg-legend', h('span.cg-key.val', '前向的值'), h('span.cg-key.grad', '已经算好的梯度'), h('span.cg-key.new', '这一步刚算出的梯度'), h('span.cg-key.rule', '门的规则')),
      h('div.cg-caption', capTitle, capTex, capText),
      h('div.viz-row.cg-nav', prev, next, h('div.cg-dots', dots), counter));

    function go(i) { step = Math.max(0, Math.min(STEPS.length - 1, i)); render(); }

    function render() {
      const cur = STEPS[step];
      const shownVals = new Set(), shownGrads = new Set();
      STEPS.slice(0, step + 1).forEach((st) => { (st.vals || []).forEach((k) => shownVals.add(k)); (st.grads || []).forEach((k) => shownGrads.add(k)); });
      const fresh = new Set([...(cur.vals || []), ...(cur.grads || [])]);
      const loser = d.yWins ? 'z-b' : 'br-b';
      EDGES.forEach(([id, , , , valueOf, gradOf]) => {
        const e = E[id];
        e.val.textContent = valueOf ? numS(valueOf(d)) : '';
        e.grad.textContent = numS(gradOf(d));
        e.val.classList.toggle('on', shownVals.has(id));
        e.val.classList.toggle('is-new', shownVals.has(id) && fresh.has(id) && step > 0);
        const g = shownGrads.has(id), isNew = g && fresh.has(id);
        e.grad.classList.toggle('on', g);
        e.grad.classList.toggle('is-new', isNew);
        e.back.classList.toggle('on', g);
        e.back.classList.toggle('is-new', isNew);
        e.back.setAttribute('marker-end', 'url(#' + uid + (isNew ? '-backnew' : '-back') + ')');
        e.line.classList.toggle('is-live', (cur.live || []).includes(id) || (id === 'y-br' && (cur.live || []).some((k) => k.startsWith('br-'))));
        e.line.classList.toggle('is-zero', step >= 6 && id === loser);
      });
      Object.entries(NODE).forEach(([id, n]) => n.classList.toggle('is-active', cur.active === id));
      if (cur.key === 'sum') NODE.y.classList.add('is-active');
      Object.entries(BADGE).forEach(([id, b]) => b.classList.toggle('on', STEPS.slice(0, step + 1).some((st) => st.badge === id)));

      [...stageBar.children].forEach((c, i) => { c.classList.toggle('is-current', i === cur.stage); c.classList.toggle('is-done', i < cur.stage); });
      dots.forEach((b, i) => { b.classList.toggle('is-current', i === step); b.classList.toggle('is-done', i < step); });
      counter.textContent = step === 0 ? '准备（共 ' + (STEPS.length - 1) + ' 步）' : '第 ' + step + ' / ' + (STEPS.length - 1) + ' 步';
      prev.disabled = step === 0;
      next.disabled = step === STEPS.length - 1;

      const [title, tex, text] = caption(cur.key, d);
      capTitle.textContent = title;
      capTex.innerHTML = texHTML(tex, true);
      capText.innerHTML = C.md.renderInline(text, { terms: false });
    }
    render();
  }

  C.viz.register('compgraph', { title: '计算图上的反向传播', mount });
})(window);
