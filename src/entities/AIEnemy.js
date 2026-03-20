import Phaser from 'phaser';
import { ENEMY_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class AIEnemy {
  constructor(scene, x, y, type = 'drone', worldType = null) {
    this.scene = scene;
    this.type = type;
    this.worldType = worldType || (scene.levelManager?.currentWorld ?? 0);
    
    // Получаем конфигурацию с учётом мира
    this.baseConfig = ENEMY_CONFIG[type];
    this.config = this.getWorldConfig();
    
    // Создаём спрайт с учётом мира
    this.sprite = scene.physics.add.image(x, y, this.getTextureForWorld())
      .setScale(1.2)
      .setDepth(10);
    
    // Настройка физики
    this.setupPhysics();
    
    // Ссылка на объект врага
    this.sprite.enemyRef = this;
    
    // Характеристики с учётом мира
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    this.damage = this.config.damage;
    this.speed = this.config.speed;
    this.scoreValue = this.config.scoreValue;
    
    // Состояния
    this.state = 'patrol'; // patrol, chase, attack, retreat, stunned
    this.patrolDirection = 1;
    this.patrolTimer = 0;
    this.fireCooldown = 0;
    this.attackCooldown = 0;
    this.stunTimer = 0;
    this.retreatTimer = 0;
    
    // Специальные способности
    this.specialAbility = this.getSpecialAbility();
    this.abilityCooldown = 0;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.invisible = false;
    this.invisibleTimer = 0;
    
    // Визуальные эффекты
    this.healthBar = null;
    this.shieldEffect = null;
    this.trailEmitter = null;
    this.createHealthBar();
    
    // Применяем визуальные эффекты мира
    this.applyWorldVisuals();
    
    // Добавляем в группу врагов
    if (scene.enemyGroup) {
      scene.enemyGroup.add(this.sprite);
    }
  }

  // =========================================================================
  // КОНФИГУРАЦИЯ В ЗАВИСИМОСТИ ОТ МИРА
  // =========================================================================

  getWorldConfig() {
    const config = { ...this.baseConfig };
    
    // Модификаторы в зависимости от мира
    const modifiers = {
      0: { health: 1.0, speed: 1.0, damage: 1.0, score: 1.0 },      // Космос
      1: { health: 0.8, speed: 1.3, damage: 1.2, score: 1.2 },      // Киберпанк
      2: { health: 1.5, speed: 0.8, damage: 1.5, score: 1.3 },      // Подземелье
      3: { health: 1.2, speed: 1.2, damage: 1.3, score: 1.4 },      // Астероиды
      4: { health: 1.4, speed: 0.7, damage: 1.4, score: 1.5 }       // Чёрная дыра
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
      cyber_drone: 'cyber_drone',
      shadow_wraith: 'shadow_wraith',
      rock_spitter: 'rock_spitter',
      void_sentinel: 'void_sentinel'
    };
    
    let texture = textureMap[this.type] || 'enemy_drone';
    
    // Специальные текстуры для миров
    if (this.worldType === 1 && this.type === 'drone') {
      texture = 'cyber_drone';
    } else if (this.worldType === 2 && this.type === 'skeleton') {
      texture = 'shadow_wraith';
    } else if (this.worldType === 3 && this.type === 'drone') {
      texture = 'rock_spitter';
    } else if (this.worldType === 4 && this.type === 'sentinel') {
      texture = 'void_sentinel';
    }
    
    return texture;
  }

  setupPhysics() {
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setVelocityX(-this.config.speed);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setDrag(0.95);
    
    // Разный размер коллизии для разных врагов
    if (this.type === 'sentinel') {
      this.sprite.body.setCircle(18);
    } else if (this.type === 'skeleton') {
      this.sprite.body.setCircle(12);
    } else {
      this.sprite.body.setCircle(14);
    }
  }

  applyWorldVisuals() {
    // Киберпанк - неоновое свечение
    if (this.worldType === 1) {
      this.sprite.setBlendMode(Phaser.BlendModes.ADD);
      this.sprite.setTint(0xff44ff);
      
      // Мерцание
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: { from: 0.8, to: 1.0 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }
    
    // Подземелье - тёмная аура
    if (this.worldType === 2) {
      this.sprite.setBlendMode(Phaser.BlendModes.MULTIPLY);
      this.sprite.setTint(0x886644);
      
      // Эффект теней
      const shadow = this.scene.add.circle(this.sprite.x, this.sprite.y + 10, 15, 0x000000, 0.3);
      shadow.setBlendMode(Phaser.BlendModes.MULTIPLY);
      shadow.setDepth(9);
      
      this.scene.tweens.add({
        targets: shadow,
        alpha: { from: 0.2, to: 0.4 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (this.sprite && this.sprite.active) {
            shadow.setPosition(this.sprite.x, this.sprite.y + 10);
          }
        },
        onComplete: () => shadow.destroy()
      });
    }
    
    // Астероиды - каменная текстура
    if (this.worldType === 3) {
      this.sprite.setTint(0xccaa88);
    }
    
    // Чёрная дыра - фиолетовое свечение
    if (this.worldType === 4) {
      this.sprite.setBlendMode(Phaser.BlendModes.SCREEN);
      this.sprite.setTint(0xaa88ff);
      
      // Аура
      const aura = this.scene.add.circle(this.sprite.x, this.sprite.y, 20, 0xaa88ff, 0.2);
      aura.setBlendMode(Phaser.BlendModes.ADD);
      aura.setDepth(9);
      
      this.scene.tweens.add({
        targets: aura,
        alpha: { from: 0.1, to: 0.3 },
        scale: { from: 1, to: 1.3 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (this.sprite && this.sprite.active) {
            aura.setPosition(this.sprite.x, this.sprite.y);
          }
        },
        onComplete: () => aura.destroy()
      });
    }
  }

  getSpecialAbility() {
    const abilities = {
      drone: null,
      sentinel: 'shield',
      skeleton: 'teleport',
      cyber_drone: 'split',
      shadow_wraith: 'invisible',
      rock_spitter: 'spread_shot',
      void_sentinel: 'gravity_pull'
    };
    return abilities[this.type] || null;
  }

  // =========================================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // =========================================================================

  createHealthBar() {
    const barWidth = 35;
    const barHeight = 4;
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Цвет полоски в зависимости от мира
    let barColor = 0xff0000;
    if (this.worldType === 1) barColor = 0xff44ff;
    if (this.worldType === 2) barColor = 0xff6600;
    if (this.worldType === 3) barColor = 0xffaa44;
    if (this.worldType === 4) barColor = 0xaa88ff;
    
    graphics.fillStyle(barColor, 1);
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

  update(playerPos, time, delta) {
    if (!this.sprite || !this.sprite.active) return;
    
    // Обновляем таймеры
    this.updateTimers(delta);
    
    // Проверка на невидимость
    this.updateInvisibility(delta);
    
    // Проверка на оглушение
    if (this.stunTimer > 0) {
      this.updateStun(delta);
      return;
    }
    
    const dist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      playerPos.x, playerPos.y
    );
    
    // Определяем состояние
    this.updateState(dist, playerPos);
    
    // Выполняем действие
    switch (this.state) {
      case 'chase':
        this.chase(playerPos);
        break;
      case 'attack':
        this.attack(playerPos);
        break;
      case 'retreat':
        this.retreat(playerPos);
        break;
      case 'patrol':
        this.patrol(delta);
        break;
    }
    
    // Применяем специальную способность
    if (this.specialAbility && this.abilityCooldown <= 0 && !this.invisible) {
      this.useSpecialAbility(playerPos);
      this.abilityCooldown = 5000;
    }
    
    // Обновляем щит
    this.updateShield(delta);
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
    
    // Обновляем визуальные эффекты
    this.updateVisualEffects(delta);
  }

  updateTimers(delta) {
    if (this.fireCooldown > 0) this.fireCooldown -= delta;
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.abilityCooldown > 0) this.abilityCooldown -= delta;
    if (this.stunTimer > 0) this.stunTimer -= delta;
    if (this.retreatTimer > 0) this.retreatTimer -= delta;
    if (this.shieldTimer > 0) this.shieldTimer -= delta;
    if (this.invisibleTimer > 0) this.invisibleTimer -= delta;
  }

  updateState(dist, playerPos) {
    // Если здоровье низкое, отступаем
    if (this.health < this.maxHealth * 0.3 && Math.random() < 0.02) {
      this.retreatTimer = 2000;
      this.state = 'retreat';
    } else if (this.retreatTimer > 0) {
      this.state = 'retreat';
    } else if (dist < this.config.attackRange) {
      this.state = 'attack';
    } else if (dist < this.config.detectionRange) {
      this.state = 'chase';
    } else {
      this.state = 'patrol';
    }
  }

  chase(playerPos) {
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      playerPos.x, playerPos.y
    );
    
    const speed = this.config.speed * (this.shieldActive ? 0.5 : 1);
    this.sprite.setVelocityX(Math.cos(angle) * speed);
    this.sprite.setVelocityY(Math.sin(angle) * speed * 0.6);
    
    // Поворот в сторону движения
    this.sprite.setAngle(Math.atan2(this.sprite.body.velocity.y, this.sprite.body.velocity.x) * 57.3);
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
      this.createAttackEffect();
      this.attackCooldown = 500;
    }
  }

  retreat(playerPos) {
    const angle = Phaser.Math.Angle.Between(
      playerPos.x, playerPos.y,
      this.sprite.x, this.sprite.y
    );
    
    const speed = this.config.speed * 0.8;
    this.sprite.setVelocityX(Math.cos(angle) * speed);
    this.sprite.setVelocityY(Math.sin(angle) * speed);
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
    
    // Эффект выстрела
    this.createMuzzleFlash();
    
    // Звук выстрела
    try {
      audioManager.playSound(this.scene, 'shoot_sound', 0.2);
    } catch (e) {}
  }

  useSpecialAbility(playerPos) {
    switch(this.specialAbility) {
      case 'shield':
        this.activateShield();
        break;
      case 'teleport':
        this.teleport(playerPos);
        break;
      case 'split':
        this.split();
        break;
      case 'invisible':
        this.becomeInvisible();
        break;
      case 'spread_shot':
        this.spreadShot(playerPos);
        break;
      case 'gravity_pull':
        this.gravityPull(playerPos);
        break;
    }
  }

  activateShield() {
    this.shieldActive = true;
    this.shieldTimer = 3000;
    
    this.shieldEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 25, 0x00ffff, 0.3);
    this.shieldEffect.setBlendMode(Phaser.BlendModes.ADD);
    this.shieldEffect.setDepth(9);
  }

  teleport(playerPos) {
    // Эффект телепортации
    this.createTeleportEffect();
    
    // Новая позиция
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      playerPos.x, playerPos.y
    );
    const distance = 150;
    const newX = playerPos.x - Math.cos(angle) * distance;
    const newY = playerPos.y - Math.sin(angle) * distance;
    
    this.sprite.setPosition(newX, newY);
    
    // Второй эффект
    this.scene.time.delayedCall(50, () => {
      this.createTeleportEffect();
    });
  }

  split() {
    if (this.health > 1 && this.type === 'cyber_drone') {
      const newEnemy = new AIEnemy(this.scene, this.sprite.x + 20, this.sprite.y, 'drone', this.worldType);
      newEnemy.health = 1;
      newEnemy.maxHealth = 1;
      this.health = 1;
      this.maxHealth = 1;
      
      if (this.scene.waveManager) {
        this.scene.waveManager.enemies.push(newEnemy);
      }
    }
  }

  becomeInvisible() {
    this.invisible = true;
    this.invisibleTimer = 3000;
    this.sprite.setAlpha(0.3);
    
    this.scene.time.delayedCall(3000, () => {
      if (this.sprite && this.sprite.active) {
        this.invisible = false;
        this.sprite.setAlpha(1);
      }
    });
  }

  spreadShot(playerPos) {
    for (let i = -1; i <= 1; i++) {
      const bullet = this.scene.enemyBullets.create(
        this.sprite.x - 15,
        this.sprite.y,
        'laser_enemy'
      );
      
      if (bullet) {
        bullet.setScale(1);
        bullet.damage = this.config.bulletDamage * 0.7;
        bullet.body.setAllowGravity(false);
        
        const angle = Phaser.Math.Angle.Between(
          bullet.x, bullet.y,
          playerPos.x, playerPos.y
        ) + (i * 0.3);
        
        bullet.setVelocityX(Math.cos(angle) * this.config.bulletSpeed * 0.8);
        bullet.setVelocityY(Math.sin(angle) * this.config.bulletSpeed * 0.8);
        bullet.setDepth(20);
        bullet.active = true;
      }
    }
  }

  gravityPull(playerPos) {
    const dx = playerPos.x - this.sprite.x;
    const dy = playerPos.y - this.sprite.y;
    const distance = Math.hypot(dx, dy);
    
    if (distance < 200) {
      const force = (1 - distance / 200) * 5;
      const angle = Math.atan2(dy, dx);
      if (this.scene.player) {
        this.scene.player.x += Math.cos(angle) * force;
        this.scene.player.y += Math.sin(angle) * force;
      }
    }
  }

  updateShield(delta) {
    if (this.shieldActive) {
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
        if (this.shieldEffect) {
          this.shieldEffect.destroy();
          this.shieldEffect = null;
        }
      } else if (this.shieldEffect) {
        this.shieldEffect.setPosition(this.sprite.x, this.sprite.y);
        const alpha = 0.2 + Math.sin(Date.now() * 0.01) * 0.1;
        this.shieldEffect.setAlpha(alpha);
      }
    }
  }

  updateInvisibility(delta) {
    if (this.invisible) {
      if (this.invisibleTimer <= 0) {
        this.invisible = false;
        this.sprite.setAlpha(1);
      } else {
        // Мерцание
        const alpha = 0.2 + Math.sin(Date.now() * 0.02) * 0.1;
        this.sprite.setAlpha(alpha);
      }
    }
  }

  updateStun(delta) {
    // Визуальный эффект оглушения
    const blink = Math.floor(Date.now() / 100) % 2;
    this.sprite.setAlpha(blink ? 0.5 : 1);
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================

  createAttackEffect() {
    this.sprite.setTint(0xff6666);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.setTint(0xffffff);
      }
    });
  }

  createMuzzleFlash() {
    const flash = this.scene.add.circle(this.sprite.x - 20, this.sprite.y, 5, 0xffaa00, 0.8);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 100,
      onComplete: () => flash.destroy()
    });
  }

  createTeleportEffect() {
    const effect = this.scene.add.circle(this.sprite.x, this.sprite.y, 20, 0x00ffff, 0.6);
    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => effect.destroy()
    });
  }

  updateVisualEffects(delta) {
    // След для быстрых врагов
    if (this.config.speed > 150 && !this.trailEmitter && !this.invisible) {
      this.trailEmitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'flare', {
        speed: 20,
        scale: { start: 0.2, end: 0 },
        alpha: { start: 0.4, end: 0 },
        lifespan: 200,
        frequency: 50,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0xff4444,
        follow: this.sprite,
        followOffset: { x: -15, y: 0 }
      });
    }
  }

  // =========================================================================
  // УРОН И СМЕРТЬ
  // =========================================================================

  takeDamage(amount) {
    if (this.shieldActive) {
      this.createShieldHitEffect();
      return false;
    }
    
    this.health -= amount;
    
    // Визуальный эффект урона
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.setTint(0xffffff);
      }
    });
    
    // Эффект отбрасывания
    this.sprite.body.setVelocityX(-50);
    this.sprite.body.setVelocityY(Phaser.Math.Between(-50, 50));
    
    // Шанс оглушения
    if (Math.random() < 0.2 && !this.shieldActive) {
      this.stunTimer = 500;
    }
    
    if (this.health <= 0) {
      this.die();
      return true;
    }
    
    return false;
  }

  createShieldHitEffect() {
    const effect = this.scene.add.circle(this.sprite.x, this.sprite.y, 20, 0x00ffff, 0.6);
    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 1.5,
      duration: 200,
      onComplete: () => effect.destroy()
    });
    
    try {
      audioManager.playSound(this.scene, 'shield_sound', 0.2);
    } catch (e) {}
  }

  die() {
    // Добавляем кристаллы
    this.scene.crystals += this.scoreValue;
    if (this.scene.crystalText) {
      this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    }
    gameManager.addCrystals(this.scoreValue, 'enemy_kill');
    
    // Эффект смерти
    this.createDeathEffect();
    
    // Звук
    this.playDeathSound();
    
    // Увеличиваем комбо
    if (this.scene.comboSystem) {
      this.scene.comboSystem.add();
    }
    
    // Обновляем квест
    if (this.scene.questSystem) {
      this.scene.questSystem.updateProgress('enemies', 1);
    }
    
    // Очистка
    this.cleanup();
  }

  createDeathEffect() {
    if (this.scene.particleManager) {
      this.scene.particleManager.createEnemyDeathEffect(
        this.sprite.x,
        this.sprite.y
      );
    }
    
    // Дополнительный эффект для разных миров
    if (this.worldType === 1) {
      // Киберпанк - цифровые осколки
      for (let i = 0; i < 5; i++) {
        const debris = this.scene.add.text(
          this.sprite.x + Phaser.Math.Between(-15, 15),
          this.sprite.y + Phaser.Math.Between(-15, 15),
          ['0','1'][Math.floor(Math.random() * 2)],
          { fontSize: '12px', fontFamily: 'monospace', color: '#ff44ff' }
        );
        this.scene.tweens.add({
          targets: debris,
          alpha: 0,
          y: debris.y - 40,
          duration: 400,
          onComplete: () => debris.destroy()
        });
      }
    } else if (this.worldType === 4) {
      // Чёрная дыра - гравитационный коллапс
      const collapse = this.scene.add.circle(this.sprite.x, this.sprite.y, 15, 0xaa88ff, 0.6);
      this.scene.tweens.add({
        targets: collapse,
        scale: 0,
        alpha: 0,
        duration: 300,
        onComplete: () => collapse.destroy()
      });
    }
  }

  playDeathSound() {
    try {
      audioManager.playSound(this.scene, 'enemy_die_sound', 0.4);
    } catch (e) {}
  }

  cleanup() {
    // Удаляем след
    if (this.trailEmitter) {
      this.trailEmitter.stop();
      this.trailEmitter.destroy();
    }
    
    // Удаляем щит
    if (this.shieldEffect) {
      this.shieldEffect.destroy();
    }
    
    // Удаляем полоску здоровья
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    // Удаляем из группы
    if (this.scene.enemyGroup) {
      this.scene.enemyGroup.remove(this.sprite);
    }
    
    // Удаляем из волны
    if (this.scene.waveManager) {
      const index = this.scene.waveManager.enemies.indexOf(this);
      if (index !== -1) {
        this.scene.waveManager.enemies.splice(index, 1);
      }
    }
    
    // Уничтожаем спрайт
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
  }

  // =========================================================================
  // ГЕТТЕРЫ
  // =========================================================================

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getHealth() {
    return this.health;
  }

  getHealthPercent() {
    return this.health / this.maxHealth;
  }

  isActive() {
    return this.sprite && this.sprite.active && this.health > 0;
  }

  getType() {
    return this.type;
  }

  getState() {
    return this.state;
  }

  destroy() {
    this.cleanup();
  }
}