// src/entities/Asteroid.js
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class Asteroid {
  constructor(scene, x, y, speed = null, size = null, worldType = null) {
    this.scene = scene;
    this.worldType = worldType ?? (scene.levelManager?.currentWorld ?? 0);
    
    // Размер астероида
    this.size = size ?? Phaser.Math.FloatBetween(0.5, 1.8);
    
    // Скорость (фиксированная, без гравитации)
    const baseSpeed = speed ?? this.getBaseSpeed();
    this.speed = baseSpeed * (0.8 + Math.random() * 0.4);
    
    // Выбираем текстуру
    this.texture = this.getTexture();
    
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
    
    // Полоска здоровья (для крупных)
    if (this.size > 1.0) {
      this.createHealthBar();
    }
    
    // Визуальные эффекты для миров
    this.applyWorldVisuals();
    
    // Вращение
    this.rotationSpeed = Phaser.Math.Between(-2, 2);
  }

  getBaseSpeed() {
    // Базовая скорость астероида (медленнее, чтобы можно было уворачиваться)
    const baseSpeed = this.scene.baseSpeed || 240;
    // Астероиды летят медленнее скорости игры
    return baseSpeed * 0.6;
  }

  getTexture() {
    const textures = ['bg_asteroid_1', 'bg_asteroid_2', 'bg_asteroid_small'];
    return textures[Math.floor(Math.random() * textures.length)];
  }

  createSprite(x, y) {
    this.sprite = this.scene.physics.add.image(x, y, this.texture)
      .setScale(this.size)
      .setDepth(8);
    this.sprite.asteroidRef = this;
  }

  setupPhysics() {
    // Отключаем гравитацию полностью
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setGravityY(0);
    this.sprite.body.setCircle(14 * this.size);
    
    // Движение только влево с небольшим вертикальным смещением
    const verticalVariation = Phaser.Math.Between(-40, 40);
    this.sprite.setVelocityX(-this.speed);
    this.sprite.setVelocityY(verticalVariation);
    this.sprite.setAngularVelocity(Phaser.Math.Between(-80, 80));
    
    // Увеличиваем массу для стабильности
    this.sprite.body.setMass(1);
    this.sprite.body.setDrag(0);
  }

  getDamage() {
    return Math.max(1, Math.floor(this.size * 1.2));
  }

  getHealth() {
    return Math.max(1, Math.floor(this.size * 2));
  }

  getScoreValue() {
    return Math.max(1, Math.floor(this.size * 3));
  }

  applyWorldVisuals() {
    // Визуальные эффекты в зависимости от мира
    if (this.worldType === 1) {
      this.sprite.setTint(0xff44ff);
      this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    } else if (this.worldType === 2) {
      this.sprite.setTint(0xff6600);
      this.sprite.setBlendMode(Phaser.BlendModes.MULTIPLY);
    } else if (this.worldType === 3) {
      this.sprite.setTint(0xffaa44);
    } else if (this.worldType === 4) {
      this.sprite.setTint(0xaa88ff);
      this.sprite.setBlendMode(Phaser.BlendModes.SCREEN);
    }
  }

  createHealthBar() {
    const barWidth = 30;
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
        this.applyWorldVisuals();
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
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
    
    // Проверка выхода за границы (удаляем если улетел далеко влево или вверх/вниз)
    const bounds = this.scene.scale;
    if (this.sprite.x < -150 || 
        this.sprite.x > bounds.width + 200 ||
        this.sprite.y < -150 || 
        this.sprite.y > bounds.height + 150) {
      this.destroy();
      return false;
    }
    
    return true;
  }

  destroy(withExplosion = false) {
    if (withExplosion && this.scene.particleManager) {
      let explosionColor = 0xffaa00;
      if (this.worldType === 1) explosionColor = 0xff44ff;
      if (this.worldType === 2) explosionColor = 0xff6600;
      if (this.worldType === 3) explosionColor = 0xffaa44;
      if (this.worldType === 4) explosionColor = 0xaa88ff;
      
      let explosionSize = 'small';
      if (this.size > 1.2) explosionSize = 'medium';
      if (this.size > 1.8) explosionSize = 'large';
      
      this.scene.particleManager.createExplosion(
        this.sprite.x, this.sprite.y, explosionColor, explosionSize
      );
      
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

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getSize() {
    return this.size;
  }

  isActive() {
    return this.active && this.sprite && this.sprite.active;
  }
}