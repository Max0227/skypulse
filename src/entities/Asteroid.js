// src/entities/Asteroid.js
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class Asteroid {
  constructor(scene, x, y, worldType = null, level = 0) {
    this.scene = scene;
    this.worldType = worldType ?? (scene.levelManager?.currentWorld ?? 0);
    this.level = level; // уровень сложности (0-20)
    
    // Размер астероида (меньше = быстрее уничтожается)
    this.size = Phaser.Math.FloatBetween(0.4, 1.2);
    
    // Скорость зависит от уровня сложности (медленно в начале)
    this.speed = this.getBaseSpeed();
    
    // Тип астероида (обычный, огненный, ледяной)
    this.type = this.getAsteroidType();
    
    // Создаём спрайт
    this.createSprite(x, y);
    
    // Настройка физики (без гравитации)
    this.setupPhysics();
    
    // Характеристики
    this.active = true;
    this.damage = this.getDamage();
    this.health = this.getHealth();
    this.maxHealth = this.health;
    this.scoreValue = this.getScoreValue();
    
    // Полоска здоровья (для крупных астероидов)
    if (this.size > 0.8) {
      this.createHealthBar();
    }
    
    // Визуальные эффекты в зависимости от типа
    this.applyVisualEffects();
    
    // Вращение
    this.rotationSpeed = Phaser.Math.Between(-2, 2);
    
    // Таймер для пульсации
    this.pulseTimer = 0;
  }

  // =========================================================================
  // ОПРЕДЕЛЕНИЕ ХАРАКТЕРИСТИК
  // =========================================================================

  getBaseSpeed() {
    // Базовая скорость астероида (очень медленно в начале)
    const baseSpeed = this.scene.baseSpeed || 240;
    
    // Скорость зависит от уровня сложности (0.2 - 0.8 от скорости игры)
    const speedFactor = 0.2 + (this.level / 50); // от 0.2 до 0.6 на 20 уровне
    
    // Медленное нарастание сложности
    return baseSpeed * Math.min(0.8, speedFactor);
  }

  getAsteroidType() {
    const rand = Math.random();
    const levelBonus = this.level / 100;
    
    // Типы астероидов
    if (this.level >= 10 && rand < 0.15 + levelBonus) return 'fire';     // огненные (редкие)
    if (this.level >= 5 && rand < 0.1 + levelBonus) return 'ice';        // ледяные
    return 'normal'; // обычные
  }

  getDamage() {
    // Урон зависит от размера и типа
    let baseDamage = Math.floor(this.size * 1.2);
    
    if (this.type === 'fire') baseDamage = Math.floor(baseDamage * 1.5);
    if (this.type === 'ice') baseDamage = Math.floor(baseDamage * 0.8);
    
    return Math.max(1, baseDamage);
  }

  getHealth() {
    // Здоровье зависит от размера и типа
    let baseHealth = Math.floor(this.size * 3);
    
    if (this.type === 'fire') baseHealth = Math.floor(baseHealth * 1.3);
    if (this.type === 'ice') baseHealth = Math.floor(baseHealth * 1.5);
    
    return Math.max(1, baseHealth);
  }

  getScoreValue() {
    let baseValue = Math.floor(this.size * 8);
    
    if (this.type === 'fire') baseValue = Math.floor(baseValue * 1.5);
    if (this.type === 'ice') baseValue = Math.floor(baseValue * 1.3);
    
    return Math.max(1, baseValue);
  }

  // =========================================================================
  // СОЗДАНИЕ СПРАЙТА
  // =========================================================================

  createSprite(x, y) {
    // Выбираем текстуру в зависимости от типа
    let texture = 'bg_asteroid_1';
    
    if (this.type === 'fire') texture = 'fire_meteor';
    else if (this.type === 'ice') texture = 'ice_asteroid';
    else texture = Math.random() > 0.5 ? 'bg_asteroid_1' : 'bg_asteroid_2';
    
    this.sprite = this.scene.physics.add.image(x, y, texture)
      .setScale(this.size)
      .setDepth(8);
    
    this.sprite.asteroidRef = this;
  }

  setupPhysics() {
    // Полное отключение гравитации
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setGravityY(0);
    this.sprite.body.setCircle(14 * this.size);
    
    // Движение только влево с небольшим вертикальным смещением
    const verticalVariation = Phaser.Math.Between(-30, 30);
    this.sprite.setVelocityX(-this.speed);
    this.sprite.setVelocityY(verticalVariation * 0.5);
    this.sprite.setAngularVelocity(Phaser.Math.Between(-60, 60));
  }

  applyVisualEffects() {
    // Эффекты в зависимости от типа
    if (this.type === 'fire') {
      this.sprite.setTint(0xff6600);
      this.sprite.setBlendMode(Phaser.BlendModes.ADD);
      this.createFireTrail();
    } else if (this.type === 'ice') {
      this.sprite.setTint(0x88ccff);
      this.createIceTrail();
    } else if (this.worldType === 1) {
      this.sprite.setTint(0xff44ff);
    } else if (this.worldType === 2) {
      this.sprite.setTint(0xff6600);
    } else if (this.worldType === 4) {
      this.sprite.setTint(0xaa88ff);
    }
  }

  createFireTrail() {
    this.trailEmitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'flare', {
      speed: { min: 15, max: 35 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 250,
      quantity: 1,
      frequency: 40,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xff6600, 0xffaa44],
      follow: this.sprite,
      followOffset: { x: -12, y: 0 }
    });
  }

  createIceTrail() {
    this.trailEmitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'flare', {
      speed: { min: 10, max: 25 },
      scale: { start: 0.15, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 300,
      quantity: 1,
      frequency: 50,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0x88ccff, 0xaaddff],
      follow: this.sprite,
      followOffset: { x: -10, y: 0 }
    });
  }

  createHealthBar() {
    const barWidth = 30;
    const barHeight = 4;
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    
    let barColor = 0xffaa00;
    if (this.type === 'fire') barColor = 0xff6600;
    if (this.type === 'ice') barColor = 0x88ccff;
    
    graphics.fillStyle(barColor, 1);
    graphics.fillRect(0, 0, barWidth, barHeight);
    graphics.generateTexture('asteroid_health_bar', barWidth, barHeight);
    graphics.destroy();
    
    this.healthBar = this.scene.add.image(this.sprite.x, this.sprite.y - 15, 'asteroid_health_bar')
      .setScale(1, 0.5)
      .setDepth(20);
  }

  updateHealthBar() {
    if (!this.healthBar) return;
    
    const healthPercent = this.health / this.maxHealth;
    this.healthBar.setScale(healthPercent, 0.5);
    this.healthBar.setPosition(this.sprite.x, this.sprite.y - 15);
    
    if (healthPercent < 0.3) {
      this.healthBar.setTint(0xff0000);
    } else if (healthPercent < 0.6) {
      this.healthBar.setTint(0xffaa00);
    } else {
      this.healthBar.setTint(0x00ff00);
    }
  }

  // =========================================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // =========================================================================

  takeDamage(amount) {
    this.health -= amount;
    
    if (this.health <= 0) {
      this.destroy(true);
      return true;
    }
    
    // Визуальный эффект урона
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.clearTint();
        this.applyVisualEffects();
      }
    });
    
    // Эффект искр
    if (this.scene.particleManager && this.health > 0) {
      this.scene.particleManager.createAttackEffect(this.sprite.x, this.sprite.y);
    }
    
    // Звук удара
    try {
      audioManager.playSound(this.scene, 'hit_sound', 0.2);
    } catch (e) {}
    
    return false;
  }

  update() {
    if (!this.sprite || !this.sprite.active) {
      this.active = false;
      return false;
    }
    
    // Вращение
    this.sprite.rotation += this.rotationSpeed * 0.02;
    
    // Пульсация для огненных астероидов
    if (this.type === 'fire') {
      this.pulseTimer += 16;
      if (this.pulseTimer > 300) {
        this.pulseTimer = 0;
        this.sprite.setScale(this.size * (1 + Math.random() * 0.1));
        this.scene.time.delayedCall(100, () => {
          if (this.sprite) this.sprite.setScale(this.size);
        });
      }
    }
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
    
    // Проверка выхода за границы
    const bounds = this.scene.scale;
    if (this.sprite.x < -150) {
      this.destroy();
      return false;
    }
    
    return true;
  }

  destroy(withExplosion = false) {
    if (withExplosion && this.scene.particleManager) {
      let explosionColor = 0xffaa00;
      let explosionSize = 'small';
      
      if (this.type === 'fire') explosionColor = 0xff6600;
      if (this.type === 'ice') explosionColor = 0x88ccff;
      if (this.size > 0.8) explosionSize = 'medium';
      
      this.scene.particleManager.createExplosion(
        this.sprite.x, this.sprite.y, explosionColor, explosionSize
      );
      
      // Звук взрыва
      try {
        const volume = 0.2 + this.size * 0.1;
        audioManager.playSound(this.scene, 'explosion_sound', Math.min(0.5, volume));
      } catch (e) {}
      
      // Добавляем кристаллы
      if (this.scene.crystals !== undefined) {
        this.scene.crystals += this.scoreValue;
        if (this.scene.crystalText) {
          this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
        }
        gameManager.addCrystals(this.scoreValue);
      }
      
      // Комбо за уничтожение
      if (this.scene.comboSystem) {
        this.scene.comboSystem.add();
      }
    }
    
    // Удаляем трейл
    if (this.trailEmitter) {
      this.trailEmitter.stop();
      this.trailEmitter.destroy();
    }
    
    // Удаляем полоску здоровья
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    // Удаляем спрайт
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
    
    this.active = false;
  }

  // =========================================================================
  // ГЕТТЕРЫ
  // =========================================================================

  getPosition() {
    return { x: this.sprite?.x, y: this.sprite?.y };
  }

  getSize() {
    return this.size;
  }

  getType() {
    return this.type;
  }

  isActive() {
    return this.active && this.sprite && this.sprite.active;
  }
}