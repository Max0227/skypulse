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

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('play');
  }

  create() {
    const w = this.scale.width, h = this.scale.height;

    // ===== ИНФОРМАЦИЯ О МИРЕ И УРОВНЕ =====
    this.world = gameManager.getCurrentWorld();
    this.level = gameManager.getCurrentLevel();
    this.worldConfig = LEVEL_CONFIG[this.world];

    // ===== ОСНОВНЫЕ ПАРАМЕТРЫ =====
    this.score = 0;
    this.crystals = gameManager.data.crystals;
    this.meters = 0;
    this.best = Number(localStorage.getItem('skypulse_best') || 0);

    // ===== ВАГОНЫ =====
    this.wagons = [];
    this.collectedCoins = 0;
    this.coinsForWagon = 15;
    this.maxWagons = 12 + (gameManager.data.upgrades.maxWagons || 0) * 2;
    this.wagonGap = 28 - (gameManager.data.upgrades.wagonGap || 0) * 2;
    this.wagonSpring = 0.25;
    this.wagonBaseHP = 1 + (gameManager.data.upgrades.wagonHP || 0);

    // ===== ИГРОК =====
    this.targetPlayerX = 110;
    this.playerXSpeed = 0.05;
    this.maxTargetX = 200;

    // ===== СОСТОЯНИЯ =====
    this.started = false;
    this.dead = false;
    this.level = 0; // внутренний уровень сложности (растёт с метражом)
    this.isPaused = false;
    this.pauseOverlay = null;
    this.pauseTexts = [];
    this.spawnTimerPaused = null;
    this.bonusTimerPaused = null;
    this.stationTimerPaused = null;

    // ===== ЗДОРОВЬЕ =====
    this.maxHeadHP = 3 + (gameManager.data.upgrades.headHP || 0);
    this.headHP = this.maxHeadHP;

    // ===== СКОРОСТЬ =====
    this.baseSpeed = 240;
    this.currentSpeed = this.baseSpeed;
    this.gapSize = 240;
    this.spawnDelay = 1300;
    this.gateTextures = ['gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'];

    // ===== БОНУСЫ =====
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

    // ===== СИСТЕМЫ =====
    this.upgradeSystem = new UpgradeSystem(this);
    this.jumpPower = this.upgradeSystem.getUpgradeValue('jumpPower');
    this.questSystem = new QuestSystem();
    this.comboSystem = new ComboSystem(this);
    this.multiplierSystem = new MultiplierSystem(this);
    this.levelManager = new LevelManager(this);
    this.particleManager = new ParticleEffectManager(this);

    // ===== МАССИВЫ ОБЪЕКТОВ =====
    this.pipes = [];
    this.coins = [];
    this.scoreZones = [];
    this.stars = [];
    this.planets = [];
    this.ships = [];
    this.asteroids = [];
    this.powerUps = [];

    // ===== ГРУППЫ =====
    this.gateGroup = this.physics.add.group();
    this.coinGroup = this.physics.add.group();
    this.asteroidGroup = this.physics.add.group();
    this.powerUpGroup = this.physics.add.group();

    // ===== ТАЙМЕРЫ =====
    this.spawnTimer = null;
    this.stationTimer = null;

    // ===== СТАНЦИЯ =====
    this.stationPlanet = null;
    this.stationActive = false;

    // ===== СЧЁТЧИКИ ДЛЯ ДОСТИЖЕНИЙ =====
    this.initAchievements();
    this.initDailyRewards();
    this.initLeaderboard();
    this.initStats();

    // ===== СОЗДАНИЕ ОБЪЕКТОВ =====
    this.createBackground();
    this.createPlanets();
    this.createShips();
    this.createAsteroids(); // фоновые декоративные астероиды
    this.createPlayer();
    this.createUI();

    // ===== ОБРАБОТЧИКИ =====
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
    window.audioManager.playMusic(this, 0.2);
  }

  // =========================================================================
  // UPDATE
  // =========================================================================
  update(time, delta) {
    if (this.isPaused || this.countdownActive) return;

    // Обновление фона
    this.updateStars(time, delta);
    this.updatePlanets(delta);
    this.updateShips(delta);
    this.updateAsteroids(delta);

    if (!this.started || this.dead) return;
    // Принудительно удерживаем монеты на месте по вертикали
this.coinGroup.getChildren().forEach(coin => {
  if (coin.body) {
    coin.body.setVelocityY(0);
  }
});
// Принудительно устанавливаем скорость монет
this.coinGroup.getChildren().forEach(coin => {
  if (coin.active && coin.body) {
    coin.body.setVelocityX(-this.currentSpeed);
    coin.body.setVelocityY(0);
    coin.body.setAllowGravity(false);
    coin.body.setGravityY(0);
  }
});
    // Движение игрока вправо при наличии вагонов
    this.targetPlayerX = Math.min(this.maxTargetX, this.targetPlayerX);
    this.player.x += (this.targetPlayerX - this.player.x) * this.playerXSpeed;

    // Поворот игрока в зависимости от скорости
    const body = this.player.body;
    this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75));

    // Проверка выхода за границы
    if (!this.shieldActive && (this.player.y < -50 || this.player.y > this.scale.height + 50)) {
      this.handleDeath();
    }

    // Магнит
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

    // Обновление вагонов
    this.updateWagons();

    // Очистка устаревших объектов
    this.cleanupObjects();

    // Станция
    if (this.stationPlanet && this.stationPlanet.active && this.stationActive) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.stationPlanet.x, this.stationPlanet.y);
      if (dist < 100) this.touchStation();
    }

    // Проверка достижений и прогресса
    this.checkAchievements();
    this.checkLevelComplete();
    this.comboSystem.update(delta);

    // Безопасное обновление астероидов
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const asteroid = this.asteroids[i];
      if (!asteroid || typeof asteroid.update !== 'function') {
        console.warn('Удалён повреждённый объект из asteroids');
        this.asteroids.splice(i, 1);
        continue;
      }
      if (!asteroid.update()) {
        this.asteroids.splice(i, 1);
      }
    }

    // Безопасное обновление усилителей
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

  // =========================================================================
  // МЕТОДЫ ДЛЯ НОВЫХ МЕХАНИК
  // =========================================================================
  spawnAsteroid() {
    const w = this.scale.width;
    const h = this.scale.height;
    const difficulty = DIFFICULTY_CURVE[Math.min(this.level, 4)];
    const speed = 300 + this.level * 30;
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

  // =========================================================================
  // СБОР МОНЕТ
  // =========================================================================
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

    // Учёт бонуса скорости, если активен
    if (this.bonusActive && this.bonusType === 'speed') value *= 2;

    // Применяем множитель от комбо
    const multipliedValue = Math.floor(value * this.comboSystem.getMultiplier());
    this.crystals += multipliedValue;
    this.crystalText.setText(`💎 ${this.crystals}`);
    this.collectedCoins += multipliedValue;

    // Комбо
    this.comboSystem.add(); // здесь используется add(), а не addCombo()

    // Вагон
    if (this.collectedCoins >= this.coinsForWagon && this.wagons.length < this.maxWagons) {
      this.addWagon();
      this.collectedCoins -= this.coinsForWagon;
    }

    // Бонус-эффект
    if (bonusType) {
      if (this.bonusActive && this.bonusType === bonusType) {
        this.bonusTime += 2;
        this.itemSound.play();
      } else {
        this.activateBonus(bonusType);
      }
      this.particleManager.createCoinCollectEffect(coin.x, coin.y, coin.coinType);
      if (bonusType === 'shield') this.questSystem.updateProgress('shield', 1);
    } else {
      this.coinSound.play();
      this.particleManager.createCoinCollectEffect(coin.x, coin.y, 'gold');
    }

    this.questSystem.updateProgress('crystals', multipliedValue);

    // Анимация текста кристаллов
    this.tweens.add({
      targets: this.crystalText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 80,
      yoyo: true,
      ease: 'Quad.out'
    });

    // Вибро
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(bonusType ? 'heavy' : 'soft'); } catch {}

    coin.destroy();
    gameManager.data.crystals = this.crystals;
    gameManager.save();
  }

  // =========================================================================
  // ПРОХОЖДЕНИЕ ВОРОТ
  // =========================================================================
  passGateWithCombo(zone) {
    if (zone.passed) return;
    zone.passed = true;

    const baseScore = 10; // базовые очки за ворота
    const comboMultiplier = this.comboSystem.getMultiplier();
    const totalScore = Math.floor(baseScore * comboMultiplier * this.multiplierSystem.getMultiplier());

    this.score += totalScore;
    this.scoreText.setText(String(this.score));
    this.meters += 10;
    this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
    this.updateLevel();

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

  // =========================================================================
  // ПРОВЕРКА ЗАВЕРШЕНИЯ УРОВНЯ
  // =========================================================================
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

    if (this.level < 4) {
      gameManager.unlockLevel(this.world, this.level + 1);
    }
    if (this.level === 4 && this.world < 4) {
      const worlds = gameManager.data.unlockedWorlds;
      if (!worlds.includes(this.world + 1)) {
        worlds.push(this.world + 1);
        gameManager.save();
      }
    }

    this.scene.start('levelComplete', {
      world: this.world,
      level: this.level,
      score: this.score,
      stars: stars,
      coins: this.collectedCoins,
      wagons: this.wagons.length
    });
  }

  // =========================================================================
  // ФОН
  // =========================================================================
  createBackground() {
    const w = this.scale.width, h = this.scale.height;
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
      this.stars.push({ sprite: star, speed: Phaser.Math.Between(3, 20), flicker: Phaser.Math.FloatBetween(0.01, 0.03) });
    }
  }

  createPlanets() {
    const w = this.scale.width, h = this.scale.height;
    for (let i = 1; i <= 5; i++) {
      const x = Phaser.Math.Between(w, w * 15);
      const y = Phaser.Math.Between(50, h - 50);
      const planet = this.add.image(x, y, `planet_${i}`);
      planet.setScale(Phaser.Math.FloatBetween(2.0, 4.0));
      planet.setTint(0x8888ff);
      planet.setAlpha(0.6 + Math.random() * 0.3);
      planet.setDepth(-15);
      planet.setBlendMode(Phaser.BlendModes.ADD);
      this.planets.push({ sprite: planet, speed: Phaser.Math.Between(2, 12), flicker: Phaser.Math.FloatBetween(0.005, 0.01) });
    }
  }

  createShips() {
    const w = this.scale.width, h = this.scale.height;
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
    const w = this.scale.width, h = this.scale.height;
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

  // =========================================================================
  // ИГРОК
  // =========================================================================
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

    // Звуки
    this.coinSound = this.sound.add('coin_sound', { volume: 0.4 });
    this.itemSound = this.sound.add('item_sound', { volume: 0.5 });
    this.tapSound = this.sound.add('tap_sound', { volume: 0.3 });
    this.wagonSound = this.sound.add('wagon_sound', { volume: 0.6 });
    this.levelUpSound = this.sound.add('level_up_sound', { volume: 0.5 });
    this.purchaseSound = this.sound.add('purchase_sound', { volume: 0.5 });
    this.reviveSound = this.sound.add('revive_sound', { volume: 0.5 });
    this.hitSound = this.tapSound;
  }

  // =========================================================================
  // ИНТЕРФЕЙС
  // =========================================================================
  createUI() {
    const w = this.scale.width, h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";

    this.scoreText = this.add.text(w / 2, 30, '0', {
      fontSize: '38px', fontFamily, color: '#ffffff', stroke: '#00ffff', strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 10, fill: true }
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.bestText = this.add.text(10, 10, `🏆 ${this.best}`, {
      fontSize: '14px', fontFamily, color: '#7dd3fc', stroke: '#0f172a', strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.crystalText = this.add.text(w - 10, 10, `💎 ${this.crystals}`, {
      fontSize: '14px', fontFamily, color: '#fde047', stroke: '#0f172a', strokeThickness: 2
    }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);

    this.meterText = this.add.text(10, h - 80, `📏 0 м`, {
      fontSize: '12px', fontFamily, color: '#a5f3fc', stroke: '#0f172a', strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.bonusText = this.add.text(w - 10, 40, '', {
      fontSize: '12px', fontFamily, stroke: '#0f172a', strokeThickness: 2, align: 'right'
    }).setOrigin(1, 0).setDepth(10).setVisible(false).setScrollFactor(0);

    this.levelText = this.add.text(w / 2, h / 2 - 70, '', {
      fontSize: '28px', fontFamily, color: '#ffffff', stroke: '#7c3aed', strokeThickness: 6,
      shadow: { blur: 15, color: '#ff00ff', fill: true }
    }).setOrigin(0.5).setDepth(15).setVisible(false).setScrollFactor(0);

    this.wagonCountText = this.add.text(w - 100, h - 30, `🚃 0/${this.maxWagons}`, {
      fontSize: '12px', fontFamily, color: '#88ccff', stroke: '#0f172a', strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.heartContainer = this.add.container(10, 30).setDepth(10).setScrollFactor(0);
    this.updateHearts();

    this.introText = this.add.text(w / 2, h * 0.40, 'СОБИРАЙ МОНЕТЫ\nЧТОБЫ УДЛИНИТЬ ТАКСИ', {
      fontSize: '12px', fontFamily, color: '#ffffff', align: 'center', stroke: '#7c3aed', strokeThickness: 2
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.coinTipsText = this.add.text(w / 2, h * 0.50, '🟡 Золото | 🔴 Скорость | 🔵 Щит | 🟢 Магнит | 🟣 Замедление', {
      fontSize: '8px', fontFamily, color: '#cbd5e1', align: 'center'
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    // Кнопки управления
    this.createControlButtons();

    this.createGameOverBox();

    // Коллизии
    this.physics.add.overlap(this.player, this.coinGroup, (p, c) => this.collectCoin(c), null, this);
  }

  createControlButtons() {
    const w = this.scale.width, h = this.scale.height;

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

  createGameOverBox() {
    const w = this.scale.width, h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";
    const panel = this.add.rectangle(0, 0, 300, 250, 0x0a0a1a, 0.95).setStrokeStyle(3, 0x00ffff, 0.9).setScrollFactor(0);
    const title = this.add.text(0, -100, 'ИГРА ОКОНЧЕНА', { fontSize: '20px', fontFamily, color: '#ffffff', stroke: '#ff00ff', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0);
    const subtitle = this.add.text(0, -20, '', { fontSize: '12px', fontFamily, color: '#7dd3fc', align: 'center', stroke: '#0f172a', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0);
    this.gameOverSubtitle = subtitle;
    const tip = this.add.text(0, 80, 'Нажми, чтобы продолжить', { fontSize: '12px', fontFamily, color: '#cbd5e1', align: 'center' }).setOrigin(0.5).setScrollFactor(0);
    this.gameOverBox = this.add.container(w / 2, h / 2, [panel, title, subtitle, tip]);
    this.gameOverBox.setVisible(false);
  }

  // =========================================================================
  // ЗАПУСК И СПАВН
  // =========================================================================
  startRun() {
    this.started = true;
    this.introText.setVisible(false);
    this.coinTipsText.setVisible(false);
    this.spawnGate();
    this.scheduleNextSpawn();
    this.checkStationSpawn();
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
    let difficulty = DIFFICULTY_CURVE[0];
    for (let lvl in DIFFICULTY_CURVE) {
      if (this.level >= parseInt(lvl)) {
        difficulty = DIFFICULTY_CURVE[lvl];
      }
    }
    return difficulty;
  }

  flap() {
    this.player.body.setVelocityY(-this.jumpPower);
    this.player.setScale(0.95);
    this.tweens.add({ targets: this.player, scaleX: 0.9, scaleY: 0.9, duration: 150, ease: 'Quad.out' });
    this.tapSound.play();
    try { window.Telegram?.WebApp?.HapticFeedback?.selectionChanged?.(); } catch {}
  }

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      this.spawnTimerPaused = this.spawnTimer;
      this.bonusTimerPaused = this.bonusTimer;
      this.stationTimerPaused = this.stationTimer;
      if (this.spawnTimer) this.spawnTimer.paused = true;
      if (this.bonusTimer) this.bonusTimer.paused = true;
      if (this.stationTimer) this.stationTimer.paused = true;

      this.pauseOverlay = this.add.rectangle(
        this.scale.width / 2, this.scale.height / 2,
        this.scale.width, this.scale.height,
        0x000000, 0.7
      ).setDepth(25).setScrollFactor(0);

      const pauseText = this.add.text(
        this.scale.width / 2, this.scale.height / 2 - 40,
        '⏸️ ПАУЗА',
        { fontSize: '40px', fontFamily: "'Orbitron', monospace", color: '#ffffff', stroke: '#00ffff', strokeThickness: 4 }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);

      const tipText = this.add.text(
        this.scale.width / 2, this.scale.height / 2 + 30,
        'Нажми на кнопку паузы, чтобы продолжить',
        { fontSize: '12px', fontFamily: "'Orbitron', monospace", color: '#cccccc' }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);

      this.pauseTexts = [pauseText, tipText];
    } else {
      this.physics.resume();
      if (this.spawnTimerPaused) this.spawnTimerPaused.paused = false;
      if (this.bonusTimerPaused) this.bonusTimerPaused.paused = false;
      if (this.stationTimerPaused) this.stationTimerPaused.paused = false;

      if (this.pauseOverlay) {
        this.pauseOverlay.destroy();
        this.pauseOverlay = null;
      }
      if (this.pauseTexts) {
        this.pauseTexts.forEach(t => t.destroy());
        this.pauseTexts = [];
      }
    }
  }

  confirmExit() {
    if (this.dead) return;
    this.isPaused = true;
    this.physics.pause();
    const w = this.scale.width, h = this.scale.height;
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7).setDepth(50).setScrollFactor(0);
    const panel = this.add.rectangle(w / 2, h / 2, 250, 150, 0x0a0a1a, 0.95).setStrokeStyle(2, 0x00ffff).setDepth(51).setScrollFactor(0);
    const text = this.add.text(w / 2, h / 2 - 30, 'Выйти в меню?', { fontSize: '16px', fontFamily: "'Orbitron', monospace", color: '#ffffff' }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    const yesBtn = this.add.text(w / 2 - 60, h / 2 + 20, 'ДА', { fontSize: '14px', fontFamily: "'Orbitron', monospace", color: '#00ff00', backgroundColor: '#1a1a3a', padding: { x: 10, y: 5 } }).setInteractive().setDepth(52).setScrollFactor(0).on('pointerdown', () => {
      overlay.destroy(); panel.destroy(); text.destroy(); yesBtn.destroy(); noBtn.destroy();
      this.scene.start('menu');
    }).on('pointerover', function() { this.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }); }).on('pointerout', function() { this.setStyle({ color: '#00ff00', backgroundColor: '#1a1a3a' }); });
    const noBtn = this.add.text(w / 2 + 60, h / 2 + 20, 'НЕТ', { fontSize: '14px', fontFamily: "'Orbitron', monospace", color: '#ff0000', backgroundColor: '#1a1a3a', padding: { x: 10, y: 5 } }).setInteractive().setDepth(52).setScrollFactor(0).on('pointerdown', () => {
      overlay.destroy(); panel.destroy(); text.destroy(); yesBtn.destroy(); noBtn.destroy();
      this.isPaused = false;
      this.physics.resume();
    }).on('pointerover', function() { this.setStyle({ color: '#ffffff', backgroundColor: '#aa0000' }); }).on('pointerout', function() { this.setStyle({ color: '#ff0000', backgroundColor: '#1a1a3a' }); });
  }

  updateLevel() {
    const newLevel = Math.floor(this.meters / 300);
    if (newLevel > this.level) {
      this.level = newLevel;
      this.updateDifficulty();
      this.targetPlayerX = Math.min(this.maxTargetX, 110 + this.level * 3);
      this.levelText.setText(`УРОВЕНЬ ${this.level + 1}`).setVisible(true).setAlpha(1);
      this.levelUpSound.play();
      this.createLevelUpEffect();
      this.tweens.add({ targets: this.levelText, alpha: 0, duration: 2000, ease: 'Power2' });
      this.addRandomPlanet();
      this.checkStationSpawn();
      this.questSystem.updateProgress('level', 1);
    }
  }

  checkStationSpawn() {
    if (this.stationActive || this.dead) return;
    if (this.level > 0 && this.level % 10 === 0 && !this.stationPlanet) {
      this.spawnStation();
    }
  }

  spawnStation() {
    const w = this.scale.width, h = this.scale.height;
    const x = w + 200, y = Phaser.Math.Between(100, h - 100);
    this.stationPlanet = this.physics.add.image(x, y, 'station_planet')
      .setImmovable(true)
      .setScale(1.5)
      .setDepth(-5)
      .setVelocityX(-this.currentSpeed * 0.3);
    this.stationPlanet.body.setAllowGravity(false);
    this.stationActive = true;
    const label = this.add.text(x, y - 80, '🚉 СТАНЦИЯ', { fontSize: '16px', fontFamily: "'Orbitron', monospace", color: '#00ffff', stroke: '#ff00ff', strokeThickness: 2 }).setOrigin(0.5).setDepth(-4);
    this.stationPlanet.label = label;
    this.tweens.add({ targets: this.stationPlanet, angle: 360, duration: 8000, repeat: -1, ease: 'Linear' });
  }

  touchStation() {
    if (!this.stationActive || !this.stationPlanet) return;
    this.stationActive = false;
    const bonus = this.wagons.length * 10;
    this.crystals += bonus;
    this.crystalText.setText(`💎 ${this.crystals}`);
    gameManager.data.crystals = this.crystals;
    gameManager.save();
    this.particleManager.createBonusEffect('speed', this.stationPlanet.x, this.stationPlanet.y);
    this.wagons.forEach(w => w.destroy());
    this.wagons = [];
    this.targetPlayerX = 110;
    this.wagonCountText.setText(`🚃 0/${this.maxWagons}`);
    this.updateCameraZoom();
    const msg = this.add.text(this.player.x, this.player.y - 50, `+${bonus} 💎`, { fontSize: '28px', fontFamily: "'Orbitron', monospace", color: '#ffaa00', stroke: '#ff00ff', strokeThickness: 4 }).setOrigin(0.5);
    this.tweens.add({ targets: msg, y: msg.y - 100, alpha: 0, duration: 1500, onComplete: () => msg.destroy() });
    if (this.stationPlanet.label) this.stationPlanet.label.destroy();
    this.stationPlanet.destroy();
    this.stationPlanet = null;
  }

  addRandomPlanet() {
    const w = this.scale.width, h = this.scale.height;
    const idx = Phaser.Math.Between(1, 5);
    const planet = this.add.image(w + 200, Phaser.Math.Between(50, h - 50), `planet_${idx}`);
    planet.setScale(Phaser.Math.FloatBetween(1.5, 3.0));
    planet.setTint(0x8888ff);
    planet.setAlpha(0.6);
    planet.setDepth(-15);
    planet.setBlendMode(Phaser.BlendModes.ADD);
    this.planets.push({ sprite: planet, speed: Phaser.Math.Between(5, 18), flicker: Phaser.Math.FloatBetween(0.005, 0.01) });
  }

  updateWagons() {
    if (this.wagons.length === 0) return;
    let prev = this.player;
    for (let i = 0; i < this.wagons.length; i++) {
      let wagon = this.wagons[i];
      let targetX = prev.x - this.wagonGap;
      let targetY = prev.y;
      if (i >= 4) targetY = prev.y + (i % 2 === 0 ? 20 : -20);
      let dx = targetX - wagon.x;
      let dy = targetY - wagon.y;
      wagon.x += dx * this.wagonSpring;
      wagon.y += dy * this.wagonSpring;
      if (wagon.body) wagon.body.reset(wagon.x, wagon.y);
      prev = wagon;
    }
  }

  addWagon() {
    if (this.wagons.length >= this.maxWagons) {
      this.showNotification('Достигнут лимит вагонов!', 1000, '#ffaa00');
      return;
    }
    this.targetPlayerX += this.wagonGap * 0.5;
    this.targetPlayerX = Math.min(this.scale.width * 0.8, this.targetPlayerX);
    let last = this.wagons.length > 0 ? this.wagons[this.wagons.length - 1] : this.player;
    let spawnX = last.x - this.wagonGap * 2;
    let spawnY = last.y;
    let texIndex = Phaser.Math.Between(0, 9);
    let wagon = this.physics.add.image(spawnX, spawnY, `wagon_${texIndex}`);
    wagon.setScale(0.8);
    wagon.body.setCircle(12, 8, 6);
    wagon.body.setAllowGravity(true);
    wagon.body.setMass(0.5);
    wagon.body.setDrag(0.9);
    wagon.setDepth(5 + this.wagons.length);
    wagon.setData('hp', this.wagonBaseHP);
    wagon.setData('maxHP', this.wagonBaseHP);
    wagon.setTint(0x88aaff);
    wagon.setBlendMode(Phaser.BlendModes.ADD);
    this.physics.add.collider(wagon, this.pipes, (w, p) => this.wagonHit(w, p), null, this);
    this.wagons.push(wagon);
    wagon.x = this.scale.width + 50;
    wagon.y = this.player.y;
    this.tweens.add({ targets: wagon, x: spawnX, duration: 500, ease: 'Sine.easeOut' });
    this.wagonSound.play();
    this.particleManager.createWagonSpawnEffect(wagon);
    this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
    this.updateCameraZoom();
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
      this.hitSound.play();
      this.showNotification('Вагон потерян!', 1000, '#ff4444');
    } else {
      wagon.setData('hp', hp);
      this.tweens.add({ targets: wagon, alpha: 0.5, duration: 100, yoyo: true, repeat: 2 });
      const healthPercent = hp / wagon.getData('maxHP');
      if (healthPercent < 0.5) wagon.setTint(0xff8888);
      this.hitSound.play();
    }
    this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
    this.updateCameraZoom();
  }

  updateCameraZoom() {
    let totalLength = (this.wagons.length + 1) * this.wagonGap;
    let screenWidth = this.scale.width;
    let targetZoom = Math.min(1, screenWidth / (totalLength + 100));
    targetZoom = Math.max(0.7, targetZoom);
    this.tweens.add({ targets: this.cameras.main, zoom: targetZoom, duration: 500, ease: 'Sine.easeInOut' });
  }

  spawnGate() {
    if (this.dead) return;
    const w = this.scale.width, h = this.scale.height;
    const difficulty = this.getDifficulty();
    const gateTexture = this.gateTextures[Math.min(this.level, 4)];
    const gap = difficulty.gap + Phaser.Math.Between(-15, 15);
    const centerY = Phaser.Math.Between(120, h - 120);
    const topY = centerY - gap / 2;
    const bottomY = centerY + gap / 2;
    const x = w;

    const topPipe = this.physics.add.image(x, topY, gateTexture)
      .setOrigin(0.5, 1)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, topY / 400))
      .setVelocityX(-difficulty.speed);
    topPipe.body.setAllowGravity(false);
    topPipe.setBlendMode(Phaser.BlendModes.ADD);

    const bottomPipe = this.physics.add.image(x, bottomY, gateTexture)
      .setOrigin(0.5, 0)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, (h - bottomY) / 400))
      .setVelocityX(-difficulty.speed);
    bottomPipe.body.setAllowGravity(false);
    bottomPipe.setBlendMode(Phaser.BlendModes.ADD);

    [topPipe, bottomPipe].forEach(pipe => {
      pipe.setScale(1, 0.01);
      this.tweens.add({ targets: pipe, scaleY: pipe.scaleY, duration: 300, ease: 'Back.out' });
    });

    if (this.level >= 2 && Math.random() < 0.4) {
      const moveDistance = Phaser.Math.Between(-50, 50);
      const tween = this.tweens.add({ targets: [topPipe, bottomPipe], y: `+=${moveDistance}`, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      topPipe.tween = tween; bottomPipe.tween = tween;
    }

    this.pipes.push(topPipe, bottomPipe);
    this.physics.add.collider(this.player, topPipe, (p, pi) => this.hitPipe(p, pi), null, this);
    this.physics.add.collider(this.player, bottomPipe, (p, pi) => this.hitPipe(p, pi), null, this);

    const zone = this.add.zone(x + 60, h / 2, 12, h);
    this.physics.add.existing(zone);
    zone.body.setAllowGravity(false);
    zone.body.setImmovable(true);
    zone.body.setVelocityX(-difficulty.speed);
    zone.body.setSize(12, h);
    zone.passed = false;
    this.physics.add.overlap(this.player, zone, (p, z) => {
      if (!z.passed) {
        z.passed = true;
        this.passGateWithCombo(z);
      }
    }, null, this);
    this.scoreZones.push(zone);

    // Спавн монеты
    if (Math.random() < difficulty.coinChance) this.spawnCoin(x, centerY);

    // Спавн астероида
    if (Math.random() < difficulty.asteroidChance) this.spawnAsteroid();

    // Спавн усилителя
    if (Math.random() < difficulty.powerUpChance) this.spawnPowerUp(x + 100, centerY);
  }

  spawnCoin(x, y) {
  if (Math.random() > 0.9) return;
  
  let coinType = 'gold', texture = 'coin_gold';
  const r = Math.random();
  if (this.level >= 1 && r < 0.15) { coinType = 'red'; texture = 'coin_red'; }
  else if (this.level >= 2 && r < 0.28) { coinType = 'blue'; texture = 'coin_blue'; }
  else if (this.level >= 3 && r < 0.40) { coinType = 'green'; texture = 'coin_green'; }
  else if (this.level >= 4 && r < 0.50) { coinType = 'purple'; texture = 'coin_purple'; }
  
  // Создаём монету с правильной физикой
  const coin = this.physics.add.image(x + Phaser.Math.Between(-20, 20), y, texture);
  
  // ===== НАСТРОЙКА ФИЗИКИ =====
  coin.body.setAllowGravity(false);      // отключаем гравитацию
  coin.body.setGravityY(0);              // обнуляем вертикальную гравитацию
  coin.body.setVelocityX(-this.currentSpeed); // скорость влево
  coin.body.setVelocityY(0);              // гарантируем отсутствие вертикальной скорости
  coin.setImmovable(true);                // чтобы не двигался от столкновений
  
  coin.setAngularVelocity(200);
  coin.setScale(0.01);
  coin.coinType = coinType;
  coin.setBlendMode(Phaser.BlendModes.ADD);
  coin.collected = false;
  
  // Анимация появления
  this.tweens.add({ 
    targets: coin, 
    scaleX: 1, 
    scaleY: 1, 
    duration: 300, 
    ease: 'Back.out' 
  });
  
  this.coinGroup.add(coin);
  this.coins.push(coin);
  
  // ОТЛАДКА: проверим скорость монеты
  console.log('Монета создана:', coin.x, coin.y, 'скорость X:', coin.body.velocity.x);
}

  hitPipe(player, pipe) {
    if (this.shieldActive) {
      this.particleManager.createBonusEffect('shield', pipe.x, pipe.y);
      this.player.body.setVelocityY(-100);
      return;
    } else {
      this.headHP--;
      this.updateHearts();
      this.cameras.main.shake(100, 0.003);
      this.hitSound.play();
      this.player.body.setVelocityX(0);
      if (this.headHP <= 0) {
        this.handleDeath();
      } else {
        this.player.setTint(0xff8888);
        this.time.delayedCall(500, () => this.player.clearTint());
      }
    }
  }

  handleDeath() {
    if (this.upgradeSystem.upgrades.revival > 0 && !this.dead) {
      this.upgradeSystem.upgrades.revival--;
      this.headHP = this.maxHeadHP;
      this.updateHearts();
      this.cameras.main.flash(300, 100, 255, 100, false);
      this.reviveSound.play();
      this.showNotification('ВОСКРЕШЕНИЕ!', 2000, '#00ffff');
      gameManager.data.upgrades = this.upgradeSystem.upgrades;
      gameManager.save();
      return;
    }
    if (this.dead) return;
    this.dead = true;
    this.trailEmitter.stop();
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.bonusTimer) this.bonusTimer.remove();
    if (this.stationTimer) this.stationTimer.remove();

    this.physics.pause();
    this.cameras.main.shake(300, 0.005);
    this.cameras.main.flash(300, 255, 100, 100, false);
    this.player.setTint(0xff0000).setAngle(90);

    const emitter = this.add.particles(this.player.x, this.player.y, 'flare', {
      speed: 250, scale: { start: 1.2, end: 0 }, lifespan: 600, quantity: 50,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xff0000, 0xff8800, 0xff00ff]
    });
    emitter.explode(50);

    this.updateLeaderboard();
    this.updateStats();
    this.showGameOver();

    if (window.Telegram?.WebApp) {
      const data = JSON.stringify({ score: this.score, level: this.level + 1, meters: Math.floor(this.meters) });
      window.Telegram.WebApp.sendData(data);
    }
    try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('error'); } catch {}
  }

  showGameOver() {
    this.gameOverSubtitle.setText(
      `Счёт: ${this.score}\nРекорд: ${this.best}\n💎 ${this.crystals}\n📏 ${Math.floor(this.meters)} м\n🚃 Вагонов: ${this.wagons.length}/${this.maxWagons}`
    );
    this.gameOverBox.setVisible(true);
    this.gameOverBox.setScale(0.9).setAlpha(0);
    this.tweens.add({ targets: this.gameOverBox, scaleX: 1, scaleY: 1, alpha: 1, duration: 400, ease: 'Back.out' });
  }

  showNotification(text, duration = 2000, color = '#ffffff') {
    const w = this.scale.width;
    const notification = this.add.text(w / 2, 100, text, {
      fontSize: '16px',
      fontFamily: "'Orbitron', monospace",
      color: color,
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    this.tweens.add({ targets: notification, alpha: 0, duration: duration, ease: 'Power2.easeOut', onComplete: () => notification.destroy() });
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
        this.bonusText.setColor('#ffff00').setText(`🚀 x2 ${Math.ceil(this.bonusTime)}с`);
        this.particleManager.createBonusEffect('speed', this.player.x, this.player.y);
        break;
      case 'shield':
        this.shieldActive = true;
        this.player.body.checkCollision.none = true;
        this.player.setTint(0x00ffff);
        this.bonusText.setColor('#00ffff').setText(`🛡️ ${Math.ceil(this.bonusTime)}с`);
        this.particleManager.createShieldEffect(this.player);
        break;
      case 'magnet':
        this.magnetActive = true;
        this.player.setTint(0xff00ff);
        this.bonusText.setColor('#ff00ff').setText(`🧲 ${Math.ceil(this.bonusTime)}с`);
        this.particleManager.createBonusEffect('magnet', this.player.x, this.player.y);
        break;
      case 'slow':
        this.currentSpeed = this.baseSpeed * 0.6;
        this.player.setTint(0xff8800);
        this.bonusText.setColor('#ff8800').setText(`⏳ ${Math.ceil(this.bonusTime)}с`);
        this.particleManager.createBonusEffect('slow', this.player.x, this.player.y);
        break;
    }

    this.bonusText.setVisible(true);
    this.updatePlayerVisuals();

    if (this.bonusTimer) this.bonusTimer.remove();

    this.bonusTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        this.bonusTime -= 0.1;
        if (this.bonusTime <= 0) {
          this.deactivateBonus();
        } else {
          const emoji = this.getBonusEmoji(type);
          this.bonusText.setText(`${emoji} ${Math.ceil(this.bonusTime)}с`);
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
    this.bonusMultiplier = 1;
    this.currentSpeed = this.baseSpeed;
    this.player.clearTint();
    this.player.body.checkCollision.none = false;
    this.bonusText.setVisible(false);
    this.updatePlayerVisuals();
    if (this.bonusTimer) { this.bonusTimer.remove(); this.bonusTimer = null; }
    this.particleManager.clearAll();
  }

  getBonusEmoji(type) {
    const emojis = { speed: '🚀', shield: '🛡️', magnet: '🧲', slow: '⏳' };
    return emojis[type] || '✨';
  }

  updatePlayerVisuals() {
    if (!this.player) return;
    if (this.shieldActive) {
      this.player.setTint(0x00ffff);
    } else if (this.bonusActive && this.bonusType === 'speed') {
      this.player.setTint(0xffff00);
    } else if (this.bonusActive && this.bonusType === 'magnet') {
      this.player.setTint(0xff00ff);
    } else if (this.bonusActive && this.bonusType === 'slow') {
      this.player.setTint(0xff8800);
    } else {
      this.player.clearTint();
    }
  }

  updateDifficulty() {
    const diff = this.getDifficulty();
    this.baseSpeed = diff.speed;
    this.gapSize = diff.gap;
    this.spawnDelay = diff.spawnDelay;
    if (!this.bonusActive) this.currentSpeed = this.baseSpeed;
  }

  createLevelUpEffect() {
    const w = this.scale.width, h = this.scale.height;
    const emitter = this.add.particles(w / 2, h / 2, 'flare', {
      speed: { min: -200, max: 200 }, scale: { start: 1.5, end: 0 }, alpha: { start: 0.8, end: 0 },
      lifespan: 600, quantity: 30, blendMode: Phaser.BlendModes.ADD,
      tint: [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00]
    });
    emitter.explode(30);
    this.cameras.main.shake(200, 0.01);
    this.cameras.main.flash(200, 255, 255, 100);
  }

  // =========================================================================
  // ДОСТИЖЕНИЯ, КВЕСТЫ, СТАТИСТИКА
  // =========================================================================
  checkCoinAchievements() {
    if (this.collectedCoins >= 50 && !this.achievements.all_bonuses.unlocked) {
      this.unlockAchievement('all_bonuses');
    }
  }

  initAchievements() {
    this.achievements = { ...ACHIEVEMENTS };
    for (let key in this.achievements) {
      this.achievements[key].unlocked = false;
    }
    this.loadAchievements();
  }

  loadAchievements() {
    try {
      const saved = localStorage.getItem('skypulse_achievements');
      if (saved) {
        const data = JSON.parse(saved);
        for (let key in data) {
          if (this.achievements[key]) this.achievements[key].unlocked = data[key];
        }
      }
    } catch (e) {}
  }

  saveAchievements() {
    const data = {};
    for (let key in this.achievements) data[key] = this.achievements[key].unlocked;
    localStorage.setItem('skypulse_achievements', JSON.stringify(data));
  }

  checkAchievements() {
    if (this.wagons.length >= 1 && !this.achievements.first_wagon.unlocked) this.unlockAchievement('first_wagon');
    if (this.wagons.length >= 5 && !this.achievements.five_wagons.unlocked) this.unlockAchievement('five_wagons');
    if (this.wagons.length >= 10 && !this.achievements.ten_wagons.unlocked) this.unlockAchievement('ten_wagons');
    if (this.level >= 4 && !this.achievements.level_5.unlocked) this.unlockAchievement('level_5');
    if (this.level >= 9 && !this.achievements.level_10.unlocked) this.unlockAchievement('level_10');
    if (this.score >= 100 && !this.achievements.score_100.unlocked) this.unlockAchievement('score_100');
    if (this.score >= 500 && !this.achievements.score_500.unlocked) this.unlockAchievement('score_500');
    if (this.headHP === this.maxHeadHP && this.score > 10 && !this.achievements.no_damage.unlocked) this.unlockAchievement('no_damage');
    this.checkCoinAchievements();
  }

  unlockAchievement(key) {
    if (this.achievements[key].unlocked) return;
    this.achievements[key].unlocked = true;
    const reward = this.achievements[key].reward;
    this.crystals += reward;
    this.crystalText.setText(`💎 ${this.crystals}`);
    gameManager.data.crystals = this.crystals;
    gameManager.unlockAchievement(key);
    gameManager.save();
    this.showAchievementNotification(key, reward);
    this.saveAchievements();
  }

  showAchievementNotification(key, reward) {
    const w = this.scale.width, h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";
    const achievement = this.achievements[key];
    const notification = this.add.container(w / 2, -80).setDepth(100).setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, 280, 60, 0x0a0a1a, 0.95).setStrokeStyle(2, 0x00ffff, 0.8);
    const title = this.add.text(0, -15, `🏆 ${achievement.name}`, { fontSize: '14px', fontFamily, color: '#ffaa00', stroke: '#ff5500', strokeThickness: 1 }).setOrigin(0.5);
    const rewardText = this.add.text(0, 10, `+${reward} 💎`, { fontSize: '12px', fontFamily, color: '#00ff00', stroke: '#00aa00', strokeThickness: 1 }).setOrigin(0.5);
    notification.add([bg, title, rewardText]);
    this.tweens.add({ targets: notification, y: 80, duration: 3000, ease: 'Sine.easeInOut', onComplete: () => notification.destroy() });
    this.levelUpSound.play();
  }

  initDailyRewards() {
    this.dailyReward = {
      lastClaimDate: localStorage.getItem('skypulse_daily_date') || '',
      streak: parseInt(localStorage.getItem('skypulse_daily_streak') || '0'),
      rewards: [10, 20, 30, 50, 75, 100, 150]
    };
    this.checkDailyReward();
  }

  checkDailyReward() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = this.dailyReward.lastClaimDate;
    if (lastDate !== today) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (lastDate === yesterdayStr) this.dailyReward.streak++;
      else this.dailyReward.streak = 1;
      this.dailyReward.streak = Math.min(this.dailyReward.streak, 7);
      this.dailyReward.lastClaimDate = today;
      this.saveDailyReward();
      this.showDailyRewardNotification();
    }
  }

  showDailyRewardNotification() {
    const w = this.scale.width, h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";
    const rewardAmount = this.dailyReward.rewards[this.dailyReward.streak - 1];
    this.crystals += rewardAmount;
    if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
    gameManager.data.crystals = this.crystals; gameManager.save();
    const notification = this.add.container(w / 2, h / 2).setDepth(100).setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, 300, 150, 0x0a0a1a, 0.95).setStrokeStyle(3, 0x00ffff, 0.8);
    const title = this.add.text(0, -40, '🎁 ДНЕВНАЯ НАГРАДА', { fontSize: '18px', fontFamily, color: '#00ffff', stroke: '#ff00ff', strokeThickness: 2 }).setOrigin(0.5);
    const streak = this.add.text(0, -10, `День ${this.dailyReward.streak}/7`, { fontSize: '14px', fontFamily, color: '#ffaa00' }).setOrigin(0.5);
    const reward = this.add.text(0, 20, `+${rewardAmount} 💎`, { fontSize: '24px', fontFamily, color: '#00ff00', stroke: '#00aa00', strokeThickness: 2 }).setOrigin(0.5);
    const claimBtn = this.add.text(0, 60, '[ПОЛУЧИТЬ]', { fontSize: '12px', fontFamily, color: '#00ff00', backgroundColor: '#1a1a3a', padding: { x: 10, y: 4 } }).setInteractive().setOrigin(0.5).on('pointerdown', () => notification.destroy());
    notification.add([bg, title, streak, reward, claimBtn]);
    this.tweens.add({ targets: notification, scale: 1.05, duration: 200, yoyo: true, ease: 'Back.out' });
  }

  saveDailyReward() {
    localStorage.setItem('skypulse_daily_date', this.dailyReward.lastClaimDate);
    localStorage.setItem('skypulse_daily_streak', String(this.dailyReward.streak));
  }

  initLeaderboard() {
    this.leaderboard = [];
    try {
      const saved = localStorage.getItem('skypulse_leaderboard');
      if (saved) this.leaderboard = JSON.parse(saved);
    } catch (e) {}
  }

  saveLeaderboard() {
    localStorage.setItem('skypulse_leaderboard', JSON.stringify(this.leaderboard));
  }

  updateLeaderboard() {
    const entry = { score: this.score, level: this.level + 1, wagons: this.wagons.length, meters: Math.floor(this.meters), timestamp: Date.now() };
    this.leaderboard.unshift(entry);
    this.leaderboard = this.leaderboard.slice(0, 10);
    this.saveLeaderboard();
  }

  initStats() {
    this.stats = { totalGames: 0, totalDistance: 0, totalCoins: 0, bestScore: 0, bestLevel: 0, totalWagons: 0, totalPlayTime: 0, startTime: Date.now() };
    try {
      const saved = localStorage.getItem('skypulse_stats');
      if (saved) this.stats = JSON.parse(saved);
    } catch (e) {}
  }

  saveStats() {
    localStorage.setItem('skypulse_stats', JSON.stringify(this.stats));
  }

  updateStats() {
    this.stats.totalGames++;
    this.stats.totalDistance += Math.floor(this.meters);
    this.stats.totalCoins += this.crystals;
    if (this.score > this.stats.bestScore) this.stats.bestScore = this.score;
    if (this.level + 1 > this.stats.bestLevel) this.stats.bestLevel = this.level + 1;
    this.stats.totalWagons += this.wagons.length;
    this.stats.totalPlayTime += (Date.now() - this.stats.startTime) / 1000;
    this.saveStats();
  }

  cleanupObjects() {
    this.pipes = this.pipes.filter(p => {
      if (p.x < -150) { if (p.tween) p.tween.stop(); p.destroy(); return false; }
      return true;
    });

    // Удаляем монеты из массива (но они уже в группе)
    this.coins = this.coins.filter(c => {
      if (!c.active || c.x < -100) {
        if (c.active) c.destroy();
        return false;
      }
      return true;
    });

    this.scoreZones = this.scoreZones.filter(z => {
      if (z.x < -60) { z.destroy(); return false; }
      return true;
    });

    if (this.stationPlanet && this.stationPlanet.x < -200) {
      if (this.stationPlanet.label) this.stationPlanet.label.destroy();
      this.stationPlanet.destroy();
      this.stationPlanet = null;
      this.stationActive = false;
    }
  }

  updateStars(time, delta) {
    const w = this.scale.width, h = this.scale.height, factor = this.started && !this.dead ? 1 : 0.3, dt = delta / 1000;
    for (let s of this.stars) {
      s.sprite.x -= s.speed * factor * dt;
      if (s.flicker) s.sprite.alpha = 0.5 + Math.sin(time * s.flicker) * 0.3;
      if (s.sprite.x < -10) { s.sprite.x = w + Phaser.Math.Between(5, 50); s.sprite.y = Phaser.Math.Between(0, h); }
    }
  }

  updatePlanets(delta) {
    const w = this.scale.width, factor = this.started && !this.dead ? 0.2 : 0.05, dt = delta / 1000;
    for (let p of this.planets) {
      p.sprite.x -= p.speed * factor * dt;
      if (p.sprite.x < -300) { p.sprite.x = w + Phaser.Math.Between(400, 2000); p.sprite.y = Phaser.Math.Between(50, this.scale.height - 50); }
    }
  }

  updateShips(delta) {
    const w = this.scale.width, factor = this.started && !this.dead ? 0.3 : 0.1, dt = delta / 1000;
    for (let s of this.ships) {
      s.sprite.x -= s.speed * factor * dt;
      if (s.sprite.x < -200) { s.sprite.x = w + Phaser.Math.Between(300, 1500); s.sprite.y = Phaser.Math.Between(50, this.scale.height - 50); }
    }
  }

  updateAsteroids(delta) {
    const w = this.scale.width, factor = this.started && !this.dead ? 0.3 : 0.1, dt = delta / 1000;
    for (let a of this.asteroids) {
      a.sprite.x -= a.speed * factor * dt;
      if (a.sprite.x < -200) { a.sprite.x = w + Phaser.Math.Between(300, 1500); a.sprite.y = Phaser.Math.Between(50, this.scale.height - 50); }
    }
  }

  onResize() {
    const w = this.scale.width, h = this.scale.height;
    if (this.scoreText) this.scoreText.setPosition(w / 2, 30);
    if (this.bestText) this.bestText.setPosition(10, 10);
    if (this.crystalText) this.crystalText.setPosition(w - 10, 10);
    if (this.meterText) this.meterText.setPosition(10, h - 80);
    if (this.wagonCountText) this.wagonCountText.setPosition(w - 100, h - 30);
    if (this.bonusText) this.bonusText.setPosition(w - 10, 40);
    if (this.levelText) this.levelText.setPosition(w / 2, h / 2 - 70);
    if (this.pauseButton) this.pauseButton.setPosition(w - 35, h - 35);
    if (this.menuButton) this.menuButton.setPosition(w - 90, h - 35);
    if (!this.started) {
      if (this.introText) this.introText.setPosition(w / 2, h * 0.40);
      if (this.coinTipsText) this.coinTipsText.setPosition(w / 2, h * 0.50);
    }
    if (this.heartContainer) this.heartContainer.setPosition(10, 30);
  }
}