import * as THREE from 'three';

/**
 * 3D Fireworks Particle System with Rocket Ascent, Multi-color Bursts,
 * Gravity, Spark Trails, and Flash Lighting
 */
export class FireworksManager {
  constructor(scene, soundManager) {
    this.scene = scene;
    this.sound = soundManager;
    this.fireworks = [];

    // Festive Color Palettes for Bursts
    this.palettes = [
      [0xffdd00, 0xff9900, 0xff3300], // Golden Orange
      [0xff007f, 0xff33cc, 0xffffff], // Royal Magenta
      [0x00ffff, 0x0088ff, 0x7000ff], // Electric Cyan & Blue
      [0x39ff14, 0x00ff88, 0xffff00], // Emerald Lime
      [0xff2222, 0xffe066, 0xffffff], // Thai Ruby & Gold
      [0xa855f7, 0xec4899, 0x38bdf8]  // Carnival Rainbow
    ];
  }

  launch(targetX, targetY, targetZ) {
    // Sound launch whistle
    if (this.sound) this.sound.playFireworkLaunch();

    // Launch origin from ground near riverbank
    const startX = targetX + (Math.random() - 0.5) * 20;
    const startY = 1;
    const startZ = targetZ + (Math.random() - 0.5) * 20;

    // Rocket Mesh (Bright glowing tip)
    const rocketGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const rocketMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const rocketMesh = new THREE.Mesh(rocketGeo, rocketMat);
    rocketMesh.position.set(startX, startY, startZ);
    this.scene.add(rocketMesh);

    // Rocket Trail Light
    const rocketLight = new THREE.PointLight(0xffaa22, 2.0, 15);
    rocketLight.position.copy(rocketMesh.position);
    this.scene.add(rocketLight);

    const palette = this.palettes[Math.floor(Math.random() * this.palettes.length)];

    const firework = {
      state: 'rocket',
      mesh: rocketMesh,
      light: rocketLight,
      pos: new THREE.Vector3(startX, startY, startZ),
      target: new THREE.Vector3(targetX, targetY, targetZ),
      velocity: new THREE.Vector3(
        (targetX - startX) / 0.85,
        (targetY - startY) / 0.85,
        (targetZ - startZ) / 0.85
      ),
      timeAlive: 0,
      maxFlightTime: 0.85,
      palette,
      particles: null
    };

    this.fireworks.push(firework);
    return firework;
  }

  explode(fw) {
    // Remove rocket mesh & rocket light
    this.scene.remove(fw.mesh);
    this.scene.remove(fw.light);

    // Trigger explosive audio
    if (this.sound) this.sound.playFireworkBurst();

    // Explosion Flash Point Light
    const flashColor = fw.palette[0];
    const flashLight = new THREE.PointLight(flashColor, 8.0, 120);
    flashLight.position.copy(fw.pos);
    this.scene.add(flashLight);

    // Create 180 Particles with varied velocities in a sphere
    const count = 180;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = [];

    const baseColor1 = new THREE.Color(fw.palette[0]);
    const baseColor2 = new THREE.Color(fw.palette[1]);
    const baseColor3 = new THREE.Color(fw.palette[2] || 0xffffff);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = fw.pos.x;
      positions[i * 3 + 1] = fw.pos.y;
      positions[i * 3 + 2] = fw.pos.z;

      // Spherical expansion with slight randomness
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const speed = 14 + Math.random() * 22;

      velocities.push(new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta),
        speed * Math.cos(phi)
      ));

      // Color selection
      const pick = Math.random();
      const c = pick < 0.5 ? baseColor1 : (pick < 0.85 ? baseColor2 : baseColor3);
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
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(geo, mat);
    this.scene.add(particleSystem);

    fw.state = 'burst';
    fw.particles = particleSystem;
    fw.velocities = velocities;
    fw.flashLight = flashLight;
    fw.burstTime = 0;
    fw.burstMaxTime = 1.6;
  }

  update(delta) {
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i];

      if (fw.state === 'rocket') {
        fw.timeAlive += delta;
        const progress = Math.min(fw.timeAlive / fw.maxFlightTime, 1.0);

        // Lerp position with slight deceleration
        fw.pos.addScaledVector(fw.velocity, delta);
        fw.mesh.position.copy(fw.pos);
        fw.light.position.copy(fw.pos);

        if (fw.timeAlive >= fw.maxFlightTime) {
          this.explode(fw);
        }
      } else if (fw.state === 'burst') {
        fw.burstTime += delta;
        const progress = fw.burstTime / fw.burstMaxTime;

        // Fade flash light quickly
        if (fw.flashLight) {
          fw.flashLight.intensity = Math.max(0, 8.0 * (1 - progress * 3.5));
          if (fw.flashLight.intensity <= 0) {
            this.scene.remove(fw.flashLight);
            fw.flashLight = null;
          }
        }

        // Update particles with gravity and air drag
        const positions = fw.particles.geometry.attributes.position.array;
        for (let j = 0; j < fw.velocities.length; j++) {
          const v = fw.velocities[j];
          v.y -= 9.8 * 1.2 * delta; // Gravity
          v.multiplyScalar(0.975); // Air resistance

          positions[j * 3] += v.x * delta;
          positions[j * 3 + 1] += v.y * delta;
          positions[j * 3 + 2] += v.z * delta;
        }
        fw.particles.geometry.attributes.position.needsUpdate = true;

        // Fade out opacity
        fw.particles.material.opacity = Math.max(0, 1.0 - Math.pow(progress, 1.5));

        if (fw.burstTime >= fw.burstMaxTime) {
          this.scene.remove(fw.particles);
          if (fw.flashLight) this.scene.remove(fw.flashLight);
          this.fireworks.splice(i, 1);
        }
      }
    }
  }
}
