import Phaser from 'phaser';
import { COLORS, WORLD_CONFIG, ACHIEVEMENTS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('levelComplete');
    this.particles = [];
    this.confetti = [];
    this.animations = [];
  }

  init(data) {
    this.world = data.world ?? 0;
    this.level = data.level ?? 0;
    this.score = data.score ?? 0;
    this.stars = data.stars ?? 0;
    this.coins = data.coins ?? 0;
    this.wagons = data.wagons ?? 0;
    this.combo = data.combo ?? 0;
    this.timeSpent = data.timeSpent ?? 0;
    this.enemiesKilled = data.enemiesKilled ?? 0;
    this.gatesPassed = data.gatesPassed ?? 0;
    this.newUnlock = data.newUnlock ?? false;
    this.isNewRecord = data.isNewRecord ?? false;
    this.perfectRun = data.perfectRun ?? false;
    
    // Получаем конфиг текущего мира
    this.worldConfig = WORLD_CONFIG[this.world] || WORLD_CONFIG[0];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Создаём фон в зависимости от мира
    this.createWorldBackground();

    // Создаём звёзды с анимацией
    this.createStars();

    // Эффект конфетти
    this.createConfettiEffect();

    // Заголовок с анимацией
    this.createHeader();

    // Контейнер для звёзд с анимацией
    this.createStarsRating();

    // Панель статистики
    this.createStatsPanel();

    // Дополнительные достижения
    this.createBonusAchievements();

    // Кнопки действий
    this.createActionButtons();

    // Звук победы
    this.playVictorySound();

    // Сохраняем прогресс
    this.saveProgress();

    // Анимация появления элементов
    this.animateElements();

    // Обработка ресайза
    this.scale.on('resize', this.onResize, this);
  }

  // =========================================================================
  // СОЗДАНИЕ ФОНА
  // =========================================================================

  createWorldBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Основной градиент в цветах мира
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    const startColor = this.worldConfig.gradientStart || 0x030712;
    const endColor = this.worldConfig.gradientEnd || 0x0a0a1a;
    
    gradient.fillGradientStyle(startColor, startColor, endColor, endColor, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('complete_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'complete_bg').setOrigin(0);

    // Неоновые линии в стиле мира
    const glowColor = this.worldConfig.primaryColor || COLORS.primary;
    const glowLines = this.add.graphics();
    glowLines.lineStyle(3, glowColor, 0.3);
    glowLines.strokeRect(15, 15, w - 30, h - 30);
    
    this.tweens.add({
      targets: glowLines,
      alpha: { from: 0.2, to: 0.5 },
      duration: 1500,
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
        for (let i = 0; i < 5; i++) {
          const sign = this.add.text(
            Phaser.Math.Between(10, w - 10),
            Phaser.Math.Between(10, h - 10),
            ['NEON', 'CYBER', 'FUTURE', 'DATA'][Math.floor(Math.random() * 4)],
            { fontSize: '12px', fontFamily: 'monospace', color: '#ff44ff' }
          );
          sign.setAlpha(0.2);
          sign.setBlendMode(Phaser.BlendModes.ADD);
          this.tweens.add({
            targets: sign,
            alpha: { from: 0.1, to: 0.4 },
            duration: 2000,
            yoyo: true,
            repeat: -1
          });
        }
        break;
        
      case 2: // Подземелье
        for (let i = 0; i < 8; i++) {
          const shadow = this.add.circle(
            Phaser.Math.Between(0, w),
            Phaser.Math.Between(0, h),
            Phaser.Math.Between(20, 60),
            0x000000,
            0.1
          );
          shadow.setBlendMode(Phaser.BlendModes.MULTIPLY);
        }
        break;
        
      case 3: // Астероиды
        for (let i = 0; i < 10; i++) {
          const asteroid = this.add.image(
            Phaser.Math.Between(0, w),
            Phaser.Math.Between(0, h),
            'bg_asteroid_small'
          );
          asteroid.setScale(Phaser.Math.FloatBetween(0.3, 0.8));
          asteroid.setAlpha(0.1);
          asteroid.setBlendMode(Phaser.BlendModes.ADD);
          this.tweens.add({
            targets: asteroid,
            angle: 360,
            duration: Phaser.Math.Between(5000, 15000),
            repeat: -1
          });
        }
        break;
        
      case 4: // Чёрная дыра
        const centerX = w / 2;
        const centerY = h / 2;
        for (let i = 0; i < 5; i++) {
          const ring = this.add.ellipse(centerX, centerY, 100 + i * 30, 60 + i * 20, 0x000000, 0);
          ring.setStrokeStyle(2, 0xaa88ff, 0.2 - i * 0.03);
          this.tweens.add({
            targets: ring,
            angle: 360,
            duration: 8000 + i * 1000,
            repeat: -1
          });
        }
        break;
    }
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.stars = [];

    const starCount = this.world === 0 ? 150 : 80;
    
    for (let i = 0; i < starCount; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      const scale = Phaser.Math.FloatBetween(0.2, 1.2);
      star.setScale(scale);
      
      // Цвета в стиле мира
      let tintColor;
      if (this.world === 1) tintColor = Phaser.Math.Between(0xff44ff, 0xff88ff);
      else if (this.world === 2) tintColor = Phaser.Math.Between(0xff6600, 0xffaa66);
      else if (this.world === 3) tintColor = Phaser.Math.Between(0xffaa66, 0xffcc88);
      else if (this.world === 4) tintColor = Phaser.Math.Between(0xaa88ff, 0xcc88ff);
      else tintColor = Phaser.Math.Between(0x4444ff, 0xff44ff);
      
      star.setTint(tintColor);
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
      star.setDepth(-5);
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

  createConfettiEffect() {
    const w = this.scale.width;
    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xff44ff, 0xffff44, 0x44ffff];
    
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = -Phaser.Math.Between(0, 100);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Phaser.Math.Between(4, 8);
      
      const confetti = this.add.rectangle(x, y, size, size, color, 0.8);
      confetti.setBlendMode(Phaser.BlendModes.ADD);
      
      const angle = Phaser.Math.Between(-30, 30);
      const speed = Phaser.Math.Between(100, 300);
      
      this.tweens.add({
        targets: confetti,
        x: x + Math.sin(angle) * 200,
        y: y + speed,
        angle: 360,
        alpha: 0,
        duration: 2000,
        delay: i * 30,
        ease: 'Quad.easeOut',
        onComplete: () => confetti.destroy()
      });
    }
  }

  // =========================================================================
  // ЗАГОЛОВОК И ЗВЁЗДЫ
  // =========================================================================

  createHeader() {
    const w = this.scale.width;
    
    // Название мира и уровня
    const worldName = this.worldConfig.name || 'КОСМОС';
    const levelNum = this.level + 1;
    
    const subtitle = this.add.text(w / 2, 35, `${worldName} • УРОВЕНЬ ${levelNum}`, {
      fontSize: '14px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.text_secondary,
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    // Основной заголовок
    const title = this.add.text(w / 2, 70, 'УРОВЕНЬ ПРОЙДЕН!', {
      fontSize: '38px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ffffff',
      stroke: COLORS.success,
      strokeThickness: 5,
      shadow: { blur: 20, color: COLORS.success, fill: true }
    }).setOrigin(0.5);
    
    // Анимация заголовка
    this.tweens.add({
      targets: title,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Рекорд
    if (this.isNewRecord) {
      const record = this.add.text(w / 2, 105, '🏆 НОВЫЙ РЕКОРД! 🏆', {
        fontSize: '16px',
        fontFamily: "'Orbitron', sans-serif",
        color: '#ffff00',
        stroke: '#ffaa00',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: record,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 400,
        yoyo: true,
        repeat: -1
      });
    }
    
    // Идеальное прохождение
    if (this.perfectRun) {
      const perfect = this.add.text(w / 2, 125, '✨ PERFECT RUN! ✨', {
        fontSize: '14px',
        fontFamily: "'Orbitron', sans-serif",
        color: '#ffaa00'
      }).setOrigin(0.5);
    }
  }

  createStarsRating() {
    const w = this.scale.width;
    const starsY = 165;
    const starColors = [0xffaa00, 0xffdd44, 0xffff88];
    
    this.starsContainer = this.add.container(w / 2, starsY);
    
    for (let i = 0; i < 3; i++) {
      const starX = (i - 1) * 55;
      const isActive = i < this.stars;
      
      // Основная звезда
      const star = this.add.text(starX, 0, '★', {
        fontSize: '58px',
        fontFamily: 'sans-serif',
        color: isActive ? '#ffaa00' : '#444444',
        stroke: isActive ? '#ff8800' : '#222222',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      // Эффект свечения для активных звёзд
      if (isActive) {
        const glow = this.add.text(starX, 0, '★', {
          fontSize: '62px',
          fontFamily: 'sans-serif',
          color: '#ffaa00',
          alpha: 0.3
        }).setOrigin(0.5);
        this.starsContainer.add(glow);
        
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.2, to: 0.6 },
          scale: { from: 1, to: 1.2 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          delay: i * 200
        });
      }
      
      this.starsContainer.add(star);
      
      // Анимация появления
      star.setScale(0);
      this.tweens.add({
        targets: star,
        scaleX: 1,
        scaleY: 1,
        duration: 400,
        delay: i * 150,
        ease: 'Back.out'
      });
    }
    
    // Текст с количеством звёзд
    const starsText = this.add.text(w / 2, starsY + 45, `${this.stars}/3 ЗВЁЗД`, {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5);
  }

  // =========================================================================
  // СТАТИСТИКА
  // =========================================================================

  createStatsPanel() {
    const w = this.scale.width;
    const statsY = 240;
    
    // Фон панели
    const statsBg = this.add.rectangle(w / 2, statsY, w - 50, 130, 0x0a0a1a, 0.9)
      .setStrokeStyle(2, COLORS.primary, 0.6);
    
    // Заголовок
    this.add.text(w / 2, statsY - 40, 'РЕЗУЛЬТАТЫ', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary
    }).setOrigin(0.5);
    
    // Статистика в 2 колонки
    const stats = [
      { label: 'СЧЁТ', value: this.score, icon: '🏆', color: COLORS.accent },
      { label: 'МОНЕТЫ', value: `+${this.coins}`, icon: '💎', color: COLORS.success },
      { label: 'ВАГОНЫ', value: this.wagons, icon: '🚃', color: COLORS.primary },
      { label: 'КОМБО', value: this.combo, icon: '⚡', color: '#ff44ff' },
      { label: 'ВРАГИ', value: this.enemiesKilled, icon: '👾', color: '#ff6666' },
      { label: 'ВОРОТА', value: this.gatesPassed, icon: '🚪', color: '#66ff66' }
    ];
    
    const startX = w / 2 - 110;
    const startY = statsY - 15;
    
    stats.forEach((stat, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * 140;
      const y = startY + row * 32;
      
      const container = this.add.container(x, y);
      
      const icon = this.add.text(0, 0, stat.icon, {
        fontSize: '14px'
      }).setOrigin(0, 0.5);
      
      const label = this.add.text(18, 0, `${stat.label}:`, {
        fontSize: '11px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);
      
      const value = this.add.text(70, 0, String(stat.value), {
        fontSize: '12px',
        fontFamily: "'Orbitron', sans-serif",
        color: stat.color
      }).setOrigin(1, 0.5);
      
      container.add([icon, label, value]);
      
      // Анимация появления
      container.setAlpha(0);
      container.setY(y + 10);
      this.tweens.add({
        targets: container,
        alpha: 1,
        y: y,
        duration: 300,
        delay: 400 + index * 80,
        ease: 'Back.out'
      });
    });
    
    // Награда
    const reward = 50 + this.stars * 25;
    const rewardBg = this.add.rectangle(w / 2, statsY + 65, 200, 35, 0x1a3a1a, 0.9)
      .setStrokeStyle(2, COLORS.success, 0.8);
    
    const rewardText = this.add.text(w / 2, statsY + 65, `+${reward} 💎 НАГРАДА`, {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.success
    }).setOrigin(0.5);
    
    // Пульсация награды
    this.tweens.add({
      targets: rewardBg,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  createBonusAchievements() {
    const w = this.scale.width;
    const h = this.scale.height;
    const achievementsY = h - 210;
    
    // Дополнительные достижения
    const bonusAchievements = [];
    
    if (this.perfectRun) {
      bonusAchievements.push({ icon: '❤️', text: 'Без потери здоровья', color: '#ff4444' });
    }
    if (this.combo >= 20) {
      bonusAchievements.push({ icon: '⚡', text: 'Комбо x20', color: '#ffaa00' });
    }
    if (this.enemiesKilled >= 10) {
      bonusAchievements.push({ icon: '👾', text: 'Охотник на врагов', color: '#ff66ff' });
    }
    if (this.gatesPassed >= 20) {
      bonusAchievements.push({ icon: '🚪', text: 'Мастер ворот', color: '#66ff66' });
    }
    
    if (bonusAchievements.length > 0) {
      const container = this.add.container(w / 2, achievementsY);
      
      const bg = this.add.rectangle(0, 0, w - 40, 45, 0x1a1a3a, 0.8)
        .setStrokeStyle(1, COLORS.accent, 0.5);
      
      let xOffset = -((bonusAchievements.length - 1) * 50);
      
      bonusAchievements.forEach((ach, i) => {
        const icon = this.add.text(xOffset + i * 100, 0, ach.icon, {
          fontSize: '20px'
        }).setOrigin(0.5);
        
        const text = this.add.text(xOffset + i * 100, 20, ach.text, {
          fontSize: '8px',
          fontFamily: "'Space Mono', monospace",
          color: ach.color
        }).setOrigin(0.5);
        
        container.add([icon, text]);
      });
      
      container.add(bg);
      container.setDepth(5);
      
      this.tweens.add({
        targets: container,
        alpha: { from: 0, to: 1 },
        y: achievementsY - 10,
        duration: 500,
        delay: 800
      });
    }
  }

  // =========================================================================
  // КНОПКИ
  // =========================================================================

  createActionButtons() {
    const w = this.scale.width;
    const h = this.scale.height;
    const btnY = h - 90;
    
    // Кнопка "ЗАНОВО"
    const retryBtn = this.createNeonButton(w / 2 - 140, btnY, '⟳ ЗАНОВО', COLORS.primary, () => {
      audioManager.playSound(this, 'tap_sound', 0.3);
      this.scene.start('play');
    });
    
    // Кнопка "УРОВНИ"
    const selectBtn = this.createNeonButton(w / 2, btnY, '📋 УРОВНИ', COLORS.primary, () => {
      audioManager.playSound(this, 'tap_sound', 0.3);
      this.scene.start('levelSelect');
    });
    
    // Кнопка "СЛЕДУЮЩИЙ"
    if (this.level < 9) {
      const nextBtn = this.createNeonButton(w / 2 + 140, btnY, '→ СЛЕДУЮЩИЙ', COLORS.accent, () => {
        audioManager.playSound(this, 'tap_sound', 0.3);
        gameManager.setCurrentLevel(this.level + 1);
        this.scene.start('play');
      }, true);
    } else {
      // Если это последний уровень мира
      const nextWorldBtn = this.createNeonButton(w / 2 + 140, btnY, '🌍 СЛЕДУЮЩИЙ МИР', COLORS.secondary, () => {
        audioManager.playSound(this, 'tap_sound', 0.3);
        if (this.world < 4) {
          gameManager.setCurrentWorld(this.world + 1);
          gameManager.setCurrentLevel(0);
        }
        this.scene.start('worldSelect');
      }, true);
    }
    
    // Версия игры
    this.add.text(w - 10, h - 15, 'v3.5.0', {
      fontSize: '10px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#666666'
    }).setOrigin(1, 0.5);
  }

  createNeonButton(x, y, text, color, callback, isAccent = false) {
    const btnColor = isAccent ? color : color;
    const bgColor = isAccent ? 0x2a2a3a : 0x1a1a3a;
    
    const button = this.add.graphics();
    
    const buttonState = { glowAlpha: 0.3 };
    
    const updateButton = () => {
      button.clear();
      button.fillStyle(bgColor, 0.9);
      button.fillRoundedRect(x - 85, y - 20, 170, 40, 12);
      button.lineStyle(3, btnColor, buttonState.glowAlpha);
      button.strokeRoundedRect(x - 85, y - 20, 170, 40, 12);
    };
    
    updateButton();
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff',
      stroke: btnColor,
      strokeThickness: 2
    }).setOrigin(0.5);
    
    const hitArea = this.add.rectangle(x, y, 170, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
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
    
    hitArea.on('pointerdown', callback);
    
    return { button, buttonText };
  }

  // =========================================================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // =========================================================================

  playVictorySound() {
    try {
      const soundKey = this.world === 4 ? 'boss_defeated' : 'win_sound';
      const volume = this.perfectRun ? 0.7 : 0.5;
      audioManager.playSound(this, soundKey, volume);
    } catch (e) {
      try {
        audioManager.playSound(this, 'win_sound', 0.5);
      } catch (e2) {}
    }
  }

  saveProgress() {
    // Добавляем кристаллы
    const reward = 50 + this.stars * 25;
    gameManager.addCrystals(reward, 'level_complete');
    
    // Сохраняем звёзды
    if (gameManager.setLevelStars) {
      gameManager.setLevelStars(this.world, this.level, this.stars);
    }
    
    // Разблокируем следующий уровень
    if (this.level < 9 && gameManager.unlockLevel) {
      gameManager.unlockLevel(this.world, this.level + 1);
    }
    
    // Разблокируем следующий мир
    if (this.level === 9 && this.world < 4 && gameManager.data) {
      const worlds = gameManager.data.unlockedWorlds || [];
      if (!worlds.includes(this.world + 1)) {
        worlds.push(this.world + 1);
        gameManager.save();
      }
    }
    
    // Обновляем статистику
    if (gameManager.updateStats) {
      gameManager.updateStats(
        this.score,
        this.level + 1,
        this.wagons,
        this.combo,
        this.coins,
        this.enemiesKilled,
        this.score
      );
    }
    
    // Проверяем достижения
    this.checkAchievements();
  }

  checkAchievements() {
    // Достижение за идеальное прохождение
    if (this.perfectRun) {
      gameManager.unlockAchievement('perfect_level');
    }
    
    // Достижение за высокое комбо
    if (this.combo >= 20) {
      gameManager.unlockAchievement('combo_master');
    }
    
    // Достижение за прохождение мира
    if (this.level === 9) {
      const worldAchievements = {
        0: 'world_1_complete',
        1: 'world_2_complete',
        2: 'world_3_complete',
        3: 'world_4_complete',
        4: 'world_5_complete'
      };
      const achKey = worldAchievements[this.world];
      if (achKey) {
        gameManager.unlockAchievement(achKey);
      }
    }
  }

  animateElements() {
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
        scanLine.lineStyle(2, 0x00ffff, 0.1);
        scanLine.lineBetween(0, y, this.scale.width, y);
      }
    });
  }

  onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.tweens.killAll();
    this.stars = [];
    this.particles = [];
    this.confetti = [];
  }
}