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
    this.scrollTween = null;
    this.isDragging = false;
    this.dragStartY = 0;
    this.dragStartContainerY = 0;
    this.scrollVelocity = 0;
    this.lastY = 0;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.world = gameManager.getCurrentWorld();
    this.worldConfig = WORLD_CONFIG[this.world] || WORLD_CONFIG[0];
    this.levelConfigBase = LEVEL_CONFIG[this.world] || LEVEL_CONFIG[0];

    // Создаём эпический фон в стиле мира
    this.createWorldBackground();

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

    // Контейнер для уровней (без маски!)
    this.createLevelList();

    // Кнопка назад
    this.createBackButton();

    // Обработка скролла
    this.setupScrolling();

    // Обработка ресайза
    this.scale.on('resize', this.onResize, this);
  }

  // =========================================================================
  // СОЗДАНИЕ ФОНА
  // =========================================================================

  createWorldBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Градиентный фон в цветах мира
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    const startColor = this.worldConfig.gradientStart || 0x030712;
    const endColor = this.worldConfig.gradientEnd || 0x0a0a1a;
    
    gradient.fillGradientStyle(startColor, startColor, endColor, endColor, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('level_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'level_bg').setOrigin(0).setDepth(-10);

    // Неоновые линии в стиле мира
    const glowColor = this.worldConfig.primaryColor || COLORS.primary;
    const glowLines = this.add.graphics();
    glowLines.lineStyle(2, glowColor, 0.2);
    glowLines.strokeRect(10, 10, w - 20, h - 20);
    glowLines.setDepth(-5);
    
    this.tweens.add({
      targets: glowLines,
      alpha: { from: 0.1, to: 0.3 },
      duration: 2000,
      yoyo: true,
      repeat: -1
    });

    // Декоративные элементы мира
    this.addWorldDecorations();
  }

  addWorldDecorations() {
    const w = this.scale.width;
    const h = this.scale.height;

    switch(this.world) {
      case 1: // Киберпанк
        for (let i = 0; i < 8; i++) {
          const sign = this.add.text(
            Phaser.Math.Between(20, w - 20),
            Phaser.Math.Between(30, h - 30),
            ['NEON', 'CYBER', 'DATA', 'CODE'][Math.floor(Math.random() * 4)],
            { fontSize: '10px', fontFamily: 'monospace', color: '#ff44ff' }
          );
          sign.setAlpha(0.15);
          sign.setBlendMode(Phaser.BlendModes.ADD);
          sign.setDepth(-3);
          this.tweens.add({
            targets: sign,
            alpha: { from: 0.1, to: 0.3 },
            duration: 2000,
            yoyo: true,
            repeat: -1
          });
        }
        break;
        
      case 2: // Подземелье
        for (let i = 0; i < 10; i++) {
          const shadow = this.add.circle(
            Phaser.Math.Between(0, w),
            Phaser.Math.Between(0, h),
            Phaser.Math.Between(30, 80),
            0x000000,
            0.08
          );
          shadow.setBlendMode(Phaser.BlendModes.MULTIPLY);
          shadow.setDepth(-4);
        }
        break;
        
      case 3: // Астероиды
        for (let i = 0; i < 15; i++) {
          const asteroid = this.add.image(
            Phaser.Math.Between(0, w),
            Phaser.Math.Between(0, h),
            'bg_asteroid_small'
          );
          asteroid.setScale(Phaser.Math.FloatBetween(0.2, 0.6));
          asteroid.setAlpha(0.1);
          asteroid.setBlendMode(Phaser.BlendModes.ADD);
          asteroid.setDepth(-4);
          this.tweens.add({
            targets: asteroid,
            angle: 360,
            duration: Phaser.Math.Between(8000, 20000),
            repeat: -1
          });
        }
        break;
        
      case 4: // Чёрная дыра
        const centerX = w / 2;
        const centerY = h / 2;
        for (let i = 0; i < 5; i++) {
          const ring = this.add.ellipse(centerX, centerY, 80 + i * 30, 50 + i * 20, 0x000000, 0);
          ring.setStrokeStyle(1, 0xaa88ff, 0.15 - i * 0.02);
          ring.setDepth(-4);
          this.tweens.add({
            targets: ring,
            angle: 360,
            duration: 10000 + i * 1500,
            repeat: -1
          });
        }
        break;
    }
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;
    const starColors = this.getStarColors(this.world);
    const starCount = this.world === 0 ? 150 : 80;

    for (let i = 0; i < starCount; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      const scale = Phaser.Math.FloatBetween(0.2, 1.2);
      star.setScale(scale);
      star.setTint(starColors[Math.floor(Math.random() * starColors.length)]);
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
      star.setDepth(-8);
      star.setBlendMode(Phaser.BlendModes.ADD);
      
      this.stars.push({
        sprite: star,
        speed: Phaser.Math.FloatBetween(0.01, 0.05),
        baseAlpha: Phaser.Math.FloatBetween(0.2, 0.7),
        rotationSpeed: Phaser.Math.FloatBetween(-0.02, 0.02)
      });
    }
    
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
  }

  createParticles() {
    const w = this.scale.width;
    const h = this.scale.height;
    const particleColors = this.getParticleColors();
    
    for (let i = 0; i < 30; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.Between(1, 3),
        particleColors[Math.floor(Math.random() * particleColors.length)],
        Phaser.Math.FloatBetween(0.1, 0.3)
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      particle.setDepth(-6);
      
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-100, 100),
        y: particle.y + Phaser.Math.Between(-50, 50),
        alpha: 0,
        duration: Phaser.Math.Between(5000, 10000),
        yoyo: true,
        repeat: -1,
        delay: i * 200
      });
      
      this.particles.push(particle);
    }
  }

  getParticleColors() {
    const colors = {
      0: [0x88aaff, 0xaaccff, 0xffffff],
      1: [0xff44ff, 0xff88ff, 0xaa88ff],
      2: [0xff8866, 0xffaa66, 0xcc8866],
      3: [0xffaa66, 0xffcc88, 0xeeaa77],
      4: [0xaa88ff, 0xcc88ff, 0xee88ff]
    };
    return colors[this.world] || colors[0];
  }

  // =========================================================================
  // ЗАГОЛОВОК И СТАТИСТИКА
  // =========================================================================

  createHeader() {
    const w = this.scale.width;
    const worldColor = this.getWorldColorString(this.world);
    
    // Иконка мира
    const icon = this.add.text(w / 2 - 130, 45, this.getWorldIcon(), {
      fontSize: '48px'
    }).setOrigin(0.5).setDepth(5);
    
    // Название мира
    const title = this.add.text(w / 2 + 20, 45, this.worldConfig.name, {
      fontSize: '32px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ffffff',
      stroke: worldColor,
      strokeThickness: 3,
      shadow: { blur: 15, color: worldColor, fill: true }
    }).setOrigin(0, 0.5).setDepth(5);
    
    // Анимация заголовка
    this.tweens.add({
      targets: title,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Описание мира
    const description = this.add.text(w / 2, 85, this.worldConfig.description, {
      fontSize: '11px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_secondary,
      wordWrap: { width: w - 60 },
      align: 'center'
    }).setOrigin(0.5).setDepth(5);
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
    
    const balanceContainer = this.add.container(w - 20, 85);
    balanceContainer.setDepth(10);
    
    const bg = this.add.rectangle(0, 0, 110, 32, 0x1a1a3a, 0.8)
      .setStrokeStyle(1, COLORS.accent, 0.5);
    
    const icon = this.add.text(-40, 0, '💎', {
      fontSize: '18px'
    }).setOrigin(0.5);
    
    this.balanceText = this.add.text(10, 0, `${gameManager.data.crystals}`, {
      fontSize: '16px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0, 0.5);
    
    balanceContainer.add([bg, icon, this.balanceText]);
  }

  createWorldStats() {
    const w = this.scale.width;
    const starsTotal = gameManager.getStarsForWorld(this.world);
    const progress = gameManager.getWorldProgress(this.world) + 1;
    const worldBonus = this.worldConfig.specialMechanic || 'Нет';
    
    const statsContainer = this.add.container(w / 2, 125);
    statsContainer.setDepth(5);
    
    const bg = this.add.rectangle(0, 0, 280, 42, 0x0a0a1a, 0.8)
      .setStrokeStyle(1, this.getWorldColor(this.world), 0.5);
    
    const starsText = this.add.text(-120, 0, `⭐ ${starsTotal}/30`, {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffaa00'
    }).setOrigin(0, 0.5);
    
    const progressText = this.add.text(-30, 0, `📊 ${progress}/10`, {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary
    }).setOrigin(0, 0.5);
    
    const bonusText = this.add.text(70, 0, `✨ ${worldBonus}`, {
      fontSize: '10px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.text_secondary
    }).setOrigin(0, 0.5);
    
    statsContainer.add([bg, starsText, progressText, bonusText]);
  }

  // =========================================================================
  // СПИСОК УРОВНЕЙ (БЕЗ МАСКИ!)
  // =========================================================================

  createLevelList() {
    const w = this.scale.width;
    const startY = 170;
    
    // Создаём контейнер для уровней без маски
    this.levelContainer = this.add.container(0, startY);
    this.levelContainer.setDepth(10);
    
    // Создаём карточки
    this.createLevelCards();
    
    // Создаём clipping область через настройки контейнера
    // (вместо маски используем ограничение по Y при скролле)
    this.scrollBounds = {
      minY: startY - this.totalHeight + (this.scale.height - 210),
      maxY: startY
    };
  }

  createLevelCards() {
    const w = this.scale.width;
    const spacing = 82;
    let currentY = 10;
    
    for (let level = 0; level < 10; level++) {
      const unlocked = gameManager.isLevelUnlocked(this.world, level) || level === 0;
      const stars = gameManager.getLevelStars(this.world, level);
      const price = gameManager.getLevelPrice(this.world, level);
      const canBuy = gameManager.data.crystals >= price;
      const isBoss = level === 9;
      
      const card = this.createLevelCard(level, unlocked, stars, price, canBuy, isBoss, currentY);
      this.levelContainer.add(card);
      this.levelCards.push(card);
      currentY += spacing;
    }
    
    this.totalHeight = currentY + 20;
  }

  createLevelCard(level, unlocked, stars, price, canBuy, isBoss, y) {
    const w = this.scale.width;
    const worldColor = this.getWorldColor(this.world);
    
    let borderColor = COLORS.text_muted;
    if (unlocked) borderColor = worldColor;
    else if (canBuy) borderColor = COLORS.accent;
    
    const card = this.add.container(w / 2, y);
    card.setDepth(10);
    
    // Фон карточки
    const bg = this.add.rectangle(0, 0, w - 40, 72, 0x1a1a3a, 0.95)
      .setStrokeStyle(isBoss ? 3 : 2, borderColor, unlocked ? 0.8 : 0.4);
    bg.setDepth(10);
    
    // Эффект свечения для разблокированных
    if (unlocked) {
      this.tweens.add({
        targets: bg,
        alpha: { from: 0.85, to: 0.95 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    }
    
    // Иконка уровня
    const levelIcon = isBoss ? '👾' : '🎮';
    const icon = this.add.text(-(w - 40) / 2 + 28, 0, levelIcon, {
      fontSize: '28px'
    }).setOrigin(0.5).setDepth(11);
    
    // Номер уровня
    const levelNum = this.add.text(-(w - 40) / 2 + 58, -15, `${level + 1}`, {
      fontSize: '22px',
      fontFamily: "'Orbitron', sans-serif",
      color: unlocked ? '#ffffff' : COLORS.text_muted
    }).setOrigin(0, 0.5).setDepth(11);
    
    // Название уровня
    const levelName = this.add.text(-(w - 40) / 2 + 58, 10, isBoss ? 'БОСС УРОВЕНЬ' : `УРОВЕНЬ ${level + 1}`, {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: unlocked ? COLORS.text_primary : COLORS.text_muted
    }).setOrigin(0, 0.5).setDepth(11);
    
    // Цель уровня
    const goalScore = (this.levelConfigBase.goalScore || 500) * (level + 1);
    const goalText = this.add.text(-(w - 40) / 2 + 58, 25, `🎯 ${goalScore}`, {
      fontSize: '9px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_secondary
    }).setOrigin(0, 0.5).setDepth(11);
    
    // Звёзды
    const starsContainer = this.add.container((w - 40) / 2 - 110, -8);
    starsContainer.setDepth(11);
    for (let i = 0; i < 3; i++) {
      const star = this.add.text(i * 18, 0, i < stars ? '★' : '☆', {
        fontSize: '18px',
        color: i < stars ? '#ffaa00' : '#444444'
      }).setOrigin(0.5);
      starsContainer.add(star);
    }
    
    // Прогресс-бар
    if (unlocked && stars > 0) {
      const progressBar = this.createProgressBar((w - 40) / 2 - 110, 10, stars, 3);
      progressBar.setDepth(11);
      card.add(progressBar);
    }
    
    // Статус
    let statusText, statusColor, statusBg;
    if (!unlocked && price > 0) {
      statusText = `${price} 💎`;
      statusColor = canBuy ? '#ffaa00' : '#ff4444';
      statusBg = canBuy ? 0x3a2a1a : 0x3a1a1a;
    } else if (unlocked) {
      statusText = 'ДОСТУПЕН';
      statusColor = '#00ff00';
      statusBg = 0x1a3a1a;
    } else {
      statusText = 'ЗАБЛОКИРОВАН';
      statusColor = '#666666';
      statusBg = 0x2a2a2a;
    }
    
    const statusBgRect = this.add.rectangle((w - 40) / 2 - 40, 15, 70, 24, statusBg, 0.9)
      .setStrokeStyle(1, statusColor, 0.5)
      .setDepth(11);
    
    const status = this.add.text((w - 40) / 2 - 40, 15, statusText, {
      fontSize: '10px',
      fontFamily: "'Orbitron', sans-serif",
      color: statusColor
    }).setOrigin(0.5).setDepth(12);
    
    // Интерактивная область (ВАЖНО: высокий depth и добавляется последней)
    const hitArea = this.add.rectangle(0, 0, w - 40, 72, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    
    hitArea.on('pointerover', () => {
      bg.setFillStyle(0x2a2a4a, 0.95);
      icon.setScale(1.1);
      audioManager.playSound(this, 'tap_sound', 0.1);
    });
    
    hitArea.on('pointerout', () => {
      bg.setFillStyle(0x1a1a3a, 0.95);
      icon.setScale(1);
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
    
    card.add([bg, icon, levelNum, levelName, goalText, starsContainer, statusBgRect, status, hitArea]);
    
    return card;
  }

  createProgressBar(x, y, current, max) {
    const container = this.add.container(x, y);
    const width = 60;
    const height = 4;
    
    const bg = this.add.rectangle(0, 0, width, height, 0x333333);
    const fill = this.add.rectangle(-width/2, 0, width * (current / max), height, COLORS.accent)
      .setOrigin(0, 0.5);
    
    container.add([bg, fill]);
    return container;
  }

  // =========================================================================
  // ПРОКРУТКА (БЕЗ МАСКИ)
  // =========================================================================

  setupScrolling() {
    const w = this.scale.width;
    const startY = 170;
    const scrollHeight = this.scale.height - 210;
    
    // Создаём зону для скролла
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
      
      // Эластичный эффект
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
      
      // Инерция
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
        // Плавное возвращение в границы
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
    
    // Индикатор прокрутки
    if (this.totalHeight > scrollHeight) {
      this.createScrollIndicator(startY, scrollHeight);
    }
  }

  createScrollIndicator(startY, scrollHeight) {
    const w = this.scale.width;
    const indicatorHeight = Math.max(30, (scrollHeight / this.totalHeight) * scrollHeight);
    
    const track = this.add.graphics();
    track.fillStyle(0x333333, 0.5);
    track.fillRoundedRect(w - 15, startY + 10, 4, scrollHeight - 20, 2);
    track.setDepth(15);
    
    const indicator = this.add.graphics();
    indicator.fillStyle(COLORS.primary, 0.8);
    indicator.fillRoundedRect(w - 15, startY + 10, 4, indicatorHeight, 2);
    indicator.setDepth(16);
    
    this.events.on('update', () => {
      const minY = startY - this.totalHeight + scrollHeight;
      const maxY = startY;
      const scrollPercent = (this.levelContainer.y - minY) / (maxY - minY);
      const indicatorY = startY + 10 + (scrollHeight - 20 - indicatorHeight) * (1 - scrollPercent);
      indicator.y = indicatorY;
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
    
    const yesBtn = this.createDialogButton(w / 2 - 80, h / 2 + 60, 'КУПИТЬ', '#00ff00');
    const noBtn = this.createDialogButton(w / 2 + 80, h / 2 + 60, 'ОТМЕНА', '#ff4444');
    
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

  closeModal(...elements) {
    elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
  }

  createDialogButton(x, y, text, color) {
    const btn = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff',
      backgroundColor: '#1a1a3a',
      padding: { x: 20, y: 8 },
      stroke: color,
      strokeThickness: 2
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5);
    
    btn.on('pointerover', () => {
      btn.setStyle({ backgroundColor: color, stroke: '#ffffff' });
      btn.setScale(1.05);
    });
    
    btn.on('pointerout', () => {
      btn.setStyle({ backgroundColor: '#1a1a3a', stroke: color });
      btn.setScale(1);
    });
    
    return btn;
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

  createBackButton() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const backBtn = this.add.text(w / 2, h - 30, '⏎ НАЗАД К МИРАМ', {
      fontSize: '18px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff',
      stroke: COLORS.primary,
      strokeThickness: 2,
      backgroundColor: '#1a1a3a',
      padding: { x: 25, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(15);
    
    backBtn.on('pointerover', () => {
      backBtn.setStyle({ backgroundColor: '#2a2a5a', stroke: '#ffffff' });
      backBtn.setScale(1.05);
      audioManager.playSound(this, 'tap_sound', 0.1);
    });
    
    backBtn.on('pointerout', () => {
      backBtn.setStyle({ backgroundColor: '#1a1a3a', stroke: COLORS.primary });
      backBtn.setScale(1);
    });
    
    backBtn.on('pointerdown', () => {
      audioManager.playSound(this, 'tap_sound', 0.3);
      this.scene.start('worldSelect');
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
    this.levelCards = [];
  }
}