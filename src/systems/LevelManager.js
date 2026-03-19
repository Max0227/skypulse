import { LEVEL_CONFIG } from '../config';

export class LevelManager {
  constructor(scene) {
    this.scene = scene;
    this.currentLevel = 0;
    this.currentWorld = 0;
    this.levelConfig = LEVEL_CONFIG;
    this.difficultyMultiplier = 1;
    this.worldThemeMultiplier = 1;
    this.atmosphereParticles = [];
    this.worldTweens = [];
    
    // Добавляем хранение созданных эффектов для их очистки
    this.activeEffects = {
      lights: [],
      shadows: [],
      blackHoleRings: [],
      particles: [],
      decals: [],
      ambientSounds: [],
      postFX: []
    };

    // Статистика мира
    this.worldStats = {
      enemiesKilled: 0,
      gatesPassed: 0,
      timeSpent: 0,
      bestCombo: 0
    };

    // Цветовые схемы для миров
    this.worldColors = {
      0: { primary: 0x00ffff, secondary: 0xff00ff, accent: 0xffff00, bg: 0x0a0a1a }, // Космос
      1: { primary: 0xff00ff, secondary: 0x00ffff, accent: 0xffaa00, bg: 0x1a0a2a }, // Киберпанк
      2: { primary: 0xff6600, secondary: 0xaa00ff, accent: 0xffaa00, bg: 0x2a1a0a }, // Подземелье
      3: { primary: 0xffaa00, secondary: 0x00ffaa, accent: 0xff5500, bg: 0x0a2a2a }, // Астероиды
      4: { primary: 0xaa00aa, secondary: 0x00aaff, accent: 0xff00aa, bg: 0x000000 }  // Чёрная дыра
    };
  }

  // =========================================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // =========================================================================

  setWorld(world) {
    // Очищаем эффекты предыдущего мира
    this.clearWorldEffects();
    this.stopWorldAnimations();
    
    this.currentWorld = world;
    this.worldThemeMultiplier = 1 + (world * 0.2); // Каждый мир сложнее на 20%
    
    this.applyWorldTheme();
    this.createAtmosphere();
    this.startWorldAnimations();
    
    // Эмит события смены мира
    this.scene.events.emit('worldChanged', { 
      world: this.currentWorld, 
      name: this.getWorldName() 
    });
    
    console.log(`🌍 Мир изменен: ${this.getWorldName()}`);
  }

  setLevel(level) {
    const oldLevel = this.currentLevel;
    this.currentLevel = Math.min(level, 9);
    
    if (oldLevel !== this.currentLevel) {
      this.applyLevelDifficulty();
      this.applyLevelEffects();
      
      // Эмит события смены уровня
      this.scene.events.emit('levelChanged', { 
        level: this.currentLevel, 
        name: this.getLevelName(),
        isBoss: this.isBossLevel()
      });
      
      console.log(`📊 Уровень изменен: ${this.currentLevel + 1}`);
    }
  }

  // =========================================================================
  // ПРИМЕНЕНИЕ ТЕМ МИРОВ
  // =========================================================================

  applyWorldTheme() {
    const config = this.levelConfig[this.currentWorld];
    if (!config) return;
    
    const colors = this.worldColors[this.currentWorld] || this.worldColors[0];
    
    // Применяем базовую тему с эффектами
    this.scene.cameras.main.setBackgroundColor(config.bgColor || colors.bg);
    
    // Настраиваем освещение
    this.setupWorldLighting();
    
    // Применяем цвета к воротам
    this.scene.gateColors = config.gateColors || [
      'gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'
    ];
    
    // Сохраняем конфиг мира
    this.scene.currentWorldConfig = config;
    
    // Применяем специальные эффекты мира
    this.applySpecialEffects(config.specialEvent);
    
    // Устанавливаем гравитацию мира
    this.setWorldGravity();
    
    // Настраиваем музыку мира
    this.setWorldMusic();
  }

  setupWorldLighting() {
    const colors = this.worldColors[this.currentWorld] || this.worldColors[0];
    
    // Включаем освещение если нужно
    if (this.currentWorld === 1) { // Киберпанк
      this.scene.lights.enable();
      this.scene.lights.setAmbientColor(0x1a0a2a);
    } else {
      this.scene.lights.disable();
    }
  }

  setWorldGravity() {
    // Разная гравитация для разных миров
    const gravities = {
      0: 1300, // Космос - стандарт
      1: 1200, // Киберпанк - легче
      2: 1500, // Подземелье - тяжелее
      3: 1400, // Астероиды - чуть тяжелее
      4: 800   // Чёрная дыра - очень легкая
    };
    
    this.scene.physics.world.gravity.y = gravities[this.currentWorld] || 1300;
  }

