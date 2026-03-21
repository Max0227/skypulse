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
    this.upgradeCards = [];
    this.currentCardIndex = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartContainerX = 0;
    this.scrollVelocity = 0;
    this.selectedUpgrade = null;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('ShopScene: create started');

    // Создаём фон
    this.createCyberpunkBackground();
    this.createFloatingParticles();
    this.createAnimatedGrid();
    this.createStars();

    // Заголовок
    this.createHeader();

    // Баланс кристаллов
    this.createBalanceDisplay();

    // Создаём горизонтальный список улучшений (карусель)
    this.createUpgradeCarousel();

    // Создаём детальную панель для выбранного улучшения
    this.createDetailPanel();

    // Кнопки действий
    this.createActionButtons();

    // Нижняя панель
    this.createFooter();

    // Запуск анимаций
    this.startAnimations();

    // Обработчики
    this.input.keyboard.on('keydown-ESC', () => {
      this.cleanupBeforeExit();
      this.scene.start('menu');
    });

    this.scale.on('resize', this.onResize, this);
    
    // Выбираем первое улучшение по умолчанию
    if (SHOP_UPGRADES.length > 0) {
      this.selectUpgrade(0);
    }

    console.log('ShopScene: create completed');
  }

  // =========================================================================
  // ФОН
  // =========================================================================

  createCyberpunkBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(0, 0, w, h, 0x030712).setOrigin(0);

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
      
      this.tweens.add({
        targets: gradientImage,
        y: index * 5,
        duration: 8000 + index * 1000,
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
    const balanceContainer = this.add.container(w / 2, 100);

    const balanceBg = this.add.rectangle(0, 0, 280, 45, 0x0a0a1a, 0.9)
      .setStrokeStyle(3, 0x00ffff, 0.8);

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

    this.balanceText = this.add.text(20, 0, `${gameManager.data.crystals}`, {
      fontSize: '28px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, 0.5);

    const creditsLabel = this.add.text(0, -20, 'КРИСТАЛЛЫ', {
      fontSize: '10px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff'
    }).setOrigin(0.5);

    balanceContainer.add([balanceBg, crystalIcon, this.balanceText, creditsLabel]);

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
  // ГОРИЗОНТАЛЬНАЯ КАРУСЕЛЬ УЛУЧШЕНИЙ
  // =========================================================================

  createUpgradeCarousel() {
    const w = this.scale.width;
    const carouselY = 180;
    const cardWidth = 280;
    const cardSpacing = 20;
    
    // Контейнер для карточек
    this.carouselContainer = this.add.container(w / 2, carouselY);
    
    // Создаём карточки
    SHOP_UPGRADES.forEach((upgrade, index) => {
      const card = this.createUpgradeCard(upgrade, index, cardWidth);
      card.x = (index - SHOP_UPGRADES.length / 2) * (cardWidth + cardSpacing);
      this.carouselContainer.add(card);
      this.upgradeCards.push({ card, upgrade, index });
    });
    
    // Добавляем сенсорное управление для скролла
    this.setupCarouselDrag(cardWidth, cardSpacing);
  }

  createUpgradeCard(upgrade, index, cardWidth) {
    const level = gameManager.getUpgradeLevel(upgrade.key);
    const maxLevel = upgrade.maxLevel;
    const cost = gameManager.getUpgradeCost(upgrade.key);
    const canAfford = gameManager.data.crystals >= cost && level < maxLevel;
    const isMax = level >= maxLevel;
    const progress = (level / maxLevel) * 100;
    
    const container = this.add.container(0, 0);
    container.setData('upgrade', upgrade);
    container.setData('index', index);
    
    // Фон карточки
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a3a, 0.9);
    bg.fillRoundedRect(-cardWidth / 2, -100, cardWidth, 200, 20);
    bg.lineStyle(3, isMax ? 0x00ff00 : (canAfford ? 0x00ffff : 0x444444), 0.8);
    bg.strokeRoundedRect(-cardWidth / 2, -100, cardWidth, 200, 20);
    container.setData('bg', bg);
    
    // Иконка
    const icon = this.add.text(0, -60, upgrade.icon, {
      fontSize: '48px'
    }).setOrigin(0.5);
    
    // Название
    const name = this.add.text(0, -20, upgrade.name, {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffffff',
      stroke: isMax ? '#00ff00' : (canAfford ? '#00ffff' : '#888888'),
      strokeThickness: 1
    }).setOrigin(0.5);
    
    // Текущий уровень
    const levelText = this.add.text(0, 5, `Уровень ${level}/${maxLevel}`, {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#88aaff'
    }).setOrigin(0.5);
    
    // Прогресс-бар
    const progressBg = this.add.rectangle(0, 30, 180, 8, 0x333333);
    const progressFill = this.add.rectangle(-90, 30, 180 * (level / maxLevel), 8, 
      isMax ? 0x00ff00 : (canAfford ? 0x00ffff : 0x666666)).setOrigin(0, 0.5);
    
    // Значение улучшения
    const currentValue = this.getUpgradeValue(upgrade.key, level);
    const nextValue = !isMax ? this.getUpgradeValue(upgrade.key, level + 1) : null;
    
    const valueText = this.add.text(0, 50, `${currentValue} → ${nextValue || 'MAX'}`, {
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
    
    // Добавляем интерактивность для выбора карточки
    const hitArea = this.add.rectangle(0, 0, cardWidth, 200, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setData('upgrade', upgrade);
    
    hitArea.on('pointerdown', () => {
      this.selectUpgrade(index);
    });
    
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
    let velocity = 0;
    let lastX = 0;
    let isDragging = false;
    let dragTween = null;
    
    const scrollZone = this.add.zone(0, 0, w, this.scale.height)
      .setOrigin(0)
      .setInteractive();
    
    scrollZone.on('pointerdown', (pointer) => {
      startX = pointer.x;
      startContainerX = this.carouselContainer.x;
      lastX = pointer.x;
      isDragging = true;
      velocity = 0;
      
      if (dragTween) {
        dragTween.stop();
        dragTween = null;
      }
    });
    
    scrollZone.on('pointermove', (pointer) => {
      if (!isDragging) return;
      
      const deltaX = pointer.x - lastX;
      velocity = deltaX;
      
      let newX = startContainerX + deltaX;
      newX = Phaser.Math.Clamp(newX, minX, maxX);
      
      this.carouselContainer.x = newX;
      lastX = pointer.x;
    });
    
    scrollZone.on('pointerup', () => {
      isDragging = false;
      
      if (Math.abs(velocity) > 5) {
        const targetX = this.carouselContainer.x + velocity * 2;
        dragTween = this.tweens.add({
          targets: this.carouselContainer,
          x: Phaser.Math.Clamp(targetX, minX, maxX),
          duration: 300,
          ease: 'Power2.easeOut',
          onUpdate: () => {
            this.updateSelectedCard();
          },
          onComplete: () => {
            dragTween = null;
          }
        });
      } else {
        this.snapToNearestCard(cardWidth, cardSpacing, minX, maxX);
      }
    });
    
    // Добавляем свайп на мобильных
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const newX = this.carouselContainer.x + deltaX;
        this.carouselContainer.x = Phaser.Math.Clamp(newX, minX, maxX);
        this.updateSelectedCard();
      }
    });
  }

  snapToNearestCard(cardWidth, cardSpacing, minX, maxX) {
    const currentX = this.carouselContainer.x;
    const centerX = this.scale.width / 2;
    
    let bestIndex = 0;
    let bestDistance = Infinity;
    
    SHOP_UPGRADES.forEach((_, index) => {
      const targetX = centerX + (index - SHOP_UPGRADES.length / 2) * (cardWidth + cardSpacing);
      const distance = Math.abs(currentX - targetX);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    
    const targetX = centerX + (bestIndex - SHOP_UPGRADES.length / 2) * (cardWidth + cardSpacing);
    
    this.tweens.add({
      targets: this.carouselContainer,
      x: Phaser.Math.Clamp(targetX, minX, maxX),
      duration: 300,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.selectUpgrade(bestIndex);
      }
    });
  }

  updateSelectedCard() {
    const centerX = this.scale.width / 2;
    const cardWidth = 280;
    const cardSpacing = 20;
    
    let bestIndex = 0;
    let bestDistance = Infinity;
    
    SHOP_UPGRADES.forEach((_, index) => {
      const targetX = centerX + (index - SHOP_UPGRADES.length / 2) * (cardWidth + cardSpacing);
      const distance = Math.abs(this.carouselContainer.x - targetX);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    
    this.selectUpgrade(bestIndex, true);
  }

  // =========================================================================
  // ДЕТАЛЬНАЯ ПАНЕЛЬ
  // =========================================================================

  createDetailPanel() {
    const w = this.scale.width;
    const h = this.scale.height;
    const panelY = h - 160;
    
    this.detailContainer = this.add.container(w / 2, panelY);
    this.detailContainer.setDepth(15);
    
    // Фон панели
    this.detailBg = this.add.graphics();
    this.detailBg.fillStyle(0x0a0a1a, 0.95);
    this.detailBg.fillRoundedRect(-180, -70, 360, 140, 20);
    this.detailBg.lineStyle(2, 0x00ffff, 0.6);
    this.detailBg.strokeRoundedRect(-180, -70, 360, 140, 20);
    
    // Название улучшения
    this.detailName = this.add.text(0, -40, '', {
      fontSize: '20px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Описание
    this.detailDesc = this.add.text(0, -15, '', {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.text_secondary,
      wordWrap: { width: 300 }
    }).setOrigin(0.5);
    
    // Текущий уровень
    this.detailLevel = this.add.text(0, 15, '', {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#88aaff'
    }).setOrigin(0.5);
    
    // Следующий уровень
    this.detailNext = this.add.text(0, 35, '', {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#ffaa00'
    }).setOrigin(0.5);
    
    this.detailContainer.add([this.detailBg, this.detailName, this.detailDesc, this.detailLevel, this.detailNext]);
  }

  selectUpgrade(index, silent = false) {
    if (index < 0 || index >= SHOP_UPGRADES.length) return;
    
    this.currentCardIndex = index;
    const upgrade = SHOP_UPGRADES[index];
    const level = gameManager.getUpgradeLevel(upgrade.key);
    const maxLevel = upgrade.maxLevel;
    const isMax = level >= maxLevel;
    const cost = gameManager.getUpgradeCost(upgrade.key);
    const canAfford = gameManager.data.crystals >= cost && !isMax;
    
    // Обновляем детальную панель
    this.detailName.setText(upgrade.name);
    this.detailDesc.setText(this.getUpgradeDesc(upgrade.key));
    this.detailLevel.setText(`УРОВЕНЬ: ${level}/${maxLevel}`);
    
    if (!isMax) {
      const nextValue = this.getUpgradeValue(upgrade.key, level + 1);
      const currentValue = this.getUpgradeValue(upgrade.key, level);
      this.detailNext.setText(`${currentValue} → ${nextValue} | СТОИМОСТЬ: ${cost} 💎`);
      this.detailNext.setColor(canAfford ? '#ffaa00' : '#ff4444');
    } else {
      this.detailNext.setText('ДОСТИГНУТ МАКСИМАЛЬНЫЙ УРОВЕНЬ');
      this.detailNext.setColor('#00ff00');
    }
    
    // Анимация выделения карточки
    this.upgradeCards.forEach((card, i) => {
      const bg = card.card.getData('bg');
      if (bg) {
        bg.clear();
        const isSelected = i === index;
        const isMaxLevel = gameManager.getUpgradeLevel(card.upgrade.key) >= card.upgrade.maxLevel;
        const canAffordUpgrade = gameManager.data.crystals >= gameManager.getUpgradeCost(card.upgrade.key) && !isMaxLevel;
        
        bg.fillStyle(0x1a1a3a, 0.9);
        bg.fillRoundedRect(-140, -100, 280, 200, 20);
        
        let borderColor;
        if (isSelected) borderColor = 0xffff00;
        else if (isMaxLevel) borderColor = 0x00ff00;
        else if (canAffordUpgrade) borderColor = 0x00ffff;
        else borderColor = 0x444444;
        
        bg.lineStyle(3, borderColor, isSelected ? 1 : 0.8);
        bg.strokeRoundedRect(-140, -100, 280, 200, 20);
      }
    });
    
    if (!silent) {
      audioManager.playSound(this, 'tap_sound', 0.2);
    }
    
    this.selectedUpgrade = upgrade;
  }

  getUpgradeDesc(key) {
    const descs = {
      jumpPower: 'Увеличивает силу прыжка такси',
      gravity: 'Уменьшает силу гравитации',
      shieldDuration: 'Увеличивает время действия щита',
      magnetRange: 'Увеличивает радиус притяжения монет',
      wagonHP: 'Увеличивает прочность вагонов',
      maxWagons: 'Увеличивает максимальное количество вагонов',
      wagonGap: 'Уменьшает расстояние между вагонами',
      headHP: 'Увеличивает максимальное здоровье',
      revival: 'Позволяет воскреснуть после смерти',
      weaponDamage: 'Увеличивает урон оружия',
      weaponSpeed: 'Увеличивает скорость пуль',
      weaponFireRate: 'Увеличивает скорострельность'
    };
    return descs[key] || 'Улучшает характеристики такси';
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
    const btnY = h - 50;
    
    // Кнопка КУПИТЬ
    this.buyBtn = this.createActionButton(w / 2 - 120, btnY, 'КУПИТЬ', '#00ff00', () => this.buyUpgrade());
    
    // Кнопка ОТМЕНИТЬ (возврат кристаллов)
    this.refundBtn = this.createActionButton(w / 2, btnY, 'ОТМЕНИТЬ', '#ffaa00', () => this.refundUpgrade());
    
    // Кнопка СБРОСИТЬ ВСЕ
    this.resetBtn = this.createActionButton(w / 2 + 120, btnY, 'СБРОС ВСЕ', '#ff4444', () => this.confirmReset());
    
    // Добавляем анимацию пульсации для кнопки покупки
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
    const buttonState = { glowAlpha: 0.3 };
    
    const updateButton = () => {
      button.clear();
      button.fillStyle(0x1a1a3a, 0.9);
      button.fillRoundedRect(x - 80, y - 20, 160, 40, 12);
      button.lineStyle(3, btnColor, buttonState.glowAlpha);
      button.strokeRoundedRect(x - 80, y - 20, 160, 40, 12);
    };
    
    updateButton();
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff',
      stroke: color,
      strokeThickness: 2
    }).setOrigin(0.5);
    
    const hitArea = this.add.rectangle(x, y, 160, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: buttonState,
        glowAlpha: 0.8,
        duration: 200,
        onUpdate: updateButton
      });
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
      buttonText.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
      this.playClickSound();
      callback();
    });
    
    return { button, buttonText, hitArea };
  }

  buyUpgrade() {
    if (!this.selectedUpgrade) return;
    
    const upgrade = this.selectedUpgrade;
    const level = gameManager.getUpgradeLevel(upgrade.key);
    const maxLevel = upgrade.maxLevel;
    const cost = gameManager.getUpgradeCost(upgrade.key);
    
    if (level >= maxLevel) {
      this.showMessage('Достигнут максимальный уровень!', '#ffaa00');
      return;
    }
    
    if (gameManager.data.crystals < cost) {
      this.showMessage('Недостаточно кристаллов!', '#ff4444');
      return;
    }
    
    // Покупаем улучшение
    if (gameManager.upgrade(upgrade.key)) {
      this.playPurchaseSound();
      this.balanceText.setText(`${gameManager.data.crystals}`);
      
      // Анимация покупки
      this.createBuyEffect();
      
      // Обновляем карточку
      this.refreshCurrentCard();
      
      this.showMessage(`✓ ${upgrade.name} улучшен!`, '#00ff00');
    }
  }

  refundUpgrade() {
    if (!this.selectedUpgrade) return;
    
    const upgrade = this.selectedUpgrade;
    const level = gameManager.getUpgradeLevel(upgrade.key);
    
    if (level === 0) {
      this.showMessage('Нечего отменять - улучшение не куплено!', '#ffaa00');
      return;
    }
    
    // Возвращаем 80% стоимости последнего улучшения
    const lastCost = this.getUpgradeCostAtLevel(upgrade.key, level - 1);
    const refundAmount = Math.floor(lastCost * 0.8);
    
    // Уменьшаем уровень
    gameManager.data.upgrades[upgrade.key] = level - 1;
    gameManager.data.crystals += refundAmount;
    gameManager.save();
    
    this.balanceText.setText(`${gameManager.data.crystals}`);
    
    // Анимация возврата
    this.createRefundEffect();
    
    // Обновляем карточку
    this.refreshCurrentCard();
    
    this.showMessage(`↺ Возвращено ${refundAmount} 💎`, '#ffaa00');
    this.playClickSound();
  }

  getUpgradeCostAtLevel(key, level) {
    const upgrade = SHOP_UPGRADES.find(u => u.key === key);
    if (!upgrade) return 0;
    
    const baseCost = upgrade.cost || 10;
    const multiplier = 1.2;
    return Math.floor(baseCost * Math.pow(multiplier, level));
  }

  refreshCurrentCard() {
    if (!this.selectedUpgrade) return;
    
    // Обновляем детальную панель
    const upgrade = this.selectedUpgrade;
    const level = gameManager.getUpgradeLevel(upgrade.key);
    const maxLevel = upgrade.maxLevel;
    const isMax = level >= maxLevel;
    const cost = gameManager.getUpgradeCost(upgrade.key);
    const canAfford = gameManager.data.crystals >= cost && !isMax;
    
    this.detailLevel.setText(`УРОВЕНЬ: ${level}/${maxLevel}`);
    
    if (!isMax) {
      const nextValue = this.getUpgradeValue(upgrade.key, level + 1);
      const currentValue = this.getUpgradeValue(upgrade.key, level);
      this.detailNext.setText(`${currentValue} → ${nextValue} | СТОИМОСТЬ: ${cost} 💎`);
      this.detailNext.setColor(canAfford ? '#ffaa00' : '#ff4444');
    } else {
      this.detailNext.setText('ДОСТИГНУТ МАКСИМАЛЬНЫЙ УРОВЕНЬ');
      this.detailNext.setColor('#00ff00');
    }
    
    // Обновляем карточку в карусели
    const cardData = this.upgradeCards[this.currentCardIndex];
    if (cardData) {
      const oldCard = cardData.card;
      const newCard = this.createUpgradeCard(cardData.upgrade, this.currentCardIndex, 280);
      newCard.x = oldCard.x;
      this.carouselContainer.add(newCard);
      oldCard.destroy();
      this.upgradeCards[this.currentCardIndex].card = newCard;
    }
  }

  createBuyEffect() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Вспышка
    const flash = this.add.rectangle(w / 2, h / 2, w, h, 0x00ff00, 0);
    this.tweens.add({
      targets: flash,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      onComplete: () => flash.destroy()
    });
    
    // Частицы
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        w / 2 + Phaser.Math.Between(-100, 100),
        h / 2 + Phaser.Math.Between(-50, 50),
        Phaser.Math.Between(2, 5),
        0x00ff00,
        0.7
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: particle,
        y: particle.y - Phaser.Math.Between(50, 150),
        alpha: 0,
        scale: 0,
        duration: 800,
        onComplete: () => particle.destroy()
      });
    }
  }

  createRefundEffect() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    for (let i = 0; i < 15; i++) {
      const particle = this.add.circle(
        w / 2 + Phaser.Math.Between(-80, 80),
        h / 2 + Phaser.Math.Between(-40, 40),
        Phaser.Math.Between(2, 4),
        0xffaa00,
        0.6
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-50, 50),
        y: particle.y - Phaser.Math.Between(30, 100),
        alpha: 0,
        scale: 0,
        duration: 600,
        onComplete: () => particle.destroy()
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
  // НИЖНЯЯ ПАНЕЛЬ
  // =========================================================================

  createFooter() {
    const w = this.scale.width;
    const h = this.scale.height;

    const footerLine = this.add.graphics();
    footerLine.lineStyle(2, 0x00ffff, 0.3);
    footerLine.lineBetween(50, h - 100, w - 50, h - 100);

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
        const time = Date.now() / 1000;
        this.stars.forEach(star => {
          star.sprite.alpha = star.baseAlpha + Math.sin(time * 5 * star.speed) * 0.3;
          star.sprite.rotation += 0.001;
        });
      },
      loop: true
    });

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
    this.upgradeCards = [];
    console.log('ShopScene: shutdown');
  }
}