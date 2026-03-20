import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

// =========================================================================
// СПИСОК СКИНОВ (6 штук, с детальным описанием)
// =========================================================================

const SKINS = [
  {
    id: 'taxi_classic',
    name: 'КЛАССИЧЕСКОЕ ТАКСИ',
    texture: 'player_taxi_classic',
    price: 0,
    rarity: 'COMMON',
    description: 'Жёлтое такси, которое всё начинало.',
    lore: 'Первое такси в галактике. Надёжное и простое, как космос.',
    stats: {
      speedBonus: 0,
      armorBonus: 0,
      handlingBonus: 0,
      jumpBonus: 0,
      special: 'Нет'
    },
    color: 0xffaa00,
    glowColor: 0xffaa00,
    effects: 'none'
  },
  {
    id: 'police',
    name: 'ПОЛИЦЕЙСКИЙ ПЕРЕХВАТЧИК',
    texture: 'player_police',
    price: 200,
    rarity: 'COMMON',
    description: 'Спецтранспорт для поимки нарушителей.',
    lore: 'Создан для быстрой реакции. Мигалки и сирена в комплекте.',
    stats: {
      speedBonus: 10,
      armorBonus: 5,
      handlingBonus: 5,
      jumpBonus: 2,
      special: 'Мигалки'
    },
    color: 0x2244aa,
    glowColor: 0x3366ff,
    effects: 'siren'
  },
  {
    id: 'sport',
    name: 'ГОНОЧНЫЙ БОЛИД',
    texture: 'player_sport',
    price: 350,
    rarity: 'COMMON',
    description: 'Скорость и маневренность.',
    lore: 'Сделан для гонок, но летает не хуже.',
    stats: {
      speedBonus: 15,
      armorBonus: 2,
      handlingBonus: 10,
      jumpBonus: 5,
      special: 'Турбо'
    },
    color: 0xff3333,
    glowColor: 0xff5500,
    effects: 'flames'
  },
  {
    id: 'fifth_element',
    name: 'ТАКСИ ПЯТОГО ЭЛЕМЕНТА',
    texture: 'player_fifth_element',
    price: 600,
    rarity: 'EPIC',
    description: 'Летающее такси из культового фильма.',
    lore: 'Спасало мир, теперь спасает ваш кошелёк.',
    stats: {
      speedBonus: 25,
      armorBonus: 15,
      handlingBonus: 20,
      jumpBonus: 15,
      special: 'Антигравитация'
    },
    color: 0x44ccff,
    glowColor: 0x88ffff,
    effects: 'hover'
  },
  {
    id: 'cyber',
    name: 'КИБЕРПАНК 2077',
    texture: 'player_cyber',
    price: 1000,
    rarity: 'EPIC',
    description: 'Неоновый драйвер из будущего.',
    lore: 'С искусственным интеллектом и встроенным кофеваркой.',
    stats: {
      speedBonus: 40,
      armorBonus: 20,
      handlingBonus: 35,
      jumpBonus: 25,
      special: 'Глитч'
    },
    color: 0xaa44ff,
    glowColor: 0xcc88ff,
    effects: 'cyber'
  },
  {
    id: 'void',
    name: 'ПОЖИРАТЕЛЬ ПУСТОТЫ',
    texture: 'player_void',
    price: 1500,
    rarity: 'LEGENDARY',
    description: 'Тёмная материя в деле.',
    lore: 'Поглощает свет и надежды врагов.',
    stats: {
      speedBonus: 75,
      armorBonus: 35,
      handlingBonus: 35,
      jumpBonus: 40,
      special: 'Поглощение'
    },
    color: 0x4400aa,
    glowColor: 0x8800ff,
    effects: 'void'
  }
];

// =========================================================================
// ОСНОВНОЙ КЛАСС СЦЕНЫ МАГАЗИНА СКИНОВ
// =========================================================================

