import Phaser from 'phaser';
import { COLORS, DIFFICULTY_CURVE, ACHIEVEMENTS, LEVEL_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';
import { ParticleEffectManager } from '../systems/ParticleEffectManager';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { LevelManager } from '../systems/LevelManager';
import { ComboSystem } from '../systems/ComboSystem';
import { MultiplierSystem } from '../systems/MultiplierSystem';
import { Asteroid } from '../entities/Asteroid';
import { PowerUp } from '../entities/PowerUp';
// УДАЛЯЕМ ЭТОТ ИМПОРТ, ТАК КАК AIEnemy НЕТ В ОТДЕЛЬНОМ ФАЙЛЕ
// import { AIEnemy } from '../entities/AIEnemy';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('play');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Текущий мир и уровень
    this.world = gameManager.getCurrentWorld();
    this.level = gameManager.getCurrentLevel();
    this.worldConfig = LEVEL_CONFIG[this.world];

    // Основные параметры
    this.score = 0;
    this.crystals = gameManager.data.crystals;
    this.meters = 0;
    this.best = Number(localStorage.getItem('skypulse_best') || 0);

    // Вагоны
    this.wagons = [];
    this.collectedCoins = 0;
    this.coinsForWagon = 15;
    this.maxWagons = 12 + (gameManager.data.upgrades.maxWagons || 0) * 2;
    this.wagonGap = 28 - (gameManager.data.upgrades.wagonGap || 0) * 2;
    this.wagonSpring = 0.25;
    this.targetPlayerX = 110;
    this.playerXSpeed = 0.05;
    this.maxTargetX = 200;

    // Состояния
    this.started = false;
    this.dead = false;
    this.gameLevel = 0; // уровень сложности (растёт с метражом)
    this.isPaused = false;
    this.pauseOverlay = null;
    this.pauseTexts = [];
    this.spawnTimerPaused = null;
    this.bonusTimerPaused = null;

    // Здоровье
    this.maxHeadHP = 3 + (gameManager.data.upgrades.headHP || 0);
    this.headHP = this.maxHeadHP;
    this.wagonBaseHP = 1 + (gameManager.data.upgrades.wagonHP || 0);

    // Скорость
    this.baseSpeed = 240;
    this.currentSpeed = this.baseSpeed;
    this.gapSize = 240;
    this.spawnDelay = 1300;
    this.gateTextures = ['gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'];

    // Бонусы
    this.bonusActive = false;
    this.bonusType = null;
    this.bonusTime = 0;
    this.bonusMultiplier = 1;
    this.bonusTimer = null;
    this.shieldActive = false;
    this.magnetActive = false;
    this.magnetRange = 220 + (gameManager.data.upgrades.magnetRange || 0) * 40;
    this.lastBonusTime = 0;
    this.shieldDuration = 5 + (gameManager.data.upgrades.shieldDuration || 0) * 1.5;

    // Системы
    this.upgradeSystem = new UpgradeSystem(this);
    this.jumpPower = this.upgradeSystem.getUpgradeValue('jumpPower');
    this.questSystem = new QuestSystem();
    this.comboSystem = new ComboSystem(this);
    this.multiplierSystem = new MultiplierSystem(this);
    this.levelManager = new LevelManager(this);
    this.particleManager = new ParticleEffectManager(this);

    // Массивы объектов
    this.pipes = [];
    this.coins = [];
    this.scoreZones = [];
    this.stars = [];
    this.planets = [];
    this.ships = [];
    this.asteroids = [];
    this.powerUps = [];

    // Группы
    this.gateGroup = this.physics.add.group();
    this.coinGroup = this.physics.add.group();
    this.asteroidGroup = this.physics.add.group();
    this.powerUpGroup = this.physics.add.group();

    // Таймеры
    this.spawnTimer = null;

    // Счётчики для достижений
    this.initAchievements();
    this.initDailyRewards();
    this.initLeaderboard();
    this.initStats();

    // Создание объектов
    this.createBackground();
    this.createPlanets();
    this.createShips();
    this.createAsteroids();
    this.createPlayer();
    this.createUI();

    // Обработчики
    this.input.on('pointerdown', (pointer) => {
      if (pointer.targetObject) return;
      if (this.dead) { this.scene.start('menu'); return; }
      if (!this.started) this.startRun();
      this.flap();
    });

    window.addEventListener('blur', () => {
      if (this.started && !this.dead && !this.isPaused) {
        this.togglePause();
      }
    });

    this.physics.world.setBounds(0, 0, w, h);
    this.events.on('resize', this.onResize, this);
    this.scale.on('resize', this.onResize, this);

    // Музыка
    audioManager.playMusic(this, 0.2);
  }

  update(time, delta) {
    if (this.isPaused || this.countdownActive) return;

    this.updateStars(time, delta);
    this.updatePlanets(delta);
    this.updateShips(delta);
    this.updateAsteroids(delta);

    if (!this.started || this.dead) return;

    this.targetPlayerX = Math.min(this.maxTargetX, this.targetPlayerX);
    this.player.x += (this.targetPlayerX - this.player.x) * this.playerXSpeed;

    const body = this.player.body;
    this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75));

    if (!this.shieldActive && (this.player.y < -50 || this.player.y > this.scale.height + 50)) {
      this.handleDeath();
    }

    if (this.magnetActive) {
      const magnetCoins = this.coinGroup.getChildren();
      for (let coin of magnetCoins) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, coin.x, coin.y);
        if (dist < this.magnetRange) {
          const angle = Phaser.Math.Angle.Between(coin.x, coin.y, this.player.x, this.player.y);
          coin.x += Math.cos(angle) * 10;
          coin.y += Math.sin(angle) * 10;
        }
      }
    }

    this.updateWagons();
    this.cleanupObjects();

    this.checkAchievements();
    this.checkLevelComplete();
    this.comboSystem.update(delta);
    this.updateLevel();

    // Обновление астероидов
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const asteroid = this.asteroids[i];
      if (!asteroid || typeof asteroid.update !== 'function') {
        this.asteroids.splice(i, 1);
        continue;
      }
      if (!asteroid.update()) {
        this.asteroids.splice(i, 1);
      }
    }

    // Обновление усилителей
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      if (!powerUp || typeof powerUp.update !== 'function') {
        this.powerUps.splice(i, 1);
        continue;
      }
      if (!powerUp.update()) {
        this.powerUps.splice(i, 1);
      }
    }

    // Обновление метража
    this.meters += this.currentSpeed * delta / 1000 / 10;
    this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
  }

  spawnAsteroid() {
    const w = this.scale.width;
    const h = this.scale.height;
    const speed = 300 + this.gameLevel * 30;
    const x = w + 50;
    const y = Phaser.Math.Between(50, h - 50);
    
    const asteroid = new Asteroid(this, x, y, speed);
    this.asteroids.push(asteroid);
    this.asteroidGroup.add(asteroid.sprite);

    this.physics.add.overlap(this.player, asteroid.sprite, (p, a) => {
      if (!this.shieldActive) {
        this.headHP--;
        this.updateHearts();
        this.cameras.main.shake(100, 0.005);
        try { audioManager.playSound(this, 'hit_sound', 0.3); } catch (e) {}
        
        if (this.headHP <= 0) {
          this.handleDeath();
        }
        
        a.destroy();
        this.asteroids = this.asteroids.filter(ast => ast.sprite !== a);
        this.comboSystem.reset();
      }
    }, null, this);
  }

  spawnPowerUp(x, y) {
    const types = ['booster', 'shield', 'magnet', 'slowmo'];
    const type = types[Math.floor(Math.random() * types.length)];
    const powerUp = new PowerUp(this, x, y, type);
    this.powerUps.push(powerUp);
    this.powerUpGroup.add(powerUp.sprite);

    this.physics.add.overlap(this.player, powerUp.sprite, (p, pu) => {
      powerUp.collect(this.player);
      this.powerUps = this.powerUps.filter(pw => pw.sprite !== pu);
    }, null, this);
  }

  collectCoin(coin) {
    if (!coin.active || coin.collected) return;
    coin.collected = true;

    let value = 1, bonusType = null;
    switch (coin.coinType) {
      case 'red': value = 2; bonusType = 'speed'; break;
      case 'blue': value = 1; bonusType = 'shield'; break;
      case 'green': value = 1; bonusType = 'magnet'; break;
      case 'purple': value = 1; bonusType = 'slow'; break;
      default: value = 1;
    }

    if (this.bonusActive && this.bonusType === 'speed') value *= 2;
    if (this.player.doubleCrystals) value *= 2;

    const multipliedValue = Math.floor(value * this.comboSystem.getMultiplier());
    this.crystals += multipliedValue;
    this.crystalText.setText(`💎 ${this.crystals}`);
    this.collectedCoins += multipliedValue;

    this.comboSystem.add();

    if (this.collectedCoins >= this.coinsForWagon && this.wagons.length < this.maxWagons) {
      this.addWagon();
      this.collectedCoins -= this.coinsForWagon;
    }

    if (bonusType) {
      if (this.bonusActive && this.bonusType === bonusType) {
        this.bonusTime += 2;
        try { this.itemSound.play(); } catch (e) {}
      } else {
        this.activateBonus(bonusType);
      }
      this.particleManager.createCoinCollectEffect(coin.x, coin.y, coin.coinType);
    } else {
      try { this.coinSound.play(); } catch (e) {}
      this.particleManager.createCoinCollectEffect(coin.x, coin.y, 'gold');
    }

    if (this.questSystem) {
      this.questSystem.updateProgress('crystals', multipliedValue);
    }

    this.tweens.add({
      targets: this.crystalText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 80,
      yoyo: true,
      ease: 'Quad.out'
    });

    try { gameManager.vibrate([30]); } catch (e) {}

    coin.destroy();
    gameManager.data.crystals = this.crystals;
    gameManager.save();
  }

  passGateWithCombo(zone) {
    if (zone.passed) return;
    zone.passed = true;

    const baseScore = 10;
    const comboMultiplier = this.comboSystem.getMultiplier();
    const totalScore = Math.floor(baseScore * comboMultiplier);

    this.score += totalScore;
    this.scoreText.setText(String(this.score));
    this.meters += 10;
    this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);

    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('skypulse_best', String(this.best));
      this.bestText.setText(`🏆 ${this.best}`);
    }

    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Quad.out'
    });

    this.cameras.main.shake(20, 0.001);
  }

  updateLevel() {
    const newLevel = Math.floor(this.meters / 300);
    if (newLevel > this.gameLevel) {
      this.gameLevel = newLevel;
      this.updateDifficulty();
      
      const w = this.scale.width;
      const levelText = this.add.text(w / 2, 200, `УРОВЕНЬ ${this.gameLevel + 1}`, {
        fontSize: '24px',
        fontFamily: "'Orbitron', sans-serif",
        color: '#00ffff',
        stroke: '#ff00ff',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
      
      this.tweens.add({
        targets: levelText,
        alpha: 0,
        duration: 2000,
        onComplete: () => levelText.destroy()
      });
    }
  }

  checkLevelComplete() {
    if (!this.started || this.dead) return;
    if (this.score >= this.worldConfig.goalScore) {
      this.completeLevel();
    }
  }

  completeLevel() {
    let stars = 1;
    if (this.score >= this.worldConfig.goalScore * 1.5) stars = 2;
    if (this.score >= this.worldConfig.goalScore * 2) stars = 3;
    if (this.headHP === this.maxHeadHP) stars = Math.min(3, stars + 1);

    gameManager.setLevelStars(this.world, this.level, stars);

    if (this.level < 9) {
      gameManager.unlockLevel(this.world, this.level + 1);
    }
    if (this.level === 9 && this.world < 4) {
      const worlds = gameManager.data.unlockedWorlds;
      if (!worlds.includes(this.world + 1)) {
        worlds.push(this.world + 1);
        gameManager.save();
      }
    }

    gameManager.updateStats(
      this.score, 
      this.level + 1, 
      this.wagons.length, 
      this.comboSystem.maxCombo,
      this.collectedCoins,
      0,
      Math.floor(this.meters)
    );

    this.scene.start('levelComplete', {
      world: this.world,
      level: this.level,
      score: this.score,
      stars: stars,
      coins: this.collectedCoins,
      wagons: this.wagons.length,
      newUnlock: this.level < 9
    });
  }

  createBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.setDepth(-30);

    for (let i = 0; i < 200; i++) {
      const star = this.add.image(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), 'star');
      star.setScale(Phaser.Math.FloatBetween(0.2, 1.8));
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
      star.setDepth(-25);
      this.stars.push({ 
        sprite: star, 
        speed: Phaser.Math.Between(3, 20), 
        flicker: Phaser.Math.FloatBetween(0.01, 0.03) 
      });
    }
  }

  createPlanets() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 1; i <= 5; i++) {
      const x = Phaser.Math.Between(w, w * 15);
      const y = Phaser.Math.Between(50, h - 50);
      const planet = this.add.image(x, y, `planet_${i}`);
      planet.setScale(Phaser.Math.FloatBetween(2.0, 4.0));
      planet.setTint(0x8888ff);
      planet.setAlpha(0.6 + Math.random() * 0.3);
      planet.setDepth(-15);
      planet.setBlendMode(Phaser.BlendModes.ADD);
      this.planets.push({ 
        sprite: planet, 
        speed: Phaser.Math.Between(2, 12), 
        flicker: Phaser.Math.FloatBetween(0.005, 0.01) 
      });
    }
  }

  createShips() {
    const w = this.scale.width;
    const h = this.scale.height;
    const shipTextures = ['bg_ship_1', 'bg_ship_2'];

    for (let i = 0; i < 8; i++) {
      const tex = shipTextures[Math.floor(Math.random() * shipTextures.length)];
      const ship = this.add.image(Phaser.Math.Between(w, w * 12), Phaser.Math.Between(50, h - 50), tex);
      ship.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      ship.setTint(0x00ffff);
      ship.setAlpha(0.7);
      ship.setDepth(-10);
      ship.setBlendMode(Phaser.BlendModes.ADD);
      this.ships.push({ sprite: ship, speed: Phaser.Math.Between(3, 10) });
    }
  }

  createAsteroids() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < 10; i++) {
      const tex = i % 2 === 0 ? 'bg_asteroid_1' : 'bg_asteroid_2';
      const asteroid = this.add.image(Phaser.Math.Between(w, w * 12), Phaser.Math.Between(50, h - 50), tex);
      asteroid.setScale(Phaser.Math.FloatBetween(0.6, 1.8));
      asteroid.setTint(0xff8800);
      asteroid.setAlpha(0.7);
      asteroid.setDepth(-12);
      asteroid.setBlendMode(Phaser.BlendModes.ADD);
      this.asteroids.push({ sprite: asteroid, speed: Phaser.Math.Between(4, 14) });
    }
  }

  createPlayer() {
    const h = this.scale.height;
    const skin = gameManager.getCurrentSkin();
    
    this.player = this.physics.add.image(this.targetPlayerX, h / 2, skin);
    this.player.setScale(0.9);
    this.player.setCollideWorldBounds(false);
    this.player.setMaxVelocity(600, 1000);
    this.player.body.setCircle(24, 15, 5);
    this.player.setBlendMode(Phaser.BlendModes.ADD);
    this.player.body.setMass(10000);
    this.player.body.setDrag(500, 0);
    this.player.setDepth(15);
    this.player.setVisible(true);

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

    // Свойства игрока для бонусов
    this.player.doubleCrystals = false;
    this.player.shieldActive = false;
    this.player.magnetActive = false;
    this.player.speedBoost = 1;

    // Звуки
    try {
      this.coinSound = this.sound.add('coin_sound', { volume: 0.4 });
      this.itemSound = this.sound.add('item_sound', { volume: 0.5 });
      this.tapSound = this.sound.add('tap_sound', { volume: 0.3 });
      this.wagonSound = this.sound.add('wagon_sound', { volume: 0.6 });
      this.levelUpSound = this.sound.add('level_up_sound', { volume: 0.5 });
      this.hitSound = this.tapSound;
    } catch (e) {
      console.warn('Sounds not loaded');
    }
  }

  createUI() {
    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";

    this.scoreText = this.add.text(w / 2, 30, '0', {
      fontSize: '38px',
      fontFamily,
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 6,
      shadow: { blur: 10, color: '#00ffff', fill: true }
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.bestText = this.add.text(10, 10, `🏆 ${this.best}`, {
      fontSize: '14px',
      fontFamily,
      color: '#7dd3fc',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.crystalText = this.add.text(w - 10, 10, `💎 ${this.crystals}`, {
      fontSize: '14px',
      fontFamily,
      color: '#fde047',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);

    this.meterText = this.add.text(10, h - 80, `📏 0 м`, {
      fontSize: '12px',
      fontFamily,
      color: '#a5f3fc',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.wagonCountText = this.add.text(w - 100, h - 30, `🚃 0/${this.maxWagons}`, {
      fontSize: '12px',
      fontFamily,
      color: '#88ccff',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.heartContainer = this.add.container(10, 30).setDepth(10).setScrollFactor(0);
    this.updateHearts();

    this.introText = this.add.text(w / 2, h * 0.40, 'СОБИРАЙ МОНЕТЫ\nЧТОБЫ УДЛИНИТЬ ТАКСИ', {
      fontSize: '12px',
      fontFamily,
      color: '#ffffff',
      align: 'center',
      stroke: '#7c3aed',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    // Кнопки управления
    this.createControlButtons();

    // Коллизии
    this.physics.add.overlap(this.player, this.coinGroup, (p, c) => this.collectCoin(c), null, this);
  }

  createControlButtons() {
    const w = this.scale.width;
    const h = this.scale.height;

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

  startRun() {
    this.started = true;
    this.introText.setVisible(false);
    this.spawnGate();
    this.scheduleNextSpawn();
  }

  scheduleNextSpawn() {
    if (this.dead) return;
    const difficulty = this.getDifficulty();
    this.spawnTimer = this.time.delayedCall(difficulty.spawnDelay, () => {
      if (!this.dead && this.started && !this.isPaused) {
        this.spawnGate();
        this.scheduleNextSpawn();
      }
    });
  }

  getDifficulty() {
    const level = Math.min(this.gameLevel, 20);
    return DIFFICULTY_CURVE[level] || DIFFICULTY_CURVE[20];
  }

  updateDifficulty() {
    const diff = this.getDifficulty();
    this.baseSpeed = diff.speed;
    this.gapSize = diff.gap;
    this.spawnDelay = diff.spawnDelay;
    if (!this.bonusActive) this.currentSpeed = this.baseSpeed;
  }

  flap() {
    this.player.body.setVelocityY(-this.jumpPower * (this.player.speedBoost || 1));
    this.player.setScale(0.95);
    this.tweens.add({ 
      targets: this.player, 
      scaleX: 0.9, 
      scaleY: 0.9, 
      duration: 150, 
      ease: 'Quad.out' 
    });
    try { this.tapSound.play(); } catch (e) {}
    try { gameManager.vibrate([30]); } catch (e) {}
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.physics.pause();
      if (this.spawnTimer) this.spawnTimer.paused = true;
      
      this.pauseOverlay = this.add.rectangle(
        this.scale.width / 2, this.scale.height / 2,
        this.scale.width, this.scale.height,
        0x000000, 0.7
      ).setDepth(25).setScrollFactor(0);

      const pauseText = this.add.text(
        this.scale.width / 2, this.scale.height / 2 - 40,
        'ПАУЗА',
        { fontSize: '40px', fontFamily: "'Orbitron', monospace", color: '#ffffff' }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);

      this.pauseTexts = [pauseText];
    } else {
      this.physics.resume();
      if (this.spawnTimer) this.spawnTimer.paused = false;
      if (this.pauseOverlay) this.pauseOverlay.destroy();
      if (this.pauseTexts) this.pauseTexts.forEach(t => t.destroy());
    }
  }

  confirmExit() {
    this.scene.start('menu');
  }

  addWagon() {
    if (this.wagons.length >= this.maxWagons) return;

    const last = this.wagons.length > 0 ? this.wagons[this.wagons.length - 1] : this.player;
    const spawnX = last.x - this.wagonGap * 2;
    const spawnY = last.y;
    const texIndex = Phaser.Math.Between(0, 9);

    const wagon = this.physics.add.image(spawnX, spawnY, `wagon_${texIndex}`)
      .setScale(0.8)
      .setDepth(5 + this.wagons.length);
    wagon.body.setCircle(12, 8, 6);
    wagon.body.setAllowGravity(true);
    wagon.body.setMass(0.5);
    wagon.body.setDrag(0.9);
    wagon.setData('hp', this.wagonBaseHP);
    wagon.setData('maxHP', this.wagonBaseHP);
    wagon.setTint(0x88aaff);
    wagon.setBlendMode(Phaser.BlendModes.ADD);

    this.wagons.push(wagon);

    wagon.setAlpha(0);
    this.tweens.add({
      targets: wagon,
      alpha: 1,
      x: spawnX,
      duration: 500,
      ease: 'Sine.easeOut'
    });

    this.physics.add.collider(wagon, this.gateGroup, (w, g) => this.wagonHit(w, g), null, this);

    try { this.wagonSound.play(); } catch (e) {}
    this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
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

  wagonHit(wagon, gate) {
    const hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      this.wagons = this.wagons.filter(w => w !== wagon);
      wagon.destroy();
    } else {
      wagon.setData('hp', hp);
      wagon.setTint(0xff8888);
      this.time.delayedCall(200, () => wagon.setTint(0x88aaff));
    }
    this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
  }

  spawnGate() {
    if (this.dead) return;

    const w = this.scale.width;
    const h = this.scale.height;
    const difficulty = this.getDifficulty();
    const gateTexture = this.gateTextures[Math.min(this.gameLevel, 4)];
    const gap = difficulty.gap + Phaser.Math.Between(-15, 15);
    const centerY = Phaser.Math.Between(120, h - 120);
    const topY = centerY - gap / 2;
    const bottomY = centerY + gap / 2;
    const x = w;

    // ИСПРАВЛЕНИЕ: ЯВНО ОТКЛЮЧАЕМ ГРАВИТАЦИЮ ДЛЯ ВОРОТ
    const topPipe = this.physics.add.image(x, topY, gateTexture)
      .setOrigin(0.5, 1)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, topY / 400));
    
    topPipe.body.setAllowGravity(false); // ОТКЛЮЧАЕМ ГРАВИТАЦИЮ
    topPipe.body.setGravityY(0); // ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА
    topPipe.setVelocityX(-difficulty.speed);
    topPipe.setBlendMode(Phaser.BlendModes.ADD);
    topPipe.body.moves = true; // РАЗРЕШАЕМ ДВИЖЕНИЕ

    const bottomPipe = this.physics.add.image(x, bottomY, gateTexture)
      .setOrigin(0.5, 0)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, (h - bottomY) / 400));
    
    bottomPipe.body.setAllowGravity(false); // ОТКЛЮЧАЕМ ГРАВИТАЦИЮ
    bottomPipe.body.setGravityY(0); // ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА
    bottomPipe.setVelocityX(-difficulty.speed);
    bottomPipe.setBlendMode(Phaser.BlendModes.ADD);
    bottomPipe.body.moves = true; // РАЗРЕШАЕМ ДВИЖЕНИЕ

    this.pipes.push(topPipe, bottomPipe);
    this.gateGroup.add(topPipe);
    this.gateGroup.add(bottomPipe);

    this.physics.add.collider(this.player, topPipe, (p, pi) => this.hitPipe(p, pi), null, this);
    this.physics.add.collider(this.player, bottomPipe, (p, pi) => this.hitPipe(p, pi), null, this);

    const zone = this.add.zone(x + 60, h / 2, 12, h);
    this.physics.add.existing(zone);
    zone.body.setAllowGravity(false);
    zone.body.setGravityY(0); // ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА
    zone.body.setImmovable(true);
    zone.body.setVelocityX(-difficulty.speed);
    zone.body.moves = true; // РАЗРЕШАЕМ ДВИЖЕНИЕ
    zone.passed = false;
    
    this.physics.add.overlap(this.player, zone, (p, z) => {
      if (!z.passed) {
        z.passed = true;
        this.passGateWithCombo(z);
      }
    }, null, this);
    
    this.scoreZones.push(zone);

    if (Math.random() < difficulty.coinChance) this.spawnCoin(x, centerY);
    if (Math.random() < difficulty.asteroidChance) this.spawnAsteroid();
    if (Math.random() < difficulty.powerUpChance) this.spawnPowerUp(x + 100, centerY);
  }

  spawnCoin(x, y) {
    if (Math.random() > 0.9) return;
    
    let coinType = 'gold', texture = 'coin_gold';
    const r = Math.random();
    
    const redChance = 0.1 + (this.gameLevel * 0.02);
    const blueChance = 0.1 + (this.gameLevel * 0.015);
    const greenChance = 0.1 + (this.gameLevel * 0.01);
    const purpleChance = 0.1 + (this.gameLevel * 0.005);
    
    if (this.gameLevel >= 1 && r < redChance) { 
      coinType = 'red'; 
      texture = 'coin_red'; 
    }
    else if (this.gameLevel >= 2 && r < redChance + blueChance) { 
      coinType = 'blue'; 
      texture = 'coin_blue'; 
    }
    else if (this.gameLevel >= 3 && r < redChance + blueChance + greenChance) { 
      coinType = 'green'; 
      texture = 'coin_green'; 
    }
    else if (this.gameLevel >= 4 && r < redChance + blueChance + greenChance + purpleChance) { 
      coinType = 'purple'; 
      texture = 'coin_purple'; 
    }
    
    const coin = this.physics.add.image(x + Phaser.Math.Between(-20, 20), y, texture)
      .setImmovable(true)
      .setVelocityX(-this.currentSpeed)
      .setAngularVelocity(200);
    
    coin.body.setAllowGravity(false);
    coin.body.setGravityY(0);
    coin.body.setVelocityY(0);
    
    coin.setScale(0.01);
    coin.coinType = coinType;
    coin.setBlendMode(Phaser.BlendModes.ADD);
    coin.collected = false;
    
    this.tweens.add({ 
      targets: coin, 
      scaleX: 1, 
      scaleY: 1, 
      duration: 300, 
      ease: 'Back.out' 
    });
    
    this.coinGroup.add(coin);
  }

  hitPipe(player, pipe) {
    if (this.shieldActive) return;
    this.headHP--;
    this.updateHearts();
    this.cameras.main.shake(100, 0.003);
    try { this.hitSound.play(); } catch (e) {}
    
    if (this.headHP <= 0) {
      this.handleDeath();
    } else {
      this.player.setTint(0xff8888);
      this.time.delayedCall(500, () => this.player.clearTint());
    }
  }

  handleDeath() {
    if (this.dead) return;
    this.dead = true;
    this.trailEmitter.stop();
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.bonusTimer) this.bonusTimer.remove();

    this.physics.pause();
    this.cameras.main.shake(300, 0.005);
    this.cameras.main.flash(300, 255, 100, 100, false);
    this.player.setTint(0xff0000).setAngle(90);

    const emitter = this.add.particles(this.player.x, this.player.y, 'flare', {
      speed: 250,
      scale: { start: 1.2, end: 0 },
      lifespan: 600,
      quantity: 50,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xff0000, 0xff8800, 0xff00ff]
    });
    emitter.explode(50);

    this.updateLeaderboard();
    this.updateStats();

    this.time.delayedCall(1000, () => {
      this.scene.start('menu');
    });
  }

  activateBonus(type) {
    const now = Date.now();
    if (now - this.lastBonusTime < 300) return;
    this.lastBonusTime = now;

    if (this.bonusActive) this.deactivateBonus();

    this.bonusActive = true;
    this.bonusType = type;
    this.bonusTime = this.shieldDuration;

    switch (type) {
      case 'speed':
        this.currentSpeed = this.baseSpeed * 1.5;
        this.bonusMultiplier = 2;
        this.player.setTint(0xffff00);
        this.player.speedBoost = 1.5;
        break;
      case 'shield':
        this.shieldActive = true;
        this.player.setTint(0x00ffff);
        this.player.shieldActive = true;
        break;
      case 'magnet':
        this.magnetActive = true;
        this.player.setTint(0xff00ff);
        this.player.magnetActive = true;
        break;
      case 'slow':
        this.currentSpeed = this.baseSpeed * 0.6;
        this.player.setTint(0xff8800);
        break;
    }

    if (this.bonusTimer) this.bonusTimer.remove();

    this.bonusTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        this.bonusTime -= 0.1;
        if (this.bonusTime <= 0) {
          this.deactivateBonus();
        }
      },
      loop: true
    });
  }

  deactivateBonus() {
    if (!this.bonusActive) return;
    this.bonusActive = false;
    this.bonusType = null;
    this.shieldActive = false;
    this.magnetActive = false;
    this.player.shieldActive = false;
    this.player.magnetActive = false;
    this.player.speedBoost = 1;
    this.bonusMultiplier = 1;
    this.currentSpeed = this.baseSpeed;
    this.player.clearTint();
    if (this.bonusTimer) this.bonusTimer.remove();
  }

  cleanupObjects() {
    this.pipes = this.pipes.filter(p => {
      if (p.x < -150) { p.destroy(); return false; }
      return true;
    });

    this.scoreZones = this.scoreZones.filter(z => {
      if (z.x < -60) { z.destroy(); return false; }
      return true;
    });

    this.gateGroup.getChildren().forEach(g => {
      if (g.x < -150) g.destroy();
    });

    this.coinGroup.getChildren().forEach(c => {
      if (c.x < -100) c.destroy();
    });
  }

  updateStars(time, delta) {
    const w = this.scale.width;
    const h = this.scale.height;
    const factor = this.started && !this.dead ? 1 : 0.3;
    const dt = delta / 1000;

    for (let s of this.stars) {
      s.sprite.x -= s.speed * factor * dt;
      if (s.flicker) {
        s.sprite.alpha = 0.5 + Math.sin(time * s.flicker) * 0.3;
      }
      if (s.sprite.x < -10) {
        s.sprite.x = w + Phaser.Math.Between(5, 50);
        s.sprite.y = Phaser.Math.Between(0, h);
      }
    }
  }

  updatePlanets(delta) {
    const w = this.scale.width;
    const factor = this.started && !this.dead ? 0.2 : 0.05;
    const dt = delta / 1000;

    for (let p of this.planets) {
      p.sprite.x -= p.speed * factor * dt;
      if (p.sprite.x < -300) {
        p.sprite.x = w + Phaser.Math.Between(400, 2000);
        p.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  updateShips(delta) {
    const w = this.scale.width;
    const factor = this.started && !this.dead ? 0.3 : 0.1;
    const dt = delta / 1000;

    for (let s of this.ships) {
      s.sprite.x -= s.speed * factor * dt;
      if (s.sprite.x < -200) {
        s.sprite.x = w + Phaser.Math.Between(300, 1500);
        s.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  updateAsteroids(delta) {
    const w = this.scale.width;
    const factor = this.started && !this.dead ? 0.3 : 0.1;
    const dt = delta / 1000;

    for (let a of this.asteroids) {
      a.sprite.x -= a.speed * factor * dt;
      if (a.sprite.x < -200) {
        a.sprite.x = w + Phaser.Math.Between(300, 1500);
        a.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  initAchievements() {
    this.achievements = { ...ACHIEVEMENTS };
    for (let key in this.achievements) {
      this.achievements[key].unlocked = false;
    }
  }

  initDailyRewards() {
    this.dailyReward = {
      lastClaimDate: '',
      streak: 0
    };
  }

  initLeaderboard() {
    this.leaderboard = [];
  }

  initStats() {
    this.stats = {
      totalCoins: 0,
      totalDistance: 0,
      totalGames: 0
    };
  }

  updateLeaderboard() {
    // Для лидерборда
  }

  updateStats() {
    // Для статистики
  }

  checkAchievements() {
    // Проверка достижений
  }

  onResize() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    if (this.scoreText) this.scoreText.setPosition(w / 2, 30);
    if (this.bestText) this.bestText.setPosition(10, 10);
    if (this.crystalText) this.crystalText.setPosition(w - 10, 10);
    if (this.meterText) this.meterText.setPosition(10, h - 80);
    if (this.wagonCountText) this.wagonCountText.setPosition(w - 100, h - 30);
    if (this.pauseButton) this.pauseButton.setPosition(w - 35, h - 35);
    if (this.menuButton) this.menuButton.setPosition(w - 90, h - 35);
    if (this.heartContainer) this.heartContainer.setPosition(10, 30);
  }
}