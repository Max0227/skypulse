import Phaser from 'phaser';
import { COLORS, SHOP_UPGRADES } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super('shop');
    this.stars = [];
    this.neonButtons = [];
    this.particles = [];
    this.gridOffset = 0;
    this.lastHoverTime = 0;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('ShopScene: create started');

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

    // ===== СПИСОК УЛУЧШЕНИЙ С ПРОКРУТКОЙ =====
    this.createScrollableUpgradesList();

    // ===== НИЖНЯЯ ПАНЕЛЬ С КНОПКАМИ =====
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

    console.log('ShopScene: create completed');
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
      
      this.particles.push(particle);
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
    this.title = this.add.text(w / 2, 40, 'МАГАЗИН УЛУЧШЕНИЙ', {
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

    // Копия для свечения
    this.titleGlow = this.add.text(w / 2, 40, 'МАГАЗИН УЛУЧШЕНИЙ', {
      fontSize: '42px',
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
    const balanceContainer = this.add.container(w / 2, 90);

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
  // СОЗДАНИЕ ПРОКРУЧИВАЕМОГО СПИСКА УЛУЧШЕНИЙ
  // =========================================================================

  createScrollableUpgradesList() {
    const w = this.scale.width;
    const h = this.scale.height;
    const listTop = 130;
    const listHeight = h - 200;

    // Маска
    const maskArea = this.add.graphics();
    maskArea.fillStyle(0xffffff);
    maskArea.fillRect(10, listTop, w - 20, listHeight);
    const mask = maskArea.createGeometryMask();

    // Контейнер
    this.upgradesContainer = this.add.container(0, listTop);
    this.upgradesContainer.setMask(mask);

    let currentY = 10;
    const cardSpacing = 80;

    SHOP_UPGRADES.forEach((upgrade) => {
      this.createUpgradeCard(upgrade, w, currentY);
      currentY += cardSpacing;
    });

    // Отступ внизу
    this.upgradesContainer.add(this.add.rectangle(0, currentY, 10, 30, 0x000000, 0));

    // Система прокрутки
    this.setupScrolling(listTop, listHeight, currentY);
  }

  createUpgradeCard(upgrade, w, y) {
    const elements = [];

    const level = gameManager.getUpgradeLevel(upgrade.key);
    const maxLevel = upgrade.maxLevel;
    const cost = gameManager.getUpgradeCost(upgrade.key);
    const canAfford = gameManager.data.crystals >= cost && level < maxLevel;
    const isMax = level >= maxLevel;

    // Цвета
    let borderColor = 0x666666;
    let bgColor = 0x0a0a1a;
    
    if (isMax) {
      borderColor = 0x00ff00;
    } else if (canAfford) {
      borderColor = 0x00ffff;
    }

    // Фон карточки
    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.9);
    bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 70, 12);
    bg.lineStyle(3, borderColor, 1);
    bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 70, 12);

    // Иконка и название
    const nameText = this.add.text(30, y + 20, `${upgrade.icon} ${upgrade.name}`, {
      fontSize: '16px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: borderColor === 0x00ffff ? '#00ffff' : '#888888',
      strokeThickness: 1
    }).setOrigin(0, 0.5);

    // Текущий уровень
    const levelText = this.add.text(30, y + 45, `Уровень: ${level}/${maxLevel}`, {
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff'
    }).setOrigin(0, 0.5);

    // Следующий уровень (если не макс)
    if (!isMax) {
      const nextValue = this.getNextValue(upgrade.key, level);
      this.add.text(200, y + 20, `→ ${nextValue}`, {
        fontSize: '14px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#ffaa00'
      }).setOrigin(0, 0.5);
    }

    // Прогресс-бар
    const progressWidth = 100;
    const progressX = w - 180;
    const progressY = y + 45;

    const progressBg = this.add.rectangle(progressX, progressY, progressWidth, 6, 0x333333)
      .setOrigin(0, 0.5);

    const progressFill = this.add.rectangle(progressX, progressY, progressWidth * (level / maxLevel), 6, borderColor)
      .setOrigin(0, 0.5);

    // Цена или MAX
    if (isMax) {
      const maxText = this.add.text(w - 40, y + 35, 'MAX', {
        fontSize: '18px',
        fontFamily: '"Audiowide", sans-serif',
        color: '#00ff00'
      }).setOrigin(1, 0.5);
      elements.push(maxText);
    } else {
      const priceText = this.add.text(w - 40, y + 25, `${cost} 💎`, {
        fontSize: '16px',
        fontFamily: '"Audiowide", sans-serif',
        color: canAfford ? '#ffaa00' : '#ff4444'
      }).setOrigin(1, 0.5);

      elements.push(priceText);

      // Индикатор возможности покупки
      if (canAfford) {
        const buyIcon = this.add.text(w - 40, y + 50, '✓', {
          fontSize: '20px',
          fontFamily: 'sans-serif',
          color: '#00ff00'
        }).setOrigin(1, 0.5);
        elements.push(buyIcon);
      }
    }

    elements.push(bg, nameText, levelText, progressBg, progressFill);

    // Интерактивная область
    const hitArea = this.add.rectangle(w / 2, y + 35, w - 40, 70, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5);

    hitArea.on('pointerover', () => {
      if (!isMax) {
        bg.clear();
        bg.fillStyle(0x1a1a3a, 0.9);
        bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 70, 12);
        bg.lineStyle(3, borderColor, 1);
        bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 70, 12);
      }
      this.playHoverSound();
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(bgColor, 0.9);
      bg.fillRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 70, 12);
      bg.lineStyle(3, borderColor, 1);
      bg.strokeRoundedRect(w / 2 - (w - 40) / 2, y, w - 40, 70, 12);
    });

    if (canAfford) {
      hitArea.on('pointerdown', () => {
        if (gameManager.upgrade(upgrade.key)) {
          this.playPurchaseSound();
          this.balanceText.setText(`${gameManager.data.crystals}`);
          this.showMessage(`✓ УЛУЧШЕНО: ${upgrade.name}`, '#00ff00');
          this.scene.restart();
        }
      });
    }

    elements.push(hitArea);
    this.upgradesContainer.add(elements);
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
      startContainerY = this.upgradesContainer.y;
      lastY = pointer.y;
      isDragging = true;
      velocity = 0;
    });

    scrollZone.on('pointermove', (pointer) => {
      if (!pointer.isDown || !isDragging) return;
      
      const deltaY = pointer.y - lastY;
      velocity = deltaY * 0.5;
      
      let newY = this.upgradesContainer.y + deltaY;
      
      if (newY < minY) {
        newY = minY + (newY - minY) * 0.2;
      } else if (newY > maxY) {
        newY = maxY + (newY - maxY) * 0.2;
      }
      
      this.upgradesContainer.y = newY;
      lastY = pointer.y;
    });

    scrollZone.on('pointerup', () => {
      isDragging = false;
      
      if (Math.abs(velocity) > 1) {
        this.tweens.add({
          targets: this.upgradesContainer,
          y: this.upgradesContainer.y + velocity * 5,
          duration: 500,
          ease: 'Power2.easeOut',
          onUpdate: () => {
            this.upgradesContainer.y = Phaser.Math.Clamp(this.upgradesContainer.y, minY, maxY);
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
        const scrollPercent = (this.upgradesContainer.y - listTop) / (minY - listTop);
        const indicatorY = listTop + 10 + (listHeight - 20 - indicatorHeight) * scrollPercent;
        indicator.y = indicatorY;
      });
    }
  }

  getNextValue(key, level) {
    const nextLevel = level + 1;
    const values = {
      jumpPower: 300 + nextLevel * 25,
      gravity: 1300 - nextLevel * 60,
      shieldDuration: 5 + nextLevel * 1.5,
      magnetRange: 220 + nextLevel * 40,
      wagonHP: 1 + nextLevel,
      maxWagons: 12 + nextLevel * 2,
      wagonGap: 28 - nextLevel * 2,
      headHP: 3 + nextLevel,
      revival: nextLevel,
      weaponDamage: 1 + nextLevel,
      weaponSpeed: 400 + nextLevel * 20,
      weaponFireRate: Math.max(100, 500 - nextLevel * 20)
    };
    return values[key] || 0;
  }

  // =========================================================================
  // НИЖНЯЯ ПАНЕЛЬ
  // =========================================================================

  createFooter() {
    const w = this.scale.width;
    const h = this.scale.height;

    const footerLine = this.add.graphics();
    footerLine.lineStyle(2, 0x00ffff, 0.3);
    footerLine.lineBetween(50, h - 90, w - 50, h - 90);

    // Кнопка сброса улучшений
    const resetBtn = this.createNeonButton(w / 2 - 130, h - 55, 'СБРОСИТЬ', 'danger', () => this.confirmReset());
    
    // Кнопка назад
    const backBtn = this.createNeonButton(w / 2 + 130, h - 55, 'НАЗАД', 'normal', () => {
      this.playClickSound();
      this.cleanupBeforeExit();
      this.scene.start('menu');
    });

    // Версия
    this.add.text(w - 30, h - 25, 'v3.5.0', {
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#666666'
    }).setOrigin(1, 0.5);

    // Декоративные огни
    [-1, 1].forEach(side => {
      const x = side === -1 ? 30 : w - 30;
      
      const light = this.add.circle(x, h - 55, 5, 0x00ffff, 0.5);
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

  createNeonButton(x, y, text, type = 'normal', callback) {
    const colors = {
      normal: { color: 0x00ffff, hoverColor: 0xffffff },
      danger: { color: 0xff4444, hoverColor: 0xff8888 }
    };
    
    const btnColor = colors[type].color;
    const btnHoverColor = colors[type].hoverColor;

    // Графика кнопки
    const button = this.add.graphics();
    
    const buttonState = {
      glowAlpha: 0.3
    };

    const updateButton = () => {
      button.clear();
      
      button.fillStyle(0x1a1a3a, 0.9);
      button.fillRoundedRect(x - 110, y - 20, 220, 40, 12);
      button.lineStyle(3, btnColor, buttonState.glowAlpha);
      button.strokeRoundedRect(x - 110, y - 20, 220, 40, 12);
    };

    updateButton();

    // Текст кнопки
    const buttonText = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      stroke: Phaser.Display.Color.ValueToColor(btnColor).rgba,
      strokeThickness: 2
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, 220, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: buttonState,
        glowAlpha: 0.8,
        duration: 200,
        onUpdate: updateButton
      });
      
      buttonText.setStyle({ stroke: '#ffffff' });
      buttonText.setScale(1.05);
      this.playHoverSound();
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: buttonState,
        glowAlpha: 0.3,
        duration: 200,
        onUpdate: updateButton
      });
      
      buttonText.setStyle({ stroke: Phaser.Display.Color.ValueToColor(btnColor).rgba });
      buttonText.setScale(1);
    });

    hitArea.on('pointerdown', () => {
      this.playClickSound();
      callback();
    });

    return { button, buttonText };
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

    // Предупреждение
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

    // Кнопки
    const yesBtn = this.createDetailButton(w / 2 - 100, h / 2 + 90, 'СБРОСИТЬ', '#ff0000');
    const noBtn = this.createDetailButton(w / 2 + 100, h / 2 + 90, 'ОТМЕНА', '#00ff00');

    yesBtn.setDepth(52).setScrollFactor(0);
    noBtn.setDepth(52).setScrollFactor(0);

    yesBtn.on('pointerdown', () => {
      // Сброс всех улучшений
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
      ease: 'Power2.easeOut',
      onComplete: () => msg.destroy()
    });
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

  playPurchaseSound() {
    try { audioManager.playSound(this, 'purchase_sound', 0.5); } catch (e) {}
  }

  // =========================================================================
  // АНИМАЦИИ
  // =========================================================================

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

  // =========================================================================
  // ОЧИСТКА
  // =========================================================================

  cleanupBeforeExit() {
    this.tweens.killAll();
    this.particles.forEach(p => p?.destroy());
  }

  onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.tweens.killAll();
    this.stars = [];
    this.particles = [];
    console.log('ShopScene: shutdown');
  }
}