/* Quiz engine.
 * question = { kind, q, type?: 'single'|'multi'|'numeric', options?, answer, tol?, unit?, explain, why?: [per-option text] }
 * Results are stored per chapter in localStorage so progress survives reloads. */
(function (root) {
  'use strict';
  const C = root.CS224N = root.CS224N || {};
  const { h, store } = C.dom;
  const render = (s) => C.md.render(s || '');
  const inline = (s) => C.md.renderInline(s || '');

  function results(chapterId) { return store.get('quiz:' + chapterId, {}); }
  function saveResult(chapterId, i, correct) {
    const r = results(chapterId); r[i] = { correct, at: Date.now() }; store.set('quiz:' + chapterId, r);
    root.dispatchEvent(new CustomEvent('cs224n:progress'));
  }
  function typeOf(q) {
    return q.type || (Array.isArray(q.answer) ? 'multi' : typeof q.answer === 'number' && !q.options ? 'numeric' : 'single');
  }

  function card(question, i, chapterId, onDone) {
    const type = typeOf(question);
    const name = 'q-' + chapterId + '-' + i;
    const feedback = h('div.quiz-feedback', { 'aria-live': 'polite' });
    const inputs = [];
    let numeric = null, body;
    if (type === 'numeric') {
      numeric = h('input.quiz-number', { type: 'text', inputmode: 'decimal', placeholder: '输入数值', 'aria-label': '答案' });
      body = h('div.quiz-numeric', numeric, question.unit ? h('span', ' ' + question.unit) : null);
    } else {
      body = h('div.quiz-options', question.options.map((opt, k) => {
        const input = h('input', { type: type === 'multi' ? 'checkbox' : 'radio', name, value: k });
        inputs.push(input);
        return h('label.quiz-option', input, h('span.quiz-letter', String.fromCharCode(65 + k)), h('span.quiz-text', { html: inline(opt) }));
      }));
    }
    function check() {
      let correct;
      if (type === 'numeric') {
        const v = parseFloat(String(numeric.value).replace('−', '-'));
        if (Number.isNaN(v)) { feedback.innerHTML = '<p class="warn-text">请先输入一个数。</p>'; return; }
        correct = Math.abs(v - question.answer) <= (question.tol == null ? 0.005 : question.tol);
      } else {
        const chosen = inputs.filter((x) => x.checked).map((x) => +x.value);
        if (!chosen.length) { feedback.innerHTML = '<p class="warn-text">请先选一个选项。</p>'; return; }
        const ans = [].concat(question.answer).sort();
        correct = chosen.length === ans.length && chosen.sort().every((v, k) => v === ans[k]);
        inputs.forEach((x, k) => {
          const label = x.closest('.quiz-option');
          label.classList.toggle('is-answer', ans.includes(k));
          label.classList.toggle('is-wrong', x.checked && !ans.includes(k));
        });
      }
      const per = question.why && type !== 'numeric'
        ? '<ul class="quiz-why">' + question.options.map((o, k) => (question.why[k] ? '<li><b>' + String.fromCharCode(65 + k) + '</b>：' + inline(question.why[k]) + '</li>' : '')).join('') + '</ul>' : '';
      const ansText = type === 'numeric' ? '<p>参考答案：<b>' + question.answer + (question.unit ? ' ' + question.unit : '') + '</b></p>' : '';
      feedback.className = 'quiz-feedback ' + (correct ? 'ok' : 'bad');
      feedback.innerHTML = '<p class="quiz-verdict">' + (correct ? '✓ 正确' : '✗ 还不对') + '</p>' + ansText + render(question.explain) + per;
      saveResult(chapterId, i, correct);
      if (onDone) onDone();
    }
    function reset() {
      inputs.forEach((x) => { x.checked = false; x.closest('.quiz-option').classList.remove('is-answer', 'is-wrong'); });
      if (numeric) numeric.value = '';
      feedback.className = 'quiz-feedback'; feedback.innerHTML = '';
    }
    const prev = results(chapterId)[i];
    return h('div.quiz-card',
      h('div.quiz-head', h('span.quiz-kind', question.kind || '概念判断'), h('span.quiz-num', 'Q' + (i + 1)),
        prev ? h('span.quiz-prev' + (prev.correct ? '.ok' : '.bad'), prev.correct ? '上次答对' : '上次答错') : null),
      h('div.quiz-q', { html: render(question.q) }),
      body,
      h('div.quiz-actions', h('button.btn.primary', { type: 'button', onclick: check }, '提交并看解释'), h('button.btn.ghost', { type: 'button', onclick: reset }, '重做')),
      feedback);
  }

  /** indices: optional original question numbers (used by the review page so answers count for their chapter). */
  function mount(questions, chapterId, indices) {
    const idx = (k) => (indices ? indices[k] : k);
    const summary = h('div.quiz-summary');
    function refresh() {
      const r = results(chapterId), mine = questions.map((_, k) => r[idx(k)]).filter(Boolean);
      summary.textContent = '已作答 ' + mine.length + ' / ' + questions.length + '，答对 ' + mine.filter((x) => x.correct).length;
    }
    const node = h('div.quiz', summary, questions.map((q, k) => card(q, idx(k), chapterId, refresh)));
    refresh();
    return node;
  }

  C.quiz = { mount, results, typeOf };
})(window);
