import * as THREE from 'three';

/**
 * Dunk Tank Mini-Game (ซุ้มสาวน้อยตกน้ำ)
 * 3D Transparent Water Tank, Collapsible Seat Plank, 3D Character,
 * Red Bullseye Target, Ball Physics, Water Splash Particles, and Rare Reward Unlock
 */
export class DunkTankGame {
  constructor(scene, soundManager, onRewardUnlock) {
    this.scene = scene;
    this.sound = soundManager;
    this.onRewardUnlock = onRewardUnlock;

    this.group = new THREE.Group();
    this.group.position.set(78, 3, -52);

    this.ballsLeft = 3;
    this.hasDunked = false;
    this.isPlaying = false;
    this.unlockedReward = false;

    this.flyingBalls = [];
    this.splashParticles = [];

    this.initStallModel();
    this.scene.add(this.group);
  }

  initStallModel() {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c2c16, roughness: 0.8 });

    // 1. Transparent Clear Acrylic Water Tank (ถังน้ำใส)
    const tankGeo = new THREE.CylinderGeometry(2.4, 2.2, 3.2, 24);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7,
      ior: 1.33
    });
    this.tankMesh = new THREE.Mesh(tankGeo, glassMat);
    this.tankMesh.position.set(0, 1.6, 0);
    this.group.add(this.tankMesh);

    // Water inside Tank
    const waterGeo = new THREE.CylinderGeometry(2.3, 2.1, 2.6, 24);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85
    });
    const tankWater = new THREE.Mesh(waterGeo, waterMat);
    tankWater.position.set(0, 1.4, 0);
    this.group.add(tankWater);

    // Metal Base Rim & Tank Stand
    const rimGeo = new THREE.TorusGeometry(2.45, 0.1, 8, 24);
    const topRim = new THREE.Mesh(rimGeo, metalMat);
    topRim.rotation.x = Math.PI / 2;
    topRim.position.y = 3.2;
    this.group.add(topRim);

    // 2. Protective Wire Mesh Cage Behind Tank
    const cageFrameGeo = new THREE.BoxGeometry(5.2, 6.0, 0.2);
    const cageMat = new THREE.MeshStandardMaterial({ color: 0x334155, wireframe: true });
    const cage = new THREE.Mesh(cageFrameGeo, cageMat);
    cage.position.set(0, 5.0, -1.2);
    this.group.add(cage);

    // 3. Collapsible Seat Plank Mechanism (แท่นนั่งแบบพับได้)
    this.seatPivot = new THREE.Group();
    this.seatPivot.position.set(0, 4.4, -0.6); // Pivot point at back of tank

    const plankGeo = new THREE.BoxGeometry(1.6, 0.15, 1.8);
    const plankMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });
    this.plankMesh = new THREE.Mesh(plankGeo, plankMat);
    this.plankMesh.position.set(0, 0, 0.9);
    this.seatPivot.add(this.plankMesh);
    this.group.add(this.seatPivot);

    // 4. Stylized 3D Character Sitting on the Plank
    this.charGroup = new THREE.Group();
    this.charGroup.position.set(0, 4.5, 0.3);
    this.initCharacter();
    this.group.add(this.charGroup);

    // 5. Target Bullseye Mechanism (เป้าปาลูกบอลสีแดง)
    this.targetGroup = new THREE.Group();
    this.targetGroup.position.set(3.4, 4.2, 0);

    // Metal Arm connecting tank to target
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.4, 6);
    const arm = new THREE.Mesh(armGeo, metalMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.x = -1.7;
    this.targetGroup.add(arm);

    // Red Bullseye Disc
    const discGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.12, 24);
    discGeo.rotateX(Math.PI / 2);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.3 });
    const disc = new THREE.Mesh(discGeo, redMat);
    this.targetGroup.add(disc);

    // Concentric White & Yellow Ring
    const innerRingGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.14, 24);
    innerRingGeo.rotateX(Math.PI / 2);
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const innerRing = new THREE.Mesh(innerRingGeo, whiteMat);
    this.targetGroup.add(innerRing);

    const centerGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.16, 16);
    centerGeo.rotateX(Math.PI / 2);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.4 });
    const centerDot = new THREE.Mesh(centerGeo, goldMat);
    this.targetGroup.add(centerDot);

    // Target Hitbox for Raycasting
    const targetHitGeo = new THREE.SphereGeometry(1.0, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.targetHitMesh = new THREE.Mesh(targetHitGeo, hitMat);
    this.targetHitMesh.userData = { isDunkTarget: true };
    this.targetGroup.add(this.targetHitMesh);

    this.group.add(this.targetGroup);

    // Canopy Roof & Festive Signboard: "ซุ้มสาวน้อยตกน้ำ"
    const roofGeo = new THREE.ConeGeometry(5.2, 2.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.3
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 8.2, 0);
    this.group.add(roof);

    const signGeo = new THREE.BoxGeometry(6.5, 1.2, 0.2);
    const signMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.4 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 7.2, 1.8);
    this.group.add(sign);

    // Interactive Stall Click Hitbox from world view
    const stallHitGeo = new THREE.BoxGeometry(9, 8, 5);
    const stallHitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.stallHitMesh = new THREE.Mesh(stallHitGeo, stallHitMat);
    this.stallHitMesh.position.set(0, 4, 0);
    this.stallHitMesh.userData = { isGameStall: true, gameType: 'dunkTank' };
    this.group.add(this.stallHitMesh);
  }

  initCharacter() {
    // Cute stylized 3D character in traditional festive outfit
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.5 });
    const dressMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xbe185d, emissiveIntensity: 0.3 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

    // Head
    const headGeo = new THREE.SphereGeometry(0.42, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.35;
    this.charGroup.add(head);

    // Hair Bun
    const hairGeo = new THREE.SphereGeometry(0.46, 12, 12);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.48, -0.08);
    this.charGroup.add(hair);

    // Body (Torso with pink festive shirt)
    const bodyGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.75, 12);
    const body = new THREE.Mesh(bodyGeo, dressMat);
    body.position.y = 0.75;
    this.charGroup.add(body);

    // Legs sitting over the plank
    [-0.18, 0.18].forEach(x => {
      const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8);
      const leg = new THREE.Mesh(legGeo, skinMat);
      leg.position.set(x, 0.1, 0.3);
      this.charGroup.add(leg);
    });

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
    [-0.38, 0.38].forEach((x, idx) => {
      const arm = new THREE.Mesh(armGeo, skinMat);
      arm.position.set(x, 0.75, 0.1);
      arm.rotation.z = idx === 0 ? 0.3 : -0.3;
      this.charGroup.add(arm);
    });
  }

  startGame() {
    this.isPlaying = true;
    this.ballsLeft = 3;
    this.hasDunked = false;
    this.resetCharacter();
    this.updateUI();
  }

  resetCharacter() {
    this.charGroup.position.set(0, 4.5, 0.3);
    this.charGroup.rotation.set(0, 0, 0);
    this.seatPivot.rotation.x = 0;
    this.targetGroup.rotation.y = 0;
    this.hasDunked = false;
  }

  throwBall(targetWorldPos, cameraPos) {
    if (!this.isPlaying || this.ballsLeft <= 0 || this.hasDunked) return;

    this.ballsLeft--;
    this.updateUI();

    if (this.sound) this.sound.playBallThrow();

    // Create 3D Tennis / Carnival Ball
    const ballGeo = new THREE.SphereGeometry(0.25, 12, 12);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.6
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);

    const startPos = cameraPos.clone().add(new THREE.Vector3(0.2, -0.2, -0.5));
    ballMesh.position.copy(startPos);
    this.scene.add(ballMesh);

    const flightData = {
      mesh: ballMesh,
      start: startPos,
      target: targetWorldPos.clone(),
      progress: 0,
      duration: 0.35
    };

    this.flyingBalls.push(flightData);
  }

  triggerDunk() {
    this.hasDunked = true;

    // 1. Target hit clank
    if (this.sound) this.sound.playTargetHit();

    // Target arm swings back
    this.targetGroup.rotation.y = -0.5;

    // 2. Plank hinges downward
    this.seatPivot.rotation.x = 1.2;

    // 3. Character drops down with animation into the water!
    let dropProgress = 0;
    const startY = 4.5;
    const waterY = 1.6;

    const dropAnim = () => {
      dropProgress += 0.08;
      if (dropProgress < 1.0) {
        this.charGroup.position.y = THREE.MathUtils.lerp(startY, waterY, dropProgress * dropProgress);
        this.charGroup.rotation.x = dropProgress * 0.4;
        requestAnimationFrame(dropAnim);
      } else {
        this.charGroup.position.y = waterY;

        // Splashing into the water!
        if (this.sound) {
          this.sound.playDunkSplash();
          this.sound.playCheerReward();
        }

        this.spawnWaterSplash(this.tankMesh.position.clone().add(this.group.position));

        // Unlock Rare Rewards: Mini Golden Crown & Celestial Sparkle Aura!
        if (!this.unlockedReward) {
          this.unlockedReward = true;
          if (this.onRewardUnlock) {
            this.onRewardUnlock('crown', 'มงกุฎจิ๋วมงคล (Mini Golden Crown)');
            this.onRewardUnlock('sparkleAura', 'ออร่าประกายแสงสวรรค์ (Celestial Sparkle Aura)');
          }
        }

        setTimeout(() => this.checkGameOver(true), 600);
      }
    };

    requestAnimationFrame(dropAnim);
  }

  spawnWaterSplash(centerPos) {
    const count = 55;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = [];

    const waterColor = new THREE.Color(0x38bdf8);
    const foamColor = new THREE.Color(0xffffff);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = centerPos.x;
      positions[i * 3 + 1] = centerPos.y + 1.2;
      positions[i * 3 + 2] = centerPos.z;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      velocities.push(new THREE.Vector3(
        Math.cos(angle) * speed,
        5.0 + Math.random() * 6.0, // Fountain upward
        Math.sin(angle) * speed
      ));

      const c = Math.random() < 0.6 ? waterColor : foamColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });

    const particles = new THREE.Points(geo, mat);
    particles.userData = { velocities, age: 0, maxAge: 1.2 };
    this.scene.add(particles);
    this.splashParticles.push(particles);
  }

  update(delta) {
    // 1. Flying balls
    for (let i = this.flyingBalls.length - 1; i >= 0; i--) {
      const fb = this.flyingBalls[i];
      fb.progress += delta / fb.duration;

      const t = Math.min(fb.progress, 1.0);
      fb.mesh.position.lerpVectors(fb.start, fb.target, t);
      fb.mesh.position.y += Math.sin(t * Math.PI) * 0.35;

      if (fb.progress >= 1.0) {
        // Hit check against target
        const targetWorld = this.targetGroup.position.clone().add(this.group.position);
        if (fb.target.distanceTo(targetWorld) < 1.3 && !this.hasDunked) {
          this.triggerDunk();
        }

        setTimeout(() => this.scene.remove(fb.mesh), 500);
        this.flyingBalls.splice(i, 1);

        if (this.ballsLeft === 0 && !this.hasDunked && this.flyingBalls.length === 0) {
          setTimeout(() => this.checkGameOver(false), 500);
        }
      }
    }

    // 2. Splash droplets
    for (let i = this.splashParticles.length - 1; i >= 0; i--) {
      const sp = this.splashParticles[i];
      sp.userData.age += delta;

      const pos = sp.geometry.attributes.position.array;
      const vels = sp.userData.velocities;

      for (let j = 0; j < vels.length; j++) {
        vels[j].y -= 9.8 * 1.5 * delta;
        pos[j * 3] += vels[j].x * delta;
        pos[j * 3 + 1] += vels[j].y * delta;
        pos[j * 3 + 2] += vels[j].z * delta;
      }
      sp.geometry.attributes.position.needsUpdate = true;
      sp.material.opacity = 1.0 - (sp.userData.age / sp.userData.maxAge);

      if (sp.userData.age >= sp.userData.maxAge) {
        this.scene.remove(sp);
        this.splashParticles.splice(i, 1);
      }
    }
  }

  checkGameOver(didWin) {
    const endOverlay = document.getElementById('dunk-gameover');
    const endTitle = document.getElementById('dgo-title');
    const endScore = document.getElementById('dgo-score');
    const endReward = document.getElementById('dgo-reward');

    if (!endOverlay) return;

    if (didWin) {
      endTitle.textContent = '🌊 ตกน้ำตูมสนั่น! คุณทำสำเร็จ!';
      endScore.textContent = `ใช้ลูกบอล: ${3 - this.ballsLeft} / 3 ลูก`;
      endReward.innerHTML = '✨ <strong>ปลดล็อกของแต่งกระทงแรร์:</strong> มงกุฎจิ๋วมงคล & ออร่าประกายแสงสวรรค์!';
    } else {
      endTitle.textContent = 'ลูกบอลหมดแล้ว! พลาดเป้าไปนิดเดียว';
      endScore.textContent = 'ยังไม่โดนเป้าสีแดง';
      endReward.innerHTML = '💡 ลองเล็งตรงกลางเป้าสีแดงแล้วปาอีกครั้งนะ!';
    }

    endOverlay.classList.remove('hidden');
  }

  updateUI() {
    const elBalls = document.getElementById('dt-balls-count');
    if (elBalls) elBalls.textContent = this.ballsLeft;
  }
}
