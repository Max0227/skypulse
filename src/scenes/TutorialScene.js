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
      fontSize: '24px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#00ffff',
      stroke: '#ff00ff',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.slideContainer.add(this.titleObj);
    
    // Иконка
    this.iconObj = this.add.text(0, -70, '', {
      fontSize: '64px'
    }).setOrigin(0.5);
    this.slideContainer.add(this.iconObj);
    
    // Текст
    this.textObj = this.add.text(0, 10, '', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 260 },
      lineSpacing: 8
    }).setOrigin(0.5);
    this.slideContainer.add(this.textObj);
    
    // Детали
    this.detailObj = this.add.text(0, 70, '', {
      fontSize: '11px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_secondary,
      align: 'center',
      wordWrap: { width: 260 }
    }).setOrigin(0.5);
    this.slideContainer.add(this.detailObj);
    
    // Индикатор цвета
    this.colorIndicator = this.add.rectangle(0, -170, 80, 4, 0x00ffff).setOrigin(0.5);
    this.slideContainer.add(this.colorIndicator);
  }

  createDemoContainer() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    this.demoContainer = this.add.container(w / 2 + 180, h / 2 - 40);
    this.demoContainer.setDepth(15);
    this.demoContainer.setVisible(false);
    
    // Фон для демо
    const demoBg = this.add.rectangle(0, 0, 180, 260, 0x1a1a3a, 0.8);
    demoBg.setStrokeStyle(2, 0x00ffff, 0.5);
    this.demoContainer.add(demoBg);
    
    // Текст "ДЕМОНСТРАЦИЯ"
    const demoLabel = this.add.text(0, -110, 'ДЕМОНСТРАЦИЯ', {
      fontSize: '10px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#88aaff'
    }).setOrigin(0.5);
    this.demoContainer.add(demoLabel);
  }

  createNavigation() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Прогресс
    this.progressText = this.add.text(w / 2, h - 100, `1/${this.slides.length}`, {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.accent
    }).setOrigin(0.5).setDepth(20);
    
    // Кнопки навигации
    this.createNeonButton(w / 2 - 130, h - 55, '◀  НАЗАД', () => this.prevSlide());
    this.createNeonButton(w / 2 + 130, h - 55, 'ВПЕРЁД  ▶', () => this.nextSlide());
    
    // Кнопка пропуска
    this.skipBtn = this.add.text(w / 2, h - 25, 'ПРОПУСТИТЬ ТУТОРИАЛ', {
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
    const width = 110;
    const height = 40;
    
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
      fontSize: '14px',
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
  // ДЕМОНСТРАЦИОННЫЕ ЭФФЕКТЫ (БЕЗ ОШИБОК)
  // =========================================================================

  clearDemo() {
    // Удаляем все объекты из демо-контейнера, кроме фона и метки
    if (this.demoContainer) {
      const children = this.demoContainer.getAll();
      children.forEach(child => {
        // Не удаляем фон и метку
        if (child !== this.demoContainer.list[0] && child !== this.demoContainer.list[1]) {
          child.destroy();
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
    const player = this.add.circle(0, 40, 12, 0xffaa00);
    player.setStrokeStyle(2, 0x00ffff);
    this.demoContainer.add(player);
    
    let y = 40;
    let direction = -1;
    
    this.time.addEvent({
      delay: 800,
      callback: () => {
        y += direction * 8;
        if (y < 20 || y > 60) direction *= -1;
        player.y = y;
      },
      loop: true
    });
    
    const finger = this.add.text(0, -20, '👆', { fontSize: '24px' }).setOrigin(0.5);
    this.demoContainer.add(finger);
    
    this.tweens.add({
      targets: finger,
      y: { from: -20, to: 20 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut'
    });
  }

  showCoinsDemo() {
    const coin = this.add.image(0, 20, 'coin_gold');
    coin.setScale(0.6);
    this.demoContainer.add(coin);
    
    const value = this.add.text(0, -20, '+1 💎', {
      fontSize: '14px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffaa00'
    }).setOrigin(0.5);
    this.demoContainer.add(value);
    
    this.tweens.add({
      targets: coin,
      y: { from: 20, to: -20 },
      alpha: { from: 1, to: 0 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      onYoyo: () => {
        value.setAlpha(1);
        value.setY(-20);
        this.tweens.add({
          targets: value,
          y: -40,
          alpha: 0,
          duration: 500
        });
      }
    });
  }

  showBonusCoinsDemo() {
    const colors = ['coin_red', 'coin_blue', 'coin_green', 'coin_purple'];
    let index = 0;
    
    const coin = this.add.image(0, 20, colors[0]);
    coin.setScale(0.6);
    this.demoContainer.add(coin);
    
    this.time.addEvent({
      delay: 800,
      callback: () => {
        index = (index + 1) % colors.length;
        coin.setTexture(colors[index]);
        
        const effects = ['🚀', '🛡️', '🧲', '⏳'];
        const effect = this.add.text(30, -10, effects[index], { fontSize: '20px' });
        this.demoContainer.add(effect);
        
        this.tweens.add({
          targets: effect,
          x: 80,
          alpha: 0,
          duration: 500,
          onComplete: () => effect.destroy()
        });
      },
      loop: true
    });
  }

  showWagonsDemo() {
    const player = this.add.circle(-40, 0, 10, 0xffaa00);
    this.demoContainer.add(player);
    
    const wagons = [];
    for (let i = 0; i < 3; i++) {
      const wagon = this.add.rectangle(-40 - (i + 1) * 25, 0, 20, 12, 0x88aaff);
      wagon.setStrokeStyle(1, 0x00ffff);
      this.demoContainer.add(wagon);
      wagons.push(wagon);
    }
    
    this.tweens.add({
      targets: [player, ...wagons],
      x: '+=80',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  showAsteroidDemo() {
    const asteroid = this.add.image(0, 0, 'bg_asteroid_1');
    asteroid.setScale(0.5);
    this.demoContainer.add(asteroid);
    
    const warning = this.add.text(0, -40, '💥 ОПАСНО!', {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ff4444'
    }).setOrigin(0.5);
    this.demoContainer.add(warning);
    
    this.tweens.add({
      targets: asteroid,
      x: { from: -60, to: 60 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      onStart: () => warning.setAlpha(1),
      onYoyo: () => {
        warning.setAlpha(1);
        this.tweens.add({
          targets: warning,
          alpha: 0,
          delay: 200,
          duration: 300
        });
      }
    });
  }

  showPowerupDemo() {
    const powerup = this.add.image(0, 0, 'powerup');
    powerup.setScale(0.7);
    powerup.setTint(0x00ffff);
    this.demoContainer.add(powerup);
    
    const effect = this.add.text(0, -30, '✨ УСКОРЕНИЕ ✨', {
      fontSize: '10px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#00ffff'
    }).setOrigin(0.5);
    this.demoContainer.add(effect);
    
    this.tweens.add({
      targets: powerup,
      scale: { from: 0.7, to: 1 },
      alpha: { from: 1, to: 0.5 },
      duration: 500,
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
    const gate = this.add.rectangle(0, 0, 20, 80, 0x44aaff, 0.6);
    gate.setStrokeStyle(2, 0x00ffff);
    this.demoContainer.add(gate);
    
    const player = this.add.circle(-50, 0, 8, 0xffaa00);
    this.demoContainer.add(player);
    
    const score = this.add.text(30, -20, '+10', {
      fontSize: '14px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffff00'
    }).setOrigin(0.5);
    this.demoContainer.add(score);
    score.setAlpha(0);
    
    this.tweens.add({
      targets: player,
      x: 50,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        if (player.x > -10 && player.x < 10) {
          score.setAlpha(1);
          score.setY(-20);
          this.tweens.add({
            targets: score,
            y: -40,
            alpha: 0,
            duration: 400
          });
        }
      }
    });
  }

  showWorldsDemo() {
    const worlds = ['🌌', '🌃', '🏰', '☄️', '⚫'];
    let index = 0;
    
    const worldIcon = this.add.text(0, 0, worlds[0], { fontSize: '40px' }).setOrigin(0.5);
    this.demoContainer.add(worldIcon);
    
    const worldName = this.add.text(0, 50, 'КОСМОС', {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#00ffff'
    }).setOrigin(0.5);
    this.demoContainer.add(worldName);
    
    this.time.addEvent({
      delay: 1500,
      callback: () => {
        index = (index + 1) % worlds.length;
        worldIcon.setText(worlds[index]);
        const names = ['КОСМОС', 'КИБЕРПАНК', 'ПОДЗЕМЕЛЬЕ', 'АСТЕРОИДЫ', 'ЧЁРНАЯ ДЫРА'];
        worldName.setText(names[index]);
        
        const colors = ['#00ffff', '#ff00ff', '#ff6600', '#ffaa00', '#aa88ff'];
        worldName.setStyle({ color: colors[index] });
      },
      loop: true
    });
  }

  showReadyDemo() {
    const rocket = this.add.text(0, 0, '🚀', { fontSize: '48px' }).setOrigin(0.5);
    this.demoContainer.add(rocket);
    
    const particles = [];
    for (let i = 0; i < 5; i++) {
      const particle = this.add.circle(-30, 10 + i * 10, 2, 0xff6600, 0.7);
      this.demoContainer.add(particle);
      particles.push(particle);
      
      this.tweens.add({
        targets: particle,
        x: -50,
        alpha: 0,
        duration: 300,
        repeat: -1,
        delay: i * 100
      });
    }
    
    this.tweens.add({
      targets: rocket,
      y: -20,
      duration: 500,
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
    this.stars = [];
    this.particles = [];
    this.demoObjects = [];
  }
}