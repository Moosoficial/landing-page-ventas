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

// ===================== PRODUCT 3D SCENE =====================
let productSceneInitialized = false;
let productBoxMat = null; // Store reference to update later

function initProductScene() {
  const themeColor = window.activeProductTheme || 0x004b63; // Default teal

  if (productSceneInitialized) {
    // If already initialized, just update the color
    if (productBoxMat) {
      productBoxMat.color.setHex(themeColor);
    }
    return;
  }

  const canvas = document.getElementById('product-canvas');
  if (!canvas) return;

  if (!supportsWebGL()) {
    showFallback('product3dContainer', 'WebGL no disponible en este dispositivo.');
    return;
  }

  const container = canvas.parentElement;
  const w = container.clientWidth || 600;
  const h = container.clientHeight || 500;

  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 50);
  camera.position.set(0, 0.3, 4.5);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  productSceneInitialized = true;

  // --- Lighting ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x56f5f8, 2, 10);
  rimLight.position.set(-3, 1, 2);
  scene.add(rimLight);

  const accentLight = new THREE.PointLight(0x7c4dff, 1.2, 10);
  accentLight.position.set(2, -2, 3);
  scene.add(accentLight);

  // --- Software Box (rounded box approx) ---
  const boxGeo = new THREE.BoxGeometry(1.6, 2.2, 0.4, 4, 4, 4);
  productBoxMat = new THREE.MeshPhysicalMaterial({
    color: themeColor,
    metalness: 0.2,
    roughness: 0.3,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
  });
  const box = new THREE.Mesh(boxGeo, productBoxMat);
  scene.add(box);

  // --- Front face "label" ---
  const labelGeo = new THREE.PlaneGeometry(1.3, 1.8);
  const labelMat = new THREE.MeshPhysicalMaterial({
    color: 0x003345,
    metalness: 0.1,
    roughness: 0.5,
    emissive: 0x003345,
    emissiveIntensity: 0.15,
  });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.z = 0.201;
  box.add(label);

  // --- "CC" Text geometry (simple approach with ring and shapes) ---
  // Logo representation: a circle with inner ring
  const logoRingGeo = new THREE.RingGeometry(0.2, 0.28, 32);
  const logoMat = new THREE.MeshBasicMaterial({
    color: 0x56f5f8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  const logoRing = new THREE.Mesh(logoRingGeo, logoMat);
  logoRing.position.z = 0.01;
  logoRing.position.y = 0.3;
  label.add(logoRing);

  // Small circle in center
  const dotGeo = new THREE.CircleGeometry(0.08, 32);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x2ddbde });
  const dot = new THREE.Mesh(dotGeo, dotMat);
  dot.position.z = 0.015;
  dot.position.y = 0.3;
  label.add(dot);

  // Lower accent lines
  for (let i = 0; i < 3; i++) {
    const lineGeo = new THREE.PlaneGeometry(0.8, 0.03);
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0x96ceeb,
      transparent: true,
      opacity: 0.4 - i * 0.1,
    });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.z = 0.01;
    line.position.y = -0.2 - i * 0.12;
    label.add(line);
  }

  // --- Glow ring around box ---
  const glowRingGeo = new THREE.TorusGeometry(1.8, 0.008, 16, 100);
  const glowRingMat = new THREE.MeshBasicMaterial({
    color: 0x2ddbde,
    transparent: true,
    opacity: 0.2,
  });
  const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
  glowRing.rotation.x = Math.PI / 2;
  scene.add(glowRing);

  // --- Floating specs (small cubes) ---
  const specGroup = new THREE.Group();
  const specGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
  for (let i = 0; i < 30; i++) {
    const specMat = new THREE.MeshBasicMaterial({
      color: [0x56f5f8, 0xcdbdff, 0x96ceeb][i % 3],
      transparent: true,
      opacity: Math.random() * 0.5 + 0.2,
    });
    const spec = new THREE.Mesh(specGeo, specMat);
    const r = 1.5 + Math.random() * 1.5;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    spec.position.set(
      r * Math.sin(p) * Math.cos(t),
      r * Math.sin(p) * Math.sin(t),
      r * Math.cos(p)
    );
    spec.userData = { speed: Math.random() * 0.008 + 0.002, r, t, p };
    specGroup.add(spec);
  }
  scene.add(specGroup);

  // --- Mouse interaction ---
  let mouseProduct = { x: 0, y: 0 };
  let isDragging = false;
  let prevMouseX = 0;
  let rotationVelocity = 0;

  canvas.addEventListener('mousedown', (e) => { isDragging = true; prevMouseX = e.clientX; });
  canvas.addEventListener('mouseup', () => { isDragging = false; });
  canvas.addEventListener('mouseleave', () => { isDragging = false; });
  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      rotationVelocity = (e.clientX - prevMouseX) * 0.01;
      prevMouseX = e.clientX;
    }
    const rect = canvas.getBoundingClientRect();
    mouseProduct.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseProduct.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });

  // Touch support
  canvas.addEventListener('touchstart', (e) => { isDragging = true; prevMouseX = e.touches[0].clientX; });
  canvas.addEventListener('touchend', () => { isDragging = false; });
  canvas.addEventListener('touchmove', (e) => {
    if (isDragging) {
      rotationVelocity = (e.touches[0].clientX - prevMouseX) * 0.01;
      prevMouseX = e.touches[0].clientX;
    }
  });

  // --- Animation ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    // Skip rendering if not visible (avoids WebGL errors)
    if (canvas.clientWidth === 0 || canvas.clientHeight === 0) return;

    const t = clock.getElapsedTime();

    // Box rotation
    if (!isDragging) {
      rotationVelocity *= 0.95; // damping
      box.rotation.y += 0.005 + rotationVelocity;
    } else {
      box.rotation.y += rotationVelocity;
    }

    // Gentle float
    box.position.y = Math.sin(t * 0.8) * 0.1;
    box.rotation.x = Math.sin(t * 0.5) * 0.05 + mouseProduct.y * 0.1;

    // Glow ring
    glowRing.rotation.z = t * 0.2;
    glowRing.scale.setScalar(1 + Math.sin(t) * 0.03);

    // Floating specs
    specGroup.children.forEach(s => {
      const d = s.userData;
      d.t += d.speed;
      s.position.x = d.r * Math.sin(d.p) * Math.cos(d.t);
      s.position.y = d.r * Math.sin(d.p) * Math.sin(d.t);
      s.rotation.x += 0.02;
      s.rotation.y += 0.01;
    });

    // Rim light orbit
    rimLight.position.x = Math.cos(t * 0.4) * 3;
    rimLight.position.z = Math.sin(t * 0.4) * 3;

    renderer.render(scene, camera);
  }

  animate();

  // Resize
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  });
  ro.observe(container);
}

// ===================== INIT ON LOAD =====================
window.addEventListener('load', () => {
  setTimeout(() => {
    initHeroScene();
  }, 100);
});

// Expose product scene init globally so the SPA can call it
// when the product page becomes visible
window.initProductScene = () => {
  setTimeout(() => initProductScene(), 200);
};
