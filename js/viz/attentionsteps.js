/* 注意力每一步算了什么 (L05 p25–p37): seq2seq with attention on “il a m’ entarté” → “he hit me with a pie”.
 * Each decoder step is shown in four stages: dot-product scores → softmax → weighted sum of encoder states →
 * output word; after the sixth step the weights form the alignment heatmap. The attention weights are made up
 * (课件外) to follow the light/dark pattern of the slide's heatmap; the scores are chosen so that softmax gives
 * exactly those weights (js/core/prob.js softmax). Encoder states are made-up 3-number vectors. */
(function (root) {
  'use strict';
  const C = root.CS224N;
  const { h, s, button, fmt, clear } = C.dom;
  const P = C.core.prob;

  const SRC = ['il', 'a', 'm’', 'entarté'];
  const OUT = ['he', 'hit', 'me', 'with', 'a', 'pie'];
  const IN = ['<START>', 'he', 'hit', 'me', 'with', 'a'];
  const ALPHA = [
    [0.85, 0.05, 0.05, 0.05],
    [0.20, 0.25, 0.05, 0.50],
    [0.05, 0.10, 0.65, 0.20],
    [0.05, 0.05, 0.10, 0.80],
    [0.05, 0.05, 0.10, 0.80],
    [0.03, 0.05, 0.07, 0.85],
  ];
  const SCORES = ALPHA.map((row) => row.map((a) => Math.round((Math.log(a) + 4) * 100) / 100));
  const WEIGHTS = SCORES.map((row) => P.softmax(row));   // what the reader sees is exactly softmax(scores)
  const H = [[0.9, 0.1, -0.3], [0.2, 0.7, 0.4], [-0.4, 0.8, 0.1], [0.1, -0.5, 0.9]];   // encoder states
  const STAGES = ['① 打分：点积', '② softmax', '③ 加权求和', '④ 输出一个词'];

  function mount(el) {
    let t = 0, stage = 0, heat = false;
    const W = 760, Hh = 300;
    const svg = s('svg', { class: 'viz-svg at-svg', viewBox: '0 0 ' + W + ' ' + Hh, role: 'img', 'aria-label': '带注意力的解码' });
    const stages = h('div.cg-stages');
    const cap = h('div.at-cap');
    const heatBox = h('div.at-heat');
    const prev = button('← 上一步', () => go(-1));
    const next = button('下一步 →', () => go(1));
    const toHeat = button('看对齐热力图', () => { heat = !heat; render(); });
    el.append(h('div.viz-row', prev, next, toHeat), stages, svg, heatBox, cap);

    function go(d) {
      heat = false;
      let k = t * 4 + stage + d;
      k = Math.max(0, Math.min(23, k));
      t = Math.floor(k / 4); stage = k % 4;
      render();
    }
    const ex = (j) => 70 + j * 92, dx = (i) => 470 + i * 50, by = 200;

    function render() {
      clear(svg); clear(stages); clear(heatBox); clear(cap);
      svg.style.display = heat ? 'none' : '';
      heatBox.style.display = heat ? '' : 'none';
      toHeat.textContent = heat ? '回到逐步演示' : '看对齐热力图';
      if (heat) { renderHeat(); prev.disabled = next.disabled = false; return; }
      STAGES.forEach((name, k) => stages.append(h('span.cg-stage' + (k < stage ? '.is-done' : k === stage ? '.is-current' : ''), name)));
      const alpha = WEIGHTS[t], score = SCORES[t];
      const a = [0, 1, 2].map((d) => alpha.reduce((sum, w, j) => sum + w * H[j][d], 0));
      svg.append(s('text', { x: ex(0) - 30, y: 290, class: 'at-label', text: '编码器（读法语）' }), s('text', { x: dx(0) - 20, y: 290, class: 'at-label', text: '解码器（写英语）' }));
      // encoder cells
      SRC.forEach((w, j) => {
        svg.append(s('rect', { x: ex(j) - 30, y: by, width: 60, height: 30, rx: 6, class: 'at-enc' }));
        H[j].forEach((v, d) => svg.append(s('rect', { x: ex(j) - 25 + d * 17, y: by + 7, width: 15, height: 16, rx: 2, class: 'at-unit', style: 'fill:' + (v >= 0 ? 'var(--c-blue)' : 'var(--c-red)') + ';fill-opacity:' + (0.2 + 0.8 * Math.abs(v)) })));
        svg.append(s('text', { x: ex(j), y: by + 50, class: 'at-word', text: w }), s('text', { x: ex(j) - 34, y: by + 20, class: 'at-h', text: 'h' + (j + 1) }));
        // bars above the encoder
        if (stage === 0) {
          const hgt = Math.max(2, score[j] * 22);
          svg.append(s('rect', { x: ex(j) - 14, y: by - 10 - hgt, width: 28, height: hgt, class: 'at-score' }), s('text', { x: ex(j), y: by - 16 - hgt, class: 'at-num', text: fmt(score[j], 2) }));
        } else {
          const hgt = alpha[j] * 120;
          svg.append(s('rect', { x: ex(j) - 14, y: by - 10 - hgt, width: 28, height: hgt, class: 'at-alpha' }), s('text', { x: ex(j), y: by - 16 - hgt, class: 'at-num', text: fmt(alpha[j], 2) }));
        }
      });
      // decoder cells
      IN.forEach((w, i) => {
        const on = i <= t;
        svg.append(s('rect', { x: dx(i) - 20, y: by, width: 40, height: 30, rx: 6, class: 'at-dec' + (on ? '' : ' is-off') + (i === t ? ' is-cur' : '') }));
        svg.append(s('text', { x: dx(i), y: by + 50, class: 'at-word small' + (on ? '' : ' is-off'), text: w }));
        if (i < t || (i === t && stage === 3)) svg.append(s('text', { x: dx(i), y: by - 64, class: 'at-out', text: OUT[i] }));
      });
      // dot-product lines from the current decoder state
      const sx = dx(t), sy = by;
      SRC.forEach((w, j) => {
        const width = stage === 0 ? 1.2 : 0.8 + 7 * alpha[j];
        svg.append(s('path', { d: 'M' + sx + ',' + sy + ' C' + sx + ',' + (sy - 40) + ' ' + ex(j) + ',' + (sy - 40) + ' ' + (ex(j) + 18) + ',' + (sy - 2), class: 'at-link' + (stage >= 1 ? ' is-weight' : ''), style: 'stroke-width:' + width }));
      });
      // attention output and prediction
      if (stage >= 2) {
        const ox = dx(t), oy = by - 120;
        svg.append(s('rect', { x: ox - 28, y: oy, width: 56, height: 24, rx: 5, class: 'at-attn' }));
        a.forEach((v, d) => svg.append(s('rect', { x: ox - 24 + d * 17, y: oy + 5, width: 15, height: 14, rx: 2, class: 'at-unit', style: 'fill:' + (v >= 0 ? 'var(--c-blue)' : 'var(--c-red)') + ';fill-opacity:' + (0.2 + 0.8 * Math.min(1, Math.abs(v))) })));
        svg.append(s('text', { x: ox, y: oy - 6, class: 'at-num', text: '注意力输出' }));
        svg.append(s('line', { x1: ox, y1: oy + 24, x2: ox, y2: by - 2, class: 'at-concat' }));
      }
      // caption
      const top = alpha.indexOf(Math.max(...alpha));
      const title = '第 ' + (t + 1) + ' 步：输入 “' + IN[t] + '”，要写出第 ' + (t + 1) + ' 个英文词';
      const text = [
        '解码器当前的隐状态，和编码器的 4 个隐状态各做一次点积，得到 4 个分数（柱子上的数）。分数越大，表示这个法语位置和“现在要写的词”越相关。',
        'softmax 把 4 个分数变成 4 个加起来是 1 的权重（第 1.3 章）。这一步权重最大的是 “' + SRC[top] + '”（' + fmt(alpha[top], 2) + '）。连线越粗，权重越大。',
        '按权重把 4 个编码器隐状态加起来：注意力输出 = ' + alpha.map((w, j) => fmt(w, 2) + '·h' + (j + 1)).join(' + ') + ' = [' + a.map((v) => fmt(v, 2)).join(', ') + ']。它主要包含权重大的那个位置的信息。',
        '把注意力输出和解码器的隐状态拼起来，算出下一个词的概率分布，写出 “' + OUT[t] + '”。' + (t < 5 ? '下一步再重新打分，看原文的别处。' : '6 步走完，点“看对齐热力图”。'),
      ][stage];
      cap.append(h('div.at-cap-title', title), h('div.at-cap-text', text));
      prev.disabled = t === 0 && stage === 0; next.disabled = t === 5 && stage === 3;
    }

    function renderHeat() {
      const table = h('table.at-table');
      table.append(h('tr', h('th', ''), OUT.map((w) => h('th', w))));
      SRC.forEach((w, j) => table.append(h('tr', h('th', w), OUT.map((_, i) => h('td', { style: { background: 'color-mix(in srgb, var(--c-blue) ' + Math.round(WEIGHTS[i][j] * 100) + '%, var(--surface))', color: WEIGHTS[i][j] > 0.5 ? 'var(--on-accent)' : 'var(--text)' } }, fmt(WEIGHTS[i][j], 2))))));
      heatBox.append(h('p.viz-note', '每一列是解码器的一步，每一行是一个法语词，颜色越深权重越大。没人告诉模型哪个词对哪个词，它自己学出了这种对应（权重是我们按课件热力图的明暗编的，课件外）。'), table);
      cap.append(h('div.at-cap-title', '对齐'), h('div.at-cap-text', 'il ↔ he，m’ ↔ me，entarté ↔ with a pie：一个法语词对应好几个英文词，模型也能看出来。'));
    }
    render();
  }

  C.viz.register('attention-steps', { title: '注意力每一步算了什么', mount });
})(window);
