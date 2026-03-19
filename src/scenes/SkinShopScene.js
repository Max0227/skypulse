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
    stats: {
      speedBonus: 0,
      armorBonus: 0,
      handlingBonus: 0,
      jumpBonus: 0
    },
    color: 0xffaa00,
    glowColor: 0xffaa00,
    effects: 'none'
  },
  { 
    id: 'taxi_blue', 
    name: 'BLUE CAB', 
    texture: 'player_taxi_blue',
    price: 50, 
    rarity: 'COMMON',
    description: 'Синее такси',
    stats: {
      speedBonus: 2,
      armorBonus: 1,
      handlingBonus: 1,
      jumpBonus: 0
    },
    color: 0x3366ff,
    glowColor: 0x44aaff,
    effects: 'none'
  },
  { 
    id: 'taxi_green', 
    name: 'GREEN CAB', 
    texture: 'player_taxi_green',
    price: 50, 
    rarity: 'COMMON',
    description: 'Зелёное такси',
    stats: {
      speedBonus: 2,
      armorBonus: 1,
      handlingBonus: 1,
      jumpBonus: 0
    },
    color: 0x33aa33,
    glowColor: 0x44ff44,
    effects: 'none'
  },

  // ===== РЕДКИЕ (RARE) =====
  { 
    id: 'police', 
    name: 'POLICE', 
    texture: 'player_police',
    price: 200, 
    rarity: 'RARE',
    description: 'Полицейский перехватчик',
    stats: {
      speedBonus: 10,
      armorBonus: 5,
      handlingBonus: 5,
      jumpBonus: 2
    },
    color: 0x2244aa,
    glowColor: 0x3366ff,
    effects: 'siren'
  },
  { 
    id: 'ambulance', 
    name: 'AMBULANCE', 
    texture: 'player_ambulance',
    price: 250, 
    rarity: 'RARE',
    description: 'Скорая помощь',
    stats: {
      speedBonus: 8,
      armorBonus: 10,
      handlingBonus: 2,
      jumpBonus: 3
    },
    color: 0xff4444,
    glowColor: 0xff6666,
    effects: 'siren'
  },
  { 
    id: 'taxi_neon_blue', 
    name: 'NEON BLUE', 
    texture: 'player_taxi_neon_blue',
    price: 300, 
    rarity: 'RARE',
    description: 'Неоновое синее такси',
    stats: {
      speedBonus: 12,
      armorBonus: 3,
      handlingBonus: 8,
      jumpBonus: 4
    },
    color: 0x00aaff,
    glowColor: 0x44ddff,
    effects: 'neon'
  },

  // ===== ЭПИЧЕСКИЕ (EPIC) =====
  { 
    id: 'sport_red', 
    name: 'INFERNO', 
    texture: 'player_sport_red',
    price: 400, 
    rarity: 'EPIC',
    description: 'Спортивный красный',
    stats: {
      speedBonus: 20,
      armorBonus: 8,
      handlingBonus: 15,
      jumpBonus: 10
    },
    color: 0xff3333,
    glowColor: 0xff5500,
    effects: 'flames'
  },
  { 
    id: 'sport_blue', 
    name: 'NIGHTBLADE', 
    texture: 'player_sport_blue',
    price: 450, 
    rarity: 'EPIC',
    description: 'Спортивный синий',
    stats: {
      speedBonus: 18,
      armorBonus: 10,
      handlingBonus: 20,
      jumpBonus: 8
    },
    color: 0x3366ff,
    glowColor: 0x44aaff,
    effects: 'glow'
  },
  { 
    id: 'fire_truck', 
    name: 'PYRO', 
    texture: 'player_firetruck',
    price: 350, 
    rarity: 'EPIC',
    description: 'Пожарная машина',
    stats: {
      speedBonus: 12,
      armorBonus: 25,
      handlingBonus: 5,
      jumpBonus: 5
    },
    color: 0xff3333,
    glowColor: 0xff5555,
    effects: 'flames'
  },
  { 
    id: 'taxi_neon', 
    name: 'NEON', 
    texture: 'player_taxi_neon',
    price: 500, 
    rarity: 'EPIC',
    description: 'Неоновое такси',
    stats: {
      speedBonus: 15,
      armorBonus: 12,
      handlingBonus: 15,
      jumpBonus: 10
    },
    color: 0x00ffff,
    glowColor: 0x88ffff,
    effects: 'neon'
  },
  { 
    id: 'taxi_neon_pink', 
    name: 'PINK NEON', 
    texture: 'player_taxi_neon_pink',
    price: 550, 
    rarity: 'EPIC',
    description: 'Розовое неоновое такси',
    stats: {
      speedBonus: 16,
      armorBonus: 10,
      handlingBonus: 18,
      jumpBonus: 12
    },
    color: 0xff44aa,
    glowColor: 0xff88cc,
    effects: 'neon'
  },

  // ===== ЛЕГЕНДАРНЫЕ (LEGENDARY) =====
  { 
    id: 'monster_truck', 
    name: 'BEAST', 
    texture: 'player_monster',
    price: 600, 
    rarity: 'LEGENDARY',
    description: 'Монстр-трак',
    stats: {
      speedBonus: 25,
      armorBonus: 40,
      handlingBonus: 5,
      jumpBonus: 15
    },
    color: 0xcc6600,
    glowColor: 0xff8800,
    effects: 'monster'
  },
  { 
    id: 'formula', 
    name: 'F-ZERO', 
    texture: 'player_formula',
    price: 800, 
    rarity: 'LEGENDARY',
    description: 'Формула-1',
    stats: {
      speedBonus: 50,
      armorBonus: 5,
      handlingBonus: 30,
      jumpBonus: 25
    },
    color: 0xff6600,
    glowColor: 0xffaa00,
    effects: 'formula'
  },
  { 
    id: 'taxi_gold', 
    name: 'GOLDEN', 
    texture: 'player_taxi_gold',
    price: 1000, 
    rarity: 'LEGENDARY',
    description: 'Золотое такси',
    stats: {
      speedBonus: 40,
      armorBonus: 30,
      handlingBonus: 30,
      jumpBonus: 20
    },
    color: 0xffaa00,
    glowColor: 0xffdd44,
    effects: 'gold'
  },
  { 
    id: 'cyber_taxi', 
    name: 'CYBER', 
    texture: 'player_cyber',
    price: 1200, 
    rarity: 'LEGENDARY',
    description: 'Кибертакси 2077',
    stats: {
      speedBonus: 60,
      armorBonus: 25,
      handlingBonus: 40,
      jumpBonus: 30
    },
    color: 0xaa44ff,
    glowColor: 0xcc88ff,
    effects: 'cyber'
  },
  { 
    id: 'void_car', 
    name: 'VOID', 
    texture: 'player_void',
    price: 1500, 
    rarity: 'LEGENDARY',
    description: 'Пожиратель пустоты',
    stats: {
      speedBonus: 75,
      armorBonus: 35,
      handlingBonus: 35,
      jumpBonus: 40
    },
    color: 0x4400aa,
    glowColor: 0x8800ff,
    effects: 'void'
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
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('SkinShop: create started');

    // Создаём все текстуры скинов
    this.createAllSkinTextures();

    // ===== ЭПИЧЕСКИЙ КИБЕРПАНК-ФОН =====
    this.createCyberpunkBackground();

    // ===== ПАРЯЩИЕ НЕОНОВЫЕ ЧАСТИЦЫ =====
    this.createFloatingParticles();

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
  // СОЗДАНИЕ ФОНА
  // =========================================================================

  createCyberpunkBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Базовый черный фон
    this.add.rectangle(0, 0, w, h, 0x030712).setOrigin(0);

    // Многослойный градиент для глубины
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
      
      // Легкое движение градиента
      this.tweens.add({
        targets: gradientImage,
        y: index * 5,
        duration: 8000 + index * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
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
      
      this.tweens.add({
        targets: blur,
        alpha: 0.02,
        scale: 1.2,
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  createAnimatedGrid() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.grid = this.add.graphics();
    
    this.tweens.add({
      targets: this,
      gridOffset: 20,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      onUpdate: () => this.updateGrid()
    });
    
    this.updateGrid();

    // Точки на пересечениях
    for (let i = 0; i < w; i += 40) {
      for (let j = 0; j < h; j += 40) {
        if (Math.random() > 0.7) {
          const dot = this.add.circle(i, j, 2, 0x00ffff, 0.3);
          dot.setBlendMode(Phaser.BlendModes.ADD);
          
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

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < 150; i++) {
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
      fontSize: '48px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 6,
      shadow: { 
        offsetX: 0, 
        offsetY: 0, 
        color: '#00ffff', 
        blur: 25, 
        fill: true,
        stroke: true
      }
    }).setOrigin(0.5);

    // Копия для свечения
    this.titleGlow = this.add.text(w / 2, 50, 'МАГАЗИН СКИНОВ', {
      fontSize: '48px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#ff00ff',
      strokeThickness: 3,
      alpha: 0.5
    }).setOrigin(0.5);

    // Анимация заголовка
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

    this.tweens.add({
      targets: crystalIcon,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    });

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

  // =========================================================================
  // СОЗДАНИЕ ПРОКРУЧИВАЕМОГО СПИСКА СКИНОВ
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
      
      currentY += cardSpacing;
    });

    // Отступ внизу
    this.skinContainer.add(this.add.rectangle(0, currentY, 10, 30, 0x000000, 0));

    // Система прокрутки
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

    // Превью
    const preview = this.add.image(50, y + 60, skin.texture)
      .setScale(1.0)
      .setOrigin(0.5);

    // Название
    const nameText = this.add.text(120, y + 30, skin.name, {
      fontSize: '18px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: borderColor === 0x00ffff ? '#00ffff' : '#888888',
      strokeThickness: 1
    }).setOrigin(0, 0.5);

    // Редкость (русские названия)
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
    const rarityText = this.add.text(120, y + 55, `[${rarityNames[skin.rarity]}]`, {
      fontSize: '11px',
      fontFamily: '"Share Tech Mono", monospace',
      color: rarityColors[skin.rarity]
    }).setOrigin(0, 0.5);

    // Статы
    const statsText = this.add.text(120, y + 85, 
      `⚡+${skin.stats.speedBonus}  🛡️+${skin.stats.armorBonus}  🌀+${skin.stats.handlingBonus}  🚀+${skin.stats.jumpBonus}`,
      {
        fontSize: '11px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#88ff88'
      }
    ).setOrigin(0, 0.5);

    // Статус/цена (русский текст)
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
    }).setOrigin(1, 0.5);

    elements.push(bg, preview, nameText, rarityText, statsText, status);

    // Интерактивная область
    const hitArea = this.add.rectangle(w / 2, y + 60, w - 40, 120, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5);

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
      pointer.event.stopPropagation();
      this.playClickSound();
      this.openSkinDetail(skin);
    });

    elements.push(hitArea);
    return { elements };
  }

  setupScrolling(listTop, listHeight, totalHeight) {
    const w = this.scale.width;
    
    const scrollZone = this.add.zone(0, listTop, w, listHeight).setOrigin(0).setInteractive();
    let startY = 0;
    let startContainerY = 0;
    let velocity = 0;
    let lastY = 0;
    let isDragging = false;

    const minY = -(totalHeight - listHeight + 50);
    const maxY = listTop;

    scrollZone.on('pointerdown', (pointer) => {
      startY = pointer.y;
      startContainerY = this.skinContainer.y;
      lastY = pointer.y;
      isDragging = true;
      velocity = 0;
    });

    scrollZone.on('pointermove', (pointer) => {
      if (!pointer.isDown || !isDragging) return;
      
      const deltaY = pointer.y - lastY;
      velocity = deltaY * 0.5;
      
      let newY = this.skinContainer.y + deltaY;
      
      if (newY < minY) {
        newY = minY + (newY - minY) * 0.2;
      } else if (newY > maxY) {
        newY = maxY + (newY - maxY) * 0.2;
      }
      
      this.skinContainer.y = newY;
      lastY = pointer.y;
    });

    scrollZone.on('pointerup', () => {
      isDragging = false;
      
      if (Math.abs(velocity) > 1) {
        this.tweens.add({
          targets: this.skinContainer,
          y: this.skinContainer.y + velocity * 5,
          duration: 500,
          ease: 'Power2.easeOut',
          onUpdate: () => {
            this.skinContainer.y = Phaser.Math.Clamp(this.skinContainer.y, minY, maxY);
          }
        });
      }
    });

    // Индикатор прокрутки
    if (totalHeight > listHeight) {
      const scrollTrack = this.add.graphics();
      scrollTrack.fillStyle(0x333333, 0.5);
      scrollTrack.fillRoundedRect(w - 20, listTop + 10, 6, listHeight - 20, 3);
      
      const indicatorHeight = (listHeight - 20) * listHeight / totalHeight;
      const indicator = this.add.graphics();
      indicator.fillStyle(0x00ffff, 0.8);
      indicator.fillRoundedRect(w - 20, listTop + 10, 6, indicatorHeight, 3);
      
      this.tweens.add({
        targets: indicator,
        alpha: 0.5,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      
      this.events.on('update', () => {
        const scrollPercent = (this.skinContainer.y - listTop) / (minY - listTop);
        const indicatorY = listTop + 10 + (listHeight - 20 - indicatorHeight) * scrollPercent;
        indicator.y = indicatorY;
      });
    }
  }

  // =========================================================================
  // ДЕТАЛЬНОЕ ОКНО СКИНА
  // =========================================================================

  openSkinDetail(skin) {
    const w = this.scale.width;
    const h = this.scale.height;

    const owned = gameManager.getOwnedSkins().includes(skin.id);
    const selected = gameManager.getCurrentSkin() === skin.id;
    const canAfford = gameManager.data.crystals >= skin.price;

    // Затемнение фона
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85)
      .setDepth(50)
      .setScrollFactor(0)
      .setInteractive();

    // Панель
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.95);
    panel.fillRoundedRect(w / 2 - 200, h / 2 - 200, 400, 400, 20);
    panel.lineStyle(4, skin.rarity === 'LEGENDARY' ? 0xffaa00 : 0x00ffff, 1);
    panel.strokeRoundedRect(w / 2 - 200, h / 2 - 200, 400, 400, 20);
    panel.setDepth(51);

    // Превью с анимацией
    const preview = this.add.image(w / 2, h / 2 - 80, skin.texture)
      .setScale(2.5)
      .setDepth(52)
      .setScrollFactor(0);

    this.tweens.add({
      targets: preview,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: 'Linear'
    });

    // Название
    this.add.text(w / 2, h / 2, skin.name, {
      fontSize: '24px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    // Описание
    this.add.text(w / 2, h / 2 + 30, skin.description, {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#aaccff',
      align: 'center',
      wordWrap: { width: 300 }
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    // Характеристики (русские подписи)
    const stats = [
      { label: 'СКОРОСТЬ', value: skin.stats.speedBonus, icon: '⚡', color: 0xffff00 },
      { label: 'БРОНЯ', value: skin.stats.armorBonus, icon: '🛡️', color: 0x00ffff },
      { label: 'УПРАВЛЕНИЕ', value: skin.stats.handlingBonus, icon: '🌀', color: 0xff00ff },
      { label: 'ПРЫЖОК', value: skin.stats.jumpBonus, icon: '🚀', color: 0xff8800 }
    ];

    let yPos = h / 2 + 70;
    stats.forEach(stat => {
      this.add.text(w / 2 - 100, yPos, `${stat.icon} ${stat.label}:`, {
        fontSize: '14px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(52).setScrollFactor(0);

      const sign = stat.value >= 0 ? '+' : '';
      const color = stat.value >= 0 ? '#88ff88' : '#ff8888';
      this.add.text(w / 2 + 100, yPos, `${sign}${stat.value}`, {
        fontSize: '16px',
        fontFamily: '"Audiowide", sans-serif',
        color: color
      }).setOrigin(1, 0.5).setDepth(52).setScrollFactor(0);
      yPos += 25;
    });

    // Кнопки
    const buttonY = h / 2 + 170;
    if (!owned) {
      const buyBtn = this.createDetailButton(w / 2 - 80, buttonY, 'КУПИТЬ', '#00ff00', '#00aa00');
      buyBtn.setDepth(52).setScrollFactor(0);
      
      buyBtn.on('pointerdown', () => {
        if (canAfford) {
          overlay.destroy();
          panel.destroy();
          preview.destroy();
          buyBtn.destroy();
          this.confirmPurchase(skin);
        } else {
          this.showNoFunds();
        }
      });
    } else if (!selected) {
      const selectBtn = this.createDetailButton(w / 2 - 80, buttonY, 'ВЫБРАТЬ', '#00ffff', '#0088aa');
      selectBtn.setDepth(52).setScrollFactor(0);
      
      selectBtn.on('pointerdown', () => {
        this.selectSkin(skin);
        overlay.destroy();
        panel.destroy();
        preview.destroy();
        selectBtn.destroy();
      });
    } else {
      this.add.text(w / 2, buttonY, 'ВЫБРАНО', {
        fontSize: '18px',
        fontFamily: '"Audiowide", sans-serif',
        color: '#00ff00',
        backgroundColor: '#1a3a1a',
        padding: { x: 20, y: 10 }
      }).setDepth(52).setScrollFactor(0).setOrigin(0.5);
    }

    // Кнопка закрытия
    const closeBtn = this.add.text(w - 40, h / 2 - 180, '✕', {
      fontSize: '32px',
      fontFamily: 'sans-serif',
      color: '#ff4444'
    }).setInteractive().setDepth(52).setScrollFactor(0).setOrigin(0.5);

    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: '#ff8888' }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ color: '#ff4444' }));
    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      preview.destroy();
      closeBtn.destroy();
    });
  }

  createDetailButton(x, y, text, color, hoverColor) {
    const btn = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      backgroundColor: '#1a1a3a',
      padding: { x: 20, y: 10 },
      stroke: color,
      strokeThickness: 2
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setStyle({ color: '#ffffff', backgroundColor: hoverColor });
      btn.setScale(1.1);
      this.playHoverSound();
    });

    btn.on('pointerout', () => {
      btn.setStyle({ color: '#ffffff', backgroundColor: '#1a1a3a', stroke: color });
      btn.setScale(1);
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

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.95)
      .setDepth(50).setScrollFactor(0);

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
          overlay.destroy();
          panel.destroy();
          preview.destroy();
          priceText.destroy();
          yesBtn.destroy();
          noBtn.destroy();
          this.scene.restart();
        });
      }
    });

    noBtn.on('pointerdown', () => {
      this.playClickSound();
      overlay.destroy();
      panel.destroy();
      preview.destroy();
      priceText.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    });
  }

  // =========================================================================
  // НИЖНЯЯ ПАНЕЛЬ
  // =========================================================================

  createFooter() {
    const w = this.scale.width;
    const h = this.scale.height;

    const footerLine = this.add.graphics();
    footerLine.lineStyle(2, 0x00ffff, 0.3);
    footerLine.lineBetween(50, h - 45, w - 50, h - 45);

    // Статистика коллекции
    const ownedCount = gameManager.getOwnedSkins().length;
    const totalCount = SKINS.length;
    const collectionText = this.add.text(30, h - 30, `📊 СОБРАНО: ${ownedCount}/${totalCount}`, {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff'
    }).setOrigin(0, 0.5);

    // Кнопка назад
    const backBtn = this.add.text(w / 2, h - 30, '⏎ НАЗАД В МЕНЮ', {
      fontSize: '22px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 3,
      padding: { x: 30, y: 8 },
      backgroundColor: '#1a1a3a'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => {
      backBtn.setStyle({ color: '#ffffff', backgroundColor: '#2a2a5a' });
      backBtn.setScale(1.05);
      this.playHoverSound();
    });

    backBtn.on('pointerout', () => {
      backBtn.setStyle({ color: '#00ffff', backgroundColor: '#1a1a3a' });
      backBtn.setScale(1);
    });

    backBtn.on('pointerdown', () => {
      this.playClickSound();
      this.cleanupBeforeExit();
      this.scene.start('menu');
    });

    // Версия
    this.add.text(w - 30, h - 30, 'v3.5.0', {
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#666666'
    }).setOrigin(1, 0.5);

    // Декоративные огни
    [-1, 1].forEach(side => {
      const x = side === -1 ? 30 : w - 30;
      
      const light = this.add.circle(x, h - 30, 5, 0x00ffff, 0.5);
      light.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: light,
        alpha: 0.2,
        scale: 1.5,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        delay: side === -1 ? 0 : 500
      });
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
          star.sprite.rotation += 0.001;
        });
      },
      loop: true
    });

    // Сканирующая линия
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