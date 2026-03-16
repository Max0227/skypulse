import Phaser from 'phaser';

// =========================================================================
// КОНСТАНТЫ И КОНФИГУРАЦИЯ
// =========================================================================

const COLORS = {
  primary: '#00ffff',
  secondary: '#ff00ff',
  accent: '#ffaa00',
  success: '#00ff00',
  danger: '#ff0000',
  warning: '#ffaa00',
  
  bg_dark: '#0a0a1a',
  bg_darker: '#030712',
  
  text_primary: '#ffffff',
  text_secondary: '#cbd5e1',
  text_muted: '#64748b',
};

const GAME_CONFIG = {
  DIFFICULTY_CURVE: {
    0: { speed: 240, gap: 240, spawnDelay: 1300 },
    5: { speed: 300, gap: 220, spawnDelay: 1200 },
    10: { speed: 360, gap: 200, spawnDelay: 1100 },
    15: { speed: 420, gap: 180, spawnDelay: 1000 },
    20: { speed: 480, gap: 160, spawnDelay: 900 },
    30: { speed: 600, gap: 140, spawnDelay: 800 },
    50: { speed: 800, gap: 120, spawnDelay: 700 },
  },
  
  SHOP_UPGRADES: [
    { key: 'jumpPower', name: 'Сила прыжка', icon: '🚀', cost: 10, maxLevel: 10 },
    { key: 'gravity', name: 'Гравитация', icon: '⬇️', cost: 15, maxLevel: 10 },
    { key: 'shieldDuration', name: 'Длительность щита', icon: '🛡️', cost: 20, maxLevel: 10 },
    { key: 'magnetRange', name: 'Радиус магнита', icon: '🧲', cost: 20, maxLevel: 10 },
    { key: 'wagonHP', name: 'Прочность вагонов', icon: '💪', cost: 25, maxLevel: 10 },
    { key: 'maxWagons', name: 'Макс. вагонов', icon: '🚃', cost: 30, maxLevel: 10 },
    { key: 'wagonGap', name: 'Дистанция вагонов', icon: '📏', cost: 30, maxLevel: 10 },
    { key: 'headHP', name: 'Макс. здоровье', icon: '❤️', cost: 40, maxLevel: 10 },
    { key: 'revival', name: 'Воскрешение', icon: '🔄', cost: 50, maxLevel: 5 },
  ],
  
  ACHIEVEMENTS: {
    first_wagon: { id: 'first_wagon', name: 'Первый вагон', icon: '🚃', reward: 10 },
    five_wagons: { id: 'five_wagons', name: '5 вагонов', icon: '🚃🚃', reward: 25 },
    ten_wagons: { id: 'ten_wagons', name: '10 вагонов', icon: '🚃🚃🚃', reward: 50 },
    level_5: { id: 'level_5', name: 'Уровень 5', icon: '⭐', reward: 30 },
    level_10: { id: 'level_10', name: 'Уровень 10', icon: '⭐⭐', reward: 75 },
    score_100: { id: 'score_100', name: '100 очков', icon: '🏆', reward: 40 },
    score_500: { id: 'score_500', name: '500 очков', icon: '🏆🏆', reward: 100 },
    no_damage: { id: 'no_damage', name: 'Безопасный полёт', icon: '❤️', reward: 50 },
    all_bonuses: { id: 'all_bonuses', name: 'Все бонусы', icon: '✨', reward: 75 },
  },
};

// =========================================================================
// ГЛОБАЛЬНЫЙ МЕНЕДЖЕР ДАННЫХ
// =========================================================================

class GameManager {
  constructor() {
    this.data = this.loadData();
    this.bgMusic = null;
  }

  loadData() {
    try {
      const saved = localStorage.getItem('skypulse_data');
      const data = saved ? JSON.parse(saved) : this.getDefaultData();
      // Валидация
      if (!data.upgrades) data.upgrades = {};
      if (!data.achievements) data.achievements = {};
      if (!data.stats) data.stats = this.getDefaultData().stats;
      if (data.crystals === undefined) data.crystals = 0;
      if (!data.soundEnabled) data.soundEnabled = true;
      if (!data.musicEnabled) data.musicEnabled = true;
      return data;
    } catch (e) {
      console.error('Failed to load data:', e);
      return this.getDefaultData();
    }
  }

  getDefaultData() {
    return {
      crystals: 0,
      coins: 0,
      totalScore: 0,
      totalMeters: 0,
      totalGates: 0,
      level: 0,
      upgrades: {
        jumpPower: 0,
        gravity: 0,
        shieldDuration: 0,
        magnetRange: 0,
        wagonHP: 0,
        maxWagons: 0,
        wagonGap: 0,
        headHP: 0,
        revival: 0,
      },
      achievements: {},
      soundEnabled: true,
      musicEnabled: true,
      stats: {
        totalGames: 0,
        totalPlayTime: 0,
        maxScore: 0,
        maxLevel: 0,
        maxWagons: 0,
      }
    };
  }

  save() {
    localStorage.setItem('skypulse_data', JSON.stringify(this.data));
  }

  addCrystals(amount) {
    this.data.crystals += amount;
    this.save();
  }

  unlockAchievement(achievementId) {
    if (!this.data.achievements[achievementId]) {
      this.data.achievements[achievementId] = {
        id: achievementId,
        unlockedAt: Date.now(),
        claimed: false
      };
      this.save();
      return true;
    }
    return false;
  }
}

const gameManager = new GameManager();

// =========================================================================
// BOOT SCENE – создание всех текстур
// =========================================================================

