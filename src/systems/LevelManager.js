import { LEVEL_CONFIG } from '../config';

export class LevelManager {
  constructor(scene) {
    this.scene = scene;
    this.currentLevel = 0;
    this.currentWorld = 0;
    this.levelConfig = LEVEL_CONFIG;
    this.difficultyMultiplier = 1;
  }

  setWorld(world) {
    this.currentWorld = world;
    this.applyWorldTheme();
  }

  setLevel(level) {
    this.currentLevel = Math.min(level, 9);
    this.applyLevelDifficulty();
  }

  applyWorldTheme() {
    const config = this.levelConfig[this.currentWorld];
    if (!config) return;
    
    this.scene.cameras.main.setBackgroundColor(config.bgColor);
    this.scene.gateColors = config.gateColors;
    this.scene.currentWorldConfig = config;
    
    // Применяем специальные эффекты мира
    switch(config.specialEvent) {
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
        break;
    }
  }

  applyNeonEffect() {
    // Добавляем неоновые огни
    this.scene.lights.enable();
    this.scene.lights.setAmbientColor(0x1a0a2a);
    
    // Создаем несколько источников света
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(100, this.scene.scale.width - 100);
      const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
      this.scene.lights.addLight(x, y, 200).setColor(0xff00ff).setIntensity(1.5);
    }
  }

  applyDungeonEffect() {
    // Добавляем эффект тумана
    this.scene.cameras.main.setBackgroundColor(0x2a1a0a);
    
    // Создаем тени
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(0, this.scene.scale.width);
      const y = Phaser.Math.Between(0, this.scene.scale.height);
      const shadow = this.scene.add.circle(x, y, 50, 0x000000, 0.3);
      shadow.setDepth(-20);
      this.scene.shadows = this.scene.shadows || [];
      this.scene.shadows.push(shadow);
    }
  }

  applyAsteroidEffect() {
    // Увеличиваем шанс спавна астероидов
    this.scene.baseAsteroidChance = 0.7;
  }

  applyBlackHoleEffect() {
    // Добавляем эффект искажения
    this.scene.cameras.main.setBackgroundColor(0x000000);
    
    // Создаем эффект черной дыры
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;
    
    for (let i = 0; i < 5; i++) {
      const ring = this.scene.add.circle(centerX, centerY, 100 + i * 30, 0x000000, 0);
      ring.setStrokeStyle(2, 0x660066, 1 - i * 0.15);
      ring.setDepth(-30);
      ring.setScrollFactor(0);
      this.scene.blackHoleRings = this.scene.blackHoleRings || [];
      this.scene.blackHoleRings.push(ring);
    }
  }

  applyLevelDifficulty() {
    // Увеличиваем сложность с каждым уровнем
    this.difficultyMultiplier = 1 + (this.currentLevel * 0.1);
    
    // Обновляем параметры игры
    this.scene.baseSpeed = 240 * this.difficultyMultiplier;
    this.scene.spawnDelay = Math.max(300, 1500 / this.difficultyMultiplier);
    this.scene.coinChance = Math.min(0.9, 0.8 * this.difficultyMultiplier);
    this.scene.asteroidChance = Math.min(0.8, 0.3 * this.difficultyMultiplier);
    this.scene.powerUpChance = Math.min(0.5, 0.1 * this.difficultyMultiplier);
    
    if (!this.scene.bonusActive) {
      this.scene.currentSpeed = this.scene.baseSpeed;
    }
  }

  getCurrentTheme() {
    return this.levelConfig[this.currentWorld]?.theme || 'space';
  }

  getLevelName() {
    return `${this.levelConfig[this.currentWorld]?.name} - Уровень ${this.currentLevel + 1}`;
  }

  getWorldName() {
    return this.levelConfig[this.currentWorld]?.name || 'Неизвестный мир';
  }

  getWorldDescription() {
    return this.levelConfig[this.currentWorld]?.description || '';
  }

  getGoalScore() {
    return this.levelConfig[this.currentWorld]?.goalScore * (this.currentLevel + 1) || 500;
  }

  getEnemyTypes() {
    return this.levelConfig[this.currentWorld]?.enemyTypes || [];
  }

  shouldSpawnEnemy() {
    const types = this.getEnemyTypes();
    if (types.length === 0) return false;
    
    // Шанс спавна врага увеличивается с уровнем
    const spawnChance = 0.1 + (this.currentLevel * 0.05);
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
}