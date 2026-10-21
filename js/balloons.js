// Decorique: glossy 3D balloons floating either side of the hero card.
// They bob, lean away from the pointer, rise faster than the page as it scrolls, and pop when clicked
// (confetti + a small pop), then float back up a few seconds later.
// Desktop only (the phone card fills the screen); skipped for reduced motion or without WebGL.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const hero = document.getElementById('hero');
const holder = document.getElementById('balloons');
const wide = matchMedia('(min-width: 900px)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webgl(){ try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch(e){ return false; } }

// with reduced motion the balloons still show and still pop, they just hold still
if (holder && wide.matches && webgl()) start();

function start(){
  holder.classList.add('on');   // shown first, so the canvas is measured at its real size
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  holder.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  const key = new THREE.DirectionalLight(0xfff1dc, 1.6); key.position.set(-4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xf2705c, 1.2); rim.position.set(5, -2, -4); scene.add(rim);
  scene.add(new THREE.AmbientLight(0x4d1024, 0.6));

  // balloon body: a lathe with a pinched bottom, plus the tied knot
  const pts = [];
  for (let i = 0; i <= 40; i++){
    const t = i / 40, a = Math.PI * t;
    const r = Math.sin(a) * 0.52 * (0.72 + 0.28 * t) + (i === 0 ? 0.02 : 0);
    pts.push(new THREE.Vector2(Math.max(r, 0.001), -Math.cos(a) * 0.66));
  }
  const bodyGeo = new THREE.LatheGeometry(pts, 64);
  const knotGeo = new THREE.ConeGeometry(0.06, 0.1, 16); knotGeo.translate(0, -0.7, 0);

  const MATS = {
    coral: { color: 0xf2705c, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12 },
    blush: { color: 0xf3bdb4, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 },
    cream: { color: 0xf8efe2, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 },
    wine:  { color: 0x9a3556, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 },
    gold:  { color: 0xf0b94a, roughness: 0.28, metalness: 0.85, clearcoat: 0.6 },
  };
  const CONFETTI = { coral: '#F2705C', blush: '#F3BDB4', cream: '#F4ECDD', wine: '#9A3556', gold: '#F0B94A' };
  const mats = {}; for (const k in MATS) mats[k] = new THREE.MeshPhysicalMaterial(MATS[k]);
  const stringMat = new THREE.LineBasicMaterial({ color: 0xf4ecdd, transparent: true, opacity: 0.55 });

  // side: -1 left gutter, 1 right gutter. u: 0 inner edge of the gutter .. 1 outer edge. v: 0 top .. 1 bottom of the first screen
  const LAYOUT = [
    { side: -1, u: 0.35, v: 0.24, s: 1.05, c: 'coral' },
    { side: -1, u: 0.75, v: 0.12, s: 0.8, c: 'gold' },
    { side: -1, u: 0.6, v: 0.5, s: 0.9, c: 'cream' },
    { side: 1, u: 0.45, v: 0.18, s: 0.95, c: 'blush' },
    { side: 1, u: 0.8, v: 0.36, s: 1.1, c: 'wine' },
    { side: 1, u: 0.3, v: 0.44, s: 0.75, c: 'gold' },
    { side: 1, u: 0.7, v: 0.06, s: 0.7, c: 'coral' },
  ];

  const balloons = LAYOUT.map((L, i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, mats[L.c]);
    const knot = new THREE.Mesh(knotGeo, mats[L.c]);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.74, 0), new THREE.Vector3(0.08, -1.6, 0), new THREE.Vector3(-0.06, -2.6, 0), new THREE.Vector3(0.05, -3.8, 0)
    ]);
    const str = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(30)), stringMat);
    g.add(body, knot, str);
    g.scale.setScalar(L.s);
    body.userData.b = i;
    scene.add(g);
    return { L, g, body, phase: Math.random() * 6.28, base: new THREE.Vector3(), off: new THREE.Vector3(), vel: new THREE.Vector3(), popped: 0, back: 0, scale: L.s };
  });

  let W = 1, H = 1, visW = 1, visH = 1;
  function layout(){
    const r = holder.getBoundingClientRect();
    W = r.width; H = r.height;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    visW = visH * camera.aspect;
    const card = hero.querySelector('.card').getBoundingClientRect();
    const gutter = Math.max(120, (innerWidth - card.width) / 2);
    const screenH = Math.min(innerHeight, H);
    balloons.forEach((b) => {
      const px = b.L.side < 0 ? gutter * (1 - b.L.u) : innerWidth - gutter * (1 - b.L.u);
      const py = 90 + b.L.v * (screenH - 90);
      b.base.set((px / W - 0.5) * visW, (0.5 - py / H) * visH, 0);
    });
  }
  layout();
  new ResizeObserver(layout).observe(holder);

  // pointer: lean away, hover cursor, click to pop
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ptr = { x: -9999, y: -9999, on: false };
  function pick(e){
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(balloons.filter((b) => !b.popped).map((b) => b.body))[0];
    return hit ? balloons[hit.object.userData.b] : null;
  }
  addEventListener('pointermove', (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width - 0.5) * visW;
    ptr.y = (0.5 - (e.clientY - r.top) / r.height) * visH;
    ptr.on = true;
    renderer.domElement.style.cursor = pick(e) ? 'pointer' : '';
  }, { passive: true });
  renderer.domElement.addEventListener('pointerdown', (e) => { const b = pick(e); if (b) pop(b, e.clientX, e.clientY); });

  let ac = null;
  function popSound(){
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime, n = Math.floor(ac.sampleRate * 0.08), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
      const src = ac.createBufferSource(); src.buffer = buf;
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 800;
      const g = ac.createGain(); g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      src.connect(hp); hp.connect(g); g.connect(ac.destination); src.start(t);
    } catch(e){}
  }
  let pops = 0;
  function pop(b, x, y){
    b.popped = performance.now(); pops++;
    popSound();
    if (window.__burst) window.__burst(x, y, 55, Math.PI * 2, 9, [CONFETTI[b.L.c], '#FFFFFF', '#FBDF9B']);
    setTimeout(() => { b.popped = 0; b.back = performance.now(); b.off.set(0, -visH * 0.9, 0); b.vel.set(0, 0, 0); }, 3800);
    const hint = document.getElementById('popHint');
    if (hint) hint.textContent = pops === 1 ? 'Pop! There are more.' : pops + ' popped. Imagine the room.';
  }

  // run only while the hero is on screen
  let running = false, last = performance.now();
  new IntersectionObserver((en) => { running = en[0].isIntersecting; if (running){ last = performance.now(); requestAnimationFrame(loop); } }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && running){ last = performance.now(); requestAnimationFrame(loop); } });

  const tmp = new THREE.Vector3();
  function loop(now){
    if (!running || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000, sy = scrollY / H * visH;
    balloons.forEach((b, i) => {
      // spring back to rest, pushed by the pointer
      const lift = reduced ? 0 : sy * (0.25 + 0.08 * (i % 3));
      if (ptr.on && !reduced){
        tmp.set(b.base.x + b.off.x - ptr.x, b.base.y + b.off.y + lift - ptr.y, 0);
        const d = tmp.length(), R = 1.6 * b.scale;
        if (d < R && d > 0.001) b.vel.addScaledVector(tmp.normalize(), (1 - d / R) * 22 * dt);
      }
      b.vel.addScaledVector(b.off, -6 * dt);
      b.vel.multiplyScalar(1 - 2.6 * dt);
      b.off.addScaledVector(b.vel, dt);
      const bob = reduced ? 0 : Math.sin(t * 0.9 + b.phase) * 0.12;
      b.g.position.set(b.base.x + b.off.x, b.base.y + b.off.y + bob + lift, 0);
      b.g.rotation.z = reduced ? 0 : Math.sin(t * 0.7 + b.phase) * 0.06 - b.vel.x * 0.25;
      b.g.rotation.y = reduced ? b.phase : t * 0.25 + b.phase;
      let s = b.scale;
      if (b.popped){ const k = (now - b.popped) / 90; s = k < 1 ? b.scale * (1 + 0.35 * k) : 0; }
      else if (b.back){ const k = Math.min(1, (now - b.back) / 700); s = b.scale * (1 - Math.pow(1 - k, 3)); if (k >= 1) b.back = 0; }
      b.g.scale.setScalar(Math.max(s, 0.0001));
      b.g.visible = s > 0.001;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
}
