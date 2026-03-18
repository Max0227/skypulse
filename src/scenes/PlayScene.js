import Phaser from 'phaser';
import { 
  COLORS, 
  DIFFICULTY_CURVE, 
  ACHIEVEMENTS, 
  LEVEL_CONFIG,
  ENEMY_CONFIG,
  WAVE_CONFIG,
  POWERUP_TYPES,
  UPGRADE_COSTS,
  SHOP_UPGRADES,
  GAME_CONFIG
} from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';
import { ParticleEffectManager } from '../systems/ParticleEffectManager';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { LevelManager } from '../systems/LevelManager';
import { ComboSystem } from '../systems/ComboSystem';
import { MultiplierSystem } from '../systems/MultiplierSystem';
import { Asteroid } from '../entities/Asteroid';
import { PowerUp } from '../entities/PowerUp';

// =========================================================================
// ВНУТРЕННИЕ КЛАССЫ (чтобы избежать ошибок импорта)
// =========================================================================

// -------------------------------------------------------------------------
// КЛАСС ВРАГА (AIEnemy)
// -------------------------------------------------------------------------
class AIEnemy {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type;
    this.config = ENEMY_CONFIG[type];
    this.sprite = scene.physics.add.image(x, y, 'enemy_' + type).setScale(1.2);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setAllowGravity(false);
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    
    // Полоска здоровья
    this.healthBar = null;
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
    // Удаляем из списка врагов в WaveManager
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
    const speed = this.config.speed;
    this.sprite.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  attack(playerPos) {
    if (this.fireCooldown <= 0) {
      this.scene.fireEnemyBullet(this, playerPos);
      this.fireCooldown = this.config.fireDelay;
    }
    // Небольшое движение при атаке
    this.chase(playerPos);
  }

  patrol(delta) {
    this.patrolTimer += delta;
    if (this.patrolTimer > 2000) {
      this.patrolDirection *= -1;
      this.patrolTimer = 0;
    }
    this.sprite.body.setVelocity(this.config.speed * this.patrolDirection * 0.5, 0);
    // Ограничение по Y, чтобы не улетел за экран
    if (this.sprite.y < 50) {
      this.sprite.y = 50;
      this.sprite.body.setVelocityY(0);
    } else if (this.sprite.y > this.scene.scale.height - 50) {
      this.sprite.y = this.scene.scale.height - 50;
      this.sprite.body.setVelocityY(0);
    }
  }
}

// -------------------------------------------------------------------------
// МЕНЕДЖЕР ВОЛН (WaveManager)
// -------------------------------------------------------------------------
class WaveManager {
  constructor(scene, levelManager) {
    this.scene = scene;
    this.levelManager = levelManager;
    this.currentWave = 0;
    this.enemies = [];
    this.waveConfig = WAVE_CONFIG[levelManager.getCurrentTheme()] || WAVE_CONFIG.space;
    this.spawnTimer = 0;
  }

  update(time, delta, playerPos) {
    if (this.scene.level < 1) return;

    this.spawnTimer += delta;
    if (this.spawnTimer > 5000 && this.enemies.length === 0 && this.currentWave < this.waveConfig.length) {
      this.showWaveWarning(this.currentWave);
      this.spawnWave(this.currentWave);
      this.currentWave++;
      this.spawnTimer = 0;
    }

    this.enemies.forEach(enemy => {
      enemy.update(playerPos, time, delta);
    });
    this.enemies = this.enemies.filter(e => e.health > 0);
  }

  spawnWave(waveIndex) {
    const config = this.waveConfig[waveIndex];
    if (!config) return;
    for (let i = 0; i < config.count; i++) {
      const x = Phaser.Math.Between(this.scene.scale.width + 50, this.scene.scale.width + 300);
      const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
      const enemy = new AIEnemy(this.scene, x, y, config.type);
      this.enemies.push(enemy);
    }
  }

  showWaveWarning(waveIndex) {
    const scene = this.scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const warning = scene.add.text(w/2, h/2, `⚠️ ВОЛНА ${waveIndex + 1}`, {
      fontSize: '32px',
      fontFamily: "'Orbitron', monospace",
      color: '#ff4444',
      stroke: '#ff0000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    scene.tweens.add({
      targets: warning,
      alpha: 0,
      duration: 1500,
      onComplete: () => warning.destroy()
    });
  }

  reset() {
    this.enemies.forEach(e => e.sprite.destroy());
    this.enemies = [];
    this.currentWave = 0;
    this.spawnTimer = 0;
  }
}

// -------------------------------------------------------------------------
// СИСТЕМА УРОНА (DamageSystem)
// -------------------------------------------------------------------------
class DamageSystem {
  constructor(scene) {
    this.scene = scene;
  }

  playerHitByEnemy(player, enemy) {
    if (player.shieldActive) {
      this.scene.particleManager.createBonusEffect('shield', enemy.sprite.x, enemy.sprite.y);
      player.body.setVelocityY(-100);
      return;
    }

    player.headHP -= enemy.config.damage;
    this.scene.updateHearts();
    this.scene.cameras.main.shake(150, 0.005);
    try { this.scene.hitSound.play(); } catch (e) {}
    if (gameManager.data.vibrationEnabled && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    if (player.headHP <= 0) {
      this.scene.handleDeath();
    }
  }

  playerHitByBullet(player, bullet) {
    if (player.shieldActive) {
      this.scene.particleManager.createBonusEffect('shield', bullet.x, bullet.y);
      bullet.destroy();
      return;
    }

    player.headHP -= bullet.damage;
    this.scene.updateHearts();
    this.scene.cameras.main.shake(150, 0.005);
    try { this.scene.hitSound.play(); } catch (e) {}
    bullet.destroy();
    if (player.headHP <= 0) {
      this.scene.handleDeath();
    }
  }

  enemyHitByBullet(enemy, bullet) {
    if (enemy.takeDamage(bullet.damage)) {
      this.scene.crystals += enemy.config.scoreValue;
      this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    }
    this.scene.particleManager.createAttackEffect(enemy.sprite.x, enemy.sprite.y);
    bullet.destroy();
  }

  wagonHitByEnemy(wagon, enemy) {
    let hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      this.scene.wagons = this.scene.wagons.filter(w => w !== wagon);
      this.scene.particleManager.createWagonDestroyEffect(wagon);
      wagon.destroy();
    } else {
      wagon.setData('hp', hp);
      this.scene.tweens.add({
        targets: wagon,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 1
      });
    }
  }

  enemyHitByWagon(enemy, wagon) {
    if (enemy.takeDamage(1)) {}
  }

  enemyAttackPlayer(enemy, playerPos) {
    this.playerHitByEnemy(this.scene.player, enemy);
  }
}

// -------------------------------------------------------------------------
// МЕНЕДЖЕР СПЕЦИАЛЬНЫХ СОБЫТИЙ (SpecialEventManager)
// -------------------------------------------------------------------------
class SpecialEventManager {
  constructor(scene) {
    this.scene = scene;
    this.events = [];
    this.eventTimer = null;
    this.eventChance = 0.05;
  }

  update(delta) {
    if (Math.random() < this.eventChance * (delta / 1000)) {
      this.triggerRandomEvent();
    }
  }

  triggerRandomEvent() {
    const events = [
      { name: 'МЕТЕОРИТНЫЙ ДОЖДЬ', action: () => this.meteorShower() },
      { name: 'ВРЕМЕННОЙ СКАЧОК', action: () => this.timeWarp() },
      { name: 'ГРАВИТАЦИОННЫЙ СКАЧОК', action: () => this.gravityShift() },
      { name: 'ЭЛЕКТРОМАГНИТНЫЙ ИМПУЛЬС', action: () => this.emPulse() }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    this.showEventNotification(event.name);
    event.action();
  }

  meteorShower() {
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const x = this.scene.scale.width + 50;
        const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
        const meteor = this.scene.physics.add.image(x, y, 'bg_asteroid_1')
          .setScale(1.5)
          .setVelocityX(-this.scene.currentSpeed * 1.5)
          .setVelocityY(Phaser.Math.Between(-100, 100));
        meteor.setAngularVelocity(200);
        meteor.setDepth(-5);
      });
    }
  }

  timeWarp() {
    const originalSpeed = this.scene.currentSpeed;
    this.scene.currentSpeed *= 0.5;
    this.scene.time.delayedCall(5000, () => {
      this.scene.currentSpeed = originalSpeed;
    });
  }

  gravityShift() {
    const originalGravity = this.scene.physics.world.gravity.y;
    this.scene.physics.world.gravity.y *= 1.5;
    this.scene.time.delayedCall(4000, () => {
      this.scene.physics.world.gravity.y = originalGravity;
    });
  }

  emPulse() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const pulse = this.scene.add.circle(w / 2, h / 2, 10, 0x00ffff, 0.5)
      .setDepth(25)
      .setScrollFactor(0);

    this.scene.tweens.add({
      targets: pulse,
      radius: 300,
      alpha: 0,
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: () => pulse.destroy()
    });

    const coins = this.scene.coinGroup.getChildren();
    coins.forEach(coin => {
      const angle = Phaser.Math.Angle.Between(w / 2, h / 2, coin.x, coin.y);
      coin.setVelocityX(Math.cos(angle) * 300);
      coin.setVelocityY(Math.sin(angle) * 300);
    });
  }

  showEventNotification(eventName) {
    const w = this.scene.scale.width;
    const notification = this.scene.add.text(w / 2, 200, `⚡ ${eventName}`, {
      fontSize: '24px',
      fontFamily: "'Orbitron', monospace",
      color: '#ff00ff',
      stroke: '#ffff00',
      strokeThickness: 3,
      shadow: { blur: 15, color: '#ff00ff', fill: true }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    this.scene.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 2000,
      ease: 'Power2.easeOut',
      onComplete: () => notification.destroy()
    });
  }

  destroy() {
    if (this.eventTimer) {
      this.eventTimer.remove();
    }
  }
}

