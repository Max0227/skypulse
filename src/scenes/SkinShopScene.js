import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

// =========================================================================
// РАСШИРЕННЫЙ СПИСОК СКИНОВ С ПОЛНЫМИ ХАРАКТЕРИСТИКАМИ
// =========================================================================

const SKINS = [
  // ===== ОБЫЧНЫЕ (COMMON) =====
  { 
    id: 'taxi_classic', 
    name: 'CLASSIC TAXI', 
    texture: 'player_taxi_classic',
    price: 0, 
    rarity: 'COMMON',
    description: 'Классическое жёлтое такси',
    lore: 'Первое такси, с которого всё началось. Надёжный друг на все времена.',
    stats: {
      speedBonus: 0,
      armorBonus: 0,
      handlingBonus: 0,
      jumpBonus: 0,
      special: 'Нет'
    },
    color: 0xffaa00,
    glowColor: 0xffaa00,
    effects: 'none',
    visualEffects: ['none']
  },
  { 
    id: 'taxi_blue', 
    name: 'BLUE CAB', 
    texture: 'player_taxi_blue',
    price: 50, 
    rarity: 'COMMON',
    description: 'Синее такси',
    lore: 'Спокойный синий цвет помогает сохранять концентрацию во время полёта.',
    stats: {
      speedBonus: 2,
      armorBonus: 1,
      handlingBonus: 1,
      jumpBonus: 0,
      special: 'Нет'
    },
    color: 0x3366ff,
    glowColor: 0x44aaff,
    effects: 'none',
    visualEffects: ['none']
  },
  { 
    id: 'taxi_green', 
    name: 'GREEN CAB', 
    texture: 'player_taxi_green',
    price: 50, 
    rarity: 'COMMON',
    description: 'Зелёное такси',
    lore: 'Экологичный транспорт будущего. Ну, почти.',
    stats: {
      speedBonus: 2,
      armorBonus: 1,
      handlingBonus: 1,
      jumpBonus: 0,
      special: 'Нет'
    },
    color: 0x33aa33,
    glowColor: 0x44ff44,
    effects: 'none',
    visualEffects: ['none']
  },

  // ===== РЕДКИЕ (RARE) =====
  { 
    id: 'police', 
    name: 'POLICE INTERCEPTOR', 
    texture: 'player_police',
    price: 200, 
    rarity: 'RARE',
    description: 'Полицейский перехватчик',
    lore: 'Специально обученное такси для поимки нарушителей скоростного режима.',
    stats: {
      speedBonus: 10,
      armorBonus: 5,
      handlingBonus: 5,
      jumpBonus: 2,
      special: 'Мигалки'
    },
    color: 0x2244aa,
    glowColor: 0x3366ff,
    effects: 'siren',
    visualEffects: ['siren', 'flashing']
  },
  { 
    id: 'ambulance', 
    name: 'MEDIC RESPONDER', 
    texture: 'player_ambulance',
    price: 250, 
    rarity: 'RARE',
    description: 'Скорая помощь',
    lore: 'Спешит на помощь ко всем, кто пострадал от слишком быстрых полётов.',
    stats: {
      speedBonus: 8,
      armorBonus: 10,
      handlingBonus: 2,
      jumpBonus: 3,
      special: 'Регенерация'
    },
    color: 0xff4444,
    glowColor: 0xff6666,
    effects: 'siren',
    visualEffects: ['siren', 'heal']
  },
  { 
    id: 'taxi_neon_blue', 
    name: 'NEON BLUE', 
    texture: 'player_taxi_neon_blue',
    price: 300, 
    rarity: 'RARE',
    description: 'Неоновое синее такси',
    lore: 'Подсветка снизу создаёт иллюзию парения над дорогой.',
    stats: {
      speedBonus: 12,
      armorBonus: 3,
      handlingBonus: 8,
      jumpBonus: 4,
      special: 'Свечение'
    },
    color: 0x00aaff,
    glowColor: 0x44ddff,
    effects: 'neon',
    visualEffects: ['neon', 'glow']
  },

  // ===== ЭПИЧЕСКИЕ (EPIC) =====
  { 
    id: 'sport_red', 
    name: 'INFERNO', 
    texture: 'player_sport_red',
    price: 400, 
    rarity: 'EPIC',
    description: 'Спортивный красный',
    lore: 'Сделан из чистого адреналина и красной краски. Очень быстро.',
    stats: {
      speedBonus: 20,
      armorBonus: 8,
      handlingBonus: 15,
      jumpBonus: 10,
      special: 'Огненный след'
    },
    color: 0xff3333,
    glowColor: 0xff5500,
    effects: 'flames',
    visualEffects: ['flames', 'trail']
  },
  { 
    id: 'sport_blue', 
    name: 'NIGHTBLADE', 
    texture: 'player_sport_blue',
    price: 450, 
    rarity: 'EPIC',
    description: 'Спортивный синий',
    lore: 'Ночной хищник, рассекающий темноту с грацией ниндзя.',
    stats: {
      speedBonus: 18,
      armorBonus: 10,
      handlingBonus: 20,
      jumpBonus: 8,
      special: 'Невидимость'
    },
    color: 0x3366ff,
    glowColor: 0x44aaff,
    effects: 'glow',
    visualEffects: ['glow', 'stealth']
  },
  { 
    id: 'fire_truck', 
    name: 'PYRO UNIT', 
    texture: 'player_firetruck',
    price: 350, 
    rarity: 'EPIC',
    description: 'Пожарная машина',
    lore: 'Красный, большой, грозный. Пожарные — настоящие герои.',
    stats: {
      speedBonus: 12,
      armorBonus: 25,
      handlingBonus: 5,
      jumpBonus: 5,
      special: 'Огнеупорность'
    },
    color: 0xff3333,
    glowColor: 0xff5555,
    effects: 'flames',
    visualEffects: ['flames', 'heavy']
  },
  { 
    id: 'taxi_neon', 
    name: 'NEON DRIFTER', 
    texture: 'player_taxi_neon',
    price: 500, 
    rarity: 'EPIC',
    description: 'Неоновое такси',
    lore: 'Светится в темноте так ярко, что видно из космоса.',
    stats: {
      speedBonus: 15,
      armorBonus: 12,
      handlingBonus: 15,
      jumpBonus: 10,
      special: 'Неон'
    },
    color: 0x00ffff,
    glowColor: 0x88ffff,
    effects: 'neon',
    visualEffects: ['neon', 'pulse']
  },
  { 
    id: 'taxi_neon_pink', 
    name: 'PINK NEON', 
    texture: 'player_taxi_neon_pink',
    price: 550, 
    rarity: 'EPIC',
    description: 'Розовое неоновое такси',
    lore: 'Для тех, кто хочет выделяться даже в неоне.',
    stats: {
      speedBonus: 16,
      armorBonus: 10,
      handlingBonus: 18,
      jumpBonus: 12,
      special: 'Розовое свечение'
    },
    color: 0xff44aa,
    glowColor: 0xff88cc,
    effects: 'neon',
    visualEffects: ['neon', 'pulse']
  },

  // ===== ЛЕГЕНДАРНЫЕ (LEGENDARY) =====
  { 
    id: 'monster_truck', 
    name: 'BEAST', 
    texture: 'player_monster',
    price: 600, 
    rarity: 'LEGENDARY',
    description: 'Монстр-трак',
    lore: 'Создан для уничтожения всего на своём пути. Препятствия? Какие препятствия?',
    stats: {
      speedBonus: 25,
      armorBonus: 40,
      handlingBonus: 5,
      jumpBonus: 15,
      special: 'Крушитель'
    },
    color: 0xcc6600,
    glowColor: 0xff8800,
    effects: 'monster',
    visualEffects: ['monster', 'heavy', 'crush']
  },
  { 
    id: 'formula', 
    name: 'F-ZERO', 
    texture: 'player_formula',
    price: 800, 
    rarity: 'LEGENDARY',
    description: 'Формула-1',
    lore: 'Сверхзвуковой болид, способный обогнать даже собственный звук.',
    stats: {
      speedBonus: 50,
      armorBonus: 5,
      handlingBonus: 30,
      jumpBonus: 25,
      special: 'Сверхзвук'
    },
    color: 0xff6600,
    glowColor: 0xffaa00,
    effects: 'formula',
    visualEffects: ['speed', 'trail', 'boost']
  },
  { 
    id: 'taxi_gold', 
    name: 'GOLDEN GOD', 
    texture: 'player_taxi_gold',
    price: 1000, 
    rarity: 'LEGENDARY',
    description: 'Золотое такси',
    lore: 'Для настоящих королей дорог. Сделано из чистого золота (очень тяжёлое).',
    stats: {
      speedBonus: 40,
      armorBonus: 30,
      handlingBonus: 30,
      jumpBonus: 20,
      special: 'Золотой дождь'
    },
    color: 0xffaa00,
    glowColor: 0xffdd44,
    effects: 'gold',
    visualEffects: ['gold', 'sparkle', 'wealth']
  },
  { 
    id: 'cyber_taxi', 
    name: 'CYBER CAB 2077', 
    texture: 'player_cyber',
    price: 1200, 
    rarity: 'LEGENDARY',
    description: 'Кибертакси 2077',
    lore: 'Из будущего. С искусственным интеллектом и встроенным кофеваркой.',
    stats: {
      speedBonus: 60,
      armorBonus: 25,
      handlingBonus: 40,
      jumpBonus: 30,
      special: 'Киберпанк'
    },
    color: 0xaa44ff,
    glowColor: 0xcc88ff,
    effects: 'cyber',
    visualEffects: ['cyber', 'glitch', 'neon']
  },
  { 
    id: 'void_car', 
    name: 'VOID REAVER', 
    texture: 'player_void',
    price: 1500, 
    rarity: 'LEGENDARY',
    description: 'Пожиратель пустоты',
    lore: 'Сделан из тёмной материи. Поглощает свет и надежды врагов.',
    stats: {
      speedBonus: 75,
      armorBonus: 35,
      handlingBonus: 35,
      jumpBonus: 40,
      special: 'Поглощение'
    },
    color: 0x4400aa,
    glowColor: 0x8800ff,
    effects: 'void',
    visualEffects: ['void', 'absorb', 'darkness']
  }
];

