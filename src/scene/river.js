import * as THREE from 'three';

/**
 * Realistic River Water Surface with Gerstner Waves, Specular Moonlit Highlights,
 * Riverbanks, Promenade and Stone Embankment
 */
export class RiverManager {
  constructor(scene) {
    this.scene = scene;
    this.waterMesh = null;
    this.waterMaterial = null;

    this.initWater();
    this.initRiverBanks();
  }

  initWater() {
    // Optimized water plane for smooth 60fps performance
    const width = 360;
    const height = 180;
    const segmentsX = 70;
    const segmentsY = 35;
    const waterGeo = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    waterGeo.rotateX(-Math.PI / 2);

    // Custom GLSL Water Shader
    const customWaterShader = {
      uniforms: {
        uTime: { value: 0 },
        uMoonLightDir: { value: new THREE.Vector3(-0.4, 0.7, -0.6).normalize() },
        uDeepWaterColor: { value: new THREE.Color(0x081c38) }, // Sapphire night river
        uShallowWaterColor: { value: new THREE.Color(0x16466e) },
        uMoonSpecularColor: { value: new THREE.Color(0xfffae6) },
        uFestivalWarmGlow: { value: new THREE.Color(0xffaa22) }
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying float vWaveHeight;

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Multiple layered sine / gerstner waves flowing downriver (+X direction)
          float wave1 = sin(pos.x * 0.12 + uTime * 1.8 + pos.z * 0.08) * 0.35;
          float wave2 = cos(pos.x * 0.22 - uTime * 2.2 + pos.z * 0.15) * 0.18;
          float wave3 = sin(pos.z * 0.28 + uTime * 1.2) * 0.12;
          float totalDisplacement = wave1 + wave2 + wave3;

          pos.y += totalDisplacement;
          vWaveHeight = totalDisplacement;

          // Compute analytical normal approximation
          float dX = 0.12 * 0.35 * cos(pos.x * 0.12 + uTime * 1.8 + pos.z * 0.08)
                   - 0.22 * 0.18 * sin(pos.x * 0.22 - uTime * 2.2 + pos.z * 0.15);
          float dZ = 0.08 * 0.35 * cos(pos.x * 0.12 + uTime * 1.8 + pos.z * 0.08)
                   + 0.15 * 0.18 * sin(pos.x * 0.22 - uTime * 2.2 + pos.z * 0.15)
                   + 0.28 * 0.12 * cos(pos.z * 0.28 + uTime * 1.2);

          vec3 normal = normalize(vec3(-dX, 1.0, -dZ));
          vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;

          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uMoonLightDir;
        uniform vec3 uDeepWaterColor;
        uniform vec3 uShallowWaterColor;
        uniform vec3 uMoonSpecularColor;
        uniform vec3 uFestivalWarmGlow;
        uniform float uTime;

        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying float vWaveHeight;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);

          // Fresnel reflection term
          float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.5);

          // Base water gradient
          vec3 waterColor = mix(uDeepWaterColor, uShallowWaterColor, clamp(vWaveHeight + 0.4, 0.0, 1.0));

          // Moonlight Specular highlight (Blinn-Phong)
          vec3 halfDir = normalize(uMoonLightDir + viewDir);
          float specAngle = max(dot(normal, halfDir), 0.0);
          float specular = pow(specAngle, 90.0) * 2.4;

          // Glowing river moon track reflection
          float broadSpec = pow(specAngle, 14.0) * 0.75;

          // Luminous festival light reflection along the riverbank (Z < 30)
          float bankProximity = smoothstep(75.0, -25.0, vWorldPosition.z);
          vec3 warmReflection = uFestivalWarmGlow * bankProximity * (0.42 + 0.48 * fresnel);

          // Subtle animated river shimmer
          float shimmer = sin(vWorldPosition.x * 2.0 + uTime * 3.0) * cos(vWorldPosition.z * 2.0 - uTime * 2.0);
          shimmer = clamp(shimmer * 0.12, 0.0, 0.2);

          vec3 finalColor = waterColor;
          finalColor += warmReflection;
          finalColor += uMoonSpecularColor * (specular + broadSpec);
          finalColor += vec3(fresnel * 0.26);
          finalColor += vec3(shimmer * 0.15);

          gl_FragColor = vec4(finalColor, 0.95);
        }
      `,
      transparent: true
    };

    this.waterMaterial = new THREE.ShaderMaterial(customWaterShader);
    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
    this.waterMesh.position.set(0, 0, 50); // Water extends from Z = -40 to Z = 140
    this.scene.add(this.waterMesh);
  }

  initRiverBanks() {
    // 1. North Riverbank Stone Embankment (ริมตลิ่งฝั่งวัด)
    const bankGeo = new THREE.BoxGeometry(360, 4, 30);
    const bankMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.85,
      metalness: 0.1
    });
    const northBank = new THREE.Mesh(bankGeo, bankMat);
    northBank.position.set(0, 1, -45);
    this.scene.add(northBank);

    // Stone Steps leading down into water (บันไดท่าน้ำ)
    for (let s = 0; s < 4; s++) {
      const stepGeo = new THREE.BoxGeometry(360, 0.6, 2.5);
      const stepMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
      const step = new THREE.Mesh(stepGeo, stepMat);
      step.position.set(0, 1.8 - s * 0.55, -30 + s * 2.0);
      this.scene.add(step);
    }

    // 2. Grassy Riverside Promenade (ลานริมน้ำปูหญ้าและทางเดิน)
    const promenadeGeo = new THREE.PlaneGeometry(360, 120);
    promenadeGeo.rotateX(-Math.PI / 2);
    const promMat = new THREE.MeshStandardMaterial({
      color: 0x0f2b1d, // Deep dark green night grass
      roughness: 0.95
    });
    const promenade = new THREE.Mesh(promenadeGeo, promMat);
    promenade.position.set(0, 2.8, -110);
    this.scene.add(promenade);

    // Stone Paving near temple grounds
    const walkwayGeo = new THREE.PlaneGeometry(240, 30);
    walkwayGeo.rotateX(-Math.PI / 2);
    const walkMat = new THREE.MeshStandardMaterial({
      color: 0x2b3442,
      roughness: 0.8
    });
    const walkway = new THREE.Mesh(walkwayGeo, walkMat);
    walkway.position.set(0, 2.9, -48);
    this.scene.add(walkway);

    // 3. South Riverbank in the distance (ฝั่งตรงข้าม)
    const southBankGeo = new THREE.BoxGeometry(380, 5, 40);
    const southMat = new THREE.MeshStandardMaterial({ color: 0x07111e, roughness: 0.9 });
    const southBank = new THREE.Mesh(southBankGeo, southMat);
    southBank.position.set(0, 1, 150);
    this.scene.add(southBank);

    // Distant palm silhouettes on far bank
    for (let i = 0; i < 28; i++) {
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 12, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x0a1622 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      const x = -170 + i * 12 + (Math.random() - 0.5) * 5;
      const z = 145 + Math.random() * 10;
      trunk.position.set(x, 6, z);
      trunk.rotation.z = (Math.random() - 0.5) * 0.15;
      this.scene.add(trunk);

      // Palm foliage top
      const foliageGeo = new THREE.ConeGeometry(4.5, 6, 6);
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x061517 });
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(x, 12, z);
      this.scene.add(foliage);
    }
  }

  update(time, delta) {
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.uTime.value = time;
    }
  }
}
