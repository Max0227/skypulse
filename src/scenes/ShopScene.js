import Phaser from 'phaser';
import { COLORS, SHOP_UPGRADES } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super('shop');
    this.stars = [];
    this.particles = [];
    this.gridOffset = 0;
    this.lastHoverTime = 0;
    this.upgradeCards = [];
    this.selectedUpgrade = null;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Фон
    this.createCyberpunkBackground();
    this.createAnimatedGrid();
    this.createFloatingParticles();
    this.createStars();

    // Заголовок
    this.createHeader();

    // Баланс кристаллов
    this.createBalanceDisplay();

    // Сетка улучшений (2 ряда)
    this.createUpgradeGrid();

    // Кнопки действий
    this.createActionButtons();

    // Кнопка назад
    this.createBackButton();

    // Версия
    this.createFooter();

    // Анимации
    this.startAnimations();

    // Обработчики
    this.input.keyboard.on('keydown-ESC', () => {
      this.cleanup();
      this.scene.start('menu');
    });
    this.scale.on('resize', this.onResize, this);

    // Выбираем первую карточку
    if (SHOP_UPGRADES.length) this.selectCard(0);
  }

  // =========================================================================
  // ФОН
  // =========================================================================
  createCyberpunkBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(0, 0, w, h, 0x030712).setOrigin(0);

    const gradientLayers = [0.1, 0.15, 0.2, 0.25];
    gradientLayers.forEach((alpha, idx) => {
      const grad = this.make.graphics({ x: 0, y: 0, add: false });
      grad.fillGradientStyle(
        0x030712 + idx * 0x010101,
        0x030712 + idx * 0x010101,
        0x0a0a1a + idx * 0x020202,
        0x0a0a1a + idx * 0x020202,
        alpha
      );
      grad.fillRect(0, 0, w, h);
      grad.generateTexture(`shop_grad_${idx}`, w, h);
      grad.destroy();
      const img = this.add.image(0, 0, `shop_grad_${idx}`).setOrigin(0);
      img.setAlpha(0.8);
      this.tweens.add({
        targets: img,
        y: idx * 5,
        duration: 8000 + idx * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

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
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const size = Phaser.Math.Between(2, 6);
      const color = Phaser.Utils.Array.GetRandom([0x00ffff, 0xff00ff, 0xffff00, 0x00ff00]);
      const p = this.add.circle(x, y, size, color, 0.4);
      p.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-150, 150),
        y: y + Phaser.Math.Between(-80, 80),
        alpha: 0.1,
        scale: 0.5,
        duration: Phaser.Math.Between(4000, 8000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 120
      });
      this.particles.push(p);
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
  // ЗАГОЛОВОК
  // =========================================================================
  createHeader() {
    const w = this.scale.width;
    this.title = this.add.text(w / 2, 25, 'МАГАЗИН УЛУЧШЕНИЙ', {
      fontSize: '28px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 4,
      shadow: { blur: 15, color: '#00ffff', fill: true }
    }).setOrigin(0.5);
    this.titleGlow = this.add.text(w / 2, 25, 'МАГАЗИН УЛУЧШЕНИЙ', {
      fontSize: '28px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#ff00ff',
      strokeThickness: 2,
      alpha: 0.5
    }).setOrigin(0.5);
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

  // =========================================================================
  // БАЛАНС
  // =========================================================================
  createBalanceDisplay() {
    const w = this.scale.width;
    const container = this.add.container(w / 2, 75);
    container.setDepth(20);

    const bg = this.add.rectangle(0, 0, 260, 44, 0x0a0a1a, 0.95);
    bg.setStrokeStyle(2, 0x00ffff, 0.8);
    
    const icon = this.add.text(-70, 0, '💎', { fontSize: '32px' }).setOrigin(0.5);
    this.tweens.add({
      targets: icon,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    });
    
    this.balanceText = this.add.text(12, 0, `${gameManager.data.crystals}`, {
      fontSize: '28px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5);
    
    const label = this.add.text(0, -18, 'КРИСТАЛЛЫ', {
      fontSize: '9px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff'
    }).setOrigin(0.5);
    
    container.add([bg, icon, this.balanceText, label]);
    
    this.tweens.add({
      targets: bg,
      strokeWidth: 3,
      alpha: 1,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // =========================================================================
  // СЕТКА УЛУЧШЕНИЙ (2 ряда)
  // =========================================================================
  createUpgradeGrid() {
    const w = this.scale.width;
    const startY = 125;
    const cardWidth = 170;
    const cardHeight = 140;
    const spacingX = 20;
    const spacingY = 20;
    const cols = 2;
    
    const totalWidth = cols * cardWidth + (cols - 1) * spacingX;
    const startX = (w - totalWidth) / 2 + cardWidth / 2;
    
    SHOP_UPGRADES.forEach((upgrade, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = startX + col * (cardWidth + spacingX);
      const y = startY + row * (cardHeight + spacingY);
      
      const card = this.createUpgradeCard(upgrade, index, x, y, cardWidth, cardHeight);
      this.upgradeCards.push({ card, upgrade, index });
    });
  }

  createUpgradeCard(upgrade, index, x, y, cardWidth, cardHeight) {
    const level = gameManager.getUpgradeLevel(upgrade.key);
    const maxLevel = upgrade.maxLevel;
    const cost = gameManager.getUpgradeCost(upgrade.key);
    const canAfford = gameManager.data.crystals >= cost && level < maxLevel;
    const isMax = level >= maxLevel;
    const progress = level / maxLevel;
    
    const container = this.add.container(x, y);
    container.setData('upgrade', upgrade);
    container.setData('index', index);
    
    // Фон карточки
    const bg = this.add.graphics();
    const borderColor = isMax ? 0x00ff00 : (canAfford ? 0x00ffff : 0x444444);
    bg.fillStyle(0x1a1a3a, 0.9);
    bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
    bg.lineStyle(2, borderColor, 0.8);
    bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
    container.setData('bg', bg);
    container.add(bg);
    
    // Иконка
    const icon = this.add.text(0, -45, upgrade.icon, { fontSize: '40px' }).setOrigin(0.5);
    container.add(icon);
    
    // Название
    const name = this.add.text(0, -12, upgrade.name, {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffffff',
      stroke: isMax ? '#00ff00' : (canAfford ? '#00ffff' : '#888888'),
      strokeThickness: 0.5,
      wordWrap: { width: cardWidth - 20 }
    }).setOrigin(0.5);
    container.add(name);
    
    // Уровень
    const levelText = this.add.text(0, 12, `УРОВЕНЬ ${level}/${maxLevel}`, {
      fontSize: '9px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#88aaff'
    }).setOrigin(0.5);
    container.add(levelText);
    
    // Прогресс-бар
    const progressBg = this.add.rectangle(0, 32, 120, 4, 0x333333);
    const progressFill = this.add.rectangle(-60, 32, 120 * progress, 4, 
      isMax ? 0x00ff00 : (canAfford ? 0x00ffff : 0x666666)
    ).setOrigin(0, 0.5);
    container.add([progressBg, progressFill]);
    
    // Значение
    const currentVal = this.getUpgradeValue(upgrade.key, level);
    const nextVal = !isMax ? this.getUpgradeValue(upgrade.key, level + 1) : null;
    const valueText = this.add.text(0, 45, `${currentVal} → ${nextVal || 'MAX'}`, {
      fontSize: '9px',
      fontFamily: "'Share Tech Mono', monospace",
      color: isMax ? '#00ff00' : '#ffaa00'
    }).setOrigin(0.5);
    container.add(valueText);
    
    // Цена
    const priceText = this.add.text(0, 60, isMax ? 'MAX' : `${cost} 💎`, {
      fontSize: '11px',
      fontFamily: "'Audiowide', sans-serif",
      color: isMax ? '#00ff00' : (canAfford ? '#ffaa00' : '#ff4444')
    }).setOrigin(0.5);
    container.add(priceText);
    
    // Интерактивная область
    const hitArea = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setData('upgrade', upgrade);
    
    hitArea.on('pointerover', () => {
      if (!isMax) {
        bg.clear();
        bg.fillStyle(0x2a2a4a, 0.9);
        bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
        bg.lineStyle(2, borderColor, 1);
        bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
        icon.setScale(1.1);
        this.playHoverSound();
      }
    });
    
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a1a3a, 0.9);
      bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
      bg.lineStyle(2, borderColor, 0.8);
      bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
      icon.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
      this.selectCard(index);
    });
    
    container.add(hitArea);
    
    return container;
  }

  selectCard(index, silent = false) {
    if (index === this.currentCardIndex && !silent) return;
    this.currentCardIndex = index;
    const upgrade = SHOP_UPGRADES[index];
    this.selectedUpgrade = upgrade;
    
    // Обновляем рамки карточек
    this.upgradeCards.forEach((cardData, i) => {
      const bg = cardData.card.getData('bg');
      if (!bg) return;
      const level = gameManager.getUpgradeLevel(cardData.upgrade.key);
      const maxLevel = cardData.upgrade.maxLevel;
      const cost = gameManager.getUpgradeCost(cardData.upgrade.key);
      const canAfford = gameManager.data.crystals >= cost && level < maxLevel;
      const isMax = level >= maxLevel;
      const borderColor = i === index ? 0xffff00 : (isMax ? 0x00ff00 : (canAfford ? 0x00ffff : 0x444444));
      bg.clear();
      bg.fillStyle(0x1a1a3a, 0.9);
      bg.fillRoundedRect(-85, -70, 170, 140, 12);
      bg.lineStyle(i === index ? 3 : 2, borderColor, i === index ? 1 : 0.8);
      bg.strokeRoundedRect(-85, -70, 170, 140, 12);
    });
    
    // Обновляем детальную панель
    this.updateDetailPanel();
    
    if (!silent) audioManager.playSound(this, 'tap_sound', 0.2);
  }

  // =========================================================================
  // ДЕТАЛЬНАЯ ПАНЕЛЬ
  // =========================================================================
  createDetailPanel() {
    const w = this.scale.width;
    const h = this.scale.height;
    const panelY = h - 125;
    
    this.detailContainer = this.add.container(w / 2, panelY);
    this.detailContainer.setDepth(15);
    
    // Фон
    this.detailBg = this.add.graphics();
    this.detailBg.fillStyle(0x0a0a1a, 0.95);
    this.detailBg.fillRoundedRect(-170, -45, 340, 90, 16);
    this.detailBg.lineStyle(2, 0x00ffff, 0.6);
    this.detailBg.strokeRoundedRect(-170, -45, 340, 90, 16);
    this.detailContainer.add(this.detailBg);
    
    // Название
    this.detailName = this.add.text(0, -25, '', {
      fontSize: '16px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Описание
    this.detailDesc = this.add.text(0, -5, '', {
      fontSize: '10px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.text_secondary,
      wordWrap: { width: 300 }
    }).setOrigin(0.5);
    
    // Следующее значение и цена
    this.detailNext = this.add.text(0, 18, '', {
      fontSize: '10px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#ffaa00'
    }).setOrigin(0.5);
    
    this.detailContainer.add([this.detailName, this.detailDesc, this.detailNext]);
  }

  updateDetailPanel() {
    if (!this.selectedUpgrade) return;
    const upgrade = this.selectedUpgrade;
    const level = gameManager.getUpgradeLevel(upgrade.key);
    const maxLevel = upgrade.maxLevel;
    const isMax = level >= maxLevel;
    const cost = gameManager.getUpgradeCost(upgrade.key);
    const canAfford = gameManager.data.crystals >= cost && !isMax;
    
    this.detailName.setText(upgrade.name);
    this.detailDesc.setText(this.getUpgradeDesc(upgrade.key));
    if (!isMax) {
      const currentVal = this.getUpgradeValue(upgrade.key, level);
      const nextVal = this.getUpgradeValue(upgrade.key, level + 1);
      this.detailNext.setText(`${currentVal} → ${nextVal} | ${cost} 💎`);
      this.detailNext.setColor(canAfford ? '#ffaa00' : '#ff4444');
    } else {
      this.detailNext.setText('ДОСТИГНУТ МАКСИМАЛЬНЫЙ УРОВЕНЬ');
      this.detailNext.setColor('#00ff00');
    }
  }

  getUpgradeDesc(key) {
    const desc = {
      jumpPower: 'Увеличивает силу прыжка такси',
      gravity: 'Уменьшает гравитацию, облегчая полёт',
      shieldDuration: 'Увеличивает время действия щита',
      magnetRange: 'Увеличивает радиус притяжения монет',
      wagonHP: 'Повышает прочность вагонов',
      maxWagons: 'Увеличивает максимальное количество вагонов',
      wagonGap: 'Уменьшает расстояние между вагонами',
      headHP: 'Увеличивает максимальное здоровье',
      revival: 'Позволяет воскреснуть после смерти',
      weaponDamage: 'Увеличивает урон оружия',
      weaponSpeed: 'Увеличивает скорость полёта пуль',
      weaponFireRate: 'Увеличивает скорострельность'
    };
    return desc[key] || 'Улучшает характеристики такси';
  }

  getUpgradeValue(key, level) {
    const values = {
      jumpPower: 300 + level * 25,
      gravity: 1300 - level * 60,
      shieldDuration: 5 + level * 1.5,
      magnetRange: 220 + level * 40,
      wagonHP: 1 + level,
      maxWagons: 12 + level * 2,
      wagonGap: 28 - level * 2,
      headHP: 3 + level,
      revival: level,
      weaponDamage: 1 + level,
      weaponSpeed: 400 + level * 20,
      weaponFireRate: Math.max(100, 500 - level * 20)
    };
    return values[key] || 0;
  }

  // =========================================================================
  // КНОПКИ ДЕЙСТВИЙ
  // =========================================================================
  createActionButtons() {
    const w = this.scale.width;
    const h = this.scale.height;
    const btnY = h - 45;
    
    this.buyBtn = this.createActionButton(w / 2 - 100, btnY, 'КУПИТЬ', '#00ff00', () => this.buyUpgrade(), 110);
    this.sellBtn = this.createActionButton(w / 2, btnY, 'ПРОДАТЬ', '#ffaa00', () => this.sellUpgrade(), 110);
    this.resetBtn = this.createActionButton(w / 2 + 100, btnY, 'СБРОС ВСЕ', '#ff4444', () => this.confirmReset(), 110);
    
    this.tweens.add({
      targets: this.buyBtn.button,
      alpha: { from: 0.8, to: 1 },
      scale: { from: 1, to: 1.02 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  createActionButton(x, y, text, color, callback, width = 130) {
    const btnColor = Phaser.Display.Color.HexStringToColor(color).color;
    const button = this.add.graphics();
    const state = { glowAlpha: 0.3 };
    const update = () => {
      button.clear();
      button.fillStyle(0x1a1a3a, 0.9);
      button.fillRoundedRect(x - width / 2, y - 16, width, 32, 10);
      button.lineStyle(2, btnColor, state.glowAlpha);
      button.strokeRoundedRect(x - width / 2, y - 16, width, 32, 10);
    };
    update();
    const textObj = this.add.text(x, y, text, {
      fontSize: '13px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff',
      stroke: color,
      strokeThickness: 1
    }).setOrigin(0.5);
    const hit = this.add.rectangle(x, y, width, 32, 0x000000, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => {
      this.tweens.add({ targets: state, glowAlpha: 0.8, duration: 200, onUpdate: update });
      textObj.setScale(1.05);
      this.playHoverSound();
    });
    hit.on('pointerout', () => {
      this.tweens.add({ targets: state, glowAlpha: 0.3, duration: 200, onUpdate: update });
      textObj.setScale(1);
    });
    hit.on('pointerdown', () => {
      this.playClickSound();
      callback();
    });
    return { button, text: textObj, hit };
  }

  buyUpgrade() {
    if (!this.selectedUpgrade) return;
    const upgrade = this.selectedUpgrade;
    const level = gameManager.getUpgradeLevel(upgrade.key);
    const maxLevel = upgrade.maxLevel;
    if (level >= maxLevel) {
      this.showMessage('Достигнут максимальный уровень!', '#ffaa00');
      return;
    }
    const cost = gameManager.getUpgradeCost(upgrade.key);
    if (gameManager.data.crystals < cost) {
      this.showMessage('Недостаточно кристаллов!', '#ff4444');
      return;
    }
    if (gameManager.upgrade(upgrade.key)) {
      this.playPurchaseSound();
      this.balanceText.setText(`${gameManager.data.crystals}`);
      this.createBuyEffect();
      this.refreshCurrentCard();
      this.updateDetailPanel();
      this.showMessage(`✓ ${upgrade.name} улучшен!`, '#00ff00');
    }
  }

  sellUpgrade() {
    if (!this.selectedUpgrade) return;
    const upgrade = this.selectedUpgrade;
    const level = gameManager.getUpgradeLevel(upgrade.key);
    if (level === 0) {
      this.showMessage('Нечего продавать — уровень 0', '#ffaa00');
      return;
    }
    const levelCost = this.getUpgradeCostAtLevel(upgrade.key, level - 1);
    const refund = Math.floor(levelCost * 0.8);
    gameManager.data.upgrades[upgrade.key] = level - 1;
    gameManager.data.crystals += refund;
    gameManager.save();
    this.balanceText.setText(`${gameManager.data.crystals}`);
    this.createSellEffect();
    this.refreshCurrentCard();
    this.updateDetailPanel();
    this.showMessage(`↺ Возвращено ${refund} 💎`, '#ffaa00');
    this.playClickSound();
  }

  getUpgradeCostAtLevel(key, level) {
    const upgrade = SHOP_UPGRADES.find(u => u.key === key);
    if (!upgrade) return 0;
    const base = upgrade.cost || 10;
    const multiplier = 1.2;
    return Math.floor(base * Math.pow(multiplier, level));
  }

  refreshCurrentCard() {
    if (!this.selectedUpgrade) return;
    const cardData = this.upgradeCards[this.currentCardIndex];
    if (!cardData) return;
    const oldCard = cardData.card;
    const cardWidth = 170;
    const cardHeight = 140;
    const newCard = this.createUpgradeCard(cardData.upgrade, this.currentCardIndex, oldCard.x, oldCard.y, cardWidth, cardHeight);
    this.add.existing(newCard);
    oldCard.destroy();
    cardData.card = newCard;
    this.selectCard(this.currentCardIndex, true);
  }

  createBuyEffect() {
    const w = this.scale.width;
    const h = this.scale.height;
    const flash = this.add.rectangle(w / 2, h / 2, w, h, 0x00ff00, 0);
    this.tweens.add({
      targets: flash,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      onComplete: () => flash.destroy()
    });
    for (let i = 0; i < 20; i++) {
      const p = this.add.circle(
        w / 2 + Phaser.Math.Between(-100, 100),
        h / 2 + Phaser.Math.Between(-50, 50),
        Phaser.Math.Between(2, 5),
        0x00ff00,
        0.7
      );
      p.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(50, 150),
        alpha: 0,
        scale: 0,
        duration: 800,
        onComplete: () => p.destroy()
      });
    }
  }

  createSellEffect() {
    const w = this.scale.width;
    const h = this.scale.height;
    for (let i = 0; i < 15; i++) {
      const p = this.add.circle(
        w / 2 + Phaser.Math.Between(-80, 80),
        h / 2 + Phaser.Math.Between(-40, 40),
        Phaser.Math.Between(2, 4),
        0xffaa00,
        0.6
      );
      p.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-50, 50),
        y: p.y - Phaser.Math.Between(30, 100),
        alpha: 0,
        scale: 0,
        duration: 600,
        onComplete: () => p.destroy()
      });
    }
  }

  confirmReset() {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.9)
      .setDepth(50)
      .setScrollFactor(0);

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.95);
    panel.fillRoundedRect(w / 2 - 200, h / 2 - 150, 400, 300, 20);
    panel.lineStyle(4, 0xff4444, 1);
    panel.strokeRoundedRect(w / 2 - 200, h / 2 - 150, 400, 300, 20);
    panel.setDepth(51);

    this.add.text(w / 2, h / 2 - 80, '⚠ ВНИМАНИЕ ⚠', {
      fontSize: '28px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 30, 'Сбросить все улучшения?', {
      fontSize: '20px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2, 'Кристаллы НЕ вернутся!', {
      fontSize: '16px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffaa00'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2 + 30, 'Вы уверены?', {
      fontSize: '18px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ff8888'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const yesBtn = this.createDetailButton(w / 2 - 100, h / 2 + 90, 'СБРОСИТЬ', '#ff0000');
    const noBtn = this.createDetailButton(w / 2 + 100, h / 2 + 90, 'ОТМЕНА', '#00ff00');

    yesBtn.setDepth(52).setScrollFactor(0);
    noBtn.setDepth(52).setScrollFactor(0);

    yesBtn.on('pointerdown', () => {
      SHOP_UPGRADES.forEach(up => {
        gameManager.data.upgrades[up.key] = 0;
      });
      gameManager.save();
      this.playPurchaseSound();
      this.balanceText.setText(`${gameManager.data.crystals}`);
      this.showMessage('✓ УЛУЧШЕНИЯ СБРОШЕНЫ', '#00ff00');
      this.time.delayedCall(1000, () => {
        overlay.destroy();
        panel.destroy();
        yesBtn.destroy();
        noBtn.destroy();
        this.scene.restart();
      });
    });

    noBtn.on('pointerdown', () => {
      this.playClickSound();
      overlay.destroy();
      panel.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    });
  }

  createDetailButton(x, y, text, color) {
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
      btn.setStyle({ backgroundColor: color, stroke: '#ffffff' });
      btn.setScale(1.1);
      this.playHoverSound();
    });
    btn.on('pointerout', () => {
      btn.setStyle({ backgroundColor: '#1a1a3a', stroke: color });
      btn.setScale(1);
    });
    return btn;
  }

  // =========================================================================
  // КНОПКА НАЗАД
  // =========================================================================
  createBackButton() {
    const w = this.scale.width;
    const h = this.scale.height;
    const btnY = h - 12;

    const btnContainer = this.add.container(w / 2, btnY);
    btnContainer.setDepth(20);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a3a, 0.9);
    bg.fillRoundedRect(-60, -12, 120, 24, 12);
    bg.lineStyle(2, 0x00ffff, 0.8);
    bg.strokeRoundedRect(-60, -12, 120, 24, 12);
    
    const text = this.add.text(0, 0, '⏎ НАЗАД', {
      fontSize: '12px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 1
    }).setOrigin(0.5);

    btnContainer.add([bg, text]);

    const hitArea = this.add.rectangle(0, 0, 120, 24, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(25);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2a2a5a, 0.9);
      bg.fillRoundedRect(-60, -12, 120, 24, 12);
      bg.lineStyle(2, '#ffffff', 1);
      bg.strokeRoundedRect(-60, -12, 120, 24, 12);
      text.setScale(1.05);
      this.playHoverSound();
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a1a3a, 0.9);
      bg.fillRoundedRect(-60, -12, 120, 24, 12);
      bg.lineStyle(2, 0x00ffff, 0.8);
      bg.strokeRoundedRect(-60, -12, 120, 24, 12);
      text.setScale(1);
    });

    hitArea.on('pointerdown', () => {
      this.playClickSound();
      this.cleanup();
      this.scene.start('menu');
    });

    btnContainer.add(hitArea);
    this.backButton = btnContainer;
  }

  createFooter() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.text(w - 30, h - 8, 'v3.5.0', {
      fontSize: '9px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#666666'
    }).setOrigin(1, 0.5);
  }

  // =========================================================================
  // УВЕДОМЛЕНИЯ
  // =========================================================================
  showMessage(text, color) {
    const w = this.scale.width;
    const h = this.scale.height;
    const msg = this.add.text(w / 2, h / 2, text, {
      fontSize: '20px',
      fontFamily: '"Audiowide", sans-serif',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#0a1a0a',
      padding: { x: 20, y: 12 },
      align: 'center',
      shadow: { blur: 8, color: color, fill: true }
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
      onComplete: () => msg.destroy()
    });
  }

  // =========================================================================
  // ЗВУКИ
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
  
  playPurchaseSound() {
    try { audioManager.playSound(this, 'purchase_sound', 0.5); } catch (e) {}
  }

  // =========================================================================
  // АНИМАЦИИ
  // =========================================================================
  startAnimations() {
    this.time.addEvent({
      delay: 50,
      callback: () => {
        const t = Date.now() / 1000;
        this.stars.forEach(s => {
          s.sprite.alpha = s.baseAlpha + Math.sin(t * 5 * s.speed) * 0.3;
          s.sprite.rotation += 0.001;
        });
      },
      loop: true
    });
    
    const scan = this.add.graphics();
    let y = 0;
    this.tweens.add({
      targets: { y: 0 },
      y: this.scale.height,
      duration: 3000,
      repeat: -1,
      onUpdate: (tween) => {
        y = tween.getValue();
        scan.clear();
        scan.lineStyle(2, 0x00ffff, 0.2);
        scan.lineBetween(0, y, this.scale.width, y);
      }
    });
  }

  cleanup() {
    this.tweens.killAll();
    this.particles.forEach(p => p?.destroy());
  }

  onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.cleanup();
    this.stars = [];
    this.particles = [];
    this.upgradeCards = [];
  }
}