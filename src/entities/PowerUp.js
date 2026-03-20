import { POWERUP_TYPES } from '../config';
import { audioManager } from '../managers/AudioManager';
import { gameManager } from '../managers/GameManager';

export class PowerUp {
  constructor(scene, x, y, type = 'booster', worldType = null) {
    this.scene = scene;
    this.type = type;
    this.worldType = worldType || (scene.levelManager?.currentWorld ?? 0);
    this.config = POWERUP_TYPES[type] || POWERUP_TYPES.booster;
    
    // Получаем модификации для текущего мира
    this.worldMod = this.getWorldModifications();
    
    // Создаём спрайт с учётом мира
    this.sprite = scene.physics.add.image(x, y, this.getTextureForWorld())
      .setScale(0.8)
      .setDepth(8);
    
    // Настройка физики
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);
    this.sprite.body.setVelocityX(-scene.currentSpeed || -200);
    
    // Цветовая гамма в зависимости от мира
    const finalColor = this.getColorForWorld();
    this.sprite.setTint(finalColor);
    
    // Визуальные эффекты
    this.sprite.setAngularVelocity(100);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    
    // Ссылка на объект
    this.sprite.powerUpRef = this;
    
    // Характеристики
    this.collected = false;
    this.active = true;
    this.pulseDirection = 1;
    this.baseScale = 0.7;
    this.pulseTimer = 0;
    this.rotationSpeed = 100;
    
    // Параметры с учётом мира
    this.duration = this.getDurationForWorld();
    this.effectStrength = this.getEffectStrength();
    
    // Эффекты в зависимости от мира
    this.glowIntensity = 0.5;
    this.particleFrequency = 100;
    
