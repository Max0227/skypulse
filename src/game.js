import Phaser from 'phaser';

// =========================================================================
// BootScene – создание всех текстур
// =========================================================================
class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    // Загружаем звуки (если есть)
    this.load.audio('coin_sound', 'sounds/coin.mp3');
    this.load.audio('item_sound', 'sounds/item.mp3');
    this.load.audio('tap_sound', 'sounds/tap.mp3');
    this.load.audio('wagon_sound', 'sounds/wagon.mp3');
    this.load.audio('level_up_sound', 'sounds/level_up.mp3');
    this.load.audio('bg_music', 'sounds/fifth_element_theme.mp3');
  }

  create() {
    this.createTextures();
    this.scene.start('play');
  }

  createTextures() {
    const g = this.add.graphics();

    // ========== ИГРОК: ЛЕТАЮЩЕЕ ТАКСИ ==========
    g.clear();
    g.fillStyle(0xffcc00);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0xffaa00);
    g.fillRoundedRect(20, 8, 40, 10, 4);
    g.fillRect(56, 16, 8, 20);
    g.fillStyle(0x88ccff);
    g.fillRect(22, 16, 14, 8);
    g.fillRect(40, 16, 14, 8);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 28, 4);
    g.fillStyle(0xffffaa);
    g.fillCircle(18, 28, 2);
    g.fillStyle(0x000000);
    g.fillRect(40, 30, 6, 4);
    g.fillRect(48, 30, 6, 4);
    g.fillRect(56, 30, 6, 4);
    g.fillStyle(0x333333);
    g.fillRect(10, 34, 20, 6);
    g.generateTexture('player', 80, 60);

    // ========== ВАГОНЧИКИ ==========
    const colors = [
      0xffaa00, 0x44aa88, 0xaa44aa, 0x88aa44, 0xaa8844,
      0x44aaff, 0xff66aa, 0x66ffaa, 0xaa66ff, 0xffaa66
    ];
    
    for (let i = 0; i < colors.length; i++) {
      g.clear();
      g.fillStyle(colors[i]);
      g.fillRoundedRect(6, 6, 36, 22, 6);
      g.fillStyle(0x000000);
      g.fillRect(12, 16, 6, 4);
      g.fillRect(22, 16, 6, 4);
      g.fillStyle(0xffffff);
      g.fillRect(8, 8, 6, 4);
      g.fillRect(20, 8, 6, 4);
      g.fillStyle(0xffaa00);
      g.fillCircle(12, 24, 3);
      g.fillCircle(28, 24, 3);
      g.fillStyle(0x000000, 0.2);
      g.fillRect(6, 26, 36, 2);
      g.generateTexture(`wagon_${i}`, 48, 34);
    }

    // ========== КОЛОННЫ ==========
    const createGate = (color, light, name) => {
      g.clear();
      g.fillStyle(color);
      g.fillRoundedRect(0, 0, 100, 400, 20);
      g.fillStyle(light);
      g.fillRoundedRect(10, 0, 15, 400, 8);
      g.fillStyle(light);
      g.fillRoundedRect(0, 0, 100, 30, 12);
      g.fillStyle(color);
      g.fillRoundedRect(0, 370, 100, 30, 12);
      g.generateTexture(name, 100, 400);
    };
    
    createGate(0x0ea5e9, 0x67e8f9, 'gate_blue');
    createGate(0x22c55e, 0x86efac, 'gate_green');
    createGate(0xeab308, 0xfde047, 'gate_yellow');
    createGate(0xef4444, 0xf87171, 'gate_red');
    createGate(0xa855f7, 0xc084fc, 'gate_purple');

    // ========== МОНЕТКИ ==========
    const createCoin = (color, lineColor, name) => {
      g.clear();
      g.fillStyle(color);
      g.fillCircle(16, 16, 14);
      g.lineStyle(4, lineColor);
      g.strokeCircle(16, 16, 9);
      g.lineStyle(2, lineColor, 0.5);
      g.strokeCircle(16, 16, 6);
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(10, 10, 4);
      g.generateTexture(name, 32, 32);
    };
    
    createCoin(0xfacc15, 0xfffbeb, 'coin_gold');
    createCoin(0xef4444, 0xffaa00, 'coin_red');
    createCoin(0x3498db, 0xffffff, 'coin_blue');
    createCoin(0x2ecc71, 0xffffff, 'coin_green');
    createCoin(0x9b59b6, 0xffffff, 'coin_purple');

    // ========== ПЛАНЕТЫ (больше, разбросаны) ==========
    const createPlanet = (color, hasRing, hasAtmo, idx) => {
      g.clear();
      g.fillStyle(color);
      g.fillCircle(32, 32, 28);
      g.fillStyle(0x000000, 0.3);
      g.fillCircle(20, 20, 6);
      g.fillCircle(44, 44, 8);
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(30, 45, 5);
      if (hasRing) {
        g.lineStyle(4, 0xccaa88, 0.7);
        g.strokeEllipse(32, 32, 70, 20);
      }
      if (hasAtmo) {
        g.fillStyle(0x88aaff, 0.25);
        g.fillCircle(32, 32, 34);
      }
      g.generateTexture(`planet_${idx}`, 64, 64);
    };
    
    // 15 планет для разнообразия
    for (let i = 1; i <= 15; i++) {
      let color, hasRing, hasAtmo;
      if (i % 3 === 1) { color = 0x4a90e2; hasRing = true; hasAtmo = true; }
      else if (i % 3 === 2) { color = 0xe67e22; hasRing = false; hasAtmo = true; }
      else { color = 0x2ecc71; hasRing = true; hasAtmo = false; }
      createPlanet(color, hasRing, hasAtmo, i);
    }

    // ========== КОСМИЧЕСКИЕ КОРАБЛИ ==========
    g.clear();
    g.fillStyle(0x88aaff);
    g.fillEllipse(40, 30, 70, 20);
    g.fillStyle(0xaaddff);
    g.fillEllipse(40, 20, 40, 12);
    g.fillStyle(0xffaa00);
    g.fillCircle(20, 30, 5);
    g.fillCircle(60, 30, 5);
    g.fillCircle(40, 30, 3);
    g.generateTexture('bg_ship_1', 90, 50);

    g.clear();
    g.fillStyle(0xcc3333);
    g.fillRoundedRect(20, 20, 70, 30, 8);
    g.fillStyle(0xff6666);
    g.fillTriangle(90, 25, 90, 45, 110, 35);
    g.fillStyle(0xffaa00);
    g.fillCircle(35, 35, 5);
    g.fillCircle(55, 35, 5);
    g.fillCircle(75, 35, 4);
    g.generateTexture('bg_ship_2', 120, 60);

    // ========== АСТЕРОИДЫ ==========
    g.clear();
    g.fillStyle(0x6b4e2e);
    g.fillEllipse(40, 40, 70, 50);
    g.fillStyle(0x5d3a1a);
    g.fillEllipse(20, 20, 30, 20);
    g.fillStyle(0xa0522d);
    g.fillEllipse(50, 50, 25, 15);
    g.fillStyle(0x8b5a2b);
    g.fillCircle(30, 60, 15);
    g.generateTexture('bg_asteroid_1', 100, 80);

    g.clear();
    g.fillStyle(0x88aaff);
    g.fillEllipse(35, 35, 60, 45);
    g.fillStyle(0xaaddff);
    g.fillEllipse(20, 20, 20, 15);
    g.fillStyle(0x66ccff);
    g.fillCircle(45, 45, 12);
    g.generateTexture('bg_asteroid_2', 90, 70);

    // ========== ЧАСТИЦЫ ==========
    g.clear();
    g.fillStyle(0xffffff);
    g.fillCircle(2, 2, 2);
    g.generateTexture('star', 4, 4);
    
    g.clear();
    g.fillStyle(0xffaa00, 0.9);
    g.fillCircle(4, 4, 4);
    g.generateTexture('flare', 8, 8);
    
    g.clear();
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(3, 3, 3);
    g.generateTexture('spark', 6, 6);

    // ========== КНОПКА ПАУЗЫ ==========
    g.clear();
    g.fillStyle(0x2c3e50, 0.85);
    g.fillRoundedRect(0, 0, 60, 60, 10);
    g.lineStyle(2, 0x22d3ee);
    g.strokeRoundedRect(0, 0, 60, 60, 10);
    g.fillStyle(0xffffff);
    g.fillRect(15, 15, 10, 30);
    g.fillRect(35, 15, 10, 30);
    g.generateTexture('pause_button', 60, 60);

    // ========== ИКОНКА ВАГОНА ==========
    g.clear();
    g.fillStyle(0x88ccff);
    g.fillRoundedRect(8, 8, 32, 18, 4);
    g.fillStyle(0x000000);
    g.fillRect(12, 14, 4, 3);
    g.fillRect(20, 14, 4, 3);
    g.fillStyle(0xffaa00);
    g.fillCircle(10, 24, 2);
    g.fillCircle(22, 24, 2);
    g.generateTexture('wagon_icon', 48, 34);

    g.destroy();
  }
}

