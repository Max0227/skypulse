import Phaser from 'phaser';

// =========================================================================
// BootScene – создание всех текстур
// =========================================================================
class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    // Загружаем звуки
    this.load.audio('coin_sound', 'sounds/coin.mp3');
    this.load.audio('item_sound', 'sounds/item.mp3');
    this.load.audio('tap_sound', 'sounds/tap.mp3');
    this.load.audio('bg_music', 'sounds/fifth_element_theme.mp3');
  }

  create() {
    this.createTextures();
    this.scene.start('play');
  }

  createTextures() {
    const g = this.add.graphics();

    // ========== ИГРОК: ЛЕТАЮЩЕЕ ТАКСИ ИЗ ПЯТОГО ЭЛЕМЕНТА ==========
    g.clear();
    // Основной корпус
    g.fillStyle(0xffcc00);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    // Крыша и задняя часть
    g.fillStyle(0xffaa00);
    g.fillRoundedRect(20, 8, 40, 10, 4);
    g.fillRect(56, 16, 8, 20);
    // Окна
    g.fillStyle(0x88ccff);
    g.fillRect(22, 16, 14, 8);
    g.fillRect(40, 16, 14, 8);
    // Фары
    g.fillStyle(0xffffff);
    g.fillCircle(18, 28, 4);
    g.fillStyle(0xffffaa);
    g.fillCircle(18, 28, 2);
    // Шашечки такси
    g.fillStyle(0x000000);
    g.fillRect(40, 30, 6, 4);
    g.fillRect(48, 30, 6, 4);
    g.fillRect(56, 30, 6, 4);
    // Номерной знак
    g.fillStyle(0x333333);
    g.fillRect(10, 34, 20, 6);
    g.generateTexture('player', 80, 60);

    // ========== КОЛОННЫ ==========
    const createGate = (color, light, name) => {
      g.clear();
      g.fillStyle(color);
      g.fillRoundedRect(0, 0, 100, 400, 20);
      g.fillStyle(light);
      g.fillRoundedRect(10, 0, 15, 400, 8);
      g.fillStyle(light);
      g.fillRoundedRect(0, 0, 100, 30, 12);
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
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(10, 10, 4);
      g.generateTexture(name, 32, 32);
    };
    createCoin(0xfacc15, 0xfffbeb, 'coin_gold');
    createCoin(0xef4444, 0xffaa00, 'coin_red');
    createCoin(0x3498db, 0xffffff, 'coin_blue');
    createCoin(0x2ecc71, 0xffffff, 'coin_green');
    createCoin(0x9b59b6, 0xffffff, 'coin_purple');

    // ========== КАНИСТРЫ ==========
    g.clear();
    g.fillStyle(0x3498db);
    g.fillRoundedRect(4, 0, 24, 28, 6);
    g.fillStyle(0x2980b9);
    g.fillRect(12, -4, 8, 6);
    g.fillStyle(0x1f6a9a);
    g.fillCircle(16, -4, 4);
    g.fillStyle(0xffffff);
    g.fillRect(10, 6, 12, 4);
    g.fillRect(10, 14, 12, 4);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(20, 10, 4);
    g.generateTexture('fuel_can_blue', 32, 32);

    g.clear();
    g.fillStyle(0xff4444);
    g.fillRoundedRect(4, 0, 24, 28, 6);
    g.fillStyle(0xcc3333);
    g.fillRect(12, -4, 8, 6);
    g.fillStyle(0xaa2222);
    g.fillCircle(16, -4, 4);
    g.fillStyle(0xffffff);
    g.fillRect(10, 6, 12, 4);
    g.fillRect(10, 14, 12, 4);
    g.fillStyle(0xffff00, 0.4);
    g.fillCircle(20, 10, 6);
    g.generateTexture('fuel_can_red', 32, 32);

    // ========== УЛУЧШЕНИЯ КОРАБЛЯ ==========
    const upgrades = [
      { name: 'engine', color: 0xff5500, draw: (g) => {
        g.fillTriangle(8, 20, 8, 44, 0, 32);
        g.fillTriangle(56, 20, 56, 44, 64, 32);
      }},
      { name: 'wings', color: 0x3a6ea5, draw: (g) => {
        g.fillTriangle(0, 16, 0, 48, 20, 32);
        g.fillTriangle(64, 16, 64, 48, 44, 32);
      }},
      { name: 'armor', color: 0x888888, draw: (g) => {
        g.fillRoundedRect(16, 8, 32, 8, 4);
        g.fillRoundedRect(16, 48, 32, 8, 4);
      }},
      { name: 'weapon', color: 0xff0000, draw: (g) => {
        g.fillRect(8, 28, 8, 8);
        g.fillRect(48, 28, 8, 8);
      }},
      { name: 'shield', color: 0x88ccff, draw: (g) => {
        g.fillCircle(32, 32, 30);
        g.lineStyle(2, 0xffffff);
        g.strokeCircle(32, 32, 30);
      }}
    ];
    upgrades.forEach(u => {
      g.clear();
      g.fillStyle(u.color);
      u.draw(g);
      g.generateTexture(`upgrade_${u.name}`, 64, 64);
    });

    // ========== ПРЕДМЕТ УЛУЧШЕНИЯ ==========
    g.clear();
    g.fillStyle(0x3399ff);
    g.fillRoundedRect(0, 0, 48, 48, 8);
    g.fillStyle(0xffffff);
    g.fillCircle(24, 24, 12);
    g.fillStyle(0x3399ff);
    g.fillCircle(24, 24, 8);
    g.fillStyle(0xffaa00);
    g.fillCircle(24, 24, 4);
    g.fillStyle(0x88ccff, 0.3);
    g.fillCircle(24, 24, 20);
    g.generateTexture('upgrade_item', 48, 48);

    // ========== ФОНОВЫЕ ОБЪЕКТЫ (ПЯТЫЙ ЭЛЕМЕНТ) ==========
    // Огромный астероид
    g.clear();
    g.fillStyle(0x6b4e2e);
    g.fillEllipse(40, 40, 70, 50);
    g.fillStyle(0x5d3a1a);
    g.fillEllipse(20, 20, 30, 20);
    g.fillStyle(0xa0522d);
    g.fillEllipse(50, 50, 25, 15);
    g.fillStyle(0x8b5a2b);
    g.fillCircle(30, 60, 15);
    g.fillStyle(0x000000, 0.2);
    g.fillCircle(15, 15, 10);
    g.generateTexture('bg_asteroid_1', 100, 80);

    // Кристаллический астероид
    g.clear();
    g.fillStyle(0x88aaff);
    g.fillEllipse(35, 35, 60, 45);
    g.fillStyle(0xaaddff);
    g.fillEllipse(20, 20, 20, 15);
    g.fillStyle(0x66ccff);
    g.fillCircle(45, 45, 12);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(30, 30, 8);
    g.generateTexture('bg_asteroid_2', 90, 70);

    // Инопланетный корабль (тарелка)
    g.clear();
    g.fillStyle(0x88aaff);
    g.fillEllipse(40, 30, 70, 20);
    g.fillStyle(0xaaddff);
    g.fillEllipse(40, 20, 40, 12);
    g.fillStyle(0xffaa00);
    g.fillCircle(20, 30, 5);
    g.fillCircle(60, 30, 5);
    g.fillStyle(0xff5500);
    g.fillCircle(40, 35, 4);
    g.fillStyle(0xffffff, 0.2);
    g.fillEllipse(40, 30, 60, 15);
    g.generateTexture('bg_ship_1', 90, 50);

    // Корабль Мангалот
    g.clear();
    g.fillStyle(0xcc3333);
    g.fillRoundedRect(20, 20, 70, 30, 8);
    g.fillStyle(0xff6666);
    g.fillTriangle(90, 25, 90, 45, 110, 35);
    g.fillStyle(0xffaa00);
    g.fillCircle(35, 35, 5);
    g.fillCircle(55, 35, 5);
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(25, 15, 30, 6);
    g.generateTexture('bg_ship_2', 120, 60);

    // ========== ПЛАНЕТЫ ==========
    const createPlanet = (color, hasRing, hasAtmo, idx) => {
      g.clear();
      g.fillStyle(color);
      g.fillCircle(32, 32, 28);
      g.fillStyle(0x000000, 0.2);
      g.fillCircle(20, 20, 6);
      g.fillCircle(44, 44, 8);
      g.fillStyle(0xffffff, 0.1);
      g.fillCircle(30, 45, 5);
      if (hasRing) {
        g.lineStyle(4, 0xccaa88, 0.6);
        g.strokeEllipse(32, 32, 70, 20);
      }
      if (hasAtmo) {
        g.fillStyle(0x88aaff, 0.2);
        g.fillCircle(32, 32, 34);
      }
      g.generateTexture(`planet_${idx}`, 64, 64);
    };
    createPlanet(0x4a90e2, true, true, 1);
    createPlanet(0xe67e22, false, true, 2);
    createPlanet(0x2ecc71, true, false, 3);
    createPlanet(0x9b59b6, false, true, 4);
    createPlanet(0xf1c40f, true, false, 5);
    createPlanet(0xe74c3c, false, true, 6);
    createPlanet(0x1abc9c, true, true, 7);

    // ========== ЗВЁЗДЫ И ЧАСТИЦЫ ==========
    g.clear();
    g.fillStyle(0xffffff);
    g.fillCircle(2, 2, 2);
    g.generateTexture('star', 4, 4);
    g.clear();
    g.fillStyle(0xffaa00, 0.8);
    g.fillCircle(4, 4, 4);
    g.generateTexture('flare', 8, 8);
    g.clear();
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(3, 3, 3);
    g.generateTexture('spark', 6, 6);

    // ========== КНОПКА ПАУЗЫ ==========
    g.clear();
    g.fillStyle(0x2c3e50, 0.8);
    g.fillRoundedRect(0, 0, 60, 60, 10);
    g.fillStyle(0xffffff);
    g.fillRect(15, 15, 10, 30);
    g.fillRect(35, 15, 10, 30);
    g.generateTexture('pause_button', 60, 60);

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
    this.fuel = 100;
    this.maxFuel = 100;
    this.fuelConsumption = 0.05;

    // Состояние
    this.started = false;
    this.dead = false;
    this.level = 0;
    this.isPaused = false;
    this.pauseOverlay = null;

    // Параметры сложности
    this.baseSpeed = 250;
    this.currentSpeed = this.baseSpeed;
    this.gapSize = 220;
    this.spawnDelay = 1300;

    this.gateTextures = ['gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'];

    // Бонусы
    this.bonusActive = false;
    this.bonusType = null;
    this.bonusTime = 0;
    this.bonusMultiplier = 1;
    this.bonusTimer = null;
    this.shieldActive = false;

    // Улучшения корабля
    this.shipUpgrades = [];
    this.playerUpgrades = [];

    // Группы объектов
    this.pipes = [];
    this.coins = [];
    this.scoreZones = [];
    this.stars = [];
    this.planets = [];
    this.fuelCans = [];
    this.upgradeItems = [];
    this.backgroundObjects = [];

    // Таймеры
    this.mainTimers = [];

    // Создание мира
    this.createBackground();
    this.createPlanets();
    this.createBackgroundObjects();
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

    // Обновление позиций улучшений
    this.events.on('update', () => {
      if (this.player && this.playerUpgrades) {
        this.playerUpgrades.forEach(u => u.setPosition(this.player.x, this.player.y));
      }
    });
  }

  update() {
    if (this.isPaused) return;

    this.updateStars();
    this.updatePlanets();
    this.updateBackgroundObjects();

    if (!this.started || this.dead) return;

    this.fuel = Math.max(0, this.fuel - this.fuelConsumption);
    this.fuelBar.clear();
    this.fuelBar.fillStyle(0x3498db);
    this.fuelBar.fillRect(0, 0, (this.fuel / this.maxFuel) * 150, 15);
    if (this.fuel <= 0) this.handleDeath();

    const body = this.player.body;
    this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75));

    if (!this.shieldActive && (this.player.y < 0 || this.player.y > this.scale.height)) {
      this.handleDeath();
    }

    if (this.bonusActive && this.bonusType === 'magnet') {
      [...this.coins, ...this.fuelCans, ...this.upgradeItems].forEach(item => {
        if (item.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) < 200) {
          const angle = Phaser.Math.Angle.Between(item.x, item.y, this.player.x, this.player.y);
          item.x += Math.cos(angle) * 8;
          item.y += Math.sin(angle) * 8;
        }
      });
    }

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
    for (let i = 1; i <= 7; i++) {
      const x = Phaser.Math.Between(w, w * 5);
      const y = Phaser.Math.Between(50, h - 50);
      const planet = this.add.image(x, y, `planet_${i}`);
      planet.setScale(Phaser.Math.FloatBetween(1.2, 2.8));
      planet.setAlpha(0.6);
      planet.setDepth(-15);
      this.planets.push({
        sprite: planet,
        speed: Phaser.Math.Between(3, 15),
      });
    }
  }

  createBackgroundObjects() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Создаём 8-10 фоновых объектов
    const textures = ['bg_asteroid_1', 'bg_asteroid_2', 'bg_ship_1', 'bg_ship_2'];
    
    for (let i = 0; i < 10; i++) {
      const tex = textures[Math.floor(Math.random() * textures.length)];
      const obj = this.add.image(
        Phaser.Math.Between(w, w * 8),
        Phaser.Math.Between(50, h - 50),
        tex
      );
      obj.setScale(Phaser.Math.FloatBetween(0.5, 1.2));
      obj.setAlpha(0.8);
      obj.setDepth(-10);
      obj.setBlendMode(Phaser.BlendModes.ADD);
      this.backgroundObjects.push({
        sprite: obj,
        speed: Phaser.Math.Between(5, 15),
      });
    }
  }

  createPlayer() {
    const h = this.scale.height;
    this.player = this.physics.add.image(110, h / 2, 'player');
    this.player.setScale(0.9);
    this.player.setCollideWorldBounds(false);
    this.player.setMaxVelocity(600, 1000);
    this.player.body.setCircle(24, 15, 5);
    this.player.setBlendMode(Phaser.BlendModes.ADD);
    this.player.body.setMass(10000);

    // Звуки
    this.coinSound = this.sound.add('coin_sound');
    this.itemSound = this.sound.add('item_sound');
    this.tapSound = this.sound.add('tap_sound', { volume: 0.2 });
    this.bgMusic = this.sound.add('bg_music', { loop: true, volume: 0.5 });

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
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.bestText = this.add.text(20, 24, `🏆 ${this.best}`, {
      fontSize: '22px',
      color: '#7dd3fc',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setDepth(10).setScrollFactor(0);

    this.crystalText = this.add.text(w - 20, 24, '💎 0', {
      fontSize: '22px',
      color: '#fde047',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);

    this.meterText = this.add.text(20, h - 80, '📏 0 м', {
      fontSize: '20px',
      color: '#a5f3fc',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setDepth(10).setScrollFactor(0);

    this.fuelBar = this.add.graphics();
    this.fuelBar.fillStyle(0x3498db);
    this.fuelBar.fillRect(20, h - 50, 150, 15);
    this.fuelBar.setScrollFactor(0);

    this.bonusText = this.add.text(w - 20, 70, '', {
      fontSize: '20px',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(10).setVisible(false).setScrollFactor(0);

    this.levelText = this.add.text(w / 2, h / 2 - 100, '', {
      fontSize: '48px',
      color: '#fff',
      fontStyle: 'bold',
      stroke: '#7c3aed',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(15).setVisible(false).setScrollFactor(0);

    this.introText = this.add.text(w / 2, h * 0.40, 'НАЖМИ, ЧТОБЫ СТАРТОВАТЬ', {
      fontSize: '24px',
      color: '#fff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#7c3aed',
      strokeThickness: 3,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    // Кнопка паузы
    this.pauseButton = this.add.image(w - 40, 40, 'pause_button')
      .setInteractive()
      .setDepth(20)
      .setScrollFactor(0);
    this.pauseButton.on('pointerdown', () => this.togglePause());

    this.createGameOverBox();
  }

  createGameOverBox() {
    const w = this.scale.width;
    const h = this.scale.height;
    const panel = this.add.rectangle(0, 0, Math.min(400, w * 0.85), 340, 0x0f172a, 0.95)
      .setStrokeStyle(4, 0x22d3ee, 0.9)
      .setScrollFactor(0);
    const title = this.add.text(0, -120, 'ИГРА ОКОНЧЕНА', {
      fontSize: '30px', color: '#fff', fontStyle: 'bold', stroke: '#7c3aed', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0);
    const subtitle = this.add.text(0, -30, '', {
      fontSize: '24px', color: '#7dd3fc', fontStyle: 'bold', align: 'center',
      stroke: '#0f172a', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0);
    subtitle.setName('subtitle');
    const tip = this.add.text(0, 100, 'Тапни, чтобы сыграть снова', {
      fontSize: '22px', color: '#cbd5e1', align: 'center', fontStyle: 'bold'
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
    if (this.bgMusic) this.bgMusic.play();

    this.spawnGate();
    this.scheduleNextSpawn();

    this.fuelTimer = this.time.addEvent({
      delay: 2500,
      callback: this.spawnFuelCan,
      callbackScope: this,
      loop: true,
    });
    this.mainTimers.push(this.fuelTimer);
  }

  scheduleNextSpawn() {
    if (this.dead) return;
    this.time.delayedCall(this.spawnDelay, () => {
      if (!this.dead) {
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
    if (this.tapSound) this.tapSound.play();
    try { window.Telegram?.WebApp?.HapticFeedback?.selectionChanged?.(); } catch {}
  }

  // ========== ПАУЗА ==========
  togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.physics.pause();
      this.scene.pause();
      
      this.pauseOverlay = this.add.rectangle(
        this.scale.width/2, 
        this.scale.height/2, 
        this.scale.width, 
        this.scale.height, 
        0x000000, 0.5
      ).setDepth(25).setScrollFactor(0);
      
      this.add.text(
        this.scale.width/2, 
        this.scale.height/2 - 50, 
        'ПАУЗА', 
        { fontSize: '48px', color: '#fff', fontStyle: 'bold' }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);
      
      this.add.text(
        this.scale.width/2, 
        this.scale.height/2 + 20, 
        'Нажми на кнопку паузы, чтобы продолжить', 
        { fontSize: '24px', color: '#ccc', align: 'center' }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);
      
    } else {
      this.physics.resume();
      this.scene.resume();
      
      if (this.pauseOverlay) {
        this.pauseOverlay.destroy();
        this.pauseOverlay = null;
      }
      
      this.children.list
        .filter(child => child.type === 'Text' && (child.text === 'ПАУЗА' || child.text.includes('Нажми')))
        .forEach(child => child.destroy());
    }
  }

  // ========== ПРОГРЕССИЯ ==========
  updateLevel() {
    const newLevel = Math.floor(this.meters / 300);
    if (newLevel > this.level) {
      this.level = newLevel;
      this.baseSpeed = 250 + this.level * 20;
      this.gapSize = Math.max(160, 220 - this.level * 8);
      this.spawnDelay = Math.max(900, 1300 - this.level * 50);
      if (!this.bonusActive) this.currentSpeed = this.baseSpeed;

      this.spawnUpgradeItem();

      this.levelText.setText(`УРОВЕНЬ ${this.level + 1}`);
      this.levelText.setVisible(true);
      this.levelText.setAlpha(1);
      this.tweens.add({
        targets: this.levelText,
        alpha: 0,
        duration: 2000,
        ease: 'Power2',
      });

      this.addRandomPlanet();
    }
  }

  addRandomPlanet() {
    const w = this.scale.width;
    const h = this.scale.height;
    const idx = Phaser.Math.Between(1, 7);
    const planet = this.add.image(w + 200, Phaser.Math.Between(50, h - 50), `planet_${idx}`);
    planet.setScale(Phaser.Math.FloatBetween(1.5, 3.0));
    planet.setAlpha(0.6);
    planet.setDepth(-15);
    this.planets.push({
      sprite: planet,
      speed: Phaser.Math.Between(5, 18),
    });
  }

  // ========== ТОПЛИВО ==========
  spawnFuelCan() {
    if (this.dead) return;
    if (Math.random() > 0.8) return;

    const w = this.scale.width;
    const h = this.scale.height;
    const x = w + 50;
    const y = Phaser.Math.Between(50, h - 50);

    let type = 'blue';
    let fuelAmount = 50;
    if (this.level >= 2 && Math.random() < 0.3) {
      type = 'red';
      fuelAmount = 100;
    }

    const can = this.physics.add.image(x, y, `fuel_can_${type}`)
      .setImmovable(true)
      .setVelocityX(-this.currentSpeed * 0.7)
      .setScale(0.8);
    can.body.setAllowGravity(false);
    can.setData('fuel', fuelAmount);

    this.fuelCans.push(can);
    this.physics.add.overlap(this.player, can, (player, can) => {
      this.fuel = Math.min(this.maxFuel, this.fuel + can.getData('fuel'));
      can.destroy();
    }, null, this);
  }

  // ========== УЛУЧШЕНИЯ ==========
  spawnUpgradeItem() {
    const w = this.scale.width;
    const h = this.scale.height;
    const x = w + 50;
    const y = Phaser.Math.Between(50, h - 50);

    const upgrade = this.physics.add.image(x, y, 'upgrade_item')
      .setImmovable(true)
      .setVelocityX(-this.currentSpeed * 0.4)
      .setVelocityY(Phaser.Math.Between(-5, 5))
      .setScale(1.2)
      .setAngularVelocity(30);
    upgrade.body.setAllowGravity(false);

    this.tweens.add({
      targets: upgrade,
      alpha: 0.7,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const upgradesList = ['engine', 'wings', 'armor', 'weapon', 'shield'];
    let nextUpgrade = null;
    for (let u of upgradesList) {
      if (!this.shipUpgrades.includes(u)) {
        nextUpgrade = u;
        break;
      }
    }
    if (!nextUpgrade) nextUpgrade = 'shield';

    upgrade.setData('type', nextUpgrade);

    this.upgradeItems.push(upgrade);
    this.physics.add.overlap(this.player, upgrade, (player, item) => {
      const type = item.getData('type');
      this.applyUpgrade(type);
      item.destroy();
    }, null, this);
  }

  applyUpgrade(type) {
    if (this.shipUpgrades.includes(type)) return;
    this.shipUpgrades.push(type);

    const upgrade = this.add.image(this.player.x, this.player.y, `upgrade_${type}`);
    upgrade.setScale(0.9);
    upgrade.setDepth(5);
    upgrade.setBlendMode(Phaser.BlendModes.ADD);
    this.playerUpgrades.push(upgrade);
  }

  // ========== БОНУСЫ ==========
  activateBonus(type) {
    if (this.bonusActive) this.deactivateBonus();

    this.bonusActive = true;
    this.bonusType = type;
    this.bonusTime = 5;

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

  // ========== СПАВН КОЛОНН ==========
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

    if (this.level >= 2 && Math.random() < 0.3) {
      this.tweens.add({
        targets: [topPipe, bottomPipe],
        y: `+=${Phaser.Math.Between(-40, 40)}`,
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

  spawnCoin(x, y) {
    if (Math.random() > 0.5) return;

    let coinType = 'gold';
    let texture = 'coin_gold';

    const r = Math.random();
    if (this.level >= 1 && r < 0.2) {
      coinType = 'red';
      texture = 'coin_red';
    } else if (this.level >= 2 && r < 0.35) {
      coinType = 'blue';
      texture = 'coin_blue';
    } else if (this.level >= 3 && r < 0.45) {
      coinType = 'green';
      texture = 'coin_green';
    } else if (this.level >= 4 && r < 0.55) {
      coinType = 'purple';
      texture = 'coin_purple';
    }

    const coin = this.physics.add.image(x + Phaser.Math.Between(-20, 20), y, texture)
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
    this.physics.add.overlap(this.player, coin, (player, coin) => this.collectCoin(coin), null, this);
  }

  // ========== ОБРАБОТКА СОБЫТИЙ ==========
  hitPipe(player, pipe) {
    if (this.shieldActive) {
      const emitter = this.add.particles(pipe.x, pipe.y, 'spark', {
        speed: 150,
        scale: { start: 0.4, end: 0 },
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
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light'); } catch {}
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

    if (bonusType) {
      if (this.itemSound) this.itemSound.play();
      this.activateBonus(bonusType);
    } else {
      if (this.coinSound) this.coinSound.play();
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
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(bonusType ? 'heavy' : 'soft');
    } catch {}

    coin.destroy();
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

    try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('error'); } catch {}
  }

  showGameOver() {
    const subtitle = this.gameOverBox.getByName('subtitle');
    subtitle.setText(
      `Счёт: ${this.score}\n` +
      `Рекорд: ${this.best}\n` +
      `💎 ${this.crystals}\n` +
      `📏 ${Math.floor(this.meters)} м`
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

  // ========== ОЧИСТКА ==========
  cleanupObjects() {
    this.pipes = this.pipes.filter(p => {
      if (p.x < -150) { p.destroy(); return false; }
      return true;
    });
    this.coins = this.coins.filter(c => {
      if (!c.active || c.x < -100) { c.destroy(); return false; }
      return true;
    });
    this.scoreZones = this.scoreZones.filter(z => {
      if (z.x < -60) { z.destroy(); return false; }
      return true;
    });
    this.fuelCans = this.fuelCans.filter(c => {
      if (c.x < -100 || c.x > this.scale.width + 100) {
        c.destroy();
        return false;
      }
      return true;
    });
    this.upgradeItems = this.upgradeItems.filter(u => {
      if (u.x < -100 || u.x > this.scale.width + 100) {
        u.destroy();
        return false;
      }
      return true;
    });
  }

  // ========== АНИМАЦИИ ФОНА ==========
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
      if (p.sprite.x < -200) {
        p.sprite.x = w + Phaser.Math.Between(300, 800);
        p.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  updateBackgroundObjects() {
    const w = this.scale.width;
    const factor = this.started && !this.dead ? 0.3 : 0.1;
    for (let obj of this.backgroundObjects) {
      obj.sprite.x -= obj.speed * factor * (1 / 60);
      if (obj.sprite.x < -200) {
        obj.sprite.x = w + Phaser.Math.Between(300, 1000);
        obj.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  // ========== АДАПТАЦИЯ ==========
  onResize() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.scoreText.setPosition(w / 2, 56);
    this.crystalText.setPosition(w - 20, 24);
    this.meterText.setPosition(20, h - 80);
    this.bonusText.setPosition(w - 20, 70);
    this.levelText.setPosition(w / 2, h / 2 - 100);
    
    if (this.pauseButton) {
      this.pauseButton.setPosition(w - 40, 40);
    }
    
    this.fuelBar.clear();
    this.fuelBar.fillStyle(0x3498db);
    this.fuelBar.fillRect(20, h - 50, 150, 15);

    if (!this.started) {
      this.introText.setPosition(w / 2, h * 0.40);
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
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1300 },
      debug: false,
    },
  },
  scene: [BootScene, PlayScene],
};

new Phaser.Game(config);
