import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

// =========================================================================
// РАСШИРЕННЫЙ СПИСОК СКИНОВ С БОНУСАМИ И РЕДКОСТЬЮ
// =========================================================================

const SKINS = [
  // ===== ОБЫЧНЫЕ (COMMON) =====
  { 
    id: 'taxi_classic', 
    name: 'CLASSIC TAXI', 
    texture: 'player_taxi_classic',
    price: 0, 
    rarity: 'COMMON',
    description: 'OG yellow cab',
    speedBonus: 0,
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
    description: 'Blue variant',
    speedBonus: 2,
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
    description: 'Green variant',
    speedBonus: 2,
    color: 0x33aa33,
    glowColor: 0x44ff44,
    effects: 'none'
  },

  // ===== РЕДКИЕ (RARE) =====
  { 
    id: 'police', 
    name: 'POLICE INTERCEPTOR', 
    texture: 'player_police',
    price: 200, 
    rarity: 'RARE',
    description: 'Pursuit mode activated',
    speedBonus: 10,
    color: 0x2244aa,
    glowColor: 0x3366ff,
    effects: 'siren'
  },
  { 
    id: 'ambulance', 
    name: 'MEDIC RESPONDER', 
    texture: 'player_ambulance',
    price: 250, 
    rarity: 'RARE',
    description: 'Emergency! Clear the way',
    speedBonus: 10,
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
    description: 'Blue neon glow',
    speedBonus: 12,
    color: 0x00aaff,
    glowColor: 0x44ddff,
    effects: 'neon'
  },

  // ===== ЭПИЧЕСКИЕ (EPIC) =====
  { 
    id: 'sport_red', 
    name: 'INFERNO COUPE', 
    texture: 'player_sport_red',
    price: 400, 
    rarity: 'EPIC',
    description: 'Burning asphalt',
    speedBonus: 20,
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
    description: 'Slice through the dark',
    speedBonus: 20,
    color: 0x3366ff,
    glowColor: 0x44aaff,
    effects: 'glow'
  },
  { 
    id: 'fire_truck', 
    name: 'PYRO UNIT', 
    texture: 'player_firetruck',
    price: 350, 
    rarity: 'EPIC',
    description: 'Firefighter hero',
    speedBonus: 15,
    color: 0xff3333,
    glowColor: 0xff5555,
    effects: 'flames'
  },
  { 
    id: 'taxi_neon', 
    name: 'NEON DRIFTER', 
    texture: 'player_taxi_neon',
    price: 500, 
    rarity: 'EPIC',
    description: 'Glow in the dark',
    speedBonus: 15,
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
    description: 'Hot pink glow',
    speedBonus: 18,
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
    description: 'Crush everything',
    speedBonus: 30,
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
    description: 'Beyond speed limits',
    speedBonus: 40,
    color: 0xff6600,
    glowColor: 0xffaa00,
    effects: 'formula'
  },
  { 
    id: 'taxi_gold', 
    name: 'GOLDEN GOD', 
    texture: 'player_taxi_gold',
    price: 1000, 
    rarity: 'LEGENDARY',
    description: 'Flex on everyone',
    speedBonus: 50,
    color: 0xffaa00,
    glowColor: 0xffdd44,
    effects: 'gold'
  },
  { 
    id: 'cyber_taxi', 
    name: 'CYBER CAB 2077', 
    texture: 'player_cyber',
    price: 1200, 
    rarity: 'LEGENDARY',
    description: 'The future is now',
    speedBonus: 60,
    color: 0xaa44ff,
    glowColor: 0xcc88ff,
    effects: 'cyber'
  },
  { 
    id: 'void_car', 
    name: 'VOID REAVER', 
    texture: 'player_void',
    price: 1500, 
    rarity: 'LEGENDARY',
    description: 'Consumes light',
    speedBonus: 75,
    color: 0x4400aa,
    glowColor: 0x8800ff,
    effects: 'void'
  }
];

