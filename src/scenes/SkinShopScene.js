import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

const SKINS = [
  // ... (список скинов остаётся без изменений) ...
];

export class SkinShopScene extends Phaser.Scene {
  constructor() {
    super('skinShop');
    this.optimizeLowEnd = false;
    this.isExiting = false;
    this.skinCards = [];
    this.stars = [];
    this.lastHoverTime = 0;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('🎮 SkinShop: create started');

    // Проверяем производительность
    this.checkPerformance();

    // Создаём текстуры
    this.createAllSkinTextures();

    // Фон (без масок)
    this.createBackground();

    // Звёзды
    this.createStars();

    // Заголовок
    this.createHeader();

    // Баланс
    this.createBalanceDisplay();

    // Список скинов (без маски)
    this.createSkinList();

    // Нижняя панель
    this.createFooter();

    // Обработчик клавиши ESC
    this.input.keyboard.on('keydown-ESC', () => this.goBackToMenu());

    // Обработчик ресайза
    this.scale.on('resize', () => this.scene.restart(), this);

    console.log('✅ SkinShop: create completed');
  }

  // =========================================================================
  // ПРОИЗВОДИТЕЛЬНОСТЬ
  // =========================================================================

  checkPerformance() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const lowMemory = navigator.deviceMemory ? navigator.deviceMemory < 4 : false;
    this.optimizeLowEnd = isMobile || lowMemory;
    if (this.optimizeLowEnd) console.log('⚡ Low-end mode');
  }

  // =========================================================================
  // ФОН
  // =========================================================================

  createBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(0, 0, w, h, 0x030712).setOrigin(0);

    // Простой градиент (без анимации)
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 0.3);
    gradient.fillRect(0, 0, w, h);
    gradient.setDepth(-10);

    // Неоновые углы
    const corners = [
      { x: 0, y: 0, color: 0x00ffff },
      { x: w, y: 0, color: 0xff00ff },
      { x: 0, y: h, color: 0xffff00 },
      { x: w, y: h, color: 0x00ff00 }
    ];
    corners.forEach(corner => {
      const glow = this.add.circle(corner.x, corner.y, 250, corner.color, 0.05);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setOrigin(corner.x === 0 ? 0 : 1, corner.y === 0 ? 0 : 1);
    });
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;
    const count = this.optimizeLowEnd ? 60 : 120;
    for (let i = 0; i < count; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.FloatBetween(1, 3),
        Phaser.Utils.Array.GetRandom([0x4444ff, 0xff44ff, 0x44ff44, 0xffff44]),
        Phaser.Math.FloatBetween(0.3, 0.7)
      );
      star.setBlendMode(Phaser.BlendModes.ADD);
      this.stars.push(star);
    }
  }

  // =========================================================================
  // ЗАГОЛОВОК И БАЛАНС
  // =========================================================================

  createHeader() {
    const w = this.scale.width;
    this.add.text(w / 2, 50, 'МАГАЗИН СКИНОВ', {
      fontSize: '36px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 5,
      shadow: { blur: 20, color: '#00ffff', fill: true }
    }).setOrigin(0.5);
  }

  createBalanceDisplay() {
    const w = this.scale.width;
    const container = this.add.container(w / 2, 100);
    const bg = this.add.rectangle(0, 0, 280, 45, 0x0a0a1a, 0.9)
      .setStrokeStyle(3, 0x00ffff, 0.8);
    const icon = this.add.text(-80, 0, '💎', { fontSize: '32px' }).setOrigin(0.5);
    this.balanceText = this.add.text(20, 0, `${gameManager.data.crystals}`, {
      fontSize: '28px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, 0.5);
    const label = this.add.text(0, -20, 'КРИСТАЛЛЫ', {
      fontSize: '10px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff'
    }).setOrigin(0.5);
    container.add([bg, icon, this.balanceText, label]);
  }

  // =========================================================================
  // СПИСОК СКИНОВ (БЕЗ МАСКИ, ПРОСТАЯ ПРОКРУТКА)
  // =========================================================================

  createSkinList() {
    const w = this.scale.width;
    const h = this.scale.height;
    const listTop = 150;
    const listHeight = h - 220;

    // Контейнер для всех карточек
    this.skinContainer = this.add.container(0, listTop);

    // Сортируем скины по редкости
    const rarityOrder = { 'COMMON': 0, 'RARE': 1, 'EPIC': 2, 'LEGENDARY': 3 };
    const sortedSkins = [...SKINS].sort((a, b) => {
      if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      return a.price - b.price;
    });

    let currentY = 10;
    const cardHeight = 140;
    let currentRarity = null;
    const rarityNames = { 'COMMON': 'ОБЫЧНЫЙ', 'RARE': 'РЕДКИЙ', 'EPIC': 'ЭПИЧЕСКИЙ', 'LEGENDARY': 'ЛЕГЕНДАРНЫЙ' };
    const rarityColors = { 'COMMON': '#aaaaaa', 'RARE': '#44aaff', 'EPIC': '#ff44aa', 'LEGENDARY': '#ffaa00' };

    sortedSkins.forEach(skin => {
      if (skin.rarity !== currentRarity) {
        currentRarity = skin.rarity;
        const sep = this.add.text(w / 2, currentY, `⚡ ${rarityNames[skin.rarity]} ТИР ⚡`, {
          fontSize: '18px',
          fontFamily: '"Audiowide", sans-serif',
          color: rarityColors[skin.rarity],
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);
        this.skinContainer.add(sep);
        currentY += 40;
      }

      const owned = gameManager.getOwnedSkins().includes(skin.id);
      const selected = gameManager.getCurrentSkin() === skin.id;
      const canAfford = gameManager.data.crystals >= skin.price;

      const card = this.createSkinCard(skin, w, currentY, owned, selected, canAfford);
      this.skinContainer.add(card);
      currentY += cardHeight;
    });

    // Запоминаем границы прокрутки
    this.minScrollY = -(currentY - listHeight + 20);
    this.maxScrollY = listTop;
    this.skinContainer.y = listTop;

    // Настраиваем зону для перетаскивания
    this.setupScrolling(listTop, listHeight);
  }

  createSkinCard(skin, w, y, owned, selected, canAfford) {
    const group = this.add.group();

    // Цвета
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

    // Фон карточки
    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.9);
    bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 120, 12);
    bg.lineStyle(3, borderColor, 1);
    bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 120, 12);
    group.add(bg);

    // Превью
    const preview = this.add.image(50, y + 60, skin.texture).setScale(1.0).setOrigin(0.5);
    group.add(preview);

    // Название
    const nameText = this.add.text(120, y + 25, skin.name, {
      fontSize: '18px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: borderColor === 0x00ffff ? '#00ffff' : '#888888',
      strokeThickness: 1
    }).setOrigin(0, 0.5);
    group.add(nameText);

    // Редкость
    const rarityNames = { 'COMMON': 'ОБЫЧНЫЙ', 'RARE': 'РЕДКИЙ', 'EPIC': 'ЭПИЧЕСКИЙ', 'LEGENDARY': 'ЛЕГЕНДАРНЫЙ' };
    const rarityColors = { 'COMMON': '#aaaaaa', 'RARE': '#44aaff', 'EPIC': '#ff44aa', 'LEGENDARY': '#ffaa00' };
    const rarityText = this.add.text(120, y + 50, `[${rarityNames[skin.rarity]}]`, {
      fontSize: '11px',
      fontFamily: '"Share Tech Mono", monospace',
      color: rarityColors[skin.rarity]
    }).setOrigin(0, 0.5);
    group.add(rarityText);

    // Статы
    const statsText = this.add.text(120, y + 80,
      `⚡+${skin.stats.speedBonus}  🛡️+${skin.stats.armorBonus}  🌀+${skin.stats.handlingBonus}  🚀+${skin.stats.jumpBonus}`,
      { fontSize: '11px', fontFamily: '"Share Tech Mono", monospace', color: '#88ff88' }
    ).setOrigin(0, 0.5);
    group.add(statsText);

    // Статус
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
    group.add(status);

    // ===== ИНТЕРАКТИВНАЯ ОБЛАСТЬ (КЛЮЧЕВОЕ) =====
    const hitArea = this.add.rectangle(w / 2, y + 60, w - 40, 120, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5)
      .setDepth(100);  // высокий depth, чтобы быть поверх

    hitArea.skinData = skin;
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

    group.add(hitArea);
    return group;
  }

  setupScrolling(listTop, listHeight) {
    const w = this.scale.width;

    // Создаём зону для перетаскивания (но не для кликов)
    this.scrollZone = this.add.zone(w / 2, listTop + listHeight / 2, w, listHeight)
      .setInteractive({ draggable: true })
      .setDepth(0);

    let isDragging = false;
    let lastY = 0;
    let scrollVelocity = 0;
    let inertiaTimer = null;

    const stopInertia = () => {
      if (inertiaTimer) clearTimeout(inertiaTimer);
      inertiaTimer = null;
    };

    const applyInertia = () => {
      if (!this.skinContainer) return;
      if (Math.abs(scrollVelocity) < 0.5) {
        scrollVelocity = 0;
        return;
      }
      scrollVelocity *= 0.95;
      let newY = this.skinContainer.y + scrollVelocity;
      if (newY < this.minScrollY) {
        newY = this.minScrollY;
        scrollVelocity = 0;
      } else if (newY > this.maxScrollY) {
        newY = this.maxScrollY;
        scrollVelocity = 0;
      }
      this.skinContainer.y = newY;
      if (Math.abs(scrollVelocity) > 0.5) {
        inertiaTimer = setTimeout(applyInertia, 16);
      }
    };

    this.scrollZone.on('pointerdown', (pointer) => {
      stopInertia();
      isDragging = true;
      lastY = pointer.y;
      scrollVelocity = 0;
    });

    this.scrollZone.on('pointermove', (pointer) => {
      if (!isDragging) return;
      const delta = pointer.y - lastY;
      scrollVelocity = delta;
      let newY = this.skinContainer.y + delta;
      // Резиновый эффект
      if (newY < this.minScrollY) {
        newY = this.minScrollY + (newY - this.minScrollY) * 0.2;
      } else if (newY > this.maxScrollY) {
        newY = this.maxScrollY + (newY - this.maxScrollY) * 0.2;
      }
      this.skinContainer.y = newY;
      lastY = pointer.y;
    });

    this.scrollZone.on('pointerup', () => {
      isDragging = false;
      if (Math.abs(scrollVelocity) > 2) applyInertia();
    });
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

    // Затемнение
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0)
      .setDepth(200)
      .setScrollFactor(0)
      .setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.9, duration: 300 });

    // Панель
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.98);
    panel.fillRoundedRect(w / 2 - 200, h / 2 - 250, 400, 520, 20);
    panel.lineStyle(4, skin.rarity === 'LEGENDARY' ? 0xffaa00 : 0x00ffff, 1);
    panel.strokeRoundedRect(w / 2 - 200, h / 2 - 250, 400, 520, 20);
    panel.setDepth(201).setScrollFactor(0);

    // Превью
    const preview = this.add.image(w / 2, h / 2 - 120, skin.texture)
      .setScale(2.5)
      .setDepth(202)
      .setScrollFactor(0);
    if (!this.optimizeLowEnd) {
      this.tweens.add({ targets: preview, angle: 360, duration: 10000, repeat: -1, ease: 'Linear' });
    }

    // Название
    const nameText = this.add.text(w / 2, h / 2 - 20, skin.name, {
      fontSize: '28px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      stroke: skin.rarity === 'LEGENDARY' ? '#ffaa00' : '#00ffff',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

    // Редкость
    const rarityNames = { 'COMMON': 'ОБЫЧНЫЙ', 'RARE': 'РЕДКИЙ', 'EPIC': 'ЭПИЧЕСКИЙ', 'LEGENDARY': 'ЛЕГЕНДАРНЫЙ' };
    const rarityColors = { 'COMMON': '#aaaaaa', 'RARE': '#44aaff', 'EPIC': '#ff44aa', 'LEGENDARY': '#ffaa00' };
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

    // Кнопки (внизу, компактные)
    const btnY = h / 2 + 240;
    if (!owned) {
      const buyBtn = this.createRoundedButton(w / 2 - 100, btnY, 'КУПИТЬ', canAfford ? '#00ff00' : '#ff4444');
      buyBtn.setDepth(203).setScrollFactor(0);
      buyBtn.on('pointerdown', () => {
        if (canAfford) {
          this.closeDetail(overlay, panel, preview, nameText, rarityText, descText, loreText, buyBtn);
          this.showPurchaseConfirm(skin);
        } else {
          this.showMessage('⚠ НЕДОСТАТОЧНО КРИСТАЛЛОВ', '#ff4444');
        }
      });
    } else if (!selected) {
      const selectBtn = this.createRoundedButton(w / 2 - 100, btnY, 'ВЫБРАТЬ', '#00ffff');
      selectBtn.setDepth(203).setScrollFactor(0);
      selectBtn.on('pointerdown', () => {
        this.selectSkin(skin);
        this.closeDetail(overlay, panel, preview, nameText, rarityText, descText, loreText, selectBtn);
      });
    } else {
      const equipped = this.add.text(w / 2, btnY, '✓ ВЫБРАНО', {
        fontSize: '20px',
        fontFamily: '"Audiowide", sans-serif',
        color: '#00ff00',
        backgroundColor: '#1a3a1a',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setDepth(203).setScrollFactor(0);
    }

    // Кнопка закрытия (крестик)
    const closeBtn = this.add.text(w - 50, 100, '✕', {
      fontSize: '40px',
      fontFamily: 'sans-serif',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3
    }).setInteractive({ useHandCursor: true }).setDepth(203).setScrollFactor(0).setOrigin(0.5);
    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: '#ff8888', scale: 1.2 }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ color: '#ff4444', scale: 1 }));
    closeBtn.on('pointerdown', () => this.closeDetail(overlay, panel, preview, nameText, rarityText, descText, loreText, closeBtn));
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
    return hit;
  }

  closeDetail(...objects) {
    objects.forEach(obj => {
      if (obj && obj.destroy) {
        this.tweens.add({ targets: obj, alpha: 0, scale: 0.5, duration: 200, onComplete: () => obj.destroy() });
      }
    });
  }

  showPurchaseConfirm(skin) {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0)
      .setDepth(200).setScrollFactor(0);
    this.tweens.add({ targets: overlay, alpha: 0.95, duration: 300 });

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.98);
    panel.fillRoundedRect(w / 2 - 200, h / 2 - 180, 400, 360, 20);
    panel.lineStyle(4, skin.rarity === 'LEGENDARY' ? 0xffaa00 : 0x00ffff, 1);
    panel.strokeRoundedRect(w / 2 - 200, h / 2 - 180, 400, 360, 20);
    panel.setDepth(201).setScrollFactor(0);

    const preview = this.add.image(w / 2, h / 2 - 60, skin.texture)
      .setScale(2.0)
      .setDepth(202)
      .setScrollFactor(0);

    this.add.text(w / 2, h / 2 + 10, skin.name, {
      fontSize: '24px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

    this.add.text(w / 2, h / 2 + 60, `${skin.price} 💎`, {
      fontSize: '32px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

    const buyBtn = this.createRoundedButton(w / 2 - 100, h / 2 + 120, 'КУПИТЬ', '#00ff00');
    const cancelBtn = this.createRoundedButton(w / 2 + 100, h / 2 + 120, 'ОТМЕНА', '#ff4444');
    buyBtn.setDepth(202).setScrollFactor(0);
    cancelBtn.setDepth(202).setScrollFactor(0);

    let isPurchasing = false;
    buyBtn.on('pointerdown', () => {
      if (isPurchasing) return;
      isPurchasing = true;
      if (gameManager.purchaseSkin(skin.id)) {
        this.playPurchaseSound();
        this.balanceText.setText(`${gameManager.data.crystals}`);
        this.createConfetti(w / 2, h / 2, skin.color);
        this.showMessage('✓ ПОКУПКА УСПЕШНА!', '#00ff00');
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: [overlay, panel, preview, buyBtn, cancelBtn],
            alpha: 0,
            duration: 300,
            onComplete: () => {
              overlay.destroy();
              panel.destroy();
              preview.destroy();
              buyBtn.destroy();
              cancelBtn.destroy();
              this.scene.restart();
            }
          });
        });
      } else {
        this.showMessage('⚠ ОШИБКА ПОКУПКИ', '#ff4444');
        isPurchasing = false;
      }
    });
    cancelBtn.on('pointerdown', () => {
      this.playClickSound();
      this.tweens.add({
        targets: [overlay, panel, preview, buyBtn, cancelBtn],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          overlay.destroy();
          panel.destroy();
          preview.destroy();
          buyBtn.destroy();
          cancelBtn.destroy();
        }
      });
    });
  }

  selectSkin(skin) {
    if (gameManager.selectSkin(skin.id)) {
      this.playSelectSound();
      this.showMessage(`✓ ВЫБРАН: ${skin.name}`, '#00ff00');
      this.createConfetti(this.scale.width / 2, 200, skin.color);
      this.time.delayedCall(800, () => this.scene.restart());
    }
  }

  // =========================================================================
  // НИЖНЯЯ ПАНЕЛЬ
  // =========================================================================

  createFooter() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Кнопка назад
    const backBtn = this.add.text(w / 2, h - 35, '⏎ НАЗАД В МЕНЮ', {
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
      this.goBackToMenu();
    });
  }

  goBackToMenu() {
    this.tweens.killAll();
    this.scene.start('menu');
  }

  // =========================================================================
  // ТЕКСТУРЫ (сокращённо, но достаточно)
  // =========================================================================

  createAllSkinTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // ... (оставляем код генерации текстур из предыдущей версии) ...
    // Для краткости оставляем заглушку, но в реальном проекте нужно вставить полный код.
    // В предыдущем ответе он есть.
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
  shutdown() { this.tweens.killAll(); this.skinCards = []; this.stars = []; console.log('SkinShopScene shutdown'); }
}