  setWorldMusic() {
    // Разная музыка для разных миров
    const musicTracks = {
      0: 'space_ambient',
      1: 'cyberpunk_theme',
      2: 'dungeon_ambient',
      3: 'asteroids_theme',
      4: 'void_ambient'
    };
    
    const track = musicTracks[this.currentWorld];
    if (track && this.scene.sound.get(track)) {
      // Плавно меняем музыку
      // Логика смены музыки
    }
  }

  // =========================================================================
  // СПЕЦИАЛЬНЫЕ ЭФФЕКТЫ МИРОВ
  // =========================================================================

  applySpecialEffects(eventType) {
    switch(eventType) {
      case 'neon':
        this.applyNeonEffect();
        break;
      case 'dungeon':
        this.applyDungeonEffect();
        break;
      case 'asteroids':
        this.applyAsteroidEffect();
        break;
      case 'blackhole':
        this.applyBlackHoleEffect();
        break;
      default:
        this.applyDefaultEffect();
        break;
    }
  }

  applyNeonEffect() {
    // Неоновые огни
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(50, this.scene.scale.width - 50);
      const y = Phaser.Math.Between(50, this.scene.scale.height - 50);
      const light = this.scene.lights.addLight(x, y, 200)
        .setColor(Phaser.Utils.Array.GetRandom([0xff00ff, 0x00ffff, 0xffff00]))
        .setIntensity(1.2 + Math.random() * 0.8);
      
      this.activeEffects.lights.push(light);
      
      // Анимация мерцания
      const tween = this.scene.tweens.add({
        targets: light,
        intensity: { from: 1.0, to: 2.0 },
        duration: 1000 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.worldTweens.push(tween);
    }
    
    // Неоновые линии по краям
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(3, 0x00ffff, 0.3);
    graphics.strokeRect(10, 10, this.scene.scale.width - 20, this.scene.scale.height - 20);
    this.activeEffects.decals.push(graphics);
  }

  applyDungeonEffect() {
    // Эффект тумана
    const fog = this.scene.add.graphics();
    fog.fillStyle(0x000000, 0.3);
    fog.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    fog.setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.activeEffects.decals.push(fog);
    
    // Плавающие тени
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, this.scene.scale.width);
      const y = Phaser.Math.Between(0, this.scene.scale.height);
      const size = Phaser.Math.Between(30, 100);
      const shadow = this.scene.add.circle(x, y, size, 0x000000, 0.2);
      shadow.setDepth(-15);
      this.activeEffects.shadows.push(shadow);
      
      // Анимация движения теней
      const tween = this.scene.tweens.add({
        targets: shadow,
        x: x + Phaser.Math.Between(-50, 50),
        y: y + Phaser.Math.Between(-30, 30),
        alpha: { from: 0.1, to: 0.3 },
        duration: 5000 + i * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.worldTweens.push(tween);
    }
  }

  applyAsteroidEffect() {
    // Увеличиваем шанс спавна астероидов
    this.scene.baseAsteroidChance = 0.7;
    
    // Добавляем плавающие обломки
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(0, this.scene.scale.width);
      const y = Phaser.Math.Between(0, this.scene.scale.height);
      const asteroid = this.scene.add.image(x, y, 'bg_asteroid_1');
      asteroid.setScale(Phaser.Math.FloatBetween(0.3, 0.8));
      asteroid.setAlpha(0.2);
      asteroid.setDepth(-20);
      asteroid.setBlendMode(Phaser.BlendModes.ADD);
      this.activeEffects.decals.push(asteroid);
      
      // Медленное вращение
      this.scene.tweens.add({
        targets: asteroid,
        angle: 360,
        duration: 10000 + i * 1000,
        repeat: -1,
        ease: 'Linear'
      });
    }
  }

