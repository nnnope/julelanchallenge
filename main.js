// GitHub pages compatible imports
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js";
import { FontLoader } from "https://cdn.jsdelivr.net/npm/three@0.148.0/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://cdn.jsdelivr.net/npm/three@0.148.0/examples/jsm/geometries/TextGeometry.js";

const scene = new THREE.Scene();
scene.background = null;
const BODY_NORMAL_COLOR = new THREE.Color(0x22ff88);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// === Base Virus Body ===
const bodyGeom = new THREE.IcosahedronGeometry(1.5, 1);
const bodyMat = new THREE.MeshStandardMaterial({
  color: 0x12ff88,
  roughness: 0.1,
  metalness: 0.9,
});
const body = new THREE.Mesh(bodyGeom, bodyMat);
scene.add(body);

const BODY_WOBBLE_SPEED = 1.5;
const BODY_WOBBLE_AMPLITUDE = 0.2;
const bodyPositionAttr = bodyGeom.getAttribute('position');
const bodyVertexCount = bodyPositionAttr.count;
const bodyBasePositions = bodyPositionAttr.array.slice();
const bodyNormals = new Float32Array(bodyBasePositions.length);
const bodyPhases = new Float32Array(bodyVertexCount);
for (let i = 0; i < bodyVertexCount; i++) {
  const idx = i * 3;
  const x = bodyBasePositions[idx];
  const y = bodyBasePositions[idx + 1];
  const z = bodyBasePositions[idx + 2];
  const len = Math.hypot(x, y, z) || 1;
  bodyNormals[idx] = x / len;
  bodyNormals[idx + 1] = y / len;
  bodyNormals[idx + 2] = z / len;
  bodyPhases[i] = Math.random() * Math.PI * 2;
}

// === Accent Nodes ===
const nodeGeom = new THREE.SphereGeometry(0.08, 10, 10);
const nodeMat = new THREE.MeshStandardMaterial({
  color: 0xff3344,
  emissive: 0x220008,
  emissiveIntensity: 0.65,
  roughness: 0.05,
  metalness: 0.6,
});

const nodes = new THREE.Group();
for (let i = 0; i < 60; i++) {
  const material = nodeMat.clone();
  const node = new THREE.Mesh(nodeGeom, material);

  const dir = new THREE.Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ).normalize();

  const direction = dir.clone();
  node.position.copy(direction.clone().multiplyScalar(1.6));
  node.userData.baseScale = 0.45 + Math.random() * 0.35;
  node.userData.flickerPhase = Math.random() * Math.PI * 2;
  node.userData.flickerSpeed = 1.2 + Math.random();
  node.scale.setScalar(node.userData.baseScale);
  node.userData.material = material;
  node.userData.direction = direction;
  node.userData.baseDistance = 1.6;
  nodes.add(node);
}
scene.add(nodes);

// === Lights ===
const light1 = new THREE.PointLight(0xf1ffff, 1.4);
light1.position.set(4, 3, 5);
scene.add(light1);
const fillLight = new THREE.PointLight(0xffcc88, 0.7);
fillLight.position.set(-3, -2, 3);
scene.add(fillLight);
const ambientLight = new THREE.AmbientLight(0x99aaff, 1.1);
scene.add(ambientLight);
const hemiLight = new THREE.HemisphereLight(0x88bbff, 0x331122, 0.35);
scene.add(hemiLight);

