import * as THREE from 'three';

/**
 * Sky, Moon, Starfield and Khom Loi (Sky Lanterns) System
 */
export class SkyManager {
  constructor(scene) {
    this.scene = scene;
    this.lanterns = [];
    this.stars = null;
    this.starColors = null;
    this.lanternCount = 0;

    this.initSkyAndMoon();
    this.initStarfield();
    this.initLanterns(24); // Initial floating sky lanterns
  }

  initSkyAndMoon() {
    // 1. Full Moon
    const moonGeo = new THREE.SphereGeometry(18, 48, 48);

    // Procedural lunar texture using canvas
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 512;
    moonCanvas.height = 256;
    const ctx = moonCanvas.getContext('2d');

    // Base lunar pale gold/cream
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#fffdf0');
    grad.addColorStop(0.5, '#fef3c7');
    grad.addColorStop(1, '#fde68a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Subtle Maria (darker lunar plains)
    ctx.fillStyle = 'rgba(180, 160, 130, 0.25)';
    const maria = [
      { x: 160, y: 100, r: 50 },
      { x: 230, y: 80, r: 40 },
      { x: 290, y: 120, r: 65 },
      { x: 380, y: 140, r: 45 },
      { x: 200, y: 160, r: 55 }
    ];
    maria.forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });

    const moonTex = new THREE.CanvasTexture(moonCanvas);

    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTex,
      color: 0xfffae6
    });

    this.moon = new THREE.Mesh(moonGeo, moonMat);
    this.moon.position.set(-100, 130, -220); // Majestic full moon overlooking the river & temple
    this.scene.add(this.moon);

    // Moon Glow Halo (Billboard sprite)
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 256;
    haloCanvas.height = 256;
    const hCtx = haloCanvas.getContext('2d');
    const hGrad = hCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
    hGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    hGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.35)');
    hGrad.addColorStop(0.7, 'rgba(250, 204, 21, 0.1)');
    hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    hCtx.fillStyle = hGrad;
    hCtx.fillRect(0, 0, 256, 256);

    const haloTex = new THREE.CanvasTexture(haloCanvas);
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      color: 0xfff8d6,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.95
    });
    const moonHalo = new THREE.Sprite(haloMat);
    moonHalo.scale.set(135, 135, 1);
    moonHalo.position.copy(this.moon.position);
    this.scene.add(moonHalo);

    // Moonlight Directional Light (Luminous full moon casting crisp silver-gold highlights)
    this.moonLight = new THREE.DirectionalLight(0xe6f4fe, 1.85);
    this.moonLight.position.set(-100, 160, -200);
    this.moonLight.target.position.set(0, 0, 0);
    this.scene.add(this.moonLight);
    this.scene.add(this.moonLight.target);

    // Warm ambient night sky illumination (bright, clear night atmosphere)
    const ambientLight = new THREE.AmbientLight(0x2e3d56, 1.35);
    this.scene.add(ambientLight);
  }

  initStarfield() {
    const starCount = 3000;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const baseColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Hemisphere distribution
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = 350 + Math.random() * 80;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = Math.abs(radius * Math.cos(phi)) + 10; // Keep in sky
      const z = radius * Math.sin(phi) * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color variation: white, golden, pale blue
      const colorChoice = Math.random();
      let r = 1, g = 1, b = 1;
      if (colorChoice < 0.25) {
        // Gold star
        r = 1.0; g = 0.88; b = 0.6;
      } else if (colorChoice < 0.5) {
        // Blue star
        r = 0.75; g = 0.88; b = 1.0;
      }
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;

      baseColors[i * 3] = r;
      baseColors[i * 3 + 1] = g;
      baseColors[i * 3 + 2] = b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.stars = new THREE.Points(starGeo, starMat);
    this.starColors = colors;
    this.starBaseColors = baseColors;
    this.scene.add(this.stars);
  }

  createLanternMesh() {
    const group = new THREE.Group();

    // Cylindrical tapered paper lantern
    const bodyGeo = new THREE.CylinderGeometry(0.7, 0.9, 2.2, 12, 1, true);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffaa33,
      emissive: 0xff7700,
      emissiveIntensity: 3.2, // Vibrant golden-orange glow in the night sky
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Bamboo base ring
    const ringGeo = new THREE.TorusGeometry(0.9, 0.05, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3d2817 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.1;
    group.add(ring);

    // Glowing inner flame core
    const flameGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffeedd
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = -0.7;
    group.add(flame);

    return group;
  }

  initLanterns(count) {
    for (let i = 0; i < count; i++) {
      this.spawnLantern(
        (Math.random() - 0.5) * 220,
        15 + Math.random() * 120,
        -160 + Math.random() * 140
      );
    }
  }

  spawnLantern(x, y, z, isUser = false) {
    const mesh = this.createLanternMesh();
    mesh.position.set(x, y, z);

    // Random slight rotation
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.rotation.z = (Math.random() - 0.5) * 0.15;

    const lanternData = {
      mesh,
      speedY: isUser ? 0.28 + Math.random() * 0.08 : 0.14 + Math.random() * 0.08,
      speedX: 0.04 + Math.random() * 0.03, // Slight wind towards east
      swayOffset: Math.random() * 100,
      swaySpeed: 1.2 + Math.random() * 0.8,
      isUser
    };

    this.lanterns.push(lanternData);
    this.scene.add(mesh);
    this.lanternCount++;
    this.updateCounterUI();
    return lanternData;
  }

  releaseUserLantern() {
    // Spawn near the river pier or temple courtyard
    const x = -15 + (Math.random() - 0.5) * 20;
    const y = 3;
    const z = 10 + (Math.random() - 0.5) * 15;
    return this.spawnLantern(x, y, z, true);
  }

  update(time, delta) {
    // 1. Smooth Starfield Shimmer (GPU-friendly, zero CPU buffer re-upload)
    if (this.stars) {
      this.stars.material.opacity = 0.82 + 0.14 * Math.sin(time * 1.8);
    }

    // 2. Animate Sky Lanterns
    for (let i = this.lanterns.length - 1; i >= 0; i--) {
      const l = this.lanterns[i];
      l.mesh.position.y += l.speedY;
      l.mesh.position.x += l.speedX;
      l.mesh.position.z += Math.sin(time * l.swaySpeed + l.swayOffset) * 0.03;
      l.mesh.rotation.z = Math.sin(time * l.swaySpeed + l.swayOffset) * 0.05;

      // Reset when reaching extreme sky height
      if (l.mesh.position.y > 180) {
        if (l.isUser) {
          // Remove user lantern when high up
          this.scene.remove(l.mesh);
          this.lanterns.splice(i, 1);
          this.lanternCount--;
          this.updateCounterUI();
        } else {
          // Recycle natural lanterns
          l.mesh.position.y = 8 + Math.random() * 15;
          l.mesh.position.x = (Math.random() - 0.5) * 180 - 30;
          l.mesh.position.z = -140 + Math.random() * 100;
        }
      }
    }

    // Periodically spawn new natural lanterns in the distance
    if (Math.random() < 0.015 && this.lanterns.length < 90) {
      this.spawnLantern(
        (Math.random() - 0.5) * 200 - 30,
        5 + Math.random() * 10,
        -160 + Math.random() * 90
      );
    }
  }

  updateCounterUI() {
    const el = document.getElementById('stat-lanterns');
    if (el) el.textContent = this.lanterns.length;
  }
}
