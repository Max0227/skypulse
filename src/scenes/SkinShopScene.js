import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

// Расширенный список скинов
const SKINS = [
  // Стартовые (бесплатные)
  { 
    id: 'taxi_classic', 
    name: 'КЛАССИЧЕСКОЕ ТАКСИ', 
    texture: 'player_taxi_classic',
    price: 0, 
    rarity: 'Обычный',
    description: 'Жёлтое такси — классика',
    speedBonus: 0,
    color: 0xffaa00
  },
  { 
    id: 'police', 
    name: 'ПОЛИЦЕЙСКАЯ МАШИНА', 
    texture: 'player_police',
    price: 200, 
    rarity: 'Редкий',
    description: 'С полицейскими мигалками',
    speedBonus: 10,
    color: 0x2244aa
  },
  { 
    id: 'ambulance', 
    name: 'СКОРАЯ ПОМОЩЬ', 
    texture: 'player_ambulance',
    price: 250, 
    rarity: 'Редкий',
    description: 'Спасает жизни с мигалками',
    speedBonus: 10,
    color: 0xff4444
  },
  { 
    id: 'sport_red', 
    name: 'СПОРТИВНОЕ КУПЕ', 
    texture: 'player_sport_red',
    price: 400, 
    rarity: 'Эпический',
    description: 'Красный спорткар с полосой',
    speedBonus: 20,
    color: 0xff3333
  },
  { 
    id: 'sport_blue', 
    name: 'ГОНОЧНЫЙ БОЛИД', 
    texture: 'player_sport_blue',
    price: 450, 
    rarity: 'Эпический',
    description: 'Синий гоночный автомобиль',
    speedBonus: 20,
    color: 0x3366ff
  },
  { 
    id: 'monster_truck', 
    name: 'МОНСТР-ТРАК', 
    texture: 'player_monster',
    price: 600, 
    rarity: 'Легендарный',
    description: 'Огромные колёса и мощь',
    speedBonus: 30,
    color: 0xcc6600
  },
  { 
    id: 'formula', 
    name: 'ФОРМУЛА-1', 
    texture: 'player_formula',
    price: 800, 
    rarity: 'Легендарный',
    description: 'Сверхскоростной болид',
    speedBonus: 40,
    color: 0xff6600
  },
  { 
    id: 'fire_truck', 
    name: 'ПОЖАРНАЯ МАШИНА', 
    texture: 'player_firetruck',
    price: 350, 
    rarity: 'Эпический',
    description: 'Красная пожарная машина',
    speedBonus: 15,
    color: 0xff3333
  },
  { 
    id: 'taxi_neon', 
    name: 'НЕОНОВОЕ ТАКСИ', 
    texture: 'player_taxi_neon',
    price: 500, 
    rarity: 'Эпический',
    description: 'Светится в темноте',
    speedBonus: 15,
    color: 0x00ffff
  },
  { 
    id: 'taxi_gold', 
    name: 'ЗОЛОТОЕ ТАКСИ', 
    texture: 'player_taxi_gold',
    price: 1000, 
    rarity: 'Легендарный',
    description: 'Для настоящих коллекционеров',
    speedBonus: 50,
    color: 0xffaa00
  },
  { 
    id: 'ambulance_neon', 
    name: 'НЕОНОВАЯ СКОРАЯ', 
    texture: 'player_ambulance_neon',
    price: 550, 
    rarity: 'Эпический',
    description: 'Светящийся крест',
    speedBonus: 15,
    color: 0xff66ff
  },
  { 
    id: 'police_cyber', 
    name: 'КИБЕРПОЛИЦИЯ', 
    texture: 'player_police_cyber',
    price: 700, 
    rarity: 'Легендарный',
    description: 'Полиция будущего',
    speedBonus: 25,
    color: 0x00ccff
  }
];

