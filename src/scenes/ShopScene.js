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
    this.currentCardIndex = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartContainerX = 0;
    this.dragVelocity = 0;
    this.lastDragX = 0;
    this.scrollTween = null;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Фон
    this.createCyberpunkBackground();
    this.createAnimatedGrid();
    this.createFloatingParticles();
    this.createStars();

    // Заголовок и баланс
    this.createHeader();
    this.createBalanceDisplay();

    // Карусель улучшений
    this.createUpgradeCarousel();

    // Детальная панель (внизу)
    this.createDetailPanel();

    // Кнопки действий
    this.createActionButtons();

    // Нижняя панель с версией
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
  // ЗАГОЛОВОК И БАЛАНС
  // =========================================================================
  createHeader() {
    const w = this.scale.width;
    this.title = this.add.text(w / 2, 40, 'МАГАЗИН УЛУЧШЕНИЙ', {
      fontSize: '36px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 5,
      shadow: { blur: 20, color: '#00ffff', fill: true }
    }).setOrigin(0.5);
    this.titleGlow = this.add.text(w / 2, 40, 'МАГАЗИН УЛУЧШЕНИЙ', {
      fontSize: '36px',
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

  createBalanceDisplay() {
    const w = this.scale.width;
    const container = this.add.container(w / 2, 100);
    const bg = this.add.rectangle(0, 0, 280, 45, 0x0a0a1a, 0.9);
    bg.setStrokeStyle(3, 0x00ffff, 0.8);
    const icon = this.add.text(-80, 0, '💎', { fontSize: '32px' }).setOrigin(0.5);
    this.tweens.add({
      targets: icon,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    });
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
    this.tweens.add({
      targets: bg,
      strokeWidth: 4,
      alpha: 1,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // =========================================================================
  // КАРУСЕЛЬ УЛУЧШЕНИЙ (горизонтальная, с drag и свайпом)
  // =========================================================================
  createUpgradeCarousel() {
    const w = this.scale.width;
    const carouselY = 170;
    const cardWidth = 280;
    const cardSpacing = 24;

    this.carouselContainer = this.add.container(w / 2, carouselY);
    this.carouselContainer.setDepth(10);

    SHOP_UPGRADES.forEach((upgrade, idx) => {
      const card = this.createUpgradeCard(upgrade, idx, cardWidth);
      const x = (idx - (SHOP_UPGRADES.length - 1) / 2) * (cardWidth + cardSpacing);
      card.x = x;
      this.carouselContainer.add(card);
      this.upgradeCards.push({ card, upgrade, index: idx });
    });

    this.setupCarouselDrag(cardWidth, cardSpacing);
  }

  createUpgradeCard(upgrade, index, cardWidth) {
    const level = gameManager.getUpgradeLevel(upgrade.key);
    const maxLevel = upgrade.maxLevel;
    const cost = gameManager.getUpgradeCost(upgrade.key);
    const canAfford = gameManager.data.crystals >= cost && level < maxLevel;
    const isMax = level >= maxLevel;
    const progress = level / maxLevel;

    const container = this.add.container(0, 0);
    container.setData('upgrade', upgrade);
    container.setData('index', index);

    // Фон
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a3a, 0.9);
    bg.fillRoundedRect(-cardWidth / 2, -100, cardWidth, 200, 20);
    const borderColor = isMax ? 0x00ff00 : (canAfford ? 0x00ffff : 0x444444);
    bg.lineStyle(3, borderColor, 0.8);
    bg.strokeRoundedRect(-cardWidth / 2, -100, cardWidth, 200, 20);
    container.setData('bg', bg);

    // Иконка
    const icon = this.add.text(0, -60, upgrade.icon, { fontSize: '48px' }).setOrigin(0.5);
    // Название
    const name = this.add.text(0, -20, upgrade.name, {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffffff',
      stroke: isMax ? '#00ff00' : (canAfford ? '#00ffff' : '#888888'),
      strokeThickness: 1
    }).setOrigin(0.5);
    // Уровень
    const levelText = this.add.text(0, 5, `УРОВЕНЬ ${level}/${maxLevel}`, {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#88aaff'
    }).setOrigin(0.5);
    // Прогресс-бар
    const progressBg = this.add.rectangle(0, 30, 180, 8, 0x333333);
    const progressFill = this.add.rectangle(-90, 30, 180 * progress, 8,
      isMax ? 0x00ff00 : (canAfford ? 0x00ffff : 0x666666)
    ).setOrigin(0, 0.5);
    // Значение
    const currentVal = this.getUpgradeValue(upgrade.key, level);
    const nextVal = !isMax ? this.getUpgradeValue(upgrade.key, level + 1) : null;
    const valueText = this.add.text(0, 50, `${currentVal} → ${nextVal || 'MAX'}`, {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: isMax ? '#00ff00' : '#ffaa00'
    }).setOrigin(0.5);
    // Цена
    const priceText = this.add.text(0, 75, isMax ? 'MAX' : `${cost} 💎`, {
      fontSize: '16px',
      fontFamily: "'Audiowide', sans-serif",
      color: isMax ? '#00ff00' : (canAfford ? '#ffaa00' : '#ff4444')
    }).setOrigin(0.5);

    container.add([bg, icon, name, levelText, progressBg, progressFill, valueText, priceText]);

    // Интерактивная область для выбора карточки
    const hitArea = this.add.rectangle(0, 0, cardWidth, 200, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setData('upgrade', upgrade);
    hitArea.on('pointerdown', () => this.selectCard(index));
    container.add(hitArea);

    return container;
  }

  setupCarouselDrag(cardWidth, cardSpacing) {
    const w = this.scale.width;
    const totalWidth = SHOP_UPGRADES.length * (cardWidth + cardSpacing);
    const minX = w / 2 - totalWidth / 2;
    const maxX = w / 2 + totalWidth / 2 - cardWidth;

    let startX = 0;
    let startContainerX = 0;
    let isDragging = false;
    let velocity = 0;
    let lastX = 0;

    const zone = this.add.zone(0, 0, w, this.scale.height).setOrigin(0).setInteractive();
    zone.on('pointerdown', (pointer) => {
      if (this.scrollTween) this.scrollTween.stop();
      startX = pointer.x;
      startContainerX = this.carouselContainer.x;
      lastX = pointer.x;
      isDragging = true;
      velocity = 0;
    });
    zone.on('pointermove', (pointer) => {
      if (!isDragging) return;
      const delta = pointer.x - lastX;
      velocity = delta;
      let newX = startContainerX + delta;
      newX = Phaser.Math.Clamp(newX, minX, maxX);
      this.carouselContainer.x = newX;
      lastX = pointer.x;
      this.updateSelectedCardByPosition();
    });
    zone.on('pointerup', () => {
      isDragging = false;
      if (Math.abs(velocity) > 5) {
        const targetX = this.carouselContainer.x + velocity * 3;
        this.scrollTween = this.tweens.add({
          targets: this.carouselContainer,
          x: Phaser.Math.Clamp(targetX, minX, maxX),
          duration: 300,
          ease: 'Power2.easeOut',
          onUpdate: () => this.updateSelectedCardByPosition(),
          onComplete: () => { this.scrollTween = null; }
        });
      } else {
        this.snapToNearestCard(cardWidth, cardSpacing, minX, maxX);
      }
    });

    // Поддержка колесика мыши
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const newX = this.carouselContainer.x + deltaX;
        this.carouselContainer.x = Phaser.Math.Clamp(newX, minX, maxX);
        this.updateSelectedCardByPosition();
      }
    });
  }

  snapToNearestCard(cardWidth, cardSpacing, minX, maxX) {
    const w = this.scale.width;
    const centerX = w / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    SHOP_UPGRADES.forEach((_, idx) => {
      const targetX = centerX + (idx - (SHOP_UPGRADES.length - 1) / 2) * (cardWidth + cardSpacing);
      const dist = Math.abs(this.carouselContainer.x - targetX);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    const targetX = centerX + (bestIdx - (SHOP_UPGRADES.length - 1) / 2) * (cardWidth + cardSpacing);
    this.scrollTween = this.tweens.add({
      targets: this.carouselContainer,
      x: Phaser.Math.Clamp(targetX, minX, maxX),
      duration: 300,
      ease: 'Power2.easeOut',
      onUpdate: () => this.updateSelectedCardByPosition(),
      onComplete: () => {
        this.selectCard(bestIdx);
        this.scrollTween = null;
      }
    });
  }

  updateSelectedCardByPosition() {
    const w = this.scale.width;
    const centerX = w / 2;
    const cardWidth = 280;
    const cardSpacing = 24;
    let bestIdx = 0;
    let bestDist = Infinity;
    SHOP_UPGRADES.forEach((_, idx) => {
      const targetX = centerX + (idx - (SHOP_UPGRADES.length - 1) / 2) * (cardWidth + cardSpacing);
      const dist = Math.abs(this.carouselContainer.x - targetX);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    if (bestIdx !== this.currentCardIndex) {
      this.selectCard(bestIdx, true);
    }
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
      bg.fillRoundedRect(-140, -100, 280, 200, 20);
      bg.lineStyle(3, borderColor, i === index ? 1 : 0.8);
      bg.strokeRoundedRect(-140, -100, 280, 200, 20);
    });

    // Обновляем детальную панель
    this.updateDetailPanel();

    if (!silent) audioManager.playSound(this, 'tap_sound', 0.2);
  }

  // =========================================================================
  // ДЕТАЛЬНАЯ ПАНЕЛЬ (внизу)
  // =========================================================================
  createDetailPanel() {
    const w = this.scale.width;
    const h = this.scale.height;
    const panelY = h - 150;
    this.detailContainer = this.add.container(w / 2, panelY);
    this.detailContainer.setDepth(15);

    // Фон
    this.detailBg = this.add.graphics();
    this.detailBg.fillStyle(0x0a0a1a, 0.95);
    this.detailBg.fillRoundedRect(-180, -70, 360, 140, 20);
    this.detailBg.lineStyle(2, 0x00ffff, 0.6);
    this.detailBg.strokeRoundedRect(-180, -70, 360, 140, 20);
    this.detailContainer.add(this.detailBg);

    // Название
    this.detailName = this.add.text(0, -40, '', {
      fontSize: '20px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff'
    }).setOrigin(0.5);
    // Описание
    this.detailDesc = this.add.text(0, -12, '', {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.text_secondary,
      wordWrap: { width: 300 }
    }).setOrigin(0.5);
    // Уровень
    this.detailLevel = this.add.text(0, 15, '', {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#88aaff'
    }).setOrigin(0.5);
    // Следующее значение и цена
    this.detailNext = this.add.text(0, 38, '', {
      fontSize: '11px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#ffaa00'
    }).setOrigin(0.5);

    this.detailContainer.add([this.detailName, this.detailDesc, this.detailLevel, this.detailNext]);
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
    this.detailLevel.setText(`УРОВЕНЬ ${level}/${maxLevel}`);
    if (!isMax) {
      const currentVal = this.getUpgradeValue(upgrade.key, level);
      const nextVal = this.getUpgradeValue(upgrade.key, level + 1);
      this.detailNext.setText(`${currentVal} → ${nextVal} | СТОИМОСТЬ: ${cost} 💎`);
      this.detailNext.setColor(canAfford ? '#ffaa00' : '#ff4444');
    } else {
      this.detailNext.setText('ДОСТИГНУТ МАКСИМАЛЬНЫЙ УРОВЕНЬ');
      this.detailNext.setColor('#00ff00');
    }
  }

  getUpgradeDesc(key) {
    const desc = {
      jumpPower: 'Увеличивает силу прыжка такси',
      gravity: 'Уменьшает гравитацию, делая полёт легче',
      shieldDuration: 'Увеличивает время действия щита',
      magnetRange: 'Увеличивает радиус притяжения монет',
      wagonHP: 'Повышает прочность вагонов',
      maxWagons: 'Увеличивает максимальное количество вагонов',
      wagonGap: 'Уменьшает расстояние между вагонами',
      headHP: 'Увеличивает максимальное здоровье такси',
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
  // КНОПКИ ДЕЙСТВИЙ (КУПИТЬ / ПРОДАТЬ / СБРОС ВСЕ)
  // =========================================================================
  createActionButtons() {
    const w = this.scale.width;
    const h = this.scale.height;
    const btnY = h - 45;

    this.buyBtn = this.createActionButton(w / 2 - 120, btnY, 'КУПИТЬ', '#00ff00', () => this.buyUpgrade());
    this.sellBtn = this.createActionButton(w / 2, btnY, 'ПРОДАТЬ', '#ffaa00', () => this.sellUpgrade());
    this.resetBtn = this.createActionButton(w / 2 + 120, btnY, 'СБРОС ВСЕ', '#ff4444', () => this.confirmReset());

    // Пульсация для кнопки покупки
    this.tweens.add({
      targets: this.buyBtn.button,
      alpha: { from: 0.8, to: 1 },
      scale: { from: 1, to: 1.02 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  createActionButton(x, y, text, color, callback) {
    const btnColor = Phaser.Display.Color.HexStringToColor(color).color;
    const button = this.add.graphics();
    const state = { glowAlpha: 0.3 };
    const update = () => {
      button.clear();
      button.fillStyle(0x1a1a3a, 0.9);
      button.fillRoundedRect(x - 80, y - 20, 160, 40, 12);
      button.lineStyle(3, btnColor, state.glowAlpha);
      button.strokeRoundedRect(x - 80, y - 20, 160, 40, 12);
    };
    update();
    const textObj = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff',
      stroke: color,
      strokeThickness: 2
    }).setOrigin(0.5);
    const hit = this.add.rectangle(x, y, 160, 40, 0x000000, 0).setInteractive({ useHandCursor: true });
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
    // Стоимость последнего уровня (который сейчас снимаем)
    const costOfLastLevel = gameManager.getUpgradeCost(upgrade.key); // это стоимость для текущего уровня (level+1)?
    // Нам нужна стоимость уровня, который мы снимаем: текущий уровень level, значит стоимость была при покупке level-го уровня.
    // Для корректного расчёта используем отдельную функцию.
    const levelCost = this.getUpgradeCostAtLevel(upgrade.key, level - 1);
    const refund = Math.floor(levelCost * 0.8);
    // Уменьшаем уровень
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
    // Вычисляем стоимость уровня (уровень от 0 до max-1)
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
    const newCard = this.createUpgradeCard(cardData.upgrade, this.currentCardIndex, 280);
    newCard.x = oldCard.x;
    this.carouselContainer.add(newCard);
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

  createFooter() {
    const w = this.scale.width;
    const h = this.scale.height;
    const line = this.add.graphics();
    line.lineStyle(2, 0x00ffff, 0.3);
    line.lineBetween(50, h - 100, w - 50, h - 100);
    this.add.text(w - 30, h - 25, 'v3.5.0', {
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#666666'
    }).setOrigin(1, 0.5);
    [-1, 1].forEach(side => {
      const x = side === -1 ? 30 : w - 30;
      const light = this.add.circle(x, h - 85, 5, 0x00ffff, 0.5);
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
  // УВЕДОМЛЕНИЯ
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
      align: 'center',
      shadow: { blur: 10, color: color, fill: true }
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
    if (this.scrollTween) this.scrollTween.stop();
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