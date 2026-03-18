// src/scenes/PlayScene.js
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
import { Wagon } from '../entities/Wagon';

// =========================================================================
// ВСПОМОГАТЕЛЬНЫЕ КЛАССЫ
// =========================================================================

/**
 * Класс для управления врагами с ИИ
 */
class AIEnemy {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type;
    this.config = ENEMY_CONFIG[type];
    this.sprite = scene.physics.add.image(x, y, `enemy_${type}`).setScale(1.2);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setGravityY(0);
    this.health = this.config.health;
    this.maxHealth = this.config.health;

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

    this.healthBar = this.scene.add.image(
      this.sprite.x,
      this.sprite.y - 20,
      'enemy_health_bar'
    )
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
    this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    this.scene.particleManager.createEnemyDeathEffect(
      this.sprite.x,
      this.sprite.y
    );

    if (this.scene.enemyGroup) {
      this.scene.enemyGroup.remove(this.sprite);
    }
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    this.sprite.destroy();

    if (this.scene.waveManager) {
      this.scene.waveManager.enemies = this.scene.waveManager.enemies.filter(
        (e) => e !== this
      );
    }
  }

  update(playerPos, time, delta) {
    const dist = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      playerPos.x,
      playerPos.y
    );

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
  }

  chase(playerPos) {
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      playerPos.x,
      playerPos.y
    );
    const speed = this.config.speed;
    this.sprite.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
  }

  attack(playerPos) {
    if (this.fireCooldown <= 0) {
      this.scene.fireEnemyBullet(this, playerPos);
      this.fireCooldown = this.config.fireDelay;
    }
    this.chase(playerPos);
  }

  patrol(delta) {
    this.patrolTimer += delta;
    if (this.patrolTimer > 2000) {
      this.patrolDirection *= -1;
      this.patrolTimer = 0;
    }
    this.sprite.body.setVelocity(
      this.config.speed * this.patrolDirection * 0.5,
      0
    );

    if (this.sprite.y < 50) {
      this.sprite.y = 50;
      this.sprite.body.setVelocityY(0);
    } else if (this.sprite.y > this.scene.scale.height - 50) {
      this.sprite.y = this.scene.scale.height - 50;
      this.sprite.body.setVelocityY(0);
    }
  }
}

/**
 * Класс для управления волнами врагов
 */
class WaveManager {
  constructor(scene, levelManager) {
    this.scene = scene;
    this.levelManager = levelManager;
    this.currentWave = 0;
    this.enemies = [];
    this.waveConfig =
      WAVE_CONFIG[levelManager.getCurrentTheme()] || WAVE_CONFIG.space;
    this.spawnTimer = 0;
  }

  update(time, delta, playerPos) {
    if (this.scene.level < 1) return;

    this.spawnTimer += delta;
    if (
      this.spawnTimer > 5000 &&
      this.enemies.length === 0 &&
      this.currentWave < this.waveConfig.length
    ) {
      this.showWaveWarning(this.currentWave);
      this.spawnWave(this.currentWave);
      this.currentWave++;
      this.spawnTimer = 0;
    }

    this.enemies.forEach((enemy) => {
      enemy.update(playerPos, time, delta);
    });
    this.enemies = this.enemies.filter((e) => e.health > 0);
  }

  spawnWave(waveIndex) {
    const config = this.waveConfig[waveIndex];
    if (!config) return;

    for (let i = 0; i < config.count; i++) {
      const x = Phaser.Math.Between(
        this.scene.scale.width + 50,
        this.scene.scale.width + 300
      );
      const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
      const enemy = new AIEnemy(this.scene, x, y, config.type);
      this.enemies.push(enemy);
    }
  }

