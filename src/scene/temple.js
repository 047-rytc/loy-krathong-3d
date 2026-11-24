import * as THREE from 'three';

/**
 * Thai Temple (Ubosot), Golden Stupa (Chedi) and Riverside Wooden Pier
 */
export class TempleManager {
  constructor(scene) {
    this.scene = scene;
    this.lights = [];

    this.initMaterials();
    this.buildUbosot();
    this.buildGoldenChedi();
    this.buildRiversidePier();
    this.setupLighting();
  }

  initMaterials() {
    // Radiant Gold Leaf PBR material for Chedi & Chofah
    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd147,
      metalness: 0.85,
      roughness: 0.22,
      emissive: 0x854d0e,
      emissiveIntensity: 0.58
    });

    // Thai Temple Terracotta Roof Tile
    this.roofMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c, // Rich Thai red-orange glazed terracotta
      roughness: 0.6,
      metalness: 0.15
    });

    // Dark Teak Wood / Lacquer
    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.7,
      metalness: 0.05
    });

    // Temple White Marble Columns & Platform
    this.marbleMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.4,
      metalness: 0.05
    });

    // Ornate Pediment / Golden Filigree
    this.pedimentMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      emissive: 0x78350f,
      emissiveIntensity: 0.4,
      roughness: 0.4
    });

    // Interior Warm Candle / Lantern Glow
    this.interiorGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa22
    });
  }

  buildUbosot() {
    const templeGroup = new THREE.Group();
    templeGroup.position.set(-50, 3, -75);

    // 1. Foundation Platform (ฐานไพที)
    const baseGeo = new THREE.BoxGeometry(42, 2.5, 30);
    const base = new THREE.Mesh(baseGeo, this.marbleMat);
    base.position.y = 1.25;
    templeGroup.add(base);

    // Platform Steps leading to river
    for (let i = 0; i < 3; i++) {
      const stepGeo = new THREE.BoxGeometry(16, 0.6, 2.2);
      const step = new THREE.Mesh(stepGeo, this.marbleMat);
      step.position.set(0, 0.3 + i * 0.4, 15 + i * 1.8);
      templeGroup.add(step);
    }

    // 2. Main Temple Hall Walls
    const wallGeo = new THREE.BoxGeometry(34, 12, 22);
    const wall = new THREE.Mesh(wallGeo, this.marbleMat);
    wall.position.y = 8.5;
    templeGroup.add(wall);

    // Decorative Red & Gold Base Molding
    const trimGeo = new THREE.BoxGeometry(34.8, 1.2, 22.8);
    const trim = new THREE.Mesh(trimGeo, this.woodMat);
    trim.position.y = 3;
    templeGroup.add(trim);

    // 3. Portico Pillars (เสาพาไลระเบียงวัด)
    const pillarRadius = 0.65;
    const pillarHeight = 12;
    const pillarGeo = new THREE.CylinderGeometry(pillarRadius * 0.9, pillarRadius, pillarHeight, 16);

    // Front & Back Columns
    const xOffsets = [-16, -10.5, -5.2, 0, 5.2, 10.5, 16];
    xOffsets.forEach(x => {
      // Front veranda
      const pFront = new THREE.Mesh(pillarGeo, this.marbleMat);
      pFront.position.set(x, 8.5, 12.5);
      templeGroup.add(pFront);

      // Lotus capital top
      const capGeo = new THREE.CylinderGeometry(1.0, 0.6, 0.8, 8);
      const cap = new THREE.Mesh(capGeo, this.goldMat);
      cap.position.set(x, 14.5, 12.5);
      templeGroup.add(cap);

      // Base lotus foot
      const footGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.6, 8);
      const foot = new THREE.Mesh(footGeo, this.goldMat);
      foot.position.set(x, 2.8, 12.5);
      templeGroup.add(foot);
    });

    // 4. Windows with Warm Amber Glow (หน้าต่างเรือนแก้ว)
    for (let w = -2; w <= 2; w++) {
      // Front veranda side doors
      const winGeo = new THREE.PlaneGeometry(1.8, 4.5);
      const win = new THREE.Mesh(winGeo, this.interiorGlowMat);
      win.position.set(w * 5.5, 9.5, 11.05);
      templeGroup.add(win);

      // Window golden frame
      const frameGeo = new THREE.BoxGeometry(2.2, 5.0, 0.2);
      const frame = new THREE.Mesh(frameGeo, this.goldMat);
      frame.position.set(w * 5.5, 9.5, 11.0);
      templeGroup.add(frame);
    }

    // Grand Entrance Portal
    const doorGeo = new THREE.PlaneGeometry(3.6, 7.5);
    const door = new THREE.Mesh(doorGeo, this.interiorGlowMat);
    door.position.set(0, 8.0, 11.08);
    templeGroup.add(door);

    // 5. Multi-tiered Thai Gable Roof (หลังคาซ้อน 3 ชั้น)
    const tiers = [
      { y: 15.0, width: 38, length: 28, height: 6.5, slope: 0.9 },
      { y: 18.5, width: 32, length: 24, height: 5.5, slope: 1.05 },
      { y: 21.8, width: 25, length: 20, height: 4.8, slope: 1.2 }
    ];

    tiers.forEach((tier, index) => {
      // Left and Right roof slopes using angled boxes
      const halfWidth = tier.width * 0.52;
      const roofSlopeLength = Math.hypot(halfWidth, tier.height);
      const angle = Math.atan2(tier.height, halfWidth);

      // Right slope
      const rSlopeGeo = new THREE.BoxGeometry(roofSlopeLength, 0.7, tier.length);
      const rSlope = new THREE.Mesh(rSlopeGeo, this.roofMat);
      rSlope.position.set(halfWidth * 0.5, tier.y + tier.height * 0.45, 0);
      rSlope.rotation.z = angle;
      templeGroup.add(rSlope);

      // Left slope
      const lSlope = new THREE.Mesh(rSlopeGeo, this.roofMat);
      lSlope.position.set(-halfWidth * 0.5, tier.y + tier.height * 0.45, 0);
      lSlope.rotation.z = -angle;
      templeGroup.add(lSlope);

      // Golden Ridge Cap (สันหลังคา)
      const ridgeGeo = new THREE.BoxGeometry(0.8, 0.8, tier.length + 1.2);
      const ridge = new THREE.Mesh(ridgeGeo, this.goldMat);
      ridge.position.set(0, tier.y + tier.height + 0.3, 0);
      templeGroup.add(ridge);

      // Front & Back Gable Pediments (หน้าบัน)
      const pedShape = new THREE.Shape();
      pedShape.moveTo(-halfWidth * 0.9, 0);
      pedShape.lineTo(halfWidth * 0.9, 0);
      pedShape.lineTo(0, tier.height);
      pedShape.closePath();

      const pedGeo = new THREE.ShapeGeometry(pedShape);
      const pedFront = new THREE.Mesh(pedGeo, this.pedimentMat);
      pedFront.position.set(0, tier.y, tier.length * 0.5);
      templeGroup.add(pedFront);

      const pedBack = new THREE.Mesh(pedGeo, this.pedimentMat);
      pedBack.position.set(0, tier.y, -tier.length * 0.5);
      pedBack.rotation.y = Math.PI;
      templeGroup.add(pedBack);

      // Chofah (ช่อฟ้า - Sky tassel finials at the gable peaks)
      [-1, 1].forEach(sideZ => {
        const chofahGroup = this.createChofah();
        chofahGroup.position.set(0, tier.y + tier.height + 0.2, sideZ * (tier.length * 0.5 + 0.3));
        if (sideZ < 0) chofahGroup.rotation.y = Math.PI;
        templeGroup.add(chofahGroup);
      });
    });

    this.scene.add(templeGroup);
  }

  createChofah() {
    const chofah = new THREE.Group();
    // Elegant curved horn shape representing Garuda head / celestial swan
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1.8, 0.2),
      new THREE.Vector3(0, 3.2, 1.2),
      new THREE.Vector3(0, 4.2, 0.4)
    );
    const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.35, 8, false);
    const tube = new THREE.Mesh(tubeGeo, this.goldMat);
    chofah.add(tube);

    // Tip flame
    const flameGeo = new THREE.ConeGeometry(0.3, 1.0, 6);
    const flame = new THREE.Mesh(flameGeo, this.goldMat);
    flame.position.set(0, 4.4, 0.3);
    flame.rotation.x = -0.3;
    chofah.add(flame);

    return chofah;
  }

  buildGoldenChedi() {
    const chediGroup = new THREE.Group();
    chediGroup.position.set(-105, 3, -78);

    // 1. Multi-tiered Indented Square Base (ฐานย่อมุมไม้สิบสอง)
    const baseTiers = [
      { y: 1.0, size: 26, h: 2.0 },
      { y: 3.2, size: 22, h: 2.2 },
      { y: 5.6, size: 18, h: 2.4 },
      { y: 8.2, size: 15, h: 2.6 }
    ];

    baseTiers.forEach(t => {
      const geo = new THREE.BoxGeometry(t.size, t.h, t.size);
      const mesh = new THREE.Mesh(geo, this.goldMat);
      mesh.position.y = t.y;
      chediGroup.add(mesh);

      // Gold border trim
      const edgeGeo = new THREE.BoxGeometry(t.size + 0.6, 0.4, t.size + 0.6);
      const edge = new THREE.Mesh(edgeGeo, this.goldMat);
      edge.position.y = t.y + t.h * 0.5;
      chediGroup.add(edge);
    });

    // 2. Bell-shaped Dome (องค์ระฆังคว่ำ)
    const bellGeo = new THREE.CylinderGeometry(5.0, 6.8, 7.5, 32);
    const bell = new THREE.Mesh(bellGeo, this.goldMat);
    bell.position.y = 13.5;
    chediGroup.add(bell);

    // Rounded shoulders of the bell
    const shoulderGeo = new THREE.SphereGeometry(6.6, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const shoulder = new THREE.Mesh(shoulderGeo, this.goldMat);
    shoulder.position.y = 11.5;
    chediGroup.add(shoulder);

    // 3. Hamika Throne Platform (บัลลังก์สี่เหลี่ยม)
    const hamikaGeo = new THREE.BoxGeometry(5.2, 1.8, 5.2);
    const hamika = new THREE.Mesh(hamikaGeo, this.goldMat);
    hamika.position.y = 18.0;
    chediGroup.add(hamika);

    // 4. Conical Spire Rings (ปล้องไฉน 18 ชั้น)
    const ringCount = 18;
    for (let r = 0; r < ringCount; r++) {
      const rY = 19.0 + r * 0.85;
      const radius = 2.2 * (1 - r / (ringCount + 1));
      const ringGeo = new THREE.TorusGeometry(radius, 0.28, 8, 24);
      const ring = new THREE.Mesh(ringGeo, this.goldMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = rY;
      chediGroup.add(ring);
    }

    // 5. Slender Spire Tip (ยอดปลีและลูกแก้ว)
    const spireGeo = new THREE.ConeGeometry(0.8, 12, 16);
    const spire = new THREE.Mesh(spireGeo, this.goldMat);
    spire.position.y = 39.5;
    chediGroup.add(spire);

    // Jewel at the very top (ดวงแก้วสุริยกานต์)
    const jewelGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const jewelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const jewel = new THREE.Mesh(jewelGeo, jewelMat);
    jewel.position.y = 45.8;
    chediGroup.add(jewel);

    // Glowing point light at the stupa apex
    const apexLight = new THREE.PointLight(0xffe066, 2.5, 30);
    apexLight.position.y = 45.8;
    chediGroup.add(apexLight);

    this.scene.add(chediGroup);
  }

  buildRiversidePier() {
    const pierGroup = new THREE.Group();
    pierGroup.position.set(-25, 0, -22);

    // Pier Deck extending out into the water
    const deckGeo = new THREE.BoxGeometry(20, 0.7, 24);
    const deck = new THREE.Mesh(deckGeo, this.woodMat);
    deck.position.set(0, 1.6, 0);
    pierGroup.add(deck);

    // Wooden Pilings / Stilts in river
    for (let x of [-9, -4.5, 0, 4.5, 9]) {
      for (let z of [-10, -2, 6, 10]) {
        const postGeo = new THREE.CylinderGeometry(0.35, 0.35, 7, 8);
        const post = new THREE.Mesh(postGeo, this.woodMat);
        post.position.set(x, -0.5, z);
        pierGroup.add(post);
      }
    }

    // Pier Stairs into river
    for (let i = 0; i < 3; i++) {
      const stepGeo = new THREE.BoxGeometry(14, 0.4, 2.0);
      const step = new THREE.Mesh(stepGeo, this.woodMat);
      step.position.set(0, 1.2 - i * 0.45, 12.5 + i * 1.8);
      pierGroup.add(step);
    }

    // Carved Temple Lantern Posts on Pier (เสาไฟหัวหงส์ / โคมไฟท่าน้ำ)
    const lampPositions = [
      { x: -9, z: -10 },
      { x: 9, z: -10 },
      { x: -9, z: 10 },
      { x: 9, z: 10 }
    ];

    lampPositions.forEach(pos => {
      // Wooden Pole
      const poleGeo = new THREE.CylinderGeometry(0.18, 0.22, 5.5, 8);
      const pole = new THREE.Mesh(poleGeo, this.woodMat);
      pole.position.set(pos.x, 4.2, pos.z);
      pierGroup.add(pole);

      // Hanging Lantern Housing
      const boxGeo = new THREE.BoxGeometry(0.8, 1.1, 0.8);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0xffaa22,
        emissive: 0xff8800,
        emissiveIntensity: 2.2
      });
      const lantern = new THREE.Mesh(boxGeo, boxMat);
      lantern.position.set(pos.x, 6.2, pos.z);
      pierGroup.add(lantern);

      // Roof cap
      const capGeo = new THREE.ConeGeometry(0.7, 0.6, 4);
      const cap = new THREE.Mesh(capGeo, this.goldMat);
      cap.position.set(pos.x, 7.0, pos.z);
      cap.rotation.y = Math.PI / 4;
      pierGroup.add(cap);

      // Warm Point Light casting reflection on water
      const pLight = new THREE.PointLight(0xff9922, 2.8, 28);
      pLight.position.set(pos.x, 6.2, pos.z);
      pierGroup.add(pLight);
    });

    this.scene.add(pierGroup);
  }

  setupLighting() {
    // 1. Warm Golden Spotlights illuminating the Temple Ubosot
    const templeSpot1 = new THREE.SpotLight(0xffbc42, 7.5, 110, Math.PI / 3.2, 0.4);
    templeSpot1.position.set(-50, 5, -40);
    templeSpot1.target.position.set(-50, 16, -75);
    this.scene.add(templeSpot1);
    this.scene.add(templeSpot1.target);

    // 2. Gilded Spotlight for the Golden Stupa (Chedi)
    const chediSpot = new THREE.SpotLight(0xffd700, 9.5, 140, Math.PI / 3.8, 0.35);
    chediSpot.position.set(-105, 5, -45);
    chediSpot.target.position.set(-105, 26, -78);
    this.scene.add(chediSpot);
    this.scene.add(chediSpot.target);

    // 3. Ambient warm temple terrace light
    const terraceLight = new THREE.PointLight(0xffaa33, 3.5, 65);
    terraceLight.position.set(-50, 11, -58);
    this.scene.add(terraceLight);
  }
}