  applyBlackHoleEffect() {
    // Затемнение фона
    this.scene.cameras.main.setBackgroundColor(0x000000);
    
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    
    // Создаем кольца черной дыры
    for (let i = 0; i < 8; i++) {
      const radius = 50 + i * 30;
      const ring = this.scene.add.ellipse(centerX, centerY, radius * 2, radius, 0x000000, 0);
      ring.setStrokeStyle(3, 0x4400aa, 0.8 - i * 0.1);
      ring.setDepth(-30);
      ring.setScrollFactor(0);
      
      this.activeEffects.blackHoleRings.push(ring);
      
      // Вращение колец
      const tween = this.scene.tweens.add({
        targets: ring,
        angle: 360,
        duration: 8000 + i * 1500,
        repeat: -1,
        ease: 'Linear'
      });
      this.worldTweens.push(tween);
    }
    
    // Частицы, втягивающиеся в центр
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const distance = Phaser.Math.Between(200, 400);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      const particle = this.scene.add.circle(x, y, 2, 0xaa88ff, 0.6);
      particle.setDepth(-25);
      this.activeEffects.particles.push(particle);
      
      // Анимация втягивания
      const tween = this.scene.tweens.add({
        targets: particle,
        x: centerX,
        y: centerY,
        alpha: 0,
        scale: 0.1,
        duration: 3000 + i * 200,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          particle.x = x;
          particle.y = y;
          particle.alpha = 0.6;
          particle.scale = 1;
        }
      });
      this.worldTweens.push(tween);
    }
  }

  applyDefaultEffect() {
    // Базовый эффект для космоса
    this.createSpaceAtmosphere();
  }

  createSpaceAtmosphere() {
    // Мерцающие звезды
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, this.scene.scale.width);
      const y = Phaser.Math.Between(0, this.scene.scale.height);
      const star = this.scene.add.circle(x, y, 1, 0xffffff, 0.5);
      star.setDepth(-35);
      this.activeEffects.particles.push(star);
      
      // Мерцание
      const tween = this.scene.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        scale: { from: 1, to: 1.5 },
        duration: 2000 + i * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.worldTweens.push(tween);
    }
  }

  createAtmosphere() {
    // Создаем атмосферные частицы в зависимости от мира
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      let particle;
      const x = Phaser.Math.Between(0, this.scene.scale.width);
      const y = Phaser.Math.Between(0, this.scene.scale.height);
      
      switch(this.currentWorld) {
        case 1: // Киберпанк
          particle = this.scene.add.circle(x, y, 2, 0xff00ff, 0.3);
          break;
        case 2: // Подземелье
          particle = this.scene.add.circle(x, y, 3, 0x442200, 0.2);
          break;
        case 3: // Астероиды
          particle = this.scene.add.circle(x, y, 2, 0xffaa00, 0.2);
          break;
        case 4: // Чёрная дыра
          particle = this.scene.add.circle(x, y, 1, 0x4400aa, 0.4);
          break;
        default: // Космос
          particle = this.scene.add.circle(x, y, 1, 0xffffff, 0.3);
      }
      
      particle.setDepth(-30);
      this.atmosphereParticles.push(particle);
      
      // Анимация движения
      const tween = this.scene.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-100, 100),
        y: y + Phaser.Math.Between(-50, 50),
        alpha: 0.1,
        duration: 5000 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.worldTweens.push(tween);
    }
  }

  // =========================================================================
  // УРОВНИ СЛОЖНОСТИ
  // =========================================================================

  applyLevelDifficulty() {
    // Базовая сложность от мира
    const worldMultiplier = this.worldThemeMultiplier;
    
    // Сложность от уровня (0-9)
    const levelMultiplier = 1 + (this.currentLevel * 0.15);
    
    // Итоговый множитель
    this.difficultyMultiplier = worldMultiplier * levelMultiplier;
    
    // Расчет параметров
    const baseSpeed = 240 * this.difficultyMultiplier;
    const baseDelay = 1500 / this.difficultyMultiplier;
    const baseCoinChance = 0.8 * Math.min(1.2, this.difficultyMultiplier);
    const baseAsteroidChance = 0.3 * this.difficultyMultiplier;
    const basePowerUpChance = 0.1 * this.difficultyMultiplier;
    
    // Применяем параметры
    this.scene.baseSpeed = Math.min(800, baseSpeed);
    this.scene.spawnDelay = Math.max(300, Math.min(1500, baseDelay));
    this.scene.coinChance = Math.min(0.95, baseCoinChance);
    this.scene.asteroidChance = Math.min(0.9, baseAsteroidChance);
    this.scene.powerUpChance = Math.min(0.4, basePowerUpChance);
    
    // Обновляем скорость, если нет активного бонуса
    if (!this.scene.bonusActive) {
      this.scene.currentSpeed = this.scene.baseSpeed;
    }
    
    // Обновляем существующие объекты
    if (this.scene.updateExistingObjectsSpeed) {
      this.scene.updateExistingObjectsSpeed();
    }
    
    // Логируем сложность
    console.log(`📈 Сложность уровня ${this.currentLevel + 1}: x${this.difficultyMultiplier.toFixed(2)}`);
  }

  applyLevelEffects() {
    // Эффекты для босс-уровней
    if (this.isBossLevel()) {
      this.applyBossEffects();
    }
    
    // Эффекты для особых уровней
    if (this.currentLevel % 3 === 0 && this.currentLevel > 0) {
      this.applySpecialLevelEffects();
    }
  }

  applyBossEffects() {
    // Подсветка красным
    this.scene.cameras.main.flash(500, 255, 0, 0, true);
    
    // Замедленная съемка
    this.scene.time.timeScale = 0.8;
    
    // Сообщение о боссе
    this.showBossWarning();
    
    // Восстанавливаем через 2 секунды
    this.scene.time.delayedCall(2000, () => {
      this.scene.time.timeScale = 1;
    });
  }

  applySpecialLevelEffects() {
    // Увеличенный шанс усилителей
    this.scene.powerUpChance = Math.min(0.6, this.scene.powerUpChance * 1.5);
    
    // Эффект свечения
    const glow = this.scene.add.graphics();
    glow.lineStyle(5, 0xffff00, 0.3);
    glow.strokeRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    glow.setDepth(90);
    glow.setScrollFactor(0);
    
    this.scene.time.delayedCall(2000, () => glow.destroy());
  }

  showBossWarning() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    const warning = this.scene.add.text(w / 2, h / 3, '⚠ БОСС УРОВЕНЬ ⚠', {
      fontSize: '36px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { blur: 15, color: '#ff0000', fill: true }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    
    warning.setScale(0.5);
    this.scene.tweens.add({
      targets: warning,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: 2000,
      ease: 'Power2.easeOut',
      onComplete: () => warning.destroy()
    });
  }

  // =========================================================================
  // АНИМАЦИИ
  // =========================================================================

  startWorldAnimations() {
    // Анимируем источники света
    this.activeEffects.lights.forEach((light, index) => {
      const tween = this.scene.tweens.add({
        targets: light,
        intensity: { from: 1.0, to: 2.0 },
        duration: 2000 + index * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.worldTweens.push(tween);
    });
  }

  stopWorldAnimations() {
    this.worldTweens.forEach(tween => {
      if (tween) tween.stop();
    });
    this.worldTweens = [];
  }

  // =========================================================================
  // ОЧИСТКА
  // =========================================================================

  clearWorldEffects() {
    // Очищаем источники света
    this.activeEffects.lights.forEach(light => {
      if (light) light.setIntensity(0);
    });
    this.activeEffects.lights = [];
    
    // Очищаем тени
    this.activeEffects.shadows.forEach(shadow => {
      if (shadow && shadow.destroy) shadow.destroy();
    });
    this.activeEffects.shadows = [];
    
    // Очищаем кольца черной дыры
    this.activeEffects.blackHoleRings.forEach(ring => {
      if (ring && ring.destroy) ring.destroy();
    });
    this.activeEffects.blackHoleRings = [];
    
    // Очищаем частицы
    this.activeEffects.particles.forEach(particle => {
      if (particle && particle.destroy) particle.destroy();
    });
    this.activeEffects.particles = [];
    
    // Очищаем декорации
    this.activeEffects.decals.forEach(decals => {
      if (decals && decals.destroy) decals.destroy();
    });
    this.activeEffects.decals = [];
    
    // Очищаем атмосферные частицы
    this.atmosphereParticles.forEach(particle => {
      if (particle && particle.destroy) particle.destroy();
    });
    this.atmosphereParticles = [];
    
    // Сбрасываем параметры
    this.scene.baseAsteroidChance = undefined;
  }

  // =========================================================================
  // ГЕТТЕРЫ И ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // =========================================================================

  getCurrentTheme() {
    return this.levelConfig[this.currentWorld]?.theme || 'space';
  }

  getLevelName() {
    const worldName = this.levelConfig[this.currentWorld]?.name || 'Неизвестный мир';
    return `${worldName} - Уровень ${this.currentLevel + 1}`;
  }

  getWorldName() {
    return this.levelConfig[this.currentWorld]?.name || 'Неизвестный мир';
  }

  getWorldDescription() {
    return this.levelConfig[this.currentWorld]?.description || '';
  }

  getGoalScore() {
    const baseGoal = this.levelConfig[this.currentWorld]?.goalScore || 500;
    return Math.floor(baseGoal * (this.currentLevel + 1) * this.difficultyMultiplier);
  }

  getEnemyTypes() {
    return this.levelConfig[this.currentWorld]?.enemyTypes || [];
  }

  shouldSpawnEnemy() {
    const types = this.getEnemyTypes();
    if (types.length === 0) return false;
    
    // Шанс спавна врага увеличивается с уровнем
    const spawnChance = 0.1 + (this.currentLevel * 0.05) * this.difficultyMultiplier;
    return Math.random() < spawnChance;
  }

  getRandomEnemyType() {
    const types = this.getEnemyTypes();
    if (types.length === 0) return null;
    return types[Math.floor(Math.random() * types.length)];
  }

  getWorldProgress() {
    return this.currentLevel / 9; // 0 to 1
  }

  isBossLevel() {
    return this.currentLevel === 9;
  }

  /**
   * Получить текущий множитель сложности
   */
  getDifficultyMultiplier() {
    return this.difficultyMultiplier;
  }

  /**
   * Получить текущую базовую скорость
   */
  getBaseSpeed() {
    return 240 * this.difficultyMultiplier;
  }

  /**
   * Получить текущий уровень мира
   */
  getCurrentLevel() {
    return this.currentLevel;
  }

  /**
   * Получить текущий мир
   */
  getCurrentWorld() {
    return this.currentWorld;
  }

  /**
   * Получить цветовую схему текущего мира
   */
  getWorldColors() {
    return this.worldColors[this.currentWorld] || this.worldColors[0];
  }

  /**
   * Получить гравитацию текущего мира
   */
  getWorldGravity() {
    const gravities = {
      0: 1300, 1: 1200, 2: 1500, 3: 1400, 4: 800
    };
    return gravities[this.currentWorld] || 1300;
  }

  /**
   * Получить множитель скорости для текущего мира
   */
  getWorldSpeedMultiplier() {
    const multipliers = {
      0: 1.0, 1: 1.1, 2: 0.9, 3: 1.05, 4: 0.8
    };
    return multipliers[this.currentWorld] || 1.0;
  }

  /**
   * Получить специальный бонус мира
   */
  getWorldBonus() {
    const bonuses = {
      0: 'Нет',
      1: 'Неоновые огни',
      2: 'Тени',
      3: 'Астероиды',
      4: 'Черная дыра'
    };
    return bonuses[this.currentWorld] || 'Нет';
  }

  /**
   * Обновить статистику
   */
  updateStats(type, value = 1) {
    if (this.worldStats.hasOwnProperty(type)) {
      this.worldStats[type] += value;
    }
  }

  /**
   * Получить статистику мира
   */
  getWorldStats() {
    return { ...this.worldStats };
  }

  /**
   * Сбросить статистику
   */
  resetStats() {
    this.worldStats = {
      enemiesKilled: 0,
      gatesPassed: 0,
      timeSpent: 0,
      bestCombo: 0
    };
  }

  /**
   * Обновить время в мире (вызывать каждый кадр)
   */
  updateTime(delta) {
    this.worldStats.timeSpent += delta / 1000;
  }

  /**
   * Обновить лучший комбо
   */
  updateBestCombo(combo) {
    if (combo > this.worldStats.bestCombo) {
      this.worldStats.bestCombo = combo;
    }
  }

  /**
   * Получить прогресс мира в процентах
   */
  getWorldProgressPercent() {
    return Math.floor((this.currentLevel / 9) * 100);
  }

  /**
   * Получить следующий уровень
   */
  getNextLevel() {
    return this.currentLevel < 9 ? this.currentLevel + 1 : null;
  }

  /**
   * Проверить, доступен ли следующий уровень
   */
  hasNextLevel() {
    return this.currentLevel < 9;
  }

  /**
   * Получить название следующего уровня
   */
  getNextLevelName() {
    if (!this.hasNextLevel()) return null;
    return `${this.getWorldName()} - Уровень ${this.currentLevel + 2}`;
  }

  /**
   * Получить сложность для отображения
   */
  getDifficultyLabel() {
    const difficulty = this.difficultyMultiplier;
    if (difficulty < 1.2) return 'ЛЕГКО';
    if (difficulty < 1.5) return 'СРЕДНЕ';
    if (difficulty < 2.0) return 'СЛОЖНО';
    if (difficulty < 3.0) return 'ЭКСТРА';
    return 'БЕЗУМНО';
  }

  /**
   * Получить цвет сложности
   */
  getDifficultyColor() {
    const difficulty = this.difficultyMultiplier;
    if (difficulty < 1.2) return '#00ff00';
    if (difficulty < 1.5) return '#ffff00';
    if (difficulty < 2.0) return '#ff8800';
    if (difficulty < 3.0) return '#ff4444';
    return '#ff0000';
  }

  /**
   * Очистить все ресурсы (вызывать при уничтожении)
   */
  destroy() {
    this.stopWorldAnimations();
    this.clearWorldEffects();
    this.resetStats();
    this.worldTweens = [];
    this.atmosphereParticles = [];
    console.log('LevelManager destroyed');
  }
}