  showWaveWarning(waveIndex) {
    const scene = this.scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const warning = scene.add
      .text(w / 2, h / 2, `⚠️ ВОЛНА ${waveIndex + 1}`, {
        fontSize: '32px',
        fontFamily: "'Orbitron', monospace",
        color: '#ff4444',
        stroke: '#ff0000',
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setScrollFactor(0);

    scene.tweens.add({
      targets: warning,
      alpha: 0,
      duration: 1500,
      onComplete: () => warning.destroy()
    });
  }

  reset() {
    this.enemies.forEach((e) => e.sprite.destroy());
    this.enemies = [];
    this.currentWave = 0;
    this.spawnTimer = 0;
  }
}

/**
 * Класс для управления системой урона
 */
class DamageSystem {
  constructor(scene) {
    this.scene = scene;
  }

  playerHitByEnemy(player, enemy) {
    if (player.shieldActive) {
      this.scene.particleManager.createBonusEffect(
        'shield',
        enemy.sprite.x,
        enemy.sprite.y
      );
      player.body.setVelocityY(-100);
      return;
    }

    player.headHP -= enemy.config.damage;
    this.scene.updateHearts();
    this.scene.cameras.main.shake(150, 0.005);

    try {
      this.scene.hitSound.play();
    } catch (e) {}

    if (
      gameManager.data.vibrationEnabled &&
      window.Telegram?.WebApp?.HapticFeedback
    ) {
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

    try {
      this.scene.hitSound.play();
    } catch (e) {}

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
    this.scene.particleManager.createAttackEffect(
      enemy.sprite.x,
      enemy.sprite.y
    );
    bullet.destroy();
  }

  wagonHitByEnemy(wagon, enemy) {
    let hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      this.scene.wagons = this.scene.wagons.filter((w) => w !== wagon);
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
}

/**
 * Класс для управления специальными событиями
 */
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
        const meteor = this.scene.physics.add
          .image(x, y, 'bg_asteroid_1')
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
    const pulse = this.scene.add
      .circle(w / 2, h / 2, 10, 0x00ffff, 0.5)
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
    coins.forEach((coin) => {
      const angle = Phaser.Math.Angle.Between(w / 2, h / 2, coin.x, coin.y);
      coin.setVelocityX(Math.cos(angle) * 300);
      coin.setVelocityY(Math.sin(angle) * 300);
    });
  }

  showEventNotification(eventName) {
    const w = this.scene.scale.width;
    const notification = this.scene.add
      .text(w / 2, 200, `⚡ ${eventName}`, {
        fontSize: '24px',
        fontFamily: "'Orbitron', monospace",
        color: '#ff00ff',
        stroke: '#ffff00',
        strokeThickness: 3,
        shadow: { blur: 15, color: '#ff00ff', fill: true }
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setScrollFactor(0);

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

    // ===== ИНИЦИАЛИЗАЦИЯ ОСНОВНЫХ ПАРАМЕТРОВ =====
    this.world = gameManager.getCurrentWorld();
    this.level = gameManager.getCurrentLevel();
    this.worldConfig = LEVEL_CONFIG[this.world];

    // Основные параметры игры
    this.score = 0;
    this.crystals = gameManager.data.crystals;
    this.meters = 0;
    this.best = Number(localStorage.getItem('skypulse_best') || 0);

    // ===== ПАРАМЕТРЫ ВАГОНОВ =====
    this.wagons = [];
    this.collectedCoins = 0;
    this.coinsForWagon = 15;
    this.maxWagons =
      12 + (gameManager.data.upgrades.maxWagons || 0) * 2;
    this.wagonGap = 28 - (gameManager.data.upgrades.wagonGap || 0) * 2;
    this.wagonSpring = 0.25;
    this.targetPlayerX = 110;
    this.playerXSpeed = 0.05;
    this.maxTargetX = 200;

    // ===== СОСТОЯНИЯ ИГРЫ =====
    this.started = false;
    this.dead = false;
    this.gameLevel = 0;
    this.isPaused = false;
    this.pauseOverlay = null;
    this.pauseTexts = [];
    this.countdownActive = false;
    this.shopVisible = false;
    this.shopElements = [];

    // ===== ЗДОРОВЬЕ =====
    this.maxHeadHP = 3 + (gameManager.data.upgrades.headHP || 0);
    this.headHP = this.maxHeadHP;
    this.wagonBaseHP = 1 + (gameManager.data.upgrades.wagonHP || 0);

    // ===== СКОРОСТЬ И СЛОЖНОСТЬ =====
    this.baseSpeed = 240;
    this.currentSpeed = this.baseSpeed;
    this.gapSize = 240;
    this.spawnDelay = 1300;
    this.gateTextures = [
      'gate_blue',
      'gate_green',
      'gate_yellow',
      'gate_red',
      'gate_purple'
    ];

    // ===== БОНУСЫ И УСИЛИТЕЛИ =====
    this.bonusActive = false;
    this.bonusType = null;
    this.bonusTime = 0;
    this.bonusMultiplier = 1;
    this.bonusTimer = null;
    this.shieldActive = false;
    this.magnetActive = false;
    this.magnetRange =
      220 + (gameManager.data.upgrades.magnetRange || 0) * 40;
    this.lastBonusTime = 0;
    this.shieldDuration =
      5 + (gameManager.data.upgrades.shieldDuration || 0) * 1.5;
    this.powerUpActive = {};
    this.activePowerUps = [];

    // ===== СИСТЕМЫ =====
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

    // ===== ПАРАМЕТРЫ ОРУЖИЯ =====
    this.weaponDamage = 1;
    this.weaponBulletSpeed = 400;
    this.weaponFireDelay = 500;
    this.weaponCooldown = 0;

    // ===== МАССИВЫ ОБЪЕКТОВ =====
    this.pipes = [];
    this.coins = [];
    this.scoreZones = [];
    this.stars = [];
    this.planets = [];
    this.ships = [];
    this.asteroids = [];
    this.powerUps = [];

    // ===== ГРУППЫ ФИЗИКИ =====
    this.gateGroup = this.physics.add.group();
    this.coinGroup = this.physics.add.group();
    this.asteroidGroup = this.physics.add.group();
    this.powerUpGroup = this.physics.add.group();
    this.playerBullets = this.physics.add.group({
      classType: Phaser.GameObjects.Image,
      runChildUpdate: false
    });
    this.enemyBullets = this.physics.add.group({
      classType: Phaser.GameObjects.Image,
      runChildUpdate: false
    });
    this.enemyGroup = this.physics.add.group();

    // ===== ТАЙМЕРЫ =====
    this.spawnTimer = null;
    this.stationTimer = null;

    // ===== СТАНЦИЯ =====
    this.stationPlanet = null;
    this.stationActive = false;

    // ===== ИНИЦИАЛИЗАЦИЯ СИСТЕМ =====
    this.initAchievements();
    this.initDailyRewards();
    this.initLeaderboard();
    this.initStats();

    // ===== СОЗДАНИЕ ОБЪЕКТОВ =====
    this.createBackground();
    this.createPlanets();
    this.createShips();
    this.createAsteroids();
    this.createPlayer();
    this.createUI();

    // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
    this.input.on('pointerdown', (pointer) => {
      if (pointer.targetObject) return;
      if (this.dead) {
        this.scene.start('menu');
        return;
      }
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

    // ===== МУЗЫКА =====
    audioManager.playMusic(this, 0.2);
  }

  update(time, delta) {
    if (this.isPaused || this.countdownActive) return;

    // ===== ОБНОВЛЕНИЕ ФОНА =====
    this.updateStars(time, delta);
    this.updatePlanets(delta);
    this.updateShips(delta);
    this.updateAsteroids(delta);

    // Принудительно обнуляем вертикальную скорость для всех ворот
    this.gateGroup.getChildren().forEach((gate) => {
      if (gate.body) {
        gate.body.setVelocityY(0);
        gate.body.setGravityY(0);
      }
    });

    this.scoreZones.forEach((zone) => {
      if (zone.body) {
        zone.body.setVelocityY(0);
        zone.body.setGravityY(0);
      }
    });

    if (!this.started || this.dead) return;

    // ===== ОБНОВЛЕНИЕ ОРУЖИЯ =====
    if (this.weaponCooldown > 0) {
      this.weaponCooldown -= delta;
    }

    // Автоматическая стрельба
    if (this.level >= 1 && this.waveManager.enemies.length > 0) {
      if (this.weaponCooldown <= 0) {
        const closestEnemy = this.waveManager.enemies[0];
        if (closestEnemy && closestEnemy.sprite) {
          this.firePlayerBullet(
            closestEnemy.sprite.x,
            closestEnemy.sprite.y
          );
          this.weaponCooldown = this.weaponFireDelay;
        }
      }
    }

    // ===== ОБНОВЛЕНИЕ ПОЗИЦИИ ИГРОКА =====
    this.targetPlayerX = Math.min(this.maxTargetX, this.targetPlayerX);
    this.player.x +=
      (this.targetPlayerX - this.player.x) * this.playerXSpeed;

    const body = this.player.body;
    this.player.setAngle(
      Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75)
    );

    // ===== ПРОВЕРКА СМЕРТИ =====
    if (
      !this.shieldActive &&
      (this.player.y < -50 || this.player.y > this.scale.height + 50)
    ) {
      this.handleDeath();
    }

    // ===== МАГНИТ =====
    if (this.magnetActive) {
      const magnetCoins = this.coinGroup.getChildren();
      for (let coin of magnetCoins) {
        const dist = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          coin.x,
          coin.y
        );
        if (dist < this.magnetRange) {
          const angle = Phaser.Math.Angle.Between(
            coin.x,
            coin.y,
            this.player.x,
            this.player.y
          );
          coin.x += Math.cos(angle) * 10;
          coin.y += Math.sin(angle) * 10;
        }
      }
    }

    // ===== ОБНОВЛЕНИЕ ВАГОНОВ И ОЧИСТКА =====
    this.updateWagons();
    this.cleanupObjects();

    // ===== СТАНЦИЯ =====
    if (
      this.stationPlanet &&
      this.stationPlanet.active &&
      this.stationActive
    ) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.stationPlanet.x,
        this.stationPlanet.y
      );
      if (dist < 100) this.touchStation();
    }

    // ===== ПРОВЕРКИ И ОБНОВЛЕНИЯ =====
    this.checkAchievements();
    if (this.level >= 1) {
      this.waveManager.update(time, delta, this.player);
    }
    this.specialEventManager.update(delta);
    this.checkLevelProgression();

    // ===== МЕТРАЖ =====
    this.meters += (this.currentSpeed * delta) / 1000 / 10;
    if (this.meterText) {
      this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
    }

    // ===== ОБНОВЛЕНИЕ ПУЛЬ =====
    this.playerBullets.getChildren().forEach((b) => {
      if (b.x > this.scale.width + 100) b.destroy();
    });
    this.enemyBullets.getChildren().forEach((b) => {
      if (b.x < -100) b.destroy();
    });

    // ===== ОБНОВЛЕНИЕ АСТЕРОИДОВ =====
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

    // ===== ОБНОВЛЕНИЕ УСИЛИТЕЛЕЙ =====
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

    // ===== ОБНОВЛЕНИЕ УРОВНЯ =====
    this.updateLevel();

    // Дополнительные методы
    this.updatePlayerEffects();
    this.updateBullets(delta);
    this.updateMultiplier();
    this.checkWaveAchievements();
    this.createComboEffect();
    this.checkNewRecords();
    this.checkQuests();
    this.updateRealTimeStats();
    this.checkLevelCompletion();
    this.updateDifficultyInRealTime();
    this.checkMaxCombo();
    this.checkPerformance();
    this.optimizeMemory();
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ СТРЕЛЬБЫ
  // =========================================================================

  /**
   * Атака врагов
   */
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

  /**
   * Выстрел по врагу
   */
  firePlayerBullet(targetX, targetY) {
    const bullet = this.playerBullets.create(
      this.player.x + 30,
      this.player.y,
      'laser_player'
    );
    bullet.setScale(1.5);
    bullet.damage = this.weaponDamage;

    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      targetX,
      targetY
    );
    const speed = this.weaponBulletSpeed;

    bullet.body.setAllowGravity(false);
    bullet.body.setGravityY(0);
    bullet.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    bullet.setDepth(20);

    try {
      this.tapSound.play();
    } catch (e) {}
  }

  /**
   * Выстрел врага
   */
  fireEnemyBullet(enemy, playerPos) {
    const bullet = this.enemyBullets.create(
      enemy.sprite.x - 20,
      enemy.sprite.y,
      'laser_enemy'
    );
    bullet.setScale(1.5);
    bullet.damage = enemy.config.bulletDamage || 1;
    bullet.body.setAllowGravity(false);
    bullet.body.setGravityY(0);

    const angle = Phaser.Math.Angle.Between(
      enemy.sprite.x,
      enemy.sprite.y,
      playerPos.x,
      playerPos.y
    );
    const speed = enemy.config.bulletSpeed || 400;

    bullet.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    bullet.setDepth(20);
  }

  /**
   * Воспроизведение звука
   */
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

  // =========================================================================
  // МЕТОДЫ ДЛЯ МОНЕТ
  // =========================================================================

  /**
   * Сбор монеты
   */
  collectCoin(coin) {
    if (!coin.active || coin.collected) return;
    coin.collected = true;

    let value = 1,
      bonusType = null;
    switch (coin.coinType) {
      case 'red':
        value = 2;
        bonusType = 'speed';
        break;
      case 'blue':
        value = 1;
        bonusType = 'shield';
        break;
      case 'green':
        value = 1;
        bonusType = 'magnet';
        break;
      case 'purple':
        value = 1;
        bonusType = 'slow';
        break;
      default:
        value = 1;
    }

    if (this.bonusActive && this.bonusType === 'speed') value *= 2;
    if (this.player.doubleCrystals) value *= 2;

    const multipliedValue = Math.floor(
      value * this.comboSystem.getMultiplier()
    );
    this.crystals += multipliedValue;
    this.crystalText.setText(`💎 ${this.crystals}`);
    this.collectedCoins += multipliedValue;

    this.comboSystem.add();

    if (
      this.collectedCoins >= this.coinsForWagon &&
      this.wagons.length < this.maxWagons
    ) {
      this.addWagon();
      this.collectedCoins -= this.coinsForWagon;
    }

    if (bonusType) {
      if (this.bonusActive && this.bonusType === bonusType) {
        this.bonusTime += 2;
        try {
          this.itemSound.play();
        } catch (e) {}
      } else {
        this.activateBonus(bonusType);
      }
      this.particleManager.createCoinCollectEffect(
        coin.x,
        coin.y,
        coin.coinType
      );
      if (bonusType === 'shield')
        this.questSystem.updateProgress('shield', 1);
    } else {
      try {
        this.coinSound.play();
      } catch (e) {}
      this.particleManager.createCoinCollectEffect(
        coin.x,
        coin.y,
        'gold'
      );
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

    try {
      gameManager.vibrate([30]);
    } catch (e) {}

    coin.destroy();
    gameManager.data.crystals = this.crystals;
    gameManager.save();
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ ВОРОТ
  // =========================================================================

  /**
   * Прохождение ворот с комбо
   */
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

  /**
   * Спавн ворот
   */
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

    // Верхняя створка
    const topPipe = this.physics.add
      .image(x, topY, gateTexture)
      .setOrigin(0.5, 1)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, topY / 400));

    topPipe.body.setAllowGravity(false);
    topPipe.body.setGravityY(0);
    topPipe.setVelocityX(-difficulty.speed);
    topPipe.setBlendMode(Phaser.BlendModes.ADD);
    topPipe.body.moves = true;
    topPipe.isGate = true;

    // Нижняя створка
    const bottomPipe = this.physics.add
      .image(x, bottomY, gateTexture)
      .setOrigin(0.5, 0)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, (h - bottomY) / 400));

