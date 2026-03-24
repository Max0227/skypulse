// src/scenes/PlayScene.js
import Phaser from 'phaser';
import {
  LEVEL_CONFIG,
  ENEMY_CONFIG,
  ACHIEVEMENTS,
} from '../config';
import { Coin } from '../entities/Coin';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';
import { ParticleEffectManager } from '../systems/ParticleEffectManager';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { LevelManager } from '../systems/LevelManager';
import { ComboSystem } from '../systems/ComboSystem';
import { MultiplierSystem } from '../systems/MultiplierSystem';
import { WaveManager } from '../systems/WaveManager';
import { Asteroid } from '../entities/Asteroid';
import { PowerUp } from '../entities/PowerUp';
import { Wagon } from '../entities/Wagon';

// =========================================================================
// КОНСТАНТЫ ОПТИМИЗАЦИИ
// =========================================================================

const PERFORMANCE = {
  MAX_STARS: 80,
  MAX_PLANETS: 3,
  MAX_SHIPS: 6,
  PARTICLE_LIMIT: 40,
  UPDATE_THROTTLE: 33,
  LOW_FPS_THRESHOLD: 25,
};

// =========================================================================
// ВСПОМОГАТЕЛЬНЫЕ КЛАССЫ
// =========================================================================

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
    if (scene.enemyGroup) scene.enemyGroup.add(this.sprite);
  }

  createHealthBar() {
    const barWidth = 30, barHeight = 4;
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(0, 0, barWidth, barHeight);
    graphics.generateTexture('enemy_health_bar', barWidth, barHeight);
    graphics.destroy();
    this.healthBar = this.scene.add.image(this.sprite.x, this.sprite.y - 20, 'enemy_health_bar')
      .setScale(1, 0.5).setDepth(20);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.healthBar) {
      const percent = this.health / this.maxHealth;
      this.healthBar.setScale(percent, 0.5);
      this.healthBar.setTint(percent > 0.5 ? 0x00ff00 : (percent > 0.25 ? 0xffaa00 : 0xff0000));
    }
    if (this.health <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  die() {
    this.scene.crystals += this.config.scoreValue;
    if (this.scene.crystalText) this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    this.scene.particleManager.createEnemyDeathEffect(this.sprite.x, this.sprite.y);
    if (this.scene.enemyGroup) this.scene.enemyGroup.remove(this.sprite);
    if (this.healthBar) this.healthBar.destroy();
    this.sprite.destroy();
    if (this.scene.waveManager) {
      this.scene.waveManager.enemies = this.scene.waveManager.enemies.filter(e => e !== this);
    }
  }

  update(playerPos, time, delta) {
    if (!this.sprite?.active) return;
    
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerPos.x, playerPos.y);
    this.state = dist < this.config.attackRange ? 'attack' : (dist < this.config.detectionRange ? 'chase' : 'patrol');

    this.attackCooldown -= delta;
    this.fireCooldown -= delta;
    if (this.healthBar?.active) this.healthBar.setPosition(this.sprite.x, this.sprite.y - 20);

    switch (this.state) {
      case 'chase': this.chase(playerPos); break;
      case 'attack': this.attack(playerPos); break;
      case 'patrol': this.patrol(delta); break;
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
    this.chase(playerPos);
  }

  patrol(delta) {
    this.patrolTimer += delta;
    if (this.patrolTimer > 2000) {
      this.patrolDirection *= -1;
      this.patrolTimer = 0;
    }
    this.sprite.body.setVelocity(this.config.speed * this.patrolDirection * 0.5, 0);
    if (this.sprite.y < 50) this.sprite.y = 50;
    else if (this.sprite.y > this.scene.scale.height - 50) this.sprite.y = this.scene.scale.height - 50;
  }
}

class DamageSystem {
  constructor(scene) { this.scene = scene; }

  playerHitByEnemy(player, enemy) {
    if (!player || !enemy?.sprite) return;
    if (player.shieldActive) {
      this.scene.particleManager.createBonusEffect('shield', enemy.sprite.x, enemy.sprite.y);
      if (player.body) player.body.setVelocityY(-100);
      return;
    }
    player.headHP -= enemy.config.damage;
    this.scene.updateHearts();
    try { this.scene.hitSound?.play(); } catch(e) {}
    if (player.headHP <= 0) this.scene.handleDeath();
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
    try { this.scene.hitSound?.play(); } catch(e) {}
    bullet.destroy();
    if (player.headHP <= 0) this.scene.handleDeath();
  }

  enemyHitByBullet(enemy, bullet) {
    if (!enemy || !bullet) return;
    if (enemy.takeDamage(bullet.damage)) {
      this.scene.crystals += enemy.config.scoreValue;
      if (this.scene.crystalText) this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    }
    this.scene.particleManager.createAttackEffect(enemy.sprite.x, enemy.sprite.y);
    bullet.destroy();
  }

  wagonHitByEnemy(wagon, enemy) {
    if (!wagon || !enemy) return;
    let hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      this.scene.wagons = this.scene.wagons.filter(w => w !== wagon);
      this.scene.particleManager.createWagonDestroyEffect(wagon);
      wagon.destroy();
    } else {
      wagon.setData('hp', hp);
      this.scene.tweens.add({ targets: wagon, alpha: 0.5, duration: 100, yoyo: true, repeat: 1 });
    }
  }

  enemyHitByWagon(enemy, wagon) { if (enemy) enemy.takeDamage(1); }
}

class SpecialEventManager {
  constructor(scene) {
    this.scene = scene;
    this.eventChance = 0.05;
    this.lastEventTime = 0;
    this.eventCooldown = 10000;
  }

  update(delta) {
    const now = Date.now();
    if (now - this.lastEventTime < this.eventCooldown) return;
    if (Math.random() < this.eventChance * (delta / 1000)) {
      this.lastEventTime = now;
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
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const x = this.scene.scale.width + 50;
        const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
        const meteor = this.scene.physics.add.image(x, y, 'bg_asteroid_1')
          .setScale(1.2).setVelocityX(-this.scene.currentSpeed * 1.2)
          .setVelocityY(Phaser.Math.Between(-50, 50)).setAngularVelocity(100);
        meteor.body.setAllowGravity(false);
      });
    }
  }

  timeWarp() {
    const originalSpeed = this.scene.currentSpeed;
    this.scene.currentSpeed *= 0.5;
    this.scene.time.delayedCall(5000, () => { this.scene.currentSpeed = originalSpeed; });
  }

  gravityShift() {
    const originalGravity = this.scene.physics.world.gravity.y;
    this.scene.physics.world.gravity.y *= 1.5;
    this.scene.time.delayedCall(4000, () => { this.scene.physics.world.gravity.y = originalGravity; });
  }

  emPulse() {
    const w = this.scene.scale.width, h = this.scene.scale.height;
    const pulse = this.scene.add.circle(w / 2, h / 2, 10, 0x00ffff, 0.5).setDepth(25);
    this.scene.tweens.add({ targets: pulse, radius: 300, alpha: 0, duration: 800, onComplete: () => pulse.destroy() });
    this.scene.coinGroup?.getChildren().forEach(coin => {
      if (coin?.body) {
        const angle = Phaser.Math.Angle.Between(w / 2, h / 2, coin.x, coin.y);
        coin.setVelocityX(Math.cos(angle) * 300);
        coin.setVelocityY(Math.sin(angle) * 300);
      }
    });
  }

  showEventNotification(eventName) {
    const w = this.scene.scale.width;
    const notification = this.scene.add.text(w / 2, 200, `⚡ ${eventName}`, {
      fontSize: '24px', fontFamily: "'Orbitron', monospace", color: '#ff00ff',
      stroke: '#ffff00', strokeThickness: 3, shadow: { blur: 15, color: '#ff00ff', fill: true }
    }).setOrigin(0.5).setDepth(100);
    this.scene.tweens.add({ targets: notification, alpha: 0, duration: 2000, onComplete: () => notification.destroy() });
  }

  destroy() { if (this.eventTimer) this.eventTimer.remove(); }
}

// =========================================================================
// ОСНОВНОЙ КЛАСС PLAYSCENE
// =========================================================================
export class PlayScene extends Phaser.Scene {
  constructor() {
    super('play');
  }