// =========================================================================
// ОСНОВНОЙ КЛАСС PLAYSCENE
// =========================================================================
export class PlayScene extends Phaser.Scene {
  constructor() {
    super('play');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Текущий мир и уровень
    this.world = gameManager.getCurrentWorld();
    this.level = gameManager.getCurrentLevel();
    this.worldConfig = LEVEL_CONFIG[this.world];

    // Основные параметры
    this.score = 0;
    this.crystals = gameManager.data.crystals;
    this.meters = 0;
    this.best = Number(localStorage.getItem('skypulse_best') || 0);

    // Вагоны
    this.wagons = [];
    this.collectedCoins = 0;
    this.coinsForWagon = 15;
    this.maxWagons = 12 + (gameManager.data.upgrades.maxWagons || 0) * 2;
    this.wagonGap = 28 - (gameManager.data.upgrades.wagonGap || 0) * 2;
    this.wagonSpring = 0.25;
    this.targetPlayerX = 110;
    this.playerXSpeed = 0.05;
    this.maxTargetX = 200;

    // Состояния
    this.started = false;
    this.dead = false;
    this.gameLevel = 0; // уровень сложности (растёт с метражом)
    this.isPaused = false;
    this.pauseOverlay = null;
    this.pauseTexts = [];
    this.spawnTimerPaused = null;
    this.bonusTimerPaused = null;
    this.countdownActive = false;
    this.shopVisible = false;
    this.shopElements = [];

    // Здоровье
    this.maxHeadHP = 3 + (gameManager.data.upgrades.headHP || 0);
    this.headHP = this.maxHeadHP;
    this.wagonBaseHP = 1 + (gameManager.data.upgrades.wagonHP || 0);

    // Скорость
    this.baseSpeed = 240;
    this.currentSpeed = this.baseSpeed;
    this.gapSize = 240;
    this.spawnDelay = 1300;
    this.gateTextures = ['gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'];

    // Бонусы
    this.bonusActive = false;
    this.bonusType = null;
    this.bonusTime = 0;
    this.bonusMultiplier = 1;
    this.bonusTimer = null;
    this.shieldActive = false;
    this.magnetActive = false;
    this.magnetRange = 220 + (gameManager.data.upgrades.magnetRange || 0) * 40;
    this.lastBonusTime = 0;
    this.shieldDuration = 5 + (gameManager.data.upgrades.shieldDuration || 0) * 1.5;
    this.powerUpActive = {};
    this.activePowerUps = [];

    // Системы
    this.upgradeSystem = new UpgradeSystem(this);
    this.jumpPower = this.upgradeSystem.getUpgradeValue('jumpPower');
    this.questSystem = new QuestSystem();
    this.comboSystem = new ComboSystem(this);
    this.multiplierSystem = new MultiplierSystem(this);
    this.levelManager = new LevelManager(this);
    this.particleManager = new ParticleEffectManager(this);
    this.damageSystem = new DamageSystem(this);
    this.specialEventManager = new SpecialEventManager(this);
    this.waveManager = new WaveManager(this, this.levelManager);

    // Параметры оружия (устанавливаются в UpgradeSystem)
    this.weaponDamage = 1;
    this.weaponBulletSpeed = 400;
    this.weaponFireDelay = 500;
    this.weaponCooldown = 0;

    // Массивы объектов
    this.pipes = [];
    this.coins = [];
    this.scoreZones = [];
    this.stars = [];
    this.planets = [];
    this.ships = [];
    this.asteroids = [];
    this.powerUps = [];

    // Группы
    this.gateGroup = this.physics.add.group();
    this.coinGroup = this.physics.add.group();
    this.asteroidGroup = this.physics.add.group();
    this.powerUpGroup = this.physics.add.group();
    this.playerBullets = this.physics.add.group({ classType: Phaser.GameObjects.Image, runChildUpdate: false });
    this.enemyBullets = this.physics.add.group({ classType: Phaser.GameObjects.Image, runChildUpdate: false });
    this.enemyGroup = this.physics.add.group(); // для коллизий пуль с врагами

    // Таймеры
    this.spawnTimer = null;
    this.stationTimer = null;

    // Станция
    this.stationPlanet = null;
    this.stationActive = false;

    // Счётчики для достижений
    this.initAchievements();
    this.initDailyRewards();
    this.initLeaderboard();
    this.initStats();

    // Создание объектов
    this.createBackground();
    this.createPlanets();
    this.createShips();
    this.createAsteroids();
    this.createPlayer();
    this.createUI();

    // Обработчики
    this.input.on('pointerdown', (pointer) => {
      if (pointer.targetObject) return;
      if (this.dead) { this.scene.start('menu'); return; }
      if (!this.started) this.startRun();
      this.flap();
    });

    window.addEventListener('blur', () => {
      if (this.started && !this.dead && !this.isPaused) {
        this.togglePause();
      }
    });

    this.physics.world.setBounds(0, 0, w, h);
    this.events.on('resize', this.onResize, this);
    this.scale.on('resize', this.onResize, this);

    // Музыка
    audioManager.playMusic(this, 0.2);
  }

