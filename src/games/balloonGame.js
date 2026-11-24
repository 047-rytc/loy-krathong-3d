import * as THREE from 'three';

/**
 * Balloon Dart Mini-Game (ซุ้มปาโป่งงานวัด)
 * 3D Wooden Stall, 20 Colorful Balloons, Dart Trajectory Physics,
 * Confetti Particles, Scoring, and Rare Krathong Reward Unlock
 */
export class BalloonGame {
  constructor(scene, soundManager, onRewardUnlock) {
    this.scene = scene;
    this.sound = soundManager;
    this.onRewardUnlock = onRewardUnlock;

    this.group = new THREE.Group();
    this.group.position.set(28, 3, -52);

    this.balloons = [];
    this.flyingDarts = [];
    this.confettiParticles = [];

    this.totalDarts = 5;
    this.dartsLeft = 5;
    this.score = 0;
    this.isPlaying = false;
    this.unlockedReward = false;

    this.initStallModel();
    this.initBalloons();
    this.scene.add(this.group);
  }

  initStallModel() {
    // 1. Wooden Stall Counter & Pillars
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c2c16, roughness: 0.8 });
    const stallRoofMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.3,
      roughness: 0.5
    });

    // Stall Counter Table
    const counterGeo = new THREE.BoxGeometry(10, 2.2, 5);
    const counter = new THREE.Mesh(counterGeo, woodMat);
    counter.position.set(0, 1.1, 0);
    this.group.add(counter);

    // 4 Support Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.14, 0.14, 7.5, 8);
    [
      { x: -4.6, z: -2.2 }, { x: 4.6, z: -2.2 },
      { x: -4.6, z: 2.2 }, { x: 4.6, z: 2.2 }
    ].forEach(p => {
      const pillar = new THREE.Mesh(pillarGeo, woodMat);
      pillar.position.set(p.x, 4.8, p.z);
      this.group.add(pillar);
    });

    // Striped Fabric Roof Canopy
    const roofGeo = new THREE.ConeGeometry(7.2, 2.6, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, stallRoofMat);
    roof.position.set(0, 8.8, 0);
    this.group.add(roof);

    // Signboard: "ซุ้มปาโป่ง มหาสนุก"
    const signGeo = new THREE.BoxGeometry(7, 1.2, 0.2);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.4
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 7.6, 2.3);
    this.group.add(sign);

    // Backboard for Balloons
    const backboardGeo = new THREE.BoxGeometry(8, 4.5, 0.3);
    const backboardMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9
    });
    this.backboard = new THREE.Mesh(backboardGeo, backboardMat);
    this.backboard.position.set(0, 4.5, -2.1);
    this.group.add(this.backboard);

    // Prize Stuffed Dolls Shelves on sides
    [-3.8, 3.8].forEach(x => {
      for (let s = 1; s <= 3; s++) {
        // Shelf
        const shelfGeo = new THREE.BoxGeometry(1.6, 0.15, 1.5);
        const shelf = new THREE.Mesh(shelfGeo, woodMat);
        shelf.position.set(x, 2.0 + s * 1.3, -1.2);
        this.group.add(shelf);

        // Cute Prize Doll (teddy / doll shape)
        const dollColor = [0xec4899, 0x38bdf8, 0xfacc15, 0xa855f7][(s + Math.floor(Math.abs(x))) % 4];
        const dollMat = new THREE.MeshStandardMaterial({ color: dollColor, roughness: 0.7 });
        const dollHeadGeo = new THREE.SphereGeometry(0.35, 10, 10);
        const dollBodyGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.6, 8);

        const dollGroup = new THREE.Group();
        const head = new THREE.Mesh(dollHeadGeo, dollMat);
        head.position.y = 0.55;
        const body = new THREE.Mesh(dollBodyGeo, dollMat);
        body.position.y = 0.2;
        dollGroup.add(head);
        dollGroup.add(body);

        dollGroup.position.set(x, 2.1 + s * 1.3, -1.2);
        this.group.add(dollGroup);
      }
    });

    // Overhead Warm Bulb
    const bulbLight = new THREE.PointLight(0xffea79, 2.5, 12);
    bulbLight.position.set(0, 6.8, 0);
    this.group.add(bulbLight);

    // Interactive Stall Click Hitbox for opening game from world view
    const stallHitGeo = new THREE.BoxGeometry(10, 8, 5);
    const stallHitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.stallHitMesh = new THREE.Mesh(stallHitGeo, stallHitMat);
    this.stallHitMesh.position.set(0, 4, 0);
    this.stallHitMesh.userData = { isGameStall: true, gameType: 'balloon' };
    this.group.add(this.stallHitMesh);
  }

  initBalloons() {
    // 5 Columns x 4 Rows = 20 Balloons
    const rows = 4;
    const cols = 5;
    const startX = -2.8;
    const startY = 3.0;
    const spacingX = 1.4;
    const spacingY = 1.0;

    const balloonColors = [
      0xef4444, // Red
      0x3b82f6, // Blue
      0xfacc15, // Yellow
      0x10b981, // Green
      0xec4899, // Pink
      0xa855f7, // Purple
      0xf97316  // Orange
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = balloonColors[(r * cols + c) % balloonColors.length];
        const balloonMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.35,
          metalness: 0.1,
          emissive: color,
          emissiveIntensity: 0.2
        });

        const balloonGeo = new THREE.SphereGeometry(0.42, 16, 16);
        balloonGeo.scale(1.0, 1.25, 0.9); // Stretched balloon shape

        const mesh = new THREE.Mesh(balloonGeo, balloonMat);
        const bx = startX + c * spacingX;
        const by = startY + r * spacingY;
        const bz = -1.8;
        mesh.position.set(bx, by, bz);

        // Knot at bottom
        const knotGeo = new THREE.ConeGeometry(0.08, 0.12, 6);
        const knot = new THREE.Mesh(knotGeo, balloonMat);
        knot.position.y = -0.52;
        mesh.add(knot);

        mesh.userData = {
          isBalloon: true,
          popped: false,
          color,
          worldPos: new THREE.Vector3()
        };

        this.group.add(mesh);
        this.balloons.push(mesh);
      }
    }
  }

  startGame() {
    this.isPlaying = true;
    this.dartsLeft = this.totalDarts;
    this.score = 0;
    this.resetBalloons();
    this.updateUI();
  }

  resetBalloons() {
    this.balloons.forEach(b => {
      b.visible = true;
      b.userData.popped = false;
      b.scale.set(1, 1, 1);
    });
  }

  shootDart(targetWorldPos, cameraPos) {
    if (!this.isPlaying || this.dartsLeft <= 0) return;

    this.dartsLeft--;
    this.updateUI();

    if (this.sound) this.sound.playDartThrow();

    // Create 3D Dart Mesh
    const dart = new THREE.Group();
    const shaftGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.rotation.x = Math.PI / 2;
    dart.add(shaft);

    // Tip
    const tipGeo = new THREE.ConeGeometry(0.05, 0.2, 6);
    tipGeo.rotateX(Math.PI / 2);
    const tip = new THREE.Mesh(tipGeo, shaftMat);
    tip.position.z = -0.45;
    dart.add(tip);

    // Flights / Feathers
    const flightGeo = new THREE.BoxGeometry(0.2, 0.02, 0.25);
    const flightMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const flight = new THREE.Mesh(flightGeo, flightMat);
    flight.position.z = 0.3;
    dart.add(flight);

    // Start position slightly in front of camera
    const startPos = cameraPos.clone().add(new THREE.Vector3(0.2, -0.2, -0.5));
    dart.position.copy(startPos);
    dart.lookAt(targetWorldPos);

    this.scene.add(dart);

    const flightData = {
      mesh: dart,
      start: startPos,
      target: targetWorldPos.clone(),
      progress: 0,
      duration: 0.28 // Flight time in seconds
    };

    this.flyingDarts.push(flightData);
  }

  popBalloon(balloon) {
    balloon.userData.popped = true;
    balloon.visible = false;
    this.score++;
    this.updateUI();

    if (this.sound) this.sound.playBalloonPop();

    // Spawn Confetti Burst
    this.spawnConfetti(balloon.position.clone().add(this.group.position), balloon.userData.color);

    // Check Win Threshold (Score >= 3 unlocks Golden Lotus)
    if (this.score >= 3 && !this.unlockedReward) {
      this.unlockedReward = true;
      if (this.onRewardUnlock) {
        this.onRewardUnlock('goldenLotus', 'ดอกบัวทองคำ (Golden Lotus)');
      }
    }
  }

  spawnConfetti(centerPos, baseColor) {
    const count = 40;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = [];

    const color1 = new THREE.Color(baseColor);
    const color2 = new THREE.Color(0xfacc15); // Gold
    const color3 = new THREE.Color(0xffffff);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = centerPos.x;
      positions[i * 3 + 1] = centerPos.y;
      positions[i * 3 + 2] = centerPos.z;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.5;
      velocities.push(new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 4.0 + 1.0,
        Math.sin(angle) * speed
      ));

      const c = Math.random() < 0.5 ? color1 : (Math.random() < 0.8 ? color2 : color3);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 1.0
    });

    const particles = new THREE.Points(geo, mat);
    particles.userData = { velocities, age: 0, maxAge: 1.0 };
    this.scene.add(particles);
    this.confettiParticles.push(particles);
  }

  update(delta) {
    // 1. Update Flying Darts
    for (let i = this.flyingDarts.length - 1; i >= 0; i--) {
      const fd = this.flyingDarts[i];
      fd.progress += delta / fd.duration;

      // Arc trajectory
      const t = Math.min(fd.progress, 1.0);
      fd.mesh.position.lerpVectors(fd.start, fd.target, t);
      fd.mesh.position.y += Math.sin(t * Math.PI) * 0.4; // Arc dip

      if (fd.progress >= 1.0) {
        // Hit target: check balloon hit
        this.checkDartHit(fd.target);

        // Remove dart after brief delay
        setTimeout(() => this.scene.remove(fd.mesh), 600);
        this.flyingDarts.splice(i, 1);

        // Check end of game
        if (this.dartsLeft === 0 && this.flyingDarts.length === 0) {
          setTimeout(() => this.checkGameOver(), 400);
        }
      }
    }

    // 2. Update Confetti Particles
    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const cp = this.confettiParticles[i];
      cp.userData.age += delta;

      const pos = cp.geometry.attributes.position.array;
      const vels = cp.userData.velocities;

      for (let j = 0; j < vels.length; j++) {
        vels[j].y -= 9.8 * delta; // Gravity
        pos[j * 3] += vels[j].x * delta;
        pos[j * 3 + 1] += vels[j].y * delta;
        pos[j * 3 + 2] += vels[j].z * delta;
      }
      cp.geometry.attributes.position.needsUpdate = true;
      cp.material.opacity = 1.0 - (cp.userData.age / cp.userData.maxAge);

      if (cp.userData.age >= cp.userData.maxAge) {
        this.scene.remove(cp);
        this.confettiParticles.splice(i, 1);
      }
    }
  }

  checkDartHit(hitWorldPos) {
    // Find closest unpopped balloon within radius
    for (let b of this.balloons) {
      if (b.userData.popped) continue;

      const balloonWorld = b.position.clone().add(this.group.position);
      if (balloonWorld.distanceTo(hitWorldPos) < 0.75) {
        this.popBalloon(b);
        break;
      }
    }
  }

  checkGameOver() {
    const endOverlay = document.getElementById('balloon-gameover');
    const endTitle = document.getElementById('bgo-title');
    const endScore = document.getElementById('bgo-score');
    const endReward = document.getElementById('bgo-reward');

    if (!endOverlay) return;

    endScore.textContent = `คะแนนที่ทำได้: ${this.score} / ${this.totalDarts}`;

    if (this.score >= 3) {
      endTitle.textContent = '🎉 ยินดีด้วย! คุณชนะซุ้มปาโป่ง!';
      endReward.innerHTML = '✨ <strong>ปลดล็อกของแต่งกระทงแรร์:</strong> ดอกบัวทองคำ (Golden Lotus)';
      if (this.sound) this.sound.playCheerReward();
    } else {
      endTitle.textContent = 'เสียดายจัง! พลาดไปนิดเดียว';
      endReward.innerHTML = '💡 ปาโดน 3 ลูกขึ้นไปเพื่อปลดล็อกรางวัลพิเศษ';
    }

    endOverlay.classList.remove('hidden');
  }

  updateUI() {
    const elDarts = document.getElementById('bg-darts-count');
    const elScore = document.getElementById('bg-score-count');
    if (elDarts) elDarts.textContent = this.dartsLeft;
    if (elScore) elScore.textContent = this.score;
  }
}