  flap() {
    if (!this.player || !this.player.body || this.dead) return;
    this.player.body.setVelocityY(-this.jumpPower);
    this.player.setScale(0.95);
    this.tweens.add({ targets: this.player, scaleX: 0.9, scaleY: 0.9, duration: 150, ease: 'Quad.out' });
    try { if (this.tapSound) this.tapSound.play(); } catch (e) {}
    try { if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    } } catch (e) {}
  }

  createComboEffect() {
    if (!this.comboSystem) return;
    const w = this.scale.width;
    const h = this.scale.height;
    const combo = this.comboSystem.combo || 0;
    if (combo > 1 && combo % 5 === 0) {
      const text = this.add.text(w / 2, h / 2 - 100, `x${combo}!`, {
        fontSize: '36px', fontFamily: "'Orbitron', monospace", color: '#ffff00',
        stroke: '#ff8800', strokeThickness: 4, shadow: { blur: 10, color: '#ffff00', fill: true }
      }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
      this.tweens.add({ targets: text, y: text.y - 50, alpha: 0, duration: 1000, ease: 'Power2.easeOut', onComplete: () => text.destroy() });
      try { if (this.levelUpSound) this.levelUpSound.play(); } catch (e) {}
    }
  }

  collectCoin(coin) {
    if (!coin || !coin.isActive || !coin.isActive()) return;
    if (coin.collected) return;
    coin.collected = true;

    let value = 1;
    let bonusType = null;
    switch (coin.type) {
      case 'red': value = 2; bonusType = 'speed'; break;
      case 'blue': value = 1; bonusType = 'shield'; break;
      case 'green': value = 1; bonusType = 'magnet'; break;
      case 'purple': value = 1; bonusType = 'slow'; break;
      default: value = 1;
    }

    if (this.bonusActive && this.bonusType === 'speed') value *= 2;
    if (this.player?.doubleCrystals) value *= 2;

    const multipliedValue = Math.floor(value * (this.comboSystem?.getMultiplier() || 1));
    this.crystals += multipliedValue;
    if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
    this.collectedCoins += multipliedValue;

    if (this.comboSystem) this.comboSystem.add();

    const coinsNeeded = 10;
    if (this.collectedCoins >= coinsNeeded && this.wagons.length < this.maxWagons) {
      this.addWagon();
      this.collectedCoins -= coinsNeeded;
    }

    if (bonusType) {
      this.activateBonus(bonusType);
      this.particleManager.createCoinCollectEffect(coin.x, coin.y, coin.type);
    } else {
      try { if (this.coinSound) this.coinSound.play(); } catch (e) {}
      this.particleManager.createCoinCollectEffect(coin.x, coin.y, 'gold');
    }

    if (this.questSystem) this.questSystem.updateProgress('crystals', multipliedValue);
    if (this.crystalText) {
      this.tweens.add({ targets: this.crystalText, scaleX: 1.2, scaleY: 1.2, duration: 80, yoyo: true, ease: 'Quad.out' });
    }
    try { if (gameManager.vibrate) gameManager.vibrate([30]); } catch (e) {}
    coin.destroy();
    if (gameManager.data) {
      gameManager.data.crystals = this.crystals;
      gameManager.save();
    }
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ ВАГОНОВ
  // =========================================================================

  addWagon() {
    if (this.wagons.length >= this.maxWagons || !this.player) return;
    const last = this.wagons.length > 0 ? this.wagons[this.wagons.length - 1] : this.player;
    const spawnX = last.x - this.wagonGap;
    const spawnY = last.y;
    const wagon = new Wagon(this, spawnX, spawnY, this.wagons.length, this.world);
    wagon.setHP(this.wagonBaseHP, this.wagonBaseHP);
    this.wagons.push(wagon);

    if (this.wagonCountText) {
      this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
      this.tweens.add({ targets: this.wagonCountText, scaleX: 1.2, scaleY: 1.2, duration: 200, yoyo: true, ease: 'Quad.out' });
    }
    this.createWagonSpawnEffect(wagon);
    try { if (this.wagonSound) this.wagonSound.play(); } catch(e) {}

    this.showNotification(`✨ НОВЫЙ ВАГОН! МНОЖИТЕЛЬ x${wagon.getMultiplier().toFixed(1)} ✨`, 1500, '#ffaa00');
  }

  createWagonSpawnEffect(wagon) {
    if (!wagon || !wagon.sprite) return;
    const worldColor = this.getWorldColor();
    for (let i = 0; i < 16; i++) {
      const particle = this.add.circle(
        wagon.sprite.x + Phaser.Math.Between(-28, 28),
        wagon.sprite.y + Phaser.Math.Between(-28, 28),
        Phaser.Math.Between(2, 6),
        worldColor, 0.9
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: particle, alpha: 0, scale: 0, x: particle.x + Phaser.Math.Between(-70, 70), y: particle.y + Phaser.Math.Between(-70, 70), duration: 500, onComplete: () => particle.destroy() });
    }
    const ring = this.add.circle(wagon.sprite.x, wagon.sprite.y, 12, worldColor, 0.8);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: ring, scaleX: 2.8, scaleY: 2.8, alpha: 0, duration: 450, ease: 'Sine.easeOut', onComplete: () => ring.destroy() });
  }

  updateWagons() {
  if (this.wagons.length === 0 || !this.player) return;
  
  let prevX = this.player.x;
  let prevY = this.player.y;
  
  for (let i = 0; i < this.wagons.length; i++) {
    const wagon = this.wagons[i];
    if (!wagon || !wagon.isActive()) continue;
    
    wagon.update(prevX, prevY, this.wagonGap);
    
    console.log(`🚃 Вагон ${i}: позиция (${wagon.sprite.x}, ${wagon.sprite.y})`); // ← ДОБАВИТЬ
    
    prevX = wagon.sprite.x;
    prevY = wagon.sprite.y;
  }
}

  wagonHit(wagon, obstacle) {
    if (!wagon || !wagon.isActive()) return;
    const destroyed = wagon.takeDamage(1);
    if (destroyed) {
      const destroyedIndex = this.wagons.findIndex(w => w === wagon);
      this.wagons = this.wagons.filter(w => w !== wagon);
      for (let i = 0; i < this.wagons.length; i++) {
        this.wagons[i].updateMultiplierAfterDetach(i);
      }
      this.createWagonLostEffect(wagon, destroyedIndex);
      this.showNotification(`💔 ВАГОН ПОТЕРЯН! МНОЖИТЕЛЬ СНИЖЕН`, 1500, '#ff4444');
    }
    if (this.wagonCountText) {
      this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
      this.tweens.add({ targets: this.wagonCountText, scaleX: 1.2, scaleY: 1.2, duration: 150, yoyo: true });
    }
  }

  createWagonLostEffect(wagon, index) {
    if (!wagon || !wagon.sprite) return;
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        wagon.sprite.x + Phaser.Math.Between(-25, 25),
        wagon.sprite.y + Phaser.Math.Between(-25, 25),
        Phaser.Math.Between(3, 7),
        0xff4444, 0.9
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: particle, alpha: 0, scale: 0, x: particle.x + Phaser.Math.Between(-90, 90), y: particle.y + Phaser.Math.Between(-90, 90), duration: 550, onComplete: () => particle.destroy() });
    }
    const shockwave = this.add.circle(wagon.sprite.x, wagon.sprite.y, 18, 0xff6666, 0.8);
    shockwave.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: shockwave, scale: 3.2, alpha: 0, duration: 450, onComplete: () => shockwave.destroy() });
  }

  reindexWagons() {
    for (let i = 0; i < this.wagons.length; i++) {
      const wagon = this.wagons[i];
      if (wagon && typeof wagon.updateMultiplierAfterDetach === 'function') {
        wagon.updateMultiplierAfterDetach(i);
      }
    }
    if (this.wagonCountText) {
      this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
    }
  }

  getTotalWagonMultiplier() {
    let total = 1;
    for (const wagon of this.wagons) {
      if (wagon.isConnected && wagon.isActive()) {
        total *= wagon.getMultiplier();
      }
    }
    return total;
  }

  hasActiveWagons() {
    return this.wagons.some(wagon => wagon.isActive() && wagon.isConnected);
  }

  getActiveWagonCount() {
    return this.wagons.filter(wagon => wagon.isActive() && wagon.isConnected).length;
  }

  updateDifficulty() {
    const diff = this.getDifficulty();
    this.baseSpeed = diff.speed;
    this.gapSize = diff.gap;
    this.spawnDelay = diff.spawnDelay;
    if (!this.bonusActive) {
      this.currentSpeed = this.baseSpeed;
    }
    this.updateExistingObjectsSpeed();
    console.log(`Уровень ${this.gameLevel}: скорость ${this.baseSpeed}px/с, зазор ${this.gapSize}px`);
  }

  updateExistingObjectsSpeed() {
    if (this.gateGroup) {
      this.gateGroup.getChildren().forEach(gate => {
        if (gate && gate.body) {
          gate.body.velocity.x = -this.baseSpeed;
          gate.body.velocity.y = 0;
          gate.body.setGravityY(0);
          gate.body.setAllowGravity(false);
        }
      });
    }
    if (this.scoreZones) {
      this.scoreZones.forEach(zone => {
        if (zone && zone.body) {
          zone.body.velocity.x = -this.baseSpeed;
          zone.body.velocity.y = 0;
          zone.body.setGravityY(0);
          zone.body.setAllowGravity(false);
        }
      });
    }
  }

  getDifficulty() {
    const level = Math.min(this.gameLevel, 20);
    const worldBonus = this.world * 0.1;
    const baseSpeed = 240 * (1 + worldBonus);
    const speed = Math.floor(baseSpeed * Math.pow(1.05, level));
    const baseGap = 240;
    const gap = Math.max(140, Math.floor(baseGap - level * 3));
    const baseDelay = 1500;
    const spawnDelay = Math.max(600, Math.floor(baseDelay - level * 30));
    const asteroidChance = Math.min(0.5, 0.12 + level * 0.012);
    const powerUpChance = Math.min(0.25, 0.08 + level * 0.008);
    const coinChance = Math.min(0.85, 0.7 + level * 0.008);
    return { speed: Math.max(200, speed), gap: Math.max(120, gap), spawnDelay: Math.max(400, spawnDelay), coinChance, asteroidChance, powerUpChance };
  }

  updateWorldProgress() {
    if (!this.started || this.dead) return;
    const newGameLevel = Math.floor(this.levelProgress / 1000);
    if (newGameLevel > this.gameLevel) {
      this.gameLevel = newGameLevel;
      this.updateDifficulty();
    }
    if (this.levelProgress >= this.levelGoal) {
      this.completeWorldLevel();
    }
  }

  completeWorldLevel() {
    if (this.level < 9) {
      this.level++;
      this.levelProgress = 0;
      this.gameLevel = 0;
      if (this.levelManager) {
        this.levelManager.switchLevel(this.level);
      }
      const w = this.scale.width;
      const levelText = this.add.text(w / 2, 200, `УРОВЕНЬ МИРА ${this.level + 1}`, {
        fontSize: '28px', fontFamily: "'Orbitron', sans-serif", color: '#00ffff',
        stroke: '#ff00ff', strokeThickness: 4
      }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
      this.tweens.add({ targets: levelText, alpha: 0, duration: 2000, onComplete: () => levelText.destroy() });
      this.crystals += 50;
      if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
      if (gameManager.data) {
        gameManager.data.crystals = this.crystals;
        gameManager.save();
      }
      if (gameManager.unlockLevel) {
        gameManager.unlockLevel(this.world, this.level);
      }
      this.checkStationSpawn();
      if (this.questSystem) {
        this.questSystem.updateProgress('level', 1);
      }
    } else {
      this.completeWorld();
    }
  }

  completeWorld() {
    if (this.world < 4) {
      this.world++;
      this.level = 0;
      this.levelProgress = 0;
      this.gameLevel = 0;
      this.worldConfig = LEVEL_CONFIG[this.world] || LEVEL_CONFIG[0];
      if (this.levelManager) {
        this.levelManager.switchLevel(0);
      }
      this.gateTextures = this.worldConfig.gateColors || ['gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'];
      const worldName = this.worldConfig.name || `МИР ${this.world + 1}`;
      const w = this.scale.width;
      const worldText = this.add.text(w / 2, 200, worldName, {
        fontSize: '32px', fontFamily: "'Orbitron', sans-serif", color: '#ff00ff',
        stroke: '#00ffff', strokeThickness: 4
      }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
      this.tweens.add({ targets: worldText, alpha: 0, duration: 2000, onComplete: () => worldText.destroy() });
      this.crystals += 200;
      if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
      if (gameManager.data) {
        gameManager.data.crystals = this.crystals;
        gameManager.save();
      }
      if (gameManager.setCurrentWorld) {
        gameManager.setCurrentWorld(this.world);
      }
      if (gameManager.setCurrentLevel) {
        gameManager.setCurrentLevel(this.level);
      }
      gameManager.save();
    }
  }

  create() {
    console.log('PlayScene: create started');
    const w = this.scale.width;
    const h = this.scale.height;

    this.world = gameManager.getCurrentWorld?.() || 0;
    this.level = gameManager.getCurrentLevel?.() || 0;
    this.levelGoal = 10000;
    this.levelProgress = 0;
    this.worldConfig = LEVEL_CONFIG[this.world] || LEVEL_CONFIG[0];

    this.score = 0;
    this.crystals = gameManager.data?.crystals || 0;
    this.meters = 0;
    this.best = Number(localStorage.getItem('skypulse_best') || 0);

    this.wagons = [];
    this.collectedCoins = 0;
    this.coinsForWagon = 10;
    this.maxWagons = 12 + ((gameManager.data?.upgrades?.maxWagons) || 0) * 2;
    this.wagonGap = 52 - ((gameManager.data?.upgrades?.wagonGap) || 0) * 2;
    this.wagonSpring = 0.25;
    this.targetPlayerX = 110;
    this.playerXSpeed = 0.05;
    this.maxTargetX = 200;

    this.started = false;
    this.dead = false;
    this.gameLevel = 0;
    this.isPaused = false;
    this.pauseOverlay = null;
    this.pauseTexts = [];
    this.countdownActive = false;
    this.shopVisible = false;
    this.shopElements = [];

    this.maxHeadHP = 3 + ((gameManager.data?.upgrades?.headHP) || 0);
    this.headHP = this.maxHeadHP;
    this.wagonBaseHP = 1 + ((gameManager.data?.upgrades?.wagonHP) || 0);

    this.baseSpeed = 240;
    this.currentSpeed = 240;
    this.gapSize = 240;
    this.spawnDelay = 1300;
    this.gateTextures = this.worldConfig.gateColors || ['gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'];

    this.bonusActive = false;
    this.bonusType = null;
    this.bonusTime = 0;
    this.bonusMultiplier = 1;
    this.bonusTimer = null;
    this.shieldActive = false;
    this.magnetActive = false;
    this.magnetRange = 220 + ((gameManager.data?.upgrades?.magnetRange) || 0) * 40;
    this.lastBonusTime = 0;
    this.shieldDuration = 5 + ((gameManager.data?.upgrades?.shieldDuration) || 0) * 1.5;
    this.powerUpActive = {};
    this.activePowerUps = [];

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

    this.weaponDamage = 1;
    this.weaponBulletSpeed = 400;
    this.weaponFireDelay = 500;
    this.weaponCooldown = 0;

    this.pipes = [];
    this.coins = [];
    this.scoreZones = [];
    this.stars = [];
    this.planets = [];
    this.ships = [];
    this.asteroids = [];
    this.powerUps = [];

    this.gateGroup = this.physics.add.group();
    this.coinGroup = this.add.group();
    this.asteroidGroup = this.physics.add.group();
    this.powerUpGroup = this.physics.add.group();
    this.playerBullets = this.physics.add.group({ classType: Phaser.GameObjects.Image, runChildUpdate: false, allowGravity: false });
    this.enemyBullets = this.physics.add.group({ classType: Phaser.GameObjects.Image, runChildUpdate: false });
    this.enemyGroup = this.physics.add.group();

    this.spawnTimer = null;
    this.stationTimer = null;
    this.resumeCountdownTimer = null;

    this.stationPlanet = null;
    this.stationActive = false;

    this.initAchievements();
    this.initDailyRewards();
    this.initLeaderboard();
    this.initStats();

    this.createBackground();
    this.createPlanets();
    this.createShips();
    this.createPlayer();
    this.createUI();

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

    if (audioManager && typeof audioManager.playMusic === 'function') {
      audioManager.playMusic(this, 0.2);
    }

    console.log('PlayScene: create completed');
  }

  update(time, delta) {
    if (this.isPaused || this.countdownActive) return;
    this.updateBackground(delta);
    if (!this.started || this.dead || !this.player) return;
    this.updatePlayerMovement();
    this.updateBonuses(delta);
    this.updateWorldProgress();
    this.updateObjects(delta);
    this.checkAchievementsAndRecords();
    this.updateStars(time, delta);
    this.updatePlanets(delta);
    this.updateShips(delta);
    this.updateAsteroids(delta);

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

    if (this.weaponCooldown > 0) this.weaponCooldown -= delta;
    this.targetPlayerX = Math.min(this.maxTargetX, this.targetPlayerX);
    this.player.x += (this.targetPlayerX - this.player.x) * this.playerXSpeed;
    const body = this.player.body;
    if (body) {
      this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75));
    }
    if (!this.shieldActive && (this.player.y < -50 || this.player.y > this.scale.height + 50)) {
      this.handleDeath();
      return;
    }

    if (this.magnetActive && this.coinGroup) {
      const magnetCoins = this.coinGroup.getChildren();
      for (let coin of magnetCoins) {
        if (!coin || !coin.active) continue;
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
    if (this.level >= 1 && this.waveManager) {
      this.waveManager.update(time, delta, this.player);
    }
    if (this.specialEventManager) {
      this.specialEventManager.update(delta);
    }

    const distanceDelta = (this.currentSpeed * delta) / 1000 / 10;
    this.meters += distanceDelta;
    this.levelProgress += distanceDelta;
    if (this.meterText) {
      this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
    }

    this.updateWorldProgress();

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

    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i];
      if (coin && coin.isActive()) {
        coin.update(delta);
      }
    }

    this.coinGroup.getChildren().forEach(coinSprite => {
      const coin = coinSprite.coinRef;
      if (coin && !coin.collected && coin.isActive()) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), coinSprite.getBounds())) {
          this.collectCoin(coin);
        }
      }
    });

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

    if (this.updatePlayerEffects) this.updatePlayerEffects();
    if (this.updateMultiplier) this.updateMultiplier();
    if (this.checkWaveAchievements) this.checkWaveAchievements();
    if (this.createComboEffect) this.createComboEffect();
    if (this.checkNewRecords) this.checkNewRecords();
    this.checkQuests();
    if (this.updateRealTimeStats) this.updateRealTimeStats();
    if (this.checkMaxCombo) this.checkMaxCombo();
    if (this.checkPerformance) this.checkPerformance();
    if (this.optimizeMemory) this.optimizeMemory();
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ ВОРОТ
  // =========================================================================

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
  }

  spawnGate() {
    if (this.dead) return;
    const w = this.scale.width, h = this.scale.height;
    const difficulty = this.getDifficulty();
    const gateTexture = this.gateTextures[Math.min(this.level, 4)];
    const gap = difficulty.gap + Phaser.Math.Between(-15, 15);
    const centerY = Phaser.Math.Between(120, h - 120);
    const topY = centerY - gap / 2;
    const bottomY = centerY + gap / 2;
    const x = w;

    const topPipe = this.physics.add.image(x, topY, gateTexture)
      .setOrigin(0.5, 1)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, topY / 400))
      .setVelocityX(-difficulty.speed);
    topPipe.body.setAllowGravity(false);
    topPipe.setBlendMode(Phaser.BlendModes.ADD);

    const bottomPipe = this.physics.add.image(x, bottomY, gateTexture)
      .setOrigin(0.5, 0)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, (h - bottomY) / 400))
      .setVelocityX(-difficulty.speed);
    bottomPipe.body.setAllowGravity(false);
    bottomPipe.setBlendMode(Phaser.BlendModes.ADD);

    [topPipe, bottomPipe].forEach(pipe => {
      pipe.setScale(1, 0.01);
      this.tweens.add({ targets: pipe, scaleY: pipe.scaleY, duration: 300, ease: 'Back.out' });
    });

    if (this.level >= 2 && Math.random() < 0.4) {
      const moveDistance = Phaser.Math.Between(-50, 50);
      const tween = this.tweens.add({ targets: [topPipe, bottomPipe], y: `+=${moveDistance}`, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      topPipe.tween = tween;
      bottomPipe.tween = tween;
    }

    this.pipes.push(topPipe, bottomPipe);
    this.physics.add.collider(this.player, topPipe, (p, pi) => this.hitPipe(p, pi), null, this);
    this.physics.add.collider(this.player, bottomPipe, (p, pi) => this.hitPipe(p, pi), null, this);

    const zone = this.add.zone(x + 60, h / 2, 12, h);
    this.physics.add.existing(zone);
    zone.body.setAllowGravity(false);
    zone.body.setImmovable(true);
    zone.body.setVelocityX(-difficulty.speed);
    zone.body.setSize(12, h);
    this.physics.add.overlap(this.player, zone, () => this.passGateWithCombo(zone), null, this);
    this.scoreZones.push(zone);

    if (Math.random() < difficulty.coinChance) this.spawnCoin(x, centerY);
    if (Math.random() < difficulty.asteroidChance) this.spawnAsteroid();
    if (Math.random() < difficulty.powerUpChance) this.spawnPowerUp(x + 100, centerY);
  }

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
    try { if (this.hitSound) this.hitSound.play(); } catch (e) {}
    if (this.headHP <= 0) {
      this.handleDeath();
    } else {
      if (this.player && this.player.active) {
        this.player.setTint(0xff8888);
        this.time.delayedCall(500, () => {
          if (this.player) this.player.clearTint();
        });
      }
    }
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ АСТЕРОИДОВ
  // =========================================================================

  spawnAsteroid() {
    const spawnChance = 0.15 + (this.gameLevel * 0.01);
    if (Math.random() > spawnChance) return;
    const w = this.scale.width;
    const h = this.scale.height;
    const x = w + Phaser.Math.Between(50, 150);
    const y = Phaser.Math.Between(80, h - 80);
    const asteroid = new Asteroid(this, x, y, this.world, this.gameLevel);
    this.asteroids.push(asteroid);
    this.asteroidGroup.add(asteroid.sprite);

    this.physics.add.overlap(this.player, asteroid.sprite, (player, astSprite) => {
      const ast = astSprite.asteroidRef;
      if (ast?.isActive()) {
        if (this.shieldActive) {
          this.particleManager.createBonusEffect('shield', ast.sprite.x, ast.sprite.y);
          if (this.player.body) this.player.body.setVelocityY(-100);
        } else {
          this.headHP -= ast.damage;
          this.updateHearts();
          try { audioManager.playSound(this, 'hit_sound', 0.3); } catch(e) {}
          if (this.headHP <= 0) this.handleDeath();
        }
        ast.destroy(true);
        this.asteroids = this.asteroids.filter(a => a !== ast);
      }
    }, null, this);

    this.physics.add.overlap(this.wagons, asteroid.sprite, (wagon, astSprite) => {
      const ast = astSprite.asteroidRef;
      if (ast?.isActive() && wagon?.active) {
        if (wagon.takeDamage) {
          const destroyed = wagon.takeDamage(ast.damage);
          if (destroyed) {
            this.wagons = this.wagons.filter(w => w !== wagon);
          }
        }
        ast.destroy(true);
        this.asteroids = this.asteroids.filter(a => a !== ast);
      }
    }, null, this);

    this.physics.add.overlap(this.playerBullets, asteroid.sprite, (bullet, astSprite) => {
      const ast = astSprite.asteroidRef;
      if (ast?.isActive() && bullet?.active) {
        const killed = ast.takeDamage(bullet.damage || 1);
        bullet.destroy();
        if (killed) {
          this.asteroids = this.asteroids.filter(a => a !== ast);
        }
      }
    }, null, this);
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ УСИЛИТЕЛЕЙ
  // =========================================================================

  spawnPowerUp(x, y) {
    const types = ['booster', 'shield', 'magnet', 'slowmo'];
    const type = types[Math.floor(Math.random() * types.length)];
    const powerUp = new PowerUp(this, x, y, type);
    this.powerUps.push(powerUp);
    if (powerUp.sprite) {
      this.powerUpGroup.add(powerUp.sprite);
    }
    if (this.player) {
      this.physics.add.overlap(this.player, powerUp.sprite, (p, pu) => {
        if (powerUp && typeof powerUp.collect === 'function') {
          powerUp.collect(this.player);
        }
        this.powerUps = this.powerUps.filter(pw => pw.sprite !== pu);
      }, null, this);
    }
  }

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
    this.time.delayedCall(duration * 1000, () => { this.deactivatePowerUp(type); });
  }

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

  showPowerUpNotification(text, duration) {
    const w = this.scale.width;
    const notification = this.add.text(w / 2, 120, text, {
      fontSize: '20px', fontFamily: "'Orbitron', monospace", color: '#00ff00',
      stroke: '#ffff00', strokeThickness: 2, shadow: { blur: 10, color: '#00ff00', fill: true }
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    this.tweens.add({ targets: notification, alpha: 0, duration: duration * 1000, ease: 'Power2.easeOut', onComplete: () => notification.destroy() });
  }

  // =========================================================================
  // АКТИВАЦИЯ БОНУСОВ
  // =========================================================================

  activateBonus(type) {
    const now = Date.now();
    if (now - this.lastBonusTime < 300) return;
    this.lastBonusTime = now;
    if (this.bonusActive) this.deactivateBonus();
    this.bonusActive = true;
    this.bonusType = type;
    this.bonusTime = this.shieldDuration;

    const config = {
      speed: { color: 0xffff00, textColor: '#ffff00', emoji: '🚀', speedMult: 1.5, multiplier: 2, scale: 1.1, particles: { count: 6, radius: 40 } },
      shield: { color: 0x00ffff, textColor: '#00ffff', emoji: '🛡️', shield: true, particles: { count: 8, radius: 45 } },
      magnet: { color: 0xff00ff, textColor: '#ff00ff', emoji: '🧲', magnet: true, range: 350, particles: { count: 6, radius: 50 } },
      slow: { color: 0xff8800, textColor: '#ff8800', emoji: '⏳', speedMult: 0.6, particles: { count: 6, radius: 40 } }
    };
    const cfg = config[type];

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
          this.createOrbitalEffect(type, cfg.color, cfg.particles.radius, cfg.particles.count, false);
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

    if (this.bonusText) {
      this.bonusText.setColor(cfg.textColor).setText(`${cfg.emoji} ${Math.ceil(this.bonusTime)}с`).setVisible(true);
    }
    if (this.particleManager) {
      this.particleManager.createBonusEffect(type, this.player?.x, this.player?.y);
    }
    this.updatePlayerVisuals();

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
    this.playBonusSound(type);
  }

  pulsePlayer(scale) {
    if (!this.player) return;
    this.tweens.add({ targets: this.player, scaleX: scale, scaleY: scale, duration: 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  createOrbitalEffect(type, color, radius, count = 6, isSlow = false, size = 3) {
    const particleKey = `${type}OrbitalParticles`;
    const tweenKey = `${type}OrbitalTween`;
    this.cleanupOrbitalEffects(type);
    this[particleKey] = [];
    const textureKey = this.textures.exists('flare') ? 'flare' : '__DEFAULT';
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const particle = this.add.image(this.player.x + Math.cos(angle) * radius, this.player.y + Math.sin(angle) * radius, textureKey);
      particle.setScale(size * 0.1);
      particle.setTint(color);
      particle.setAlpha(0.8);
      particle.setDepth(14);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this[particleKey].push(particle);
    }
    const duration = isSlow ? 4000 : 2500;
    this[tweenKey] = this.tweens.addCounter({
      from: 0, to: Math.PI * 2, duration: duration, repeat: -1,
      onUpdate: (tween) => {
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

  cleanupOrbitalEffects(type) {
    const particleKey = `${type}OrbitalParticles`;
    const tweenKey = `${type}OrbitalTween`;
    if (this[particleKey]) {
      this[particleKey].forEach(p => p?.destroy());
      this[particleKey] = null;
    }
    if (this[tweenKey]) {
      this[tweenKey].stop();
      this[tweenKey] = null;
    }
  }

  createSpeedLines() {
    if (this.speedLinesEmitter) {
      this.speedLinesEmitter.stop();
      this.speedLinesEmitter.destroy();
    }
    const textureKey = this.textures.exists('flare') ? 'flare' : '__DEFAULT';
    this.speedLinesEmitter = this.add.particles(0, 0, textureKey, {
      x: this.player.x, y: this.player.y,
      speed: { min: 200, max: 400 }, angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 }, alpha: { start: 0.6, end: 0 },
      lifespan: 300, quantity: 2, frequency: 50,
      blendMode: Phaser.BlendModes.ADD, tint: 0xffff00,
      follow: this.player, followOffset: { x: -20, y: 0 }
    });
    if (this.speedLinesEmitter) this.speedLinesEmitter.setDepth(12);
  }

  createSpeedIndicator() {
    if (this.speedIndicator) this.speedIndicator.destroy();
    this.speedIndicator = this.add.graphics();
    this.speedIndicator.setDepth(25);
    this.speedDuration = this.shieldDuration;
    this.tweens.add({ targets: this.speedIndicator, alpha: { from: 0.8, to: 0.3 }, duration: 300, yoyo: true, repeat: -1 });
  }

  createShieldEffect() {
    this.cleanupGraphics('shield');
    this.shieldGraphics = this.add.graphics();
    this.shieldGraphics.setDepth(14);
    const textureKey = this.textures.exists('flare') ? 'flare' : '__DEFAULT';
    this.shieldParticles = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.add.image(this.player.x + Math.cos(angle) * 45, this.player.y + Math.sin(angle) * 45, textureKey);
      particle.setScale(0.3);
      particle.setTint(0x00ffff);
      particle.setAlpha(0.8);
      particle.setDepth(14);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this.shieldParticles.push(particle);
    }
    this.shieldRotationTween = this.tweens.addCounter({
      from: 0, to: Math.PI * 2, duration: 2000, repeat: -1,
      onUpdate: (tween) => {
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

  createMagnetField() {
    this.cleanupGraphics('magnet');
    this.magnetGraphics = this.add.graphics();
    this.magnetGraphics.setDepth(14);
    this.magnetPulseTween = this.tweens.add({
      targets: { scale: 1 }, scale: 1.3, duration: 800, yoyo: true, repeat: -1,
      onUpdate: (tween) => {
        if (!this.magnetGraphics || !this.player) return;
        const target = tween.targets[0];
        this.magnetGraphics.clear();
        this.magnetGraphics.lineStyle(3, 0xff00ff, 0.4);
        this.magnetGraphics.strokeCircle(this.player.x, this.player.y, this.magnetRange * target.scale);
        this.magnetGraphics.lineStyle(2, 0xff88ff, 0.6);
        this.magnetGraphics.strokeCircle(this.player.x, this.player.y, this.magnetRange * 0.7);
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

  createMagnetParticles() {
    if (this.magnetParticles) this.magnetParticles.destroy();
    const textureKey = this.textures.exists('flare') ? 'flare' : '__DEFAULT';
    this.magnetParticles = this.add.particles(0, 0, textureKey, {
      x: this.player.x, y: this.player.y,
      speed: { min: 30, max: 80 }, angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 }, alpha: { start: 0.8, end: 0 },
      lifespan: 600, quantity: 2, frequency: 80,
      blendMode: Phaser.BlendModes.ADD, tint: [0xff00ff, 0xff88ff],
      follow: this.player
    });
    if (this.magnetParticles) this.magnetParticles.setDepth(13);
  }

  createSlowMotionEffect() {
    this.cleanupGraphics('slow');
    this.slowMotionGraphics = this.add.graphics();
    this.slowMotionGraphics.setDepth(14);
    this.slowMotionTween = this.tweens.add({
      targets: {}, duration: 1000, repeat: -1,
      onUpdate: () => {
        if (!this.slowMotionGraphics || !this.player) return;
        this.slowMotionGraphics.clear();
        const time = Date.now() * 0.003;
        const radius = 30 + Math.sin(time) * 10;
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + time * 0.5;
          const x = this.player.x + Math.cos(angle) * radius;
          const y = this.player.y + Math.sin(angle) * radius;
          const isMain = i % 3 === 0;
          this.slowMotionGraphics.fillStyle(0xffaa00, isMain ? 0.9 : 0.5);
          this.slowMotionGraphics.fillCircle(x, y, isMain ? 4 : 3);
        }
        const hourAngle = time * 0.3;
        const minAngle = time * 1.5;
        this.slowMotionGraphics.lineStyle(2, 0xffaa00, 0.8);
        this.slowMotionGraphics.lineBetween(this.player.x, this.player.y, this.player.x + Math.cos(minAngle) * radius * 0.85, this.player.y + Math.sin(minAngle) * radius * 0.85);
        this.slowMotionGraphics.lineStyle(3, 0xff8800, 0.9);
        this.slowMotionGraphics.lineBetween(this.player.x, this.player.y, this.player.x + Math.cos(hourAngle) * radius * 0.6, this.player.y + Math.sin(hourAngle) * radius * 0.6);
        this.slowMotionGraphics.lineStyle(2, 0xffaa00, 0.6);
        this.slowMotionGraphics.strokeCircle(this.player.x, this.player.y, radius);
      }
    });
    if (this.slowParticles) this.slowParticles.destroy();
    const textureKey = this.textures.exists('flare') ? 'flare' : '__DEFAULT';
    this.slowParticles = this.add.particles(0, 0, textureKey, {
      x: this.player.x, y: this.player.y,
      speed: { min: 20, max: 50 }, angle: { min: 0, max: 360 },
      scale: { start: 0.2, end: 0 }, alpha: { start: 0.5, end: 0 },
      lifespan: 1000, quantity: 1, frequency: 150,
      blendMode: Phaser.BlendModes.ADD, tint: 0xffaa00,
      follow: this.player
    });
    if (this.slowParticles) this.slowParticles.setDepth(13);
  }

  updateBonusEffects(type) {
    if (!this.player) return;
    switch (type) {
      case 'speed':
        if (this.speedLinesEmitter) {
          const intensity = Math.max(0.3, Math.min(1, this.bonusTime / 2));
          this.speedLinesEmitter.setFrequency(50 / intensity);
        }
        if (this.speedIndicator) {
          this.speedIndicator.clear();
          this.speedIndicator.lineStyle(2, 0xffff00, 0.8);
          const progress = 1 - (this.bonusTime / this.shieldDuration);
          this.speedIndicator.strokeCircle(this.player.x, this.player.y - 50, 20 + progress * 10);
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
    }
  }

  playBonusSound(type) {
    try {
      const soundKey = `${type}_sound`;
      if (soundKey && this.cache.audio.has(soundKey)) {
        const sound = this.sound.add(soundKey, { volume: 0.5 });
        sound.play();
      } else if (this.itemSound) {
        this.itemSound.play();
      }
    } catch (e) {}
  }

  deactivateBonus() {
    if (!this.bonusActive) return;
    this.particleManager.clearAll();
    this.currentSpeed = this.baseSpeed;
    this.bonusActive = false;
    this.bonusType = null;
    this.shieldActive = false;
    this.magnetActive = false;
    if (this.player) {
      this.player.shieldActive = false;
      this.player.magnetActive = false;
      this.player.speedBoost = 1;
      this.player.clearTint();
      this.tweens.killTweensOf(this.player);
      this.player.setScale(0.9);
    }
    this.bonusMultiplier = 1;
    this.currentSpeed = this.baseSpeed;
    if (this.bonusText) this.bonusText.setVisible(false);
    this.updatePlayerVisuals();
    if (this.bonusTimer) {
      this.bonusTimer.remove();
      this.bonusTimer = null;
    }
    this.cleanupAllEffects();
  }

  cleanupAllEffects() {
    if (this.speedLinesEmitter) {
      this.speedLinesEmitter.stop();
      if (typeof this.speedLinesEmitter.destroy === 'function') this.speedLinesEmitter.destroy();
      this.speedLinesEmitter = null;
    }
    if (this.magnetParticles) {
      this.magnetParticles.stop();
      if (typeof this.magnetParticles.destroy === 'function') this.magnetParticles.destroy();
      this.magnetParticles = null;
    }
    if (this.slowParticles) {
      this.slowParticles.stop();
      if (typeof this.slowParticles.destroy === 'function') this.slowParticles.destroy();
      this.slowParticles = null;
    }
    if (this.speedIndicator) {
      if (typeof this.speedIndicator.destroy === 'function') this.speedIndicator.destroy();
      this.speedIndicator = null;
    }
    ['shield', 'magnet', 'slow'].forEach(type => { this.cleanupGraphics(type); });
    ['speed', 'shield', 'magnet', 'slow'].forEach(type => { this.cleanupOrbitalEffects(type); });
    if (this.shieldParticles) {
      this.shieldParticles.forEach(p => { if (p && typeof p.destroy === 'function') p.destroy(); });
      this.shieldParticles = null;
    }
  }

  cleanupGraphics(type) {
    const graphicsKey = `${type}Graphics`;
    const particlesKey = `${type}Particles`;
    const pulseTweenKey = `${type}PulseTween`;
    const rotationTweenKey = `${type}RotationTween`;
    if (this[graphicsKey]) {
      if (typeof this[graphicsKey].destroy === 'function') this[graphicsKey].destroy();
      this[graphicsKey] = null;
    }
    if (this[particlesKey]) {
      if (typeof this[particlesKey].destroy === 'function') this[particlesKey].destroy();
      else if (typeof this[particlesKey].stop === 'function') this[particlesKey].stop();
      this[particlesKey] = null;
    }
    if (this[pulseTweenKey]) {
      if (typeof this[pulseTweenKey].stop === 'function') this[pulseTweenKey].stop();
      this[pulseTweenKey] = null;
    }
    if (this[rotationTweenKey]) {
      if (typeof this[rotationTweenKey].stop === 'function') this[rotationTweenKey].stop();
      this[rotationTweenKey] = null;
    }
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

  // =========================================================================
  // ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ
  // =========================================================================

  updatePlayerEffects() {
    if (!this.player) return;
    if (this.shieldActive && !this.shieldGraphics) {
      this.shieldGraphics = this.add.graphics();
      this.shieldGraphics.setDepth(14);
      this.tweens.add({ targets: this.shieldGraphics, alpha: { from: 0.8, to: 0.3 }, duration: 500, repeat: -1, yoyo: true });
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
    const colors = { speed: 0xffff00, shield: 0x00ffff, magnet: 0xff00ff, slow: 0xff8800 };
    return colors[type] || 0x00ffff;
  }

  checkWaveAchievements() {
    if (!this.waveManager || !this.achievements) return;
    const waveIndex = this.waveManager.currentWave;
    if (waveIndex >= 3 && this.achievements.wave_3 && !this.achievements.wave_3.unlocked) this.unlockAchievement('wave_3');
    if (waveIndex >= 5 && this.achievements.wave_5 && !this.achievements.wave_5.unlocked) this.unlockAchievement('wave_5');
    if (waveIndex >= 10 && this.achievements.wave_10 && !this.achievements.wave_10.unlocked) this.unlockAchievement('wave_10');
  }

  checkNewRecords() {
    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('skypulse_best', String(this.best));
      if (this.bestText) this.bestText.setText(`🏆 ${this.best}`);
      this.showNotification('НОВЫЙ РЕКОРД!', 2000, '#ffff00');
      try { if (this.levelUpSound) this.levelUpSound.play(); } catch (e) {}
    }
    const bestDistance = parseInt(localStorage.getItem('skypulse_best_distance') || '0');
    if (Math.floor(this.meters) > bestDistance) {
      localStorage.setItem('skypulse_best_distance', String(Math.floor(this.meters)));
      this.showNotification('НОВЫЙ РЕКОРД РАССТОЯНИЯ!', 2000, '#00ffff');
    }
  }

  createLevelEffect() {
    const w = this.scale.width;
    const h = this.scale.height;
    const emitter = this.add.particles(w / 2, h / 2, 'flare', {
      speed: { min: -300, max: 300 }, scale: { start: 2, end: 0 }, alpha: { start: 1, end: 0 },
      lifespan: 800, quantity: 50, blendMode: Phaser.BlendModes.ADD,
      tint: [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00]
    });
    emitter.explode(50);
  }

  updateMultiplier() {
    if (!this.multiplierSystem) return;
    const multiplier = this.multiplierSystem.getMultiplier();
    if (multiplier > 1) {
      if (!this.multiplierText) {
        this.multiplierText = this.add.text(this.scale.width / 2, 80, '', {
          fontSize: '16px', fontFamily: "'Orbitron', monospace", color: '#ffff00',
          stroke: '#ff8800', strokeThickness: 2
        }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
      }
      this.multiplierText.setText(`x${multiplier.toFixed(1)}`);
      this.multiplierText.setVisible(true);
    } else if (this.multiplierText) {
      this.multiplierText.setVisible(false);
    }
  }

  checkQuests() {
    if (!this.questSystem) return;
    if (typeof this.questSystem.getActiveQuests === 'function') {
      const activeQuests = this.questSystem.getActiveQuests();
      if (activeQuests && typeof activeQuests === 'object' && !Array.isArray(activeQuests)) {
        if (Array.isArray(activeQuests.daily)) {
          for (let quest of activeQuests.daily) {
            if (quest.completed && !quest.claimed) {
              quest.claimed = true;
              this.crystals += quest.reward || 0;
              if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
              this.showNotification(`Квест выполнен! +${quest.reward || 0} 💎`, 2000, '#00ff00');
            }
          }
        }
        if (Array.isArray(activeQuests.weekly)) {
          for (let quest of activeQuests.weekly) {
            if (quest.completed && !quest.claimed) {
              quest.claimed = true;
              this.crystals += quest.reward || 0;
              if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
              this.showNotification(`Еженедельный квест выполнен! +${quest.reward || 0} 💎`, 2000, '#ffaa00');
            }
          }
        }
        if (Array.isArray(activeQuests.event)) {
          for (let quest of activeQuests.event) {
            if (quest.completed && !quest.claimed) {
              quest.claimed = true;
              this.crystals += quest.reward || 0;
              if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
              this.showNotification(`Ивентовый квест выполнен! +${quest.reward || 0} 💎`, 2000, '#ff44ff');
            }
          }
        }
      } else if (Array.isArray(activeQuests)) {
        for (let quest of activeQuests) {
          if (quest.completed && !quest.claimed) {
            quest.claimed = true;
            this.crystals += quest.reward || 0;
            if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
            this.showNotification(`Квест выполнен! +${quest.reward || 0} 💎`, 2000, '#00ff00');
          }
        }
      }
    }
  }

  updateRealTimeStats() {
    if (this.scoreText) this.scoreText.setText(String(this.score));
    if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
    if (this.meterText) this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
    if (this.wagonCountText) this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
  }

  checkMaxCombo() {
    if (!this.comboSystem) return;
    if (this.comboSystem.combo > this.comboSystem.maxCombo) {
      this.comboSystem.maxCombo = this.comboSystem.combo;
      if (this.comboSystem.maxCombo >= 5 && this.comboSystem.maxCombo % 5 === 0) {
        let color = '#ffff00';
        let icon = '⭐';
        if (this.comboSystem.maxCombo >= 20) { color = '#ff00ff'; icon = '👑'; }
        else if (this.comboSystem.maxCombo >= 10) { color = '#ff5500'; icon = '🔥'; }
        this.showNotification(`${icon} ${this.comboSystem.maxCombo} x ${icon}`, 1500, color);
      }
    }
  }

  checkPerformance() {
    const fps = this.game.loop.actualFps;
    if (fps < 20) console.log('FPS low:', fps);
  }

  optimizeMemory() {
    const now = Date.now();
    if (!this.lastOptimizeTime || now - this.lastOptimizeTime > 5000) {
      this.lastOptimizeTime = now;
      if (this.pipes) this.pipes = this.pipes.filter(p => p && p.active);
      if (this.coins) this.coins = this.coins.filter(c => c && c.active);
      if (this.asteroids) this.asteroids = this.asteroids.filter(a => a && a.sprite && a.sprite.active);
      if (this.powerUps) this.powerUps = this.powerUps.filter(p => p && p.sprite && p.sprite.active);
    }
  }

  createBonusVisualEffect(type) {
    if (!this.player || !this.player.active) return;
    this.tweens.add({ targets: this.player, scaleX: 1.1, scaleY: 1.1, duration: 100, yoyo: true, ease: 'Quad.out' });
    if (!this.lowPerformanceMode) {
      const colors = { speed: 0xffff00, shield: 0x00ffff, magnet: 0xff00ff, slow: 0xff8800 };
      const color = colors[type] || 0x00ffff;
      const emitter = this.add.particles(this.player.x, this.player.y, 'flare', {
        speed: { min: 50, max: 100 }, scale: { start: 0.5, end: 0 }, alpha: { start: 0.5, end: 0 },
        lifespan: 200, quantity: 3, blendMode: Phaser.BlendModes.ADD, tint: color
      });
      emitter.explode(3);
      this.time.delayedCall(300, () => { if (emitter) emitter.destroy(); });
    }
  }

  showNotification(text, duration = 1500, color = '#ffffff') {
    const w = this.scale.width;
    const notification = this.add.text(w / 2, 80, text, {
      fontSize: '16px', fontFamily: "'Orbitron', monospace", color: color,
      stroke: '#000000', strokeThickness: 2, align: 'center'
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    notification.setAlpha(0);
    this.tweens.add({ targets: notification, alpha: 1, duration: 100 });
    this.tweens.add({ targets: notification, alpha: 0, delay: duration - 300, duration: 300, onComplete: () => notification.destroy() });
  }

  saveProgress() {
    if (gameManager.data) {
      gameManager.data.crystals = this.crystals;
      if (this.upgradeSystem) gameManager.data.upgrades = this.upgradeSystem.upgrades;
      gameManager.save();
    }
  }

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
        const isOutOfBounds = c.sprite && c.sprite.x < -100;
        const isInactive = !c.isActive || !c.isActive();
        if (isInactive || isOutOfBounds) {
          if (c && c.destroy) c.destroy();
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
      const scale = Phaser.Math.FloatBetween(0.2, 1.8);
      star.setScale(scale);
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
      star.setDepth(-25);
      this.stars.push({
        sprite: star, speed: Phaser.Math.Between(30, 80), baseSpeed: Phaser.Math.Between(30, 80),
        baseAlpha: Phaser.Math.FloatBetween(0.3, 0.9), scale: scale, flicker: Phaser.Math.FloatBetween(0.01, 0.03),
        x: star.x, y: star.y
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
      const scale = Phaser.Math.FloatBetween(2.0, 4.0);
      planet.setScale(scale);
      planet.setTint(0x8888ff);
      planet.setAlpha(0.6 + Math.random() * 0.3);
      planet.setDepth(-15);
      planet.setBlendMode(Phaser.BlendModes.ADD);
      this.planets.push({ sprite: planet, speed: Phaser.Math.Between(20, 80), baseSpeed: Phaser.Math.Between(20, 80), scale: scale, x: planet.x, y: planet.y });
    }
  }

  createShips() {
    const w = this.scale.width;
    const h = this.scale.height;
    const shipTextures = ['bg_ship_1', 'bg_ship_2'];
    for (let i = 0; i < 12; i++) {
      const tex = shipTextures[Math.floor(Math.random() * shipTextures.length)];
      const x = Phaser.Math.Between(w, w * 12);
      const y = Phaser.Math.Between(50, h - 50);
      const ship = this.add.image(x, y, tex);
      const scale = Phaser.Math.FloatBetween(0.5, 1.5);
      ship.setScale(scale);
      ship.setTint(0x00ffff);
      ship.setAlpha(0.7);
      ship.setDepth(-10);
      ship.setBlendMode(Phaser.BlendModes.ADD);
      this.ships.push({ sprite: ship, speed: Phaser.Math.Between(40, 120), baseSpeed: Phaser.Math.Between(40, 120), scale: scale, x: ship.x, y: ship.y });
    }
  }

  createPlayer() {
    const h = this.scale.height;
    let skin = 'player';
    try {
      const currentSkin = gameManager.getCurrentSkin?.();
      if (currentSkin && this.textures.exists(currentSkin)) skin = currentSkin;
      else if (this.textures.exists('player')) skin = 'player';
      else {
        console.warn('⚠️ Player texture not found, creating fallback');
        this.createFallbackTexture();
        skin = 'player_fallback';
      }
    } catch (e) {
      console.warn('Error getting skin, using default');
    }
    console.log(`✅ Creating player with skin: ${skin}`);
    this.player = this.physics.add.image(this.targetPlayerX, h / 2, skin);
    this.player.setScale(0.85);
    this.player.setCollideWorldBounds(false);
    this.player.setMaxVelocity(600, 1000);
    this.player.body.setCircle(22, 16, 8);
    this.player.setBlendMode(Phaser.BlendModes.ADD);
    this.player.body.setMass(10000);
    this.player.body.setDrag(500, 0);
    this.player.setDepth(15);
    this.player.setVisible(true);
    this.playerGlow = this.add.circle(this.targetPlayerX, h / 2, 32, 0x00ffff, 0.2);
    this.playerGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.playerGlow.setDepth(14);
    this.tweens.add({ targets: this.playerGlow, alpha: { from: 0.1, to: 0.3 }, scale: { from: 1, to: 1.2 }, duration: 800, yoyo: true, repeat: -1, onUpdate: () => { if (this.player?.active) this.playerGlow.setPosition(this.player.x, this.player.y); } });
    this.trailEmitter = this.add.particles(0, 0, 'flare', {
      speed: { min: 30, max: 60 }, scale: { start: 0.35, end: 0 }, alpha: { start: 0.6, end: 0 },
      lifespan: 250, blendMode: Phaser.BlendModes.ADD, follow: this.player, followOffset: { x: -18, y: 0 },
      quantity: 2, frequency: 18, tint: [0x00ffff, 0xff00ff, 0xffff00]
    });
    this.player.doubleCrystals = false;
    this.player.shieldActive = false;
    this.player.magnetActive = false;
    this.player.speedBoost = 1;
    this.player.invincible = false;
    this.initSounds();
  }

  createFallbackTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffaa00);
    graphics.fillRoundedRect(0, 0, 80, 60, 8);
    graphics.fillStyle(0xff8800);
    graphics.fillRoundedRect(8, 0, 64, 12, 4);
    graphics.fillStyle(0x44aaff);
    graphics.fillRect(12, 20, 20, 12);
    graphics.fillRect(44, 20, 20, 12);
    graphics.fillStyle(0x00ffff);
    graphics.fillCircle(18, 42, 5);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(18, 42, 3);
    graphics.generateTexture('player_fallback', 80, 60);
    graphics.destroy();
  }

  initSounds() {
    const sounds = [
      { key: 'coin_sound', volume: 0.4, prop: 'coinSound' },
      { key: 'item_sound', volume: 0.5, prop: 'itemSound' },
      { key: 'tap_sound', volume: 0.3, prop: 'tapSound' },
      { key: 'wagon_sound', volume: 0.6, prop: 'wagonSound' },
      { key: 'level_up_sound', volume: 0.5, prop: 'levelUpSound' },
      { key: 'purchase_sound', volume: 0.5, prop: 'purchaseSound' },
      { key: 'revive_sound', volume: 0.5, prop: 'reviveSound' }
    ];
    sounds.forEach(sound => {
      try {
        if (this.cache.audio.has(sound.key)) this[sound.prop] = this.sound.add(sound.key, { volume: sound.volume });
        else this[sound.prop] = null;
      } catch (e) { this[sound.prop] = null; }
    });
    this.hitSound = this.tapSound;
  }

    createUI() {
    const w = this.scale.width;
    const h = this.scale.height;


    // Контейнер сердечек
    this.heartContainer = this.add.container(12, 38).setDepth(10).setScrollFactor(0);
    this.updateHearts();

    // Интро текст
    this.introText = this.add.text(w / 2, h * 0.42, 'СОБИРАЙ МОНЕТЫ\nЧТОБЫ УДЛИНИТЬ ТАКСИ', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffffff',
      align: 'center',
      stroke: '#00ffff',
      strokeThickness: 2,
      lineSpacing: 10,
      shadow: { blur: 8, color: '#00ffff', fill: true }
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.tweens.add({
      targets: this.introText,
      alpha: { from: 0.7, to: 1 },
      scale: { from: 0.98, to: 1.02 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Подсказка о монетах
    this.coinTipsText = this.add.text(w / 2, h * 0.52, '🟡 Золото  |  🔴 Скорость  |  🔵 Щит  |  🟢 Магнит  |  🟣 Замедление', {
      fontSize: '8px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#cbd5e1',
      align: 'center'
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.createButtons();
    this.createGameOverBox();
    this.applySkinBonuses();
    this.setupCollisions();

    // Индикатор комбо
    this.createComboIndicator();
  }

  createNeonFrame() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.frameGraphics = this.add.graphics();
    this.frameGraphics.setScrollFactor(0); // ← фиксируем на экране
    this.frameGraphics.lineStyle(2, 0x00ffff, 0.3);
    this.frameGraphics.strokeRect(8, 8, w - 16, h - 16);

    this.tweens.add({
      targets: this.frameGraphics,
      alpha: { from: 0.2, to: 0.5 },
      duration: 2000,
      yoyo: true,
      repeat: -1
    });

    const cornerSize = 25;
    const corners = [
      { x: 8, y: 8, angle: 0 },
      { x: w - 8, y: 8, angle: 90 },
      { x: 8, y: h - 8, angle: -90 },
      { x: w - 8, y: h - 8, angle: 180 }
    ];

    corners.forEach(corner => {
      const cornerGraphics = this.add.graphics();
      cornerGraphics.setScrollFactor(0);
      cornerGraphics.lineStyle(2, 0x00ffff, 0.6);
      cornerGraphics.moveTo(corner.x, corner.y);
      cornerGraphics.lineTo(corner.x + cornerSize, corner.y);
      cornerGraphics.moveTo(corner.x, corner.y);
      cornerGraphics.lineTo(corner.x, corner.y + cornerSize);
      cornerGraphics.strokePath();

      this.tweens.add({
        targets: cornerGraphics,
        alpha: { from: 0.3, to: 0.8 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    });
  }

  createTopPanel() {
    const w = this.scale.width;
    const worldColor = this.getWorldColor();

    this.scoreText = this.add.text(w / 2, 22, '0', {
      fontSize: '48px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ffffff',
      stroke: worldColor,
      strokeThickness: 6,
      shadow: { blur: 15, color: worldColor, fill: true }
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    this.bestText = this.add.text(12, 10, `🏆 ${this.best}`, {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#ffaa44',
      stroke: '#000000',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.crystalText = this.add.text(w - 12, 10, `💎 ${this.crystals}`, {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#ffaa44',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);

    this.bonusText = this.add.text(w - 12, 42, '', {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      stroke: '#000000',
      strokeThickness: 2,
      align: 'right'
    }).setOrigin(1, 0).setDepth(10).setVisible(false).setScrollFactor(0);

    this.levelText = this.add.text(w / 2, 100, '', {
      fontSize: '28px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ffffff',
      stroke: '#ff00ff',
      strokeThickness: 5,
      shadow: { blur: 15, color: '#ff00ff', fill: true }
    }).setOrigin(0.5).setDepth(15).setVisible(false).setScrollFactor(0);
  }

  createBottomPanel() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.meterText = this.add.text(12, h - 70, `📏 ${Math.floor(this.meters)} м`, {
      fontSize: '11px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#88ccff',
      stroke: '#000000',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    this.wagonCountText = this.add.text(w - 12, h - 70, `🚃 ${this.wagons.length}/${this.maxWagons}`, {
      fontSize: '11px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#88ccff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);

    this.difficultyIndicator = this.add.text(w / 2, h - 35, '', {
      fontSize: '10px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
    this.difficultyIndicator.setVisible(false);
  }

  createButtons() {
    const w = this.scale.width;
    const h = this.scale.height;
    const worldColor = this.getWorldColorString();

    // Кнопка паузы
    this.pauseButton = this.add.circle(w - 35, h - 35, 24, 0x1a1a3a, 0.9);
    this.pauseButton.setStrokeStyle(2, 0x00ffff, 0.9);
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.setDepth(20);
    this.pauseButton.setScrollFactor(0);

    const pauseIcon = this.add.text(w - 35, h - 35, '⏸️', {
      fontSize: '26px'
    }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

    this.pauseButton.on('pointerover', () => {
      this.pauseButton.setStrokeStyle(3, 0x00ffff, 1);
      pauseIcon.setScale(1.1);
      this.playHoverSound();
    });
    this.pauseButton.on('pointerout', () => {
      this.pauseButton.setStrokeStyle(2, 0x00ffff, 0.9);
      pauseIcon.setScale(1);
    });
    this.pauseButton.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      this.togglePause();
    });

    // Кнопка меню
    this.menuButton = this.add.circle(w - 95, h - 35, 24, 0x1a1a3a, 0.9);
    this.menuButton.setStrokeStyle(2, 0xff00ff, 0.9);
    this.menuButton.setInteractive({ useHandCursor: true });
    this.menuButton.setDepth(20);
    this.menuButton.setScrollFactor(0);

    const menuIcon = this.add.text(w - 95, h - 35, '⚙️', {
      fontSize: '26px'
    }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

    this.menuButton.on('pointerover', () => {
      this.menuButton.setStrokeStyle(3, 0xff00ff, 1);
      menuIcon.setScale(1.1);
      this.playHoverSound();
    });
    this.menuButton.on('pointerout', () => {
      this.menuButton.setStrokeStyle(2, 0xff00ff, 0.9);
      menuIcon.setScale(1);
    });
    this.menuButton.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      this.confirmExit();
    });

    // Кнопка атаки
    this.attackButton = this.add.circle(45, h - 35, 24, 0x1a1a3a, 0.9);
    this.attackButton.setStrokeStyle(2, 0xff4444, 0.9);
    this.attackButton.setInteractive({ useHandCursor: true });
    this.attackButton.setDepth(20);
    this.attackButton.setScrollFactor(0);

    const attackIcon = this.add.text(45, h - 35, '⚔️', {
      fontSize: '24px'
    }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

    this.attackButton.on('pointerover', () => {
      this.attackButton.setStrokeStyle(3, 0xff4444, 1);
      attackIcon.setScale(1.1);
    });
    this.attackButton.on('pointerout', () => {
      this.attackButton.setStrokeStyle(2, 0xff4444, 0.9);
      attackIcon.setScale(1);
    });
    this.attackButton.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      this.attackEnemies();
    });

    this.pauseIcon = pauseIcon;
    this.menuIcon = menuIcon;
    this.attackIcon = attackIcon;
  }

  getWorldColor() {
    const colors = [0x00ffff, 0xff00ff, 0xff6600, 0xffaa00, 0xaa88ff];
    return colors[this.world] || 0x00ffff;
  }

  getWorldColorString() {
    const colors = ['#00ffff', '#ff00ff', '#ff6600', '#ffaa00', '#aa88ff'];
    return colors[this.world] || '#00ffff';
  }

  showDifficultyIndicator(level) {
    if (!this.difficultyIndicator) return;
    const difficulties = ['ЛЁГКИЙ', 'СРЕДНИЙ', 'СЛОЖНЫЙ', 'ЭКСТРЕМАЛЬНЫЙ', 'БЕЗУМНЫЙ'];
    const colors = ['#44ff44', '#ffff44', '#ffaa44', '#ff6644', '#ff4444'];
    const index = Math.min(Math.floor(level / 5), 4);
    this.difficultyIndicator.setText(`⚡ ${difficulties[index]} УРОВЕНЬ ${level + 1}`);
    this.difficultyIndicator.setColor(colors[index]);
    this.difficultyIndicator.setVisible(true);
    this.difficultyIndicator.setAlpha(1);
    this.tweens.add({
      targets: this.difficultyIndicator,
      alpha: 0,
      y: this.difficultyIndicator.y - 30,
      duration: 2000,
      onComplete: () => {
        this.difficultyIndicator.setVisible(false);
        this.difficultyIndicator.y = this.scale.height - 35;
      }
    });
  }

  applySkinBonuses() {
    try {
      const currentSkin = gameManager.getCurrentSkin?.();
      const skinStats = gameManager.getSkinStats?.(currentSkin);
      if (skinStats) {
        this.jumpPower += skinStats.jumpBonus || 0;
        this.baseSpeed += skinStats.speedBonus || 0;
        if (skinStats.armorBonus) {
          this.maxHeadHP += Math.floor(skinStats.armorBonus / 10);
          if (this.headHP > this.maxHeadHP) this.headHP = this.maxHeadHP;
          this.updateHearts();
        }
        this.applySkinEffect(currentSkin);
      }
    } catch (e) {
      console.warn('Error applying skin stats:', e);
    }
  }

  applySkinEffect(skinId) {
    if (!this.player) return;
    const effects = {
      neon: () => {
        this.player.setTint(0x00ffff);
        this.player.setBlendMode(Phaser.BlendModes.ADD);
      },
      cyber: () => {
        this.player.setTint(0xff00ff);
        this.createDigitalTrail();
      },
      gold: () => this.player.setTint(0xffaa00),
      fire: () => {
        this.player.setTint(0xff4400);
        this.createFireTrail();
      },
      ice: () => {
        this.player.setTint(0x44aaff);
        this.createIceTrail();
      },
      void: () => {
        this.player.setTint(0x8800ff);
        this.player.setBlendMode(Phaser.BlendModes.SCREEN);
      }
    };
    const effect = effects[skinId];
    if (effect) effect();
  }

  createDigitalTrail() {
    if (this.digitalTrail) return;
    this.digitalTrail = this.add.particles(0, 0, 'digital_icon', {
      speed: 30, scale: { start: 0.2, end: 0 }, alpha: { start: 0.5, end: 0 },
      lifespan: 300, quantity: 1, frequency: 40, blendMode: Phaser.BlendModes.ADD,
      tint: [0xff00ff, 0x00ffff], follow: this.player, followOffset: { x: -15, y: 0 }
    });
  }

  createFireTrail() {
    if (this.fireTrail) return;
    this.fireTrail = this.add.particles(0, 0, 'flare', {
      speed: 40, scale: { start: 0.3, end: 0 }, alpha: { start: 0.6, end: 0 },
      lifespan: 250, quantity: 2, frequency: 30, blendMode: Phaser.BlendModes.ADD,
      tint: [0xff4400, 0xff8800], follow: this.player, followOffset: { x: -18, y: 0 }
    });
  }

  createIceTrail() {
    if (this.iceTrail) return;
    this.iceTrail = this.add.particles(0, 0, 'flare', {
      speed: 35, scale: { start: 0.25, end: 0 }, alpha: { start: 0.5, end: 0 },
      lifespan: 280, quantity: 2, frequency: 35, blendMode: Phaser.BlendModes.ADD,
      tint: [0x44aaff, 0x88ccff], follow: this.player, followOffset: { x: -16, y: 0 }
    });
  }

  playHoverSound() {
    try { audioManager.playSound(this, 'tap_sound', 0.1); } catch (e) {}
  }

  attackEnemies() {
    if (this.weaponCooldown > 0) return;
    if (!this.player || !this.player.active) return;
    if (!this.playerBullets) return;
    this.weaponCooldown = this.weaponFireDelay;
    const bullet = this.playerBullets.create(this.player.x + 30, this.player.y, 'laser_player');
    if (!bullet) return;
    bullet.setScale(1.5);
    bullet.damage = this.weaponDamage;
    bullet.setDepth(20);
    bullet.body.setAllowGravity(false);
    bullet.body.setGravityY(0);
    bullet.body.setVelocityX(this.weaponBulletSpeed);
    bullet.body.setVelocityY(0);
    this.createMuzzleFlash(this.player.x + 30, this.player.y);
    try { audioManager.playSound(this, 'tap_sound', 0.3); } catch(e) {}
    if (this.attackButton) {
      this.tweens.add({ targets: this.attackButton, scale: 0.8, duration: 100, yoyo: true });
    }
  }

  fireEnemyBullet(enemy, playerPos) {
    if (!this.enemyBullets) return;
    const bullet = this.enemyBullets.create(enemy.sprite.x - 15, enemy.sprite.y, 'laser_enemy');
    if (!bullet) return;
    bullet.setScale(1.2);
    bullet.damage = enemy.config.bulletDamage;
    bullet.body.setAllowGravity(false);
    bullet.body.setGravityY(0);
    const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, playerPos.x, playerPos.y);
    const speed = enemy.config.bulletSpeed;
    bullet.setVelocityX(Math.cos(angle) * speed);
    bullet.setVelocityY(Math.sin(angle) * speed);
    bullet.setDepth(20);
    bullet.active = true;
    bullet.enemyBullet = true;
    this.createMuzzleFlash(enemy.sprite.x - 20, enemy.sprite.y);
  }

  createMuzzleFlash(x, y) {
    const flash = this.add.circle(x, y, 8, 0xffaa44, 0.8);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 100, onComplete: () => flash.destroy() });
  }

  setupCollisions() {
    this.physics.add.overlap(this.player, this.coinGroup, (p, c) => {
      if (c.coinRef) this.collectCoin(c.coinRef);
    }, null, this);
    this.physics.add.overlap(this.enemyBullets, this.player, (bullet, player) => {
      if (this.damageSystem) this.damageSystem.playerHitByBullet(player, bullet);
    }, null, this);
    this.physics.add.overlap(this.enemyBullets, this.wagons, (bullet, wagon) => {
      if (!bullet?.active || !wagon?.active) return;
      if (wagon.takeDamage) {
        const destroyed = wagon.takeDamage(1);
        if (destroyed) this.wagons = this.wagons.filter(w => w !== wagon);
      }
      bullet.destroy();
    }, null, this);
    this.physics.add.overlap(this.player, this.asteroidGroup, (player, astSprite) => {
      const ast = astSprite.asteroidRef;
      if (ast?.isActive()) {
        if (this.shieldActive) {
          this.particleManager.createBonusEffect('shield', ast.sprite.x, ast.sprite.y);
        } else {
          this.headHP -= ast.damage;
          this.updateHearts();
          try { audioManager.playSound(this, 'hit_sound', 0.3); } catch(e) {}
          if (this.headHP <= 0) this.handleDeath();
        }
        ast.destroy(true);
        this.asteroids = this.asteroids.filter(a => a !== ast);
      }
    }, null, this);
  }

  updateHearts() {
    if (!this.heartContainer) return;
    this.heartContainer.removeAll(true);
    const heartSpacing = 18;
    const worldColor = this.getWorldColor();
    for (let i = 0; i < this.maxHeadHP; i++) {
      const heart = this.add.image(i * heartSpacing, 0, 'heart').setScale(0.55);
      if (i >= this.headHP) {
        heart.setTint(0x444444);
        heart.setAlpha(0.4);
      } else {
        heart.setTint(0xff44ff);
        heart.setAlpha(1);
        if (i === this.headHP - 1 && this.headHP > 0 && this.headHP < this.maxHeadHP) {
          this.tweens.add({ targets: heart, scaleX: { from: 0.55, to: 0.7 }, scaleY: { from: 0.55, to: 0.7 }, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      }
      this.heartContainer.add(heart);
    }
  }

  createGameOverBox() {
    const w = this.scale.width;
    const h = this.scale.height;
    const worldColor = this.getWorldColorString();

    this.gameOverBox = this.add.container(w / 2, h / 2);
    this.gameOverBox.setVisible(false);
    this.gameOverBox.setDepth(100);
    this.gameOverBox.setScrollFactor(0);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a0a1a, 0.98);
    panelBg.fillRoundedRect(-150, -125, 300, 280, 20);
    panelBg.lineStyle(3, 0x00ffff, 0.9);
    panelBg.strokeRoundedRect(-150, -125, 300, 280, 20);

    const innerGlow = this.add.graphics();
    innerGlow.lineStyle(2, 0xff00ff, 0.4);
    innerGlow.strokeRoundedRect(-146, -121, 292, 272, 18);

    const title = this.add.text(0, -95, 'ИГРА ОКОНЧЕНА', {
      fontSize: '26px', fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ff4444', stroke: '#ff00ff', strokeThickness: 4,
      shadow: { blur: 15, color: '#ff0000', fill: true }
    }).setOrigin(0.5);

    this.gameOverSubtitle = this.add.text(0, -20, '', {
      fontSize: '12px', fontFamily: "'Share Tech Mono', monospace",
      color: '#88ccff', align: 'center', stroke: '#000000', strokeThickness: 2, lineSpacing: 6
    }).setOrigin(0.5);

    const tip = this.add.text(0, 75, '👆 НАЖМИТЕ, ЧТОБЫ ПРОДОЛЖИТЬ', {
      fontSize: '11px', fontFamily: "'Orbitron', sans-serif",
      color: '#88aaff', stroke: '#000000', strokeThickness: 1
    }).setOrigin(0.5);

    const glowLine = this.add.graphics();
    glowLine.lineStyle(2, worldColor, 0.6);
    glowLine.moveTo(-80, 105);
    glowLine.lineTo(80, 105);
    glowLine.strokePath();

    this.tweens.add({ targets: glowLine, alpha: { from: 0.3, to: 0.9 }, duration: 800, yoyo: true, repeat: -1 });

    this.gameOverBox.add([panelBg, innerGlow, title, this.gameOverSubtitle, tip, glowLine]);
  }

  // =========================================================================
  // МЕТОДЫ УПРАВЛЕНИЯ ПАУЗОЙ И ВЫХОДОМ
  // =========================================================================

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      if (this.spawnTimer) this.spawnTimer.paused = true;
      if (this.bonusTimer) this.bonusTimer.paused = true;
      if (this.stationTimer) this.stationTimer.paused = true;
      this.pauseOverlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.85).setDepth(100).setScrollFactor(0);
      this.pauseBorder = this.add.graphics();
      this.pauseBorder.lineStyle(3, 0x00ffff, 0.9);
      this.pauseBorder.strokeRoundedRect(this.scale.width / 2 - 150, this.scale.height / 2 - 110, 300, 220, 25);
      this.pauseBorder.setDepth(101);
      this.pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, '⏸️ ПАУЗА', {
        fontSize: '52px', fontFamily: "'Audiowide', 'Orbitron', sans-serif",
        color: '#ffffff', stroke: '#00ffff', strokeThickness: 6,
        shadow: { blur: 25, color: '#00ffff', fill: true }
      }).setOrigin(0.5).setDepth(102).setScrollFactor(0);
      this.pauseTip = this.add.text(this.scale.width / 2, this.scale.height / 2 + 30, '✦ НАЖМИТЕ КНОПКУ ПАУЗЫ, ЧТОБЫ ПРОДОЛЖИТЬ ✦', {
        fontSize: '12px', fontFamily: "'Share Tech Mono', monospace",
        color: '#88aaff', stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(102).setScrollFactor(0);
      this.tweens.add({ targets: this.pauseBorder, alpha: { from: 0.6, to: 1 }, duration: 800, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: this.pauseText, scale: { from: 1, to: 1.05 }, duration: 800, yoyo: true, repeat: -1 });
    } else {
      this.physics.resume();
      if (this.spawnTimer) this.spawnTimer.paused = false;
      if (this.bonusTimer) this.bonusTimer.paused = false;
      if (this.stationTimer) this.stationTimer.paused = false;
      if (this.pauseBorder) this.pauseBorder.destroy();
      if (this.pauseText) this.pauseText.destroy();
      if (this.pauseTip) this.pauseTip.destroy();
      if (this.pauseOverlay) this.pauseOverlay.destroy();
      this.pauseBorder = null;
      this.pauseText = null;
      this.pauseTip = null;
      this.pauseOverlay = null;
    }
  }

  confirmExit() {
    if (this.dead) return;
    if (this.exitDialogActive) return;
    this.exitDialogActive = true;
    this.isPaused = true;
    this.physics.pause();
    const w = this.scale.width;
    const h = this.scale.height;
    this.exitOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setDepth(150).setScrollFactor(0);
    this.exitPanel = this.add.graphics();
    this.exitPanel.fillStyle(0x0a0a1a, 0.98);
    this.exitPanel.fillRoundedRect(w / 2 - 150, h / 2 - 115, 300, 250, 25);
    this.exitPanel.lineStyle(3, 0xff00ff, 0.9);
    this.exitPanel.strokeRoundedRect(w / 2 - 150, h / 2 - 115, 300, 250, 25);
    this.exitPanel.setDepth(151);
    this.exitIcon = this.add.text(w / 2, h / 2 - 65, '⚠️', { fontSize: '48px' }).setOrigin(0.5).setDepth(152);
    this.exitText = this.add.text(w / 2, h / 2 - 15, 'ВЫЙТИ В МЕНЮ?', {
      fontSize: '24px', fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ffffff', stroke: '#ff00ff', strokeThickness: 3
    }).setOrigin(0.5).setDepth(152);
    this.exitSubText = this.add.text(w / 2, h / 2 + 15, '⚠️ Весь прогресс будет потерян ⚠️', {
      fontSize: '10px', fontFamily: "'Share Tech Mono', monospace", color: '#ffaa66'
    }).setOrigin(0.5).setDepth(152);
    this.yesBtn = this.add.text(w / 2 - 80, h / 2 + 75, 'ДА', {
      fontSize: '20px', fontFamily: "'Audiowide', sans-serif", color: '#00ff00',
      backgroundColor: '#1a3a1a', padding: { x: 25, y: 10 }, stroke: '#00ff00', strokeThickness: 2
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5).setDepth(200);
    this.noBtn = this.add.text(w / 2 + 80, h / 2 + 75, 'НЕТ', {
      fontSize: '20px', fontFamily: "'Audiowide', sans-serif", color: '#ff4444',
      backgroundColor: '#3a1a1a', padding: { x: 25, y: 10 }, stroke: '#ff4444', strokeThickness: 2
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5).setDepth(200);
    this.yesBtn.on('pointerover', () => this.yesBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }));
    this.yesBtn.on('pointerout', () => this.yesBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a3a1a' }));
    this.yesBtn.on('pointerdown', (pointer) => { pointer.event.stopPropagation(); this.exitToMenu(); });
    this.noBtn.on('pointerover', () => this.noBtn.setStyle({ color: '#ffffff', backgroundColor: '#aa0000' }));
    this.noBtn.on('pointerout', () => this.noBtn.setStyle({ color: '#ff4444', backgroundColor: '#3a1a1a' }));
    this.noBtn.on('pointerdown', (pointer) => { pointer.event.stopPropagation(); this.closeExitDialog(); });
  }

  closeExitDialog() {
    if (this.exitOverlay) this.exitOverlay.destroy();
    if (this.exitPanel) this.exitPanel.destroy();
    if (this.exitIcon) this.exitIcon.destroy();
    if (this.exitText) this.exitText.destroy();
    if (this.exitSubText) this.exitSubText.destroy();
    if (this.yesBtn) this.yesBtn.destroy();
    if (this.noBtn) this.noBtn.destroy();
    this.exitOverlay = null;
    this.exitPanel = null;
    this.exitIcon = null;
    this.exitText = null;
    this.exitSubText = null;
    this.yesBtn = null;
    this.noBtn = null;
    this.exitDialogActive = false;
    this.isPaused = false;
    this.physics.resume();
    if (this.spawnTimer) this.spawnTimer.paused = false;
    if (this.bonusTimer) this.bonusTimer.paused = false;
    if (this.stationTimer) this.stationTimer.paused = false;
  }

  exitToMenu() {
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.bonusTimer) this.bonusTimer.remove();
    if (this.stationTimer) this.stationTimer.remove();
    if (this.resumeCountdownTimer) this.resumeCountdownTimer?.remove();
    if (this.particleManager) this.particleManager.clearAll();
    if (this.trailEmitter) { this.trailEmitter.stop(); this.trailEmitter.destroy(); }
    if (this.pauseBorder) this.pauseBorder.destroy();
    if (this.pauseText) this.pauseText.destroy();
    if (this.pauseTip) this.pauseTip.destroy();
    if (this.pauseOverlay) this.pauseOverlay.destroy();
    if (this.exitOverlay) this.exitOverlay.destroy();
    if (this.exitPanel) this.exitPanel.destroy();
    if (this.exitIcon) this.exitIcon.destroy();
    if (this.exitText) this.exitText.destroy();
    if (this.exitSubText) this.exitSubText.destroy();
    if (this.yesBtn) this.yesBtn.destroy();
    if (this.noBtn) this.noBtn.destroy();
    if (this.pauseButton) this.pauseButton.destroy();
    if (this.menuButton) this.menuButton.destroy();
    if (this.pauseIcon) this.pauseIcon.destroy();
    if (this.menuIcon) this.menuIcon.destroy();
    if (this.gameOverBox) this.gameOverBox.destroy();
    if (this.pipes) { this.pipes.forEach(p => p?.destroy()); this.pipes = []; }
    if (this.coins) { this.coins.forEach(c => c?.destroy()); this.coins = []; }
    if (this.wagons) { this.wagons.forEach(w => w?.destroy()); this.wagons = []; }
    if (this.scoreZones) { this.scoreZones.forEach(z => z?.destroy()); this.scoreZones = []; }
    if (this.asteroids) { this.asteroids.forEach(a => a?.destroy()); this.asteroids = []; }
    if (this.powerUps) { this.powerUps.forEach(p => p?.destroy()); this.powerUps = []; }
    if (this.comboSystem?.destroy) this.comboSystem.destroy();
    if (this.specialEventManager?.destroy) this.specialEventManager.destroy();
    if (this.levelManager?.destroy) this.levelManager.destroy();
    if (this.waveManager?.destroy) this.waveManager.destroy();
    this.exitDialogActive = false;
    this.isPaused = false;
    this.scene.start('menu');
  }

  // =========================================================================
  // МЕТОДЫ ЗАПУСКА ИГРЫ
  // =========================================================================

  startRun() {
    this.started = true;
    if (this.introText) {
      this.tweens.add({ targets: this.introText, alpha: 0, y: this.introText.y - 20, duration: 300, onComplete: () => this.introText.setVisible(false) });
    }
    if (this.coinTipsText) {
      this.tweens.add({ targets: this.coinTipsText, alpha: 0, duration: 300, onComplete: () => this.coinTipsText.setVisible(false) });
    }
    this.time.delayedCall(200, () => {
      this.spawnGate();
      this.scheduleNextSpawn();
      this.checkStationSpawn();
      this.cameras.main.flash(200, 100, 255, 100, false);
      try { if (this.levelUpSound) this.levelUpSound.play(); } catch (e) {}
    });
  }

  scheduleNextSpawn() {
    if (this.dead) return;
    const difficulty = this.getDifficulty();
    const delay = Math.max(300, Math.min(2000, difficulty.spawnDelay));
    this.spawnTimer = this.time.delayedCall(delay, () => {
      if (!this.dead && this.started && !this.isPaused) {
        this.spawnGate();
        this.scheduleNextSpawn();
      }
    });
  }

  showWaveStartNotification(waveNumber) {
    const w = this.scale.width;
    const h = this.scale.height;
    const container = this.add.container(w / 2, h / 2 - 100);
    container.setDepth(50);
    container.setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, 280, 70, 0x0a0a1a, 0.95);
    bg.setStrokeStyle(2, 0xff00ff, 0.8);
    const text = this.add.text(0, 0, `⚔️ ВОЛНА ${waveNumber} ⚔️`, {
      fontSize: '24px', fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ff44ff', stroke: '#ff00ff', strokeThickness: 3,
      shadow: { blur: 10, color: '#ff00ff', fill: true }
    }).setOrigin(0.5);
    container.add([bg, text]);
    container.setAlpha(0);
    container.setScale(0.5);
    this.tweens.add({
      targets: container, alpha: 1, scale: 1, duration: 300, ease: 'Back.out',
      onComplete: () => {
        this.tweens.add({ targets: container, alpha: 0, scale: 1.2, duration: 500, delay: 1500, onComplete: () => container.destroy() });
      }
    });
    try { if (this.levelUpSound) this.levelUpSound.play(); } catch (e) {}
  }

  // =========================================================================
  // МЕТОДЫ СТАНЦИИ
  // =========================================================================

  checkStationSpawn() {
    if (this.stationActive || this.dead) return;
    if (this.levelProgress >= this.levelGoal && !this.stationPlanet) {
      this.spawnStation();
    }
  }

  spawnStation() {
    const w = this.scale.width;
    const h = this.scale.height;
    const x = w + 200;
    const y = Phaser.Math.Between(100, h - 100);
    this.stationPlanet = this.physics.add.image(x, y, 'station_planet')
      .setImmovable(true).setScale(1.5).setDepth(-5).setVelocityX(-this.currentSpeed * 0.3);
    if (this.stationPlanet.body) {
      this.stationPlanet.body.setAllowGravity(false);
      this.stationPlanet.body.setGravityY(0);
    }
    this.stationActive = true;
    const label = this.add.text(x, y - 80, '🚉 СТАНЦИЯ ОТДЫХА', {
      fontSize: '16px', fontFamily: "'Orbitron', monospace", color: '#00ffff',
      stroke: '#ff00ff', strokeThickness: 2, shadow: { blur: 8, color: '#00ffff', fill: true }
    }).setOrigin(0.5).setDepth(-4);
    this.stationPlanet.label = label;
    this.tweens.add({ targets: label, scale: { from: 1, to: 1.1 }, alpha: { from: 0.8, to: 1 }, duration: 800, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: this.stationPlanet, angle: 360, duration: 8000, repeat: -1, ease: 'Linear' });
  }

  touchStation() {
    if (!this.stationActive || !this.stationPlanet) return;
    this.stationActive = false;
    const bonus = this.wagons.length * 15;
    this.crystals += bonus;
    if (this.crystalText) {
      this.crystalText.setText(`💎 ${this.crystals}`);
      this.tweens.add({ targets: this.crystalText, scaleX: 1.3, scaleY: 1.3, duration: 200, yoyo: true });
    }
    if (gameManager.data) {
      gameManager.data.crystals = this.crystals;
      gameManager.save();
    }
    this.particleManager.createBonusEffect('speed', this.stationPlanet.x, this.stationPlanet.y);
    this.wagons.forEach(w => { if (w?.destroy) w.destroy(); });
    this.wagons = [];
    this.targetPlayerX = 110;
    if (this.wagonCountText) this.wagonCountText.setText(`🚃 0/${this.maxWagons}`);
    const msg = this.add.text(this.player.x, this.player.y - 50, `+${bonus} 💎`, {
      fontSize: '28px', fontFamily: "'Audiowide', monospace", color: '#ffaa00',
      stroke: '#ff00ff', strokeThickness: 4, shadow: { blur: 12, color: '#ffaa00', fill: true }
    }).setOrigin(0.5);
    this.tweens.add({ targets: msg, y: msg.y - 100, alpha: 0, duration: 1500, onComplete: () => msg.destroy() });
    this.createHealEffect();
    try { if (this.levelUpSound) this.levelUpSound.play(); } catch (e) {}
    if (this.stationPlanet.label) this.stationPlanet.label.destroy();
    this.stationPlanet.destroy();
    this.stationPlanet = null;
  }

  createHealEffect() {
    if (!this.player) return;
    this.headHP = this.maxHeadHP;
    this.updateHearts();
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        this.player.x + Phaser.Math.Between(-30, 30),
        this.player.y + Phaser.Math.Between(-30, 30),
        Phaser.Math.Between(2, 5), 0x00ff00, 0.7
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: particle, alpha: 0, scale: 0, y: particle.y - Phaser.Math.Between(30, 80), duration: 600, onComplete: () => particle.destroy() });
    }
    this.showNotification('❤️ ЗДОРОВЬЕ ВОССТАНОВЛЕНО', 1500, '#00ff00');
  }

  spawnCoin(x, y) {
    if (Math.random() > 0.9) return;
    let coinType = 'gold';
    const r = Math.random();
    const redChance = 0.1 + (this.gameLevel * 0.02);
    const blueChance = 0.1 + (this.gameLevel * 0.015);
    const greenChance = 0.1 + (this.gameLevel * 0.01);
    const purpleChance = 0.1 + (this.gameLevel * 0.005);
    if (this.gameLevel >= 1 && r < redChance) coinType = 'red';
    else if (this.gameLevel >= 2 && r < redChance + blueChance) coinType = 'blue';
    else if (this.gameLevel >= 3 && r < redChance + blueChance + greenChance) coinType = 'green';
    else if (this.gameLevel >= 4 && r < redChance + blueChance + greenChance + purpleChance) coinType = 'purple';
    const coin = new Coin(this, x + Phaser.Math.Between(-20, 20), y, coinType, this.world);
    this.coins.push(coin);
    this.coinGroup.add(coin.sprite);
  }

  // =========================================================================
  // МЕТОДЫ ЗАВЕРШЕНИЯ УРОВНЯ
  // =========================================================================

  completeLevel() {
    let stars = 1;
    const goalScore = this.worldConfig?.goalScore || 500;
    const levelMultiplier = 1 + this.level * 0.1;
    const adjustedGoal = Math.floor(goalScore * levelMultiplier);
    if (this.score >= adjustedGoal * 1.5) stars = 2;
    if (this.score >= adjustedGoal * 2) stars = 3;
    if (this.headHP === this.maxHeadHP && stars < 3) stars = Math.min(3, stars + 1);
    if (gameManager.setLevelStars) gameManager.setLevelStars(this.world, this.level, stars);
    if (this.level < 9 && gameManager.unlockLevel) gameManager.unlockLevel(this.world, this.level + 1);
    if (this.level === 9 && this.world < 4 && gameManager.data) {
      const worlds = gameManager.data.unlockedWorlds || [];
      if (!worlds.includes(this.world + 1)) {
        worlds.push(this.world + 1);
        if (gameManager.save) gameManager.save();
        this.createWorldUnlockEffect(this.world + 1);
      }
    }
    if (gameManager.updateStats) {
      gameManager.updateStats(this.score, this.level + 1, this.wagons.length, this.comboSystem?.maxCombo || 0, this.collectedCoins, 0, Math.floor(this.meters));
    }
    this.createLevelCompleteEffect(stars);
    this.scene.start('levelComplete', {
      world: this.world, level: this.level, score: this.score, stars: stars,
      coins: this.collectedCoins, wagons: this.wagons.length, newUnlock: this.level < 9,
      perfectRun: this.headHP === this.maxHeadHP && this.score > 100
    });
  }

  createWorldUnlockEffect(nextWorld) {
    const w = this.scale.width;
    const h = this.scale.height;
    const worldNames = ['КИБЕРПАНК', 'ПОДЗЕМЕЛЬЕ', 'АСТЕРОИДЫ', 'ЧЁРНАЯ ДЫРА'];
    const worldColors = ['#ff00ff', '#ff6600', '#ffaa00', '#aa88ff'];
    if (nextWorld <= 4) {
      const container = this.add.container(w / 2, h / 2);
      const bg = this.add.rectangle(0, 0, 400, 200, 0x0a0a1a, 0.95);
      bg.setStrokeStyle(4, worldColors[nextWorld - 1], 1);
      const title = this.add.text(0, -40, 'НОВЫЙ МИР ОТКРЫТ!', {
        fontSize: '24px', fontFamily: "'Audiowide', 'Orbitron', sans-serif",
        color: worldColors[nextWorld - 1], stroke: '#ffffff', strokeThickness: 3,
        shadow: { blur: 15, color: worldColors[nextWorld - 1], fill: true }
      }).setOrigin(0.5);
      const worldName = this.add.text(0, 20, worldNames[nextWorld - 1], {
        fontSize: '32px', fontFamily: "'Audiowide', 'Orbitron', sans-serif",
        color: '#ffffff', stroke: worldColors[nextWorld - 1], strokeThickness: 4,
        shadow: { blur: 20, color: worldColors[nextWorld - 1], fill: true }
      }).setOrigin(0.5);
      container.add([bg, title, worldName]);
      container.setAlpha(0);
      container.setScale(0.5);
      this.tweens.add({
        targets: container, alpha: 1, scale: 1, duration: 500, ease: 'Back.out',
        onComplete: () => {
          this.time.delayedCall(2000, () => {
            this.tweens.add({ targets: container, alpha: 0, scale: 1.2, duration: 500, onComplete: () => container.destroy() });
          });
        }
      });
      for (let i = 0; i < 50; i++) {
        const particle = this.add.circle(w / 2 + Phaser.Math.Between(-150, 150), h / 2 + Phaser.Math.Between(-100, 100), Phaser.Math.Between(2, 6), worldColors[nextWorld - 1], 0.8);
        particle.setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: particle, y: particle.y - Phaser.Math.Between(100, 200), x: particle.x + Phaser.Math.Between(-100, 100), alpha: 0, scale: 0, duration: 1000, onComplete: () => particle.destroy() });
      }
    }
  }

  createLevelCompleteEffect(stars) {
    const w = this.scale.width;
    const h = this.scale.height;
    const starColors = [0x88aaff, 0xffaa44, 0xff44ff];
    for (let i = 0; i < 3; i++) {
      const ring = this.add.circle(w / 2, h / 2, 30 + i * 30, starColors[i % starColors.length], 0.5);
      ring.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 600, delay: i * 100, onComplete: () => ring.destroy() });
    }
    for (let i = 0; i < stars; i++) {
      const star = this.add.text(w / 2 + (i - 1) * 45, h / 2 - 50, '★', {
        fontSize: '48px', color: '#ffaa00', stroke: '#ff5500', strokeThickness: 3,
        shadow: { blur: 15, color: '#ffaa00', fill: true }
      }).setOrigin(0.5);
      star.setScale(0);
      this.tweens.add({ targets: star, scale: 1, duration: 400, delay: 300 + i * 150, ease: 'Back.out' });
      this.time.delayedCall(1000, () => {
        this.tweens.add({ targets: star, alpha: 0, y: star.y - 50, duration: 500, onComplete: () => star.destroy() });
      });
    }
    try { if (this.levelUpSound) this.levelUpSound.play(); } catch (e) {}
  }

  // =========================================================================
  // МЕТОДЫ СМЕРТИ
  // =========================================================================

  handleDeath() {
    if (this.upgradeSystem?.upgrades?.revival > 0 && !this.dead) {
      this.upgradeSystem.upgrades.revival--;
      this.headHP = this.maxHeadHP;
      this.updateHearts();
      this.cameras.main.flash(500, 100, 255, 100, false);
      this.createReviveEffect();
      try { if (this.reviveSound) this.reviveSound.play(); } catch (e) {}
      this.showNotification('⚡ ВОСКРЕШЕНИЕ!', 2000, '#00ffff');
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
    this.createDeathExplosion();
    this.updateLeaderboard();
    this.updateStats();
    this.showGameOver();
    if (window.Telegram?.WebApp) {
      const data = JSON.stringify({ score: this.score, level: this.level + 1, meters: Math.floor(this.meters), world: this.world });
      window.Telegram.WebApp.sendData(data);
    }
    try { if (window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred) { window.Telegram.WebApp.HapticFeedback.notificationOccurred('error'); } } catch (e) {}
  }

  createReviveEffect() {
    if (!this.player) return;
    for (let i = 0; i < 30; i++) {
      const particle = this.add.circle(this.player.x + Phaser.Math.Between(-40, 40), this.player.y + Phaser.Math.Between(-40, 40), Phaser.Math.Between(2, 5), 0x00ffff, 0.7);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: particle, y: particle.y - Phaser.Math.Between(50, 120), alpha: 0, scale: 0, duration: 800, onComplete: () => particle.destroy() });
    }
    const ring = this.add.circle(this.player.x, this.player.y, 20, 0x00ffff, 0.6);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: ring, radius: 80, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
  }

  createDeathExplosion() {
    if (!this.player) return;
    this.player.setTint(0xff0000).setAngle(90);
    const emitter = this.add.particles(this.player.x, this.player.y, 'flare', {
      speed: { min: 150, max: 350 }, scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 },
      lifespan: 600, quantity: 60, blendMode: Phaser.BlendModes.ADD,
      tint: [0xff0000, 0xff6600, 0xff00ff, 0xffff00]
    });
    emitter.explode(60);
    const shockwave = this.add.circle(this.player.x, this.player.y, 20, 0xff4400, 0.8);
    shockwave.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: shockwave, radius: 150, alpha: 0, duration: 400, onComplete: () => shockwave.destroy() });
  }

  showGameOver() {
    if (!this.gameOverBox) this.createGameOverBox();
    if (this.gameOverSubtitle) {
      const worldName = this.worldConfig?.name || 'КОСМОС';
      this.gameOverSubtitle.setText(
        `${worldName} • УРОВЕНЬ ${this.level + 1}\n\n` +
        `🎯 Счёт: ${this.score}\n🏆 Рекорд: ${this.best}\n💎 Кристаллы: ${this.crystals}\n` +
        `📏 Пройдено: ${Math.floor(this.meters)} м\n🚃 Вагонов: ${this.wagons.length}/${this.maxWagons}\n` +
        `⚡ Комбо: ${this.comboSystem?.maxCombo || 0}`
      );
    }
    this.gameOverBox.setVisible(true);
    this.gameOverBox.setScale(0.8);
    this.gameOverBox.setAlpha(0);
    this.tweens.add({ targets: this.gameOverBox, scaleX: 1, scaleY: 1, alpha: 1, duration: 500, ease: 'Back.out' });
    try {
      if (this.sound?.add) {
        const gameOverSound = this.sound.add('gameover_sound', { volume: 0.5 });
        gameOverSound.play();
      }
    } catch (e) {}
  }

  // =========================================================================
  // МЕТОДЫ ДОСТИЖЕНИЙ И НАГРАД
  // =========================================================================

  initAchievements() {
    this.achievements = { ...ACHIEVEMENTS };
    for (let key in this.achievements) {
      if (this.achievements[key]) this.achievements[key].unlocked = false;
    }
    this.loadAchievements();
  }

  loadAchievements() {
    try {
      const saved = localStorage.getItem('skypulse_achievements');
      if (saved) {
        const data = JSON.parse(saved);
        for (let key in data) {
          if (this.achievements?.[key]) this.achievements[key].unlocked = data[key];
        }
      }
    } catch (e) {}
  }

  saveAchievements() {
    if (!this.achievements) return;
    const data = {};
    for (let key in this.achievements) {
      if (this.achievements[key]) data[key] = this.achievements[key].unlocked;
    }
    localStorage.setItem('skypulse_achievements', JSON.stringify(data));
  }

  checkAchievements() {
    if (!this.achievements) return;
    const checks = [
      { cond: this.wagons.length >= 1, key: 'first_wagon' },
      { cond: this.wagons.length >= 5, key: 'five_wagons' },
      { cond: this.wagons.length >= 10, key: 'ten_wagons' },
      { cond: this.level >= 4, key: 'level_5' },
      { cond: this.level >= 9, key: 'level_10' },
      { cond: this.score >= 100, key: 'score_100' },
      { cond: this.score >= 500, key: 'score_500' },
      { cond: this.headHP === this.maxHeadHP && this.score > 10, key: 'no_damage' }
    ];
    for (const check of checks) {
      if (check.cond && this.achievements[check.key] && !this.achievements[check.key].unlocked) {
        this.unlockAchievement(check.key);
      }
    }
    this.checkCoinAchievements();
  }

  checkCoinAchievements() {
    if (!this.achievements?.all_bonuses) return;
    if (this.collectedCoins >= 50 && !this.achievements.all_bonuses.unlocked) {
      this.unlockAchievement('all_bonuses');
    }
  }

  unlockAchievement(key) {
    if (!this.achievements?.[key] || this.achievements[key].unlocked) return;
    this.achievements[key].unlocked = true;
    const reward = this.achievements[key].reward || 0;
    this.crystals += reward;
    if (this.crystalText) {
      this.crystalText.setText(`💎 ${this.crystals}`);
      this.tweens.add({ targets: this.crystalText, scaleX: 1.2, scaleY: 1.2, duration: 200, yoyo: true });
    }
    if (gameManager.data) gameManager.data.crystals = this.crystals;
    if (gameManager.unlockAchievement) gameManager.unlockAchievement(key);
    if (gameManager.save) gameManager.save();
    this.showAchievementNotification(key, reward);
    this.saveAchievements();
  }

  showAchievementNotification(key, reward) {
    const w = this.scale.width;
    const achievement = this.achievements?.[key];
    if (!achievement) return;
    const container = this.add.container(w / 2, -80);
    container.setDepth(100).setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, 320, 70, 0x0a0a1a, 0.95);
    bg.setStrokeStyle(3, 0xffff00, 0.8);
    const icon = this.add.text(-140, 0, '🏆', { fontSize: '36px' }).setOrigin(0.5);
    const title = this.add.text(0, -15, achievement.name, {
      fontSize: '14px', fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ffaa00', stroke: '#ff5500', strokeThickness: 1
    }).setOrigin(0.5);
    const rewardText = this.add.text(0, 12, `+${reward} 💎`, {
      fontSize: '12px', fontFamily: "'Share Tech Mono', monospace", color: '#00ff00'
    }).setOrigin(0.5);
    container.add([bg, icon, title, rewardText]);
    this.tweens.add({ targets: container, y: 90, duration: 500, ease: 'Back.out', onComplete: () => { this.tweens.add({ targets: container, y: 70, alpha: 0, duration: 500, delay: 2500, onComplete: () => container.destroy() }); } });
    try { if (this.levelUpSound) this.levelUpSound.play(); } catch (e) {}
  }

  initDailyRewards() {
    this.dailyReward = {
      lastClaimDate: localStorage.getItem('skypulse_daily_date') || '',
      streak: parseInt(localStorage.getItem('skypulse_daily_streak') || '0'),
      rewards: [15, 25, 40, 60, 85, 115, 150, 200, 250, 300]
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
      if (lastDate === yesterdayStr) this.dailyReward.streak = Math.min(this.dailyReward.streak + 1, 10);
      else this.dailyReward.streak = 1;
      this.dailyReward.lastClaimDate = today;
      this.saveDailyReward();
      this.showDailyRewardNotification();
    }
  }

  showDailyRewardNotification() {
    const w = this.scale.width;
    const h = this.scale.height;
    const rewardAmount = this.dailyReward.rewards[this.dailyReward.streak - 1] || 15;
    this.crystals += rewardAmount;
    if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
    if (gameManager.data) { gameManager.data.crystals = this.crystals; gameManager.save(); }
    const container = this.add.container(w / 2, h / 2);
    container.setDepth(100).setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, 320, 160, 0x0a0a1a, 0.98);
    bg.setStrokeStyle(3, 0x00ffff, 0.9);
    const title = this.add.text(0, -45, '🎁 ДНЕВНАЯ НАГРАДА', {
      fontSize: '20px', fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#00ffff', stroke: '#ff00ff', strokeThickness: 2
    }).setOrigin(0.5);
    const streak = this.add.text(0, -10, `ДЕНЬ ${this.dailyReward.streak}/10`, {
      fontSize: '14px', fontFamily: "'Orbitron', sans-serif", color: '#ffaa00'
    }).setOrigin(0.5);
    const reward = this.add.text(0, 25, `+${rewardAmount} 💎`, {
      fontSize: '28px', fontFamily: "'Audiowide', sans-serif", color: '#ffaa00',
      stroke: '#ff5500', strokeThickness: 2
    }).setOrigin(0.5);
    const claimBtn = this.add.text(0, 65, '[ЗАБРАТЬ]', {
      fontSize: '14px', fontFamily: "'Orbitron', sans-serif", color: '#00ff00',
      backgroundColor: '#1a3a1a', padding: { x: 15, y: 5 }
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5);
    claimBtn.on('pointerover', () => claimBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }));
    claimBtn.on('pointerout', () => claimBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a3a1a' }));
    claimBtn.on('pointerdown', () => { this.tweens.add({ targets: container, alpha: 0, scale: 1.2, duration: 300, onComplete: () => container.destroy() }); });
    container.add([bg, title, streak, reward, claimBtn]);
    container.setScale(0.5);
    this.tweens.add({ targets: container, scale: 1, duration: 400, ease: 'Back.out' });
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
    const entry = { score: this.score, level: this.level + 1, wagons: this.wagons.length, meters: Math.floor(this.meters), timestamp: Date.now() };
    this.leaderboard.unshift(entry);
    this.leaderboard = this.leaderboard.slice(0, 10);
    this.saveLeaderboard();
  }

  initStats() {
    this.stats = { totalGames: 0, totalDistance: 0, totalCoins: 0, bestScore: 0, bestLevel: 0, totalWagons: 0, totalPlayTime: 0, startTime: Date.now() };
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
    const dt = delta / 1000;
    const speedMultiplier = this.currentSpeed / this.baseSpeed || 1;
    for (let s of this.stars) {
      if (!s || !s.sprite) continue;
      const moveSpeed = s.baseSpeed * speedMultiplier * 0.3;
      s.sprite.x -= moveSpeed * dt;
      if (s.flicker) s.sprite.alpha = s.baseAlpha + Math.sin(time * s.flicker) * 0.3;
      if (s.sprite.x < -50) {
        s.sprite.x = w + Phaser.Math.Between(50, 200);
        s.sprite.y = Phaser.Math.Between(0, h);
        s.baseAlpha = Phaser.Math.FloatBetween(0.3, 0.9);
        s.flicker = Phaser.Math.FloatBetween(0.01, 0.03);
      }
    }
  }

  updatePlanets(delta) {
    const w = this.scale.width;
    const dt = delta / 1000;
    const speedMultiplier = this.currentSpeed / this.baseSpeed || 1;
    for (let p of this.planets) {
      if (!p || !p.sprite) continue;
      const moveSpeed = p.speed * speedMultiplier * 0.2;
      p.sprite.x -= moveSpeed * dt;
      if (p.sprite.x < -300) {
        p.sprite.x = w + Phaser.Math.Between(400, 2000);
        p.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  updateShips(delta) {
    const w = this.scale.width;
    const dt = delta / 1000;
    const speedMultiplier = this.currentSpeed / this.baseSpeed || 1;
    for (let s of this.ships) {
      if (!s || !s.sprite) continue;
      const moveSpeed = s.speed * speedMultiplier * 0.3;
      s.sprite.x -= moveSpeed * dt;
      if (s.sprite.x < -200) {
        s.sprite.x = w + Phaser.Math.Between(300, 1500);
        s.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    }
  }

  updateAsteroids(delta) {
    const w = this.scale.width;
    const dt = delta / 1000;
    const speedMultiplier = this.currentSpeed / this.baseSpeed || 1;
    for (let a of this.asteroids) {
      if (!a || !a.sprite) continue;
      const moveSpeed = a.speed * speedMultiplier * 0.25;
      a.sprite.x -= moveSpeed * dt;
      a.sprite.angle += a.rotationSpeed * dt;
      if (a.sprite.x < -200) {
        a.sprite.x = w + Phaser.Math.Between(300, 1500);
        a.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
        a.rotationSpeed = Phaser.Math.Between(-50, 50);
      }
    }
  }

  // =========================================================================
  // МЕТОДЫ ИГРОВОЙ ЛОГИКИ
  // =========================================================================

  updatePlayerMovement() {
    if (!this.player) return;
    this.targetPlayerX = Math.min(this.maxTargetX, this.targetPlayerX);
    this.player.x += (this.targetPlayerX - this.player.x) * this.playerXSpeed;
    const body = this.player.body;
    if (body) this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75));
    if (!this.shieldActive && (this.player.y < -50 || this.player.y > this.scale.height + 50)) this.handleDeath();
  }

  updateBonuses(delta) {
    if (!this.player) return;
    if (this.magnetActive && this.coinGroup) {
      const magnetCoins = this.coinGroup.getChildren();
      for (let coin of magnetCoins) {
        if (!coin || !coin.active) continue;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, coin.x, coin.y);
        if (dist < this.magnetRange) {
          const angle = Phaser.Math.Angle.Between(coin.x, coin.y, this.player.x, this.player.y);
          coin.x += Math.cos(angle) * 10;
          coin.y += Math.sin(angle) * 10;
        }
      }
    }
    if (this.updatePlayerEffects) this.updatePlayerEffects();
    if (this.updateMultiplier) this.updateMultiplier();
  }

  updateObjects(delta) {
    if (!this.player) return;
    this.updateWagons();
    this.cleanupObjects();
    if (this.playerBullets) this.playerBullets.getChildren().forEach((b) => { if (b && b.x > this.scale.width + 100) b.destroy(); });
    if (this.enemyBullets) this.enemyBullets.getChildren().forEach((b) => { if (b && (b.x < -100 || b.y < -100 || b.y > this.scale.height + 100)) b.destroy(); });
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const asteroid = this.asteroids[i];
      if (!asteroid || typeof asteroid.update !== 'function') { this.asteroids.splice(i, 1); continue; }
      if (!asteroid.update()) this.asteroids.splice(i, 1);
    }
    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i];
      if (coin && coin.isActive()) coin.update(delta);
    }
    this.coinGroup.getChildren().forEach(coinSprite => {
      const coin = coinSprite.coinRef;
      if (coin && !coin.collected && coin.isActive()) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), coinSprite.getBounds())) this.collectCoin(coin);
      }
    });
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      if (!powerUp || typeof powerUp.update !== 'function') { this.powerUps.splice(i, 1); continue; }
      if (!powerUp.update()) this.powerUps.splice(i, 1);
    }
    if (this.weaponCooldown > 0) this.weaponCooldown -= delta;
  }

  checkAchievementsAndRecords() {
    this.checkAchievements();
    this.checkNewRecords();
    this.checkMaxCombo();
    this.checkQuests();
    if (this.checkWaveAchievements) this.checkWaveAchievements();
    if (this.createComboEffect) this.createComboEffect();
  }

  updateMeters(delta) {
    const distanceDelta = (this.currentSpeed * delta) / 1000 / 10;
    this.meters += distanceDelta;
    this.levelProgress += distanceDelta;
    if (this.meterText) this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
  }

  updateBackground(delta) {
    const time = Date.now() / 1000;
    this.updateStars(time, delta);
    this.updatePlanets(delta);
    this.updateShips(delta);
    this.updateAsteroids(delta);
  }

  onResize() {
    const w = this.scale.width;
    const h = this.scale.height;
    if (this.scoreText) this.scoreText.setPosition(w / 2, 30);
    if (this.bestText) this.bestText.setPosition(10, 10);
    if (this.crystalText) this.crystalText.setPosition(w - 10, 10);
    if (this.meterText) this.meterText.setPosition(10, h - 80);
    if (this.wagonCountText) this.wagonCountText.setPosition(w - 12, h - 70);
    if (this.bonusText) this.bonusText.setPosition(w - 10, 40);
    if (this.pauseButton) this.pauseButton.setPosition(w - 35, h - 35);
    if (this.menuButton) this.menuButton.setPosition(w - 95, h - 35);
    if (this.attackButton) this.attackButton.setPosition(45, h - 35);
    if (!this.started) {
      if (this.introText) this.introText.setPosition(w / 2, h * 0.40);
      if (this.coinTipsText) this.coinTipsText.setPosition(w / 2, h * 0.52);
    }
    if (this.heartContainer) this.heartContainer.setPosition(12, 38);
  }

  createComboIndicator() {
    const w = this.scale.width;
    this.comboIndicator = this.add.container(w / 2, 180);
    this.comboIndicator.setDepth(12).setScrollFactor(0);
    this.comboIndicator.setVisible(false);
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a3a, 0.85);
    bg.fillRoundedRect(-60, -20, 120, 40, 12);
    bg.lineStyle(2, 0xff44ff, 0.8);
    bg.strokeRoundedRect(-60, -20, 120, 40, 12);
    this.comboValueText = this.add.text(0, 0, 'x1', {
      fontSize: '24px', fontFamily: "'Audiowide', sans-serif", color: '#ff44ff',
      stroke: '#ff00ff', strokeThickness: 2
    }).setOrigin(0.5);
    this.comboIndicator.add([bg, this.comboValueText]);
  }

  updateComboIndicator(combo) {
    if (!this.comboIndicator) return;
    if (combo > 1) {
      this.comboIndicator.setVisible(true);
      this.comboValueText.setText(`x${combo}`);
      this.tweens.add({ targets: this.comboIndicator, scale: { from: 1, to: 1.1 }, duration: 100, yoyo: true });
      if (combo >= 20) { this.comboValueText.setColor('#ff4444'); this.comboValueText.setStroke('#ff0000'); }
      else if (combo >= 10) { this.comboValueText.setColor('#ffaa00'); this.comboValueText.setStroke('#ff8800'); }
      else { this.comboValueText.setColor('#ff44ff'); this.comboValueText.setStroke('#ff00ff'); }
    } else {
      this.comboIndicator.setVisible(false);
    }
  }

  shutdown() {
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.bonusTimer) this.bonusTimer.remove();
    if (this.stationTimer) this.stationTimer.remove();
    if (this.resumeCountdownTimer) this.resumeCountdownTimer?.remove();
    if (this.pipes) { this.pipes.forEach(p => { if (p && p.tween) p.tween.stop(); if (p && p.destroy) p.destroy(); }); }
    if (this.coins) this.coins.forEach(c => { if (c && c.destroy) c.destroy(); });
    if (this.wagons) this.wagons.forEach(w => { if (w && w.destroy) w.destroy(); });
    if (this.scoreZones) this.scoreZones.forEach(z => { if (z && z.destroy) z.destroy(); });
    if (this.stars) this.stars.forEach(s => { if (s && s.sprite && s.sprite.destroy) s.sprite.destroy(); });
    if (this.planets) this.planets.forEach(p => { if (p && p.sprite && p.sprite.destroy) p.sprite.destroy(); });
    if (this.ships) this.ships.forEach(s => { if (s && s.sprite && s.sprite.destroy) s.sprite.destroy(); });
    if (this.asteroids) this.asteroids.forEach(a => { if (a && a.sprite && a.sprite.destroy) a.sprite.destroy(); });
    if (this.trailEmitter) this.trailEmitter.stop();
    if (this.stationPlanet) { if (this.stationPlanet.label) this.stationPlanet.label.destroy(); this.stationPlanet.destroy(); }
    if (this.particleManager) this.particleManager.clearAll();
    if (this.shopElements) { this.shopElements.forEach(el => { if (el && el.destroy) el.destroy(); }); }
    if (this.comboSystem && typeof this.comboSystem.destroy === 'function') this.comboSystem.destroy();
    if (this.specialEventManager && typeof this.specialEventManager.destroy === 'function') this.specialEventManager.destroy();
  }
}

export default PlayScene;