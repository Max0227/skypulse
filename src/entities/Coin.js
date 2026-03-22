import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';
import { COIN_TYPES } from '../config';

export class Coin {
  constructor(scene, x, y, type = 'gold', worldType = null) {
    this.scene = scene;
    this.type = type;
    this.worldType = worldType || (scene.levelManager?.currentWorld ?? 0);
    this.config = COIN_TYPES[type] || COIN_TYPES.gold;
    this.worldMod = this.getWorldModifications();

    // Создаём обычный Image (без физики)
    this.sprite = scene.add.image(x, y, this.getTextureForWorld())
      .setScale(0.7)
      .setDepth(8);

    // Визуальные эффекты
    this.sprite.setAngularVelocity(200);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    this.applyWorldTint();

    this.sprite.coinRef = this;

    // Характеристики
    this.baseValue = this.config.value;
    this.value = this.getValueForWorld();
    this.bonus = this.config.bonus || null;
    this.bonusDuration = this.getBonusDuration();
    this.bonusStrength = this.getBonusStrength();
    this.collected = false;
    this.active = true;
    this.pulseDirection = 1;
    this.baseScale = 0.7;
    this.pulseTimer = 0;
    this.rotationSpeed = 200;
    this.initialY = y;

    // Эффекты
    this.trailEmitter = null;
    this.glowEffect = null;
    this.orbitalParticles = [];

    if (this.isRare()) {
      this.createGlowEffect();
      this.createTrailEffect();
      this.createOrbitalParticles();
    }

    this.animateSpawn();

    // Добавляем в группу монет (группа может быть обычной, не физической)
    if (scene.coinGroup) {
      scene.coinGroup.add(this.sprite);
    }
  }

  // =========================================================================
  // ФИЗИКА
  // =========================================================================

  setupPhysics() {
    // Полное отключение гравитации
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setGravityY(0);
    this.sprite.body.setGravityX(0);
    
    // Отключаем все внешние силы
    this.sprite.body.setDrag(0);
    this.sprite.body.setDragX(0);
    this.sprite.body.setDragY(0);
    this.sprite.body.acceleration.y = 0;
    this.sprite.body.acceleration.x = 0;
    this.sprite.body.setBounce(0);
    
    // Отключаем коллизии с границами
    this.sprite.body.setCollideWorldBounds(false);
    
    // Делаем монету неподвижной
    this.sprite.body.setImmovable(true);
    
    // Сохраняем скорость
    this.speedX = -(this.scene.currentSpeed || 200);
    this.speedY = 0;
    
    // Устанавливаем начальную скорость
    this.sprite.body.setVelocityX(this.speedX);
    this.sprite.body.setVelocityY(0);
  }

  // =========================================================================
  // ОСНОВНОЙ МЕТОД UPDATE (ПРИНУДИТЕЛЬНАЯ УСТАНОВКА СКОРОСТИ)
  // =========================================================================

  update(delta) {
    if (!this.sprite || !this.sprite.active) {
      this.active = false;
      return false;
    }

    // Движение: влево с текущей скоростью игры
    const currentSpeed = this.scene.currentSpeed || 200;
    this.sprite.x -= currentSpeed * (delta / 1000); // delta в мс, приводим к секундам

    // Плавное парение
    if (this.worldMod.floatAmplitude > 0) {
      const time = Date.now() * this.worldMod.floatSpeed;
      const floatY = Math.sin(time + this.sprite.x * 0.01) * this.worldMod.floatAmplitude;
      this.sprite.y = this.initialY + floatY;
    } else {
      // Иначе просто сохраняем начальную Y
      this.sprite.y = this.initialY;
    }

    // Эффект пульсации
    this.pulseTimer += delta;
    if (this.pulseTimer > 80) {
      this.pulseTimer = 0;
      this.baseScale += 0.04 * this.pulseDirection;
      if (this.baseScale > 0.9) this.pulseDirection = -1;
      else if (this.baseScale < 0.6) this.pulseDirection = 1;
      this.sprite.setScale(this.baseScale);
      if (this.glowEffect) {
        const glowScale = this.baseScale * 1.3;
        this.glowEffect.setScale(glowScale);
        this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
        const alpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
        this.glowEffect.setAlpha(alpha);
      }
    }

    // Обновляем орбитальные частицы
    if (this.orbitalParticles.length > 0) {
      this.updateOrbitals();
    }

    this.updateWorldVisuals();

    // Удаляем, если улетела далеко влево
    if (this.sprite.x < -100) {
      this.destroy();
      return false;
    }

    return true;
  }

  // Остальные методы (collect, destroy, etc.) остаются без изменений


  // =========================================================================
  // КОНФИГУРАЦИЯ МИРОВ
  // =========================================================================

