// src/entities/Asteroid.js
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class Asteroid {
  constructor(scene, x, y, speed = null, size = null, worldType = null) {
    this.scene = scene;
    this.worldType = worldType ?? (scene.levelManager?.currentWorld ?? 0);
    
    // Определяем тип препятствия в зависимости от мира
    this.obstacleType = this.getObstacleType();
    
    // Получаем конфигурацию для текущего мира и типа
    this.worldConfig = this.getWorldConfig();
    this.typeConfig = this.getTypeConfig();
    
    // Размер
    this.size = size ?? Phaser.Math.FloatBetween(this.typeConfig.minSize, this.typeConfig.maxSize);
    
    // Скорость
    const baseSpeed = speed ?? this.getSpeedForWorld();
    this.speed = baseSpeed * (1.5 - this.size * 0.3);
    
    // Создаём спрайт с учётом типа
    this.createSprite(x, y);
    
    // Настройка физики
    this.setupPhysics();
    
    // Характеристики
    this.active = true;
    this.damage = this.getDamage();
    this.health = this.getHealth();
    this.maxHealth = this.health;
    this.scoreValue = this.getScoreValue();
    
    // Специальные эффекты для разных миров
    this.specialEffect = this.typeConfig.specialEffect || null;
    this.effectTimer = 0;
    
    // Полоска здоровья (для крупных)
    if (this.size > 1.2 || this.worldType >= 3) {
      this.createHealthBar();
    }
    
    // Применяем визуальные эффекты мира
    this.applyWorldVisuals();
    
    // Создаём дополнительные эффекты для некоторых типов
    this.createSpecialEffects();
    
    // Вращение
    this.rotationSpeed = Phaser.Math.Between(-3, 3) * this.typeConfig.rotationMultiplier;
    
    // Для чёрной дыры - эффект притяжения
    this.isPulled = false;
    this.pullStrength = 0;
  }

  // =========================================================================
  // ОПРЕДЕЛЕНИЕ ТИПА ПРЕПЯТСТВИЯ
  // =========================================================================

  getObstacleType() {
    const typesByWorld = {
      0: ['asteroid'], // Космос - только астероиды
      1: ['laser_trap', 'energy_orb', 'neon_crystal'], // Киберпанк
      2: ['spike', 'dark_shadow', 'falling_rock'], // Подземелье
      3: ['meteor', 'rock_chunk', 'dust_cloud'], // Астероиды
      4: ['gravity_anomaly', 'void_fragment', 'dark_matter'] // Чёрная дыра
    };
    
    const availableTypes = typesByWorld[this.worldType] || typesByWorld[0];
    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    
    // Увеличиваем шанс специальных препятствий на сложных уровнях
    const gameLevel = this.scene.gameLevel || 0;
    if (gameLevel > 5 && Math.random() < 0.3) {
      return availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }
    
    return randomType;
  }

  getTypeConfig() {
    const configs = {
      // Космос
      asteroid: {
        textures: ['bg_asteroid_1', 'bg_asteroid_2'],
        minSize: 0.5,
        maxSize: 2.2,
        healthMultiplier: 1.0,
        damageMultiplier: 1.0,
        scoreMultiplier: 1.0,
        rotationMultiplier: 1,
        specialEffect: null,
        explosionColor: 0xffaa00,
        description: 'Обычный астероид'
      },
      
      // Киберпанк
      laser_trap: {
        textures: ['cyber_trap', 'neon_trap'],
        minSize: 0.6,
        maxSize: 1.2,
        healthMultiplier: 0.8,
        damageMultiplier: 1.5,
        scoreMultiplier: 1.3,
        rotationMultiplier: 0.5,
        specialEffect: 'laser_pulse',
        explosionColor: 0xff44ff,
        description: 'Лазерная ловушка'
      },
      energy_orb: {
        textures: ['energy_orb', 'neon_orb'],
        minSize: 0.4,
        maxSize: 0.9,
        healthMultiplier: 0.5,
        damageMultiplier: 2,
        scoreMultiplier: 1.5,
        rotationMultiplier: 2,
        specialEffect: 'pulse',
        explosionColor: 0x00ffff,
        description: 'Энергетическая сфера'
      },
      neon_crystal: {
        textures: ['neon_crystal'],
        minSize: 0.7,
        maxSize: 1.5,
        healthMultiplier: 1.2,
        damageMultiplier: 1.2,
        scoreMultiplier: 1.8,
        rotationMultiplier: 0.8,
        specialEffect: 'glow',
        explosionColor: 0xff88ff,
        description: 'Неоновый кристалл'
      },
      
      // Подземелье
      spike: {
        textures: ['spike_trap'],
        minSize: 0.5,
        maxSize: 1.0,
        healthMultiplier: 1.5,
        damageMultiplier: 1.8,
        scoreMultiplier: 1.2,
        rotationMultiplier: 0.3,
        specialEffect: 'spin',
        explosionColor: 0xff6600,
        description: 'Шипованная ловушка'
      },
      dark_shadow: {
        textures: ['dark_shadow'],
        minSize: 0.8,
        maxSize: 1.8,
        healthMultiplier: 1.3,
        damageMultiplier: 1.3,
        scoreMultiplier: 1.4,
        rotationMultiplier: 0.2,
        specialEffect: 'fade',
        explosionColor: 0x886644,
        description: 'Тёмная тень'
      },
      falling_rock: {
        textures: ['falling_rock'],
        minSize: 0.9,
        maxSize: 2.0,
        healthMultiplier: 1.8,
        damageMultiplier: 1.5,
        scoreMultiplier: 1.3,
        rotationMultiplier: 0.4,
        specialEffect: 'shake',
        explosionColor: 0xaa6644,
        description: 'Падающий камень'
      },
      
      // Астероиды
      meteor: {
        textures: ['bg_asteroid_1', 'fire_meteor'],
        minSize: 0.8,
        maxSize: 2.5,
        healthMultiplier: 1.2,
        damageMultiplier: 1.4,
        scoreMultiplier: 1.4,
        rotationMultiplier: 1.2,
        specialEffect: 'fire_trail',
        explosionColor: 0xffaa44,
        description: 'Огненный метеор'
      },
      rock_chunk: {
        textures: ['bg_asteroid_2', 'rock_chunk'],
        minSize: 0.4,
        maxSize: 1.2,
        healthMultiplier: 0.7,
        damageMultiplier: 1.0,
        scoreMultiplier: 1.0,
        rotationMultiplier: 1.5,
        specialEffect: 'fragment',
        explosionColor: 0xcc8866,
        description: 'Осколок породы'
      },
      dust_cloud: {
        textures: ['dust_cloud'],
        minSize: 1.0,
        maxSize: 2.0,
        healthMultiplier: 0.3,
        damageMultiplier: 0.5,
        scoreMultiplier: 0.8,
        rotationMultiplier: 0.1,
        specialEffect: 'slow_zone',
        explosionColor: 0xaa8866,
        description: 'Пылевое облако'
      },
      
      // Чёрная дыра
      gravity_anomaly: {
        textures: ['gravity_anomaly'],
        minSize: 0.6,
        maxSize: 1.4,
        healthMultiplier: 2.0,
        damageMultiplier: 2.0,
        scoreMultiplier: 2.0,
        rotationMultiplier: 0.6,
        specialEffect: 'gravity_pull',
        explosionColor: 0xaa88ff,
        description: 'Гравитационная аномалия'
      },
      void_fragment: {
        textures: ['void_fragment'],
        minSize: 0.5,
        maxSize: 1.2,
        healthMultiplier: 1.5,
        damageMultiplier: 1.8,
        scoreMultiplier: 1.6,
        rotationMultiplier: 0.8,
        specialEffect: 'warp',
        explosionColor: 0x8866cc,
        description: 'Осколок пустоты'
      },
      dark_matter: {
        textures: ['dark_matter'],
        minSize: 0.7,
        maxSize: 1.5,
        healthMultiplier: 2.5,
        damageMultiplier: 2.2,
        scoreMultiplier: 2.2,
        rotationMultiplier: 0.4,
        specialEffect: 'invisible',
        explosionColor: 0x6644aa,
        description: 'Тёмная материя'
      }
    };
    
    return configs[this.obstacleType] || configs.asteroid;
  }

  getWorldConfig() {
    const configs = {
      0: { speedMultiplier: 1.0, healthMultiplier: 1.0, damageMultiplier: 1.0, scoreMultiplier: 1.0 },
      1: { speedMultiplier: 1.3, healthMultiplier: 0.9, damageMultiplier: 1.2, scoreMultiplier: 1.2 },
      2: { speedMultiplier: 0.8, healthMultiplier: 1.4, damageMultiplier: 1.5, scoreMultiplier: 1.3 },
      3: { speedMultiplier: 1.4, healthMultiplier: 1.1, damageMultiplier: 1.3, scoreMultiplier: 1.4 },
      4: { speedMultiplier: 0.6, healthMultiplier: 1.6, damageMultiplier: 2.0, scoreMultiplier: 1.5 }
    };
    return configs[this.worldType] || configs[0];
  }

  // =========================================================================
  // СОЗДАНИЕ СПРАЙТА
  // =========================================================================

  createSprite(x, y) {
    const textures = this.typeConfig.textures;
    const texture = textures[Math.floor(Math.random() * textures.length)];
    
    this.sprite = this.scene.physics.add.image(x, y, texture)
      .setScale(this.size)
      .setDepth(8);
    
    this.sprite.asteroidRef = this;
    
    // Цветовой оттенок для разных миров
    if (this.worldType === 1) this.sprite.setTint(0xff44ff);
    if (this.worldType === 2) this.sprite.setTint(0xff6600);
    if (this.worldType === 3) this.sprite.setTint(0xffaa44);
    if (this.worldType === 4) this.sprite.setTint(0xaa88ff);
  }

  setupPhysics() {
    this.sprite.body.setCircle(15 * this.size);
    this.sprite.body.setAllowGravity(false);
    
    const angleVariation = this.getAngleVariation();
    const angle = Phaser.Math.FloatBetween(-angleVariation, angleVariation);
    
    this.sprite.setVelocityX(-this.speed * (0.6 + Math.random() * 0.5));
    this.sprite.setVelocityY(this.speed * angle);
    this.sprite.setAngularVelocity(Phaser.Math.Between(-150, 150) * this.typeConfig.rotationMultiplier);
  }

  getAngleVariation() {
    const variations = { 0: 0.8, 1: 1.0, 2: 0.5, 3: 1.2, 4: 0.3 };
    return variations[this.worldType] ?? 0.8;
  }

  getSpeedForWorld() {
    const baseSpeed = this.scene.baseSpeed || 240;
    return baseSpeed * this.worldConfig.speedMultiplier;
  }

  getDamage() {
    const baseDamage = Math.ceil(this.size * 0.8);
    return Math.max(1, Math.floor(baseDamage * this.worldConfig.damageMultiplier * this.typeConfig.damageMultiplier));
  }

  getHealth() {
    const baseHealth = Math.ceil(this.size * 2);
    return Math.max(1, Math.floor(baseHealth * this.worldConfig.healthMultiplier * this.typeConfig.healthMultiplier));
  }

  getScoreValue() {
    const baseValue = Math.floor(this.size * 5);
    return Math.floor(baseValue * this.worldConfig.scoreMultiplier * this.typeConfig.scoreMultiplier);
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================

  applyWorldVisuals() {
    // Эффект свечения для киберпанка
    if (this.worldType === 1) {
      this.sprite.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: { from: 0.8, to: 1.0 },
        duration: Phaser.Math.Between(200, 500),
        yoyo: true,
        repeat: -1,
      });
    }
    
    // Эффект тени для подземелья
    if (this.worldType === 2) {
      this.sprite.setBlendMode(Phaser.BlendModes.MULTIPLY);
    }
    
    // Для чёрной дыры
    if (this.worldType === 4) {
      this.pullStrength = 0.5 + Math.random() * 0.5;
      this.sprite.setBlendMode(Phaser.BlendModes.SCREEN);
    }
  }

  createSpecialEffects() {
    if (this.typeConfig.specialEffect === 'fire_trail' && this.worldType === 3) {
      this.trailEmitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'flare', {
        speed: { min: 20, max: 50 },
        scale: { start: 0.2, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 300,
        quantity: 1,
        frequency: 40,
        blendMode: Phaser.BlendModes.ADD,
        tint: [0xff6600, 0xffaa44],
        follow: this.sprite,
        followOffset: { x: -15, y: 0 }
      });
    }
    
    if (this.typeConfig.specialEffect === 'glow') {
      this.glowEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 20, 0xff44ff, 0.3);
      this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
      this.glowEffect.setDepth(7);
    }
  }

  createHealthBar() {
    const barWidth = 35;
    const barHeight = 4;
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    
    let barColor = 0xffaa00;
    if (this.worldType === 1) barColor = 0xff44ff;
    if (this.worldType === 2) barColor = 0xff6600;
    if (this.worldType === 3) barColor = 0xffaa44;
    if (this.worldType === 4) barColor = 0xaa88ff;
    
    graphics.fillStyle(barColor, 1);
    graphics.fillRect(0, 0, barWidth, barHeight);
    graphics.generateTexture('asteroid_health_bar', barWidth, barHeight);
    graphics.destroy();
    
    this.healthBar = this.scene.add.image(this.sprite.x, this.sprite.y - 20, 'asteroid_health_bar')
      .setScale(1, 0.5)
      .setDepth(20);
  }

  updateHealthBar() {
    if (!this.healthBar) return;
    
    const healthPercent = this.health / this.maxHealth;
    this.healthBar.setScale(healthPercent, 0.5);
    this.healthBar.setPosition(this.sprite.x, this.sprite.y - 20);
    
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
        if (this.worldType === 1) this.sprite.setTint(0xff44ff);
        if (this.worldType === 2) this.sprite.setTint(0xff6600);
        if (this.worldType === 3) this.sprite.setTint(0xffaa44);
        if (this.worldType === 4) this.sprite.setTint(0xaa88ff);
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
    this.sprite.rotation += this.rotationSpeed * 0.01;
    
    // Специальные эффекты
    this.updateSpecialEffects();
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
    
    // Обновляем свечение
    if (this.glowEffect) {
      this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
    }
    
    // Проверка выхода за границы
    const bounds = this.scene.scale;
    if (this.sprite.x < -200 || 
        this.sprite.x > bounds.width + 200 ||
        this.sprite.y < -200 || 
        this.sprite.y > bounds.height + 200) {
      this.destroy();
      return false;
    }
    
    return true;
  }

  updateSpecialEffects() {
    // Эффект притяжения для чёрной дыры
    if (this.worldType === 4 && this.scene.levelManager?.currentWorld === 4) {
      const centerX = this.scene.scale.width / 2;
      const centerY = this.scene.scale.height / 2;
      const dx = centerX - this.sprite.x;
      const dy = centerY - this.sprite.y;
      const distance = Math.hypot(dx, dy);
      
      if (distance < 300) {
        const angle = Math.atan2(dy, dx);
        const force = (1 - distance / 300) * this.pullStrength * 5;
        this.sprite.body.velocity.x += Math.cos(angle) * force;
        this.sprite.body.velocity.y += Math.sin(angle) * force;
        
        // Визуальный эффект искажения
        if (Math.random() < 0.05) {
          this.sprite.setScale(this.size * (1 + Math.random() * 0.1));
          this.scene.time.delayedCall(100, () => {
            if (this.sprite) this.sprite.setScale(this.size);
          });
        }
      }
    }
    
    // Эффект мерцания для киберпанка
    if (this.worldType === 1) {
      const time = Date.now() * 0.005;
      const intensity = 0.7 + Math.sin(time) * 0.3;
      this.sprite.setAlpha(intensity);
    }
    
    // Эффект пульсации для энергетических сфер
    if (this.typeConfig.specialEffect === 'pulse') {
      this.effectTimer += 16;
      if (this.effectTimer > 500) {
        this.effectTimer = 0;
        const pulse = this.scene.add.circle(this.sprite.x, this.sprite.y, 20, 0x00ffff, 0.5);
        pulse.setBlendMode(Phaser.BlendModes.ADD);
        this.scene.tweens.add({
          targets: pulse,
          radius: 40,
          alpha: 0,
          duration: 300,
          onComplete: () => pulse.destroy()
        });
      }
    }
    
    // Эффект замедления для пылевых облаков
    if (this.typeConfig.specialEffect === 'slow_zone' && this.scene.player) {
      const distToPlayer = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.scene.player.x, this.scene.player.y
      );
      if (distToPlayer < 50 && this.scene.player.body) {
        this.scene.player.body.velocity.x *= 0.98;
        this.scene.player.body.velocity.y *= 0.98;
      }
    }
  }

  destroy(withExplosion = false) {
    if (withExplosion && this.scene.particleManager) {
      let explosionColor = this.typeConfig.explosionColor;
      let explosionSize = 'medium';
      
      if (this.size > 1.2) explosionSize = 'large';
      if (this.size < 0.7) explosionSize = 'small';
      
      this.scene.particleManager.createExplosion(
        this.sprite.x, this.sprite.y, explosionColor, explosionSize
      );
      
      // Осколки
      const debrisCount = Math.floor(this.size * 5);
      for (let i = 0; i < debrisCount; i++) {
        this.createDebris();
      }
      
      // Звук взрыва
      try {
        const volume = 0.2 + this.size * 0.1;
        audioManager.playSound(this.scene, 'explosion_sound', Math.min(0.5, volume));
      } catch (e) {}
      
      // Добавляем кристаллы
      if (this.scene.crystals) {
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
    
    // Удаляем свечение
    if (this.glowEffect) {
      this.glowEffect.destroy();
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

  createDebris() {
    const colors = {
      0: 0x888888,
      1: 0xff88ff,
      2: 0xaa6644,
      3: 0xccaa88,
      4: 0xaa88ff,
    };
    
    const debris = this.scene.add.circle(
      this.sprite.x + Phaser.Math.Between(-25, 25),
      this.sprite.y + Phaser.Math.Between(-25, 25),
      Phaser.Math.Between(2, 6),
      colors[this.worldType] || 0x888888,
      0.7
    );
    
    debris.setBlendMode(Phaser.BlendModes.ADD);
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Phaser.Math.Between(50, 150);
    
    this.scene.tweens.add({
      targets: debris,
      x: debris.x + Math.cos(angle) * speed,
      y: debris.y + Math.sin(angle) * speed,
      alpha: 0,
      scale: 0,
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: () => debris.destroy()
    });
  }

  // =========================================================================
  // ГЕТТЕРЫ
  // =========================================================================

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getSize() {
    return this.size;
  }

  getType() {
    return this.obstacleType;
  }

  getDescription() {
    return this.typeConfig.description;
  }

  isActive() {
    return this.active && this.sprite && this.sprite.active;
  }
}