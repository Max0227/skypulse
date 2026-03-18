export class Asteroid {
  constructor(scene, x, y, speed = 300, size = null) {
    this.scene = scene;
    
    // Случайный выбор текстуры
    const tex = Math.random() < 0.5 ? 'bg_asteroid_1' : 'bg_asteroid_2';
    
    // Случайный размер
    this.size = size || Phaser.Math.FloatBetween(0.5, 1.8);
    
    // Создаём спрайт
    this.sprite = scene.physics.add.image(x, y, tex)
      .setScale(this.size)
      .setDepth(5);
    
    // Настройка физики
    this.sprite.body.setCircle(15 * this.size);
    this.sprite.body.setAllowGravity(false);
    
    // Случайное направление
    const angle = Phaser.Math.FloatBetween(-0.8, 0.8);
    this.sprite.setVelocityX(-speed * (0.7 + Math.random() * 0.3));
    this.sprite.setVelocityY(speed * angle);
    this.sprite.setAngularVelocity(Phaser.Math.Between(-150, 150));
    
    // Ссылка на объект
    this.sprite.asteroidRef = this;
    
    // Характеристики
    this.active = true;
    this.damage = 1;
    this.health = Math.ceil(this.size * 2); // Крупные астероиды прочнее
    this.maxHealth = this.health;
    
    // Полоска здоровья (для крупных)
    if (this.size > 1.2) {
      this.createHealthBar();
    }
    
    // Эффект вращения
    this.rotationSpeed = Phaser.Math.Between(-2, 2);
  }

  createHealthBar() {
    const barWidth = 30;
    const barHeight = 3;
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffaa00, 1);
    graphics.fillRect(0, 0, barWidth, barHeight);
    graphics.generateTexture('asteroid_health_bar', barWidth, barHeight);
    graphics.destroy();
    
    this.healthBar = this.scene.add.image(this.sprite.x, this.sprite.y - 20, 'asteroid_health_bar')
      .setScale(1, 0.5)
      .setDepth(20);
  }

  updateHealthBar() {
    if (!this.healthBar) return;
    
    const healthPercent = this.health / this.maxHealth;
    this.healthBar.setScale(healthPercent, 0.5);
    this.healthBar.setPosition(this.sprite.x, this.sprite.y - 20);
    
    if (healthPercent < 0.3) {
      this.healthBar.setTint(0xff0000);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    
    if (this.health <= 0) {
      this.destroy(true);
      return true;
    }
    
    // Визуальный эффект
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(100, () => this.sprite.clearTint());
    
    return false;
  }

  update() {
    if (!this.sprite || !this.sprite.active) {
      this.active = false;
      return false;
    }
    
    // Вращение
    this.sprite.rotation += this.rotationSpeed * 0.01;
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
    
    // Проверка выхода за границы
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

  destroy(withExplosion = false) {
    if (withExplosion && this.scene.particleManager) {
      this.scene.particleManager.createExplosion(
        this.sprite.x, 
        this.sprite.y, 
        0xffaa00
      );
      
      // Маленькие осколки
      for (let i = 0; i < 5; i++) {
        this.createDebris();
      }
      
      try { this.scene.sound.play('explosion_sound', { volume: 0.2 }); } catch (e) {}
    }
    
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
    
    this.active = false;
  }

  createDebris() {
    const debris = this.scene.add.circle(
      this.sprite.x + Phaser.Math.Between(-20, 20),
      this.sprite.y + Phaser.Math.Between(-20, 20),
      Phaser.Math.Between(2, 5),
      0x888888,
      0.7
    );
    
    this.scene.time.delayedCall(1000, () => debris.destroy());
  }
}