export class Wagon {
  constructor(scene, x, y, index) {
    this.scene = scene;
    this.index = index;
    
    // Выбираем случайную текстуру
    const texIndex = Phaser.Math.Between(0, 9);
    this.texture = `wagon_${texIndex}`;
    
    // Создаём спрайт
    this.sprite = scene.physics.add.image(x, y, this.texture)
      .setScale(0.8)
      .setDepth(5 + index);
    
    // Настройка физики
    this.sprite.body.setCircle(12, 8, 6);
    this.sprite.body.setAllowGravity(true);
    this.sprite.body.setMass(0.5);
    this.sprite.body.setDrag(0.9);
    
    // Визуальные эффекты
    this.sprite.setTint(0x88aaff);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    
    // Ссылка на объект вагона
    this.sprite.wagonRef = this;
    
    // Характеристики
    this.hp = 1;
    this.maxHp = 1;
    this.active = true;
    
    // Полоска здоровья
    this.healthBar = null;
  }

  setHP(hp, maxHp) {
    this.hp = hp;
    this.maxHp = maxHp;
    this.sprite.setData('hp', hp);
    this.sprite.setData('maxHP', maxHp);
    
    if (maxHp > 1) {
      this.createHealthBar();
    }
  }

  createHealthBar() {
    const barWidth = 30;
    const barHeight = 3;
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillRect(0, 0, barWidth, barHeight);
    graphics.generateTexture('wagon_health_bar', barWidth, barHeight);
    graphics.destroy();
    
    this.healthBar = this.scene.add.image(this.sprite.x, this.sprite.y - 15, 'wagon_health_bar')
      .setScale(1, 0.5)
      .setDepth(20);
  }

  updateHealthBar() {
    if (!this.healthBar) return;
    
    const healthPercent = this.hp / this.maxHp;
    this.healthBar.setScale(healthPercent, 0.5);
    this.healthBar.setPosition(this.sprite.x, this.sprite.y - 15);
    
    if (healthPercent > 0.6) {
      this.healthBar.setTint(0x00ff00);
    } else if (healthPercent > 0.3) {
      this.healthBar.setTint(0xffaa00);
    } else {
      this.healthBar.setTint(0xff0000);
    }
  }

  takeDamage(amount = 1) {
    this.hp -= amount;
    
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    
    // Визуальный эффект
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(200, () => this.sprite.setTint(0x88aaff));
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
    
    return false;
  }

  update(prevX, prevY, gap, spring) {
    if (!this.sprite || !this.sprite.active) {
      this.active = false;
      return;
    }
    
    const targetX = prevX - gap;
    const targetY = prevY;
    
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    
    this.sprite.x += dx * spring;
    this.sprite.y += dy * spring;
    
    if (this.sprite.body) {
      this.sprite.body.reset(this.sprite.x, this.sprite.y);
    }
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
  }

  destroy() {
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    if (this.sprite && this.sprite.active) {
      // Эффект разрушения
      if (this.scene.particleManager) {
        this.scene.particleManager.createWagonDestroyEffect(this.sprite);
      }
      
      // Звук
      try { this.scene.sound.play('hit_sound', { volume: 0.4 }); } catch (e) {}
      
      this.sprite.destroy();
    }
    
    this.active = false;
  }
}