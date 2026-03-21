import Phaser from 'phaser';
import { COLORS, WORLD_CONFIG, LEVEL_CONFIG, WORLD_EFFECTS } from '../config';
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
    this.worldSpecificEffects = [];
    this.backgroundElements = [];
    this.glitchElements = [];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.world = gameManager.getCurrentWorld();
    this.worldConfig = WORLD_CONFIG[this.world] || WORLD_CONFIG[0];
    this.levelConfigBase = LEVEL_CONFIG[this.world] || LEVEL_CONFIG[0];
    this.worldEffect = WORLD_EFFECTS[this.worldConfig.id] || WORLD_EFFECTS.space;

    // Создаём эпический фон в зависимости от мира
    this.createWorldBackground();

    // Создаём уникальные эффекты для каждого мира
    this.createWorldSpecificEffects();

    // Создаём неоновые линии
    this.createNeonLines();

    // Создаём звёзды с мерцанием
    this.createStars();

    // Анимированные частицы мира
    this.createWorldParticles();

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

    // Добавляем обработчик для клавиши ESC
    this.input.keyboard.on('keydown-ESC', () => {
      audioManager.playSound(this, 'tap_sound', 0.2);
      this.scene.start('worldSelect');
    });
  }

  // =========================================================================
  // ФОН В ЗАВИСИМОСТИ ОТ МИРА
  // =========================================================================

  createWorldBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Основной градиент в стиле мира
    const gradient = this.add.graphics();
    const startColor = this.worldConfig.gradientStart || 0x030712;
    const endColor = this.worldConfig.gradientEnd || 0x0a0a1a;
    
    gradient.fillGradientStyle(startColor, startColor, endColor, endColor, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.setDepth(-20);

    // Добавляем размытые неоновые круги по углам
    const cornerColor = this.getWorldColor();
    const corners = [
      { x: 0, y: 0, color: cornerColor, size: 250 },
      { x: w, y: 0, color: cornerColor, size: 250 },
      { x: 0, y: h, color: cornerColor, size: 250 },
      { x: w, y: h, color: cornerColor, size: 250 }
    ];

    corners.forEach(corner => {
      const blur = this.add.circle(corner.x, corner.y, corner.size, corner.color, 0.03);
      blur.setBlendMode(Phaser.BlendModes.ADD);
      blur.setOrigin(corner.x === 0 ? 0 : 1, corner.y === 0 ? 0 : 1);
      blur.setDepth(-19);
      
      this.tweens.add({
        targets: blur,
        alpha: { from: 0.01, to: 0.06 },
        scale: { from: 1, to: 1.2 },
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.backgroundElements.push(blur);
    });

    // Уникальные элементы фона для каждого мира
    switch(this.world) {
      case 0: // КОСМОС - звёздная туманность
        this.createSpaceBackground();
        break;
      case 1: // КИБЕРПАНК - неоновая сетка и глитчи
        this.createCyberpunkBackground();
        break;
      case 2: // ПОДЗЕМЕЛЬЕ - тёмные арки и туман
        this.createDungeonBackground();
        break;
      case 3: // АСТЕРОИДЫ - поле обломков
        this.createAsteroidBackground();
        break;
      case 4: // ЧЁРНАЯ ДЫРА - гравитационные линзы
        this.createBlackholeBackground();
        break;
    }
  }

  createSpaceBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Мерцающая туманность
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const radius = Phaser.Math.Between(80, 200);
      const nebula = this.add.graphics();
      nebula.fillStyle(0x442266, 0.02);
      nebula.fillCircle(x, y, radius);
      nebula.setDepth(-19);
      this.backgroundElements.push(nebula);
      
      this.tweens.add({
        targets: nebula,
        alpha: { from: 0.01, to: 0.04 },
        duration: Phaser.Math.Between(4000, 8000),
        yoyo: true,
        repeat: -1
      });
    }
    
    // Звёздные скопления
    for (let i = 0; i < 15; i++) {
      const cluster = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.Between(15, 40),
        0x88aaff,
        0.02
      );
      cluster.setBlendMode(Phaser.BlendModes.ADD);
      cluster.setDepth(-18);
      this.backgroundElements.push(cluster);
    }
  }

  createCyberpunkBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Анимированная неоновая сетка
    this.cyberGrid = this.add.graphics();
    this.cyberGridOffset = 0;
    this.cyberGridSpeed = 0.5;
    
    // Глитч-эффекты
    for (let i = 0; i < 8; i++) {
      const glitch = this.add.rectangle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.Between(30, 150),
        Phaser.Math.Between(2, 8),
        0xff00ff,
        0.1
      );
      glitch.setBlendMode(Phaser.BlendModes.ADD);
      glitch.setDepth(-17);
      this.glitchElements.push(glitch);
      
      this.tweens.add({
        targets: glitch,
        alpha: { from: 0, to: 0.2 },
        x: glitch.x + Phaser.Math.Between(-50, 50),
        duration: Phaser.Math.Between(500, 2000),
        yoyo: true,
        repeat: -1
      });
    }
    
    // Неоновые вывески
    const signs = ['NEON', 'CYBER', 'FUTURE', 'DATA', 'HACK', 'SYSTEM', '2077', 'GLITCH'];
    for (let i = 0; i < 12; i++) {
      const sign = this.add.text(
        Phaser.Math.Between(20, w - 20),
        Phaser.Math.Between(30, h - 30),
        signs[Math.floor(Math.random() * signs.length)],
        { 
          fontSize: `${Phaser.Math.Between(10, 18)}px`, 
          fontFamily: 'monospace', 
          color: Phaser.Utils.Array.GetRandom(['#ff44ff', '#00ffff', '#ffff44'])
        }
      );
      sign.setAlpha(0.1);
      sign.setBlendMode(Phaser.BlendModes.ADD);
      sign.setDepth(-16);
      this.backgroundElements.push(sign);
      
      this.tweens.add({
        targets: sign,
        alpha: { from: 0.05, to: 0.25 },
        scale: { from: 1, to: 1.1 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1
      });
    }
    
    // Анимация сетки
    this.time.addEvent({
      delay: 50,
      callback: () => {
        if (!this.cyberGrid) return;
        this.cyberGrid.clear();
        this.cyberGrid.lineStyle(1, 0xff00ff, 0.12);
        this.cyberGridOffset += this.cyberGridSpeed;
        
        for (let i = 0; i < w; i += 40) {
          this.cyberGrid.moveTo(i + this.cyberGridOffset, 0);
          this.cyberGrid.lineTo(i + this.cyberGridOffset, h);
        }
        for (let i = 0; i < h; i += 40) {
          this.cyberGrid.moveTo(0, i + this.cyberGridOffset * 0.5);
          this.cyberGrid.lineTo(w, i + this.cyberGridOffset * 0.5);
        }
        this.cyberGrid.strokePath();
      },
      loop: true
    });
    this.cyberGrid.setDepth(-18);
    this.backgroundElements.push(this.cyberGrid);
  }

  createDungeonBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Сталактиты и сталагмиты
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(0, w);
      const stalactite = this.add.triangle(
        x, 0,
        0, 0,
        12, Phaser.Math.Between(40, 80),
        24, 0,
        0x442211,
        0.12
      );
      stalactite.setOrigin(0.5, 0);
      stalactite.setDepth(-18);
      this.backgroundElements.push(stalactite);
      
      const stalagmite = this.add.triangle(
        x, h,
        0, 0,
        12, -Phaser.Math.Between(40, 80),
        24, 0,
        0x442211,
        0.12
      );
      stalagmite.setOrigin(0.5, 1);
      stalagmite.setDepth(-18);
      this.backgroundElements.push(stalagmite);
    }
    
    // Туманные слои
    for (let layer = 0; layer < 3; layer++) {
      const fog = this.add.rectangle(0, 0, w, h, 0x000000, 0.08 + layer * 0.03);
      fog.setOrigin(0);
      fog.setBlendMode(Phaser.BlendModes.MULTIPLY);
      fog.setDepth(-17 - layer);
      this.backgroundElements.push(fog);
      
      this.tweens.add({
        targets: fog,
        alpha: { from: 0.05, to: 0.12 },
        duration: 4000,
        yoyo: true,
        repeat: -1
      });
    }
  }

  createAsteroidBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Медленно движущиеся астероиды
    for (let i = 0; i < 25; i++) {
      const asteroid = this.add.image(
        Phaser.Math.Between(-200, w + 200),
        Phaser.Math.Between(0, h),
        i % 3 === 0 ? 'bg_asteroid_1' : 'bg_asteroid_2'
      );
      asteroid.setScale(Phaser.Math.FloatBetween(0.3, 1.2));
      asteroid.setAlpha(0.12);
      asteroid.setDepth(-18);
      asteroid.setBlendMode(Phaser.BlendModes.ADD);
      
      this.worldSpecificEffects.push({
        obj: asteroid,
        speed: Phaser.Math.FloatBetween(3, 12),
        x: asteroid.x,
        rotationSpeed: Phaser.Math.FloatBetween(-0.5, 0.5)
      });
      this.backgroundElements.push(asteroid);
    }
    
    // Пылевое облако
    const dust = this.add.particles(0, 0, 'flare', {
      x: { min: 0, max: w },
      y: { min: 0, max: h },
      speed: { min: 3, max: 10 },
      scale: { start: 0.06, end: 0 },
      alpha: { start: 0.12, end: 0 },
      lifespan: 5000,
      quantity: 1,
      frequency: 120,
      blendMode: Phaser.BlendModes.ADD,
      tint: 0xaa8866
    });
    dust.setDepth(-16);
    this.backgroundElements.push(dust);
  }

  createBlackholeBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    const centerX = w / 2;
    const centerY = h / 2;
    
    // Вращающиеся кольца
    for (let i = 0; i < 8; i++) {
      const radius = 60 + i * 30;
      const ring = this.add.ellipse(centerX, centerY, radius * 2, radius * 0.6, 0x000000, 0);
      ring.setStrokeStyle(2, 0xaa88ff, 0.15 - i * 0.01);
      ring.setDepth(-19);
      this.backgroundElements.push(ring);
      
      this.tweens.add({
        targets: ring,
        angle: 360,
        duration: 8000 + i * 600,
        repeat: -1,
        ease: 'Linear'
      });
    }
    
    // Гравитационные линзы
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Phaser.Math.Between(80, 200);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const lens = this.add.circle(x, y, Phaser.Math.Between(2, 5), 0xaa88ff, 0.08);
      lens.setBlendMode(Phaser.BlendModes.ADD);
      lens.setDepth(-17);
      this.backgroundElements.push(lens);
      
      this.tweens.add({
        targets: lens,
        x: centerX,
        y: centerY,
        alpha: 0,
        scale: 0.5,
        duration: Phaser.Math.Between(3000, 8000),
        repeat: -1,
        onComplete: () => {
          lens.x = x;
          lens.y = y;
          lens.alpha = 0.08;
          lens.scale = 1;
        }
      });
    }
  }

  createNeonLines() {
    const w = this.scale.width;
    const h = this.scale.height;
    const worldColor = this.getWorldColor();
    
    // Горизонтальные неоновые линии
    for (let i = 0; i < 6; i++) {
      const y = 60 + i * 140;
      const line = this.add.graphics();
      line.lineStyle(1, worldColor, 0.15);
      line.moveTo(0, y);
      line.lineTo(w, y);
      line.strokePath();
      line.setDepth(-15);
      this.neonLines.push(line);
      this.backgroundElements.push(line);
    }
    
    // Вертикальные неоновые линии
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 120;
      const line = this.add.graphics();
      line.lineStyle(1, worldColor, 0.15);
      line.moveTo(x, 0);
      line.lineTo(x, h);
      line.strokePath();
      line.setDepth(-15);
      this.neonLines.push(line);
      this.backgroundElements.push(line);
    }
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;
    const starColors = this.getStarColors();
    const starCount = this.world === 0 ? 200 : (this.world === 1 ? 80 : 120);

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
      star.setDepth(-14);
      star.setBlendMode(Phaser.BlendModes.ADD);
      
      this.stars.push({
        sprite: star,
        speed: Phaser.Math.FloatBetween(0.01, 0.08),
        baseAlpha: Phaser.Math.FloatBetween(0.1, 0.5),
        rotationSpeed: Phaser.Math.FloatBetween(-0.03, 0.03),
        flickerSpeed: Phaser.Math.FloatBetween(0.5, 2)
      });
    }
  }

  createWorldParticles() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    let particleConfig = {
      count: 40,
      colors: this.getParticleColors(),
      speed: { min: 50, max: 150 }
    };
    
    switch(this.world) {
      case 0: // Космос - звёздная пыль
        particleConfig.count = 60;
        break;
      case 1: // Киберпанк - неоновые искры
        particleConfig.count = 80;
        particleConfig.speed = { min: 80, max: 200 };
        break;
      case 2: // Подземелье - тёмные сгустки
        particleConfig.count = 30;
        particleConfig.speed = { min: 20, max: 80 };
        break;
      case 3: // Астероиды - каменная крошка
        particleConfig.count = 50;
        particleConfig.speed = { min: 40, max: 120 };
        break;
      case 4: // Чёрная дыра - гравитационные частицы
        particleConfig.count = 70;
        particleConfig.speed = { min: 100, max: 250 };
        break;
    }
    
    for (let i = 0; i < particleConfig.count; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.Between(1, 4),
        particleConfig.colors[Math.floor(Math.random() * particleConfig.colors.length)],
        Phaser.Math.FloatBetween(0.1, 0.4)
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      particle.setDepth(-12);
      
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-150, 150),
        y: particle.y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        duration: Phaser.Math.Between(particleConfig.speed.min, particleConfig.speed.max) * 20,
        yoyo: true,
        repeat: -1,
        delay: i * 100,
        ease: 'Sine.easeInOut'
      });
      
      this.particles.push(particle);
      this.backgroundElements.push(particle);
    }
  }

  getStarColors() {
    const colorSets = {
      0: [0x4444ff, 0x8844ff, 0xff44ff, 0x44aaff, 0x88aaff],
      1: [0xff44ff, 0xff88ff, 0xaa88ff, 0x00ffff, 0xffaaff],
      2: [0xff6600, 0xffaa44, 0xcc8844, 0xaa6644, 0x884422],
      3: [0xffaa66, 0xffcc88, 0xccaa88, 0xaa8866, 0x886644],
      4: [0xaa88ff, 0xcc88ff, 0xff88ff, 0x8866cc, 0x6644aa]
    };
    return colorSets[this.world] || colorSets[0];
  }

  getParticleColors() {
    const colors = {
      0: [0x44aaff, 0x88ccff, 0xaaddff, 0xffffff],
      1: [0xff44ff, 0xff88ff, 0xffaaff, 0x00ffff],
      2: [0xff8866, 0xffaa88, 0xffccaa, 0xaa8866],
      3: [0xffaa66, 0xffcc88, 0xffeebb, 0xccaa88],
      4: [0xaa88ff, 0xcc88ff, 0xeeaaff, 0xffffff]
    };
    return colors[this.world] || colors[0];
  }

  createWorldSpecificEffects() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    switch(this.world) {
      case 1: // Киберпанк - цифровой дождь
        for (let i = 0; i < 40; i++) {
          const digit = this.add.text(
            Phaser.Math.Between(0, w),
            Phaser.Math.Between(-100, h),
            Math.random() > 0.5 ? '0' : '1',
            { fontSize: `${Phaser.Math.Between(10, 20)}px`, fontFamily: 'monospace', color: '#ff44ff' }
          );
          digit.setAlpha(0.1);
          digit.setBlendMode(Phaser.BlendModes.ADD);
          digit.setDepth(-16);
          
          this.tweens.add({
            targets: digit,
            y: h + 100,
            duration: Phaser.Math.Between(3000, 8000),
            repeat: -1,
            onRepeat: () => {
              digit.y = -50;
              digit.setText(Math.random() > 0.5 ? '0' : '1');
              digit.x = Phaser.Math.Between(0, w);
            }
          });
          
          this.backgroundElements.push(digit);
        }
        break;
        
      case 2: // Подземелье - летучие тени
        for (let i = 0; i < 15; i++) {
          const shadow = this.add.circle(
            Phaser.Math.Between(0, w),
            Phaser.Math.Between(0, h),
            Phaser.Math.Between(15, 35),
            0x331100,
            0.1
          );
          shadow.setBlendMode(Phaser.BlendModes.MULTIPLY);
          shadow.setDepth(-16);
          
          this.tweens.add({
            targets: shadow,
            x: shadow.x + Phaser.Math.Between(-80, 80),
            y: shadow.y + Phaser.Math.Between(-50, 50),
            scale: { from: 1, to: 1.3 },
            duration: Phaser.Math.Between(5000, 10000),
            yoyo: true,
            repeat: -1
          });
          
          this.backgroundElements.push(shadow);
        }
        
        // Светлячки
        for (let i = 0; i < 20; i++) {
          const firefly = this.add.circle(
            Phaser.Math.Between(0, w),
            Phaser.Math.Between(0, h),
            Phaser.Math.Between(1, 2),
            0xff6600,
            0.2
          );
          firefly.setBlendMode(Phaser.BlendModes.ADD);
          firefly.setDepth(-15);
          
          this.tweens.add({
            targets: firefly,
            x: firefly.x + Phaser.Math.Between(-100, 100),
            y: firefly.y + Phaser.Math.Between(-60, 60),
            alpha: { from: 0.1, to: 0.4 },
            duration: Phaser.Math.Between(3000, 6000),
            yoyo: true,
            repeat: -1
          });
          
          this.backgroundElements.push(firefly);
        }
        break;
        
      case 3: // Астероиды - вращающиеся обломки
        for (let i = 0; i < 15; i++) {
          const debris = this.add.image(
            Phaser.Math.Between(-200, w + 200),
            Phaser.Math.Between(0, h),
            'bg_asteroid_small'
          );
          debris.setScale(Phaser.Math.FloatBetween(0.2, 0.6));
          debris.setAlpha(0.15);
          debris.setBlendMode(Phaser.BlendModes.ADD);
          debris.setDepth(-17);
          
          this.worldSpecificEffects.push({
            obj: debris,
            speed: Phaser.Math.FloatBetween(2, 8),
            rotationSpeed: Phaser.Math.FloatBetween(-1, 1),
            x: debris.x
          });
          this.backgroundElements.push(debris);
        }
        break;
        
      case 4: // Чёрная дыра - гравитационные волны
        const centerX = w / 2;
        const centerY = h / 2;
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const distance = 120;
          const wave = this.add.image(
            centerX + Math.cos(angle) * distance,
            centerY + Math.sin(angle) * distance,
            'gravity_wave'
          );
          wave.setScale(0.6);
          wave.setAlpha(0.08);
          wave.setDepth(-16);
          wave.setBlendMode(Phaser.BlendModes.ADD);
          
          this.tweens.add({
            targets: wave,
            scale: 1.2,
            alpha: 0,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            delay: i * 200
          });
          
          this.backgroundElements.push(wave);
        }
        break;
    }
  }

  // =========================================================================
  // ЗАГОЛОВОК С ЭФФЕКТАМИ МИРА
  // =========================================================================

  createHeader() {
    const w = this.scale.width;
    const worldColor = this.getWorldColorString();
    
    // Анимированная рамка
    const headerGlow = this.add.graphics();
    headerGlow.lineStyle(3, worldColor, 0.6);
    headerGlow.strokeRoundedRect(w / 2 - 150, 25, 300, 85, 25);
    headerGlow.setDepth(5);
    
    this.tweens.add({
      targets: headerGlow,
      alpha: { from: 0.4, to: 0.9 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // Иконка мира с пульсацией
    const icon = this.add.text(w / 2 - 120, 45, this.getWorldIcon(), {
      fontSize: '64px'
    }).setOrigin(0.5).setDepth(6);
    
    this.tweens.add({
      targets: icon,
      scale: { from: 1, to: 1.15 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Название мира с неоновым эффектом
    const title = this.add.text(w / 2 + 10, 45, this.worldConfig.name, {
      fontSize: '36px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ffffff',
      stroke: worldColor,
      strokeThickness: 5,
      shadow: { blur: 25, color: worldColor, fill: true }
    }).setOrigin(0, 0.5).setDepth(6);
    
    // Описание мира
    const description = this.add.text(w / 2, 100, this.worldConfig.description, {
      fontSize: '10px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.text_secondary,
      letterSpacing: 1,
      wordWrap: { width: w - 60 }
    }).setOrigin(0.5).setDepth(6);
    
    // Анимированная линия
    const line = this.add.graphics();
    line.lineStyle(2, worldColor, 0.7);
    line.moveTo(w / 2 - 90, 125);
    line.lineTo(w / 2 + 90, 125);
    line.strokePath();
    line.setDepth(6);
    
    this.tweens.add({
      targets: line,
      scaleX: { from: 0.8, to: 1.2 },
      alpha: { from: 0.5, to: 0.9 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
    this.backgroundElements.push(headerGlow, icon, title, description, line);
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

  // =========================================================================
  // БАЛАНС И СТАТИСТИКА
  // =========================================================================

  createBalanceDisplay() {
    const w = this.scale.width;
    
    const balanceContainer = this.add.container(w - 25, 95);
    balanceContainer.setDepth(10);
    
    const bg = this.add.rectangle(0, 0, 120, 38, 0x0a0a1a, 0.85);
    bg.setStrokeStyle(1, COLORS.accent, 0.6);
    bg.setDepth(9);
    
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
    
    this.backgroundElements.push(balanceContainer, glow);
  }

  createWorldStats() {
    const w = this.scale.width;
    const starsTotal = gameManager.getStarsForWorld(this.world);
    const progress = gameManager.getWorldProgress(this.world) + 1;
    const specialMechanic = this.worldEffect?.mechanic || 'Нет';
    const difficulty = this.worldConfig.speedMultiplier || 1;
    const difficultyLabel = difficulty > 1.2 ? 'СЛОЖНЫЙ' : (difficulty < 0.9 ? 'ЛЁГКИЙ' : 'НОРМАЛЬНЫЙ');
    const difficultyColor = difficulty > 1.2 ? '#ff4444' : (difficulty < 0.9 ? '#44ff44' : '#ffaa00');
    
    const statsContainer = this.add.container(w / 2, 150);
    statsContainer.setDepth(5);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 0.75);
    bg.fillRoundedRect(-165, -28, 330, 56, 22);
    bg.lineStyle(2, this.getWorldColor(), 0.5);
    bg.strokeRoundedRect(-165, -28, 330, 56, 22);
    statsContainer.add(bg);
    
    const stats = [
      { icon: '⭐', value: `${starsTotal}/30`, color: '#ffaa00', x: -140 },
      { icon: '📊', value: `${progress}/10`, color: COLORS.primary, x: -40 },
      { icon: '⚡', value: difficultyLabel, color: difficultyColor, x: 60, fontSize: 10 },
      { icon: '✨', value: specialMechanic.substring(0, 10), color: COLORS.text_secondary, x: 140, fontSize: 9 }
    ];
    
    stats.forEach(stat => {
      const iconText = this.add.text(stat.x, 0, stat.icon, {
        fontSize: '14px'
      }).setOrigin(0.5);
      
      const valueText = this.add.text(stat.x + 22, 0, stat.value, {
        fontSize: stat.fontSize || '11px',
        fontFamily: "'Orbitron', sans-serif",
        color: stat.color
      }).setOrigin(0, 0.5);
      
      statsContainer.add([iconText, valueText]);
    });
    
    this.backgroundElements.push(statsContainer);
  }

  // =========================================================================
  // СПИСОК УРОВНЕЙ
  // =========================================================================

  createLevelList() {
    const w = this.scale.width;
    const startY = 185;
    
    this.levelContainer = this.add.container(0, startY);
    this.levelContainer.setDepth(10);
    
    this.createLevelCards();
    
    this.scrollBounds = {
      minY: startY - this.totalHeight + (this.scale.height - 270),
      maxY: startY
    };
  }

  createLevelCards() {
    const spacing = 90;
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
    const worldColor = this.getWorldColor();
    const worldColorStr = this.getWorldColorString();
    
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
    
    // Неоновая рамка
    const border = this.add.graphics();
    border.lineStyle(2, borderColor, 0.8);
    border.strokeRoundedRect(-(w - 40) / 2, -38, w - 40, 76, 16);
    border.setDepth(10);
    
    // Внутреннее свечение
    const innerGlow = this.add.graphics();
    innerGlow.lineStyle(1, borderColor, 0.3);
    innerGlow.strokeRoundedRect(-(w - 40) / 2 + 2, -36, w - 44, 72, 14);
    innerGlow.setDepth(10);
    
    // Фон карточки
    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.85);
    bg.fillRoundedRect(-(w - 40) / 2, -38, w - 40, 76, 16);
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
    
    // Номер уровня
    const levelNum = this.add.text(-(w - 40) / 2 + 35, -10, `${level + 1}`, {
      fontSize: '34px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: unlocked ? '#ffffff' : '#888888',
      stroke: glowColor,
      strokeThickness: unlocked ? 2 : 1,
      shadow: unlocked ? { blur: 12, color: glowColor, fill: true } : null
    }).setOrigin(0.5).setDepth(11);
    
    // Иконка босса
    if (isBoss) {
      const bossIcon = this.add.text(-(w - 40) / 2 + 35, 18, '👾', {
        fontSize: '22px'
      }).setOrigin(0.5).setDepth(11);
      card.add(bossIcon);
    }
    
    // Название уровня
    const levelName = this.add.text(-(w - 40) / 2 + 80, -22, isBoss ? 'БОСС' : `УРОВЕНЬ ${level + 1}`, {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: unlocked ? COLORS.text_primary : COLORS.text_muted,
      fontWeight: isBoss ? 'bold' : 'normal'
    }).setOrigin(0, 0.5).setDepth(11);
    
    // Цель уровня
    const goalScore = (this.levelConfigBase.goalScore || 500) * (level + 1);
    const goalText = this.add.text(-(w - 40) / 2 + 80, -2, `🎯 ${goalScore}`, {
      fontSize: '10px',
      fontFamily: "'Share Tech Mono', monospace",
      color: unlocked ? COLORS.text_secondary : '#444444'
    }).setOrigin(0, 0.5).setDepth(11);
    
    // Звёзды
    const starsContainer = this.add.container((w - 40) / 2 - 130, -12);
    starsContainer.setDepth(11);
    for (let i = 0; i < 3; i++) {
      const star = this.add.text(i * 22, 0, i < stars ? '★' : '☆', {
        fontSize: '20px',
        color: i < stars ? '#ffaa00' : '#444444',
        shadow: i < stars ? { blur: 8, color: '#ffaa00', fill: true } : null
      }).setOrigin(0.5);
      starsContainer.add(star);
      
      if (i < stars && unlocked) {
        this.tweens.add({
          targets: star,
          scale: { from: 1, to: 1.2 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          delay: i * 200
        });
      }
    }
    
    // Статус
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
    const hitArea = this.add.rectangle(0, 0, w - 40, 76, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    
    hitArea.on('pointerover', () => {
      if (unlocked || canBuy) {
        border.clear();
        border.lineStyle(3, borderColor, 1);
        border.strokeRoundedRect(-(w - 40) / 2, -38, w - 40, 76, 16);
        
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
      border.strokeRoundedRect(-(w - 40) / 2, -38, w - 40, 76, 16);
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
    const startY = 185;
    const scrollHeight = this.scale.height - 285;
    
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
    
    this.backgroundElements.push(track, indicator, glow);
  }

  // =========================================================================
  // КНОПКА НАЗАД
  // =========================================================================

  createBackButton() {
    const w = this.scale.width;
    const h = this.scale.height;
    const worldColor = this.getWorldColorString();
    
    const btnContainer = this.add.container(w / 2, h - 40);
    btnContainer.setDepth(15);
    
    const border = this.add.graphics();
    border.lineStyle(2, worldColor, 0.8);
    border.strokeRoundedRect(-105, -20, 210, 40, 20);
    
    const bg = this.add.rectangle(0, 0, 206, 36, 0x1a1a3a, 0.9);
    bg.setStrokeStyle(1, worldColor, 0.5);
    
    const text = this.add.text(0, 0, '⏎ НАЗАД К МИРАМ', {
      fontSize: '14px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff',
      stroke: worldColor,
      strokeThickness: 1
    }).setOrigin(0.5);
    
    btnContainer.add([bg, border, text]);
    
    const hitArea = this.add.rectangle(0, 0, 210, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    
    hitArea.on('pointerover', () => {
      bg.setFillStyle(0x2a2a5a, 0.9);
      border.clear();
      border.lineStyle(2, '#ffffff', 1);
      border.strokeRoundedRect(-105, -20, 210, 40, 20);
      text.setScale(1.05);
      audioManager.playSound(this, 'tap_sound', 0.1);
    });
    
    hitArea.on('pointerout', () => {
      bg.setFillStyle(0x1a1a3a, 0.9);
      border.clear();
      border.lineStyle(2, worldColor, 0.8);
      border.strokeRoundedRect(-105, -20, 210, 40, 20);
      text.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
      audioManager.playSound(this, 'tap_sound', 0.3);
      this.scene.start('worldSelect');
    });
    
    btnContainer.add(hitArea);
    this.backgroundElements.push(btnContainer);
  }

  // =========================================================================
  // ДЕЙСТВИЯ С УРОВНЯМИ
  // =========================================================================

  selectLevel(level) {
    audioManager.playSound(this, 'tap_sound', 0.3);
    gameManager.setCurrentLevel(level);
    this.scene.start('play');
  }

  confirmPurchase(level, price) {
    const w = this.scale.width;
    const h = this.scale.height;
    const worldColor = this.getWorldColorString();

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
    
    try {
      audioManager.playSound(this, 'error_sound', 0.3);
    } catch (e) {}
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
    
    // Анимация движущихся объектов (астероиды и т.д.)
    this.time.addEvent({
      delay: 50,
      callback: () => {
        this.worldSpecificEffects.forEach(effect => {
          if (effect.obj && effect.speed) {
            effect.obj.x -= effect.speed * 0.05;
            if (effect.obj.x < -200) {
              effect.obj.x = this.scale.width + 200;
            }
            if (effect.rotationSpeed) {
              effect.obj.angle += effect.rotationSpeed;
            }
          }
        });
      },
      loop: true
    });
    
    // Сканирующая линия в стиле мира
    const scanLine = this.add.graphics();
    const lineColor = this.getWorldColor();
    let scanY = 0;
    
    this.tweens.add({
      targets: { y: 0 },
      y: this.scale.height,
      duration: 5000,
      repeat: -1,
      onUpdate: (tween) => {
        scanY = tween.getValue();
        scanLine.clear();
        scanLine.lineStyle(1, lineColor, 0.12);
        scanLine.lineBetween(0, scanY, this.scale.width, scanY);
      }
    });
    
    this.backgroundElements.push(scanLine);
  }

  // =========================================================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // =========================================================================

  getWorldColor() {
    const colors = [0x00ffff, 0xff00ff, 0xff6600, 0xffaa00, 0xaa88ff];
    return colors[this.world] || 0x00ffff;
  }

  getWorldColorString() {
    const colors = ['#00ffff', '#ff00ff', '#ff6600', '#ffaa00', '#aa88ff'];
    return colors[this.world] || '#00ffff';
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
    this.worldSpecificEffects = [];
    this.backgroundElements = [];
    this.glitchElements = [];
  }
}