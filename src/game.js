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
    this.load.audio('upgrade_sound', 'sounds/upgrade.mp3'); // звук покупки
    this.load.audio('planet_sound', 'sounds/planet.mp3');   // звук прибытия на планету
  }

  create() {
    this.createTextures();
    this.scene.start('play');
  }

  createTextures() {
    const g = this.add.graphics();

    // ========== ИГРОК: ЛЕТАЮЩЕЕ ТАКСИ (улучшенное) ==========
    g.clear();
    // Корпус
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
    // Шашечки
    g.fillStyle(0x000000);
    g.fillRect(40, 30, 6, 4);
    g.fillRect(48, 30, 6, 4);
    g.fillRect(56, 30, 6, 4);
    // Номер
    g.fillStyle(0x333333);
    g.fillRect(10, 34, 20, 6);
    g.generateTexture('player', 80, 60);

    // ========== ВАГОНЧИКИ (10 разных цветов) ==========
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
    // Основа
    g.fillStyle(0xaa44aa);
    g.fillCircle(64, 64, 48);
    g.fillStyle(0xcc66cc);
    g.fillCircle(50, 50, 10);
    g.fillCircle(80, 70, 15);
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(64, 64, 50);
    // Кольцо
    g.lineStyle(6, 0x88aaff, 0.8);
    g.strokeEllipse(64, 64, 120, 40);
    g.lineStyle(2, 0xffffff);
    g.strokeEllipse(64, 64, 110, 35);
    g.generateTexture('planet', 128, 128);

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

    // ========== ИКОНКИ ДЛЯ ИНТЕРФЕЙСА ==========
    // Сердечко (здоровье)
    g.clear();
    g.fillStyle(0xff5555);
    g.fillCircle(16, 12, 6);
    g.fillCircle(26, 12, 6);
    g.fillStyle(0xff0000);
    g.fillTriangle(10, 15, 32, 15, 21, 30);
    g.generateTexture('heart', 42, 32);

    // Монетка (иконка)
    g.clear();
    g.fillStyle(0xffaa00);
    g.fillCircle(16, 16, 14);
    g.fillStyle(0xffdd44);
    g.fillCircle(16, 16, 10);
    g.generateTexture('coin_icon', 32, 32);

    // Вагончик (иконка)
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
    g.fillText('$', 18, 30, 20);
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
    this.score = 0;               // очки за пролёт ворот
    this.crystals = 0;            // монеты (валюта)
    this.meters = 0;              // пройденные метры
    this.best = Number(localStorage.getItem('skypulse_best') || 0);
    this.level = 0;                // текущий уровень (0 - первый)
    this.started = false;
    this.dead = false;
    this.isPaused = false;

    // ========== ЗДОРОВЬЕ ==========
    this.headHP = 3;               // текущее здоровье головы
    this.maxHeadHP = 3;            // максимальное здоровье головы
    this.wagonBaseHP = 1;          // базовое здоровье вагонов (может быть улучшено)

    // ========== ВАГОНЫ ==========
    this.wagons = [];
    this.wagonGap = 30;            // расстояние между вагонами
    this.wagonSpring = 0.1;        // упругость следования
    this.maxWagons = 10;           // максимум вагонов (может быть увеличено улучшениями)

    // ========== ПАРАМЕТРЫ СЛОЖНОСТИ ==========
    this.baseSpeed = 250;           // базовая скорость препятствий
    this.currentSpeed = this.baseSpeed;
    this.gapSize = 220;             // зазор между трубами
    this.spawnDelay = 1300;         // задержка спавна труб
    this.gravity = 1300;            // гравитация
    this.jumpPower = 300;           // сила прыжка

    // ========== ПРОГРЕССИЯ И УЛУЧШЕНИЯ ==========
    this.coinsForWagon = 10;        // монет для нового вагона
    this.collectedCoins = 0;        // счётчик монет для прогрессии вагонов
    this.shipUpgrades = [];          // массив купленных улучшений (для визуала)
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
    this.magnetRange = 200;          // базовый радиус магнита (улучшаемо)

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

    // ========== ИНТЕРФЕЙС ==========
    this.playerUpgrades = [];
    this.shopVisible = false;
    this.shopElements = [];

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
      if (!this.started) this.startRun();
      this.flap();
    });

    this.physics.world.setBounds(0, 0, w, h);
    this.events.on('resize', this.onResize, this);
    this.scale.on('resize', this.onResize, this);

    // Обновление позиций улучшений (визуальных деталей)
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

    // Смерть при выходе за границы (с буфером 20px)
    if (!this.shieldActive && (this.player.y < -20 || this.player.y > this.scale.height + 20)) {
      this.handleDeath();
    }

    // Магнит
    if (this.bonusActive && this.bonusType === 'magnet') {
      [...this.coins, ...this.upgradeItems].forEach(item => {
        if (item.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) < this.magnetRange) {
          const angle = Phaser.Math.Angle.Between(item.x, item.y, this.player.x, this.player.y);
          item.x += Math.cos(angle) * 8;
          item.y += Math.sin(angle) * 8;
        }
      });
    }

    // Движение вагонов
    this.updateWagons();

    // Проверка планеты (касание)
    if (this.planet && !this.planetTriggered && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.planet.getBounds())) {
      this.triggerPlanet();
    }

    this.cleanupObjects();
  }

  // =======================================================================
  // СОЗДАНИЕ МИРА (без топлива)
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
    // Фоновые планеты (декоративные)
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

    // Счёт (очки за ворота)
    this.scoreText = this.add.text(w / 2, 56, '0', {
      fontSize: '52px',
      color: '#fff',
      fontStyle: 'bold',
      stroke: '#22d3ee',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    // Лучший результат
    this.bestText = this.add.text(20, 24, `🏆 ${this.best}`, {
      fontSize: '22px',
      color: '#7dd3fc',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setDepth(10).setScrollFactor(0);

    // Монеты (кристаллы)
    this.crystalText = this.add.text(w - 20, 24, '💎 0', {
      fontSize: '22px',
      color: '#fde047',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);

    // Метры
    this.meterText = this.add.text(20, h - 80, '📏 0 м', {
      fontSize: '20px',
      color: '#a5f3fc',
      fontStyle: 'bold',
      stroke: '#0f172a',
      strokeThickness: 2,
    }).setDepth(10).setScrollFactor(0);

    // Здоровье головы (сердечки)
    this.healthIcons = [];
    for (let i = 0; i < this.maxHeadHP; i++) {
      let heart = this.add.image(20 + i * 30, h - 40, 'heart')
        .setScale(0.5)
        .setDepth(10)
        .setScrollFactor(0);
      this.healthIcons.push(heart);
    }

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

    // Кнопка магазина (будет видна в паузе)
    this.shopButton = this.add.image(w - 120, h - 40, 'shop_button')
      .setInteractive()
      .setDepth(20)
      .setScrollFactor(0)
      .setVisible(false);
    this.shopButton.on('pointerdown', () => this.showShop());

    // Текст-подсказка
    this.introText = this.add.text(w / 2, h * 0.35, 'СОБИРАЙ МОНЕТЫ, ЧТОБЫ УДЛИНЯТЬ ТАКСИ', {
      fontSize: '24px',
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
        { fontSize: '24px', color: '#ccc', align: 'center' }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);

      this.pauseTexts = [pauseText, tipText];

      // Показываем кнопку магазина
      if (this.shopButton) this.shopButton.setVisible(true);

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
      // Скрываем магазин, если он был открыт
      this.hideShop();
      if (this.shopButton) this.shopButton.setVisible(false);
    }
  }

  showShop() {
    if (this.shopVisible) return;
    this.shopVisible = true;

    const w = this.scale.width;
    const h = this.scale.height;
    const startY = h * 0.2;
    let y = startY;

    // Заголовок
    this.shopElements.push(
      this.add.text(w/2, y, 'МАГАЗИН УЛУЧШЕНИЙ', {
        fontSize: '28px', color: '#ffaa00', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(30).setScrollFactor(0)
    );
    y += 40;

    // Список улучшений
    for (let [key, level] of Object.entries(this.upgradeLevels)) {
      let cost = this.upgradeCosts[key];
      let currentVal = '';
      switch (key) {
        case 'jumpPower': currentVal = `${this.jumpPower} → ${this.jumpPower+20}`; break;
        case 'gravity': currentVal = `${this.gravity} → ${this.gravity-50}`; break;
        case 'shieldDuration': currentVal = `${5+level*2} сек`; break;
        case 'magnetRange': currentVal = `${this.magnetRange} → ${this.magnetRange+30}`; break;
        case 'wagonHP': currentVal = `${this.wagonBaseHP} → ${this.wagonBaseHP+1}`; break;
        case 'maxWagons': currentVal = `${this.maxWagons} → ${this.maxWagons+2}`; break;
        case 'wagonGap': currentVal = `${this.wagonGap} → ${this.wagonGap-2}`; break;
        case 'headHP': currentVal = `${this.maxHeadHP} → ${this.maxHeadHP+1}`; break;
        case 'revival': currentVal = '1 воскрешение'; break;
      }
      let text = `${key}: ур.${level} | ${currentVal} | цена: ${cost}`;
      let t = this.add.text(w/2 - 50, y, text, {
        fontSize: '18px', color: '#fff'
      }).setDepth(30).setScrollFactor(0);
      this.shopElements.push(t);

      // Кнопка "Купить"
      let btn = this.add.text(w/2 + 100, y, '[Купить]', {
        fontSize: '18px', color: '#0f0'
      }).setInteractive().setDepth(30).setScrollFactor(0);
      btn.on('pointerdown', () => this.buyUpgrade(key));
      this.shopElements.push(btn);
      y += 30;
    }

    // Кнопка закрыть
    let closeBtn = this.add.text(w/2, h-50, 'Закрыть', {
      fontSize: '24px', color: '#f00', backgroundColor: '#333', padding: {x:10,y:5}
    }).setInteractive().setDepth(30).setScrollFactor(0);
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
    if (this.crystals < this.upgradeCosts[key]) {
      // Недостаточно монет
      return;
    }
    // Списываем монеты
    this.crystals -= this.upgradeCosts[key];
    this.crystalText.setText(`💎 ${this.crystals}`);
    // Увеличиваем уровень
    this.upgradeLevels[key]++;

    // Применяем эффект
    switch (key) {
      case 'jumpPower':
        this.jumpPower += 20;
        break;
      case 'gravity':
        this.gravity -= 50;
        this.physics.world.gravity.y = this.gravity;
        break;
      case 'shieldDuration':
        // будет использоваться при активации щита
        break;
      case 'magnetRange':
        this.magnetRange += 30;
        break;
      case 'wagonHP':
        this.wagonBaseHP++;
        break;
      case 'maxWagons':
        this.maxWagons += 2;
        break;
      case 'wagonGap':
        this.wagonGap -= 2;
        break;
      case 'headHP':
        this.maxHeadHP++;
        this.headHP++; // увеличиваем и текущее?
        // обновить сердечки
        this.updateHealthDisplay();
        break;
      case 'revival':
        // просто флаг, используется при смерти
        break;
    }

    // Сохраняем прогресс
    this.saveProgress();

    // Звук покупки
    if (this.upgradeSound) this.upgradeSound.play();

    // Обновляем отображение магазина (можно пересоздать)
    this.hideShop();
    this.showShop();
  }

  updateHealthDisplay() {
    // Обновить количество сердечек
    this.healthIcons.forEach(h => h.destroy());
    this.healthIcons = [];
    for (let i = 0; i < this.maxHeadHP; i++) {
      let heart = this.add.image(20 + i * 30, this.scale.height - 40, 'heart')
        .setScale(0.5)
        .setDepth(10)
        .setScrollFactor(0);
      // если текущее здоровье меньше, делаем полупрозрачным
      if (i >= this.headHP) heart.setAlpha(0.3);
      this.healthIcons.push(heart);
    }
  }

  // ========== ДВИЖЕНИЕ ВАГОНОВ ==========
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

  // ========== ДОБАВЛЕНИЕ ВАГОНА ==========
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

    // Коллайдер с препятствиями
    this.physics.add.collider(wagon, this.pipes, this.wagonHit, null, this);

    this.wagons.push(wagon);

    // Эффект появления
    wagon.x = this.scale.width + 50;
    wagon.y = this.player.y;
    this.tweens.add({
      targets: wagon,
      x: spawnX,
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => { wagon.x = spawnX; }
    });

    this.updateCameraZoom();
    this.wagonCountText.setText(`🚃 ${this.wagons.length}`);
  }

  // ========== УДАЛЕНИЕ ВАГОНА ПРИ СТОЛКНОВЕНИИ ==========
  wagonHit(wagon, pipe) {
    let hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      // Вагон разрушен
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
      // визуальный эффект (мигание)
      this.tweens.add({
        targets: wagon,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 1
      });
    }
  }

  // ========== МАСШТАБИРОВАНИЕ КАМЕРЫ ==========
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
    // Планета появляется после каждых 10 уровней
    if (this.level % 10 === 0 && this.level > 0 && !this.planet) {
      const x = this.scale.width + 200;
      const y = Phaser.Math.Between(100, this.scale.height - 100);
      this.planet = this.physics.add.image(x, y, 'planet')
        .setImmovable(true)
        .setScale(1.2)
        .setVelocityX(-20) // очень медленно летит
        .setDepth(20);
      this.planet.body.setAllowGravity(false);
      this.planet.alpha = 0.8;
      // добавляем свечение
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
    // Эффект касания
    if (this.planetSound) this.planetSound.play();
    this.cameras.main.flash(500, 255, 255, 255, false);

    // Подсчёт награды: base 10 монет за вагон + бонус за здоровье
    let reward = this.wagons.length * 10;
    reward += this.wagons.reduce((acc, w) => acc + w.getData('hp'), 0) * 5;
    this.crystals += reward;
    this.crystalText.setText(`💎 ${this.crystals}`);

    // Анимация выгрузки
    let emitter = this.add.particles(this.planet.x, this.planet.y, 'spark', {
      speed: 200,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      quantity: 30,
      blendMode: Phaser.BlendModes.ADD
    });
    emitter.explode(30);

    // Удаляем вагоны
    this.wagons.forEach(w => w.destroy());
    this.wagons = [];
    this.wagonCountText.setText(`🚃 0`);
    this.updateCameraZoom();

    // Убираем планету
    this.planet.destroy();
    this.planet = null;
    this.planetTriggered = false;

    // Открываем магазин (можно автоматически)
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

      // При переходе на новый уровень спавним планету, если нужно
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

      // Сохраняем прогресс
      this.saveProgress();
    }
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

      // Применяем улучшения (восстанавливаем параметры)
      this.physics.world.gravity.y = this.gravity;
      // Восстанавливаем вагоны (только количество, HP будут по умолчанию)
      // Мы не восстанавливаем вагоны автоматически, они появятся по мере сбора монет
    }
  }

  newGame() {
    // Сброс прогресса
    localStorage.removeItem('skypulse_save');
    this.scene.restart();
  }

  // ========== ОБРАБОТКА СТОЛКНОВЕНИЙ ГОЛОВЫ ==========
  hitPipe(player, pipe) {
    if (this.shieldActive) {
      // Щит поглощает удар
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

    // Иначе теряем здоровье
    this.headHP--;
    this.updateHealthDisplay();

    // Визуальный эффект
    this.cameras.main.shake(50, 0.005);
    this.player.setTint(0xff6666);
    this.time.delayedCall(100, () => this.player.clearTint());

    if (this.headHP <= 0) {
      this.handleDeath();
    }
  }

  // ========== СМЕРТЬ ==========
  handleDeath() {
    // Если есть ревайв, потратить его и восстановить здоровье
    if (this.upgradeLevels.revival > 0 && !this.dead) {
      this.upgradeLevels.revival--;
      this.headHP = this.maxHeadHP;
      this.updateHealthDisplay();
      // Небольшая анимация воскрешения
      this.cameras.main.flash(300, 100, 255, 100, false);
      return;
    }

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

    // Отправляем результат в Telegram (для таблицы лидеров)
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

  // ========== ОЧИСТКА ОБЪЕКТОВ ==========
  cleanupObjects() {
    // ... (оставляем как было, но можно добавить очистку вагонов?)
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

    if (this.pauseButton) this.pauseButton.setPosition(w - 40, h - 40);
    if (this.shopButton) this.shopButton.setPosition(w - 120, h - 40);
    if (this.wagonCountText) this.wagonCountText.setPosition(w - 150, h - 40);
    this.updateHealthDisplay(); // пересоздаст сердечки с новой позицией

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
