import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('settings');
    this.stars = [];
    this.neonButtons = [];
    this.particles = [];
    this.gridOffset = 0;
    this.lastHoverTime = 0;
    this.settingsItems = [];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    console.log('SettingsScene: create started');

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

    // ===== ПАНЕЛЬ НАСТРОЕК =====
    this.createSettingsPanel();

    // ===== КНОПКИ ДЕЙСТВИЙ =====
    this.createActionButtons();

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

    console.log('SettingsScene: create completed');
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
      gradient.generateTexture(`settings_gradient_${index}`, w, h);
      gradient.destroy();
      
      const gradientImage = this.add.image(0, 0, `settings_gradient_${index}`).setOrigin(0);
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
    this.title = this.add.text(w / 2, 50, 'НАСТРОЙКИ', {
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
    this.titleGlow = this.add.text(w / 2, 50, 'НАСТРОЙКИ', {
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
  // СОЗДАНИЕ ПАНЕЛИ НАСТРОЕК
  // =========================================================================

  createSettingsPanel() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const panelY = 130;
    const panelHeight = 360;

    // Фон панели с неоновой рамкой
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a0a1a, 0.9);
    panelBg.fillRoundedRect(w / 2 - (w - 60) / 2, panelY, w - 60, panelHeight, 20);
    panelBg.lineStyle(3, 0x00ffff, 0.3);
    panelBg.strokeRoundedRect(w / 2 - (w - 60) / 2, panelY, w - 60, panelHeight, 20);

    // Внутренняя подсветка
    const panelGlow = this.add.graphics();
    panelGlow.lineStyle(2, 0x00ffff, 0.1);
    panelGlow.strokeRoundedRect(w / 2 - (w - 64) / 2, panelY + 2, w - 64, panelHeight - 4, 18);

    // Украшения по углам панели
    const cornerPositions = [
      { x: w / 2 - (w - 60) / 2, y: panelY },
      { x: w / 2 + (w - 60) / 2, y: panelY },
      { x: w / 2 - (w - 60) / 2, y: panelY + panelHeight },
      { x: w / 2 + (w - 60) / 2, y: panelY + panelHeight }
    ];

    cornerPositions.forEach(pos => {
      const corner = this.add.circle(pos.x, pos.y, 5, 0x00ffff, 0.3);
      corner.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: corner,
        alpha: 0.1,
        scale: 1.5,
        duration: 2000,
        yoyo: true,
        repeat: -1
      });
    });

    let y = panelY + 30;
    const leftColX = 50;
    const rightColX = w - 80;

    // ===== ЗВУК =====
    this.createSettingItem(leftColX, y, '🔊 ЗВУК', 'sound', rightColX, gameManager.getSetting('soundEnabled'));
    y += 50;

    // ===== МУЗЫКА =====
    this.createSettingItem(leftColX, y, '🎵 МУЗЫКА', 'music', rightColX, gameManager.getSetting('musicEnabled'));
    y += 50;

    // ===== ВИБРАЦИЯ =====
    this.createSettingItem(leftColX, y, '📳 ВИБРАЦИЯ', 'vibration', rightColX, gameManager.getSetting('vibrationEnabled'));
    y += 50;

    // ===== КАЧЕСТВО ЭФФЕКТОВ =====
    this.createSettingItem(leftColX, y, '✨ КАЧЕСТВО', 'highQualityEffects', rightColX, gameManager.getSetting('highQualityEffects'));
    y += 50;

    // ===== ТРЯСКА ЭКРАНА =====
    this.createSettingItem(leftColX, y, '🌀 ТРЯСКА', 'screenShake', rightColX, gameManager.getSetting('screenShake'));
    y += 50;

    // ===== АВТОСБОР =====
    this.createSettingItem(leftColX, y, '⚡ АВТОСБОР', 'autoCollect', rightColX, gameManager.getSetting('autoCollect'));
    y += 50;

    // ===== СЛОЖНОСТЬ =====
    this.createComplexSetting(leftColX, y, '⚡ СЛОЖНОСТЬ', 'difficulty', rightColX);
    y += 50;

    // ===== ЯЗЫК =====
    this.createComplexSetting(leftColX, y, '🌐 ЯЗЫК', 'language', rightColX);
  }

  createSettingItem(x, y, label, key, toggleX, value) {
    // Текст настройки с неоновым эффектом
    const labelText = this.add.text(x, y, label, {
      fontSize: '18px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 1
    }).setOrigin(0, 0.5);

    // Анимация при наведении
    labelText.setInteractive({ useHandCursor: true });
    
    labelText.on('pointerover', () => {
      labelText.setStroke('#ff00ff', 2);
      this.playHoverSound();
    });
    
    labelText.on('pointerout', () => {
      labelText.setStroke('#00ffff', 1);
    });

    // Создаем тоггл
    this.createNeonToggle(toggleX, y, key, value);
  }

  createComplexSetting(x, y, label, key, controlX) {
    // Текст настройки
    const labelText = this.add.text(x, y, label, {
      fontSize: '18px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 1
    }).setOrigin(0, 0.5);

    // Контейнер для контролов
    const container = this.add.container(controlX, y);

    // Значение
    const valueText = this.add.text(0, 0, this.getCurrentValue(key), {
      fontSize: '18px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Левая стрелка
    const leftArrow = this.add.text(-40, 0, '◀', {
      fontSize: '24px',
      fontFamily: 'sans-serif',
      color: '#00ffff'
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5);

    // Правая стрелка
    const rightArrow = this.add.text(40, 0, '▶', {
      fontSize: '24px',
      fontFamily: 'sans-serif',
      color: '#00ffff'
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5);

    container.add([leftArrow, valueText, rightArrow]);

    // Эффекты наведения
    [leftArrow, rightArrow].forEach(arrow => {
      arrow.on('pointerover', () => {
        arrow.setColor('#ffffff');
        arrow.setScale(1.2);
        this.playHoverSound();
      });
      
      arrow.on('pointerout', () => {
        arrow.setColor('#00ffff');
        arrow.setScale(1);
      });
    });

    // Обработчики
    leftArrow.on('pointerdown', () => {
      this.changeSetting(key, -1);
      valueText.setText(this.getCurrentValue(key));
      this.playClickSound();
    });

    rightArrow.on('pointerdown', () => {
      this.changeSetting(key, 1);
      valueText.setText(this.getCurrentValue(key));
      this.playClickSound();
    });
  }

  createNeonToggle(x, y, key, initialValue) {
    const toggle = this.add.container(x, y);

    // Фон тогла
    const bg = this.add.graphics();
    const updateToggle = (value) => {
      bg.clear();
      bg.fillStyle(0x1a1a3a, 0.9);
      bg.fillRoundedRect(-30, -15, 60, 30, 15);
      bg.lineStyle(2, value ? 0x00ff00 : 0xff4444, 0.8);
      bg.strokeRoundedRect(-30, -15, 60, 30, 15);
    };
    updateToggle(initialValue);

    // Круг-переключатель
    const circle = this.add.circle(initialValue ? 15 : -15, 0, 12, 0xffffff, 0.9);
    circle.setBlendMode(Phaser.BlendModes.ADD);

    // Текст состояния
    const stateText = this.add.text(0, 25, initialValue ? 'ВКЛ' : 'ВЫКЛ', {
      fontSize: '10px',
      fontFamily: '"Orbitron", sans-serif',
      color: initialValue ? '#00ff00' : '#ff4444'
    }).setOrigin(0.5);

    toggle.add([bg, circle, stateText]);

    // Интерактивная область
    const hitArea = this.add.rectangle(x, y, 60, 30, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      this.playHoverSound();
      circle.setScale(1.2);
    });

    hitArea.on('pointerout', () => {
      circle.setScale(1);
    });

    hitArea.on('pointerdown', () => {
      const newValue = !gameManager.getSetting(key);
      gameManager.setSetting(key, newValue);
      
      // Обновляем визуал
      updateToggle(newValue);
      circle.x = newValue ? 15 : -15;
      stateText.setText(newValue ? 'ВКЛ' : 'ВЫКЛ');
      stateText.setColor(newValue ? '#00ff00' : '#ff4444');
      
      this.playClickSound();
      
      // Специальная обработка для звука и музыки
      if (key === 'music') {
        if (newValue) {
          audioManager.playMusic(this, 0.5);
        } else {
          audioManager.stopMusic();
        }
      }
    });

    this.settingsItems.push({ toggle, hitArea });
  }

  getCurrentValue(key) {
    const value = gameManager.getSetting(key);
    
    if (key === 'difficulty') {
      const names = {
        easy: 'ЛЁГКАЯ',
        normal: 'НОРМ',
        hard: 'СЛОЖНАЯ',
        insane: 'БЕЗУМНАЯ'
      };
      return names[value] || value;
    }
    
    if (key === 'language') {
      const names = {
        ru: 'РУС',
        en: 'ENG',
        es: 'ESP',
        fr: 'FRA',
        de: 'DEU',
        zh: '中文',
        ja: '日本語'
      };
      return names[value] || value;
    }
    
    return value;
  }

  changeSetting(key, direction) {
    if (key === 'difficulty') {
      const difficulties = ['easy', 'normal', 'hard', 'insane'];
      let current = gameManager.getSetting('difficulty');
      let index = difficulties.indexOf(current);
      index = (index + direction + difficulties.length) % difficulties.length;
      gameManager.setSetting('difficulty', difficulties[index]);
    }
    
    if (key === 'language') {
      const languages = ['ru', 'en', 'es', 'fr', 'de', 'zh', 'ja'];
      let current = gameManager.getSetting('language');
      let index = languages.indexOf(current);
      index = (index + direction + languages.length) % languages.length;
      gameManager.setSetting('language', languages[index]);
    }
  }

  // =========================================================================
  // КНОПКИ ДЕЙСТВИЙ
  // =========================================================================

  createActionButtons() {
    const w = this.scale.width;
    const h = this.scale.height;
    const btnY = h - 150;

    // Кнопка очистки данных
    this.createActionButton(w / 2 - 150, btnY, '⚠ СБРОС', 'danger', () => this.confirmClearData());

    // Кнопка экспорта
    this.createActionButton(w / 2, btnY, '📤 ЭКСПОРТ', 'normal', () => this.exportData());

    // Кнопка импорта
    this.createActionButton(w / 2 + 150, btnY, '📥 ИМПОРТ', 'normal', () => this.importData());

    // Версия
    this.add.text(w / 2, h - 100, 'v3.5.0 • КИБЕР-ИЗДАНИЕ', {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
  }

  createActionButton(x, y, text, type, callback) {
    const colors = {
      normal: { color: 0x00ffff, textColor: '#ffffff' },
      danger: { color: 0xff4444, textColor: '#ffffff' },
      success: { color: 0x00ff00, textColor: '#ffffff' }
    };
    
    const btnColor = colors[type].color;

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
      stroke: Phaser.Display.Color.ValueToColor(btnColor).rgba,
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
      buttonText.setScale(1);
    });

    hitArea.on('pointerdown', () => {
      this.playClickSound();
      callback();
    });

    this.neonButtons.push({ button, buttonText });
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
  // ДИАЛОГОВЫЕ ОКНА
  // =========================================================================

  confirmClearData() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Затемнение
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0)
      .setDepth(50)
      .setScrollFactor(0)
      .setInteractive();

    this.tweens.add({
      targets: overlay,
      alpha: 0.9,
      duration: 300
    });

    // Панель
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0a1a, 0.98);
    panel.fillRoundedRect(w / 2 - 200, h / 2 - 150, 400, 300, 20);
    panel.lineStyle(4, 0xff4444, 1);
    panel.strokeRoundedRect(w / 2 - 200, h / 2 - 150, 400, 300, 20);
    panel.setDepth(51);

    // Предупреждение
    const warningIcon = this.add.text(w / 2, h / 2 - 100, '⚠', {
      fontSize: '48px',
      color: '#ff4444'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 50, 'ОЧИСТИТЬ ВСЕ ДАННЫЕ?', {
      fontSize: '24px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 10, 'Это действие нельзя отменить!', {
      fontSize: '16px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffaa00'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2 + 20, 'Все достижения и прогресс будут потеряны', {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#88aaff'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    // Кнопки
    const yesBtn = this.createDialogButton(w / 2 - 100, h / 2 + 80, 'СБРОСИТЬ', '#ff4444');
    const noBtn = this.createDialogButton(w / 2 + 100, h / 2 + 80, 'ОТМЕНА', '#00ff00');

    yesBtn.setDepth(52).setScrollFactor(0);
    noBtn.setDepth(52).setScrollFactor(0);

    yesBtn.on('pointerdown', () => {
      gameManager.reset();
      this.playClickSound();
      this.showNotification('✅ ДАННЫЕ ОЧИЩЕНЫ', 2000, '#00ff00');
      
      this.time.delayedCall(2000, () => {
        location.reload();
      });
    });

    noBtn.on('pointerdown', () => {
      this.playClickSound();
      this.tweens.add({
        targets: [overlay, panel, warningIcon, yesBtn, noBtn],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          overlay.destroy();
          panel.destroy();
          warningIcon.destroy();
          yesBtn.destroy();
          noBtn.destroy();
        }
      });
    });
  }

  createDialogButton(x, y, text, color) {
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

  exportData() {
    const data = gameManager.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skypulse_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showNotification('✅ ДАННЫЕ ЭКСПОРТИРОВАНЫ', 2000, '#00ff00');
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const success = gameManager.importData(e.target.result);
        if (success) {
          this.showNotification('✅ ДАННЫЕ ИМПОРТИРОВАНЫ', 2000, '#00ff00');
          this.time.delayedCall(2000, () => {
            this.scene.restart();
          });
        } else {
          this.showNotification('❌ ОШИБКА ИМПОРТА', 2000, '#ff4444');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }

  showNotification(text, duration, color) {
    const w = this.scale.width;
    const h = this.scale.height;

    const notification = this.add.text(w / 2, h / 2, text, {
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

    notification.setScale(0.5);
    this.tweens.add({
      targets: notification,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.out'
    });

    this.tweens.add({
      targets: notification,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1000,
      delay: duration - 300,
      ease: 'Power2.easeOut',
      onComplete: () => notification.destroy()
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
    console.log('SettingsScene: shutdown');
  }
}