  update(time, delta) {
    if (this.isPaused || this.countdownActive) return;
    // Принудительно обнуляем вертикальную скорость для всех ворот и монет,
// а также восстанавливаем горизонтальную, если она пропала
this.gateGroup.getChildren().forEach(obj => {
  if (obj.body) {
    obj.body.setVelocityY(0);
    obj.body.setGravityY(0);
    // Если скорость по X обнулилась (например, из-за коллизий), восстанавливаем
    if (obj.body.velocity.x === 0 && obj.speed) {
      obj.body.velocity.x = -obj.speed;
    }
  }
});

this.coinGroup.getChildren().forEach(obj => {
  if (obj.body) {
    obj.body.setVelocityY(0);
    obj.body.setGravityY(0);
    if (obj.body.velocity.x === 0) {
      // Для монет используем текущую скорость игры
      obj.body.velocity.x = -this.currentSpeed;
    }
  }
});

    this.updateStars(time, delta);
    this.updatePlanets(delta);
    this.updateShips(delta);
    this.updateAsteroids(delta);

    // !!! КРИТИЧЕСКИЙ ФИКС: принудительно обнуляем вертикальную скорость для всех ворот, чтобы они не падали !!!
    this.gateGroup.getChildren().forEach(gate => {
      if (gate.body) {
        gate.body.setVelocityY(0);
      }
    });

    // Также обнуляем для зон (на всякий случай)
    this.scoreZones.forEach(zone => {
      if (zone.body) {
        zone.body.setVelocityY(0);
      }
    });

    if (!this.started || this.dead) return;

    // Обновление кулдауна оружия
    if (this.weaponCooldown > 0) {
      this.weaponCooldown -= delta;
    }

    // Автоматическая стрельба по ближайшему врагу (если есть враги)
    if (this.level >= 1 && this.waveManager.enemies.length > 0) {
      if (this.weaponCooldown <= 0) {
        const closestEnemy = this.waveManager.enemies[0];
        if (closestEnemy && closestEnemy.sprite) {
          this.firePlayerBullet(closestEnemy.sprite.x, closestEnemy.sprite.y);
          this.weaponCooldown = this.weaponFireDelay;
        }
      }
    }

    this.targetPlayerX = Math.min(this.maxTargetX, this.targetPlayerX);
    this.player.x += (this.targetPlayerX - this.player.x) * this.playerXSpeed;

    const body = this.player.body;
    this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75));

    if (!this.shieldActive && (this.player.y < -50 || this.player.y > this.scale.height + 50)) {
      this.handleDeath();
    }

    if (this.magnetActive) {
      const magnetCoins = this.coinGroup.getChildren();
      for (let coin of magnetCoins) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, coin.x, coin.y);
        if (dist < this.magnetRange) {
          const angle = Phaser.Math.Angle.Between(coin.x, coin.y, this.player.x, this.player.y);
          coin.x += Math.cos(angle) * 10;
          coin.y += Math.sin(angle) * 10;
        }
      }
    }

    this.updateWagons();
    this.cleanupObjects();

    if (this.stationPlanet && this.stationPlanet.active && this.stationActive) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.stationPlanet.x, this.stationPlanet.y);
      if (dist < 100) this.touchStation();
    }

    this.checkAchievements();
    if (this.level >= 1) {
      this.waveManager.update(time, delta, this.player);
    }
    this.specialEventManager.update(delta);
    this.checkLevelProgression();

    // Обновление метража
    this.meters += this.currentSpeed * delta / 1000 / 10;
    if (this.meterText) {
      this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
    }

    // Обновление пуль: удаление вышедших за экран
    this.playerBullets.getChildren().forEach(b => {
      if (b.x > this.scale.width + 100) b.destroy();
    });
    this.enemyBullets.getChildren().forEach(b => {
      if (b.x < -100) b.destroy();
    });

    // Обновление астероидов (если есть)
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const asteroid = this.asteroids[i];
      if (!asteroid || typeof asteroid.update !== 'function') {
        this.asteroids.splice(i, 1);
        continue;
      }
      if (!asteroid.update()) {
        this.asteroids.splice(i, 1);
      }
    }

    // Обновление усилителей
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      if (!powerUp || typeof powerUp.update !== 'function') {
        this.powerUps.splice(i, 1);
        continue;
      }
      if (!powerUp.update()) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  // ===== МЕТОДЫ ДЛЯ СТРЕЛЬБЫ =====
  attackEnemies() {
    if (this.weaponCooldown > 0) return;
    if (this.waveManager.enemies.length === 0) return;

    this.weaponCooldown = this.weaponFireDelay;

    const bullet = this.playerBullets.create(
      this.player.x + 30,
      this.player.y,
      'laser_player'
    );

    bullet.setScale(1.5);
    bullet.damage = this.weaponDamage;
    bullet.setVelocityX(this.weaponBulletSpeed);
    bullet.setVelocityY(0);
    bullet.body.setAllowGravity(false);
    bullet.body.setGravityY(0);
    bullet.setDepth(20);

    this.playSound('tap_sound', 0.3);

    this.tweens.add({
      targets: this.attackButton,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 100,
      yoyo: true
    });

    this.particleManager.createAttackEffect(
      this.player.x + 30,
      this.player.y
    );
  }

  firePlayerBullet(targetX, targetY) {
    const bullet = this.playerBullets.create(this.player.x + 30, this.player.y, 'laser_player');
    bullet.setScale(1.5);
    bullet.damage = this.weaponDamage;

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    const speed = this.weaponBulletSpeed;

    bullet.body.setAllowGravity(false);
    bullet.body.setGravityY(0);
    bullet.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    bullet.setDepth(20);

    try { this.tapSound.play(); } catch (e) {}
  }

  fireEnemyBullet(enemy, playerPos) {
    const bullet = this.enemyBullets.create(enemy.sprite.x - 20, enemy.sprite.y, 'laser_enemy');
    bullet.setScale(1.5);
    bullet.damage = enemy.config.bulletDamage || 1;
    bullet.body.setAllowGravity(false);
    bullet.body.setGravityY(0);

    const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, playerPos.x, playerPos.y);
    const speed = enemy.config.bulletSpeed || 400;

    bullet.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    bullet.setDepth(20);
  }

  playSound(key, volume = 0.5) {
    if (!gameManager.data.soundEnabled) return;
    try {
      if (!this.sounds) this.sounds = {};
      if (!this.sounds[key]) {
        this.sounds[key] = this.sound.add(key, { volume });
      }
      this.sounds[key].play();
    } catch (e) {
      console.warn('Sound error:', e);
    }
  }

  // ===== МЕТОДЫ ДЛЯ КОЛЛЕКТА МОНЕТ =====
  collectCoinExtended(coin) {
    this.collectCoin(coin);
  }

  collectCoin(coin) {
    if (!coin.active || coin.collected) return;
    coin.collected = true;

    let value = 1, bonusType = null;
    switch (coin.coinType) {
      case 'red': value = 2; bonusType = 'speed'; break;
      case 'blue': value = 1; bonusType = 'shield'; break;
      case 'green': value = 1; bonusType = 'magnet'; break;
      case 'purple': value = 1; bonusType = 'slow'; break;
      default: value = 1;
    }

    if (this.bonusActive && this.bonusType === 'speed') value *= 2;
    if (this.player.doubleCrystals) value *= 2;

    const multipliedValue = Math.floor(value * this.comboSystem.getMultiplier());
    this.crystals += multipliedValue;
    this.crystalText.setText(`💎 ${this.crystals}`);
    this.collectedCoins += multipliedValue;

    this.comboSystem.add();

    if (this.collectedCoins >= this.coinsForWagon && this.wagons.length < this.maxWagons) {
      this.addWagon();
      this.collectedCoins -= this.coinsForWagon;
    }

    if (bonusType) {
      if (this.bonusActive && this.bonusType === bonusType) {
        this.bonusTime += 2;
        try { this.itemSound.play(); } catch (e) {}
      } else {
        this.activateBonus(bonusType);
      }
      this.particleManager.createCoinCollectEffect(coin.x, coin.y, coin.coinType);
      if (bonusType === 'shield') this.questSystem.updateProgress('shield', 1);
    } else {
      try { this.coinSound.play(); } catch (e) {}
      this.particleManager.createCoinCollectEffect(coin.x, coin.y, 'gold');
    }

    this.questSystem.updateProgress('crystals', multipliedValue);

    this.tweens.add({
      targets: this.crystalText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 80,
      yoyo: true,
      ease: 'Quad.out'
    });

    try { gameManager.vibrate([30]); } catch (e) {}

    coin.destroy();
    gameManager.data.crystals = this.crystals;
    gameManager.save();
  }

  // ===== МЕТОДЫ ДЛЯ ВОРОТ И ПРОХОЖДЕНИЯ =====
  passGateWithCombo(zone) {
    if (zone.passed) return;
    zone.passed = true;

    const baseScore = 10;
    const comboMultiplier = this.comboSystem.getMultiplier();
    const totalScore = Math.floor(baseScore * comboMultiplier);

    this.score += totalScore;
    this.scoreText.setText(String(this.score));
    this.meters += 10;
    this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);

    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('skypulse_best', String(this.best));
      this.bestText.setText(`🏆 ${this.best}`);
    }

    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Quad.out'
    });

    this.cameras.main.shake(20, 0.001);
  }

  spawnGate() {
    if (this.dead) return;

    const w = this.scale.width;
    const h = this.scale.height;
    const difficulty = this.getDifficulty();
    const gateTexture = this.gateTextures[Math.min(this.gameLevel, 4)];
    const gap = difficulty.gap + Phaser.Math.Between(-15, 15);
    const centerY = Phaser.Math.Between(120, h - 120);
    const topY = centerY - gap / 2;
    const bottomY = centerY + gap / 2;
    const x = w;

    // Создаём верхнюю створку (без физики)
    const topPipe = this.add.image(x, topY, gateTexture)
        .setOrigin(0.5, 1)
        .setScale(1, Math.max(0.2, topY / 400))
        .setBlendMode(Phaser.BlendModes.ADD);

    // Создаём нижнюю створку (без физики)
    const bottomPipe = this.add.image(x, bottomY, gateTexture)
        .setOrigin(0.5, 0)
        .setScale(1, Math.max(0.2, (h - bottomY) / 400))
        .setBlendMode(Phaser.BlendModes.ADD);

    // Сохраняем скорость
    topPipe.speed = difficulty.speed;
    bottomPipe.speed = difficulty.speed;

    this.pipes.push(topPipe, bottomPipe);
    this.gateGroup.add(topPipe);
    this.gateGroup.add(bottomPipe);

    // Создаём зону для счёта (без физики)
    const zone = this.add.zone(x + 60, h / 2, 12, h);
    zone.speed = difficulty.speed;
    zone.passed = false;
    
    // Добавляем зону в массив для проверки
    this.scoreZones.push(zone);

    // Проверка прохождения зоны
    // Будет выполняться в update()

    if (Math.random() < difficulty.coinChance) this.spawnCoin(x, centerY);
    if (Math.random() < difficulty.asteroidChance) this.spawnAsteroid();
    if (Math.random() < difficulty.powerUpChance) this.spawnPowerUp(x + 100, centerY);
}

  hitPipe(player, pipe) {
    if (this.shieldActive) return;
    this.headHP--;
    this.updateHearts();
    this.cameras.main.shake(100, 0.003);
    try { this.hitSound.play(); } catch (e) {}

    if (this.headHP <= 0) {
      this.handleDeath();
    } else {
      this.player.setTint(0xff8888);
      this.time.delayedCall(500, () => this.player.clearTint());
    }
  }

  // ===== МЕТОДЫ ДЛЯ ВАГОНОВ =====
  addWagon() {
    if (this.wagons.length >= this.maxWagons) return;

    const last = this.wagons.length > 0 ? this.wagons[this.wagons.length - 1] : this.player;
    const spawnX = last.x - this.wagonGap * 2;
    const spawnY = last.y;
    const texIndex = Phaser.Math.Between(0, 9);

    const wagon = this.physics.add.image(spawnX, spawnY, `wagon_${texIndex}`)
      .setScale(0.8)
      .setDepth(5 + this.wagons.length);
    wagon.body.setCircle(12, 8, 6);
    wagon.body.setAllowGravity(true);
    wagon.body.setMass(0.5);
    wagon.body.setDrag(0.9);
    wagon.setData('hp', this.wagonBaseHP);
    wagon.setData('maxHP', this.wagonBaseHP);
    wagon.setTint(0x88aaff);
    wagon.setBlendMode(Phaser.BlendModes.ADD);

    this.wagons.push(wagon);

    wagon.setAlpha(0);
    this.tweens.add({
      targets: wagon,
      alpha: 1,
      x: spawnX,
      duration: 500,
      ease: 'Sine.easeOut'
    });

    this.physics.add.collider(wagon, this.gateGroup, (w, g) => this.wagonHit(w, g), null, this);
    this.physics.add.overlap(wagon, this.enemyGroup, (w, enemySprite) => {
      const enemy = enemySprite.enemyRef;
      if (enemy) this.damageSystem.enemyHitByWagon(enemy, w);
    }, null, this);

    try { this.wagonSound.play(); } catch (e) {}
    this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
    this.updateCameraZoom();
  }

  updateWagons() {
    if (this.wagons.length === 0) return;
    let prev = this.player;
    for (let i = 0; i < this.wagons.length; i++) {
      const wagon = this.wagons[i];
      const targetX = prev.x - this.wagonGap;
      const targetY = prev.y;

      const dx = targetX - wagon.x;
      const dy = targetY - wagon.y;

      wagon.x += dx * this.wagonSpring;
      wagon.y += dy * this.wagonSpring;

      if (wagon.body) wagon.body.reset(wagon.x, wagon.y);
      prev = wagon;
    }
  }

  wagonHit(wagon, gate) {
    const hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      this.wagons = this.wagons.filter(w => w !== wagon);
      this.particleManager.createWagonDestroyEffect(wagon);
      wagon.destroy();
    } else {
      wagon.setData('hp', hp);
      wagon.setTint(0xff8888);
      this.time.delayedCall(200, () => wagon.setTint(0x88aaff));
    }
    this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
  }

  updateCameraZoom() {
    const totalLength = (this.wagons.length + 1) * this.wagonGap;
    const screenWidth = this.scale.width;
    let targetZoom = Math.min(1, screenWidth / (totalLength + 100));
    targetZoom = Math.max(0.7, targetZoom);
    this.tweens.add({
      targets: this.cameras.main,
      zoom: targetZoom,
      duration: 500,
      ease: 'Sine.easeInOut'
    });
  }

  // ===== МЕТОДЫ ДЛЯ АСТЕРОИДОВ =====
  spawnAsteroid() {
    const w = this.scale.width;
    const h = this.scale.height;
    const speed = 300 + this.gameLevel * 30;
    const x = w + 50;
    const y = Phaser.Math.Between(50, h - 50);

    const asteroid = new Asteroid(this, x, y, speed);
    this.asteroids.push(asteroid);
    this.asteroidGroup.add(asteroid.sprite);

    this.physics.add.overlap(this.player, asteroid.sprite, (p, a) => {
      if (!this.shieldActive) {
        this.headHP--;
        this.updateHearts();
        this.cameras.main.shake(100, 0.005);
        try { audioManager.playSound(this, 'hit_sound', 0.3); } catch (e) {}

        if (this.headHP <= 0) {
          this.handleDeath();
        }

        a.destroy();
        this.asteroids = this.asteroids.filter(ast => ast.sprite !== a);
        this.comboSystem.reset();
      }
    }, null, this);
  }

  // ===== МЕТОДЫ ДЛЯ УСИЛИТЕЛЕЙ =====
  spawnPowerUp(x, y) {
    const types = ['booster', 'shield', 'magnet', 'slowmo'];
    const type = types[Math.floor(Math.random() * types.length)];
    const powerUp = new PowerUp(this, x, y, type);
    this.powerUps.push(powerUp);
    this.powerUpGroup.add(powerUp.sprite);

    this.physics.add.overlap(this.player, powerUp.sprite, (p, pu) => {
      powerUp.collect(this.player);
      this.powerUps = this.powerUps.filter(pw => pw.sprite !== pu);
    }, null, this);
  }

  activatePowerUp(type, duration = 10) {
    if (this.powerUpActive[type]) return;

    this.powerUpActive[type] = true;
    const powerUp = { type, duration, startTime: Date.now() };
    this.activePowerUps.push(powerUp);

    switch (type) {
      case 'doubleCrystals':
        this.multiplierSystem.addMultiplier('doubleCrystals', 2);
        this.showPowerUpNotification('💎 ДВОЙНЫЕ КРИСТАЛЛЫ', duration);
        break;
      case 'invincible':
        this.shieldActive = true;
        this.player.setTint(0x00ffff);
        this.showPowerUpNotification('🛡️ НЕУЯЗВИМОСТЬ', duration);
        break;
      case 'slowMotion':
        this.currentSpeed *= 0.5;
        this.showPowerUpNotification('⏳ ЗАМЕДЛЕНИЕ ВРЕМЕНИ', duration);
        break;
    }

    this.time.delayedCall(duration * 1000, () => {
      this.deactivatePowerUp(type);
    });
  }

  deactivatePowerUp(type) {
    this.powerUpActive[type] = false;
    this.activePowerUps = this.activePowerUps.filter(p => p.type !== type);

    switch (type) {
      case 'doubleCrystals':
        this.multiplierSystem.removeMultiplier('doubleCrystals');
        break;
      case 'invincible':
        this.shieldActive = false;
        this.player.clearTint();
        break;
      case 'slowMotion':
        this.currentSpeed = this.baseSpeed;
        break;
    }
  }

  showPowerUpNotification(text, duration) {
    const w = this.scale.width;
    const notification = this.add.text(w / 2, 120, text, {
      fontSize: '20px',
      fontFamily: "'Orbitron', monospace",
      color: '#00ff00',
      stroke: '#ffff00',
      strokeThickness: 2,
      shadow: { blur: 10, color: '#00ff00', fill: true }
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);

    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: duration * 1000,
      ease: 'Power2.easeOut',
      onComplete: () => notification.destroy()
    });
  }

  activateBonus(type) {
    const now = Date.now();
    if (now - this.lastBonusTime < 300) return;
    this.lastBonusTime = now;

    if (this.bonusActive) this.deactivateBonus();

    this.bonusActive = true;
    this.bonusType = type;
    this.bonusTime = this.shieldDuration;

    switch (type) {
      case 'speed':
        this.currentSpeed = this.baseSpeed * 1.5;
        this.bonusMultiplier = 2;
        this.player.setTint(0xffff00);
        this.player.speedBoost = 1.5;
        if (this.bonusText) {
          this.bonusText.setColor('#ffff00').setText(`🚀 x2 ${Math.ceil(this.bonusTime)}с`);
          this.bonusText.setVisible(true);
        }
        this.particleManager.createBonusEffect('speed', this.player.x, this.player.y);
        break;
      case 'shield':
        this.shieldActive = true;
        this.player.setTint(0x00ffff);
        this.player.shieldActive = true;
        if (this.bonusText) {
          this.bonusText.setColor('#00ffff').setText(`🛡️ ${Math.ceil(this.bonusTime)}с`);
          this.bonusText.setVisible(true);
        }
        this.particleManager.createShieldEffect(this.player);
        break;
      case 'magnet':
        this.magnetActive = true;
        this.player.setTint(0xff00ff);
        this.player.magnetActive = true;
        if (this.bonusText) {
          this.bonusText.setColor('#ff00ff').setText(`🧲 ${Math.ceil(this.bonusTime)}с`);
          this.bonusText.setVisible(true);
        }
        this.particleManager.createBonusEffect('magnet', this.player.x, this.player.y);
        break;
      case 'slow':
        this.currentSpeed = this.baseSpeed * 0.6;
        this.player.setTint(0xff8800);
        if (this.bonusText) {
          this.bonusText.setColor('#ff8800').setText(`⏳ ${Math.ceil(this.bonusTime)}с`);
          this.bonusText.setVisible(true);
        }
        this.particleManager.createBonusEffect('slow', this.player.x, this.player.y);
        break;
    }

    this.updatePlayerVisuals();

    if (this.bonusTimer) this.bonusTimer.remove();

    this.bonusTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        this.bonusTime -= 0.1;
        if (this.bonusTime <= 0) {
          this.deactivateBonus();
        } else {
          const emoji = this.getBonusEmoji(type);
          if (this.bonusText) {
            this.bonusText.setText(`${emoji} ${Math.ceil(this.bonusTime)}с`);
          }
        }
      },
      loop: true
    });
  }

  deactivateBonus() {
    if (!this.bonusActive) return;
    this.bonusActive = false;
    this.bonusType = null;
    this.shieldActive = false;
    this.magnetActive = false;
    this.player.shieldActive = false;
    this.player.magnetActive = false;
    this.player.speedBoost = 1;
    this.bonusMultiplier = 1;
    this.currentSpeed = this.baseSpeed;
    this.player.clearTint();
    if (this.bonusText) {
      this.bonusText.setVisible(false);
    }
    this.updatePlayerVisuals();
    if (this.bonusTimer) {
      this.bonusTimer.remove();
      this.bonusTimer = null;
    }
    this.particleManager.clearAll();
  }

  getBonusEmoji(type) {
    const emojis = { speed: '🚀', shield: '🛡️', magnet: '🧲', slow: '⏳' };
    return emojis[type] || '✨';
  }

  updatePlayerVisuals() {
    if (!this.player) return;
    if (this.shieldActive) {
      this.player.setTint(0x00ffff);
    } else if (this.bonusActive && this.bonusType === 'speed') {
      this.player.setTint(0xffff00);
    } else if (this.bonusActive && this.bonusType === 'magnet') {
      this.player.setTint(0xff00ff);
    } else if (this.bonusActive && this.bonusType === 'slow') {
      this.player.setTint(0xff8800);
    } else {
      this.player.clearTint();
    }
  }

  // ===== МЕТОДЫ ДЛЯ СТАНЦИИ =====
  checkStationSpawn() {
    if (this.stationActive || this.dead) return;
    if (this.level > 0 && this.level % 10 === 0 && !this.stationPlanet) {
      this.spawnStation();
    }
  }

  spawnStation() {
    const w = this.scale.width;
    const h = this.scale.height;
    const x = w + 200;
    const y = Phaser.Math.Between(100, h - 100);
    this.stationPlanet = this.physics.add.image(x, y, 'station_planet')
      .setImmovable(true)
      .setScale(1.5)
      .setDepth(-5)
      .setVelocityX(-this.currentSpeed * 0.3);
    this.stationPlanet.body.setAllowGravity(false);
    this.stationActive = true;
    const label = this.add.text(x, y - 80, '🚉 СТАНЦИЯ', {
      fontSize: '16px',
      fontFamily: "'Orbitron', monospace",
      color: '#00ffff',
      stroke: '#ff00ff',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(-4);
    this.stationPlanet.label = label;
    this.tweens.add({
      targets: this.stationPlanet,
      angle: 360,
      duration: 8000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  touchStation() {
    if (!this.stationActive || !this.stationPlanet) return;
    this.stationActive = false;
    const bonus = this.wagons.length * 10;
    this.crystals += bonus;
    this.crystalText.setText(`💎 ${this.crystals}`);
    gameManager.data.crystals = this.crystals;
    gameManager.save();
    this.particleManager.createBonusEffect('speed', this.stationPlanet.x, this.stationPlanet.y);
    this.wagons.forEach(w => w.destroy());
    this.wagons = [];
    this.targetPlayerX = 110;
    this.wagonCountText.setText(`🚃 0/${this.maxWagons}`);
    this.updateCameraZoom();
    const msg = this.add.text(this.player.x, this.player.y - 50, `+${bonus} 💎`, {
      fontSize: '28px',
      fontFamily: "'Orbitron', monospace",
      color: '#ffaa00',
      stroke: '#ff00ff',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.tweens.add({
      targets: msg,
      y: msg.y - 100,
      alpha: 0,
      duration: 1500,
      onComplete: () => msg.destroy()
    });
    if (this.stationPlanet.label) this.stationPlanet.label.destroy();
    this.stationPlanet.destroy();
    this.stationPlanet = null;
  }

  // ===== МЕТОДЫ ДЛЯ МОНЕТ =====
  spawnCoin(x, y) {
    if (Math.random() > 0.9) return;

    let coinType = 'gold', texture = 'coin_gold';
    const r = Math.random();

    const redChance = 0.1 + (this.gameLevel * 0.02);
    const blueChance = 0.1 + (this.gameLevel * 0.015);
    const greenChance = 0.1 + (this.gameLevel * 0.01);
    const purpleChance = 0.1 + (this.gameLevel * 0.005);

    if (this.gameLevel >= 1 && r < redChance) {
      coinType = 'red';
      texture = 'coin_red';
    } else if (this.gameLevel >= 2 && r < redChance + blueChance) {
      coinType = 'blue';
      texture = 'coin_blue';
    } else if (this.gameLevel >= 3 && r < redChance + blueChance + greenChance) {
      coinType = 'green';
      texture = 'coin_green';
    } else if (this.gameLevel >= 4 && r < redChance + blueChance + greenChance + purpleChance) {
      coinType = 'purple';
      texture = 'coin_purple';
    }

    const coin = this.physics.add.image(x + Phaser.Math.Between(-20, 20), y, texture)
  .setImmovable(true)
  .setAngularVelocity(200);

// === ДОБАВЬТЕ ЭТИ СТРОКИ ===
coin.body.setAllowGravity(false);
coin.body.setGravityY(0);
coin.body.setVelocityY(0);
coin.setVelocityX(-this.currentSpeed);
coin.body.velocity.x = -this.currentSpeed;
coin.body.velocity.y = 0;
// ============================

coin.setScale(0.01);
coin.coinType = coinType;
coin.setBlendMode(Phaser.BlendModes.ADD);
coin.collected = false;

    this.tweens.add({
      targets: coin,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.out'
    });

    this.coinGroup.add(coin);
    this.physics.add.overlap(this.player, coin, (p, c) => this.collectCoin(c), null, this);
  }

  // ===== МЕТОДЫ ДЛЯ ФОНОВЫХ ОБЪЕКТОВ =====
  createBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.setDepth(-30);

    for (let i = 0; i < 200; i++) {
      const star = this.add.image(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), 'star');
      star.setScale(Phaser.Math.FloatBetween(0.2, 1.8));
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
      star.setDepth(-25);
      this.stars.push({
        sprite: star,
        speed: Phaser.Math.Between(3, 20),
        flicker: Phaser.Math.FloatBetween(0.01, 0.03)
      });
    }
  }

  createPlanets() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 1; i <= 5; i++) {
      const x = Phaser.Math.Between(w, w * 15);
      const y = Phaser.Math.Between(50, h - 50);
      const planet = this.add.image(x, y, `planet_${i}`);
      planet.setScale(Phaser.Math.FloatBetween(2.0, 4.0));
      planet.setTint(0x8888ff);
      planet.setAlpha(0.6 + Math.random() * 0.3);
      planet.setDepth(-15);
      planet.setBlendMode(Phaser.BlendModes.ADD);
      this.planets.push({
        sprite: planet,
        speed: Phaser.Math.Between(2, 12),
        flicker: Phaser.Math.FloatBetween(0.005, 0.01)
      });
    }
  }

  createShips() {
    const w = this.scale.width;
    const h = this.scale.height;
    const shipTextures = ['bg_ship_1', 'bg_ship_2'];

    for (let i = 0; i < 8; i++) {
      const tex = shipTextures[Math.floor(Math.random() * shipTextures.length)];
      const ship = this.add.image(Phaser.Math.Between(w, w * 12), Phaser.Math.Between(50, h - 50), tex);
      ship.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      ship.setTint(0x00ffff);
      ship.setAlpha(0.7);
      ship.setDepth(-10);
      ship.setBlendMode(Phaser.BlendModes.ADD);
      this.ships.push({ sprite: ship, speed: Phaser.Math.Between(3, 10) });
    }
  }

  createAsteroids() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < 10; i++) {
      const tex = i % 2 === 0 ? 'bg_asteroid_1' : 'bg_asteroid_2';
      const asteroid = this.add.image(Phaser.Math.Between(w, w * 12), Phaser.Math.Between(50, h - 50), tex);
      asteroid.setScale(Phaser.Math.FloatBetween(0.6, 1.8));
      asteroid.setTint(0xff8800);
      asteroid.setAlpha(0.7);
      asteroid.setDepth(-12);
      asteroid.setBlendMode(Phaser.BlendModes.ADD);
      this.asteroids.push({ sprite: asteroid, speed: Phaser.Math.Between(4, 14) });
    }
  }

  // ===== МЕТОДЫ ДЛЯ ИГРОКА =====
  createPlayer() {
    const h = this.scale.height;
    const skin = gameManager.getCurrentSkin();

    this.player = this.physics.add.image(this.targetPlayerX, h / 2, skin);
    this.player.setScale(0.9);
    this.player.setCollideWorldBounds(false);
    this.player.setMaxVelocity(600, 1000);
    this.player.body.setCircle(24, 15, 5);
    this.player.setBlendMode(Phaser.BlendModes.ADD);
    this.player.body.setMass(10000);
    this.player.body.setDrag(500, 0);
    this.player.setDepth(15);
    this.player.setVisible(true);

    this.trailEmitter = this.add.particles(0, 0, 'flare', {
      speed: 40,
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 200,
      blendMode: Phaser.BlendModes.ADD,
      follow: this.player,
      followOffset: { x: -20, y: 0 },
      quantity: 4,
      frequency: 15,
      tint: [0x00ffff, 0xff00ff, 0xffff00]
    });

    // Свойства игрока для бонусов
    this.player.doubleCrystals = false;
    this.player.shieldActive = false;
    this.player.magnetActive = false;
    this.player.speedBoost = 1;

    // Звуки
    try {
      this.coinSound = this.sound.add('coin_sound', { volume: 0.4 });
      this.itemSound = this.sound.add('item_sound', { volume: 0.5 });
      this.tapSound = this.sound.add('tap_sound', { volume: 0.3 });
      this.wagonSound = this.sound.add('wagon_sound', { volume: 0.6 });
      this.levelUpSound = this.sound.add('level_up_sound', { volume: 0.5 });
      this.hitSound = this.tapSound;
      this.purchaseSound = this.sound.add('purchase_sound', { volume: 0.5 });
      this.reviveSound = this.sound.add('revive_sound', { volume: 0.5 });
    } catch (e) {
      console.warn('Sounds not loaded');
    }
  }

  flap() {
    this.player.body.setVelocityY(-this.jumpPower * (this.player.speedBoost || 1));
    this.player.setScale(0.95);
    this.tweens.add({
      targets: this.player,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 150,
      ease: 'Quad.out'
    });
    try { this.tapSound.play(); } catch (e) {}
    try { gameManager.vibrate([30]); } catch (e) {}
  }

  // ===== МЕТОДЫ ДЛЯ UI =====
  createUI() {
    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";

    this.scoreText = this.add.text(w / 2, 30, '0', {
      fontSize: '38px',
      fontFamily,
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 6,
      shadow: { blur: 10, color: '#00ffff', fill: true }
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.bestText = this.add.text(10, 10, `🏆 ${this.best}`, {
      fontSize: '14px',
      fontFamily,
      color: '#7dd3fc',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.crystalText = this.add.text(w - 10, 10, `💎 ${this.crystals}`, {
      fontSize: '14px',
      fontFamily,
      color: '#fde047',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);

    this.meterText = this.add.text(10, h - 80, `📏 0 м`, {
      fontSize: '12px',
      fontFamily,
      color: '#a5f3fc',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.wagonCountText = this.add.text(w - 100, h - 30, `🚃 0/${this.maxWagons}`, {
      fontSize: '12px',
      fontFamily,
      color: '#88ccff',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.bonusText = this.add.text(w - 10, 40, '', {
      fontSize: '12px',
      fontFamily,
      stroke: '#0f172a',
      strokeThickness: 2,
      align: 'right'
    }).setOrigin(1, 0).setDepth(10).setVisible(false).setScrollFactor(0);

    this.levelText = this.add.text(w / 2, h / 2 - 70, '', {
      fontSize: '28px',
      fontFamily,
      color: '#ffffff',
      stroke: '#7c3aed',
      strokeThickness: 6,
      shadow: { blur: 15, color: '#ff00ff', fill: true }
    }).setOrigin(0.5).setDepth(15).setVisible(false).setScrollFactor(0);

    this.heartContainer = this.add.container(10, 30).setDepth(10).setScrollFactor(0);
    this.updateHearts();

    this.introText = this.add.text(w / 2, h * 0.40, 'СОБИРАЙ МОНЕТЫ\nЧТОБЫ УДЛИНИТЬ ТАКСИ', {
      fontSize: '12px',
      fontFamily,
      color: '#ffffff',
      align: 'center',
      stroke: '#7c3aed',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.coinTipsText = this.add.text(w / 2, h * 0.50, '🟡 Золото | 🔴 Скорость | 🔵 Щит | 🟢 Магнит | 🟣 Замедление', {
      fontSize: '8px',
      fontFamily,
      color: '#cbd5e1',
      align: 'center'
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    // Кнопки управления
    this.createControlButtons();

    // Коллизии
    this.physics.add.overlap(this.player, this.coinGroup, (p, c) => this.collectCoin(c), null, this);

    // Коллизии пуль с врагами
    this.physics.add.overlap(this.playerBullets, this.enemyGroup, (bullet, enemySprite) => {
      if (!bullet.active || !enemySprite.active) return;
      const enemy = enemySprite.enemyRef;
      if (enemy && enemy.health > 0) {
        this.damageSystem.enemyHitByBullet(enemy, bullet);
      }
    }, null, this);

    this.physics.add.overlap(this.enemyBullets, this.player, (bullet, player) => {
      this.damageSystem.playerHitByBullet(player, bullet);
    }, null, this);

    this.physics.add.overlap(this.enemyBullets, this.wagons, (bullet, wagon) => {
      let hp = wagon.getData('hp') - 1;
      if (hp <= 0) {
        this.wagons = this.wagons.filter(w => w !== wagon);
        this.particleManager.createWagonDestroyEffect(wagon);
        wagon.destroy();
      } else {
        wagon.setData('hp', hp);
        this.tweens.add({
          targets: wagon,
          alpha: 0.5,
          duration: 100,
          yoyo: true,
          repeat: 1
        });
      }
      bullet.destroy();
    }, null, this);
  }

  createControlButtons() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.pauseButton = this.add.image(w - 35, h - 35, 'pause_button')
      .setInteractive().setDepth(20).setScrollFactor(0)
      .on('pointerdown', () => this.togglePause())
      .on('pointerover', () => this.pauseButton.setScale(1.1))
      .on('pointerout', () => this.pauseButton.setScale(1));

    this.shopButton = this.add.image(w - 90, h - 35, 'shop_button')
      .setInteractive().setDepth(20).setScrollFactor(0)
      .setVisible(true)
      .on('pointerdown', () => this.openShop())
      .on('pointerover', () => this.shopButton.setScale(1.1))
      .on('pointerout', () => this.shopButton.setScale(1));

    this.menuButton = this.add.image(w - 145, h - 35, 'menu_button')
      .setInteractive().setDepth(20).setScrollFactor(0)
      .on('pointerdown', () => this.confirmExit())
      .on('pointerover', () => this.menuButton.setScale(1.1))
      .on('pointerout', () => this.menuButton.setScale(1));

    this.attackButton = this.add.image(50, h - 35, 'attack_button')
      .setInteractive().setDepth(20).setScrollFactor(0)
      .on('pointerdown', () => this.attackEnemies())
      .on('pointerover', () => this.attackButton.setScale(1.1))
      .on('pointerout', () => this.attackButton.setScale(1));
  }

  updateHearts() {
    this.heartContainer.removeAll(true);
    for (let i = 0; i < this.maxHeadHP; i++) {
      const heart = this.add.image(i * 16, 0, 'heart').setScale(0.5);
      if (i >= this.headHP) heart.setTint(0x666666).setAlpha(0.5);
      else heart.setTint(0xff88ff);
      this.heartContainer.add(heart);
    }
  }

  createGameOverBox() {
    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";
    
    const panel = this.add.rectangle(0, 0, 300, 250, 0x0a0a1a, 0.95)
        .setStrokeStyle(3, 0x00ffff, 0.9)
        .setScrollFactor(0);
    
    const title = this.add.text(0, -100, 'ИГРА ОКОНЧЕНА', { 
        fontSize: '20px', 
        fontFamily, 
        color: '#ffffff', 
        stroke: '#ff00ff', 
        strokeThickness: 4 
    }).setOrigin(0.5).setScrollFactor(0);
    
    const subtitle = this.add.text(0, -20, '', { 
        fontSize: '12px', 
        fontFamily, 
        color: '#7dd3fc', 
        align: 'center', 
        stroke: '#0f172a', 
        strokeThickness: 2 
    }).setOrigin(0.5).setScrollFactor(0);
    
    this.gameOverSubtitle = subtitle; // <-- ВАЖНО: сохраняем ссылку
    
    const tip = this.add.text(0, 80, 'Нажми, чтобы продолжить', { 
        fontSize: '12px', 
        fontFamily, 
        color: '#cbd5e1', 
        align: 'center' 
    }).setOrigin(0.5).setScrollFactor(0);
    
    this.gameOverBox = this.add.container(w / 2, h / 2, [panel, title, subtitle, tip]);
    this.gameOverBox.setVisible(false);
}

  // ===== МЕТОДЫ УПРАВЛЕНИЯ ИГРОЙ =====
  startRun() {
    this.started = true;
    this.introText.setVisible(false);
    this.coinTipsText.setVisible(false);
    this.spawnGate();
    this.scheduleNextSpawn();
    this.checkStationSpawn();
  }

  scheduleNextSpawn() {
    if (this.dead) return;
    const difficulty = this.getDifficulty();
    this.spawnTimer = this.time.delayedCall(difficulty.spawnDelay, () => {
      if (!this.dead && this.started && !this.isPaused) {
        this.spawnGate();
        this.scheduleNextSpawn();
      }
    });
  }

  getDifficulty() {
    const level = Math.min(this.gameLevel, 20);
    return DIFFICULTY_CURVE[level] || DIFFICULTY_CURVE[20];
  }

  updateDifficulty() {
    const diff = this.getDifficulty();
    this.baseSpeed = diff.speed;
    this.gapSize = diff.gap;
    this.spawnDelay = diff.spawnDelay;
    if (!this.bonusActive) this.currentSpeed = this.baseSpeed;
  }

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      if (this.spawnTimer) this.spawnTimer.paused = true;
      if (this.bonusTimer) this.bonusTimer.paused = true;
      if (this.stationTimer) this.stationTimer.paused = true;

      this.pauseOverlay = this.add.rectangle(
        this.scale.width / 2, this.scale.height / 2,
        this.scale.width, this.scale.height,
        0x000000, 0.7
      ).setDepth(25).setScrollFactor(0);

      const pauseText = this.add.text(
        this.scale.width / 2, this.scale.height / 2 - 40,
        '⏸️ ПАУЗА',
        { fontSize: '40px', fontFamily: "'Orbitron', monospace", color: '#ffffff', stroke: '#00ffff', strokeThickness: 4 }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);

      const tipText = this.add.text(
        this.scale.width / 2, this.scale.height / 2 + 30,
        'Нажми на кнопку паузы, чтобы продолжить',
        { fontSize: '12px', fontFamily: "'Orbitron', monospace", color: '#cccccc' }
      ).setOrigin(0.5).setDepth(26).setScrollFactor(0);

      this.pauseTexts = [pauseText, tipText];
    } else {
      this.physics.resume();
      if (this.spawnTimer) this.spawnTimer.paused = false;
      if (this.bonusTimer) this.bonusTimer.paused = false;
      if (this.stationTimer) this.stationTimer.paused = false;

      if (this.pauseOverlay) {
        this.pauseOverlay.destroy();
        this.pauseOverlay = null;
      }
      if (this.pauseTexts) {
        this.pauseTexts.forEach(t => t.destroy());
        this.pauseTexts = [];
      }
      this.hideShop();
    }
  }

  openShop() {
    if (this.dead) return;
    if (this.countdownActive) this.cancelResumeCountdown();
    if (!this.isPaused) this.togglePause();
    this.showShop();
  }

  confirmExit() {
    if (this.dead) return;
    this.isPaused = true;
    this.physics.pause();
    const w = this.scale.width;
    const h = this.scale.height;
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7).setDepth(50).setScrollFactor(0);
    const panel = this.add.rectangle(w / 2, h / 2, 250, 150, 0x0a0a1a, 0.95).setStrokeStyle(2, 0x00ffff).setDepth(51).setScrollFactor(0);
    const text = this.add.text(w / 2, h / 2 - 30, 'Выйти в меню?', { fontSize: '16px', fontFamily: "'Orbitron', monospace", color: '#ffffff' }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    const yesBtn = this.add.text(w / 2 - 60, h / 2 + 20, 'ДА', { fontSize: '14px', fontFamily: "'Orbitron', monospace", color: '#00ff00', backgroundColor: '#1a1a3a', padding: { x: 10, y: 5 } }).setInteractive().setDepth(52).setScrollFactor(0).on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      text.destroy();
      yesBtn.destroy();
      noBtn.destroy();
      this.scene.start('menu');
    }).on('pointerover', function() { this.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }); }).on('pointerout', function() { this.setStyle({ color: '#00ff00', backgroundColor: '#1a1a3a' }); });
    const noBtn = this.add.text(w / 2 + 60, h / 2 + 20, 'НЕТ', { fontSize: '14px', fontFamily: "'Orbitron', monospace", color: '#ff0000', backgroundColor: '#1a1a3a', padding: { x: 10, y: 5 } }).setInteractive().setDepth(52).setScrollFactor(0).on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      text.destroy();
      yesBtn.destroy();
      noBtn.destroy();
      this.isPaused = false;
      this.physics.resume();
    }).on('pointerover', function() { this.setStyle({ color: '#ffffff', backgroundColor: '#aa0000' }); }).on('pointerout', function() { this.setStyle({ color: '#ff0000', backgroundColor: '#1a1a3a' }); });
  }

  // ===== МЕТОДЫ ДЛЯ МАГАЗИНА =====
  showShop() {
    if (this.shopVisible) return;
    this.shopVisible = true;

    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x0a0a1a, 0.95)
      .setDepth(40).setScrollFactor(0).setInteractive();

    const panel = this.add.rectangle(w / 2, h / 2, w - 30, h - 60, 0x0d0d1a)
      .setStrokeStyle(3, 0x00ffff, 0.8).setDepth(41).setScrollFactor(0);

    const title = this.add.text(w / 2, 30, 'МАГАЗИН УЛУЧШЕНИЙ', {
      fontSize: '22px',
      fontFamily,
      color: '#00ffff',
      stroke: '#ff00ff',
      strokeThickness: 2,
      shadow: { blur: 15, color: '#00ffff', fill: true }
    }).setOrigin(0.5).setDepth(42).setScrollFactor(0);

    const balance = this.add.text(w / 2, 60, `💎 ${this.crystals}`, {
      fontSize: '18px',
      fontFamily,
      color: '#ffaa00',
      stroke: '#ff5500',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(42).setScrollFactor(0);

    this.shopElements = [overlay, panel, title, balance];
    this.shopUpgradeTexts = [];
    this.shopBuyButtons = [];

    const upgrades = SHOP_UPGRADES;

    let y = 90;
    const col1X = 40;
    const col2X = w - 180;

    for (let up of upgrades) {
      const current = this.upgradeSystem.getUpgradeValue(up.key);
      const level = this.upgradeSystem.upgrades[up.key] || 0;
      const maxLevel = up.maxLevel;
      const text = `${up.icon} ${up.name}: ${current}`;
      const cost = this.upgradeSystem.getUpgradeCost(up.key);
      const canAfford = this.crystals >= cost && level < maxLevel;

      const t = this.add.text(col1X, y, text, {
        fontSize: '11px',
        fontFamily,
        color: '#ffffff',
        stroke: '#00aaff',
        strokeThickness: 0.5
      }).setDepth(42).setScrollFactor(0);
      this.shopElements.push(t);
      this.shopUpgradeTexts.push({ key: up.key, textObj: t });

      const priceText = this.add.text(col2X, y, `${cost} 💎`, {
        fontSize: '11px',
        fontFamily,
        color: canAfford ? '#ffaa00' : '#ff0000',
        stroke: canAfford ? '#ff5500' : '#880000',
        strokeThickness: 0.5
      }).setDepth(42).setScrollFactor(0);
      this.shopElements.push(priceText);

      if (canAfford) {
        const btn = this.add.text(col2X + 50, y, '[КУПИТЬ]', {
          fontSize: '10px',
          fontFamily,
          color: '#00ff00',
          backgroundColor: '#1a1a3a',
          padding: { x: 3, y: 1 },
          shadow: { blur: 5, color: '#00ff00', fill: true }
        }).setInteractive().setDepth(42).setScrollFactor(0)
          .on('pointerover', function() { this.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }); })
          .on('pointerout', function() { this.setStyle({ color: '#00ff00', backgroundColor: '#1a1a3a' }); })
          .on('pointerdown', () => this.buyUpgrade(up.key));
        this.shopElements.push(btn);
        this.shopBuyButtons.push({ key: up.key, btnObj: btn });
      }

      y += 25;
    }

    const closeBtn = this.add.text(w / 2, h - 30, 'ЗАКРЫТЬ', {
      fontSize: '16px',
      fontFamily,
      color: '#ff00ff',
      backgroundColor: '#1a1a2e',
      padding: { x: 12, y: 4 },
      shadow: { blur: 8, color: '#ff00ff', fill: true }
    }).setInteractive().setDepth(42).setScrollFactor(0)
      .on('pointerover', function() { this.setStyle({ color: '#ffffff', backgroundColor: '#ff00ff' }); })
      .on('pointerout', function() { this.setStyle({ color: '#ff00ff', backgroundColor: '#1a1a2e' }); })
      .on('pointerdown', () => this.startResumeCountdown());

    this.shopElements.push(closeBtn);
  }

  hideShop() {
    if (!this.shopVisible) return;
    this.shopElements.forEach(el => el.destroy());
    this.shopElements = [];
    this.shopVisible = false;
  }

  buyUpgrade(key) {
    const cost = this.upgradeSystem.getUpgradeCost(key);
    if (this.crystals < cost) {
      this.showNotification('Недостаточно кристаллов!', 1500, '#ff4444');
      return;
    }
    this.crystals -= cost;
    this.crystalText.setText(`💎 ${this.crystals}`);
    this.upgradeSystem.applyUpgrade(key);
    try { this.purchaseSound.play(); } catch (e) {}
    this.showNotification('Улучшение куплено!', 1500, '#00ff00');
    if (this.shopVisible) {
      this.hideShop();
      this.showShop();
    }
    gameManager.data.crystals = this.crystals;
    gameManager.save();
  }

  startResumeCountdown() {
    if (this.countdownActive) return;
    this.hideShop();

    this.countdownActive = true;
    let count = 3;
    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";

    this.countdownOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7).setDepth(50).setScrollFactor(0);
    this.countdownText = this.add.text(w / 2, h / 2 - 30, '3', {
      fontSize: '70px',
      fontFamily,
      color: '#00ffff',
      stroke: '#ff00ff',
      strokeThickness: 6,
      shadow: { blur: 20, color: '#00ffff', fill: true }
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);

    this.countdownPrepareText = this.add.text(w / 2, h / 2 + 40, 'ПРИГОТОВЬСЯ', {
      fontSize: '16px',
      fontFamily,
      color: '#ffffff',
      stroke: '#00aaff',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);

    this.resumeCountdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        count--;
        if (count > 0) {
          this.countdownText.setText(count.toString());
        } else {
          this.countdownText.setText('ПОЕХАЛИ!');
          this.time.delayedCall(500, () => {
            this.countdownOverlay.destroy();
            this.countdownText.destroy();
            this.countdownPrepareText.destroy();
            this.countdownActive = false;
            if (this.isPaused) this.togglePause();
          });
          this.resumeCountdownTimer.remove();
        }
      },
      repeat: 2
    });
  }

  cancelResumeCountdown() {
    if (this.resumeCountdownTimer) {
      this.resumeCountdownTimer.remove();
      this.resumeCountdownTimer = null;
    }
    if (this.countdownOverlay) {
      this.countdownOverlay.destroy();
      this.countdownOverlay = null;
    }
    if (this.countdownText) {
      this.countdownText.destroy();
      this.countdownText = null;
    }
    if (this.countdownPrepareText) {
      this.countdownPrepareText.destroy();
      this.countdownPrepareText = null;
    }
    this.countdownActive = false;
  }

  showNotification(text, duration = 2000, color = '#ffffff') {
    const w = this.scale.width;
    const notification = this.add.text(w / 2, 100, text, {
      fontSize: '16px',
      fontFamily: "'Orbitron', monospace",
      color: color,
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: duration,
      ease: 'Power2.easeOut',
      onComplete: () => notification.destroy()
    });
  }

  // ===== МЕТОДЫ ДЛЯ УРОВНЕЙ =====
  checkLevelProgression() {
    const nextLevel = Math.floor(this.score / 500);
    if (nextLevel > this.levelManager.currentLevel && nextLevel < 6) {
      this.transitionToLevel(nextLevel);
    }
  }

  transitionToLevel(levelIndex) {
    this.levelManager.switchLevel(levelIndex);
    this.waveManager = new WaveManager(this, this.levelManager);
    this.showLevelTransition(levelIndex);
  }

  showLevelTransition(levelIndex) {
    const w = this.scale.width;
    const h = this.scale.height;
    const levelName = this.levelManager.levelConfig[levelIndex].name;
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0).setDepth(100).setScrollFactor(0);
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        const text = this.add.text(w / 2, h / 2, levelName, {
          fontSize: '50px',
          fontFamily: "'Orbitron', monospace",
          color: '#00ffff',
          stroke: '#ff00ff',
          strokeThickness: 6,
          shadow: { blur: 20, color: '#00ffff', fill: true }
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        this.time.delayedCall(1500, () => {
          this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              overlay.destroy();
              text.destroy();
            }
          });
        });
      }
    });
  }

  updateLevel() {
    const newLevel = Math.floor(this.meters / 300);
    if (newLevel > this.gameLevel) {
      this.gameLevel = newLevel;
      this.updateDifficulty();

      const w = this.scale.width;
      const levelText = this.add.text(w / 2, 200, `УРОВЕНЬ ${this.gameLevel + 1}`, {
        fontSize: '24px',
        fontFamily: "'Orbitron', sans-serif",
        color: '#00ffff',
        stroke: '#ff00ff',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

      this.tweens.add({
        targets: levelText,
        alpha: 0,
        duration: 2000,
        onComplete: () => levelText.destroy()
      });

      this.checkStationSpawn();
      this.questSystem.updateProgress('level', 1);
    }
  }

  checkLevelComplete() {
    if (!this.started || this.dead) return;
    if (this.score >= this.worldConfig.goalScore) {
      this.completeLevel();
    }
  }

  completeLevel() {
    let stars = 1;
    if (this.score >= this.worldConfig.goalScore * 1.5) stars = 2;
    if (this.score >= this.worldConfig.goalScore * 2) stars = 3;
    if (this.headHP === this.maxHeadHP) stars = Math.min(3, stars + 1);

    gameManager.setLevelStars(this.world, this.level, stars);

    if (this.level < 9) {
      gameManager.unlockLevel(this.world, this.level + 1);
    }
    if (this.level === 9 && this.world < 4) {
      const worlds = gameManager.data.unlockedWorlds;
      if (!worlds.includes(this.world + 1)) {
        worlds.push(this.world + 1);
        gameManager.save();
      }
    }

    gameManager.updateStats(
      this.score,
      this.level + 1,
      this.wagons.length,
      this.comboSystem.maxCombo,
      this.collectedCoins,
      0,
      Math.floor(this.meters)
    );

    this.scene.start('levelComplete', {
      world: this.world,
      level: this.level,
      score: this.score,
      stars: stars,
      coins: this.collectedCoins,
      wagons: this.wagons.length,
      newUnlock: this.level < 9
    });
  }

  createLevelUpEffect() {
    const w = this.scale.width;
    const h = this.scale.height;
    const emitter = this.add.particles(w / 2, h / 2, 'flare', {
      speed: { min: -200, max: 200 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 600,
      quantity: 30,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00]
    });
    emitter.explode(30);
    this.cameras.main.shake(200, 0.01);
    this.cameras.main.flash(200, 255, 255, 100);
  }

  // ===== МЕТОДЫ ДЛЯ СМЕРТИ =====
  handleDeath() {
    if (this.upgradeSystem.upgrades.revival > 0 && !this.dead) {
      this.upgradeSystem.upgrades.revival--;
      this.headHP = this.maxHeadHP;
      this.updateHearts();
      this.cameras.main.flash(300, 100, 255, 100, false);
      try { this.reviveSound.play(); } catch (e) {}
      this.showNotification('ВОСКРЕШЕНИЕ!', 2000, '#00ffff');
      gameManager.data.upgrades = this.upgradeSystem.upgrades;
      gameManager.save();
      return;
    }
    if (this.dead) return;
    this.dead = true;
    this.trailEmitter.stop();
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.bonusTimer) this.bonusTimer.remove();
    if (this.stationTimer) this.stationTimer.remove();

    this.physics.pause();
    this.cameras.main.shake(300, 0.005);
    this.cameras.main.flash(300, 255, 100, 100, false);
    this.player.setTint(0xff0000).setAngle(90);

    const emitter = this.add.particles(this.player.x, this.player.y, 'flare', {
      speed: 250,
      scale: { start: 1.2, end: 0 },
      lifespan: 600,
      quantity: 50,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xff0000, 0xff8800, 0xff00ff]
    });
    emitter.explode(50);

    this.updateLeaderboard();
    this.updateStats();
    this.showGameOver();

    if (window.Telegram?.WebApp) {
      const data = JSON.stringify({ score: this.score, level: this.level + 1, meters: Math.floor(this.meters) });
      window.Telegram.WebApp.sendData(data);
    }
    try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('error'); } catch (e) {}
  }

  showGameOver() {
    // Если gameOverBox ещё не создан, создаём его
    if (!this.gameOverBox) {
        this.createGameOverBox();
    }
    
    // Проверяем, что gameOverSubtitle существует перед установкой текста
    if (this.gameOverSubtitle) {
        this.gameOverSubtitle.setText(
            `Счёт: ${this.score}\nРекорд: ${this.best}\n💎 ${this.crystals}\n📏 ${Math.floor(this.meters)} м\n🚃 Вагонов: ${this.wagons.length}/${this.maxWagons}`
        );
    }
    
    this.gameOverBox.setVisible(true);
    this.gameOverBox.setScale(0.9).setAlpha(0);
    this.tweens.add({
        targets: this.gameOverBox,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 400,
        ease: 'Back.out'
    });
}

  // ===== МЕТОДЫ ДЛЯ ДОСТИЖЕНИЙ =====
  initAchievements() {
    this.achievements = { ...ACHIEVEMENTS };
    for (let key in this.achievements) {
      this.achievements[key].unlocked = false;
    }
    this.loadAchievements();
  }

  loadAchievements() {
    try {
      const saved = localStorage.getItem('skypulse_achievements');
      if (saved) {
        const data = JSON.parse(saved);
        for (let key in data) {
          if (this.achievements[key]) this.achievements[key].unlocked = data[key];
        }
      }
    } catch (e) {}
  }

  saveAchievements() {
    const data = {};
    for (let key in this.achievements) data[key] = this.achievements[key].unlocked;
    localStorage.setItem('skypulse_achievements', JSON.stringify(data));
  }

  checkAchievements() {
    if (this.wagons.length >= 1 && !this.achievements.first_wagon.unlocked) this.unlockAchievement('first_wagon');
    if (this.wagons.length >= 5 && !this.achievements.five_wagons.unlocked) this.unlockAchievement('five_wagons');
    if (this.wagons.length >= 10 && !this.achievements.ten_wagons.unlocked) this.unlockAchievement('ten_wagons');
    if (this.level >= 4 && !this.achievements.level_5.unlocked) this.unlockAchievement('level_5');
    if (this.level >= 9 && !this.achievements.level_10.unlocked) this.unlockAchievement('level_10');
    if (this.score >= 100 && !this.achievements.score_100.unlocked) this.unlockAchievement('score_100');
    if (this.score >= 500 && !this.achievements.score_500.unlocked) this.unlockAchievement('score_500');
    if (this.headHP === this.maxHeadHP && this.score > 10 && !this.achievements.no_damage.unlocked) this.unlockAchievement('no_damage');
    this.checkCoinAchievements();
  }

  checkCoinAchievements() {
    if (this.collectedCoins >= 50 && !this.achievements.all_bonuses.unlocked) {
      this.unlockAchievement('all_bonuses');
    }
  }

  unlockAchievement(key) {
    if (this.achievements[key].unlocked) return;
    this.achievements[key].unlocked = true;
    const reward = this.achievements[key].reward;
    this.crystals += reward;
    this.crystalText.setText(`💎 ${this.crystals}`);
    gameManager.data.crystals = this.crystals;
    gameManager.unlockAchievement(key);
    gameManager.save();
    this.showAchievementNotification(key, reward);
    this.saveAchievements();
  }

  showAchievementNotification(key, reward) {
    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";
    const achievement = this.achievements[key];
    const notification = this.add.container(w / 2, -80).setDepth(100).setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, 280, 60, 0x0a0a1a, 0.95).setStrokeStyle(2, 0x00ffff, 0.8);
    const title = this.add.text(0, -15, `🏆 ${achievement.name}`, { fontSize: '14px', fontFamily, color: '#ffaa00', stroke: '#ff5500', strokeThickness: 1 }).setOrigin(0.5);
    const rewardText = this.add.text(0, 10, `+${reward} 💎`, { fontSize: '12px', fontFamily, color: '#00ff00', stroke: '#00aa00', strokeThickness: 1 }).setOrigin(0.5);
    notification.add([bg, title, rewardText]);
    this.tweens.add({
      targets: notification,
      y: 80,
      duration: 3000,
      ease: 'Sine.easeInOut',
      onComplete: () => notification.destroy()
    });
    try { this.levelUpSound.play(); } catch (e) {}
  }

  // ===== МЕТОДЫ ДЛЯ ЕЖЕДНЕВНЫХ НАГРАД =====
  initDailyRewards() {
    this.dailyReward = {
      lastClaimDate: localStorage.getItem('skypulse_daily_date') || '',
      streak: parseInt(localStorage.getItem('skypulse_daily_streak') || '0'),
      rewards: [10, 20, 30, 50, 75, 100, 150]
    };
    this.checkDailyReward();
  }

  checkDailyReward() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = this.dailyReward.lastClaimDate;
    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (lastDate === yesterdayStr) this.dailyReward.streak++;
      else this.dailyReward.streak = 1;
      this.dailyReward.streak = Math.min(this.dailyReward.streak, 7);
      this.dailyReward.lastClaimDate = today;
      this.saveDailyReward();
      this.showDailyRewardNotification();
    }
  }

  showDailyRewardNotification() {
    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";
    const rewardAmount = this.dailyReward.rewards[this.dailyReward.streak - 1];
    this.crystals += rewardAmount;
    if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
    gameManager.data.crystals = this.crystals;
    gameManager.save();
    const notification = this.add.container(w / 2, h / 2).setDepth(100).setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, 300, 150, 0x0a0a1a, 0.95).setStrokeStyle(3, 0x00ffff, 0.8);
    const title = this.add.text(0, -40, '🎁 ДНЕВНАЯ НАГРАДА', { fontSize: '18px', fontFamily, color: '#00ffff', stroke: '#ff00ff', strokeThickness: 2 }).setOrigin(0.5);
    const streak = this.add.text(0, -10, `День ${this.dailyReward.streak}/7`, { fontSize: '14px', fontFamily, color: '#ffaa00' }).setOrigin(0.5);
    const reward = this.add.text(0, 20, `+${rewardAmount} 💎`, { fontSize: '24px', fontFamily, color: '#00ff00', stroke: '#00aa00', strokeThickness: 2 }).setOrigin(0.5);
    const claimBtn = this.add.text(0, 60, '[ПОЛУЧИТЬ]', { fontSize: '12px', fontFamily, color: '#00ff00', backgroundColor: '#1a1a3a', padding: { x: 10, y: 4 } }).setInteractive().setOrigin(0.5).on('pointerdown', () => notification.destroy());
    notification.add([bg, title, streak, reward, claimBtn]);
    this.tweens.add({
      targets: notification,
      scale: 1.05,
      duration: 200,
      yoyo: true,
      ease: 'Back.out'
    });
  }

  saveDailyReward() {
    localStorage.setItem('skypulse_daily_date', this.dailyReward.lastClaimDate);
    localStorage.setItem('skypulse_daily_streak', String(this.dailyReward.streak));
  }

  // ===== МЕТОДЫ ДЛЯ ЛИДЕРБОРДА =====
  initLeaderboard() {
    this.leaderboard = [];
    try {
      const saved = localStorage.getItem('skypulse_leaderboard');
      if (saved) this.leaderboard = JSON.parse(saved);
    } catch (e) {}
  }

  saveLeaderboard() {
    localStorage.setItem('skypulse_leaderboard', JSON.stringify(this.leaderboard));
  }

  updateLeaderboard() {
    const entry = {
      score: this.score,
      level: this.level + 1,
      wagons: this.wagons.length,
      meters: Math.floor(this.meters),
      timestamp: Date.now()
    };
    this.leaderboard.unshift(entry);
    this.leaderboard = this.leaderboard.slice(0, 10);
    this.saveLeaderboard();
  }

  // ===== МЕТОДЫ ДЛЯ СТАТИСТИКИ =====
  initStats() {
    this.stats = {
      totalGames: 0,
      totalDistance: 0,
      totalCoins: 0,
      bestScore: 0,
      bestLevel: 0,
      totalWagons: 0,
      totalPlayTime: 0,
      startTime: Date.now()
    };
    try {
      const saved = localStorage.getItem('skypulse_stats');
      if (saved) this.stats = JSON.parse(saved);
    } catch (e) {}
  }

  saveStats() {
    localStorage.setItem('skypulse_stats', JSON.stringify(this.stats));
  }

  updateStats() {
    this.stats.totalGames++;
    this.stats.totalDistance += Math.floor(this.meters);
    this.stats.totalCoins += this.crystals;
    if (this.score > this.stats.bestScore) this.stats.bestScore = this.score;
    if (this.level + 1 > this.stats.bestLevel) this.stats.bestLevel = this.level + 1;
    this.stats.totalWagons += this.wagons.length;
    this.stats.totalPlayTime += (Date.now() - this.stats.startTime) / 1000;
    this.saveStats();
  }

  // ===== МЕТОДЫ ДЛЯ ОЧИСТКИ ОБЪЕКТОВ =====
  cleanupObjects() {
    this.pipes = this.pipes.filter(p => {
      if (p.x < -150) {
        if (p.tween) p.tween.stop();
        p.destroy();
        return false;
      }
      return true;
    });

    this.coins = this.coins.filter(c => {
      if (!c.active || c.x < -100) {
        c.destroy();
        return false;
      }
      return true;
    });

    this.scoreZones = this.scoreZones.filter(z => {
      if (z.x < -60) {
        z.destroy();
        return false;
      }
      return true;
    });

    if (this.stationPlanet && this.stationPlanet.x < -200) {
      if (this.stationPlanet.label) this.stationPlanet.label.destroy();
      this.stationPlanet.destroy();
      this.stationPlanet = null;
      this.stationActive = false;
    }
  }

  // ===== МЕТОДЫ ДЛЯ ОБНОВЛЕНИЯ ФОНА =====
  updateStars(time, delta) {
    const w = this.scale.width;
    const h = this.scale.height;
    const factor = this.started && !this.dead ? 1 : 0.3;
    const dt = delta / 1000;

    for (let s of this.stars) {
      s.sprite.x -= s.speed * factor * dt;
      if (s.flicker) {
        s.sprite.alpha = 0.5 + Math.sin(time * s.flicker) * 0.3;
      }
      if (s.sprite.x < -10) {
        s.sprite.x = w + Phaser.Math.Between(5, 50);
        s.sprite.y = Phaser.Math.Between(0, h);
      }
    }
  }

  updatePlanets(delta) {
    const w = this.scale.width;
    const factor = this.started && !this.dead ? 0.2 : 0.05;
    const dt = delta / 1000;

    for (let p of this.planets) {
      p.sprite.x -= p.speed * factor * dt;
      if (p.sprite.x < -300) {
        p.sprite.x = w + Phaser.Math.Between(400, 2000);
        p.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  updateShips(delta) {
    const w = this.scale.width;
    const factor = this.started && !this.dead ? 0.3 : 0.1;
    const dt = delta / 1000;

    for (let s of this.ships) {
      s.sprite.x -= s.speed * factor * dt;
      if (s.sprite.x < -200) {
        s.sprite.x = w + Phaser.Math.Between(300, 1500);
        s.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  updateAsteroids(delta) {
    const w = this.scale.width;
    const factor = this.started && !this.dead ? 0.3 : 0.1;
    const dt = delta / 1000;

    for (let a of this.asteroids) {
      a.sprite.x -= a.speed * factor * dt;
      if (a.sprite.x < -200) {
        a.sprite.x = w + Phaser.Math.Between(300, 1500);
        a.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  // ===== МЕТОДЫ ДЛЯ РЕСАЙЗА =====
  onResize() {
    const w = this.scale.width;
    const h = this.scale.height;

    if (this.scoreText) this.scoreText.setPosition(w / 2, 30);
    if (this.bestText) this.bestText.setPosition(10, 10);
    if (this.crystalText) this.crystalText.setPosition(w - 10, 10);
    if (this.meterText) this.meterText.setPosition(10, h - 80);
    if (this.wagonCountText) this.wagonCountText.setPosition(w - 100, h - 30);
    if (this.bonusText) this.bonusText.setPosition(w - 10, 40);
    if (this.levelText) this.levelText.setPosition(w / 2, h / 2 - 70);
    if (this.pauseButton) this.pauseButton.setPosition(w - 35, h - 35);
    if (this.shopButton) this.shopButton.setPosition(w - 90, h - 35);
    if (this.menuButton) this.menuButton.setPosition(w - 145, h - 35);
    if (this.attackButton) this.attackButton.setPosition(50, h - 35);
    if (!this.started) {
      if (this.introText) this.introText.setPosition(w / 2, h * 0.40);
      if (this.coinTipsText) this.coinTipsText.setPosition(w / 2, h * 0.50);
    }
    if (this.heartContainer) this.heartContainer.setPosition(10, 30);
  }

  // ===== МЕТОДЫ ДЛЯ ОЧИСТКИ ПРИ ЗАКРЫТИИ СЦЕНЫ =====
  shutdown() {
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.bonusTimer) this.bonusTimer.remove();
    if (this.stationTimer) this.stationTimer.remove();
    if (this.resumeCountdownTimer) this.resumeCountdownTimer.remove();
    this.pipes.forEach(p => { if (p.tween) p.tween.stop(); p.destroy(); });
    this.pipes = [];
    this.coins.forEach(c => c.destroy());
    this.coins = [];
    this.wagons.forEach(w => w.destroy());
    this.wagons = [];
    this.scoreZones.forEach(z => z.destroy());
    this.scoreZones = [];
    this.stars.forEach(s => s.sprite.destroy());
    this.stars = [];
    this.planets.forEach(p => p.sprite.destroy());
    this.planets = [];
    this.ships.forEach(s => s.sprite.destroy());
    this.ships = [];
    this.asteroids.forEach(a => a.sprite.destroy());
    this.asteroids = [];
    if (this.trailEmitter) this.trailEmitter.stop();
    if (this.stationPlanet) {
      if (this.stationPlanet.label) this.stationPlanet.label.destroy();
      this.stationPlanet.destroy();
    }
    this.particleManager.clearAll();
    this.shopElements.forEach(el => { if (el && el.destroy) el.destroy(); });
    this.shopElements = [];
    this.playerBullets.clear(true, true);
    this.enemyBullets.clear(true, true);
    if (this.comboSystem) this.comboSystem.destroy();
    if (this.specialEventManager) this.specialEventManager.destroy();
  }
}