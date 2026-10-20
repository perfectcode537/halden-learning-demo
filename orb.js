// Soft 3D "knowledge" form for the Approach section, rendered only while visible.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('.orb');
if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.z = 6.2;

  const group = new THREE.Group();
  scene.add(group);

  // smooth sage knot
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.05, 0.34, 220, 32, 2, 3),
    new THREE.MeshPhysicalMaterial({ color: 0x8BA595, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.2, sheen: 1, sheenColor: 0xF6F2EA })
  );
  group.add(knot);

  // small clay satellite
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 48, 48),
    new THREE.MeshPhysicalMaterial({ color: 0xC4876A, roughness: 0.35, clearcoat: 1 })
  );
  group.add(dot);

  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0x4F6B5C, 1.4));
  const key = new THREE.DirectionalLight(0xFFF4E6, 2.4); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xD9E6DD, 1.6); rim.position.set(-4, -2, -3); scene.add(rim);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  let visible = false, raf = 0, mx = 0, my = 0;
  window.addEventListener('pointermove', e => {
    mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5;
  });
  const clock = new THREE.Clock();
  const loop = () => {
    const t = clock.getElapsedTime();
    knot.rotation.x = t * 0.25 + window.scrollY * 0.0012;
    knot.rotation.y = t * 0.35;
    group.rotation.x += (my * 0.5 - group.rotation.x) * 0.05;
    group.rotation.y += (mx * 0.7 - group.rotation.y) * 0.05;
    dot.position.set(Math.cos(t * 0.9) * 1.9, Math.sin(t * 1.3) * 0.6, Math.sin(t * 0.9) * 1.9);
    renderer.render(scene, camera);
    if (visible) raf = requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { resize(); loop(); }
  }).observe(canvas);
}