class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    // Загружаем звуки (заглушки base64, чтобы не было ошибок 404)
    const silentBase64 = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==';
    this.load.audio('coin_sound', silentBase64);
    this.load.audio('item_sound', silentBase64);
    this.load.audio('tap_sound', silentBase64);
    this.load.audio('wagon_sound', silentBase64);
    this.load.audio('level_up_sound', silentBase64);
    this.load.audio('purchase_sound', silentBase64);
    this.load.audio('revive_sound', silentBase64);
  }

  create() {
    this.createTextures();
    this.scene.start('menu');
  }

  createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // ========== ИГРОК: НЕОНОВОЕ ТАКСИ ==========
    g.clear();
    g.fillStyle(0xffaa00);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0xff8800);
    g.fillRoundedRect(20, 8, 40, 10, 4);
    g.fillRect(56, 16, 8, 20);
    g.fillStyle(0x44aaff);
    g.fillRect(22, 16, 14, 8);
    g.fillRect(40, 16, 14, 8);
    g.fillStyle(0x00ffff);
    g.fillCircle(18, 28, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 28, 2);
    g.fillStyle(0xffff00);
    g.fillRect(40, 30, 6, 4);
    g.fillRect(48, 30, 6, 4);
    g.fillRect(56, 30, 6, 4);
    g.fillStyle(0x333333, 0.5);
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
      g.fillStyle(0x00ffff);
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

    // ========== ВОРОТА ==========
    const createGate = (color, light, name) => {
      g.clear();
      g.fillStyle(color);
      g.fillRoundedRect(0, 0, 100, 400, 20);
      g.fillStyle(light);
      g.fillRoundedRect(10, 0, 15, 400, 8);
      g.lineStyle(3, 0x00ffff, 0.8);
      g.strokeRoundedRect(0, 0, 100, 400, 20);
      g.generateTexture(name, 100, 400);
    };
    
    createGate(0x0a0a2a, 0x00ffff, 'gate_blue');
    createGate(0x0a2a0a, 0x00ffaa, 'gate_green');
    createGate(0x2a2a0a, 0xffff00, 'gate_yellow');
    createGate(0x2a0a0a, 0xff00aa, 'gate_red');
    createGate(0x2a0a2a, 0xff00ff, 'gate_purple');

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
      g.lineStyle(2, 0xffffff, 0.3);
      g.strokeCircle(16, 16, 15);
      g.generateTexture(name, 32, 32);
    };
    
    createCoin(0xffaa00, 0xffdd44, 'coin_gold');
    createCoin(0xff4444, 0xffaa00, 'coin_red');
    createCoin(0x4444ff, 0xffffff, 'coin_blue');
    createCoin(0x44ff44, 0xffffff, 'coin_green');
    createCoin(0xff44ff, 0xffffff, 'coin_purple');

    // ========== ПЛАНЕТЫ ==========
    for (let i = 1; i <= 15; i++) {
      g.clear();
      let color, hasRing;
      if (i % 3 === 1) { color = 0x4a00e2; hasRing = true; }
      else if (i % 3 === 2) { color = 0xe62200; hasRing = false; }
      else { color = 0x00cc22; hasRing = true; }
      g.fillStyle(color);
      g.fillCircle(32, 32, 28);
      g.fillStyle(0x000000, 0.3);
      g.fillCircle(20, 20, 6);
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(30, 45, 5);
      if (hasRing) {
        g.lineStyle(4, 0x00ffff, 0.7);
        g.strokeEllipse(32, 32, 70, 20);
      }
      g.generateTexture(`planet_${i}`, 64, 64);
    }

    // ========== КОРАБЛИ ==========
    g.clear();
    g.fillStyle(0x2244aa);
    g.fillEllipse(40, 30, 70, 20);
    g.fillStyle(0x00aaff);
    g.fillEllipse(40, 20, 40, 12);
    g.fillStyle(0xffaa00);
    g.fillCircle(20, 30, 5);
    g.fillCircle(60, 30, 5);
    g.fillCircle(40, 30, 3);
    g.lineStyle(2, 0x00ffff, 0.5);
    g.strokeEllipse(40, 30, 70, 20);
    g.generateTexture('bg_ship_1', 90, 50);

    g.clear();
    g.fillStyle(0xaa2222);
    g.fillRoundedRect(20, 20, 70, 30, 8);
    g.fillStyle(0xff4444);
    g.fillTriangle(90, 25, 90, 45, 110, 35);
    g.fillStyle(0xffaa00);
    g.fillCircle(35, 35, 5);
    g.fillCircle(55, 35, 5);
    g.fillCircle(75, 35, 4);
    g.lineStyle(2, 0xff00aa, 0.5);
    g.strokeRoundedRect(20, 20, 70, 30, 8);
    g.generateTexture('bg_ship_2', 120, 60);

    // ========== АСТЕРОИДЫ ==========
    g.clear();
    g.fillStyle(0x4a2a0a);
    g.fillEllipse(40, 40, 70, 50);
    g.fillStyle(0x6b4e2e);
    g.fillEllipse(20, 20, 30, 20);
    g.fillStyle(0x8b5a2b);
    g.fillEllipse(50, 50, 25, 15);
    g.fillStyle(0xa0522d);
    g.fillCircle(30, 60, 15);
    g.lineStyle(2, 0xffaa00, 0.3);
    g.strokeEllipse(40, 40, 70, 50);
    g.generateTexture('bg_asteroid_1', 100, 80);

    g.clear();
    g.fillStyle(0x224466);
    g.fillEllipse(35, 35, 60, 45);
    g.fillStyle(0x3366aa);
    g.fillEllipse(20, 20, 20, 15);
    g.fillStyle(0x4488ff);
    g.fillCircle(45, 45, 12);
    g.lineStyle(2, 0x00ffff, 0.3);
    g.strokeEllipse(35, 35, 60, 45);
    g.generateTexture('bg_asteroid_2', 90, 70);

    // ========== ЧАСТИЦЫ ==========
    g.clear();
    g.fillStyle(0xffffff);
    g.fillCircle(2, 2, 2);
    g.generateTexture('star', 4, 4);
    
    g.clear();
    g.fillStyle(0x00ffff, 0.9);
    g.fillCircle(4, 4, 4);
    g.generateTexture('flare', 8, 8);
    
    g.clear();
    g.fillStyle(0xff00ff, 0.8);
    g.fillCircle(3, 3, 3);
    g.generateTexture('spark', 6, 6);

    // ========== КНОПКИ ==========
    // Кнопка паузы
    g.clear();
    g.fillStyle(0x1a1a3a, 0.9);
    g.fillRoundedRect(0, 0, 50, 50, 8);
    g.lineStyle(2, 0x00ffff);
    g.strokeRoundedRect(0, 0, 50, 50, 8);
    g.fillStyle(0xffffff);
    g.fillRect(15, 15, 8, 20);
    g.fillRect(27, 15, 8, 20);
    g.generateTexture('pause_button', 50, 50);

    // Кнопка магазина
    g.clear();
    g.fillStyle(0xffaa00, 0.9);
    g.fillRoundedRect(0, 0, 50, 50, 8);
    g.lineStyle(2, 0xffaa00);
    g.strokeRoundedRect(0, 0, 50, 50, 8);
    g.fillStyle(0xcc8800);
    g.fillRect(15, 8, 20, 5);
    g.fillStyle(0xffcc00);
    g.fillRoundedRect(10, 13, 30, 25, 5);
    g.fillStyle(0xffaa00);
    g.fillRect(15, 18, 8, 12);
    g.fillRect(27, 18, 8, 12);
    g.fillStyle(0xffffaa, 0.5);
    g.fillCircle(15, 15, 2);
    g.fillCircle(35, 25, 2);
    g.generateTexture('shop_button', 50, 50);

    // Кнопка меню
    g.clear();
    g.fillStyle(0xff00ff, 0.9);
    g.fillRoundedRect(0, 0, 50, 50, 8);
    g.lineStyle(2, 0xff00ff);
    g.strokeRoundedRect(0, 0, 50, 50, 8);
    g.fillStyle(0xffffff);
    g.fillRect(15, 15, 8, 8);
    g.fillRect(27, 15, 8, 8);
    g.fillRect(15, 27, 20, 8);
    g.generateTexture('menu_button', 50, 50);

    // Сердечко
    g.clear();
    g.fillStyle(0xff4444);
    g.fillTriangle(8, 6, 16, 18, 24, 6);
    g.fillStyle(0xff8888);
    g.fillTriangle(8, 6, 16, 2, 24, 6);
    g.lineStyle(1, 0xff00ff, 0.5);
    g.strokeTriangle(8, 6, 16, 18, 24, 6);
    g.generateTexture('heart', 32, 24);

    // Станция
    g.clear();
    g.fillStyle(0x220066);
    g.fillCircle(48, 48, 40);
    g.fillStyle(0x4400aa);
    g.fillCircle(48, 48, 30);
    g.fillStyle(0xffaa00);
    g.fillCircle(48, 48, 10);
    g.lineStyle(4, 0x00ffff, 0.8);
    g.strokeCircle(48, 48, 45);
    g.generateTexture('station_planet', 96, 96);

    g.destroy();
  }
}

// =========================================================================
// MENU SCENE – главное меню
// =========================================================================

class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Фон с градиентом
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('menu_bg', w, h);
    gradient.destroy();

    this.add.image(0, 0, 'menu_bg').setOrigin(0);

    // Звёзды
    for (let i = 0; i < 100; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
      star.setDepth(-10);
    }

    // Заголовок
    const title = this.add.text(w / 2, h * 0.15, 'SKYPULSE', {
      fontSize: '60px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: COLORS.primary,
        blur: 20,
        fill: true
      }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Статистика
    const stats = gameManager.data.stats;
    const statsText = this.add.text(w / 2, h * 0.28, 
      `🏆 ${stats.maxScore} | ⭐ Уровень ${stats.maxLevel} | 🚃 ${stats.maxWagons}`,
      {
        fontSize: '14px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary,
        align: 'center'
      }
    ).setOrigin(0.5);

    // Кнопка "Играть"
    this.createButton(w / 2, h * 0.45, 'ИГРАТЬ', () => {
      this.scene.start('play');
    }, 'large');

    // Кнопка "Магазин"
    this.createButton(w / 2, h * 0.58, 'МАГАЗИН', () => {
      this.scene.start('shop');
    });

    // Кнопка "Достижения"
    this.createButton(w / 2, h * 0.68, 'ДОСТИЖЕНИЯ', () => {
      this.scene.start('achievements');
    });

    // Кнопка "Статистика"
    this.createButton(w / 2, h * 0.78, 'СТАТИСТИКА', () => {
      this.scene.start('stats');
    });

    // Кнопка "Настройки"
    this.createButton(w / 2, h * 0.88, 'НАСТРОЙКИ', () => {
      this.scene.start('settings');
    });

    // Версия
    this.add.text(w / 2, h - 20, 'v2.0.0', {
      fontSize: '10px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_muted
    }).setOrigin(0.5);
  }

  createButton(x, y, text, callback, size = 'normal') {
    const fontSize = size === 'large' ? '24px' : '16px';
    const padding = size === 'large' ? { x: 40, y: 15 } : { x: 30, y: 10 };

    const btn = this.add.text(x, y, text, {
      fontSize,
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      backgroundColor: '#1a1a3a',
      padding,
      stroke: COLORS.primary,
      strokeThickness: 2,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: COLORS.primary,
        blur: 10,
        fill: true
      }
    })
    .setOrigin(0.5)
    .setInteractive()
    .on('pointerover', () => {
      btn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary });
      btn.setScale(1.05);
    })
    .on('pointerout', () => {
      btn.setStyle({ color: COLORS.primary, backgroundColor: '#1a1a3a' });
      btn.setScale(1);
    })
    .on('pointerdown', () => {
      this.tweens.add({
        targets: btn,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: callback
      });
    });

    return btn;
  }
}

