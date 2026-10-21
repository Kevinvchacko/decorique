// Decorique: the photo Ferris wheel, in 3D.
// The handmade wheel from the price list, built from light wood with red joints, a ring of fairy lights,
// and eight of Decorique's own photos riding it as polaroids. It turns slowly on its own, spins with the
// scroll, can be dragged (mouse or thumb), and a polaroid lifts toward you under the pointer.
// Starts when the section is near; stays a still frame for reduced motion; the real photo stays
// visible when WebGL is missing.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const stage = document.getElementById('wheelStage');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function webgl(){ try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch(e){ return false; } }

if (stage && webgl()){
  const io = new IntersectionObserver((en) => { if (en[0].isIntersecting){ io.disconnect(); start(); } }, { rootMargin: '600px 0px' });
  io.observe(stage);
}

function start(){
  const PHOTOS = ['tent-gift', 'redroom-friends', 'racing-guest', 'rooftop', 'vogue-cover', 'tent-balloons', 'redroom-portrait', 'spider-room'];
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.2, 11.5);
  scene.add(new THREE.AmbientLight(0xffe7c4, 0.5));
  const warm = new THREE.PointLight(0xffc37a, 30, 18, 1.6); warm.position.set(0, 0.5, 3.5); scene.add(warm);
  const key = new THREE.DirectionalLight(0xfff4e6, 1.2); key.position.set(-3, 5, 6); scene.add(key);

  const R = 2.35, DEPTH = 0.42;
  const wood = new THREE.MeshStandardMaterial({ color: 0xe9cfa6, roughness: 0.62 });
  const joint = new THREE.MeshStandardMaterial({ color: 0xc8372d, roughness: 0.4 });
  const wheel = new THREE.Group();
  const all = new THREE.Group(); all.add(wheel); scene.add(all);

  function rod(a, b, r, mat){
    const d = new THREE.Vector3().subVectors(b, a), len = d.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return m;
  }
  const N = 8;
  for (const z of [-DEPTH / 2, DEPTH / 2]){
    const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(R, 0.045, 10, 120), wood); rimMesh.position.z = z; wheel.add(rimMesh);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(R * 0.42, 0.035, 8, 80), wood); inner.position.z = z; wheel.add(inner);
    for (let i = 0; i < N; i++){
      const a = (i / N) * Math.PI * 2, a2 = ((i + 0.5) / N) * Math.PI * 2;
      const p = new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, z);
      wheel.add(rod(new THREE.Vector3(0, 0, z), p, 0.035, wood));
      // the crossed struts between rim and inner ring, like the handmade one
      wheel.add(rod(new THREE.Vector3(Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.42, z), new THREE.Vector3(Math.cos(a2) * R, Math.sin(a2) * R, z), 0.022, wood));
      const j = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), joint); j.position.copy(p); wheel.add(j);
    }
  }
  for (let i = 0; i < N; i++){
    const a = (i / N) * Math.PI * 2;
    wheel.add(rod(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, -DEPTH / 2), new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, DEPTH / 2), 0.03, wood));
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, DEPTH + 0.3, 24), joint); hub.rotation.x = Math.PI / 2; wheel.add(hub);

  // fairy lights around the rim: tiny warm bulbs with a soft glow sprite
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,226,160,1)'); r.addColorStop(0.25, 'rgba(255,200,110,.55)'); r.addColorStop(1, 'rgba(255,180,90,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe2a0 });
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const bulbs = [];
  for (let i = 0; i < 48; i++){
    const a = (i / 48) * Math.PI * 2, rr = R + 0.12;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), bulbMat); b.position.set(Math.cos(a) * rr, Math.sin(a) * rr, DEPTH / 2 + 0.02);
    const s = new THREE.Sprite(glowMat.clone()); s.scale.setScalar(0.42); s.position.copy(b.position);
    wheel.add(b, s); bulbs.push(s);
  }

  // the stand
  const legY = -R - 1.9;
  for (const z of [-DEPTH / 2 - 0.16, DEPTH / 2 + 0.16]){
    all.add(rod(new THREE.Vector3(0, 0, z), new THREE.Vector3(-1.5, legY, z), 0.055, wood));
    all.add(rod(new THREE.Vector3(0, 0, z), new THREE.Vector3(1.5, legY, z), 0.055, wood));
    all.add(rod(new THREE.Vector3(-0.98, legY * 0.66, z), new THREE.Vector3(0.98, legY * 0.66, z), 0.035, wood));
  }
  all.add(rod(new THREE.Vector3(-1.9, legY, 0), new THREE.Vector3(1.9, legY, 0), 0.06, wood));

  // the polaroids
  const loader = new THREE.TextureLoader();
  // the card is drawn first and the photo after it, pulled forward, so the two never fight over the same depth
  const paper = new THREE.MeshStandardMaterial({ color: 0xf4ecdd, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const cards = [];
  PHOTOS.forEach((name, i) => {
    const a = (i / N) * Math.PI * 2 + Math.PI / N;
    const pivot = new THREE.Group(); pivot.position.set(Math.cos(a) * R, Math.sin(a) * R, DEPTH / 2 + 0.16);
    const swing = new THREE.Group(); pivot.add(swing);
    const card = new THREE.Group(); card.position.y = -0.92; swing.add(card);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 1.32), paper); card.add(back);
    const tex = loader.load('img/' + name + '.jpg', (t) => { fit(t, 0.9 / 0.98); dirty = true; });
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.98), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    photo.position.set(0, 0.1, 0.012); photo.renderOrder = 1; card.add(photo);
    swing.add(rod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.28, 0), 0.012, joint));
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.03), joint); clip.position.set(0, -0.3, 0.01); swing.add(clip);
    wheel.add(pivot);
    photo.userData.c = i; back.userData.c = i;
    cards.push({ pivot, swing, card, hit: [photo, back], lift: 0, phase: Math.random() * 6 });
  });
  function fit(t, aspect){
    const img = t.image, ia = img.width / img.height;
    if (ia > aspect){ t.repeat.set(aspect / ia, 1); t.offset.set((1 - aspect / ia) / 2, 0); }
    else { t.repeat.set(1, ia / aspect); t.offset.set(0, (1 - ia / aspect) / 2); }
  }

  // sizing
  function size(){
    const r = stage.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    // fit the whole wheel and its stand (about 8 units tall, 7 wide) with some air around it
    const needH = 9.8, needW = 7.6, half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.z = Math.max(needH / (2 * half), needW / (2 * half * camera.aspect));
    camera.position.y = -0.9;
    camera.lookAt(0, -0.9, 0);
    camera.updateProjectionMatrix();
    dirty = true;
  }

  // motion: a slow turn of its own, a nudge from the scroll, and drag with inertia.
  // Speeds are capped, so a quick flick or a fast scroll can never send it spinning wildly.
  const MAXV = 3.5;
  let angle = 0, vel = reduced ? 0 : 0.12, idle = reduced ? 0 : 0.12, drag = null, lastScroll = scrollY, hover = -1, dirty = true;
  const clampV = (v) => Math.max(-MAXV, Math.min(MAXV, v));
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  const el = renderer.domElement;
  el.style.touchAction = 'pan-y';
  el.addEventListener('pointerdown', (e) => { drag = { t: performance.now(), lastX: e.clientX }; vel = 0; el.setPointerCapture(e.pointerId); wake(); });
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    if (!reduced){ tilt.tx = ndc.x * 0.12; tilt.ty = ndc.y * 0.08; }
    if (drag){
      const now = performance.now(), dx = e.clientX - drag.lastX, dt = Math.max(0.016, (now - drag.t) / 1000);
      angle -= dx * 0.006;
      vel = clampV(vel * 0.6 + (-dx * 0.006 / dt) * 0.4);   // smoothed, so the release speed matches the hand
      drag.lastX = e.clientX; drag.t = now;
    }
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(cards.flatMap((c) => c.hit))[0];
    hover = hit ? hit.object.userData.c : -1;
    el.style.cursor = drag ? 'grabbing' : hover > -1 ? 'pointer' : 'grab';
    wake();
  });
  const end = () => { if (drag && performance.now() - drag.t > 80) vel = 0; drag = null; wake(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', () => { hover = -1; tilt.tx = tilt.ty = 0; wake(); });
  addEventListener('scroll', () => { const d = scrollY - lastScroll; lastScroll = scrollY; if (!reduced && !drag && visible) { vel = clampV(vel + Math.max(-30, Math.min(30, d)) * 0.004); wake(); } }, { passive: true });
  const spin = document.getElementById('wheelSpin');
  if (spin) spin.addEventListener('click', () => { vel = clampV(vel + 2.6); wake(); });

  function draw(dt){
    const k = Math.min(1, dt * 9);
    let moving = false;
    wheel.rotation.z = angle;
    cards.forEach((c, i) => {
      c.pivot.rotation.z = -angle;                     // the polaroids hang upright as the wheel turns
      const target = hover === i ? 1 : 0, prev = c.lift;
      c.lift += (target - c.lift) * k;
      if (Math.abs(c.lift - prev) > 0.001) moving = true;
      c.card.position.z = 0.02 + c.lift * 0.6;
      c.card.scale.setScalar(1 + c.lift * 0.22);
    });
    tilt.x += (tilt.tx - tilt.x) * Math.min(1, dt * 4); tilt.y += (tilt.ty - tilt.y) * Math.min(1, dt * 4);
    all.rotation.y = -0.18 + tilt.x; all.rotation.x = tilt.y;
    renderer.render(scene, camera);
    return moving || Math.abs(tilt.tx - tilt.x) > 0.001;
  }

  // one loop, running only while the wheel is on screen and something is moving
  let visible = false, looping = false, last = performance.now();
  function wake(){ dirty = true; if (visible && !looping){ looping = true; last = performance.now(); requestAnimationFrame(loop); } }
  function loop(now){
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!drag){ vel += (idle - vel) * Math.min(1, dt * (reduced ? 4 : 0.9)); angle += vel * dt; }
    const t = now / 1000;
    cards.forEach((c) => { c.swing.rotation.z = (reduced ? 0 : Math.sin(t * 1.3 + c.phase) * 0.05) - vel * 0.03; });
    if (!reduced) bulbs.forEach((b, i) => { b.material.opacity = 0.65 + 0.35 * Math.sin(t * 2.2 + i * 0.9); });
    const anim = draw(dt); dirty = false;
    const still = Math.abs(vel) < 0.002 && !drag && !anim;
    if (visible && (!reduced || !still)) requestAnimationFrame(loop); else looping = false;
  }
  new ResizeObserver(size).observe(stage); size();
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) wake(); }).observe(stage);
  setInterval(() => { if (dirty && !looping && visible) wake(); }, 250);
  stage.classList.add('on');
}