// =========================================================================
// PlayScene – основной игровой процесс
// =========================================================================
class PlayScene extends Phaser.Scene {
  constructor() {
    super('play');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Счётчики
    this.score = 0;
    this.crystals = 0;
    this.meters = 0;
    this.best = Number(localStorage.getItem('skypulse_best') || 0);

    // Прогрессия вагонов
    this.wagons = [];
    this.collectedCoins = 0;
    this.coinsForWagon = 15;      // монет на вагон
    this.maxWagons = 12;           // максимум вагонов
    this.wagonGap = 28;            // расстояние между вагонами
    this.wagonSpring = 0.12;       // упругость
    // Целевая позиция игрока по X (для смещения вправо, чтобы вагоны помещались)
    this.targetPlayerX = 110;      // начальная позиция
    this.playerXSpeed = 0.05;      // скорость смещения к цели

    // Состояние
    this.started = false;
    this.dead = false;
    this.level = 0;
    this.isPaused = false;
    this.pauseOverlay = null;
    this.pauseTexts = [];

    // Параметры сложности (ИЗМЕНЕНО: препятствия реже, но быстрее)
    this.baseSpeed = 240;
    this.currentSpeed = this.baseSpeed;
    this.gapSize = 240;             // начальный зазор
    // spawnDelay увеличивается с уровнем (препятствия реже)
    this.spawnDelay = 1300;          // базовый
    this.spawnDelayIncrease = 50;    // прирост за уровень

    this.gateTextures = ['gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'];

    // Бонусы
    this.bonusActive = false;
    this.bonusType = null;
    this.bonusTime = 0;
    this.bonusMultiplier = 1;
    this.bonusTimer = null;
    this.shieldActive = false;
    this.magnetRange = 220;
    this.lastBonusTime = 0;

    // Группы объектов
    this.pipes = [];
    this.coins = [];
    this.scoreZones = [];
    this.stars = [];
    this.planets = [];
    this.ships = [];
    this.asteroids = [];

    // Таймеры
    this.mainTimers = [];
    this.soundQueue = [];

    // Создание мира
    this.createBackground();
    this.createPlanets();            // много планет изначально
    this.createShips();
    this.createAsteroids();
    this.createPlayer();
    this.createUI();

    // Управление
    this.input.on('pointerdown', () => {
      if (this.dead) {
        this.scene.restart();
        return;
      }
      if (!this.started) this.startRun();
      this.flap();
    });

    this.physics.world.setBounds(0, 0, w, h);
    this.events.on('resize', this.onResize, this);
    this.scale.on('resize', this.onResize, this);
  }

