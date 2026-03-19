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
    description: 'OG yellow cab',
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
    description: 'Blue variant',
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
    description: 'Green variant',
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
    name: 'POLICE INTERCEPTOR', 
    texture: 'player_police',
    price: 200, 
    rarity: 'RARE',
    description: 'Pursuit mode activated',
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
    name: 'MEDIC RESPONDER', 
    texture: 'player_ambulance',
    price: 250, 
    rarity: 'RARE',
    description: 'Emergency! Clear the way',
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
    description: 'Blue neon glow',
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
    name: 'INFERNO COUPE', 
    texture: 'player_sport_red',
    price: 400, 
    rarity: 'EPIC',
    description: 'Burning asphalt',
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
    description: 'Slice through the dark',
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
    name: 'PYRO UNIT', 
    texture: 'player_firetruck',
    price: 350, 
    rarity: 'EPIC',
    description: 'Firefighter hero',
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
    name: 'NEON DRIFTER', 
    texture: 'player_taxi_neon',
    price: 500, 
    rarity: 'EPIC',
    description: 'Glow in the dark',
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
    description: 'Hot pink glow',
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
    description: 'Crush everything',
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
    description: 'Beyond speed limits',
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
    name: 'GOLDEN GOD', 
    texture: 'player_taxi_gold',
    price: 1000, 
    rarity: 'LEGENDARY',
    description: 'Flex on everyone',
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
    name: 'CYBER CAB 2077', 
    texture: 'player_cyber',
    price: 1200, 
    rarity: 'LEGENDARY',
    description: 'The future is now',
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
    name: 'VOID REAVER', 
    texture: 'player_void',
    price: 1500, 
    rarity: 'LEGENDARY',
    description: 'Consumes light',
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
    this.hoverSoundTimer = null;
    this.lastHoverTime = 0;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Создаём все текстуры скинов
    console.log('SkinShop: Creating textures...');
    this.createAllSkinTextures();
    console.log('SkinShop: Textures created');

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

    // Добавляем обработчик клавиши Escape для возврата
    this.input.keyboard.on('keydown-ESC', () => {
      this.cleanupBeforeExit();
      this.scene.start('menu');
    });

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

    // Анимированный градиент с несколькими слоями
    for (let layer = 0; layer < 4; layer++) {
      const alpha = 0.05 + layer * 0.03;
      const offset = layer * 15;
      
      const gradientTexture = this.make.graphics({ x: 0, y: 0, add: false });
      gradientTexture.fillGradientStyle(
        0x030712 + layer * 0x010101, 
        0x030712 + layer * 0x010101, 
        0x0a0a1a + layer * 0x020202, 
        0x0a0a1a + layer * 0x020202, 
        alpha
      );
      gradientTexture.fillRect(0, 0, w, h);
      gradientTexture.generateTexture(`gradient_layer_${layer}`, w, h);
      gradientTexture.destroy();
      
      const gradientImage = this.add.image(0, offset * 0.3, `gradient_layer_${layer}`).setOrigin(0);
      gradientImage.setAlpha(0.7);
      
      // Анимация движения градиента
      this.tweens.add({
        targets: gradientImage,
        y: offset * 0.5,
        duration: 5000 + layer * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Кибер-сетка с анимацией
    const grid = this.add.graphics();
    
    // Анимируем сетку
    this.tweens.add({
      targets: {},
      duration: 3000,
      repeat: -1,
      onUpdate: (tween) => {
        const progress = tween.progress;
        grid.clear();
        grid.lineStyle(1, 0x00ffff, 0.1 + Math.sin(progress * Math.PI * 2) * 0.05);
        
        // Вертикальные линии с эффектом пульсации
        for (let i = 0; i < w; i += 40) {
          grid.moveTo(i, 0);
          grid.lineTo(i, h);
        }
        
        // Горизонтальные линии
        for (let i = 0; i < h; i += 40) {
          grid.moveTo(0, i);
          grid.lineTo(w, i);
        }
        grid.strokePath();
      }
    });

    // Анимированные неоновые линии по краям
    const borders = {
      top: this.add.graphics(),
      bottom: this.add.graphics(),
      left: this.add.graphics(),
      right: this.add.graphics()
    };

    this.tweens.add({
      targets: { alpha: 0.2 },
      alpha: 0.8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      onUpdate: (tween) => {
        const alpha = tween.getValue();
        
        borders.top.clear();
        borders.top.lineStyle(3, 0x00ffff, alpha);
        borders.top.lineBetween(0, 0, w, 0);
        
        borders.bottom.clear();
        borders.bottom.lineStyle(3, 0xff00ff, alpha);
        borders.bottom.lineBetween(0, h, w, h);
        
        borders.left.clear();
        borders.left.lineStyle(3, 0xffff00, alpha);
        borders.left.lineBetween(0, 0, 0, h);
        
        borders.right.clear();
        borders.right.lineStyle(3, 0x00ff00, alpha);
        borders.right.lineBetween(w, 0, w, h);
      }
    });

    // Парящие неоновые частицы
    for (let i = 0; i < 70; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const size = Phaser.Math.FloatBetween(1, 4);
      const color = Phaser.Utils.Array.GetRandom([0x00ffff, 0xff00ff, 0xffff00, 0x00ff00, 0xff6600]);
      
      const particle = this.add.circle(x, y, size, color, 0.4);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      // Индивидуальная анимация для каждой частицы
      const tween = this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-80, 80),
        y: y + Phaser.Math.Between(-50, 50),
        alpha: 0.1,
        scale: Phaser.Math.FloatBetween(0.5, 1.5),
        duration: Phaser.Math.Between(3000, 7000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 50
      });
      
      this.floatTweens.push(tween);
      this.particleEmitters.push(particle);
    }

    // Сканирующие линии
    const scannerTop = this.add.graphics();
    const scannerBottom = this.add.graphics();
    let scannerY = 0;
    
    this.tweens.add({
      targets: { y: 0 },
      y: h,
      duration: 4000,
      repeat: -1,
      onUpdate: (tween) => {
        scannerY = tween.getValue();
        
        scannerTop.clear();
        scannerTop.lineStyle(3, 0x00ffff, 0.5);
        scannerTop.lineBetween(0, scannerY, w, scannerY);
        
        scannerBottom.clear();
        scannerBottom.lineStyle(3, 0xff00ff, 0.5);
        scannerBottom.lineBetween(0, h - scannerY, w, h - scannerY);
      }
    });

    // Добавляем звезды на задний план
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const star = this.add.star(x, y, 4, 2, 4, 0xffffff, 0.2);
      star.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        scale: 1.5,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        delay: i * 20
      });
    }
  }

  // =========================================================================
  // СОЗДАНИЕ ЗАГОЛОВКА
  // =========================================================================

  createHeader() {
    const w = this.scale.width;

    // Неоновый заголовок с эффектом мерцания
    const title = this.add.text(w / 2, 35, 'SKIN VAULT', {
      fontSize: '42px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 5,
      shadow: { 
        offsetX: 0, 
        offsetY: 0, 
        color: '#00ffff', 
        blur: 25, 
        fill: true,
        stroke: true
      }
    }).setOrigin(0.5);

    // Анимация мерцания заголовка
    this.tweens.add({
      targets: title,
      alpha: 0.8,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Подзаголовок
    const subtitle = this.add.text(w / 2, 70, 'PREMIUM VEHICLE COLLECTION', {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Баланс кристаллов с анимированной иконкой
    const balanceContainer = this.add.container(w / 2, 110);
    
    // Фон с пульсацией
    const balanceBg = this.add.rectangle(0, 0, 260, 45, 0x0a0a1a, 0.95)
      .setStrokeStyle(3, 0x00ffff, 0.8);
    
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

    // Иконка кристалла с вращением
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
    const balanceText = this.add.text(20, 0, `${gameManager.data.crystals}`, {
      fontSize: '28px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, 0.5);

    // Текст "CREDITS"
    const creditsLabel = this.add.text(-30, -15, 'CREDITS', {
      fontSize: '10px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff'
    }).setOrigin(0.5);

    balanceContainer.add([balanceBg, crystalIcon, balanceText, creditsLabel]);
    this.balanceText = balanceText;

    // Украшения по бокам
    const leftGlow = this.add.graphics();
    leftGlow.fillStyle(0x00ffff, 0.3);
    leftGlow.fillCircle(30, 110, 25);
    
    const rightGlow = this.add.graphics();
    rightGlow.fillStyle(0xff00ff, 0.3);
    rightGlow.fillCircle(w - 30, 110, 25);
  }

  // =========================================================================
  // СОЗДАНИЕ ПРОКРУЧИВАЕМОГО СПИСКА СКИНОВ
  // =========================================================================

  createScrollableSkinList() {
    const w = this.scale.width;
    const h = this.scale.height;
    const listTop = 150;
    const listHeight = h - 220;

    // Создаем маску для области прокрутки
    const maskArea = this.add.graphics();
    maskArea.fillStyle(0xffffff);
    maskArea.fillRect(10, listTop, w - 20, listHeight);
    const mask = maskArea.createGeometryMask();

    // Основной контейнер для всех карточек
    const container = this.add.container(0, listTop);
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
    const cardSpacing = 150;
    const cards = [];

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
        
        const separator = this.add.text(w / 2, currentY, `⚡ ${skin.rarity} TIER ⚡`, {
          fontSize: '18px',
          fontFamily: '"Audiowide", sans-serif',
          color: rarityColors[skin.rarity],
          stroke: '#000000',
          strokeThickness: 3,
          shadow: { blur: 10, color: rarityColors[skin.rarity], fill: true }
        }).setOrigin(0.5);
        
        container.add(separator);
        currentY += 40;
      }

      const owned = gameManager.getOwnedSkins().includes(skin.id);
      const selected = gameManager.getCurrentSkin() === skin.id;
      const canAfford = gameManager.data.crystals >= skin.price;

      // Создаем карточку скина
      const card = this.createSkinCard(skin, w, currentY, owned, selected, canAfford);
      container.add(card.elements);
      cards.push(card);
      
      currentY += cardSpacing;
    });

    // Добавляем отступ внизу
    const bottomPadding = this.add.rectangle(0, currentY, 10, 30, 0x000000, 0);
    container.add(bottomPadding);

    // Система прокрутки с инерцией
    const scrollZone = this.add.zone(0, listTop, w, listHeight).setOrigin(0).setInteractive();
    let startY = 0;
    let startContainerY = 0;
    let velocity = 0;
    let lastY = 0;
    let isDragging = false;

    scrollZone.on('pointerdown', (pointer) => {
      startY = pointer.y;
      startContainerY = container.y;
      lastY = pointer.y;
      isDragging = true;
      velocity = 0;
    });

    scrollZone.on('pointermove', (pointer) => {
      if (!pointer.isDown || !isDragging) return;
      
      const deltaY = pointer.y - lastY;
      velocity = deltaY * 0.5;
      
      let newY = container.y + deltaY;
      
      // Ограничиваем прокрутку с резиновым эффектом
      const minY = -(currentY - listHeight + 50);
      const maxY = listTop;
      
      if (newY < minY) {
        newY = minY + (newY - minY) * 0.2;
      } else if (newY > maxY) {
        newY = maxY + (newY - maxY) * 0.2;
      }
      
      container.y = newY;
      lastY = pointer.y;
    });

    scrollZone.on('pointerup', () => {
      isDragging = false;
      
      // Инерция
      if (Math.abs(velocity) > 1) {
        this.tweens.add({
          targets: container,
          y: container.y + velocity * 5,
          duration: 500,
          ease: 'Power2.easeOut',
          onUpdate: (tween) => {
            const minY = -(currentY - listHeight + 50);
            const maxY = listTop;
            container.y = Phaser.Math.Clamp(container.y, minY, maxY);
          }
        });
      }
    });

    // Индикатор прокрутки
    if (currentY > listHeight) {
      const scrollTrack = this.add.graphics();
      scrollTrack.fillStyle(0x333333, 0.5);
      scrollTrack.fillRoundedRect(w - 20, listTop + 10, 6, listHeight - 20, 3);
      
      const indicatorHeight = (listHeight - 20) * (listHeight) / currentY;
      const indicator = this.add.graphics();
      indicator.fillStyle(0x00ffff, 0.8);
      indicator.fillRoundedRect(w - 20, listTop + 10, 6, indicatorHeight, 3);
      
      // Анимация индикатора
      this.tweens.add({
        targets: indicator,
        alpha: 0.5,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      
      // Обновление позиции индикатора
      this.events.on('update', () => {
        const scrollPercent = (container.y - listTop) / (minY - listTop);
        const indicatorY = listTop + 10 + (listHeight - 20 - indicatorHeight) * scrollPercent;
        indicator.y = indicatorY;
      });
    }
  }

  // =========================================================================
  // СОЗДАНИЕ КАРТОЧКИ СКИНА
  // =========================================================================

  createSkinCard(skin, w, y, owned, selected, canAfford) {
    const elements = [];

    // Определяем цвета в зависимости от статуса
    let borderColor = 0x666666;
    let borderGlow = 0x00ffff;
    let bgColor = 0x0d0d1a;
    let textColor = '#ffffff';
    
    if (selected) {
      borderColor = 0x00ff00;
      borderGlow = 0x00ff00;
      bgColor = 0x1a3a1a;
      textColor = '#88ff88';
    } else if (owned) {
      borderColor = 0x00ffff;
      borderGlow = 0x00ffff;
      bgColor = 0x1a2a3a;
      textColor = '#88ccff';
    } else if (skin.price === 0) {
      borderColor = 0xffaa00;
      borderGlow = 0xffaa00;
    } else if (canAfford) {
      borderColor = 0xffaa00;
      borderGlow = 0xffaa00;
    }

    // Основной фон карточки с градиентом
    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.95);
    bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 140, 16);
    bg.lineStyle(4, borderColor, 1);
    bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 140, 16);
    
    // Внутреннее свечение
    const innerGlow = this.add.graphics();
    innerGlow.lineStyle(2, borderGlow, 0.3);
    innerGlow.strokeRoundedRect(w / 2 - (w - 44) / 2, y + 2, w - 44, 136, 14);

    // Превью скина с вращением при наведении
    const preview = this.add.image(60, y + 70, skin.texture)
      .setScale(1.2)
      .setOrigin(0.5, 0.5);

    // Название скина с эффектом неона
    const nameText = this.add.text(140, y + 30, skin.name, {
      fontSize: '22px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: borderColor === 0x00ffff ? '#00ffff' : '#888888',
      strokeThickness: 2,
      shadow: { blur: 8, color: borderColor === 0x00ffff ? '#00ffff' : '#888888', fill: true }
    }).setOrigin(0, 0.5);

    // Описание
    const descText = this.add.text(140, y + 60, skin.description, {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#aaccff'
    }).setOrigin(0, 0.5);

    // Статистика в виде иконок
    const stats = [
      { icon: '⚡', value: skin.stats.speedBonus, color: 0xffff00 },
      { icon: '🛡️', value: skin.stats.armorBonus, color: 0x00ffff },
      { icon: '🌀', value: skin.stats.handlingBonus, color: 0xff00ff },
      { icon: '🚀', value: skin.stats.jumpBonus, color: 0xff8800 }
    ];

    let statsX = 140;
    stats.forEach((stat, index) => {
      const statBg = this.add.graphics();
      statBg.fillStyle(0x1a1a2a, 0.8);
      statBg.fillRoundedRect(statsX, y + 85, 45, 20, 8);
      statBg.lineStyle(1, stat.color, 0.5);
      statBg.strokeRoundedRect(statsX, y + 85, 45, 20, 8);
      
      const statIcon = this.add.text(statsX + 12, y + 95, stat.icon, {
        fontSize: '12px'
      }).setOrigin(0.5);
      
      const statValue = this.add.text(statsX + 30, y + 95, `+${stat.value}`, {
        fontSize: '10px',
        fontFamily: '"Share Tech Mono", monospace',
        color: Phaser.Display.Color.ValueToColor(stat.color).rgba
      }).setOrigin(0, 0.5);
      
      elements.push(statBg, statIcon, statValue);
      statsX += 55;
    });

    // Редкость
    const rarityColors = {
      'COMMON': '#aaaaaa',
      'RARE': '#44aaff',
      'EPIC': '#ff44aa',
      'LEGENDARY': '#ffaa00'
    };
    
    const rarityText = this.add.text(140, y + 115, `[${skin.rarity}]`, {
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      color: rarityColors[skin.rarity]
    }).setOrigin(0, 0.5);

    // Статус/цена справа
    let statusContent = '';
    let statusColor = '#666666';
    let statusBg = 0x1a1a2a;
    
    if (selected) {
      statusContent = 'EQUIPPED';
      statusColor = '#00ff00';
      statusBg = 0x1a3a1a;
    } else if (owned) {
      statusContent = 'OWNED';
      statusColor = '#00ffff';
      statusBg = 0x1a2a3a;
    } else if (skin.price === 0) {
      statusContent = 'FREE';
      statusColor = '#ffaa00';
      statusBg = 0x3a2a1a;
    } else {
      statusContent = `${skin.price}`;
      statusColor = canAfford ? '#ffaa00' : '#ff4444';
      statusBg = canAfford ? 0x3a2a1a : 0x3a1a1a;
    }

    // Фон для статуса/цены с эффектом
    const statusBgGraphic = this.add.graphics();
    statusBgGraphic.fillStyle(statusBg, 0.9);
    statusBgGraphic.fillRoundedRect(w - 140, y + 45, 100, 35, 18);
    statusBgGraphic.lineStyle(2, parseInt(statusColor.replace('#', '0x'), 16), 0.7);
    statusBgGraphic.strokeRoundedRect(w - 140, y + 45, 100, 35, 18);

    // Иконка кристалла для цены
    if (!selected && !owned && skin.price > 0) {
      const crystalIcon = this.add.text(w - 125, y + 62, '💎', {
        fontSize: '16px'
      }).setOrigin(0.5);
      elements.push(crystalIcon);
    }

    // Текст статуса/цены
    const statusText = this.add.text(
      w - (selected || owned || skin.price === 0 ? 90 : 70), 
      y + 62, 
      statusContent, 
      {
        fontSize: selected || owned ? '14px' : '18px',
        fontFamily: '"Audiowide", sans-serif',
        color: statusColor,
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5);

    // Индикаторы эффектов
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
      
      const effectBg = this.add.graphics();
      effectBg.fillStyle(0x2a1a2a, 0.8);
      effectBg.fillRoundedRect(w - 140, y + 90, 40, 30, 10);
      effectBg.lineStyle(1, borderColor, 0.5);
      effectBg.strokeRoundedRect(w - 140, y + 90, 40, 30, 10);
      
      const effectText = this.add.text(w - 120, y + 105, effectIcon, {
        fontSize: '20px'
      }).setOrigin(0.5);
      
      elements.push(effectBg, effectText);
    }

    // Собираем все элементы
    elements.push(bg, innerGlow, preview, nameText, descText, rarityText, statusBgGraphic, statusText);

    // Добавляем интерактивную область
    const hitArea = this.add.rectangle(w / 2, y + 70, w - 40, 140, 0x000000, 0)
      .setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(w / 2 - (w - 40) / 2, y, w - 40, 140) })
      .setOrigin(0.5);

    // Эффекты наведения
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2a2a4a, 0.95);
      bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 140, 16);
      bg.lineStyle(4, borderColor, 1);
      bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 140, 16);
      
      preview.setScale(1.4);
      this.playHoverSound();
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(bgColor, 0.95);
      bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 140, 16);
      bg.lineStyle(4, borderColor, 1);
      bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 140, 16);
      
      preview.setScale(1.2);
    });

    // Обработка клика
    hitArea.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      this.playClickSound();
      
      if (owned && !selected) {
        this.selectSkin(skin);
      } else if (!owned && (skin.price === 0 || canAfford)) {
        this.confirmPurchase(skin);
      } else if (!canAfford && !owned) {
        this.showNoFunds();
      }
    });

    elements.push(hitArea);

    return { elements, bg, preview };
  }

  // =========================================================================
  // СОЗДАНИЕ ПОДВАЛА
  // =========================================================================

  createFooter() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Нижняя панель с градиентом
    const footer = this.add.graphics();
    footer.fillStyle(0x0a0a1a, 0.95);
    footer.fillRoundedRect(0, h - 60, w, 60, 0);
    footer.lineStyle(2, 0x00ffff, 0.3);
    footer.strokeRoundedRect(0, h - 60, w, 60, 0);

    // Статистика
    const ownedCount = gameManager.getOwnedSkins().length;
    const totalCount = SKINS.length;
    const collectionText = this.add.text(30, h - 35, `📊 COLLECTION: ${ownedCount}/${totalCount}`, {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff'
    }).setOrigin(0, 0.5);

    // Кнопка назад в стиле киберпанк
    const backBtn = this.add.text(w / 2, h - 30, '⏎ RETURN TO MENU', {
      fontSize: '22px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 3,
      padding: { x: 30, y: 8 },
      backgroundColor: '#1a1a3a'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Эффекты наведения
    backBtn.on('pointerover', () => {
      backBtn.setStyle({ color: '#ffffff', backgroundColor: '#2a2a5a', stroke: '#00ffff' });
      backBtn.setScale(1.05);
      this.playHoverSound();
    });

    backBtn.on('pointerout', () => {
      backBtn.setStyle({ color: '#00ffff', backgroundColor: '#1a1a3a', stroke: '#000000' });
      backBtn.setScale(1);
    });

    backBtn.on('pointerdown', () => {
      this.playClickSound();
      this.cleanupBeforeExit();
      this.scene.start('menu');
    });

    // Версия
    const versionText = this.add.text(w - 30, h - 35, 'v2.5.0', {
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#666666'
    }).setOrigin(1, 0.5);

    return { footer, backBtn };
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ ТЕКСТУР СКИНОВ
  // =========================================================================

  createAllSkinTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // ===== БАЗОВЫЕ ТАКСИ =====
    this.createTaxiTextures(g);
    
    // ===== СПЕЦТРАНСПОРТ =====
    this.createEmergencyTextures(g);
    
    // ===== СПОРТИВНЫЕ =====
    this.createSportTextures(g);
    
    // ===== ОСОБЫЕ =====
    this.createSpecialTextures(g);
    
    // ===== ЛЕГЕНДАРНЫЕ =====
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
    if (gameManager.selectSkin(skin.id)) {
      this.playSelectSound();
      this.showMessage(`✓ SKIN EQUIPPED: ${skin.name}`, '#00ff00');
      
      // Создаем эффект конфетти
      this.createConfetti(this.scale.width / 2, 200, skin.color);
      
      // Перезапускаем сцену для обновления
      this.time.delayedCall(800, () => {
        this.scene.restart();
      });
    }
  }

  confirmPurchase(skin) {
    const w = this.scale.width;
    const h = this.scale.height;

    // Затемнение фона
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.95)
      .setDepth(50).setScrollFactor(0);

    // Анимированная панель
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.98);
    panel.fillRoundedRect(w / 2 - 200, h / 2 - 200, 400, 400, 30);
    panel.lineStyle(4, skin.rarity === 'LEGENDARY' ? 0xffaa00 : 0x00ffff, 1);
    panel.strokeRoundedRect(w / 2 - 200, h / 2 - 200, 400, 400, 30);
    panel.setDepth(51);

    // Закругленный фон для превью
    const previewBg = this.add.graphics();
    previewBg.fillStyle(0x1a1a3a, 1);
    previewBg.fillRoundedRect(w / 2 - 100, h / 2 - 150, 200, 120, 15);
    previewBg.setDepth(52);
    
    // Вращающееся превью
    const preview = this.add.image(w / 2, h / 2 - 90, skin.texture)
      .setScale(2.5).setDepth(53).setScrollFactor(0);
    
    this.tweens.add({
      targets: preview,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: 'Linear'
    });

    // Название
    const nameText = this.add.text(w / 2, h / 2 - 10, skin.name, {
      fontSize: '28px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(53).setScrollFactor(0);

    // Статистика
    const statsY = h / 2 + 20;
    const stats = [
      { label: 'SPEED', value: skin.stats.speedBonus, icon: '⚡', color: 0xffff00 },
      { label: 'ARMOR', value: skin.stats.armorBonus, icon: '🛡️', color: 0x00ffff },
      { label: 'HANDLING', value: skin.stats.handlingBonus, icon: '🌀', color: 0xff00ff },
      { label: 'JUMP', value: skin.stats.jumpBonus, icon: '🚀', color: 0xff8800 }
    ];

    stats.forEach((stat, index) => {
      const y = statsY + index * 25;
      
      // Фон для статистики
      const statBg = this.add.graphics();
      statBg.fillStyle(0x1a1a2a, 0.8);
      statBg.fillRoundedRect(w / 2 - 150, y - 10, 300, 25, 8);
      statBg.setDepth(52);
      
      const iconText = this.add.text(w / 2 - 140, y, stat.icon, {
        fontSize: '16px'
      }).setOrigin(0, 0.5).setDepth(53).setScrollFactor(0);
      
      const labelText = this.add.text(w / 2 - 120, y, stat.label, {
        fontSize: '14px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(53).setScrollFactor(0);
      
      const valueText = this.add.text(w / 2 + 130, y, `+${stat.value}`, {
        fontSize: '16px',
        fontFamily: '"Audiowide", sans-serif',
        color: Phaser.Display.Color.ValueToColor(stat.color).rgba
      }).setOrigin(1, 0.5).setDepth(53).setScrollFactor(0);
    });

    // Цена
    const priceBg = this.add.graphics();
    priceBg.fillStyle(0x2a2a1a, 0.9);
    priceBg.fillRoundedRect(w / 2 - 100, h / 2 + 120, 200, 40, 20);
    priceBg.lineStyle(2, 0xffaa00, 0.7);
    priceBg.strokeRoundedRect(w / 2 - 100, h / 2 + 120, 200, 40, 20);
    priceBg.setDepth(52);

    const priceText = this.add.text(w / 2 - 20, h / 2 + 140, `${skin.price}`, {
      fontSize: '32px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1, 0.5).setDepth(53).setScrollFactor(0);

    const crystalIcon = this.add.text(w / 2 + 10, h / 2 + 140, '💎', {
      fontSize: '32px'
    }).setOrigin(0, 0.5).setDepth(53).setScrollFactor(0);

    // Анимация цены
    this.tweens.add({
      targets: [priceText, crystalIcon],
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Кнопки
    const yesBtn = this.createStyledButton(w / 2 - 120, h / 2 + 180, 'BUY', '#00ff00', '#00aa00');
    const noBtn = this.createStyledButton(w / 2 + 120, h / 2 + 180, 'CANCEL', '#ff4444', '#aa0000');

    yesBtn.setDepth(53).setScrollFactor(0);
    noBtn.setDepth(53).setScrollFactor(0);

    yesBtn.on('pointerdown', () => {
      if (gameManager.purchaseSkin(skin.id)) {
        this.playPurchaseSound();
        this.balanceText.setText(`${gameManager.data.crystals}`);
        this.createConfetti(w / 2, h / 2, skin.color);
        
        this.showMessage('✓ PURCHASE SUCCESSFUL!', '#00ff00');
        
        this.time.delayedCall(1000, () => {
          overlay.destroy();
          panel.destroy();
          previewBg.destroy();
          preview.destroy();
          nameText.destroy();
          priceBg.destroy();
          priceText.destroy();
          crystalIcon.destroy();
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
      previewBg.destroy();
      preview.destroy();
      nameText.destroy();
      priceBg.destroy();
      priceText.destroy();
      crystalIcon.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    });
  }

  createStyledButton(x, y, text, color, hoverColor) {
    const btn = this.add.text(x, y, text, {
      fontSize: '22px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      backgroundColor: '#1a1a3a',
      padding: { x: 30, y: 12 },
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

    const msg = this.add.text(w / 2, h / 2, '⚠ INSUFFICIENT CRYSTALS ⚠', {
      fontSize: '28px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 5,
      backgroundColor: '#1a0a0a',
      padding: { x: 40, y: 20 },
      align: 'center'
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    msg.setScale(0.5);
    this.tweens.add({
      targets: msg,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: 2000,
      ease: 'Back.out',
      onComplete: () => msg.destroy()
    });
  }

  showMessage(text, color) {
    const w = this.scale.width;
    const h = this.scale.height;

    const msg = this.add.text(w / 2, h / 2, text, {
      fontSize: '32px',
      fontFamily: '"Audiowide", sans-serif',
      color: color,
      stroke: '#000000',
      strokeThickness: 5,
      backgroundColor: '#0a1a0a',
      padding: { x: 50, y: 25 },
      align: 'center',
      shadow: { blur: 15, color: color, fill: true }
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0);

    // Анимация появления
    msg.setScale(0.5);
    this.tweens.add({
      targets: msg,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.out'
    });

    // Анимация исчезновения
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

  // =========================================================================
  // ЗВУКОВЫЕ ЭФФЕКТЫ
  // =========================================================================

  playHoverSound() {
    const now = Date.now();
    if (now - this.lastHoverTime < 50) return;
    this.lastHoverTime = now;
    
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
    // Анимируем некоторые элементы фона
    const elements = this.children.list.filter(child => 
      child.type === 'Circle' || child.type === 'Graphics'
    );
    
    elements.forEach((el, i) => {
      if (Math.random() > 0.6) {
        const tween = this.tweens.add({
          targets: el,
          alpha: 0.2,
          scale: Phaser.Math.FloatBetween(1.2, 1.5),
          duration: Phaser.Math.Between(2000, 5000),
          yoyo: true,
          repeat: -1,
          delay: i * 50,
          ease: 'Sine.easeInOut'
        });
        this.floatTweens.push(tween);
      }
    });
  }

  cleanupBeforeExit() {
    // Останавливаем все твины
    this.rotationTweens.forEach(tween => tween?.stop());
    this.floatTweens.forEach(tween => tween?.stop());
    
    // Очищаем эмиттеры частиц
    this.particleEmitters.forEach(emitter => {
      if (emitter && emitter.destroy) emitter.destroy();
    });
    
    // Очищаем таймеры
    if (this.hoverSoundTimer) {
      this.hoverSoundTimer.remove();
    }
  }
}