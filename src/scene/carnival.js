import * as THREE from 'three';

/**
 * Temple Fair (Carnival) Zone: Giant Glowing Rotating Ferris Wheel,
 * Multi-colored Festoon String Lights, Market Stalls, and Festive Foliage
 */
export class CarnivalManager {
  constructor(scene) {
    this.scene = scene;
    this.ferrisWheelGroup = null;
    this.wheelRotatingPart = null;
    this.gondolas = [];
    this.neonSpokes = [];
    this.stringLightBulbs = [];
    this.wheelRotationSpeed = 0.22;

    this.initFerrisWheel();
    this.initFestivalStalls();
    this.initStringLights();
    this.initFoliageAndFlags();
  }

  initFerrisWheel() {
    this.ferrisWheelGroup = new THREE.Group();
    this.ferrisWheelGroup.position.set(55, 3, -75);

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.3
    });

    // 1. Support A-Frame Towers
    const towerHeight = 24;
    const towerSpread = 12;
    const legGeo = new THREE.CylinderGeometry(0.5, 0.7, towerHeight, 8);

    [-4.5, 4.5].forEach(sideZ => {
      // Left leg
      const leftLeg = new THREE.Mesh(legGeo, steelMat);
      leftLeg.position.set(-towerSpread * 0.45, towerHeight * 0.5, sideZ);
      leftLeg.rotation.z = -0.26;
      this.ferrisWheelGroup.add(leftLeg);

      // Right leg
      const rightLeg = new THREE.Mesh(legGeo, steelMat);
      rightLeg.position.set(towerSpread * 0.45, towerHeight * 0.5, sideZ);
      rightLeg.rotation.z = 0.26;
      this.ferrisWheelGroup.add(rightLeg);

      // Cross struts
      for (let s = 1; s <= 3; s++) {
        const strutGeo = new THREE.BoxGeometry(towerSpread * (1 - s * 0.22), 0.35, 0.35);
        const strut = new THREE.Mesh(strutGeo, steelMat);
        strut.position.set(0, s * 6.5, sideZ);
        this.ferrisWheelGroup.add(strut);
      }
    });

    // Central Axle Hub
    const axleY = towerHeight - 1.5;
    const axleGeo = new THREE.CylinderGeometry(1.2, 1.2, 11, 16);
    const axle = new THREE.Mesh(axleGeo, steelMat);
    axle.rotation.x = Math.PI / 2;
    axle.position.set(0, axleY, 0);
    this.ferrisWheelGroup.add(axle);

    // 2. Rotating Wheel Structure
    this.wheelRotatingPart = new THREE.Group();
    this.wheelRotatingPart.position.set(0, axleY, 0);

    const wheelRadius = 17;
    const spokeCount = 16;

    // Dual Outer Steel Rims
    [-3.2, 3.2].forEach(rimZ => {
      const rimGeo = new THREE.TorusGeometry(wheelRadius, 0.4, 8, 48);
      const rim = new THREE.Mesh(rimGeo, steelMat);
      rim.position.z = rimZ;
      this.wheelRotatingPart.add(rim);

      const innerRimGeo = new THREE.TorusGeometry(wheelRadius * 0.55, 0.3, 8, 36);
      const innerRim = new THREE.Mesh(innerRimGeo, steelMat);
      innerRim.position.z = rimZ;
      this.wheelRotatingPart.add(innerRim);
    });

    // Connecting Braces between rims
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const x = Math.cos(angle) * wheelRadius;
      const y = Math.sin(angle) * wheelRadius;

      const braceGeo = new THREE.CylinderGeometry(0.2, 0.2, 6.4, 6);
      const brace = new THREE.Mesh(braceGeo, steelMat);
      brace.rotation.x = Math.PI / 2;
      brace.position.set(x, y, 0);
      this.wheelRotatingPart.add(brace);
    }

    // Neon Colors Palette for Ferris Wheel (งานวัดไทย)
    const neonColors = [
      0xec4899, // Neon Pink
      0x06b6d4, // Cyan
      0xfacc15, // Golden Yellow
      0xa855f7, // Purple
      0x22c55e, // Emerald Green
      0xf97316  // Tangerine
    ];

    // Radial Spokes with Glowing Neon Strips
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const color = neonColors[i % neonColors.length];

      // Structural spoke rod
      [-3.2, 3.2].forEach(sideZ => {
        const spokeGeo = new THREE.CylinderGeometry(0.18, 0.18, wheelRadius, 6);
        const spoke = new THREE.Mesh(spokeGeo, steelMat);
        spoke.position.set((Math.cos(angle) * wheelRadius) / 2, (Math.sin(angle) * wheelRadius) / 2, sideZ);
        spoke.rotation.z = angle - Math.PI / 2;
        this.wheelRotatingPart.add(spoke);
      });

      // Neon LED Glowing Strip along the spoke
      const neonGeo = new THREE.CylinderGeometry(0.12, 0.12, wheelRadius * 0.9, 6);
      const neonMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 3.5, // High intensity for bloom!
        roughness: 0.2
      });
      const neon = new THREE.Mesh(neonGeo, neonMat);
      neon.position.set((Math.cos(angle) * wheelRadius * 0.9) / 2, (Math.sin(angle) * wheelRadius * 0.9) / 2, 0);
      neon.rotation.z = angle - Math.PI / 2;
      this.wheelRotatingPart.add(neon);
      this.neonSpokes.push({ mesh: neon, baseColor: color, index: i });

      // 3. Passenger Gondolas (กระเช้าชิงช้าสวรรค์)
      const gondolaPivot = new THREE.Group();
      gondolaPivot.position.set(
        Math.cos(angle) * wheelRadius,
        Math.sin(angle) * wheelRadius,
        0
      );

      const gondolaMesh = this.createGondolaMesh(color);
      gondolaPivot.add(gondolaMesh);

      this.wheelRotatingPart.add(gondolaPivot);
      this.gondolas.push({ pivot: gondolaPivot, initialAngle: angle });
    }

    // Ferris Wheel Central Hub Illuminator (Bright festive neon magenta)
    const hubLight = new THREE.PointLight(0xff00bb, 4.5, 48);
    hubLight.position.set(0, axleY, 0);
    this.ferrisWheelGroup.add(hubLight);

    this.ferrisWheelGroup.add(this.wheelRotatingPart);
    this.scene.add(this.ferrisWheelGroup);
  }

  createGondolaMesh(accentColor) {
    const gondola = new THREE.Group();

    // Hanger rod from pivot
    const hangerGeo = new THREE.CylinderGeometry(0.15, 0.15, 3.2, 6);
    const hangerMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const hanger = new THREE.Mesh(hangerGeo, hangerMat);
    hanger.position.y = -1.6;
    gondola.add(hanger);

    // Gondola Canopy Roof
    const roofGeo = new THREE.ConeGeometry(2.0, 1.2, 6);
    const roofMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.3,
      emissive: accentColor,
      emissiveIntensity: 0.6
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = -2.8;
    gondola.add(roof);

    // Passenger Basket Body
    const basketGeo = new THREE.CylinderGeometry(1.6, 1.3, 1.8, 8);
    const basketMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.3
    });
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.y = -4.2;
    gondola.add(basket);

    // Glowing rim around basket
    const rimGeo = new THREE.TorusGeometry(1.65, 0.08, 6, 16);
    const rimMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 2.0
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -3.4;
    gondola.add(rim);

    return gondola;
  }

  initFestivalStalls() {
    // Traditional Thai festival market stalls along the promenade
    const stallConfigs = [
      { x: 10, z: -55, stripe1: 0xef4444, stripe2: 0xffffff, title: 'ขนมไทยโบราณ' },
      { x: 55, z: -55, stripe1: 0x3b82f6, stripe2: 0xfacc15, title: 'กระทงวิจิตร' },
      { x: 100, z: -55, stripe1: 0x10b981, stripe2: 0xffffff, title: 'ลูกชิ้นปิ้งน้ำจิ้มโบราณ' },
      { x: 35, z: -95, stripe1: 0xa855f7, stripe2: 0xfde047, title: 'สายไหมหลากสี' },
      { x: 75, z: -95, stripe1: 0xec4899, stripe2: 0x06b6d4, title: 'น้ำสมุนไพรเย็นฉ่ำ' }
    ];

    stallConfigs.forEach(conf => {
      const stall = new THREE.Group();
      stall.position.set(conf.x, 3, conf.z);

      // Wooden Counter Table
      const counterGeo = new THREE.BoxGeometry(7, 2.2, 4);
      const counterMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
      const counter = new THREE.Mesh(counterGeo, counterMat);
      counter.position.y = 1.1;
      stall.add(counter);

      // 4 Corner Wooden Pillars
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 5.5, 6);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
      [
        { x: -3.2, z: -1.8 }, { x: 3.2, z: -1.8 },
        { x: -3.2, z: 1.8 }, { x: 3.2, z: 1.8 }
      ].forEach(p => {
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(p.x, 3.8, p.z);
        stall.add(pole);
      });

      // Striped Fabric Canopy Roof (หลังคาผ้าใบกันแดดลายทาง)
      const roofGeo = new THREE.ConeGeometry(5.2, 2.2, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roofMat = new THREE.MeshStandardMaterial({
        color: conf.stripe1,
        roughness: 0.6,
        emissive: conf.stripe1,
        emissiveIntensity: 0.25
      });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 6.8;
      stall.add(roof);

      // Warm Interior Hanging Bulb (glows brightly with bloom)
      const bulbGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xffe066,
        emissive: 0xffaa00,
        emissiveIntensity: 3.0
      });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(0, 5.2, 0);
      stall.add(bulb);

      this.scene.add(stall);
    });

    // 3 Warm Regional Market Lights providing vibrant festival illumination along the promenade
    const marketLight1 = new THREE.PointLight(0xffaa22, 3.5, 55);
    marketLight1.position.set(20, 8.5, -55);
    this.scene.add(marketLight1);

    const marketLight2 = new THREE.PointLight(0xffaa22, 3.5, 55);
    marketLight2.position.set(60, 8.5, -55);
    this.scene.add(marketLight2);

    const marketLight3 = new THREE.PointLight(0xffaa22, 3.5, 55);
    marketLight3.position.set(95, 8.5, -55);
    this.scene.add(marketLight3);
  }

  initStringLights() {
    // Multi-colored Festoon Fairy String Lights (ไฟราวงานวัดหลากสีสัน)
    const paths = [
      // Along riverside walkway
      { start: new THREE.Vector3(-15, 6, -38), end: new THREE.Vector3(25, 6, -38) },
      { start: new THREE.Vector3(25, 6, -38), end: new THREE.Vector3(65, 6, -38) },
      { start: new THREE.Vector3(65, 6, -38), end: new THREE.Vector3(105, 6, -38) },
      // Towards the Ferris wheel
      { start: new THREE.Vector3(25, 6, -38), end: new THREE.Vector3(45, 8, -65) },
      { start: new THREE.Vector3(65, 6, -38), end: new THREE.Vector3(65, 8, -65) },
      { start: new THREE.Vector3(45, 8, -65), end: new THREE.Vector3(80, 8, -65) }
    ];

    const bulbPalette = [0xef4444, 0xfacc15, 0x10b981, 0x06b6d4, 0xec4899, 0xa855f7];

    paths.forEach(p => {
      // Create catenary curved line
      const points = [];
      const mid = p.start.clone().lerp(p.end, 0.5);
      mid.y -= 1.6; // Catenary sag

      const curve = new THREE.QuadraticBezierCurve3(p.start, mid, p.end);
      const curvePoints = curve.getPoints(24);

      // String wire
      const wireGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const wireMat = new THREE.LineBasicMaterial({ color: 0x1e293b });
      const wire = new THREE.Line(wireGeo, wireMat);
      this.scene.add(wire);

      // Hanging Bulbs along the curve
      const bulbCount = 10;
      for (let b = 1; b < bulbCount; b++) {
        const t = b / bulbCount;
        const pt = curve.getPoint(t);
        const color = bulbPalette[(b + Math.floor(Math.random() * 6)) % bulbPalette.length];

        const bGeo = new THREE.SphereGeometry(0.24, 8, 8);
        const bMat = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 3.0,
          roughness: 0.1
        });
        const bulbMesh = new THREE.Mesh(bGeo, bMat);
        bulbMesh.position.copy(pt);
        bulbMesh.position.y -= 0.15;
        this.scene.add(bulbMesh);

        this.stringLightBulbs.push({
          mesh: bulbMesh,
          baseColor: color,
          phase: Math.random() * Math.PI * 2
        });
      }
    });
  }

  initFoliageAndFlags() {
    // Banana and Palm Trees near the fairgrounds
    const treePositions = [
      { x: 10, z: -68 }, { x: -2, z: -85 },
      { x: 102, z: -72 }, { x: 115, z: -55 },
      { x: 48, z: -105 }
    ];

    treePositions.forEach(pos => {
      // Tree trunk
      const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 9, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(pos.x, 7.5, pos.z);
      trunk.rotation.z = (Math.random() - 0.5) * 0.12;
      this.scene.add(trunk);

      // Broad Banana / Palm Fronds
      for (let f = 0; f < 7; f++) {
        const frondAngle = (f / 7) * Math.PI * 2;
        const frondGeo = new THREE.ConeGeometry(2.8, 7.5, 5);
        frondGeo.rotateX(Math.PI / 2.6);
        const frondMat = new THREE.MeshStandardMaterial({
          color: 0x166534,
          roughness: 0.6,
          side: THREE.DoubleSide
        });
        const frond = new THREE.Mesh(frondGeo, frondMat);
        frond.position.set(pos.x, 11.5, pos.z);
        frond.rotation.y = frondAngle;
        this.scene.add(frond);
      }
    });
  }

  update(time, delta) {
    // 1. Rotate Ferris Wheel
    if (this.wheelRotatingPart) {
      this.wheelRotatingPart.rotation.z += this.wheelRotationSpeed * delta;

      // Keep each gondola upright under gravity (counter-rotate relative to wheel)
      const currentWheelAngle = this.wheelRotatingPart.rotation.z;
      this.gondolas.forEach(g => {
        g.pivot.rotation.z = -currentWheelAngle;
      });
    }

    // 2. Pulse Neon Spokes
    this.neonSpokes.forEach(spoke => {
      const pulse = 2.5 + 1.5 * Math.sin(time * 4.0 + spoke.index * 0.4);
      spoke.mesh.material.emissiveIntensity = pulse;
    });

    // 3. Subtle Twinkle on String Lights
    this.stringLightBulbs.forEach(b => {
      const twinkle = 2.0 + 1.2 * Math.sin(time * 3.0 + b.phase);
      b.mesh.material.emissiveIntensity = twinkle;
    });
  }
}