export class SkinShopScene extends Phaser.Scene {
  constructor() {
    super('skinShop');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Создаем текстуры скинов
    this.createSkinTextures();

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('skin_shop_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'skin_shop_bg').setOrigin(0);

    // Звёзды
    this.createStars();

    // Заголовок
    this.add.text(w / 2, 30, 'МАГАЗИН СКИНОВ', {
      fontSize: '28px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Баланс кристаллов
    this.balanceText = this.add.text(w / 2, 70, `💎 ${gameManager.data.crystals}`, {
      fontSize: '20px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5);

    // Контейнер для прокрутки
    this.createScrollableList();
  }

  createScrollableList() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Маска для прокрутки
    const maskGraphics = this.make.graphics();
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRect(10, 110, w - 20, h - 160);
    const mask = maskGraphics.createGeometryMask();

    // Контейнер для всех скинов
    const container = this.add.container(0, 0);
    container.setMask(mask);

    let currentY = 0;
    const spacing = 110;

    // Группировка по редкости
    const rarityOrder = { 'Обычный': 0, 'Редкий': 1, 'Эпический': 2, 'Легендарный': 3 };
    const sortedSkins = [...SKINS].sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

    sortedSkins.forEach((skin, index) => {
      const owned = gameManager.getOwnedSkins().includes(skin.id);
      const selected = gameManager.getCurrentSkin() === skin.id;
      const canAfford = gameManager.data.crystals >= skin.price;

      // Определяем цвет рамки
      let borderColor = COLORS.text_muted;
      if (selected) borderColor = COLORS.success;
      else if (owned) borderColor = COLORS.primary;
      else if (skin.price === 0) borderColor = COLORS.accent;
      else if (canAfford) borderColor = COLORS.accent;

      // Карточка скина
      const bg = this.add.rectangle(w / 2, currentY + 40, w - 40, 100, 0x1a1a3a, 0.8)
        .setStrokeStyle(2, borderColor)
        .setInteractive();

      // Превью скина
      const preview = this.add.image(50, currentY + 40, skin.texture)
        .setScale(0.8)
        .setOrigin(0, 0.5);

      // Добавляем свечение для легендарных
      if (skin.rarity === 'Легендарный' && !owned) {
        const glow = this.add.image(50, currentY + 40, skin.texture)
          .setScale(0.85)
          .setOrigin(0, 0.5)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.3);
        container.add(glow);
      }

      // Название
      this.add.text(120, currentY + 25, skin.name, {
        fontSize: '16px',
        fontFamily: "'Orbitron', sans-serif",
        color: borderColor
      }).setOrigin(0, 0.5);

      // Описание
      this.add.text(120, currentY + 50, skin.description, {
        fontSize: '11px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);

      // Бонус скорости
      if (skin.speedBonus > 0) {
        this.add.text(120, currentY + 70, `+${skin.speedBonus}% скорость`, {
          fontSize: '10px',
          fontFamily: "'Space Mono', monospace",
          color: COLORS.success
        }).setOrigin(0, 0.5);
      }

      // Статус
      let statusText = '';
      let statusColor = COLORS.text_muted;

      if (selected) {
        statusText = 'ВЫБРАН';
        statusColor = COLORS.success;
      } else if (owned) {
        statusText = 'КУПЛЕНО';
        statusColor = COLORS.primary;
      } else if (skin.price === 0) {
        statusText = 'БЕСПЛАТНО';
        statusColor = COLORS.accent;
      } else {
        statusText = `${skin.price} 💎`;
        statusColor = canAfford ? COLORS.accent : COLORS.danger;
      }

      const status = this.add.text(w - 30, currentY + 40, statusText, {
        fontSize: '14px',
        fontFamily: "'Space Mono', monospace",
        color: statusColor
      }).setOrigin(1, 0.5);

      // Редкость
      const rarityColors = {
        'Обычный': COLORS.text_secondary,
        'Редкий': COLORS.primary,
        'Эпический': COLORS.accent,
        'Легендарный': COLORS.success
      };
      const rarityColor = rarityColors[skin.rarity] || COLORS.text_secondary;
      
      this.add.text(w - 30, currentY + 15, skin.rarity, {
        fontSize: '10px',
        fontFamily: "'Space Mono', monospace",
        color: rarityColor
      }).setOrigin(1, 0.5);

      // Добавляем все в контейнер
      container.add([bg, preview, status]);

      // Эффекты наведения
      bg.on('pointerover', () => {
        bg.setFillStyle(0x2a2a4a);
        preview.setScale(0.9);
      });

      bg.on('pointerout', () => {
        bg.setFillStyle(0x1a1a3a, 0.8);
        preview.setScale(0.8);
      });

      // Обработка клика
      bg.on('pointerdown', () => {
        if (owned && !selected) {
          this.selectSkin(skin);
        } else if (!owned && (skin.price === 0 || canAfford)) {
          this.confirmPurchase(skin);
        } else if (!canAfford && !owned) {
          this.showNoFunds();
        }
      });

      currentY += spacing;
    });

    // Добавляем прокрутку
    const scrollZone = this.add.zone(0, 110, w, h - 160).setOrigin(0).setInteractive();
    
    let startY = 0;
    let startContainerY = 0;

    scrollZone.on('pointerdown', (pointer) => {
      startY = pointer.y;
      startContainerY = container.y;
    });

    scrollZone.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      
      const deltaY = pointer.y - startY;
      const newY = startContainerY + deltaY;
      
      // Ограничение прокрутки
      const minY = -(currentY - (h - 160));
      const maxY = 0;
      
      container.y = Phaser.Math.Clamp(newY, minY, maxY);
    });

    // Кнопка назад
    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('menu'));
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < 100; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setScale(Phaser.Math.FloatBetween(0.2, 1.0));
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
      star.setDepth(-5);
    }
  }

  createSkinTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

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

    // Полиция кибер
    g.clear();
    g.fillStyle(0x3300aa);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0x00ccff);
    g.fillRect(15, 5, 50, 4);
    g.fillStyle(0xff44ff);
    g.fillCircle(25, 8, 3);
    g.fillCircle(45, 8, 3);
    g.fillStyle(0x00ffff);
    g.fillRect(20, 18, 10, 8);
    g.fillRect(40, 18, 10, 8);
    g.fillStyle(0x00ffff);
    g.fillCircle(18, 30, 4);
    g.lineStyle(2, 0xff00ff);
    g.strokeRoundedRect(10, 10, 60, 35, 8);
    g.generateTexture('player_police_cyber', 80, 50);

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

