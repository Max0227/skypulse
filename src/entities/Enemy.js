import { ENEMY_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';

export class Enemy {
  constructor(scene, x, y, type = 'drone') {
    this.scene = scene;
    this.type = type;
    this.config = ENEMY_CONFIG[type];
    
    // Создаём спрайт
    this.sprite = scene.physics.add.image(x, y, this.config.texture)
      .setScale(1.2)
      .setDepth(10);
    
    // Настройка физики
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setVelocityX(-this.config.speed);
    this.sprite.setCollideWorldBounds(true);
    
    // Ссылка на объект врага
    this.sprite.enemyRef = this;
    
    // Характеристики
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    
    // Состояния
    this.state = 'patrol'; // patrol, chase, attack
    this.patrolDirection = 1;
    this.patrolTimer = 0;
    this.fireCooldown = 0;
    this.attackCooldown = 0;
    
    // Полоска здоровья
    this.healthBar = null;
    this.createHealthBar();
    
    // Добавляем в группу врагов
    if (scene.enemyGroup) {
      scene.enemyGroup.add(this.sprite);
    }
  }

  createHealthBar() {
    const barWidth = 30;
    const barHeight = 4;
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(0, 0, barWidth, barHeight);
    graphics.generateTexture('enemy_health_bar', barWidth, barHeight);
    graphics.destroy();
    
    this.healthBar = this.scene.add.image(this.sprite.x, this.sprite.y - 20, 'enemy_health_bar')
      .setScale(1, 0.5)
      .setDepth(20);
  }

  updateHealthBar() {
    if (!this.healthBar) return;
    
    const healthPercent = this.health / this.maxHealth;
    this.healthBar.setScale(healthPercent, 0.5);
    
    // Меняем цвет в зависимости от здоровья
    if (healthPercent > 0.6) {
      this.healthBar.setTint(0x00ff00);
    } else if (healthPercent > 0.3) {
      this.healthBar.setTint(0xffaa00);
    } else {
      this.healthBar.setTint(0xff0000);
    }
    
    // Обновляем позицию
    this.healthBar.setPosition(this.sprite.x, this.sprite.y - 25);
  }

  update(playerPos, time, delta) {
    if (!this.sprite.active) return;
    
    const dist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      playerPos.x, playerPos.y
    );
    
    // Определяем состояние
    if (dist < this.config.attackRange) {
      this.state = 'attack';
    } else if (dist < this.config.detectionRange) {
      this.state = 'chase';
    } else {
      this.state = 'patrol';
    }
    
    // Обновляем кулдауны
    if (this.fireCooldown > 0) {
      this.fireCooldown -= delta;
    }
    
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
    
    // Выполняем действие согласно состоянию
    switch (this.state) {
      case 'chase':
        this.chase(playerPos);
        break;
      case 'attack':
        this.attack(playerPos);
        break;
      case 'patrol':
        this.patrol(delta);
        break;
    }
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
  }

  chase(playerPos) {
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      playerPos.x, playerPos.y
    );
    
    this.sprite.setVelocityX(Math.cos(angle) * this.config.speed);
    this.sprite.setVelocityY(Math.sin(angle) * this.config.speed * 0.5);
  }

  attack(playerPos) {
    // Стрельба
    if (this.fireCooldown <= 0) {
      this.fireAtPlayer(playerPos);
      this.fireCooldown = this.config.fireDelay;
    }
    
    // Продолжаем преследование
    this.chase(playerPos);
    
    // Визуальный эффект атаки
    if (this.attackCooldown <= 0) {
      this.sprite.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => this.sprite.clearTint());
      this.attackCooldown = 300;
    }
  }

  fireAtPlayer(playerPos) {
    if (!this.scene.enemyBullets) return;
    
    const bullet = this.scene.enemyBullets.create(
      this.sprite.x - 20,
      this.sprite.y,
      'laser_enemy'
    );
    
    if (!bullet) return;
    
    bullet.setScale(1.5);
    bullet.damage = this.config.bulletDamage;
    bullet.body.setAllowGravity(false);
    bullet.body.setGravityY(0);
    
    const angle = Phaser.Math.Angle.Between(
      bullet.x, bullet.y,
      playerPos.x, playerPos.y
    );
    
    const speed = this.config.bulletSpeed;
    bullet.setVelocityX(Math.cos(angle) * speed);
    bullet.setVelocityY(Math.sin(angle) * speed);
    
    bullet.setDepth(20);
    bullet.active = true;
    bullet.enemyBullet = true;
  }

  patrol(delta) {
    this.patrolTimer += delta;
    
    // Меняем направление каждые 2 секунды
    if (this.patrolTimer > 2000) {
      this.patrolDirection *= -1;
      this.patrolTimer = 0;
    }
    
    this.sprite.setVelocityX(this.config.speed * this.patrolDirection);
    this.sprite.setVelocityY(Math.sin(this.patrolTimer * 0.001) * 30);
  }

  takeDamage(amount) {
    this.health -= amount;
    
    // Визуальный эффект урона
    this.sprite.setTint(0xff6666);
    this.scene.time.delayedCall(200, () => {
      if (this.sprite.active) {
        this.sprite.setTint(0xffffff);
      }
    });
    
    if (this.health <= 0) {
      this.die();
      return true;
    }
    
    return false;
  }

  die() {
    // Добавляем кристаллы
    this.scene.crystals += this.config.scoreValue;
    if (this.scene.crystalText) {
      this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    }
    gameManager.addCrystals(this.config.scoreValue);
    
    // Эффект смерти
    if (this.scene.particleManager) {
      this.scene.particleManager.createEnemyDeathEffect(
        this.sprite.x,
        this.sprite.y
      );
    }
    
    // Звук
    try { this.scene.sound.play('enemy_die_sound', { volume: 0.3 }); } catch (e) {}
    
    // Удаляем из группы
    if (this.scene.enemyGroup) {
      this.scene.enemyGroup.remove(this.sprite);
    }
    
    // Удаляем полоску здоровья
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    // Уничтожаем спрайт
    this.sprite.destroy();
    
    // Удаляем из волны
    if (this.scene.waveManager) {
      this.scene.waveManager.enemies = 
        this.scene.waveManager.enemies.filter(e => e !== this);
    }
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  isActive() {
    return this.sprite && this.sprite.active && this.health > 0;
  }

  destroy() {
    if (this.healthBar) this.healthBar.destroy();
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
  }
}