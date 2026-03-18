export class PowerUp {
  constructor(scene, x, y, type = 'booster') {
    this.scene = scene;
    this.type = type;
    
    // Настройки разных типов
    const configs = {
      booster: { color: 0x00ffff, duration: 5000, effect: 'speed' },
      shield:  { color: 0x00ff00, duration: 5000, effect: 'shield' },
      magnet:  { color: 0xff00ff, duration: 7000, effect: 'magnet' },
      slowmo:  { color: 0xffaa00, duration: 4000, effect: 'slow' }
    };
    
    this.config = configs[type] || configs.booster;
    
    this.sprite = scene.physics.add.image(x, y, 'powerup')
      .setScale(0.8)
      .setDepth(8)
      .setTint(this.config.color);
    
    this.sprite.body.setAllowGravity(false);
    this.sprite.setVelocityX(-200);
    this.sprite.setAngularVelocity(100);
    
    this.sprite.powerUpRef = this;
    this.collected = false;
  }

  collect(player) {
    if (this.collected) return;
    this.collected = true;
    
    // Применяем эффект
    switch(this.config.effect) {
      case 'speed':
        player.speedBoost = 1.5;
        this.scene.time.delayedCall(this.config.duration, () => {
          player.speedBoost = 1;
        });
        player.sprite.setTint(0xffff00);
        this.scene.time.delayedCall(this.config.duration, () => {
          player.sprite.clearTint();
        });
        break;
        
      case 'shield':
        player.shieldActive = true;
        player.sprite.setTint(0x00ffff);
        this.scene.time.delayedCall(this.config.duration, () => {
          player.shieldActive = false;
          player.sprite.clearTint();
        });
        break;
        
      case 'magnet':
        player.magnetActive = true;
        player.magnetRange = 300;
        player.sprite.setTint(0xff00ff);
        this.scene.time.delayedCall(this.config.duration, () => {
          player.magnetActive = false;
          player.magnetRange = 220;
          player.sprite.clearTint();
        });
        break;
        
      case 'slow':
        this.scene.currentSpeed = this.scene.baseSpeed * 0.6;
        this.scene.time.delayedCall(this.config.duration, () => {
          this.scene.currentSpeed = this.scene.baseSpeed;
        });
        break;
    }
    
    // Эффект частиц
    if (this.scene.particleManager) {
      this.scene.particleManager.createBonusEffect(this.type, this.sprite.x, this.sprite.y);
    }
    
    // Звук
    try { this.scene.sound.play('powerup_sound', { volume: 0.5 }); } catch (e) {}
    
    this.sprite.destroy();
  }

  update() {
    // Проверка выхода за экран
    if (this.sprite.x < -100) {
      this.sprite.destroy();
      return false;
    }
    return true;
  }
}