  getWorldModifications() {
    const mods = {
      0: {
        valueMultiplier: 1.0,
        durationMultiplier: 1.0,
        strengthMultiplier: 1.0,
        visualEffect: 'normal',
        particleColor: 0xffaa00,
        tint: null,
        floatAmplitude: 0,
        floatSpeed: 0
      },
      1: {
        valueMultiplier: 1.3,
        durationMultiplier: 0.8,
        strengthMultiplier: 1.3,
        visualEffect: 'neon',
        particleColor: 0xff44ff,
        tint: 0xff88ff,
        floatAmplitude: 3,
        floatSpeed: 0.008
      },
      2: {
        valueMultiplier: 1.2,
        durationMultiplier: 1.2,
        strengthMultiplier: 1.2,
        visualEffect: 'dark',
        particleColor: 0xff6600,
        tint: 0xcc8866,
        floatAmplitude: 2,
        floatSpeed: 0.005
      },
      3: {
        valueMultiplier: 1.4,
        durationMultiplier: 0.9,
        strengthMultiplier: 1.4,
        visualEffect: 'rocky',
        particleColor: 0xffaa44,
        tint: 0xffaa66,
        floatAmplitude: 4,
        floatSpeed: 0.01
      },
      4: {
        valueMultiplier: 1.5,
        durationMultiplier: 1.5,
        strengthMultiplier: 1.5,
        visualEffect: 'void',
        particleColor: 0xaa88ff,
        tint: 0xcc88ff,
        floatAmplitude: 5,
        floatSpeed: 0.012
      }
    };
    return mods[this.worldType] || mods[0];
  }

  getTextureForWorld() {
    const textureMap = {
      gold: 'coin_gold',
      red: 'coin_red',
      blue: 'coin_blue',
      green: 'coin_green',
      purple: 'coin_purple',
      rainbow: 'coin_rainbow',
      crystal: 'coin_crystal',
      dark: 'coin_dark'
    };
    
    let texture = textureMap[this.type] || 'coin_gold';
    
    if (this.worldType === 1 && this.type === 'gold') {
      texture = 'coin_neon';
    } else if (this.worldType === 2 && this.type === 'gold') {
      texture = 'coin_dark';
    } else if (this.worldType === 4 && this.type === 'gold') {
      texture = 'coin_void';
    }
    
    if (this.scene.textures.exists(texture)) {
      return texture;
    }
    return textureMap[this.type] || 'coin_gold';
  }

  applyWorldTint() {
    if (this.worldMod.tint) {
      this.sprite.setTint(this.worldMod.tint);
    }
  }

  getValueForWorld() {
    let value = this.baseValue;
    value = Math.floor(value * this.worldMod.valueMultiplier);
    
    const prestigeBonus = gameManager.getPrestigeBonus();
    if (prestigeBonus) {
      value = Math.floor(value * prestigeBonus.crystalMultiplier);
    }
    
    const skinStats = gameManager.getCurrentSkinStats();
    if (skinStats && skinStats.crystalBonus) {
      value = Math.floor(value * (1 + skinStats.crystalBonus / 100));
    }
    
    return Math.max(1, value);
  }

  getBonusDuration() {
    let duration = 5;
    
    if (this.bonus === 'speed') duration = 5;
    if (this.bonus === 'shield') duration = 5;
    if (this.bonus === 'magnet') duration = 7;
    if (this.bonus === 'slow') duration = 4;
    
    duration = duration * this.worldMod.durationMultiplier;
    
    const upgradeLevel = gameManager.getUpgradeLevel('powerUpDuration');
    if (upgradeLevel) {
      duration = duration * (1 + upgradeLevel * 0.1);
    }
    
    return duration;
  }

  getBonusStrength() {
    let strength = 1.0;
    
    if (this.bonus === 'speed') strength = 1.5;
    if (this.bonus === 'slow') strength = 0.6;
    
    strength = strength * this.worldMod.strengthMultiplier;
    
    return strength;
  }

  isRare() {
    const rareTypes = ['rainbow', 'crystal', 'dark'];
    return rareTypes.includes(this.type);
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================

  createGlowEffect() {
    this.glowEffect = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y,
      18,
      this.worldMod.particleColor,
      0.4
    );
    this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
    this.glowEffect.setDepth(7);
  }

  createTrailEffect() {
    this.trailEmitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'flare', {
      speed: { min: 20, max: 50 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 200,
      quantity: 1,
      frequency: 30,
      blendMode: Phaser.BlendModes.ADD,
      tint: this.worldMod.particleColor,
      follow: this.sprite,
      followOffset: { x: -15, y: 0 }
    });
  }

