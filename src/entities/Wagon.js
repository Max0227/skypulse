// src/entities/Wagon.js
import Phaser from 'phaser';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class Wagon {
  constructor(scene, x, y, index, worldType = null) {
    this.scene = scene;
    this.index = index;
    this.worldType = worldType ?? (scene.levelManager?.currentWorld ?? 0);
    
    // Конфигурация мира
    this.worldConfig = this.getWorldConfig();
    
    // Текстура
    this.texture = this.getTextureForWorld();
    
    // Создаём спрайт
    this.sprite = scene.physics.add.image(x, y, this.texture)
      .setScale(0.75)
      .setDepth(5 + index);
    
    // Настройка физики
    this.setupPhysics();
    
    // Визуальные эффекты
    this.setupVisuals();
    
    // Ссылка на объект
    this.sprite.wagonRef = this;
    
    // Характеристики
    this.hp = this.getMaxHealth();
    this.maxHp = this.hp;
    this.active = true;
    this.isConnected = true;
    this.invincibleFrames = 0;
    this.invincibleDuration = 500;
    
    // Множитель монет
    this.coinMultiplier = 1 + (this.index + 1) * 0.5;
    
    // Параметры следования (расстояние увеличено)
    this.targetDistance = 48;      // увеличенное расстояние между вагонами
    this.smoothSpeed = 0.12;       // плавность движения
    
    // Скорость вагона
    this.velocity = { x: 0, y: 0 };
    this.targetX = x;
    this.targetY = y;
    
    // Спецэффекты
    this.glowEffect = null;
    this.trailEmitter = null;
    
    // Визуальные индикаторы
    this.multiplierIndicator = null;
    
    // Создаём индикатор множителя
    this.createMultiplierIndicator();
    
    // Создаём след
    this.createTrail();
    
    // Применяем визуальные эффекты мира
    this.applyWorldVisuals();
    
    // Анимация появления
    this.animateSpawn();
    
    // Звук появления
    this.playSpawnSound();
  }
  
  // =========================================================================
  // КОНФИГУРАЦИЯ
  // =========================================================================
  
  getWorldConfig() {
    const configs = {
      0: { color: 0x88aaff, glowColor: 0x44aaff, textureSet: 'space', effect: 'normal', particleColor: 0x44aaff, gravity: 0, drag: 0.95 },
      1: { color: 0xff44ff, glowColor: 0xff88ff, textureSet: 'neon', effect: 'neon', particleColor: 0xff44ff, gravity: 0, drag: 0.92 },
      2: { color: 0xaa6644, glowColor: 0xcc8866, textureSet: 'dark', effect: 'dark', particleColor: 0xff6600, gravity: 200, drag: 0.98 },
      3: { color: 0xffaa66, glowColor: 0xffcc88, textureSet: 'rocky', effect: 'rocky', particleColor: 0xffaa44, gravity: 100, drag: 0.96 },
      4: { color: 0xaa88ff, glowColor: 0xcc88ff, textureSet: 'void', effect: 'void', particleColor: 0xaa88ff, gravity: 0, drag: 0.9 },
    };
    return configs[this.worldType] || configs[0];
  }
  
  getTextureForWorld() {
    const textureMaps = {
      space: ['wagon_0', 'wagon_1', 'wagon_2', 'wagon_3', 'wagon_4', 'wagon_5', 'wagon_6', 'wagon_7', 'wagon_8', 'wagon_9'],
      neon: ['wagon_neon_0', 'wagon_neon_1', 'wagon_neon_2', 'wagon_neon_3', 'wagon_neon_4'],
      dark: ['wagon_dark_0', 'wagon_dark_1', 'wagon_dark_2', 'wagon_dark_3'],
      rocky: ['wagon_rock_0', 'wagon_rock_1', 'wagon_rock_2', 'wagon_rock_3'],
      void: ['wagon_void_0', 'wagon_void_1', 'wagon_void_2', 'wagon_void_3'],
    };
    const textures = textureMaps[this.worldConfig.textureSet] || textureMaps.space;
    const texIndex = this.index % textures.length;
    return this.scene.textures.exists(textures[texIndex]) ? textures[texIndex] : `wagon_${this.index % 10}`;
  }
  
  setupPhysics() {
    this.sprite.body.setCircle(14, 8, 6);
    this.sprite.body.setMass(0.6);
    this.sprite.body.setDrag(this.worldConfig.drag);
    this.sprite.body.setBounce(0.4);
    this.sprite.body.setAllowGravity(this.worldConfig.gravity > 0);
    if (this.worldConfig.gravity > 0) {
      this.sprite.body.setGravityY(this.worldConfig.gravity);
    }
  }
  
  setupVisuals() {
    this.sprite.setTint(this.worldConfig.color);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    
    if (this.index % 3 === 0 && this.worldType === 1) {
      this.glowEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 22, this.worldConfig.glowColor, 0.35);
      this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
      this.glowEffect.setDepth(4);
    }
  }
  
  createTrail() {
    this.trailEmitter = this.scene.add.particles(0, 0, 'flare', {
      speed: { min: 15, max: 35 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 250,
      quantity: 1,
      frequency: 35,
      blendMode: Phaser.BlendModes.ADD,
      tint: this.worldConfig.color,
      follow: this.sprite,
      followOffset: { x: -12, y: 0 }
    });
  }
  
  getMaxHealth() {
    let baseHealth = 1;
    const upgradeLevel = gameManager.getUpgradeLevel?.('wagonHP') || 0;
    baseHealth += upgradeLevel;
    const skinStats = gameManager.getCurrentSkinStats?.();
    if (skinStats?.armorBonus) {
      baseHealth += Math.floor(skinStats.armorBonus / 10);
    }
    return Math.max(1, baseHealth);
  }
  
  getSpecialEffects() {
    const effects = [];
    if (this.worldType === 1 && this.index % 2 === 0) effects.push('glow');
    if (this.worldType === 2 && this.index % 3 === 0) effects.push('shadow');
    if (this.worldType === 3 && this.index % 4 === 0) effects.push('rock_armor');
    if (this.worldType === 4 && this.index % 5 === 0) effects.push('void_energy');
    return effects;
  }
  
  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================
  
  createMultiplierIndicator() {
    this.multiplierIndicator = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 30,
      `x${this.coinMultiplier.toFixed(1)}`,
      {
        fontSize: '12px',
        fontFamily: "'Audiowide', sans-serif",
        color: '#ffaa00',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: { blur: 5, color: '#ffaa00', fill: true }
      }
    ).setOrigin(0.5).setDepth(20);
    
    this.scene.tweens.add({
      targets: this.multiplierIndicator,
      scale: { from: 0.8, to: 1 },
      alpha: { from: 0.7, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  updateMultiplierIndicator() {
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 30);
    }
  }
  
  applyWorldVisuals() {
    if (this.worldType === 1 && this.glowEffect) {
      this.scene.tweens.add({
        targets: this.glowEffect,
        alpha: { from: 0.2, to: 0.6 },
        scale: { from: 1, to: 1.3 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (this.glowEffect && this.sprite?.active) {
            this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
          }
        }
      });
    }
  }
  
  animateSpawn() {
    this.sprite.setAlpha(0);
    this.sprite.setScale(0);
    if (this.multiplierIndicator) this.multiplierIndicator.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scaleX: 0.75,
      scaleY: 0.75,
      duration: 450,
      ease: 'Back.out',
      onUpdate: () => {
        if (this.multiplierIndicator) {
          this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 30);
          this.multiplierIndicator.setAlpha(this.sprite.alpha);
        }
      },
      onComplete: () => {
        if (this.trailEmitter) {
          this.trailEmitter.start();
        }
      }
    });
  }
  
  playSpawnSound() {
    try { audioManager.playSound(this.scene, 'wagon_spawn', 0.35); } catch(e) {}
  }
  
  // =========================================================================
  // ЗДОРОВЬЕ И УРОН
  // =========================================================================
  
  setHP(hp, maxHp) {
    this.hp = hp;
    this.maxHp = maxHp;
    this.sprite.setData('hp', hp);
    this.sprite.setData('maxHP', maxHp);
  }
  
  takeDamage(amount = 1) {
    if (this.invincibleFrames > 0 || !this.isConnected) return false;
    
    this.hp -= amount;
    
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    
    this.invincibleFrames = this.invincibleDuration;
    this.showDamageEffect();
    this.playDamageSound();
    return false;
  }
  
  showDamageEffect() {
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite?.active) this.sprite.setTint(this.worldConfig.color);
    });
    
    for (let i = 0; i < 6; i++) {
      const spark = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-18, 18),
        this.sprite.y + Phaser.Math.Between(-18, 18),
        Phaser.Math.Between(2, 4),
        this.worldConfig.particleColor,
        0.8
      );
      spark.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        scale: 0,
        x: spark.x + Phaser.Math.Between(-40, 40),
        y: spark.y + Phaser.Math.Between(-40, 40),
        duration: 350,
        onComplete: () => spark.destroy()
      });
    }
  }
  
  playDamageSound() {
    try { audioManager.playSound(this.scene, 'hit_sound', 0.25); } catch(e) {}
  }
  
  // =========================================================================
  // ОБНОВЛЕНИЕ (САМОСТОЯТЕЛЬНАЯ ФИЗИКА)
  // =========================================================================
  
  update(prevX, prevY, gap) {
    if (!this.sprite?.active) {
      this.active = false;
      return;
    }
    
    // Неуязвимость (мерцание)
    if (this.invincibleFrames > 0) {
      this.invincibleFrames -= 16;
      this.sprite.setAlpha(this.invincibleFrames % 100 < 50 ? 0.6 : 1);
    } else {
      this.sprite.setAlpha(1);
    }
    
    // ===== САМОСТОЯТЕЛЬНАЯ ФИЗИКА =====
    // Целевая позиция (позади предыдущего объекта)
    const targetX = prevX - gap;
    const targetY = prevY;
    
    // Расстояние до цели
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const distance = Math.hypot(dx, dy);
    
    // Сила притяжения к цели
    let force = 0;
    if (distance > this.targetDistance) {
      force = Math.min(0.15, (distance - this.targetDistance) * 0.008);
    } else if (distance < this.targetDistance - 10) {
      force = -0.05;
    }
    
    const angle = Math.atan2(dy, dx);
    
    // Применяем силу
    if (force !== 0) {
      this.velocity.x += Math.cos(angle) * force * 2;
      this.velocity.y += Math.sin(angle) * force * 2;
    }
    
    // Затухание
    this.velocity.x *= 0.96;
    this.velocity.y *= 0.96;
    
    // Применяем скорость
    this.sprite.x += this.velocity.x;
    this.sprite.y += this.velocity.y;
    
    // Добавляем лёгкое болтание
    this.sprite.y += Math.sin(Date.now() * 0.004 + this.index) * 0.8;
    
    // Поворот в направлении движения
    if (Math.abs(this.velocity.x) > 0.5 || Math.abs(this.velocity.y) > 0.5) {
      const moveAngle = Math.atan2(this.velocity.y, this.velocity.x);
      this.sprite.rotation += (moveAngle * 0.4 - this.sprite.rotation) * 0.1;
    }
    
    // Обновляем физическое тело
    if (this.sprite.body) {
      this.sprite.body.setVelocity(this.velocity.x, this.velocity.y);
      this.sprite.body.reset(this.sprite.x, this.sprite.y);
    }
    
    // Обновляем индикатор множителя
    this.updateMultiplierIndicator();
    
    // Обновляем свечение
    if (this.glowEffect) {
      this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
    }
  }
  
  // =========================================================================
  // УПРАВЛЕНИЕ МНОЖИТЕЛЕМ И ОТЦЕПЛЕНИЕМ
  // =========================================================================
  
  updateMultiplierAfterDetach(newIndex) {
    this.index = newIndex;
    this.coinMultiplier = 1 + (this.index + 1) * 0.5;
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setText(`x${this.coinMultiplier.toFixed(1)}`);
    }
  }
  
  getCurrentMultiplier() {
    return this.isConnected ? this.coinMultiplier : 1;
  }
  
  detach() {
    this.isConnected = false;
    this.sprite.setTint(0x666666);
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setColor('#888888');
      this.multiplierIndicator.setText(`x1.0`);
    }
    this.playDetachSound();
    
    // Импульс отцепления
    this.velocity.x = -200;
    this.velocity.y = Phaser.Math.Between(-80, 80);
  }
  
  playDetachSound() {
    try { audioManager.playSound(this.scene, 'wagon_destroy', 0.45); } catch(e) {}
  }
  
  destroy() {
    if (this.trailEmitter) {
      this.trailEmitter.stop();
      this.trailEmitter.destroy();
    }
    if (this.glowEffect) this.glowEffect.destroy();
    if (this.multiplierIndicator) this.multiplierIndicator.destroy();
    
    if (this.sprite?.active) {
      if (this.scene.particleManager) {
        this.scene.particleManager.createWagonDestroyEffect(this.sprite);
      }
      try { audioManager.playSound(this.scene, 'wagon_destroy', 0.55); } catch(e) {}
      this.sprite.destroy();
    }
    this.active = false;
  }
  
  // =========================================================================
  // ГЕТТЕРЫ
  // =========================================================================
  
  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }
  
  getHealth() {
    return this.hp;
  }
  
  getMaxHealth() {
    return this.maxHp;
  }
  
  getMultiplier() {
    return this.getCurrentMultiplier();
  }
  
  getIndex() {
    return this.index;
  }
  
  isActive() {
    return this.active && this.sprite?.active && this.isConnected;
  }
  
  isConnected() {
    return this.isConnected;
  }
}