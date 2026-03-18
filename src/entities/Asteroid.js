export class Asteroid {
  constructor(scene, x, y, speed = 300) {
    this.scene = scene;
    
    // Случайный размер и текстура
    const tex = Math.random() < 0.5 ? 'bg_asteroid_1' : 'bg_asteroid_2';
    const scale = Phaser.Math.FloatBetween(0.5, 1.5);
    
    this.sprite = scene.physics.add.image(x, y, tex)
      .setScale(scale)
      .setDepth(5);
    
    // Физика
    this.sprite.body.setCircle(15 * scale);
    this.sprite.body.setAllowGravity(false);
    
    // Скорость и направление (случайное отклонение по Y)
    const angle = Phaser.Math.FloatBetween(-0.5, 0.5);
    this.sprite.setVelocityX(-speed * 0.8);
    this.sprite.setVelocityY(speed * angle);
    this.sprite.setAngularVelocity(Phaser.Math.Between(-100, 100));
    
    this.sprite.asteroidRef = this;
    this.active = true;
    this.damage = 1;
  }

  update() {
    // Проверка выхода за границы экрана
    if (this.sprite.x < -100 || 
        this.sprite.y < -100 || 
        this.sprite.y > this.scene.scale.height + 100) {
      this.destroy();
      return false;
    }
    return true;
  }

  destroy() {
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
    this.active = false;
  }
}