  createOrbitalParticles() {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const particle = this.scene.add.circle(
        this.sprite.x + Math.cos(angle) * 15,
        this.sprite.y + Math.sin(angle) * 15,
        2,
        this.worldMod.particleColor,
        0.6
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this.orbitalParticles.push(particle);
    }
    this.orbitalRotation = 0;
  }

  updateOrbitals() {
    if (!this.active) return;
    
    this.orbitalRotation += 0.05;
    const count = this.orbitalParticles.length;
    
    this.orbitalParticles.forEach((particle, i) => {
      if (particle && particle.active) {
        const angle = (i / count) * Math.PI * 2 + this.orbitalRotation;
        particle.x = this.sprite.x + Math.cos(angle) * 18;
        particle.y = this.sprite.y + Math.sin(angle) * 18;
        
        const scale = 1 + Math.sin(Date.now() * 0.01 + i) * 0.3;
        particle.setScale(scale);
      }
    });
  }

  animateSpawn() {
    this.sprite.setScale(0);
    this.sprite.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.baseScale,
      scaleY: this.baseScale,
      alpha: 1,
      duration: 300,
      ease: 'Back.out'
    });
    
    if (this.glowEffect) {
      this.glowEffect.setScale(0);
      this.scene.tweens.add({
        targets: this.glowEffect,
        scale: 1.2,
        alpha: 0.4,
        duration: 300,
        ease: 'Back.out'
      });
    }
  }

  updateWorldVisuals() {
    const time = Date.now() * 0.005;
    
    if (this.worldType === 1) {
      const intensity = 0.6 + Math.sin(time * 10) * 0.3;
      this.sprite.setAlpha(intensity);
      if (this.glowEffect) this.glowEffect.setAlpha(intensity * 0.5);
      
      if (this.isRare() && Math.random() < 0.05) {
        this.createDigitalGlitch();
      }
    }
    
    if (this.worldType === 2) {
      const darkPulse = 0.5 + Math.sin(time * 3) * 0.2;
      this.sprite.setAlpha(darkPulse);
    }
    
    if (this.worldType === 4) {
      const distort = 1 + Math.sin(time * 8) * 0.05;
      this.sprite.setScale(this.baseScale * distort);
    }
  }

  createDigitalGlitch() {
    const glitch = this.scene.add.text(
      this.sprite.x + Phaser.Math.Between(-10, 10),
      this.sprite.y + Phaser.Math.Between(-10, 10),
      ['0', '1'][Math.floor(Math.random() * 2)],
      { fontSize: '12px', fontFamily: 'monospace', color: '#ff44ff' }
    );
    glitch.setBlendMode(Phaser.BlendModes.ADD);
    
    this.scene.tweens.add({
      targets: glitch,
      alpha: 0,
      y: glitch.y - 20,
      duration: 200,
      onComplete: () => glitch.destroy()
    });
  }

  // =========================================================================
  // СБОР МОНЕТЫ
  // =========================================================================

  collect(player) {
    if (this.collected) return;
    this.collected = true;
    
    let finalValue = this.value;
    
    if (player && player.doubleCrystals) finalValue *= 2;
    if (this.scene.comboSystem) {
      finalValue = Math.floor(finalValue * this.scene.comboSystem.getMultiplier());
    }
    finalValue = Math.floor(finalValue * this.worldMod.valueMultiplier);
    
    gameManager.addCrystals(finalValue, 'coin');
    this.scene.crystals += finalValue;
    if (this.scene.crystalText) {
      this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    }
    
    this.scene.collectedCoins += finalValue;
    
    if (this.scene.collectedCoins >= this.scene.coinsForWagon && 
        this.scene.wagons.length < this.scene.maxWagons) {
      this.scene.addWagon();
      this.scene.collectedCoins -= this.scene.coinsForWagon;
    }
    
    if (this.scene.questSystem) {
      this.scene.questSystem.updateProgress('coins', finalValue);
      if (this.bonus) {
        this.scene.questSystem.updateProgress(this.bonus, 1);
      }
    }
    
    if (this.scene.comboSystem) {
      this.scene.comboSystem.add(finalValue > 1 ? finalValue : 1);
    }
    
    if (this.bonus) {
      this.activateBonus(player);
    }
    
    this.createCollectEffect();
    this.playCollectSound();
    this.triggerVibration();
    this.animateCrystalText(finalValue);
    this.showValuePopup(finalValue);
    this.destroy();
  }

  activateBonus(player) {
    const duration = this.bonusDuration;
    const strength = this.bonusStrength;
    
    switch(this.bonus) {
      case 'speed':
        player.activateSpeedBoost(duration, strength);
        this.scene.currentSpeed = this.scene.baseSpeed * strength;
        this.scene.time.delayedCall(duration * 1000, () => {
          if (!this.scene.bonusActive) {
            this.scene.currentSpeed = this.scene.baseSpeed;
          }
        });
        this.scene.showNotification('🚀 УСКОРЕНИЕ!', 1500, '#ffff00');
        break;
      case 'shield':
        player.activateShield(duration);
        this.scene.showNotification('🛡️ ЩИТ!', 1500, '#00ffff');
        break;
      case 'magnet':
        const magnetRange = this.scene.magnetRange * strength;
        player.activateMagnet(duration, magnetRange);
        this.scene.showNotification('🧲 МАГНИТ!', 1500, '#ff00ff');
        break;
      case 'slow':
        this.scene.currentSpeed = this.scene.baseSpeed * strength;
        this.scene.showNotification('⏳ ЗАМЕДЛЕНИЕ!', 1500, '#ff8800');
        this.scene.time.delayedCall(duration * 1000, () => {
          if (!this.scene.bonusActive) {
            this.scene.currentSpeed = this.scene.baseSpeed;
          }
        });
        break;
    }
  }

  createCollectEffect() {
    if (this.scene.particleManager) {
      const effectType = this.isRare() ? 'rare' : this.type;
      this.scene.particleManager.createCoinCollectEffect(
        this.sprite.x, this.sprite.y, effectType
      );
    }
    
    if (this.worldType === 1) {
      for (let i = 0; i < 8; i++) {
        const spark = this.scene.add.text(
          this.sprite.x + Phaser.Math.Between(-15, 15),
          this.sprite.y + Phaser.Math.Between(-15, 15),
          ['0','1'][Math.floor(Math.random() * 2)],
          { fontSize: '10px', fontFamily: 'monospace', color: '#ff44ff' }
        );
        this.scene.tweens.add({
          targets: spark,
          alpha: 0,
          y: spark.y - 40,
          duration: 400,
          onComplete: () => spark.destroy()
        });
      }
    } else if (this.worldType === 2) {
      for (let i = 0; i < 6; i++) {
        const spark = this.scene.add.circle(
          this.sprite.x + Phaser.Math.Between(-15, 15),
          this.sprite.y + Phaser.Math.Between(-15, 15),
          2,
          0xff6600,
          0.8
        );
        spark.setBlendMode(Phaser.BlendModes.ADD);
        this.scene.tweens.add({
          targets: spark,
          alpha: 0,
          scale: 0,
          duration: 300,
          onComplete: () => spark.destroy()
        });
      }
    } else if (this.worldType === 4) {
      const wave = this.scene.add.circle(this.sprite.x, this.sprite.y, 8, 0xaa88ff, 0.6);
      this.scene.tweens.add({
        targets: wave,
        radius: 50,
        alpha: 0,
        duration: 400,
        onComplete: () => wave.destroy()
      });
    }
  }

  playCollectSound() {
    try {
      const volume = 0.3 + (this.isRare() ? 0.2 : 0);
      const soundKey = this.isRare() ? 'rare_coin' : 'coin_sound';
      audioManager.playSound(this.scene, soundKey, volume);
    } catch (e) {
      try {
        audioManager.playSound(this.scene, 'coin_sound', 0.3);
      } catch (e2) {}
    }
  }

  triggerVibration() {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        const intensity = this.isRare() ? 'medium' : 'light';
        window.Telegram.WebApp.HapticFeedback.impactOccurred(intensity);
      }
    } catch (e) {}
  }

  animateCrystalText(value) {
    if (this.scene.crystalText) {
      this.scene.tweens.add({
        targets: this.scene.crystalText,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 100,
        yoyo: true,
        ease: 'Quad.out'
      });
    }
  }

  showValuePopup(value) {
    const popup = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 20,
      `+${value}`,
      {
        fontSize: '16px',
        fontFamily: "'Audiowide', sans-serif",
        color: '#ffaa00',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: { blur: 5, color: '#ffaa00', fill: true }
      }
    ).setOrigin(0.5).setDepth(50);
    
    this.scene.tweens.add({
      targets: popup,
      y: popup.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => popup.destroy()
    });
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

  getValue() {
    return this.value;
  }

  getBonus() {
    return this.bonus;
  }

  isActive() {
    return this.active && this.sprite && this.sprite.active;
  }

  // =========================================================================
  // ОЧИСТКА
  // =========================================================================

  destroy() {
    if (this.glowEffect) {
      this.glowEffect.destroy();
      this.glowEffect = null;
    }
    
    if (this.trailEmitter) {
      this.trailEmitter.stop();
      this.trailEmitter.destroy();
      this.trailEmitter = null;
    }
    
    this.orbitalParticles.forEach(p => {
      if (p && p.destroy) p.destroy();
    });
    this.orbitalParticles = [];
    
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
    
    this.active = false;
  }
}