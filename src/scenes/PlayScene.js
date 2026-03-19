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
    if (this.scene.crystalText) {
      this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    }
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
    if (!this.sprite || !this.sprite.active) return;
    
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

    if (this.healthBar && this.healthBar.active) {
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
      if (enemy && enemy.sprite && enemy.sprite.active) {
        enemy.update(playerPos, time, delta);
      }
    });
    this.enemies = this.enemies.filter((e) => e && e.health > 0);
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
    this.enemies.forEach((e) => {
      if (e && e.sprite) e.sprite.destroy();
    });
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
    if (!player || !enemy || !enemy.sprite) return;
    
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
      if (this.scene.hitSound) this.scene.hitSound.play();
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
    if (!player || !bullet) return;
    
    if (player.shieldActive) {
      this.scene.particleManager.createBonusEffect('shield', bullet.x, bullet.y);
      bullet.destroy();
      return;
    }

    player.headHP -= bullet.damage || 1;
    this.scene.updateHearts();
    this.scene.cameras.main.shake(150, 0.005);

    try {
      if (this.scene.hitSound) this.scene.hitSound.play();
    } catch (e) {}

    bullet.destroy();

    if (player.headHP <= 0) {
      this.scene.handleDeath();
    }
  }

  enemyHitByBullet(enemy, bullet) {
    if (!enemy || !bullet) return;
    
    if (enemy.takeDamage(bullet.damage)) {
      this.scene.crystals += enemy.config.scoreValue;
      if (this.scene.crystalText) {
        this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
      }
    }
    this.scene.particleManager.createAttackEffect(
      enemy.sprite.x,
      enemy.sprite.y
    );
    bullet.destroy();
  }

  wagonHitByEnemy(wagon, enemy) {
    if (!wagon || !enemy) return;
    
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
    if (enemy) enemy.takeDamage(1);
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
        meteor.body.setAllowGravity(false);
        meteor.body.setGravityY(0);
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
      if (coin && coin.body) {
        const angle = Phaser.Math.Angle.Between(w / 2, h / 2, coin.x, coin.y);
        coin.setVelocityX(Math.cos(angle) * 300);
        coin.setVelocityY(Math.sin(angle) * 300);
      }
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
  // Добавьте этот метод в класс PlayScene
flap() {
  if (!this.player || !this.player.body || this.dead) return;
  
  this.player.body.setVelocityY(-this.jumpPower);
  this.player.setScale(0.95);
  
  this.tweens.add({ 
    targets: this.player, 
    scaleX: 0.9, 
    scaleY: 0.9, 
    duration: 150, 
    ease: 'Quad.out' 
  });
  
  try { 
    if (this.tapSound) this.tapSound.play(); 
  } catch (e) {}
  
  try { 
    if (window.Telegram?.WebApp?.HapticFeedback?.selectionChanged) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  } catch (e) {}
  
  // Вибрация для Telegram
  try { 
    if (window.Telegram?.WebApp?.HapticFeedback?.selectionChanged) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  } catch (e) {}
}
  createComboEffect() {
    if (!this.comboSystem) return;
    
    const w = this.scale.width;
    const h = this.scale.height;
    const combo = this.comboSystem.combo || 0;

    if (combo > 1 && combo % 5 === 0) {
      // Только текст, без частиц
      const text = this.add.text(w / 2, h / 2 - 100, `x${combo}!`, {
        fontSize: '36px',
        fontFamily: "'Orbitron', monospace",
        color: '#ffff00',
        stroke: '#ff8800',
        strokeThickness: 4,
        shadow: { blur: 10, color: '#ffff00', fill: true }
      }).setOrigin(0.5).setDepth(50).setScrollFactor(0);

      // Легкая тряска
      this.cameras.main.shake(100, 0.001);

      // Анимация текста
      this.tweens.add({
        targets: text,
        y: text.y - 50,
        alpha: 0,
        duration: 1000,
        ease: 'Power2.easeOut',
        onComplete: () => text.destroy()
      });

      // Звук (если есть)
      try { if (this.levelUpSound) this.levelUpSound.play(); } catch (e) {}
    }
  }
  create() {
    console.log('PlayScene: create started');
    const w = this.scale.width;
    const h = this.scale.height;

    // ===== ИНИЦИАЛИЗАЦИЯ ОСНОВНЫХ ПАРАМЕТРОВ =====
    this.world = gameManager.getCurrentWorld?.() || 0;
    this.level = gameManager.getCurrentLevel?.() || 0;
    this.worldConfig = LEVEL_CONFIG[this.world] || LEVEL_CONFIG[0];

    // Основные параметры игры
    this.score = 0;
    this.crystals = gameManager.data?.crystals || 0;
    this.meters = 0;
    this.best = Number(localStorage.getItem('skypulse_best') || 0);

    // ===== ПАРАМЕТРЫ ВАГОНОВ =====
    this.wagons = [];
    this.collectedCoins = 0;
    this.coinsForWagon = 15;
    this.maxWagons =
      12 + ((gameManager.data?.upgrades?.maxWagons) || 0) * 2;
    this.wagonGap = 28 - ((gameManager.data?.upgrades?.wagonGap) || 0) * 2;
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
    this.maxHeadHP = 3 + ((gameManager.data?.upgrades?.headHP) || 0);
    this.headHP = this.maxHeadHP;
    this.wagonBaseHP = 1 + ((gameManager.data?.upgrades?.wagonHP) || 0);

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
      220 + ((gameManager.data?.upgrades?.magnetRange) || 0) * 40;
    this.lastBonusTime = 0;
    this.shieldDuration =
      5 + ((gameManager.data?.upgrades?.shieldDuration) || 0) * 1.5;
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
    this.resumeCountdownTimer = null;

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
    if (audioManager && typeof audioManager.playMusic === 'function') {
      audioManager.playMusic(this, 0.2);
    }

    console.log('PlayScene: create completed');
  }

  update(time, delta) {
    if (this.isPaused || this.countdownActive) return;

    // ===== ОБНОВЛЕНИЕ ФОНА =====
    this.updateStars(time, delta);
    this.updatePlanets(delta);
    this.updateShips(delta);
    this.updateAsteroids(delta);

    // Принудительно обнуляем вертикальную скорость для всех ворот
    if (this.gateGroup) {
      this.gateGroup.getChildren().forEach((gate) => {
        if (gate && gate.body) {
          gate.body.setVelocityY(0);
          gate.body.setGravityY(0);
        }
      });
    }

    if (this.scoreZones) {
      this.scoreZones.forEach((zone) => {
        if (zone && zone.body) {
          zone.body.setVelocityY(0);
          zone.body.setGravityY(0);
        }
      });
    }

    if (!this.started || this.dead || !this.player) return;

    // ===== ОБНОВЛЕНИЕ ОРУЖИЯ =====
    if (this.weaponCooldown > 0) {
      this.weaponCooldown -= delta;
    }

    // Автоматическая стрельба
    if (this.level >= 1 && this.waveManager && this.waveManager.enemies && this.waveManager.enemies.length > 0) {
      if (this.weaponCooldown <= 0) {
        const closestEnemy = this.waveManager.enemies[0];
        if (closestEnemy && closestEnemy.sprite && closestEnemy.sprite.active) {
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
    if (body) {
      this.player.setAngle(
        Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75)
      );
    }

    // ===== ПРОВЕРКА СМЕРТИ =====
    if (
      !this.shieldActive &&
      (this.player.y < -50 || this.player.y > this.scale.height + 50)
    ) {
      this.handleDeath();
    }

    // ===== МАГНИТ =====
    if (this.magnetActive && this.coinGroup) {
      const magnetCoins = this.coinGroup.getChildren();
      for (let coin of magnetCoins) {
        if (!coin || !coin.active) continue;
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
    if (this.level >= 1 && this.waveManager) {
      this.waveManager.update(time, delta, this.player);
    }
    if (this.specialEventManager) {
      this.specialEventManager.update(delta);
    }
    this.checkLevelProgression();

    // ===== МЕТРАЖ =====
    this.meters += (this.currentSpeed * delta) / 1000 / 10;
    if (this.meterText) {
      this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
    }

    // ===== ОБНОВЛЕНИЕ ПУЛЬ =====
    if (this.playerBullets) {
      this.playerBullets.getChildren().forEach((b) => {
        if (b && b.x > this.scale.width + 100) b.destroy();
      });
    }
    if (this.enemyBullets) {
      this.enemyBullets.getChildren().forEach((b) => {
        if (b && (b.x < -100 || b.y < -100 || b.y > this.scale.height + 100)) b.destroy();
      });
    }

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
    if (!this.waveManager || this.waveManager.enemies.length === 0) return;

    this.weaponCooldown = this.weaponFireDelay;

    const bullet = this.playerBullets.create(
      this.player.x + 30,
      this.player.y,
      'laser_player'
    );

    if (!bullet || !bullet.body) return;
    
    bullet.setScale(1.5);
    bullet.damage = this.weaponDamage;
    bullet.setVelocityX(this.weaponBulletSpeed);
    bullet.setVelocityY(0);
    bullet.body.setAllowGravity(false);
    bullet.body.setGravityY(0);
    bullet.setDepth(20);

    this.playSound('tap_sound', 0.3);

    if (this.attackButton) {
      this.tweens.add({
        targets: this.attackButton,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 100,
        yoyo: true
      });
    }

    this.particleManager.createAttackEffect(
      this.player.x + 30,
      this.player.y
    );
  }

  /**
   * Выстрел по врагу
   */
  firePlayerBullet(targetX, targetY) {
    if (!this.player || !this.player.active) return;
    
    const bullet = this.playerBullets.create(
      this.player.x + 30,
      this.player.y,
      'laser_player'
    );

    if (!bullet || !bullet.body) return;
    
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
      if (this.tapSound) this.tapSound.play();
    } catch (e) {}
  }

  /**
   * Выстрел врага
   */
  fireEnemyBullet(enemy, playerPos) {
    if (!enemy || !enemy.sprite || !enemy.sprite.active || !playerPos) return;
    
    const bullet = this.enemyBullets.create(
      enemy.sprite.x - 20,
      enemy.sprite.y,
      'laser_enemy'
    );
    
    if (!bullet || !bullet.body) return;
    
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
    if (!gameManager.data?.soundEnabled) return;
    try {
      if (!this.sounds) this.sounds = {};
      if (!this.sounds[key]) {
        if (this.cache.audio.has(key)) {
          this.sounds[key] = this.sound.add(key, { volume });
        } else {
          return;
        }
      }
      if (this.sounds[key]) this.sounds[key].play();
    } catch (e) {
      // Тихо игнорируем ошибки звука
    }
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ МОНЕТ
  // =========================================================================

  /**
   * Сбор монеты
   */
  
  collectCoin(coin) {
    if (!coin || !coin.active || coin.collected) return;
    coin.collected = true;

    let value = 1;
    let bonusType = null;
    
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
    if (this.player && this.player.doubleCrystals) value *= 2;

    const multipliedValue = Math.floor(
      value * (this.comboSystem?.getMultiplier() || 1)
    );
    this.crystals += multipliedValue;
    if (this.crystalText) {
      this.crystalText.setText(`💎 ${this.crystals}`);
    }
    this.collectedCoins += multipliedValue;

    if (this.comboSystem) {
      this.comboSystem.add();
    }

    if (
      this.collectedCoins >= this.coinsForWagon &&
      this.wagons.length < this.maxWagons
    ) {
      this.addWagon();
      this.collectedCoins -= this.coinsForWagon;
    }

    // ИСПРАВЛЕНИЕ: Активация бонуса в зависимости от типа монеты
    if (bonusType) {
      // Всегда активируем бонус при сборе цветной монеты
      this.activateBonus(bonusType);
      
      this.particleManager.createCoinCollectEffect(
        coin.x,
        coin.y,
        coin.coinType
      );
      
      if (bonusType === 'shield' && this.questSystem) {
        this.questSystem.updateProgress('shield', 1);
      }
    } else {
      try {
        if (this.coinSound) this.coinSound.play();
      } catch (e) {}
      this.particleManager.createCoinCollectEffect(
        coin.x,
        coin.y,
        'gold'
      );
    }

    if (this.questSystem) {
      this.questSystem.updateProgress('crystals', multipliedValue);
    }

    if (this.crystalText) {
      this.tweens.add({
        targets: this.crystalText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 80,
        yoyo: true,
        ease: 'Quad.out'
      });
    }

    try {
      if (gameManager.vibrate) gameManager.vibrate([30]);
    } catch (e) {}

    coin.destroy();
    if (gameManager.data) {
      gameManager.data.crystals = this.crystals;
      gameManager.save();
    }
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ ВОРОТ
  // =========================================================================

  /**
   * Прохождение ворот с комбо
   */
  passGateWithCombo(zone) {
    if (!zone || zone.passed) return;
    zone.passed = true;

    const baseScore = 10;
    const comboMultiplier = this.comboSystem?.getMultiplier() || 1;
    const totalScore = Math.floor(baseScore * comboMultiplier);

    this.score += totalScore;
    if (this.scoreText) {
      this.scoreText.setText(String(this.score));
    }
    this.meters += 10;
    if (this.meterText) {
      this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
    }

    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('skypulse_best', String(this.best));
      if (this.bestText) {
        this.bestText.setText(`🏆 ${this.best}`);
      }
    }

    if (this.scoreText) {
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
        ease: 'Quad.out'
      });
    }

    this.cameras.main.shake(20, 0.001);
  }

  spawnGate() {
    if (this.dead) return;
    const w = this.scale.width, h = this.scale.height;
    const difficulty = this.getDifficulty();
    const gateTexture = this.gateTextures[Math.min(this.level,4)];
    const gap = difficulty.gap + Phaser.Math.Between(-15,15);
    const centerY = Phaser.Math.Between(120, h - 120);
    const topY = centerY - gap/2;
    const bottomY = centerY + gap/2;
    const x = w;

    const topPipe = this.physics.add.image(x, topY, gateTexture)
      .setOrigin(0.5,1)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, topY/400))
      .setVelocityX(-difficulty.speed);
    topPipe.body.setAllowGravity(false);
    topPipe.setBlendMode(Phaser.BlendModes.ADD);

    const bottomPipe = this.physics.add.image(x, bottomY, gateTexture)
      .setOrigin(0.5,0)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, (h - bottomY)/400))
      .setVelocityX(-difficulty.speed);
    bottomPipe.body.setAllowGravity(false);
    bottomPipe.setBlendMode(Phaser.BlendModes.ADD);

    [topPipe,bottomPipe].forEach(pipe => {
      pipe.setScale(1,0.01);
      this.tweens.add({ targets: pipe, scaleY: pipe.scaleY, duration:300, ease:'Back.out' });
    });

    if (this.level >= 2 && Math.random() < 0.4) {
      const moveDistance = Phaser.Math.Between(-50,50);
      const tween = this.tweens.add({ targets: [topPipe,bottomPipe], y: `+=${moveDistance}`, duration:1200, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });
      topPipe.tween = tween; bottomPipe.tween = tween;
    }

    this.pipes.push(topPipe,bottomPipe);
    this.physics.add.collider(this.player, topPipe, (p,pi)=>this.hitPipe(p,pi), null, this);
    this.physics.add.collider(this.player, bottomPipe, (p,pi)=>this.hitPipe(p,pi), null, this);

    const zone = this.add.zone(x+60, h/2, 12, h);
    this.physics.add.existing(zone);
    zone.body.setAllowGravity(false);
    zone.body.setImmovable(true);
    zone.body.setVelocityX(-difficulty.speed);
    zone.body.setSize(12, h);
    this.physics.add.overlap(this.player, zone, ()=>this.passGateWithCombo(zone), null, this);
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
    if (!player || !pipe) return;
    
    if (this.shieldActive) {
      this.particleManager.createBonusEffect('shield', pipe.x, pipe.y);
      if (this.player && this.player.body) {
        this.player.body.setVelocityY(-100);
      }
      return;
    }

    this.headHP--;
    this.updateHearts();
    this.cameras.main.shake(100, 0.003);

    try {
      if (this.hitSound) this.hitSound.play();
    } catch (e) {}

    if (this.headHP <= 0) {
      this.handleDeath();
    } else {
      if (this.player) {
        this.player.setTint(0xff8888);
        this.time.delayedCall(500, () => {
          if (this.player) this.player.clearTint();
        });
      }
    }
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ ВАГОНОВ
  // =========================================================================

  /**
   * Добавить вагон
   */
  addWagon() {
    if (this.wagons.length >= this.maxWagons || !this.player) return;

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

    if (!wagon || !wagon.body) return;
    
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
        const enemy = enemySprite?.enemyRef;
        if (enemy && this.damageSystem) {
          this.damageSystem.enemyHitByWagon(enemy, w);
        }
      },
      null,
      this
    );

    try {
      if (this.wagonSound) this.wagonSound.play();
    } catch (e) {}

    if (this.wagonCountText) {
      this.wagonCountText.setText(
        `🚃 ${this.wagons.length}/${this.maxWagons}`
      );
    }
    this.updateCameraZoom();
  }

  /**
   * Обновить позиции вагонов
   */
  updateWagons() {
    if (this.wagons.length === 0 || !this.player) return;
    let prev = this.player;

    for (let i = 0; i < this.wagons.length; i++) {
      const wagon = this.wagons[i];
      if (!wagon || !wagon.active) continue;
      
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
    if (!wagon || !wagon.active) return;
    
    const hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      this.wagons = this.wagons.filter((w) => w !== wagon);
      this.particleManager.createWagonDestroyEffect(wagon);
      wagon.destroy();
    } else {
      wagon.setData('hp', hp);
      wagon.setTint(0xff8888);
      this.time.delayedCall(200, () => {
        if (wagon && wagon.active) wagon.setTint(0x88aaff);
      });
    }
    if (this.wagonCountText) {
      this.wagonCountText.setText(
        `🚃 ${this.wagons.length}/${this.maxWagons}`
      );
    }
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
    if (asteroid.sprite) {
      this.asteroidGroup.add(asteroid.sprite);
    }

    if (this.player) {
      this.physics.add.overlap(
        this.player,
        asteroid.sprite,
        (p, a) => {
          if (!this.shieldActive && a) {
            this.headHP--;
            this.updateHearts();
            this.cameras.main.shake(100, 0.005);

            try {
              if (audioManager && typeof audioManager.playSound === 'function') {
                audioManager.playSound(this, 'hit_sound', 0.3);
              }
            } catch (e) {}

            if (this.headHP <= 0) {
              this.handleDeath();
            }

            a.destroy();
            this.asteroids = this.asteroids.filter(
              (ast) => ast.sprite !== a
            );
            if (this.comboSystem) this.comboSystem.reset();
          }
        },
        null,
        this
      );
    }
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ УСИЛИТЕЛЕЙ
  // =========================================================================

  /**
   * Спавн усилителя
   */
  spawnPowerUp(x, y) {
    const types = ['booster', 'shield', 'magnet', 'slowmo'];
    const type = types[Math.floor(Math.random() * types.length)];
    const powerUp = new PowerUp(this, x, y, type);
    this.powerUps.push(powerUp);
    if (powerUp.sprite) {
      this.powerUpGroup.add(powerUp.sprite);
    }

    if (this.player) {
      this.physics.add.overlap(
        this.player,
        powerUp.sprite,
        (p, pu) => {
          if (powerUp && typeof powerUp.collect === 'function') {
            powerUp.collect(this.player);
          }
          this.powerUps = this.powerUps.filter(pw => pw.sprite !== pu);
        },
        null,
        this
      );
    }
  }

  /**
   * Активация усилителя
   */
  activatePowerUp(type, duration = 10) {
    if (this.powerUpActive[type]) return;

    this.powerUpActive[type] = true;
    const powerUp = { type, duration, startTime: Date.now() };
    this.activePowerUps.push(powerUp);

    switch (type) {
      case 'doubleCrystals':
        if (this.multiplierSystem) {
          this.multiplierSystem.addMultiplier('doubleCrystals', 2);
        }
        this.showPowerUpNotification('💎 ДВОЙНЫЕ КРИСТАЛЛЫ', duration);
        break;
      case 'invincible':
        this.shieldActive = true;
        if (this.player) this.player.setTint(0x00ffff);
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

  /**
   * Деактивация усилителя
   */
  deactivatePowerUp(type) {
    this.powerUpActive[type] = false;
    this.activePowerUps = this.activePowerUps.filter(p => p.type !== type);

    switch (type) {
      case 'doubleCrystals':
        if (this.multiplierSystem) {
          this.multiplierSystem.removeMultiplier('doubleCrystals');
        }
        break;
      case 'invincible':
        this.shieldActive = false;
        if (this.player) this.player.clearTint();
        break;
      case 'slowMotion':
        this.currentSpeed = this.baseSpeed;
        break;
    }
  }

  /**
   * Показать уведомление об усилителе
   */
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

      /**
 * Активация бонуса от монет - УЛУЧШЕННАЯ ВЕРСИЯ С ИСПРАВЛЕННЫМ МАГНИТОМ
 */
activateBonus(type) {
  const now = Date.now();
  if (now - this.lastBonusTime < 300) return;
  this.lastBonusTime = now;

  if (this.bonusActive) this.deactivateBonus();

  this.bonusActive = true;
  this.bonusType = type;
  this.bonusTime = this.shieldDuration;

  // Настройки для разных типов бонусов
  const config = {
    speed: {
      color: 0xffff00,
      textColor: '#ffff00',
      emoji: '🚀',
      speedMult: 1.5,
      multiplier: 2,
      scale: 1.1,
      duration: this.shieldDuration,
      particles: { count: 6, radius: 40, speed: 200 }
    },
    shield: {
      color: 0x00ffff,
      textColor: '#00ffff',
      emoji: '🛡️',
      shield: true,
      duration: this.shieldDuration,
      particles: { count: 8, radius: 45, size: 4 }
    },
    magnet: {
      color: 0xff00ff,
      textColor: '#ff00ff',
      emoji: '🧲',
      magnet: true,
      range: 350,
      duration: this.shieldDuration,
      particles: { count: 6, radius: 50, sparkle: true }
    },
    slow: {
      color: 0xff8800,
      textColor: '#ff8800',
      emoji: '⏳',
      speedMult: 0.6,
      duration: this.shieldDuration,
      particles: { count: 6, radius: 40, slow: true }
    }
  };

  const cfg = config[type];

  // Применяем эффекты в зависимости от типа
  switch (type) {
    case 'speed':
      this.currentSpeed = this.baseSpeed * cfg.speedMult;
      this.bonusMultiplier = cfg.multiplier;
      if (this.player) {
        this.player.setTint(cfg.color);
        this.player.speedBoost = cfg.speedMult;
        this.createSpeedLines();
        this.createOrbitalEffect(type, cfg.color, cfg.particles.radius, cfg.particles.count);
        this.pulsePlayer(cfg.scale);
      }
      break;

    case 'shield':
      this.shieldActive = true;
      if (this.player) {
        this.player.setTint(cfg.color);
        this.player.shieldActive = true;
        this.createShieldEffect();
        this.createOrbitalEffect(
          type, 
          cfg.color, 
          cfg.particles.radius, 
          cfg.particles.count, 
          false, 
          cfg.particles.size
        );
      }
      break;

    case 'magnet':
      this.magnetActive = true;
      this.magnetRange = cfg.range;
      if (this.player) {
        this.player.setTint(cfg.color);
        this.player.magnetActive = true;
        this.createMagnetField();
        this.createMagnetParticles();
        this.createOrbitalEffect(type, cfg.color, cfg.particles.radius, cfg.particles.count);
      }
      break;

    case 'slow':
      this.currentSpeed = this.baseSpeed * cfg.speedMult;
      if (this.player) {
        this.player.setTint(cfg.color);
        this.createSlowMotionEffect();
        this.createOrbitalEffect(type, cfg.color, cfg.particles.radius, cfg.particles.count, true);
      }
      break;
  }

  // Обновляем текст бонуса
  if (this.bonusText) {
    this.bonusText
      .setColor(cfg.textColor)
      .setText(`${cfg.emoji} ${Math.ceil(this.bonusTime)}с`)
      .setVisible(true);
  }

  // Базовый эффект частиц
  if (this.particleManager) {
    this.particleManager.createBonusEffect(type, this.player?.x, this.player?.y);
  }

  this.updatePlayerVisuals();

  // Таймер обратного отсчета
  if (this.bonusTimer) this.bonusTimer.remove();
  
  this.bonusTimer = this.time.addEvent({
    delay: 100,
    callback: () => {
      this.bonusTime -= 0.1;
      if (this.bonusTime <= 0) {
        this.deactivateBonus();
      } else if (this.bonusText) {
        this.bonusText.setText(`${cfg.emoji} ${Math.ceil(this.bonusTime)}с`);
        this.updateBonusEffects(type);
      }
    },
    loop: true
  });

  // Звук бонуса
  this.playBonusSound(type);
}

/**
 * Пульсация игрока
 */
pulsePlayer(scale) {
  if (!this.player) return;
  
  this.tweens.add({
    targets: this.player,
    scaleX: scale,
    scaleY: scale,
    duration: 200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
}

/**
 * Создание орбитальных частиц
 */
createOrbitalEffect(type, color, radius, count = 6, isSlow = false, size = 3) {
  const particleKey = `${type}OrbitalParticles`;
  const tweenKey = `${type}OrbitalTween`;
  
  // Очищаем старые частицы
  this.cleanupOrbitalEffects(type);

  // Создаем новые частицы
  this[particleKey] = [];
  
  const textureKey = this.textures.exists('flare') ? 'flare' : '__DEFAULT';
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    
    // Используем спрайты вместо кругов для лучшей производительности
    const particle = this.add.image(
      this.player.x + Math.cos(angle) * radius,
      this.player.y + Math.sin(angle) * radius,
      textureKey
    );
    particle.setScale(size * 0.1);
    particle.setTint(color);
    particle.setAlpha(0.8);
    particle.setDepth(14);
    particle.setBlendMode(Phaser.BlendModes.ADD);
    this[particleKey].push(particle);
  }

  // Анимация вращения
  const duration = isSlow ? 4000 : 2500;
  this[tweenKey] = this.tweens.addCounter({
    from: 0,
    to: Math.PI * 2,
    duration: duration,
    repeat: -1,
    onUpdate: (tween) => {
      // Исправлено: добавлен оператор ||
      if (!this[particleKey] || !this.player) return;
      
      const value = tween.getValue();
      this[particleKey].forEach((p, i) => {
        if (p?.active) {
          const angle = (i / count) * Math.PI * 2 + value;
          p.x = this.player.x + Math.cos(angle) * radius;
          p.y = this.player.y + Math.sin(angle) * radius;
        }
      });
    }
  });
}

/**
 * Очистка орбитальных эффектов
 */
cleanupOrbitalEffects(type) {
  const particleKey = `${type}OrbitalParticles`;
  const tweenKey = `${type}OrbitalTween`;
  
  if (this[particleKey]) {
    this[particleKey].forEach(p => {
      if (p?.destroy) p.destroy();
    });
    this[particleKey] = null;
  }
  if (this[tweenKey]) {
    this[tweenKey].stop();
    this[tweenKey] = null;
  }
}

/**
 * Создание эффекта скоростных линий
 */
createSpeedLines() {
  if (this.speedLinesEmitter) {
    this.speedLinesEmitter.stop();
    this.speedLinesEmitter.destroy();
  }
  
  const textureKey = this.textures.exists('flare') ? 'flare' : '__DEFAULT';
  
  this.speedLinesEmitter = this.add.particles(0, 0, textureKey, {
    x: this.player.x,
    y: this.player.y,
    speed: { min: 200, max: 400 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.6, end: 0 },
    lifespan: 300,
    quantity: 2,
    frequency: 50,
    blendMode: Phaser.BlendModes.ADD,
    tint: 0xffff00,
    follow: this.player,
    followOffset: { x: -20, y: 0 }
  });
  
  if (this.speedLinesEmitter) {
    this.speedLinesEmitter.setDepth(12);
  }
}

/**
 * Создание индикатора скорости
 */
createSpeedIndicator() {
  if (this.speedIndicator) this.speedIndicator.destroy();
  
  this.speedIndicator = this.add.graphics();
  this.speedIndicator.setDepth(25);
  
  // Сохраняем длительность для использования в updateBonusEffects
  this.speedDuration = this.shieldDuration;
  
  // Анимированный индикатор
  this.tweens.add({
    targets: this.speedIndicator,
    alpha: { from: 0.8, to: 0.3 },
    duration: 300,
    yoyo: true,
    repeat: -1
  });
}

/**
 * Создание эффекта щита
 */
createShieldEffect() {
  this.cleanupGraphics('shield');
  
  this.shieldGraphics = this.add.graphics();
  this.shieldGraphics.setDepth(14);
  
  const textureKey = this.textures.exists('flare') ? 'flare' : '__DEFAULT';
  
  this.shieldParticles = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const particle = this.add.image(
      this.player.x + Math.cos(angle) * 45,
      this.player.y + Math.sin(angle) * 45,
      textureKey
    );
    particle.setScale(0.3);
    particle.setTint(0x00ffff);
    particle.setAlpha(0.8);
    particle.setDepth(14);
    particle.setBlendMode(Phaser.BlendModes.ADD);
    this.shieldParticles.push(particle);
  }
  
  this.shieldRotationTween = this.tweens.addCounter({
    from: 0,
    to: Math.PI * 2,
    duration: 2000,
    repeat: -1,
    onUpdate: (tween) => {
      // Исправлено: добавлен оператор ||
      if (!this.shieldParticles || !this.player) return;
      
      const value = tween.getValue();
      this.shieldParticles.forEach((p, i) => {
        if (p?.active) {
          const angle = (i / 8) * Math.PI * 2 + value;
          p.x = this.player.x + Math.cos(angle) * 45;
          p.y = this.player.y + Math.sin(angle) * 45;
        }
      });
    }
  });
}

/**
 * Создание магнитного поля - ИСПРАВЛЕНО ДЛЯ РАБОТЫ МАГНИТА
 */
createMagnetField() {
  this.cleanupGraphics('magnet');
  
  this.magnetGraphics = this.add.graphics();
  this.magnetGraphics.setDepth(14);
  
  // Пульсация магнитного поля
  this.magnetPulseTween = this.tweens.add({
    targets: { scale: 1 },
    scale: 1.3,
    duration: 800,
    yoyo: true,
    repeat: -1,
    onUpdate: (tween) => {
      // Исправлено: добавлен оператор ||
      if (!this.magnetGraphics || !this.player) return;
      
      const target = tween.targets[0];
      this.magnetGraphics.clear();

      // Внешний круг
      this.magnetGraphics.lineStyle(3, 0xff00ff, 0.4);
      this.magnetGraphics.strokeCircle(
        this.player.x,
        this.player.y,
        this.magnetRange * target.scale
      );

      // Внутренний круг
      this.magnetGraphics.lineStyle(2, 0xff88ff, 0.6);
      this.magnetGraphics.strokeCircle(
        this.player.x,
        this.player.y,
        this.magnetRange * 0.7
      );

      // Магнитные линии
      const time = Date.now() * 0.001;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time;
        const x1 = this.player.x + Math.cos(angle) * this.magnetRange * 0.5;
        const y1 = this.player.y + Math.sin(angle) * this.magnetRange * 0.5;
        const x2 = this.player.x + Math.cos(angle) * this.magnetRange;
        const y2 = this.player.y + Math.sin(angle) * this.magnetRange;

        this.magnetGraphics.lineStyle(1, 0xff00ff, 0.3);
        this.magnetGraphics.lineBetween(x1, y1, x2, y2);
      }
    }
  });
}

/**
 * Создание магнитных частиц
 */
createMagnetParticles() {
  if (this.magnetParticles) {
    this.magnetParticles.destroy();
  }
  
  const textureKey = this.textures.exists('flare') ? 'flare' : '__DEFAULT';
  
  this.magnetParticles = this.add.particles(0, 0, textureKey, {
    x: this.player.x,
    y: this.player.y,
    speed: { min: 30, max: 80 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.3, end: 0 },
    alpha: { start: 0.8, end: 0 },
    lifespan: 600,
    quantity: 2,
    frequency: 80,
    blendMode: Phaser.BlendModes.ADD,
    tint: [0xff00ff, 0xff88ff],
    follow: this.player
  });
  
  if (this.magnetParticles) {
    this.magnetParticles.setDepth(13);
  }
}

/**
 * Создание эффекта замедления времени
 */
createSlowMotionEffect() {
  this.cleanupGraphics('slow');
  
  this.slowMotionGraphics = this.add.graphics();
  this.slowMotionGraphics.setDepth(14);
  
  this.slowMotionTween = this.tweens.add({
    targets: {},
    duration: 1000,
    repeat: -1,
    onUpdate: () => {
      // Исправлено: добавлен оператор ||
      if (!this.slowMotionGraphics || !this.player) return;

      this.slowMotionGraphics.clear();

      const time = Date.now() * 0.003;
      const radius = 30 + Math.sin(time) * 10;

      // Точки-часы
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + time * 0.5;
        const x = this.player.x + Math.cos(angle) * radius;
        const y = this.player.y + Math.sin(angle) * radius;

        // Выделяем 12, 3, 6, 9 часов
        const isMain = i % 3 === 0;
        this.slowMotionGraphics.fillStyle(
          0xffaa00,
          isMain ? 0.9 : 0.5
        );
        this.slowMotionGraphics.fillCircle(x, y, isMain ? 4 : 3);
      }

      // Стрелки часов
      const hourAngle = time * 0.3;
      const minAngle = time * 1.5;

      // Минутная стрелка
      this.slowMotionGraphics.lineStyle(2, 0xffaa00, 0.8);
      this.slowMotionGraphics.lineBetween(
        this.player.x,
        this.player.y,
        this.player.x + Math.cos(minAngle) * radius * 0.85,
        this.player.y + Math.sin(minAngle) * radius * 0.85
      );

      // Часовая стрелка
      this.slowMotionGraphics.lineStyle(3, 0xff8800, 0.9);
      this.slowMotionGraphics.lineBetween(
        this.player.x,
        this.player.y,
        this.player.x + Math.cos(hourAngle) * radius * 0.6,
        this.player.y + Math.sin(hourAngle) * radius * 0.6
      );

      // Центральный круг
      this.slowMotionGraphics.lineStyle(2, 0xffaa00, 0.6);
      this.slowMotionGraphics.strokeCircle(
        this.player.x,
        this.player.y,
        radius
      );
    }
  });

  // Частицы замедления
  if (this.slowParticles) {
    this.slowParticles.destroy();
  }

  const textureKey = this.textures.exists('flare') ? 'flare' : '__DEFAULT';

  this.slowParticles = this.add.particles(0, 0, textureKey, {
    x: this.player.x,
    y: this.player.y,
    speed: { min: 20, max: 50 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.2, end: 0 },
    alpha: { start: 0.5, end: 0 },
    lifespan: 1000,
    quantity: 1,
    frequency: 150,
    blendMode: Phaser.BlendModes.ADD,
    tint: 0xffaa00,
    follow: this.player
  });

  if (this.slowParticles) {
    this.slowParticles.setDepth(13);
  }
}

/**
 * Обновление визуальных эффектов в реальном времени
 */
updateBonusEffects(type) {
  if (!this.player) return;
  
  switch (type) {
    case 'speed':
      if (this.speedLinesEmitter) {
        // Увеличиваем интенсивность при окончании бонуса
        const intensity = Math.max(0.3, Math.min(1, this.bonusTime / 2));
        this.speedLinesEmitter.setFrequency(50 / intensity);
      }
      
      if (this.speedIndicator) {
        this.speedIndicator.clear();
        this.speedIndicator.lineStyle(2, 0xffff00, 0.8);
        
        // Исправлено: используем shieldDuration для скорости
        // (в конфиге speedDuration не определен, используем shieldDuration)
        const progress = 1 - (this.bonusTime / this.shieldDuration);
        this.speedIndicator.strokeCircle(
          this.player.x, 
          this.player.y - 50, 
          20 + progress * 10
        );
      }
      break;
      
    case 'shield':
      if (this.shieldGraphics) {
        this.shieldGraphics.clear();
        const alpha = 0.3 + (this.bonusTime / this.shieldDuration) * 0.3;
        this.shieldGraphics.lineStyle(4, 0x00ffff, alpha);
        this.shieldGraphics.strokeCircle(this.player.x, this.player.y, 40);
        this.shieldGraphics.fillStyle(0x00ffff, alpha * 0.2);
        this.shieldGraphics.fillCircle(this.player.x, this.player.y, 40);
      }
      break;
      
    case 'magnet':
      // Обновление уже происходит в твине
      break;
      
    case 'slow':
      // Обновление уже происходит в твине
      break;
  }
}

/**
 * Воспроизведение звука бонуса
 */
playBonusSound(type) {
  try {
    const soundKey = `${type}_sound`;
    if (soundKey && this.cache.audio.has(soundKey)) {
      const sound = this.sound.add(soundKey, { volume: 0.5 });
      sound.play();
    } else if (this.itemSound) {
      this.itemSound.play();
    }
  } catch (e) {
    // Игнорируем ошибки звука
  }
}

/**
 * Деактивация бонуса - УЛУЧШЕННАЯ ВЕРСИЯ
 */
deactivateBonus() {
  if (!this.bonusActive) return;
  
  this.bonusActive = false;
  this.bonusType = null;
  this.shieldActive = false;
  this.magnetActive = false;
  
  if (this.player) {
    this.player.shieldActive = false;
    this.player.magnetActive = false;
    this.player.speedBoost = 1;
    this.player.clearTint();
    
    // Останавливаем пульсацию
    this.tweens.killTweensOf(this.player);
    this.player.setScale(0.9);
  }
  
  this.bonusMultiplier = 1;
  this.currentSpeed = this.baseSpeed;
  
  if (this.bonusText) {
    this.bonusText.setVisible(false);
  }
  
  this.updatePlayerVisuals();
  
  if (this.bonusTimer) {
    this.bonusTimer.remove();
    this.bonusTimer = null;
  }
  
  // Очищаем все эффекты
  this.cleanupAllEffects();
  
  // Финальная вспышка
  this.cameras.main.flash(150, 100, 100, 100, false);
}

/**
 * Очистка всех визуальных эффектов бонусов
 */
cleanupAllEffects() {
  // Останавливаем эмиттеры
  if (this.speedLinesEmitter) {
    this.speedLinesEmitter.stop();
    if (typeof this.speedLinesEmitter.destroy === 'function') {
      this.speedLinesEmitter.destroy();
    }
    this.speedLinesEmitter = null;
  }
  
  if (this.magnetParticles) {
    this.magnetParticles.stop();
    if (typeof this.magnetParticles.destroy === 'function') {
      this.magnetParticles.destroy();
    }
    this.magnetParticles = null;
  }
  
  if (this.slowParticles) {
    this.slowParticles.stop();
    if (typeof this.slowParticles.destroy === 'function') {
      this.slowParticles.destroy();
    }
    this.slowParticles = null;
  }
  
  // Уничтожаем графику
  if (this.speedIndicator) {
    if (typeof this.speedIndicator.destroy === 'function') {
      this.speedIndicator.destroy();
    }
    this.speedIndicator = null;
  }
  
  // Очищаем графику для всех типов
  ['shield', 'magnet', 'slow'].forEach(type => {
    this.cleanupGraphics(type);
  });
  
  // Очищаем орбитальные эффекты
  ['speed', 'shield', 'magnet', 'slow'].forEach(type => {
    this.cleanupOrbitalEffects(type);
  });
  
  // Очищаем shieldParticles
  if (this.shieldParticles) {
    this.shieldParticles.forEach(p => {
      if (p && typeof p.destroy === 'function') {
        p.destroy();
      }
    });
    this.shieldParticles = null;
  }
}

/**
 * Очистка графических эффектов - ИСПРАВЛЕНО
 */
cleanupGraphics(type) {
  const graphicsKey = `${type}Graphics`;
  const particlesKey = `${type}Particles`;
  const pulseTweenKey = `${type}PulseTween`;
  const rotationTweenKey = `${type}RotationTween`;
  
  // Графика - есть destroy
  if (this[graphicsKey]) {
    if (typeof this[graphicsKey].destroy === 'function') {
      this[graphicsKey].destroy();
    }
    this[graphicsKey] = null;
  }
  
  // Частицы - есть destroy
  if (this[particlesKey]) {
    if (typeof this[particlesKey].destroy === 'function') {
      this[particlesKey].destroy();
    } else if (typeof this[particlesKey].stop === 'function') {
      this[particlesKey].stop();
    }
    this[particlesKey] = null;
  }
  
  // Твины - НЕТ destroy, только stop
  if (this[pulseTweenKey]) {
    if (typeof this[pulseTweenKey].stop === 'function') {
      this[pulseTweenKey].stop();
    }
    this[pulseTweenKey] = null;
  }
  
  if (this[rotationTweenKey]) {
    if (typeof this[rotationTweenKey].stop === 'function') {
      this[rotationTweenKey].stop();
    }
    this[rotationTweenKey] = null;
  }
}

/**
 * Очистка орбитальных эффектов - ИСПРАВЛЕНО
 */
cleanupOrbitalEffects(type) {
  const particleKey = `${type}OrbitalParticles`;
  const tweenKey = `${type}OrbitalTween`;
  
  if (this[particleKey]) {
    this[particleKey].forEach(p => {
      if (p && typeof p.destroy === 'function') {
        p.destroy();
      }
    });
    this[particleKey] = null;
  }
  if (this[tweenKey]) {
    if (typeof this[tweenKey].stop === 'function') {
      this[tweenKey].stop();
    }
    this[tweenKey] = null;
  }
}

/**
 * Остановка всех эффектов бонусов - ИСПРАВЛЕНО
 */
stopBonusEffects(type) {
  switch (type) {
    case 'magnet':
      if (this.magnetPulseTween) {
        if (typeof this.magnetPulseTween.stop === 'function') {
          this.magnetPulseTween.stop();
        }
        this.magnetPulseTween = null;
      }
      if (this.magnetGraphics) {
        if (typeof this.magnetGraphics.destroy === 'function') {
          this.magnetGraphics.destroy();
        }
        this.magnetGraphics = null;
      }
      if (this.magnetParticles) {
        if (typeof this.magnetParticles.destroy === 'function') {
          this.magnetParticles.destroy();
        } else if (typeof this.magnetParticles.stop === 'function') {
          this.magnetParticles.stop();
        }
        this.magnetParticles = null;
      }
      break;

    case 'slow':
      if (this.slowMotionTween) {
        if (typeof this.slowMotionTween.stop === 'function') {
          this.slowMotionTween.stop();
        }
        this.slowMotionTween = null;
      }
      if (this.slowMotionGraphics) {
        if (typeof this.slowMotionGraphics.destroy === 'function') {
          this.slowMotionGraphics.destroy();
        }
        this.slowMotionGraphics = null;
      }
      if (this.slowParticles) {
        if (typeof this.slowParticles.destroy === 'function') {
          this.slowParticles.destroy();
        } else if (typeof this.slowParticles.stop === 'function') {
          this.slowParticles.stop();
        }
        this.slowParticles = null;
      }
      break;
      
    case 'speed':
      if (this.speedLinesEmitter) {
        if (typeof this.speedLinesEmitter.destroy === 'function') {
          this.speedLinesEmitter.destroy();
        } else if (typeof this.speedLinesEmitter.stop === 'function') {
          this.speedLinesEmitter.stop();
        }
        this.speedLinesEmitter = null;
      }
      if (this.speedIndicator) {
        if (typeof this.speedIndicator.destroy === 'function') {
          this.speedIndicator.destroy();
        }
        this.speedIndicator = null;
      }
      break;
      
    case 'shield':
      if (this.shieldGraphics) {
        if (typeof this.shieldGraphics.destroy === 'function') {
          this.shieldGraphics.destroy();
        }
        this.shieldGraphics = null;
      }
      if (this.shieldParticles) {
        this.shieldParticles.forEach(p => {
          if (p && typeof p.destroy === 'function') {
            p.destroy();
          }
        });
        this.shieldParticles = null;
      }
      if (this.shieldRotationTween) {
        if (typeof this.shieldRotationTween.stop === 'function') {
          this.shieldRotationTween.stop();
        }
        this.shieldRotationTween = null;
      }
      break;
  }
  
  // Очищаем орбитальные эффекты для этого типа
  this.cleanupOrbitalEffects(type);
}

/**
 * Получить эмодзи для бонуса
 */
getBonusEmoji(type) {
  const emojis = { 
    speed: '🚀', 
    shield: '🛡️', 
    magnet: '🧲', 
    slow: '⏳' 
  };
  return emojis[type] || '✨';
}

/**
 * Обновить визуальные эффекты игрока
 */
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

  // =========================================================================
  // ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ
  // =========================================================================

  /**
   * Метод для обновления визуальных эффектов игрока
   */
  updatePlayerEffects() {
    if (!this.player) return;

    // Обновление следа частиц - исправлено! Используем setConfig вместо setTint
    if (this.trailEmitter) {
      // Эмиттер частиц не имеет метода setTint, поэтому пропускаем изменение цвета
      // или можно пересоздать эмиттер с новыми параметрами
    }

    // Обновление щита
    if (this.shieldActive && !this.shieldGraphics) {
      this.shieldGraphics = this.add.graphics();
      this.shieldGraphics.setDepth(14);
      this.tweens.add({
        targets: this.shieldGraphics,
        alpha: { from: 0.8, to: 0.3 },
        duration: 500,
        repeat: -1,
        yoyo: true
      });
    }

    if (this.shieldGraphics && this.shieldActive) {
      this.shieldGraphics.clear();
      this.shieldGraphics.lineStyle(2, 0x00ffff, 0.6);
      this.shieldGraphics.strokeCircle(this.player.x, this.player.y, 40);
      this.shieldGraphics.fillStyle(0x00ffff, 0.1);
      this.shieldGraphics.fillCircle(this.player.x, this.player.y, 40);
    } else if (this.shieldGraphics && !this.shieldActive) {
      this.shieldGraphics.destroy();
      this.shieldGraphics = null;
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
   * Метод для проверки достижений по волнам
   */
  checkWaveAchievements() {
    if (!this.waveManager || !this.achievements) return;

    const waveIndex = this.waveManager.currentWave;

    if (waveIndex >= 3 && this.achievements.wave_3 && !this.achievements.wave_3.unlocked) {
      this.unlockAchievement('wave_3');
    }
    if (waveIndex >= 5 && this.achievements.wave_5 && !this.achievements.wave_5.unlocked) {
      this.unlockAchievement('wave_5');
    }
    if (waveIndex >= 10 && this.achievements.wave_10 && !this.achievements.wave_10.unlocked) {
      this.unlockAchievement('wave_10');
    }
  }

  

  /**
   * Метод для проверки новых рекордов
   */
  checkNewRecords() {
    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('skypulse_best', String(this.best));
      if (this.bestText) {
        this.bestText.setText(`🏆 ${this.best}`);
      }
      this.showNotification('НОВЫЙ РЕКОРД!', 2000, '#ffff00');
      try { if (this.levelUpSound) this.levelUpSound.play(); } catch (e) {}
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

    // Проверка активных квестов
    if (typeof this.questSystem.getActiveQuests === 'function') {
      const activeQuests = this.questSystem.getActiveQuests() || [];
      for (let quest of activeQuests) {
        if (quest.completed && !quest.claimed) {
          quest.claimed = true;
          this.crystals += quest.reward || 0;
          if (this.crystalText) {
            this.crystalText.setText(`💎 ${this.crystals}`);
          }
          this.showNotification(`Квест выполнен! +${quest.reward || 0} 💎`, 2000, '#00ff00');
        }
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
    if (!this.started || this.dead || !this.worldConfig) return;

    const goalScore = this.worldConfig.goalScore || 500;
    if (this.score >= goalScore) {
      this.completeLevel();
    }
  }

  /**
   * Метод для обновления сложности в реальном времени
   */
  updateDifficultyInRealTime() {
    const newGameLevel = Math.floor(this.meters / 1000);
    if (newGameLevel > this.gameLevel) {
      this.gameLevel = newGameLevel;
      this.updateDifficulty();
      this.createLevelEffect();
      this.checkWaveAchievements();
    }
  }

    /**
   * Метод для проверки максимального комбо - ЛЕГКАЯ ВЕРСИЯ
   */
  checkMaxCombo() {
    if (!this.comboSystem) return;
    
    if (this.comboSystem.combo > this.comboSystem.maxCombo) {
      this.comboSystem.maxCombo = this.comboSystem.combo;
      
      // Показываем только для значимых рекордов
      if (this.comboSystem.maxCombo >= 5 && this.comboSystem.maxCombo % 5 === 0) {
        // Определяем цвет
        let color = '#ffff00';
        let icon = '⭐';
        
        if (this.comboSystem.maxCombo >= 20) {
          color = '#ff00ff';
          icon = '👑';
        } else if (this.comboSystem.maxCombo >= 10) {
          color = '#ff5500';
          icon = '🔥';
        }
        
        // Просто текст, без частиц
        this.showNotification(
          `${icon} ${this.comboSystem.maxCombo} x ${icon}`,
          1500,
          color
        );
        
        // Легкая тряска
        this.cameras.main.shake(100, 0.001);
      }
    }
  }

  /**
   * Метод для проверки производительности - ЛЕГКАЯ ВЕРСИЯ
   */
  checkPerformance() {
    // Ничего не делаем, просто проверяем
    const fps = this.game.loop.actualFps;
    if (fps < 20) {
      // Только логируем, без изменений
      console.log('FPS low:', fps);
    }
  }

  /**
   * Метод для оптимизации памяти - ЛЕГКАЯ ВЕРСИЯ
   */
  optimizeMemory() {
    const now = Date.now();
    
    // Раз в 5 секунд
    if (!this.lastOptimizeTime || now - this.lastOptimizeTime > 5000) {
      this.lastOptimizeTime = now;
      
      // Простая очистка
      if (this.pipes) this.pipes = this.pipes.filter(p => p && p.active);
      if (this.coins) this.coins = this.coins.filter(c => c && c.active);
      if (this.asteroids) this.asteroids = this.asteroids.filter(a => a && a.sprite && a.sprite.active);
      if (this.powerUps) this.powerUps = this.powerUps.filter(p => p && p.sprite && p.sprite.active);
    }
  }

  /**
   * Метод для создания эффекта бонуса - МИНИМАЛЬНАЯ ВЕРСИЯ
   */
  createBonusVisualEffect(type) {
    if (!this.player || !this.player.active) return;
    
    // Только пульсация игрока, без частиц
    this.tweens.add({
      targets: this.player,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      yoyo: true,
      ease: 'Quad.out'
    });
    
    // Очень мало частиц (только 3 штуки)
    if (!this.lowPerformanceMode) {
      const colors = {
        speed: 0xffff00,
        shield: 0x00ffff,
        magnet: 0xff00ff,
        slow: 0xff8800
      };
      
      const color = colors[type] || 0x00ffff;
      
      // Минимум частиц
      const emitter = this.add.particles(this.player.x, this.player.y, 'flare', {
        speed: { min: 50, max: 100 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 200,
        quantity: 3,
        blendMode: Phaser.BlendModes.ADD,
        tint: color
      });

      emitter.explode(3);
      
      // Быстро уничтожаем
      this.time.delayedCall(300, () => {
        if (emitter) emitter.destroy();
      });
    }
  }

  /**
   * Метод для показа уведомления - ЛЕГКАЯ ВЕРСИЯ
   */
  showNotification(text, duration = 1500, color = '#ffffff') {
    const w = this.scale.width;
    
    // Только текст, без фона
    const notification = this.add.text(w / 2, 80, text, {
      fontSize: '16px',
      fontFamily: "'Orbitron', monospace",
      color: color,
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    // Простое появление
    notification.setAlpha(0);
    
    this.tweens.add({
      targets: notification,
      alpha: 1,
      duration: 100
    });

    // Исчезновение
    this.tweens.add({
      targets: notification,
      alpha: 0,
      delay: duration - 300,
      duration: 300,
      onComplete: () => notification.destroy()
    });
  }

  /**
   * Метод для сохранения прогресса
   */
  saveProgress() {
    if (gameManager.data) {
      gameManager.data.crystals = this.crystals;
      if (this.upgradeSystem) {
        gameManager.data.upgrades = this.upgradeSystem.upgrades;
      }
      gameManager.save();
    }
  }

  /**
   * Метод для очистки объектов
   */
  cleanupObjects() {
    if (this.pipes) {
      this.pipes = this.pipes.filter(p => {
        if (p && p.x < -150) {
          if (p.tween) p.tween.stop();
          p.destroy();
          return false;
        }
        return true;
      });
    }

    if (this.coins) {
      this.coins = this.coins.filter(c => {
        if (!c || !c.active || c.x < -100) {
          if (c) c.destroy();
          return false;
        }
        return true;
      });
    }

    if (this.scoreZones) {
      this.scoreZones = this.scoreZones.filter(z => {
        if (z && z.x < -60) {
          z.destroy();
          return false;
        }
        return true;
      });
    }

    if (this.stationPlanet && this.stationPlanet.x < -200) {
      if (this.stationPlanet.label) this.stationPlanet.label.destroy();
      this.stationPlanet.destroy();
      this.stationPlanet = null;
      this.stationActive = false;
    }
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ ФОНА
  // =========================================================================

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

  createPlayer() {
    const h = this.scale.height;
    const skin = (gameManager.getCurrentSkin && gameManager.getCurrentSkin()) || 'player';

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
      this.coinSound = this.cache.audio.has('coin_sound') ? this.sound.add('coin_sound', { volume: 0.4 }) : null;
      this.itemSound = this.cache.audio.has('item_sound') ? this.sound.add('item_sound', { volume: 0.5 }) : null;
      this.tapSound = this.cache.audio.has('tap_sound') ? this.sound.add('tap_sound', { volume: 0.3 }) : null;
      this.wagonSound = this.cache.audio.has('wagon_sound') ? this.sound.add('wagon_sound', { volume: 0.6 }) : null;
      this.levelUpSound = this.cache.audio.has('level_up_sound') ? this.sound.add('level_up_sound', { volume: 0.5 }) : null;
      this.purchaseSound = this.cache.audio.has('purchase_sound') ? this.sound.add('purchase_sound', { volume: 0.5 }) : null;
      this.reviveSound = this.cache.audio.has('revive_sound') ? this.sound.add('revive_sound', { volume: 0.5 }) : null;
      this.hitSound = this.tapSound;
    } catch (e) {
      console.warn('Sounds not loaded, continuing without sound');
    }
  }

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

    // Кнопки
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

    this.createGameOverBox();

    // Коллизии
    this.physics.add.overlap(this.player, this.coinGroup, (p, c) => this.collectCoin(c), null, this);

    // Коллизии пуль с врагами
    this.physics.add.overlap(this.playerBullets, this.enemyGroup, (bullet, enemySprite) => {
      if (!bullet || !bullet.active || !enemySprite || !enemySprite.active) return;
      const enemy = enemySprite.enemyRef;
      if (enemy && enemy.health > 0 && this.damageSystem) {
        this.damageSystem.enemyHitByBullet(enemy, bullet);
      }
    }, null, this);

    this.physics.add.overlap(this.enemyBullets, this.player, (bullet, player) => {
      if (this.damageSystem) {
        this.damageSystem.playerHitByBullet(player, bullet);
      }
    }, null, this);

    this.physics.add.overlap(this.enemyBullets, this.wagons, (bullet, wagon) => {
      if (!bullet || !wagon || !wagon.active) return;
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

  updateHearts() {
    if (!this.heartContainer) return;
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
    const panel = this.add.rectangle(0, 0, 300, 250, 0x0a0a1a, 0.95).setStrokeStyle(3, 0x00ffff, 0.9).setScrollFactor(0);
    const title = this.add.text(0, -100, 'ИГРА ОКОНЧЕНА', { fontSize: '20px', fontFamily, color: '#ffffff', stroke: '#ff00ff', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0);
    const subtitle = this.add.text(0, -20, '', { fontSize: '12px', fontFamily, color: '#7dd3fc', align: 'center', stroke: '#0f172a', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0);
    this.gameOverSubtitle = subtitle;
    const tip = this.add.text(0, 80, 'Нажми, чтобы продолжить', { fontSize: '12px', fontFamily, color: '#cbd5e1', align: 'center' }).setOrigin(0.5).setScrollFactor(0);
    this.gameOverBox = this.add.container(w / 2, h / 2, [panel, title, subtitle, tip]);
    this.gameOverBox.setVisible(false);
  }

  startRun() {
    this.started = true;
    if (this.introText) this.introText.setVisible(false);
    if (this.coinTipsText) this.coinTipsText.setVisible(false);
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
  
  // Базовая скорость для 0 уровня
  const baseSpeed = 240;
  // Увеличение на 10% каждый уровень
  const speed = Math.floor(baseSpeed * Math.pow(1.1, level));
  
  // Плавное уменьшение зазора
  const baseGap = 240;
  const gap = Math.max(140, Math.floor(baseGap - level * 5));
  
  // Уменьшение задержки спавна
  const baseDelay = 1500;
  const spawnDelay = Math.max(500, baseDelay - level * 50);
  
  // Увеличение шансов
  const asteroidChance = Math.min(0.7, 0.3 + level * 0.02);
  const powerUpChance = Math.min(0.3, 0.1 + level * 0.01);
  
  // Добавляем случайность
  return {
    speed: speed + Phaser.Math.Between(-10, 10),
    gap: gap + Phaser.Math.Between(-10, 10),
    spawnDelay: spawnDelay + Phaser.Math.Between(-50, 50),
    coinChance: 0.8,
    asteroidChance: asteroidChance,
    powerUpChance: powerUpChance
  };
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

    const upgrades = SHOP_UPGRADES || [];

    let y = 90;
    const col1X = 40;
    const col2X = w - 180;

    for (let up of upgrades) {
      if (!up || !up.key) continue;
      
      const current = this.upgradeSystem ? this.upgradeSystem.getUpgradeValue(up.key) : 0;
      const level = (this.upgradeSystem && this.upgradeSystem.upgrades) ? (this.upgradeSystem.upgrades[up.key] || 0) : 0;
      const maxLevel = up.maxLevel || 10;
      const text = `${up.icon || ''} ${up.name || up.key}: ${current}`;
      const cost = this.upgradeSystem ? this.upgradeSystem.getUpgradeCost(up.key) : 999999;
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
    this.shopElements.forEach(el => { if (el && el.destroy) el.destroy(); });
    this.shopElements = [];
    this.shopVisible = false;
  }

  buyUpgrade(key) {
    if (!this.upgradeSystem) return;
    
    const cost = this.upgradeSystem.getUpgradeCost(key);
    if (this.crystals < cost) {
      this.showNotification('Недостаточно кристаллов!', 1500, '#ff4444');
      return;
    }
    this.crystals -= cost;
    if (this.crystalText) {
      this.crystalText.setText(`💎 ${this.crystals}`);
    }
    this.upgradeSystem.applyUpgrade(key);
    try { if (this.purchaseSound) this.purchaseSound.play(); } catch (e) {}
    this.showNotification('Улучшение куплено!', 1500, '#00ff00');
    if (this.shopVisible) {
      this.hideShop();
      this.showShop();
    }
    if (gameManager.data) {
      gameManager.data.crystals = this.crystals;
      gameManager.save();
    }
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
          if (this.countdownText) this.countdownText.setText(count.toString());
        } else {
          if (this.countdownText) this.countdownText.setText('ПОЕХАЛИ!');
          this.time.delayedCall(500, () => {
            if (this.countdownOverlay) this.countdownOverlay.destroy();
            if (this.countdownText) this.countdownText.destroy();
            if (this.countdownPrepareText) this.countdownPrepareText.destroy();
            this.countdownActive = false;
            if (this.isPaused) this.togglePause();
          });
          if (this.resumeCountdownTimer) this.resumeCountdownTimer.remove();
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

    checkLevelProgression() {
    const nextLevel = Math.floor(this.score / 1000);
    // Проверяем, что levelManager существует и nextLevel изменился
    if (this.levelManager && nextLevel > (this.levelManager.currentLevel || 0) && nextLevel < 6) {
      this.transitionToLevel(nextLevel);
    }
  }

    transitionToLevel(levelIndex) {
    if (this.levelManager) {
      // Исправляем: вместо switchLevel используем метод, который существует
      if (typeof this.levelManager.setLevel === 'function') {
        this.levelManager.setLevel(levelIndex);
      } else if (typeof this.levelManager.changeLevel === 'function') {
        this.levelManager.changeLevel(levelIndex);
      } else {
        // Если нет подходящего метода, просто обновляем текущий уровень
        this.levelManager.currentLevel = levelIndex;
      }
      
      // Пересоздаем waveManager с новым уровнем
      this.waveManager = new WaveManager(this, this.levelManager);
    }
    this.showLevelTransition(levelIndex);
  }

  showLevelTransition(levelIndex) {
    const w = this.scale.width;
    const h = this.scale.height;
    const levelName = (this.levelManager && this.levelManager.levelConfig) 
      ? this.levelManager.levelConfig[levelIndex]?.name 
      : `УРОВЕНЬ ${levelIndex + 1}`;
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

  /**
 * Обновление уровня каждые 1000 метров
 */
updateLevel() {
  const newLevel = Math.floor(this.meters / 1000);
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
    if (this.questSystem) {
      this.questSystem.updateProgress('level', 1);
    }
  }
}

/**
 * Обновление параметров сложности на основе текущего уровня
 */
updateDifficulty() {
  const diff = this.getDifficulty();
  this.baseSpeed = diff.speed;
  this.gapSize = diff.gap;
  this.spawnDelay = diff.spawnDelay;
  
  // Если нет активного бонуса, обновляем текущую скорость
  if (!this.bonusActive) {
    this.currentSpeed = this.baseSpeed;
  }
  
  // Обновляем скорость всех существующих объектов
  this.updateExistingObjectsSpeed();
  
  console.log(`Уровень ${this.gameLevel}: скорость ${this.baseSpeed}px/с, зазор ${this.gapSize}px`);
}

/**
 * Обновление скорости уже существующих объектов
 */
updateExistingObjectsSpeed() {
  // Обновляем скорость ворот
  if (this.gateGroup) {
    this.gateGroup.getChildren().forEach(gate => {
      if (gate && gate.body) {
        gate.body.velocity.x = -this.baseSpeed;
        gate.body.velocity.y = 0; // Дополнительная защита
      }
    });
  }
  
  // Обновляем скорость зон
  if (this.scoreZones) {
    this.scoreZones.forEach(zone => {
      if (zone && zone.body) {
        zone.body.velocity.x = -this.baseSpeed;
        zone.body.velocity.y = 0; // Дополнительная защита
      }
    });
  }
  
  // Обновляем скорость монет - МАКСИМАЛЬНАЯ ЗАЩИТА ОТ ГРАВИТАЦИИ
  if (this.coins) {
    this.coins.forEach(coin => {
      if (coin && coin.body && coin.active) {
        coin.body.setAllowGravity(false);  // Принудительно отключаем гравитацию
        coin.body.setGravityY(0);          // Обнуляем гравитацию
        coin.body.velocity.x = -this.currentSpeed; // Горизонтальная скорость
        coin.body.velocity.y = 0;           // Вертикальная скорость = 0
        coin.speed = this.currentSpeed;
      }
    });
  }
  
  // Обновляем скорость монет в группе
  if (this.coinGroup) {
    this.coinGroup.getChildren().forEach(coin => {
      if (coin && coin.body && coin.active) {
        coin.body.setAllowGravity(false);
        coin.body.setGravityY(0);
        coin.body.velocity.x = -this.currentSpeed;
        coin.body.velocity.y = 0;
      }
    });
  }
}

/**
 * Получение параметров сложности для текущего уровня
 */
getDifficulty() {
  const level = Math.min(this.gameLevel, 20);
  
  // Базовая скорость для 0 уровня
  const baseSpeed = 240;
  // Увеличение на 10% каждый уровень
  const speed = Math.floor(baseSpeed * Math.pow(1.1, level));
  
  // Плавное уменьшение зазора
  const baseGap = 240;
  const gap = Math.max(140, Math.floor(baseGap - level * 5));
  
  // Уменьшение задержки спавна
  const baseDelay = 1500;
  const spawnDelay = Math.max(500, baseDelay - level * 50);
  
  // Увеличение шансов
  const asteroidChance = Math.min(0.7, 0.3 + level * 0.02);
  const powerUpChance = Math.min(0.3, 0.1 + level * 0.01);
  
  return {
    speed: speed + Phaser.Math.Between(-10, 10),
    gap: gap + Phaser.Math.Between(-10, 10),
    spawnDelay: spawnDelay + Phaser.Math.Between(-50, 50),
    coinChance: 0.8,
    asteroidChance: asteroidChance,
    powerUpChance: powerUpChance
  };
}

/**
 * Проверка спавна станции
 */
checkStationSpawn() {
  if (this.stationActive || this.dead) return;
  if (this.level > 0 && this.level % 10 === 0 && !this.stationPlanet) {
    this.spawnStation();
  }
}

/**
 * Спавн станции
 */
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
  if (this.stationPlanet.body) {
    this.stationPlanet.body.setAllowGravity(false);
    this.stationPlanet.body.setGravityY(0);
    this.stationPlanet.body.velocity.y = 0;
  }
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

/**
 * Взаимодействие со станцией
 */
touchStation() {
  if (!this.stationActive || !this.stationPlanet) return;
  this.stationActive = false;
  const bonus = this.wagons.length * 10;
  this.crystals += bonus;
  if (this.crystalText) {
    this.crystalText.setText(`💎 ${this.crystals}`);
  }
  if (gameManager.data) {
    gameManager.data.crystals = this.crystals;
    gameManager.save();
  }
  this.particleManager.createBonusEffect('speed', this.stationPlanet.x, this.stationPlanet.y);
  this.wagons.forEach(w => { if (w && w.destroy) w.destroy(); });
  this.wagons = [];
  this.targetPlayerX = 110;
  if (this.wagonCountText) {
    this.wagonCountText.setText(`🚃 0/${this.maxWagons}`);
  }
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

/**
 * Спавн монеты - ПОЛНОСТЬЮ ИСПРАВЛЕНО (монеты НЕ ПАДАЮТ)
 */
spawnCoin(x, y) {
  if (Math.random() > 0.9) return;
  
  let coinType = 'gold', texture = 'coin_gold';
  const r = Math.random();
  
  // Шансы появления цветных монет
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
  
  // ===== АБСОЛЮТНОЕ ОТКЛЮЧЕНИЕ ГРАВИТАЦИИ =====
  coin.body.setAllowGravity(false);  // 1. Отключаем гравитацию
  coin.body.setGravityY(0);          // 2. Обнуляем гравитацию по Y
  coin.body.setVelocityX(-this.currentSpeed); // 3. Задаем горизонтальную скорость
  coin.body.setVelocityY(0);          // 4. Явно обнуляем вертикальную скорость
  coin.body.acceleration.y = 0;       // 5. Обнуляем ускорение по Y
  
  // Сохраняем скорость для восстановления
  coin.speed = this.currentSpeed;
  
  coin.setScale(0.01);
  coin.coinType = coinType;
  coin.setBlendMode(Phaser.BlendModes.ADD);
  coin.collected = false;
  
  // Анимация появления
  this.tweens.add({ 
    targets: coin, 
    scaleX: 1, 
    scaleY: 1, 
    duration: 300, 
    ease: 'Back.out' 
  });
  
  // Добавляем в оба хранилища
  this.coins.push(coin);
  this.coinGroup.add(coin);
  
  // Коллизия с игроком
  this.physics.add.overlap(this.player, coin, (p, c) => this.collectCoin(c), null, this);
}

/**
 * Завершение уровня
 */
completeLevel() {
  let stars = 1;
  if (this.score >= (this.worldConfig?.goalScore || 500) * 1.5) stars = 2;
  if (this.score >= (this.worldConfig?.goalScore || 500) * 2) stars = 3;
  if (this.headHP === this.maxHeadHP) stars = Math.min(3, stars + 1);

  if (gameManager.setLevelStars) {
    gameManager.setLevelStars(this.world, this.level, stars);
  }

  if (this.level < 9 && gameManager.unlockLevel) {
    gameManager.unlockLevel(this.world, this.level + 1);
  }
  if (this.level === 9 && this.world < 4 && gameManager.data) {
    const worlds = gameManager.data.unlockedWorlds || [];
    if (!worlds.includes(this.world + 1)) {
      worlds.push(this.world + 1);
      if (gameManager.save) gameManager.save();
    }
  }

  if (gameManager.updateStats) {
    gameManager.updateStats(
      this.score,
      this.level + 1,
      this.wagons.length,
      this.comboSystem?.maxCombo || 0,
      this.collectedCoins,
      0,
      Math.floor(this.meters)
    );
  }

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

  handleDeath() {
    if (this.upgradeSystem && this.upgradeSystem.upgrades && this.upgradeSystem.upgrades.revival > 0 && !this.dead) {
      this.upgradeSystem.upgrades.revival--;
      this.headHP = this.maxHeadHP;
      this.updateHearts();
      this.cameras.main.flash(300, 100, 255, 100, false);
      try { if (this.reviveSound) this.reviveSound.play(); } catch (e) {}
      this.showNotification('ВОСКРЕШЕНИЕ!', 2000, '#00ffff');
      if (gameManager.data) {
        gameManager.data.upgrades = this.upgradeSystem.upgrades;
        gameManager.save();
      }
      return;
    }
    if (this.dead) return;
    this.dead = true;
    if (this.trailEmitter) this.trailEmitter.stop();
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.bonusTimer) this.bonusTimer.remove();
    if (this.stationTimer) this.stationTimer.remove();

    this.physics.pause();
    this.cameras.main.shake(300, 0.005);
    this.cameras.main.flash(300, 255, 100, 100, false);
    if (this.player) {
      this.player.setTint(0xff0000).setAngle(90);
    }

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
    try { if (window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error'); } catch (e) {}
  }

  showGameOver() {
    if (!this.gameOverBox) this.createGameOverBox();
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

  initAchievements() {
    this.achievements = { ...ACHIEVEMENTS };
    for (let key in this.achievements) {
      if (this.achievements[key]) {
        this.achievements[key].unlocked = false;
      }
    }
    this.loadAchievements();
  }

  loadAchievements() {
    try {
      const saved = localStorage.getItem('skypulse_achievements');
      if (saved) {
        const data = JSON.parse(saved);
        for (let key in data) {
          if (this.achievements && this.achievements[key]) {
            this.achievements[key].unlocked = data[key];
          }
        }
      }
    } catch (e) {}
  }

  saveAchievements() {
    if (!this.achievements) return;
    const data = {};
    for (let key in this.achievements) {
      if (this.achievements[key]) {
        data[key] = this.achievements[key].unlocked;
      }
    }
    localStorage.setItem('skypulse_achievements', JSON.stringify(data));
  }

  checkAchievements() {
    if (!this.achievements) return;
    
    if (this.wagons.length >= 1 && this.achievements.first_wagon && !this.achievements.first_wagon.unlocked) 
      this.unlockAchievement('first_wagon');
    if (this.wagons.length >= 5 && this.achievements.five_wagons && !this.achievements.five_wagons.unlocked) 
      this.unlockAchievement('five_wagons');
    if (this.wagons.length >= 10 && this.achievements.ten_wagons && !this.achievements.ten_wagons.unlocked) 
      this.unlockAchievement('ten_wagons');
    if (this.level >= 4 && this.achievements.level_5 && !this.achievements.level_5.unlocked) 
      this.unlockAchievement('level_5');
    if (this.level >= 9 && this.achievements.level_10 && !this.achievements.level_10.unlocked) 
      this.unlockAchievement('level_10');
    if (this.score >= 100 && this.achievements.score_100 && !this.achievements.score_100.unlocked) 
      this.unlockAchievement('score_100');
    if (this.score >= 500 && this.achievements.score_500 && !this.achievements.score_500.unlocked) 
      this.unlockAchievement('score_500');
    if (this.headHP === this.maxHeadHP && this.score > 10 && this.achievements.no_damage && !this.achievements.no_damage.unlocked) 
      this.unlockAchievement('no_damage');
    this.checkCoinAchievements();
  }

  checkCoinAchievements() {
    if (!this.achievements || !this.achievements.all_bonuses) return;
    if (this.collectedCoins >= 50 && !this.achievements.all_bonuses.unlocked) {
      this.unlockAchievement('all_bonuses');
    }
  }

  unlockAchievement(key) {
    if (!this.achievements || !this.achievements[key] || this.achievements[key].unlocked) return;
    this.achievements[key].unlocked = true;
    const reward = this.achievements[key].reward || 0;
    this.crystals += reward;
    if (this.crystalText) {
      this.crystalText.setText(`💎 ${this.crystals}`);
    }
    if (gameManager.data) {
      gameManager.data.crystals = this.crystals;
    }
    if (gameManager.unlockAchievement) {
      gameManager.unlockAchievement(key);
    }
    if (gameManager.save) {
      gameManager.save();
    }
    this.showAchievementNotification(key, reward);
    this.saveAchievements();
  }

  showAchievementNotification(key, reward) {
    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";
    const achievement = this.achievements?.[key];
    if (!achievement) return;
    
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
    try { if (this.levelUpSound) this.levelUpSound.play(); } catch (e) {}
  }

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
    const rewardAmount = this.dailyReward.rewards[this.dailyReward.streak - 1] || 0;
    this.crystals += rewardAmount;
    if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
    if (gameManager.data) {
      gameManager.data.crystals = this.crystals;
      gameManager.save();
    }
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
    if (!this.stats) return;
    this.stats.totalGames++;
    this.stats.totalDistance += Math.floor(this.meters);
    this.stats.totalCoins += this.crystals;
    if (this.score > this.stats.bestScore) this.stats.bestScore = this.score;
    if (this.level + 1 > this.stats.bestLevel) this.stats.bestLevel = this.level + 1;
    this.stats.totalWagons += this.wagons.length;
    this.stats.totalPlayTime += (Date.now() - this.stats.startTime) / 1000;
    this.saveStats();
  }

  updateStars(time, delta) {
    const w = this.scale.width;
    const h = this.scale.height;
    const factor = this.started && !this.dead ? 1 : 0.3;
    const dt = delta / 1000;

    for (let s of this.stars) {
      if (!s || !s.sprite) continue;
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
      if (!p || !p.sprite) continue;
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
      if (!s || !s.sprite) continue;
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
      if (!a || !a.sprite) continue;
      a.sprite.x -= a.speed * factor * dt;
      if (a.sprite.x < -200) {
        a.sprite.x = w + Phaser.Math.Between(300, 1500);
        a.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

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

  shutdown() {
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.bonusTimer) this.bonusTimer.remove();
    if (this.stationTimer) this.stationTimer.remove();
    if (this.resumeCountdownTimer) this.resumeCountdownTimer.remove();
    if (this.pipes) {
      this.pipes.forEach(p => { if (p && p.tween) p.tween.stop(); if (p && p.destroy) p.destroy(); });
    }
    if (this.coins) this.coins.forEach(c => { if (c && c.destroy) c.destroy(); });
    if (this.wagons) this.wagons.forEach(w => { if (w && w.destroy) w.destroy(); });
    if (this.scoreZones) this.scoreZones.forEach(z => { if (z && z.destroy) z.destroy(); });
    if (this.stars) this.stars.forEach(s => { if (s && s.sprite && s.sprite.destroy) s.sprite.destroy(); });
    if (this.planets) this.planets.forEach(p => { if (p && p.sprite && p.sprite.destroy) p.sprite.destroy(); });
    if (this.ships) this.ships.forEach(s => { if (s && s.sprite && s.sprite.destroy) s.sprite.destroy(); });
    if (this.asteroids) this.asteroids.forEach(a => { if (a && a.sprite && a.sprite.destroy) a.sprite.destroy(); });
    if (this.trailEmitter) this.trailEmitter.stop();
    if (this.stationPlanet) {
      if (this.stationPlanet.label) this.stationPlanet.label.destroy();
      this.stationPlanet.destroy();
    }
    if (this.particleManager) this.particleManager.clearAll();
    if (this.shopElements) {
      this.shopElements.forEach(el => { if (el && el.destroy) el.destroy(); });
    }
    if (this.playerBullets) this.playerBullets.clear(true, true);
    if (this.enemyBullets) this.enemyBullets.clear(true, true);
    if (this.comboSystem && typeof this.comboSystem.destroy === 'function') this.comboSystem.destroy();
    if (this.specialEventManager && typeof this.specialEventManager.destroy === 'function') this.specialEventManager.destroy();
  }
}

export default PlayScene;