const LIGHT_ORBIT_RADIUS = 4;
const LIGHT_VERTICAL_AMPLITUDE = 1.25;
const TEXT_GLOW_SPEED = 1.62;
const TEXT_GLOW_MIN = 1.75;
const TEXT_GLOW_MAX = 510.55;
const NODE_NORMAL_COLOR = new THREE.Color(0xff3344);
const NODE_FAIL_COLOR = new THREE.Color(0xff7755);
const NODE_SUCCESS_COLOR = new THREE.Color(0x33ff88);
const NODE_NORMAL_EMISSIVE = new THREE.Color(0x220008);
const NODE_FAIL_EMISSIVE = new THREE.Color(0x770000);
const NODE_SUCCESS_EMISSIVE = new THREE.Color(0x11ff33);
const BODY_FAIL_COLOR = new THREE.Color(0xff6655);
const BODY_SUCCESS_COLOR = new THREE.Color(0x33ff99);
const BODY_SUCCESS_SCALE_OFFSET = 0.8;
const BODY_SUCCESS_EXPLOSION_MAX = 2.0;
const BODY_SUCCESS_POSITION_OFFSET = -1.5;
const BODY_SUCCESS_POSITION_MULTIPLIER = 2.5;
let loginState = 'idle';
let explosionAmount = 0;
const FAIL_SHAKE_DURATION = 2;
let failTimer = FAIL_SHAKE_DURATION;
window.setLoginResult = (state) => {
  loginState = state;
  if (state === 'failed') {
    failTimer = 0;
  }
  if (state === 'success') {
    explosionAmount = 0;
    failTimer = FAIL_SHAKE_DURATION;
  }
};

// === Text ===
const loader = new FontLoader();
let textGlow;
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
  const textGeom = new TextGeometry('ACCOUNT LOGIN', {
    font,
    size: 0.6,
    depth: 0.2,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.03,
  });
  textGeom.center();
  textGeom.computeBoundingBox();
  const positions = textGeom.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  const baseColor = new THREE.Color(0x4f0509);
  const accentColor = new THREE.Color(0x007733);
  const vertexColor = new THREE.Color();
  const minX = textGeom.boundingBox.min.x;
  const maxX = textGeom.boundingBox.max.x;
  const highlightStart = minX + (maxX - minX) * 0.4;
  const highlightRange = Math.max(0.001, maxX - highlightStart);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const highlightAmount = Math.max(0, Math.min(1, (x - highlightStart) / highlightRange));
    vertexColor.copy(baseColor).lerp(accentColor, highlightAmount);
    colors[i * 3] = vertexColor.r;
    colors[i * 3 + 1] = vertexColor.g;
    colors[i * 3 + 2] = vertexColor.b;
  }
  textGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const textMat = new THREE.MeshPhysicalMaterial({
    color: 0x330004,
    emissive: 0x330004,
    emissiveIntensity: 1.2,
    roughness: 0.08,
    metalness: 0.9,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
    transparent: true,
    opacity: 0.95,
    vertexColors: true,
  });
  const textMesh = new THREE.Mesh(textGeom, textMat);
  textMesh.position.set(0, -2.4, 0.2);
  textMesh.rotation.y = 0.04;
  textMesh.scale.setScalar(1.04);
  scene.add(textMesh);
  textGlow = new THREE.PointLight(0x22ff88, 1.0, 5, 2);
  textGlow.position.set(0, -2.5, 1);
  scene.add(textGlow);
});