export class SkinShopScene extends Phaser.Scene {
  constructor() {
    super('skinShop');
    this.isExiting = false;
    this.lastHoverTime = 0;
    this.detailObjects = []; // хранилище для объектов детального окна
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('🎮 SkinShop: create started');

    // Создаём все текстуры
    this.createAllSkinTextures();

    // Фон (статичный, без лишних анимаций)
    this.createBackground();

    // Звёзды
    this.createStars();

    // Заголовок
    this.createHeader();

    // Баланс кристаллов (круглая панель)
    this.createBalanceDisplay();

    // Список скинов (6 карточек)
    this.createSkinList();

    // Кнопка назад (внизу)
    this.createBackButton();

    console.log('✅ SkinShop: create completed');
  }

  // =========================================================================
  // СОЗДАНИЕ ФОНА
  // =========================================================================

  createBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.rectangle(0, 0, w, h, 0x030712).setOrigin(0);
    const grad = this.add.graphics();
    grad.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 0.3);
    grad.fillRect(0, 0, w, h);
    grad.setDepth(-5);
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.FloatBetween(1, 2.5),
        Phaser.Utils.Array.GetRandom([0xffffff, 0xffffaa, 0xffaaff]),
        Phaser.Math.FloatBetween(0.2, 0.6)
      );
      star.setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  // =========================================================================
  // ЗАГОЛОВОК
  // =========================================================================

  createHeader() {
    const w = this.scale.width;
    this.add.text(w / 2, 45, 'МАГАЗИН СКИНОВ', {
      fontSize: '38px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 5,
      shadow: { blur: 20, color: '#00ffff', fill: true }
    }).setOrigin(0.5);
  }

  // =========================================================================
  // БАЛАНС КРИСТАЛЛОВ
  // =========================================================================

  createBalanceDisplay() {
    const w = this.scale.width;
    const container = this.add.container(w / 2, 95);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 0.9);
    bg.fillRoundedRect(-120, -20, 240, 40, 20);
    bg.lineStyle(2, 0x00ffff, 0.8);
    bg.strokeRoundedRect(-120, -20, 240, 40, 20);
    container.add(bg);

    const icon = this.add.text(-50, 0, '💎', { fontSize: '28px' }).setOrigin(0.5);
    container.add(icon);

    this.balanceText = this.add.text(20, 0, `${gameManager.data.crystals}`, {
      fontSize: '24px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5);
    container.add(this.balanceText);
  }

  // =========================================================================
  // СПИСОК СКИНОВ (6 КАРТОЧЕК)
  // =========================================================================

  createSkinList() {
    const w = this.scale.width;
    const startY = 140;
    const cardHeight = 110;
    const spacing = 6;

    SKINS.forEach((skin, index) => {
      const y = startY + index * (cardHeight + spacing);
      const owned = gameManager.getOwnedSkins().includes(skin.id);
      const selected = gameManager.getCurrentSkin() === skin.id;
      const canAfford = gameManager.data.crystals >= skin.price;
      const card = this.createSkinCard(skin, w, y, owned, selected, canAfford);
      this.add.existing(card);
    });
  }

  createSkinCard(skin, w, y, owned, selected, canAfford) {
    const group = this.add.group();

    let borderColor = 0x666666;
    let bgColor = 0x0a0a1a;
    if (selected) {
      borderColor = 0x00ff00;
      bgColor = 0x1a3a1a;
    } else if (owned) {
      borderColor = 0x00ffff;
      bgColor = 0x1a2a3a;
    } else if (canAfford) {
      borderColor = 0xffaa00;
    }

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.9);
    bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 105, 12);
    bg.lineStyle(3, borderColor, 1);
    bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 105, 12);
    group.add(bg);

    const preview = this.add.image(50, y + 52, skin.texture).setScale(0.85).setOrigin(0.5);
    group.add(preview);

    const nameText = this.add.text(110, y + 20, skin.name, {
      fontSize: '15px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#888888',
      strokeThickness: 1,
      wordWrap: { width: 200 }
    }).setOrigin(0, 0.5);
    group.add(nameText);

    const rarityNames = { 'COMMON': 'ОБЫЧНЫЙ', 'EPIC': 'ЭПИЧЕСКИЙ', 'LEGENDARY': 'ЛЕГЕНДАРНЫЙ' };
    const rarityColors = { 'COMMON': '#aaaaaa', 'EPIC': '#ff44aa', 'LEGENDARY': '#ffaa00' };
    const rarityText = this.add.text(110, y + 45, `[${rarityNames[skin.rarity]}]`, {
      fontSize: '10px',
      fontFamily: '"Share Tech Mono", monospace',
      color: rarityColors[skin.rarity]
    }).setOrigin(0, 0.5);
    group.add(rarityText);

    const statsText = this.add.text(110, y + 70,
      `⚡+${skin.stats.speedBonus}  🛡️+${skin.stats.armorBonus}  🌀+${skin.stats.handlingBonus}  🚀+${skin.stats.jumpBonus}`,
      { fontSize: '9px', fontFamily: '"Share Tech Mono", monospace', color: '#88ff88' }
    ).setOrigin(0, 0.5);
    group.add(statsText);

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
    const status = this.add.text(w - 40, y + 52, statusText, {
      fontSize: '13px',
      fontFamily: '"Audiowide", sans-serif',
      color: statusColor,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0.5);
    group.add(status);

    // Интерактивная область
    const hitArea = this.add.rectangle(w / 2, y + 52, w - 40, 105, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5)
      .setDepth(100);
    hitArea.skinData = skin;
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1a1a3a, 0.9);
      bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 105, 12);
      bg.lineStyle(3, borderColor, 1);
      bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 105, 12);
      preview.setScale(0.9);
      this.playHoverSound();
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(bgColor, 0.9);
      bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 105, 12);
      bg.lineStyle(3, borderColor, 1);
      bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 105, 12);
      preview.setScale(0.85);
    });
    hitArea.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      this.playClickSound();
      this.openSkinDetail(skin);
    });

    group.add(hitArea);
    return group;
  }

  // =========================================================================
  // ДЕТАЛЬНОЕ ОКНО СКИНА (ПОЛНОСТЬЮ ПЕРЕРАБОТАНО)
  // =========================================================================

  openSkinDetail(skin) {
    // Удаляем предыдущее детальное окно, если оно было открыто
    this.closeCurrentDetail();

    const w = this.scale.width;
    const h = this.scale.height;

    const owned = gameManager.getOwnedSkins().includes(skin.id);
    const selected = gameManager.getCurrentSkin() === skin.id;
    const canAfford = gameManager.data.crystals >= skin.price;

    // Затемнение
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0)
      .setDepth(200)
      .setScrollFactor(0)
      .setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.9, duration: 300 });

    // Панель
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.98);
    panel.fillRoundedRect(w / 2 - 200, h / 2 - 250, 400, 540, 20);
    panel.lineStyle(4, skin.rarity === 'LEGENDARY' ? 0xffaa00 : 0x00ffff, 1);
    panel.strokeRoundedRect(w / 2 - 200, h / 2 - 250, 400, 540, 20);
    panel.setDepth(201).setScrollFactor(0);

    // Круглая кнопка закрытия
    const closeX = this.add.circle(w / 2 + 180, h / 2 - 230, 18, 0x440000, 0.8)
      .setStrokeStyle(2, 0xff8888, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(203)
      .setScrollFactor(0);
    const closeIcon = this.add.text(w / 2 + 180, h / 2 - 230, '✕', {
      fontSize: '24px',
      fontFamily: 'sans-serif',
      color: '#ff8888',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(204).setScrollFactor(0);
    closeX.on('pointerover', () => {
      closeX.setFillStyle(0xaa0000);
      closeIcon.setColor('#ffffff');
    });
    closeX.on('pointerout', () => {
      closeX.setFillStyle(0x440000);
      closeIcon.setColor('#ff8888');
    });
    closeX.on('pointerdown', () => {
      this.playClickSound();
      this.closeCurrentDetail();
    });

    // Превью
    const preview = this.add.image(w / 2, h / 2 - 140, skin.texture).setScale(2.5).setDepth(202).setScrollFactor(0);

    // Название
    const nameText = this.add.text(w / 2, h / 2 - 30, skin.name, {
      fontSize: '28px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      stroke: skin.rarity === 'LEGENDARY' ? '#ffaa00' : '#00ffff',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

    // Редкость
    const rarityNames = { 'COMMON': 'ОБЫЧНЫЙ', 'EPIC': 'ЭПИЧЕСКИЙ', 'LEGENDARY': 'ЛЕГЕНДАРНЫЙ' };
    const rarityColors = { 'COMMON': '#aaaaaa', 'EPIC': '#ff44aa', 'LEGENDARY': '#ffaa00' };
    const rarityText = this.add.text(w / 2, h / 2 + 5, `[${rarityNames[skin.rarity]}]`, {
      fontSize: '16px',
      fontFamily: '"Share Tech Mono", monospace',
      color: rarityColors[skin.rarity]
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

    // Описание
    const descText = this.add.text(w / 2, h / 2 + 35, skin.description, {
      fontSize: '16px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#aaccff',
      align: 'center',
      wordWrap: { width: 320 }
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

    // Лор
    const loreText = this.add.text(w / 2, h / 2 + 85, `"${skin.lore}"`, {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff',
      align: 'center',
      wordWrap: { width: 320 },
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

    // Характеристики
    const statsY = h / 2 + 140;
    const stats = [
      { label: 'СКОРОСТЬ', value: skin.stats.speedBonus, icon: '⚡', color: 0xffff00 },
      { label: 'БРОНЯ', value: skin.stats.armorBonus, icon: '🛡️', color: 0x00ffff },
      { label: 'УПРАВЛЕНИЕ', value: skin.stats.handlingBonus, icon: '🌀', color: 0xff00ff },
      { label: 'ПРЫЖОК', value: skin.stats.jumpBonus, icon: '🚀', color: 0xff8800 }
    ];
    stats.forEach((stat, idx) => {
      const y = statsY + idx * 30;
      this.add.text(w / 2 - 140, y, stat.icon, { fontSize: '18px' }).setOrigin(0, 0.5).setDepth(203).setScrollFactor(0);
      this.add.text(w / 2 - 120, y, stat.label, {
        fontSize: '14px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(203).setScrollFactor(0);

      const barBg = this.add.graphics();
      barBg.fillStyle(0x333333, 0.5);
      barBg.fillRoundedRect(w / 2 + 20, y - 8, 100, 16, 8);
      barBg.setDepth(202).setScrollFactor(0);

      const barFill = this.add.graphics();
      barFill.fillStyle(stat.color, 0.8);
      barFill.fillRoundedRect(w / 2 + 20, y - 8, Math.min(100, stat.value * 2), 16, 8);
      barFill.setDepth(202).setScrollFactor(0);

      this.add.text(w / 2 + 130, y, `+${stat.value}`, {
        fontSize: '16px',
        fontFamily: '"Audiowide", sans-serif',
        color: Phaser.Display.Color.ValueToColor(stat.color).rgba
      }).setOrigin(1, 0.5).setDepth(203).setScrollFactor(0);
    });

    // Спецспособность
    const specialY = statsY + 130;
    if (skin.stats.special !== 'Нет') {
      const specialBg = this.add.graphics();
      specialBg.fillStyle(0x2a1a2a, 0.8);
      specialBg.fillRoundedRect(w / 2 - 150, specialY - 15, 300, 40, 20);
      specialBg.lineStyle(2, 0xffaa00, 0.7);
      specialBg.strokeRoundedRect(w / 2 - 150, specialY - 15, 300, 40, 20);
      specialBg.setDepth(202).setScrollFactor(0);

      this.add.text(w / 2 - 140, specialY, '✨ ОСОБОЕ:', {
        fontSize: '12px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#ffaa00'
      }).setOrigin(0, 0.5).setDepth(203).setScrollFactor(0);

      this.add.text(w / 2 + 100, specialY, skin.stats.special, {
        fontSize: '14px',
        fontFamily: '"Audiowide", sans-serif',
        color: '#ffaa00'
      }).setOrigin(1, 0.5).setDepth(203).setScrollFactor(0);
    }

    // Кнопки: основное действие (Купить/Выбрать) и Отмена
    const buttonY = h / 2 + 220;
    let actionBtn;

    if (!owned) {
      actionBtn = this.createRoundedButton(w / 2 - 100, buttonY, 'КУПИТЬ', canAfford ? '#00ff00' : '#ff4444');
    } else if (!selected) {
      actionBtn = this.createRoundedButton(w / 2 - 100, buttonY, 'ВЫБРАТЬ', '#00ffff');
    } else {
      actionBtn = null;
      const equipped = this.add.text(w / 2, buttonY, '✓ ВЫБРАНО', {
        fontSize: '20px',
        fontFamily: '"Audiowide", sans-serif',
        color: '#00ff00',
        backgroundColor: '#1a3a1a',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setDepth(203).setScrollFactor(0);
      this.detailObjects.push(equipped);
    }

    const cancelBtn = this.createRoundedButton(w / 2 + 100, buttonY, 'ОТМЕНА', '#ff4444');

    if (actionBtn) {
      actionBtn.setDepth(203).setScrollFactor(0);
      actionBtn.on('pointerdown', () => {
        if (!owned && canAfford) {
          // Покупка
          if (gameManager.purchaseSkin(skin.id)) {
            this.playPurchaseSound();
            this.balanceText.setText(`${gameManager.data.crystals}`);
            this.createConfetti(w / 2, h / 2, skin.color);
            this.showMessage('✓ ПОКУПКА УСПЕШНА!', '#00ff00');
            this.closeCurrentDetail();
            this.time.delayedCall(800, () => this.scene.restart());
          } else {
            this.showMessage('⚠ ОШИБКА ПОКУПКИ', '#ff4444');
          }
        } else if (!owned && !canAfford) {
          this.showMessage('⚠ НЕДОСТАТОЧНО КРИСТАЛЛОВ', '#ff4444');
        } else if (owned && !selected) {
          // Выбор скина
          if (gameManager.selectSkin(skin.id)) {
            this.playSelectSound();
            this.showMessage(`✓ ВЫБРАН: ${skin.name}`, '#00ff00');
            this.createConfetti(w / 2, h / 2, skin.color);
            this.closeCurrentDetail();
            this.time.delayedCall(800, () => this.scene.restart());
          }
        }
      });
    }

    cancelBtn.setDepth(203).setScrollFactor(0);
    cancelBtn.on('pointerdown', () => {
      this.playClickSound();
      this.closeCurrentDetail();
    });

    // Сохраняем все объекты окна для последующего удаления
    this.detailObjects.push(overlay, panel, closeX, closeIcon, preview, nameText, rarityText, descText, loreText);
    if (actionBtn) this.detailObjects.push(actionBtn);
    this.detailObjects.push(cancelBtn);
  }

  createRoundedButton(x, y, text, color) {
    const btn = this.add.graphics();
    btn.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.8);
    btn.fillRoundedRect(x - 70, y - 20, 140, 40, 20);
    btn.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
    btn.strokeRoundedRect(x - 70, y - 20, 140, 40, 20);

    const btnText = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    const hit = this.add.rectangle(x, y, 140, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(300);
    hit.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
      btn.fillRoundedRect(x - 70, y - 20, 140, 40, 20);
      btn.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
      btn.strokeRoundedRect(x - 70, y - 20, 140, 40, 20);
      btnText.setScale(1.05);
      this.playHoverSound();
    });
    hit.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.8);
      btn.fillRoundedRect(x - 70, y - 20, 140, 40, 20);
      btn.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
      btn.strokeRoundedRect(x - 70, y - 20, 140, 40, 20);
      btnText.setScale(1);
    });
    hit.on('pointerdown', (pointer) => pointer.event.stopPropagation());

    // Сохраняем элементы, чтобы потом уничтожить
    this.detailObjects.push(btn, btnText, hit);
    return hit;
  }

  closeCurrentDetail() {
    if (!this.detailObjects.length) return;
    this.detailObjects.forEach(obj => {
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
    this.detailObjects = [];
  }

  // =========================================================================
  // КНОПКА НАЗАД
  // =========================================================================

  createBackButton() {
    const w = this.scale.width;
    const h = this.scale.height;

    const backBtn = this.add.text(w / 2, h - 25, '⏎ НАЗАД В МЕНЮ', {
      fontSize: '20px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 2,
      backgroundColor: '#1a1a3a',
      padding: { x: 25, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => {
      backBtn.setStyle({ backgroundColor: '#2a2a5a', stroke: '#ffffff' });
      backBtn.setScale(1.05);
      this.playHoverSound();
    });
    backBtn.on('pointerout', () => {
      backBtn.setStyle({ backgroundColor: '#1a1a3a', stroke: '#00ffff' });
      backBtn.setScale(1);
    });
    backBtn.on('pointerdown', () => {
      if (this.isExiting) return;
      this.isExiting = true;
      this.playClickSound();
      this.scene.start('menu');
    });
  }

  // =========================================================================
  // ТЕКСТУРЫ СКИНОВ (6 штук, детализированные)
  // =========================================================================

  createAllSkinTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // 1. Классическое такси
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

    // 2. Полицейский перехватчик
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

    // 3. Гоночный болид
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
    g.generateTexture('player_sport', 80, 50);

    // 4. Такси из Пятого элемента
    g.clear();
    g.fillStyle(0x44ccff);
    g.fillRoundedRect(10, 10, 60, 35, 8);
    g.fillStyle(0x88ffff);
    g.fillRect(12, 5, 56, 6);
    g.fillStyle(0xffffff);
    g.fillTriangle(5, 20, 15, 15, 15, 25);
    g.fillTriangle(75, 20, 65, 15, 65, 25);
    g.fillStyle(0xffaa44);
    g.fillCircle(18, 30, 4);
    g.fillCircle(48, 30, 4);
    g.fillStyle(0xffff00);
    g.fillRect(35, 30, 10, 5);
    g.generateTexture('player_fifth_element', 80, 50);

    // 5. Киберпанк 2077
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

    // 6. Пожиратель пустоты
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
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // =========================================================================

  showMessage(text, color) {
    const w = this.scale.width;
    const h = this.scale.height;
    const msg = this.add.text(w / 2, h / 2, text, {
      fontSize: '24px',
      fontFamily: '"Audiowide", sans-serif',
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: '#0a1a0a',
      padding: { x: 30, y: 15 },
      shadow: { blur: 10, color: color, fill: true }
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0);
    msg.setScale(0.5);
    this.tweens.add({ targets: msg, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.out' });
    this.tweens.add({ targets: msg, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 1000, delay: 1500, onComplete: () => msg.destroy() });
  }

  createConfetti(x, y, color) {
    for (let i = 0; i < 20; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(3, 6), color, 0.8);
      p.setBlendMode(Phaser.BlendModes.ADD);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(150, 350);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 200;
      this.tweens.add({ targets: p, x: x + vx * 0.5, y: y + vy * 0.5, alpha: 0, scale: 0, duration: 1000, onComplete: () => p.destroy() });
    }
  }

  playHoverSound() {
    const now = Date.now();
    if (now - this.lastHoverTime < 50) return;
    this.lastHoverTime = now;
    try { audioManager.playSound(this, 'tap_sound', 0.1); } catch(e) {}
  }
  playClickSound() { try { audioManager.playSound(this, 'tap_sound', 0.3); } catch(e) {} }
  playSelectSound() { try { audioManager.playSound(this, 'level_up_sound', 0.4); } catch(e) {} }
  playPurchaseSound() { try { audioManager.playSound(this, 'purchase_sound', 0.5); } catch(e) {} }

  onResize() { this.scene.restart(); }
  shutdown() { this.tweens.killAll(); console.log('SkinShopScene shutdown'); }
}