    bottomPipe.body.setAllowGravity(false);
    bottomPipe.body.setGravityY(0);
    bottomPipe.setVelocityX(-difficulty.speed);
    bottomPipe.setBlendMode(Phaser.BlendModes.ADD);
    bottomPipe.body.moves = true;
    bottomPipe.isGate = true;

    this.pipes.push(topPipe, bottomPipe);
    this.gateGroup.add(topPipe);
    this.gateGroup.add(bottomPipe);

    // Коллизии игрока с воротами
    this.physics.add.overlap(
      this.player,
      topPipe,
      (p, pipe) => this.hitPipe(p, pipe),
      null,
      this
    );
    this.physics.add.overlap(
      this.player,
      bottomPipe,
      (p, pipe) => this.hitPipe(p, pipe),
      null,
      this
    );

    // Коллизия вагонов с воротами
    this.physics.add.collider(
      this.wagons,
      this.gateGroup,
      (wagon, pipe) => this.wagonHit(wagon, pipe),
      null,
      this
    );

    // Зона для подсчёта очков
    const zone = this.add.zone(x + 60, h / 2, 12, h);
    this.physics.add.existing(zone);
    zone.body.setAllowGravity(false);
    zone.body.setGravityY(0);
    zone.body.setImmovable(true);
    zone.body.setVelocityX(-difficulty.speed);
    zone.body.moves = true;
    zone.passed = false;

