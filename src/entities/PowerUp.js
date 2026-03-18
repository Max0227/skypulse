export class PowerUp {
  constructor(scene, x, y, type = 'booster') {
    this.scene = scene;
    this.type = type;
    
    // Конфигурация разных типов усилителей
    const configs = {
      booster: { 
        color: 0x00ffff, 
        duration: 5000, 
        effect: 'speed',
        name: 'Ускорение',
        icon: '🚀'
      },
      shield: { 
        color: 0x00ff00, 
        duration: 5000, 
        effect: 'shield',
        name: 'Щит',
        icon: '🛡️'
      },
      magnet: { 
        color: 0xff00ff, 
        duration: 7000, 
        effect: 'magnet',
        name: 'Магнит',
        icon: '🧲'
      },
      slowmo: { 
        color: 0xffaa00, 
        duration: 4000, 
        effect: 'slow',
        name: 'Замедление',
        icon: '⏳'
      }
    };
    
    this.config = configs[type] || configs.booster;
    
    // Создаём спрайт с физикой
    this.sprite = scene.physics.add.image(x, y, 'powerup')
      .setScale(0.8)
      .setDepth(8)
      .setTint(this.config.color);
    
    // Настраиваем физику
    if (this.sprite.body) {
      this.sprite.body.setAllowGravity(false);
      this.sprite.body.setVelocityX(-200);
      this.sprite.body.setAngularVelocity(100);
    }
    
    // Ссылка на объект усилителя
    this.sprite.powerUpRef = this;
    
    // Свойства
    this.collected = false;
    this.active = true;
  }

  /**
   * Обновление состояния усилителя
   */
  update() {
    if (!this.sprite || !this.sprite.active) {
      this.active = false;
      return false;
    }
    
    // Удаляем, если улетел за экран
    if (this.sprite.x < -100) {
      this.destroy();
      return false;
    }
    
    return true;
  }

  /**
   * Сбор усилителя игроком
   */
  collect(player) {
    if (this.collected) return;
    this.collected = true;
    
    // Показываем уведомление
    if (this.scene.showNotification) {
      this.scene.showNotification(`${this.config.icon} ${this.config.name}!`, 2000, this.getColorString());
    }
    
    // Применяем эффект в зависимости от типа
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
        if (this.scene.currentSpeed) {
          const originalSpeed = this.scene.currentSpeed;
          this.scene.currentSpeed = originalSpeed * 0.6;
          this.scene.time.delayedCall(this.config.duration, () => {
            this.scene.currentSpeed = originalSpeed;
          });
        }
        break;
    }
    
    // Эффект частиц
    if (this.scene.particleManager) {
      this.scene.particleManager.createBonusEffect(this.type, this.sprite.x, this.sprite.y);
    }
    
    // Звук
    try { 
      this.scene.sound.play('powerup_sound', { volume: 0.5 }); 
    } catch (e) {
      // Игнорируем ошибки звука
    }
    
    this.destroy();
  }

  /**
   * Получение цвета в строковом формате для уведомлений
   */
  getColorString() {
    const colors = {
      booster: '#00ffff',
      shield: '#00ff00',
      magnet: '#ff00ff',
      slowmo: '#ffaa00'
    };
    return colors[this.type] || '#ffffff';
  }

  /**
   * Уничтожение усилителя
   */
  destroy() {
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
    this.active = false;
  }
}