  update() {
    if (this.isPaused) return;

    this.updateStars();
    this.updatePlanets();
    this.updateShips();
    this.updateAsteroids();

    if (!this.started || this.dead) return;

    // Плавное смещение игрока к целевой позиции
    this.player.x += (this.targetPlayerX - this.player.x) * this.playerXSpeed;

    const body = this.player.body;
    this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75));

    if (!this.shieldActive && (this.player.y < -50 || this.player.y > this.scale.height + 50)) {
      this.handleDeath();
    }

    if (this.bonusActive && this.bonusType === 'magnet') {
      const magnetCoins = this.coins.filter(item => item.active);
      for (let item of magnetCoins) {
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          item.x, item.y
        );
        if (dist < this.magnetRange) {
          const angle = Phaser.Math.Angle.Between(item.x, item.y, this.player.x, this.player.y);
          item.x += Math.cos(angle) * 10;
          item.y += Math.sin(angle) * 10;
        }
      }
    }

    this.updateWagons();
    this.cleanupObjects();
  }

  // =======================================================================
  // СОЗДАНИЕ МИРА
  // =======================================================================

  createBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    this.add.rectangle(w / 2, h / 2, w, h, 0x030712).setDepth(-30);
    
    for (let i = 0; i < 200; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setScale(Phaser.Math.FloatBetween(0.2, 1.8));
      star.setAlpha(Phaser.Math.FloatBetween(0.1, 0.7));
      star.setDepth(-25);
      this.stars.push({
        sprite: star,
        speed: Phaser.Math.Between(3, 20),
      });
    }
  }

  createPlanets() {
    const w = this.scale.width;
    const h = this.scale.height;
    // Создаём 15 планет, разбросанных далеко
    for (let i = 1; i <= 15; i++) {
      const x = Phaser.Math.Between(w, w * 15);
      const y = Phaser.Math.Between(50, h - 50);
      const planet = this.add.image(x, y, `planet_${i}`);
      planet.setScale(Phaser.Math.FloatBetween(2.0, 4.0));
      planet.setAlpha(0.5 + Math.random() * 0.3);
      planet.setDepth(-15);
      this.planets.push({
        sprite: planet,
        speed: Phaser.Math.Between(2, 12),
      });
    }
  }

  createShips() {
    const w = this.scale.width;
    const h = this.scale.height;
    const shipTextures = ['bg_ship_1', 'bg_ship_2'];
    for (let i = 0; i < 8; i++) {
      const tex = shipTextures[Math.floor(Math.random() * shipTextures.length)];
      const ship = this.add.image(
        Phaser.Math.Between(w, w * 12),
        Phaser.Math.Between(50, h - 50),
        tex
      );
      ship.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      ship.setAlpha(0.7);
      ship.setDepth(-10);
      ship.setBlendMode(Phaser.BlendModes.ADD);
      this.ships.push({
        sprite: ship,
        speed: Phaser.Math.Between(3, 10),
      });
    }
  }

  createAsteroids() {
    const w = this.scale.width;
    const h = this.scale.height;
    const asteroidTextures = ['bg_asteroid_1', 'bg_asteroid_2'];
    for (let i = 0; i < 10; i++) {
      const tex = asteroidTextures[Math.floor(Math.random() * asteroidTextures.length)];
      const asteroid = this.add.image(
        Phaser.Math.Between(w, w * 12),
        Phaser.Math.Between(50, h - 50),
        tex
      );
      asteroid.setScale(Phaser.Math.FloatBetween(0.6, 1.8));
      asteroid.setAlpha(0.7);
      asteroid.setDepth(-12);
      asteroid.setBlendMode(Phaser.BlendModes.ADD);
      this.asteroids.push({
        sprite: asteroid,
        speed: Phaser.Math.Between(4, 14),
      });
    }
  }

  createPlayer() {
    const h = this.scale.height;
    this.player = this.physics.add.image(this.targetPlayerX, h / 2, 'player');
    this.player.setScale(0.9);
    this.player.setCollideWorldBounds(false);
    this.player.setMaxVelocity(600, 1000);
    this.player.body.setCircle(24, 15, 5);
    this.player.setBlendMode(Phaser.BlendModes.ADD);
    this.player.body.setMass(10000);

    // Звуки
    this.coinSound = this.sound.add('coin_sound', { volume: 0.4 });
    this.itemSound = this.sound.add('item_sound', { volume: 0.5 });
    this.tapSound = this.sound.add('tap_sound', { volume: 0.3 });
    this.wagonSound = this.sound.add('wagon_sound', { volume: 0.6 });
    this.levelUpSound = this.sound.add('level_up_sound', { volume: 0.5 });
    this.bgMusic = this.sound.add('bg_music', { loop: true, volume: 0.4 });

    this.trailEmitter = this.add.particles(0, 0, 'flare', {
      speed: 40,
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 200,
      blendMode: Phaser.BlendModes.ADD,
      follow: this.player,
      followOffset: { x: -20, y: 0 },
      quantity: 4,
      frequency: 15,
    });
  }

  createUI() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.scoreText = this.add.text(w / 2, 56, '0', {
      fontSize: '52px',
      color: '#fff',
      fontStyle: 'bold',
      stroke: '#22d3ee',
      strokeThickness: 4,
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.bestText = this.add.text(20, 24, `🏆 ${this.best}`, {
      fontSize: '20px',
      color: '#7dd3fc',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setDepth(10).setScrollFactor(0);

    this.crystalText = this.add.text(w - 20, 24, '💎 0', {
      fontSize: '20px',
      color: '#fde047',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);

    this.meterText = this.add.text(20, h - 80, '📏 0 м', {
      fontSize: '18px',
      color: '#a5f3fc',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setDepth(10).setScrollFactor(0);

    this.bonusText = this.add.text(w - 20, 70, '', {
      fontSize: '18px',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
      align: 'right',
    }).setOrigin(1, 0).setDepth(10).setVisible(false).setScrollFactor(0);

    this.levelText = this.add.text(w / 2, h / 2 - 100, '', {
      fontSize: '48px',
      color: '#fff',
      fontStyle: 'bold',
      stroke: '#7c3aed',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(15).setVisible(false).setScrollFactor(0);

    this.wagonCountText = this.add.text(w - 150, h - 40, `🚃 0/${this.maxWagons}`, {
      fontSize: '18px',
      color: '#88ccff',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setDepth(10).setScrollFactor(0);

    this.wagonProgressText = this.add.text(w / 2, h - 40, `${this.collectedCoins}/${this.coinsForWagon}`, {
      fontSize: '14px',
      color: '#a5f3fc',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 1,
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.introText = this.add.text(w / 2, h * 0.40, 'СОБИРАЙ МОНЕТЫ\nЧТОБЫ УДЛИНИТЬ ТАКСИ', {
      fontSize: '16px',
      color: '#fff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#7c3aed',
      strokeThickness: 3,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.coinTipsText = this.add.text(w / 2, h * 0.55, '🟡 Золото | 🔴 Скорость | 🔵 Щит | 🟢 Магнит | 🟣 Замедление', {
      fontSize: '12px',
      color: '#cbd5e1',
      align: 'center',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.pauseButton = this.add.image(w - 40, h - 40, 'pause_button')
      .setInteractive()
      .setDepth(20)
      .setScrollFactor(0);
    this.pauseButton.on('pointerdown', () => this.togglePause());
    this.pauseButton.on('pointerover', () => this.pauseButton.setScale(1.1));
    this.pauseButton.on('pointerout', () => this.pauseButton.setScale(1));

    this.createGameOverBox();
  }

  createGameOverBox() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const panel = this.add.rectangle(0, 0, Math.min(400, w * 0.85), 360, 0x0f172a, 0.95)
      .setStrokeStyle(4, 0x22d3ee, 0.9)
      .setScrollFactor(0);
    
    const title = this.add.text(0, -130, 'ИГРА ОКОНЧЕНА', {
      fontSize: '32px',
      color: '#fff',
      fontStyle: 'bold',
      stroke: '#7c3aed',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0);
    
    const subtitle = this.add.text(0, -30, '', {
      fontSize: '18px',
      color: '#7dd3fc',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0);
    subtitle.setName('subtitle');
    
    const tip = this.add.text(0, 110, 'Нажми, чтобы сыграть снова', {
      fontSize: '18px',
      color: '#cbd5e1',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);
    
    this.gameOverBox = this.add.container(w / 2, h / 2, [panel, title, subtitle, tip]);
    this.gameOverBox.setVisible(false);
  }

  // =======================================================================
  // ИГРОВАЯ ЛОГИКА
  // =======================================================================

  startRun() {
    this.started = true;
    this.introText.setVisible(false);
    this.coinTipsText.setVisible(false);
    if (this.bgMusic) this.bgMusic.play();

    this.spawnGate();
    this.scheduleNextSpawn();
  }

  scheduleNextSpawn() {
    if (this.dead) return;
    this.time.delayedCall(this.spawnDelay, () => {
      if (!this.dead && this.started) {
        this.spawnGate();
        this.scheduleNextSpawn();
      }
    });
  }

  flap() {
    this.player.body.setVelocityY(-300);
    this.player.setScale(0.95);
    this.tweens.add({
      targets: this.player,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 150,
      ease: 'Quad.out',
    });
    this.playSound(this.tapSound);
    try { window.Telegram?.WebApp?.HapticFeedback?.selectionChanged?.(); } catch {}
  }

  playSound(sound, volume = null) {
    if (!sound) return;
    try {
      if (sound.isPlaying) return;
      if (volume !== null) sound.setVolume(volume);
      sound.play();
    } catch (e) {
      console.warn('Sound play error:', e);
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      this.pauseOverlay = this.add.rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x000000, 0.5
      ).setDepth(25).setScrollFactor(0);

      const pauseText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 50,
        '⏸️ ПАУЗА',
        {
          fontSize: '48px',
          color: '#fff',
          fontStyle: 'bold',
          stroke: '#7c3aed',
          strokeThickness: 4
        }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);

      const tipText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 + 30,
        'Нажми на кнопку паузы, чтобы продолжить',
        {
          fontSize: '16px',
          color: '#ccc',
          align: 'center'
        }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);

      this.pauseTexts = [pauseText, tipText];
    } else {
      this.physics.resume();
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

  updateLevel() {
    const newLevel = Math.floor(this.meters / 300);
    if (newLevel > this.level) {
      this.level = newLevel;
      
      // Увеличиваем скорость
      this.baseSpeed = 240 + this.level * 18;
      // Препятствия становятся уже
      this.gapSize = Math.max(160, 240 - this.level * 6);
      // Препятствия появляются реже (spawnDelay растёт)
      this.spawnDelay = Math.min(2500, 1300 + this.level * 50);
      
      if (!this.bonusActive) this.currentSpeed = this.baseSpeed;

      this.levelText.setText(`УРОВЕНЬ ${this.level + 1}`);
      this.levelText.setVisible(true);
      this.levelText.setAlpha(1);
      
      this.playSound(this.levelUpSound);
      
      this.tweens.add({
        targets: this.levelText,
        alpha: 0,
        duration: 2000,
        ease: 'Power2',
      });

      // Добавляем случайную планету при переходе уровня
      this.addRandomPlanet();
    }
  }

  addRandomPlanet() {
    const w = this.scale.width;
    const h = this.scale.height;
    const idx = Phaser.Math.Between(1, 15);
    const planet = this.add.image(w + 200, Phaser.Math.Between(50, h - 50), `planet_${idx}`);
    planet.setScale(Phaser.Math.FloatBetween(1.5, 3.0));
    planet.setAlpha(0.6);
    planet.setDepth(-15);
    this.planets.push({
      sprite: planet,
      speed: Phaser.Math.Between(5, 18),
    });
  }

  updateWagons() {
    if (this.wagons.length === 0) return;
    let prev = this.player;
    for (let i = 0; i < this.wagons.length; i++) {
      let wagon = this.wagons[i];
      let targetX = prev.x - this.wagonGap;
      let targetY = prev.y;
      let dx = targetX - wagon.x;
      let dy = targetY - wagon.y;
      wagon.x += dx * this.wagonSpring;
      wagon.y += dy * this.wagonSpring;
      if (wagon.body) wagon.body.reset(wagon.x, wagon.y);
      prev = wagon;
    }
  }

  addWagon() {
    if (this.wagons.length >= this.maxWagons) return;
    
    // Сдвигаем целевую позицию игрока вправо, чтобы освободить место для вагонов
    this.targetPlayerX += this.wagonGap * 0.5; // сдвиг на полрасстояния, чтобы 4 вагона влезали
    // Ограничиваем, чтобы игрок не улетел за экран
    this.targetPlayerX = Math.min(this.scale.width * 0.8, this.targetPlayerX);
    
    let last = this.wagons.length > 0 ? this.wagons[this.wagons.length - 1] : this.player;
    let spawnX = last.x - this.wagonGap * 2;
    let spawnY = last.y;
    let texIndex = Phaser.Math.Between(0, 9);
    
    let wagon = this.physics.add.image(spawnX, spawnY, `wagon_${texIndex}`);
    wagon.setScale(0.8);
    wagon.body.setCircle(12, 8, 6);
    wagon.body.setAllowGravity(false);
    wagon.body.setMass(0.5);
    wagon.body.setDrag(0.9);
    wagon.setDepth(5 + this.wagons.length);
    wagon.setData('hp', 1);

    this.physics.add.collider(wagon, this.pipes, this.wagonHit, null, this);
    this.wagons.push(wagon);

    wagon.x = this.scale.width + 50;
    wagon.y = this.player.y;
    this.tweens.add({
      targets: wagon,
      x: spawnX,
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => { wagon.x = spawnX; }
    });

    this.playSound(this.wagonSound);
    this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
    this.updateCameraZoom();

    const emitter = this.add.particles(wagon.x, wagon.y, 'spark', {
      speed: 80,
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 300,
      quantity: 10,
      blendMode: Phaser.BlendModes.ADD,
      tint: 0x88ccff,
    });
    emitter.explode(10);
  }

  wagonHit(wagon, pipe) {
    let hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      let index = this.wagons.indexOf(wagon);
      if (index !== -1) {
        wagon.destroy();
        this.wagons.splice(index, 1);
        // При потере вагона сдвигаем цель игрока обратно
        this.targetPlayerX -= this.wagonGap * 0.5;
        this.targetPlayerX = Math.max(110, this.targetPlayerX);
        this.cameras.main.shake(100, 0.005);
        this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
        this.updateCameraZoom();
      }
    } else {
      wagon.setData('hp', hp);
      this.tweens.add({
        targets: wagon,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 1
      });
    }
  }

  updateCameraZoom() {
    let totalLength = (this.wagons.length + 1) * this.wagonGap;
    let screenWidth = this.scale.width;
    let targetZoom = Math.min(1, screenWidth / (totalLength + 100));
    targetZoom = Math.max(0.5, targetZoom);
    this.tweens.add({
      targets: this.cameras.main,
      zoom: targetZoom,
      duration: 500,
      ease: 'Sine.easeInOut'
    });
  }

  spawnCoin(x, y) {
    // Увеличиваем вероятность появления монет до 0.9
    if (Math.random() > 0.9) return;
    
    let coinType = 'gold';
    let texture = 'coin_gold';

    const r = Math.random();
    if (this.level >= 1 && r < 0.15) {
      coinType = 'red';
      texture = 'coin_red';
    } else if (this.level >= 2 && r < 0.28) {
      coinType = 'blue';
      texture = 'coin_blue';
    } else if (this.level >= 3 && r < 0.40) {
      coinType = 'green';
      texture = 'coin_green';
    } else if (this.level >= 4 && r < 0.50) {
      coinType = 'purple';
      texture = 'coin_purple';
    }

    const coin = this.physics.add.image(
      x + Phaser.Math.Between(-20, 20),
      y,
      texture
    )
      .setImmovable(true)
      .setVelocityX(-this.currentSpeed)
      .setAngularVelocity(200);
    
    coin.body.setAllowGravity(false);
    coin.setScale(0.01);
    coin.coinType = coinType;

    this.tweens.add({
      targets: coin,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.out',
    });

    this.coins.push(coin);
    this.physics.add.overlap(
      this.player,
      coin,
      (player, coin) => this.collectCoin(coin),
      null,
      this
    );
  }

  collectCoin(coin) {
    if (!coin.active) return;
    
    let value = 1;
    let bonusType = null;
    
    switch (coin.coinType) {
      case 'red':
        value = 2;
        bonusType = 'speed';
        break;
      case 'blue':
        value = 1;
        bonusType = 'shield';
        break;
      case 'green':
        value = 1;
        bonusType = 'magnet';
        break;
      case 'purple':
        value = 1;
        bonusType = 'slow';
        break;
      default:
        value = 1;
    }
    
    if (this.bonusActive && this.bonusType === 'speed') value *= 2;

    this.crystals += value;
    this.crystalText.setText(`💎 ${this.crystals}`);
    this.collectedCoins += value;

    this.wagonProgressText.setText(`${this.collectedCoins}/${this.coinsForWagon}`);

    if (this.collectedCoins >= this.coinsForWagon && this.wagons.length < this.maxWagons) {
      this.addWagon();
      this.collectedCoins -= this.coinsForWagon;
      this.wagonProgressText.setText(`${this.collectedCoins}/${this.coinsForWagon}`);
    }

    if (bonusType) {
      this.playSound(this.itemSound);
      this.activateBonus(bonusType);
    } else {
      this.playSound(this.coinSound);
    }

    const emitter = this.add.particles(coin.x, coin.y, 'flare', {
      speed: 100,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 250,
      quantity: 15,
      blendMode: Phaser.BlendModes.ADD,
      tint: coin.coinType === 'red' ? 0xff6666 : 0xffaa00,
    });
    emitter.explode(15);

    this.tweens.add({
      targets: this.crystalText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 80,
      yoyo: true,
      ease: 'Quad.out',
    });

    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(
        bonusType ? 'heavy' : 'soft'
      );
    } catch {}
    
    coin.destroy();
  }

  activateBonus(type) {
    const now = Date.now();
    if (now - this.lastBonusTime < 500) return;
    this.lastBonusTime = now;

    if (this.bonusActive) this.deactivateBonus();
    
    this.bonusActive = true;
    this.bonusType = type;
    this.bonusTime = 6;

    switch (type) {
      case 'speed':
        this.currentSpeed = this.baseSpeed * 1.5;
        this.bonusMultiplier = 2;
        this.bonusText.setColor('#ffaa00').setText(`🚀 x2 ${this.bonusTime}с`);
        break;
      case 'shield':
        this.shieldActive = true;
        this.player.body.checkCollision.none = true;
        this.player.setTint(0x88ccff);
        this.bonusText.setColor('#88ccff').setText(`🛡️ ${this.bonusTime}с`);
        break;
      case 'magnet':
        this.bonusText.setColor('#2ecc71').setText(`🧲 ${this.bonusTime}с`);
        break;
      case 'slow':
        this.currentSpeed = this.baseSpeed * 0.6;
        this.bonusText.setColor('#9b59b6').setText(`⏳ ${this.bonusTime}с`);
        break;
    }
    
    this.bonusText.setVisible(true);

    if (this.bonusTimer) this.bonusTimer.remove();
    this.bonusTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.bonusTime -= 1;
        if (this.bonusTime <= 0) {
          this.deactivateBonus();
        } else {
          let emoji = '🚀';
          if (type === 'shield') emoji = '🛡️';
          else if (type === 'magnet') emoji = '🧲';
          else if (type === 'slow') emoji = '⏳';
          this.bonusText.setText(`${emoji} ${this.bonusTime}с`);
        }
      },
      loop: true,
    });
  }

  deactivateBonus() {
    this.bonusActive = false;
    this.bonusType = null;
    this.shieldActive = false;
    this.currentSpeed = this.baseSpeed;
    this.bonusMultiplier = 1;
    this.player.clearTint();
    this.player.body.checkCollision.none = false;
    this.bonusText.setVisible(false);
    if (this.bonusTimer) {
      this.bonusTimer.remove();
      this.bonusTimer = null;
    }
  }

  spawnGate() {
    if (this.dead) return;
    
    const w = this.scale.width;
    const h = this.scale.height;

    const textureIndex = Math.min(this.level, this.gateTextures.length - 1);
    const gateTexture = this.gateTextures[textureIndex];

    const gap = this.gapSize + Phaser.Math.Between(-15, 15);
    const centerY = Phaser.Math.Between(120, h - 120);
    const topY = centerY - gap / 2;
    const bottomY = centerY + gap / 2;
    const x = w;

    const topPipe = this.physics.add.image(x, topY, gateTexture)
      .setOrigin(0.5, 1)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, topY / 400))
      .setVelocityX(-this.currentSpeed);
    topPipe.body.setAllowGravity(false);

    const bottomPipe = this.physics.add.image(x, bottomY, gateTexture)
      .setOrigin(0.5, 0)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, (h - bottomY) / 400))
      .setVelocityX(-this.currentSpeed);
    bottomPipe.body.setAllowGravity(false);

    [topPipe, bottomPipe].forEach(pipe => {
      pipe.setScale(1, 0.01);
      this.tweens.add({
        targets: pipe,
        scaleY: pipe.scaleY,
        duration: 300,
        ease: 'Back.out',
      });
    });

    if (this.level >= 2 && Math.random() < 0.4) {
      const moveDistance = Phaser.Math.Between(-50, 50);
      this.tweens.add({
        targets: [topPipe, bottomPipe],
        y: `+=${moveDistance}`,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.pipes.push(topPipe, bottomPipe);
    this.physics.add.collider(this.player, topPipe, this.hitPipe, null, this);
    this.physics.add.collider(this.player, bottomPipe, this.hitPipe, null, this);

    const zone = this.add.zone(x + 60, h / 2, 12, h);
    this.physics.add.existing(zone);
    zone.body.setAllowGravity(false);
    zone.body.setImmovable(true);
    zone.body.setVelocityX(-this.currentSpeed);
    zone.body.setSize(12, h);
    this.physics.add.overlap(this.player, zone, () => this.passGate(zone), null, this);
    this.scoreZones.push(zone);

    this.spawnCoin(x, centerY);
  }

  hitPipe(player, pipe) {
    if (this.shieldActive) {
      const emitter = this.add.particles(pipe.x, pipe.y, 'spark', {
        speed: 150,
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 300,
        quantity: 15,
        blendMode: Phaser.BlendModes.ADD,
      });
      emitter.explode(15);
      return;
    } else {
      this.handleDeath();
    }
  }

  passGate(zone) {
    if (zone.passed) return;
    zone.passed = true;
    
    this.score += 1 * this.bonusMultiplier;
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
      ease: 'Quad.out',
    });
    
    this.cameras.main.shake(20, 0.001);
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
  }

  handleDeath() {
    if (this.dead) return;
    this.dead = true;
    this.trailEmitter.stop();
    if (this.bgMusic) this.bgMusic.stop();

    this.mainTimers.forEach(timer => timer && timer.remove());
    if (this.bonusTimer) this.bonusTimer.remove();

    this.physics.pause();
    this.cameras.main.shake(300, 0.005);
    this.cameras.main.flash(300, 255, 100, 100, false);
    this.player.setTint(0xff0000);
    this.player.setAngle(90);

    const emitter = this.add.particles(this.player.x, this.player.y, 'flare', {
      speed: 250,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 40,
      blendMode: Phaser.BlendModes.ADD,
    });
    emitter.explode(40);

    this.showGameOver();
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('error');
    } catch {}
  }

  showGameOver() {
    const subtitle = this.gameOverBox.getByName('subtitle');
    subtitle.setText(
      `Счёт: ${this.score}\n` +
      `Рекорд: ${this.best}\n` +
      `💎 ${this.crystals}\n` +
      `📏 ${Math.floor(this.meters)} м\n` +
      `🚃 Вагонов: ${this.wagons.length}/${this.maxWagons}`
    );
    this.gameOverBox.setVisible(true);
    this.gameOverBox.setScale(0.9);
    this.gameOverBox.setAlpha(0);
    this.tweens.add({
      targets: this.gameOverBox,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.out',
    });
  }

  cleanupObjects() {
    this.pipes = this.pipes.filter(p => {
      if (p.x < -150) {
        p.destroy();
        return false;
      }
      return true;
    });

    this.coins = this.coins.filter(c => {
      if (!c.active || c.x < -100) {
        c.destroy();
        return false;
      }
      return true;
    });

    this.scoreZones = this.scoreZones.filter(z => {
      if (z.x < -60) {
        z.destroy();
        return false;
      }
      return true;
    });
  }

  updateStars() {
    const w = this.scale.width;
    const h = this.scale.height;
    const factor = this.started && !this.dead ? 1 : 0.3;
    
    for (let s of this.stars) {
      s.sprite.x -= s.speed * factor * (1 / 60);
      if (s.sprite.x < -10) {
        s.sprite.x = w + Phaser.Math.Between(5, 50);
        s.sprite.y = Phaser.Math.Between(0, h);
      }
    }
  }

  updatePlanets() {
    const w = this.scale.width;
    const factor = this.started && !this.dead ? 0.2 : 0.05;
    
    for (let p of this.planets) {
      p.sprite.x -= p.speed * factor * (1 / 60);
      if (p.sprite.x < -300) {
        p.sprite.x = w + Phaser.Math.Between(400, 2000);
        p.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  updateShips() {
    const w = this.scale.width;
    const factor = this.started && !this.dead ? 0.3 : 0.1;
    
    for (let s of this.ships) {
      s.sprite.x -= s.speed * factor * (1 / 60);
      if (s.sprite.x < -200) {
        s.sprite.x = w + Phaser.Math.Between(300, 1500);
        s.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  updateAsteroids() {
    const w = this.scale.width;
    const factor = this.started && !this.dead ? 0.3 : 0.1;
    
    for (let a of this.asteroids) {
      a.sprite.x -= a.speed * factor * (1 / 60);
      if (a.sprite.x < -200) {
        a.sprite.x = w + Phaser.Math.Between(300, 1500);
        a.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  onResize() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.scoreText.setPosition(w / 2, 56);
    this.crystalText.setPosition(w - 20, 24);
    this.meterText.setPosition(20, h - 80);
    if (this.bonusText) this.bonusText.setPosition(w - 20, 70);
    this.levelText.setPosition(w / 2, h / 2 - 100);

    if (this.pauseButton) this.pauseButton.setPosition(w - 40, h - 40);
    if (this.wagonCountText) this.wagonCountText.setPosition(w - 150, h - 40);
    if (this.wagonProgressText) this.wagonProgressText.setPosition(w / 2, h - 40);

    if (!this.started) {
      this.introText.setPosition(w / 2, h * 0.40);
      this.coinTipsText.setPosition(w / 2, h * 0.55);
    }

    this.gameOverBox.setPosition(w / 2, h / 2);
  }
}

// =========================================================================
// Конфигурация игры
// =========================================================================
const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 390,
  height: 844,
  backgroundColor: '#030712',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    fullscreenTarget: 'parent',
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1300 },
      debug: false,
      maxEntities: 500,
    },
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  scene: [BootScene, PlayScene],
};

new Phaser.Game(config);
