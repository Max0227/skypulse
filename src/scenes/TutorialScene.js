import Phaser from 'phaser';
import { COLORS, WORLD_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class TutorialScene extends Phaser.Scene {
  constructor() {
    super('tutorial');
    this.slideIndex = 0;
    this.stars = [];
    this.particles = [];
    this.animations = [];
    this.demoObjects = [];
    this.demoTimers = [];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('TutorialScene: create started');

    // ===== ЭПИЧЕСКИЙ КИБЕРПАНК-ФОН =====
    this.createCyberpunkBackground();

    // ===== ПАРЯЩИЕ НЕОНОВЫЕ ЧАСТИЦЫ =====
    this.createFloatingParticles();

    // ===== АНИМИРОВАННАЯ СЕТКА =====
    this.createAnimatedGrid();

    // ===== МЕРЦАЮЩИЕ ЗВЁЗДЫ =====
    this.createStars();

    // ===== СЛАЙДЫ =====
    this.slides = this.createSlides();

    // ===== КОНТЕЙНЕР ДЛЯ СЛАЙДА =====
    this.createSlideContainer();

    // ===== ДЕМОНСТРАЦИОННЫЙ КОНТЕЙНЕР =====
    this.createDemoContainer();

    // ===== ПРОГРЕСС И НАВИГАЦИЯ =====
    this.createNavigation();

    // ===== ЗАПУСК ПЕРВОГО СЛАЙДА =====
    this.updateSlide();

    // ===== ЗАПУСК АНИМАЦИЙ =====
    this.startAnimations();

    // ===== ОБРАБОТЧИК РЕСАЙЗА =====
    this.scale.on('resize', this.onResize, this);

    // ===== ОБРАБОТЧИК КЛАВИШ =====
    this.input.keyboard.on('keydown-SPACE', () => this.nextSlide());
    this.input.keyboard.on('keydown-LEFT', () => this.prevSlide());
    this.input.keyboard.on('keydown-RIGHT', () => this.nextSlide());

    console.log('TutorialScene: create completed');
  }

  // =========================================================================
  // СОЗДАНИЕ ФОНА
  // =========================================================================

  createCyberpunkBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Базовый черный фон
    this.add.rectangle(0, 0, w, h, 0x030712).setOrigin(0).setDepth(-20);

    // Многослойный градиент
    const gradientLayers = [0.1, 0.15, 0.2];
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
      gradient.generateTexture(`tutorial_gradient_${index}`, w, h);
      gradient.destroy();
      
      const gradientImage = this.add.image(0, 0, `tutorial_gradient_${index}`).setOrigin(0);
      gradientImage.setAlpha(0.8);
      gradientImage.setDepth(-19 + index);
      
      this.tweens.add({
        targets: gradientImage,
        y: index * 5,
        duration: 8000 + index * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Неоновые круги по углам
    const corners = [
      { x: 0, y: 0, color: 0x00ffff, size: 250 },
      { x: w, y: 0, color: 0xff00ff, size: 250 },
      { x: 0, y: h, color: 0xffff00, size: 250 },
      { x: w, y: h, color: 0x00ff00, size: 250 }
    ];

    corners.forEach(corner => {
      const blur = this.add.circle(corner.x, corner.y, corner.size, corner.color, 0.03);
      blur.setBlendMode(Phaser.BlendModes.ADD);
      blur.setOrigin(corner.x === 0 ? 0 : 1, corner.y === 0 ? 0 : 1);
      blur.setDepth(-18);
      
      this.tweens.add({
        targets: blur,
        alpha: { from: 0.01, to: 0.05 },
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

    this.grid = this.add.graphics();
    this.grid.setDepth(-15);
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
  }

  updateGrid() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    if (!this.grid) return;
    
    this.grid.clear();
    this.grid.lineStyle(1, 0x00ffff, 0.08);
    
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
      const size = Phaser.Math.Between(2, 5);
      const color = Phaser.Utils.Array.GetRandom([0x00ffff, 0xff00ff, 0xffff00]);
      
      const particle = this.add.circle(x, y, size, color, 0.3);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      particle.setDepth(-12);
      
      this.particles.push(particle);
      
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-100, 100),
        y: y + Phaser.Math.Between(-50, 50),
        alpha: 0,
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

    for (let i = 0; i < 150; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      
      const scale = Phaser.Math.FloatBetween(0.2, 1.5);
      star.setScale(scale);
      star.setTint(Phaser.Utils.Array.GetRandom([0x4444ff, 0xff44ff, 0x44ff44]));
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
      star.setDepth(-10);
      star.setBlendMode(Phaser.BlendModes.ADD);
      
      this.stars.push({
        sprite: star,
        speed: Phaser.Math.FloatBetween(0.01, 0.05),
        baseAlpha: Phaser.Math.FloatBetween(0.2, 0.7),
        rotationSpeed: Phaser.Math.FloatBetween(-0.02, 0.02)
      });
    }
  }

  // =========================================================================
  // СОЗДАНИЕ СЛАЙДОВ
  // =========================================================================

  createSlides() {
    return [
      {
        title: 'УПРАВЛЕНИЕ',
        text: 'Нажимай на экран, чтобы такси подпрыгивало',
        icon: '🖐️',
        detail: 'Чем дольше держишь — тем выше прыжок',
        color: 0x00ffff,
        demo: 'tap'
      },
      {
        title: 'МОНЕТЫ',
        text: 'Собирай монеты для увеличения счёта',
        icon: '🪙',
        detail: 'Жёлтые = 1 💎 | Красные = 2 💎 + 🚀 Ускорение',
        color: 0xffaa00,
        demo: 'coins'
      },
      {
        title: 'ЦВЕТНЫЕ МОНЕТЫ',
        text: 'Дают мощные бонусы',
        icon: '🔴🔵🟢🟣',
        detail: '🔴 Ускорение | 🔵 Щит | 🟢 Магнит | 🟣 Замедление',
        color: 0xff44ff,
        demo: 'bonusCoins'
      },
      {
        title: 'ВАГОНЫ',
        text: 'Удлиняют такси и увеличивают очки',
        icon: '🚃',
        detail: 'Каждые 15 монет добавляют вагон. У вагонов есть здоровье!',
        color: 0x88ccff,
        demo: 'wagons'
      },
      {
        title: 'АСТЕРОИДЫ',
        text: 'Опасные препятствия',
        icon: '☄️',
        detail: 'При столкновении теряешь здоровье и сбрасываешь комбо',
        color: 0xff6600,
        demo: 'asteroid'
      },
      {
        title: 'УСИЛИТЕЛИ',
        text: 'Синие кубы дают мощные эффекты',
        icon: '🔷',
        detail: 'Ускорение, щит, магнит, замедление времени',
        color: 0x3366ff,
        demo: 'powerup'
      },
      {
        title: 'ВОРОТА',
        text: 'Проходи через них для увеличения счёта',
        icon: '🚪',
        detail: 'Чем выше комбо — тем больше очков!',
        color: 0x44ff44,
        demo: 'gate'
      },
      {
        title: 'МИРЫ',
        text: '5 уникальных миров с разной сложностью',
        icon: '🌌🌆🏰☄️⚫',
        detail: 'Космос → Киберпанк → Подземелье → Астероиды → Чёрная дыра',
        color: 0x00ffff,
        demo: 'worlds'
      },
      {
        title: 'ГОТОВ?',
        text: 'Начни своё путешествие!',
        icon: '🚀',
        detail: 'Собирай монеты, открывай миры и становись легендой!',
        color: 0xff44ff,
        demo: 'ready'
      }
    ];
  }

  createSlideContainer() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    this.slideContainer = this.add.container(w / 2, h / 2 - 40);
    this.slideContainer.setDepth(20);
    
    // Фон слайда с неоновой рамкой
    const slideBg = this.add.graphics();
    slideBg.fillStyle(0x0a0a1a, 0.85);
    slideBg.fillRoundedRect(-150, -180, 300, 360, 20);
    slideBg.lineStyle(2, 0x00ffff, 0.5);
    slideBg.strokeRoundedRect(-150, -180, 300, 360, 20);
    this.slideContainer.add(slideBg);
    
    // Заголовок
    this.titleObj = this.add.text(0, -150, '', {
      fontSize: '26px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#00ffff',
      stroke: '#ff00ff',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.slideContainer.add(this.titleObj);
    
    // Иконка
    this.iconObj = this.add.text(0, -70, '', {
      fontSize: '70px'
    }).setOrigin(0.5);
    this.slideContainer.add(this.iconObj);
    
    // Текст
    this.textObj = this.add.text(0, 10, '', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 260 },
      lineSpacing: 10
    }).setOrigin(0.5);
    this.slideContainer.add(this.textObj);
    
    // Детали
    this.detailObj = this.add.text(0, 75, '', {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.text_secondary,
      align: 'center',
      wordWrap: { width: 260 }
    }).setOrigin(0.5);
    this.slideContainer.add(this.detailObj);
    
    // Индикатор цвета
    this.colorIndicator = this.add.rectangle(0, -170, 90, 4, 0x00ffff).setOrigin(0.5);
    this.slideContainer.add(this.colorIndicator);
  }

  createDemoContainer() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    this.demoContainer = this.add.container(w / 2 + 180, h / 2 - 40);
    this.demoContainer.setDepth(15);
    this.demoContainer.setVisible(false);
    
    // Фон для демо
    const demoBg = this.add.rectangle(0, 0, 180, 260, 0x1a1a3a, 0.85);
    demoBg.setStrokeStyle(2, 0x00ffff, 0.6);
    this.demoContainer.add(demoBg);
    
    // Текст "ДЕМОНСТРАЦИЯ"
    const demoLabel = this.add.text(0, -115, 'ДЕМОНСТРАЦИЯ', {
      fontSize: '11px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#88aaff',
      letterSpacing: 1
    }).setOrigin(0.5);
    this.demoContainer.add(demoLabel);
  }

  createNavigation() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Прогресс
    this.progressText = this.add.text(w / 2, h - 100, `1/${this.slides.length}`, {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.accent
    }).setOrigin(0.5).setDepth(20);
    
    // Кнопки навигации
    this.createNeonButton(w / 2 - 140, h - 55, '◀  НАЗАД', () => this.prevSlide());
    this.createNeonButton(w / 2 + 140, h - 55, 'ВПЕРЁД  ▶', () => this.nextSlide());
    
    // Кнопка пропуска
    this.skipBtn = this.add.text(w / 2, h - 22, 'ПРОПУСТИТЬ ТУТОРИАЛ', {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.text_muted,
      backgroundColor: '#1a1a3a',
      padding: { x: 20, y: 6 },
      stroke: COLORS.text_muted,
      strokeThickness: 1
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(20);
    
    this.skipBtn.on('pointerover', () => {
      this.skipBtn.setStyle({ color: '#ffffff', backgroundColor: COLORS.primary, stroke: '#ffffff' });
      this.skipBtn.setScale(1.05);
    });
    
    this.skipBtn.on('pointerout', () => {
      this.skipBtn.setStyle({ color: COLORS.text_muted, backgroundColor: '#1a1a3a', stroke: COLORS.text_muted });
      this.skipBtn.setScale(1);
    });
    
    this.skipBtn.on('pointerdown', () => {
      audioManager.playSound(this, 'tap_sound', 0.3);
      gameManager.setTutorialCompleted();
      this.scene.start('worldSelect');
    });
  }

  createNeonButton(x, y, text, callback) {
    const width = 120;
    const height = 42;
    
    const button = this.add.graphics();
    button.setDepth(20);
    
    const buttonState = { glowAlpha: 0.3 };
    
    const updateButton = () => {
      button.clear();
      button.fillStyle(0x1a1a3a, 0.9);
      button.fillRoundedRect(x - width/2, y - height/2, width, height, 12);
      button.lineStyle(2, 0x00ffff, buttonState.glowAlpha);
      button.strokeRoundedRect(x - width/2, y - height/2, width, height, 12);
    };
    
    updateButton();
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: '15px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(20);
    
    const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setDepth(20);
    
    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: buttonState,
        glowAlpha: 0.8,
        duration: 200,
        onUpdate: updateButton
      });
      buttonText.setScale(1.05);
      audioManager.playSound(this, 'tap_sound', 0.1);
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
      audioManager.playSound(this, 'tap_sound', 0.2);
      callback();
    });
    
    return { button, buttonText };
  }

  // =========================================================================
  // ДЕМОНСТРАЦИОННЫЕ ЭФФЕКТЫ (БЕЗ ТЕКСТУР)
  // =========================================================================

  clearDemo() {
    if (this.demoContainer) {
      // Очищаем все таймеры
      this.demoTimers.forEach(timer => {
        if (timer && timer.remove) timer.remove();
      });
      this.demoTimers = [];
      
      // Удаляем все объекты из контейнера, кроме фона и метки
      const children = this.demoContainer.getAll();
      children.forEach(child => {
        // Сохраняем только фон (первый) и метку (второй)
        if (child !== children[0] && child !== children[1]) {
          if (child.destroy) child.destroy();
        }
      });
    }
    this.demoObjects = [];
  }

  showDemo(type) {
    this.demoContainer.setVisible(true);
    this.clearDemo();
    
    switch(type) {
      case 'tap':
        this.showTapDemo();
        break;
      case 'coins':
        this.showCoinsDemo();
        break;
      case 'bonusCoins':
        this.showBonusCoinsDemo();
        break;
      case 'wagons':
        this.showWagonsDemo();
        break;
      case 'asteroid':
        this.showAsteroidDemo();
        break;
      case 'powerup':
        this.showPowerupDemo();
        break;
      case 'gate':
        this.showGateDemo();
        break;
      case 'worlds':
        this.showWorldsDemo();
        break;
      case 'ready':
        this.showReadyDemo();
        break;
    }
  }

  showTapDemo() {
    // Игрок
    const player = this.add.circle(0, 45, 14, 0xffaa00);
    player.setStrokeStyle(2, 0x00ffff);
    this.demoContainer.add(player);
    
    // Анимация прыжка
    let y = 45;
    let direction = -1;
    let jumpTimer = this.time.addEvent({
      delay: 700,
      callback: () => {
        y += direction * 10;
        if (y < 25 || y > 55) direction *= -1;
        player.y = y;
      },
      loop: true
    });
    this.demoTimers.push(jumpTimer);
    
    // Палец
    const finger = this.add.text(0, -30, '👆', { fontSize: '32px' }).setOrigin(0.5);
    this.demoContainer.add(finger);
    
    this.tweens.add({
      targets: finger,
      y: { from: -30, to: 15 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut'
    });
  }

  showCoinsDemo() {
    // Монета
    const coin = this.add.circle(0, 25, 12, 0xffaa00);
    coin.setStrokeStyle(2, 0xffdd44);
    this.demoContainer.add(coin);
    
    // Символ монеты
    const dollar = this.add.text(0, 25, '$', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#000000'
    }).setOrigin(0.5);
    this.demoContainer.add(dollar);
    
    // Значение
    const value = this.add.text(0, -15, '+1 💎', {
      fontSize: '14px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffaa00'
    }).setOrigin(0.5);
    this.demoContainer.add(value);
    value.setAlpha(0);
    
    // Анимация
    let timer = this.time.addEvent({
      delay: 1200,
      callback: () => {
        value.setAlpha(1);
        value.setY(-15);
        this.tweens.add({
          targets: value,
          y: -40,
          alpha: 0,
          duration: 500
        });
      },
      loop: true
    });
    this.demoTimers.push(timer);
  }

  showBonusCoinsDemo() {
    const colors = [0xff4444, 0x4444ff, 0x44ff44, 0xff44ff];
    const effects = ['🚀', '🛡️', '🧲', '⏳'];
    let index = 0;
    
    const coin = this.add.circle(0, 25, 12, colors[0]);
    coin.setStrokeStyle(2, 0xffffff);
    this.demoContainer.add(coin);
    
    const effectText = this.add.text(40, 15, effects[0], { fontSize: '24px' });
    this.demoContainer.add(effectText);
    
    let timer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        index = (index + 1) % colors.length;
        coin.setFillStyle(colors[index]);
        effectText.setText(effects[index]);
        
        effectText.setAlpha(1);
        effectText.setX(40);
        this.tweens.add({
          targets: effectText,
          x: 80,
          alpha: 0,
          duration: 500
        });
      },
      loop: true
    });
    this.demoTimers.push(timer);
  }

  showWagonsDemo() {
    // Головной вагон
    const head = this.add.rectangle(-45, 0, 22, 18, 0xffaa00);
    head.setStrokeStyle(1, 0x00ffff);
    this.demoContainer.add(head);
    
    // Вагоны
    const wagons = [];
    for (let i = 0; i < 3; i++) {
      const wagon = this.add.rectangle(-45 - (i + 1) * 28, 0, 22, 16, 0x88aaff);
      wagon.setStrokeStyle(1, 0x00ffff);
      this.demoContainer.add(wagon);
      wagons.push(wagon);
    }
    
    // Анимация движения
    let x = 0;
    let direction = 1;
    let moveTimer = this.time.addEvent({
      delay: 50,
      callback: () => {
        x += direction * 3;
        if (x > 60 || x < -60) direction *= -1;
        head.x = -45 + x * 0.5;
        wagons.forEach((w, i) => {
          w.x = -45 - (i + 1) * 28 + x * 0.5;
        });
      },
      loop: true
    });
    this.demoTimers.push(moveTimer);
  }

  showAsteroidDemo() {
    // Астероид
    const asteroid = this.add.circle(0, 0, 14, 0x886644);
    asteroid.setStrokeStyle(2, 0xaa8866);
    this.demoContainer.add(asteroid);
    
    // Неровности
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const bump = this.add.circle(
        Math.cos(angle) * 16,
        Math.sin(angle) * 16,
        3,
        0xaa8866
      );
      this.demoContainer.add(bump);
    }
    
    // Предупреждение
    const warning = this.add.text(0, -45, '💥 ОПАСНО!', {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ff4444'
    }).setOrigin(0.5);
    this.demoContainer.add(warning);
    
    // Анимация
    this.tweens.add({
      targets: asteroid,
      x: { from: -50, to: 50 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      onYoyo: () => {
        warning.setAlpha(1);
        this.tweens.add({
          targets: warning,
          alpha: 0,
          delay: 100,
          duration: 300
        });
      }
    });
  }

  showPowerupDemo() {
    // Усилитель
    const powerup = this.add.rectangle(0, 0, 20, 20, 0x3366ff);
    powerup.setStrokeStyle(2, 0x00ffff);
    this.demoContainer.add(powerup);
    
    // Внутренний квадрат
    const inner = this.add.rectangle(0, 0, 12, 12, 0x88aaff);
    this.demoContainer.add(inner);
    
    // Эффект
    const effect = this.add.text(0, -35, '✨ УСКОРЕНИЕ ✨', {
      fontSize: '11px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#00ffff'
    }).setOrigin(0.5);
    this.demoContainer.add(effect);
    
    // Пульсация
    this.tweens.add({
      targets: [powerup, inner],
      scale: { from: 1, to: 1.2 },
      duration: 400,
      yoyo: true,
      repeat: -1
    });
    
    this.tweens.add({
      targets: effect,
      alpha: { from: 1, to: 0 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
  }

  showGateDemo() {
    // Ворота
    const leftGate = this.add.rectangle(-10, 0, 8, 70, 0x44aaff, 0.7);
    leftGate.setStrokeStyle(1, 0x00ffff);
    this.demoContainer.add(leftGate);
    
    const rightGate = this.add.rectangle(10, 0, 8, 70, 0x44aaff, 0.7);
    rightGate.setStrokeStyle(1, 0x00ffff);
    this.demoContainer.add(rightGate);
    
    // Игрок
    const player = this.add.circle(-55, 0, 10, 0xffaa00);
    this.demoContainer.add(player);
    
    // Очки
    const score = this.add.text(35, -20, '+10', {
      fontSize: '16px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffff00'
    }).setOrigin(0.5);
    this.demoContainer.add(score);
    score.setAlpha(0);
    
    // Анимация
    this.tweens.add({
      targets: player,
      x: 55,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        if (player.x > -15 && player.x < 15) {
          score.setAlpha(1);
          score.setY(-20);
          this.tweens.add({
            targets: score,
            y: -45,
            alpha: 0,
            duration: 400
          });
        }
      }
    });
  }

  showWorldsDemo() {
    const worlds = ['🌌', '🌃', '🏰', '☄️', '⚫'];
    const names = ['КОСМОС', 'КИБЕРПАНК', 'ПОДЗЕМЕЛЬЕ', 'АСТЕРОИДЫ', 'ЧЁРНАЯ ДЫРА'];
    const colors = ['#00ffff', '#ff00ff', '#ff6600', '#ffaa00', '#aa88ff'];
    let index = 0;
    
    const worldIcon = this.add.text(0, -10, worlds[0], { fontSize: '48px' }).setOrigin(0.5);
    this.demoContainer.add(worldIcon);
    
    const worldName = this.add.text(0, 45, names[0], {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: colors[0]
    }).setOrigin(0.5);
    this.demoContainer.add(worldName);
    
    let timer = this.time.addEvent({
      delay: 1400,
      callback: () => {
        index = (index + 1) % worlds.length;
        worldIcon.setText(worlds[index]);
        worldName.setText(names[index]);
        worldName.setStyle({ color: colors[index] });
      },
      loop: true
    });
    this.demoTimers.push(timer);
  }

  showReadyDemo() {
    // Ракета
    const rocket = this.add.text(0, 10, '🚀', { fontSize: '56px' }).setOrigin(0.5);
    this.demoContainer.add(rocket);
    
    // Частицы
    for (let i = 0; i < 6; i++) {
      const particle = this.add.circle(-35, 5 + i * 8, 3, 0xff6600, 0.8);
      this.demoContainer.add(particle);
      
      this.tweens.add({
        targets: particle,
        x: -60,
        alpha: 0,
        duration: 400,
        repeat: -1,
        delay: i * 120
      });
    }
    
    // Пульсация
    this.tweens.add({
      targets: rocket,
      y: -15,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // =========================================================================
  // УПРАВЛЕНИЕ СЛАЙДАМИ
  // =========================================================================

  updateSlide() {
    const slide = this.slides[this.slideIndex];
    
    // Анимация исчезновения
    this.tweens.add({
      targets: this.slideContainer,
      alpha: 0,
      scale: 0.95,
      duration: 200,
      onComplete: () => {
        // Обновляем содержимое
        this.titleObj.setText(slide.title);
        this.iconObj.setText(slide.icon);
        this.textObj.setText(slide.text);
        this.detailObj.setText(slide.detail);
        this.colorIndicator.setFillStyle(slide.color);
        this.progressText.setText(`${this.slideIndex + 1}/${this.slides.length}`);
        
        // Показываем демо
        if (slide.demo) {
          this.showDemo(slide.demo);
        } else {
          this.demoContainer.setVisible(false);
        }
        
        // Анимация появления
        this.tweens.add({
          targets: this.slideContainer,
          alpha: 1,
          scale: 1,
          duration: 300,
          ease: 'Back.out'
        });
      }
    });
  }

  prevSlide() {
    if (this.slideIndex > 0) {
      this.slideIndex--;
      this.updateSlide();
      audioManager.playSound(this, 'tap_sound', 0.2);
    }
  }

  nextSlide() {
    if (this.slideIndex === this.slides.length - 1) {
      audioManager.playSound(this, 'level_up_sound', 0.4);
      gameManager.setTutorialCompleted();
      this.scene.start('worldSelect');
    } else {
      this.slideIndex++;
      this.updateSlide();
      audioManager.playSound(this, 'tap_sound', 0.2);
    }
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
          if (star.sprite && star.sprite.active) {
            star.sprite.alpha = star.baseAlpha + Math.sin(time * 5 * star.speed) * 0.3;
            star.sprite.rotation += star.rotationSpeed;
          }
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
      duration: 4000,
      repeat: -1,
      onUpdate: (tween) => {
        y = tween.getValue();
        scanLine.clear();
        scanLine.lineStyle(2, 0x00ffff, 0.1);
        scanLine.lineBetween(0, y, this.scale.width, y);
      }
    });
  }

  // =========================================================================
  // ОБРАБОТЧИКИ
  // =========================================================================

  onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.tweens.killAll();
    this.demoTimers.forEach(timer => {
      if (timer && timer.remove) timer.remove();
    });
    this.demoTimers = [];
    this.stars = [];
    this.particles = [];
    this.demoObjects = [];
  }
}