    // Эффект свечения
    this.glow = scene.add.circle(x, y, 25, finalColor, 0.4)
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);
    
    // Дополнительные частицы для редких усилителей
    this.orbitalParticles = [];
    if (this.isRare()) {
      this.createOrbitalParticles();
    }
    
    // Звуковой эффект появления
    if (this.worldType >= 1) {
      this.playSpawnSound();
    }
    
    // Добавляем в группу
    if (scene.powerUpGroup) {
      scene.powerUpGroup.add(this.sprite);
    }
    
    // Анимация появления
    this.animateSpawn();
  }

  // =========================================================================
  // КОНФИГУРАЦИЯ В ЗАВИСИМОСТИ ОТ МИРА
  // =========================================================================

  getWorldModifications() {
    const mods = {
      0: { // Космос
        colorMultiplier: 1.0,
        durationMultiplier: 1.0,
        strengthMultiplier: 1.0,
        visualEffect: 'normal',
        particleColor: 0xffffff,
      },
      1: { // Киберпанк
        colorMultiplier: 1.2,
        durationMultiplier: 0.8,
        strengthMultiplier: 1.3,
        visualEffect: 'neon',
        particleColor: 0xff00ff,
      },
      2: { // Подземелье
        colorMultiplier: 0.8,
        durationMultiplier: 1.2,
        strengthMultiplier: 1.2,
        visualEffect: 'dark',
        particleColor: 0xff6600,
      },
      3: { // Астероиды
        colorMultiplier: 1.1,
        durationMultiplier: 0.9,
        strengthMultiplier: 1.4,
        visualEffect: 'rocky',
        particleColor: 0xffaa44,
      },
      4: { // Чёрная дыра
        colorMultiplier: 0.7,
        durationMultiplier: 1.5,
        strengthMultiplier: 1.5,
        visualEffect: 'void',
        particleColor: 0xaa88ff,
      },
    };
    return mods[this.worldType] || mods[0];
  }

  getTextureForWorld() {
    // В разных мирах разные текстуры усилителей
    const textures = {
      0: 'powerup',      // Космос - стандартный
      1: 'powerup_neon', // Киберпанк - неоновый
      2: 'powerup_dark', // Подземелье - тёмный
      3: 'powerup_rock', // Астероиды - каменный
      4: 'powerup_void', // Чёрная дыра - тёмно-фиолетовый
    };
    
    const texture = textures[this.worldType];
    if (this.scene.textures.exists(texture)) {
      return texture;
    }
    return 'powerup';
  }

  getColorForWorld() {
    let baseColor = this.config.color;
    
    // Применяем модификатор мира
    const r = ((baseColor >> 16) & 255) * this.worldMod.colorMultiplier;
    const g = ((baseColor >> 8) & 255) * this.worldMod.colorMultiplier;
    const b = (baseColor & 255) * this.worldMod.colorMultiplier;
    
    const finalColor = (Math.min(255, r) << 16) | (Math.min(255, g) << 8) | Math.min(255, b);
    
    // Специальные эффекты для миров
    if (this.worldType === 1) {
      // Киберпанк - добавляем неоновый оттенок
      return finalColor | 0xff00ff;
    }
    if (this.worldType === 2) {
      // Подземелье - затемняем
      return finalColor & 0xaa8866;
    }
    if (this.worldType === 4) {
      // Чёрная дыра - фиолетовый оттенок
      return (finalColor & 0xff88ff) | 0x8800ff;
    }
    
    return finalColor;
  }

  getDurationForWorld() {
    let duration = this.config.duration;
    
    // Применяем модификатор мира
    duration = duration * this.worldMod.durationMultiplier;
    
    // Бонусы от улучшений
    if (gameManager.getUpgradeLevel('powerUpDuration')) {
      duration *= (1 + gameManager.getUpgradeLevel('powerUpDuration') * 0.1);
    }
    
    return duration;
  }

  getEffectStrength() {
    let strength = 1.0;
    
    // Базовые значения для разных типов
    const strengths = {
      speed: 1.5,
      shield: 1.0,
      magnet: 1.0,
      slow: 0.6,
      double: 2.0,
      invincible: 1.0,
    };
    
    strength = strengths[this.config.effect] || 1.0;
    
    // Применяем модификатор мира
    strength = strength * this.worldMod.strengthMultiplier;
    
    // Бонусы от улучшений
    if (gameManager.getUpgradeLevel('powerUpStrength')) {
      strength *= (1 + gameManager.getUpgradeLevel('powerUpStrength') * 0.1);
    }
    
    return strength;
  }

  isRare() {
    const rareTypes = ['double', 'invincible', 'hyper_boost', 'gravity_control'];
    return rareTypes.includes(this.config.effect);
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================

  createOrbitalParticles() {
    const count = 3;
    const colors = [0xff00ff, 0x00ffff, 0xffff00];
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const particle = this.scene.add.circle(
        this.sprite.x + Math.cos(angle) * 20,
        this.sprite.y + Math.sin(angle) * 20,
        2,
        colors[i % colors.length],
        0.6
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this.orbitalParticles.push(particle);
    }
    
    // Анимация вращения
    this.orbitalRotation = 0;
    this.scene.events.on('update', this.updateOrbitals, this);
  }

  updateOrbitals() {
    if (!this.active || !this.sprite || !this.sprite.active) {
      if (this.orbitalParticles.length) {
        this.orbitalParticles.forEach(p => p?.destroy());
        this.orbitalParticles = [];
      }
      return;
    }
    
    this.orbitalRotation += 0.05;
    const count = this.orbitalParticles.length;
    
    this.orbitalParticles.forEach((particle, i) => {
      if (particle && particle.active) {
        const angle = (i / count) * Math.PI * 2 + this.orbitalRotation;
        particle.x = this.sprite.x + Math.cos(angle) * 25;
        particle.y = this.sprite.y + Math.sin(angle) * 25;
        
        // Пульсация
        const scale = 1 + Math.sin(Date.now() * 0.01 + i) * 0.3;
        particle.setScale(scale);
      }
    });
  }

  animateSpawn() {
    this.sprite.setScale(0);
    this.glow.setScale(0);
    
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 300,
      ease: 'Back.out',
    });
    
    this.scene.tweens.add({
      targets: this.glow,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Back.out',
    });
  }

  playSpawnSound() {
    try {
      const volume = 0.2 + (this.isRare() ? 0.3 : 0);
      audioManager.playSound(this.scene, 'powerup_spawn', volume);
    } catch (e) {}
  }

  // =========================================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // =========================================================================

  update(delta) {
    if (!this.sprite || !this.sprite.active) {
      this.active = false;
      return false;
    }
    
    // Обновляем скорость в зависимости от текущей скорости игры
    if (this.sprite.body && this.scene.currentSpeed) {
      this.sprite.body.setVelocityX(-this.scene.currentSpeed);
    }
    
    // Эффект пульсации
    this.pulseTimer += delta;
    if (this.pulseTimer > 50) {
      this.pulseTimer = 0;
      this.baseScale += 0.03 * this.pulseDirection;
      
      if (this.baseScale > 1.0) {
        this.pulseDirection = -1;
      } else if (this.baseScale < 0.7) {
        this.pulseDirection = 1;
      }
      
      this.sprite.setScale(this.baseScale);
      
      // Обновляем свечение
      if (this.glow) {
        this.glow.setPosition(this.sprite.x, this.sprite.y);
        this.glow.setScale(this.baseScale * 1.3);
        
        // Пульсация свечения
        const alpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
        this.glow.setAlpha(alpha);
      }
    }
    
    // Специальные эффекты для миров
    this.updateWorldVisuals();
    
    // Проверка выхода за экран
    if (this.sprite.x < -100) {
      this.destroy();
      return false;
    }
    
    return true;
  }

  updateWorldVisuals() {
    const time = Date.now() * 0.005;
    
    // Киберпанк - мерцание
    if (this.worldType === 1) {
      const intensity = 0.7 + Math.sin(time * 8) * 0.3;
      this.sprite.setAlpha(intensity);
      if (this.glow) this.glow.setAlpha(intensity * 0.6);
    }
    
    // Подземелье - тёмная аура
    if (this.worldType === 2) {
      const darkPulse = 0.5 + Math.sin(time * 3) * 0.2;
      this.sprite.setAlpha(darkPulse);
    }
    
    // Астероиды - вращение быстрее
    if (this.worldType === 3) {
      this.sprite.angle += 3;
    }
    
    // Чёрная дыра - искажение
    if (this.worldType === 4) {
      const distort = 1 + Math.sin(time * 10) * 0.1;
      this.sprite.setScale(this.baseScale * distort);
    }
  }

  collect(player) {
    if (this.collected) return;
    this.collected = true;
    
    // Применяем эффект с учётом мира
    this.applyEffect(player);
    
    // Эффект сбора
    this.createCollectEffect();
    
    // Звук сбора (зависит от мира)
    this.playCollectSound();
    
    // Уведомление
    this.showNotification();
    
    // Добавляем в статистику
    if (gameManager) {
      gameManager.addPowerupCollected();
      gameManager.updateQuestProgress('powerups', 1);
    }
    
    // Уничтожаем
    this.destroy();
  }

  applyEffect(player) {
    const durationSec = this.duration / 1000;
    
    switch(this.config.effect) {
      case 'speed':
        const speedMult = this.effectStrength;
        player.activateSpeedBoost(durationSec, speedMult);
        this.scene.currentSpeed = this.scene.baseSpeed * speedMult;
        this.scene.time.delayedCall(this.duration, () => {
          if (!this.scene.bonusActive) {
            this.scene.currentSpeed = this.scene.baseSpeed;
          }
        });
        break;
        
      case 'shield':
        player.activateShield(durationSec);
        break;
        
      case 'magnet':
        const magnetRange = this.scene.magnetRange * this.effectStrength;
        player.activateMagnet(durationSec, magnetRange);
        break;
        
      case 'slow':
        const slowMult = this.effectStrength;
        this.scene.currentSpeed = this.scene.baseSpeed * slowMult;
        player.sprite.setTint(0xff8800);
        this.scene.time.delayedCall(this.duration, () => {
          if (!this.scene.bonusActive) {
            this.scene.currentSpeed = this.scene.baseSpeed;
          }
          player.sprite.clearTint();
        });
        break;
        
      case 'double':
        player.activateDoubleCrystals(durationSec);
        break;
        
      case 'invincible':
        player.activateInvincible(durationSec);
        break;
        
      case 'hyper_speed':
        const hyperMult = this.effectStrength * 2;
        player.activateSpeedBoost(durationSec, hyperMult);
        this.scene.currentSpeed = this.scene.baseSpeed * hyperMult;
        this.scene.time.delayedCall(this.duration, () => {
          if (!this.scene.bonusActive) {
            this.scene.currentSpeed = this.scene.baseSpeed;
          }
        });
        break;
        
      case 'low_gravity':
        const originalGravity = this.scene.physics.world.gravity.y;
        this.scene.physics.world.gravity.y = originalGravity * 0.5;
        this.scene.time.delayedCall(this.duration, () => {
          this.scene.physics.world.gravity.y = originalGravity;
        });
        break;
        
      case 'freeze':
        this.scene.time.timeScale = 0.2;
        this.scene.time.delayedCall(this.duration, () => {
          this.scene.time.timeScale = 1;
        });
        break;
        
      case 'ghost':
        player.activateGhostMode(durationSec);
        break;
    }
    
    // Добавляем модернизацию на такси (кроме замедления)
    if (this.config.effect !== 'slow' && player.addModification) {
      player.addModification(this.type);
    }
    
    // Бонус к кристаллам за сбор
    const crystalBonus = this.isRare() ? 10 : 2;
    this.scene.crystals += crystalBonus;
    if (this.scene.crystalText) {
      this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    }
    gameManager.addCrystals(crystalBonus, 'powerup');
  }

  createCollectEffect() {
    if (this.scene.particleManager) {
      // Усиленный эффект для редких усилителей
      const effectType = this.isRare() ? 'rare' : this.type;
      this.scene.particleManager.createBonusEffect(
        effectType,
        this.sprite.x,
        this.sprite.y
      );
    }
    
    // Дополнительный эффект в зависимости от мира
    if (this.worldType === 1) {
      // Киберпанк - цифровые искры
      for (let i = 0; i < 10; i++) {
        const spark = this.scene.add.text(
          this.sprite.x + Phaser.Math.Between(-20, 20),
          this.sprite.y + Phaser.Math.Between(-20, 20),
          ['0','1'][Math.floor(Math.random() * 2)],
          { fontSize: '12px', fontFamily: 'monospace', color: '#ff00ff' }
        );
        this.scene.tweens.add({
          targets: spark,
          alpha: 0,
          y: spark.y - 50,
          duration: 500,
          onComplete: () => spark.destroy()
        });
      }
    }
    
    if (this.worldType === 4) {
      // Чёрная дыра - гравитационная волна
      const wave = this.scene.add.circle(this.sprite.x, this.sprite.y, 10, 0xaa88ff, 0.6);
      this.scene.tweens.add({
        targets: wave,
        radius: 100,
        alpha: 0,
        duration: 500,
        onComplete: () => wave.destroy()
      });
    }
  }

  playCollectSound() {
    try {
      const volume = 0.4 + (this.isRare() ? 0.3 : 0);
      const soundKey = this.isRare() ? 'powerup_rare' : 'powerup_sound';
      audioManager.playSound(this.scene, soundKey, volume);
    } catch (e) {
      try {
        audioManager.playSound(this.scene, 'powerup_sound', 0.5);
      } catch (e2) {}
    }
  }

  showNotification() {
    const w = this.scene.scale.width;
    const color = this.getColorString();
    
    // Уведомление с иконкой
    const notification = this.scene.add.container(w / 2, 100).setDepth(100).setScrollFactor(0);
    
    const bg = this.scene.add.rectangle(0, 0, 280, 50, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.8);
    
    const icon = this.scene.add.text(-110, 0, this.config.icon, {
      fontSize: '28px'
    }).setOrigin(0.5);
    
    const text = this.scene.add.text(0, 0, `${this.config.name}!`, {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: color,
      stroke: '#ffffff',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    const durationText = this.scene.add.text(90, 0, `${Math.floor(this.duration / 1000)}с`, {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#ffaa00'
    }).setOrigin(0.5);
    
    notification.add([bg, icon, text, durationText]);
    
    notification.setAlpha(0);
    notification.setY(80);
    
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      y: 120,
      duration: 300,
      ease: 'Back.out'
    });
    
    this.scene.tweens.add({
      targets: notification,
      alpha: 0,
      y: 160,
      duration: 500,
      delay: 2000,
      ease: 'Power2.easeOut',
      onComplete: () => notification.destroy()
    });
  }

  getColorString() {
    const colors = {
      speed: '#00ffff',
      shield: '#00ff00',
      magnet: '#ff00ff',
      slow: '#ffaa00',
      double: '#ffff00',
      invincible: '#ffffff',
      hyper_speed: '#ff6600',
      low_gravity: '#88aaff',
      freeze: '#88ccff',
      ghost: '#cc88ff'
    };
    return colors[this.config.effect] || '#ffffff';
  }

  destroy() {
    // Очищаем орбитальные частицы
    if (this.orbitalParticles.length) {
      this.scene.events.off('update', this.updateOrbitals, this);
      this.orbitalParticles.forEach(p => p?.destroy());
      this.orbitalParticles = [];
    }
    
    // Удаляем свечение
    if (this.glow) {
      this.glow.destroy();
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
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getType() {
    return this.type;
  }

  getEffect() {
    return this.config.effect;
  }

  getRemainingTime() {
    return this.duration;
  }

  isActive() {
    return this.active && this.sprite && this.sprite.active;
  }
}