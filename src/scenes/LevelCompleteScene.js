import Phaser from 'phaser';
import { COLORS, WORLD_CONFIG, WORLD_ACHIEVEMENTS, WORLD_EFFECTS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('levelComplete');
    this.particles = [];
    this.confetti = [];
    this.animations = [];
    this.glowRings = [];
    this.floatingTexts = [];
  }

  init(data) {
    // Основные данные
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
    this.noHitRun = data.noHitRun ?? false;
    this.speedRun = data.speedRun ?? false;
    
    // Получаем конфиг текущего мира
    this.worldConfig = WORLD_CONFIG[this.world] || WORLD_CONFIG[0];
    this.worldEffect = WORLD_EFFECTS[this.worldConfig.id] || WORLD_EFFECTS.space;
    
    // Расчёт дополнительных бонусов
    this.calculateBonuses();
  }

  calculateBonuses() {
    // Бонус за время
    this.timeBonus = this.timeSpent < 60 ? 50 : (this.timeSpent < 120 ? 25 : 10);
    
    // Бонус за комбо
    this.comboBonus = Math.min(100, Math.floor(this.combo * 2));
    
    // Бонус за вагоны
    this.wagonBonus = this.wagons * 5;
    
    // Итоговый бонус
    this.totalBonus = 50 + this.stars * 25 + this.timeBonus + this.comboBonus + this.wagonBonus;
    
    // Редкость прохождения
    if (this.perfectRun && this.noHitRun && this.speedRun) {
      this.achievementRarity = 'legendary';
    } else if (this.perfectRun || this.noHitRun) {
      this.achievementRarity = 'epic';
    } else {
      this.achievementRarity = 'common';
    }
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Создаём фон с учётом мира
    this.createWorldBackground();

    // Создаём атмосферные эффекты мира
    this.createWorldAtmosphere();

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

    // Анимация получения награды
    this.createRewardAnimation();

    // Кнопки действий
    this.createActionButtons();

    // Звук победы с учётом мира
    this.playVictorySound();

    // Сохраняем прогресс
    this.saveProgress();

    // Анимация появления элементов
    this.animateElements();

    // Обработка ресайза
    this.scale.on('resize', this.onResize, this);
  }

  // =========================================================================
  // СОЗДАНИЕ ФОНА С УЧЁТОМ МИРА
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
    const centerX = w / 2;
    const centerY = h / 2;

    switch(this.world) {
      case 0: // КОСМОС
        for (let i = 0; i < 30; i++) {
          const starCluster = this.add.circle(
            Phaser.Math.Between(0, w),
            Phaser.Math.Between(0, h),
            Phaser.Math.Between(1, 3),
            0xffffff,
            0.1
          );
          starCluster.setBlendMode(Phaser.BlendModes.ADD);
          
          this.tweens.add({
            targets: starCluster,
            alpha: { from: 0.05, to: 0.2 },
            duration: Phaser.Math.Between(1000, 3000),
            yoyo: true,
            repeat: -1
          });
        }
        break;
        
      case 1: // КИБЕРПАНК
        // Неоновые вывески
        const neonSigns = ['⚡ NEON', 'CYBER', 'FUTURE', 'DATA', 'HACK', 'SYSTEM'];
        for (let i = 0; i < 8; i++) {
          const sign = this.add.text(
            Phaser.Math.Between(20, w - 20),
            Phaser.Math.Between(20, h - 20),
            neonSigns[Math.floor(Math.random() * neonSigns.length)],
            { 
              fontSize: `${Phaser.Math.Between(12, 24)}px`, 
              fontFamily: 'monospace', 
              color: Phaser.Utils.Array.GetRandom(['#ff44ff', '#00ffff', '#ffff44'])
            }
          );
          sign.setAlpha(0.15);
          sign.setBlendMode(Phaser.BlendModes.ADD);
          
          this.tweens.add({
            targets: sign,
            alpha: { from: 0.1, to: 0.3 },
            scale: { from: 1, to: 1.1 },
            duration: 1500,
            yoyo: true,
            repeat: -1
          });
        }
        
        // Цифровой дождь
        for (let i = 0; i < 20; i++) {
          const digit = this.add.text(
            Phaser.Math.Between(0, w),
            Phaser.Math.Between(0, h),
            Math.random() > 0.5 ? '0' : '1',
            { fontSize: `${Phaser.Math.Between(10, 18)}px`, fontFamily: 'monospace', color: '#ff44ff' }
          );
          digit.setAlpha(0.1);
          digit.setBlendMode(Phaser.BlendModes.ADD);
          
          this.tweens.add({
            targets: digit,
            y: digit.y + Phaser.Math.Between(50, 150),
            alpha: 0,
            duration: Phaser.Math.Between(2000, 5000),
            repeat: -1,
            onComplete: () => {
              digit.y = -Phaser.Math.Between(0, 50);
              digit.setAlpha(0.1);
            }
          });
        }
        break;
        
      case 2: // ПОДЗЕМЕЛЬЕ
        // Тени и туман
        for (let i = 0; i < 15; i++) {
          const mist = this.add.circle(
            Phaser.Math.Between(0, w),
            Phaser.Math.Between(0, h),
            Phaser.Math.Between(30, 80),
            0x442200,
            0.05
          );
          mist.setBlendMode(Phaser.BlendModes.MULTIPLY);
          
          this.tweens.add({
            targets: mist,
            x: mist.x + Phaser.Math.Between(-20, 20),
            y: mist.y + Phaser.Math.Between(-10, 10),
            duration: 4000,
            yoyo: true,
            repeat: -1
          });
        }
        
        // Светлячки
        for (let i = 0; i < 15; i++) {
          const firefly = this.add.circle(
            Phaser.Math.Between(0, w),
            Phaser.Math.Between(0, h),
            Phaser.Math.Between(1, 2),
            0xff6600,
            0.3
          );
          firefly.setBlendMode(Phaser.BlendModes.ADD);
          
          this.tweens.add({
            targets: firefly,
            x: firefly.x + Phaser.Math.Between(-50, 50),
            y: firefly.y + Phaser.Math.Between(-30, 30),
            alpha: { from: 0.2, to: 0.5 },
            duration: 3000,
            yoyo: true,
            repeat: -1
          });
        }
        break;
        
      case 3: // АСТЕРОИДЫ
        // Летящие обломки
        for (let i = 0; i < 20; i++) {
          const debris = this.add.image(
            Phaser.Math.Between(0, w),
            Phaser.Math.Between(0, h),
            'bg_asteroid_small'
          );
          debris.setScale(Phaser.Math.FloatBetween(0.2, 0.5));
          debris.setAlpha(0.1);
          debris.setBlendMode(Phaser.BlendModes.ADD);
          
          this.tweens.add({
            targets: debris,
            x: debris.x - Phaser.Math.Between(50, 200),
            y: debris.y + Phaser.Math.Between(-30, 30),
            angle: 360,
            duration: Phaser.Math.Between(3000, 8000),
            repeat: -1,
            onComplete: () => {
              debris.x = w + Phaser.Math.Between(50, 200);
            }
          });
        }
        break;
        
      case 4: // ЧЁРНАЯ ДЫРА
        // Гравитационные кольца
        for (let i = 0; i < 8; i++) {
          const radius = 40 + i * 25;
          const ring = this.add.ellipse(centerX, centerY, radius * 2, radius * 0.8, 0x000000, 0);
          ring.setStrokeStyle(2, 0xaa88ff, 0.2 - i * 0.02);
          ring.setDepth(-20);
          
          this.tweens.add({
            targets: ring,
            angle: 360,
            duration: 6000 + i * 500,
            repeat: -1,
            ease: 'Linear'
          });
          
          this.glowRings.push(ring);
        }
        
        // Втягивающиеся частицы
        for (let i = 0; i < 40; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Phaser.Math.Between(100, 300);
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance;
          const particle = this.add.circle(x, y, Phaser.Math.Between(1, 3), 0xaa88ff, 0.3);
          particle.setBlendMode(Phaser.BlendModes.ADD);
          
          this.tweens.add({
            targets: particle,
            x: centerX,
            y: centerY,
            alpha: 0,
            scale: 0,
            duration: Phaser.Math.Between(2000, 5000),
            repeat: -1,
            onComplete: () => {
              particle.x = x;
              particle.y = y;
              particle.alpha = 0.3;
              particle.scale = 1;
            }
          });
        }
        break;
    }
  }

  createWorldAtmosphere() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Добавляем эффект тумана в зависимости от мира
    const fogIntensity = this.worldConfig.fogIntensity || 0;
    if (fogIntensity > 0) {
      const fog = this.add.rectangle(0, 0, w, h, this.worldConfig.fogColor || 0x000000, fogIntensity);
      fog.setOrigin(0);
      fog.setDepth(10);
      fog.setBlendMode(Phaser.BlendModes.MULTIPLY);
      
      this.tweens.add({
        targets: fog,
        alpha: { from: fogIntensity, to: fogIntensity * 0.7 },
        duration: 2000,
        yoyo: true,
        repeat: -1
      });
    }
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.stars = [];

    const starCount = this.world === 0 ? 150 : 80;
    const starColors = this.getStarColors();
    
    for (let i = 0; i < starCount; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      const scale = Phaser.Math.FloatBetween(0.2, 1.5);
      star.setScale(scale);
      star.setTint(starColors[Math.floor(Math.random() * starColors.length)]);
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
      star.setDepth(-5);
      star.setBlendMode(Phaser.BlendModes.ADD);
      
      this.stars.push({
        sprite: star,
        speed: Phaser.Math.FloatBetween(0.01, 0.08),
        baseAlpha: Phaser.Math.FloatBetween(0.2, 0.7),
        rotationSpeed: Phaser.Math.FloatBetween(-0.03, 0.03)
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

  getStarColors() {
    const colorSets = {
      0: [0x4444ff, 0x8844ff, 0xff44ff, 0x44aaff],
      1: [0xff44ff, 0xff88ff, 0xaa88ff, 0x00ffff],
      2: [0xff6600, 0xffaa44, 0xcc8844, 0xaa6644],
      3: [0xffaa66, 0xffcc88, 0xccaa88, 0xaa8866],
      4: [0xaa88ff, 0xcc88ff, 0xff88ff, 0x8866cc]
    };
    return colorSets[this.world] || colorSets[0];
  }

  createConfettiEffect() {
    const w = this.scale.width;
    const colors = this.world === 1 ? 
      [0xff44ff, 0x00ffff, 0xffff44] : 
      [0xff4444, 0x44ff44, 0x4444ff, 0xff44ff, 0xffff44, 0x44ffff];
    
    const count = this.stars >= 3 ? 150 : 100;
    
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = -Phaser.Math.Between(0, 100);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Phaser.Math.Between(4, 8);
      
      const confetti = this.add.rectangle(x, y, size, size, color, 0.9);
      confetti.setBlendMode(Phaser.BlendModes.ADD);
      
      const angle = Phaser.Math.Between(-30, 30);
      const speed = Phaser.Math.Between(100, 350);
      
      this.tweens.add({
        targets: confetti,
        x: x + Math.sin(angle) * 200,
        y: y + speed,
        angle: 720,
        alpha: 0,
        duration: 2000,
        delay: i * 25,
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
    
    // Название мира и уровня с эффектом
    const worldName = this.worldConfig.name || 'КОСМОС';
    const levelNum = this.level + 1;
    const worldColor = this.getWorldColorString();
    
    const subtitle = this.add.text(w / 2, 35, `${worldName}`, {
      fontSize: '14px',
      fontFamily: "'Share Tech Mono', monospace",
      color: worldColor,
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    const levelText = this.add.text(w / 2, 55, `УРОВЕНЬ ${levelNum}`, {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.text_secondary,
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    // Основной заголовок с анимацией
    const title = this.add.text(w / 2, 90, 'УРОВЕНЬ ПРОЙДЕН!', {
      fontSize: '38px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ffffff',
      stroke: COLORS.success,
      strokeThickness: 5,
      shadow: { blur: 20, color: COLORS.success, fill: true }
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: title,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Достижения
    let yOffset = 125;
    if (this.isNewRecord) {
      const record = this.add.text(w / 2, yOffset, '🏆 НОВЫЙ РЕКОРД! 🏆', {
        fontSize: '16px',
        fontFamily: "'Orbitron', sans-serif",
        color: '#ffff00',
        stroke: '#ffaa00',
        strokeThickness: 2,
        shadow: { blur: 10, color: '#ffff00', fill: true }
      }).setOrigin(0.5);
      yOffset += 20;
      
      this.tweens.add({
        targets: record,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 400,
        yoyo: true,
        repeat: -1
      });
    }
    
    if (this.perfectRun) {
      const perfect = this.add.text(w / 2, yOffset, '✨ PERFECT RUN! ✨', {
        fontSize: '14px',
        fontFamily: "'Orbitron', sans-serif",
        color: '#ffaa00',
        stroke: '#ff8800',
        strokeThickness: 2
      }).setOrigin(0.5);
      yOffset += 20;
    }
    
    if (this.noHitRun) {
      const noHit = this.add.text(w / 2, yOffset, '🛡️ БЕЗ ПОТЕРИ ЗДОРОВЬЯ!', {
        fontSize: '12px',
        fontFamily: "'Space Mono', monospace",
        color: '#00ff00'
      }).setOrigin(0.5);
      yOffset += 20;
    }
    
    if (this.speedRun) {
      const speedRun = this.add.text(w / 2, yOffset, '⚡ СКОРОСТНОЕ ПРОХОЖДЕНИЕ!', {
        fontSize: '12px',
        fontFamily: "'Space Mono', monospace",
        color: '#00ffff'
      }).setOrigin(0.5);
    }
  }

  getWorldColorString() {
    const colors = ['#00ffff', '#ff00ff', '#ff6600', '#ffaa00', '#aa88ff'];
    return colors[this.world] || '#00ffff';
  }

  createStarsRating() {
    const w = this.scale.width;
    const starsY = 180;
    
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
        strokeThickness: 2,
        shadow: isActive ? { blur: 15, color: '#ffaa00', fill: true } : null
      }).setOrigin(0.5);
      
      // Эффект свечения для активных звёзд
      if (isActive) {
        const glow = this.add.text(starX, 0, '★', {
          fontSize: '64px',
          fontFamily: 'sans-serif',
          color: '#ffaa00',
          alpha: 0.4
        }).setOrigin(0.5);
        this.starsContainer.add(glow);
        
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.2, to: 0.6 },
          scale: { from: 1, to: 1.15 },
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
    const starsText = this.add.text(w / 2, starsY + 48, `${this.stars}/3 ЗВЁЗД`, {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5);
  }

  // =========================================================================
  // ПАНЕЛЬ СТАТИСТИКИ
  // =========================================================================

  createStatsPanel() {
    const w = this.scale.width;
    const statsY = 245;
    
    // Фон панели с эффектом свечения
    const statsBg = this.add.rectangle(w / 2, statsY, w - 50, 145, 0x0a0a1a, 0.9)
      .setStrokeStyle(2, this.worldConfig.primaryColor || COLORS.primary, 0.6);
    
    // Внутреннее свечение
    const innerGlow = this.add.graphics();
    innerGlow.lineStyle(1, this.worldConfig.primaryColor || COLORS.primary, 0.3);
    innerGlow.strokeRoundedRect(w / 2 - (w - 54) / 2, statsY - 2, w - 54, 149, 12);
    
    // Заголовок
    this.add.text(w / 2, statsY - 45, 'РЕЗУЛЬТАТЫ', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: this.worldConfig.primaryColor || COLORS.primary
    }).setOrigin(0.5);
    
    // Статистика в 2 колонки
    const stats = [
      { label: 'СЧЁТ', value: this.score, icon: '🏆', color: COLORS.accent },
      { label: 'МОНЕТЫ', value: `+${this.coins}`, icon: '💎', color: COLORS.success },
      { label: 'ВАГОНЫ', value: this.wagons, icon: '🚃', color: COLORS.primary },
      { label: 'КОМБО', value: this.combo, icon: '⚡', color: '#ff44ff' },
      { label: 'ВРАГИ', value: this.enemiesKilled, icon: '👾', color: '#ff6666' },
      { label: 'ВОРОТА', value: this.gatesPassed, icon: '🚪', color: '#66ff66' },
      { label: 'ВРЕМЯ', value: `${Math.floor(this.timeSpent / 60)}:${String(this.timeSpent % 60).padStart(2, '0')}`, icon: '⏱️', color: '#88aaff' }
    ];
    
    const startX = w / 2 - 115;
    const startY = statsY - 12;
    
    stats.forEach((stat, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * 145;
      const y = startY + row * 30;
      
      const container = this.add.container(x, y);
      
      const icon = this.add.text(0, 0, stat.icon, {
        fontSize: '12px'
      }).setOrigin(0, 0.5);
      
      const label = this.add.text(16, 0, `${stat.label}:`, {
        fontSize: '10px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);
      
      const value = this.add.text(72, 0, String(stat.value), {
        fontSize: '11px',
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
        delay: 500 + index * 60,
        ease: 'Back.out'
      });
    });
    
    // Бонусы
    const bonusY = statsY + 45;
    this.add.text(w / 2, bonusY - 12, 'БОНУСЫ', {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.accent
    }).setOrigin(0.5);
    
    const bonuses = [
      { label: 'ЗА ЗВЁЗДЫ', value: `+${this.stars * 25}`, color: '#ffaa00' },
      { label: 'ЗА ВРЕМЯ', value: `+${this.timeBonus}`, color: '#88aaff' },
      { label: 'ЗА КОМБО', value: `+${this.comboBonus}`, color: '#ff44ff' },
      { label: 'ЗА ВАГОНЫ', value: `+${this.wagonBonus}`, color: '#00ff00' }
    ];
    
    let bonusX = w / 2 - 100;
    bonuses.forEach((bonus, i) => {
      const text = this.add.text(bonusX + i * 68, bonusY, `${bonus.label}: ${bonus.value}`, {
        fontSize: '8px',
        fontFamily: "'Share Tech Mono', monospace",
        color: bonus.color
      }).setOrigin(0, 0.5);
      text.setAlpha(0);
      
      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 200,
        delay: 800 + i * 100
      });
    });
    
    // Итоговая награда
    const rewardBg = this.add.rectangle(w / 2, statsY + 85, 240, 38, 0x1a3a1a, 0.9)
      .setStrokeStyle(2, COLORS.success, 0.9);
    
    const rewardText = this.add.text(w / 2, statsY + 85, `+${this.totalBonus} 💎 ИТОГО`, {
      fontSize: '14px',
      fontFamily: "'Audiowide', sans-serif",
      color: COLORS.success,
      shadow: { blur: 8, color: '#00ff00', fill: true }
    }).setOrigin(0.5);
    
    // Пульсация награды
    this.tweens.add({
      targets: rewardBg,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 600,
      yoyo: true,
      repeat: -1
    });
  }

  createBonusAchievements() {
    const w = this.scale.width;
    const h = this.scale.height;
    const achievementsY = h - 215;
    
    // Дополнительные достижения
    const bonusAchievements = [];
    
    if (this.perfectRun) {
      bonusAchievements.push({ icon: '❤️', text: 'ИДЕАЛЬНОЕ ПРОХОЖДЕНИЕ', color: '#ff4444', rarity: 'epic' });
    }
    if (this.noHitRun) {
      bonusAchievements.push({ icon: '🛡️', text: 'БЕЗ УРОНА', color: '#00ff00', rarity: 'rare' });
    }
    if (this.speedRun) {
      bonusAchievements.push({ icon: '⚡', text: 'СКОРОСТНОЙ ЗАБЕГ', color: '#00ffff', rarity: 'epic' });
    }
    if (this.combo >= 20) {
      bonusAchievements.push({ icon: '🔥', text: `КОМБО x${this.combo}`, color: '#ffaa00', rarity: 'rare' });
    }
    if (this.enemiesKilled >= 15) {
      bonusAchievements.push({ icon: '👾', text: 'ОХОТНИК НА ВРАГОВ', color: '#ff66ff', rarity: 'common' });
    }
    if (this.gatesPassed >= 25) {
      bonusAchievements.push({ icon: '🚪', text: 'МАСТЕР ВОРОТ', color: '#66ff66', rarity: 'common' });
    }
    if (this.wagons >= 10) {
      bonusAchievements.push({ icon: '🚃', text: 'СОСТАВ ИЗ 10 ВАГОНОВ', color: '#88aaff', rarity: 'rare' });
    }
    
    if (bonusAchievements.length > 0) {
      const container = this.add.container(w / 2, achievementsY);
      
      const bg = this.add.rectangle(0, 0, w - 40, 52, 0x1a1a3a, 0.85)
        .setStrokeStyle(2, COLORS.accent, 0.6);
      
      let xOffset = -((bonusAchievements.length - 1) * 52);
      
      bonusAchievements.forEach((ach, i) => {
        const itemContainer = this.add.container(xOffset + i * 104, 0);
        
        // Рамка в зависимости от редкости
        const frameColor = ach.rarity === 'epic' ? 0xff44ff : (ach.rarity === 'rare' ? 0xffaa00 : 0x88aaff);
        const frame = this.add.rectangle(0, 0, 90, 42, 0x0a0a1a, 0.9);
        frame.setStrokeStyle(1, frameColor, 0.8);
        
        const icon = this.add.text(0, -8, ach.icon, {
          fontSize: '24px'
        }).setOrigin(0.5);
        
        const text = this.add.text(0, 12, ach.text, {
          fontSize: '8px',
          fontFamily: "'Space Mono', monospace",
          color: Phaser.Display.Color.ValueToColor(frameColor).rgba,
          align: 'center',
          wordWrap: { width: 80 }
        }).setOrigin(0.5);
        
        itemContainer.add([frame, icon, text]);
        container.add(itemContainer);
        
        // Анимация появления
        itemContainer.setAlpha(0);
        itemContainer.setScale(0.5);
        this.tweens.add({
          targets: itemContainer,
          alpha: 1,
          scale: 1,
          duration: 300,
          delay: 900 + i * 80,
          ease: 'Back.out'
        });
      });
      
      container.add(bg);
      container.setDepth(5);
    }
  }

  createRewardAnimation() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Анимация кристаллов
    for (let i = 0; i < 20; i++) {
      const crystal = this.add.text(
        w / 2 + Phaser.Math.Between(-100, 100),
        h / 2 + Phaser.Math.Between(-50, 50),
        '💎',
        { fontSize: `${Phaser.Math.Between(16, 32)}px` }
      );
      crystal.setAlpha(0.8);
      crystal.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: crystal,
        y: crystal.y - Phaser.Math.Between(50, 150),
        x: crystal.x + Phaser.Math.Between(-50, 50),
        alpha: 0,
        scale: 0,
        duration: 1200,
        delay: i * 50,
        onComplete: () => crystal.destroy()
      });
    }
  }

  // =========================================================================
  // КНОПКИ ДЕЙСТВИЙ
  // =========================================================================

  createActionButtons() {
    const w = this.scale.width;
    const h = this.scale.height;
    const btnY = h - 95;
    
    // Кнопка "ЗАНОВО"
    this.createNeonButton(w / 2 - 150, btnY, '⟳ ЗАНОВО', COLORS.primary, () => {
      audioManager.playSound(this, 'tap_sound', 0.3);
      this.scene.start('play');
    });
    
    // Кнопка "ВЫБОР УРОВНЕЙ"
    this.createNeonButton(w / 2, btnY, '📋 УРОВНИ', COLORS.primary, () => {
      audioManager.playSound(this, 'tap_sound', 0.3);
      this.scene.start('levelSelect');
    });
    
    // Кнопка "СЛЕДУЮЩИЙ" или "СЛЕДУЮЩИЙ МИР"
    if (this.level < 9) {
      this.createNeonButton(w / 2 + 150, btnY, '→ СЛЕДУЮЩИЙ', COLORS.accent, () => {
        audioManager.playSound(this, 'tap_sound', 0.3);
        gameManager.setCurrentLevel(this.level + 1);
        this.scene.start('play');
      }, true);
    } else if (this.world < 4) {
      this.createNeonButton(w / 2 + 150, btnY, '🌍 СЛЕДУЮЩИЙ МИР', COLORS.secondary, () => {
        audioManager.playSound(this, 'tap_sound', 0.3);
        gameManager.setCurrentWorld(this.world + 1);
        gameManager.setCurrentLevel(0);
        this.scene.start('worldSelect');
      }, true);
    } else {
      // Финальный мир пройден
      this.createNeonButton(w / 2 + 150, btnY, '🏆 ЗАВЕРШИТЬ', 0xffaa00, () => {
        audioManager.playSound(this, 'level_up_sound', 0.5);
        this.scene.start('menu');
      }, true);
    }
    
    // Версия игры
    this.add.text(w - 10, h - 12, 'v3.5.0', {
      fontSize: '10px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#666666'
    }).setOrigin(1, 0.5);
  }

  createNeonButton(x, y, text, color, callback, isAccent = false) {
    const btnColor = isAccent ? color : color;
    const bgColor = isAccent ? 0x2a2a3a : 0x1a1a3a;
    const width = text.length > 12 ? 190 : 170;
    
    const button = this.add.graphics();
    
    const buttonState = { glowAlpha: 0.3 };
    
    const updateButton = () => {
      button.clear();
      button.fillStyle(bgColor, 0.9);
      button.fillRoundedRect(x - width/2, y - 20, width, 40, 12);
      button.lineStyle(3, btnColor, buttonState.glowAlpha);
      button.strokeRoundedRect(x - width/2, y - 20, width, 40, 12);
    };
    
    updateButton();
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: text.length > 12 ? '14px' : '16px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff',
      stroke: Phaser.Display.Color.ValueToColor(btnColor).rgba,
      strokeThickness: 2
    }).setOrigin(0.5);
    
    const hitArea = this.add.rectangle(x, y, width, 40, 0x000000, 0)
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
      // Выбираем звук в зависимости от мира
      const worldSounds = {
        1: 'cyberpunk_win',
        2: 'dungeon_win', 
        3: 'asteroid_win',
        4: 'blackhole_win'
      };
      const soundKey = worldSounds[this.world] || 'win_sound';
      const volume = this.perfectRun ? 0.7 : 0.5;
      
      audioManager.playSound(this, soundKey, volume);
    } catch (e) {
      try {
        audioManager.playSound(this, 'level_up_sound', 0.5);
      } catch (e2) {}
    }
  }

  saveProgress() {
    // Добавляем кристаллы с бонусами
    gameManager.addCrystals(this.totalBonus, 'level_complete');
    
    // Сохраняем звёзды
    if (gameManager.setLevelStars) {
      gameManager.setLevelStars(this.world, this.level, this.stars);
    }
    
    // Разблокируем следующий уровень
    if (this.level < 9 && gameManager.unlockLevel) {
      gameManager.unlockLevel(this.world, this.level + 1);
    }
    
    // Разблокируем следующий мир (только после полного прохождения)
    if (this.level === 9 && this.world < 4 && gameManager.data) {
      const worlds = gameManager.data.unlockedWorlds || [];
      if (!worlds.includes(this.world + 1)) {
        worlds.push(this.world + 1);
        gameManager.save();
        
        // Достижение за прохождение мира
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
    
    // Достижение за 3 звезды
    if (this.stars === 3) {
      gameManager.unlockAchievement('three_stars');
    }
    
    // Достижение за быстрое прохождение
    if (this.timeSpent < 60) {
      gameManager.unlockAchievement('speed_demon');
    }
    
    // Достижения мира
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
    
    // Специальные достижения для каждого мира
    if (this.world === 1 && this.combo >= 15) {
      gameManager.unlockAchievement('cyberpunk_master');
    }
    if (this.world === 2 && this.enemiesKilled >= 20) {
      gameManager.unlockAchievement('dungeon_master');
    }
    if (this.world === 3 && this.gatesPassed >= 30) {
      gameManager.unlockAchievement('asteroid_hunter');
    }
    if (this.world === 4 && this.perfectRun) {
      gameManager.unlockAchievement('blackhole_survivor');
    }
  }

  animateElements() {
    // Сканирующая линия в стиле мира
    const scanLine = this.add.graphics();
    const lineColor = this.worldConfig.primaryColor || 0x00ffff;
    let y = 0;
    
    this.tweens.add({
      targets: { y: 0 },
      y: this.scale.height,
      duration: 4000,
      repeat: -1,
      onUpdate: (tween) => {
        y = tween.getValue();
        scanLine.clear();
        scanLine.lineStyle(2, lineColor, 0.15);
        scanLine.lineBetween(0, y, this.scale.width, y);
      }
    });
    
    // Плавающие частицы
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        Phaser.Math.Between(1, 3),
        lineColor,
        0.1
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: particle,
        y: particle.y + Phaser.Math.Between(30, 100),
        x: particle.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 5000),
        yoyo: true,
        repeat: -1
      });
    }
  }

  onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.tweens.killAll();
    this.stars = [];
    this.particles = [];
    this.confetti = [];
    this.glowRings = [];
    this.floatingTexts = [];
  }
}