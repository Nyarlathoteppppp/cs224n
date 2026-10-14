/* 梯度消失与爆炸 (L04 p40–p49; N06 p6–p8): (1) the gradient of the last step's loss travelling back 12 steps,
 * either in the simplified picture (multiply by β at every step, N06's (β_W β_h)^{t−k}) or measured on a small RNN
 * whose W_h is scaled (js/core/rnn.js gradientReach); bars on a log scale. (2) gradient clipping by norm
 * (js/core/optim.js clipByNorm). Parameters of the small RNN are seeded random numbers (课件外). */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider, segmented, fmt, clear } = C.dom;
  const RNN = C.core.rnn, OPT = C.core.optim;

  const T = 12;
  const sci = (v) => {
    if (!isFinite(v)) return '∞';
    if (v >= 0.01 && v < 1000) return fmt(v, v < 1 ? 3 : 1);
    const e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e);
    return fmt(m, 1) + '×10' + String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  };

  function smallRnn(scale) {
    const r = OPT.rng(11), u = () => (r() * 2 - 1);
    const M = (a, b) => Array.from({ length: a }, () => Array.from({ length: b }, u));
    const v = (a) => Array.from({ length: a }, u);
    const p = { E: M(5, 3), Wh: M(4, 4), We: M(4, 3), b1: v(4), U: M(5, 4), b2: v(5), h0: new Array(4).fill(0) };
    p.Wh = p.Wh.map((row) => row.map((x) => x * scale));
    return p;
  }

  function mount(el) {
    let mode = 'beta', beta = 0.5, scale = 1, gLen = 12, thr = 5;
    const W = 760, H = 250, base = 200, x0 = 70, step = 54;
    const legend = h('div.vg-legend', h('span.vg-key'), '普通　', h('span.vg-key.is-tiny'), '小于 0.001：几乎收不到梯度　', h('span.vg-key.is-huge'), '大于 1000：梯度爆炸');
    const svg = s('svg', { class: 'viz-svg vg-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': '梯度往回传时每一步的大小' });
    const note = h('div.vg-note');
    const sb = slider('每一步乘的系数 β', { min: 0.3, max: 1.6, step: 0.05, value: beta, format: (v) => fmt(v, 2), onInput: (v) => { beta = v; render(); } });
    const ss = slider('把 W_h 放大 / 缩小', { min: 0.2, max: 4, step: 0.1, value: scale, format: (v) => '× ' + fmt(v, 1), onInput: (v) => { scale = v; render(); } });
    const ctl = h('div.viz-row');
    const clipSvg = s('svg', { class: 'viz-svg vg-clip', viewBox: '0 0 240 250', role: 'img', 'aria-label': '梯度裁剪' });
    const clipNote = h('div.vg-note');
    const sg = slider('梯度的长度 ‖g‖', { min: 0.5, max: 20, step: 0.5, value: gLen, format: (v) => fmt(v, 1), onInput: (v) => { gLen = v; renderClip(); } });
    const st = slider('阈值', { min: 1, max: 20, step: 1, value: thr, format: String, onInput: (v) => { thr = v; renderClip(); } });
    el.append(
      h('div.viz-row', segmented([{ value: 'beta', label: '简化：每一步乘 β' }, { value: 'rnn', label: '真实的小 RNN' }], mode, (v) => { mode = v; render(); }, '模式'), ctl),
      svg, legend, note,
      h('h4.vg-h', '梯度裁剪'),
      h('div.vg-clipwrap', clipSvg, h('div', h('div.viz-row', sg, st), clipNote)));

    function values() {
      if (mode === 'beta') return Array.from({ length: T }, (_, k) => Math.pow(beta, T - 1 - k));
      const ids = Array.from({ length: T + 1 }, (_, i) => i % 5);
      const norms = RNN.gradientReach(smallRnn(scale), ids);
      const last = norms[norms.length - 1];
      return norms.map((n) => n / last);
    }
    function y(v) {   // log scale: 10⁻⁶ … 10⁴
      const l = Math.max(-6, Math.min(4, Math.log10(Math.max(v, 1e-12))));
      return base - (l + 6) / 10 * (base - 20);
    }
    function render() {
      clear(ctl);
      ctl.append(mode === 'beta' ? sb : ss);
      const vals = values();
      clear(svg);
      [-6, -4, -2, 0, 2, 4].forEach((e) => {
        svg.append(s('line', { x1: x0 - 10, y1: y(Math.pow(10, e)), x2: W - 20, y2: y(Math.pow(10, e)), class: 'vg-grid' + (e === 0 ? ' is-one' : '') }));
        svg.append(s('text', { x: x0 - 14, y: y(Math.pow(10, e)) + 4, class: 'vg-tick', text: e === 0 ? '1' : '10' + String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]) }));
      });
      vals.forEach((v, k) => {
        const x = x0 + 10 + k * step, top = y(v), bottom = y(1e-6);
        const cls = v < 1e-3 ? 'is-tiny' : v > 1e3 ? 'is-huge' : '';
        svg.append(s('rect', { x, y: Math.min(top, bottom), width: step - 16, height: Math.abs(bottom - top), class: 'vg-bar ' + cls }));
        svg.append(s('text', { x: x + (step - 16) / 2, y: base + 18, class: 'vg-step', text: 'h(' + (k + 1) + ')' }));
        svg.append(s('text', { x: x + (step - 16) / 2, y: Math.max(14, top - 6), class: 'vg-val', text: sci(v) }));
      });
      svg.append(s('text', { x: W - 20, y: base + 36, class: 'vg-axis', text: '← 梯度从最后一步的损失往回传' }));
      svg.append(s('text', { x: 6, y: 13, class: 'vg-axis', style: 'text-anchor:start', text: '梯度大小（最后一步 = 1；纵轴是对数刻度，每一格差 100 倍）' }));
      clear(note);
      const first = vals[0];
      if (mode === 'beta') {
        note.append('从 h(' + T + ') 传回 h(1)，乘了 ' + (T - 1) + ' 次 β：β¹¹ = ' + sci(first) + '。');
        note.append(beta < 1 ? '每一步都小于 1，越往前越小：远处的词几乎收不到来自这个损失的梯度（梯度消失）。' : beta > 1 ? '每一步都大于 1，越往前越大（梯度爆炸）。' : '恰好是 1 时不增不减，但真实网络里很难一直这样。');
      } else {
        note.append('这是一个 4 维隐状态、sigmoid 激活的小 RNN 实际算出来的 ‖∂J/∂h(k)‖（以最后一步为 1，参数是随机设的，课件外）。传回 h(1) 时是最后一步的 ' + sci(first) + ' 倍。');
        note.append('sigmoid 的斜率最大才 0.25（第 2.2 章），每往回一步都要乘上它，所以很容易消失。把 W_h 放大也没用：sigmoid 里面的数跟着变大，sigmoid 进入两端平坦的区域，斜率更接近 0，抵消了 W_h 的放大。所以用 sigmoid 的 RNN 几乎总是梯度消失；想看梯度爆炸，切回“简化：每一步乘 β”，把 β 拖到 1 以上。');
      }
    }

    function renderClip() {
      // the chapter's example direction ĝ = [3, 4] / 5; the picture scales so the longer of g and the threshold fills it
      const dir = [0.6, 0.8], R = 210 / Math.max(gLen, thr), cx = 15, cy = 235;
      const g = dir.map((d) => d * gLen), r = OPT.clipByNorm(g, thr);
      clear(clipSvg);
      clipSvg.append(s('defs',
        s('marker', { id: 'vg-a1', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, s('path', { d: 'M0,0 L10,5 L0,10 z', class: 'vg-head-raw' })),
        s('marker', { id: 'vg-a2', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, s('path', { d: 'M0,0 L10,5 L0,10 z', class: 'vg-head-clip' }))));
      clipSvg.append(s('path', { d: 'M' + (cx + thr * R) + ',' + cy + ' A' + thr * R + ',' + thr * R + ' 0 0 0 ' + cx + ',' + (cy - thr * R), class: 'vg-circle' }));
      clipSvg.append(s('text', { x: cx + 6, y: Math.max(12, cy - thr * R - 6), class: 'vg-tick', style: 'text-anchor:start', text: '阈值 ' + thr }));
      const end = (v) => [cx + v[0] * R, cy - Math.abs(v[1]) * R];
      const [ex, ey] = end(g), [kx, ky] = end(r.grad);
      clipSvg.append(s('line', { x1: cx, y1: cy, x2: ex, y2: ey, class: 'vg-raw', 'marker-end': 'url(#vg-a1)' }));
      if (r.clipped) clipSvg.append(s('line', { x1: cx, y1: cy, x2: kx, y2: ky, class: 'vg-clipped', 'marker-end': 'url(#vg-a2)' }));
      clipSvg.append(s('circle', { cx, cy, r: 3, class: 'vg-origin' }));
      clear(clipNote);
      clipNote.append(r.clipped
        ? h('span', 'g = [' + fmt(g[0], 2) + ', ' + fmt(g[1], 2) + ']，‖g‖ = ' + fmt(r.norm, 1) + ' ≥ 阈值 ' + thr + '：把它乘上 ' + thr + ' / ' + fmt(r.norm, 1) + ' = ' + fmt(thr / r.norm, 3) + '，方向不变，长度缩成 ' + thr + '（绿色）：[' + fmt(r.grad[0], 2) + ', ' + fmt(r.grad[1], 2) + ']。这一步照样往同一个方向走，只是步子小多了。')
        : h('span', '‖g‖ = ' + fmt(r.norm, 1) + ' 小于阈值 ' + thr + '：不用动它。'));
    }
    render(); renderClip();
  }

  C.viz.register('vanishing', { title: '梯度消失与爆炸', mount });
})(window);
