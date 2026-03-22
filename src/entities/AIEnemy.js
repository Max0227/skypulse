import { ENEMY_CONFIG } from '../config';

export class AIEnemy {
  constructor(scene, x, y, type, worldType = null) {
    this.scene = scene;
    this.type = type;
    this.worldType = worldType || (scene.levelManager?.currentWorld ?? 0);
    
    // Получаем конфигурацию с учётом мира
    this.baseConfig = ENEMY_CONFIG[type];
    this.config = this.getWorldConfig();
    
    // Создаём спрайт
    this.sprite = scene.physics.add.image(x, y, this.getTextureForWorld())
      .setScale(1.2)
      .setDepth(10);
    
    // Настройка физики
    this.setupPhysics();
    
    this.sprite.enemyRef = this;
    
    // Характеристики
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    this.damage = this.config.damage;
    this.speed = this.config.speed;
    this.scoreValue = this.config.scoreValue;
    
    // Состояния
    this.state = 'patrol';
    this.patrolDirection = 1;
    this.patrolTimer = 0;
    this.fireCooldown = 0;
    this.attackCooldown = 0;
    this.stunTimer = 0;
    this.retreatTimer = 0;
    
    // Визуальные эффекты
    this.healthBar = null;
    this.createHealthBar();
    
    // Добавляем в группу врагов
    if (scene.enemyGroup) {
      scene.enemyGroup.add(this.sprite);
    }
  }

  getWorldConfig() {
    const config = { ...this.baseConfig };
    
    const modifiers = {
      0: { health: 1.0, speed: 1.0, damage: 1.0, score: 1.0 },
      1: { health: 0.8, speed: 1.3, damage: 1.2, score: 1.2 },
      2: { health: 1.5, speed: 0.8, damage: 1.5, score: 1.3 },
      3: { health: 1.2, speed: 1.2, damage: 1.3, score: 1.4 },
      4: { health: 1.4, speed: 0.7, damage: 1.4, score: 1.5 }
    };
    
    const mod = modifiers[this.worldType] || modifiers[0];
    
    config.health = Math.max(1, Math.floor(config.health * mod.health));
    config.speed = Math.floor(config.speed * mod.speed);
    config.damage = Math.floor(config.damage * mod.damage);
    config.scoreValue = Math.floor(config.scoreValue * mod.score);
    
    return config;
  }

  getTextureForWorld() {
    const textureMap = {
      drone: 'enemy_drone',
      sentinel: 'enemy_sentinel',
      skeleton: 'enemy_skeleton',
    };
    return textureMap[this.type] || 'enemy_drone';
  }

  setupPhysics() {
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setVelocityX(-this.config.speed);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setDrag(0.95);
    this.sprite.body.setCircle(14);
  }

  createHealthBar() {
    const barWidth = 35;
    const barHeight = 4;
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(0, 0, barWidth, barHeight);
    graphics.generateTexture('enemy_health_bar', barWidth, barHeight);
    graphics.destroy();
    
    this.healthBar = this.scene.add.image(this.sprite.x, this.sprite.y - 28, 'enemy_health_bar')
      .setScale(1, 0.5)
      .setDepth(20);
  }

  updateHealthBar() {
    if (!this.healthBar) return;
    
    const healthPercent = this.health / this.maxHealth;
    this.healthBar.setScale(healthPercent, 0.5);
    this.healthBar.setPosition(this.sprite.x, this.sprite.y - 28);
    
    if (healthPercent > 0.6) {
      this.healthBar.setTint(0x00ff00);
    } else if (healthPercent > 0.3) {
      this.healthBar.setTint(0xffaa00);
    } else {
      this.healthBar.setTint(0xff0000);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite && this.sprite.active) {
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
    this.scene.crystals += this.scoreValue;
    if (this.scene.crystalText) {
      this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    }
    
    if (this.scene.particleManager) {
      this.scene.particleManager.createEnemyDeathEffect(this.sprite.x, this.sprite.y);
    }
    
    if (this.healthBar) this.healthBar.destroy();
    
    if (this.scene.enemyGroup) {
      this.scene.enemyGroup.remove(this.sprite);
    }
    
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
    
    if (this.scene.waveManager) {
      const index = this.scene.waveManager.enemies.indexOf(this);
      if (index !== -1) {
        this.scene.waveManager.enemies.splice(index, 1);
      }
    }
  }

  update(playerPos, time, delta) {
    if (!this.sprite || !this.sprite.active) return;
    
    if (this.fireCooldown > 0) this.fireCooldown -= delta;
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    
    const dist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      playerPos.x, playerPos.y
    );
    
    if (dist < this.config.attackRange) {
      this.attack(playerPos);
    } else if (dist < this.config.detectionRange) {
      this.chase(playerPos);
    } else {
      this.patrol(delta);
    }
    
    this.updateHealthBar();
  }

  chase(playerPos) {
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      playerPos.x, playerPos.y
    );
    
    const speed = this.config.speed;
    this.sprite.setVelocityX(Math.cos(angle) * speed);
    this.sprite.setVelocityY(Math.sin(angle) * speed * 0.6);
  }

  attack(playerPos) {
    if (this.fireCooldown <= 0) {
      this.fireAtPlayer(playerPos);
      this.fireCooldown = this.config.fireDelay;
    }
    this.chase(playerPos);
  }

  fireAtPlayer(playerPos) {
    if (!this.scene.enemyBullets) return;
    
    const bullet = this.scene.enemyBullets.create(
      this.sprite.x - 15,
      this.sprite.y,
      'laser_enemy'
    );
    
    if (!bullet) return;
    
    bullet.setScale(1.2);
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
    
    if (this.patrolTimer > 2000) {
      this.patrolDirection *= -1;
      this.patrolTimer = 0;
    }
    
    this.sprite.setVelocityX(this.config.speed * this.patrolDirection);
    this.sprite.setVelocityY(Math.sin(this.patrolTimer * 0.002) * 30);
  }

  isActive() {
    return this.sprite && this.sprite.active && this.health > 0;
  }

  destroy() {
    if (this.healthBar) this.healthBar.destroy();
    if (this.sprite && this.sprite.active) this.sprite.destroy();
  }
}