// =========================================================================
// PLAY SCENE – основной игровой процесс
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
    this.crystals = gameManager.data.crystals;
    this.meters = 0;
    this.best = Number(localStorage.getItem('skypulse_best') || 0);

    // Вагоны
    this.wagons = [];
    this.collectedCoins = 0;
    this.coinsForWagon = 15;
    this.maxWagons = 12 + (gameManager.data.upgrades.maxWagons || 0) * 2;
    this.wagonGap = 28 - (gameManager.data.upgrades.wagonGap || 0) * 2;
    this.wagonSpring = 0.15;
    this.targetPlayerX = 110;
    this.playerXSpeed = 0.05;
    this.maxTargetX = 200;

    // Состояние
    this.started = false;
    this.dead = false;
    this.level = 0;
    this.isPaused = false;
    this.pauseOverlay = null;
    this.pauseTexts = [];

    // Здоровье
    this.maxHeadHP = 3 + (gameManager.data.upgrades.headHP || 0);
    this.headHP = this.maxHeadHP;

    // Сложность
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
    this.magnetRange = 220 + (gameManager.data.upgrades.magnetRange || 0) * 30;
    this.lastBonusTime = 0;

    // Улучшения
    this.upgradeLevels = { ...gameManager.data.upgrades };
    this.upgradeCosts = {
      jumpPower: 10, gravity: 15, shieldDuration: 20, magnetRange: 20,
      wagonHP: 25, maxWagons: 30, wagonGap: 30, headHP: 40, revival: 50
    };

    this.shopVisible = false;
    this.shopElements = [];

    // Группы объектов
    this.pipes = [];
    this.coins = [];
    this.scoreZones = [];
    this.stars = [];
    this.planets = [];
    this.ships = [];
    this.asteroids = [];

    // Таймеры
    this.spawnTimer = null;

    // Станция
    this.stationPlanet = null;
    this.stationActive = false;
    this.stationTimer = null;

    // Обратный отсчёт
    this.resumeCountdownTimer = null;
    this.countdownActive = false;
    this.countdownText = null;
    this.countdownOverlay = null;
    this.countdownPrepareText = null;

    // Дополнительные системы
    this.initAchievements();
    this.initDailyRewards();
    this.initLeaderboard();
    this.initStats();

    // Создание мира
    this.createBackground();
    this.createPlanets();
    this.createShips();
    this.createAsteroids();
    this.createPlayer();
    this.createUI();

    // Управление
    this.input.on('pointerdown', () => {
      if (this.dead) { 
        this.scene.start('menu'); 
        return; 
      }
      if (!this.started) this.startRun();
      this.flap();
    });

    this.physics.world.setBounds(0, 0, w, h);
    this.events.on('resize', this.onResize, this);
    this.scale.on('resize', this.onResize, this);
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

    if (this.bonusActive && this.bonusType === 'magnet') {
      const magnetCoins = this.coins.filter(item => item.active);
      for (let item of magnetCoins) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
        if (dist < this.magnetRange) {
          const angle = Phaser.Math.Angle.Between(item.x, item.y, this.player.x, this.player.y);
          item.x += Math.cos(angle) * 10;
          item.y += Math.sin(angle) * 10;
        }
      }
    }

    this.updateWagons();
    this.cleanupObjects();

    if (this.stationPlanet && this.stationPlanet.active && this.stationActive) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.stationPlanet.x, this.stationPlanet.y);
      if (dist < 100) this.touchStation();
    }

    this.checkAchievements();
  }

  // ========== МЕТОДЫ СОЗДАНИЯ МИРА ==========
  createBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.setDepth(-30);
    
    for (let i = 0; i < 200; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
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
    for (let i = 1; i <= 15; i++) {
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
      const ship = this.add.image(
        Phaser.Math.Between(w, w * 12),
        Phaser.Math.Between(50, h - 50),
        tex
      );
      ship.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      ship.setTint(0x00ffff);
      ship.setAlpha(0.7);
      ship.setDepth(-10);
      ship.setBlendMode(Phaser.BlendModes.ADD);
      this.ships.push({
        sprite: ship,
        speed: Phaser.Math.Between(3, 10)
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
      asteroid.setTint(0xff8800);
      asteroid.setAlpha(0.7);
      asteroid.setDepth(-12);
      asteroid.setBlendMode(Phaser.BlendModes.ADD);
      this.asteroids.push({
        sprite: asteroid,
        speed: Phaser.Math.Between(4, 14)
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
    this.player.body.setDrag(500, 0);
    
    this.player.setDepth(15);
    this.player.setVisible(true);

    // Неоновый след
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
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 10, fill: true }
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

    this.meterText = this.add.text(10, h - 50, `📏 0 м`, {
      fontSize: '12px',
      fontFamily,
      color: '#a5f3fc',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.bonusText = this.add.text(w - 10, 40, '', {
      fontSize: '12px',
      fontFamily,
      stroke: '#0f172a',
      strokeThickness: 2,
      align: 'right'
    }).setOrigin(1, 0).setDepth(10).setVisible(false).setScrollFactor(0);

    this.levelText = this.add.text(w / 2, h / 2 - 70, '', {
      fontSize: '28px',
      fontFamily,
      color: '#ffffff',
      stroke: '#7c3aed',
      strokeThickness: 6,
      shadow: { blur: 15, color: '#ff00ff', fill: true }
    }).setOrigin(0.5).setDepth(15).setVisible(false).setScrollFactor(0);

    this.wagonCountText = this.add.text(w - 100, h - 30, `🚃 0/${this.maxWagons}`, {
      fontSize: '12px',
      fontFamily,
      color: '#88ccff',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    // Прогресс-бар монет
    this.progressBarBg = this.add.rectangle(w / 2, h - 30, 150, 6, 0x333333).setDepth(9).setScrollFactor(0);
    this.progressBar = this.add.rectangle(w / 2 - 75, h - 30, 0, 4, 0xffaa00).setOrigin(0, 0.5).setDepth(10).setScrollFactor(0);
    this.progressBarText = this.add.text(w / 2, h - 30, `${this.collectedCoins}/${this.coinsForWagon}`, {
      fontSize: '8px',
      fontFamily,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(11).setScrollFactor(0);

    // Сердечки
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

    this.coinTipsText = this.add.text(w / 2, h * 0.50, '🟡 Золото | 🔴 Скорость | 🔵 Щит | 🟢 Магнит | 🟣 Замедление', {
      fontSize: '8px',
      fontFamily,
      color: '#cbd5e1',
      align: 'center'
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    // Кнопки
    this.pauseButton = this.add.image(w - 35, h - 35, 'pause_button')
      .setInteractive()
      .setDepth(20)
      .setScrollFactor(0)
      .on('pointerdown', () => this.togglePause())
      .on('pointerover', () => this.pauseButton.setScale(1.1))
      .on('pointerout', () => this.pauseButton.setScale(1));

    this.shopButton = this.add.image(w - 90, h - 35, 'shop_button')
      .setInteractive()
      .setDepth(20)
      .setScrollFactor(0)
      .setVisible(true)
      .on('pointerdown', () => this.openShop())
      .on('pointerover', () => this.shopButton.setScale(1.1))
      .on('pointerout', () => this.shopButton.setScale(1));

    // Кнопка меню
    this.menuButton = this.add.image(w - 145, h - 35, 'menu_button')
      .setInteractive()
      .setDepth(20)
      .setScrollFactor(0)
      .on('pointerdown', () => this.confirmExit())
      .on('pointerover', () => this.menuButton.setScale(1.1))
      .on('pointerout', () => this.menuButton.setScale(1));

    this.createGameOverBox();

    this.updateProgressBar();
  }

  updateHearts() {
    this.heartContainer.removeAll(true);
    for (let i = 0; i < this.maxHeadHP; i++) {
      const heart = this.add.image(i * 16, 0, 'heart').setScale(0.5);
      if (i >= this.headHP) {
        heart.setTint(0x666666).setAlpha(0.5);
      } else {
        heart.setTint(0xff88ff);
      }
      this.heartContainer.add(heart);
    }
  }

  updateProgressBar() {
    const percent = Math.min(this.collectedCoins / this.coinsForWagon, 1);
    this.progressBar.width = 150 * percent;
    this.progressBarText.setText(`${this.collectedCoins}/${this.coinsForWagon}`);
  }

  createGameOverBox() {
    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";
    
    const panel = this.add.rectangle(0, 0, 300, 250, 0x0a0a1a, 0.95)
      .setStrokeStyle(3, 0x00ffff, 0.9)
      .setScrollFactor(0);
    
    const title = this.add.text(0, -100, 'ИГРА ОКОНЧЕНА', {
      fontSize: '20px',
      fontFamily,
      color: '#ffffff',
      stroke: '#ff00ff',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0);
    
    const subtitle = this.add.text(0, -20, '', {
      fontSize: '12px',
      fontFamily,
      color: '#7dd3fc',
      align: 'center',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0);
    this.gameOverSubtitle = subtitle;
    
    const tip = this.add.text(0, 80, 'Нажми, чтобы продолжить', {
      fontSize: '12px',
      fontFamily,
      color: '#cbd5e1',
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);
    
    this.gameOverBox = this.add.container(w / 2, h / 2, [panel, title, subtitle, tip]);
    this.gameOverBox.setVisible(false);
  }

  // ========== ИГРОВАЯ ЛОГИКА ==========
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
    this.spawnTimer = this.time.delayedCall(this.spawnDelay, () => {
      if (!this.dead && this.started && !this.isPaused) {
        this.spawnGate();
        this.scheduleNextSpawn();
      }
    });
  }

  flap() {
    const jumpBase = 300 + this.upgradeLevels.jumpPower * 20;
    this.player.body.setVelocityY(-jumpBase);
    this.player.setScale(0.95);
    this.tweens.add({
      targets: this.player,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 150,
      ease: 'Quad.out'
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
    } catch (e) { console.warn('Sound error:', e); }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      if (this.spawnTimer) this.spawnTimer.paused = true;
      if (this.bonusTimer) this.bonusTimer.paused = true;
      if (this.stationTimer) this.stationTimer.paused = true;
      
      this.pauseOverlay = this.add.rectangle(
        this.scale.width / 2, this.scale.height / 2,
        this.scale.width, this.scale.height,
        0x000000, 0.7
      ).setDepth(25).setScrollFactor(0);

      const pauseText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 40,
        '⏸️ ПАУЗА',
        {
          fontSize: '40px',
          fontFamily: "'Orbitron', monospace",
          color: '#ffffff',
          stroke: '#00ffff',
          strokeThickness: 4
        }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);

      const tipText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 + 30,
        'Нажми на кнопку паузы, чтобы продолжить',
        {
          fontSize: '12px',
          fontFamily: "'Orbitron', monospace",
          color: '#cccccc'
        }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);

      this.pauseTexts = [pauseText, tipText];
    } else {
      this.physics.resume();
      if (this.spawnTimer) this.spawnTimer.paused = false;
      if (this.bonusTimer) this.bonusTimer.paused = false;
      if (this.stationTimer) this.stationTimer.paused = false;
      
      if (this.pauseOverlay) {
        this.pauseOverlay.destroy();
        this.pauseOverlay = null;
      }
      if (this.pauseTexts) {
        this.pauseTexts.forEach(t => t.destroy());
        this.pauseTexts = [];
      }
      this.hideShop();
    }
  }

  openShop() {
    if (this.dead) return;
    if (this.countdownActive) this.cancelResumeCountdown();
    if (!this.isPaused) this.togglePause();
    this.showShop();
  }

  confirmExit() {
    if (this.dead) return;
    this.isPaused = true;
    this.physics.pause();
    const w = this.scale.width, h = this.scale.height;
    const overlay = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.7).setDepth(50).setScrollFactor(0);
    const panel = this.add.rectangle(w/2, h/2, 250, 150, 0x0a0a1a, 0.95).setStrokeStyle(2, 0x00ffff).setDepth(51).setScrollFactor(0);
    const text = this.add.text(w/2, h/2 - 30, 'Выйти в меню?', { fontSize: '16px', fontFamily: "'Orbitron', monospace", color: '#ffffff' }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    const yesBtn = this.add.text(w/2 - 60, h/2 + 20, 'ДА', { fontSize: '14px', fontFamily: "'Orbitron', monospace", color: '#00ff00', backgroundColor: '#1a1a3a', padding: { x: 10, y: 5 } }).setInteractive().setDepth(52).setScrollFactor(0).on('pointerdown', () => {
      overlay.destroy(); panel.destroy(); text.destroy(); yesBtn.destroy(); noBtn.destroy();
      this.scene.start('menu');
    }).on('pointerover', function() { this.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }); }).on('pointerout', function() { this.setStyle({ color: '#00ff00', backgroundColor: '#1a1a3a' }); });
    const noBtn = this.add.text(w/2 + 60, h/2 + 20, 'НЕТ', { fontSize: '14px', fontFamily: "'Orbitron', monospace", color: '#ff0000', backgroundColor: '#1a1a3a', padding: { x: 10, y: 5 } }).setInteractive().setDepth(52).setScrollFactor(0).on('pointerdown', () => {
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
      
      this.levelText.setText(`УРОВЕНЬ ${this.level + 1}`);
      this.levelText.setVisible(true).setAlpha(1);
      this.playSound(this.levelUpSound);
      this.createLevelUpEffect();
      this.tweens.add({
        targets: this.levelText,
        alpha: 0,
        duration: 2000,
        ease: 'Power2'
      });

      this.addRandomPlanet();
      this.checkStationSpawn();
    }
  }

  checkStationSpawn() {
    if (this.stationActive || this.dead) return;
    if (this.level > 0 && this.level % 10 === 0 && !this.stationPlanet) {
      this.spawnStation();
    }
  }

  spawnStation() {
    const w = this.scale.width;
    const h = this.scale.height;
    const x = w + 200;
    const y = Phaser.Math.Between(100, h - 100);
    this.stationPlanet = this.physics.add.image(x, y, 'station_planet')
      .setImmovable(true)
      .setScale(1.5)
      .setDepth(-5)
      .setVelocityX(-this.currentSpeed * 0.3);
    this.stationPlanet.body.setAllowGravity(false);
    this.stationActive = true;

    const label = this.add.text(x, y - 80, '🚉 СТАНЦИЯ', {
      fontSize: '16px',
      fontFamily: "'Orbitron', monospace",
      color: '#00ffff',
      stroke: '#ff00ff',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(-4);
    this.stationPlanet.label = label;

    this.tweens.add({
      targets: this.stationPlanet,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  touchStation() {
    if (!this.stationActive || !this.stationPlanet) return;
    this.stationActive = false;

    const bonus = this.wagons.length * 10;
    this.crystals += bonus;
    this.crystalText.setText(`💎 ${this.crystals}`);
    gameManager.data.crystals = this.crystals;
    gameManager.save();

    const emitter = this.add.particles(this.stationPlanet.x, this.stationPlanet.y, 'flare', {
      speed: 200,
      scale: { start: 1.5, end: 0 },
      lifespan: 800,
      quantity: 40,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0x00ffff, 0xff00ff, 0xffff00]
    });
    emitter.explode(40);

    this.wagons.forEach(w => w.destroy());
    this.wagons = [];
    this.targetPlayerX = 110;
    this.wagonCountText.setText(`🚃 0/${this.maxWagons}`);
    this.updateCameraZoom();

    const msg = this.add.text(this.player.x, this.player.y - 50, `+${bonus} 💎`, {
      fontSize: '28px',
      fontFamily: "'Orbitron', monospace",
      color: '#ffaa00',
      stroke: '#ff00ff',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: msg,
      y: msg.y - 100,
      alpha: 0,
      duration: 1500,
      onComplete: () => msg.destroy()
    });

    if (this.stationPlanet.label) this.stationPlanet.label.destroy();
    this.stationPlanet.destroy();
    this.stationPlanet = null;
  }

  addRandomPlanet() {
    const w = this.scale.width;
    const h = this.scale.height;
    const idx = Phaser.Math.Between(1, 15);
    const planet = this.add.image(w + 200, Phaser.Math.Between(50, h - 50), `planet_${idx}`);
    planet.setScale(Phaser.Math.FloatBetween(1.5, 3.0));
    planet.setTint(0x8888ff);
    planet.setAlpha(0.6);
    planet.setDepth(-15);
    planet.setBlendMode(Phaser.BlendModes.ADD);
    this.planets.push({
      sprite: planet,
      speed: Phaser.Math.Between(5, 18),
      flicker: Phaser.Math.FloatBetween(0.005, 0.01)
    });
  }

  updateWagons() {
    if (this.wagons.length === 0) return;
    let prev = this.player;
    for (let i = 0; i < this.wagons.length; i++) {
      let wagon = this.wagons[i];
      let targetX = prev.x - this.wagonGap;
      let targetY = prev.y;
      
      if (i >= 4) {
        targetY = prev.y + (i % 2 === 0 ? 20 : -20);
      }
      
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
    
    this.targetPlayerX += this.wagonGap * 0.5;
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
    wagon.setData('hp', 1 + this.upgradeLevels.wagonHP);
    wagon.setTint(0x88aaff);
    wagon.setBlendMode(Phaser.BlendModes.ADD);

    this.physics.add.collider(wagon, this.pipes, (wagon, pipe) => this.wagonHit(wagon, pipe), null, this);
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
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 300,
      quantity: 15,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0x00ffff, 0x88ccff]
    });
    emitter.explode(15);
  }

  wagonHit(wagon, pipe) {
    let hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      this.wagons = this.wagons.filter(w => w !== wagon);
      wagon.destroy();
      this.targetPlayerX -= this.wagonGap * 0.5;
      this.targetPlayerX = Math.max(110, this.targetPlayerX);
      this.cameras.main.shake(100, 0.005);
      this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
      this.updateCameraZoom();
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
    targetZoom = Math.max(0.7, targetZoom);
    this.tweens.add({
      targets: this.cameras.main,
      zoom: targetZoom,
      duration: 500,
      ease: 'Sine.easeInOut'
    });
  }

  spawnCoin(x, y) {
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
    coin.setBlendMode(Phaser.BlendModes.ADD);
    coin.collected = false;

    this.tweens.add({
      targets: coin,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.out'
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
    if (!coin.active || coin.collected) return;
    coin.collected = true;
    
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

    this.updateProgressBar();

    if (this.collectedCoins >= this.coinsForWagon && this.wagons.length < this.maxWagons) {
      this.addWagon();
      this.collectedCoins -= this.coinsForWagon;
      this.updateProgressBar();
    }

    if (bonusType) {
      this.playSound(this.itemSound);
      this.activateBonus(bonusType);
      this.createBonusEffect(bonusType, coin.x, coin.y);
    } else {
      this.playSound(this.coinSound);
    }

    const emitter = this.add.particles(coin.x, coin.y, 'flare', {
      speed: 120,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 300,
      quantity: 20,
      blendMode: Phaser.BlendModes.ADD,
      tint: coin.coinType === 'red' ? 0xff6666 : 0x00ffff
    });
    emitter.explode(20);

    this.tweens.add({
      targets: this.crystalText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 80,
      yoyo: true,
      ease: 'Quad.out'
    });

    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(
        bonusType ? 'heavy' : 'soft'
      );
    } catch {}
    
    coin.destroy();
    gameManager.data.crystals = this.crystals;
    gameManager.data.upgrades = { ...this.upgradeLevels };
    gameManager.save();
  }

  activateBonus(type) {
    const now = Date.now();
    if (now - this.lastBonusTime < 500) return;
    this.lastBonusTime = now;

    if (this.bonusActive) this.deactivateBonus();
    
    this.bonusActive = true;
    this.bonusType = type;
    this.bonusTime = 5 + this.upgradeLevels.shieldDuration * 2;

    switch (type) {
      case 'speed':
        this.currentSpeed = this.baseSpeed * 1.5;
        this.bonusMultiplier = 2;
        this.bonusText.setColor('#00ffff').setText(`🚀 x2 ${this.bonusTime}с`);
        break;
      case 'shield':
        this.shieldActive = true;
        this.player.body.checkCollision.none = true;
        this.player.setTint(0x00ffff);
        this.bonusText.setColor('#00ffff').setText(`🛡️ ${this.bonusTime}с`);
        break;
      case 'magnet':
        this.bonusText.setColor('#00ff00').setText(`🧲 ${this.bonusTime}с`);
        break;
      case 'slow':
        this.currentSpeed = this.baseSpeed * 0.6;
        this.bonusText.setColor('#ff00ff').setText(`⏳ ${this.bonusTime}с`);
        break;
    }
    
    this.bonusText.setVisible(true);
    this.updatePlayerVisuals();

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
      loop: true
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
    this.updatePlayerVisuals();
    if (this.bonusTimer) {
      this.bonusTimer.remove();
      this.bonusTimer = null;
    }
  }

  showShop() {
    if (this.shopVisible) return;
    this.shopVisible = true;

    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";

    const overlay = this.add.rectangle(w/2, h/2, w, h, 0x0a0a1a, 0.95)
      .setDepth(40)
      .setScrollFactor(0)
      .setInteractive();

    const panel = this.add.rectangle(w/2, h/2, w - 30, h - 60, 0x0d0d1a)
      .setStrokeStyle(3, 0x00ffff, 0.8)
      .setDepth(41)
      .setScrollFactor(0);

    const title = this.add.text(w/2, 30, 'МАГАЗИН УЛУЧШЕНИЙ', {
      fontSize: '22px',
      fontFamily,
      color: '#00ffff',
      stroke: '#ff00ff',
      strokeThickness: 2,
      shadow: { blur: 15, color: '#00ffff', fill: true }
    }).setOrigin(0.5).setDepth(42).setScrollFactor(0);

    const balance = this.add.text(w/2, 60, `💎 ${this.crystals}`, {
      fontSize: '18px',
      fontFamily,
      color: '#ffaa00',
      stroke: '#ff5500',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(42).setScrollFactor(0);

    this.shopElements = [overlay, panel, title, balance];
    this.shopUpgradeTexts = [];
    this.shopBuyButtons = [];

    const upgrades = [
      { key:'jumpPower', name:'Сила прыжка', current:300 + this.upgradeLevels.jumpPower*20, next:300 + (this.upgradeLevels.jumpPower+1)*20 },
      { key:'gravity', name:'Гравитация', current:1300 - this.upgradeLevels.gravity*50, next:1300 - (this.upgradeLevels.gravity+1)*50 },
      { key:'shieldDuration', name:'Длительность щита', current:5 + this.upgradeLevels.shieldDuration*2, next:5 + (this.upgradeLevels.shieldDuration+1)*2 },
      { key:'magnetRange', name:'Радиус магнита', current:220 + this.upgradeLevels.magnetRange*30, next:220 + (this.upgradeLevels.magnetRange+1)*30 },
      { key:'wagonHP', name:'Прочность вагонов', current:1 + this.upgradeLevels.wagonHP, next:1 + (this.upgradeLevels.wagonHP+1) },
      { key:'maxWagons', name:'Макс. вагонов', current:12 + this.upgradeLevels.maxWagons*2, next:12 + (this.upgradeLevels.maxWagons+1)*2 },
      { key:'wagonGap', name:'Дистанция между вагонами', current:28 - this.upgradeLevels.wagonGap*2, next:28 - (this.upgradeLevels.wagonGap+1)*2 },
      { key:'headHP', name:'Макс. здоровье', current:3 + this.upgradeLevels.headHP, next:3 + (this.upgradeLevels.headHP+1) },
      { key:'revival', name:'Воскрешение', current:this.upgradeLevels.revival, next:this.upgradeLevels.revival+1 },
    ];

    let y = 90;
    const col1X = 40;
    const col2X = w - 180;

    for (let up of upgrades) {
      const cost = this.upgradeCosts[up.key];
      const text = `${up.name}: ${up.current} → ${up.next}`;
      const priceText = `${cost} 💎`;

      const t = this.add.text(col1X, y, text, {
        fontSize: '11px',
        fontFamily,
        color: '#ffffff',
        stroke: '#00aaff',
        strokeThickness: 0.5
      }).setDepth(42).setScrollFactor(0);
      this.shopElements.push(t);
      this.shopUpgradeTexts.push({ key: up.key, textObj: t });

      const price = this.add.text(col2X, y, priceText, {
        fontSize: '11px',
        fontFamily,
        color: '#ffaa00',
        stroke: '#ff5500',
        strokeThickness: 0.5
      }).setDepth(42).setScrollFactor(0);
      this.shopElements.push(price);

      const btn = this.add.text(col2X + 50, y, '[КУПИТЬ]', {
        fontSize: '10px',
        fontFamily,
        color: '#00ff00',
        backgroundColor: '#1a1a3a',
        padding: { x: 3, y: 1 },
        shadow: { blur: 5, color: '#00ff00', fill: true }
      })
      .setInteractive()
      .setDepth(42)
      .setScrollFactor(0)
      .on('pointerover', () => btn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }))
      .on('pointerout', () => btn.setStyle({ color: '#00ff00', backgroundColor: '#1a1a3a' }))
      .on('pointerdown', () => this.buyUpgrade(up.key));
      this.shopElements.push(btn);
      this.shopBuyButtons.push({ key: up.key, btnObj: btn });

      y += 25;
    }

    const closeBtn = this.add.text(w/2, h - 30, 'ЗАКРЫТЬ', {
      fontSize: '16px',
      fontFamily,
      color: '#ff00ff',
      backgroundColor: '#1a1a2e',
      padding: { x: 12, y: 4 },
      shadow: { blur: 8, color: '#ff00ff', fill: true }
    })
    .setInteractive()
    .setDepth(42)
    .setScrollFactor(0)
    .on('pointerover', () => closeBtn.setStyle({ color: '#ffffff', backgroundColor: '#ff00ff' }))
    .on('pointerout', () => closeBtn.setStyle({ color: '#ff00ff', backgroundColor: '#1a1a2e' }))
    .on('pointerdown', () => this.startResumeCountdown());

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
      case 'gravity':
        this.physics.world.gravity.y = 1300 - this.upgradeLevels.gravity * 50;
        break;
      case 'magnetRange':
        this.magnetRange = 220 + this.upgradeLevels.magnetRange * 30;
        break;
      case 'maxWagons':
        this.maxWagons = 12 + this.upgradeLevels.maxWagons * 2;
        this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
        break;
      case 'wagonGap':
        this.wagonGap = 28 - this.upgradeLevels.wagonGap * 2;
        break;
      case 'headHP':
        this.maxHeadHP = 3 + this.upgradeLevels.headHP;
        this.headHP = this.maxHeadHP;
        this.updateHearts();
        break;
    }

    this.playSound(this.purchaseSound);
    if (this.shopVisible) this.updateShopTexts();
    gameManager.data.upgrades = { ...this.upgradeLevels };
    gameManager.data.crystals = this.crystals;
    gameManager.save();
  }

  updateShopTexts() {
    const upgrades = [
      { key:'jumpPower', name:'Сила прыжка', current:300 + this.upgradeLevels.jumpPower*20, next:300 + (this.upgradeLevels.jumpPower+1)*20 },
      { key:'gravity', name:'Гравитация', current:1300 - this.upgradeLevels.gravity*50, next:1300 - (this.upgradeLevels.gravity+1)*50 },
      { key:'shieldDuration', name:'Длительность щита', current:5 + this.upgradeLevels.shieldDuration*2, next:5 + (this.upgradeLevels.shieldDuration+1)*2 },
      { key:'magnetRange', name:'Радиус магнита', current:220 + this.upgradeLevels.magnetRange*30, next:220 + (this.upgradeLevels.magnetRange+1)*30 },
      { key:'wagonHP', name:'Прочность вагонов', current:1 + this.upgradeLevels.wagonHP, next:1 + (this.upgradeLevels.wagonHP+1) },
      { key:'maxWagons', name:'Макс. вагонов', current:12 + this.upgradeLevels.maxWagons*2, next:12 + (this.upgradeLevels.maxWagons+1)*2 },
      { key:'wagonGap', name:'Дистанция между вагонами', current:28 - this.upgradeLevels.wagonGap*2, next:28 - (this.upgradeLevels.wagonGap+1)*2 },
      { key:'headHP', name:'Макс. здоровье', current:3 + this.upgradeLevels.headHP, next:3 + (this.upgradeLevels.headHP+1) },
      { key:'revival', name:'Воскрешение', current:this.upgradeLevels.revival, next:this.upgradeLevels.revival+1 },
    ];
    for (let up of upgrades) {
      const text = `${up.name}: ${up.current} → ${up.next}`;
      const item = this.shopUpgradeTexts.find(i => i.key === up.key);
      if (item) item.textObj.setText(text);
    }
    const balanceText = this.shopElements.find(el => el.text && el.text.includes('💎') && el.depth === 42);
    if (balanceText) balanceText.setText(`💎 ${this.crystals}`);
  }

  // ========== ДОПОЛНИТЕЛЬНЫЕ СИСТЕМЫ ==========
  initAchievements() {
    this.achievements = {
      first_wagon: { unlocked: false, name: 'Первый вагон', reward: 10 },
      five_wagons: { unlocked: false, name: '5 вагонов', reward: 25 },
      ten_wagons: { unlocked: false, name: '10 вагонов', reward: 50 },
      level_5: { unlocked: false, name: 'Уровень 5', reward: 30 },
      level_10: { unlocked: false, name: 'Уровень 10', reward: 75 },
      score_100: { unlocked: false, name: '100 очков', reward: 40 },
      score_500: { unlocked: false, name: '500 очков', reward: 100 },
      no_damage: { unlocked: false, name: 'Безопасный полёт', reward: 50 },
      all_bonuses: { unlocked: false, name: 'Все бонусы', reward: 75 }
    };
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
    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";
    const achievement = this.achievements[key];
    const notification = this.add.container(w / 2, -80).setDepth(100).setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, 280, 60, 0x0a0a1a, 0.95).setStrokeStyle(2, 0x00ffff, 0.8);
    const title = this.add.text(0, -15, `🏆 ${achievement.name}`, { fontSize: '14px', fontFamily, color: '#ffaa00', stroke: '#ff5500', strokeThickness: 1 }).setOrigin(0.5);
    const rewardText = this.add.text(0, 10, `+${reward} 💎`, { fontSize: '12px', fontFamily, color: '#00ff00', stroke: '#00aa00', strokeThickness: 1 }).setOrigin(0.5);
    notification.add([bg, title, rewardText]);
    this.tweens.add({ targets: notification, y: 80, duration: 3000, ease: 'Sine.easeInOut', onComplete: () => notification.destroy() });
    this.playSound(this.levelUpSound);
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
    const w = this.scale.width, h = this.scale.height, fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";
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

  // ========== ОБРАТНЫЙ ОТСЧЁТ ==========
  startResumeCountdown() {
    if (this.countdownActive) return;
    this.hideShop();

    this.countdownActive = true;
    let count = 3;
    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";

    this.countdownOverlay = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.7).setDepth(50).setScrollFactor(0);
    this.countdownText = this.add.text(w/2, h/2 - 30, '3', {
      fontSize: '70px',
      fontFamily,
      color: '#00ffff',
      stroke: '#ff00ff',
      strokeThickness: 6,
      shadow: { blur: 20, color: '#00ffff', fill: true }
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);

    this.countdownPrepareText = this.add.text(w/2, h/2 + 40, 'ПРИГОТОВЬСЯ', {
      fontSize: '16px',
      fontFamily,
      color: '#ffffff',
      stroke: '#00aaff',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);

    this.resumeCountdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        count--;
        if (count > 0) {
          this.countdownText.setText(count.toString());
        } else {
          this.countdownText.setText('ПОЕХАЛИ!');
          this.time.delayedCall(500, () => {
            this.countdownOverlay.destroy();
            this.countdownText.destroy();
            this.countdownPrepareText.destroy();
            this.countdownActive = false;
            if (this.isPaused) this.togglePause();
          });
          this.resumeCountdownTimer.remove();
        }
      },
      repeat: 2
    });
  }

  cancelResumeCountdown() {
    if (this.resumeCountdownTimer) {
      this.resumeCountdownTimer.remove();
      this.resumeCountdownTimer = null;
    }
    if (this.countdownOverlay) {
      this.countdownOverlay.destroy();
      this.countdownOverlay = null;
    }
    if (this.countdownText) {
      this.countdownText.destroy();
      this.countdownText = null;
    }
    if (this.countdownPrepareText) {
      this.countdownPrepareText.destroy();
      this.countdownPrepareText = null;
    }
    this.countdownActive = false;
  }

  // ========== ВОРОТА И СТОЛКНОВЕНИЯ ==========
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
    topPipe.setBlendMode(Phaser.BlendModes.ADD);

    const bottomPipe = this.physics.add.image(x, bottomY, gateTexture)
      .setOrigin(0.5, 0)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, (h - bottomY) / 400))
      .setVelocityX(-this.currentSpeed);
    bottomPipe.body.setAllowGravity(false);
    bottomPipe.setBlendMode(Phaser.BlendModes.ADD);

    [topPipe, bottomPipe].forEach(pipe => {
      pipe.setScale(1, 0.01);
      this.tweens.add({
        targets: pipe,
        scaleY: pipe.scaleY,
        duration: 300,
        ease: 'Back.out'
      });
    });

    if (this.level >= 2 && Math.random() < 0.4) {
      const moveDistance = Phaser.Math.Between(-50, 50);
      const tween = this.tweens.add({
        targets: [topPipe, bottomPipe],
        y: `+=${moveDistance}`,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      topPipe.tween = tween;
      bottomPipe.tween = tween;
    }

    this.pipes.push(topPipe, bottomPipe);
    this.physics.add.collider(this.player, topPipe, (player, pipe) => this.hitPipe(player, pipe), null, this);
    this.physics.add.collider(this.player, bottomPipe, (player, pipe) => this.hitPipe(player, pipe), null, this);

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
        scale: { start: 0.6, end: 0 },
        lifespan: 300,
        quantity: 20,
        blendMode: Phaser.BlendModes.ADD,
        tint: [0x00ffff, 0xff00ff]
      });
      emitter.explode(20);
      return;
    } else {
      this.headHP--;
      this.updateHearts();
      this.cameras.main.shake(100, 0.003);
      this.playSound(this.tapSound);
      this.player.body.setVelocityX(0);
      if (this.headHP <= 0) {
        this.handleDeath();
      } else {
        this.player.setTint(0xff8888);
        this.time.delayedCall(500, () => this.player.clearTint());
      }
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
      ease: 'Quad.out'
    });
    
    this.cameras.main.shake(20, 0.001);
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
  }

  handleDeath() {
    if (this.upgradeLevels.revival > 0 && !this.dead) {
      this.upgradeLevels.revival--;
      this.headHP = this.maxHeadHP;
      this.updateHearts();
      this.cameras.main.flash(300, 100, 255, 100, false);
      this.playSound(this.reviveSound);
      const msg = this.add.text(this.player.x, this.player.y - 50, 'ВОСКРЕШЕНИЕ!', {
        fontSize: '20px',
        fontFamily: "'Orbitron', monospace",
        color: '#00ffff',
        stroke: '#ff00ff',
        strokeThickness: 3
      }).setOrigin(0.5);
      this.tweens.add({
        targets: msg,
        y: msg.y - 80,
        alpha: 0,
        duration: 1500,
        onComplete: () => msg.destroy()
      });
      gameManager.data.upgrades = { ...this.upgradeLevels };
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
    this.showGameOver();

    if (window.Telegram?.WebApp) {
      const data = JSON.stringify({
        score: this.score,
        level: this.level + 1,
        meters: Math.floor(this.meters)
      });
      window.Telegram.WebApp.sendData(data);
    }

    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('error');
    } catch {}
  }

  showGameOver() {
    this.gameOverSubtitle.setText(
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
      ease: 'Back.out'
    });
  }

  cleanupObjects() {
    this.pipes = this.pipes.filter(p => {
      if (p.x < -150) {
        if (p.tween) p.tween.stop();
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

    if (this.stationPlanet && this.stationPlanet.x < -200) {
      if (this.stationPlanet.label) this.stationPlanet.label.destroy();
      this.stationPlanet.destroy();
      this.stationPlanet = null;
      this.stationActive = false;
    }
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

  onResize() {
    this.updateUIOnResize();
  }

  // ========== ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ ==========
  updateUIOnResize() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    if (this.scoreText) this.scoreText.setPosition(w / 2, 30);
    if (this.bestText) this.bestText.setPosition(10, 10);
    if (this.crystalText) this.crystalText.setPosition(w - 10, 10);
    if (this.meterText) this.meterText.setPosition(10, h - 50);
    if (this.wagonCountText) this.wagonCountText.setPosition(w - 100, h - 30);
    if (this.bonusText) this.bonusText.setPosition(w - 10, 40);
    if (this.levelText) this.levelText.setPosition(w / 2, h / 2 - 70);
    
    if (this.pauseButton) this.pauseButton.setPosition(w - 35, h - 35);
    if (this.shopButton) this.shopButton.setPosition(w - 90, h - 35);
    if (this.menuButton) this.menuButton.setPosition(w - 145, h - 35);
    
    if (this.progressBarBg) {
      this.progressBarBg.setPosition(w / 2, h - 30);
      this.progressBar.setPosition(w / 2 - 75, h - 30);
      this.progressBarText.setPosition(w / 2, h - 30);
    }
    
    if (!this.started) {
      if (this.introText) this.introText.setPosition(w / 2, h * 0.40);
      if (this.coinTipsText) this.coinTipsText.setPosition(w / 2, h * 0.50);
    }
    
    if (this.heartContainer) {
      this.heartContainer.setPosition(10, 30);
    }
  }

  updateDifficulty() {
    const difficultyLevels = [
      { level: 0, speed: 240, gap: 240, spawnDelay: 1300 },
      { level: 5, speed: 300, gap: 220, spawnDelay: 1200 },
      { level: 10, speed: 360, gap: 200, spawnDelay: 1100 },
      { level: 15, speed: 420, gap: 180, spawnDelay: 1000 },
      { level: 20, speed: 480, gap: 160, spawnDelay: 900 },
      { level: 30, speed: 600, gap: 140, spawnDelay: 800 },
      { level: 50, speed: 800, gap: 120, spawnDelay: 700 }
    ];
    
    let currentDifficulty = difficultyLevels[0];
    for (let diff of difficultyLevels) {
      if (this.level >= diff.level) {
        currentDifficulty = diff;
      }
    }
    
    this.baseSpeed = currentDifficulty.speed;
    this.gapSize = currentDifficulty.gap;
    this.spawnDelay = currentDifficulty.spawnDelay;
    
    if (!this.bonusActive) {
      this.currentSpeed = this.baseSpeed;
    }
  }

  createLevelUpEffect() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const emitter = this.add.particles(w / 2, h / 2, 'flare', {
      speed: { min: -200, max: 200 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 600,
      quantity: 30,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00]
    });
    
    emitter.explode(30);
    
    this.cameras.main.shake(200, 0.01);
    this.cameras.main.flash(200, 255, 255, 100);
  }

  checkCoinAchievements() {
    if (this.collectedCoins >= 50 && !this.achievements.all_bonuses.unlocked) {
      this.unlockAchievement('all_bonuses');
    }
  }

  createBonusEffect(type, x, y) {
    const colors = {
      speed: 0x00ffff,
      shield: 0x00ff00,
      magnet: 0xff00ff,
      slow: 0xffaa00
    };
    
    const emitter = this.add.particles(x, y, 'spark', {
      speed: 150,
      scale: { start: 1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 400,
      quantity: 25,
      blendMode: Phaser.BlendModes.ADD,
      tint: colors[type] || 0xffffff
    });
    
    emitter.explode(25);
  }

  updatePlayerVisuals() {
    if (!this.player) return;
    
    if (this.shieldActive) {
      this.player.setTint(0x00ffff);
      this.player.setScale(0.95);
    } else if (this.bonusActive && this.bonusType === 'speed') {
      this.player.setTint(0xffff00);
      this.player.setScale(0.92);
    } else {
      this.player.clearTint();
      this.player.setScale(0.9);
    }
  }

  checkWagonCollisions() {
    for (let wagon of this.wagons) {
      if (!wagon.active) continue;
      
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        wagon.x, wagon.y
      );
      
      if (dist > this.wagonGap * 3) {
        const index = this.wagons.indexOf(wagon);
        if (index !== -1) {
          wagon.destroy();
          this.wagons.splice(index, 1);
          this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
        }
      }
    }
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
    
    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: duration,
      ease: 'Power2.easeOut',
      onComplete: () => notification.destroy()
    });
  }

  getGameInfo() {
    return {
      score: this.score,
      level: this.level + 1,
      meters: Math.floor(this.meters),
      wagons: this.wagons.length,
      maxWagons: this.maxWagons,
      crystals: this.crystals,
      health: this.headHP,
      maxHealth: this.maxHeadHP,
      bonusActive: this.bonusActive,
      bonusType: this.bonusType,
      bonusTime: this.bonusTime
    };
  }

  exportStats() {
    const stats = {
      game: this.getGameInfo(),
      records: gameManager.data.stats,
      upgrades: this.upgradeLevels,
      achievements: this.achievements,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(stats, null, 2);
  }
}

// =========================================================================
// GAME OVER SCENE
// =========================================================================

class GameOverScene extends Phaser.Scene {
  constructor() { super('gameover'); }
  init(data) { this.resultData = data; }
  create() {
    const w = this.scale.width, h = this.scale.height;
    const gradient = this.make.graphics({ x:0,y:0,add:false });
    gradient.fillGradientStyle(0x030712,0x030712,0x0a0a1a,0x0a0a1a,1);
    gradient.fillRect(0,0,w,h);
    gradient.generateTexture('gameover_bg',w,h);
    gradient.destroy();
    this.add.image(0,0,'gameover_bg').setOrigin(0);
    this.add.text(w/2, h*0.15, 'ИГРА ОКОНЧЕНА', { fontSize:'40px', fontFamily:"'Orbitron', sans-serif", color:COLORS.danger, stroke:COLORS.secondary, strokeThickness:3, align:'center' }).setOrigin(0.5);
    const stats = `\n🎯 Счёт: ${this.resultData.score}\n⭐ Уровень: ${this.resultData.level}\n🚃 Вагонов: ${this.resultData.wagons}\n💎 Кристаллов: ${this.resultData.crystals}\n`;
    this.add.text(w/2, h*0.40, stats, { fontSize:'18px', fontFamily:"'Space Mono', monospace", color:COLORS.text_primary, align:'center', lineSpacing:10 }).setOrigin(0.5);
    this.createButton(w/2, h*0.65, 'ГЛАВНОЕ МЕНЮ', () => this.scene.start('menu'));
  }
  createButton(x,y,t,c) {
    const btn = this.add.text(x,y,t, { fontSize:'18px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, backgroundColor:'#1a1a3a', padding:{x:30,y:10}, stroke:COLORS.primary, strokeThickness:2 }).setOrigin(0.5).setInteractive().on('pointerover',function(){this.setStyle({color:COLORS.text_primary, backgroundColor:COLORS.primary}); this.setScale(1.05);}).on('pointerout',function(){this.setStyle({color:COLORS.primary, backgroundColor:'#1a1a3a'}); this.setScale(1);}).on('pointerdown',c);
    return btn;
  }
}

// =========================================================================
// SHOP SCENE
// =========================================================================

class ShopScene extends Phaser.Scene {
  constructor() { super('shop'); }
  create() {
    const w = this.scale.width, h = this.scale.height;
    const gradient = this.make.graphics({ x:0,y:0,add:false });
    gradient.fillGradientStyle(0x030712,0x030712,0x0a0a1a,0x0a0a1a,1);
    gradient.fillRect(0,0,w,h);
    gradient.generateTexture('shop_bg',w,h);
    gradient.destroy();
    this.add.image(0,0,'shop_bg').setOrigin(0);
    this.add.text(w/2,30,'МАГАЗИН', { fontSize:'40px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, stroke:COLORS.secondary, strokeThickness:3 }).setOrigin(0.5);
    this.add.text(w/2,80,`💎 ${gameManager.data.crystals}`, { fontSize:'20px', fontFamily:"'Space Mono', monospace", color:COLORS.accent, stroke:'#0f172a', strokeThickness:2 }).setOrigin(0.5);
    let y = 130;
    for (let up of GAME_CONFIG.SHOP_UPGRADES) {
      const level = gameManager.data.upgrades[up.key] || 0;
      const cost = up.cost * (level + 1);
      const canAfford = gameManager.data.crystals >= cost && level < up.maxLevel;
      const bg = this.add.rectangle(w/2, y, w-20, 50, 0x1a1a3a).setStrokeStyle(2, canAfford ? COLORS.primary : COLORS.text_muted);
      this.add.text(20, y-15, `${up.icon} ${up.name}`, { fontSize:'14px', fontFamily:"'Orbitron', sans-serif", color:COLORS.text_primary }).setOrigin(0,0.5);
      this.add.text(20, y+10, `Уровень: ${level}/${up.maxLevel}`, { fontSize:'10px', fontFamily:"'Space Mono', monospace", color:COLORS.text_secondary }).setOrigin(0,0.5);
      this.add.text(w-20, y, `${cost} 💎`, { fontSize:'14px', fontFamily:"'Space Mono', monospace", color:canAfford?COLORS.accent:COLORS.text_muted }).setOrigin(1,0.5);
      if (canAfford) {
        bg.setInteractive().on('pointerover',()=>bg.setFillStyle(0x2a2a4a)).on('pointerout',()=>bg.setFillStyle(0x1a1a3a)).on('pointerdown',()=>{
          gameManager.data.crystals -= cost;
          gameManager.data.upgrades[up.key] = (gameManager.data.upgrades[up.key] || 0) + 1;
          gameManager.save();
          this.scene.restart();
        });
      }
      y += 60;
    }
    this.createButton(w/2, h-40, 'НАЗАД', ()=>this.scene.start('menu'));
  }
  createButton(x,y,t,c) {
    const btn = this.add.text(x,y,t, { fontSize:'16px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, backgroundColor:'#1a1a3a', padding:{x:20,y:8}, stroke:COLORS.primary, strokeThickness:2 }).setOrigin(0.5).setInteractive().on('pointerover',function(){this.setStyle({color:COLORS.text_primary, backgroundColor:COLORS.primary}); this.setScale(1.05);}).on('pointerout',function(){this.setStyle({color:COLORS.primary, backgroundColor:'#1a1a3a'}); this.setScale(1);}).on('pointerdown',c);
    return btn;
  }
}

// =========================================================================
// ACHIEVEMENTS SCENE
// =========================================================================

class AchievementsScene extends Phaser.Scene {
  constructor() { super('achievements'); }
  create() {
    const w = this.scale.width, h = this.scale.height;
    const gradient = this.make.graphics({ x:0,y:0,add:false });
    gradient.fillGradientStyle(0x030712,0x030712,0x0a0a1a,0x0a0a1a,1);
    gradient.fillRect(0,0,w,h);
    gradient.generateTexture('achievements_bg',w,h);
    gradient.destroy();
    this.add.image(0,0,'achievements_bg').setOrigin(0);
    this.add.text(w/2,30,'ДОСТИЖЕНИЯ', { fontSize:'40px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, stroke:COLORS.secondary, strokeThickness:3 }).setOrigin(0.5);
    let y = 100;
    for (let key in GAME_CONFIG.ACHIEVEMENTS) {
      const ach = GAME_CONFIG.ACHIEVEMENTS[key];
      const unlocked = gameManager.data.achievements[key] !== undefined;
      const color = unlocked ? COLORS.accent : COLORS.text_muted;
      const bg = this.add.rectangle(w/2, y, w-40, 40, 0x1a1a3a).setStrokeStyle(2, color);
      this.add.text(20, y-10, `${ach.icon} ${ach.name}`, { fontSize:'14px', fontFamily:"'Orbitron', sans-serif", color:color }).setOrigin(0,0.5);
      this.add.text(w-20, y-10, `+${ach.reward} 💎`, { fontSize:'12px', fontFamily:"'Space Mono', monospace", color:color }).setOrigin(1,0.5);
      y += 50;
    }
    this.createButton(w/2, h-40, 'НАЗАД', ()=>this.scene.start('menu'));
  }
  createButton(x,y,t,c) {
    const btn = this.add.text(x,y,t, { fontSize:'16px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, backgroundColor:'#1a1a3a', padding:{x:20,y:8}, stroke:COLORS.primary, strokeThickness:2 }).setOrigin(0.5).setInteractive().on('pointerover',function(){this.setStyle({color:COLORS.text_primary, backgroundColor:COLORS.primary}); this.setScale(1.05);}).on('pointerout',function(){this.setStyle({color:COLORS.primary, backgroundColor:'#1a1a3a'}); this.setScale(1);}).on('pointerdown',c);
    return btn;
  }
}

// =========================================================================
// STATS SCENE
// =========================================================================

class StatsScene extends Phaser.Scene {
  constructor() { super('stats'); }
  create() {
    const w = this.scale.width, h = this.scale.height;
    const gradient = this.make.graphics({ x:0,y:0,add:false });
    gradient.fillGradientStyle(0x030712,0x030712,0x0a0a1a,0x0a0a1a,1);
    gradient.fillRect(0,0,w,h);
    gradient.generateTexture('stats_bg',w,h);
    gradient.destroy();
    this.add.image(0,0,'stats_bg').setOrigin(0);
    this.add.text(w/2,30,'СТАТИСТИКА', { fontSize:'40px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, stroke:COLORS.secondary, strokeThickness:3 }).setOrigin(0.5);
    const stats = gameManager.data.stats;
    const text = `\nИгр сыграно: ${stats.totalGames}\nЛучший счёт: ${stats.maxScore}\nЛучший уровень: ${stats.maxLevel}\nМакс. вагонов: ${stats.maxWagons}\nВсего кристаллов: ${gameManager.data.crystals}\n`;
    this.add.text(w/2, h/2, text, { fontSize:'18px', fontFamily:"'Space Mono', monospace", color:COLORS.text_primary, align:'center', lineSpacing:10 }).setOrigin(0.5);
    this.createButton(w/2, h-40, 'НАЗАД', ()=>this.scene.start('menu'));
  }
  createButton(x,y,t,c) {
    const btn = this.add.text(x,y,t, { fontSize:'16px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, backgroundColor:'#1a1a3a', padding:{x:20,y:8}, stroke:COLORS.primary, strokeThickness:2 }).setOrigin(0.5).setInteractive().on('pointerover',function(){this.setStyle({color:COLORS.text_primary, backgroundColor:COLORS.primary}); this.setScale(1.05);}).on('pointerout',function(){this.setStyle({color:COLORS.primary, backgroundColor:'#1a1a3a'}); this.setScale(1);}).on('pointerdown',c);
    return btn;
  }
}

// =========================================================================
// SETTINGS SCENE
// =========================================================================

class SettingsScene extends Phaser.Scene {
  constructor() {
    super('settings');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('settings_bg', w, h);
    gradient.destroy();

    this.add.image(0, 0, 'settings_bg').setOrigin(0);

    // Заголовок
    this.add.text(w / 2, 40, 'НАСТРОЙКИ', {
      fontSize: '36px',
      fontFamily,
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    let y = 120;

    // Звук
    this.createToggle(
      w / 2, y, 'Звук',
      gameManager.data.soundEnabled,
      (value) => {
        gameManager.data.soundEnabled = value;
        gameManager.save();
      }
    );
    y += 70;

    // Музыка
    this.createToggle(
      w / 2, y, 'Музыка',
      gameManager.data.musicEnabled,
      (value) => {
        gameManager.data.musicEnabled = value;
        gameManager.save();
      }
    );
    y += 70;

    // Кнопка очистки данных
    this.createButton(w / 2, y, 'ОЧИСТИТЬ ДАННЫЕ', () => {
      this.confirmClearData();
    }, 'danger');
    y += 70;

    // Кнопка экспорта
    this.createButton(w / 2, y, 'ЭКСПОРТИРОВАТЬ', () => {
      this.exportData();
    });

    // Кнопка назад
    this.createButton(w / 2, h - 50, 'НАЗАД', () => {
      this.scene.start('menu');
    });
  }

  createToggle(x, y, label, initialValue, callback) {
    const bg = this.add.rectangle(x, y, 250, 50, 0x1a1a3a)
      .setStrokeStyle(2, COLORS.primary);

    const text = this.add.text(x - 100, y, label, {
      fontSize: '16px',
      fontFamily: "'Orbitron', monospace",
      color: COLORS.text_primary
    }).setOrigin(0, 0.5);

    const toggleBg = this.add.rectangle(x + 80, y, 60, 30, initialValue ? 0x00aa00 : 0xaa0000)
      .setStrokeStyle(2, COLORS.primary)
      .setInteractive()
      .on('pointerdown', () => {
        initialValue = !initialValue;
        toggleBg.setFillStyle(initialValue ? 0x00aa00 : 0xaa0000);
        toggleText.setText(initialValue ? 'ВКЛ' : 'ВЫКЛ');
        callback(initialValue);
      });

    const toggleText = this.add.text(x + 80, y, initialValue ? 'ВКЛ' : 'ВЫКЛ', {
      fontSize: '12px',
      fontFamily: "'Orbitron', monospace",
      color: '#ffffff'
    }).setOrigin(0.5);

    return { bg, text, toggleBg, toggleText };
  }

  createButton(x, y, text, callback, type = 'normal') {
    const colors = {
      normal: { bg: '#1a1a3a', text: COLORS.primary },
      danger: { bg: '#3a1a1a', text: '#ff4444' }
    };

    const color = colors[type] || colors.normal;

    const btn = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: "'Orbitron', monospace",
      color: color.text,
      backgroundColor: color.bg,
      padding: { x: 20, y: 10 },
      stroke: color.text,
      strokeThickness: 2
    })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerover', function () {
        this.setStyle({
          color: '#ffffff',
          backgroundColor: color.text
        });
        this.setScale(1.05);
      })
      .on('pointerout', function () {
        this.setStyle({
          color: color.text,
          backgroundColor: color.bg
        });
        this.setScale(1);
      })
      .on('pointerdown', callback);

    return btn;
  }

  confirmClearData() {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(50)
      .setScrollFactor(0);

    const panel = this.add.rectangle(w / 2, h / 2, 280, 150, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, COLORS.danger)
      .setDepth(51)
      .setScrollFactor(0);

    const text = this.add.text(w / 2, h / 2 - 30, 'Очистить все данные?', {
      fontSize: '16px',
      fontFamily: "'Orbitron', monospace",
      color: COLORS.danger
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const yesBtn = this.add.text(w / 2 - 60, h / 2 + 30, 'ДА', {
      fontSize: '14px',
      fontFamily: "'Orbitron', monospace",
      color: '#00ff00',
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 5 }
    })
      .setInteractive()
      .setOrigin(0.5)
      .setDepth(52)
      .setScrollFactor(0)
      .on('pointerdown', () => {
        localStorage.clear();
        location.reload();
      });

    const noBtn = this.add.text(w / 2 + 60, h / 2 + 30, 'НЕТ', {
      fontSize: '14px',
      fontFamily: "'Orbitron', monospace",
      color: '#ff0000',
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 5 }
    })
      .setInteractive()
      .setOrigin(0.5)
      .setDepth(52)
      .setScrollFactor(0)
      .on('pointerdown', () => {
        overlay.destroy();
        panel.destroy();
        text.destroy();
        yesBtn.destroy();
        noBtn.destroy();
      });
  }

  exportData() {
    const data = {
      gameManager: gameManager.data,
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skypulse_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// =========================================================================
// КОНФИГУРАЦИЯ И ЗАПУСК ИГРЫ
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
    expandParent: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1300 },
      debug: false,
      maxEntities: 500
    }
  },
  render: {
    pixelArt: false,
    antialias: true,
    powerPreference: 'high-performance'
  },
  scene: [
    BootScene,
    MenuScene,
    PlayScene,
    GameOverScene,
    ShopScene,
    AchievementsScene,
    StatsScene,
    SettingsScene
  ]
};

// Запуск игры
new Phaser.Game(config);
