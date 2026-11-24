import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { SkyManager } from './scene/sky.js';
import { RiverManager } from './scene/river.js';
import { TempleManager } from './scene/temple.js';
import { CarnivalManager } from './scene/carnival.js';
import { KrathongManager } from './scene/krathong.js';
import { FireworksManager } from './scene/fireworks.js';
import { SoundManager } from './audio/sound.js';
import { BalloonGame } from './games/balloonGame.js';
import { DunkTankGame } from './games/dunkTankGame.js';

class LoyKrathongApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.pointerDownPos = new THREE.Vector2();
    this.isPointerDown = false;

    // Camera animation state
    this.camTargetPos = new THREE.Vector3();
    this.controlsTargetPos = new THREE.Vector3();
    this.isTransitioningCam = false;
    this.currentCamPreset = 'overview';
    this.followKrathongData = null;

    // Mini-game state
    this.activeGame = null; // null | 'balloon' | 'dunk'
    this.unlockedRewards = {
      goldenLotus: false,
      crown: false,
      sparkleAura: false
    };

    // Customizer form selections
    this.customOptions = {
      baseType: 'banana',
      flowerType: 'marigold',
      hasIncense: true,
      hasCoins: true,
      hasCrown: false,
      hasSparkleAura: false,
      candleHex: 0xff9900
    };

    this.initThree();
    this.initPostProcessing();
    this.initSceneModules();
    this.initUI();
    this.setupInteractivity();
    this.setupResize();

    // Start with overview camera
    this.setCameraPreset('overview', false);

    // Fade out loading screen
    setTimeout(() => {
      const loader = document.getElementById('loading-screen');
      if (loader) loader.classList.add('fade-out');
    }, 700);

    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x071126); // Luminous midnight indigo
    this.scene.fog = new THREE.FogExp2(0x0a162d, 0.0026); // Soft atmospheric night mist

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.5, 900);
    this.camera.position.set(-15, 24, 75);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.42; // Rich, luminous exposure
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 240;
    this.controls.target.set(-20, 6, -30);
  }

  initPostProcessing() {
    const renderScene = new RenderPass(this.scene, this.camera);
    // Vibrant bloom that brings out warm golden temple lights, candles, and neon without dropping FPS
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2)),
      1.32,  // Luminous festival bloom strength
      0.72,  // Glow radius
      0.46   // Lower threshold so warm lights and temple floodlights catch the glow
    );
    const outputPass = new OutputPass();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);
    this.composer.addPass(outputPass);
  }

  initSceneModules() {
    this.sound = new SoundManager();
    this.sky = new SkyManager(this.scene);
    this.river = new RiverManager(this.scene);
    this.temple = new TempleManager(this.scene);
    this.carnival = new CarnivalManager(this.scene);
    this.krathongMgr = new KrathongManager(this.scene, this.sound);
    this.fireworks = new FireworksManager(this.scene, this.sound);

    // Initialize 2 Temple Fair Mini-Game Stalls
    const onRewardUnlock = (rewardId, rewardName) => {
      this.unlockRareReward(rewardId, rewardName);
    };

    this.balloonGame = new BalloonGame(this.scene, this.sound, onRewardUnlock);
    this.dunkTankGame = new DunkTankGame(this.scene, this.sound, onRewardUnlock);
  }

  unlockRareReward(rewardId, rewardName) {
    if (this.unlockedRewards[rewardId]) return;
    this.unlockedRewards[rewardId] = true;

    // Update customizer card UI
    const card = document.getElementById(`rare-card-${rewardId}`);
    const badge = document.getElementById(`badge-${rewardId}`);
    if (card) {
      card.classList.remove('locked');
      card.classList.add('unlocked');
    }
    if (badge) {
      badge.textContent = '✨ ปลดล็อกแล้ว!';
    }

    this.showToast(`🎉 ปลดล็อกของแต่งกระทงแรร์: ${rewardName}!`);
  }

  initUI() {
    // 1. Dual Audio Controls
    const btnMusic = document.getElementById('btn-music');
    const musicIcon = document.getElementById('music-icon');
    const btnAmbience = document.getElementById('btn-ambience');
    const ambienceIcon = document.getElementById('ambience-icon');

    btnMusic.addEventListener('click', () => {
      const playing = this.sound.toggleMusic();
      if (playing) {
        musicIcon.textContent = '🔊';
        btnMusic.classList.add('active-pill');
        this.showToast('🎵 กำลังเล่นเพลงบรรเลงระนาดเอกวันเพ็ญ');
      } else {
        musicIcon.textContent = '🔇';
        btnMusic.classList.remove('active-pill');
      }
    });

    btnAmbience.addEventListener('click', () => {
      const playing = this.sound.toggleAmbiance();
      if (playing) {
        ambienceIcon.textContent = '🌊';
        btnAmbience.classList.add('active-pill');
        this.showToast('🏮 เปิดเสียงบรรยากาศงานวัดและสายน้ำ');
      } else {
        ambienceIcon.textContent = '🔇';
        btnAmbience.classList.remove('active-pill');
      }
    });

    // 2. Camera Preset buttons
    const camButtons = document.querySelectorAll('.cam-btn');
    camButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        camButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const preset = btn.dataset.cam;
        this.setCameraPreset(preset, true);
      });
    });

    // Follow Return Bar
    const btnReturnOverview = document.getElementById('btn-return-overview');
    if (btnReturnOverview) {
      btnReturnOverview.addEventListener('click', () => {
        this.setCameraPreset('overview', true);
        camButtons.forEach(b => {
          if (b.dataset.cam === 'overview') b.classList.add('active');
          else b.classList.remove('active');
        });
      });
    }

    // 3. Mini-Game Quick Start Buttons in Bottom Bar
    const btnPlayBalloon = document.getElementById('btn-play-balloon');
    const btnPlayDunk = document.getElementById('btn-play-dunk');

    if (btnPlayBalloon) {
      btnPlayBalloon.addEventListener('click', () => this.enterMiniGame('balloon'));
    }
    if (btnPlayDunk) {
      btnPlayDunk.addEventListener('click', () => this.enterMiniGame('dunk'));
    }

    // Mini-Game Exit & Restart Buttons
    document.getElementById('btn-exit-balloon')?.addEventListener('click', () => this.exitMiniGame());
    document.getElementById('btn-restart-balloon')?.addEventListener('click', () => this.balloonGame.startGame());
    document.getElementById('btn-playagain-balloon')?.addEventListener('click', () => {
      document.getElementById('balloon-gameover').classList.add('hidden');
      this.balloonGame.startGame();
    });
    document.getElementById('btn-finish-balloon')?.addEventListener('click', () => {
      document.getElementById('balloon-gameover').classList.add('hidden');
      this.exitMiniGame();
    });

    document.getElementById('btn-exit-dunk')?.addEventListener('click', () => this.exitMiniGame());
    document.getElementById('btn-restart-dunk')?.addEventListener('click', () => this.dunkTankGame.startGame());
    document.getElementById('btn-playagain-dunk')?.addEventListener('click', () => {
      document.getElementById('dunk-gameover').classList.add('hidden');
      this.dunkTankGame.startGame();
    });
    document.getElementById('btn-finish-dunk')?.addEventListener('click', () => {
      document.getElementById('dunk-gameover').classList.add('hidden');
      this.exitMiniGame();
    });

    // 4. Krathong Customizer Modal
    const modalKrathong = document.getElementById('modal-krathong');
    const btnOpenKrathong = document.getElementById('btn-open-krathong');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelKrathong = document.getElementById('btn-cancel-krathong');
    const btnConfirmKrathong = document.getElementById('btn-confirm-krathong');

    btnOpenKrathong.addEventListener('click', () => {
      modalKrathong.classList.remove('hidden');
    });

    const closeModal = () => modalKrathong.classList.add('hidden');
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelKrathong.addEventListener('click', closeModal);

    // Standard Selector Cards (Base & Flower)
    const optCards = document.querySelectorAll('.opt-card:not(.rare-card)');
    optCards.forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.dataset.category;
        const val = card.dataset.value;

        document.querySelectorAll(`.opt-card[data-category="${cat}"]`).forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        if (cat === 'base') this.customOptions.baseType = val;
        else if (cat === 'flower') this.customOptions.flowerType = val;
      });
    });

    // Rare Unlocked Rewards Cards
    const rareCards = document.querySelectorAll('.rare-card');
    rareCards.forEach(card => {
      card.addEventListener('click', () => {
        const val = card.dataset.value;

        if (!this.unlockedRewards[val]) {
          const gameHint = val === 'goldenLotus' ? 'ซุ้มปาโป่ง' : 'ซุ้มสาวน้อยตกน้ำ';
          this.showToast(`🔒 ปลดล็อกโดยการเล่น ${gameHint} ในลานงานวัด!`);
          return;
        }

        // Toggle selected state
        const isSelected = card.classList.contains('selected');
        if (isSelected) {
          card.classList.remove('selected');
          if (val === 'goldenLotus') this.customOptions.flowerType = 'marigold';
          else if (val === 'crown') this.customOptions.hasCrown = false;
          else if (val === 'sparkleAura') this.customOptions.hasSparkleAura = false;
        } else {
          card.classList.add('selected');
          if (val === 'goldenLotus') {
            document.querySelectorAll(`.opt-card[data-category="flower"]`).forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            this.customOptions.flowerType = 'goldenLotus';
          } else if (val === 'crown') {
            this.customOptions.hasCrown = true;
          } else if (val === 'sparkleAura') {
            this.customOptions.hasSparkleAura = true;
          }
        }
      });
    });

    // Decorations Checkboxes
    const chkIncense = document.getElementById('chk-incense');
    const chkCoins = document.getElementById('chk-coins');
    if (chkIncense) chkIncense.addEventListener('change', (e) => this.customOptions.hasIncense = e.target.checked);
    if (chkCoins) chkCoins.addEventListener('change', (e) => this.customOptions.hasCoins = e.target.checked);

    // Candle Color selector
    const colorDots = document.querySelectorAll('.color-dot');
    colorDots.forEach(dot => {
      dot.addEventListener('click', () => {
        colorDots.forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
        this.customOptions.candleHex = parseInt(dot.dataset.color.replace('#', '0x'));
      });
    });

    // Confirm & Release Krathong
    btnConfirmKrathong.addEventListener('click', () => {
      const authorInput = document.getElementById('input-author');
      const wishInput = document.getElementById('input-wish');

      const authorName = authorInput.value.trim() || 'คุณผู้มีจิตศรัทธา';
      const wishText = wishInput.value.trim() || 'ขอขมาพระแม่คงคา ขอให้ชีวิตมีแต่ความสุขความเจริญ สุขภาพแข็งแรง';

      const newKrathong = this.krathongMgr.releaseCustomUserKrathong({
        baseType: this.customOptions.baseType,
        flowerType: this.customOptions.flowerType,
        hasIncense: this.customOptions.hasIncense,
        hasCoins: this.customOptions.hasCoins,
        hasCrown: this.customOptions.hasCrown,
        hasSparkleAura: this.customOptions.hasSparkleAura,
        candleHex: this.customOptions.candleHex,
        authorName,
        wishText
      });

      closeModal();
      this.showToast('🪷 วางกระทงลงน้ำ จุดเทียนสว่างไสว ขอให้สมปรารถนา');

      // Auto-switch to follow-krathong mode
      this.followKrathongData = newKrathong;
      this.setCameraPreset('krathong', true);

      camButtons.forEach(b => {
        if (b.dataset.cam === 'krathong') b.classList.add('active');
        else b.classList.remove('active');
      });
    });

    // 5. Release Lantern Button
    const btnReleaseLantern = document.getElementById('btn-release-lantern');
    btnReleaseLantern.addEventListener('click', () => {
      this.sky.releaseUserLantern();
      this.showToast('🏮 ปล่อยโคมลอยขึ้นสู่ฟากฟ้าแล้ว ค่ำคืนนี้สว่างไสว');
    });

    // 6. Firework Action Button
    const btnLaunchFirework = document.getElementById('btn-launch-firework');
    btnLaunchFirework.addEventListener('click', () => {
      const targetX = (Math.random() - 0.5) * 140;
      const targetY = 70 + Math.random() * 45;
      const targetZ = -90 + Math.random() * 60;
      this.fireworks.launch(targetX, targetY, targetZ);
      this.showToast('🎆 จุดพลุหลากสีสันฉลองคืนวันเพ็ญ!');
    });

    // 7. Close Wish Card button
    const btnCloseWish = document.getElementById('btn-close-wish');
    if (btnCloseWish) {
      btnCloseWish.addEventListener('click', () => {
        document.getElementById('wish-card').classList.add('hidden');
      });
    }

    // 8. Info Modal
    const modalInfo = document.getElementById('modal-info');
    const btnInfo = document.getElementById('btn-info');
    const btnCloseInfo = document.getElementById('btn-close-info');
    const btnGotInfo = document.getElementById('btn-got-info');

    btnInfo.addEventListener('click', () => modalInfo.classList.remove('hidden'));
    const closeInfo = () => modalInfo.classList.add('hidden');
    btnCloseInfo.addEventListener('click', closeInfo);
    btnGotInfo.addEventListener('click', closeInfo);
  }

  enterMiniGame(gameType) {
    this.activeGame = gameType;
    this.controls.enabled = false;

    // Hide normal overlays
    document.getElementById('app-header')?.classList.add('hidden-ui');
    document.getElementById('camera-toolbar')?.classList.add('hidden-ui');
    document.getElementById('bottom-actions')?.classList.add('hidden-ui');
    document.getElementById('floating-stats')?.classList.add('hidden-ui');
    document.getElementById('sky-firework-tip')?.classList.add('hidden-ui');

    if (gameType === 'balloon') {
      document.getElementById('hud-balloon-game')?.classList.remove('hidden');
      this.camTargetPos.set(28, 6.2, -37);
      this.controlsTargetPos.set(28, 6.0, -52);
      this.isTransitioningCam = true;
      this.balloonGame.startGame();
      this.showToast('🎯 เข้าสู่ซุ้มปาโป่ง! เล็งแล้วคลิกเพื่อปาลูกดอก');
    } else if (gameType === 'dunk') {
      document.getElementById('hud-dunk-game')?.classList.remove('hidden');
      this.camTargetPos.set(78, 6.2, -37);
      this.controlsTargetPos.set(78, 6.0, -52);
      this.isTransitioningCam = true;
      this.dunkTankGame.startGame();
      this.showToast('🌊 เข้าสู่ซุ้มสาวน้อยตกน้ำ! เล็งปาเข้าเป้าสีแดง');
    }
  }

  exitMiniGame() {
    this.activeGame = null;
    this.controls.enabled = true;

    // Hide game HUDs
    document.getElementById('hud-balloon-game')?.classList.add('hidden');
    document.getElementById('balloon-gameover')?.classList.add('hidden');
    document.getElementById('hud-dunk-game')?.classList.add('hidden');
    document.getElementById('dunk-gameover')?.classList.add('hidden');

    // Restore normal UI
    document.getElementById('app-header')?.classList.remove('hidden-ui');
    document.getElementById('camera-toolbar')?.classList.remove('hidden-ui');
    document.getElementById('bottom-actions')?.classList.remove('hidden-ui');
    document.getElementById('floating-stats')?.classList.remove('hidden-ui');
    document.getElementById('sky-firework-tip')?.classList.remove('hidden-ui');

    // Return camera smoothly to riverside fair view
    this.setCameraPreset('fair', true);
  }

  setupInteractivity() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('pointerdown', (e) => {
      this.isPointerDown = true;
      this.pointerDownPos.set(e.clientX, e.clientY);
    });

    canvas.addEventListener('pointerup', (e) => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;

      const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (dist < 6) {
        this.handleSceneClick(e);
      }
    });

    this.lastRaycastTime = 0;

    // Move / Aim tracking with raycast throttling (every 60ms)
    canvas.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      // Update aim crosshair position if in mini-game
      if (this.activeGame === 'balloon') {
        const ch = document.getElementById('aim-crosshair');
        if (ch) {
          ch.style.display = 'block';
          ch.style.left = `${e.clientX}px`;
          ch.style.top = `${e.clientY}px`;
        }
      } else if (this.activeGame === 'dunk') {
        const ch = document.getElementById('aim-crosshair-dunk');
        if (ch) {
          ch.style.display = 'block';
          ch.style.left = `${e.clientX}px`;
          ch.style.top = `${e.clientY}px`;
        }
      } else {
        const now = performance.now();
        if (now - this.lastRaycastTime > 60) {
          this.lastRaycastTime = now;
          this.raycaster.setFromCamera(this.mouse, this.camera);
          const hitMeshes = this.krathongMgr.krathongs.map(k => k.hitMesh);
          const stallMeshes = [this.balloonGame.stallHitMesh, this.dunkTankGame.stallHitMesh];

          const intersects = this.raycaster.intersectObjects([...hitMeshes, ...stallMeshes]);
          canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
        }
      }
    });
  }

  handleSceneClick(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. IN BALLOON GAME: Throw dart towards clicked point on stall plane
    if (this.activeGame === 'balloon') {
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 54);
      const targetPoint = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(plane, targetPoint);
      if (targetPoint) {
        this.balloonGame.shootDart(targetPoint, this.camera.position);
      }
      return;
    }

    // 2. IN DUNK TANK GAME: Throw ball towards clicked point
    if (this.activeGame === 'dunk') {
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 54);
      const targetPoint = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(plane, targetPoint);
      if (targetPoint) {
        this.dunkTankGame.throwBall(targetPoint, this.camera.position);
      }
      return;
    }

    // 3. IN NORMAL VIEW: Check if clicked on a Mini-Game Stall Hitbox
    const stallMeshes = [this.balloonGame.stallHitMesh, this.dunkTankGame.stallHitMesh];
    const stallIntersects = this.raycaster.intersectObjects(stallMeshes);
    if (stallIntersects.length > 0) {
      const gType = stallIntersects[0].object.userData.gameType;
      this.enterMiniGame(gType);
      return;
    }

    // 4. IN NORMAL VIEW: Check if clicked on a floating Krathong
    const hitMeshes = this.krathongMgr.krathongs.map(k => k.hitMesh);
    const intersects = this.raycaster.intersectObjects(hitMeshes);
    if (intersects.length > 0) {
      const hitData = intersects[0].object.userData.krathongData;
      if (hitData) {
        this.showWishCard(hitData);
        return;
      }
    }

    // 5. IN NORMAL VIEW: Clicking anywhere on the sky triggers Fireworks!
    const skyPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 90);
    const targetPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(skyPlane, targetPoint);

    if (targetPoint && targetPoint.y > 15) {
      this.fireworks.launch(targetPoint.x, targetPoint.y, targetPoint.z);
    } else {
      const targetX = (this.mouse.x * 90);
      const targetY = 65 + (this.mouse.y + 1) * 30;
      const targetZ = -90 + (Math.random() - 0.5) * 40;
      this.fireworks.launch(targetX, targetY, targetZ);
    }
  }

  showWishCard(krathongData) {
    const card = document.getElementById('wish-card');
    const wcAuthor = document.getElementById('wc-author');
    const wcType = document.getElementById('wc-type');
    const wcText = document.getElementById('wc-text');
    const wcIcon = document.getElementById('wc-icon');

    if (!card) return;

    const baseNames = { banana: 'กระทงใบตอง', bread: 'กระทงขนมปังรักษ์โลก', ice: 'กระทงน้ำแข็งเรืองแสง' };
    const flowerNames = {
      marigold: 'ดอกดาวเรือง',
      lotus: 'ดอกบัวหลวง',
      orchid: 'กล้วยไม้สีม่วง',
      goldenLotus: '✨ ดอกบัวทองคำ (แรร์)'
    };

    wcAuthor.textContent = krathongData.authorName || 'ผู้มาร่วมงานบุญ';
    wcType.textContent = `${baseNames[krathongData.baseType] || 'กระทงวิจิตร'} • ${flowerNames[krathongData.flowerType] || 'ดอกไม้มงคล'}`;
    wcText.textContent = `"${krathongData.wishText || 'ขอขมาพระแม่คงคา'}"`;

    if (krathongData.baseType === 'bread') wcIcon.textContent = '🍞';
    else if (krathongData.baseType === 'ice') wcIcon.textContent = '🧊';
    else if (krathongData.flowerType === 'goldenLotus') wcIcon.textContent = '🏵️';
    else wcIcon.textContent = '🪷';

    card.classList.remove('hidden');
  }

  setCameraPreset(preset, animate = true) {
    this.currentCamPreset = preset;
    let targetPos = new THREE.Vector3();
    let controlsTarget = new THREE.Vector3();

    const returnBar = document.getElementById('follow-return-bar');

    switch (preset) {
      case 'overview':
        targetPos.set(-15, 26, 85);
        controlsTarget.set(-20, 8, -40);
        if (returnBar) returnBar.classList.add('hidden');
        break;

      case 'pier':
        targetPos.set(-25, 6, 8);
        controlsTarget.set(-25, 2, -22);
        if (returnBar) returnBar.classList.add('hidden');
        break;

      case 'fair':
        targetPos.set(45, 14, -25);
        controlsTarget.set(55, 18, -75);
        if (returnBar) returnBar.classList.add('hidden');
        break;

      case 'krathong':
        if (returnBar) returnBar.classList.remove('hidden');
        const k = this.krathongMgr.lastUserKrathong || this.krathongMgr.krathongs[0];
        if (k) {
          const kPos = k.group.position;
          targetPos.set(kPos.x - 9, kPos.y + 4.5, kPos.z + 10);
          controlsTarget.set(kPos.x, kPos.y + 0.8, kPos.z);
        } else {
          targetPos.set(-20, 5, 5);
          controlsTarget.set(-22, 1, -12);
        }
        break;
    }

    if (!animate) {
      this.camera.position.copy(targetPos);
      this.controls.target.copy(controlsTarget);
      this.controls.update();
    } else {
      this.camTargetPos.copy(targetPos);
      this.controlsTargetPos.copy(controlsTarget);
      this.isTransitioningCam = true;
    }
  }

  showToast(message) {
    const toast = document.getElementById('toast-msg');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  setupResize() {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));

      this.composer.setSize(width, height);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Update 3D Modules
    this.sky.update(elapsedTime, delta);
    this.river.update(elapsedTime, delta);
    this.carnival.update(elapsedTime, delta);
    this.krathongMgr.update(elapsedTime, delta);
    this.fireworks.update(delta);

    // Update Mini-Games
    this.balloonGame.update(delta);
    this.dunkTankGame.update(delta);

    // Follow Krathong camera mode
    if (this.currentCamPreset === 'krathong' && !this.activeGame) {
      const targetKrathong = this.krathongMgr.lastUserKrathong || this.krathongMgr.krathongs[0];
      if (targetKrathong) {
        const kPos = targetKrathong.group.position;
        const targetCam = new THREE.Vector3(kPos.x - 9, kPos.y + 4.2, kPos.z + 9.5);
        const targetLook = new THREE.Vector3(kPos.x, kPos.y + 0.8, kPos.z);

        this.camera.position.lerp(targetCam, 0.05);
        this.controls.target.lerp(targetLook, 0.05);
      }
    } else if (this.isTransitioningCam) {
      this.camera.position.lerp(this.camTargetPos, 0.06);
      this.controls.target.lerp(this.controlsTargetPos, 0.06);

      if (this.camera.position.distanceTo(this.camTargetPos) < 0.2) {
        this.isTransitioningCam = false;
      }
    }

    if (this.controls.enabled) {
      this.controls.update();
    }

    this.composer.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new LoyKrathongApp();
});
