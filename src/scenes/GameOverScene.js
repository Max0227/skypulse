import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('gameover');
    this.stars = [];
    this.particles = [];
    this.gridOffset = 0;
    this.lastHoverTime = 0;
    this.neonButtons = [];
  }

  init(data) {
    this.resultData = data || {
      score: 0,
      level: 1,
      wagons: 0,
      crystals: 0,
      meters: 0,
      combo: 0,
      gates: 0,
      playTime: 0
    };
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('GameOverScene: create started');

    // ===== ЭПИЧЕСКИЙ КИБЕРПАНК-ФОН =====
    this.createCyberpunkBackground();

    // ===== ПАРЯЩИЕ НЕОНОВЫЕ ЧАСТИЦЫ =====
    this.createFloatingParticles();

    // ===== АНИМИРОВАННАЯ СЕТКА =====
    this.createAnimatedGrid();

    // ===== МЕРЦАЮЩИЕ ЗВЁЗДЫ =====
    this.createStars();

    // ===== КРАСНОЕ СВЕЧЕНИЕ =====
    this.createRedGlow();

    // ===== ЗАГОЛОВОК С ЭФФЕКТОМ =====
    this.createHeader();

    // ===== ПАНЕЛЬ СТАТИСТИКИ =====
    this.createStatsPanel();

    // ===== КНОПКИ ДЕЙСТВИЙ =====
    this.createActionButtons();

    // ===== НИЖНЯЯ ПАНЕЛЬ =====
    this.createFooter();

    // ===== ЗАПУСК АНИМАЦИЙ =====
    this.startAnimations();

    // ===== ЗВУК ПОРАЖЕНИЯ =====
    this.playGameOverSound();

    console.log('GameOverScene: create completed');
  }

  // =========================================================================
  // СОЗДАНИЕ ФОНА
  // =========================================================================

  createCyberpunkBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Базовый черный фон
    this.add.rectangle(0, 0, w, h, 0x030712).setOrigin(0);

    // Многослойный градиент с красным оттенком
    const gradientLayers = [0.1, 0.15, 0.2, 0.25];
    gradientLayers.forEach((alpha, index) => {
      const gradient = this.make.graphics({ x: 0, y: 0, add: false });
      gradient.fillGradientStyle(
        0x330000 + index * 0x010000,
        0x330000 + index * 0x010000,
        0x1a0000 + index * 0x010000,
        0x1a0000 + index * 0x010000,
        alpha
      );
      gradient.fillRect(0, 0, w, h);
      gradient.generateTexture(`gameover_gradient_${index}`, w, h);
      gradient.destroy();
      
      const gradientImage = this.add.image(0, 0, `gameover_gradient_${index}`).setOrigin(0);
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

    // Добавляем размытые красные круги по углам
    const corners = [
      { x: 0, y: 0, color: 0xff0000, size: 300 },
      { x: w, y: 0, color: 0xff4444, size: 300 },
      { x: 0, y: h, color: 0xaa0000, size: 300 },
      { x: w, y: h, color: 0xff2222, size: 300 }
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

  createRedGlow() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Красное свечение по краям
    const glow = this.add.graphics();
    glow.fillStyle(0xff0000, 0.05);
    glow.fillRect(0, 0, w, h);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(5);

    this.tweens.add({
      targets: glow,
      alpha: 0.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Пульсирующие красные линии
    const lines = this.add.graphics();
    lines.lineStyle(3, 0xff0000, 0.3);
    lines.strokeRect(20, 20, w - 40, h - 40);
    lines.setDepth(6);
    lines.setScrollFactor(0);

    this.tweens.add({
      targets: lines,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
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

    // Красные точки на пересечениях
    for (let i = 0; i < w; i += 40) {
      for (let j = 0; j < h; j += 40) {
        if (Math.random() > 0.7) {
          const dot = this.add.circle(i, j, 2, 0xff0000, 0.3);
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
    this.grid.lineStyle(1, 0xff0000, 0.15);
    
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
      const color = Phaser.Utils.Array.GetRandom([0xff0000, 0xff4444, 0xaa0000, 0xff8888]);
      
      const particle = this.add.circle(x, y, size, color, 0.3);
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
      star.setTint(Phaser.Utils.Array.GetRandom([0xff4444, 0xff8888, 0xff0000, 0xaa0000]));
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
      star.setDepth(-5);
      star.setBlendMode(Phaser.BlendModes.ADD);
      
      this.stars.push({
        sprite: star,
        speed: Phaser.Math.FloatBetween(0.01, 0.05),
        baseAlpha: Phaser.Math.FloatBetween(0.2, 0.6),
        baseScale: scale
      });
    }
  }

  // =========================================================================
  // СОЗДАНИЕ ЗАГОЛОВКА
  // =========================================================================

  createHeader() {
    const w = this.scale.width;

    // Основной заголовок с красным неоном
    this.title = this.add.text(w / 2, 70, 'ИГРА ОКОНЧЕНА', {
      fontSize: '48px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#ff0000',
      strokeThickness: 8,
      shadow: { 
        offsetX: 0, 
        offsetY: 0, 
        color: '#ff0000', 
        blur: 30, 
        fill: true,
        stroke: true
      }
    }).setOrigin(0.5);

    // Копия для дополнительного свечения
    this.titleGlow = this.add.text(w / 2, 70, 'ИГРА ОКОНЧЕНА', {
      fontSize: '48px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#ff8888',
      strokeThickness: 4,
      alpha: 0.5
    }).setOrigin(0.5);

    // Анимация пульсации
    this.tweens.add({
      targets: [this.title, this.titleGlow],
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // =========================================================================
  // СОЗДАНИЕ ПАНЕЛИ СТАТИСТИКИ
  // =========================================================================

  createStatsPanel() {
    const w = this.scale.width;
    const h = this.scale.height;
    const panelY = h * 0.4;
    const panelWidth = w - 80;
    const panelHeight = 260;

    // Фон панели с красной рамкой
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a0a1a, 0.9);
    panelBg.fillRoundedRect(w / 2 - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 20);
    panelBg.lineStyle(4, 0xff0000, 0.7);
    panelBg.strokeRoundedRect(w / 2 - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 20);

    // Внутреннее свечение
    const panelGlow = this.add.graphics();
    panelGlow.lineStyle(2, 0xff4444, 0.3);
    panelGlow.strokeRoundedRect(w / 2 - panelWidth / 2 + 2, panelY - panelHeight / 2 + 2, panelWidth - 4, panelHeight - 4, 18);

    // Красные огни по углам
    const corners = [
      { x: w / 2 - panelWidth / 2, y: panelY - panelHeight / 2 },
      { x: w / 2 + panelWidth / 2, y: panelY - panelHeight / 2 },
      { x: w / 2 - panelWidth / 2, y: panelY + panelHeight / 2 },
      { x: w / 2 + panelWidth / 2, y: panelY + panelHeight / 2 }
    ];

    corners.forEach(pos => {
      const light = this.add.circle(pos.x, pos.y, 5, 0xff0000, 0.5);
      light.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: light,
        alpha: 0.2,
        scale: 1.5,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    });

    // Статистика
    const stats = [
      { label: 'СЧЁТ', value: this.resultData.score, icon: '🏆', color: 0xffff00 },
      { label: 'УРОВЕНЬ', value: this.resultData.level, icon: '⭐', color: 0x00ffff },
      { label: 'ВАГОНОВ', value: this.resultData.wagons, icon: '🚃', color: 0x88ff88 },
      { label: 'КРИСТАЛЛЫ', value: `+${this.resultData.crystals}`, icon: '💎', color: 0xffaa00 },
      { label: 'ПРОЛЕТЕНО', value: `${Math.floor(this.resultData.meters)} м`, icon: '📏', color: 0x88aaff },
      { label: 'МАКС. КОМБО', value: this.resultData.combo || 0, icon: '⚡', color: 0xff00ff },
      { label: 'ВОРОТ', value: this.resultData.gates || 0, icon: '🚪', color: 0x44ff44 }
    ];

    stats.forEach((stat, index) => {
      const y = panelY - 90 + index * 28;
      
      // Иконка
      this.add.text(w / 2 - 100, y, stat.icon, {
        fontSize: '18px'
      }).setOrigin(0, 0.5).setDepth(1);

      // Название
      this.add.text(w / 2 - 80, y, stat.label, {
        fontSize: '14px',
        fontFamily: '"Orbitron", sans-serif',
        color: '#cccccc'
      }).setOrigin(0, 0.5).setDepth(1);

      // Значение
      const valueText = this.add.text(w / 2 + 80, y, String(stat.value), {
        fontSize: '18px',
        fontFamily: '"Audiowide", sans-serif',
        color: Phaser.Display.Color.ValueToColor(stat.color).rgba
      }).setOrigin(1, 0.5).setDepth(1);

      // Анимация появления
      valueText.setAlpha(0);
      this.tweens.add({
        targets: valueText,
        alpha: 1,
        duration: 500,
        delay: index * 100
      });
    });

    // Рекорд
    const best = gameManager.data.stats.maxScore;
    if (this.resultData.score >= best && this.resultData.score > 0) {
      const recordText = this.add.text(w / 2, panelY + 95, '🏆 НОВЫЙ РЕКОРД! 🏆', {
        fontSize: '24px',
        fontFamily: '"Audiowide", sans-serif',
        color: '#ffff00',
        stroke: '#ff8800',
        strokeThickness: 4,
        shadow: { blur: 15, color: '#ffff00', fill: true }
      }).setOrigin(0.5).setDepth(2);

      this.tweens.add({
        targets: recordText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1
      });

      // Конфетти
      this.createConfetti(w / 2, panelY - 50, 0xffff00);
    }
  }

  // =========================================================================
  // СОЗДАНИЕ КНОПОК
  // =========================================================================

  createActionButtons() {
    const w = this.scale.width;
    const h = this.scale.height;
    const btnY = h - 140;

    // Кнопка "ЗАНОВО"
    const retryBtn = this.createNeonButton(w / 2 - 150, btnY, '⟳ ЗАНОВО', '#00ffff', '#0088aa');
    
    // Кнопка "МЕНЮ"
    const menuBtn = this.createNeonButton(w / 2, btnY, '⌂ МЕНЮ', '#00ffff', '#0088aa');
    
    // Кнопка "МАГАЗИН"
    const shopBtn = this.createNeonButton(w / 2 + 150, btnY, '🛒 МАГАЗИН', '#ffaa00', '#aa5500');

    retryBtn.on('pointerdown', () => {
      this.playClickSound();
      this.scene.start('play');
    });

    menuBtn.on('pointerdown', () => {
      this.playClickSound();
      this.cleanupBeforeExit();
      this.scene.start('menu');
    });

    shopBtn.on('pointerdown', () => {
      this.playClickSound();
      this.cleanupBeforeExit();
      this.scene.start('shop');
    });
  }

  createNeonButton(x, y, text, color, hoverColor) {
    const btnColor = Phaser.Display.Color.HexStringToColor(color).color;
    const btnHoverColor = Phaser.Display.Color.HexStringToColor(hoverColor).color;

    // Графика кнопки
    const button = this.add.graphics();
    
    const buttonState = {
      glowAlpha: 0.3
    };

    const updateButton = () => {
      button.clear();
      button.fillStyle(0x1a1a3a, 0.9);
      button.fillRoundedRect(x - 70, y - 20, 140, 40, 12);
      button.lineStyle(3, btnColor, buttonState.glowAlpha);
      button.strokeRoundedRect(x - 70, y - 20, 140, 40, 12);
    };

    updateButton();

    // Текст кнопки
    const buttonText = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      stroke: color,
      strokeThickness: 2
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, 140, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: buttonState,
        glowAlpha: 0.8,
        duration: 200,
        onUpdate: updateButton
      });
      
      buttonText.setStyle({ stroke: '#ffffff' });
      buttonText.setScale(1.1);
      this.playHoverSound();
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: buttonState,
        glowAlpha: 0.3,
        duration: 200,
        onUpdate: updateButton
      });
      
      buttonText.setStyle({ stroke: color });
      buttonText.setScale(1);
    });

    hitArea.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      this.playClickSound();
      hitArea.emit('customClick');
    });

    hitArea.on('customClick', () => {}); // Будет переопределено

    this.neonButtons.push({ button, buttonText, hitArea });
    return hitArea;
  }

  // =========================================================================
  // НИЖНЯЯ ПАНЕЛЬ
  // =========================================================================

  createFooter() {
    const w = this.scale.width;
    const h = this.scale.height;

    const footerLine = this.add.graphics();
    footerLine.lineStyle(2, 0xff0000, 0.3);
    footerLine.lineBetween(50, h - 45, w - 50, h - 45);

    // Статистика сессии
    const sessionTime = Math.floor((Date.now() - (this.scene.sessionStart || Date.now())) / 1000);
    const timeStr = sessionTime > 60 ? `${Math.floor(sessionTime / 60)}м ${sessionTime % 60}с` : `${sessionTime}с`;
    
    this.add.text(30, h - 30, `⏱ ${timeStr}`, {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff'
    }).setOrigin(0, 0.5);

    // Версия
    this.add.text(w - 30, h - 30, 'v3.5.0', {
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#666666'
    }).setOrigin(1, 0.5);

    // Декоративные огни
    [-1, 1].forEach(side => {
      const x = side === -1 ? 30 : w - 30;
      
      const light = this.add.circle(x, h - 30, 5, 0xff0000, 0.5);
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

  createConfetti(x, y, color) {
    for (let i = 0; i < 30; i++) {
      const particle = this.add.circle(x, y, Phaser.Math.Between(3, 8), color, 0.9);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(200, 500);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 300;
      
      this.tweens.add({
        targets: particle,
        x: x + vx * 0.6,
        y: y + vy * 0.6,
        alpha: 0,
        scale: 0,
        duration: 1200,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
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

  playGameOverSound() {
    try { 
      audioManager.playSound(this, 'gameover_sound', 0.5); 
    } catch (e) {
      console.log('Game over sound not available');
    }
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
        scanLine.lineStyle(2, 0xff0000, 0.2);
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
    console.log('GameOverScene: shutdown');
  }
}