    // Скорая неон
    g.clear();
    g.fillStyle(0xff44ff);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0xffffff);
    g.fillRect(15, 5, 50, 8);
    g.fillStyle(0xff88ff);
    g.fillRect(20, 18, 10, 8);
    g.fillRect(40, 18, 10, 8);
    g.fillStyle(0x00ffff);
    g.fillCircle(18, 30, 4);
    g.fillStyle(0xff00ff);
    g.fillCircle(45, 30, 4);
    g.fillStyle(0xff88ff);
    g.fillRect(35, 5, 5, 8);
    g.fillRect(45, 5, 5, 8);
    g.lineStyle(2, 0x00ffff);
    g.strokeRoundedRect(10, 10, 60, 35, 8);
    g.generateTexture('player_ambulance_neon', 80, 50);

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
    g.fillPolygon([
      { x: 15, y: 25 },
      { x: 65, y: 25 },
      { x: 70, y: 35 },
      { x: 10, y: 35 }
    ]);
    g.fillStyle(0xffffff);
    g.fillCircle(20, 40, 5);
    g.fillCircle(60, 40, 5);
    g.fillStyle(0x44aaff);
    g.fillRect(30, 30, 20, 5);
    g.fillStyle(0x000000);
    g.fillCircle(20, 40, 3);
    g.fillCircle(60, 40, 3);
    g.generateTexture('player_formula', 80, 50);

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

    // Такси неон
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

    // Такси золотое
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

    g.destroy();
  }

  confirmPurchase(skin) {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(50)
      .setScrollFactor(0);

    const panel = this.add.rectangle(w / 2, h / 2, 300, 220, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, COLORS.primary)
      .setDepth(51)
      .setScrollFactor(0);

    // Превью скина
    const preview = this.add.image(w / 2, h / 2 - 50, skin.texture)
      .setScale(1.5)
      .setDepth(52)
      .setScrollFactor(0);

    this.add.text(w / 2, h / 2 + 10, skin.name, {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    if (skin.speedBonus > 0) {
      this.add.text(w / 2, h / 2 + 35, `+${skin.speedBonus}% скорость`, {
        fontSize: '12px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.success
      }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    }

    if (skin.price > 0) {
      this.add.text(w / 2, h / 2 + 60, `${skin.price} 💎`, {
        fontSize: '24px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.accent
      }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    } else {
      this.add.text(w / 2, h / 2 + 60, 'БЕСПЛАТНО', {
        fontSize: '20px',
        fontFamily: "'Orbitron', sans-serif",
        color: COLORS.success
      }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    }

    const yesBtn = this.add.text(w / 2 - 80, h / 2 + 100, 'КУПИТЬ', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#00ff00',
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 8 }
    }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const noBtn = this.add.text(w / 2 + 80, h / 2 + 100, 'ОТМЕНА', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ff0000',
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 8 }
    }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0);

    yesBtn.on('pointerover', () => yesBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }));
    yesBtn.on('pointerout', () => yesBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a1a3a' }));
    yesBtn.on('pointerdown', () => {
      if (gameManager.purchaseSkin(skin.id)) {
        try { audioManager.playSound(this, 'purchase_sound', 0.5); } catch (e) {}
        this.balanceText.setText(`💎 ${gameManager.data.crystals}`);
        this.scene.restart();
      }
      overlay.destroy();
      panel.destroy();
      preview.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    });

    noBtn.on('pointerover', () => noBtn.setStyle({ color: '#ffffff', backgroundColor: '#aa0000' }));
    noBtn.on('pointerout', () => noBtn.setStyle({ color: '#ff0000', backgroundColor: '#1a1a3a' }));
    noBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      preview.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    });
  }

  selectSkin(skin) {
    if (gameManager.selectSkin(skin.id)) {
      try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
      
      // Показываем сообщение
      const w = this.scale.width;
      const msg = this.add.text(w / 2, 200, 'СКИН ВЫБРАН!', {
        fontSize: '24px',
        fontFamily: "'Orbitron', sans-serif",
        color: COLORS.success,
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

      this.tweens.add({
        targets: msg,
        alpha: 0,
        duration: 1500,
        onComplete: () => msg.destroy()
      });

      this.scene.restart();
    }
  }

  showNoFunds() {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(50)
      .setScrollFactor(0);

    const panel = this.add.rectangle(w / 2, h / 2, 300, 150, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, COLORS.danger)
      .setDepth(51)
      .setScrollFactor(0);

    this.add.text(w / 2, h / 2, 'НЕДОСТАТОЧНО\nКРИСТАЛЛОВ!', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.danger,
      align: 'center'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.time.delayedCall(1500, () => {
      overlay.destroy();
      panel.destroy();
    });
  }

  createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      backgroundColor: '#1a1a3a',
      padding: { x: 30, y: 10 },
      stroke: COLORS.primary,
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerover', () => {
      btn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary });
      btn.setScale(1.05);
    });

    btn.on('pointerout', () => {
      btn.setStyle({ color: COLORS.primary, backgroundColor: '#1a1a3a' });
      btn.setScale(1);
    });

    btn.on('pointerdown', callback);
    return btn;
  }
}