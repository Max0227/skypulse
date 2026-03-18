import { POWERUP_TYPES } from '../config';
import { audioManager } from '../managers/AudioManager';

export class PowerUp {
  constructor(scene, x, y, type = 'booster') {
    this.scene = scene;
    this.type = type;
    this.config = POWERUP_TYPES[type] || POWERUP_TYPES.booster;
    
    // Создаём спрайт
    this.sprite = scene.physics.add.image(x, y, 'powerup')
      .setScale(0.8)
      .setDepth(8)
      .setTint(this.config.color);
    
    // Настройка физики
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);
    this.sprite.body.setVelocityX(-200);
    
    // Визуальные эффекты
    this.sprite.setAngularVelocity(100);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    
    // Ссылка на объект
    this.sprite.powerUpRef = this;
    
    // Характеристики
    this.collected = false;
    this.active = true;
    this.pulseDirection = 1;
    this.baseScale = 0.8;
    this.pulseTimer = 0;
    
    // Эффект свечения
    this.glow = scene.add.circle(x, y, 20, this.config.color, 0.3)
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);
    
    // Добавляем в группу
    if (scene.powerUpGroup) {
      scene.powerUpGroup.add(this.sprite);
    }
  }

  update(delta) {
    if (!this.sprite || !this.sprite.active) {
      this.active = false;
      return false;
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
        this.glow.setScale(this.baseScale * 1.2);
      }
    }
    
    // Проверка выхода за экран
    if (this.sprite.x < -100) {
      this.destroy();
      return false;
    }
    
    return true;
  }

  collect(player) {
    if (this.collected) return;
    this.collected = true;
    
    // Применяем эффект
    this.applyEffect(player);
    
    // Эффект сбора
    this.createCollectEffect();
    
    // Звук
    try { audioManager.playSound(this.scene, 'powerup_sound', 0.5); } catch (e) {}
    
    // Уведомление
    this.showNotification();
    
    // Уничтожаем
    this.destroy();
  }

  applyEffect(player) {
    switch(this.config.effect) {
      case 'speed':
        player.activateSpeedBoost(this.config.duration / 1000, 1.5);
        this.scene.currentSpeed = this.scene.baseSpeed * 1.5;
        this.scene.time.delayedCall(this.config.duration, () => {
          this.scene.currentSpeed = this.scene.baseSpeed;
        });
        break;
        
      case 'shield':
        player.activateShield(this.config.duration / 1000);
        break;
        
      case 'magnet':
        player.activateMagnet(this.config.duration / 1000);
        break;
        
      case 'slow':
        this.scene.currentSpeed = this.scene.baseSpeed * 0.6;
        player.sprite.setTint(0xff8800);
        this.scene.time.delayedCall(this.config.duration, () => {
          this.scene.currentSpeed = this.scene.baseSpeed;
          player.sprite.clearTint();
        });
        break;
        
      case 'double':
        player.activateDoubleCrystals(this.config.duration / 1000);
        break;
        
      case 'invincible':
        player.activateInvincible(this.config.duration / 1000);
        break;
    }
    
    // Добавляем модернизацию на такси
    if (this.config.effect !== 'slow') {
      player.addModification(this.type);
    }
  }

  createCollectEffect() {
    if (this.scene.particleManager) {
      this.scene.particleManager.createBonusEffect(
        this.type,
        this.sprite.x,
        this.sprite.y
      );
    }
  }

  showNotification() {
    const w = this.scene.scale.width;
    
    const notification = this.scene.add.text(
      w / 2, 
      120, 
      `${this.config.icon} ${this.config.name}!`, 
      {
        fontSize: '20px',
        fontFamily: "'Orbitron', sans-serif",
        color: this.getColorString(),
        stroke: '#ffffff',
        strokeThickness: 2,
        shadow: { blur: 10, color: this.getColorString(), fill: true }
      }
    ).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 2000,
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
      invincible: '#ffffff'
    };
    return colors[this.config.effect] || '#ffffff';
  }

  destroy() {
    if (this.glow) this.glow.destroy();
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
    this.active = false;
  }
}