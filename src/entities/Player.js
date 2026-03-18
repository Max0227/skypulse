import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.skin = gameManager.getCurrentSkin();
    
    // Создание спрайта с физикой
    this.sprite = scene.physics.add.image(x, y, this.skin)
      .setScale(0.9)
      .setCollideWorldBounds(false)
      .setDepth(15);
    
    // Настройка физического тела
    this.sprite.body.setCircle(24, 15, 5);
    this.sprite.body.setMass(10000);
    this.sprite.body.setDrag(500, 0);
    this.sprite.body.setMaxVelocity(600, 1000);
    
    // Ссылка на объект игрока
    this.sprite.playerRef = this;
    
    // Характеристики
    this.jumpPower = 300;
    this.maxHP = 3;
    this.hp = this.maxHP;
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
    
    // Модернизации (визуальные элементы на такси)
    this.modifications = [];
    this.maxMods = 5;
    this.modSprites = [];
    
    // След
    this.trail = scene.add.particles(0, 0, 'flare', {
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
    
    // Визуальные эффекты
    this.shieldGraphics = null;
    this.glowEffect = null;
  }

  applyUpgrades(upgrades) {
    this.jumpPower = 300 + (upgrades.jumpPower || 0) * 25;
    this.maxHP = 3 + (upgrades.headHP || 0);
    this.hp = this.maxHP;
    this.shieldDuration = 5 + (upgrades.shieldDuration || 0) * 1.5;
    this.magnetRange = 220 + (upgrades.magnetRange || 0) * 40;
  }

  flap() {
    this.sprite.body.setVelocityY(-this.jumpPower * this.speedBoost);
    
    // Анимация сжатия при прыжке
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0.85,
      scaleY: 0.85,
      duration: 100,
      ease: 'Quad.easeOut',
      yoyo: true
    });
    
    // Эффект крыльев
    this.createFlapEffect();
    
    // Звук
    try { audioManager.playSound(this.scene, 'tap_sound', 0.3); } catch (e) {}
    
    // Вибро
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } catch (e) {}
  }

  createFlapEffect() {
    const emitter = this.scene.add.particles(this.sprite.x - 10, this.sprite.y, 'flare', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 200,
      quantity: 3,
      blendMode: Phaser.BlendModes.ADD,
      tint: 0x00ffff
    });
    emitter.explode(3);
    
    this.scene.time.delayedCall(300, () => emitter.destroy());
  }

  takeDamage(amount = 1) {
    if (this.shieldActive || this.invincible) {
      this.createShieldDeflect();
      return false;
    }
    
    this.hp -= amount;
    
    // Визуальный эффект получения урона
    this.sprite.setTint(0xff8888);
    this.scene.cameras.main.shake(100, 0.005);
    
    try { audioManager.playSound(this.scene, 'hit_sound', 0.3); } catch (e) {}
    
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    } catch (e) {}
    
    this.scene.time.delayedCall(300, () => this.sprite.clearTint());
    
    if (this.hp <= 0) {
      return true; // смерть
    }
    
    return false;
  }

  createShieldDeflect() {
    this.scene.particleManager.createBonusEffect('shield', this.sprite.x, this.sprite.y);
    try { audioManager.playSound(this.scene, 'shield_sound', 0.3); } catch (e) {}
  }

  activateShield(duration = null) {
    const dur = duration || this.shieldDuration;
    this.shieldActive = true;
    this.shieldTime = dur;
    
    this.sprite.setTint(0x00ffff);
    this.scene.particleManager.createShieldEffect(this.sprite);
    
    try { audioManager.playSound(this.scene, 'shield_sound', 0.5); } catch (e) {}
    
    this.scene.showNotification('🛡️ ЩИТ АКТИВИРОВАН', 1500, '#00ffff');
  }

  deactivateShield() {
    this.shieldActive = false;
    this.shieldTime = 0;
    this.sprite.clearTint();
    
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
    
    const radius = 35 + Math.sin(this.scene.time.now * 0.01) * 5;
    const alpha = 0.3 + Math.sin(this.scene.time.now * 0.02) * 0.2;
    
    this.shieldGraphics.clear();
    this.shieldGraphics.lineStyle(2, 0x00ffff, alpha);
    this.shieldGraphics.strokeCircle(this.sprite.x, this.sprite.y, radius);
  }

  activateMagnet(duration = 7) {
    this.magnetActive = true;
    this.magnetTime = duration;
    
    this.sprite.setTint(0xff00ff);
    this.scene.particleManager.createBonusEffect('magnet', this.sprite.x, this.sprite.y);
    
    try { audioManager.playSound(this.scene, 'magnet_sound', 0.5); } catch (e) {}
    
    this.scene.showNotification('🧲 МАГНИТ АКТИВИРОВАН', 1500, '#ff00ff');
  }

  deactivateMagnet() {
    this.magnetActive = false;
    this.magnetTime = 0;
    this.sprite.clearTint();
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
    const coins = this.scene.coinGroup.getChildren();
    coins.forEach(coin => {
      const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, coin.x, coin.y);
      if (dist < this.magnetRange) {
        const angle = Phaser.Math.Angle.Between(coin.x, coin.y, this.sprite.x, this.sprite.y);
        coin.x += Math.cos(angle) * 15;
        coin.y += Math.sin(angle) * 15;
      }
    });
  }

  activateSpeedBoost(duration = 5, multiplier = 1.5) {
    this.speedBoost = multiplier;
    this.speedTime = duration;
    
    this.sprite.setTint(0xffff00);
    this.scene.particleManager.createBonusEffect('speed', this.sprite.x, this.sprite.y);
    
    try { audioManager.playSound(this.scene, 'speed_sound', 0.5); } catch (e) {}
    
    this.scene.showNotification(`🚀 УСКОРЕНИЕ x${multiplier}`, 1500, '#ffff00');
  }

  deactivateSpeedBoost() {
    this.speedBoost = 1;
    this.speedTime = 0;
    this.sprite.clearTint();
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
    
    this.sprite.setTint(0xffffff);
    this.scene.particleManager.createBonusEffect('invincible', this.sprite.x, this.sprite.y);
    
    try { audioManager.playSound(this.scene, 'shield_sound', 0.5); } catch (e) {}
    
    this.scene.showNotification('✨ НЕУЯЗВИМОСТЬ', 1500, '#ffffff');
  }

  deactivateInvincible() {
    this.invincible = false;
    this.invincibleTime = 0;
    this.sprite.clearTint();
  }

  updateInvincible(delta) {
    if (this.invincible) {
      this.invincibleTime -= delta / 1000;
      if (this.invincibleTime <= 0) {
        this.deactivateInvincible();
      } else {
        // Мерцание
        this.sprite.alpha = 0.5 + Math.sin(this.scene.time.now * 0.02) * 0.3;
      }
    } else {
      this.sprite.alpha = 1;
    }
  }

  activateDoubleCrystals(duration = 10) {
    this.doubleCrystals = true;
    this.doubleTime = duration;
    
    this.sprite.setTint(0xffaa00);
    this.scene.particleManager.createBonusEffect('double', this.sprite.x, this.sprite.y);
    
    this.scene.showNotification('💎 ДВОЙНЫЕ КРИСТАЛЛЫ', 1500, '#ffaa00');
  }

  deactivateDoubleCrystals() {
    this.doubleCrystals = false;
    this.doubleTime = 0;
    this.sprite.clearTint();
  }

  updateDoubleCrystals(delta) {
    if (this.doubleCrystals) {
      this.doubleTime -= delta / 1000;
      if (this.doubleTime <= 0) {
        this.deactivateDoubleCrystals();
      }
    }
  }

  addModification(type = 'standard') {
    if (this.modifications.length >= this.maxMods) return false;
    
    this.modifications.push({ type, collectedAt: Date.now() });
    
    // Создаём визуальный элемент на такси
    const modSprite = this.scene.add.image(
      this.sprite.x + 20 + this.modifications.length * 8,
      this.sprite.y - 15,
      'modification'
    ).setScale(0.5).setDepth(16);
    
    this.modSprites.push(modSprite);
    
    // Эффект в зависимости от типа
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
    
    return true;
  }

  updateModifications() {
    this.modSprites.forEach((mod, index) => {
      mod.setPosition(
        this.sprite.x + 20 + index * 8,
        this.sprite.y - 15
      );
    });
  }

  update(delta) {
    // Обновляем позицию
    this.x = this.sprite.x;
    this.y = this.sprite.y;
    
    // Поворот в зависимости от скорости падения
    const angle = Phaser.Math.Clamp(this.sprite.body.velocity.y * 0.05, -20, 75);
    this.sprite.setAngle(angle);
    
    // Обновляем все бонусы
    this.updateShield(delta);
    this.updateMagnet(delta);
    this.updateSpeedBoost(delta);
    this.updateInvincible(delta);
    this.updateDoubleCrystals(delta);
    
    // Обновляем модификации
    this.updateModifications();
    
    // Проверка выхода за границы
    if (this.sprite.y < -50 || this.sprite.y > this.scene.scale.height + 50) {
      return true; // смерть
    }
    
    return false;
  }

  destroy() {
    if (this.trail) this.trail.destroy();
    if (this.shieldGraphics) this.shieldGraphics.destroy();
    this.modSprites.forEach(m => m.destroy());
    this.sprite.destroy();
  }
}