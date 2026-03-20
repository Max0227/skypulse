import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class Asteroid {
  constructor(scene, x, y, speed = null, size = null, worldType = null) {
    this.scene = scene;
    this.worldType = worldType || (scene.levelManager?.currentWorld ?? 0);
    
    // Определяем характеристики в зависимости от мира
    this.worldConfig = this.getWorldConfig();
    
    // Случайный выбор текстуры в зависимости от мира
    this.texture = this.getTextureForWorld();
    
    // Размер астероида
    this.size = size || Phaser.Math.FloatBetween(0.5, 2.2);
    
    // Скорость зависит от мира и размера
    const baseSpeed = speed || this.getSpeedForWorld();
    this.speed = baseSpeed * (1.5 - this.size * 0.3);
    
    // Создаём спрайт
    this.sprite = scene.physics.add.image(x, y, this.texture)
      .setScale(this.size)
      .setDepth(5);
    
    // Настройка физики
    this.sprite.body.setCircle(15 * this.size);
    this.sprite.body.setAllowGravity(false);
    
    // Направление движения (с учётом эффектов мира)
    const angleVariation = this.getAngleVariation();
    const angle = Phaser.Math.FloatBetween(-angleVariation, angleVariation);
    
    // Скорость по X и Y
    this.sprite.setVelocityX(-this.speed * (0.6 + Math.random() * 0.5));
    this.sprite.setVelocityY(this.speed * angle);
    this.sprite.setAngularVelocity(Phaser.Math.Between(-150, 150) * (this.size > 1 ? 0.5 : 1));
    
    // Ссылка на объект
    this.sprite.asteroidRef = this;
    
    // Характеристики в зависимости от мира и размера
    this.active = true;
    this.damage = this.getDamage();
    this.health = this.getHealth();
    this.maxHealth = this.health;
    this.scoreValue = this.getScoreValue();
    this.rarity = this.getRarity();
    
    // Цветовая гамма для мира
    this.colorTint = this.getColorTint();
    if (this.colorTint) {
      this.sprite.setTint(this.colorTint);
    }
    
    // Полоска здоровья (для крупных или в сложных мирах)
    if (this.size > 1.2 || this.worldType >= 3) {
      this.createHealthBar();
    }
    
    // Специальные эффекты для миров
    this.applyWorldEffects();
    
    // Эффект вращения
    this.rotationSpeed = Phaser.Math.Between(-3, 3);
    
    // Для чёрной дыры - эффект притяжения
    this.isPulled = false;
    this.pullStrength = 0;
    
    // Пылевой след (для астероидов в поле астероидов)
    this.trailEmitter = null;
    if (this.worldType === 3 && this.size < 1) {
      this.createTrail();
    }
  }

  // =========================================================================
  // КОНФИГУРАЦИЯ В ЗАВИСИМОСТИ ОТ МИРА
  // =========================================================================

  getWorldConfig() {
    const configs = {
      0: { // Космос
        speedMultiplier: 1.0,
        healthMultiplier: 1.0,
        damageMultiplier: 1.0,
        scoreMultiplier: 1.0,
        textures: ['bg_asteroid_1', 'bg_asteroid_2'],
        colors: [0x888888, 0xaaaaaa],
        special: null,
      },
      1: { // Киберпанк
        speedMultiplier: 1.3,
        healthMultiplier: 0.8,
        damageMultiplier: 1.2,
        scoreMultiplier: 1.2,
        textures: ['bg_asteroid_1', 'bg_asteroid_2'],
        colors: [0xff44ff, 0xaa44ff, 0x44aaff],
        special: 'neon',
      },
      2: { // Подземелье
        speedMultiplier: 0.8,
        healthMultiplier: 1.3,
        damageMultiplier: 1.5,
        scoreMultiplier: 1.3,
        textures: ['bg_asteroid_1', 'bg_asteroid_2'],
        colors: [0xaa6644, 0x884422, 0x663322],
        special: 'dark',
      },
      3: { // Астероиды
        speedMultiplier: 1.4,
        healthMultiplier: 1.2,
        damageMultiplier: 1.3,
        scoreMultiplier: 1.4,
        textures: ['bg_asteroid_1', 'bg_asteroid_2', 'bg_asteroid_small'],
        colors: [0xffaa66, 0xcc8866, 0xaa6644],
        special: 'fragment',
      },
      4: { // Чёрная дыра
        speedMultiplier: 0.6,
        healthMultiplier: 1.5,
        damageMultiplier: 2.0,
        scoreMultiplier: 1.5,
        textures: ['bg_asteroid_1', 'bg_asteroid_2'],
        colors: [0xaa88ff, 0x8866cc, 0x6644aa],
        special: 'gravity',
      },
    };
    return configs[this.worldType] || configs[0];
  }

  getTextureForWorld() {
    const textures = this.worldConfig.textures;
    const tex = textures[Math.floor(Math.random() * textures.length)];
    
    // Для мира астероидов используем специальную текстуру для мелких
    if (this.worldType === 3 && this.size < 0.8 && Math.random() > 0.7) {
      return 'bg_asteroid_small';
    }
    return tex;
  }

  getSpeedForWorld() {
    const baseSpeed = this.scene.baseSpeed || 240;
    return baseSpeed * this.worldConfig.speedMultiplier;
  }

  getAngleVariation() {
    const variations = {
      0: 0.8,   // Космос
      1: 1.0,   // Киберпанк
      2: 0.5,   // Подземелье
      3: 1.2,   // Астероиды
      4: 0.3,   // Чёрная дыра
    };
    return variations[this.worldType] || 0.8;
  }

  getDamage() {
    const baseDamage = Math.ceil(this.size * 0.8);
    return Math.max(1, Math.floor(baseDamage * this.worldConfig.damageMultiplier));
  }

  getHealth() {
    const baseHealth = Math.ceil(this.size * 2);
    return Math.max(1, Math.floor(baseHealth * this.worldConfig.healthMultiplier));
  }

  getScoreValue() {
    const baseValue = Math.floor(this.size * 5);
    return Math.floor(baseValue * this.worldConfig.scoreMultiplier);
  }

  getRarity() {
    if (this.size > 1.5) return 'legendary';
    if (this.size > 1.0) return 'epic';
    if (this.size > 0.6) return 'rare';
    return 'common';
  }

  getColorTint() {
    if (this.worldType === 1 && this.worldConfig.special === 'neon') {
      const colors = this.worldConfig.colors;
      return colors[Math.floor(Math.random() * colors.length)];
    }
    if (this.worldType === 2) {
      const colors = this.worldConfig.colors;
      return colors[Math.floor(Math.random() * colors.length)];
    }
    if (this.worldType === 4) {
      const colors = this.worldConfig.colors;
      return colors[Math.floor(Math.random() * colors.length)];
    }
    return null;
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================

  createHealthBar() {
    const barWidth = 35;
    const barHeight = 4;
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Цвет полоски в зависимости от мира
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

  applyWorldEffects() {
    // Эффект свечения для киберпанка
    if (this.worldType === 1 && this.colorTint) {
      this.sprite.setBlendMode(Phaser.BlendModes.ADD);
      
      // Мерцание
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
    
    // Для чёрной дыры - сохраняем силу притяжения
    if (this.worldType === 4) {
      this.pullStrength = 0.5 + Math.random() * 0.5;
      this.sprite.setBlendMode(Phaser.BlendModes.SCREEN);
    }
  }

  createTrail() {
    const colors = [0xffaa66, 0xcc8866, 0xaa6644];
    this.trailEmitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'flare', {
      speed: { min: 10, max: 30 },
      scale: { start: 0.15, end: 0 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 300,
      quantity: 1,
      frequency: 50,
      blendMode: Phaser.BlendModes.ADD,
      tint: colors,
    });
    this.trailEmitter.startFollow(this.sprite, -10, 0);
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
    
    // Визуальный эффект урона в зависимости от мира
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite && this.sprite.active) {
        if (this.colorTint) {
          this.sprite.setTint(this.colorTint);
        } else {
          this.sprite.clearTint();
        }
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
    
    // Специальные эффекты для миров
    this.updateWorldEffects();
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
    
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

  updateWorldEffects() {
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
  }

  destroy(withExplosion = false) {
    if (withExplosion && this.scene.particleManager) {
      // Тип взрыва зависит от мира
      let explosionColor = 0xffaa00;
      let explosionSize = 'medium';
      
      if (this.worldType === 1) explosionColor = 0xff44ff;
      if (this.worldType === 2) explosionColor = 0xff6600;
      if (this.worldType === 3) explosionColor = 0xffaa44;
      if (this.worldType === 4) explosionColor = 0xaa88ff;
      
      if (this.size > 1.2) explosionSize = 'large';
      if (this.size < 0.7) explosionSize = 'small';
      
      this.scene.particleManager.createExplosion(
        this.sprite.x, 
        this.sprite.y, 
        explosionColor,
        explosionSize
      );
      
      // Осколки в зависимости от размера
      const debrisCount = Math.floor(this.size * 5);
      for (let i = 0; i < debrisCount; i++) {
        this.createDebris();
      }
      
      // Звук взрыва
      try {
        const volume = 0.2 + this.size * 0.1;
        audioManager.playSound(this.scene, 'explosion_sound', Math.min(0.5, volume));
      } catch (e) {}
      
      // Добавляем кристаллы за уничтожение
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
    
    // Анимация разлета
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
    return this.rarity;
  }

  isActive() {
    return this.active && this.sprite && this.sprite.active;
  }
}