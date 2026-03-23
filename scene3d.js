/* ============================================================
   PRECISION ATELIER — Three.js 3D Interactive Scenes
   Hero: Animated geometric mesh reacting to mouse
   Product: Rotating 3D box with product textures
   ============================================================ */

import * as THREE from 'three';

// ===================== WEBGL SUPPORT CHECK =====================
function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

function showFallback(containerId, message) {
  const el = document.getElementById(containerId);
  if (el) {
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.innerHTML = `<p style="color:var(--on-surface-variant);font-size:0.9rem;text-align:center;">${message}</p>`;
  }
}

// ===================== HERO 3D SCENE =====================
function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  if (!supportsWebGL()) {
    showFallback('hero-canvas', 'Tu navegador no soporta WebGL. Actualiza tu navegador para ver el contenido 3D.');
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // --- Lighting ---
  const ambientLight = new THREE.AmbientLight(0xbfe8ff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(3, 4, 5);
  scene.add(directionalLight);

  const pointLight1 = new THREE.PointLight(0x56f5f8, 2, 15);
  pointLight1.position.set(-3, 2, 3);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x7c4dff, 1.5, 15);
  pointLight2.position.set(3, -2, 2);
  scene.add(pointLight2);

  // --- Central Icosahedron (main shape) ---
  const icoGeo = new THREE.IcosahedronGeometry(1.5, 1);
  const icoMat = new THREE.MeshPhysicalMaterial({
    color: 0x003345,
    metalness: 0.3,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transmission: 0.2,
    thickness: 0.5,
    wireframe: false,
  });
  const icosahedron = new THREE.Mesh(icoGeo, icoMat);
  scene.add(icosahedron);

  // --- Wireframe overlay ---
  const wireGeo = new THREE.IcosahedronGeometry(1.55, 1);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x56f5f8,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const wireframe = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wireframe);

  // --- Orbiting torus rings ---
  const torusGeo = new THREE.TorusGeometry(2.2, 0.015, 16, 100);
  const torusMat = new THREE.MeshBasicMaterial({
    color: 0x2ddbde,
    transparent: true,
    opacity: 0.3,
  });
  const torus1 = new THREE.Mesh(torusGeo, torusMat);
  torus1.rotation.x = Math.PI / 3;
  scene.add(torus1);

  const torus2 = new THREE.Mesh(torusGeo.clone(), torusMat.clone());
  torus2.material.color.set(0x7c4dff);
  torus2.material.opacity = 0.2;
  torus2.rotation.x = -Math.PI / 4;
  torus2.rotation.z = Math.PI / 6;
  scene.add(torus2);

  // --- Floating small spheres (particles) ---
  const particlesGroup = new THREE.Group();
  const smallSphereGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const particleColors = [0x56f5f8, 0x96ceeb, 0xcdbdff, 0x2ddbde];

  for (let i = 0; i < 60; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      transparent: true,
      opacity: Math.random() * 0.6 + 0.2,
    });
    const sphere = new THREE.Mesh(smallSphereGeo, mat);
    const radius = 2 + Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    sphere.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
    sphere.userData = { speed: Math.random() * 0.005 + 0.002, radius, theta, phi };
    particlesGroup.add(sphere);
  }
  scene.add(particlesGroup);

  // --- Mouse tracking ---
  let mouse = { x: 0, y: 0 };
  let targetRotation = { x: 0, y: 0 };

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });

  // --- Animation Loop ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Smooth follow mouse
    targetRotation.x += (mouse.y * 0.3 - targetRotation.x) * 0.05;
    targetRotation.y += (mouse.x * 0.3 - targetRotation.y) * 0.05;

    icosahedron.rotation.x = targetRotation.x + elapsed * 0.15;
    icosahedron.rotation.y = targetRotation.y + elapsed * 0.2;

    wireframe.rotation.x = targetRotation.x + elapsed * 0.15;
    wireframe.rotation.y = targetRotation.y + elapsed * 0.2;

    // Torus orbits
    torus1.rotation.z = elapsed * 0.3;
    torus2.rotation.y = elapsed * 0.2;

    // Floating particles
    particlesGroup.children.forEach(p => {
      const d = p.userData;
      d.theta += d.speed;
      p.position.x = d.radius * Math.sin(d.phi) * Math.cos(d.theta);
      p.position.y = d.radius * Math.sin(d.phi) * Math.sin(d.theta);
    });

    // Breathing scale
    const breathe = Math.sin(elapsed * 0.8) * 0.03 + 1;
    icosahedron.scale.setScalar(breathe);
    wireframe.scale.setScalar(breathe);

    // Point lights orbit
    pointLight1.position.x = Math.cos(elapsed * 0.5) * 4;
    pointLight1.position.z = Math.sin(elapsed * 0.5) * 4;
    pointLight2.position.x = Math.cos(elapsed * 0.3 + 2) * 3;
    pointLight2.position.z = Math.sin(elapsed * 0.3 + 2) * 3;

    renderer.render(scene, camera);
  }

  animate();

  // --- Resize handling ---
  const resizeObserver = new ResizeObserver(() => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  resizeObserver.observe(canvas);
}

// ===================== INIT ON LOAD =====================
window.addEventListener('load', () => {
  setTimeout(() => {
    initHeroScene();
  }, 100);
});