export class SkinShopScene extends Phaser.Scene {
  constructor() {
    super('skinShop');
    // Переменные для анимаций
    this.rotationTweens = [];
    this.floatTweens = [];
    this.particleEmitters = [];
    this.neonButtons = [];
    this.stars = [];
    this.hoverSoundTimer = null;
    this.lastHoverTime = 0;
    this.gridOffset = 0;
    this.scrollVelocity = 0;
    this.isDragging = false;
    this.lastScrollY = 0;
    this.scrollDeceleration = 0.90;
    this.minScrollY = 0;
    this.maxScrollY = 0;
    this.optimizeLowEnd = false;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('SkinShop: create started');

    // Определяем производительность устройства
    this.checkPerformance();

    // Создаём все текстуры скинов
    this.createAllSkinTextures();

    // ===== ЭПИЧЕСКИЙ КИБЕРПАНК-ФОН =====
    this.createCyberpunkBackground();

    // ===== ПАРЯЩИЕ НЕОНОВЫЕ ЧАСТИЦЫ (отключаем на слабых устройствах) =====
    if (!this.optimizeLowEnd) {
      this.createFloatingParticles();
    }

    // ===== АНИМИРОВАННАЯ СЕТКА =====
    this.createAnimatedGrid();

    // ===== МЕРЦАЮЩИЕ ЗВЁЗДЫ =====
    this.createStars();

    // ===== НЕОНОВЫЙ ЗАГОЛОВОК =====
    this.createHeader();

    // ===== БАЛАНС КРИСТАЛЛОВ =====
    this.createBalanceDisplay();

    // ===== СПИСОК СКИНОВ С ПРОКРУТКОЙ =====
    this.createScrollableSkinList();

    // ===== НИЖНЯЯ ПАНЕЛЬ =====
    this.createFooter();

    // ===== ЗАПУСК АНИМАЦИЙ =====
    this.startAnimations();

    // ===== ОБРАБОТЧИК КЛАВИШИ ESC =====
    this.input.keyboard.on('keydown-ESC', () => {
      this.cleanupBeforeExit();
      this.scene.start('menu');
    });

    // ===== ОБРАБОТЧИК РЕСАЙЗА =====
    this.scale.on('resize', this.onResize, this);

    console.log('SkinShop: create completed');
  }

  // =========================================================================
  // ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ
  // =========================================================================

  checkPerformance() {
    // Проверяем, слабое ли устройство
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const lowMemory = navigator.deviceMemory ? navigator.deviceMemory < 4 : false;
    const lowEnd = isMobile || lowMemory;
    
    this.optimizeLowEnd = lowEnd;
    
    if (lowEnd) {
      console.log('Low-end device detected, optimizing performance');
    }
  }

  // =========================================================================
  // СОЗДАНИЕ ФОНА
  // =========================================================================

  createCyberpunkBackground() {
  const w = this.scale.width;
  const h = this.scale.height;

  // Базовый черный фон (гарантия, что не будет белого)
  this.add.rectangle(0, 0, w, h, 0x030712).setOrigin(0);

  // Многослойный градиент (как в MenuScene)
  const gradientLayers = [0.1, 0.15, 0.2, 0.25];
  gradientLayers.forEach((alpha, index) => {
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(
      0x030712 + index * 0x010101,
      0x030712 + index * 0x010101,
      0x0a0a1a + index * 0x020202,
      0x0a0a1a + index * 0x020202,
      alpha
    );
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture(`shop_gradient_${index}`, w, h);
    gradient.destroy();
    
    const gradientImage = this.add.image(0, 0, `shop_gradient_${index}`).setOrigin(0);
    gradientImage.setAlpha(0.8);
    
    if (!this.optimizeLowEnd) {
      this.tweens.add({
        targets: gradientImage,
        y: index * 5,
        duration: 8000 + index * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  });

    // Добавляем размытые неоновые круги по углам
    const corners = [
      { x: 0, y: 0, color: 0x00ffff, size: 300 },
      { x: w, y: 0, color: 0xff00ff, size: 300 },
      { x: 0, y: h, color: 0xffff00, size: 300 },
      { x: w, y: h, color: 0x00ff00, size: 300 }
    ];

    corners.forEach(corner => {
      const blur = this.add.circle(corner.x, corner.y, corner.size, corner.color, 0.05);
      blur.setBlendMode(Phaser.BlendModes.ADD);
      blur.setOrigin(corner.x === 0 ? 0 : 1, corner.y === 0 ? 0 : 1);
      
      if (!this.optimizeLowEnd) {
        this.tweens.add({
          targets: blur,
          alpha: 0.02,
          scale: 1.2,
          duration: 3000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });
  }

  createAnimatedGrid() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.grid = this.add.graphics();
    
    if (!this.optimizeLowEnd) {
      this.tweens.add({
        targets: this,
        gridOffset: 20,
        duration: 3000,
        yoyo: true,
        repeat: -1,
        onUpdate: () => this.updateGrid()
      });
    }
    
    this.updateGrid();

    // Точки на пересечениях (уменьшаем на слабых устройствах)
    const dotCount = this.optimizeLowEnd ? 30 : 70;
    
    for (let i = 0; i < dotCount; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const size = Phaser.Math.Between(1, 3);
      const color = Phaser.Utils.Array.GetRandom([0x00ffff, 0xff00ff, 0xffff00, 0x00ff00]);
      
      const dot = this.add.circle(x, y, size, color, 0.3);
      dot.setBlendMode(Phaser.BlendModes.ADD);
      
      if (!this.optimizeLowEnd) {
        this.tweens.add({
          targets: dot,
          alpha: 0.1,
          scale: 2,
          duration: 2000,
          yoyo: true,
          repeat: -1,
          delay: Math.random() * 1000
        });
      }
    }
  }

  updateGrid() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    this.grid.clear();
    this.grid.lineStyle(1, 0x00ffff, 0.1);
    
    for (let i = 0; i < w; i += 40) {
      this.grid.moveTo(i + this.gridOffset, 0);
      this.grid.lineTo(i + this.gridOffset, h);
    }
    
    for (let i = 0; i < h; i += 40) {
      this.grid.moveTo(0, i + this.gridOffset * 0.5);
      this.grid.lineTo(w, i + this.gridOffset * 0.5);
    }
    
    this.grid.strokePath();
  }

  createFloatingParticles() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const size = Phaser.Math.Between(2, 6);
      const color = Phaser.Utils.Array.GetRandom([0x00ffff, 0xff00ff, 0xffff00, 0x00ff00]);
      
      const particle = this.add.circle(x, y, size, color, 0.4);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-100, 100),
        y: y + Phaser.Math.Between(-50, 50),
        alpha: 0.1,
        scale: 0.5,
        duration: Phaser.Math.Between(3000, 7000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 100
      });
      
      this.particleEmitters.push(particle);
    }
  }

