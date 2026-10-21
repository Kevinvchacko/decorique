/* Decorique: polaroids pegged on a sagging string of fairy lights.
   Every [data-garland] lays its .gp polaroids along the string and lets them swing like real prints:
   a soft breeze, a push from the pointer as it passes, a jolt from the scroll. Tap one to turn it over.
   With reduced motion the breeze and the scroll jolt are off; a polaroid still swings when touched. */
(function(){
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  document.querySelectorAll('[data-garland]').forEach(function(g){
    var items = Array.prototype.slice.call(g.querySelectorAll('.gp'));
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'gl-string'); svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(NS, 'path'); svg.appendChild(path);
    g.insertBefore(svg, g.firstChild);
    var bulbs = [];
    for (var b = 0; b < 46; b++){ var c = document.createElementNS(NS, 'circle'); c.setAttribute('r', b % 3 ? 2.6 : 3.4); c.style.setProperty('--d', (-(b * 0.37) % 2.8).toFixed(2) + 's'); svg.appendChild(c); bulbs.push(c); }

    var st = items.map(function(el, i){ return { el: el, a: (i % 2 ? 3 : -3) + Math.sin(i * 1.7) * 2, base: (i % 2 ? 2.5 : -2.5), v: 0, x: 0 }; });
    var W = 0, Y0 = 18, SAG = 40;
    function yAt(t){ return Y0 + 4 * SAG * t * (1 - t); }
    function layout(){
      W = g.clientWidth; SAG = Math.min(70, W * 0.04 + 14);
      path.setAttribute('d', 'M -20 ' + Y0 + ' Q ' + (W / 2) + ' ' + (Y0 + 2 * SAG) + ' ' + (W + 20) + ' ' + Y0);
      bulbs.forEach(function(c, i){ var t = (i + 0.5) / bulbs.length, x = -20 + t * (W + 40); c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', (yAt((x + 20) / (W + 40)) + 1).toFixed(1)); });
      var shown = st.filter(function(s){ return s.el.offsetParent !== null; });
      var pw = shown.length ? shown[0].el.offsetWidth : 100, edge = Math.max(W < 700 ? 18 : 56, pw * 0.45);   // keep the outer prints inside the page margin even mid-swing
      shown.forEach(function(s, i){
        var x = edge + pw / 2 + (shown.length === 1 ? 0 : i * (W - 2 * edge - pw) / (shown.length - 1));
        s.x = x; s.el.style.left = (x - pw / 2).toFixed(1) + 'px'; s.el.style.top = (yAt((x + 20) / (W + 40)) - 2).toFixed(1) + 'px';
      });
      paint();
    }
    function paint(){ st.forEach(function(s){ s.el.style.transform = 'rotate(' + s.a.toFixed(2) + 'deg)'; }); }

    // swing
    var running = false, visible = false, last = 0, t0 = performance.now();
    function kick(){ if (!running && visible){ running = true; last = performance.now(); requestAnimationFrame(loop); } }
    function loop(now){
      var dt = Math.min(0.05, (now - last) / 1000), t = (now - t0) / 1000, moving = false; last = now;
      st.forEach(function(s, i){
        var breeze = RM ? 0 : Math.sin(t * 0.8 + i * 0.9) * 1.6 + Math.sin(t * 0.33 + i) * 1.1;
        var acc = -18 * (s.a - s.base - breeze) - 2.2 * s.v;
        s.v += acc * dt; s.a += s.v * dt;
        if (s.a > 28) { s.a = 28; s.v *= -0.4; } else if (s.a < -28) { s.a = -28; s.v *= -0.4; }
        if (Math.abs(s.v) > 0.05 || Math.abs(s.a - s.base) > 0.05) moving = true;
      });
      paint();
      if (visible && (moving || !RM)) requestAnimationFrame(loop); else running = false;
    }
    new IntersectionObserver(function(en){ visible = en[0].isIntersecting; if (visible) kick(); }).observe(g);

    // the pointer pushes the polaroids it passes, the scroll jolts them
    var px = null, pt = 0;
    window.addEventListener('pointermove', function(e){
      var r = g.getBoundingClientRect(), now = performance.now();
      if (e.clientY < r.top - 20 || e.clientY > r.bottom + 160) { px = null; return; }
      if (px !== null){
        var vx = (e.clientX - px) / Math.max(8, now - pt);
        st.forEach(function(s){ var d = Math.abs(e.clientX - r.left - s.x); if (d < 120) s.v += vx * 70 * (1 - d / 120); });
        kick();
      }
      px = e.clientX; pt = now;
    }, { passive: true });
    if (!RM){
      var ly = scrollY;
      window.addEventListener('scroll', function(){ var d = scrollY - ly; ly = scrollY; if (Math.abs(d) > 1){ st.forEach(function(s, i){ s.v += Math.max(-40, Math.min(40, d)) * (i % 2 ? 0.5 : -0.4); }); kick(); } }, { passive: true });
    }
    // turn over on tap
    items.forEach(function(el, i){
      el.setAttribute('aria-pressed', 'false');
      el.addEventListener('click', function(){
        var on = el.classList.toggle('on'); el.setAttribute('aria-pressed', String(on));
        st[i].v += on ? 90 : -90; kick();
      });
    });

    new ResizeObserver(layout).observe(g);
    layout();
  });
})();
