import Phaser from 'phaser';
import { COLORS } from '../config';
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

    console.log('MenuScene: create completed');
  }

  // =========================================================================
  // СОЗДАНИЕ ЭЛЕМЕНТОВ ФОНА
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
      gradient.generateTexture(`menu_gradient_${index}`, w, h);
      gradient.destroy();
      
      const gradientImage = this.add.image(0, 0, `menu_gradient_${index}`).setOrigin(0);
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
      
      // Пульсация свечения
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

    // Основная сетка
    this.grid = this.add.graphics();
    
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

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const size = Phaser.Math.Between(2, 6);
      const color = Phaser.Utils.Array.GetRandom([0x00ffff, 0xff00ff, 0xffff00, 0x00ff00]);
      
      const particle = this.add.circle(x, y, size, color, 0.4);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.particles.push(particle);
      
      // Индивидуальная анимация
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
    }
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < 200; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      
      const scale = Phaser.Math.FloatBetween(0.2, 1.8);
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

    // Копия для дополнительного свечения
    this.titleGlow = this.add.text(w / 2, 70, 'SKYPULSE', {
      fontSize: '72px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#ff00ff',
      strokeThickness: 4,
      alpha: 0.5
    }).setOrigin(0.5);

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
      shadowBlur: 40,
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

    // Анимация появления/исчезновения
    this.tweens.add({
      targets: subtitle,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createStats() {
    const w = this.scale.width;
    const stats = gameManager.data.stats;

    // Контейнер для статистики
    const statsContainer = this.add.container(w / 2, 180);

    // Фон с неоновой рамкой
    const statsBg = this.add.rectangle(0, 0, 350, 50, 0x0a0a1a, 0.8)
      .setStrokeStyle(2, 0x00ffff, 0.5);
    
    // Текст статистики
    const statsText = this.add.text(0, 0, 
      `🏆 ${stats.maxScore}  •  ⭐ LVL ${stats.maxLevel}  •  🚃 ${stats.maxWagons}`,
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
      strokeWidth: 3,
      alpha: 1,
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
        
        this.tweens.add({
          targets: dot,
          alpha: 0.2,
          scale: 0.5,
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
      { text: '▶ PLAY', y: 260, size: 'large', callback: this.startGame.bind(this) },
      { text: '🌍 WORLDS', y: 330, size: 'normal', callback: () => this.scene.start('worldSelect') },
      { text: '🛒 SHOP', y: 390, size: 'normal', callback: () => this.scene.start('shop') },
      { text: '🎨 SKINS', y: 450, size: 'normal', callback: () => this.scene.start('skinShop') },
      { text: '🏆 ACHIEVEMENTS', y: 510, size: 'normal', callback: () => this.scene.start('achievements') },
      { text: '⚙ SETTINGS', y: 570, size: 'normal', callback: () => this.scene.start('settings') }
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
    
    // Сохраняем параметры для анимации
    const buttonState = {
      fillAlpha: 0.2,
      glowAlpha: 0.3,
      scale: 1
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

    // Интерактивная область
    const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    // Эффекты наведения
    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: buttonState,
        glowAlpha: 0.8,
        fillAlpha: 0.4,
        duration: 200,
        onUpdate: updateButton
      });
      
      this.tweens.add({
        targets: [buttonText],
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
        fillAlpha: 0.2,
        duration: 200,
        onUpdate: updateButton
      });
      
      this.tweens.add({
        targets: [buttonText],
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
          callback();
        }
      });
    });

    // Сохраняем для анимации
    this.neonLines.push({ button, buttonState, updateButton });
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

    // Версия с эффектом
    const versionText = this.add.text(w / 2, h - 25, 'v3.5.0 • CYBER EDITION', {
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Мерцание
    this.tweens.add({
      targets: versionText,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    // Декоративные элементы по краям
    [-1, 1].forEach(side => {
      const x = side === -1 ? 30 : w - 30;
      
      const light = this.add.circle(x, h - 35, 5, 0x00ffff, 0.5);
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
  // МЕТОДЫ ДЛЯ ОБРАБОТКИ ДЕЙСТВИЙ
  // =========================================================================

  startGame() {
    if (!gameManager.data.tutorialCompleted) {
      this.scene.start('tutorial');
    } else {
      this.scene.start('worldSelect');
    }
  }

  playHoverSound(index) {
    try {
      audioManager.playSound(this, 'tap_sound', 0.1 + index * 0.02);
    } catch (e) {}
  }

  playClickSound() {
    try {
      audioManager.playSound(this, 'tap_sound', 0.3);
      gameManager.vibrate('light');
    } catch (e) {}
  }

  startMusic() {
    try {
      audioManager.playMusic(this, 0.4);
      this.musicStarted = true;
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
      star.sprite.alpha = star.baseAlpha + Math.sin(time * 5 * star.speed) * 0.3;
      star.sprite.rotation += 0.001;
    });
  }

  pulseButtons() {
    this.neonLines.forEach((btn, index) => {
      this.tweens.add({
        targets: btn.buttonState,
        glowAlpha: 0.5,
        duration: 500 + index * 100,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onUpdate: btn.updateButton
      });
    });
  }

  createScanLine() {
    const w = this.scale.width;
    const h = this.scale.height;

    const scanLine = this.add.graphics();
    let y = 0;

    this.tweens.add({
      targets: { y: 0 },
      y: h,
      duration: 3000,
      repeat: -1,
      onUpdate: (tween) => {
        y = tween.getValue();
        scanLine.clear();
        scanLine.lineStyle(2, 0x00ffff, 0.2);
        scanLine.lineBetween(0, y, w, y);
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
    this.stars = [];
    this.neonLines = [];
    this.particles = [];
    
    if (this.titleTween) {
      this.titleTween.stop();
    }
    
    console.log('MenuScene: shutdown');
  }
}