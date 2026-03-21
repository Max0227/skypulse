import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.skin = gameManager.getCurrentSkin();
    this.worldType = scene.levelManager?.currentWorld ?? 0;
    
    // Создание спрайта с физикой
    this.createSprite(x, y);
    
    // Настройка физического тела
    this.setupPhysics();
    
    // Характеристики (базовые)
    this.initStats();
    
    // Бонусы и эффекты
    this.initBonuses();
    
    // Модернизации
    this.modifications = [];
    this.maxMods = 5;
    this.modSprites = [];
    
    // Визуальные эффекты
    this.initVisualEffects();
    
    // Применяем улучшения из GameManager
    this.applyUpgrades(gameManager.data.upgrades);
    
    // Применяем эффекты мира
    this.applyWorldEffects();
  }

  // =========================================================================
  // СОЗДАНИЕ И НАСТРОЙКА
  // =========================================================================
  createSprite(x, y) {
    this.sprite = this.scene.physics.add.image(x, y, this.skin)
      .setScale(0.9)
      .setCollideWorldBounds(false)
      .setDepth(15);
    this.sprite.playerRef = this;
  }

  setupPhysics() {
    this.sprite.body.setCircle(24, 15, 5);
    this.sprite.body.setMass(10000);
    this.sprite.body.setDrag(500, 0);
    this.sprite.body.setMaxVelocity(600, 1000);
  }

  initStats() {
    this.jumpPower = 300;
    this.maxHP = 3;
    this.hp = this.maxHP;
    this.x = this.sprite.x;
    this.y = this.sprite.y;
  }

  initBonuses() {
    this.shieldActive = false;
    this.shieldTime = 0;
    this.shieldDuration = 5;
    
    this.magnetActive = false;
    this.magnetRange = 220;
    this.magnetTime = 0;
    
    this.speedBoost = 1;
    this.speedTime = 0;
    
    this.invincible = false;
    this.invincibleTime = 0;
    
    this.doubleCrystals = false;
    this.doubleTime = 0;
    
    this.gravityResistance = false;
    this.ghostMode = false;
  }

  initVisualEffects() {
    // След (неоновый)
    this.trail = this.scene.add.particles(0, 0, 'flare', {
      speed: 40,
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 200,
      blendMode: Phaser.BlendModes.ADD,
      follow: this.sprite,
      followOffset: { x: -20, y: 0 },
      quantity: 4,
      frequency: 15,
      tint: [0x00ffff, 0xff00ff, 0xffff00]
    });
    
    // Свечение
    this.glowEffect = null;
    this.shieldGraphics = null;
    this.auraEffect = null;
    
    this.createGlowEffect();
  }

  createGlowEffect() {
    if (this.glowEffect) return;
    
    this.glowEffect = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y,
      32,
      0x00ffff,
      0.15
    );
    this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
    this.glowEffect.setDepth(14);
    
    this.scene.tweens.add({
      targets: this.glowEffect,
      alpha: { from: 0.1, to: 0.25 },
      scale: { from: 1, to: 1.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        if (this.sprite?.active) {
          this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
        }
      }
    });
  }

  // =========================================================================
  // ПРИМЕНЕНИЕ УЛУЧШЕНИЙ
  // =========================================================================
  applyUpgrades(upgrades) {
    this.jumpPower = 300 + (upgrades.jumpPower || 0) * 25;
    this.maxHP = 3 + (upgrades.headHP || 0);
    this.hp = this.maxHP;
    this.shieldDuration = 5 + (upgrades.shieldDuration || 0) * 1.5;
    this.magnetRange = 220 + (upgrades.magnetRange || 0) * 40;
    
    // Обновляем отображение здоровья в сцене
    if (this.scene.updateHearts) {
      this.scene.updateHearts();
    }
  }

  applyWorldEffects() {
    const world = this.worldType;
    
    // Эффекты в зависимости от мира
    if (world === 1) { // Киберпанк
      this.trail.setTint([0xff00ff, 0x00ffff, 0xffff00]);
      this.createDigitalAura();
    } else if (world === 2) { // Подземелье
      this.trail.setTint([0xff6600, 0xffaa44, 0xff8844]);
      this.createDarkAura();
    } else if (world === 3) { // Астероиды
      this.trail.setTint([0xffaa66, 0xff8844, 0xff6644]);
    } else if (world === 4) { // Чёрная дыра
      this.trail.setTint([0xaa88ff, 0x8866cc, 0x6644aa]);
      this.createVoidAura();
    }
  }

  createDigitalAura() {
    if (this.auraEffect) return;
    
    this.auraEffect = this.scene.add.particles(0, 0, 'digital_icon', {
      speed: { min: 20, max: 50 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 400,
      quantity: 1,
      frequency: 80,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xff44ff, 0x00ffff],
      follow: this.sprite,
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Circle(0, 0, 35),
        quantity: 1
      }
    });
  }

  createDarkAura() {
    if (this.auraEffect) return;
    
    this.auraEffect = this.scene.add.particles(0, 0, 'flare', {
      speed: { min: 10, max: 30 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 500,
      quantity: 1,
      frequency: 100,
      blendMode: Phaser.BlendModes.MULTIPLY,
      tint: 0x442200,
      follow: this.sprite
    });
  }

  createVoidAura() {
    if (this.auraEffect) return;
    
    this.auraEffect = this.scene.add.particles(0, 0, 'gravity_wave', {
      speed: { min: 5, max: 20 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 600,
      quantity: 1,
      frequency: 120,
      blendMode: Phaser.BlendModes.ADD,
      tint: 0xaa88ff,
      follow: this.sprite
    });
  }

  // =========================================================================
  // ОСНОВНЫЕ ДЕЙСТВИЯ
  // =========================================================================
  flap() {
    this.sprite.body.setVelocityY(-this.jumpPower * this.speedBoost);
    
    // Анимация сжатия
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0.85,
      scaleY: 0.85,
      duration: 100,
      ease: 'Quad.easeOut',
      yoyo: true
    });
    
    // Эффект крыльев (неоновый)
    this.createFlapEffect();
    
    // Звук с учётом мира
    try {
      const soundKey = this.worldType === 1 ? 'cyber_tap' : 'tap_sound';
      audioManager.playSound(this.scene, soundKey, 0.3);
    } catch (e) {
      try { audioManager.playSound(this.scene, 'tap_sound', 0.3); } catch (e2) {}
    }
    
    // Вибро
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } catch (e) {}
  }

  createFlapEffect() {
    const colors = this.worldType === 1 ? [0xff44ff, 0x00ffff] : [0x00ffff];
    
    const emitter = this.scene.add.particles(this.sprite.x - 10, this.sprite.y, 'flare', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 200,
      quantity: 3,
      blendMode: Phaser.BlendModes.ADD,
      tint: colors
    });
    emitter.explode(3);
    
    this.scene.time.delayedCall(300, () => emitter.destroy());
  }

  // =========================================================================
  // УРОН И ЗАЩИТА
  // =========================================================================
  takeDamage(amount = 1, source = null) {
    if (this.shieldActive || this.invincible || this.ghostMode) {
      this.createShieldDeflect();
      return false;
    }
    
    this.hp -= amount;
    
    // Визуальный эффект
    this.createHitEffect();
    
    // Звук
    try { audioManager.playSound(this.scene, 'hit_sound', 0.3); } catch (e) {}
    
    // Вибро
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    } catch (e) {}
    
    // Тряска камеры
    this.scene.cameras.main.shake(100, 0.005);
    
    if (this.hp <= 0) {
      return true; // смерть
    }
    
    return false;
  }

  createHitEffect() {
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(300, () => {
      if (this.sprite?.active) {
        this.sprite.clearTint();
        this.updateTintByBonus();
      }
    });
    
    // Частицы крови/искр
    const color = this.worldType === 1 ? 0xff44ff : 0xff4444;
    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-15, 15),
        this.sprite.y + Phaser.Math.Between(-15, 15),
        Phaser.Math.Between(2, 4),
        color,
        0.6
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: particle,
        alpha: 0,
        scale: 0,
        x: particle.x + Phaser.Math.Between(-30, 30),
        y: particle.y + Phaser.Math.Between(-30, 30),
        duration: 300,
        onComplete: () => particle.destroy()
      });
    }
  }

  createShieldDeflect() {
    // Эффект отражения
    const ring = this.scene.add.circle(this.sprite.x, this.sprite.y, 25, 0x00ffff, 0.6);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: ring,
      scale: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => ring.destroy()
    });
    
    this.scene.particleManager.createBonusEffect('shield', this.sprite.x, this.sprite.y);
    try { audioManager.playSound(this.scene, 'shield_sound', 0.3); } catch (e) {}
  }

  updateTintByBonus() {
    if (this.shieldActive) this.sprite.setTint(0x00ffff);
    else if (this.speedBoost > 1) this.sprite.setTint(0xffff00);
    else if (this.magnetActive) this.sprite.setTint(0xff00ff);
    else if (this.doubleCrystals) this.sprite.setTint(0xffaa00);
    else this.sprite.clearTint();
  }

  // =========================================================================
  // АКТИВАЦИЯ БОНУСОВ
  // =========================================================================
  activateShield(duration = null) {
    const dur = duration || this.shieldDuration;
    this.shieldActive = true;
    this.shieldTime = dur;
    this.updateTintByBonus();
    
    this.scene.particleManager.createShieldEffect(this.sprite);
    try { audioManager.playSound(this.scene, 'shield_sound', 0.5); } catch (e) {}
    this.scene.showNotification('🛡️ ЩИТ АКТИВИРОВАН', 1500, '#00ffff');
  }

  deactivateShield() {
    this.shieldActive = false;
    this.shieldTime = 0;
    this.updateTintByBonus();
    
    if (this.shieldGraphics) {
      this.shieldGraphics.destroy();
      this.shieldGraphics = null;
    }
  }

  updateShield(delta) {
    if (this.shieldActive) {
      this.shieldTime -= delta / 1000;
      if (this.shieldTime <= 0) {
        this.deactivateShield();
      } else {
        this.updateShieldVisuals();
      }
    }
  }

  updateShieldVisuals() {
    if (!this.shieldGraphics) {
      this.shieldGraphics = this.scene.add.graphics();
      this.shieldGraphics.setDepth(14);
    }
    
    const radius = 35 + Math.sin(Date.now() * 0.01) * 5;
    const alpha = 0.3 + Math.sin(Date.now() * 0.02) * 0.2;
    
    this.shieldGraphics.clear();
    this.shieldGraphics.lineStyle(2, 0x00ffff, alpha);
    this.shieldGraphics.strokeCircle(this.sprite.x, this.sprite.y, radius);
  }

  activateMagnet(duration = 7) {
    this.magnetActive = true;
    this.magnetTime = duration;
    this.updateTintByBonus();
    
    this.scene.particleManager.createBonusEffect('magnet', this.sprite.x, this.sprite.y);
    try { audioManager.playSound(this.scene, 'magnet_sound', 0.5); } catch (e) {}
    this.scene.showNotification('🧲 МАГНИТ АКТИВИРОВАН', 1500, '#ff00ff');
  }

  deactivateMagnet() {
    this.magnetActive = false;
    this.magnetTime = 0;
    this.updateTintByBonus();
  }

  updateMagnet(delta) {
    if (this.magnetActive) {
      this.magnetTime -= delta / 1000;
      if (this.magnetTime <= 0) {
        this.deactivateMagnet();
      } else {
        this.applyMagnet();
      }
    }
  }

  applyMagnet() {
    const coins = this.scene.coinGroup?.getChildren() || [];
    for (let coin of coins) {
      if (!coin?.active) continue;
      const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, coin.x, coin.y);
      if (dist < this.magnetRange) {
        const angle = Phaser.Math.Angle.Between(coin.x, coin.y, this.sprite.x, this.sprite.y);
        coin.x += Math.cos(angle) * 15;
        coin.y += Math.sin(angle) * 15;
      }
    }
  }

  activateSpeedBoost(duration = 5, multiplier = 1.5) {
    this.speedBoost = multiplier;
    this.speedTime = duration;
    this.updateTintByBonus();
    
    this.scene.particleManager.createBonusEffect('speed', this.sprite.x, this.sprite.y);
    try { audioManager.playSound(this.scene, 'speed_sound', 0.5); } catch (e) {}
    this.scene.showNotification(`🚀 УСКОРЕНИЕ x${multiplier}`, 1500, '#ffff00');
  }

  deactivateSpeedBoost() {
    this.speedBoost = 1;
    this.speedTime = 0;
    this.updateTintByBonus();
  }

  updateSpeedBoost(delta) {
    if (this.speedBoost > 1) {
      this.speedTime -= delta / 1000;
      if (this.speedTime <= 0) {
        this.deactivateSpeedBoost();
      }
    }
  }

  activateInvincible(duration = 5) {
    this.invincible = true;
    this.invincibleTime = duration;
    this.updateTintByBonus();
    
    this.scene.particleManager.createBonusEffect('invincible', this.sprite.x, this.sprite.y);
    try { audioManager.playSound(this.scene, 'shield_sound', 0.5); } catch (e) {}
    this.scene.showNotification('✨ НЕУЯЗВИМОСТЬ', 1500, '#ffffff');
  }

  deactivateInvincible() {
    this.invincible = false;
    this.invincibleTime = 0;
    this.updateTintByBonus();
    this.sprite.alpha = 1;
  }

  updateInvincible(delta) {
    if (this.invincible) {
      this.invincibleTime -= delta / 1000;
      if (this.invincibleTime <= 0) {
        this.deactivateInvincible();
      } else {
        this.sprite.alpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
      }
    } else {
      this.sprite.alpha = 1;
    }
  }

  activateDoubleCrystals(duration = 10) {
    this.doubleCrystals = true;
    this.doubleTime = duration;
    this.updateTintByBonus();
    
    this.scene.particleManager.createBonusEffect('double', this.sprite.x, this.sprite.y);
    this.scene.showNotification('💎 ДВОЙНЫЕ КРИСТАЛЛЫ', 1500, '#ffaa00');
  }

  deactivateDoubleCrystals() {
    this.doubleCrystals = false;
    this.doubleTime = 0;
    this.updateTintByBonus();
  }

  updateDoubleCrystals(delta) {
    if (this.doubleCrystals) {
      this.doubleTime -= delta / 1000;
      if (this.doubleTime <= 0) {
        this.deactivateDoubleCrystals();
      }
    }
  }

  activateGhostMode(duration = 4) {
    this.ghostMode = true;
    this.sprite.setAlpha(0.4);
    this.sprite.body.checkCollision.none = true;
    
    this.scene.time.delayedCall(duration * 1000, () => {
      this.ghostMode = false;
      this.sprite.setAlpha(1);
      this.sprite.body.checkCollision.none = false;
    });
    
    this.scene.showNotification('👻 ПРИЗРАК', 1500, '#cc88ff');
  }

  activateGravityResistance(duration = 6) {
    this.gravityResistance = true;
    const originalGravity = this.scene.physics.world.gravity.y;
    this.scene.physics.world.gravity.y = originalGravity * 0.3;
    
    this.scene.time.delayedCall(duration * 1000, () => {
      this.gravityResistance = false;
      this.scene.physics.world.gravity.y = originalGravity;
    });
    
    this.scene.showNotification('🌌 АНТИГРАВИТАЦИЯ', 1500, '#88aaff');
  }

  // =========================================================================
  // МОДЕРНИЗАЦИИ (ВАГОНЫ)
  // =========================================================================
  addModification(type = 'standard') {
    if (this.modifications.length >= this.maxMods) return false;
    
    this.modifications.push({ type, collectedAt: Date.now() });
    
    const modSprite = this.scene.add.image(
      this.sprite.x + 20 + this.modifications.length * 8,
      this.sprite.y - 15,
      'modification'
    ).setScale(0.5).setDepth(16);
    
    this.modSprites.push(modSprite);
    
    switch(type) {
      case 'booster':
        this.activateSpeedBoost(3, 1.3);
        break;
      case 'shield':
        this.activateShield(3);
        break;
      case 'magnet':
        this.activateMagnet(4);
        break;
      case 'double':
        this.activateDoubleCrystals(5);
        break;
    }
    
    try { audioManager.playSound(this.scene, 'wagon_sound', 0.4); } catch (e) {}
    
    return true;
  }

  updateModifications() {
    this.modSprites.forEach((mod, index) => {
      if (mod?.active) {
        mod.setPosition(
          this.sprite.x + 20 + index * 8,
          this.sprite.y - 15
        );
      }
    });
  }

  // =========================================================================
  // ОБНОВЛЕНИЕ
  // =========================================================================
  update(delta) {
    this.x = this.sprite.x;
    this.y = this.sprite.y;
    
    // Поворот в зависимости от скорости
    const angle = Phaser.Math.Clamp(this.sprite.body.velocity.y * 0.05, -20, 75);
    this.sprite.setAngle(angle);
    
    // Обновляем бонусы
    this.updateShield(delta);
    this.updateMagnet(delta);
    this.updateSpeedBoost(delta);
    this.updateInvincible(delta);
    this.updateDoubleCrystals(delta);
    
    // Обновляем модификации
    this.updateModifications();
    
    // Обновляем свечение
    if (this.glowEffect?.active) {
      this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
    }
    
    // Проверка выхода за границы
    if (this.sprite.y < -50 || this.sprite.y > this.scene.scale.height + 50) {
      return true;
    }
    
    return false;
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

  getHealthPercent() {
    return this.hp / this.maxHP;
  }

  getSkin() {
    return this.skin;
  }

  isAlive() {
    return this.hp > 0 && this.sprite?.active;
  }

  hasShield() {
    return this.shieldActive;
  }

  hasMagnet() {
    return this.magnetActive;
  }

  hasSpeedBoost() {
    return this.speedBoost > 1;
  }

  hasDoubleCrystals() {
    return this.doubleCrystals;
  }

  // =========================================================================
  // ОЧИСТКА
  // =========================================================================
  destroy() {
    if (this.trail) this.trail.destroy();
    if (this.shieldGraphics) this.shieldGraphics.destroy();
    if (this.glowEffect) this.glowEffect.destroy();
    if (this.auraEffect) this.auraEffect?.destroy();
    
    this.modSprites.forEach(m => m?.destroy());
    
    if (this.sprite?.active) {
      this.sprite.destroy();
    }
  }
}