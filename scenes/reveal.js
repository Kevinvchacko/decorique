// Decorique / scenes / reveal.js: the moment they walk in.
// A framed photograph in the middle of the screen opens to the whole screen as the visitor scrolls,
// the way the room opens up when the door does. The copy steps aside first, then one line lands.
//
// Markup:
//   <section class="scene reveal" data-scene="reveal" data-options='{"hold":2}'>
//     <div class="scene-stage">
//       <div class="rv-copy"><h2>…</h2><p>…</p></div>
//       <figure class="rv-photo"><img …></figure>
//       <p class="rv-line">…</p>
//     </div>
//   </section>
(() => {
  window.Scenes = window.Scenes || {};
  window.Scenes.reveal = (root, o) => Stage.scene(root, {
    hold: o.hold || 2,
    scrub: 0.6,
    phone: { hold: 1.5 },
    build(tl, { q, phone }) {
      const [photo] = q('.rv-photo');
      const [img] = q('.rv-photo > *');
      const [copy] = q('.rv-copy');
      const [line] = q('.rv-line');
      const from = phone ? 'inset(30% 12% 24% 12%)' : 'inset(36% 30% 10% 30%)';
      tl.fromTo(photo, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.62, ease: 'power2.inOut' }, 0)
        .fromTo(img, { scale: 1.35 }, { scale: 1, duration: 0.62, ease: 'power2.inOut' }, 0)
        .to(copy, { opacity: 0, y: -50, duration: 0.18, ease: 'power1.in' }, 0.04)
        .fromTo(line, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.66)
        .to(img, { scale: 1.06, duration: 0.34 }, 0.66);
    },
  });
})();
