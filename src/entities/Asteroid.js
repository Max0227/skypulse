export class Asteroid {
  constructor(scene, x, y, speed = 300) {
    this.scene = scene;
    
    // Случайный выбор текстуры астероида
    const tex = Math.random() < 0.5 ? 'bg_asteroid_1' : 'bg_asteroid_2';
    
    // Случайный размер
    this.scale = Phaser.Math.FloatBetween(0.5, 1.5);
    
    // Создаём спрайт с физикой
    this.sprite = scene.physics.add.image(x, y, tex)
      .setScale(this.scale)
      .setDepth(5);
    
    // Настраиваем физическое тело
    if (this.sprite.body) {
      this.sprite.body.setCircle(15 * this.scale);
      this.sprite.body.setAllowGravity(false);
      
      // Случайное направление и скорость
      const angle = Phaser.Math.FloatBetween(-0.5, 0.5);
      this.sprite.body.setVelocityX(-speed * 0.8);
      this.sprite.body.setVelocityY(speed * angle);
      this.sprite.body.setAngularVelocity(Phaser.Math.Between(-100, 100));
    }
    
    // Ссылка на объект астероида
    this.sprite.asteroidRef = this;
    
    // Свойства
    this.active = true;
    this.damage = 1;
  }

  /**
   * Обновление состояния астероида
   * @returns {boolean} - true если астероид ещё активен, false если должен быть удалён
   */
  update() {
    // Проверяем существование спрайта
    if (!this.sprite || !this.sprite.active) {
      this.active = false;
      return false;
    }
    
    // Проверяем выход за границы экрана
    const bounds = this.scene.scale;
    if (this.sprite.x < -150 || 
        this.sprite.x > bounds.width + 150 ||
        this.sprite.y < -150 || 
        this.sprite.y > bounds.height + 150) {
      this.destroy();
      return false;
    }
    
    return true;
  }

  /**
   * Уничтожение астероида
   */
  destroy() {
    if (this.sprite && this.sprite.active) {
      // Эффект взрыва при уничтожении (опционально)
      if (this.scene.particleManager) {
        this.scene.particleManager.createExplosion(this.sprite.x, this.sprite.y, 0xffaa00);
      }
      this.sprite.destroy();
    }
    this.active = false;
  }

  /**
   * Проверка столкновения с игроком
   */
  hitPlayer(player) {
    if (!player.shieldActive) {
      player.takeDamage(this.damage);
      this.destroy();
      return true;
    }
    return false;
  }
}