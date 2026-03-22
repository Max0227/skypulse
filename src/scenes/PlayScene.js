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
  MAX_STARS: 80,           // уменьшено с 200
  MAX_PLANETS: 3,          // уменьшено с 5
  MAX_SHIPS: 6,            // уменьшено с 12
  PARTICLE_LIMIT: 40,      // лимит частиц
  UPDATE_THROTTLE: 33,     // максимальный дельта (30 FPS)
  LOW_FPS_THRESHOLD: 25,   // порог для режима низкой производительности
};

// =========================================================================
// ВСПОМОГАТЕЛЬНЫЕ КЛАССЫ
// =========================================================================

/**
 * Класс для управления врагами с ИИ (оптимизированный)
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

/**
 * Класс для управления системой урона (оптимизированный)
 */
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
    this.scene.cameras.main.shake(150, 0.005);
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
    this.scene.cameras.main.shake(150, 0.005);
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

/**
 * Класс для управления специальными событиями (оптимизированный)
 */
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

  /**
   * Метод прыжка
   */
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
    
    // Звук
    try { 
      if (this.tapSound) this.tapSound.play(); 
    } catch (e) {}
    
    // Вибрация
    try { 
      if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } catch (e) {}
  }

  /**
   * Создание эффекта комбо
   */
  createComboEffect() {
    if (!this.comboSystem) return;
    
    const w = this.scale.width;
    const h = this.scale.height;
    const combo = this.comboSystem.combo || 0;

    if (combo > 1 && combo % 5 === 0) {
      const text = this.add.text(w / 2, h / 2 - 100, `x${combo}!`, {
        fontSize: '36px',
        fontFamily: "'Orbitron', monospace",
        color: '#ffff00',
        stroke: '#ff8800',
        strokeThickness: 4,
        shadow: { blur: 10, color: '#ffff00', fill: true }
      }).setOrigin(0.5).setDepth(50).setScrollFactor(0);

     this.cameras.main.shake(40, 0.001);

      this.tweens.add({
        targets: text,
        y: text.y - 50,
        alpha: 0,
        duration: 1000,
        ease: 'Power2.easeOut',
        onComplete: () => text.destroy()
      });

      try { if (this.levelUpSound) this.levelUpSound.play(); } catch (e) {}
    }
  }

  /**
   * Сбор монеты (БЕЗ ИЗМЕНЕНИЙ)
   */
  collectCoin(coin) {
  if (!coin || !coin.isActive || !coin.isActive()) return;
  if (coin.collected) return;
  coin.collected = true;

  let value = 1;
  let bonusType = null;

  switch (coin.type) {
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
  if (this.player?.doubleCrystals) value *= 2;

  const multipliedValue = Math.floor(value * (this.comboSystem?.getMultiplier() || 1));
  this.crystals += multipliedValue;

  if (this.crystalText) {
    this.crystalText.setText(`💎 ${this.crystals}`);
  }

  this.collectedCoins += multipliedValue;

  if (this.comboSystem) {
    this.comboSystem.add();
  }

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
// МЕТОДЫ ДЛЯ ВАГОНОВ (улучшенная версия)
// =========================================================================

/**
 * Добавить новый вагон (увеличенное расстояние, плавное появление)
 */
addWagon() {
  if (this.wagons.length >= this.maxWagons || !this.player) return;
  
  // Определяем последний объект (игрок или последний вагон)
  const last = this.wagons.length > 0 ? this.wagons[this.wagons.length - 1] : this.player;
  
  // Увеличенное расстояние между вагонами (чтобы не было наложения)
  const spawnX = last.x - this.wagonGap;
  const spawnY = last.y + Phaser.Math.Between(-5, 5); // небольшое смещение для реалистичности
  
  // Создаём вагон с правильным индексом
  const wagon = new Wagon(this, spawnX, spawnY, this.wagons.length, this.world);
  wagon.setHP(this.wagonBaseHP, this.wagonBaseHP);
  
  this.wagons.push(wagon);
  
  // Обновляем счётчик вагонов
  if (this.wagonCountText) {
    this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
    // Анимация текста
    this.tweens.add({
      targets: this.wagonCountText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true,
      ease: 'Quad.out'
    });
  }
  
  // Эффект появления вагона
  this.createWagonSpawnEffect(wagon);
  
  // Лёгкая тряска камеры при добавлении вагона
  this.cameras.main.shake(80, 0.003);
  
  // Звук появления вагона
  try { 
    if (this.wagonSound) this.wagonSound.play(); 
  } catch(e) {}
  
  // Обновляем зум камеры
  this.updateCameraZoom();
  
  // Показываем уведомление о новом множителе
  this.showNotification(`✨ НОВЫЙ ВАГОН! МНОЖИТЕЛЬ x${wagon.getMultiplier().toFixed(1)} ✨`, 1500, '#ffaa00');
}

/**
 * Эффект появления вагона
 */
createWagonSpawnEffect(wagon) {
  if (!wagon || !wagon.sprite) return;
  
  // Частицы появления
  for (let i = 0; i < 12; i++) {
    const particle = this.add.circle(
      wagon.sprite.x + Phaser.Math.Between(-25, 25),
      wagon.sprite.y + Phaser.Math.Between(-25, 25),
      Phaser.Math.Between(2, 5),
      this.getWorldColor(),
      0.8
    );
    particle.setBlendMode(Phaser.BlendModes.ADD);
    
    this.tweens.add({
      targets: particle,
      alpha: 0,
      scale: 0,
      x: particle.x + Phaser.Math.Between(-50, 50),
      y: particle.y + Phaser.Math.Between(-50, 50),
      duration: 500,
      onComplete: () => particle.destroy()
    });
  }
  
  // Кольцо появления
  const ring = this.add.circle(wagon.sprite.x, wagon.sprite.y, 15, this.getWorldColor(), 0.6);
  ring.setBlendMode(Phaser.BlendModes.ADD);
  this.tweens.add({
    targets: ring,
    scale: 2.5,
    alpha: 0,
    duration: 400,
    onComplete: () => ring.destroy()
  });
}

/**
 * Обновить позиции вагонов (физика поезда)
 */
updateWagons() {
  if (this.wagons.length === 0 || !this.player) return;
  
  // Первый вагон следует за игроком
  let prevX = this.player.x;
  let prevY = this.player.y;
  
  // Каждый вагон следует за предыдущим
  for (let i = 0; i < this.wagons.length; i++) {
    const wagon = this.wagons[i];
    if (!wagon || !wagon.isActive()) continue;
    
    // Обновляем позицию вагона, передавая позицию предыдущего
    wagon.update(prevX, prevY, this.wagonGap);
    
    // Сохраняем позицию текущего вагона для следующего
    prevX = wagon.sprite.x;
    prevY = wagon.sprite.y;
  }
}

/**
 * Столкновение вагона с воротами
 */
wagonHit(wagon, pipe) {
  if (!wagon || !wagon.isActive()) return;
  
  const destroyed = wagon.takeDamage(1);
  if (destroyed) {
    const destroyedIndex = this.wagons.findIndex(w => w === wagon);
    this.wagons = this.wagons.filter(w => w !== wagon);
    
    // Переиндексация оставшихся вагонов (обновляем множители)
    for (let i = 0; i < this.wagons.length; i++) {
      this.wagons[i].updateMultiplierAfterDetach(i);
    }
    
    // Эффект потери вагона
    this.createWagonLostEffect(wagon, destroyedIndex);
    
    // Показываем уведомление
    this.showNotification(`💔 ВАГОН ПОТЕРЯН! МНОЖИТЕЛЬ СНИЖЕН`, 1500, '#ff4444');
  }
  
  if (this.wagonCountText) {
    this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
    this.tweens.add({
      targets: this.wagonCountText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      yoyo: true
    });
  }
  
  // Обновляем зум камеры после потери вагона
  this.updateCameraZoom();
}

/**
 * Эффект потери вагона
 */
createWagonLostEffect(wagon, index) {
  if (!wagon || !wagon.sprite) return;
  
  // Взрывные частицы
  for (let i = 0; i < 15; i++) {
    const particle = this.add.circle(
      wagon.sprite.x + Phaser.Math.Between(-20, 20),
      wagon.sprite.y + Phaser.Math.Between(-20, 20),
      Phaser.Math.Between(3, 6),
      0xff4444,
      0.9
    );
    particle.setBlendMode(Phaser.BlendModes.ADD);
    
    this.tweens.add({
      targets: particle,
      alpha: 0,
      scale: 0,
      x: particle.x + Phaser.Math.Between(-80, 80),
      y: particle.y + Phaser.Math.Between(-80, 80),
      duration: 500,
      onComplete: () => particle.destroy()
    });
  }
  
  // Ударная волна
  const shockwave = this.add.circle(wagon.sprite.x, wagon.sprite.y, 15, 0xff6666, 0.7);
  shockwave.setBlendMode(Phaser.BlendModes.ADD);
  this.tweens.add({
    targets: shockwave,
    scale: 3,
    alpha: 0,
    duration: 400,
    onComplete: () => shockwave.destroy()
  });
  
  // Тряска камеры
  this.cameras.main.shake(200, 0.008);
}

/**
 * Обновить зум камеры в зависимости от количества вагонов
 */
/**
 * Обновить зум камеры в зависимости от количества вагонов
 */
updateCameraZoom() {
  if (!this.player) return;
  const baseZoom = 1.0;
  let targetZoom = baseZoom;
  if (this.wagons.length > 0) {
    const zoomReduction = Math.min(0.35, this.wagons.length * 0.025);
    targetZoom = baseZoom - zoomReduction;
    targetZoom = Math.max(0.7, targetZoom);
  }
  if (this._lastTargetZoom === targetZoom) return;
  this._lastTargetZoom = targetZoom;

  if (this.cameraZoomTween) {
    this.cameraZoomTween.stop();
    this.cameraZoomTween = null;
  }
  this.cameraZoomTween = this.tweens.add({
    targets: this.cameras.main,
    zoom: targetZoom,
    duration: 600,
    ease: 'Sine.easeInOut',
    onUpdate: () => this.cameras.main.centerOn(this.player.x, this.player.y),
    onComplete: () => { this.cameraZoomTween = null; }
  });
}

/**
 * Переиндексация вагонов после потери (обновление множителей)
 */
reindexWagons() {
  for (let i = 0; i < this.wagons.length; i++) {
    const wagon = this.wagons[i];
    if (wagon && typeof wagon.updateMultiplierAfterDetach === 'function') {
      wagon.updateMultiplierAfterDetach(i);
    }
  }
  // Обновляем счётчик
  if (this.wagonCountText) {
    this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
  }
}

/**
 * Получить общий множитель от всех вагонов
 */
getTotalWagonMultiplier() {
  let total = 1;
  for (const wagon of this.wagons) {
    if (wagon.isConnected && wagon.isActive()) {
      total *= wagon.getMultiplier();
    }
  }
  return total;
}

/**
 * Проверить, есть ли активные вагоны
 */
hasActiveWagons() {
  return this.wagons.some(wagon => wagon.isActive() && wagon.isConnected);
}

/**
 * Получить количество активных вагонов
 */
getActiveWagonCount() {
  return this.wagons.filter(wagon => wagon.isActive() && wagon.isConnected).length;
}
  /**
   * Обновление параметров сложности на основе gameLevel
   */
  updateDifficulty() {
  const diff = this.getDifficulty();
  this.baseSpeed = diff.speed; // Обновляем базовую скорость
  this.gapSize = diff.gap;
  this.spawnDelay = diff.spawnDelay;
  
  if (!this.bonusActive) {
    this.currentSpeed = this.baseSpeed;
  }
  
  this.updateExistingObjectsSpeed();
  
  console.log(`Уровень ${this.gameLevel}: скорость ${this.baseSpeed}px/с, зазор ${this.gapSize}px`);
}
updateExistingObjectsSpeed() {
  // Ворота
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
  
  // Зоны прохода
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
  
  // Монеты не трогаем — они управляются вручную через класс Coin
}

  /**
   * Получение параметров сложности - УЧИТЫВАЕТ МИР И ВНУТРЕННИЙ УРОВЕНЬ
   */
  getDifficulty() {
  const level = Math.min(this.gameLevel, 20);
  const worldBonus = this.world * 0.1;
  
  // Базовая скорость
  const baseSpeed = 240 * (1 + worldBonus);
  const speed = Math.floor(baseSpeed * Math.pow(1.05, level));
  
  // Зазор между воротами
  const baseGap = 240;
  const gap = Math.max(140, Math.floor(baseGap - level * 3));
  
  // Задержка спавна
  const baseDelay = 1500;
  const spawnDelay = Math.max(600, Math.floor(baseDelay - level * 30));
  
  // Шансы (плавное нарастание)
  const asteroidChance = Math.min(0.5, 0.12 + level * 0.012);
  const powerUpChance = Math.min(0.25, 0.08 + level * 0.008);
  const coinChance = Math.min(0.85, 0.7 + level * 0.008);
  
  return {
    speed: Math.max(200, speed),
    gap: Math.max(120, gap),
    spawnDelay: Math.max(400, spawnDelay),
    coinChance: coinChance,
    asteroidChance: asteroidChance,
    powerUpChance: powerUpChance
  };
}

  /**
   * Обновление прогресса уровня мира (НОВЫЙ МЕТОД)
   */
  updateWorldProgress() {
    if (!this.started || this.dead) return;

    // Обновляем gameLevel каждые 1000 метров (без показа надписи)
    const newGameLevel = Math.floor(this.levelProgress / 1000);
    if (newGameLevel > this.gameLevel) {
      this.gameLevel = newGameLevel;
      this.updateDifficulty(); // скорость увеличивается
    }

    // Проверяем завершение уровня мира (10 км)
    if (this.levelProgress >= this.levelGoal) {
      this.completeWorldLevel();
    }
  }

  /**
   * Завершение текущего уровня мира (НОВЫЙ МЕТОД)
   */
  /**
 * Завершение текущего уровня мира (НОВЫЙ МЕТОД)
 */
completeWorldLevel() {
  if (this.level < 9) { // максимум 10 уровней в мире (0-9)
    this.level++;
    this.levelProgress = 0;
    this.gameLevel = 0; // сбрасываем внутренний уровень

    // Обновляем конфигурацию уровня
    if (this.levelManager) {
      this.levelManager.switchLevel(this.level);
    }

    // Показываем сообщение о новом уровне мира
    const w = this.scale.width;
    const levelText = this.add.text(w / 2, 200, `УРОВЕНЬ МИРА ${this.level + 1}`, {
      fontSize: '28px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#00ffff',
      stroke: '#ff00ff',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    this.tweens.add({
      targets: levelText,
      alpha: 0,
      duration: 2000,
      onComplete: () => levelText.destroy()
    });

    // Бонус за прохождение уровня
    this.crystals += 50;
    if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
    if (gameManager.data) {
      gameManager.data.crystals = this.crystals;
      gameManager.save();
    }

    // ВАЖНО: Разблокируем следующий уровень в GameManager
    if (gameManager.unlockLevel) {
      gameManager.unlockLevel(this.world, this.level);
    }

    this.checkStationSpawn();
    
    if (this.questSystem) {
      this.questSystem.updateProgress('level', 1);
    }
  } else {
    // Достигнут последний уровень мира - переходим к следующему миру
    this.completeWorld();
  }
}

  /**
   * Завершение мира, переход к следующему (НОВЫЙ МЕТОД)
   */
  completeWorld() {
    if (this.world < 4) { // максимум 5 миров (0-4)
      this.world++;
      this.level = 0;
      this.levelProgress = 0;
      this.gameLevel = 0;

      // Обновляем конфигурацию мира
      this.worldConfig = LEVEL_CONFIG[this.world] || LEVEL_CONFIG[0];
      
      if (this.levelManager) {
        this.levelManager.switchLevel(0);
      }

      // Обновляем текстуры ворот
      this.gateTextures = this.worldConfig.gateColors || [
        'gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'
      ];

      // Показываем сообщение о новом мире
      const worldName = this.worldConfig.name || `МИР ${this.world + 1}`;
      const w = this.scale.width;
      const worldText = this.add.text(w / 2, 200, worldName, {
        fontSize: '32px',
        fontFamily: "'Orbitron', sans-serif",
        color: '#ff00ff',
        stroke: '#00ffff',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

      this.tweens.add({
        targets: worldText,
        alpha: 0,
        duration: 2000,
        onComplete: () => worldText.destroy()
      });

      // Бонус за прохождение мира
      this.crystals += 200;
      if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
      if (gameManager.data) {
        gameManager.data.crystals = this.crystals;
        gameManager.save();
      }

      // Сохраняем прогресс
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

    // ===== ИНИЦИАЛИЗАЦИЯ ОСНОВНЫХ ПАРАМЕТРОВ =====
    this.world = gameManager.getCurrentWorld?.() || 0;
    this.level = gameManager.getCurrentLevel?.() || 0;
    
    // НОВЫЕ ПАРАМЕТРЫ ДЛЯ ПРОГРЕССИИ
    this.levelGoal = 10000;  // 10 км для прохождения уровня мира
    this.levelProgress = 0;   // прогресс в текущем уровне мира

    this.worldConfig = LEVEL_CONFIG[this.world] || LEVEL_CONFIG[0];

    // Основные параметры игры
    this.score = 0;
    this.crystals = gameManager.data?.crystals || 0;
    this.meters = 0;          // общий метраж (для статистики)
    this.best = Number(localStorage.getItem('skypulse_best') || 0);

    // ===== ПАРАМЕТРЫ ВАГОНОВ =====
    this.wagons = [];
    this.collectedCoins = 0;
    this.coinsForWagon = 10;
    this.maxWagons = 12 + ((gameManager.data?.upgrades?.maxWagons) || 0) * 2;
    this.wagonGap = 52 - ((gameManager.data?.upgrades?.wagonGap) || 0) * 2;
    this.wagonSpring = 0.25;
    this.targetPlayerX = 110;
    this.playerXSpeed = 0.05;
    this.maxTargetX = 200;

    // ===== СОСТОЯНИЯ ИГРЫ =====
    this.started = false;
    this.dead = false;
    this.gameLevel = 0;        // внутренний уровень сложности (0-20)
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
    this.baseSpeed = 240;       // будет обновлено в getDifficulty
    this.currentSpeed = 240;
    this.gapSize = 240;
    this.spawnDelay = 1300;
    
    // Текстуры ворот из конфига мира
    this.gateTextures = this.worldConfig.gateColors || [
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
    this.magnetRange = 220 + ((gameManager.data?.upgrades?.magnetRange) || 0) * 40;
    this.lastBonusTime = 0;
    this.shieldDuration = 5 + ((gameManager.data?.upgrades?.shieldDuration) || 0) * 1.5;
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
    this.coinGroup = this.add.group();
    this.asteroidGroup = this.physics.add.group();
    this.powerUpGroup = this.physics.add.group();
    this.playerBullets = this.physics.add.group({
  classType: Phaser.GameObjects.Image,
  runChildUpdate: false,
  allowGravity: false
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
  this.updateBackground(delta);
  
  if (!this.started || this.dead || !this.player) return;
  
  this.updatePlayerMovement();
  this.updateBonuses(delta);
  this.updateWorldProgress();
  this.updateObjects(delta);
  this.checkAchievementsAndRecords();

  // ===== ОБНОВЛЕНИЕ ФОНА =====
  this.updateStars(time, delta);
  this.updatePlanets(delta);
  this.updateShips(delta);
  this.updateAsteroids(delta);

  // ===== ПРИНУДИТЕЛЬНЫЙ КОНТРОЛЬ ГРАВИТАЦИИ =====
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

  // ===== ОБНОВЛЕНИЕ ПОЗИЦИИ ИГРОКА =====
  this.targetPlayerX = Math.min(this.maxTargetX, this.targetPlayerX);
  this.player.x += (this.targetPlayerX - this.player.x) * this.playerXSpeed;

  const body = this.player.body;
  if (body) {
    this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75));
  }

  // ===== ПРОВЕРКА СМЕРТИ =====
  if (!this.shieldActive && (this.player.y < -50 || this.player.y > this.scale.height + 50)) {
    this.handleDeath();
    return;
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
  if (this.stationPlanet && this.stationPlanet.active && this.stationActive) {
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

  // ===== РАСЧЕТ ПРИРОСТА МЕТРАЖА =====
  const distanceDelta = (this.currentSpeed * delta) / 1000 / 10;

  // Общий метраж (для статистики)
  this.meters += distanceDelta;

  // Прогресс в текущем уровне мира
  this.levelProgress += distanceDelta;

  if (this.meterText) {
    this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
  }

  // ===== ОБНОВЛЕНИЕ ПРОГРЕССА УРОВНЯ =====
  this.updateWorldProgress();

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

  // ===== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ =====
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
  // МЕТОДЫ ДЛЯ МОНЕТ
  // =========================================================================

  /**
   * Сбор монеты
   */

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
    const difficulty = this.getDifficulty(); // ← ЭТА СТРОКА ДОЛЖНА БЫТЬ
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
        if (this.player?.active) {
     this.player.setTint(0xff8888);
}
        this.time.delayedCall(500, () => {
          if (this.player) this.player.clearTint();
        });
      }
    }
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ АСТЕРОИДОВ
  // =========================================================================

  /**
 * Спавн астероида (игровой, с коллизией)
 */
spawnAsteroid() {
  // Шанс спавна зависит от уровня сложности
  const spawnChance = 0.15 + (this.gameLevel * 0.01);
  if (Math.random() > spawnChance) return;

  const w = this.scale.width;
  const h = this.scale.height;

  // Позиция спавна - справа за экраном
  const x = w + Phaser.Math.Between(50, 150);
  const y = Phaser.Math.Between(80, h - 80);

  // Создаём астероид через класс Asteroid (импортирован)
  const asteroid = new Asteroid(this, x, y, this.world, this.gameLevel);
  this.asteroids.push(asteroid);
  this.asteroidGroup.add(asteroid.sprite);

  // Коллизия с игроком
  this.physics.add.overlap(this.player, asteroid.sprite, (player, astSprite) => {
    const ast = astSprite.asteroidRef;
    if (ast?.isActive()) {
      if (this.shieldActive) {
        this.particleManager.createBonusEffect('shield', ast.sprite.x, ast.sprite.y);
        if (this.player.body) this.player.body.setVelocityY(-100);
      } else {
        this.headHP -= ast.damage;
        this.updateHearts();
        this.cameras.main.shake(150, 0.005);
        try { audioManager.playSound(this, 'hit_sound', 0.3); } catch(e) {}
        if (this.headHP <= 0) this.handleDeath();
      }
      ast.destroy(true);
      this.asteroids = this.asteroids.filter(a => a !== ast);
    }
  }, null, this);
  
  // Коллизия с вагонами
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
  
  // Коллизия с пулями игрока
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
  // Фон автоматически ускорится через update методы, так как они используют currentSpeed
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
  this.particleManager.clearAll();
  this.currentSpeed = this.baseSpeed;
  // Фон автоматически вернётся к нормальной скорости
  
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
  /**
 * Метод для проверки квестов
 */
checkQuests() {
  if (!this.questSystem) return;

  // Проверка активных квестов
  if (typeof this.questSystem.getActiveQuests === 'function') {
    const activeQuests = this.questSystem.getActiveQuests();
    
    // Если вернулся объект с полями daily, weekly, event (новая версия)
    if (activeQuests && typeof activeQuests === 'object' && !Array.isArray(activeQuests)) {
      // Обрабатываем дневные квесты
      if (Array.isArray(activeQuests.daily)) {
        for (let quest of activeQuests.daily) {
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
      
      // Обрабатываем недельные квесты
      if (Array.isArray(activeQuests.weekly)) {
        for (let quest of activeQuests.weekly) {
          if (quest.completed && !quest.claimed) {
            quest.claimed = true;
            this.crystals += quest.reward || 0;
            if (this.crystalText) {
              this.crystalText.setText(`💎 ${this.crystals}`);
            }
            this.showNotification(`Еженедельный квест выполнен! +${quest.reward || 0} 💎`, 2000, '#ffaa00');
          }
        }
      }
      
      // Обрабатываем ивентовые квесты
      if (Array.isArray(activeQuests.event)) {
        for (let quest of activeQuests.event) {
          if (quest.completed && !quest.claimed) {
            quest.claimed = true;
            this.crystals += quest.reward || 0;
            if (this.crystalText) {
              this.crystalText.setText(`💎 ${this.crystals}`);
            }
            this.showNotification(`Ивентовый квест выполнен! +${quest.reward || 0} 💎`, 2000, '#ff44ff');
          }
        }
      }
    }
    // Если вернулся массив (старая версия)
    else if (Array.isArray(activeQuests)) {
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
  // Очистка труб (ворот)
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

  // Очистка монет
  if (this.coins) {
    this.coins = this.coins.filter(c => {
      // Проверяем, активна ли монета и вышла ли за экран
      const isOutOfBounds = c.sprite && c.sprite.x < -100;
      const isInactive = !c.isActive || !c.isActive();
      
      if (isInactive || isOutOfBounds) {
        if (c && c.destroy) c.destroy();
        return false;
      }
      return true;
    });
  }

  // Очистка зон прохода
  if (this.scoreZones) {
    this.scoreZones = this.scoreZones.filter(z => {
      if (z && z.x < -60) {
        z.destroy();
        return false;
      }
      return true;
    });
  }

  // Очистка станции
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
      sprite: star,
      speed: Phaser.Math.Between(30, 80), // Скорость в пикселях в секунду
      baseSpeed: Phaser.Math.Between(30, 80),
      baseAlpha: Phaser.Math.FloatBetween(0.3, 0.9),
      scale: scale,
      flicker: Phaser.Math.FloatBetween(0.01, 0.03),
      x: star.x,
      y: star.y
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
    this.planets.push({
      sprite: planet,
      speed: Phaser.Math.Between(20, 80), // Скорость в пикселях в секунду
      baseSpeed: Phaser.Math.Between(20, 80),
      scale: scale,
      x: planet.x,
      y: planet.y
    });
  }
}

createShips() {
  const w = this.scale.width;
  const h = this.scale.height;
  const shipTextures = ['bg_ship_1', 'bg_ship_2'];

  for (let i = 0; i < 12; i++) { // Увеличил количество
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
    this.ships.push({
      sprite: ship,
      speed: Phaser.Math.Between(40, 120), // Скорость в пикселях в секунду
      baseSpeed: Phaser.Math.Between(40, 120),
      scale: scale,
      x: ship.x,
      y: ship.y
    });
  }
}

/**
 * Создание игрока
 */
createPlayer() {
  const h = this.scale.height;
  
  let skin = 'player';
  try {
    const currentSkin = gameManager.getCurrentSkin?.();
    if (currentSkin && this.textures.exists(currentSkin)) {
      skin = currentSkin;
    } else if (this.textures.exists('player')) {
      skin = 'player';
    } else {
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
  
  // Эффект свечения
  this.playerGlow = this.add.circle(this.targetPlayerX, h / 2, 32, 0x00ffff, 0.2);
  this.playerGlow.setBlendMode(Phaser.BlendModes.ADD);
  this.playerGlow.setDepth(14);
  
  this.tweens.add({
    targets: this.playerGlow,
    alpha: { from: 0.1, to: 0.3 },
    scale: { from: 1, to: 1.2 },
    duration: 800,
    yoyo: true,
    repeat: -1,
    onUpdate: () => {
      if (this.player?.active) {
        this.playerGlow.setPosition(this.player.x, this.player.y);
      }
    }
  });
  
  // Неоновый след
  this.trailEmitter = this.add.particles(0, 0, 'flare', {
    speed: { min: 30, max: 60 },
    scale: { start: 0.35, end: 0 },
    alpha: { start: 0.6, end: 0 },
    lifespan: 250,
    blendMode: Phaser.BlendModes.ADD,
    follow: this.player,
    followOffset: { x: -18, y: 0 },
    quantity: 2,
    frequency: 18,
    tint: [0x00ffff, 0xff00ff, 0xffff00]
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
      if (this.cache.audio.has(sound.key)) {
        this[sound.prop] = this.sound.add(sound.key, { volume: sound.volume });
      } else {
        this[sound.prop] = null;
      }
    } catch (e) {
      this[sound.prop] = null;
    }
  });
  
  this.hitSound = this.tapSound;
}

/**
 * Создание пользовательского интерфейса
 */
createUI() {
  const w = this.scale.width;
  const h = this.scale.height;
  
  // Создаём неоновую рамку по краям
  this.createNeonFrame();
  
  this.createTopPanel();
  this.createBottomPanel();
  
  // Контейнер сердечек с неоновым свечением
  this.heartContainer = this.add.container(12, 38).setDepth(10).setScrollFactor(0);
  this.updateHearts();
  
  // Интро текст с киберпанк-эффектом
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
  
  // Анимация пульсации интро текста
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
  
  // Создаём индикатор комбо (если ещё не создан)
  this.createComboIndicator();
}

/**
 * Создание неоновой рамки
 */
createNeonFrame() {
  const w = this.scale.width;
  const h = this.scale.height;
  
  this.frameGraphics = this.add.graphics();
  this.frameGraphics.lineStyle(2, 0x00ffff, 0.3);
  this.frameGraphics.strokeRect(8, 8, w - 16, h - 16);
  
  // Анимация свечения рамки
  this.tweens.add({
    targets: this.frameGraphics,
    alpha: { from: 0.2, to: 0.5 },
    duration: 2000,
    yoyo: true,
    repeat: -1
  });
  
  // Угловые неоновые элементы
  const cornerSize = 25;
  const corners = [
    { x: 8, y: 8, angle: 0 },
    { x: w - 8, y: 8, angle: 90 },
    { x: 8, y: h - 8, angle: -90 },
    { x: w - 8, y: h - 8, angle: 180 }
  ];
  
  corners.forEach(corner => {
    const cornerGraphics = this.add.graphics();
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

/**
 * Создание индикатора комбо
 */
createComboIndicator() {
  const w = this.scale.width;
  
  this.comboIndicator = this.add.container(w / 2, 180);
  this.comboIndicator.setDepth(12).setScrollFactor(0);
  this.comboIndicator.setVisible(false);
  
  // Фон индикатора
  const bg = this.add.graphics();
  bg.fillStyle(0x1a1a3a, 0.85);
  bg.fillRoundedRect(-60, -20, 120, 40, 12);
  bg.lineStyle(2, 0xff44ff, 0.8);
  bg.strokeRoundedRect(-60, -20, 120, 40, 12);
  
  // Текст комбо
  this.comboValueText = this.add.text(0, 0, 'x1', {
    fontSize: '24px',
    fontFamily: "'Audiowide', sans-serif",
    color: '#ff44ff',
    stroke: '#ff00ff',
    strokeThickness: 2
  }).setOrigin(0.5);
  
  this.comboIndicator.add([bg, this.comboValueText]);
}

/**
 * Обновление индикатора комбо
 */
updateComboIndicator(combo) {
  if (!this.comboIndicator) return;
  
  if (combo > 1) {
    this.comboIndicator.setVisible(true);
    this.comboValueText.setText(`x${combo}`);
    
    // Анимация при увеличении комбо
    this.tweens.add({
      targets: this.comboIndicator,
      scale: { from: 1, to: 1.1 },
      duration: 100,
      yoyo: true
    });
    
    // Меняем цвет в зависимости от комбо
    if (combo >= 20) {
      this.comboValueText.setColor('#ff4444');
      this.comboValueText.setStroke('#ff0000');
    } else if (combo >= 10) {
      this.comboValueText.setColor('#ffaa00');
      this.comboValueText.setStroke('#ff8800');
    } else {
      this.comboValueText.setColor('#ff44ff');
      this.comboValueText.setStroke('#ff00ff');
    }
  } else {
    this.comboIndicator.setVisible(false);
  }
}

createTopPanel() {
  const w = this.scale.width;
  const worldColor = this.getWorldColor();
  
  // Счёт с неоновым эффектом
  this.scoreText = this.add.text(w / 2, 22, '0', {
    fontSize: '48px',
    fontFamily: "'Audiowide', 'Orbitron', sans-serif",
    color: '#ffffff',
    stroke: worldColor,
    strokeThickness: 6,
    shadow: { blur: 15, color: worldColor, fill: true }
  }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  
  // Лучший результат
  this.bestText = this.add.text(12, 10, `🏆 ${this.best}`, {
    fontSize: '12px',
    fontFamily: "'Share Tech Mono', monospace",
    color: '#ffaa44',
    stroke: '#000000',
    strokeThickness: 2
  }).setDepth(10).setScrollFactor(0);
  
  // Кристаллы с анимацией
  this.crystalText = this.add.text(w - 12, 10, `💎 ${this.crystals}`, {
    fontSize: '12px',
    fontFamily: "'Share Tech Mono', monospace",
    color: '#ffaa44',
    stroke: '#000000',
    strokeThickness: 2
  }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);
  
  // Текст активного бонуса
  this.bonusText = this.add.text(w - 12, 42, '', {
    fontSize: '12px',
    fontFamily: "'Orbitron', sans-serif",
    stroke: '#000000',
    strokeThickness: 2,
    align: 'right'
  }).setOrigin(1, 0).setDepth(10).setVisible(false).setScrollFactor(0);
  
  // Текст уровня (появляется при переходе)
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
  
  // Метраж
  this.meterText = this.add.text(12, h - 70, `📏 ${Math.floor(this.meters)} м`, {
    fontSize: '11px',
    fontFamily: "'Share Tech Mono', monospace",
    color: '#88ccff',
    stroke: '#000000',
    strokeThickness: 2
  }).setDepth(10).setScrollFactor(0);
  
  // Счётчик вагонов
  this.wagonCountText = this.add.text(w - 12, h - 70, `🚃 ${this.wagons.length}/${this.maxWagons}`, {
    fontSize: '11px',
    fontFamily: "'Share Tech Mono', monospace",
    color: '#88ccff',
    stroke: '#000000',
    strokeThickness: 2
  }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);
  
  // Индикатор сложности (появляется при повышении)
  this.difficultyIndicator = this.add.text(w / 2, h - 35, '', {
    fontSize: '10px',
    fontFamily: "'Orbitron', sans-serif",
    color: '#ffaa00',
    stroke: '#000000',
    strokeThickness: 1
  }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  this.difficultyIndicator.setVisible(false);
}

/**
 * Создание кнопок управления (улучшенные)
 */
createButtons() {
  const w = this.scale.width;
  const h = this.scale.height;
  const worldColor = this.getWorldColorString();
  
  // Кнопка паузы
  this.pauseButton = this.add.circle(w - 35, h - 35, 24, 0x1a1a3a, 0.9);
  this.pauseButton.setStrokeStyle(2, 0x00ffff, 0.9);
  this.pauseButton.setInteractive({ useHandCursor: true });
  this.pauseButton.setDepth(20);
  
  const pauseIcon = this.add.text(w - 35, h - 35, '⏸️', {
    fontSize: '26px'
  }).setOrigin(0.5).setDepth(21);
  
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
  
  const menuIcon = this.add.text(w - 95, h - 35, '⚙️', {
    fontSize: '26px'
  }).setOrigin(0.5).setDepth(21);
  
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
  
  // Кнопка атаки (если нужно)
  this.attackButton = this.add.circle(45, h - 35, 24, 0x1a1a3a, 0.9);
  this.attackButton.setStrokeStyle(2, 0xff4444, 0.9);
  this.attackButton.setInteractive({ useHandCursor: true });
  this.attackButton.setDepth(20);
  
  const attackIcon = this.add.text(45, h - 35, '⚔️', {
    fontSize: '24px'
  }).setOrigin(0.5).setDepth(21);
  
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

/**
 * Получить цвет мира для UI
 */
getWorldColor() {
  const colors = [0x00ffff, 0xff00ff, 0xff6600, 0xffaa00, 0xaa88ff];
  return colors[this.world] || 0x00ffff;
}

getWorldColorString() {
  const colors = ['#00ffff', '#ff00ff', '#ff6600', '#ffaa00', '#aa88ff'];
  return colors[this.world] || '#00ffff';
}

/**
 * Показать индикатор сложности
 */
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
      
      // Применяем эффект скина
      this.applySkinEffect(currentSkin);
    }
  } catch (e) {
    console.warn('Error applying skin stats:', e);
  }
}

/**
 * Применение визуального эффекта скина
 */
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
    gold: () => {
      this.player.setTint(0xffaa00);
    },
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
    speed: 30,
    scale: { start: 0.2, end: 0 },
    alpha: { start: 0.5, end: 0 },
    lifespan: 300,
    quantity: 1,
    frequency: 40,
    blendMode: Phaser.BlendModes.ADD,
    tint: [0xff00ff, 0x00ffff],
    follow: this.player,
    followOffset: { x: -15, y: 0 }
  });
}

createFireTrail() {
  if (this.fireTrail) return;
  
  this.fireTrail = this.add.particles(0, 0, 'flare', {
    speed: 40,
    scale: { start: 0.3, end: 0 },
    alpha: { start: 0.6, end: 0 },
    lifespan: 250,
    quantity: 2,
    frequency: 30,
    blendMode: Phaser.BlendModes.ADD,
    tint: [0xff4400, 0xff8800],
    follow: this.player,
    followOffset: { x: -18, y: 0 }
  });
}

createIceTrail() {
  if (this.iceTrail) return;
  
  this.iceTrail = this.add.particles(0, 0, 'flare', {
    speed: 35,
    scale: { start: 0.25, end: 0 },
    alpha: { start: 0.5, end: 0 },
    lifespan: 280,
    quantity: 2,
    frequency: 35,
    blendMode: Phaser.BlendModes.ADD,
    tint: [0x44aaff, 0x88ccff],
    follow: this.player,
    followOffset: { x: -16, y: 0 }
  });
}

/**
 * Звук при наведении
 */
playHoverSound() {
  try {
    audioManager.playSound(this, 'tap_sound', 0.1);
  } catch (e) {}
}

/**
 * Атака по врагам (с учётом улучшений оружия)
 */
attackEnemies() {
  if (this.weaponCooldown > 0) return;
  if (!this.player || !this.player.active) return;
  if (!this.playerBullets) return;
  
  this.weaponCooldown = this.weaponFireDelay;
  
  // Создаём пулю
  const bullet = this.playerBullets.create(
    this.player.x + 30, 
    this.player.y, 
    'laser_player'
  );
  
  if (!bullet) return;
  
  // Применяем улучшения
  bullet.setScale(1.5);
  bullet.damage = this.weaponDamage;        // урон
  bullet.setDepth(20);
  
  // Физика пули
  bullet.body.setAllowGravity(false);
  bullet.body.setGravityY(0);
  bullet.body.setVelocityX(this.weaponBulletSpeed);  // скорость пули
  bullet.body.setVelocityY(0);
  
  // Эффект выстрела
  this.createMuzzleFlash(this.player.x + 30, this.player.y);
  
  // Звук
  try { 
    audioManager.playSound(this, 'tap_sound', 0.3); 
  } catch(e) {}
  
  // Анимация кнопки
  if (this.attackButton) {
    this.tweens.add({
      targets: this.attackButton,
      scale: 0.8,
      duration: 100,
      yoyo: true
    });
  }
}

fireEnemyBullet(enemy, playerPos) {
  if (!this.enemyBullets) return;
  
  const bullet = this.enemyBullets.create(
    enemy.sprite.x - 15,
    enemy.sprite.y,
    'laser_enemy'
  );
  
  if (!bullet) return;
  
  bullet.setScale(1.2);
  bullet.damage = enemy.config.bulletDamage;
  bullet.body.setAllowGravity(false);
  bullet.body.setGravityY(0);
  
  const angle = Phaser.Math.Angle.Between(
    bullet.x, bullet.y,
    playerPos.x, playerPos.y
  );
  
  const speed = enemy.config.bulletSpeed;
  bullet.setVelocityX(Math.cos(angle) * speed);
  bullet.setVelocityY(Math.sin(angle) * speed);
  
  bullet.setDepth(20);
  bullet.active = true;
  bullet.enemyBullet = true;
  
  this.createMuzzleFlash(enemy.sprite.x - 20, enemy.sprite.y);
}

/**
 * Создание эффекта вспышки выстрела
 */
createMuzzleFlash(x, y) {
  const flash = this.add.circle(x, y, 8, 0xffaa44, 0.8);
  flash.setBlendMode(Phaser.BlendModes.ADD);
  this.tweens.add({
    targets: flash,
    alpha: 0,
    scale: 2,
    duration: 100,
    onComplete: () => flash.destroy()
  });
}

setupCollisions() {
  // Передаём объект монеты через coinRef
  this.physics.add.overlap(this.player, this.coinGroup, (p, c) => {
    if (c.coinRef) this.collectCoin(c.coinRef);
  }, null, this);
  
  this.physics.add.overlap(this.enemyBullets, this.player, (bullet, player) => {
    if (this.damageSystem) {
      this.damageSystem.playerHitByBullet(player, bullet);
    }
  }, null, this);
  
  this.physics.add.overlap(this.enemyBullets, this.wagons, (bullet, wagon) => {
    if (!bullet?.active || !wagon?.active) return;
    if (wagon.takeDamage) {
      const destroyed = wagon.takeDamage(1);
      if (destroyed) {
        this.wagons = this.wagons.filter(w => w !== wagon);
      }
    }
    bullet.destroy();
  }, null, this);
  
  // Коллизия астероидов с игроком и вагонами
  this.physics.add.overlap(this.player, this.asteroidGroup, (player, astSprite) => {
    const ast = astSprite.asteroidRef;
    if (ast?.isActive()) {
      if (this.shieldActive) {
        this.particleManager.createBonusEffect('shield', ast.sprite.x, ast.sprite.y);
      } else {
        this.headHP -= ast.damage;
        this.updateHearts();
        this.cameras.main.shake(150, 0.005);
        try { audioManager.playSound(this, 'hit_sound', 0.3); } catch(e) {}
        
        if (this.headHP <= 0) {
          this.handleDeath();
        }
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
      
      // Анимация для последнего сердца
      if (i === this.headHP - 1 && this.headHP > 0 && this.headHP < this.maxHeadHP) {
        this.tweens.add({
          targets: heart,
          scaleX: { from: 0.55, to: 0.7 },
          scaleY: { from: 0.55, to: 0.7 },
          duration: 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
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
    fontSize: '26px',
    fontFamily: "'Audiowide', 'Orbitron', sans-serif",
    color: '#ff4444',
    stroke: '#ff00ff',
    strokeThickness: 4,
    shadow: { blur: 15, color: '#ff0000', fill: true }
  }).setOrigin(0.5);
  
  const subtitle = this.add.text(0, -20, '', {
    fontSize: '12px',
    fontFamily: "'Share Tech Mono', monospace",
    color: '#88ccff',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 2,
    lineSpacing: 6
  }).setOrigin(0.5);
  this.gameOverSubtitle = subtitle;
  
  const tip = this.add.text(0, 75, '👆 НАЖМИТЕ, ЧТОБЫ ПРОДОЛЖИТЬ', {
    fontSize: '11px',
    fontFamily: "'Orbitron', sans-serif",
    color: '#88aaff',
    stroke: '#000000',
    strokeThickness: 1
  }).setOrigin(0.5);
  
  const glowLine = this.add.graphics();
  glowLine.lineStyle(2, worldColor, 0.6);
  glowLine.moveTo(-80, 105);
  glowLine.lineTo(80, 105);
  glowLine.strokePath();
  
  this.tweens.add({
    targets: glowLine,
    alpha: { from: 0.3, to: 0.9 },
    duration: 800,
    yoyo: true,
    repeat: -1
  });
  
  this.gameOverBox.add([panelBg, innerGlow, title, subtitle, tip, glowLine]);
}

// =========================================================================
// МЕТОДЫ УПРАВЛЕНИЯ ПАУЗОЙ И ВЫХОДОМ
// =========================================================================

/**
 * Переключение паузы
 */
togglePause() {
  this.isPaused = !this.isPaused;
  
  if (this.isPaused) {
    this.physics.pause();
    if (this.spawnTimer) this.spawnTimer.paused = true;
    if (this.bonusTimer) this.bonusTimer.paused = true;
    if (this.stationTimer) this.stationTimer.paused = true;
    
    // Создаём оверлей (НЕ интерактивный)
    this.pauseOverlay = this.add.rectangle(
      this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height,
      0x000000, 0.85
    ).setDepth(100).setScrollFactor(0);
    
    // Неоновая рамка
    this.pauseBorder = this.add.graphics();
    this.pauseBorder.lineStyle(3, 0x00ffff, 0.9);
    this.pauseBorder.strokeRoundedRect(
      this.scale.width / 2 - 150,
      this.scale.height / 2 - 110,
      300, 220, 25
    );
    this.pauseBorder.setDepth(101);
    
    // Текст паузы
    this.pauseText = this.add.text(
      this.scale.width / 2, this.scale.height / 2 - 50,
      '⏸️ ПАУЗА',
      {
        fontSize: '52px',
        fontFamily: "'Audiowide', 'Orbitron', sans-serif",
        color: '#ffffff',
        stroke: '#00ffff',
        strokeThickness: 6,
        shadow: { blur: 25, color: '#00ffff', fill: true }
      }
    ).setOrigin(0.5).setDepth(102).setScrollFactor(0);
    
    this.pauseTip = this.add.text(
      this.scale.width / 2, this.scale.height / 2 + 30,
      '✦ НАЖМИТЕ КНОПКУ ПАУЗЫ, ЧТОБЫ ПРОДОЛЖИТЬ ✦',
      {
        fontSize: '12px',
        fontFamily: "'Share Tech Mono', monospace",
        color: '#88aaff',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5).setDepth(102).setScrollFactor(0);
    
    // Анимация рамки
    this.tweens.add({
      targets: this.pauseBorder,
      alpha: { from: 0.6, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
    // Пульсация текста
    this.tweens.add({
      targets: this.pauseText,
      scale: { from: 1, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
  } else {
    this.physics.resume();
    if (this.spawnTimer) this.spawnTimer.paused = false;
    if (this.bonusTimer) this.bonusTimer.paused = false;
    if (this.stationTimer) this.stationTimer.paused = false;
    
    // Удаляем элементы паузы
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

/**
 * Подтверждение выхода в меню
 */
confirmExit() {
  if (this.dead) return;
  if (this.exitDialogActive) return;
  this.exitDialogActive = true;
  
  this.isPaused = true;
  this.physics.pause();
  
  const w = this.scale.width;
  const h = this.scale.height;
  
  // Оверлей (НЕ интерактивный)
  this.exitOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85)
    .setDepth(150).setScrollFactor(0);
  
  // Панель
  this.exitPanel = this.add.graphics();
  this.exitPanel.fillStyle(0x0a0a1a, 0.98);
  this.exitPanel.fillRoundedRect(w / 2 - 150, h / 2 - 115, 300, 250, 25);
  this.exitPanel.lineStyle(3, 0xff00ff, 0.9);
  this.exitPanel.strokeRoundedRect(w / 2 - 150, h / 2 - 115, 300, 250, 25);
  this.exitPanel.setDepth(151);
  
  // Иконка
  this.exitIcon = this.add.text(w / 2, h / 2 - 65, '⚠️', {
    fontSize: '48px'
  }).setOrigin(0.5).setDepth(152);
  
  // Текст
  this.exitText = this.add.text(w / 2, h / 2 - 15, 'ВЫЙТИ В МЕНЮ?', {
    fontSize: '24px',
    fontFamily: "'Audiowide', 'Orbitron', sans-serif",
    color: '#ffffff',
    stroke: '#ff00ff',
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(152);
  
  this.exitSubText = this.add.text(w / 2, h / 2 + 15, '⚠️ Весь прогресс будет потерян ⚠️', {
    fontSize: '10px',
    fontFamily: "'Share Tech Mono', monospace",
    color: '#ffaa66'
  }).setOrigin(0.5).setDepth(152);
  
  // Кнопка ДА (стильная)
  this.yesBtn = this.add.text(w / 2 - 80, h / 2 + 75, 'ДА', {
    fontSize: '20px',
    fontFamily: "'Audiowide', sans-serif",
    color: '#00ff00',
    backgroundColor: '#1a3a1a',
    padding: { x: 25, y: 10 },
    stroke: '#00ff00',
    strokeThickness: 2
  }).setInteractive({ useHandCursor: true }).setOrigin(0.5).setDepth(200);
  
  // Кнопка НЕТ (стильная)
  this.noBtn = this.add.text(w / 2 + 80, h / 2 + 75, 'НЕТ', {
    fontSize: '20px',
    fontFamily: "'Audiowide', sans-serif",
    color: '#ff4444',
    backgroundColor: '#3a1a1a',
    padding: { x: 25, y: 10 },
    stroke: '#ff4444',
    strokeThickness: 2
  }).setInteractive({ useHandCursor: true }).setOrigin(0.5).setDepth(200);
  
  // Обработчики кнопок
  this.yesBtn.on('pointerover', () => {
    this.yesBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' });
  });
  this.yesBtn.on('pointerout', () => {
    this.yesBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a3a1a' });
  });
  this.yesBtn.on('pointerdown', (pointer) => {
    pointer.event.stopPropagation();
    this.exitToMenu();
  });
  
  this.noBtn.on('pointerover', () => {
    this.noBtn.setStyle({ color: '#ffffff', backgroundColor: '#aa0000' });
  });
  this.noBtn.on('pointerout', () => {
    this.noBtn.setStyle({ color: '#ff4444', backgroundColor: '#3a1a1a' });
  });
  this.noBtn.on('pointerdown', (pointer) => {
    pointer.event.stopPropagation();
    this.closeExitDialog();
  });
}

/**
 * Закрытие диалога выхода
 */
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
  
  // Возвращаем игру
  this.isPaused = false;
  this.physics.resume();
  
  // Возобновляем таймеры
  if (this.spawnTimer) this.spawnTimer.paused = false;
  if (this.bonusTimer) this.bonusTimer.paused = false;
  if (this.stationTimer) this.stationTimer.paused = false;
}

/**
 * Выход в меню с полной очисткой
 */
exitToMenu() {
  // Останавливаем все таймеры
  if (this.spawnTimer) this.spawnTimer.remove();
  if (this.bonusTimer) this.bonusTimer.remove();
  if (this.stationTimer) this.stationTimer.remove();
  if (this.resumeCountdownTimer) this.resumeCountdownTimer?.remove();
  
  // Очищаем частицы
  if (this.particleManager) this.particleManager.clearAll();
  if (this.trailEmitter) {
    this.trailEmitter.stop();
    this.trailEmitter.destroy();
  }
  
  // Удаляем элементы паузы
  if (this.pauseBorder) this.pauseBorder.destroy();
  if (this.pauseText) this.pauseText.destroy();
  if (this.pauseTip) this.pauseTip.destroy();
  if (this.pauseOverlay) this.pauseOverlay.destroy();
  
  // Удаляем диалог выхода
  if (this.exitOverlay) this.exitOverlay.destroy();
  if (this.exitPanel) this.exitPanel.destroy();
  if (this.exitIcon) this.exitIcon.destroy();
  if (this.exitText) this.exitText.destroy();
  if (this.exitSubText) this.exitSubText.destroy();
  if (this.yesBtn) this.yesBtn.destroy();
  if (this.noBtn) this.noBtn.destroy();
  
  // Удаляем кнопки
  if (this.pauseButton) this.pauseButton.destroy();
  if (this.menuButton) this.menuButton.destroy();
  if (this.pauseIcon) this.pauseIcon.destroy();
  if (this.menuIcon) this.menuIcon.destroy();
  
  // Удаляем окно Game Over
  if (this.gameOverBox) this.gameOverBox.destroy();
  
  // Очищаем массивы объектов
  if (this.pipes) {
    this.pipes.forEach(p => p?.destroy());
    this.pipes = [];
  }
  if (this.coins) {
    this.coins.forEach(c => c?.destroy());
    this.coins = [];
  }
  if (this.wagons) {
    this.wagons.forEach(w => w?.destroy());
    this.wagons = [];
  }
  if (this.scoreZones) {
    this.scoreZones.forEach(z => z?.destroy());
    this.scoreZones = [];
  }
  if (this.asteroids) {
    this.asteroids.forEach(a => a?.destroy());
    this.asteroids = [];
  }
  if (this.powerUps) {
    this.powerUps.forEach(p => p?.destroy());
    this.powerUps = [];
  }
  
  // Очищаем системы
  if (this.comboSystem?.destroy) this.comboSystem.destroy();
  if (this.specialEventManager?.destroy) this.specialEventManager.destroy();
  if (this.levelManager?.destroy) this.levelManager.destroy();
  if (this.waveManager?.destroy) this.waveManager.destroy();
  
  // Сбрасываем флаги
  this.exitDialogActive = false;
  this.isPaused = false;
  
  // Переходим в меню
  this.scene.start('menu');
}

/**
 * Показать уведомление
 */
showNotification(text, duration = 1500, color = '#ffffff') {
  const w = this.scale.width;
  
  const notification = this.add.text(w / 2, 80, text, {
    fontSize: '16px',
    fontFamily: "'Orbitron', monospace",
    color: color,
    stroke: '#000000',
    strokeThickness: 2,
    align: 'center'
  }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
  
  notification.setAlpha(0);
  
  this.tweens.add({
    targets: notification,
    alpha: 1,
    duration: 100
  });
  
  this.tweens.add({
    targets: notification,
    alpha: 0,
    delay: duration - 300,
    duration: 300,
    onComplete: () => notification.destroy()
  });
}

/**
 * Запуск игры
 */
startRun() {
  this.started = true;
  
  // Скрываем интро текст с анимацией
  if (this.introText) {
    this.tweens.add({
      targets: this.introText,
      alpha: 0,
      y: this.introText.y - 20,
      duration: 300,
      onComplete: () => this.introText.setVisible(false)
    });
  }
  
  if (this.coinTipsText) {
    this.tweens.add({
      targets: this.coinTipsText,
      alpha: 0,
      duration: 300,
      onComplete: () => this.coinTipsText.setVisible(false)
    });
  }
  
  // Небольшая задержка перед спавном
  this.time.delayedCall(200, () => {
    this.spawnGate();
    this.scheduleNextSpawn();
    this.checkStationSpawn();
    
    // Эффект старта
    this.cameras.main.flash(200, 100, 255, 100, false);
    
    // Звук старта
    try {
      if (this.levelUpSound) this.levelUpSound.play();
    } catch (e) {}
  });
}

/**

 * Планирование следующего спавна ворот
 */
scheduleNextSpawn() {
  if (this.dead) return;
  
  // Исправлено: получаем difficulty через this.getDifficulty()
  const difficulty = this.getDifficulty();
  const delay = Math.max(300, Math.min(2000, difficulty.spawnDelay));
  
  this.spawnTimer = this.time.delayedCall(delay, () => {
    if (!this.dead && this.started && !this.isPaused) {
      this.spawnGate();
      this.scheduleNextSpawn();
    }
  });
}

/**
 * Показать уведомление о старте волны (дополнительный метод)
 */
showWaveStartNotification(waveNumber) {
  const w = this.scale.width;
  const h = this.scale.height;
  
  const container = this.add.container(w / 2, h / 2 - 100);
  container.setDepth(50);
  container.setScrollFactor(0);
  
  const bg = this.add.rectangle(0, 0, 280, 70, 0x0a0a1a, 0.95);
  bg.setStrokeStyle(2, 0xff00ff, 0.8);
  
  const text = this.add.text(0, 0, `⚔️ ВОЛНА ${waveNumber} ⚔️`, {
    fontSize: '24px',
    fontFamily: "'Audiowide', 'Orbitron', sans-serif",
    color: '#ff44ff',
    stroke: '#ff00ff',
    strokeThickness: 3,
    shadow: { blur: 10, color: '#ff00ff', fill: true }
  }).setOrigin(0.5);
  
  container.add([bg, text]);
  container.setAlpha(0);
  container.setScale(0.5);
  
  this.tweens.add({
    targets: container,
    alpha: 1,
    scale: 1,
    duration: 300,
    ease: 'Back.out',
    onComplete: () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        scale: 1.2,
        duration: 500,
        delay: 1500,
        onComplete: () => container.destroy()
      });
    }
  });
  
  try {
    if (this.levelUpSound) this.levelUpSound.play();
  } catch (e) {}
}
/**
 * Открыть магазин (убрано - магазин только в меню)
 */
openShop() {
  // Магазин только в меню, в игре недоступен
  this.showNotification('Магазин доступен только в главном меню', 1500, '#ffaa00');
}

/**
 * Подтверждение выхода в меню
 */
confirmExit() {
  if (this.dead) return;
  if (this.exitDialogActive) return;
  this.exitDialogActive = true;
  
  this.isPaused = true;
  this.physics.pause();
  
  const w = this.scale.width;
  const h = this.scale.height;
  
  this.exitOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85)
    .setDepth(150).setScrollFactor(0);
  
  // Панель
  this.exitPanel = this.add.graphics();
  this.exitPanel.fillStyle(0x0a0a1a, 0.98);
  this.exitPanel.fillRoundedRect(w / 2 - 150, h / 2 - 115, 300, 250, 25);
  this.exitPanel.lineStyle(3, 0xff00ff, 0.9);
  this.exitPanel.strokeRoundedRect(w / 2 - 150, h / 2 - 115, 300, 250, 25);
  this.exitPanel.setDepth(151);
  
  // Иконка
  this.exitIcon = this.add.text(w / 2, h / 2 - 65, '⚠️', {
    fontSize: '48px'
  }).setOrigin(0.5).setDepth(152);
  
  // Текст
  this.exitText = this.add.text(w / 2, h / 2 - 15, 'ВЫЙТИ В МЕНЮ?', {
    fontSize: '24px',
    fontFamily: "'Audiowide', 'Orbitron', sans-serif",
    color: '#ffffff',
    stroke: '#ff00ff',
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(152);
  
  this.exitSubText = this.add.text(w / 2, h / 2 + 15, '⚠️ Весь прогресс будет потерян ⚠️', {
    fontSize: '10px',
    fontFamily: "'Share Tech Mono', monospace",
    color: '#ffaa66'
  }).setOrigin(0.5).setDepth(152);
  
  // Кнопка ДА
  this.yesBtn = this.add.text(w / 2 - 80, h / 2 + 75, 'ДА', {
    fontSize: '20px',
    fontFamily: "'Audiowide', sans-serif",
    color: '#00ff00',
    backgroundColor: '#1a3a1a',
    padding: { x: 25, y: 10 },
    stroke: '#00ff00',
    strokeThickness: 2
  }).setInteractive({ useHandCursor: true }).setOrigin(0.5).setDepth(200);
  
  // Кнопка НЕТ
  this.noBtn = this.add.text(w / 2 + 80, h / 2 + 75, 'НЕТ', {
    fontSize: '20px',
    fontFamily: "'Audiowide', sans-serif",
    color: '#ff4444',
    backgroundColor: '#3a1a1a',
    padding: { x: 25, y: 10 },
    stroke: '#ff4444',
    strokeThickness: 2
  }).setInteractive({ useHandCursor: true }).setOrigin(0.5).setDepth(200);
  
  // Обработчики кнопок
  this.yesBtn.on('pointerover', () => {
    this.yesBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' });
  });
  this.yesBtn.on('pointerout', () => {
    this.yesBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a3a1a' });
  });
  this.yesBtn.on('pointerdown', (pointer) => {
    pointer.event.stopPropagation();
    this.exitToMenu();
  });
  
  this.noBtn.on('pointerover', () => {
    this.noBtn.setStyle({ color: '#ffffff', backgroundColor: '#aa0000' });
  });
  this.noBtn.on('pointerout', () => {
    this.noBtn.setStyle({ color: '#ff4444', backgroundColor: '#3a1a1a' });
  });
  this.noBtn.on('pointerdown', (pointer) => {
    pointer.event.stopPropagation();
    this.closeExitDialog();
  });
}

/**
 * Показать магазин (удалено - магазин только в меню)
 */
showShop() {
  // Магазин только в меню
  this.showNotification('Магазин доступен только в главном меню', 1500, '#ffaa00');
  if (this.isPaused) this.togglePause();
}

/**
 * Покупка улучшения (удалено)
 */
buyUpgrade(key) {
  this.showNotification('Улучшения доступны только в главном меню', 1500, '#ffaa00');
}

/**
 * Старт обратного отсчёта после закрытия (упрощён)
 */
startResumeCountdown() {
  if (this.countdownActive) return;
  this.hideShop();
  
  this.countdownActive = true;
  let count = 3;
  const w = this.scale.width;
  const h = this.scale.height;
  
  this.countdownOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
    .setDepth(150).setScrollFactor(0);
  
  this.countdownText = this.add.text(w / 2, h / 2 - 30, '3', {
    fontSize: '80px',
    fontFamily: "'Audiowide', 'Orbitron', sans-serif",
    color: '#00ffff',
    stroke: '#ff00ff',
    strokeThickness: 8,
    shadow: { blur: 25, color: '#00ffff', fill: true }
  }).setOrigin(0.5).setDepth(151).setScrollFactor(0);
  
  this.countdownPrepareText = this.add.text(w / 2, h / 2 + 45, 'ПРИГОТОВЬСЯ', {
    fontSize: '18px',
    fontFamily: "'Orbitron', sans-serif",
    color: '#ffffff',
    stroke: '#00aaff',
    strokeThickness: 2
  }).setOrigin(0.5).setDepth(151).setScrollFactor(0);
  
  // Пульсация
  this.tweens.add({
    targets: this.countdownText,
    scale: { from: 1, to: 1.2 },
    duration: 300,
    yoyo: true,
    repeat: 2,
    ease: 'Sine.easeInOut'
  });
  
  this.resumeCountdownTimer = this.time.addEvent({
    delay: 1000,
    callback: () => {
      count--;
      if (count > 0) {
        if (this.countdownText) {
          this.countdownText.setText(count.toString());
          this.tweens.add({
            targets: this.countdownText,
            scale: { from: 1, to: 1.2 },
            duration: 200,
            yoyo: true
          });
        }
      } else {
        if (this.countdownText) {
          this.countdownText.setText('ПОЕХАЛИ!');
          this.tweens.add({
            targets: this.countdownText,
            scale: { from: 1, to: 1.3 },
            duration: 300,
            onComplete: () => {
              this.time.delayedCall(300, () => {
                if (this.countdownOverlay) this.countdownOverlay.destroy();
                if (this.countdownText) this.countdownText.destroy();
                if (this.countdownPrepareText) this.countdownPrepareText.destroy();
                this.countdownActive = false;
                if (this.isPaused) this.togglePause();
              });
            }
          });
        }
        if (this.resumeCountdownTimer) this.resumeCountdownTimer.remove();
      }
    },
    repeat: 2
  });
}
/**
 * Скрыть магазин
 */
hideShop() {
  if (!this.shopVisible) return;
  
  if (this.shopElements) {
    this.shopElements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.shopElements = [];
  }
  
  this.shopVisible = false;
}

/**
 * Отмена обратного отсчёта
 */
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

/**
 * Проверка прогресса уровня (ОТКЛЮЧЕНА - переход только через completeWorldLevel)
 */
checkLevelProgression() {
  // Убираем автоматический переход на новые миры по очкам
  // Переход происходит только через completeWorldLevel() при прохождении 10 км
  return;
}

/**
 * Переход на новый уровень (ОТКЛЮЧЕН)
 */
transitionToLevel(levelIndex) {
  // Этот метод отключён - переход только через completeWorldLevel()
  return;
}

/**
 * Показать анимацию перехода уровня (ОТКЛЮЧЕНА)
 */
showLevelTransition(levelIndex) {
  // Отключено
  return;
}

 /**
 * Обновление уровня сложности (внутренняя прогрессия)
 */
updateLevel() {
  // Уровень сложности увеличивается каждые 1000 метров
  const newLevel = Math.floor(this.levelProgress / 1000);
  if (newLevel > this.gameLevel) {
    this.gameLevel = newLevel;
    this.updateDifficulty();

    const w = this.scale.width;
    
    // Стильное уведомление о повышении сложности
    const levelContainer = this.add.container(w / 2, 200);
    
    // Неоновая рамка
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 0.95);
    bg.fillRoundedRect(-120, -30, 240, 60, 20);
    bg.lineStyle(2, 0x00ffff, 0.8);
    bg.strokeRoundedRect(-120, -30, 240, 60, 20);
    
    // Текст
    const levelText = this.add.text(0, 0, `⚡ УРОВЕНЬ ${this.gameLevel + 1}`, {
      fontSize: '22px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#00ffff',
      stroke: '#ff00ff',
      strokeThickness: 3,
      shadow: { blur: 12, color: '#00ffff', fill: true }
    }).setOrigin(0.5);
    
    levelContainer.add([bg, levelText]);
    levelContainer.setAlpha(0);
    levelContainer.setScale(0.8);
    
    // Анимация появления
    this.tweens.add({
      targets: levelContainer,
      alpha: 1,
      scale: 1,
      y: 180,
      duration: 300,
      ease: 'Back.out',
      onComplete: () => {
        this.tweens.add({
          targets: levelContainer,
          alpha: 0,
          y: 160,
          scale: 0.9,
          duration: 500,
          delay: 1800,
          onComplete: () => levelContainer.destroy()
        });
      }
    });
    
    // Эффект свечения
    this.cameras.main.flash(100, 0, 255, 255, false);
    
    this.checkStationSpawn();
    if (this.questSystem) {
      this.questSystem.updateProgress('level', 1);
    }
  }
}

/**
 * Создать визуальный эффект изменения скорости
 */
createSpeedRings() {
  const w = this.scale.width;
  const h = this.scale.height;
  
  for (let i = 0; i < 3; i++) {
    const ring = this.add.circle(w / 2, h / 2, 50 + i * 30, 0x00ffff, 0.3);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    
    this.tweens.add({
      targets: ring,
      scale: 2,
      alpha: 0,
      duration: 500,
      delay: i * 100,
      onComplete: () => ring.destroy()
    });
  }
}

/**
 * Проверка спавна станции (каждые 10 уровней мира)
 */
checkStationSpawn() {
  if (this.stationActive || this.dead) return;
  // Станция спавнится после прохождения уровня мира, а не каждые 10 км
  if (this.levelProgress >= this.levelGoal && !this.stationPlanet) {
    this.spawnStation();
  }
}

/**
 * Спавн станции отдыха
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
  }
  
  this.stationActive = true;
  
  // Анимированная метка станции
  const label = this.add.text(x, y - 80, '🚉 СТАНЦИЯ ОТДЫХА', {
    fontSize: '16px',
    fontFamily: "'Orbitron', monospace",
    color: '#00ffff',
    stroke: '#ff00ff',
    strokeThickness: 2,
    shadow: { blur: 8, color: '#00ffff', fill: true }
  }).setOrigin(0.5).setDepth(-4);
  
  this.stationPlanet.label = label;
  
  // Пульсация метки
  this.tweens.add({
    targets: label,
    scale: { from: 1, to: 1.1 },
    alpha: { from: 0.8, to: 1 },
    duration: 800,
    yoyo: true,
    repeat: -1
  });
  
  // Вращение станции
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
  
  // Бонус: кристаллы и сброс вагонов
  const bonus = this.wagons.length * 15;
  this.crystals += bonus;
  
  if (this.crystalText) {
    this.crystalText.setText(`💎 ${this.crystals}`);
    this.tweens.add({
      targets: this.crystalText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      yoyo: true
    });
  }
  
  // Сохраняем кристаллы
  if (gameManager.data) {
    gameManager.data.crystals = this.crystals;
    gameManager.save();
  }
  
  // Визуальный эффект
  this.particleManager.createBonusEffect('speed', this.stationPlanet.x, this.stationPlanet.y);
  
  // Уничтожаем вагоны и сбрасываем позицию
  this.wagons.forEach(w => { if (w?.destroy) w.destroy(); });
  this.wagons = [];
  this.targetPlayerX = 110;
  
  if (this.wagonCountText) {
    this.wagonCountText.setText(`🚃 0/${this.maxWagons}`);
  }
  
  this.updateCameraZoom();
  
  // Анимация получения бонуса
  const msg = this.add.text(this.player.x, this.player.y - 50, `+${bonus} 💎`, {
    fontSize: '28px',
    fontFamily: "'Audiowide', monospace",
    color: '#ffaa00',
    stroke: '#ff00ff',
    strokeThickness: 4,
    shadow: { blur: 12, color: '#ffaa00', fill: true }
  }).setOrigin(0.5);
  
  this.tweens.add({
    targets: msg,
    y: msg.y - 100,
    alpha: 0,
    duration: 1500,
    onComplete: () => msg.destroy()
  });
  
  // Эффект исцеления
  this.createHealEffect();
  
  // Звук станции
  try {
    if (this.levelUpSound) this.levelUpSound.play();
  } catch (e) {}
  
  // Удаляем станцию
  if (this.stationPlanet.label) this.stationPlanet.label.destroy();
  this.stationPlanet.destroy();
  this.stationPlanet = null;
}

/**
 * Эффект исцеления при посещении станции
 */
createHealEffect() {
  if (!this.player) return;
  
  // Восстанавливаем здоровье
  this.headHP = this.maxHeadHP;
  this.updateHearts();
  
  // Визуальный эффект исцеления
  for (let i = 0; i < 20; i++) {
    const particle = this.add.circle(
      this.player.x + Phaser.Math.Between(-30, 30),
      this.player.y + Phaser.Math.Between(-30, 30),
      Phaser.Math.Between(2, 5),
      0x00ff00,
      0.7
    );
    particle.setBlendMode(Phaser.BlendModes.ADD);
    
    this.tweens.add({
      targets: particle,
      alpha: 0,
      scale: 0,
      y: particle.y - Phaser.Math.Between(30, 80),
      duration: 600,
      onComplete: () => particle.destroy()
    });
  }
  
  // Уведомление
  this.showNotification('❤️ ЗДОРОВЬЕ ВОССТАНОВЛЕНО', 1500, '#00ff00');
}

/**
 * Спавн монеты - ПОЛНОСТЬЮ ПЕРЕРАБОТАНО
 */
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

/**
 * Завершение уровня с эффектами
 */
completeLevel() {
  // Расчёт звёзд с учётом производительности
  let stars = 1;
  const goalScore = this.worldConfig?.goalScore || 500;
  const levelMultiplier = 1 + this.level * 0.1;
  const adjustedGoal = Math.floor(goalScore * levelMultiplier);
  
  if (this.score >= adjustedGoal * 1.5) stars = 2;
  if (this.score >= adjustedGoal * 2) stars = 3;
  if (this.headHP === this.maxHeadHP && stars < 3) stars = Math.min(3, stars + 1);
  
  // Сохраняем звёзды
  if (gameManager.setLevelStars) {
    gameManager.setLevelStars(this.world, this.level, stars);
  }
  
  // Разблокируем следующий уровень
  if (this.level < 9 && gameManager.unlockLevel) {
    gameManager.unlockLevel(this.world, this.level + 1);
  }
  
  // Разблокируем следующий мир (только после полного прохождения)
  if (this.level === 9 && this.world < 4 && gameManager.data) {
    const worlds = gameManager.data.unlockedWorlds || [];
    if (!worlds.includes(this.world + 1)) {
      worlds.push(this.world + 1);
      if (gameManager.save) gameManager.save();
      
      // Эффект открытия нового мира
      this.createWorldUnlockEffect(this.world + 1);
    }
  }
  
  // Обновляем статистику
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
  
  // Показываем эффект завершения
  this.createLevelCompleteEffect(stars);
  
  // Переходим на сцену завершения уровня
  this.scene.start('levelComplete', {
    world: this.world,
    level: this.level,
    score: this.score,
    stars: stars,
    coins: this.collectedCoins,
    wagons: this.wagons.length,
    newUnlock: this.level < 9,
    perfectRun: this.headHP === this.maxHeadHP && this.score > 100
  });
}

/**
 * Эффект открытия нового мира
 */
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
      fontSize: '24px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: worldColors[nextWorld - 1],
      stroke: '#ffffff',
      strokeThickness: 3,
      shadow: { blur: 15, color: worldColors[nextWorld - 1], fill: true }
    }).setOrigin(0.5);
    
    const worldName = this.add.text(0, 20, worldNames[nextWorld - 1], {
      fontSize: '32px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ffffff',
      stroke: worldColors[nextWorld - 1],
      strokeThickness: 4,
      shadow: { blur: 20, color: worldColors[nextWorld - 1], fill: true }
    }).setOrigin(0.5);
    
    container.add([bg, title, worldName]);
    container.setAlpha(0);
    container.setScale(0.5);
    
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: 'Back.out',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: container,
            alpha: 0,
            scale: 1.2,
            duration: 500,
            onComplete: () => container.destroy()
          });
        });
      }
    });
    
    // Эффект конфетти
    for (let i = 0; i < 50; i++) {
      const particle = this.add.circle(
        w / 2 + Phaser.Math.Between(-150, 150),
        h / 2 + Phaser.Math.Between(-100, 100),
        Phaser.Math.Between(2, 6),
        worldColors[nextWorld - 1],
        0.8
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: particle,
        y: particle.y - Phaser.Math.Between(100, 200),
        x: particle.x + Phaser.Math.Between(-100, 100),
        alpha: 0,
        scale: 0,
        duration: 1000,
        onComplete: () => particle.destroy()
      });
    }
  }
}

/**
 * Эффект завершения уровня
 */
createLevelCompleteEffect(stars) {
  const w = this.scale.width;
  const h = this.scale.height;
  const starColors = [0x88aaff, 0xffaa44, 0xff44ff];
  
  // Кольца
  for (let i = 0; i < 3; i++) {
    const ring = this.add.circle(w / 2, h / 2, 30 + i * 30, starColors[i % starColors.length], 0.5);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    
    this.tweens.add({
      targets: ring,
      scale: 3,
      alpha: 0,
      duration: 600,
      delay: i * 100,
      onComplete: () => ring.destroy()
    });
  }
  
  // Звёзды
  for (let i = 0; i < stars; i++) {
    const star = this.add.text(w / 2 + (i - 1) * 45, h / 2 - 50, '★', {
      fontSize: '48px',
      color: '#ffaa00',
      stroke: '#ff5500',
      strokeThickness: 3,
      shadow: { blur: 15, color: '#ffaa00', fill: true }
    }).setOrigin(0.5);
    
    star.setScale(0);
    this.tweens.add({
      targets: star,
      scale: 1,
      duration: 400,
      delay: 300 + i * 150,
      ease: 'Back.out'
    });
    
    this.time.delayedCall(1000, () => {
      this.tweens.add({
        targets: star,
        alpha: 0,
        y: star.y - 50,
        duration: 500,
        onComplete: () => star.destroy()
      });
    });
  }
  
  // Звук завершения
  try {
    if (this.levelUpSound) this.levelUpSound.play();
  } catch (e) {}
}

/**
 * Обработка смерти с киберпанк-эффектами
 */
handleDeath() {
  // Проверка на воскрешение
  if (this.upgradeSystem?.upgrades?.revival > 0 && !this.dead) {
    this.upgradeSystem.upgrades.revival--;
    this.headHP = this.maxHeadHP;
    this.updateHearts();
    
    // Эффект воскрешения
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
  
  // Останавливаем все процессы
  if (this.trailEmitter) this.trailEmitter.stop();
  if (this.spawnTimer) this.spawnTimer.remove();
  if (this.bonusTimer) this.bonusTimer.remove();
  if (this.stationTimer) this.stationTimer.remove();
  
  this.physics.pause();
  
  // Эффект взрыва
  this.createDeathExplosion();
  
  // Сохраняем статистику
  this.updateLeaderboard();
  this.updateStats();
  this.showGameOver();
  
  // Отправляем данные в Telegram
  if (window.Telegram?.WebApp) {
    const data = JSON.stringify({ 
      score: this.score, 
      level: this.level + 1, 
      meters: Math.floor(this.meters),
      world: this.world
    });
    window.Telegram.WebApp.sendData(data);
  }
  
  try { 
    if (window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
  } catch (e) {}
}

/**
 * Эффект воскрешения
 */
createReviveEffect() {
  if (!this.player) return;
  
  // Эффект восстановления
  for (let i = 0; i < 30; i++) {
    const particle = this.add.circle(
      this.player.x + Phaser.Math.Between(-40, 40),
      this.player.y + Phaser.Math.Between(-40, 40),
      Phaser.Math.Between(2, 5),
      0x00ffff,
      0.7
    );
    particle.setBlendMode(Phaser.BlendModes.ADD);
    
    this.tweens.add({
      targets: particle,
      y: particle.y - Phaser.Math.Between(50, 120),
      alpha: 0,
      scale: 0,
      duration: 800,
      onComplete: () => particle.destroy()
    });
  }
  
  // Кольцо восстановления
  const ring = this.add.circle(this.player.x, this.player.y, 20, 0x00ffff, 0.6);
  ring.setBlendMode(Phaser.BlendModes.ADD);
  
  this.tweens.add({
    targets: ring,
    radius: 80,
    alpha: 0,
    duration: 500,
    onComplete: () => ring.destroy()
  });
}

/**
 * Эффект взрыва при смерти
 */
createDeathExplosion() {
  if (!this.player) return;
  
  // Тряска камеры
  this.cameras.main.shake(400, 0.008);
  this.cameras.main.flash(400, 255, 100, 100, false);
  
  // Поворачиваем игрока
  this.player.setTint(0xff0000).setAngle(90);
  
  // Взрывные частицы
  const emitter = this.add.particles(this.player.x, this.player.y, 'flare', {
    speed: { min: 150, max: 350 },
    scale: { start: 1.2, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 600,
    quantity: 60,
    blendMode: Phaser.BlendModes.ADD,
    tint: [0xff0000, 0xff6600, 0xff00ff, 0xffff00]
  });
  emitter.explode(60);
  
  // Ударная волна
  const shockwave = this.add.circle(this.player.x, this.player.y, 20, 0xff4400, 0.8);
  shockwave.setBlendMode(Phaser.BlendModes.ADD);
  
  this.tweens.add({
    targets: shockwave,
    radius: 150,
    alpha: 0,
    duration: 400,
    onComplete: () => shockwave.destroy()
  });
}

/**
 * Показать окно Game Over
 */
showGameOver() {
  if (!this.gameOverBox) this.createGameOverBox();
  
  if (this.gameOverSubtitle) {
    const worldName = this.worldConfig?.name || 'КОСМОС';
    this.gameOverSubtitle.setText(
      `${worldName} • УРОВЕНЬ ${this.level + 1}\n\n` +
      `🎯 Счёт: ${this.score}\n` +
      `🏆 Рекорд: ${this.best}\n` +
      `💎 Кристаллы: ${this.crystals}\n` +
      `📏 Пройдено: ${Math.floor(this.meters)} м\n` +
      `🚃 Вагонов: ${this.wagons.length}/${this.maxWagons}\n` +
      `⚡ Комбо: ${this.comboSystem?.maxCombo || 0}`
    );
  }
  
  this.gameOverBox.setVisible(true);
  this.gameOverBox.setScale(0.8);
  this.gameOverBox.setAlpha(0);
  
  this.tweens.add({
    targets: this.gameOverBox,
    scaleX: 1,
    scaleY: 1,
    alpha: 1,
    duration: 500,
    ease: 'Back.out'
  });
  
  // Звук поражения
  try {
    if (this.sound?.add) {
      const gameOverSound = this.sound.add('gameover_sound', { volume: 0.5 });
      gameOverSound.play();
    }
  } catch (e) {}
}

/**
 * Инициализация достижений
 */
initAchievements() {
  this.achievements = { ...ACHIEVEMENTS };
  for (let key in this.achievements) {
    if (this.achievements[key]) {
      this.achievements[key].unlocked = false;
    }
  }
  this.loadAchievements();
}

/**
 * Загрузка достижений
 */
loadAchievements() {
  try {
    const saved = localStorage.getItem('skypulse_achievements');
    if (saved) {
      const data = JSON.parse(saved);
      for (let key in data) {
        if (this.achievements?.[key]) {
          this.achievements[key].unlocked = data[key];
        }
      }
    }
  } catch (e) {}
}

/**
 * Сохранение достижений
 */
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

/**
 * Проверка достижений
 */
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

/**
 * Проверка монетных достижений
 */
checkCoinAchievements() {
  if (!this.achievements?.all_bonuses) return;
  if (this.collectedCoins >= 50 && !this.achievements.all_bonuses.unlocked) {
    this.unlockAchievement('all_bonuses');
  }
}

/**
 * Разблокировка достижения
 */
unlockAchievement(key) {
  if (!this.achievements?.[key] || this.achievements[key].unlocked) return;
  
  this.achievements[key].unlocked = true;
  const reward = this.achievements[key].reward || 0;
  
  this.crystals += reward;
  if (this.crystalText) {
    this.crystalText.setText(`💎 ${this.crystals}`);
    this.tweens.add({
      targets: this.crystalText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      yoyo: true
    });
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

/**
 * Уведомление о достижении
 */
showAchievementNotification(key, reward) {
  const w = this.scale.width;
  const h = this.scale.height;
  const achievement = this.achievements?.[key];
  if (!achievement) return;
  
  const container = this.add.container(w / 2, -80);
  container.setDepth(100).setScrollFactor(0);
  
  const bg = this.add.rectangle(0, 0, 320, 70, 0x0a0a1a, 0.95);
  bg.setStrokeStyle(3, 0xffff00, 0.8);
  
  const icon = this.add.text(-140, 0, '🏆', {
    fontSize: '36px'
  }).setOrigin(0.5);
  
  const title = this.add.text(0, -15, achievement.name, {
    fontSize: '14px',
    fontFamily: "'Audiowide', 'Orbitron', sans-serif",
    color: '#ffaa00',
    stroke: '#ff5500',
    strokeThickness: 1
  }).setOrigin(0.5);
  
  const rewardText = this.add.text(0, 12, `+${reward} 💎`, {
    fontSize: '12px',
    fontFamily: "'Share Tech Mono', monospace",
    color: '#00ff00'
  }).setOrigin(0.5);
  
  container.add([bg, icon, title, rewardText]);
  
  this.tweens.add({
    targets: container,
    y: 90,
    duration: 500,
    ease: 'Back.out',
    onComplete: () => {
      this.tweens.add({
        targets: container,
        y: 70,
        alpha: 0,
        duration: 500,
        delay: 2500,
        onComplete: () => container.destroy()
      });
    }
  });
  
  try { if (this.levelUpSound) this.levelUpSound.play(); } catch (e) {}
}

/**
 * Инициализация ежедневных наград
 */
initDailyRewards() {
  this.dailyReward = {
    lastClaimDate: localStorage.getItem('skypulse_daily_date') || '',
    streak: parseInt(localStorage.getItem('skypulse_daily_streak') || '0'),
    rewards: [15, 25, 40, 60, 85, 115, 150, 200, 250, 300]
  };
  this.checkDailyReward();
}

/**
 * Проверка ежедневной награды
 */
checkDailyReward() {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = this.dailyReward.lastClaimDate;
  
  if (lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastDate === yesterdayStr) {
      this.dailyReward.streak = Math.min(this.dailyReward.streak + 1, 10);
    } else {
      this.dailyReward.streak = 1;
    }
    
    this.dailyReward.lastClaimDate = today;
    this.saveDailyReward();
    this.showDailyRewardNotification();
  }
}

/**
 * Показать уведомление о награде
 */
showDailyRewardNotification() {
  const w = this.scale.width;
  const h = this.scale.height;
  const rewardAmount = this.dailyReward.rewards[this.dailyReward.streak - 1] || 15;
  
  this.crystals += rewardAmount;
  if (this.crystalText) this.crystalText.setText(`💎 ${this.crystals}`);
  
  if (gameManager.data) {
    gameManager.data.crystals = this.crystals;
    gameManager.save();
  }
  
  const container = this.add.container(w / 2, h / 2);
  container.setDepth(100).setScrollFactor(0);
  
  const bg = this.add.rectangle(0, 0, 320, 160, 0x0a0a1a, 0.98);
  bg.setStrokeStyle(3, 0x00ffff, 0.9);
  
  const title = this.add.text(0, -45, '🎁 ДНЕВНАЯ НАГРАДА', {
    fontSize: '20px',
    fontFamily: "'Audiowide', 'Orbitron', sans-serif",
    color: '#00ffff',
    stroke: '#ff00ff',
    strokeThickness: 2
  }).setOrigin(0.5);
  
  const streak = this.add.text(0, -10, `ДЕНЬ ${this.dailyReward.streak}/10`, {
    fontSize: '14px',
    fontFamily: "'Orbitron', sans-serif",
    color: '#ffaa00'
  }).setOrigin(0.5);
  
  const reward = this.add.text(0, 25, `+${rewardAmount} 💎`, {
    fontSize: '28px',
    fontFamily: "'Audiowide', sans-serif",
    color: '#ffaa00',
    stroke: '#ff5500',
    strokeThickness: 2
  }).setOrigin(0.5);
  
  const claimBtn = this.add.text(0, 65, '[ЗАБРАТЬ]', {
    fontSize: '14px',
    fontFamily: "'Orbitron', sans-serif",
    color: '#00ff00',
    backgroundColor: '#1a3a1a',
    padding: { x: 15, y: 5 }
  }).setInteractive({ useHandCursor: true }).setOrigin(0.5);
  
  claimBtn.on('pointerover', () => claimBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }));
  claimBtn.on('pointerout', () => claimBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a3a1a' }));
  claimBtn.on('pointerdown', () => {
    this.tweens.add({
      targets: container,
      alpha: 0,
      scale: 1.2,
      duration: 300,
      onComplete: () => container.destroy()
    });
  });
  
  container.add([bg, title, streak, reward, claimBtn]);
  container.setScale(0.5);
  
  this.tweens.add({
    targets: container,
    scale: 1,
    duration: 400,
    ease: 'Back.out'
  });
}

/**
 * Сохранение ежедневной награды
 */
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
  const dt = delta / 1000;
  const speedMultiplier = this.currentSpeed / this.baseSpeed || 1;
  
  for (let s of this.stars) {
    if (!s || !s.sprite) continue;
    
    // Скорость звёзд зависит от текущей скорости игры
    const moveSpeed = s.baseSpeed * speedMultiplier * 0.3;
    s.sprite.x -= moveSpeed * dt;
    
    if (s.flicker) {
      s.sprite.alpha = s.baseAlpha + Math.sin(time * s.flicker) * 0.3;
    }
    
    // Респавн звёзд
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
    
    // Скорость планет зависит от текущей скорости игры
    const moveSpeed = p.speed * speedMultiplier * 0.2;
    p.sprite.x -= moveSpeed * dt;
    
    // Респавн планет
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
    
    // Скорость кораблей зависит от текущей скорости игры
    const moveSpeed = s.speed * speedMultiplier * 0.3;
    s.sprite.x -= moveSpeed * dt;
    
    // Респавн кораблей
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
    
    // Скорость астероидов зависит от текущей скорости игры
    const moveSpeed = a.speed * speedMultiplier * 0.25;
    a.sprite.x -= moveSpeed * dt;
    a.sprite.angle += a.rotationSpeed * dt;
    
    // Респавн астероидов
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

/**
 * Обновление движения игрока
 */
updatePlayerMovement() {
  if (!this.player) return;
  
  this.targetPlayerX = Math.min(this.maxTargetX, this.targetPlayerX);
  this.player.x += (this.targetPlayerX - this.player.x) * this.playerXSpeed;

  const body = this.player.body;
  if (body) {
    this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.05, -20, 75));
  }

  // Проверка смерти
  if (!this.shieldActive && (this.player.y < -50 || this.player.y > this.scale.height + 50)) {
    this.handleDeath();
  }
}

/**
 * Обновление бонусов и эффектов
 */
updateBonuses(delta) {
  if (!this.player) return;
  
  // Магнит
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
  
  // Обновление визуальных эффектов
  if (this.updatePlayerEffects) this.updatePlayerEffects();
  if (this.updateMultiplier) this.updateMultiplier();
}

/**
 * Обновление всех игровых объектов
 */
updateObjects(delta) {
  if (!this.player) return;
  
  // Обновление вагонов
  this.updateWagons();
  this.cleanupObjects();
  
  // Обновление пуль
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
  
  // Обновление астероидов
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
  // Обновление монет
for (let i = 0; i < this.coins.length; i++) {
  const coin = this.coins[i];
  if (coin && coin.isActive()) {
    coin.update(delta);
  }
}

// Проверка сбора монет
this.coinGroup.getChildren().forEach(coinSprite => {
  const coin = coinSprite.coinRef;
  if (coin && !coin.collected && coin.isActive()) {
    if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), coinSprite.getBounds())) {
      this.collectCoin(coin);
    }
  }
});
  
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
  
  // Обновление оружия
  if (this.weaponCooldown > 0) {
    this.weaponCooldown -= delta;
  }
}

/**
 * Проверка достижений и рекордов
 */
checkAchievementsAndRecords() {
  this.checkAchievements();
  this.checkNewRecords();
  this.checkMaxCombo();
  this.checkQuests();
  if (this.checkWaveAchievements) this.checkWaveAchievements();
  if (this.createComboEffect) this.createComboEffect();
}

/**
 * Обновление метража
 */
updateMeters(delta) {
  const distanceDelta = (this.currentSpeed * delta) / 1000 / 10;
  this.meters += distanceDelta;
  this.levelProgress += distanceDelta;
  
  if (this.meterText) {
    this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);
  }
}
/**
 * Обновление фоновых элементов
 */
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

  // Обновляем позиции UI элементов
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
  
  // Обновляем зум камеры после ресайза
  this.updateCameraZoom();
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
    if (this.comboSystem && typeof this.comboSystem.destroy === 'function') this.comboSystem.destroy();
    if (this.specialEventManager && typeof this.specialEventManager.destroy === 'function') this.specialEventManager.destroy();
  }
}

export default PlayScene;