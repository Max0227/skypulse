import Phaser from 'phaser';
import { COLORS, LEVEL_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super('worldSelect');
    this.stars = [];
    this.neonButtons = [];
    this.particles = [];
    this.gridOffset = 0;
    this.lastHoverTime = 0;
    this.worldCards = [];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('WorldSelectScene: create started');

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

    // ===== СПИСОК МИРОВ =====
    this.createWorldList();

    // ===== НИЖНЯЯ ПАНЕЛЬ =====
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

    console.log('WorldSelectScene: create completed');
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
      gradient.generateTexture(`world_gradient_${index}`, w, h);
      gradient.destroy();
      
      const gradientImage = this.add.image(0, 0, `world_gradient_${index}`).setOrigin(0);
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
  // СОЗДАНИЕ ЗАГОЛОВКА
  // =========================================================================

  createHeader() {
    const w = this.scale.width;

    // Основной заголовок
    this.title = this.add.text(w / 2, 50, 'ВЫБОР МИРА', {
      fontSize: '48px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 6,
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
    this.titleGlow = this.add.text(w / 2, 50, 'ВЫБОР МИРА', {
      fontSize: '48px',
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

  // =========================================================================
  // СОЗДАНИЕ СПИСКА МИРОВ
  // =========================================================================

  createWorldList() {
    const w = this.scale.width;
    const worlds = [0, 1, 2, 3, 4];
    let y = 130;
    const spacing = 120;

    // Цвета для миров
    const worldColors = {
      0: { color: 0x00ffff, text: '#00ffff', name: 'КОСМОС' },
      1: { color: 0xff00ff, text: '#ff00ff', name: 'КИБЕРПАНК' },
      2: { color: 0xff6600, text: '#ff6600', name: 'ПОДЗЕМЕЛЬЕ' },
      3: { color: 0xffaa00, text: '#ffaa00', name: 'АСТЕРОИДЫ' },
      4: { color: 0xaa00aa, text: '#aa00aa', name: 'ЧЁРНАЯ ДЫРА' }
    };

    worlds.forEach(worldIndex => {
      const world = LEVEL_CONFIG[worldIndex];
      const unlocked = gameManager.data.unlockedWorlds.includes(worldIndex);
      const stars = gameManager.getStarsForWorld(worldIndex);
      const progress = gameManager.getWorldProgress(worldIndex) + 1;
      const worldColor = worldColors[worldIndex] || { color: 0x00ffff, text: '#00ffff' };

      this.createWorldCard(w, y, worldIndex, world, unlocked, stars, progress, worldColor);
      y += spacing;
    });
  }

  createWorldCard(w, y, worldIndex, world, unlocked, stars, progress, worldColor) {
    const cardWidth = w - 80;
    const cardHeight = 100;

    // Контейнер для карточки
    const card = this.add.container(w / 2, y);

    // Фон карточки с неоновой рамкой
    const bg = this.add.graphics();
    
    const updateCard = (isHovered = false) => {
      bg.clear();
      bg.fillStyle(unlocked ? 0x1a1a3a : 0x0a0a1a, unlocked ? 0.9 : 0.5);
      bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 20);
      bg.lineStyle(3, worldColor.color, unlocked ? (isHovered ? 1 : 0.6) : 0.2);
      bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 20);
    };

    updateCard(false);

    // Внутреннее свечение для разблокированных
    if (unlocked) {
      const innerGlow = this.add.graphics();
      innerGlow.lineStyle(2, worldColor.color, 0.2);
      innerGlow.strokeRoundedRect(-cardWidth / 2 + 2, -cardHeight / 2 + 2, cardWidth - 4, cardHeight - 4, 18);
      card.add(innerGlow);
    }

    // Иконка мира
    const icon = this.add.text(-cardWidth / 2 + 30, 0, this.getWorldIcon(worldIndex), {
      fontSize: '32px'
    }).setOrigin(0.5);

    // Название мира
    const nameText = this.add.text(-cardWidth / 2 + 80, -20, world.name, {
      fontSize: '22px',
      fontFamily: '"Orbitron", sans-serif',
      color: unlocked ? '#ffffff' : '#666666',
      stroke: worldColor.text,
      strokeThickness: unlocked ? 2 : 0
    }).setOrigin(0, 0.5);

    // Описание
    const descText = this.add.text(-cardWidth / 2 + 80, 10, world.description, {
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      color: unlocked ? '#88aaff' : '#444444'
    }).setOrigin(0, 0.5);

    // Прогресс
    const progressText = this.add.text(-cardWidth / 2 + 80, 30, `УРОВНИ: ${progress}/10`, {
      fontSize: '10px',
      fontFamily: '"Share Tech Mono", monospace',
      color: unlocked ? '#ffaa00' : '#444444'
    }).setOrigin(0, 0.5);

    // Звёзды
    const starsText = this.add.text(cardWidth / 2 - 30, -15, `⭐ ${stars}/30`, {
      fontSize: '14px',
      fontFamily: '"Audiowide", sans-serif',
      color: unlocked ? '#ffff00' : '#444444'
    }).setOrigin(1, 0.5);

    // Прогресс-бар
    const progressBarY = 25;
    const progressBarWidth = 100;
    
    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x333333, 0.5);
    progressBg.fillRoundedRect(cardWidth / 2 - 130, -10, progressBarWidth, 6, 3);
    
    const progressFill = this.add.graphics();
    progressFill.fillStyle(worldColor.color, unlocked ? 0.8 : 0.2);
    progressFill.fillRoundedRect(cardWidth / 2 - 130, -10, progressBarWidth * (progress / 10), 6, 3);

    // Статус блокировки
    if (!unlocked) {
      const lockIcon = this.add.text(cardWidth / 2 - 30, 25, '🔒', {
        fontSize: '20px',
        color: '#666666'
      }).setOrigin(1, 0.5);
      card.add(lockIcon);
    }

    card.add([bg, icon, nameText, descText, progressText, starsText, progressBg, progressFill]);

    // Интерактивная область
    const hitArea = this.add.rectangle(w / 2, y, cardWidth, cardHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      if (unlocked) {
        updateCard(true);
        this.playHoverSound();
      }
    });

    hitArea.on('pointerout', () => {
      updateCard(false);
    });

    hitArea.on('pointerdown', () => {
      if (unlocked) {
        this.playClickSound();
        gameManager.setCurrentWorld(worldIndex);
        this.scene.start('levelSelect');
      } else {
        this.showLockedMessage(world.name);
      }
    });

    this.worldCards.push(card);
  }

  getWorldIcon(worldIndex) {
    const icons = ['🌌', '🌃', '🏰', '☄️', '🕳️'];
    return icons[worldIndex] || '🌍';
  }

  showLockedMessage(worldName) {
    const w = this.scale.width;
    const h = this.scale.height;

    const msg = this.add.text(w / 2, h / 2, `❌ МИР ЗАБЛОКИРОВАН ❌\n\n${worldName}`, {
      fontSize: '24px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: '#1a0a0a',
      padding: { x: 30, y: 20 },
      align: 'center'
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    msg.setScale(0.5);
    this.tweens.add({
      targets: msg,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: 2000,
      ease: 'Back.out',
      onComplete: () => msg.destroy()
    });

    this.playClickSound();
  }

  // =========================================================================
  // НИЖНЯЯ ПАНЕЛЬ
  // =========================================================================

  createFooter() {
    const w = this.scale.width;
    const h = this.scale.height;

    const footerLine = this.add.graphics();
    footerLine.lineStyle(2, 0x00ffff, 0.3);
    footerLine.lineBetween(50, h - 45, w - 50, h - 45);

    // Кнопка назад
    const backBtn = this.add.text(w / 2, h - 30, '⏎ НАЗАД В МЕНЮ', {
      fontSize: '22px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 3,
      padding: { x: 30, y: 8 },
      backgroundColor: '#1a1a3a'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => {
      backBtn.setStyle({ color: '#ffffff', backgroundColor: '#2a2a5a' });
      backBtn.setScale(1.05);
      this.playHoverSound();
    });

    backBtn.on('pointerout', () => {
      backBtn.setStyle({ color: '#00ffff', backgroundColor: '#1a1a3a' });
      backBtn.setScale(1);
    });

    backBtn.on('pointerdown', () => {
      this.playClickSound();
      this.cleanupBeforeExit();
      this.scene.start('menu');
    });

    // Статистика
    const unlockedCount = gameManager.data.unlockedWorlds.length;
    const starsText = this.add.text(30, h - 30, `⭐ ${gameManager.getTotalStars()}`, {
      fontSize: '16px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffff00'
    }).setOrigin(0, 0.5);

    const progressText = this.add.text(w - 30, h - 30, `📊 ${gameManager.getTotalProgress()}%`, {
      fontSize: '16px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#00ffff'
    }).setOrigin(1, 0.5);

    // Декоративные огни
    [-1, 1].forEach(side => {
      const x = side === -1 ? 30 : w - 30;
      
      const light = this.add.circle(x, h - 30, 5, 0x00ffff, 0.5);
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
    this.neonButtons = [];
    this.particles = [];
    this.worldCards = [];
    console.log('WorldSelectScene: shutdown');
  }
}