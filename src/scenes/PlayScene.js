import Phaser from 'phaser';
import { COLORS, DIFFICULTY_CURVE, WORLD_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';
import { ParticleEffectManager } from '../systems/ParticleEffectManager';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { ComboSystem } from '../systems/ComboSystem';
import { MultiplierSystem } from '../systems/MultiplierSystem';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('play');
  }

  create() {
    const w = this.scale.width, h = this.scale.height;

    this.world = gameManager.getCurrentWorld();
    this.level = gameManager.getCurrentLevel();
    this.worldConfig = WORLD_CONFIG[this.world];
    this.goalScore = this.worldConfig.goalScore;

    this.score = 0;
    this.crystals = gameManager.data.crystals;
    this.meters = 0;
    this.best = Number(localStorage.getItem('skypulse_best') || 0);

    this.wagons = [];
    this.collectedCoins = 0;
    this.coinsForWagon = 15;
    this.maxWagons = 12 + (gameManager.getUpgradeLevel('maxWagons') || 0) * 2;
    this.wagonGap = 28 - (gameManager.getUpgradeLevel('wagonGap') || 0) * 2;
    this.wagonSpring = 0.25;
    this.targetPlayerX = 110;
    this.playerXSpeed = 0.05;
    this.maxTargetX = 200;

    this.started = false;
    this.dead = false;
    this.levelIndex = 0;
    this.isPaused = false;
    this.pauseOverlay = null;
    this.pauseText = null;
    this.scoreZones = [];

    this.maxHeadHP = 3 + gameManager.getUpgradeLevel('headHP');
    this.headHP = this.maxHeadHP;
    this.wagonBaseHP = 1 + gameManager.getUpgradeLevel('wagonHP');

    this.baseSpeed = 240;
    this.currentSpeed = this.baseSpeed;
    this.gateTexture = this.worldConfig.gateTexture;

    this.bonusActive = false;
    this.bonusType = null;
    this.bonusTime = 0;
    this.bonusMultiplier = 1;
    this.bonusTimer = null;
    this.shieldActive = false;
    this.magnetActive = false;
    this.magnetRange = 220 + gameManager.getUpgradeLevel('magnetRange') * 40;
    this.lastBonusTime = 0;
    this.shieldDuration = 5 + gameManager.getUpgradeLevel('shieldDuration') * 1.5;

    this.upgradeSystem = new UpgradeSystem(this);
    this.jumpPower = 300 + gameManager.getUpgradeLevel('jumpPower') * 25;
    this.questSystem = new QuestSystem();

    this.pipes = [];
    this.coins = [];
    this.scoreZones = [];
    this.stars = [];
    this.backgroundElements = [];

    this.spawnTimer = null;
    this.stationTimer = null;

    this.particleManager = new ParticleEffectManager(this);
    this.initAchievements();
    this.initDailyRewards();
    this.initLeaderboard();
    this.initStats();

    this.comboSystem = new ComboSystem(this);
    this.multiplierSystem = new MultiplierSystem(this);

    this.createBackground();
    this.createPlayer();
    this.createUI();

    this.input.on('pointerdown', (pointer) => {
      if (pointer.targetObject || this.dead) return;
      if (!this.started) this.startRun();
      this.flap();
    });

    this.physics.world.setBounds(0, 0, w, h);

    audioManager.playMusic(this, 0.2);
  }

  createBackground() {
    const w = this.scale.width, h = this.scale.height;
    // Основной цвет фона из конфига мира
    this.cameras.main.setBackgroundColor(this.worldConfig.bgColor);

    // Создаём слои фона согласно конфигурации мира
    const layers = this.worldConfig.backgroundLayers || [];
    layers.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        let x, y;
        if (layer.key === 'stars_far' || layer.key === 'stars_mid') {
          x = Phaser.Math.Between(0, w);
          y = Phaser.Math.Between(0, h);
        } else if (layer.key === 'city_bg' || layer.key === 'buildings' || layer.key === 'dungeon_wall') {
          x = i * 200; // тайлы
          y = h - 100;
        } else if (layer.key === 'cars') {
          x = i * 150;
          y = h - 50;
        } else if (layer.key === 'people') {
          x = i * 100;
          y = h - 30;
        } else if (layer.key === 'planets') {
          x = Phaser.Math.Between(w, w * 3);
          y = Phaser.Math.Between(50, h - 50);
        } else {
          x = Phaser.Math.Between(0, w * 2);
          y = Phaser.Math.Between(0, h);
        }
        const sprite = this.add.image(x, y, layer.key);
        sprite.setDepth(-20 + i);
        sprite.setAlpha(0.8);
        if (layer.key === 'cars') {
          sprite.setScale(0.8);
        }
        this.backgroundElements.push({ sprite, speed: layer.speed, initialX: x });
      }
    });
  }

  createPlayer() {
    const h = this.scale.height;
    this.player = this.physics.add.image(this.targetPlayerX, h / 2, 'player');
    this.player.setScale(0.9);
    this.player.setCollideWorldBounds(false);
    this.player.setMaxVelocity(600, 1000);
    this.player.body.setCircle(24, 15, 5);
    this.player.body.setMass(10000);
    this.player.body.setDrag(500, 0);
    this.player.setDepth(15);
    this.player.setBlendMode(Phaser.BlendModes.ADD);

    this.trailEmitter = this.add.particles(0, 0, 'flare', {
      speed: 40,
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 200,
      blendMode: Phaser.BlendModes.ADD,
      follow: this.player,
      followOffset: { x: -20, y: 0 },
      quantity: 4,
      frequency: 15,
      tint: [0x00ffff, 0xff00ff, 0xffff00]
    });

    this.coinSound = this.sound.add('coin_sound', { volume: 0.4 });
    this.wagonSound = this.sound.add('wagon_sound', { volume: 0.6 });
    this.levelUpSound = this.sound.add('level_up_sound', { volume: 0.5 });
    this.hitSound = this.sound.add('tap_sound', { volume: 0.3 });
  }

  createUI() {
    const w = this.scale.width, h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";

    this.scoreText = this.add.text(w / 2, 30, '0', {
      fontSize: '38px', fontFamily, color: '#ffffff', stroke: '#00ffff', strokeThickness: 6,
      shadow: { blur: 10, color: '#00ffff', fill: true }
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.goalText = this.add.text(w / 2, 80, `ЦЕЛЬ: ${this.goalScore}`, {
      fontSize: '14px', fontFamily, color: COLORS.accent, stroke: '#0f172a', strokeThickness: 2
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.crystalText = this.add.text(w - 10, 10, `💎 ${this.crystals}`, {
      fontSize: '14px', fontFamily, color: '#fde047', stroke: '#0f172a', strokeThickness: 2
    }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);

    this.meterText = this.add.text(10, h - 80, `📏 0 м`, {
      fontSize: '12px', fontFamily, color: '#a5f3fc', stroke: '#0f172a', strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.wagonCountText = this.add.text(w - 100, h - 30, `🚃 0/${this.maxWagons}`, {
      fontSize: '12px', fontFamily, color: '#88ccff', stroke: '#0f172a', strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.heartContainer = this.add.container(10, 30).setDepth(10).setScrollFactor(0);
    this.updateHearts();

    this.pauseButton = this.add.image(w - 35, h - 35, 'pause_button')
      .setInteractive().setDepth(20).setScrollFactor(0)
      .on('pointerdown', () => this.togglePause())
      .on('pointerover', () => this.pauseButton.setScale(1.1))
      .on('pointerout', () => this.pauseButton.setScale(1));

    this.menuButton = this.add.image(w - 90, h - 35, 'menu_button')
      .setInteractive().setDepth(20).setScrollFactor(0)
      .on('pointerdown', () => this.confirmExit())
      .on('pointerover', () => this.menuButton.setScale(1.1))
      .on('pointerout', () => this.menuButton.setScale(1));

    this.introText = this.add.text(w / 2, h / 2, 'СОБИРАЙ МОНЕТЫ\nЧТОБЫ УДЛИНИТЬ ТАКСИ', {
      fontSize: '16px', fontFamily, color: '#ffffff', align: 'center', stroke: '#7c3aed', strokeThickness: 2
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.coinTipsText = this.add.text(w / 2, h / 2 + 60,
      '🟡 Золото | 🔴 Скорость | 🔵 Щит | 🟢 Магнит | 🟣 Замедление', {
      fontSize: '10px', fontFamily, color: '#cbd5e1', align: 'center'
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  }

  update(time, delta) {
    if (this.isPaused || this.dead) return;

    this.updateBackground(delta);
    if (!this.started) return;

    this.player.update?.(delta);
    this.targetPlayerX = Math.min(this.maxTargetX, this.targetPlayerX);
    this.player.x += (this.targetPlayerX - this.player.x) * this.playerXSpeed;

    const body = this.player.body;
    this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75));

    if (!this.shieldActive && (this.player.y < -50 || this.player.y > this.scale.height + 50)) {
      this.handleDeath();
    }

    if (this.magnetActive) {
      this.coins.forEach(coin => {
        if (!coin.active) return;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, coin.x, coin.y);
        if (dist < this.magnetRange) {
          const angle = Phaser.Math.Angle.Between(coin.x, coin.y, this.player.x, this.player.y);
          coin.x += Math.cos(angle) * 10;
          coin.y += Math.sin(angle) * 10;
        }
      });
    }

    this.updateWagons();
    this.cleanupObjects();

    // Проверка достижения цели
    if (this.score >= this.goalScore) {
      this.completeLevel();
    }

    this.meters += this.currentSpeed * delta / 1000 / 10;
    this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
    this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
  }

  updateBackground(delta) {
    const factor = this.started && !this.dead ? 1 : 0.3;
    const dt = delta / 1000;
    this.backgroundElements.forEach(el => {
      el.sprite.x -= el.speed * factor * dt * 100; // скорость пропорциональна времени
      if (el.sprite.x < -el.sprite.width) {
        // Перемещаем спрайт вправо для бесконечного цикла
        el.sprite.x = this.scale.width + Phaser.Math.Between(0, 200);
      }
    });
  }

  startRun() {
    this.started = true;
    this.introText.setVisible(false);
    this.coinTipsText.setVisible(false);
    this.spawnGate();
    this.scheduleNextSpawn();
  }

  spawnGate() {
    const w = this.scale.width, h = this.scale.height;
    const difficulty = this.getDifficulty();
    const gap = difficulty.gap + Phaser.Math.Between(-15, 15);
    const centerY = Phaser.Math.Between(120, h - 120);
    const topY = centerY - gap / 2;
    const bottomY = centerY + gap / 2;
    const x = w;

    const topPipe = this.physics.add.image(x, topY, this.gateTexture)
      .setOrigin(0.5, 1).setImmovable(true)
      .setScale(1, Math.max(0.2, topY / 400))
      .setVelocityX(-difficulty.speed);
    topPipe.body.setAllowGravity(false);
    topPipe.setBlendMode(Phaser.BlendModes.ADD);
    topPipe.setDepth(5);

    const bottomPipe = this.physics.add.image(x, bottomY, this.gateTexture)
      .setOrigin(0.5, 0).setImmovable(true)
      .setScale(1, Math.max(0.2, (h - bottomY) / 400))
      .setVelocityX(-difficulty.speed);
    bottomPipe.body.setAllowGravity(false);
    bottomPipe.setBlendMode(Phaser.BlendModes.ADD);
    bottomPipe.setDepth(5);

    [topPipe, bottomPipe].forEach(pipe => {
      pipe.setScale(1, 0.01);
      this.tweens.add({ targets: pipe, scaleY: pipe.scaleY, duration: 300, ease: 'Back.out' });
    });

    this.pipes.push(topPipe, bottomPipe);
    this.physics.add.collider(this.player, topPipe, (p, pipe) => this.hitPipe(p, pipe), null, this);
    this.physics.add.collider(this.player, bottomPipe, (p, pipe) => this.hitPipe(p, pipe), null, this);

    const zone = this.add.zone(x + 60, h / 2, 12, h);
    this.physics.add.existing(zone);
    zone.body.setAllowGravity(false);
    zone.body.setImmovable(true);
    zone.body.setVelocityX(-difficulty.speed);
    zone.passed = false;
    this.scoreZones.push(zone);
    this.physics.add.overlap(this.player, zone, () => this.passGate(zone), null, this);

    if (Math.random() < difficulty.coinChance) this.spawnCoin(x, centerY);
  }

  passGate(zone) {
    if (zone.passed) return;
    zone.passed = true;
    const baseScore = 10;
    const multiplier = this.comboSystem.getMultiplier();
    const totalScore = Math.floor(baseScore * multiplier);
    this.score += totalScore;
    this.scoreText.setText(String(this.score));
    this.comboSystem.addCombo();

    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2, scaleY: 1.2,
      duration: 100, yoyo: true, ease: 'Quad.out'
    });
  }

  spawnCoin(x, y) {
    let type = 'gold';
    const r = Math.random();
    if (this.level >= 1 && r < 0.15) type = 'red';
    else if (this.level >= 2 && r < 0.28) type = 'blue';
    else if (this.level >= 3 && r < 0.40) type = 'green';
    else if (this.level >= 4 && r < 0.50) type = 'purple';

    const coin = this.physics.add.image(x + Phaser.Math.Between(-20, 20), y, `coin_${type}`);
    coin.setImmovable(true);
    coin.setVelocityX(-this.currentSpeed);
    coin.setAngularVelocity(200);
    coin.body.setAllowGravity(false);
    coin.setScale(0.8);
    coin.coinType = type;
    coin.collected = false;
    coin.active = true;
    coin.setDepth(8);
    coin.setBlendMode(Phaser.BlendModes.ADD);
    this.coins.push(coin);
    this.physics.add.overlap(this.player, coin, (p, c) => this.collectCoin(c), null, this);
  }

  collectCoin(coinSprite) {
    const coin = this.coins.find(c => c === coinSprite);
    if (!coin || coin.collected) return;
    coin.collected = true;
    let value = 1, bonus = null;
    switch (coin.coinType) {
      case 'red': value = 2; bonus = 'speed'; break;
      case 'blue': bonus = 'shield'; break;
      case 'green': bonus = 'magnet'; break;
      case 'purple': bonus = 'slow'; break;
    }
    const multiplied = Math.floor(value * this.multiplierSystem.getMultiplier());
    this.crystals += multiplied;
    this.collectedCoins += value;
    this.crystalText.setText(`💎 ${this.crystals}`);

    if (this.collectedCoins >= this.coinsForWagon && this.wagons.length < this.maxWagons) {
      this.addWagon();
      this.collectedCoins -= this.coinsForWagon;
    }

    if (bonus) {
      this.activateBonus(bonus);
      this.particleManager.createCoinCollectEffect(coin.x, coin.y, coin.coinType);
    } else {
      this.particleManager.createCoinCollectEffect(coin.x, coin.y, 'gold');
    }
    this.coinSound.play();
    gameManager.addCrystals(multiplied);
    coin.destroy();
    this.coins = this.coins.filter(c => c !== coin);
  }

  addWagon() {
    if (this.wagons.length >= this.maxWagons) return;
    const last = this.wagons.length > 0 ? this.wagons[this.wagons.length - 1] : this.player;
    const spawnX = last.x - this.wagonGap * 2;
    const spawnY = last.y;
    const texIndex = Phaser.Math.Between(0, 9);
    const wagon = this.physics.add.image(spawnX, spawnY, `wagon_${texIndex}`);
    wagon.setScale(0.8);
    wagon.body.setCircle(12, 8, 6);
    wagon.body.setAllowGravity(true);
    wagon.body.setMass(0.5);
    wagon.body.setDrag(0.9);
    wagon.setDepth(5 + this.wagons.length);
    wagon.setData('hp', this.wagonBaseHP);
    wagon.setTint(0x88aaff);
    wagon.setBlendMode(Phaser.BlendModes.ADD);
    this.wagons.push(wagon);
    this.physics.add.collider(wagon, this.pipes, (w, p) => this.wagonHit(w, p), null, this);
    this.wagonSound.play();
    this.particleManager.createWagonSpawnEffect(wagon);
    this.targetPlayerX += this.wagonGap * 0.5;
    this.targetPlayerX = Math.min(this.scale.width * 0.8, this.targetPlayerX);
  }

  updateWagons() {
    if (this.wagons.length === 0) return;
    let prev = this.player;
    for (let i = 0; i < this.wagons.length; i++) {
      const wagon = this.wagons[i];
      const targetX = prev.x - this.wagonGap;
      const targetY = prev.y;
      const dx = targetX - wagon.x;
      const dy = targetY - wagon.y;
      wagon.x += dx * this.wagonSpring;
      wagon.y += dy * this.wagonSpring;
      if (wagon.body) wagon.body.reset(wagon.x, wagon.y);
      prev = wagon;
    }
  }

  wagonHit(wagon, pipe) {
    let hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      this.wagons = this.wagons.filter(w => w !== wagon);
      this.particleManager.createWagonDestroyEffect(wagon);
      wagon.destroy();
      this.targetPlayerX -= this.wagonGap * 0.5;
      this.targetPlayerX = Math.max(110, this.targetPlayerX);
      this.cameras.main.shake(150, 0.008);
    } else {
      wagon.setData('hp', hp);
      wagon.setTint(0xff8888);
      this.time.delayedCall(200, () => wagon.setTint(0x88aaff));
    }
  }

  hitPipe(player, pipe) {
    if (this.shieldActive) {
      this.particleManager.createBonusEffect('shield', pipe.x, pipe.y);
      this.player.body.setVelocityY(-100);
      return;
    }
    this.headHP--;
    this.updateHearts();
    this.cameras.main.shake(100, 0.003);
    this.hitSound.play();
    if (this.headHP <= 0) this.handleDeath();
  }

  activateBonus(type) {
    if (this.bonusActive) this.deactivateBonus();
    this.bonusActive = true;
    this.bonusType = type;
    this.bonusTime = this.shieldDuration;
    switch (type) {
      case 'speed':
        this.currentSpeed = this.baseSpeed * 1.5;
        this.player.setTint(0xffff00);
        this.particleManager.createBonusEffect('speed', this.player.x, this.player.y);
        break;
      case 'shield':
        this.shieldActive = true;
        this.player.setTint(0x00ffff);
        this.particleManager.createShieldEffect(this.player);
        break;
      case 'magnet':
        this.magnetActive = true;
        this.player.setTint(0xff00ff);
        this.particleManager.createBonusEffect('magnet', this.player.x, this.player.y);
        break;
      case 'slow':
        this.currentSpeed = this.baseSpeed * 0.6;
        this.player.setTint(0xff8800);
        this.particleManager.createBonusEffect('slow', this.player.x, this.player.y);
        break;
    }
    this.bonusTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.bonusTime--;
        if (this.bonusTime <= 0) this.deactivateBonus();
      },
      repeat: this.bonusTime - 1
    });
  }

  deactivateBonus() {
    this.bonusActive = false;
    this.shieldActive = false;
    this.magnetActive = false;
    this.currentSpeed = this.baseSpeed;
    this.player.clearTint();
    if (this.bonusTimer) this.bonusTimer.remove();
    this.particleManager.clearAll();
  }

  updateHearts() {
    this.heartContainer.removeAll(true);
    for (let i = 0; i < this.maxHeadHP; i++) {
      const heart = this.add.image(i * 16, 0, 'heart').setScale(0.5);
      if (i >= this.headHP) heart.setTint(0x666666).setAlpha(0.5);
      else heart.setTint(0xff88ff);
      this.heartContainer.add(heart);
    }
  }

  getDifficulty() {
    const level = Math.min(this.level, 4);
    return DIFFICULTY_CURVE[level] || DIFFICULTY_CURVE[0];
  }

  scheduleNextSpawn() {
    const diff = this.getDifficulty();
    this.spawnTimer = this.time.delayedCall(diff.spawnDelay, () => {
      if (!this.dead && this.started && !this.isPaused) {
        this.spawnGate();
        this.scheduleNextSpawn();
      }
    });
  }

  completeLevel() {
    this.dead = true; // предотвращаем дальнейшие действия
    let stars = 1;
    if (this.score >= this.goalScore * 1.5) stars = 2;
    if (this.score >= this.goalScore * 2) stars = 3;
    if (this.headHP === this.maxHeadHP) stars = Math.min(3, stars + 1);

    gameManager.setLevelStars(this.world, this.level, stars);
    if (this.level < 4) gameManager.unlockLevel(this.world, this.level + 1);
    if (this.level === 4) {
      const nextWorld = this.world + 1;
      if (nextWorld < 3 && !gameManager.data.unlockedWorlds.includes(nextWorld)) {
        gameManager.data.unlockedWorlds.push(nextWorld);
        gameManager.save();
      }
    }
    gameManager.updateStats(this.score, this.level + 1, this.wagons.length);

    this.scene.start('levelComplete', {
      world: this.world,
      level: this.level,
      score: this.score,
      stars: stars,
      wagons: this.wagons.length,
      crystals: this.crystals
    });
  }

  handleDeath() {
    if (this.dead) return;
    this.dead = true;
    this.physics.pause();
    if (this.spawnTimer) this.spawnTimer.remove();
    this.cameras.main.shake(300, 0.005);
    this.player.setTint(0xff0000).setAngle(90);
    this.time.delayedCall(1000, () => {
      this.scene.start('levelComplete', {
        success: false,
        score: this.score,
        level: this.level,
        wagons: this.wagons.length,
        crystals: this.crystals
      });
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      if (this.spawnTimer) this.spawnTimer.paused = true;
      this.pauseOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
        .setOrigin(0).setDepth(50).setScrollFactor(0);
      this.pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'ПАУЗА', {
        fontSize: '40px', fontFamily: "'Orbitron', monospace", color: '#ffffff'
      }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
    } else {
      this.physics.resume();
      if (this.spawnTimer) this.spawnTimer.paused = false;
      if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
      if (this.pauseText) { this.pauseText.destroy(); this.pauseText = null; }
    }
  }

  confirmExit() {
    this.scene.start('menu');
  }

  cleanupObjects() {
    const bounds = -200;
    this.pipes = this.pipes.filter(p => {
      if (p.x < bounds) { p.destroy(); return false; }
      return true;
    });
    this.coins = this.coins.filter(c => {
      if (c.x < bounds) { c.destroy(); return false; }
      return true;
    });
    this.scoreZones = this.scoreZones.filter(z => {
      if (z.x < bounds) { z.destroy(); return false; }
      return true;
    });
  }

  // Методы для статистики (можно оставить пустыми)
  initAchievements() { /* ... */ }
  initDailyRewards() { /* ... */ }
  initLeaderboard() { /* ... */ }
  initStats() { /* ... */ }
}