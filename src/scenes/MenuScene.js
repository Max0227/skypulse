import Phaser from 'phaser';
import { COLORS, WORLD_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
    this.stars = [];
    this.neonLines = [];
    this.particles = [];
    this.titleTween = null;
    this.musicStarted = false;
    this.scanLine = null;
    this.animations = [];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('MenuScene: create started');

    // ===== ЭПИЧЕСКИЙ КИБЕРПАНК-ФОН =====
    this.createCyberpunkBackground();

    // ===== ПАРЯЩИЕ НЕОНОВЫЕ ЧАСТИЦЫ =====
    this.createFloatingParticles();

    // ===== АНИМИРОВАННАЯ СЕТКА =====
    this.createAnimatedGrid();

    // ===== МЕРЦАЮЩИЕ ЗВЁЗДЫ =====
    this.createStars();

    // ===== НЕОНОВЫЙ ЗАГОЛОВОК С АНИМАЦИЕЙ =====
    this.createTitle();

    // ===== ПОДЗАГОЛОВОК =====
    this.createSubtitle();

    // ===== СТАТИСТИКА С НЕОНОВЫМ СВЕЧЕНИЕМ =====
    this.createStats();

    // ===== КНОПКИ МЕНЮ В СТИЛЕ КИБЕРПАНК =====
    this.createMenuButtons();

    // ===== ВЕРСИЯ И НИЖНЯЯ ПАНЕЛЬ =====
    this.createFooter();

    // ===== МУЗЫКА =====
    this.startMusic();

    // ===== ЗАПУСК АНИМАЦИЙ =====
    this.startAnimations();

    // ===== ОБРАБОТЧИК РЕСАЙЗА =====
    this.scale.on('resize', this.onResize, this);

    // ===== ОБРАБОТЧИК ВЫХОДА =====
    this.events.on('shutdown', this.shutdown, this);

    console.log('MenuScene: create completed');
  }

  // =========================================================================
  // СОЗДАНИЕ ЭЛЕМЕНТОВ ФОНА
  // =========================================================================

  createCyberpunkBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Базовый черный фон
    const bg = this.add.rectangle(0, 0, w, h, 0x030712);
    bg.setOrigin(0);
    bg.setDepth(-20);

    // Многослойный градиент для глубины
    const gradientLayers = [0.1, 0.15, 0.2, 0.25];
    gradientLayers.forEach((alpha, index) => {
      const gradient = this.make.graphics({ x: 0, y: 0, add: false });
      const startColor = 0x030712 + index * 0x010101;
      const endColor = 0x0a0a1a + index * 0x020202;
      
      gradient.fillGradientStyle(startColor, startColor, endColor, endColor, alpha);
      gradient.fillRect(0, 0, w, h);
      gradient.generateTexture(`menu_gradient_${index}`, w, h);
      gradient.destroy();
      
      const gradientImage = this.add.image(0, 0, `menu_gradient_${index}`);
      gradientImage.setOrigin(0);
      gradientImage.setAlpha(0.8);
      gradientImage.setDepth(-19 + index);
      
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
      blur.setDepth(-18);
      
      // Пульсация свечения
      this.tweens.add({
        targets: blur,
        alpha: { from: 0.02, to: 0.08 },
        scale: { from: 1, to: 1.2 },
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

    // Основная сетка
    this.grid = this.add.graphics();
    this.grid.setDepth(-15);
    
    // Сохраняем параметры сетки для анимации
    this.gridOffset = 0;
    
    this.tweens.add({
      targets: this,
      gridOffset: 20,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      onUpdate: () => this.updateGrid()
    });
    
    this.updateGrid();

    // Добавляем движущиеся точки на пересечениях сетки
    for (let i = 0; i < w; i += 40) {
      for (let j = 0; j < h; j += 40) {
        if (Math.random() > 0.7) {
          const dot = this.add.circle(i, j, 2, 0x00ffff, 0.3);
          dot.setBlendMode(Phaser.BlendModes.ADD);
          dot.setDepth(-14);
          
          this.tweens.add({
            targets: dot,
            alpha: { from: 0.1, to: 0.5 },
            scale: { from: 1, to: 2 },
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
    
    if (!this.grid) return;
    
    this.grid.clear();
    this.grid.lineStyle(1, 0x00ffff, 0.1);
    
    // Вертикальные линии со смещением
    for (let i = 0; i < w; i += 40) {
      this.grid.moveTo(i + this.gridOffset, 0);
      this.grid.lineTo(i + this.gridOffset, h);
    }
    
    // Горизонтальные линии со смещением
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
      const colors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const particle = this.add.circle(x, y, size, color, 0.4);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      particle.setDepth(-12);
      
      this.particles.push(particle);
      
      // Индивидуальная анимация
      const targetX = x + Phaser.Math.Between(-150, 150);
      const targetY = y + Phaser.Math.Between(-80, 80);
      
      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0.1,
        scale: 0.3,
        duration: Phaser.Math.Between(5000, 10000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 100
      });
    }
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.stars = [];

    for (let i = 0; i < 200; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      
      const scale = Phaser.Math.FloatBetween(0.2, 1.8);
      star.setScale(scale);
      const tintColors = [0x4444ff, 0xff44ff, 0x44ff44, 0xffff44];
      star.setTint(tintColors[Math.floor(Math.random() * tintColors.length)]);
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.8));
      star.setDepth(-10);
      star.setBlendMode(Phaser.BlendModes.ADD);
      
      this.stars.push({
        sprite: star,
        speed: Phaser.Math.FloatBetween(0.01, 0.05),
        baseAlpha: Phaser.Math.FloatBetween(0.2, 0.8),
        baseScale: scale,
        rotationSpeed: Phaser.Math.FloatBetween(-0.02, 0.02)
      });
    }
  }

  // =========================================================================
  // СОЗДАНИЕ ТЕКСТОВЫХ ЭЛЕМЕНТОВ
  // =========================================================================

  createTitle() {
    const w = this.scale.width;

    // Основной заголовок с эффектом неона
    this.title = this.add.text(w / 2, 70, 'SKYPULSE', {
      fontSize: '72px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 8,
      shadow: { 
        offsetX: 0, 
        offsetY: 0, 
        color: '#00ffff', 
        blur: 30, 
        fill: true,
        stroke: true
      }
    }).setOrigin(0.5);
    this.title.setDepth(10);

    // Копия для дополнительного свечения
    this.titleGlow = this.add.text(w / 2, 70, 'SKYPULSE', {
      fontSize: '72px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#ff00ff',
      strokeThickness: 4,
      alpha: 0.5
    }).setOrigin(0.5);
    this.titleGlow.setDepth(9);

    // Анимация заголовка
    this.titleTween = this.tweens.add({
      targets: [this.title, this.titleGlow],
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Пульсация свечения
    this.tweens.add({
      targets: this.title,
      shadowBlur: { from: 30, to: 50 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createSubtitle() {
    const w = this.scale.width;

    const subtitle = this.add.text(w / 2, 140, '⚡ NEO TAXI ⚡', {
      fontSize: '20px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff',
      stroke: '#0000aa',
      strokeThickness: 2
    }).setOrigin(0.5);
    subtitle.setDepth(10);

    // Анимация появления/исчезновения
    this.tweens.add({
      targets: subtitle,
      alpha: { from: 0.5, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createStats() {
    const w = this.scale.width;
    const stats = gameManager?.data?.stats || { maxScore: 0, maxLevel: 0, maxWagons: 0 };

    // Контейнер для статистики
    const statsContainer = this.add.container(w / 2, 180);
    statsContainer.setDepth(10);

    // Фон с неоновой рамкой
    const statsBg = this.add.rectangle(0, 0, 350, 50, 0x0a0a1a, 0.8);
    statsBg.setStrokeStyle(2, 0x00ffff, 0.5);
    
    // Текст статистики
    const statsText = this.add.text(0, 0, 
      `🏆 ${stats.maxScore || 0}  •  ⭐ LVL ${stats.maxLevel || 0}  •  🚃 ${stats.maxWagons || 0}`,
      {
        fontSize: '16px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#ffffff',
        stroke: '#00aaaa',
        strokeThickness: 1
      }
    ).setOrigin(0.5);

    statsContainer.add([statsBg, statsText]);

    // Пульсация рамки
    this.tweens.add({
      targets: statsBg,
      strokeWidth: { from: 2, to: 4 },
      alpha: { from: 0.8, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Маленькие неоновые точки по углам
    const corners = [-175, 175];
    corners.forEach(x => {
      corners.forEach(y => {
        const dot = this.add.circle(w / 2 + x, 180 + y, 3, 0x00ffff, 0.8);
        dot.setBlendMode(Phaser.BlendModes.ADD);
        dot.setDepth(11);
        
        this.tweens.add({
          targets: dot,
          alpha: { from: 0.2, to: 0.8 },
          scale: { from: 0.5, to: 1.5 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
          delay: Math.random() * 500
        });
      });
    });
  }

  // =========================================================================
  // СОЗДАНИЕ КНОПОК
  // =========================================================================

  createMenuButtons() {
    const w = this.scale.width;
    
    const buttons = [
      { text: '▶ ИГРАТЬ', y: 260, size: 'large', callback: this.startGame.bind(this) },
      { text: '🌍 МИРЫ', y: 330, size: 'normal', callback: () => this.scene.start('worldSelect') },
      { text: '🛒 МАГАЗИН', y: 390, size: 'normal', callback: () => this.scene.start('shop') },
      { text: '🎨 СКИНЫ', y: 450, size: 'normal', callback: () => this.scene.start('skinShop') },
      { text: '🏆 ДОСТИЖЕНИЯ', y: 510, size: 'normal', callback: () => this.scene.start('achievements') },
      { text: '⚙ НАСТРОЙКИ', y: 570, size: 'normal', callback: () => this.scene.start('settings') }
    ];

    buttons.forEach((btn, index) => {
      this.createNeonButton(w / 2, btn.y, btn.text, btn.callback, btn.size, index);
    });
  }

  createNeonButton(x, y, text, callback, size = 'normal', index = 0) {
    const width = size === 'large' ? 260 : 220;
    const height = size === 'large' ? 60 : 50;
    const fontSize = size === 'large' ? '28px' : '22px';

    // Основная кнопка с градиентом
    const button = this.add.graphics();
    button.setDepth(15);
    
    // Сохраняем параметры для анимации
    const buttonState = {
      glowAlpha: 0.3
    };

    // Функция обновления кнопки
    const updateButton = () => {
      button.clear();
      
      // Внешнее свечение
      button.fillStyle(0x00ffff, buttonState.glowAlpha * 0.3);
      button.fillRoundedRect(x - width/2 - 2, y - height/2 - 2, width + 4, height + 4, 15);
      
      // Основной фон
      button.fillStyle(0x1a1a3a, 0.9);
      button.fillRoundedRect(x - width/2, y - height/2, width, height, 12);
      
      // Неоновая рамка
      button.lineStyle(3, 0x00ffff, buttonState.glowAlpha);
      button.strokeRoundedRect(x - width/2, y - height/2, width, height, 12);
      
      // Внутренняя подсветка
      button.lineStyle(2, 0xffffff, 0.2);
      button.strokeRoundedRect(x - width/2 + 2, y - height/2 + 2, width - 4, height - 4, 10);
    };

    updateButton();

    // Текст кнопки
    const buttonText = this.add.text(x, y, text, {
      fontSize,
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 2,
      shadow: { blur: 10, color: '#00ffff', fill: true }
    }).setOrigin(0.5);
    buttonText.setDepth(16);

    // Интерактивная область
    const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    hitArea.setDepth(15);

    // Эффекты наведения
    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: buttonState,
        glowAlpha: 0.8,
        duration: 200,
        onUpdate: updateButton
      });
      
      this.tweens.add({
        targets: buttonText,
        scale: 1.1,
        duration: 200
      });
      
      buttonText.setStyle({ stroke: '#ffffff' });
      this.playHoverSound(index);
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: buttonState,
        glowAlpha: 0.3,
        duration: 200,
        onUpdate: updateButton
      });
      
      this.tweens.add({
        targets: buttonText,
        scale: 1,
        duration: 200
      });
      
      buttonText.setStyle({ stroke: '#00ffff' });
    });

    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: [buttonText, hitArea],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.playClickSound();
          if (callback) callback();
        }
      });
    });

    // Сохраняем для анимации
    this.neonLines.push({ button, buttonState, updateButton, buttonText });
  }

  // =========================================================================
  // СОЗДАНИЕ ПОДВАЛА
  // =========================================================================

  createFooter() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Нижняя линия
    const footerLine = this.add.graphics();
    footerLine.lineStyle(2, 0x00ffff, 0.3);
    footerLine.lineBetween(50, h - 35, w - 50, h - 35);
    footerLine.setDepth(10);

    // Версия с эффектом
    const versionText = this.add.text(w / 2, h - 25, 'v3.5.0 • CYBER EDITION', {
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    versionText.setDepth(10);

    // Мерцание
    this.tweens.add({
      targets: versionText,
      alpha: { from: 0.5, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    // Декоративные элементы по краям
    [-1, 1].forEach(side => {
      const x = side === -1 ? 30 : w - 30;
      
      const light = this.add.circle(x, h - 35, 5, 0x00ffff, 0.5);
      light.setBlendMode(Phaser.BlendModes.ADD);
      light.setDepth(11);
      
      this.tweens.add({
        targets: light,
        alpha: { from: 0.2, to: 0.8 },
        scale: { from: 1, to: 1.5 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        delay: side === -1 ? 0 : 500
      });
    });
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ ОБРАБОТКИ ДЕЙСТВИЙ
  // =========================================================================

  startGame() {
    if (!gameManager?.data?.tutorialCompleted) {
      this.scene.start('tutorial');
    } else {
      this.scene.start('worldSelect');
    }
  }

  playHoverSound(index) {
    try {
      if (audioManager && audioManager.playSound) {
        audioManager.playSound(this, 'tap_sound', 0.1 + (index || 0) * 0.02);
      }
    } catch (e) {}
  }

  playClickSound() {
    try {
      if (audioManager && audioManager.playSound) {
        audioManager.playSound(this, 'tap_sound', 0.3);
      }
      if (gameManager && gameManager.vibrate) {
        gameManager.vibrate('light');
      }
    } catch (e) {}
  }

  startMusic() {
    try {
      if (audioManager && audioManager.playMusic) {
        audioManager.playMusic(this, 0.4);
        this.musicStarted = true;
      }
    } catch (e) {
      console.warn('Music failed to start');
    }
  }

  // =========================================================================
  // АНИМАЦИИ
  // =========================================================================

  startAnimations() {
    // Анимация мерцания звёзд
    this.time.addEvent({
      delay: 50,
      callback: this.updateStarsAnimation,
      callbackScope: this,
      loop: true
    });

    // Периодическое обновление свечения кнопок
    this.time.addEvent({
      delay: 2000,
      callback: this.pulseButtons,
      callbackScope: this,
      loop: true
    });

    // Анимация сканирующей линии
    this.createScanLine();
  }

  updateStarsAnimation() {
    const time = Date.now() / 1000;
    
    this.stars.forEach(star => {
      if (star.sprite && star.sprite.active) {
        star.sprite.alpha = star.baseAlpha + Math.sin(time * 5 * star.speed) * 0.3;
        star.sprite.rotation += star.rotationSpeed;
      }
    });
  }

  pulseButtons() {
    this.neonLines.forEach((btn, index) => {
      if (btn.buttonState) {
        this.tweens.add({
          targets: btn.buttonState,
          glowAlpha: 0.5,
          duration: 500 + index * 100,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onUpdate: btn.updateButton
        });
      }
    });
  }

  createScanLine() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.scanLine = this.add.graphics();
    this.scanLine.setDepth(20);
    let y = 0;

    this.tweens.add({
      targets: { y: 0 },
      y: h,
      duration: 3000,
      repeat: -1,
      onUpdate: (tween) => {
        if (this.scanLine) {
          y = tween.getValue();
          this.scanLine.clear();
          this.scanLine.lineStyle(2, 0x00ffff, 0.2);
          this.scanLine.lineBetween(0, y, w, y);
        }
      }
    });
  }

  // =========================================================================
  // ОБРАБОТЧИК РЕСАЙЗА
  // =========================================================================

  onResize() {
    // Пересоздаём сцену при изменении размера
    this.scene.restart();
  }

  // =========================================================================
  // ОЧИСТКА
  // =========================================================================

  shutdown() {
    // Останавливаем все твины
    this.tweens.killAll();
    
    // Очищаем массивы
    if (this.stars) {
      this.stars.forEach(star => {
        if (star.sprite && star.sprite.destroy) star.sprite.destroy();
      });
      this.stars = [];
    }
    
    if (this.neonLines) {
      this.neonLines.forEach(btn => {
        if (btn.button && btn.button.destroy) btn.button.destroy();
        if (btn.buttonText && btn.buttonText.destroy) btn.buttonText.destroy();
      });
      this.neonLines = [];
    }
    
    if (this.particles) {
      this.particles.forEach(particle => {
        if (particle && particle.destroy) particle.destroy();
      });
      this.particles = [];
    }
    
    if (this.scanLine && this.scanLine.destroy) {
      this.scanLine.destroy();
      this.scanLine = null;
    }
    
    if (this.titleTween) {
      this.titleTween.stop();
      this.titleTween = null;
    }
    
    console.log('MenuScene: shutdown');
  }
}