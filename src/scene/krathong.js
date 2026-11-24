import * as THREE from 'three';

/**
 * High-Performance Krathong Manager
 * - Shared geometries and materials to minimize draw calls and allocations
 * - PointLight only on user's active Krathong (ambient fleet uses emissive bloom)
 * - Optimized ambient fleet size (16 krathongs)
 */
export class KrathongManager {
  constructor(scene, soundManager) {
    this.scene = scene;
    this.sound = soundManager;
    this.krathongs = [];
    this.userKrathongs = [];
    this.lastUserKrathong = null;
    this.hoveredKrathong = null;

    this.initSharedResources();
    this.initAmbientFleet(16);
  }

  initSharedResources() {
    // 1. Materials
    this.matBananaTrunk = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
    this.matBananaLeaves = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5, side: THREE.DoubleSide });
    this.matBread = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85, metalness: 0.05 });
    this.matIce = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88
    });

    this.matMarigold = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xb45309, emissiveIntensity: 0.25, roughness: 0.6 });
    this.matLotus = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xdb2777, emissiveIntensity: 0.35, roughness: 0.45, side: THREE.DoubleSide });
    this.matOrchid = new THREE.MeshStandardMaterial({ color: 0xc084fc, emissive: 0x9333ea, emissiveIntensity: 0.35, roughness: 0.45, side: THREE.DoubleSide });
    this.matGoldenLotus = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xd97706, emissiveIntensity: 0.65, metalness: 0.92, roughness: 0.15, side: THREE.DoubleSide });

    this.matGoldCoin = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.92, roughness: 0.2, emissive: 0xb45309, emissiveIntensity: 0.25 });
    this.matSilverCoin = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.25 });
    this.matIncense = new THREE.MeshStandardMaterial({ color: 0x78350f });
    this.matEmber = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    this.matCandle = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });
    this.matWick = new THREE.MeshBasicMaterial({ color: 0x222222 });

    // 2. Shared Geometries
    this.geoBananaBase = new THREE.CylinderGeometry(2.4, 2.5, 0.7, 16);
    this.geoBreadBase = new THREE.CylinderGeometry(2.3, 2.5, 0.9, 14);
    this.geoBreadBump = new THREE.SphereGeometry(0.5, 6, 6);
    this.geoIceBase = new THREE.CylinderGeometry(2.4, 2.6, 0.8, 8);
    this.geoIceCrystal = new THREE.ConeGeometry(0.4, 1.2, 5);

    // Folded petal geometry
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.5, 0.6, 0.3, 1.3);
    shape.lineTo(0, 1.7);
    shape.lineTo(-0.3, 1.3);
    shape.quadraticCurveTo(-0.5, 0.6, 0, 0);
    this.geoPetal = new THREE.ShapeGeometry(shape);

    this.geoCoin = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 8);
    this.geoIncenseStick = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 5);
    this.geoIncenseEmber = new THREE.SphereGeometry(0.045, 5, 5);

    this.geoCandle = new THREE.CylinderGeometry(0.18, 0.2, 1.6, 8);
    this.geoWick = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4);
    this.geoFlame = new THREE.ConeGeometry(0.14, 0.55, 6);
    this.geoFlame.translate(0, 0.25, 0);

    this.geoHitMesh = new THREE.SphereGeometry(2.8, 6, 6);
    this.matHitInvisible = new THREE.MeshBasicMaterial({ visible: false });

    // Crown geometries
    this.geoCrownBase = new THREE.CylinderGeometry(0.38, 0.44, 0.35, 10);
    this.geoCrownSpire = new THREE.ConeGeometry(0.3, 0.9, 6);
    this.geoCrownGem = new THREE.SphereGeometry(0.1, 6, 6);
    this.matCrownGem = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  }

  createKrathongMesh(options, isUser = false) {
    const {
      baseType = 'banana',
      flowerType = 'marigold',
      hasIncense = true,
      hasCoins = true,
      hasCrown = false,
      hasSparkleAura = false,
      candleHex = 0xff9900,
      isUnlit = false
    } = options;

    const group = new THREE.Group();

    // 1. Base Geometry
    if (baseType === 'bread') {
      const baseMesh = new THREE.Mesh(this.geoBreadBase, this.matBread);
      baseMesh.position.y = 0.45;
      group.add(baseMesh);

      for (let b = 0; b < 6; b++) {
        const angle = (b / 6) * Math.PI * 2;
        const crust = new THREE.Mesh(this.geoBreadBump, this.matBread);
        crust.position.set(Math.cos(angle) * 1.8, 0.8, Math.sin(angle) * 1.8);
        group.add(crust);
      }
    } else if (baseType === 'ice') {
      const baseMesh = new THREE.Mesh(this.geoIceBase, this.matIce);
      baseMesh.position.y = 0.4;
      group.add(baseMesh);

      for (let c = 0; c < 8; c++) {
        const cAngle = (c / 8) * Math.PI * 2;
        const crystal = new THREE.Mesh(this.geoIceCrystal, this.matIce);
        crystal.position.set(Math.cos(cAngle) * 2.2, 0.7, Math.sin(cAngle) * 2.2);
        crystal.rotation.z = -0.3;
        crystal.rotation.y = cAngle;
        group.add(crystal);
      }
    } else {
      const baseMesh = new THREE.Mesh(this.geoBananaBase, this.matBananaTrunk);
      baseMesh.position.y = 0.35;
      group.add(baseMesh);

      const petalCount = 12;
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petal = new THREE.Mesh(this.geoPetal, this.matBananaLeaves);
        petal.position.set(Math.cos(angle) * 2.3, 0.4, Math.sin(angle) * 2.3);
        petal.rotation.y = -angle + Math.PI / 2;
        petal.rotation.x = 0.45;
        group.add(petal);
      }
    }

    // 2. Floral Tier
    let flowerMat = this.matMarigold;
    if (flowerType === 'lotus') flowerMat = this.matLotus;
    else if (flowerType === 'orchid') flowerMat = this.matOrchid;
    else if (flowerType === 'goldenLotus') flowerMat = this.matGoldenLotus;

    const floralTiers = [
      { count: 10, radius: 1.8, y: 0.65, scale: 0.85, tilt: 0.3 },
      { count: 8, radius: 1.2, y: 0.85, scale: 0.7, tilt: 0.15 }
    ];

    floralTiers.forEach(tier => {
      for (let i = 0; i < tier.count; i++) {
        const angle = (i / tier.count) * Math.PI * 2;
        const petal = new THREE.Mesh(this.geoPetal, flowerMat);
        petal.scale.set(tier.scale, tier.scale, tier.scale);
        petal.position.set(
          Math.cos(angle) * tier.radius,
          tier.y,
          Math.sin(angle) * tier.radius
        );
        petal.rotation.y = -angle + Math.PI / 2;
        petal.rotation.x = tier.tilt;
        group.add(petal);
      }
    });

    // 3. Auspicious Coins
    if (hasCoins) {
      const coinPositions = [
        { x: -0.7, z: 0.4, mat: this.matGoldCoin, rot: 0.2 },
        { x: -0.4, z: -0.6, mat: this.matSilverCoin, rot: -0.15 },
        { x: 0.6, z: 0.5, mat: this.matGoldCoin, rot: 0.1 }
      ];

      coinPositions.forEach(cp => {
        const coin = new THREE.Mesh(this.geoCoin, cp.mat);
        coin.position.set(cp.x, 0.95, cp.z);
        coin.rotation.x = Math.PI / 2.2 + cp.rot;
        group.add(coin);
      });
    }

    // 4. Incense Sticks
    if (hasIncense) {
      [-0.2, 0.2].forEach(offset => {
        const stick = new THREE.Mesh(this.geoIncenseStick, this.matIncense);
        stick.position.set(offset, 1.45, -0.4);
        stick.rotation.z = offset * 0.2;
        stick.rotation.x = -0.15;
        group.add(stick);

        const ember = new THREE.Mesh(this.geoIncenseEmber, this.matEmber);
        ember.position.set(0, 0.9, 0);
        stick.add(ember);
      });
    }

    // 5. Center Candle
    const candle = new THREE.Mesh(this.geoCandle, this.matCandle);
    candle.position.set(0, 1.35, 0.1);
    group.add(candle);

    const wick = new THREE.Mesh(this.geoWick, this.matWick);
    wick.position.set(0, 0.88, 0);
    candle.add(wick);

    const flameMat = new THREE.MeshBasicMaterial({ color: candleHex });
    const flame = new THREE.Mesh(this.geoFlame, flameMat);
    flame.position.set(0, 0.95, 0);
    candle.add(flame);

    // ONLY the user's active Krathong gets a dynamic PointLight!
    let candleLight = null;
    if (isUser) {
      candleLight = new THREE.PointLight(candleHex, isUnlit ? 0 : 2.5, 14, 1.5);
      candleLight.position.set(0, 2.3, 0.1);
      group.add(candleLight);
    }

    if (isUnlit) {
      flame.visible = false;
      if (candleLight) candleLight.intensity = 0;
    }

    // 6. Rare Reward: Miniature Golden Crown
    if (hasCrown) {
      const crownGroup = new THREE.Group();
      const cBase = new THREE.Mesh(this.geoCrownBase, this.matGoldCoin);
      crownGroup.add(cBase);

      const cSpire = new THREE.Mesh(this.geoCrownSpire, this.matGoldCoin);
      cSpire.position.y = 0.6;
      crownGroup.add(cSpire);

      const gem = new THREE.Mesh(this.geoCrownGem, this.matCrownGem);
      gem.position.set(0, 0.18, 0.42);
      crownGroup.add(gem);

      crownGroup.position.set(0, 1.25, -0.7);
      crownGroup.scale.set(0.75, 0.75, 0.75);
      group.add(crownGroup);
    }

    // 7. Rare Reward: Celestial Sparkle Aura
    let sparkleAuraMesh = null;
    if (hasSparkleAura) {
      const auraCount = 20;
      const aGeo = new THREE.BufferGeometry();
      const aPos = new Float32Array(auraCount * 3);
      const aColors = new Float32Array(auraCount * 3);

      for (let i = 0; i < auraCount; i++) {
        const angle = (i / auraCount) * Math.PI * 2;
        const rad = 2.8 + (Math.random() - 0.5) * 0.5;
        aPos[i * 3] = Math.cos(angle) * rad;
        aPos[i * 3 + 1] = 0.4 + Math.random() * 0.7;
        aPos[i * 3 + 2] = Math.sin(angle) * rad;

        aColors[i * 3] = 1.0;
        aColors[i * 3 + 1] = 0.85;
        aColors[i * 3 + 2] = 0.2;
      }
      aGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3));
      aGeo.setAttribute('color', new THREE.BufferAttribute(aColors, 3));

      const aMat = new THREE.PointsMaterial({
        size: 1.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      sparkleAuraMesh = new THREE.Points(aGeo, aMat);
      group.add(sparkleAuraMesh);
    }

    // Raycast hit mesh
    const hitMesh = new THREE.Mesh(this.geoHitMesh, this.matHitInvisible);
    hitMesh.position.y = 1.0;
    group.add(hitMesh);

    return {
      group,
      flame,
      light: candleLight,
      candleHex,
      hitMesh,
      sparkleAuraMesh
    };
  }

  initAmbientFleet(count) {
    const thaiNames = [
      'คุณแม่มะลิ', 'น้องแก้วตา', 'พี่ธีระ', 'คุณยายทองดี', 'น้องพิมพ์',
      'ช่างสมชาย', 'ป้าสายใจ', 'น้องฟ้าใส', 'ลุงบุญมี', 'น้องกัปตัน',
      'พี่กานดา', 'คุณวรัญญู', 'ครอบครัวสุขใจ', 'น้องแพรวา', 'พี่นนท์'
    ];

    const thaiWishes = [
      'ขอขมาพระแม่คงคา ขอให้ครอบครัวมีความสุข สุขภาพแข็งแรงตลอดปี',
      'ขอให้การเรียนและการงานราบรื่น ประสบความสำเร็จดั่งใจหวัง',
      'ขอให้สิ่งไม่ดีลอยไปกับสายน้ำ เริ่มต้นชีวิตใหม่ที่สดใส',
      'ขอพรให้พบเจอแต่กัลยาณมิตร มีความรักที่อบอุ่นและมั่นคง',
      'ขอให้กิจการค้าขายเจริญรุ่งเรือง ร่ำรวยเงินทองและโชคลาภ',
      'ขอให้ทุกคนในครอบครัวปลอดภัย แคล้วคลาดจากภยันตรายทั้งปวง',
      'ขอให้หัวใจสงบ ร่มเย็นดั่งสายน้ำเจ้าพระยาในคืนวันเพ็ญ'
    ];

    const bases = ['banana', 'bread', 'ice'];
    const flowers = ['marigold', 'lotus', 'orchid'];
    const colors = [0xff9900, 0xff3366, 0xffdd00, 0x33ccff, 0xa855f7];

    for (let i = 0; i < count; i++) {
      const baseType = bases[i % bases.length];
      const flowerType = flowers[(i * 2) % flowers.length];
      const candleHex = colors[i % colors.length];

      const x = -150 + (i / count) * 320;
      const z = -10 + (Math.random() * 80);

      const name = thaiNames[i % thaiNames.length];
      const wish = thaiWishes[i % thaiWishes.length];

      this.spawnKrathong({
        x,
        z,
        baseType,
        flowerType,
        candleHex,
        authorName: name,
        wishText: wish,
        isUser: false,
        animatePlacement: false
      });
    }
  }

  spawnKrathong(config) {
    const {
      x,
      z,
      baseType = 'banana',
      flowerType = 'marigold',
      hasIncense = true,
      hasCoins = true,
      hasCrown = false,
      hasSparkleAura = false,
      candleHex = 0xff9900,
      authorName = 'ผู้มาร่วมงานบุญ',
      wishText = 'ขอขมาพระแม่คงคา',
      isUser = false,
      animatePlacement = false
    } = config;

    const { group, flame, light, hitMesh, sparkleAuraMesh } = this.createKrathongMesh({
      baseType,
      flowerType,
      hasIncense,
      hasCoins,
      hasCrown,
      hasSparkleAura,
      candleHex,
      isUnlit: animatePlacement
    }, isUser);

    const startY = animatePlacement ? 4.5 : 0;
    group.position.set(x, startY, z);
    group.rotation.y = Math.random() * Math.PI * 2;

    const data = {
      group,
      flame,
      light,
      hitMesh,
      sparkleAuraMesh,
      baseType,
      flowerType,
      candleHex,
      authorName,
      wishText,
      isUser,
      speedX: 0.45 + Math.random() * 0.22,
      bobOffset: Math.random() * 100,
      bobSpeed: 1.8 + Math.random() * 0.5,
      rotSpeed: (Math.random() - 0.5) * 0.04,

      isPlacing: animatePlacement,
      placeProgress: 0,
      targetY: 0,
      startY: startY,
      hasIgnited: !animatePlacement,
      sparkles: null
    };

    hitMesh.userData = { krathongData: data };

    if (isUser) {
      this.lastUserKrathong = data;
      this.userKrathongs.push(data);

      const auraGeo = new THREE.RingGeometry(2.6, 3.2, 20);
      auraGeo.rotateX(-Math.PI / 2);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.position.y = 0.05;
      group.add(aura);
      data.aura = aura;
    }

    this.krathongs.push(data);
    this.scene.add(group);
    this.updateCounterUI();
    return data;
  }

  releaseCustomUserKrathong(options) {
    const x = -25 + (Math.random() - 0.5) * 2.5;
    const z = -11 + (Math.random() - 0.5) * 2.5;

    return this.spawnKrathong({
      x,
      z,
      baseType: options.baseType,
      flowerType: options.flowerType,
      hasIncense: options.hasIncense,
      hasCoins: options.hasCoins,
      hasCrown: options.hasCrown,
      hasSparkleAura: options.hasSparkleAura,
      candleHex: options.candleHex,
      authorName: options.authorName || 'คุณผู้มาเยือน',
      wishText: options.wishText || 'ขอขมาพระแม่คงคา และขอให้ชีวิตมีแต่ความเจริญรุ่งเรือง',
      isUser: true,
      animatePlacement: true
    });
  }

  createSparkleEffect(position) {
    const count = 25;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 2.0;
      positions[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 3.0;
      velocities.push(new THREE.Vector3(
        Math.cos(angle) * speed,
        3.5 + Math.random() * 3.5,
        Math.sin(angle) * speed
      ));

      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 0.2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const sparkles = new THREE.Points(geo, mat);
    sparkles.userData = { velocities, age: 0, maxAge: 1.0 };
    return sparkles;
  }

  update(time, delta) {
    const getWaveHeight = (x, z) => {
      return Math.sin(x * 0.12 + time * 1.8 + z * 0.08) * 0.35 +
             Math.cos(x * 0.22 - time * 2.2 + z * 0.15) * 0.18 +
             Math.sin(z * 0.28 + time * 1.2) * 0.12;
    };

    for (let i = this.krathongs.length - 1; i >= 0; i--) {
      const k = this.krathongs[i];

      if (k.isPlacing) {
        k.placeProgress += delta * 0.85;

        const ease = 1 - Math.pow(1 - Math.min(k.placeProgress, 1.0), 3);
        const waveY = getWaveHeight(k.group.position.x, k.group.position.z);
        k.group.position.y = THREE.MathUtils.lerp(k.startY, waveY + 0.1, ease);

        if (k.placeProgress >= 0.55 && !k.hasIgnited) {
          k.hasIgnited = true;
          k.flame.visible = true;
          if (k.light) k.light.intensity = 2.4;

          if (this.sound) this.sound.playIgnite();

          const sparkles = this.createSparkleEffect(k.group.position);
          k.group.add(sparkles);
          k.sparkles = sparkles;
        }

        if (k.sparkles) {
          k.sparkles.userData.age += delta;
          const sPos = k.sparkles.geometry.attributes.position.array;
          const vels = k.sparkles.userData.velocities;

          for (let j = 0; j < vels.length; j++) {
            vels[j].y -= 9.8 * delta;
            sPos[j * 3] += vels[j].x * delta;
            sPos[j * 3 + 1] += vels[j].y * delta;
            sPos[j * 3 + 2] += vels[j].z * delta;
          }
          k.sparkles.geometry.attributes.position.needsUpdate = true;
          k.sparkles.material.opacity = 1.0 - (k.sparkles.userData.age / k.sparkles.userData.maxAge);

          if (k.sparkles.userData.age >= k.sparkles.userData.maxAge) {
            k.group.remove(k.sparkles);
            k.sparkles = null;
          }
        }

        if (k.placeProgress >= 1.0) {
          k.isPlacing = false;
        }
      } else {
        k.group.position.x += k.speedX * delta * 5.0;

        const waveY = getWaveHeight(k.group.position.x, k.group.position.z);
        k.group.position.y = waveY + 0.1;
      }

      k.group.rotation.y += k.rotSpeed * delta;
      k.group.rotation.z = Math.sin(time * k.bobSpeed + k.bobOffset) * 0.06;
      k.group.rotation.x = Math.cos(time * k.bobSpeed + k.bobOffset) * 0.05;

      if (k.flame.visible) {
        const flicker = 1.0 + 0.2 * Math.sin(time * 18.0 + k.bobOffset);
        k.flame.scale.set(flicker, 1.0 + 0.25 * Math.cos(time * 24.0), flicker);
        if (k.light) {
          k.light.intensity = 2.0 + 0.6 * Math.sin(time * 15.0 + k.bobOffset);
        }
      }

      if (k.sparkleAuraMesh) {
        k.sparkleAuraMesh.rotation.y += delta * 1.2;
      }

      if (k.aura) {
        k.aura.rotation.z += delta * 0.9;
        k.aura.material.opacity = 0.45 + 0.35 * Math.sin(time * 4.5);
      }

      if (k.group.position.x > 185) {
        if (k.isUser) {
          k.group.position.x = -170;
        } else {
          k.group.position.x = -170;
          k.group.position.z = -10 + Math.random() * 80;
        }
      }
    }
  }

  updateCounterUI() {
    const el = document.getElementById('stat-krathongs');
    if (el) el.textContent = this.krathongs.length;
  }
}
