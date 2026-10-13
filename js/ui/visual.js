/* Interactive experiments and Manim videos.
 * Experiments register themselves: CS224N.viz.register('id', { title, mount(el, props) → optional cleanup }).
 * Videos are listed in CS224N.content.videos[id] = { title, src, poster, steps }.
 * Anything not built yet is shown as its spec card (data/visuals.js), so a chapter never has an empty hole. */
(function (root) {
  'use strict';
  const C = root.CS224N = root.CS224N || {};
  const { h } = C.dom;
  const registry = {};
  const cleanups = [];

  function register(id, def) { registry[id] = def; }
  function has(id) { return !!registry[id]; }

  function specCard(kind, id, spec) {
    const label = kind === 'video' ? '视频' : '交互实验';
    const rows = spec ? [
      ['回答的问题', spec.question],
      kind === 'video' ? ['顿悟点', spec.aha] : ['画什么、怎么交互', spec.what],
      kind === 'video' ? null : ['用的数字', spec.data],
    ].filter((r) => r && r[1]) : [['说明', '这个可视化还没有写规格。']];
    return h('div.visual.spec', { dataset: { visual: id } },
      h('div.visual-head', h('span.visual-kind' + (kind === 'video' ? '.video' : ''), label), h('span.visual-title', spec ? spec.title : id), h('span.spec-status', '待实现')),
      h('div.visual-body', h('dl.spec-grid', rows.map(([k, v]) => [h('dt', k), h('dd', { html: C.md.render(v, { terms: false }) })]))));
  }

  /** An experiment card: the live widget if registered, otherwise its spec. */
  function experiment(ref) {
    const spec = (C.content.visuals || {})[ref.id];
    const def = registry[ref.id];
    if (!def) return specCard('viz', ref.id, spec);
    const body = h('div.visual-body');
    const card = h('div.visual', { dataset: { visual: ref.id } },
      h('div.visual-head', h('span.visual-kind', '交互实验'), h('span.visual-title', ref.title || def.title || (spec && spec.title) || ref.id)),
      ref.guide ? h('div.visual-body.prose', { html: C.md.render(ref.guide) }) : null,
      body);
    try {
      const r = def.mount(body, ref.props || {});
      if (typeof r === 'function') cleanups.push(r);
    } catch (e) {
      body.appendChild(h('p.warn-text', '实验加载失败：' + e.message));
      if (root.console) console.error(e);
    }
    return card;
  }

  /** A Manim video card, or its spec while the video is not rendered yet. */
  function video(ref) {
    const spec = (C.content.videoSpecs || {})[ref.id];
    const v = (C.content.videos || {})[ref.id];
    if (!v || !C.player) return specCard('video', ref.id, spec);
    return C.player.mount(ref.id, v);
  }

  function unmountAll() {
    while (cleanups.length) { try { cleanups.pop()(); } catch (e) { /* ignore */ } }
  }

  C.viz = { register, has, experiment, video, unmountAll, registry };
})(window);
