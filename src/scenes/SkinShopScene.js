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

export class SkinShopScene extends Phaser.Scene {
  constructor() {
    super('skinShop');
    this.isExiting = false;
    this.lastHoverTime = 0;
    this.currentDetailPanel = null;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('🎮 SkinShop: create started');

    this.createAllSkinTextures();
    this.createBackground();
    this.createStars();
    this.createHeader();
    this.createBalanceDisplay();
    this.createSkinList();
    this.createBackButton();

    console.log('✅ SkinShop: create completed');
  }

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
    const count = 100;
    for (let i = 0; i < count; i++) {
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
  // ДЕТАЛЬНОЕ ОКНО (КОМПАКТНОЕ, С РАБОТАЮЩИМИ КНОПКАМИ)
  // =========================================================================

  openSkinDetail(skin) {
    // Закрываем предыдущее окно
    if (this.currentDetailPanel) {
      this.closeDetailPanel();
    }

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

    // Панель (уменьшена)
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.98);
    panel.fillRoundedRect(w / 2 - 190, h / 2 - 210, 380, 470, 20);
    panel.lineStyle(4, skin.rarity === 'LEGENDARY' ? 0xffaa00 : 0x00ffff, 1);
    panel.strokeRoundedRect(w / 2 - 190, h / 2 - 210, 380, 470, 20);
    panel.setDepth(201).setScrollFactor(0);

    // Крестик закрытия
    const closeX = this.add.circle(w / 2 + 170, h / 2 - 190, 18, 0x440000, 0.8)
      .setStrokeStyle(2, 0xff8888, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(203)
      .setScrollFactor(0);
    const closeIcon = this.add.text(w / 2 + 170, h / 2 - 190, '✕', {
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
      this.closeDetailPanel();
    });

    // Превью (чуть меньше)
    const preview = this.add.image(w / 2, h / 2 - 120, skin.texture).setScale(2.2).setDepth(202).setScrollFactor(0);

    // Название (обрезаем длинные)
    let nameText = skin.name;
    if (nameText.length > 18) {
      nameText = nameText.substring(0, 17) + '…';
    }
    const nameObj = this.add.text(w / 2, h / 2 - 20, nameText, {
      fontSize: '24px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      stroke: skin.rarity === 'LEGENDARY' ? '#ffaa00' : '#00ffff',
      strokeThickness: 3,
      wordWrap: { width: 280 }
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

    // Редкость
    const rarityNames = { 'COMMON': 'ОБЫЧНЫЙ', 'EPIC': 'ЭПИЧЕСКИЙ', 'LEGENDARY': 'ЛЕГЕНДАРНЫЙ' };
    const rarityColors = { 'COMMON': '#aaaaaa', 'EPIC': '#ff44aa', 'LEGENDARY': '#ffaa00' };
    const rarityText = this.add.text(w / 2, h / 2 + 10, `[${rarityNames[skin.rarity]}]`, {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: rarityColors[skin.rarity]
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

    // Описание (сокращённое)
    const descText = this.add.text(w / 2, h / 2 + 40, skin.description, {
      fontSize: '14px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#aaccff',
      align: 'center',
      wordWrap: { width: 280 }
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

    // Лор (одна строка)
    const loreText = this.add.text(w / 2, h / 2 + 80, `"${skin.lore.substring(0, 50)}${skin.lore.length > 50 ? '…' : ''}"`, {
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff',
      align: 'center',
      wordWrap: { width: 280 },
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

    // Характеристики (компактно)
    const statsY = h / 2 + 110;
    const stats = [
      { label: 'СКОР', value: skin.stats.speedBonus, icon: '⚡', color: 0xffff00 },
      { label: 'БРОН', value: skin.stats.armorBonus, icon: '🛡️', color: 0x00ffff },
      { label: 'УПР', value: skin.stats.handlingBonus, icon: '🌀', color: 0xff00ff },
      { label: 'ПРЫЖ', value: skin.stats.jumpBonus, icon: '🚀', color: 0xff8800 }
    ];
    stats.forEach((stat, idx) => {
      const y = statsY + idx * 22;
      this.add.text(w / 2 - 130, y, stat.icon, { fontSize: '14px' }).setOrigin(0, 0.5).setDepth(203).setScrollFactor(0);
      this.add.text(w / 2 - 110, y, stat.label, {
        fontSize: '12px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(203).setScrollFactor(0);

      const barBg = this.add.graphics();
      barBg.fillStyle(0x333333, 0.5);
      barBg.fillRoundedRect(w / 2 + 10, y - 8, 80, 14, 7);
      barBg.setDepth(202).setScrollFactor(0);

      const barFill = this.add.graphics();
      barFill.fillStyle(stat.color, 0.8);
      barFill.fillRoundedRect(w / 2 + 10, y - 8, Math.min(80, stat.value * 1.6), 14, 7);
      barFill.setDepth(202).setScrollFactor(0);

      this.add.text(w / 2 + 100, y, `+${stat.value}`, {
        fontSize: '12px',
        fontFamily: '"Audiowide", sans-serif',
        color: Phaser.Display.Color.ValueToColor(stat.color).rgba
      }).setOrigin(1, 0.5).setDepth(203).setScrollFactor(0);
    });

    // Спецспособность (если есть)
    const specialY = statsY + 100;
    if (skin.stats.special !== 'Нет') {
      const specialBg = this.add.graphics();
      specialBg.fillStyle(0x2a1a2a, 0.8);
      specialBg.fillRoundedRect(w / 2 - 140, specialY - 12, 280, 28, 14);
      specialBg.lineStyle(2, 0xffaa00, 0.7);
      specialBg.strokeRoundedRect(w / 2 - 140, specialY - 12, 280, 28, 14);
      specialBg.setDepth(202).setScrollFactor(0);

      this.add.text(w / 2 - 130, specialY, '✨ ОСОБОЕ:', {
        fontSize: '10px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#ffaa00'
      }).setOrigin(0, 0.5).setDepth(203).setScrollFactor(0);

      this.add.text(w / 2 + 90, specialY, skin.stats.special, {
        fontSize: '12px',
        fontFamily: '"Audiowide", sans-serif',
        color: '#ffaa00'
      }).setOrigin(1, 0.5).setDepth(203).setScrollFactor(0);
    }

    // Кнопки
    const buttonY = h / 2 + 170;
    let actionBtn = null;

    if (!owned) {
      actionBtn = this.createActionButton(w / 2 - 60, buttonY, 'КУПИТЬ', canAfford ? '#00ff00' : '#ff4444');
      actionBtn.setDepth(203).setScrollFactor(0);
    } else if (!selected) {
      actionBtn = this.createActionButton(w / 2 - 60, buttonY, 'ВЫБРАТЬ', '#00ffff');
      actionBtn.setDepth(203).setScrollFactor(0);
    } else {
      const equipped = this.add.text(w / 2 - 60, buttonY, '✓ ВЫБРАНО', {
        fontSize: '18px',
        fontFamily: '"Audiowide", sans-serif',
        color: '#00ff00',
        backgroundColor: '#1a3a1a',
        padding: { x: 20, y: 8 }
      }).setOrigin(0.5).setDepth(203).setScrollFactor(0);
    }

    const cancelBtn = this.createActionButton(w / 2 + 60, buttonY, 'ОТМЕНА', '#ff4444');
    cancelBtn.setDepth(203).setScrollFactor(0);

    // Логика покупки/выбора
    if (actionBtn) {
      actionBtn.on('pointerdown', () => {
        if (actionBtn.getData('isProcessing')) return;
        actionBtn.setData('isProcessing', true);
        if (!owned) {
          if (canAfford) {
            const success = gameManager.purchaseSkin(skin.id);
            if (success) {
              this.playPurchaseSound();
              this.balanceText.setText(`${gameManager.data.crystals}`);
              this.createConfetti(w / 2, h / 2, skin.color);
              this.showMessage('✓ ПОКУПКА УСПЕШНА!', '#00ff00');
              this.closeDetailPanel();
              this.time.delayedCall(800, () => this.scene.restart());
            } else {
              this.showMessage('⚠ ОШИБКА ПОКУПКИ', '#ff4444');
              actionBtn.setData('isProcessing', false);
            }
          } else {
            this.showMessage('⚠ НЕДОСТАТОЧНО КРИСТАЛЛОВ', '#ff4444');
            actionBtn.setData('isProcessing', false);
          }
        } else if (!selected) {
          const success = gameManager.selectSkin(skin.id);
          if (success) {
            this.playSelectSound();
            this.showMessage(`✓ ВЫБРАН: ${skin.name}`, '#00ff00');
            this.createConfetti(w / 2, 200, skin.color);
            this.closeDetailPanel();
            this.time.delayedCall(800, () => this.scene.restart());
          } else {
            this.showMessage('⚠ ОШИБКА ВЫБОРА', '#ff4444');
            actionBtn.setData('isProcessing', false);
          }
        }
      });
    }

    cancelBtn.on('pointerdown', () => {
      this.playClickSound();
      this.closeDetailPanel();
    });

    // Сохраняем элементы для закрытия
    this.currentDetailPanel = { overlay, panel, closeX, closeIcon, preview, nameObj, rarityText, descText, loreText, actionBtn, cancelBtn };
  }

  createActionButton(x, y, text, color) {
    const btn = this.add.graphics();
    btn.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.9);
    btn.fillRoundedRect(x - 55, y - 20, 110, 40, 20);
    btn.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
    btn.strokeRoundedRect(x - 55, y - 20, 110, 40, 20);

    const btnText = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    const hit = this.add.rectangle(x, y, 110, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(300);
    hit.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
      btn.fillRoundedRect(x - 55, y - 20, 110, 40, 20);
      btn.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
      btn.strokeRoundedRect(x - 55, y - 20, 110, 40, 20);
      btnText.setScale(1.05);
      this.playHoverSound();
    });
    hit.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.9);
      btn.fillRoundedRect(x - 55, y - 20, 110, 40, 20);
      btn.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
      btn.strokeRoundedRect(x - 55, y - 20, 110, 40, 20);
      btnText.setScale(1);
    });
    hit.on('pointerdown', (pointer) => pointer.event.stopPropagation());
    hit.setData('isProcessing', false);
    return hit;
  }

  closeDetailPanel() {
    if (!this.currentDetailPanel) return;
    const { overlay, panel, closeX, closeIcon, preview, nameObj, rarityText, descText, loreText, actionBtn, cancelBtn } = this.currentDetailPanel;
    const all = [overlay, panel, closeX, closeIcon, preview, nameObj, rarityText, descText, loreText, actionBtn, cancelBtn];
    all.forEach(obj => {
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
    this.currentDetailPanel = null;
  }

  // =========================================================================
  // НИЖНЯЯ ПАНЕЛЬ
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
  // ТЕКСТУРЫ (остаются те же, что были)
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

    // 4. Такси Пятого элемента
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