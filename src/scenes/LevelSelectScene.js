import Phaser from 'phaser';
import { COLORS, WORLD_CONFIG, LEVEL_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('levelSelect');
    this.levelCards = [];
    this.stars = [];
    this.particles = [];
    this.neonLines = [];
    this.scrollTween = null;
    this.isDragging = false;
    this.dragStartY = 0;
    this.dragStartContainerY = 0;
    this.scrollVelocity = 0;
    this.lastY = 0;
    this.timeOffset = 0;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.world = gameManager.getCurrentWorld();
    this.worldConfig = WORLD_CONFIG[this.world] || WORLD_CONFIG[0];
    this.levelConfigBase = LEVEL_CONFIG[this.world] || LEVEL_CONFIG[0];

    // Создаём эпический киберпанк-фон
    this.createCyberpunkBackground();

    // Создаём неоновые линии
    this.createNeonLines();

    // Создаём звёзды с мерцанием
    this.createStars();

    // Анимированные частицы
    this.createParticles();

    // Заголовок с названием мира
    this.createHeader();

    // Баланс кристаллов
    this.createBalanceDisplay();

    // Статистика мира
    this.createWorldStats();

    // Контейнер для уровней
    this.createLevelList();

    // Кнопка назад
    this.createBackButton();

    // Обработка скролла
    this.setupScrolling();

    // Обработка ресайза
    this.scale.on('resize', this.onResize, this);

    // Запуск анимаций
    this.startAnimations();
  }

  // =========================================================================
  // КИБЕРПАНК-ФОН
  // =========================================================================

  createCyberpunkBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Основной градиент
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(
      this.worldConfig.gradientStart || 0x030712,
      this.worldConfig.gradientStart || 0x030712,
      this.worldConfig.gradientEnd || 0x0a0a1a,
      this.worldConfig.gradientEnd || 0x0a0a1a,
      1
    );
    gradient.fillRect(0, 0, w, h);
    gradient.setDepth(-20);

    // Диагональные линии
    const diagonalLines = this.add.graphics();
    diagonalLines.lineStyle(1, 0x00ffff, 0.1);
    for (let i = -h; i < w + h; i += 40) {
      diagonalLines.moveTo(i, 0);
      diagonalLines.lineTo(i + h, h);
    }
    diagonalLines.strokePath();
    diagonalLines.setDepth(-15);

    // Глитч-эффект (смещённые прямоугольники)
    for (let i = 0; i < 5; i++) {
      const glitch = this.add.rectangle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.Between(50, 200),
        Phaser.Math.Between(2, 8),
        0x00ffff,
        0.1
      );
      glitch.setBlendMode(Phaser.BlendModes.ADD);
      glitch.setDepth(-12);
      
      this.tweens.add({
        targets: glitch,
        alpha: 0,
        x: glitch.x + Phaser.Math.Between(-50, 50),
        duration: Phaser.Math.Between(500, 2000),
        yoyo: true,
        repeat: -1
      });
    }

    // Угловые неоновые элементы
    const cornerSize = 40;
    const corners = [
      { x: 0, y: 0, rotation: 0 },
      { x: w, y: 0, rotation: 90 },
      { x: 0, y: h, rotation: -90 },
      { x: w, y: h, rotation: 180 }
    ];
    
    corners.forEach(corner => {
      const cornerGraphics = this.add.graphics();
      cornerGraphics.lineStyle(2, 0x00ffff, 0.5);
      cornerGraphics.moveTo(corner.x, corner.y);
      cornerGraphics.lineTo(corner.x + cornerSize, corner.y);
      cornerGraphics.moveTo(corner.x, corner.y);
      cornerGraphics.lineTo(corner.x, corner.y + cornerSize);
      cornerGraphics.strokePath();
      cornerGraphics.setDepth(-10);
      
      this.tweens.add({
        targets: cornerGraphics,
        alpha: { from: 0.3, to: 0.8 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    });
  }

  createNeonLines() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Горизонтальные неоновые линии
    for (let i = 0; i < 5; i++) {
      const y = 80 + i * 150;
      const line = this.add.graphics();
      line.lineStyle(1, 0x00ffff, 0.2);
      line.moveTo(0, y);
      line.lineTo(w, y);
      line.strokePath();
      line.setDepth(-8);
      
      this.neonLines.push(line);
    }
    
    // Вертикальные неоновые линии
    for (let i = 0; i < 3; i++) {
      const x = 50 + i * 150;
      const line = this.add.graphics();
      line.lineStyle(1, 0xff00ff, 0.2);
      line.moveTo(x, 0);
      line.lineTo(x, h);
      line.strokePath();
      line.setDepth(-8);
      
      this.neonLines.push(line);
    }
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;
    const starColors = this.getStarColors(this.world);
    const starCount = this.world === 0 ? 200 : 120;

    for (let i = 0; i < starCount; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      const scale = Phaser.Math.FloatBetween(0.2, 1.5);
      star.setScale(scale);
      star.setTint(starColors[Math.floor(Math.random() * starColors.length)]);
      star.setAlpha(Phaser.Math.FloatBetween(0.1, 0.5));
      star.setDepth(-12);
      star.setBlendMode(Phaser.BlendModes.ADD);
      
      this.stars.push({
        sprite: star,
        speed: Phaser.Math.FloatBetween(0.01, 0.08),
        baseAlpha: Phaser.Math.FloatBetween(0.1, 0.5),
        rotationSpeed: Phaser.Math.FloatBetween(-0.03, 0.03)
      });
    }
  }

  createParticles() {
    const w = this.scale.width;
    const h = this.scale.height;
    const particleColors = this.getParticleColors();
    
    for (let i = 0; i < 50; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.Between(1, 4),
        particleColors[Math.floor(Math.random() * particleColors.length)],
        Phaser.Math.FloatBetween(0.1, 0.4)
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      particle.setDepth(-10);
      
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-150, 150),
        y: particle.y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        duration: Phaser.Math.Between(5000, 12000),
        yoyo: true,
        repeat: -1,
        delay: i * 150,
        ease: 'Sine.easeInOut'
      });
      
      this.particles.push(particle);
    }
  }

  getParticleColors() {
    const colors = {
      0: [0x44aaff, 0x88ccff, 0xaaddff],
      1: [0xff44ff, 0xff88ff, 0xffaaff],
      2: [0xff8866, 0xffaa88, 0xffccaa],
      3: [0xffaa66, 0xffcc88, 0xffeebb],
      4: [0xaa88ff, 0xcc88ff, 0xeeaaff]
    };
    return colors[this.world] || colors[0];
  }

  // =========================================================================
  // ЗАГОЛОВОК
  // =========================================================================

  createHeader() {
    const w = this.scale.width;
    const worldColor = this.getWorldColorString(this.world);
    
    // Анимированная рамка вокруг заголовка
    const headerGlow = this.add.graphics();
    headerGlow.lineStyle(2, worldColor, 0.5);
    headerGlow.strokeRoundedRect(w / 2 - 140, 25, 280, 80, 20);
    headerGlow.setDepth(5);
    
    this.tweens.add({
      targets: headerGlow,
      alpha: { from: 0.3, to: 0.8 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // Иконка мира с анимацией
    const icon = this.add.text(w / 2 - 110, 45, this.getWorldIcon(), {
      fontSize: '56px'
    }).setOrigin(0.5).setDepth(6);
    
    this.tweens.add({
      targets: icon,
      scale: { from: 1, to: 1.1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Название мира
    const title = this.add.text(w / 2 + 10, 45, this.worldConfig.name, {
      fontSize: '34px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ffffff',
      stroke: worldColor,
      strokeThickness: 4,
      shadow: { blur: 20, color: worldColor, fill: true }
    }).setOrigin(0, 0.5).setDepth(6);
    
    // Подзаголовок
    const subtitle = this.add.text(w / 2, 90, 'ВЫБОР УРОВНЯ', {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.text_secondary,
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(6);
    
    // Анимированная линия под заголовком
    const line = this.add.graphics();
    line.lineStyle(2, worldColor, 0.6);
    line.moveTo(w / 2 - 80, 115);
    line.lineTo(w / 2 + 80, 115);
    line.strokePath();
    line.setDepth(6);
    
    this.tweens.add({
      targets: line,
      scaleX: { from: 0.8, to: 1.2 },
      alpha: { from: 0.4, to: 0.8 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  getWorldIcon() {
    const icons = {
      0: '🌌',
      1: '🌃',
      2: '🏰',
      3: '☄️',
      4: '🕳️'
    };
    return icons[this.world] || '🌍';
  }

  createBalanceDisplay() {
    const w = this.scale.width;
    
    // Создаём стильный контейнер баланса
    const balanceContainer = this.add.container(w - 25, 95);
    balanceContainer.setDepth(10);
    
    // Фон с неоновой рамкой
    const bg = this.add.rectangle(0, 0, 120, 38, 0x0a0a1a, 0.85);
    bg.setStrokeStyle(1, COLORS.accent, 0.6);
    bg.setDepth(9);
    
    // Иконка с анимацией
    const icon = this.add.text(-45, 0, '💎', {
      fontSize: '22px'
    }).setOrigin(0.5).setDepth(10);
    
    this.tweens.add({
      targets: icon,
      scale: { from: 1, to: 1.2 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    this.balanceText = this.add.text(10, 0, `${gameManager.data.crystals}`, {
      fontSize: '20px',
      fontFamily: "'Audiowide', sans-serif",
      color: COLORS.accent,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5).setDepth(10);
    
    balanceContainer.add([bg, icon, this.balanceText]);
    
    // Эффект свечения
    const glow = this.add.circle(w - 25, 95, 25, COLORS.accent, 0.1);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(8);
    
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.05, to: 0.2 },
      scale: { from: 1, to: 1.3 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
  }

  createWorldStats() {
    const w = this.scale.width;
    const starsTotal = gameManager.getStarsForWorld(this.world);
    const progress = gameManager.getWorldProgress(this.world) + 1;
    const worldBonus = this.worldConfig.specialMechanic || 'Нет';
    
    const statsContainer = this.add.container(w / 2, 135);
    statsContainer.setDepth(5);
    
    // Фон с градиентом
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 0.7);
    bg.fillRoundedRect(-145, -18, 290, 36, 18);
    bg.lineStyle(1, this.getWorldColor(this.world), 0.4);
    bg.strokeRoundedRect(-145, -18, 290, 36, 18);
    statsContainer.add(bg);
    
    // Статистика с иконками
    const stats = [
      { icon: '⭐', value: `${starsTotal}/30`, color: '#ffaa00', x: -100 },
      { icon: '📊', value: `${progress}/10`, color: COLORS.primary, x: -20 },
      { icon: '✨', value: worldBonus, color: COLORS.text_secondary, x: 80, fontSize: 10 }
    ];
    
    stats.forEach(stat => {
      const iconText = this.add.text(stat.x, 0, stat.icon, {
        fontSize: '14px'
      }).setOrigin(0.5);
      
      const valueText = this.add.text(stat.x + 20, 0, stat.value, {
        fontSize: stat.fontSize || '12px',
        fontFamily: "'Orbitron', sans-serif",
        color: stat.color
      }).setOrigin(0, 0.5);
      
      statsContainer.add([iconText, valueText]);
    });
  }

  // =========================================================================
  // УРОВНИ (НЕОНОВЫЕ КАРТОЧКИ)
  // =========================================================================

  createLevelList() {
    const w = this.scale.width;
    const startY = 175;
    
    this.levelContainer = this.add.container(0, startY);
    this.levelContainer.setDepth(10);
    
    this.createLevelCards();
    
    this.scrollBounds = {
      minY: startY - this.totalHeight + (this.scale.height - 250),
      maxY: startY
    };
  }

  createLevelCards() {
    const spacing = 88;
    let currentY = 10;
    
    for (let level = 0; level < 10; level++) {
      const unlocked = gameManager.isLevelUnlocked(this.world, level) || level === 0;
      const stars = gameManager.getLevelStars(this.world, level);
      const price = gameManager.getLevelPrice(this.world, level);
      const canBuy = gameManager.data.crystals >= price;
      const isBoss = level === 9;
      
      const card = this.createNeonLevelCard(level, unlocked, stars, price, canBuy, isBoss, currentY);
      this.levelContainer.add(card);
      this.levelCards.push(card);
      currentY += spacing;
    }
    
    this.totalHeight = currentY + 20;
  }

  createNeonLevelCard(level, unlocked, stars, price, canBuy, isBoss, y) {
    const w = this.scale.width;
    const worldColor = this.getWorldColor(this.world);
    const worldColorStr = this.getWorldColorString(this.world);
    
    // Определяем цветовую схему
    let borderColor, glowColor, bgColor;
    if (unlocked) {
      borderColor = worldColor;
      glowColor = worldColorStr;
      bgColor = 0x1a2a3a;
    } else if (canBuy) {
      borderColor = COLORS.accent;
      glowColor = '#ffaa00';
      bgColor = 0x2a2a1a;
    } else {
      borderColor = 0x444444;
      glowColor = '#666666';
      bgColor = 0x1a1a2a;
    }
    
    const card = this.add.container(w / 2, y);
    card.setDepth(10);
    
    // Неоновая рамка с анимацией
    const border = this.add.graphics();
    border.lineStyle(2, borderColor, 0.8);
    border.strokeRoundedRect(-(w - 40) / 2, -36, w - 40, 72, 16);
    border.setDepth(10);
    
    // Внутреннее свечение
    const innerGlow = this.add.graphics();
    innerGlow.lineStyle(1, borderColor, 0.3);
    innerGlow.strokeRoundedRect(-(w - 40) / 2 + 2, -34, w - 44, 68, 14);
    innerGlow.setDepth(10);
    
    // Фон карточки с градиентом
    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.85);
    bg.fillRoundedRect(-(w - 40) / 2, -36, w - 40, 72, 16);
    bg.setDepth(9);
    
    // Анимация свечения для разблокированных
    if (unlocked) {
      this.tweens.add({
        targets: border,
        alpha: { from: 0.6, to: 1 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    }
    
    // Номер уровня с неоновым эффектом
    const levelNum = this.add.text(-(w - 40) / 2 + 35, -8, `${level + 1}`, {
      fontSize: '32px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: unlocked ? '#ffffff' : '#888888',
      stroke: glowColor,
      strokeThickness: unlocked ? 2 : 1,
      shadow: unlocked ? { blur: 10, color: glowColor, fill: true } : null
    }).setOrigin(0.5).setDepth(11);
    
    // Иконка босса
    if (isBoss) {
      const bossIcon = this.add.text(-(w - 40) / 2 + 35, 20, '👾', {
        fontSize: '20px'
      }).setOrigin(0.5).setDepth(11);
      card.add(bossIcon);
    }
    
    // Название уровня
    const levelName = this.add.text(-(w - 40) / 2 + 80, -18, isBoss ? 'БОСС' : `УРОВЕНЬ ${level + 1}`, {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: unlocked ? COLORS.text_primary : COLORS.text_muted,
      fontWeight: isBoss ? 'bold' : 'normal'
    }).setOrigin(0, 0.5).setDepth(11);
    
    // Цель уровня
    const goalScore = (this.levelConfigBase.goalScore || 500) * (level + 1);
    const goalText = this.add.text(-(w - 40) / 2 + 80, 0, `🎯 ${goalScore}`, {
      fontSize: '10px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.text_secondary
    }).setOrigin(0, 0.5).setDepth(11);
    
    // Неоновые звёзды
    const starsContainer = this.add.container((w - 40) / 2 - 130, -8);
    starsContainer.setDepth(11);
    for (let i = 0; i < 3; i++) {
      const star = this.add.text(i * 22, 0, i < stars ? '★' : '☆', {
        fontSize: '20px',
        color: i < stars ? '#ffaa00' : '#444444',
        shadow: i < stars ? { blur: 8, color: '#ffaa00', fill: true } : null
      }).setOrigin(0.5);
      starsContainer.add(star);
    }
    
    // Статус или цена
    let statusText, statusColor, statusBg;
    if (!unlocked && price > 0) {
      statusText = `${price}`;
      statusColor = canBuy ? '#ffaa00' : '#ff4444';
      statusBg = canBuy ? 0x3a2a1a : 0x3a1a1a;
    } else if (unlocked) {
      statusText = '✓';
      statusColor = '#00ff00';
      statusBg = 0x1a3a1a;
    } else {
      statusText = '🔒';
      statusColor = '#666666';
      statusBg = 0x2a2a2a;
    }
    
    const statusBgRect = this.add.circle((w - 40) / 2 - 50, 0, 20, statusBg, 0.9)
      .setStrokeStyle(1, statusColor, 0.8)
      .setDepth(11);
    
    const status = this.add.text((w - 40) / 2 - 50, 0, statusText, {
      fontSize: statusText === '✓' ? '20px' : '14px',
      fontFamily: "'Audiowide', sans-serif",
      color: statusColor
    }).setOrigin(0.5).setDepth(12);
    
    // Дополнительный текст цены
    if (!unlocked && price > 0) {
      const priceIcon = this.add.text((w - 40) / 2 - 35, 12, '💎', {
        fontSize: '10px'
      }).setOrigin(0.5).setDepth(11);
      card.add(priceIcon);
    }
    
    // Прогресс-бар
    if (unlocked && stars > 0) {
      const progressBar = this.createNeonProgressBar((w - 40) / 2 - 130, 18, stars, 3);
      progressBar.setDepth(11);
      card.add(progressBar);
    }
    
    // Интерактивная область
    const hitArea = this.add.rectangle(0, 0, w - 40, 72, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    
    hitArea.on('pointerover', () => {
      if (unlocked || canBuy) {
        border.clear();
        border.lineStyle(3, borderColor, 1);
        border.strokeRoundedRect(-(w - 40) / 2, -36, w - 40, 72, 16);
        
        levelNum.setScale(1.1);
        this.tweens.add({
          targets: card,
          scale: 1.02,
          duration: 100,
          yoyo: true
        });
        
        audioManager.playSound(this, 'tap_sound', 0.1);
      }
    });
    
    hitArea.on('pointerout', () => {
      border.clear();
      border.lineStyle(2, borderColor, 0.8);
      border.strokeRoundedRect(-(w - 40) / 2, -36, w - 40, 72, 16);
      levelNum.setScale(1);
      card.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
      if (unlocked) {
        this.selectLevel(level);
      } else if (price > 0 && canBuy) {
        this.confirmPurchase(level, price);
      } else if (price > 0 && !canBuy) {
        this.showNoFunds();
      }
    });
    
    card.add([bg, border, innerGlow, levelNum, levelName, goalText, starsContainer, statusBgRect, status, hitArea]);
    
    return card;
  }

  createNeonProgressBar(x, y, current, max) {
    const container = this.add.container(x, y);
    const width = 70;
    const height = 4;
    
    const bg = this.add.rectangle(0, 0, width, height, 0x333333);
    bg.setStrokeStyle(1, 0x666666);
    
    const fill = this.add.rectangle(-width/2, 0, width * (current / max), height, COLORS.accent)
      .setOrigin(0, 0.5);
    
    container.add([bg, fill]);
    return container;
  }

  // =========================================================================
  // ПРОКРУТКА
  // =========================================================================

  setupScrolling() {
    const w = this.scale.width;
    const startY = 175;
    const scrollHeight = this.scale.height - 260;
    
    const scrollZone = this.add.zone(0, startY, w, scrollHeight).setOrigin(0).setInteractive();
    scrollZone.setDepth(15);
    
    let isDragging = false;
    let dragStartY = 0;
    let startContainerY = 0;
    let velocity = 0;
    let lastY = 0;
    
    scrollZone.on('pointerdown', (pointer) => {
      dragStartY = pointer.y;
      startContainerY = this.levelContainer.y;
      lastY = pointer.y;
      isDragging = true;
      velocity = 0;
      
      if (this.scrollTween) {
        this.scrollTween.stop();
        this.scrollTween = null;
      }
    });
    
    scrollZone.on('pointermove', (pointer) => {
      if (!isDragging) return;
      
      const deltaY = pointer.y - lastY;
      velocity = deltaY * 0.5;
      
      let newY = startContainerY + deltaY;
      
      const minY = startY - this.totalHeight + scrollHeight;
      const maxY = startY;
      
      if (newY < minY) {
        newY = minY + (newY - minY) * 0.3;
      } else if (newY > maxY) {
        newY = maxY + (newY - maxY) * 0.3;
      }
      
      this.levelContainer.y = newY;
      lastY = pointer.y;
    });
    
    scrollZone.on('pointerup', () => {
      isDragging = false;
      
      const minY = startY - this.totalHeight + scrollHeight;
      const maxY = startY;
      
      if (Math.abs(velocity) > 1) {
        this.scrollTween = this.tweens.add({
          targets: this.levelContainer,
          y: this.levelContainer.y + velocity * 4,
          duration: 500,
          ease: 'Power2.easeOut',
          onUpdate: () => {
            this.levelContainer.y = Phaser.Math.Clamp(this.levelContainer.y, minY, maxY);
          },
          onComplete: () => {
            this.scrollTween = null;
          }
        });
      } else {
        this.scrollTween = this.tweens.add({
          targets: this.levelContainer,
          y: Phaser.Math.Clamp(this.levelContainer.y, minY, maxY),
          duration: 300,
          ease: 'Power2.easeOut',
          onComplete: () => {
            this.scrollTween = null;
          }
        });
      }
    });
    
    // Неоновый индикатор скролла
    this.createNeonScrollIndicator(startY, scrollHeight);
  }

  createNeonScrollIndicator(startY, scrollHeight) {
    const w = this.scale.width;
    const indicatorHeight = Math.max(40, (scrollHeight / this.totalHeight) * scrollHeight);
    
    const track = this.add.graphics();
    track.fillStyle(0x1a1a3a, 0.6);
    track.fillRoundedRect(w - 12, startY + 10, 4, scrollHeight - 20, 2);
    track.setDepth(15);
    
    const indicator = this.add.graphics();
    indicator.fillStyle(COLORS.primary, 0.9);
    indicator.fillRoundedRect(w - 12, startY + 10, 4, indicatorHeight, 2);
    indicator.setDepth(16);
    
    // Неоновое свечение индикатора
    const glow = this.add.circle(w - 10, startY + 10 + indicatorHeight / 2, 8, COLORS.primary, 0.3);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(15);
    
    this.events.on('update', () => {
      const minY = startY - this.totalHeight + scrollHeight;
      const maxY = startY;
      const scrollPercent = (this.levelContainer.y - minY) / (maxY - minY);
      const indicatorY = startY + 10 + (scrollHeight - 20 - indicatorHeight) * (1 - scrollPercent);
      indicator.y = indicatorY;
      glow.y = indicatorY + indicatorHeight / 2;
    });
  }

  // =========================================================================
  // КНОПКА НАЗАД
  // =========================================================================

  createBackButton() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const btnContainer = this.add.container(w / 2, h - 35);
    btnContainer.setDepth(15);
    
    // Неоновая рамка
    const border = this.add.graphics();
    border.lineStyle(2, COLORS.primary, 0.8);
    border.strokeRoundedRect(-100, -18, 200, 36, 18);
    
    // Фон
    const bg = this.add.rectangle(0, 0, 196, 32, 0x1a1a3a, 0.9);
    bg.setStrokeStyle(1, COLORS.primary, 0.5);
    
    // Текст
    const text = this.add.text(0, 0, '⏎ НАЗАД К МИРАМ', {
      fontSize: '14px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff',
      stroke: COLORS.primary,
      strokeThickness: 1
    }).setOrigin(0.5);
    
    btnContainer.add([bg, border, text]);
    
    // Интерактивная область
    const hitArea = this.add.rectangle(0, 0, 200, 36, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    
    hitArea.on('pointerover', () => {
      bg.setFillStyle(0x2a2a5a, 0.9);
      border.clear();
      border.lineStyle(2, '#ffffff', 1);
      border.strokeRoundedRect(-100, -18, 200, 36, 18);
      text.setScale(1.05);
      audioManager.playSound(this, 'tap_sound', 0.1);
    });
    
    hitArea.on('pointerout', () => {
      bg.setFillStyle(0x1a1a3a, 0.9);
      border.clear();
      border.lineStyle(2, COLORS.primary, 0.8);
      border.strokeRoundedRect(-100, -18, 200, 36, 18);
      text.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
      audioManager.playSound(this, 'tap_sound', 0.3);
      this.scene.start('worldSelect');
    });
    
    btnContainer.add(hitArea);
  }

  // =========================================================================
  // АНИМАЦИИ
  // =========================================================================

  startAnimations() {
    // Анимация звёзд
    this.time.addEvent({
      delay: 50,
      callback: () => {
        const time = Date.now() / 1000;
        this.stars.forEach(star => {
          star.sprite.alpha = star.baseAlpha + Math.sin(time * 5 * star.speed) * 0.3;
          star.sprite.rotation += star.rotationSpeed;
        });
      },
      loop: true
    });
    
    // Сканирующая линия
    const scanLine = this.add.graphics();
    let scanY = 0;
    this.tweens.add({
      targets: { y: 0 },
      y: this.scale.height,
      duration: 4000,
      repeat: -1,
      onUpdate: (tween) => {
        scanY = tween.getValue();
        scanLine.clear();
        scanLine.lineStyle(1, 0x00ffff, 0.1);
        scanLine.lineBetween(0, scanY, this.scale.width, scanY);
      }
    });
  }

  // =========================================================================
  // ДЕЙСТВИЯ
  // =========================================================================

  selectLevel(level) {
    audioManager.playSound(this, 'tap_sound', 0.3);
    gameManager.setCurrentLevel(level);
    this.scene.start('play');
  }

  confirmPurchase(level, price) {
    const w = this.scale.width;
    const h = this.scale.height;
    const worldColor = this.getWorldColorString(this.world);

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85)
      .setDepth(100)
      .setScrollFactor(0)
      .setInteractive();
    
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.98);
    panel.fillRoundedRect(w / 2 - 160, h / 2 - 110, 320, 220, 20);
    panel.lineStyle(3, worldColor, 1);
    panel.strokeRoundedRect(w / 2 - 160, h / 2 - 110, 320, 220, 20);
    panel.setDepth(101);
    
    const icon = this.add.text(w / 2, h / 2 - 70, '🔓', {
      fontSize: '48px'
    }).setOrigin(0.5).setDepth(102);
    
    this.add.text(w / 2, h / 2 - 20, 'Открыть уровень?', {
      fontSize: '20px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(102);
    
    this.add.text(w / 2, h / 2 + 5, `Стоимость: ${price} 💎`, {
      fontSize: '16px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5).setDepth(102);
    
    const yesBtn = this.createNeonDialogButton(w / 2 - 80, h / 2 + 60, 'КУПИТЬ', '#00ff00');
    const noBtn = this.createNeonDialogButton(w / 2 + 80, h / 2 + 60, 'ОТМЕНА', '#ff4444');
    
    yesBtn.setDepth(103);
    noBtn.setDepth(103);
    
    yesBtn.on('pointerdown', () => {
      if (gameManager.purchaseLevel(this.world, level)) {
        audioManager.playSound(this, 'purchase_sound', 0.5);
        this.showNotification('Уровень открыт!', '#00ff00');
        this.scene.restart();
      }
      this.closeModal(overlay, panel, icon, yesBtn, noBtn);
    });
    
    noBtn.on('pointerdown', () => {
      audioManager.playSound(this, 'tap_sound', 0.2);
      this.closeModal(overlay, panel, icon, yesBtn, noBtn);
    });
  }

  createNeonDialogButton(x, y, text, color) {
    const container = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 110, 40, 0x1a1a3a, 0.9);
    bg.setStrokeStyle(2, color, 0.8);
    
    const btnText = this.add.text(0, 0, text, {
      fontSize: '14px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff'
    }).setOrigin(0.5);
    
    container.add([bg, btnText]);
    
    const hitArea = this.add.rectangle(0, 0, 110, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      bg.setFillStyle(color, 0.8);
      bg.setStrokeStyle(2, '#ffffff', 1);
      btnText.setScale(1.05);
    });
    
    hitArea.on('pointerout', () => {
      bg.setFillStyle(0x1a1a3a, 0.9);
      bg.setStrokeStyle(2, color, 0.8);
      btnText.setScale(1);
    });
    
    container.add(hitArea);
    return container;
  }

  closeModal(...elements) {
    elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
  }

  showNoFunds() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const notification = this.add.text(w / 2, h / 2, '❌ НЕДОСТАТОЧНО КРИСТАЛЛОВ!', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ff4444',
      backgroundColor: '#1a1a1a',
      padding: { x: 20, y: 12 },
      stroke: '#ff0000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(100);
    
    this.tweens.add({
      targets: notification,
      alpha: 0,
      scale: 1.2,
      duration: 1500,
      delay: 1000,
      onComplete: () => notification.destroy()
    });
    
    audioManager.playSound(this, 'error_sound', 0.3);
  }

  showNotification(text, color) {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const notification = this.add.text(w / 2, h / 2, text, {
      fontSize: '20px',
      fontFamily: "'Audiowide', sans-serif",
      color: color,
      backgroundColor: '#0a1a0a',
      padding: { x: 25, y: 12 },
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(100);
    
    this.tweens.add({
      targets: notification,
      alpha: 0,
      scale: 1.2,
      duration: 1500,
      delay: 1000,
      onComplete: () => notification.destroy()
    });
  }

  // =========================================================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // =========================================================================

  getStarColors(world) {
    const colorSets = {
      0: [0x4444ff, 0x8844ff, 0xff44ff],
      1: [0xff44aa, 0xff88ff, 0xaa88ff],
      2: [0xff6600, 0xffaa00, 0xcc5500],
      3: [0x44aaff, 0x88ccff, 0xaaddff],
      4: [0xaa88ff, 0xcc88ff, 0xff88ff]
    };
    return colorSets[world] || colorSets[0];
  }

  getWorldColor(world) {
    const colors = [0x00ffff, 0xff00ff, 0xff6600, 0xffaa00, 0xaa88ff];
    return colors[world] || 0x00ffff;
  }

  getWorldColorString(world) {
    const colors = ['#00ffff', '#ff00ff', '#ff6600', '#ffaa00', '#aa88ff'];
    return colors[world] || '#00ffff';
  }

  onResize() {
    this.scene.restart();
  }

  shutdown() {
    if (this.scrollTween) {
      this.scrollTween.stop();
      this.scrollTween = null;
    }
    this.tweens.killAll();
    this.stars = [];
    this.particles = [];
    this.neonLines = [];
    this.levelCards = [];
  }
}