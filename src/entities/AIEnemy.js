import { ENEMY_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';

export class AIEnemy {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type;
    this.config = ENEMY_CONFIG[type];
    this.sprite = scene.physics.add.image(x, y, 'enemy_' + type).setScale(1.2);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setAllowGravity(false);
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    
    this.createHealthBar();
    
    this.state = 'patrol';
    this.patrolDirection = 1;
    this.patrolTimer = 0;
    this.attackCooldown = 0;
    this.fireCooldown = 0;

    this.sprite.enemyRef = this;

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

  takeDamage(amount) {
    this.health -= amount;
    
    if (this.healthBar) {
      const healthPercent = this.health / this.maxHealth;
      this.healthBar.setScale(healthPercent, 0.5);
      
      if (healthPercent > 0.5) {
        this.healthBar.setTint(0x00ff00);
      } else if (healthPercent > 0.25) {
        this.healthBar.setTint(0xffaa00);
      } else {
        this.healthBar.setTint(0xff0000);
      }
    }
    
    if (this.health <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  die() {
    this.scene.crystals += this.config.scoreValue;
    this.scene.particleManager.createEnemyDeathEffect(this.sprite.x, this.sprite.y);
    if (this.scene.enemyGroup) {
      this.scene.enemyGroup.remove(this.sprite);
    }
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    this.sprite.destroy();
    if (this.scene.waveManager) {
      this.scene.waveManager.enemies = this.scene.waveManager.enemies.filter(e => e !== this);
    }
  }

  update(playerPos, time, delta) {
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerPos.x, playerPos.y);
    if (dist < this.config.attackRange) {
      this.state = 'attack';
    } else if (dist < this.config.detectionRange) {
      this.state = 'chase';
    } else {
      this.state = 'patrol';
    }

    this.attackCooldown -= delta;
    this.fireCooldown -= delta;

    if (this.healthBar) {
      this.healthBar.setPosition(this.sprite.x, this.sprite.y - 20);
    }

    switch(this.state) {
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
  }

  chase(playerPos) {
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, playerPos.x, playerPos.y);
    this.sprite.setVelocityX(Math.cos(angle) * this.config.speed);
    this.sprite.setVelocityY(Math.sin(angle) * this.config.speed);
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

    const bullet = this.scene.enemyBullets.create(this.sprite.x - 20, this.sprite.y, 'laser_enemy');
    bullet.setScale(1.5);
    bullet.damage = this.config.bulletDamage;
    bullet.body.setAllowGravity(false);
    bullet.body.setGravityY(0);
    
    const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, playerPos.x, playerPos.y);
    const speed = this.config.bulletSpeed;
    
    bullet.setVelocityX(Math.cos(angle) * speed);
    bullet.setVelocityY(Math.sin(angle) * speed);
    bullet.setDepth(20);
  }

  patrol(delta) {
    this.patrolTimer += delta;
    if (this.patrolTimer > 2000) {
      this.patrolDirection *= -1;
      this.patrolTimer = 0;
    }
    this.sprite.setVelocityX(this.config.speed * this.patrolDirection);
    this.sprite.setVelocityY(Math.sin(this.patrolTimer * 0.01) * 50);
  }
}