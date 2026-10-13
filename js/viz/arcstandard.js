/* 转移式依存分析（arc-standard）：the reader drives SHIFT / LEFT-ARC / RIGHT-ARC by hand.
 * Transitions and preconditions follow N08 p2–p3 (LEFT-ARC may not take ROOT as the dependent); the “提示” button and
 * the dead-end check use the static oracle in js/core/depparse.js (课件外). Sentences: “I ate fish” (TW04 lecture
 * trace) and N08 Figure 3's “He has good control .” (tree completed by us, 课件外). */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, segmented, button, clear } = C.dom;
  const DP = C.core.depparse;

  const SENTENCES = {
    fish: { words: ['I', 'ate', 'fish'], heads: [null, 2, 0, 2], labels: [null, 'nsubj', 'root', 'obj'] },
    control: { words: ['He', 'has', 'good', 'control', '.'], heads: [null, 2, 0, 4, 2, 2], labels: [null, 'nsubj', 'root', 'amod', 'dobj', 'punct'] },
  };
  const NAMES = { S: 'SHIFT', LA: 'LEFT-ARC', RA: 'RIGHT-ARC' };

  function mount(el, props) {
    let key = (props && props.sentence) || 'fish', S, state, history, showGold = false, timer = null, note = null;

    const W = 760, BASE = 168;
    const svg = s('svg', { class: 'viz-svg as-svg', viewBox: '0 0 ' + W + ' 222', role: 'img', 'aria-label': '句子和已经建好的依存弧' });
    const config = h('div.as-config');
    const btn = {
      S: button('SHIFT', () => act('S'), 'as-act'),
      LA: button('LEFT-ARC', () => act('LA'), 'as-act'),
      RA: button('RIGHT-ARC', () => act('RA'), 'as-act'),
    };
    btn.S.title = '把缓冲区的第一个词移到栈顶';
    btn.LA.title = '栈里第二个词挂到栈顶的词上，第二个词出栈';
    btn.RA.title = '栈顶的词挂到栈里第二个词上，栈顶出栈';
    const hintBtn = button('提示', () => { note = { kind: 'hint' }; render(); });
    const stepBtn = button('按提示走一步', () => { const t = next(); if (t) act(t); });
    const playBtn = button('自动走完', play);
    const undoBtn = button('撤销', undo);
    const resetBtn = button('重来', () => load(key));
    const goldToggle = h('label.as-check', h('input', { type: 'checkbox', onchange: (e) => { showGold = e.target.checked; render(); } }), ' 显示正确的树（虚线）');
    const caption = h('div.as-caption');
    const log = h('table.as-log');

    el.append(
      h('div.viz-row', segmented([{ value: 'fish', label: 'I ate fish' }, { value: 'control', label: 'He has good control .' }], key, (v) => load(v), '例句'), goldToggle),
      svg, config,
      h('div.viz-row.as-actions', btn.S, btn.LA, btn.RA, h('span.as-sep'), hintBtn, stepBtn, playBtn, undoBtn, resetBtn),
      caption,
      h('details.as-log-wrap', { open: true }, h('summary', '每一步的记录（和作业 2 里的转移表格式相同）'), log),
    );

    const name = (i) => (i === 0 ? 'ROOT' : S.words[i - 1]);
    const finished = () => !state.buffer.length && state.stack.length === 1;
    const legal = () => ({
      S: state.buffer.length > 0,
      LA: state.stack.length >= 2 && state.stack[state.stack.length - 2] !== 0,
      RA: state.stack.length >= 2,
    });
    const next = (st) => { st = st || state; return DP.oracleNext(st.stack, st.buffer, st.arcs, S.heads); };
    function alive(st) {   // can the gold tree still be built from here? (simulate the oracle)
      const sim = { stack: st.stack.slice(), buffer: st.buffer.slice(), arcs: st.arcs.slice() };
      while (sim.buffer.length || sim.stack.length > 1) {
        const t = next(sim);
        if (!t) return false;
        apply(sim, t);
      }
      return sim.arcs.length === S.words.length;
    }
    function apply(st, t) {
      if (t === 'S') { st.stack.push(st.buffer.shift()); return null; }
      const top = st.stack.pop(), second = st.stack.pop();
      const arc = t === 'LA' ? [top, second] : [second, top];
      st.stack.push(t === 'LA' ? top : second);
      st.arcs.push(arc);
      return arc;
    }

    function load(k) {
      stop();
      key = k; S = SENTENCES[k];
      state = { stack: [0], buffer: S.words.map((_, i) => i + 1), arcs: [] };
      history = []; note = null;
      render();
    }
    function act(t) {
      if (!legal()[t] || finished()) return;
      const before = { stack: state.stack.slice(), buffer: state.buffer.slice(), arcs: state.arcs.slice() };
      const wasAlive = alive(before), advice = wasAlive ? next(before) : null;
      const moved = t === 'S' ? state.buffer[0] : null;
      const arc = apply(state, t);
      const nowAlive = alive(state);
      history.push({ before, t, arc, moved });
      note = { kind: 'step', t, arc, moved, wasAlive, nowAlive, advice, before };
      render();
    }
    function undo() {
      stop();
      const last = history.pop();
      if (!last) return;
      state = last.before; note = { kind: 'undo' };
      render();
    }
    function play() {
      if (timer) { stop(); render(); return; }
      if (!alive(state)) { note = { kind: 'dead' }; render(); return; }
      timer = setInterval(() => {
        const t = next();
        if (t && !finished()) act(t);
        if (!t || finished()) { stop(); render(); }
      }, 750);
      render();
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    /* ---------- drawing ---------- */
    function xs() {
      const n = S.words.length, left = 60, right = W - 60;
      return Array.from({ length: n + 1 }, (_, i) => left + (right - left) * i / n);
    }
    function arcPath(x, hd, d) {
      const span = Math.abs(hd - d), H = Math.min(26 + 30 * span, 150);
      const off = 12 * Math.sign(d - hd);
      const x1 = x[hd] + off, x2 = x[d], y = BASE - 22;
      return { d: 'M' + x1 + ',' + y + ' C' + x1 + ',' + (y - H * 1.33) + ' ' + x2 + ',' + (y - H * 1.33) + ' ' + x2 + ',' + (y - 4), top: y - H, mid: (x1 + x2) / 2 };
    }
    function drawSvg() {
      clear(svg);
      const x = xs();
      svg.append(s('defs',
        s('marker', { id: 'as-head', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, s('path', { d: 'M0,0 L10,5 L0,10 z', class: 'as-arrow' })),
        s('marker', { id: 'as-head-new', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, s('path', { d: 'M0,0 L10,5 L0,10 z', class: 'as-arrow-new' })),
        s('marker', { id: 'as-head-gold', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, s('path', { d: 'M0,0 L10,5 L0,10 z', class: 'as-arrow-gold' }))));
      if (showGold) {
        S.heads.forEach((hd, d) => {
          if (d === 0) return;
          const p = arcPath(x, hd, d);
          svg.append(s('path', { d: p.d, class: 'as-gold', 'marker-end': 'url(#as-head-gold)' }));
        });
      }
      const lastArc = history.length && history[history.length - 1].arc;
      state.arcs.forEach(([hd, d]) => {
        const p = arcPath(x, hd, d), isNew = lastArc && lastArc[0] === hd && lastArc[1] === d, wrong = S.heads[d] !== hd;
        svg.append(s('path', { d: p.d, class: 'as-arc' + (isNew ? ' is-new' : '') + (wrong ? ' is-wrong' : ''), 'marker-end': 'url(#' + (isNew ? 'as-head-new' : 'as-head') + ')' }));
        svg.append(s('text', { x: p.mid, y: p.top + 6, class: 'as-label' + (wrong ? ' is-wrong' : ''), text: wrong ? '✗' : S.labels[d] }));
      });
      const inStack = new Set(state.stack), inBuffer = new Set(state.buffer);
      const top = state.stack[state.stack.length - 1], second = state.stack.length >= 2 ? state.stack[state.stack.length - 2] : -1;
      x.forEach((xi, i) => {
        const where = inStack.has(i) ? 'stack' : inBuffer.has(i) ? 'buffer' : 'done';
        const g = s('g', { class: 'as-word is-' + where + (i === top ? ' is-top' : '') + (i === second ? ' is-second' : '') });
        g.append(s('rect', { x: xi - 42, y: BASE - 18, width: 84, height: 32, rx: 7, class: 'as-box' }));
        g.append(s('text', { x: xi, y: BASE - 1, class: 'as-wtext', text: name(i) }));
        const tag = i === top ? '栈顶' : i === second ? '栈里第二个' : where === 'stack' ? '栈' : where === 'buffer' ? (i === state.buffer[0] ? '缓冲区第一个' : '缓冲区') : '已出栈';
        g.append(s('text', { x: xi, y: BASE + 34, class: 'as-tag', text: tag }));
        svg.append(g);
      });
    }

    function drawConfig() {
      clear(config);
      const box = (i, cls) => h('span.as-cell' + (cls ? '.' + cls : ''), name(i));
      const st = state.stack.map((i, k) => box(i, k === state.stack.length - 1 ? 'is-top' : k === state.stack.length - 2 ? 'is-second' : ''));
      const bf = state.buffer.map((i, k) => box(i, k === 0 ? 'is-first' : ''));
      config.append(
        h('div.as-row', h('span.as-name', '栈 σ'), h('span.as-cells', st.length ? st : h('span.as-empty', '空')), h('span.as-end', '← 栈顶在右边')),
        h('div.as-row', h('span.as-name', '缓冲区 β'), h('span.as-cells', bf.length ? bf : h('span.as-empty', '空')), h('span.as-end', bf.length ? '← 从左边取' : '')),
        h('div.as-row', h('span.as-name', '已建的弧 A'), h('span.as-cells', state.arcs.length
          ? state.arcs.map(([hd, d]) => h('span.as-arcitem' + (S.heads[d] !== hd ? '.is-wrong' : ''), name(hd) + ' → ' + name(d)))
          : h('span.as-empty', '空'))),
      );
    }

    function describe(t, arc, moved) {
      if (t === 'S') return 'SHIFT：把缓冲区的第一个词 “' + name(moved) + '” 移到栈顶。';
      const [hd, d] = arc;
      return NAMES[t] + '：' + (t === 'LA' ? '栈里第二个词 “' + name(d) + '” 挂到栈顶 “' + name(hd) + '” 上' : '栈顶 “' + name(d) + '” 挂到栈里第二个词 “' + name(hd) + '” 上')
        + '，新弧 ' + name(hd) + ' → ' + name(d) + '；“' + name(d) + '” 出栈。';
    }
    function adviceText(st, t) {
      const top = st.stack[st.stack.length - 1], second = st.stack[st.stack.length - 2];
      if (t === 'S') return 'SHIFT（栈顶两个词之间现在还不该连弧）';
      if (t === 'LA') return 'LEFT-ARC（“' + name(second) + '” 的中心语就是栈顶的 “' + name(top) + '”）';
      return 'RIGHT-ARC（“' + name(top) + '” 的中心语是 “' + name(second) + '”，而且它自己的依存词都已经挂好了）';
    }
    function why(n) {
      if (n.arc && S.heads[n.arc[1]] !== n.arc[0]) {
        const d = n.arc[1];
        return '“' + name(d) + '” 的中心语应该是 “' + name(S.heads[d]) + '”，这条弧连错了。';
      }
      if (n.arc) {
        const d = n.arc[1], missing = S.heads.map((hd, w) => (hd === d && !state.arcs.some(([a, b]) => a === d && b === w) ? name(w) : null)).filter(Boolean);
        if (missing.length) return '“' + name(d) + '” 出栈时，它的依存词 “' + missing.join('”“') + '” 还没挂上；出栈后再也挂不上了。';
      }
      return '上一步应该是 ' + adviceText(n.before, n.advice) + '。';
    }
    function drawCaption() {
      clear(caption);
      const L = legal();
      let title, body, cls = '';
      if (finished()) {
        const right = state.arcs.filter(([hd, d]) => S.heads[d] === hd).length;
        title = '分析完成';
        body = '缓冲区空了，栈里只剩 ROOT。一共走了 ' + history.length + ' 步，建了 ' + state.arcs.length + ' 条弧，其中 ' + right + ' 条和正确的树一致。'
          + (right === S.words.length ? '每个词都恰好挂到了一个中心语上。' : '点“撤销”回到出错的地方再试。');
        cls = right === S.words.length ? 'is-good' : 'is-bad';
      } else if (note && note.kind === 'hint') {
        const t = next();
        title = '提示';
        body = alive(state) && t ? '下一步：' + adviceText(state, t) + '。' : '从这里已经建不出正确的树了，先撤销。';
      } else if (note && note.kind === 'undo' && history.length) {
        title = '撤销了一步';
        body = alive(state) ? '从这里还能建出正确的树，继续吧。' : '从这里仍然建不出正确的树，再撤销一步。';
        cls = alive(state) ? '' : 'is-bad';
      } else if (note && note.kind === 'dead') {
        title = '走不下去了'; body = '从这里已经建不出正确的树了，先撤销。'; cls = 'is-bad';
      } else if (note && note.kind === 'step') {
        title = describe(note.t, note.arc, note.moved);
        if (note.wasAlive && !note.nowAlive) { body = '这一步合法，但之后已经建不出正确的树了。' + why(note); cls = 'is-bad'; }
        else if (note.wasAlive && note.t !== note.advice) body = '和提示的顺序不同，但仍然能建出正确的树。';
        else if (!note.wasAlive) { body = '之前已经走错了，先撤销到出错的地方。'; cls = 'is-bad'; }
        else body = '正确。';
      } else {
        title = '开始状态';
        body = '栈里只有 ROOT，句子里的词都在缓冲区，还没有弧。现在栈里只有一个元素，只能 SHIFT。';
      }
      caption.className = 'as-caption ' + cls;
      caption.append(h('div.as-cap-title', title), h('div.as-cap-text', body));
      ['S', 'LA', 'RA'].forEach((t) => { btn[t].disabled = !L[t] || finished() || !!timer; });
      stepBtn.disabled = hintBtn.disabled = finished() || !!timer;
      playBtn.textContent = timer ? '停止' : '自动走完';
      playBtn.disabled = finished() && !timer;
      undoBtn.disabled = !history.length || !!timer;
    }

    function drawLog() {
      clear(log);
      log.append(h('thead', h('tr', h('th', '步'), h('th', '栈'), h('th', '缓冲区'), h('th', '新的弧'), h('th', '动作'))));
      const fmtList = (list) => '[' + list.map(name).join(', ') + ']';
      const rows = [h('tr', h('td', '0'), h('td', fmtList(history.length ? history[0].before.stack : state.stack)), h('td', fmtList(history.length ? history[0].before.buffer : state.buffer)), h('td', ''), h('td', '初始状态'))];
      history.forEach((st, k) => {
        const after = k + 1 < history.length ? history[k + 1].before : state;
        rows.push(h('tr' + (st.arc && S.heads[st.arc[1]] !== st.arc[0] ? '.is-wrong' : ''), h('td', String(k + 1)), h('td', fmtList(after.stack)), h('td', fmtList(after.buffer)),
          h('td', st.arc ? name(st.arc[0]) + ' → ' + name(st.arc[1]) : ''), h('td', NAMES[st.t])));
      });
      log.append(h('tbody', rows));
    }

    function render() { drawSvg(); drawConfig(); drawCaption(); drawLog(); }
    load(key);
  }

  C.viz.register('arc-standard', { title: '转移式依存分析', mount });
})(window);
