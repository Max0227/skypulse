// src/entities/Asteroid.js
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class Asteroid {
  constructor(scene, x, y, worldType = null, level = 0) {
    this.scene = scene;
    this.worldType = worldType ?? (scene.levelManager?.currentWorld ?? 0);
    this.level = Math.min(level, 20);
    
    // Размер астероида (0.3 - 1.5)
    this.size = Phaser.Math.FloatBetween(0.4, 1.3);
    
    // Тип астероида
    this.type = this.getAsteroidType();
    
    // Скорость (медленная, без гравитации)
    this.speed = this.getBaseSpeed();
    
    // Создаём спрайт
    this.createSprite(x, y);
    
    // Настройка физики (полное отключение гравитации)
    this.setupPhysics();
    
    // Характеристики
    this.active = true;
    this.damage = this.getDamage();
    this.health = this.getHealth();
    this.maxHealth = this.health;
    this.scoreValue = this.getScoreValue();
    
    // Полоска здоровья для крупных
    if (this.size > 0.8) {
      this.createHealthBar();
    }
    
    // Визуальные эффекты
    this.applyVisualEffects();
    
    // Вращение
    this.rotationSpeed = Phaser.Math.Between(-1.5, 1.5);
    
    // Таймеры для эффектов
    this.pulseTimer = 0;
    this.wobbleTimer = 0;
    this.wobbleOffset = 0;
    
    // Начальное вертикальное смещение (для плавного полёта)
    this.verticalDrift = Phaser.Math.Between(-20, 20);
    this.driftSpeed = Phaser.Math.FloatBetween(0.2, 0.8);
  }

  // =========================================================================
  // ОПРЕДЕЛЕНИЕ ТИПА И ХАРАКТЕРИСТИК
  // =========================================================================

  getAsteroidType() {
    const rand = Math.random();
    const levelBonus = this.level / 100;
    
    if (this.level >= 12 && rand < 0.12 + levelBonus) return 'void';      // редкие
    if (this.level >= 8 && rand < 0.1 + levelBonus) return 'fire';        // огненные
    if (this.level >= 4 && rand < 0.08 + levelBonus) return 'ice';        // ледяные
    return 'normal';
  }

  getBaseSpeed() {
    const baseSpeed = this.scene.baseSpeed || 240;
    // Скорость 0.2 - 0.5 от скорости игры (медленно)
    const speedFactor = 0.2 + (this.level / 60);
    return baseSpeed * Math.min(0.55, speedFactor);
  }

  getDamage() {
    let damage = Math.floor(this.size * 1.2);
    if (this.type === 'fire') damage = Math.floor(damage * 1.4);
    if (this.type === 'void') damage = Math.floor(damage * 1.6);
    return Math.max(1, damage);
  }

  getHealth() {
    let health = Math.floor(this.size * 2.5);
    if (this.type === 'ice') health = Math.floor(health * 1.4);
    if (this.type === 'void') health = Math.floor(health * 1.8);
    return Math.max(1, health);
  }

  getScoreValue() {
    let value = Math.floor(this.size * 6);
    if (this.type === 'fire') value = Math.floor(value * 1.4);
    if (this.type === 'ice') value = Math.floor(value * 1.3);
    if (this.type === 'void') value = Math.floor(value * 2);
    return Math.max(1, value);
  }

  // =========================================================================
  // СОЗДАНИЕ СПРАЙТА И ФИЗИКИ
  // =========================================================================

  createSprite(x, y) {
    let texture = 'bg_asteroid_1';
    
    if (this.type === 'fire') texture = 'fire_meteor';
    else if (this.type === 'ice') texture = 'ice_asteroid';
    else if (this.type === 'void') texture = 'void_fragment';
    else texture = Math.random() > 0.5 ? 'bg_asteroid_1' : 'bg_asteroid_2';
    
    this.sprite = this.scene.physics.add.image(x, y, texture)
      .setScale(this.size)
      .setDepth(8);
    
    this.sprite.asteroidRef = this;
  }

  setupPhysics() {
    // ===== ПОЛНОЕ ОТКЛЮЧЕНИЕ ГРАВИТАЦИИ =====
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setGravityY(0);
    this.sprite.body.setGravityX(0);
    
    // Размер коллизии
    this.sprite.body.setCircle(14 * this.size);
    
    // ===== ДВИЖЕНИЕ ТОЛЬКО ВЛЕВО С МИНИМАЛЬНЫМ ВЕРТИКАЛЬНЫМ СМЕЩЕНИЕМ =====
    // Горизонтальная скорость
    this.sprite.setVelocityX(-this.speed);
    
    // Вертикальная скорость (минимальная, плавное парение)
    const verticalSpeed = Phaser.Math.Between(-15, 15);
    this.sprite.setVelocityY(verticalSpeed);
    
    // Медленное вращение
    this.sprite.setAngularVelocity(Phaser.Math.Between(-40, 40));
    
    // Отключаем трение
    this.sprite.body.setDrag(0);
    this.sprite.body.setDragX(0);
    this.sprite.body.setDragY(0);
  }

  applyVisualEffects() {
    // Эффекты в зависимости от типа
    if (this.type === 'fire') {
      this.sprite.setTint(0xff6600);
      this.sprite.setBlendMode(Phaser.BlendModes.ADD);
      this.createFireTrail();
    } 
    else if (this.type === 'ice') {
      this.sprite.setTint(0x88ccff);
      this.createIceTrail();
    }
    else if (this.type === 'void') {
      this.sprite.setTint(0xaa88ff);
      this.sprite.setBlendMode(Phaser.BlendModes.SCREEN);
      this.createVoidTrail();
    }
    else if (this.worldType === 1) {
      this.sprite.setTint(0xff44ff);
    }
    else if (this.worldType === 2) {
      this.sprite.setTint(0xff6600);
    }
    else if (this.worldType === 4) {
      this.sprite.setTint(0xaa88ff);
    }
  }

  createFireTrail() {
    this.trailEmitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'flare', {
      speed: { min: 10, max: 25 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 250,
      quantity: 1,
      frequency: 35,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xff6600, 0xffaa44],
      follow: this.sprite,
      followOffset: { x: -12, y: 0 }
    });
  }

  createIceTrail() {
    this.trailEmitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'flare', {
      speed: { min: 5, max: 15 },
      scale: { start: 0.15, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 300,
      quantity: 1,
      frequency: 45,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0x88ccff, 0xaaddff],
      follow: this.sprite,
      followOffset: { x: -10, y: 0 }
    });
  }

  createVoidTrail() {
    this.trailEmitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'spark', {
      speed: { min: 8, max: 20 },
      scale: { start: 0.12, end: 0 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 280,
      quantity: 1,
      frequency: 40,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xaa88ff, 0x8866cc],
      follow: this.sprite,
      followOffset: { x: -8, y: 0 }
    });
  }

  createHealthBar() {
    const barWidth = 32;
    const barHeight = 4;
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    
    let barColor = 0xffaa00;
    if (this.type === 'fire') barColor = 0xff6600;
    if (this.type === 'ice') barColor = 0x88ccff;
    if (this.type === 'void') barColor = 0xaa88ff;
    
    graphics.fillStyle(barColor, 1);
    graphics.fillRect(0, 0, barWidth, barHeight);
    graphics.generateTexture('asteroid_health_bar', barWidth, barHeight);
    graphics.destroy();
    
    this.healthBar = this.scene.add.image(this.sprite.x, this.sprite.y - 18, 'asteroid_health_bar')
      .setScale(1, 0.5)
      .setDepth(20);
  }

  updateHealthBar() {
    if (!this.healthBar) return;
    
    const healthPercent = this.health / this.maxHealth;
    this.healthBar.setScale(healthPercent, 0.5);
    this.healthBar.setPosition(this.sprite.x, this.sprite.y - 18);
    
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
    
    // ===== ПЛАВНОЕ ВРАЩЕНИЕ =====
    this.sprite.rotation += this.rotationSpeed * 0.02;
    
    // ===== ПЛАВНОЕ КОЛЕБАНИЕ ВЕРТИКАЛИ (парящий эффект) =====
    this.wobbleTimer += 0.03;
    this.wobbleOffset = Math.sin(this.wobbleTimer) * 0.8;
    
    if (this.sprite.body) {
      // Небольшая корректировка вертикальной скорости для парения
      const currentVy = this.sprite.body.velocity.y;
      const targetVy = this.verticalDrift * this.driftSpeed + this.wobbleOffset;
      this.sprite.body.velocity.y += (targetVy - currentVy) * 0.05;
    }
    
    // Пульсация для огненных астероидов
    if (this.type === 'fire') {
      this.pulseTimer += 16;
      if (this.pulseTimer > 400) {
        this.pulseTimer = 0;
        this.sprite.setScale(this.size * (1 + Math.random() * 0.08));
        this.scene.time.delayedCall(100, () => {
          if (this.sprite) this.sprite.setScale(this.size);
        });
      }
    }
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
    
    // Проверка выхода за границы (удаляем когда улетел далеко влево)
    if (this.sprite.x < -200) {
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
      if (this.type === 'void') explosionColor = 0xaa88ff;
      if (this.size > 0.9) explosionSize = 'medium';
      
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