  createStars(count = 150) {
  const w = this.scale.width;
  const h = this.scale.height;
  const starCount = this.optimizeLowEnd ? Math.min(50, count) : count;

    for (let i = 0; i < starCount; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      
      const scale = Phaser.Math.FloatBetween(0.2, 1.5);
      star.setScale(scale);
      star.setTint(Phaser.Utils.Array.GetRandom([0x4444ff, 0xff44ff, 0x44ff44, 0xffff44]));
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.8));
      star.setDepth(-5);
      star.setBlendMode(Phaser.BlendModes.ADD);
      
      this.stars.push({
        sprite: star,
        speed: Phaser.Math.FloatBetween(0.01, 0.05),
        baseAlpha: Phaser.Math.FloatBetween(0.2, 0.8),
        baseScale: scale
      });
    }
  }

  // =========================================================================
  // СОЗДАНИЕ ЗАГОЛОВКА И БАЛАНСА
  // =========================================================================

  createHeader() {
    const w = this.scale.width;

    // Основной заголовок
    this.title = this.add.text(w / 2, 50, 'МАГАЗИН СКИНОВ', {
      fontSize: '36px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 6,
      shadow: { 
        offsetX: 0, 
        offsetY: 0, 
        color: '#00ffff', 
        blur: 20, 
        fill: true,
        stroke: true
      }
    }).setOrigin(0.5);

    // Копия для свечения
    this.titleGlow = this.add.text(w / 2, 50, 'МАГАЗИН СКИНОВ', {
      fontSize: '36px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#ff00ff',
      strokeThickness: 2,
      alpha: 0.5
    }).setOrigin(0.5);

    // Анимация заголовка
    if (!this.optimizeLowEnd) {
      this.tweens.add({
        targets: [this.title, this.titleGlow],
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  createBalanceDisplay() {
    const w = this.scale.width;

    // Контейнер для баланса
    const balanceContainer = this.add.container(w / 2, 100);

    // Фон
    const balanceBg = this.add.rectangle(0, 0, 280, 45, 0x0a0a1a, 0.9)
      .setStrokeStyle(3, 0x00ffff, 0.8);

    // Иконка кристалла
    const crystalIcon = this.add.text(-80, 0, '💎', {
      fontSize: '32px'
    }).setOrigin(0.5);

    if (!this.optimizeLowEnd) {
      this.tweens.add({
        targets: crystalIcon,
        angle: 360,
        duration: 4000,
        repeat: -1,
        ease: 'Linear'
      });
    }

    // Текст баланса
    this.balanceText = this.add.text(20, 0, `${gameManager.data.crystals}`, {
      fontSize: '28px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, 0.5);

    // Текст "КРИСТАЛЛЫ"
    const creditsLabel = this.add.text(0, -20, 'КРИСТАЛЛЫ', {
      fontSize: '10px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff'
    }).setOrigin(0.5);

    balanceContainer.add([balanceBg, crystalIcon, this.balanceText, creditsLabel]);

    // Пульсация рамки
    if (!this.optimizeLowEnd) {
      this.tweens.add({
        targets: balanceBg,
        strokeWidth: 4,
        alpha: 1,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  // =========================================================================
  // СОЗДАНИЕ ПРОКРУЧИВАЕМОГО СПИСКА СКИНОВ (ОПТИМИЗИРОВАНО)
  // =========================================================================

  createScrollableSkinList() {
    const w = this.scale.width;
    const h = this.scale.height;
    const listTop = 150;
    const listHeight = h - 220;

    // Маска
    const maskArea = this.add.graphics();
    maskArea.fillStyle(0xffffff);
    maskArea.fillRect(10, listTop, w - 20, listHeight);
    const mask = maskArea.createGeometryMask();
    maskArea.setVisible(false); // Скрываем маску, чтобы она не мешала кликам

    // Контейнер
    this.skinContainer = this.add.container(0, listTop);
    this.skinContainer.setMask(mask);

    // Сортировка по редкости
    const rarityOrder = { 'COMMON': 0, 'RARE': 1, 'EPIC': 2, 'LEGENDARY': 3 };
    const sortedSkins = [...SKINS].sort((a, b) => {
      if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      }
      return a.price - b.price;
    });

    let currentY = 10;
    const cardSpacing = 140;
    let currentRarity = null;

    // Русские названия редкостей
    const rarityNames = {
      'COMMON': 'ОБЫЧНЫЙ',
      'RARE': 'РЕДКИЙ',
      'EPIC': 'ЭПИЧЕСКИЙ',
      'LEGENDARY': 'ЛЕГЕНДАРНЫЙ'
    };

    const rarityColors = {
      'COMMON': '#aaaaaa',
      'RARE': '#44aaff',
      'EPIC': '#ff44aa',
      'LEGENDARY': '#ffaa00'
    };

    // Сохраняем ссылки на карточки для оптимизации
    this.skinCards = [];

    sortedSkins.forEach((skin) => {
      // Разделитель при смене редкости
      if (skin.rarity !== currentRarity) {
        currentRarity = skin.rarity;
        
        const separator = this.add.text(w / 2, currentY, `⚡ ${rarityNames[skin.rarity]} ТИР ⚡`, {
          fontSize: '18px',
          fontFamily: '"Audiowide", sans-serif',
          color: rarityColors[skin.rarity],
          stroke: '#000000',
          strokeThickness: 3,
          shadow: { blur: 10, color: rarityColors[skin.rarity], fill: true }
        }).setOrigin(0.5);
        
        this.skinContainer.add(separator);
        currentY += 40;
      }

      const owned = gameManager.getOwnedSkins().includes(skin.id);
      const selected = gameManager.getCurrentSkin() === skin.id;
      const canAfford = gameManager.data.crystals >= skin.price;

      // Создаем карточку
      const card = this.createSkinCard(skin, w, currentY, owned, selected, canAfford);
      this.skinContainer.add(card.elements);
      this.skinCards.push(card);
      
      currentY += cardSpacing;
    });

    // Отступ внизу
    this.skinContainer.add(this.add.rectangle(0, currentY, 10, 30, 0x000000, 0));

    // Система прокрутки с инерцией
    this.setupScrolling(listTop, listHeight, currentY);
  }

  createSkinCard(skin, w, y, owned, selected, canAfford) {
  const elements = [];

  // Цвета в зависимости от статуса
  let borderColor = 0x666666;
  let bgColor = 0x0a0a1a;
  
  if (selected) {
    borderColor = 0x00ff00;
    bgColor = 0x1a3a1a;
  } else if (owned) {
    borderColor = 0x00ffff;
    bgColor = 0x1a2a3a;
  } else if (skin.price === 0) {
    borderColor = 0xffaa00;
  } else if (canAfford) {
    borderColor = 0xffaa00;
  }

  // Фон карточки
  const bg = this.add.graphics();
  bg.fillStyle(bgColor, 0.9);
  bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 120, 12);
  bg.lineStyle(3, borderColor, 1);
  bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 120, 12);
  bg.setDepth(1);

  // Превью
  const preview = this.add.image(50, y + 60, skin.texture)
    .setScale(1.0)
    .setOrigin(0.5)
    .setDepth(2);

  // Название
  const nameText = this.add.text(120, y + 25, skin.name, {
    fontSize: '18px',
    fontFamily: '"Orbitron", sans-serif',
    color: '#ffffff',
    stroke: borderColor === 0x00ffff ? '#00ffff' : '#888888',
    strokeThickness: 1
  }).setOrigin(0, 0.5).setDepth(2);

  // Редкость
  const rarityNames = {
    'COMMON': 'ОБЫЧНЫЙ',
    'RARE': 'РЕДКИЙ',
    'EPIC': 'ЭПИЧЕСКИЙ',
    'LEGENDARY': 'ЛЕГЕНДАРНЫЙ'
  };
  const rarityColors = {
    'COMMON': '#aaaaaa',
    'RARE': '#44aaff',
    'EPIC': '#ff44aa',
    'LEGENDARY': '#ffaa00'
  };
  const rarityText = this.add.text(120, y + 50, `[${rarityNames[skin.rarity]}]`, {
    fontSize: '11px',
    fontFamily: '"Share Tech Mono", monospace',
    color: rarityColors[skin.rarity]
  }).setOrigin(0, 0.5).setDepth(2);

  // Статы
  const statsText = this.add.text(120, y + 80, 
    `⚡+${skin.stats.speedBonus}  🛡️+${skin.stats.armorBonus}  🌀+${skin.stats.handlingBonus}  🚀+${skin.stats.jumpBonus}`,
    {
      fontSize: '11px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88ff88'
    }
  ).setOrigin(0, 0.5).setDepth(2);

  // Специальная способность
  if (skin.stats.special !== 'Нет') {
    const specialText = this.add.text(120, y + 100, `✨ ${skin.stats.special}`, {
      fontSize: '10px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffaa00'
    }).setOrigin(0, 0.5).setDepth(2);
    elements.push(specialText);
  }

  // Статус/цена
  let statusText = '';
  let statusColor = '#666666';
  if (selected) {
    statusText = 'ВЫБРАН';
    statusColor = '#00ff00';
  } else if (owned) {
    statusText = 'КУПЛЕН';
    statusColor = '#00ffff';
  } else if (skin.price === 0) {
    statusText = 'БЕСПЛАТНО';
    statusColor = '#ffaa00';
  } else {
    statusText = `${skin.price} 💎`;
    statusColor = canAfford ? '#ffaa00' : '#ff4444';
  }

  const status = this.add.text(w - 40, y + 60, statusText, {
    fontSize: '14px',
    fontFamily: '"Audiowide", sans-serif',
    color: statusColor,
    stroke: '#000000',
    strokeThickness: 2
  }).setOrigin(1, 0.5).setDepth(2);

  // Индикатор эффектов
  if (skin.effects !== 'none') {
    const effectIcons = {
      'siren': '🚨',
      'neon': '💡',
      'flames': '🔥',
      'monster': '👣',
      'formula': '⚡',
      'gold': '👑',
      'cyber': '🤖',
      'void': '🌌'
    };
    const effectIcon = effectIcons[skin.effects] || '✨';
    
    const effectText = this.add.text(w - 40, y + 90, effectIcon, {
      fontSize: '20px'
    }).setOrigin(1, 0.5).setDepth(2);
    elements.push(effectText);
  }

  // Добавляем все элементы
  elements.push(bg, preview, nameText, rarityText, statsText, status);

  // ИНТЕРАКТИВНАЯ ОБЛАСТЬ (ЕДИНСТВЕННАЯ)
  const hitArea = this.add.rectangle(w / 2, y + 60, w - 40, 120, 0x000000, 0)
    .setInteractive({ useHandCursor: true })
    .setOrigin(0.5)
    .setDepth(10);

  // Сохраняем ссылку на скин
  hitArea.skinData = skin;

  // Обработчики
  hitArea.on('pointerover', () => {
    bg.clear();
    bg.fillStyle(0x1a1a3a, 0.9);
    bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 120, 12);
    bg.lineStyle(3, borderColor, 1);
    bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 120, 12);
    preview.setScale(1.1);
    this.playHoverSound();
  });

  hitArea.on('pointerout', () => {
    bg.clear();
    bg.fillStyle(bgColor, 0.9);
    bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 120, 12);
    bg.lineStyle(3, borderColor, 1);
    bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 120, 12);
    preview.setScale(1.0);
  });

  hitArea.on('pointerdown', (pointer) => {
    pointer.event.stopPropagation(); // Останавливаем всплытие
    this.tweens.add({
      targets: hitArea,
      scaleX: 0.98,
      scaleY: 0.98,
      duration: 100,
      yoyo: true
    });
    this.playClickSound();
    this.openSkinDetail(hitArea.skinData);
  });

  elements.push(hitArea);
  return { elements, skin, y };
}

  setupScrolling(listTop, listHeight, totalHeight) {
    const w = this.scale.width;
    
    this.scrollZone = this.add.zone(0, listTop, w, listHeight).setOrigin(0).setInteractive();
    this.scrollZone.setDepth(5); // Ниже, чем hitArea (depth 10)
    
    this.minScrollY = -(totalHeight - listHeight + 50);
    this.maxScrollY = listTop;

    // Переменные для инерции
    this.scrollVelocity = 0;
    this.isDragging = false;
    this.lastScrollY = 0;
    this.scrollDeceleration = 0.90;

    // Обработчики событий
    this.scrollZone.on('pointerdown', (pointer) => {
      this.isDragging = true;
      this.lastScrollY = pointer.y;
      this.scrollVelocity = 0;
      this.startDragY = this.skinContainer.y;
      this.startPointerY = pointer.y;
    });

    this.scrollZone.on('pointermove', (pointer) => {
      if (!this.isDragging) return;
      
      const deltaY = pointer.y - this.lastScrollY;
      this.scrollVelocity = deltaY * 0.5;
      
      let newY = this.skinContainer.y + deltaY;
      
      // Резиновый эффект на границах
      if (newY < this.minScrollY) {
        newY = this.minScrollY + (newY - this.minScrollY) * 0.2;
      } else if (newY > this.maxScrollY) {
        newY = this.maxScrollY + (newY - this.maxScrollY) * 0.2;
      }
      
      this.skinContainer.y = newY;
      this.lastScrollY = pointer.y;
    });

    this.scrollZone.on('pointerup', () => {
      this.isDragging = false;
    });

    this.scrollZone.on('pointerout', () => {
      this.isDragging = false;
    });

    // Индикатор прокрутки
    if (totalHeight > listHeight) {
      this.scrollTrack = this.add.graphics();
      this.scrollTrack.fillStyle(0x333333, 0.5);
      this.scrollTrack.fillRoundedRect(w - 20, listTop + 10, 6, listHeight - 20, 3);
      
      this.indicatorHeight = (listHeight - 20) * listHeight / totalHeight;
      this.scrollIndicator = this.add.graphics();
      this.scrollIndicator.fillStyle(0x00ffff, 0.8);
      this.scrollIndicator.fillRoundedRect(w - 20, listTop + 10, 6, this.indicatorHeight, 3);
      
      if (!this.optimizeLowEnd) {
        this.tweens.add({
          targets: this.scrollIndicator,
          alpha: 0.5,
          duration: 1000,
          yoyo: true,
          repeat: -1
        });
      }
    }
  }

  // =========================================================================
  // ДЕТАЛЬНОЕ ОКНО СКИНА (КРАСИВОЕ, СОВРЕМЕННОЕ)
  // =========================================================================

  openSkinDetail(skin) {
  console.log('Opening skin detail for:', skin.name); // Для отладки
  
  const w = this.scale.width;
  const h = this.scale.height;

  const owned = gameManager.getOwnedSkins().includes(skin.id);
  const selected = gameManager.getCurrentSkin() === skin.id;
  const canAfford = gameManager.data.crystals >= skin.price;

  // Проверяем, что метод вызывается
  console.log({ owned, selected, canAfford });

  // Затемнение фона с анимацией
  const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0)
    .setDepth(50)
    .setScrollFactor(0)
    .setInteractive();

  this.tweens.add({
    targets: overlay,
    alpha: 0.9,
    duration: 300,
    ease: 'Power2.easeOut'
  });

    // Основная панель с анимацией
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.98);
    panel.fillRoundedRect(w / 2 - 200, h / 2 - 250, 400, 500, 20);
    panel.lineStyle(4, skin.rarity === 'LEGENDARY' ? 0xffaa00 : 0x00ffff, 1);
    panel.strokeRoundedRect(w / 2 - 200, h / 2 - 250, 400, 500, 20);
    panel.setDepth(51);

    // Превью с анимацией вращения
    const preview = this.add.image(w / 2, h / 2 - 130, skin.texture)
      .setScale(3.0)
      .setDepth(52)
      .setScrollFactor(0);

    this.tweens.add({
      targets: preview,
      angle: 360,
      duration: 10000,
      repeat: -1,
      ease: 'Linear'
    });

    // Название с неоновым эффектом
    const nameText = this.add.text(w / 2, h / 2 - 30, skin.name, {
      fontSize: '28px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      stroke: skin.rarity === 'LEGENDARY' ? '#ffaa00' : '#00ffff',
      strokeThickness: 4,
      shadow: { blur: 15, color: skin.rarity === 'LEGENDARY' ? '#ffaa00' : '#00ffff', fill: true }
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    // Редкость
    const rarityNames = {
      'COMMON': 'ОБЫЧНЫЙ',
      'RARE': 'РЕДКИЙ',
      'EPIC': 'ЭПИЧЕСКИЙ',
      'LEGENDARY': 'ЛЕГЕНДАРНЫЙ'
    };
    const rarityColors = {
      'COMMON': '#aaaaaa',
      'RARE': '#44aaff',
      'EPIC': '#ff44aa',
      'LEGENDARY': '#ffaa00'
    };
    
    const rarityText = this.add.text(w / 2, h / 2 + 5, `[${rarityNames[skin.rarity]}]`, {
      fontSize: '16px',
      fontFamily: '"Share Tech Mono", monospace',
      color: rarityColors[skin.rarity]
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    // Описание
    const descText = this.add.text(w / 2, h / 2 + 35, skin.description, {
      fontSize: '16px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#aaccff',
      align: 'center',
      wordWrap: { width: 320 }
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    // Лор (история)
    const loreText = this.add.text(w / 2, h / 2 + 85, `"${skin.lore}"`, {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff',
      align: 'center',
      wordWrap: { width: 320 },
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    // Характеристики (красивые карточки)
    const statsY = h / 2 + 140;
    const stats = [
      { label: 'СКОРОСТЬ', value: skin.stats.speedBonus, icon: '⚡', color: 0xffff00 },
      { label: 'БРОНЯ', value: skin.stats.armorBonus, icon: '🛡️', color: 0x00ffff },
      { label: 'УПРАВЛЕНИЕ', value: skin.stats.handlingBonus, icon: '🌀', color: 0xff00ff },
      { label: 'ПРЫЖОК', value: skin.stats.jumpBonus, icon: '🚀', color: 0xff8800 }
    ];

    stats.forEach((stat, index) => {
      const y = statsY + index * 30;
      
      // Фон для статистики с градиентом
      const statBg = this.add.graphics();
      statBg.fillStyle(0x1a1a2a, 0.8);
      statBg.fillRoundedRect(w / 2 - 150, y - 12, 300, 28, 14);
      statBg.lineStyle(2, stat.color, 0.5);
      statBg.strokeRoundedRect(w / 2 - 150, y - 12, 300, 28, 14);
      statBg.setDepth(52);
      
      const iconText = this.add.text(w / 2 - 140, y, stat.icon, {
        fontSize: '18px'
      }).setOrigin(0, 0.5).setDepth(53).setScrollFactor(0);
      
      const labelText = this.add.text(w / 2 - 120, y, stat.label, {
        fontSize: '14px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(53).setScrollFactor(0);
      
      // Прогресс-бар
      const barBg = this.add.graphics();
      barBg.fillStyle(0x333333, 0.5);
      barBg.fillRoundedRect(w / 2 + 20, y - 8, 100, 16, 8);
      barBg.setDepth(52);
      
      const barFill = this.add.graphics();
      barFill.fillStyle(stat.color, 0.8);
      barFill.fillRoundedRect(w / 2 + 20, y - 8, Math.min(100, stat.value * 2), 16, 8);
      barFill.setDepth(52);
      
      const valueText = this.add.text(w / 2 + 130, y, `+${stat.value}`, {
        fontSize: '16px',
        fontFamily: '"Audiowide", sans-serif',
        color: Phaser.Display.Color.ValueToColor(stat.color).rgba
      }).setOrigin(1, 0.5).setDepth(53).setScrollFactor(0);
    });

    // Специальная способность
    const specialY = statsY + 130;
    if (skin.stats.special !== 'Нет') {
      const specialBg = this.add.graphics();
      specialBg.fillStyle(0x2a1a2a, 0.8);
      specialBg.fillRoundedRect(w / 2 - 150, specialY - 15, 300, 40, 20);
      specialBg.lineStyle(2, 0xffaa00, 0.7);
      specialBg.strokeRoundedRect(w / 2 - 150, specialY - 15, 300, 40, 20);
      specialBg.setDepth(52);
      
      this.add.text(w / 2 - 140, specialY, '✨ ОСОБОЕ:', {
        fontSize: '12px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#ffaa00'
      }).setOrigin(0, 0.5).setDepth(53).setScrollFactor(0);
      
      this.add.text(w / 2 + 100, specialY, skin.stats.special, {
        fontSize: '14px',
        fontFamily: '"Audiowide", sans-serif',
        color: '#ffaa00'
      }).setOrigin(1, 0.5).setDepth(53).setScrollFactor(0);
    }

    // Цена
    const priceY = h / 2 + 190;
    if (!owned) {
      const priceBg = this.add.graphics();
      priceBg.fillStyle(0x2a2a1a, 0.9);
      priceBg.fillRoundedRect(w / 2 - 80, priceY - 15, 160, 40, 20);
      priceBg.lineStyle(3, canAfford ? 0xffaa00 : 0xff4444, 0.8);
      priceBg.strokeRoundedRect(w / 2 - 80, priceY - 15, 160, 40, 20);
      priceBg.setDepth(52);

      const priceText = this.add.text(w / 2 - 20, priceY, `${skin.price}`, {
        fontSize: '28px',
        fontFamily: '"Audiowide", sans-serif',
        color: canAfford ? '#ffaa00' : '#ff4444'
      }).setOrigin(1, 0.5).setDepth(53).setScrollFactor(0);

      const crystalIcon = this.add.text(w / 2 + 10, priceY, '💎', {
        fontSize: '28px'
      }).setOrigin(0, 0.5).setDepth(53).setScrollFactor(0);

      if (!this.optimizeLowEnd) {
        this.tweens.add({
          targets: [priceText, crystalIcon],
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 500,
          yoyo: true,
          repeat: -1
        });
      }
    }

    // Кнопки
    const buttonY = h / 2 + 200;
    const buttonSpacing = 120;

    if (!owned) {
      // Кнопка покупки
      const buyBtn = this.createDetailButton(
        w / 2 - buttonSpacing, 
        buttonY + 20, 
        'КУПИТЬ', 
        canAfford ? '#00ff00' : '#ff4444',
        canAfford ? '#00aa00' : '#aa0000'
      );
      buyBtn.setDepth(53).setScrollFactor(0);
      
      buyBtn.on('pointerdown', () => {
        if (canAfford) {
          this.closeDetailWithAnimation(overlay, panel, preview, nameText, rarityText, descText, loreText, buyBtn);
          this.confirmPurchase(skin);
        } else {
          this.showNoFunds();
        }
      });
    } else if (!selected) {
      // Кнопка выбора
      const selectBtn = this.createDetailButton(
        w / 2 - buttonSpacing, 
        buttonY + 20, 
        'ВЫБРАТЬ', 
        '#00ffff',
        '#0088aa'
      );
      selectBtn.setDepth(53).setScrollFactor(0);
      
      selectBtn.on('pointerdown', () => {
        this.selectSkin(skin);
        this.closeDetailWithAnimation(overlay, panel, preview, nameText, rarityText, descText, loreText, selectBtn);
      });
    } else {
      // Уже выбрано
      const equippedBg = this.add.graphics();
      equippedBg.fillStyle(0x1a3a1a, 0.9);
      equippedBg.fillRoundedRect(w / 2 - 80, buttonY, 160, 50, 25);
      equippedBg.lineStyle(3, 0x00ff00, 1);
      equippedBg.strokeRoundedRect(w / 2 - 80, buttonY, 160, 50, 25);
      equippedBg.setDepth(52);

      this.add.text(w / 2, buttonY + 25, '✓ ВЫБРАНО', {
        fontSize: '20px',
        fontFamily: '"Audiowide", sans-serif',
        color: '#00ff00'
      }).setOrigin(0.5).setDepth(53).setScrollFactor(0);
    }

    // Кнопка закрытия (красивый крестик)
    const closeBtn = this.add.text(w - 50, 100, '✕', {
      fontSize: '40px',
      fontFamily: 'sans-serif',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3
    }).setInteractive({ useHandCursor: true }).setDepth(53).setScrollFactor(0).setOrigin(0.5);

    closeBtn.on('pointerover', () => {
      closeBtn.setStyle({ color: '#ff8888', scale: 1.2 });
      this.playHoverSound();
    });

    closeBtn.on('pointerout', () => {
      closeBtn.setStyle({ color: '#ff4444', scale: 1 });
    });

    closeBtn.on('pointerdown', () => {
      this.playClickSound();
      this.closeDetailWithAnimation(overlay, panel, preview, nameText, rarityText, descText, loreText, closeBtn);
    });
  }

  closeDetailWithAnimation(...objects) {
    objects.forEach(obj => {
      if (obj && obj.destroy) {
        this.tweens.add({
          targets: obj,
          alpha: 0,
          scale: 0.5,
          duration: 200,
          onComplete: () => obj.destroy()
        });
      }
    });
  }

  createDetailButton(x, y, text, color, hoverColor) {
    const btn = this.add.text(x, y, text, {
      fontSize: '22px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      backgroundColor: '#1a1a3a',
      padding: { x: 30, y: 15 },
      stroke: color,
      strokeThickness: 3
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setStyle({ backgroundColor: hoverColor, scale: 1.1 });
      this.playHoverSound();
    });

    btn.on('pointerout', () => {
      btn.setStyle({ backgroundColor: '#1a1a3a', scale: 1, stroke: color });
    });

    return btn;
  }

  // =========================================================================
  // МЕТОДЫ УПРАВЛЕНИЯ СКИНАМИ
  // =========================================================================

  selectSkin(skin) {
    if (gameManager.selectSkin(skin.id)) {
      this.playSelectSound();
      this.showMessage(`✓ ВЫБРАН: ${skin.name}`, '#00ff00');
      this.createConfetti(this.scale.width / 2, 200, skin.color);
      
      this.time.delayedCall(800, () => {
        this.scene.restart();
      });
    }
  }

  confirmPurchase(skin) {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0)
      .setDepth(50).setScrollFactor(0);

    this.tweens.add({
      targets: overlay,
      alpha: 0.95,
      duration: 300
    });

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.98);
    panel.fillRoundedRect(w / 2 - 200, h / 2 - 200, 400, 400, 30);
    panel.lineStyle(4, skin.rarity === 'LEGENDARY' ? 0xffaa00 : 0x00ffff, 1);
    panel.strokeRoundedRect(w / 2 - 200, h / 2 - 200, 400, 400, 30);
    panel.setDepth(51);

    const preview = this.add.image(w / 2, h / 2 - 90, skin.texture)
      .setScale(2.5).setDepth(52).setScrollFactor(0);
    
    this.tweens.add({
      targets: preview,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: 'Linear'
    });

    this.add.text(w / 2, h / 2 - 10, skin.name, {
      fontSize: '28px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const priceText = this.add.text(w / 2, h / 2 + 140, `${skin.price} 💎`, {
      fontSize: '32px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.tweens.add({
      targets: priceText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    const yesBtn = this.createDetailButton(w / 2 - 120, h / 2 + 180, 'КУПИТЬ', '#00ff00', '#00aa00');
    const noBtn = this.createDetailButton(w / 2 + 120, h / 2 + 180, 'ОТМЕНА', '#ff4444', '#aa0000');

    yesBtn.setDepth(52).setScrollFactor(0);
    noBtn.setDepth(52).setScrollFactor(0);

    yesBtn.on('pointerdown', () => {
      if (gameManager.purchaseSkin(skin.id)) {
        this.playPurchaseSound();
        this.balanceText.setText(`${gameManager.data.crystals}`);
        this.createConfetti(w / 2, h / 2, skin.color);
        this.showMessage('✓ ПОКУПКА УСПЕШНА!', '#00ff00');
        
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: [overlay, panel, preview, priceText, yesBtn, noBtn],
            alpha: 0,
            duration: 300,
            onComplete: () => {
              overlay.destroy();
              panel.destroy();
              preview.destroy();
              priceText.destroy();
              yesBtn.destroy();
              noBtn.destroy();
              this.scene.restart();
            }
          });
        });
      }
    });

    noBtn.on('pointerdown', () => {
      this.playClickSound();
      this.tweens.add({
        targets: [overlay, panel, preview, priceText, yesBtn, noBtn],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          overlay.destroy();
          panel.destroy();
          preview.destroy();
          priceText.destroy();
          yesBtn.destroy();
          noBtn.destroy();
        }
      });
    });
  }

  // =========================================================================
  // НИЖНЯЯ ПАНЕЛЬ
  // =========================================================================

  createFooter() {
  const w = this.scale.width;
  const h = this.scale.height;

  // Нижняя неоновая линия с пульсацией
  const footerLine = this.add.graphics();
  footerLine.lineStyle(3, 0x00ffff, 0.3);
  footerLine.lineBetween(40, h - 50, w - 40, h - 50);
  
  this.tweens.add({
    targets: {},
    duration: 2000,
    repeat: -1,
    onUpdate: (tween) => {
      const progress = Math.sin(tween.progress * Math.PI * 2) * 0.2 + 0.3;
      footerLine.clear();
      footerLine.lineStyle(3, 0x00ffff, progress);
      footerLine.lineBetween(40, h - 50, w - 40, h - 50);
    }
  });

  // Декоративные огни по углам
  const createCornerLight = (x, y, color) => {
    const light = this.add.circle(x, y, 8, color, 0.6);
    light.setBlendMode(Phaser.BlendModes.ADD);
    
    this.tweens.add({
      targets: light,
      alpha: 0.2,
      scale: 1.8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    return light;
  };

  createCornerLight(30, h - 50, 0x00ffff);
  createCornerLight(w - 30, h - 50, 0xff00ff);

  // Статистика коллекции (стилизованная)
  const ownedCount = gameManager.getOwnedSkins().length;
  const totalCount = SKINS.length;
  const collectionPercent = Math.floor((ownedCount / totalCount) * 100);

  const statsContainer = this.add.container(30, h - 30);

  const statsBg = this.add.graphics();
  statsBg.fillStyle(0x0a0a1a, 0.7);
  statsBg.fillRoundedRect(0, -15, 160, 30, 10);
  statsBg.lineStyle(2, 0x00ffff, 0.3);
  statsBg.strokeRoundedRect(0, -15, 160, 30, 10);

  const statsIcon = this.add.text(12, 0, '📊', {
    fontSize: '16px'
  }).setOrigin(0, 0.5);

  const statsText = this.add.text(35, 0, `${ownedCount}/${totalCount}`, {
    fontSize: '14px',
    fontFamily: '"Audiowide", sans-serif',
    color: '#88aaff',
    stroke: '#000000',
    strokeThickness: 1
  }).setOrigin(0, 0.5);

  const percentText = this.add.text(100, 0, `${collectionPercent}%`, {
    fontSize: '12px',
    fontFamily: '"Share Tech Mono", monospace',
    color: '#00ffff'
  }).setOrigin(0, 0.5);

  statsContainer.add([statsBg, statsIcon, statsText, percentText]);

  // Кнопка назад - КРАСИВАЯ НЕОНОВАЯ КНОПКА
  const backBtnX = w / 2;
  const backBtnY = h - 30;

  // Графика кнопки
  const backBtnGraphics = this.add.graphics();
  
  const backBtnState = {
    glowAlpha: 0.4,
    scale: 1
  };

  const updateBackButton = () => {
    backBtnGraphics.clear();
    
    // Внешнее свечение
    backBtnGraphics.fillStyle(0x00ffff, backBtnState.glowAlpha * 0.2);
    backBtnGraphics.fillRoundedRect(backBtnX - 140, backBtnY - 20, 280, 40, 25);
    
    // Основной фон
    backBtnGraphics.fillStyle(0x1a1a3a, 0.9);
    backBtnGraphics.fillRoundedRect(backBtnX - 140, backBtnY - 20, 280, 40, 25);
    
    // Неоновая рамка
    backBtnGraphics.lineStyle(3, 0x00ffff, backBtnState.glowAlpha);
    backBtnGraphics.strokeRoundedRect(backBtnX - 140, backBtnY - 20, 280, 40, 25);
    
    // Внутренняя подсветка
    backBtnGraphics.lineStyle(2, 0xffffff, 0.2);
    backBtnGraphics.strokeRoundedRect(backBtnX - 138, backBtnY - 18, 276, 36, 23);
  };

  updateBackButton();

  // Текст кнопки
  const backBtnText = this.add.text(backBtnX, backBtnY, '⏎ НАЗАД В МЕНЮ', {
    fontSize: '20px',
    fontFamily: '"Audiowide", sans-serif',
    color: '#ffffff',
    stroke: '#00ffff',
    strokeThickness: 2,
    shadow: { blur: 10, color: '#00ffff', fill: true }
  }).setOrigin(0.5);

  // Интерактивная область
  const backBtnHitArea = this.add.rectangle(backBtnX, backBtnY, 280, 40, 0x000000, 0)
    .setInteractive({ useHandCursor: true })
    .setDepth(10);

  backBtnHitArea.on('pointerover', () => {
    this.tweens.add({
      targets: backBtnState,
      glowAlpha: 0.9,
      duration: 200,
      onUpdate: updateBackButton
    });
    
    this.tweens.add({
      targets: [backBtnText],
      scale: 1.1,
      duration: 200
    });
    
    backBtnText.setStyle({ stroke: '#ffffff' });
    this.playHoverSound();
  });

  backBtnHitArea.on('pointerout', () => {
    this.tweens.add({
      targets: backBtnState,
      glowAlpha: 0.4,
      duration: 200,
      onUpdate: updateBackButton
    });
    
    this.tweens.add({
      targets: [backBtnText],
      scale: 1,
      duration: 200
    });
    
    backBtnText.setStyle({ stroke: '#00ffff' });
  });

  backBtnHitArea.on('pointerdown', () => {
    this.playClickSound();
    this.cleanupBeforeExit();
    this.scene.start('menu');
  });

  // Версия с эффектом
  const versionText = this.add.text(w - 30, h - 30, 'v3.5.0', {
    fontSize: '12px',
    fontFamily: '"Share Tech Mono", monospace',
    color: '#666666',
    stroke: '#000000',
    strokeThickness: 1
  }).setOrigin(1, 0.5);

  this.tweens.add({
    targets: versionText,
    alpha: 0.5,
    duration: 1500,
    yoyo: true,
    repeat: -1
  });

  // Маленькие неоновые точки по бокам от версии
  const versionDots = [-15, -5, 5, 15];
  versionDots.forEach((offset, index) => {
    const dot = this.add.circle(w - 30 + offset, h - 35, 1, 0x00ffff, 0.3);
    dot.setBlendMode(Phaser.BlendModes.ADD);
    
    this.tweens.add({
      targets: dot,
      alpha: 0.1,
      scale: 1.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      delay: index * 200
    });
  });

  // Анимированная линия прогресса коллекции под статистикой
  const progressBarBg = this.add.graphics();
  progressBarBg.fillStyle(0x333333, 0.3);
  progressBarBg.fillRoundedRect(30, h - 45, 160, 3, 2);

  const progressBarFill = this.add.graphics();
  const fillWidth = (ownedCount / totalCount) * 160;
  progressBarFill.fillStyle(0x00ffff, 0.8);
  progressBarFill.fillRoundedRect(30, h - 45, fillWidth, 3, 2);

  // Анимация пульсации прогресс-бара
  this.tweens.add({
    targets: progressBarFill,
    alpha: 0.6,
    duration: 1000,
    yoyo: true,
    repeat: -1
  });
}
  // =========================================================================
  // ТЕКСТУРЫ СКИНОВ
  // =========================================================================

  createAllSkinTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Такси
    g.clear();
    g.fillStyle(0xffaa00);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0xff8800);
    g.fillRect(15, 5, 50, 8);
    g.fillStyle(0x44aaff);
    g.fillRect(20, 18, 15, 8);
    g.fillRect(40, 18, 15, 8);
    g.fillStyle(0x00ffff);
    g.fillCircle(18, 30, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 30, 2);
    g.fillStyle(0xffff00);
    g.fillRect(35, 30, 8, 5);
    g.generateTexture('player_taxi_classic', 80, 50);

    g.clear();
    g.fillStyle(0x3366ff);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0x2244aa);
    g.fillRect(15, 5, 50, 8);
    g.fillStyle(0x44aaff);
    g.fillRect(20, 18, 15, 8);
    g.fillRect(40, 18, 15, 8);
    g.fillStyle(0x00ffff);
    g.fillCircle(18, 30, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 30, 2);
    g.fillStyle(0xffff00);
    g.fillRect(35, 30, 8, 5);
    g.generateTexture('player_taxi_blue', 80, 50);

    g.clear();
    g.fillStyle(0x33aa33);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0x228822);
    g.fillRect(15, 5, 50, 8);
    g.fillStyle(0x44aaff);
    g.fillRect(20, 18, 15, 8);
    g.fillRect(40, 18, 15, 8);
    g.fillStyle(0x00ffff);
    g.fillCircle(18, 30, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 30, 2);
    g.fillStyle(0xffff00);
    g.fillRect(35, 30, 8, 5);
    g.generateTexture('player_taxi_green', 80, 50);

    // Полиция
    g.clear();
    g.fillStyle(0x2244aa);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0xffffff);
    g.fillRect(15, 5, 50, 4);
    g.fillStyle(0xff3333);
    g.fillCircle(25, 8, 3);
    g.fillCircle(45, 8, 3);
    g.fillStyle(0x44aaff);
    g.fillRect(20, 18, 10, 8);
    g.fillRect(40, 18, 10, 8);
    g.fillStyle(0x0000ff);
    g.fillCircle(18, 30, 4);
    g.generateTexture('player_police', 80, 50);

    // Скорая
    g.clear();
    g.fillStyle(0xff4444);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0xffffff);
    g.fillRect(15, 5, 50, 8);
    g.fillStyle(0xff8888);
    g.fillRect(20, 18, 10, 8);
    g.fillRect(40, 18, 10, 8);
    g.fillStyle(0x44aaff);
    g.fillCircle(18, 30, 4);
    g.fillStyle(0xff0000);
    g.fillCircle(45, 30, 4);
    g.fillStyle(0xff3333);
    g.fillRect(35, 5, 5, 8);
    g.fillRect(45, 5, 5, 8);
    g.generateTexture('player_ambulance', 80, 50);

    // Пожарная
    g.clear();
    g.fillStyle(0xff3333);
    g.fillRoundedRect(10, 15, 60, 30, 8);
    g.fillStyle(0xffffff);
    g.fillRect(15, 10, 50, 5);
    g.fillStyle(0xffaa00);
    g.fillCircle(25, 8, 3);
    g.fillCircle(45, 8, 3);
    g.fillStyle(0x44aaff);
    g.fillRect(20, 20, 10, 8);
    g.fillRect(40, 20, 10, 8);
    g.fillStyle(0x000000);
    g.fillCircle(20, 40, 4);
    g.fillCircle(50, 40, 4);
    g.generateTexture('player_firetruck', 80, 50);

    // Спорткар красный
    g.clear();
    g.fillStyle(0xff3333);
    g.fillRoundedRect(10, 15, 60, 25, 6);
    g.fillStyle(0xffaa00);
    g.fillRect(15, 10, 50, 8);
    g.fillStyle(0x44aaff);
    g.fillCircle(18, 30, 4);
    g.fillCircle(48, 30, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 30, 2);
    g.fillCircle(48, 30, 2);
    g.fillStyle(0xffaa00);
    g.fillRect(35, 25, 10, 4);
    g.generateTexture('player_sport_red', 80, 50);

    // Спорткар синий
    g.clear();
    g.fillStyle(0x3366ff);
    g.fillRoundedRect(10, 15, 60, 25, 6);
    g.fillStyle(0xffffff);
    g.fillRect(15, 10, 50, 8);
    g.fillStyle(0xffaa00);
    g.fillCircle(18, 30, 4);
    g.fillCircle(48, 30, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 30, 2);
    g.fillCircle(48, 30, 2);
    g.fillStyle(0x00ffff);
    g.fillRect(35, 25, 10, 4);
    g.generateTexture('player_sport_blue', 80, 50);

    // Неоновые
    g.clear();
    g.fillStyle(0x00ffff);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0xff00ff);
    g.fillRect(15, 5, 50, 8);
    g.fillStyle(0x44aaff);
    g.fillRect(20, 18, 15, 8);
    g.fillRect(40, 18, 15, 8);
    g.fillStyle(0xffff00);
    g.fillCircle(18, 30, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 30, 2);
    g.fillStyle(0xff00ff);
    g.fillRect(35, 30, 8, 5);
    g.lineStyle(2, 0xff00ff);
    g.strokeRoundedRect(10, 10, 60, 35, 8);
    g.generateTexture('player_taxi_neon', 80, 50);

    g.clear();
    g.fillStyle(0xff44aa);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0xffff00);
    g.fillRect(15, 5, 50, 8);
    g.fillStyle(0x44aaff);
    g.fillRect(20, 18, 15, 8);
    g.fillRect(40, 18, 15, 8);
    g.fillStyle(0x00ffff);
    g.fillCircle(18, 30, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 30, 2);
    g.fillStyle(0xffff00);
    g.fillRect(35, 30, 8, 5);
    g.lineStyle(2, 0xffff00);
    g.strokeRoundedRect(10, 10, 60, 35, 8);
    g.generateTexture('player_taxi_neon_pink', 80, 50);

    g.clear();
    g.fillStyle(0x00aaff);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0xffffff);
    g.fillRect(15, 5, 50, 8);
    g.fillStyle(0x44aaff);
    g.fillRect(20, 18, 15, 8);
    g.fillRect(40, 18, 15, 8);
    g.fillStyle(0xffff00);
    g.fillCircle(18, 30, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 30, 2);
    g.fillStyle(0xffffff);
    g.fillRect(35, 30, 8, 5);
    g.lineStyle(2, 0xffffff);
    g.strokeRoundedRect(10, 10, 60, 35, 8);
    g.generateTexture('player_taxi_neon_blue', 80, 50);

    // Легендарные
    g.clear();
    g.fillStyle(0xcc6600);
    g.fillRoundedRect(10, 20, 60, 30, 6);
    g.fillStyle(0x333333);
    g.fillCircle(20, 45, 8);
    g.fillCircle(50, 45, 8);
    g.fillStyle(0x44aaff);
    g.fillRect(20, 25, 15, 8);
    g.fillRect(40, 25, 15, 8);
    g.fillStyle(0xffff00);
    g.fillRect(35, 35, 10, 5);
    g.fillStyle(0x000000);
    g.fillCircle(20, 45, 4);
    g.fillCircle(50, 45, 4);
    g.generateTexture('player_monster', 80, 60);

    g.clear();
    g.fillStyle(0xff6600);
    g.beginPath();
    g.moveTo(15, 25);
    g.lineTo(65, 25);
    g.lineTo(70, 35);
    g.lineTo(10, 35);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xffffff);
    g.fillCircle(20, 40, 5);
    g.fillCircle(60, 40, 5);
    g.fillStyle(0x44aaff);
    g.fillRect(30, 30, 20, 5);
    g.fillStyle(0x000000);
    g.fillCircle(20, 40, 3);
    g.fillCircle(60, 40, 3);
    g.generateTexture('player_formula', 80, 50);

    g.clear();
    g.fillStyle(0xffaa00);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0xffdd44);
    g.fillRect(15, 5, 50, 8);
    g.fillStyle(0xffaa00);
    g.fillRect(20, 18, 15, 8);
    g.fillRect(40, 18, 15, 8);
    g.fillStyle(0xffff00);
    g.fillCircle(18, 30, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 30, 2);
    g.fillStyle(0xffaa00);
    g.fillRect(35, 30, 8, 5);
    g.lineStyle(2, 0xffdd44);
    g.strokeRoundedRect(10, 10, 60, 35, 8);
    g.generateTexture('player_taxi_gold', 80, 50);

    g.clear();
    g.fillStyle(0xaa44ff);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0x00ffff);
    g.fillRect(15, 5, 50, 8);
    g.fillStyle(0xff00ff);
    g.fillRect(20, 18, 15, 8);
    g.fillRect(40, 18, 15, 8);
    g.fillStyle(0xffff00);
    g.fillCircle(18, 30, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 30, 2);
    g.fillStyle(0xff00ff);
    g.fillRect(35, 30, 8, 5);
    g.lineStyle(3, 0x00ffff);
    g.strokeRoundedRect(8, 8, 64, 39, 8);
    g.lineStyle(2, 0xff00ff);
    g.strokeRoundedRect(10, 10, 60, 35, 8);
    g.generateTexture('player_cyber', 80, 50);

    g.clear();
    g.fillStyle(0x4400aa);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0x8800ff);
    g.fillRect(15, 5, 50, 8);
    g.fillStyle(0x330066);
    g.fillRect(20, 18, 15, 8);
    g.fillRect(40, 18, 15, 8);
    g.fillStyle(0xaa00ff);
    g.fillCircle(18, 30, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 30, 2);
    g.fillStyle(0x6600cc);
    g.fillRect(35, 30, 8, 5);
    g.lineStyle(2, 0xaa88ff);
    g.strokeRoundedRect(10, 10, 60, 35, 8);
    for (let i = 0; i < 5; i++) {
      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(15 + i * 10, 40, 1);
    }
    g.generateTexture('player_void', 80, 50);

    g.destroy();
  }

  // =========================================================================
  // ЗВУКОВЫЕ ЭФФЕКТЫ
  // =========================================================================

  playHoverSound() {
    const now = Date.now();
    if (now - this.lastHoverTime < 50) return;
    this.lastHoverTime = now;
    try { audioManager.playSound(this, 'tap_sound', 0.1); } catch (e) {}
  }

  playClickSound() {
    try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
  }

  playSelectSound() {
    try { audioManager.playSound(this, 'level_up_sound', 0.4); } catch (e) {}
  }

  playPurchaseSound() {
    try { audioManager.playSound(this, 'purchase_sound', 0.5); } catch (e) {}
  }

  // =========================================================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // =========================================================================

  showNoFunds() {
    this.showMessage('⚠ НЕДОСТАТОЧНО КРИСТАЛЛОВ ⚠', '#ff4444');
  }

  showMessage(text, color) {
    const w = this.scale.width;
    const h = this.scale.height;

    const msg = this.add.text(w / 2, h / 2, text, {
      fontSize: '28px',
      fontFamily: '"Audiowide", sans-serif',
      color: color,
      stroke: '#000000',
      strokeThickness: 5,
      backgroundColor: '#0a1a0a',
      padding: { x: 40, y: 20 },
      align: 'center',
      shadow: { blur: 15, color: color, fill: true }
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0);

    msg.setScale(0.5);
    this.tweens.add({
      targets: msg,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.out'
    });

    this.tweens.add({
      targets: msg,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1000,
      delay: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => msg.destroy()
    });
  }

  createConfetti(x, y, color) {
    for (let i = 0; i < 30; i++) {
      const particle = this.add.circle(x, y, Phaser.Math.Between(3, 8), color, 0.9);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(200, 500);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 300;
      
      this.tweens.add({
        targets: particle,
        x: x + vx * 0.6,
        y: y + vy * 0.6,
        alpha: 0,
        scale: 0,
        duration: 1200,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  startAnimations() {
    // Анимация мерцания звёзд
    this.time.addEvent({
      delay: 50,
      callback: () => {
        const time = Date.now() / 1000;
        this.stars.forEach(star => {
          star.sprite.alpha = star.baseAlpha + Math.sin(time * 5 * star.speed) * 0.3;
          if (!this.optimizeLowEnd) {
            star.sprite.rotation += 0.001;
          }
        });
      },
      loop: true
    });

    // Сканирующая линия (отключаем на слабых устройствах)
    if (!this.optimizeLowEnd) {
      const scanLine = this.add.graphics();
      let y = 0;
      this.tweens.add({
        targets: { y: 0 },
        y: this.scale.height,
        duration: 3000,
        repeat: -1,
        onUpdate: (tween) => {
          y = tween.getValue();
          scanLine.clear();
          scanLine.lineStyle(2, 0x00ffff, 0.2);
          scanLine.lineBetween(0, y, this.scale.width, y);
        }
      });
    }
  }

  update(time, delta) {
    // Плавная инерция для прокрутки
    if (!this.isDragging && Math.abs(this.scrollVelocity) > 0.01) {
      let newY = this.skinContainer.y + this.scrollVelocity;
      
      if (newY < this.minScrollY) {
        newY = this.minScrollY + (newY - this.minScrollY) * 0.2;
        this.scrollVelocity *= 0.5;
      } else if (newY > this.maxScrollY) {
        newY = this.maxScrollY + (newY - this.maxScrollY) * 0.2;
        this.scrollVelocity *= 0.5;
      }
      
      this.skinContainer.y = newY;
      this.scrollVelocity *= this.scrollDeceleration;
    }

    // Обновление позиции индикатора прокрутки
    if (this.scrollIndicator) {
      const scrollPercent = (this.skinContainer.y - this.maxScrollY) / (this.minScrollY - this.maxScrollY);
      const indicatorY = this.maxScrollY + 10 + (this.scrollIndicator.parentContainer?.height || 0) * scrollPercent;
      this.scrollIndicator.y = indicatorY;
    }
  }

  cleanupBeforeExit() {
    this.rotationTweens.forEach(t => t?.stop());
    this.floatTweens.forEach(t => t?.stop());
    this.particleEmitters.forEach(e => e?.destroy());
    if (this.hoverSoundTimer) this.hoverSoundTimer.remove();
  }

  onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.tweens.killAll();
    this.stars = [];
    this.neonButtons = [];
    this.particleEmitters = [];
    console.log('SkinShopScene: shutdown');
  }
}