import Phaser from 'phaser';

// =========================================================================
// BootScene – создание всех текстур и загрузка звуков
// =========================================================================
class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    // Звуки (файлы должны лежать в public/sounds/)
    this.load.audio('coin_sound', 'sounds/coin.mp3');
    this.load.audio('item_sound', 'sounds/item.mp3');
    this.load.audio('tap_sound', 'sounds/tap.mp3');
    this.load.audio('bg_music', 'sounds/fifth_element_theme.mp3');
    this.load.audio('upgrade_sound', 'sounds/upgrade.mp3');
    this.load.audio('planet_sound', 'sounds/planet.mp3');
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
    const colors = [0xffaa00, 0x44aa88, 0xaa44aa, 0x88aa44, 0xaa8844, 0x44aaff, 0xff66aa, 0x66ffaa, 0xaa66ff, 0xffaa66];
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

    // ========== ПЛАНЕТА (станция) ==========
    g.clear();
    g.fillStyle(0xaa44aa);
    g.fillCircle(64, 64, 48);
    g.fillStyle(0xcc66cc);
    g.fillCircle(50, 50, 10);
    g.fillCircle(80, 70, 15);
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(64, 64, 50);
    g.lineStyle(6, 0x88aaff, 0.8);
    g.strokeEllipse(64, 64, 120, 40);
    g.lineStyle(2, 0xffffff);
    g.strokeEllipse(64, 64, 110, 35);
    g.generateTexture('planet', 128, 128);

    // ========== ФОНОВЫЕ ОБЪЕКТЫ ==========
    // Астероид
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

    // Кристаллический астероид
    g.clear();
    g.fillStyle(0x88aaff);
    g.fillEllipse(35, 35, 60, 45);
    g.fillStyle(0xaaddff);
    g.fillEllipse(20, 20, 20, 15);
    g.fillStyle(0x66ccff);
    g.fillCircle(45, 45, 12);
    g.generateTexture('bg_asteroid_2', 90, 70);

    // Инопланетный корабль
    g.clear();
    g.fillStyle(0x88aaff);
    g.fillEllipse(40, 30, 70, 20);
    g.fillStyle(0xaaddff);
    g.fillEllipse(40, 20, 40, 12);
    g.fillStyle(0xffaa00);
    g.fillCircle(20, 30, 5);
    g.fillCircle(60, 30, 5);
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
    g.generateTexture('bg_ship_2', 120, 60);

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

    // ========== КНОПКИ И ИНТЕРФЕЙС ==========
    // Кнопка паузы
    g.clear();
    g.fillStyle(0x2c3e50, 0.8);
    g.fillRoundedRect(0, 0, 60, 60, 10);
    g.fillStyle(0xffffff);
    g.fillRect(15, 15, 10, 30);
    g.fillRect(35, 15, 10, 30);
    g.generateTexture('pause_button', 60, 60);

    // Сердечко
    g.clear();
    g.fillStyle(0xff5555);
    g.fillCircle(16, 12, 6);
    g.fillCircle(26, 12, 6);
    g.fillStyle(0xff0000);
    g.fillTriangle(10, 15, 32, 15, 21, 30);
    g.generateTexture('heart', 42, 32);

    // Иконка монетки
    g.clear();
    g.fillStyle(0xffaa00);
    g.fillCircle(16, 16, 14);
    g.fillStyle(0xffdd44);
    g.fillCircle(16, 16, 10);
    g.generateTexture('coin_icon', 32, 32);

    // Иконка вагона
    g.clear();
    g.fillStyle(0x44aaff);
    g.fillRoundedRect(4, 8, 24, 16, 4);
    g.fillStyle(0x000000);
    g.fillCircle(10, 22, 3);
    g.fillCircle(22, 22, 3);
    g.generateTexture('wagon_icon', 32, 32);

    // Кнопка магазина
    g.clear();
    g.fillStyle(0x3399ff);
    g.fillRoundedRect(0, 0, 50, 50, 10);
    g.fillStyle(0xffffff);
    g.fillRect(20, 15, 10, 20);
    g.fillRect(15, 20, 20, 10);
    g.generateTexture('shop_button', 50, 50);

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

    // ========== ОСНОВНЫЕ ПЕРЕМЕННЫЕ ==========
    this.score = 0;
    this.crystals = 0;
    this.meters = 0;
    this.best = Number(localStorage.getItem('skypulse_best') || 0);
    this.level = 0;
    this.started = false;
    this.dead = false;
    this.isPaused = false;

    // ========== ЗДОРОВЬЕ ==========
    this.headHP = 3;
    this.maxHeadHP = 3;
    this.wagonBaseHP = 1;

    // ========== ВАГОНЫ ==========
    this.wagons = [];
    this.wagonGap = 30;
    this.wagonSpring = 0.1;
    this.maxWagons = 10;

    // ========== ПАРАМЕТРЫ СЛОЖНОСТИ ==========
    this.baseSpeed = 250;
    this.currentSpeed = this.baseSpeed;
    this.gapSize = 220;
    this.spawnDelay = 1300;
    this.gravity = 1300;
    this.jumpPower = 300;

    // ========== ТЕКСТУРЫ ВОРОТ ==========
    this.gateTextures = ['gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'];

    // ========== ПРОГРЕССИЯ ==========
    this.coinsForWagon = 10;
    this.collectedCoins = 0;
    this.shipUpgrades = [];
    this.upgradeLevels = {
      jumpPower: 0,
      gravity: 0,
      shieldDuration: 0,
      magnetRange: 0,
      wagonHP: 0,
      maxWagons: 0,
      wagonGap: 0,
      headHP: 0,
      revival: 0
    };
    this.upgradeCosts = {
      jumpPower: 10,
      gravity: 15,
      shieldDuration: 20,
      magnetRange: 20,
      wagonHP: 25,
      maxWagons: 30,
      wagonGap: 30,
      headHP: 40,
      revival: 50
    };

    // ========== БОНУСЫ ==========
    this.bonusActive = false;
    this.bonusType = null;
    this.bonusTime = 0;
    this.bonusMultiplier = 1;
    this.bonusTimer = null;
    this.shieldActive = false;
    this.magnetRange = 200;

    // ========== ПЛАНЕТА ==========
    this.planet = null;
    this.planetTriggered = false;

    // ========== ТАЙМЕРЫ ==========
    this.mainTimers = [];

    // ========== ГРУППЫ ОБЪЕКТОВ ==========
    this.pipes = [];
    this.coins = [];
    this.scoreZones = [];
    this.stars = [];
    this.planets = [];
    this.backgroundObjects = [];
    this.upgradeItems = [];

    // ========== ИНТЕРФЕЙС ==========
    this.playerUpgrades = [];
    this.shopVisible = false;
    this.shopElements = [];
    this.pauseOverlay = null;
    this.pauseTexts = [];
    this.choiceMenu = null;

    // ========== ЗАГРУЗКА ПРОГРЕССА ==========
    this.loadProgress();

    // ========== СОЗДАНИЕ МИРА ==========
    this.createBackground();
    this.createPlanets();
    this.createBackgroundObjects();
    this.createPlayer();
    this.createUI();

    // ========== УПРАВЛЕНИЕ ==========
    this.input.on('pointerdown', () => {
      if (this.dead) {
        this.scene.restart();
        return;
      }
      if (!this.started) {
        // Если игра ещё не началась, показываем меню выбора (продолжить/новая игра)
        if (!this.choiceMenu) {
          this.showChoiceMenu();
        }
      } else {
        this.flap();
      }
    });

    this.physics.world.setBounds(0, 0, w, h);
    this.events.on('resize', this.onResize, this);
    this.scale.on('resize', this.onResize, this);

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

    const body = this.player.body;
    this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75));

    if (!this.shieldActive && (this.player.y < -20 || this.player.y > this.scale.height + 20)) {
      this.handleDeath();
    }

    if (this.bonusActive && this.bonusType === 'magnet') {
      [...this.coins, ...this.upgradeItems].forEach(item => {
        if (item && item.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) < this.magnetRange) {
          const angle = Phaser.Math.Angle.Between(item.x, item.y, this.player.x, this.player.y);
          item.x += Math.cos(angle) * 8;
          item.y += Math.sin(angle) * 8;
        }
      });
    }

    this.updateWagons();

    if (this.planet && !this.planetTriggered && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.planet.getBounds())) {
      this.triggerPlanet();
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
    this.upgradeSound = this.sound.add('upgrade_sound');
    this.planetSound = this.sound.add('planet_sound');

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

    // Здоровье (сердечки)
    this.healthIcons = [];
    for (let i = 0; i < this.maxHeadHP; i++) {
      let heart = this.add.image(20 + i * 30, h - 40, 'heart')
        .setScale(0.5)
        .setDepth(10)
        .setScrollFactor(0);
      this.healthIcons.push(heart);
    }
    this.updateHealthDisplay();

    // Количество вагонов
    this.wagonCountText = this.add.text(w - 150, h - 40, `🚃 ${this.wagons.length}`, {
      fontSize: '22px',
      color: '#88ccff',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setDepth(10).setScrollFactor(0);

    // Кнопка паузы
    this.pauseButton = this.add.image(w - 40, h - 40, 'pause_button')
      .setInteractive()
      .setDepth(20)
      .setScrollFactor(0);
    this.pauseButton.on('pointerdown', () => this.togglePause());

    // Кнопка магазина (скрыта по умолчанию)
    this.shopButton = this.add.image(w - 120, h - 40, 'shop_button')
      .setInteractive()
      .setDepth(20)
      .setScrollFactor(0)
      .setVisible(false);
    this.shopButton.on('pointerdown', () => this.showShop());

    this.introText = this.add.text(w / 2, h * 0.35, 'СОБИРАЙ МОНЕТЫ, ЧТОБЫ УДЛИНЯТЬ ТАКСИ', {
      fontSize: '20px',
      color: '#fff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#7c3aed',
      strokeThickness: 3,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

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
      fontSize: '20px', color: '#cbd5e1', align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);
    this.gameOverBox = this.add.container(w / 2, h / 2, [panel, title, subtitle, tip]);
    this.gameOverBox.setVisible(false);
  }

  // ========== МЕНЮ ВЫБОРА ПРИ СТАРТЕ ==========
  showChoiceMenu() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Затемняющий фон
    const overlay = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.7)
      .setDepth(50)
      .setScrollFactor(0)
      .setInteractive(); // чтобы не пропускать клики дальше

    // Заголовок
    const title = this.add.text(w/2, h/2 - 100, 'ДОБРО ПОЖАЛОВАТЬ!', {
      fontSize: '36px',
      color: '#ffaa00',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 6,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);

    // Кнопка "Продолжить" (если есть сохранение)
    let continueBtn;
    if (localStorage.getItem('skypulse_save')) {
      continueBtn = this.add.text(w/2, h/2 - 20, 'ПРОДОЛЖИТЬ', {
        fontSize: '28px',
        color: '#22d3ee',
        backgroundColor: '#0f172a',
        padding: { x: 20, y: 10 },
        shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
      })
        .setOrigin(0.5)
        .setDepth(51)
        .setScrollFactor(0)
        .setInteractive();
      continueBtn.on('pointerdown', () => {
        // Загружаем сохранение и запускаем игру
        this.loadProgress();
        this.startRun();
        overlay.destroy();
        title.destroy();
        continueBtn.destroy();
        newGameBtn.destroy();
      });
    }

    // Кнопка "Новая игра"
    const newGameBtn = this.add.text(w/2, h/2 + 60, 'НОВАЯ ИГРА', {
      fontSize: '28px',
      color: '#ffaa00',
      backgroundColor: '#0f172a',
      padding: { x: 20, y: 10 },
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    })
      .setOrigin(0.5)
      .setDepth(51)
      .setScrollFactor(0)
      .setInteractive();
    newGameBtn.on('pointerdown', () => {
      // Сбрасываем прогресс и начинаем новую игру
      this.newGame();
      overlay.destroy();
      title.destroy();
      if (continueBtn) continueBtn.destroy();
      newGameBtn.destroy();
      this.startRun();
    });

    this.choiceMenu = [overlay, title, newGameBtn];
    if (continueBtn) this.choiceMenu.push(continueBtn);
  }

  // =======================================================================
  // ИГРОВАЯ ЛОГИКА
  // =======================================================================

  startRun() {
    this.started = true;
    this.introText.setVisible(false);
    if (this.bgMusic) this.bgMusic.play();

    this.spawnGate();

    // Циклический таймер спавна ворот (заменяет рекурсивный)
    this.gateTimer = this.time.addEvent({
      delay: this.spawnDelay,
      callback: this.spawnGate,
      callbackScope: this,
      loop: true,
    });
    this.mainTimers.push(this.gateTimer);
  }

  flap() {
    this.player.body.setVelocityY(-this.jumpPower);
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

  // ========== ПАУЗА И МАГАЗИН ==========
  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      this.pauseOverlay = this.add.rectangle(
        this.scale.width/2,
        this.scale.height/2,
        this.scale.width,
        this.scale.height,
        0x000000, 0.5
      ).setDepth(25).setScrollFactor(0);

      const pauseText = this.add.text(
        this.scale.width/2,
        this.scale.height/2 - 50,
        'ПАУЗА',
        { fontSize: '48px', color: '#fff', fontStyle: 'bold' }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);

      const tipText = this.add.text(
        this.scale.width/2,
        this.scale.height/2 + 20,
        'Нажми на кнопку паузы, чтобы продолжить',
        { fontSize: '18px', color: '#ccc', align: 'center' }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);

      this.pauseTexts = [pauseText, tipText];
      this.shopButton.setVisible(true);

      // Добавляем кнопку "Новая игра" в меню паузы
      const newGameBtn = this.add.text(this.scale.width/2, this.scale.height/2 + 80, 'НОВАЯ ИГРА', {
        fontSize: '24px',
        color: '#ffaa00',
        backgroundColor: '#0f172a',
        padding: { x: 15, y: 5 },
        shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
      }).setOrigin(0.5).setDepth(26).setScrollFactor(0).setInteractive();
      newGameBtn.on('pointerdown', () => {
        this.newGame();
        this.togglePause(); // снимаем паузу
      });
      this.pauseTexts.push(newGameBtn);

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
      this.shopButton.setVisible(false);
      this.hideShop();
    }
  }

  // Новая игра: сброс прогресса и перезапуск сцены
  newGame() {
    localStorage.removeItem('skypulse_save');
    this.scene.restart();
  }

  showShop() {
    if (this.shopVisible) return;
    this.shopVisible = true;

    const w = this.scale.width;
    const h = this.scale.height;

    // Полупрозрачный фон магазина
    const shopOverlay = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.6)
      .setDepth(40)
      .setScrollFactor(0);
    this.shopElements.push(shopOverlay);

    const panel = this.add.rectangle(w/2, h/2, 500, 500, 0x1a2b3c, 0.9)
      .setStrokeStyle(3, 0x22d3ee, 0.8)
      .setDepth(41)
      .setScrollFactor(0);
    this.shopElements.push(panel);

    const title = this.add.text(w/2, h/2 - 200, 'МАГАЗИН УЛУЧШЕНИЙ', {
      fontSize: '28px',
      color: '#ffaa00',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(42).setScrollFactor(0);
    this.shopElements.push(title);

    const upgradesList = [
      { key: 'jumpPower', name: 'Сила прыжка', current: this.jumpPower, next: this.jumpPower + 20 },
      { key: 'gravity', name: 'Гравитация', current: this.gravity, next: this.gravity - 50 },
      { key: 'shieldDuration', name: 'Длительность щита', current: 5 + this.upgradeLevels.shieldDuration * 2, next: 5 + (this.upgradeLevels.shieldDuration + 1) * 2 },
      { key: 'magnetRange', name: 'Радиус магнита', current: this.magnetRange, next: this.magnetRange + 30 },
      { key: 'wagonHP', name: 'Прочность вагонов', current: this.wagonBaseHP, next: this.wagonBaseHP + 1 },
      { key: 'maxWagons', name: 'Макс. вагонов', current: this.maxWagons, next: this.maxWagons + 2 },
      { key: 'wagonGap', name: 'Дистанция между вагонами', current: this.wagonGap, next: this.wagonGap - 2 },
      { key: 'headHP', name: 'Макс. здоровье', current: this.maxHeadHP, next: this.maxHeadHP + 1 },
      { key: 'revival', name: 'Воскрешение', current: this.upgradeLevels.revival, next: this.upgradeLevels.revival + 1 },
    ];

    let y = h/2 - 150;
    upgradesList.forEach(up => {
      const cost = this.upgradeCosts[up.key];
      const text = `${up.name}: ${up.current} → ${up.next}  |  цена: ${cost}`;
      const t = this.add.text(w/2 - 50, y, text, {
        fontSize: '16px',
        color: '#fff',
        backgroundColor: '#0f172a',
        padding: { x: 5, y: 3 },
      }).setDepth(42).setScrollFactor(0);
      this.shopElements.push(t);

      const btn = this.add.text(w/2 + 100, y, '[КУПИТЬ]', {
        fontSize: '16px',
        color: '#0f0',
        backgroundColor: '#1f2a3c',
        padding: { x: 5, y: 3 },
      }).setInteractive().setDepth(42).setScrollFactor(0);
      btn.on('pointerdown', () => this.buyUpgrade(up.key));
      this.shopElements.push(btn);
      y += 30;
    });

    const closeBtn = this.add.text(w/2, h/2 + 150, 'ЗАКРЫТЬ', {
      fontSize: '24px',
      color: '#f00',
      backgroundColor: '#0f172a',
      padding: { x: 20, y: 5 },
    }).setInteractive().setDepth(42).setScrollFactor(0);
    closeBtn.on('pointerdown', () => this.hideShop());
    this.shopElements.push(closeBtn);
  }

  hideShop() {
    if (!this.shopVisible) return;
    this.shopElements.forEach(el => el.destroy());
    this.shopElements = [];
    this.shopVisible = false;
  }

  buyUpgrade(key) {
    if (this.crystals < this.upgradeCosts[key]) return;
    this.crystals -= this.upgradeCosts[key];
    this.crystalText.setText(`💎 ${this.crystals}`);
    this.upgradeLevels[key]++;

    switch (key) {
      case 'jumpPower': this.jumpPower += 20; break;
      case 'gravity': this.gravity -= 50; this.physics.world.gravity.y = this.gravity; break;
      case 'magnetRange': this.magnetRange += 30; break;
      case 'wagonHP': this.wagonBaseHP++; break;
      case 'maxWagons': this.maxWagons += 2; break;
      case 'wagonGap': this.wagonGap -= 2; break;
      case 'headHP':
        this.maxHeadHP++;
        this.headHP = this.maxHeadHP; // при улучшении здоровье восстанавливается до максимума
        this.updateHealthDisplay();
        break;
      // shieldDuration и revival используются в соответствующих местах
    }

    this.saveProgress();
    if (this.upgradeSound) this.upgradeSound.play();
    this.hideShop();
    this.showShop(); // обновить список
  }

  updateHealthDisplay() {
    this.healthIcons.forEach(h => h.destroy());
    this.healthIcons = [];
    for (let i = 0; i < this.maxHeadHP; i++) {
      let heart = this.add.image(20 + i * 30, this.scale.height - 40, 'heart')
        .setScale(0.5)
        .setDepth(10)
        .setScrollFactor(0);
      if (i >= this.headHP) heart.setAlpha(0.3);
      this.healthIcons.push(heart);
    }
  }

  // ========== ВАГОНЫ ==========
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
    let last = this.wagons.length > 0 ? this.wagons[this.wagons.length-1] : this.player;
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
    wagon.setData('hp', this.wagonBaseHP);

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

    this.wagonCountText.setText(`🚃 ${this.wagons.length}`);
    this.updateCameraZoom();
  }

  wagonHit(wagon, pipe) {
    let hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      let index = this.wagons.indexOf(wagon);
      if (index !== -1) {
        wagon.destroy();
        this.wagons.splice(index, 1);
        this.cameras.main.shake(100, 0.005);
        this.wagonCountText.setText(`🚃 ${this.wagons.length}`);
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

  // ========== ПЛАНЕТА ==========
  spawnPlanet() {
    if (this.level % 10 === 0 && this.level > 0 && !this.planet) {
      const x = this.scale.width + 200;
      const y = Phaser.Math.Between(100, this.scale.height - 100);
      this.planet = this.physics.add.image(x, y, 'planet')
        .setImmovable(true)
        .setScale(1.2)
        .setVelocityX(-20)
        .setDepth(20);
      this.planet.body.setAllowGravity(false);
      this.planet.alpha = 0.8;
      this.tweens.add({
        targets: this.planet,
        alpha: 1,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }
  }

  triggerPlanet() {
    if (this.planetTriggered) return;
    this.planetTriggered = true;
    if (this.planetSound) this.planetSound.play();
    this.cameras.main.flash(500, 255, 255, 255, false);

    let reward = this.wagons.length * 10;
    reward += this.wagons.reduce((acc, w) => acc + w.getData('hp'), 0) * 5;
    this.crystals += reward;
    this.crystalText.setText(`💎 ${this.crystals}`);

    let emitter = this.add.particles(this.planet.x, this.planet.y, 'spark', {
      speed: 200,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      quantity: 30,
      blendMode: Phaser.BlendModes.ADD
    });
    emitter.explode(30);

    this.wagons.forEach(w => w.destroy());
    this.wagons = [];
    this.wagonCountText.setText(`🚃 0`);
    this.updateCameraZoom();

    this.planet.destroy();
    this.planet = null;
    this.planetTriggered = false;
    this.showShop();
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

      // Обновляем таймер спавна
      if (this.gateTimer) {
        this.gateTimer.delay = this.spawnDelay;
        this.gateTimer.reset(this.spawnDelay);
      }

      this.spawnPlanet();

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
      this.saveProgress();
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

  // ========== МОНЕТКИ ==========
  spawnCoin(x, y) {
    if (Math.random() > 0.7) return;
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

  collectCoin(coin) {
    if (!coin.active) return;
    let value = 1;
    let bonusType = null;
    switch (coin.coinType) {
      case 'red': value = 2; bonusType = 'speed'; break;
      case 'blue': value = 1; bonusType = 'shield'; break;
      case 'green': value = 1; bonusType = 'magnet'; break;
      case 'purple': value = 1; bonusType = 'slow'; break;
      default: value = 1;
    }
    if (this.bonusActive && this.bonusType === 'speed') value *= 2;

    this.crystals += value;
    this.crystalText.setText(`💎 ${this.crystals}`);
    this.collectedCoins += value;

    if (this.collectedCoins >= this.coinsForWagon && this.wagons.length < this.maxWagons) {
      this.addWagon();
      this.collectedCoins -= this.coinsForWagon;
    }

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

    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(bonusType ? 'heavy' : 'soft'); } catch {}
    coin.destroy();
  }

  // ========== БОНУСЫ ==========
  activateBonus(type) {
    if (this.bonusActive) this.deactivateBonus();
    this.bonusActive = true;
    this.bonusType = type;
    this.bonusTime = 5 + (this.upgradeLevels.shieldDuration * 2);

    switch (type) {
      case 'speed':
        this.currentSpeed = this.baseSpeed * 1.5;
        this.bonusMultiplier = 2;
        if (this.bonusText) this.bonusText.setColor('#ffaa00').setText(`🚀 x2 ${this.bonusTime}с`);
        break;
      case 'shield':
        this.shieldActive = true;
        this.player.body.checkCollision.none = true;
        this.player.setTint(0x88ccff);
        if (this.bonusText) this.bonusText.setColor('#88ccff').setText(`🛡️ ${this.bonusTime}с`);
        break;
      case 'magnet':
        if (this.bonusText) this.bonusText.setColor('#2ecc71').setText(`🧲 ${this.bonusTime}с`);
        break;
      case 'slow':
        this.currentSpeed = this.baseSpeed * 0.6;
        if (this.bonusText) this.bonusText.setColor('#9b59b6').setText(`⏳ ${this.bonusTime}с`);
        break;
    }
    if (this.bonusText) this.bonusText.setVisible(true);

    if (this.bonusTimer) this.bonusTimer.remove();
    this.bonusTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.bonusTime -= 1;
        if (this.bonusTime <= 0) {
          this.deactivateBonus();
        } else if (this.bonusText) {
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
    if (this.bonusText) this.bonusText.setVisible(false);
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
    }
    this.headHP--;
    this.updateHealthDisplay();
    this.cameras.main.shake(50, 0.005);
    this.player.setTint(0xff6666);
    this.time.delayedCall(100, () => this.player.clearTint());
    if (this.headHP <= 0) {
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

  // ========== СМЕРТЬ ==========
  handleDeath() {
    if (this.upgradeLevels.revival > 0 && !this.dead) {
      this.upgradeLevels.revival--;
      this.headHP = this.maxHeadHP; // воскрешение с полным здоровьем
      this.updateHealthDisplay();
      this.cameras.main.flash(300, 100, 255, 100, false);
      return;
    }
    if (this.dead) return;
    this.dead = true;
    this.trailEmitter.stop();
    if (this.bgMusic) this.bgMusic.stop();

    this.mainTimers.forEach(timer => timer && timer.remove());
    if (this.bonusTimer) this.bonusTimer.remove();
    if (this.gateTimer) this.gateTimer.remove();

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

    if (window.Telegram?.WebApp) {
      const data = JSON.stringify({
        score: this.score,
        level: this.level + 1,
        wagons: this.wagons.length,
        meters: Math.floor(this.meters)
      });
      window.Telegram.WebApp.sendData(data);
    }

    try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('error'); } catch {}
  }

  showGameOver() {
    const subtitle = this.gameOverBox.getByName('subtitle');
    subtitle.setText(
      `Счёт: ${this.score}\n` +
      `Рекорд: ${this.best}\n` +
      `💎 ${this.crystals}\n` +
      `📏 ${Math.floor(this.meters)} м\n` +
      `Вагонов: ${this.wagons.length}`
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

  // ========== СОХРАНЕНИЕ / ЗАГРУЗКА ==========
  saveProgress() {
    const progress = {
      level: this.level,
      meters: this.meters,
      crystals: this.crystals,
      collectedCoins: this.collectedCoins,
      wagonsCount: this.wagons.length,
      upgradeLevels: this.upgradeLevels,
      headHP: this.headHP,
      maxHeadHP: this.maxHeadHP,
      jumpPower: this.jumpPower,
      gravity: this.gravity,
      magnetRange: this.magnetRange,
      wagonBaseHP: this.wagonBaseHP,
      maxWagons: this.maxWagons,
      wagonGap: this.wagonGap
    };
    localStorage.setItem('skypulse_save', JSON.stringify(progress));
  }

  loadProgress() {
    const saved = localStorage.getItem('skypulse_save');
    if (saved) {
      const data = JSON.parse(saved);
      this.level = data.level;
      this.meters = data.meters;
      this.crystals = data.crystals;
      this.collectedCoins = data.collectedCoins;
      this.upgradeLevels = data.upgradeLevels;
      this.headHP = data.headHP;
      this.maxHeadHP = data.maxHeadHP;
      this.jumpPower = data.jumpPower;
      this.gravity = data.gravity;
      this.magnetRange = data.magnetRange;
      this.wagonBaseHP = data.wagonBaseHP;
      this.maxWagons = data.maxWagons;
      this.wagonGap = data.wagonGap;
      this.physics.world.gravity.y = this.gravity;
    }
  }

  // ========== ОЧИСТКА ОБЪЕКТОВ ==========
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
    if (this.bonusText) this.bonusText.setPosition(w - 20, 70);
    this.levelText.setPosition(w / 2, h / 2 - 100);

    if (this.pauseButton) this.pauseButton.setPosition(w - 40, h - 40);
    if (this.shopButton) this.shopButton.setPosition(w - 120, h - 40);
    if (this.wagonCountText) this.wagonCountText.setPosition(w - 150, h - 40);
    this.updateHealthDisplay();

    if (!this.started) {
      this.introText.setPosition(w / 2, h * 0.35);
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
