/* Browser regression checks for Parts 0–5. Requires playwright-core and a running tools/serve.py.
 * CHROME_PATH selects a local Chrome binary; CS224N_BASE_URL defaults to the preview server. */
'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    const errors = [], failures = [];
    let states = 0;
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(process.env.CS224N_BASE_URL || 'http://127.0.0.1:8224/');
    await page.evaluate(() => document.fonts.ready);
    const refs = await page.evaluate(() => CS224N.content.chapters
      .filter((c) => Number(c.part.slice(1)) <= 5)
      .flatMap((c) => c.topics.flatMap((t) => (t.visuals || [])
        .filter((v) => v.type !== 'video').map((v) => ({ chapter: c.id, ...v })))));

    async function mount(ref) {
      await page.evaluate((ref) => {
        CS224N.viz.unmountAll();
        document.body.innerHTML = '';
        const box = document.createElement('main');
        box.id = 'viz-check';
        box.style = 'width:800px;max-width:none;padding:24px;margin:0 auto';
        box.append(CS224N.viz.experiment(ref));
        document.body.append(box);
      }, ref);
    }
    async function inspect(ref, action) {
      states++;
      const issues = await page.evaluate(() => {
        const box = document.querySelector('#viz-check'), issues = [];
        if (/NaN|undefined|Infinity|加载失败/.test(box.innerText)) issues.push('invalid visible value');
        if (box.querySelector('.katex-error')) issues.push('KaTeX error');
        if (box.scrollWidth > box.clientWidth + 1) issues.push('container overflow');
        for (const svg of box.querySelectorAll('svg')) {
          if (!svg.getBoundingClientRect().width) continue;
          const vb = svg.viewBox.baseVal;
          const labels = [...svg.querySelectorAll('text')].filter((t) => {
            for (let p = t; p && p !== svg; p = p.parentElement) {
              const st = getComputedStyle(p);
              if (st.opacity === '0' || st.visibility === 'hidden' || st.display === 'none') return false;
            }
            return t.getBoundingClientRect().width > 0;
          });
          for (const t of labels) {
            const b = t.getBBox();
            if (b.x < -1 || b.y < -1 || b.x + b.width > vb.width + 1 || b.y + b.height > vb.height + 1)
              issues.push('SVG text clipped: ' + t.textContent);
          }
          for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
            const a = labels[i].getBBox(), b = labels[j].getBBox();
            const area = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
              * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
            if (area > 0.25 * Math.min(a.width * a.height, b.width * b.height))
              issues.push('SVG text overlaps: ' + labels[i].textContent + ' / ' + labels[j].textContent);
          }
          for (const n of svg.querySelectorAll('*')) for (const a of n.attributes)
            if (/NaN|undefined|Infinity/.test(a.value)) issues.push('invalid SVG attribute: ' + a.name);
        }
        return issues;
      });
      if (issues.length) failures.push({ chapter: ref.chapter, id: ref.id, action, issues });
    }
    async function ranges(ref) {
      const count = await page.locator('#viz-check input[type=range]').count();
      for (let i = 0; i < count; i++) for (const point of ['min', 'max', 'mid']) {
        const slider = page.locator('#viz-check input[type=range]').nth(i);
        if (!await slider.isVisible() || !await slider.isEnabled()) continue;
        await slider.evaluate((s, point) => {
          s.value = point === 'mid' ? (Number(s.min) + Number(s.max)) / 2 : s[point];
          s.dispatchEvent(new Event('input', { bubbles: true }));
        }, point);
        await inspect(ref, 'slider ' + i + ' ' + point);
      }
    }
    for (const ref of refs) {
      await mount(ref);
      await inspect(ref, 'initial');
      // Exercise sliders in every tab, not only whichever tab is left after clicking all buttons.
      const groups = await page.locator('#viz-check [role=radiogroup]').count();
      for (let g = 0; g < groups; g++) {
        const options = await page.locator('#viz-check [role=radiogroup]').nth(g).locator('button').count();
        for (let j = 0; j < options; j++) {
          await page.locator('#viz-check [role=radiogroup]').nth(g).locator('button').nth(j).evaluate((b) => b.click());
          await inspect(ref, 'tab ' + g + ':' + j);
          await ranges(ref);
          const checks = await page.locator('#viz-check input[type=checkbox]').count();
          for (let c = 0; c < checks; c++) for (let t = 0; t < 2; t++) {
            await page.locator('#viz-check input[type=checkbox]').nth(c).evaluate((b) => b.click());
            await inspect(ref, 'checkbox ' + c);
          }
        }
      }
      await ranges(ref);
      // Remount, then try every ordinary button. Auto-play has its own lifecycle check below.
      await mount(ref);
      const buttons = await page.locator('#viz-check button:not([role=radio])').count();
      for (let i = 0; i < buttons; i++) for (let n = 0; n < 3; n++) {
        const b = page.locator('#viz-check button:not([role=radio])').nth(i);
        if (!await b.count() || !await b.isVisible() || !await b.isEnabled()) continue;
        const label = await b.innerText();
        if (label === '自动走完' || label === '停止') continue;
        await b.evaluate((b) => b.click());
        await inspect(ref, 'button ' + label + ' ' + n);
      }
    }

    // Walk all decoder stages, including the late steps that three button presses do not reach.
    for (const id of ['attention-steps', 'seq2seq']) {
      const ref = refs.find((r) => r.id === id);
      for (const mode of id === 'seq2seq' ? ['测试时：逐词生成', '训练时：算损失'] : [null]) {
        await mount(ref);
        if (mode) await page.getByRole('radio', { name: mode, exact: true }).click();
        const next = page.getByRole('button', { name: '下一步 →', exact: true });
        let steps = 0;
        while (await next.isEnabled()) {
          await next.click(); await inspect(ref, 'decoder ' + mode + ' step ' + (++steps));
        }
        assert.equal(steps, id === 'attention-steps' ? 23 : 12);
        if (id === 'attention-steps') {
          await page.getByRole('button', { name: '看对齐热力图', exact: true }).click();
          await inspect(ref, 'completed heatmap');
        }
      }
    }
    const selfAttn = refs.find((r) => r.id === 'self-attn');
    await mount(selfAttn);
    for (const name of ['分数 XQ(XK)ᵀ', 'softmax 后的权重']) {
      await page.getByRole('radio', { name, exact: true }).click();
      for (let i = 0; i < 25; i++) {
        await page.locator('.sa-mat.is-big td:not(.sa-sum)').nth(i).click();
        assert.ok((await page.locator('.sa-note').innerText()).includes('第 ' + (Math.floor(i / 5) + 1) + ' 行第 ' + (i % 5 + 1) + ' 列'));
        await inspect(selfAttn, name + ' cell ' + i);
      }
    }

    // The controlled example must really use the RNN calculation and agree with s^11 at each scale.
    const vanish = refs.find((r) => r.id === 'vanishing');
    await mount(vanish);
    await page.getByRole('radio', { name: '真实 RNN：保持在 sigmoid 中央', exact: true }).click();
    for (const scale of [0.5, 1, 2, 4]) {
      await page.getByRole('slider', { name: '把 W_h 放大 / 缩小', exact: true }).evaluate((s, v) => {
        s.value = v; s.dispatchEvent(new Event('input', { bubbles: true }));
      }, scale);
      const values = await page.locator('.vg-svg .vg-val').allTextContents();
      assert.equal(values.length, 12);
      const parsed = values.map((s) => {
        const [m, e] = s.replace('−', '-').split('×10');
        const exp = e && [...e].map((c) => c === '⁻' ? '-' : String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c))).join('');
        return Number(m) * (e ? 10 ** Number(exp) : 1);
      });
      parsed.forEach((v, k) => assert.ok(Math.abs(v / scale ** (11 - k) - 1) < 0.06));
      await inspect(vanish, 'controlled scale ' + scale);
    }
    // Undefined derivatives must be holes, not a filled point or a sloping bridge across the jump.
    await mount(refs.find((r) => r.id === 'activations'));
    for (const name of ['阈值函数', 'ReLU', 'leaky ReLU（k = 0.1）']) {
      await page.getByRole('radio', { name, exact: true }).click();
      await page.getByRole('slider', { name: 'z', exact: true }).evaluate((s) => {
        s.value = 0; s.dispatchEvent(new Event('input', { bubbles: true }));
      });
      assert.equal(await page.locator('.ac-fig').nth(1).locator('.ac-dot').isVisible(), false);
      assert.equal(await page.locator('.ac-fig').nth(1).locator('polyline').count(), 2);
    }
    // A running dependency parser must release its timer when a chapter is unmounted.
    const timers = await page.evaluate(() => {
      const originalSet = window.setInterval, originalClear = window.clearInterval;
      const active = new Set();
      window.setInterval = (...args) => { const id = originalSet(...args); active.add(id); return id; };
      window.clearInterval = (id) => { active.delete(id); return originalClear(id); };
      const box = document.querySelector('#viz-check'); box.innerHTML = '';
      box.append(CS224N.viz.experiment({ id: 'arc-standard' }));
      [...box.querySelectorAll('button')].find((b) => b.textContent === '自动走完').click();
      const during = active.size; CS224N.viz.unmountAll();
      const after = active.size; window.setInterval = originalSet; window.clearInterval = originalClear;
      return { during, after };
    });
    assert.deepEqual(timers, { during: 1, after: 0 });

    // Use the real chapter layout as well as the isolated experiment mounts.
    // Reload first: fragment navigation alone would retain the temporary test DOM.
    await page.reload();
    const chapters = await page.evaluate(() => CS224N.content.chapters
      .filter((c) => c.part === 'p4' || c.part === 'p5')
      .map((c) => ({ id: c.id, title: c.title })));
    let chapterChecks = 0;
    for (const width of [800, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const chapter of chapters) {
        await page.goto((process.env.CS224N_BASE_URL || 'http://127.0.0.1:8224/') + '#/c/' + chapter.id);
        await page.waitForFunction((title) => document.querySelector('.ch-title')?.textContent.includes(title), chapter.title);
        const state = await page.evaluate(() => ({
          width: innerWidth, pageWidth: document.documentElement.scrollWidth,
          errors: document.querySelectorAll('.katex-error,.warn-text').length,
          ids: [...document.querySelectorAll('.visual[data-visual]')]
            .filter((e) => !e.querySelector('.visual-kind.video')).map((e) => e.dataset.visual).sort(),
          overflow: [...document.querySelectorAll('.visual,.math-display,table')]
            .filter((e) => e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 2 && !e.closest('.katex-mathml'))
            .map((e) => e.className),
        }));
        assert.equal(state.pageWidth, state.width, chapter.id + ' page overflow');
        assert.equal(state.errors, 0, chapter.id + ' formula/loading error');
        assert.deepEqual(state.overflow, [], chapter.id + ' content overflow');
        assert.deepEqual(state.ids, refs.filter((r) => r.chapter === chapter.id).map((r) => r.id).sort(), chapter.id + ' mounted experiments');
        chapterChecks++;
      }
    }
    assert.deepEqual(errors, [], 'browser errors');
    assert.deepEqual(failures, [], 'visual layout/value failures');
    console.log(new Set(refs.map((r) => r.id)).size + ' visualizations, ' + refs.length + ' mounts, ' + states + ' checked states, ' + chapterChecks + ' chapter/viewport checks; browser regressions passed');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
