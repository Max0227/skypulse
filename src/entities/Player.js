import { gameManager } from '../managers/GameManager';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.skin = gameManager.getCurrentSkin();
    
    this.sprite = scene.physics.add.image(x, y, this.skin)
      .setScale(0.9)
      .setCollideWorldBounds(false)
      .setDepth(15);
    this.sprite.body.setCircle(24, 15, 5);
    this.sprite.body.setMass(10000);
    this.sprite.body.setDrag(500, 0);

    // Характеристики
    this.jumpPower = 300;
    this.maxHP = 3;
    this.hp = this.maxHP;
    this.shieldActive = false;
    this.speedBoost = 1;
    this.magnetActive = false;
    this.magnetRange = 220;

    // Модернизация (собираемые предметы)
    this.modifications = [];
    this.maxMods = 5;
    
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

    // Частицы для модернизации
    this.modSprites = [];
  }

  flap() {
    this.sprite.body.setVelocityY(-this.jumpPower);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 150,
      ease: 'Quad.out'
    });
  }

  takeDamage(amount) {
    if (this.shieldActive) return false;
    this.hp -= amount;
    if (this.hp <= 0) return true;
    
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(500, () => this.sprite.clearTint());
    return false;
  }

  // Добавить модернизацию (при сборе синего куба)
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
        this.speedBoost = 1.2;
        break;
      case 'shield':
        this.activateShield(3);
        break;
      case 'magnet':
        this.activateMagnet(5);
        break;
    }
    
    return true;
  }

  activateShield(duration) {
    this.shieldActive = true;
    this.sprite.setTint(0x00ffff);
    this.scene.time.delayedCall(duration * 1000, () => {
      this.shieldActive = false;
      this.sprite.clearTint();
    });
  }

  activateMagnet(duration) {
    this.magnetActive = true;
    this.sprite.setTint(0xff00ff);
    this.scene.time.delayedCall(duration * 1000, () => {
      this.magnetActive = false;
      this.sprite.clearTint();
    });
  }

  update() {
    // Угол наклона
    this.sprite.setAngle(Phaser.Math.Clamp(this.sprite.body.velocity.y * 0.05, -20, 75));

    // Проверка границ
    if (this.sprite.y < -50 || this.sprite.y > this.scene.scale.height + 50) {
      return true; // смерть
    }

    // Обновляем позиции модов
    this.modSprites.forEach((mod, index) => {
      mod.setPosition(
        this.sprite.x + 20 + index * 8,
        this.sprite.y - 15
      );
    });

    return false;
  }

  destroy() {
    if (this.trail) this.trail.destroy();
    this.modSprites.forEach(m => m.destroy());
    this.sprite.destroy();
  }
}