export class SkinShopScene extends Phaser.Scene {
  constructor() {
    super('skinShop');
    this.rotationTweens = [];
    this.floatTweens = [];
    this.particleEmitters = [];
    this.cards = [];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('SkinShop: Creating scene...');

    // Создаём все текстуры скинов
    this.createAllSkinTextures();

    // Эпический киберпанк-фон с анимацией
    this.createCyberpunkBackground();

    // Верхняя панель с заголовком и балансом
    this.createHeader();

    // Основной список скинов с прокруткой
    this.createScrollableSkinList();

    // Нижняя панель с кнопками
    this.createFooter();

    // Запускаем фоновые анимации
    this.startBackgroundAnimations();

    console.log('SkinShop: Scene created');
  }

  // =========================================================================
  // СОЗДАНИЕ ФОНА
  // =========================================================================

  createCyberpunkBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Базовый черный фон
    this.add.rectangle(0, 0, w, h, 0x030712).setOrigin(0);

    // Анимированный градиент
    for (let layer = 0; layer < 3; layer++) {
      const alpha = 0.1 + layer * 0.05;
      const offset = layer * 20;
      
      const gradientTexture = this.make.graphics({ x: 0, y: 0, add: false });
      gradientTexture.fillGradientStyle(
        0x030712 + layer * 0x000101, 
        0x030712 + layer * 0x000101, 
        0x0a0a1a + layer * 0x010101, 
        0x0a0a1a + layer * 0x010101, 
        alpha
      );
      gradientTexture.fillRect(0, 0, w, h);
      gradientTexture.generateTexture(`gradient_${layer}`, w, h);
      gradientTexture.destroy();
      
      this.add.image(0, offset * 0.5, `gradient_${layer}`).setOrigin(0).setAlpha(0.8);
    }

