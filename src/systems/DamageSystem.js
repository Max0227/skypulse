import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class DamageSystem {
  constructor(scene) {
    this.scene = scene;
    this.hitCooldown = 0;
    this.hitCooldownTime = 500; // мс
    this.damageMultiplier = 1;
    this.shieldAbsorption = 1;
    this.lastDamageSource = null;
    this.damageHistory = [];
    this.maxHistorySize = 20;
  }

  // =========================================================================
  // НАСТРОЙКИ СИСТЕМЫ
  // =========================================================================

  setDamageMultiplier(multiplier) {
    this.damageMultiplier = multiplier;
  }

  setShieldAbsorption(absorption) {
    this.shieldAbsorption = absorption;
  }

  getWorldDamageModifier() {
    const world = this.scene.levelManager?.currentWorld ?? 0;
    const modifiers = {
      0: 1.0,   // Космос
      1: 1.2,   // Киберпанк - враги сильнее
      2: 1.5,   // Подземелье - враги очень сильные
      3: 1.3,   // Астероиды - враги сильные
      4: 1.0    // Чёрная дыра - нормальный урон
    };
    return modifiers[world] || 1.0;
  }

  // =========================================================================
  // ОСНОВНЫЕ МЕТОДЫ УРОНА
  // =========================================================================

  playerHitByEnemy(player, enemy) {
    if (!player || !enemy || !enemy.sprite) return;
    
    // Проверка на неуязвимость
    if (player.invincible || player.shieldActive) {
      this.createShieldDeflect(enemy.sprite.x, enemy.sprite.y, 'enemy');
      if (player.body) player.body.setVelocityY(-150);
      this.addDamageToHistory('blocked', enemy.config.damage);
      return;
    }

    // Проверка кулдауна
    if (this.hitCooldown > 0) return;
    this.hitCooldown = this.hitCooldownTime;

    // Расчёт урона с учётом мира
    let damage = enemy.config.damage;
    damage = Math.floor(damage * this.getWorldDamageModifier() * this.damageMultiplier);
    
    // Уменьшение урона от брони скина
    const skinStats = gameManager.getCurrentSkinStats();
    if (skinStats && skinStats.armorBonus) {
      damage = Math.max(1, damage - Math.floor(skinStats.armorBonus / 10));
    }
    
    player.headHP -= damage;
    this.addDamageToHistory('enemy', damage);
    
    // Обновление UI
    this.scene.updateHearts();
    
    // Визуальные эффекты
    this.createHitEffect(player, enemy.sprite.x, enemy.sprite.y);
    this.scene.cameras.main.shake(150, 0.005 * (damage / 2));
    
    // Звук урона
    this.playHitSound(damage);
    
    // Вибрация
    this.triggerVibration('medium');
    
    // Проверка на смерть
    if (player.headHP <= 0) {
      this.scene.handleDeath();
    } else {
      // Эффект мигания
      this.flashPlayer(player, damage);
    }
    
    // Обновление статистики
    this.updateDamageStats(damage);
  }

  playerHitByBullet(player, bullet) {
    if (!player || !bullet) return;
    
    // Проверка на неуязвимость
    if (player.invincible || player.shieldActive) {
      this.createShieldDeflect(bullet.x, bullet.y, 'bullet');
      bullet.destroy();
      this.addDamageToHistory('blocked', bullet.damage || 1);
      return;
    }

    // Проверка кулдауна
    if (this.hitCooldown > 0) {
      bullet.destroy();
      return;
    }
    this.hitCooldown = this.hitCooldownTime;

    // Расчёт урона
    let damage = bullet.damage || 1;
    damage = Math.floor(damage * this.getWorldDamageModifier() * this.damageMultiplier);
    
    // Уменьшение урона от брони
    const skinStats = gameManager.getCurrentSkinStats();
    if (skinStats && skinStats.armorBonus) {
      damage = Math.max(1, damage - Math.floor(skinStats.armorBonus / 15));
    }
    
    player.headHP -= damage;
    this.addDamageToHistory('bullet', damage);
    
    // Обновление UI
    this.scene.updateHearts();
    
    // Визуальные эффекты
    this.createHitEffect(player, bullet.x, bullet.y);
    this.scene.cameras.main.shake(120, 0.003 * (damage / 2));
    
    // Звук
    this.playHitSound(damage);
    
    bullet.destroy();
    
    if (player.headHP <= 0) {
      this.scene.handleDeath();
    } else {
      this.flashPlayer(player, damage);
    }
    
    this.updateDamageStats(damage);
  }

  enemyHitByBullet(enemy, bullet) {
    if (!enemy || !bullet) return;
    
    // Расчёт урона с учётом критического удара
    let damage = bullet.damage;
    const isCritical = this.checkCriticalHit();
    if (isCritical) {
      damage = Math.floor(damage * 1.5);
      this.createCriticalEffect(enemy.sprite.x, enemy.sprite.y);
    }
    
    const killed = enemy.takeDamage(damage);
    
    // Эффект попадания
    this.createAttackEffect(enemy.sprite.x, enemy.sprite.y, isCritical);
    
    if (killed) {
      // Награда за убийство
      const reward = enemy.config.scoreValue;
      this.scene.crystals += reward;
      if (this.scene.crystalText) {
        this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
      }
      gameManager.addCrystals(reward, 'enemy_kill');
      
      // Увеличиваем комбо
      if (this.scene.comboSystem) {
        this.scene.comboSystem.add();
      }
      
      // Обновление квеста
      if (this.scene.questSystem) {
        this.scene.questSystem.updateProgress('enemies', 1);
      }
      
      // Звук смерти врага
      this.playEnemyDeathSound();
      
      // Добавляем эффект смерти
      this.createEnemyDeathEffect(enemy.sprite.x, enemy.sprite.y);
    } else {
      // Звук попадания по врагу
      this.playEnemyHitSound();
    }
    
    bullet.destroy();
  }

  wagonHitByEnemy(wagon, enemy) {
    if (!wagon || !enemy) return;
    
    // Получаем здоровье вагона
    let hp = wagon.getData('hp') - 1;
    
    // Эффект в зависимости от мира
    const worldType = this.scene.levelManager?.currentWorld ?? 0;
    
    if (hp <= 0) {
      // Уничтожение вагона
      this.scene.wagons = this.scene.wagons.filter(w => w !== wagon);
      this.scene.particleManager.createWagonDestroyEffect(wagon);
      
      // Специальный эффект разрушения для разных миров
      this.createWagonDestroyEffect(wagon, worldType);
      
      wagon.destroy();
      
      // Сдвиг позиции игрока
      this.scene.targetPlayerX = Math.max(110, this.scene.targetPlayerX - this.scene.wagonGap * 0.5);
      this.scene.cameras.main.shake(150, 0.008);
      
      // Звук разрушения
      this.playWagonDestroySound();
      
      // Обновляем счётчик вагонов
      if (this.scene.wagonCountText) {
        this.scene.wagonCountText.setText(`🚃 ${this.scene.wagons.length}/${this.scene.maxWagons}`);
      }
    } else {
      // Повреждение вагона
      wagon.setData('hp', hp);
      
      // Визуальный эффект
      this.createWagonHitEffect(wagon, worldType);
      
      // Звук удара по вагону
      this.playWagonHitSound();
      
      // Обновляем полоску здоровья вагона
      if (wagon.updateHealthBar) {
        wagon.updateHealthBar();
      }
    }
  }

  enemyHitByWagon(enemy, wagon) {
    if (!enemy) return;
    
    const killed = enemy.takeDamage(1);
    
    if (killed) {
      const reward = enemy.config.scoreValue;
      this.scene.crystals += reward;
      if (this.scene.crystalText) {
        this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
      }
      gameManager.addCrystals(reward, 'enemy_kill');
      
      if (this.scene.comboSystem) {
        this.scene.comboSystem.add();
      }
      
      this.playEnemyDeathSound();
      this.createEnemyDeathEffect(enemy.sprite.x, enemy.sprite.y);
    } else {
      this.playEnemyHitSound();
      this.createAttackEffect(enemy.sprite.x, enemy.sprite.y, false);
    }
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================

  createHitEffect(player, x, y) {
    // Эффект крови/искр
    if (this.scene.particleManager) {
      const color = this.scene.levelManager?.currentWorld === 1 ? 0xff44ff : 0xff4444;
      this.scene.particleManager.createAttackEffect(x, y);
      
      // Дополнительные частицы
      for (let i = 0; i < 3; i++) {
        const spark = this.scene.add.circle(
          x + Phaser.Math.Between(-15, 15),
          y + Phaser.Math.Between(-15, 15),
          2,
          color,
          0.7
        );
        spark.setBlendMode(Phaser.BlendModes.ADD);
        
        this.scene.tweens.add({
          targets: spark,
          alpha: 0,
          scale: 0,
          x: spark.x + Phaser.Math.Between(-30, 30),
          y: spark.y + Phaser.Math.Between(-30, 30),
          duration: 300,
          onComplete: () => spark.destroy()
        });
      }
    }
  }

  createCriticalEffect(x, y) {
    if (this.scene.particleManager) {
      for (let i = 0; i < 8; i++) {
        const particle = this.scene.add.circle(
          x + Phaser.Math.Between(-20, 20),
          y + Phaser.Math.Between(-20, 20),
          3,
          0xffaa00,
          0.8
        );
        particle.setBlendMode(Phaser.BlendModes.ADD);
        
        this.scene.tweens.add({
          targets: particle,
          alpha: 0,
          scale: 0,
          x: particle.x + Phaser.Math.Between(-50, 50),
          y: particle.y + Phaser.Math.Between(-50, 50),
          duration: 400,
          onComplete: () => particle.destroy()
        });
      }
    }
    
    // Текст критического удара
    const critText = this.scene.add.text(x, y - 30, 'CRITICAL!', {
      fontSize: '14px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffaa00',
      stroke: '#ff5500',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: critText,
      y: critText.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => critText.destroy()
    });
  }

  createAttackEffect(x, y, isCritical = false) {
    if (this.scene.particleManager) {
      this.scene.particleManager.createAttackEffect(x, y);
    }
    
    if (isCritical) {
      const flash = this.scene.add.circle(x, y, 15, 0xffaa00, 0.5);
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 2,
        duration: 200,
        onComplete: () => flash.destroy()
      });
    }
  }

  createEnemyDeathEffect(x, y) {
    if (this.scene.particleManager) {
      this.scene.particleManager.createEnemyDeathEffect(x, y);
    }
  }

  createWagonHitEffect(wagon, worldType) {
    // Визуальный эффект удара по вагону
    this.scene.tweens.add({
      targets: wagon,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 1
    });
    
    // Эффект искр
    for (let i = 0; i < 3; i++) {
      const spark = this.scene.add.circle(
        wagon.x + Phaser.Math.Between(-15, 15),
        wagon.y + Phaser.Math.Between(-15, 15),
        2,
        worldType === 1 ? 0xff44ff : 0xffaa44,
        0.7
      );
      spark.setBlendMode(Phaser.BlendModes.ADD);
      
      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        scale: 0,
        duration: 300,
        onComplete: () => spark.destroy()
      });
    }
  }

  createWagonDestroyEffect(wagon, worldType) {
    // Специальный эффект разрушения в зависимости от мира
    if (worldType === 1) {
      // Киберпанк - цифровые осколки
      for (let i = 0; i < 8; i++) {
        const debris = this.scene.add.text(
          wagon.x + Phaser.Math.Between(-20, 20),
          wagon.y + Phaser.Math.Between(-20, 20),
          ['0','1'][Math.floor(Math.random() * 2)],
          { fontSize: `${Phaser.Math.Between(8, 16)}px`, fontFamily: 'monospace', color: '#ff44ff' }
        );
        this.scene.tweens.add({
          targets: debris,
          alpha: 0,
          y: debris.y - 50,
          x: debris.x + Phaser.Math.Between(-50, 50),
          duration: 500,
          onComplete: () => debris.destroy()
        });
      }
    } else if (worldType === 4) {
      // Чёрная дыра - гравитационный коллапс
      const collapse = this.scene.add.circle(wagon.x, wagon.y, 15, 0xaa88ff, 0.6);
      this.scene.tweens.add({
        targets: collapse,
        scale: 0,
        alpha: 0,
        duration: 300,
        onComplete: () => collapse.destroy()
      });
    }
  }

  createShieldDeflect(x, y, source = 'enemy') {
    if (this.scene.particleManager) {
      this.scene.particleManager.createBonusEffect('shield', x, y);
    }
    
    // Эффект отражения
    const deflectRing = this.scene.add.circle(x, y, 20, 0x00ffff, 0.6);
    this.scene.tweens.add({
      targets: deflectRing,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => deflectRing.destroy()
    });
    
    // Звук щита
    try {
      audioManager.playSound(this.scene, 'shield_sound', 0.4);
    } catch (e) {}
  }

  flashPlayer(player, damage) {
    if (!player) return;
    
    const intensity = Math.min(0xff, 0x88 + damage * 20);
    player.setTint(Phaser.Display.Color.GetColor(intensity, intensity - 0x44, intensity - 0x44));
    
    this.scene.time.delayedCall(200, () => {
      if (player && player.active) {
        player.clearTint();
      }
    });
  }

  // =========================================================================
  // ЗВУКОВЫЕ ЭФФЕКТЫ
  // =========================================================================

  playHitSound(damage) {
    try {
      const volume = Math.min(0.5, 0.2 + damage * 0.1);
      audioManager.playSound(this.scene, 'hit_sound', volume);
    } catch (e) {}
  }

  playEnemyHitSound() {
    try {
      audioManager.playSound(this.scene, 'hit_sound', 0.2);
    } catch (e) {}
  }

  playEnemyDeathSound() {
    try {
      audioManager.playSound(this.scene, 'enemy_die_sound', 0.4);
    } catch (e) {}
  }

  playWagonHitSound() {
    try {
      audioManager.playSound(this.scene, 'hit_sound', 0.25);
    } catch (e) {}
  }

  playWagonDestroySound() {
    try {
      audioManager.playSound(this.scene, 'explosion_sound', 0.35);
    } catch (e) {}
  }

  // =========================================================================
  // ВИБРАЦИЯ
  // =========================================================================

  triggerVibration(intensity = 'medium') {
    if (gameManager.data.vibrationEnabled && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(intensity);
    }
  }

  // =========================================================================
  // КРИТИЧЕСКИЕ УДАРЫ
  // =========================================================================

  checkCriticalHit() {
    // Базовый шанс критического удара 10%
    let critChance = 0.1;
    
    // Бонус от скина
    const skinStats = gameManager.getCurrentSkinStats();
    if (skinStats && skinStats.critBonus) {
      critChance += skinStats.critBonus / 100;
    }
    
    // Бонус от улучшений
    const upgradeLevel = gameManager.getUpgradeLevel('critChance');
    if (upgradeLevel) {
      critChance += upgradeLevel * 0.02;
    }
    
    return Math.random() < critChance;
  }

  // =========================================================================
  // СТАТИСТИКА
  // =========================================================================

  addDamageToHistory(source, damage) {
    this.damageHistory.unshift({
      source,
      damage,
      time: Date.now(),
      world: this.scene.levelManager?.currentWorld ?? 0
    });
    
    if (this.damageHistory.length > this.maxHistorySize) {
      this.damageHistory.pop();
    }
  }

  updateDamageStats(damage) {
    if (gameManager.data.stats) {
      gameManager.data.stats.totalDamageTaken = (gameManager.data.stats.totalDamageTaken || 0) + damage;
      gameManager.save();
    }
  }

  getDamageHistory() {
    return [...this.damageHistory];
  }

  getTotalDamageTaken() {
    return gameManager.data.stats?.totalDamageTaken || 0;
  }

  // =========================================================================
  // ОБНОВЛЕНИЕ
  // =========================================================================

  update(delta) {
    if (this.hitCooldown > 0) {
      this.hitCooldown -= delta;
    }
  }

  // =========================================================================
  // СБРОС
  // =========================================================================

  reset() {
    this.hitCooldown = 0;
    this.damageMultiplier = 1;
    this.shieldAbsorption = 1;
    this.damageHistory = [];
    this.lastDamageSource = null;
  }
}