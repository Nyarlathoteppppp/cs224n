/* LayerNorm (L05 p62; T08 [60:49]–[66:31]; N07 p11–p12): one word vector x goes through three stages, drawn as
 * bars: subtract its own mean, divide by its own standard deviation, multiply by γ and add β. A second word's
 * vector sits next to it to show that the statistics never mix across words. The vectors are made up (课件外);
 * the computation is js/core/attention.js layerNorm. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, slider, segmented, fmt, clear } = C.dom;
  const ATT = C.core.attention, P = C.core.prob;

  const WORDS = { A: { name: '词 A', x: [2, -1, 4, 7] }, B: { name: '词 B', x: [0.1, 0.3, -0.2, 0.2] } };

  function mount(el) {
    let stage = 0, gamma = 1, beta = 0;
    const svg = s('svg', { class: 'viz-svg', viewBox: '0 0 760 250', role: 'img', 'aria-label': '层归一化' });
    const note = h('div.vg-note');
    const sg = slider('γ（每一维相同，课件里可以每一维不同）', { min: 0.5, max: 3, step: 0.1, value: gamma, format: (v) => fmt(v, 1), onInput: (v) => { gamma = v; render(); } });
    const sb = slider('β', { min: -2, max: 2, step: 0.1, value: beta, format: (v) => fmt(v, 1), onInput: (v) => { beta = v; render(); } });
    el.append(h('div.viz-row', segmented([{ value: 0, label: '原始向量' }, { value: 1, label: '① 减去均值' }, { value: 2, label: '② 除以标准差' }, { value: 3, label: '③ 乘 γ 加 β' }], stage, (v) => { stage = v; render(); }, '步骤')), h('div.viz-row', sg, sb), svg, note);

    function values(x) {
      const mu = P.mean(x), sigma = x.reduce((a, v) => a + (v - mu) * (v - mu), 0) / x.length;
      const g = x.map(() => gamma), b = x.map(() => beta);
      const out = ATT.layerNorm(x, g, b, 0).output;
      if (stage === 0) return { v: x, mu, sigma };
      if (stage === 1) return { v: x.map((t) => t - mu), mu, sigma };
      if (stage === 2) return { v: x.map((t) => (t - mu) / Math.sqrt(sigma)), mu, sigma };
      return { v: out, mu, sigma };
    }
    function panel(word, x0) {
      // 12 px per unit around y = 120: the largest value (7) and the most negative one the sliders allow (−6.8) both fit
      const r = values(word.x), scale = 12, base = 120;
      const g = s('g');
      g.append(s('text', { x: x0 + 150, y: 18, class: 'sl-title', style: 'text-anchor:middle', text: word.name + '：x = [' + word.x.join(', ') + ']' }));
      g.append(s('line', { x1: x0, y1: base, x2: x0 + 300, y2: base, class: 'vg-grid is-one' }));
      r.v.forEach((v, i) => {
        const hgt = Math.max(-96, Math.min(96, v * scale));
        g.append(s('rect', { x: x0 + 20 + i * 70, y: hgt >= 0 ? base - hgt : base, width: 46, height: Math.abs(hgt), class: 'ln-bar' + (v < 0 ? ' is-neg' : '') }));
        g.append(s('text', { x: x0 + 43 + i * 70, y: hgt >= 0 ? base - hgt - 6 : base - hgt + 14, class: 'vg-tick mid', style: 'fill:var(--text)', text: fmt(v, 2) }));
        g.append(s('text', { x: x0 + 43 + i * 70, y: 244, class: 'vg-tick mid', style: 'fill:var(--muted)', text: '第 ' + (i + 1) + ' 维' }));
      });
      return { g, r };
    }
    function render() {
      clear(svg);
      const a = panel(WORDS.A, 20), b = panel(WORDS.B, 420);
      svg.append(a.g, b.g, s('line', { x1: 380, y1: 30, x2: 380, y2: 220, class: 'vg-grid' }));
      clear(note);
      const r = a.r, rb = b.r;
      sg.input.disabled = sb.input.disabled = stage !== 3;   // γ and β only act in step ③
      const text = [
        '每个词向量的 d 个数各自上下浮动。层归一化只用这一个向量自己的 d 个数算统计量。',
        '词 A 的均值 μ = (2 − 1 + 4 + 7) / 4 = ' + fmt(r.mu, 2) + '，每一维都减去它，中心移到 0。词 B 用它自己的均值 μ = ' + fmt(rb.mu, 2) + '，两个词互不影响。',
        '词 A 的方差 σ = 每一维离均值的距离平方再平均 = ' + fmt(r.sigma, 2) + '，标准差 √σ ≈ ' + fmt(Math.sqrt(r.sigma), 3) + '。除以它以后，平方的平均正好是 1。词 B 用它自己的方差 σ = ' + fmt(rb.sigma, 3) + '（标准差 ≈ ' + fmt(Math.sqrt(rb.sigma), 3) + '）：它原来很小，也被放大到同样的尺度。',
        '最后乘 γ、加 β（可学的参数），让下一层拿到的数在一个稳定、可控的范围里。拖动上面的 γ、β，看每一维怎样一起被拉伸和平移（γ、β 只在这一步起作用）。',
      ][stage];
      note.append(text);
    }
    render();
  }

  C.viz.register('layernorm', { title: 'LayerNorm', mount });
})(window);