// === Animation ===
let t = 0;
function animate() {
  t += 0.02;

  body.rotation.x += 0.005;
  body.rotation.y += 0.01;

  light1.position.x = Math.cos(t * 0.65) * LIGHT_ORBIT_RADIUS;
  light1.position.z = Math.sin(t * 0.65) * LIGHT_ORBIT_RADIUS;
  light1.position.y =
    2 + Math.sin(t * 0.45) * LIGHT_VERTICAL_AMPLITUDE;

  nodes.rotation.x += 0.015;
  nodes.rotation.y += 0.038;

  const positions = bodyPositionAttr.array;
  for (let i = 0; i < bodyVertexCount; i++) {
    const idx = i * 3;
    const phase = bodyPhases[i];
    const wobble =
      Math.sin(t * BODY_WOBBLE_SPEED + phase) * BODY_WOBBLE_AMPLITUDE;
    positions[idx] = bodyBasePositions[idx] + bodyNormals[idx] * wobble;
    positions[idx + 1] =
      bodyBasePositions[idx + 1] + bodyNormals[idx + 1] * wobble;
    positions[idx + 2] =
      bodyBasePositions[idx + 2] + bodyNormals[idx + 2] * wobble;
  }
  bodyPositionAttr.needsUpdate = true;
  bodyGeom.computeVertexNormals();

  const baseScale = 1 + Math.sin(t) * 0.05;
  if (loginState !== 'success') {
    explosionAmount = 0;
  }
  let scaleScalar = baseScale;
  if (loginState === 'success') {
    explosionAmount = Math.min(explosionAmount + 0.03, BODY_SUCCESS_EXPLOSION_MAX);
    scaleScalar += BODY_SUCCESS_SCALE_OFFSET + explosionAmount * 1.4;
  }

  if (loginState === 'failed') {
    if (failTimer < FAIL_SHAKE_DURATION) {
      const jitterX = Math.sin(t * 35) * 0.03;
      const jitterY = Math.sin(t * 28) * 0.025;
      body.position.set(jitterX, jitterY, 0);
      failTimer += 0.02;
    } else {
      loginState = 'failed_idle';
      body.position.set(0, 0, 0);
    }
  } else if (loginState === 'failed_idle') {
    body.position.set(0, 0, 0);
  } else if (loginState === 'success') {
    const successDepth =
      BODY_SUCCESS_POSITION_OFFSET - explosionAmount * BODY_SUCCESS_POSITION_MULTIPLIER;
    body.position.set(0, 0, successDepth);
  } else {
    body.position.set(0, 0, 0);
  }
  body.scale.setScalar(scaleScalar);
  if (loginState === 'failed' || loginState === 'failed_idle') {
    bodyMat.color.lerp(BODY_FAIL_COLOR, 0.08);
  } else if (loginState === 'success') {
    bodyMat.color.lerp(BODY_SUCCESS_COLOR, 0.08);
  } else {
    bodyMat.color.lerp(BODY_NORMAL_COLOR, 0.04);
  }

  nodes.children.forEach((node) => {
    const flicker =
      Math.sin(t * node.userData.flickerSpeed + node.userData.flickerPhase);
    const visible = flicker > -0.25;
    node.visible = visible;
    if (visible) {
      const flickerScale = 0.6 + Math.max(0, flicker) * 0.9;
      node.scale.setScalar(node.userData.baseScale * flickerScale);
      node.userData.material.emissiveIntensity =
        0.2 + Math.max(0, flicker) * 0.9;
    }
    const distance =
      node.userData.baseDistance +
      (loginState === 'success' ? explosionAmount * 3.5 : 0);
    node.position
      .copy(node.userData.direction)
      .multiplyScalar(distance);
    if (loginState === 'failed' || loginState === 'failed_idle') {
      node.userData.material.color.lerp(NODE_FAIL_COLOR, 0.05);
      node.userData.material.emissive.lerp(NODE_FAIL_EMISSIVE, 0.05);
    } else if (loginState === 'success') {
      node.userData.material.color.lerp(NODE_SUCCESS_COLOR, 0.05);
      node.userData.material.emissive.lerp(NODE_SUCCESS_EMISSIVE, 0.05);
    } else {
      node.userData.material.color.lerp(NODE_NORMAL_COLOR, 0.04);
      node.userData.material.emissive.lerp(NODE_NORMAL_EMISSIVE, 0.04);
    }
  });

  if (textGlow) {
    const pulse = (Math.sin(t * TEXT_GLOW_SPEED) + 1) / 2;
    textGlow.intensity =
      THREE.MathUtils.lerp(TEXT_GLOW_MIN, TEXT_GLOW_MAX, pulse);
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Subtle console Easter egg for those peeking under the hood.
(function showConsoleEasterEgg() {
  const primary = 'background:#082015;color:#79ff91;padding:8px 12px;border-radius:10px 0 0 10px;font-weight:700;font-size:13px;';
  const secondary = 'background:#0a120e;color:#9ef3d1;padding:8px 12px;border-radius:0 10px 10px 0;font-size:12px;';
  console.log(
    '%cGreetings Napern — Sandefjord, December 25.%c If you solved all of this, you are a pretty good hackerman.',
    primary,
    secondary
  );
})();