    // Кибер-сетка с анимацией
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x00ffff, 0.15);
    
    for (let i = 0; i < w; i += 40) {
      grid.moveTo(i, 0);
      grid.lineTo(i, h);
    }
    for (let i = 0; i < h; i += 40) {
      grid.moveTo(0, i);
      grid.lineTo(w, i);
    }
    grid.strokePath();

    // Анимированные неоновые линии по краям
    const borderTop = this.add.graphics();
    const borderBottom = this.add.graphics();
    const borderLeft = this.add.graphics();
    const borderRight = this.add.graphics();

    this.tweens.add({
      targets: { alpha: 0.2 },
      alpha: 0.8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      onUpdate: (tween) => {
        const alpha = tween.getValue();
        borderTop.clear();
        borderTop.lineStyle(2, 0x00ffff, alpha);
        borderTop.lineBetween(0, 0, w, 0);
        
        borderBottom.clear();
        borderBottom.lineStyle(2, 0xff00ff, alpha);
        borderBottom.lineBetween(0, h, w, h);
        
        borderLeft.clear();
        borderLeft.lineStyle(2, 0xffff00, alpha);
        borderLeft.lineBetween(0, 0, 0, h);
        
        borderRight.clear();
        borderRight.lineStyle(2, 0x00ff00, alpha);
        borderRight.lineBetween(w, 0, w, h);
      }
    });

    // Парящие неоновые частицы
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const size = Phaser.Math.FloatBetween(1, 3);
      const color = Phaser.Utils.Array.GetRandom([0x00ffff, 0xff00ff, 0xffff00, 0x00ff00]);
      
      const particle = this.add.circle(x, y, size, color, 0.3);
      
      const tween = this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-50, 50),
        y: y + Phaser.Math.Between(-30, 30),
        alpha: 0.1,
        duration: Phaser.Math.Between(2000, 5000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.floatTweens.push(tween);
    }

    // Сканирующие линии
    const scanner = this.add.graphics();
    let scannerY = 0;
    
    this.tweens.add({
      targets: { y: 0 },
      y: h,
      duration: 3000,
      repeat: -1,
      onUpdate: (tween) => {
        scannerY = tween.getValue();
        scanner.clear();
        scanner.lineStyle(2, 0x00ffff, 0.3);
        scanner.lineBetween(0, scannerY, w, scannerY);
      }
    });
  }

  // =========================================================================
  // СОЗДАНИЕ ЗАГОЛОВКА
  // =========================================================================

  createHeader() {
    const w = this.scale.width;

    // Неоновый заголовок с эффектом мерцания
    const title = this.add.text(w / 2, 35, 'SKIN VAULT', {
      fontSize: '36px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 20, fill: true }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      alpha: 0.9,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Баланс кристаллов с красивым дизайном
    const balanceContainer = this.add.container(w / 2, 85);
    
    // Фон с пульсацией
    const balanceBg = this.add.rectangle(0, 0, 240, 45, 0x0a0a1a, 0.95)
      .setStrokeStyle(3, 0x00ffff, 0.8)
      .setOrigin(0.5);
    
    // Внутреннее свечение
    const balanceGlow = this.add.rectangle(0, 0, 236, 41, 0x000000, 0)
      .setStrokeStyle(2, 0x00ffff, 0.4)
      .setOrigin(0.5);
    
    // Иконка кристалла
    const crystalIcon = this.add.text(-40, 0, '💎', {
      fontSize: '24px'
    }).setOrigin(0.5);
    
    // Текст баланса
    const balanceText = this.add.text(10, 0, gameManager.data.crystals.toString(), {
      fontSize: '26px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5);

    balanceContainer.add([balanceBg, balanceGlow, crystalIcon, balanceText]);
    this.balanceText = balanceText;

    // Анимация пульсации фона
    this.tweens.add({
      targets: balanceBg,
      scaleX: 1.05,
      scaleY: 1.1,
      alpha: 0.8,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Украшения по бокам
    const leftGlow = this.add.graphics();
    leftGlow.fillStyle(0x00ffff, 0.2);
    leftGlow.fillCircle(20, 85, 15);
    
    const rightGlow = this.add.graphics();
    rightGlow.fillStyle(0xff00ff, 0.2);
    rightGlow.fillCircle(w - 20, 85, 15);
  }

  // =========================================================================
  // СОЗДАНИЕ ПРОКРУЧИВАЕМОГО СПИСКА СКИНОВ
  // =========================================================================

  createScrollableSkinList() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Создаем маску для области прокрутки
    const maskArea = this.add.graphics();
    maskArea.fillStyle(0xffffff);
    maskArea.fillRect(10, 120, w - 20, h - 180);
    const mask = maskArea.createGeometryMask();

    // Основной контейнер для всех карточек
    const container = this.add.container(0, 120);
    container.setMask(mask);

    // Сортируем скины по редкости
    const rarityOrder = { 'COMMON': 0, 'RARE': 1, 'EPIC': 2, 'LEGENDARY': 3 };
    const sortedSkins = [...SKINS].sort((a, b) => {
      if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      }
      return a.price - b.price;
    });

    let currentY = 10;
    const cardSpacing = 140;
    this.cards = [];

    // Группируем скины по редкости для отображения разделителей
    let currentRarity = null;

    sortedSkins.forEach((skin) => {
      // Добавляем разделитель при смене редкости
      if (skin.rarity !== currentRarity) {
        currentRarity = skin.rarity;
        
        const rarityColors = {
          'COMMON': '#aaaaaa',
          'RARE': '#44aaff',
          'EPIC': '#ff44aa',
          'LEGENDARY': '#ffaa00'
        };
        
        const separator = this.add.text(w / 2, currentY, `⚡ ${skin.rarity} ⚡`, {
          fontSize: '18px',
          fontFamily: '"Audiowide", sans-serif',
          color: rarityColors[skin.rarity],
          stroke: '#000000',
          strokeThickness: 3,
          shadow: { blur: 10, color: rarityColors[skin.rarity], fill: true }
        }).setOrigin(0.5);
        
        container.add(separator);
        currentY += 35;
      }

      const owned = gameManager.getOwnedSkins().includes(skin.id);
      const selected = gameManager.getCurrentSkin() === skin.id;
      const canAfford = gameManager.data.crystals >= skin.price;

      // Создаем карточку скина
      const card = this.createSkinCard(skin, w, currentY, owned, selected, canAfford);
      container.add(card.elements);
      this.cards.push(card);
      
      currentY += cardSpacing;
    });

    // Добавляем отступ внизу
    container.add(this.add.rectangle(0, currentY, 10, 30, 0x000000, 0));

    // Система прокрутки
    const scrollZone = this.add.zone(0, 120, w, h - 180).setOrigin(0).setInteractive();
    let startY = 0;
    let startContainerY = 0;

    scrollZone.on('pointerdown', (pointer) => {
      startY = pointer.y;
      startContainerY = container.y;
    });

    scrollZone.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      
      const deltaY = pointer.y - startY;
      let newY = startContainerY + deltaY;
      
      const minY = -(currentY - (h - 180));
      const maxY = 120;
      newY = Phaser.Math.Clamp(newY, minY, maxY);
      
      container.y = newY;
    });

    // Индикатор прокрутки
    if (currentY > h - 180) {
      this.createScrollIndicator(w, h, currentY);
    }
  }

  createScrollIndicator(w, h, totalHeight) {
    const indicatorBg = this.add.graphics();
    indicatorBg.fillStyle(0x333333, 0.5);
    indicatorBg.fillRoundedRect(w - 15, 130, 5, h - 200, 3);
    
    const indicatorHeight = (h - 200) * (h - 180) / totalHeight;
    const indicator = this.add.graphics();
    indicator.fillStyle(0x00ffff, 0.8);
    indicator.fillRoundedRect(w - 15, 130, 5, indicatorHeight, 3);
    
    this.tweens.add({
      targets: indicator,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
  }

  // =========================================================================
  // СОЗДАНИЕ КАРТОЧКИ СКИНА (САМАЯ ВАЖНАЯ ЧАСТЬ)
  // =========================================================================

  createSkinCard(skin, w, y, owned, selected, canAfford) {
    const elements = [];

    // Определяем цвета в зависимости от статуса
    let borderColor = 0x666666;
    let borderGlow = 0x00ffff;
    let bgColor = 0x0d0d1a;
    let accentColor = '#ffffff';
    
    if (selected) {
      borderColor = 0x00ff00;
      borderGlow = 0x00ff00;
      bgColor = 0x1a3a1a;
      accentColor = '#00ff00';
    } else if (owned) {
      borderColor = 0x00ffff;
      borderGlow = 0x00ffff;
      bgColor = 0x1a2a3a;
      accentColor = '#00ffff';
    } else if (skin.price === 0) {
      borderColor = 0xffaa00;
      borderGlow = 0xffaa00;
      accentColor = '#ffaa00';
    } else if (canAfford) {
      borderColor = 0xffaa00;
      borderGlow = 0xffaa00;
      accentColor = '#ffaa00';
    }

    // Основной фон карточки
    const bg = this.add.rectangle(w / 2, y + 50, w - 40, 130, bgColor, 0.95)
      .setStrokeStyle(3, borderColor, 1)
      .setInteractive({ useHandCursor: true, cursor: 'pointer' });

    // Внутреннее свечение
    const innerGlow = this.add.rectangle(w / 2, y + 50, w - 44, 126, 0x000000, 0)
      .setStrokeStyle(1, borderGlow, 0.3);

    // Превью скина
    const preview = this.add.image(50, y + 55, skin.texture)
      .setScale(1.0)
      .setOrigin(0, 0.5);

    // Название скина
    const nameText = this.add.text(130, y + 30, skin.name, {
      fontSize: '22px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: borderColor === 0x00ffff ? '#00ffff' : '#aaaaaa',
      strokeThickness: 2,
      shadow: { blur: 5, color: accentColor, fill: true }
    }).setOrigin(0, 0.5);

    // Описание
    const descText = this.add.text(130, y + 60, skin.description, {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#aaccff'
    }).setOrigin(0, 0.5);

    // Редкость
    const rarityColors = {
      'COMMON': '#aaaaaa',
      'RARE': '#44aaff',
      'EPIC': '#ff44aa',
      'LEGENDARY': '#ffaa00'
    };
    
    const rarityText = this.add.text(130, y + 85, `[${skin.rarity}]`, {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: rarityColors[skin.rarity],
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Бонус скорости - КРАСИВЫЙ ДИЗАЙН
    if (skin.speedBonus > 0) {
      this.createSpeedBonusBadge(skin, w, y, elements);
    }

    // СТАТУС И ЦЕНА - КРАСИВЫЙ ДИЗАЙН
    this.createStatusBadge(skin, w, y, owned, selected, canAfford, elements);

    // Индикаторы эффектов
    if (skin.effects !== 'none') {
      this.createEffectIcon(skin, w, y, elements);
    }

    // Собираем все элементы
    elements.push(bg, innerGlow, preview, nameText, descText, rarityText);

    // Эффекты наведения
    this.addHoverEffects(bg, preview, bgColor);

    // Обработка клика
    bg.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      this.playClickSound();
      
      console.log('Skin clicked:', skin.id, { owned, selected, canAfford });
      
      if (owned && !selected) {
        this.selectSkin(skin);
      } else if (!owned && (skin.price === 0 || canAfford)) {
        this.confirmPurchase(skin);
      } else if (!canAfford && !owned) {
        this.showNoFunds();
      }
    });

    return { elements, bg, preview };
  }

  createSpeedBonusBadge(skin, w, y, elements) {
    const bonusBg = this.add.graphics();
    bonusBg.fillStyle(0x1a3a1a, 0.9);
    bonusBg.fillRoundedRect(210, y + 95, 80, 28, 14);
    bonusBg.lineStyle(2, 0x00ff00, 0.5);
    bonusBg.strokeRoundedRect(210, y + 95, 80, 28, 14);
    
    const speedIcon = this.add.text(220, y + 109, '⚡', {
      fontSize: '18px',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    const bonusText = this.add.text(250, y + 109, `+${skin.speedBonus}%`, {
      fontSize: '16px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#00ff00'
    }).setOrigin(0, 0.5);
    
    elements.push(bonusBg, speedIcon, bonusText);
  }

  createStatusBadge(skin, w, y, owned, selected, canAfford, elements) {
    let statusContent = '';
    let statusColor = '#666666';
    let statusBg = 0x1a1a2a;
    let icon = '';
    
    if (selected) {
      statusContent = 'EQUIPPED';
      statusColor = '#00ff00';
      statusBg = 0x1a3a1a;
      icon = '✓';
    } else if (owned) {
      statusContent = 'OWNED';
      statusColor = '#00ffff';
      statusBg = 0x1a2a3a;
      icon = '✓';
    } else if (skin.price === 0) {
      statusContent = 'FREE';
      statusColor = '#ffaa00';
      statusBg = 0x3a2a1a;
      icon = '🎁';
    } else {
      statusContent = skin.price.toString();
      statusColor = canAfford ? '#ffaa00' : '#ff4444';
      statusBg = canAfford ? 0x3a2a1a : 0x3a1a1a;
      icon = '💎';
    }

    // Фон для статуса
    const statusBgGraphic = this.add.graphics();
    statusBgGraphic.fillStyle(statusBg, 0.9);
    statusBgGraphic.fillRoundedRect(w - 140, y + 35, 100, 40, 20);
    statusBgGraphic.lineStyle(2, parseInt(statusColor.replace('#', '0x'), 16), 0.7);
    statusBgGraphic.strokeRoundedRect(w - 140, y + 35, 100, 40, 20);

    // Иконка
    const iconText = this.add.text(w - 125, y + 55, icon, {
      fontSize: selected || owned ? '20px' : '18px',
      color: statusColor
    }).setOrigin(0.5);

    // Текст статуса/цены
    const statusText = this.add.text(w - (selected || owned ? 85 : 75), y + 55, statusContent, {
      fontSize: selected || owned ? '16px' : '20px',
      fontFamily: '"Audiowide", sans-serif',
      color: statusColor,
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    elements.push(statusBgGraphic, iconText, statusText);
  }

  createEffectIcon(skin, w, y, elements) {
    let effectIcon = '';
    switch(skin.effects) {
      case 'siren': effectIcon = '🚨'; break;
      case 'neon': effectIcon = '💡'; break;
      case 'flames': effectIcon = '🔥'; break;
      case 'monster': effectIcon = '👣'; break;
      case 'formula': effectIcon = '⚡'; break;
      case 'gold': effectIcon = '👑'; break;
      case 'cyber': effectIcon = '🤖'; break;
      case 'void': effectIcon = '🌌'; break;
      default: effectIcon = '✨';
    }
    
    const effectText = this.add.text(w - 45, y + 20, effectIcon, {
      fontSize: '24px'
    }).setOrigin(1, 0.5);
    
    elements.push(effectText);
  }

  addHoverEffects(bg, preview, bgColor) {
    bg.on('pointerover', () => {
      bg.setFillStyle(0x2a2a4a);
      preview.setScale(1.15);
      this.tweens.add({
        targets: bg,
        strokeWidth: 4,
        duration: 100
      });
      this.playHoverSound();
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(bgColor, 0.95);
      preview.setScale(1.0);
      this.tweens.add({
        targets: bg,
        strokeWidth: 3,
        duration: 100
      });
    });
  }

  // =========================================================================
  // СОЗДАНИЕ НИЖНЕЙ ПАНЕЛИ
  // =========================================================================

  createFooter() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Нижняя панель
    const footer = this.add.rectangle(w / 2, h - 30, w, 60, 0x0a0a1a, 0.9)
      .setStrokeStyle(2, 0x00ffff, 0.3);

    // Кнопка назад в стиле киберпанк
    const backBtn = this.add.text(w / 2, h - 30, '⏎ RETURN TO MENU', {
      fontSize: '22px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 3,
      padding: { x: 30, y: 10 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => {
      backBtn.setStyle({ color: '#ffffff', stroke: '#00ffff' });
      backBtn.setScale(1.05);
      this.playHoverSound();
    });

    backBtn.on('pointerout', () => {
      backBtn.setStyle({ color: '#00ffff', stroke: '#000000' });
      backBtn.setScale(1);
    });

    backBtn.on('pointerdown', () => {
      this.playClickSound();
      this.cleanupBeforeExit();
      this.scene.start('menu');
    });
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ ТЕКСТУР СКИНОВ
  // =========================================================================

  createAllSkinTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Базовые такси
    this.createTaxiTextures(g);
    
    // Спецтранспорт
    this.createEmergencyTextures(g);
    
    // Спортивные
    this.createSportTextures(g);
    
    // Особые
    this.createSpecialTextures(g);
    
    // Легендарные
    this.createLegendaryTextures(g);

    g.destroy();
  }

  createTaxiTextures(g) {
    // Классическое такси
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

    // Синее такси
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

    // Зеленое такси
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
  }

  createEmergencyTextures(g) {
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

    // Пожарная машина
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
  }

  createSportTextures(g) {
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
  }

  createSpecialTextures(g) {
    // Неоновое такси (голубое)
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

    // Неоновое такси (розовое)
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

    // Неоновое такси (синее)
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
  }

  createLegendaryTextures(g) {
    // Монстр-трак
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

    // Формула-1
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

    // Золотое такси
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

    // Кибертакси
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

    // Void Reaver
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
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ УПРАВЛЕНИЯ СКИНАМИ
  // =========================================================================

  selectSkin(skin) {
    console.log('Attempting to select skin:', skin.id);
    if (gameManager.selectSkin(skin.id)) {
      console.log('Skin selected successfully');
      this.playSelectSound();
      this.showMessage(`✓ SKIN EQUIPPED: ${skin.name}`, '#00ff00');
      this.createConfetti(this.scale.width / 2, 200, skin.color);
      
      this.time.delayedCall(500, () => {
        this.scene.restart();
      });
    } else {
      console.log('Failed to select skin');
    }
  }

  confirmPurchase(skin) {
    const w = this.scale.width;
    const h = this.scale.height;

    // Затемнение фона
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.95)
      .setDepth(50).setScrollFactor(0);

    // Анимированная панель
    const panel = this.add.rectangle(w / 2, h / 2, 400, 380, 0x0a0a1a, 0.98)
      .setStrokeStyle(4, skin.rarity === 'LEGENDARY' ? 0xffaa00 : 0x00ffff)
      .setDepth(51).setScrollFactor(0);

    // Вращающееся превью
    const preview = this.add.image(w / 2, h / 2 - 100, skin.texture)
      .setScale(2.2).setDepth(52).setScrollFactor(0);
    
    this.tweens.add({
      targets: preview,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: 'Linear'
    });

    // Название
    this.add.text(w / 2, h / 2, skin.name, {
      fontSize: '26px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    // Бонус скорости
    if (skin.speedBonus > 0) {
      this.add.text(w / 2, h / 2 + 40, `⚡ +${skin.speedBonus}% SPEED BOOST`, {
        fontSize: '18px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#00ff00'
      }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    }

    // Цена с красивым дизайном
    const priceBg = this.add.graphics();
    priceBg.fillStyle(0x1a1a2a, 0.9);
    priceBg.fillRoundedRect(w / 2 - 80, h / 2 + 70, 160, 50, 25);
    priceBg.lineStyle(3, 0xffaa00, 0.8);
    priceBg.strokeRoundedRect(w / 2 - 80, h / 2 + 70, 160, 50, 25);
    
    const priceText = this.add.text(w / 2, h / 2 + 95, `${skin.price} 💎`, {
      fontSize: '28px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    // Кнопки
    const yesBtn = this.createStyledButton(w / 2 - 110, h / 2 + 150, 'BUY', '#00ff00', '#00aa00');
    const noBtn = this.createStyledButton(w / 2 + 110, h / 2 + 150, 'CANCEL', '#ff4444', '#aa0000');

    yesBtn.setDepth(52).setScrollFactor(0);
    noBtn.setDepth(52).setScrollFactor(0);

    yesBtn.on('pointerdown', () => {
      console.log('Purchase confirmed for:', skin.id);
      if (gameManager.purchaseSkin(skin.id)) {
        console.log('Purchase successful');
        this.playPurchaseSound();
        this.balanceText.setText(gameManager.data.crystals.toString());
        this.createConfetti(w / 2, h / 2, skin.color);
        
        this.time.delayedCall(800, () => {
          overlay.destroy();
          panel.destroy();
          preview.destroy();
          yesBtn.destroy();
          noBtn.destroy();
          priceBg.destroy();
          priceText.destroy();
          this.scene.restart();
        });
      } else {
        console.log('Purchase failed');
      }
    });

    noBtn.on('pointerdown', () => {
      this.playClickSound();
      overlay.destroy();
      panel.destroy();
      preview.destroy();
      yesBtn.destroy();
      noBtn.destroy();
      priceBg.destroy();
      priceText.destroy();
    });
  }

  createStyledButton(x, y, text, color, hoverColor) {
    const btn = this.add.text(x, y, text, {
      fontSize: '22px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      backgroundColor: '#1a1a3a',
      padding: { x: 30, y: 15 },
      stroke: color,
      strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setStyle({ color: '#ffffff', backgroundColor: hoverColor, stroke: '#ffffff' });
      btn.setScale(1.1);
      this.playHoverSound();
    });

    btn.on('pointerout', () => {
      btn.setStyle({ color: '#ffffff', backgroundColor: '#1a1a3a', stroke: color });
      btn.setScale(1);
    });

    return btn;
  }

  showNoFunds() {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.9)
      .setDepth(100).setScrollFactor(0);

    const panel = this.add.rectangle(w / 2, h / 2, 380, 260, 0x0a0a1a, 0.98)
      .setStrokeStyle(4, 0xff4444)
      .setDepth(101).setScrollFactor(0);

    const icon = this.add.text(w / 2, h / 2 - 70, '⚠', {
      fontSize: '72px',
      color: '#ff4444'
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

    const text = this.add.text(w / 2, h / 2, 'INSUFFICIENT\nCRYSTALS!', {
      fontSize: '28px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ff4444',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

    const balance = this.add.text(w / 2, h / 2 + 60, `Your balance: ${gameManager.data.crystals} 💎`, {
      fontSize: '18px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffaa00'
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

    const okBtn = this.add.text(w / 2, h / 2 + 110, 'OK', {
      fontSize: '22px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      backgroundColor: '#ff4444',
      padding: { x: 40, y: 12 }
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0).setInteractive({ useHandCursor: true });

    okBtn.on('pointerover', () => okBtn.setStyle({ backgroundColor: '#ff6666' }));
    okBtn.on('pointerout', () => okBtn.setStyle({ backgroundColor: '#ff4444' }));
    okBtn.on('pointerdown', () => {
      this.playClickSound();
      overlay.destroy();
      panel.destroy();
      icon.destroy();
      text.destroy();
      balance.destroy();
      okBtn.destroy();
    });
  }

  showMessage(text, color) {
    const w = this.scale.width;
    const h = this.scale.height;

    const msg = this.add.text(w / 2, h / 2, text, {
      fontSize: '28px',
      fontFamily: '"Audiowide", sans-serif',
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: '#0a1a0a',
      padding: { x: 40, y: 20 },
      align: 'center'
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
      const particle = this.add.circle(x, y, Phaser.Math.Between(3, 6), color, 0.9);
      
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(150, 400);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 300;
      
      this.tweens.add({
        targets: particle,
        x: x + vx * 0.5,
        y: y + vy * 0.5,
        alpha: 0,
        scale: 0,
        duration: 1200,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  // =========================================================================
  // ЗВУКОВЫЕ ЭФФЕКТЫ
  // =========================================================================

  playHoverSound() {
    try {
      audioManager.playSound(this, 'tap_sound', 0.1);
    } catch (e) {}
  }

  playClickSound() {
    try {
      audioManager.playSound(this, 'tap_sound', 0.3);
    } catch (e) {}
  }

  playSelectSound() {
    try {
      audioManager.playSound(this, 'level_up_sound', 0.4);
    } catch (e) {}
  }

  playPurchaseSound() {
    try {
      audioManager.playSound(this, 'purchase_sound', 0.5);
    } catch (e) {}
  }

  // =========================================================================
  // АНИМАЦИИ И ОЧИСТКА
  // =========================================================================

  startBackgroundAnimations() {
    const elements = this.children.list.filter(child => 
      child.type === 'Circle' || child.type === 'Graphics'
    );
    
    elements.forEach((el, i) => {
      if (Math.random() > 0.7) {
        const tween = this.tweens.add({
          targets: el,
          alpha: 0.2,
          duration: Phaser.Math.Between(1000, 3000),
          yoyo: true,
          repeat: -1,
          delay: i * 100
        });
        this.floatTweens.push(tween);
      }
    });
  }

  cleanupBeforeExit() {
    this.rotationTweens.forEach(tween => tween?.stop());
    this.floatTweens.forEach(tween => tween?.stop());
    this.particleEmitters.forEach(emitter => emitter?.destroy());
    this.cards = [];
  }

  shutdown() {
    this.cleanupBeforeExit();
  }
}