    this.physics.add.overlap(
      this.player,
      zone,
      (p, z) => {
        if (!z.passed) {
          z.passed = true;
          this.passGateWithCombo(z);
        }
      },
      null,
      this
    );

    this.scoreZones.push(zone);

    // Спавн монет, астероидов, усилителей
    if (Math.random() < difficulty.coinChance)
      this.spawnCoin(x, centerY);
    if (Math.random() < difficulty.asteroidChance)
      this.spawnAsteroid();
    if (Math.random() < difficulty.powerUpChance)
      this.spawnPowerUp(x + 100, centerY);
  }

  /**
   * Столкновение с воротами
   */
  hitPipe(player, pipe) {
    if (this.shieldActive) {
      this.particleManager.createBonusEffect('shield', pipe.x, pipe.y);
      this.player.body.setVelocityY(-100);
      return;
    }

    this.headHP--;
    this.updateHearts();
    this.cameras.main.shake(100, 0.003);

    try {
      this.hitSound.play();
    } catch (e) {}

    if (this.headHP <= 0) {
      this.handleDeath();
    } else {
      this.player.setTint(0xff8888);
      this.time.delayedCall(500, () => this.player.clearTint());
    }
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ ВАГОНОВ
  // =========================================================================

  /**
   * Добавить вагон
   */
  addWagon() {
    if (this.wagons.length >= this.maxWagons) return;

    const last =
      this.wagons.length > 0
        ? this.wagons[this.wagons.length - 1]
        : this.player;
    const spawnX = last.x - this.wagonGap * 2;
    const spawnY = last.y;
    const texIndex = Phaser.Math.Between(0, 9);

    const wagon = this.physics.add
      .image(spawnX, spawnY, `wagon_${texIndex}`)
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
    wagon.isWagon = true;

    this.wagons.push(wagon);

    wagon.setAlpha(0);
    this.tweens.add({
      targets: wagon,
      alpha: 1,
      x: spawnX,
      duration: 500,
      ease: 'Sine.easeOut'
    });

    // Коллизия вагонов с воротами
    this.physics.add.collider(
      wagon,
      this.gateGroup,
      (w, pipe) => this.wagonHit(w, pipe),
      null,
      this
    );

    // Коллизия вагонов с врагами
    this.physics.add.overlap(
      wagon,
      this.enemyGroup,
      (w, enemySprite) => {
        const enemy = enemySprite.enemyRef;
        if (enemy) this.damageSystem.enemyHitByWagon(enemy, w);
      },
      null,
      this
    );

    try {
      this.wagonSound.play();
    } catch (e) {}

    this.wagonCountText.setText(
      `🚃 ${this.wagons.length}/${this.maxWagons}`
    );
    this.updateCameraZoom();
  }

  /**
   * Обновить позиции вагонов
   */
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

  /**
   * Столкновение вагона с воротами
   */
  wagonHit(wagon, pipe) {
    const hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      this.wagons = this.wagons.filter((w) => w !== wagon);
      this.particleManager.createWagonDestroyEffect(wagon);
      wagon.destroy();
    } else {
      wagon.setData('hp', hp);
      wagon.setTint(0xff8888);
      this.time.delayedCall(200, () => wagon.setTint(0x88aaff));
    }
    this.wagonCountText.setText(
      `🚃 ${this.wagons.length}/${this.maxWagons}`
    );
  }

  /**
   * Обновить зум камеры в зависимости от количества вагонов
   */
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

  // =========================================================================
  // МЕТОДЫ ДЛЯ АСТЕРОИДОВ
  // =========================================================================

  /**
   * Спавн астероида
   */
  spawnAsteroid() {
    const w = this.scale.width;
    const h = this.scale.height;
    const speed = 300 + this.gameLevel * 30;
    const x = w + 50;
    const y = Phaser.Math.Between(50, h - 50);

    const asteroid = new Asteroid(this, x, y, speed);
    this.asteroids.push(asteroid);
    this.asteroidGroup.add(asteroid.sprite);

    this.physics.add.overlap(
      this.player,
      asteroid.sprite,
      (p, a) => {
        if (!this.shieldActive) {
          this.headHP--;
          this.updateHearts();
          this.cameras.main.shake(100, 0.005);

          try {
            audioManager.playSound(this, 'hit_sound', 0.3);
          } catch (e) {}

          if (this.headHP <= 0) {
            this.handleDeath();
          }

          a.destroy();
          this.asteroids = this.asteroids.filter(
            (ast) => ast.sprite !== a
          );
          this.comboSystem.reset();
        }
      },
      null,
      this
    );
  }

  // =========================================================================
  // ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ
  // =========================================================================

  /**
   * Метод для обновления визуальных эффектов игрока
   */
  updatePlayerEffects() {
    if (!this.player) return;

    // Обновление следа частиц
    if (this.trailEmitter) {
      if (this.bonusActive) {
        this.trailEmitter.setTint(this.getBonusColor(this.bonusType));
      } else {
        this.trailEmitter.setTint([0x00ffff, 0xff00ff, 0xffff00]);
      }
    }
  }

  getBonusColor(type) {
    const colors = {
      speed: 0xffff00,
      shield: 0x00ffff,
      magnet: 0xff00ff,
      slow: 0xff8800
    };
    return colors[type] || 0x00ffff;
  }

  /**
   * Метод для обновления пуль
   */
  updateBullets(delta) {
    // Обновление пуль игрока
    const playerBullets = this.playerBullets.getChildren();
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      const bullet = playerBullets[i];
      if (!bullet.active) continue;

      bullet.x += bullet.body.velocity.x * delta / 1000;
      bullet.y += bullet.body.velocity.y * delta / 1000;

      if (bullet.x > this.scale.width + 100) {
        bullet.destroy();
      }
    }

    // Обновление пуль врагов
    const enemyBullets = this.enemyBullets.getChildren();
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const bullet = enemyBullets[i];
      if (!bullet.active) continue;

      bullet.x += bullet.body.velocity.x * delta / 1000;
      bullet.y += bullet.body.velocity.y * delta / 1000;

      if (bullet.x < -100 || bullet.y < -100 || bullet.y > this.scale.height + 100) {
        bullet.destroy();
      }
    }
  }

  /**
   * Метод для проверки достижений по волнам
   */
  checkWaveAchievements() {
    if (!this.waveManager) return;

    const waveIndex = this.waveManager.currentWave;

    if (waveIndex >= 3 && !this.achievements.wave_3?.unlocked) {
      this.unlockAchievement('wave_3');
    }
    if (waveIndex >= 5 && !this.achievements.wave_5?.unlocked) {
      this.unlockAchievement('wave_5');
    }
    if (waveIndex >= 10 && !this.achievements.wave_10?.unlocked) {
      this.unlockAchievement('wave_10');
    }
  }

  /**
   * Метод для создания эффекта комбо
   */
  createComboEffect() {
    const w = this.scale.width;
    const h = this.scale.height;
    const combo = this.comboSystem.combo;

    if (combo > 1 && combo % 5 === 0) {
      const text = this.add.text(w / 2, h / 2 - 100, `КОМБО x${combo}!`, {
        fontSize: '32px',
        fontFamily: "'Orbitron', monospace",
        color: '#ffff00',
        stroke: '#ff8800',
        strokeThickness: 4,
        shadow: { blur: 15, color: '#ffff00', fill: true }
      }).setOrigin(0.5).setDepth(50).setScrollFactor(0);

      this.cameras.main.shake(100, 0.002);

      this.tweens.add({
        targets: text,
        y: text.y - 50,
        alpha: 0,
        duration: 1500,
        ease: 'Power2.easeOut',
        onComplete: () => text.destroy()
      });

      try { this.levelUpSound.play(); } catch (e) {}
    }
  }

  /**
   * Метод для проверки новых рекордов
   */
  checkNewRecords() {
    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('skypulse_best', String(this.best));
      this.bestText.setText(`🏆 ${this.best}`);
      this.showNotification('НОВЫЙ РЕКОРД!', 2000, '#ffff00');
      try { this.levelUpSound.play(); } catch (e) {}
    }

    const bestDistance = parseInt(localStorage.getItem('skypulse_best_distance') || '0');
    if (Math.floor(this.meters) > bestDistance) {
      localStorage.setItem('skypulse_best_distance', String(Math.floor(this.meters)));
      this.showNotification('НОВЫЙ РЕКОРД РАССТОЯНИЯ!', 2000, '#00ffff');
    }
  }

  /**
   * Метод для создания эффекта уровня
   */
  createLevelEffect() {
    const w = this.scale.width;
    const h = this.scale.height;

    const emitter = this.add.particles(w / 2, h / 2, 'flare', {
      speed: { min: -300, max: 300 },
      scale: { start: 2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      quantity: 50,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00]
    });

    emitter.explode(50);

    this.cameras.main.shake(300, 0.01);
    this.cameras.main.flash(300, 0, 255, 255, false);
  }

  /**
   * Метод для обновления множителя
   */
  updateMultiplier() {
    if (!this.multiplierSystem) return;

    const multiplier = this.multiplierSystem.getMultiplier();
    if (multiplier > 1) {
      if (!this.multiplierText) {
        this.multiplierText = this.add.text(
          this.scale.width / 2, 80, '',
          {
            fontSize: '16px',
            fontFamily: "'Orbitron', monospace",
            color: '#ffff00',
            stroke: '#ff8800',
            strokeThickness: 2
          }
        ).setOrigin(0.5).setDepth(10).setScrollFactor(0);
      }
      this.multiplierText.setText(`x${multiplier.toFixed(1)}`);
      this.multiplierText.setVisible(true);
    } else if (this.multiplierText) {
      this.multiplierText.setVisible(false);
    }
  }

  /**
   * Метод для проверки квестов
   */
  checkQuests() {
    if (!this.questSystem) return;

    const activeQuests = this.questSystem.getActiveQuests?.() || [];
    for (let quest of activeQuests) {
      if (quest.completed && !quest.claimed) {
        quest.claimed = true;
        this.crystals += quest.reward;
        this.crystalText.setText(`💎 ${this.crystals}`);
        this.showNotification(`Квест выполнен! +${quest.reward} 💎`, 2000, '#00ff00');
      }
    }
  }

  /**
   * Метод для обновления статистики в реальном времени
   */
  updateRealTimeStats() {
    // Обновление счёта
    if (this.scoreText) {
      this.scoreText.setText(String(this.score));
    }

    // Обновление кристаллов
    if (this.crystalText) {
      this.crystalText.setText(`💎 ${this.crystals}`);
    }

    // Обновление метража
    if (this.meterText) {
      this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
    }

    // Обновление вагонов
    if (this.wagonCountText) {
      this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
    }
  }

  /**
   * Метод для проверки условий завершения уровня
   */
  checkLevelCompletion() {
    if (!this.started || this.dead) return;

    const goalScore = this.worldConfig.goalScore || 500;
    if (this.score >= goalScore) {
      this.completeLevel();
    }
  }

  /**
   * Метод для обновления сложности в реальном времени
   */
  updateDifficultyInRealTime() {
    const newGameLevel = Math.floor(this.meters / 300);
    if (newGameLevel > this.gameLevel) {
      this.gameLevel = newGameLevel;
      this.updateDifficulty();
      this.createLevelEffect();
      this.checkWaveAchievements();
    }
  }

  /**
   * Метод для проверки максимального комбо
   */
  checkMaxCombo() {
    if (this.comboSystem.combo > this.comboSystem.maxCombo) {
      this.comboSystem.maxCombo = this.comboSystem.combo;
      if (this.comboSystem.maxCombo % 10 === 0) {
        this.showNotification(`Максимальное комбо: ${this.comboSystem.maxCombo}!`, 2000, '#ffff00');
      }
    }
  }

  /**
   * Метод для проверки производительности
   */
  checkPerformance() {
    const fps = this.game.loop.actualFps;
    if (fps < 30) {
      console.warn('Low FPS detected:', fps);
      // Можно снизить качество графики
    }
  }

  /**
   * Метод для оптимизации памяти
   */
  optimizeMemory() {
    // Очистка неиспользуемых объектов
    this.pipes = this.pipes.filter(p => p.active);
    this.coins = this.coins.filter(c => c.active);
    this.asteroids = this.asteroids.filter(a => a.active);
    this.powerUps = this.powerUps.filter(p => p.active);
  }

  /**
   * Метод для создания эффекта бонуса
   */
  createBonusVisualEffect(type) {
    const colors = {
      speed: 0xffff00,
      shield: 0x00ffff,
      magnet: 0xff00ff,
      slow: 0xff8800
    };

    const color = colors[type] || 0x00ffff;
    const emitter = this.add.particles(this.player.x, this.player.y, 'flare', {
      speed: { min: -150, max: 150 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      quantity: 20,
      blendMode: Phaser.BlendModes.ADD,
      tint: color
    });

    emitter.explode(20);
  }

  /**
   * Метод для показа уведомления
   */
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

  /**
   * Метод для сохранения прогресса
   */
  saveProgress() {
    gameManager.data.crystals = this.crystals;
    gameManager.data.upgrades = this.upgradeSystem.upgrades;
    gameManager.save();
  }

  /**
   * Метод для очистки объектов
   */
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

  // =========================================================================
  // НЕДОСТАЮЩИЕ МЕТОДЫ (ЗАГЛУШКИ)
  // =========================================================================

  initAchievements() {
    this.achievements = { ...ACHIEVEMENTS };
    for (let key in this.achievements) {
      this.achievements[key].unlocked = false;
    }
  }

  initDailyRewards() {
    this.dailyReward = {
      lastClaimDate: '',
      streak: 0
    };
  }

  initLeaderboard() {
    this.leaderboard = [];
  }

  initStats() {
    this.stats = {
      totalCoins: 0,
      totalDistance: 0,
      totalGames: 0
    };
  }

  updateLeaderboard() {}

  updateStats() {}

  checkAchievements() {}

  updateStars(time, delta) {}

  updatePlanets(delta) {}

  updateShips(delta) {}

  updateAsteroids(delta) {}

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

  startRun() {
    this.started = true;
    this.introText?.setVisible(false);
    this.coinTipsText?.setVisible(false);
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

  checkStationSpawn() {}

  touchStation() {}

  createBackground() {}

  createPlanets() {}

  createShips() {}

  createAsteroids() {}

  createPlayer() {
    const h = this.scale.height;
    const skin = gameManager.getCurrentSkin?.() || 'player';

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

    this.player.doubleCrystals = false;
    this.player.shieldActive = false;
    this.player.magnetActive = false;
    this.player.speedBoost = 1;

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

  createUI() {}

  updateHearts() {}

  togglePause() {}

  onResize() {}

  handleDeath() {}

  activateBonus(type) {}

  deactivateBonus() {}

  spawnCoin(x, y) {}

  spawnPowerUp(x, y) {}

  updateLevel() {}

  completeLevel() {}

  checkLevelProgression() {}

  transitionToLevel(levelIndex) {}

  showLevelTransition(levelIndex) {}

  unlockAchievement(key) {}

  showAchievementNotification(key, reward) {}

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
    try { gameManager.vibrate?.([30]); } catch (e) {}
  }
}

export default PlayScene;