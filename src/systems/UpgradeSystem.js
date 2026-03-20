import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';
import { UPGRADE_COSTS } from '../config';

export class UpgradeSystem {
  constructor(scene) {
    this.scene = scene;
    this.upgrades = gameManager.data.upgrades;
    this.upgradeEffects = new Map();
    this.upgradeAnimations = [];
    this.applyAllUpgrades();
  }

  // =========================================================================
  // ПРИМЕНЕНИЕ ВСЕХ УЛУЧШЕНИЙ
  // =========================================================================

  applyAllUpgrades() {
    // Параметры игрока
    this.applyJumpPower();
    this.applyGravity();
    this.applyHealth();
    this.applyWagonStats();
    this.applyBonusStats();
    this.applyWeaponStats();
    
    // Применяем визуальные эффекты улучшений
    this.applyUpgradeVisuals();
    
    // Логируем применённые улучшения
    console.log('UpgradeSystem: all upgrades applied', this.getUpgradeSummary());
  }

  applyJumpPower() {
    const level = this.upgrades.jumpPower || 0;
    this.scene.jumpPower = 300 + level * 25;
    
    // Бонус от скина
    const skinStats = gameManager.getCurrentSkinStats();
    if (skinStats && skinStats.jumpBonus) {
      this.scene.jumpPower += skinStats.jumpBonus;
    }
  }

  applyGravity() {
    const level = this.upgrades.gravity || 0;
    let gravityValue = 1300 - level * 60;
    
    // Модификатор от мира (применяется в LevelManager)
    const world = this.scene.levelManager?.currentWorld ?? 0;
    const worldGravity = this.scene.levelManager?.getWorldGravity() || 1300;
    
    // Комбинируем улучшение и гравитацию мира
    const reduction = (1300 - gravityValue);
    gravityValue = worldGravity - reduction;
    
    this.scene.physics.world.gravity.y = Math.max(400, Math.min(2000, gravityValue));
  }

  applyHealth() {
    const level = this.upgrades.headHP || 0;
    this.scene.maxHeadHP = 3 + level;
    
    // Бонус от скина
    const skinStats = gameManager.getCurrentSkinStats();
    if (skinStats && skinStats.armorBonus) {
      this.scene.maxHeadHP += Math.floor(skinStats.armorBonus / 10);
    }
    
    if (this.scene.headHP === undefined || this.scene.headHP > this.scene.maxHeadHP) {
      this.scene.headHP = this.scene.maxHeadHP;
    }
  }

  applyWagonStats() {
    const hpLevel = this.upgrades.wagonHP || 0;
    const maxLevel = this.upgrades.maxWagons || 0;
    const gapLevel = this.upgrades.wagonGap || 0;
    
    this.scene.wagonBaseHP = 1 + hpLevel;
    this.scene.maxWagons = 12 + maxLevel * 2;
    this.scene.wagonGap = Math.max(15, 28 - gapLevel * 2);
    
    // Бонус от скина
    const skinStats = gameManager.getCurrentSkinStats();
    if (skinStats && skinStats.wagonBonus) {
      this.scene.wagonBaseHP += Math.floor(skinStats.wagonBonus / 20);
      this.scene.maxWagons += Math.floor(skinStats.wagonBonus / 10);
    }
  }

  applyBonusStats() {
    const magnetLevel = this.upgrades.magnetRange || 0;
    const shieldLevel = this.upgrades.shieldDuration || 0;
    const revivalLevel = this.upgrades.revival || 0;
    
    this.scene.magnetRange = 220 + magnetLevel * 40;
    this.scene.shieldDuration = 5 + shieldLevel * 1.5;
    this.scene.revivals = revivalLevel;
    
    // Бонус от скина
    const skinStats = gameManager.getCurrentSkinStats();
    if (skinStats && skinStats.magnetBonus) {
      this.scene.magnetRange += skinStats.magnetBonus;
    }
    if (skinStats && skinStats.shieldBonus) {
      this.scene.shieldDuration += skinStats.shieldBonus / 10;
    }
  }

  applyWeaponStats() {
    const damageLevel = this.upgrades.weaponDamage || 0;
    const speedLevel = this.upgrades.weaponSpeed || 0;
    const fireRateLevel = this.upgrades.weaponFireRate || 0;
    
    this.scene.weaponDamage = 1 + damageLevel;
    this.scene.weaponBulletSpeed = 400 + speedLevel * 20;
    this.scene.weaponFireDelay = Math.max(100, 500 - fireRateLevel * 20);
    this.scene.weaponCooldown = 0;
    
    // Бонус от скина
    const skinStats = gameManager.getCurrentSkinStats();
    if (skinStats && skinStats.damageBonus) {
      this.scene.weaponDamage += Math.floor(skinStats.damageBonus / 10);
    }
    if (skinStats && skinStats.speedBonus) {
      this.scene.weaponBulletSpeed += skinStats.speedBonus;
    }
  }

  applyUpgradeVisuals() {
    // Применяем визуальные эффекты в зависимости от уровня улучшений
    const totalLevels = this.getTotalUpgradeLevels();
    
    // Эффект свечения игрока
    if (totalLevels >= 50 && this.scene.player && !this.scene.player.glowEffect) {
      this.createPlayerGlow();
    }
    
    // Эффект следа
    if (totalLevels >= 100 && this.scene.player && !this.scene.player.trailEffect) {
      this.createPlayerTrail();
    }
    
    // Эффект ауры
    if (totalLevels >= 200 && this.scene.player && !this.scene.player.auraEffect) {
      this.createPlayerAura();
    }
  }

  createPlayerGlow() {
    if (!this.scene.player) return;
    
    const glow = this.scene.add.circle(
      this.scene.player.x,
      this.scene.player.y,
      35,
      0x00ffff,
      0.2
    );
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(12);
    
    this.scene.player.glowEffect = glow;
    
    // Анимация пульсации
    this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.3 },
      scale: { from: 1, to: 1.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        if (this.scene.player && this.scene.player.active) {
          glow.setPosition(this.scene.player.x, this.scene.player.y);
        }
      }
    });
  }

  createPlayerTrail() {
    if (!this.scene.player) return;
    
    const trailColors = [0x00ffff, 0xff00ff, 0xffff00];
    
    this.scene.player.trailEffect = this.scene.add.particles(0, 0, 'flare', {
      speed: 30,
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 300,
      quantity: 2,
      frequency: 30,
      blendMode: Phaser.BlendModes.ADD,
      tint: trailColors,
      follow: this.scene.player,
      followOffset: { x: -20, y: 0 }
    });
  }

  createPlayerAura() {
    if (!this.scene.player) return;
    
    const aura = this.scene.add.circle(
      this.scene.player.x,
      this.scene.player.y,
      45,
      0xff44ff,
      0.15
    );
    aura.setBlendMode(Phaser.BlendModes.ADD);
    aura.setDepth(11);
    
    this.scene.player.auraEffect = aura;
    
    this.scene.tweens.add({
      targets: aura,
      alpha: { from: 0.1, to: 0.25 },
      scale: { from: 1, to: 1.3 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        if (this.scene.player && this.scene.player.active) {
          aura.setPosition(this.scene.player.x, this.scene.player.y);
        }
      }
    });
  }

  // =========================================================================
  // ПРИМЕНЕНИЕ КОНКРЕТНОГО УЛУЧШЕНИЯ
  // =========================================================================

  applyUpgrade(key) {
    const currentLevel = this.upgrades[key] || 0;
    const maxLevel = this.getMaxLevel(key);
    
    if (currentLevel >= maxLevel) {
      this.showMaxLevelNotification(key);
      return false;
    }
    
    const cost = this.getUpgradeCost(key);
    
    if (gameManager.spendCrystals(cost, `upgrade_${key}`)) {
      this.upgrades[key] = currentLevel + 1;
      gameManager.data.upgrades = this.upgrades;
      gameManager.save();
      
      // Применяем улучшение
      this.applyAllUpgrades();
      
      // Визуальный эффект
      this.createUpgradeEffect(key);
      
      // Звук
      this.playUpgradeSound();
      
      // Уведомление
      this.showUpgradeNotification(key);
      
      // Обновляем UI в сцене
      this.updateUI();
      
      // Проверяем достижения
      this.checkUpgradeAchievements();
      
      return true;
    }
    
    this.showNoFundsNotification();
    return false;
  }

  createUpgradeEffect(key) {
    if (!this.scene.player) return;
    
    const colors = {
      jumpPower: 0x44ff44,
      gravity: 0x88aaff,
      shieldDuration: 0x00ffff,
      magnetRange: 0xff00ff,
      wagonHP: 0xffaa44,
      maxWagons: 0xffaa44,
      wagonGap: 0xffaa44,
      headHP: 0xff4444,
      revival: 0xff44ff,
      weaponDamage: 0xff4444,
      weaponSpeed: 0xffaa00,
      weaponFireRate: 0xffaa00
    };
    
    const color = colors[key] || 0x00ffff;
    
    // Эффект взрыва частиц
    if (this.scene.particleManager) {
      this.scene.particleManager.createBonusEffect('speed', this.scene.player.x, this.scene.player.y);
    }
    
    // Кольцо вокруг игрока
    const ring = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 30, color, 0.8);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    
    this.scene.tweens.add({
      targets: ring,
      scale: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => ring.destroy()
    });
    
    // Пульсация игрока
    this.scene.tweens.add({
      targets: this.scene.player,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 150,
      yoyo: true,
      ease: 'Quad.out'
    });
  }

  playUpgradeSound() {
    try {
      audioManager.playSound(this.scene, 'level_up_sound', 0.5);
    } catch (e) {}
  }

  showUpgradeNotification(key) {
    const upgradeName = this.getUpgradeName(key);
    const newLevel = this.upgrades[key] || 0;
    const maxLevel = this.getMaxLevel(key);
    
    if (this.scene.showNotification) {
      this.scene.showNotification(`${upgradeName} улучшен до ${newLevel}/${maxLevel} уровня!`, 2000, '#00ff00');
    }
  }

  showMaxLevelNotification(key) {
    const upgradeName = this.getUpgradeName(key);
    if (this.scene.showNotification) {
      this.scene.showNotification(`${upgradeName} достиг максимального уровня!`, 1500, '#ffaa00');
    }
  }

  showNoFundsNotification() {
    if (this.scene.showNotification) {
      this.scene.showNotification('Недостаточно кристаллов!', 1500, '#ff4444');
    }
  }

  updateUI() {
    // Обновляем отображение здоровья
    if (this.scene.updateHearts) {
      this.scene.updateHearts();
    }
    
    // Обновляем отображение вагонов
    if (this.scene.wagonCountText) {
      this.scene.wagonCountText.setText(`🚃 ${this.scene.wagons?.length || 0}/${this.scene.maxWagons}`);
    }
  }

  checkUpgradeAchievements() {
    const totalLevels = this.getTotalUpgradeLevels();
    
    if (totalLevels >= 10) gameManager.unlockAchievement('upgrade_10');
    if (totalLevels >= 25) gameManager.unlockAchievement('upgrade_25');
    if (totalLevels >= 50) gameManager.unlockAchievement('upgrade_50');
    if (totalLevels >= 100) gameManager.unlockAchievement('upgrade_100');
    if (totalLevels >= 200) gameManager.unlockAchievement('upgrade_200');
    
    // Проверка на максимальный уровень конкретного улучшения
    for (const [key, config] of Object.entries(UPGRADE_COSTS)) {
      if (this.isMaxLevel(key)) {
        gameManager.unlockAchievement(`max_${key}`);
      }
    }
  }

  // =========================================================================
  // ГЕТТЕРЫ
  // =========================================================================

  getUpgradeValue(key) {
    const level = this.upgrades[key] || 0;
    
    switch(key) {
      case 'jumpPower': return 300 + level * 25;
      case 'gravity': return 1300 - level * 60;
      case 'headHP': return 3 + level;
      case 'magnetRange': return 220 + level * 40;
      case 'wagonHP': return 1 + level;
      case 'maxWagons': return 12 + level * 2;
      case 'wagonGap': return Math.max(15, 28 - level * 2);
      case 'shieldDuration': return 5 + level * 1.5;
      case 'weaponDamage': return 1 + level;
      case 'weaponSpeed': return 400 + level * 20;
      case 'weaponFireRate': return Math.max(100, 500 - level * 20);
      case 'revival': return level;
      default: return 0;
    }
  }

  getUpgradeCost(key) {
    const level = this.upgrades[key] || 0;
    const cfg = UPGRADE_COSTS[key];
    if (!cfg) return 999999;
    
    let cost = Math.floor(cfg.base * Math.pow(cfg.multiplier, level));
    
    // Скидка от престижа
    const prestigeBonus = gameManager.getPrestigeBonus();
    if (prestigeBonus && prestigeBonus.discount) {
      cost = Math.floor(cost * (1 - prestigeBonus.discount / 100));
    }
    
    return Math.max(1, cost);
  }

  getUpgradeLevel(key) {
    return this.upgrades[key] || 0;
  }

  getUpgradeName(key) {
    const names = {
      jumpPower: 'Сила прыжка',
      gravity: 'Гравитация',
      headHP: 'Макс. здоровье',
      magnetRange: 'Радиус магнита',
      wagonHP: 'Прочность вагонов',
      maxWagons: 'Макс. вагонов',
      wagonGap: 'Дистанция вагонов',
      shieldDuration: 'Длительность щита',
      weaponDamage: 'Урон оружия',
      weaponSpeed: 'Скорость пуль',
      weaponFireRate: 'Скорострельность',
      revival: 'Воскрешение'
    };
    return names[key] || key;
  }

  getMaxLevel(key) {
    const config = {
      jumpPower: 20,
      gravity: 20,
      shieldDuration: 15,
      magnetRange: 15,
      wagonHP: 20,
      maxWagons: 15,
      wagonGap: 15,
      headHP: 15,
      revival: 5,
      weaponDamage: 15,
      weaponSpeed: 15,
      weaponFireRate: 15,
    };
    return config[key] || 10;
  }

  isMaxLevel(key) {
    return this.getUpgradeLevel(key) >= this.getMaxLevel(key);
  }

  getUpgradeProgress(key) {
    const current = this.getUpgradeLevel(key);
    const max = this.getMaxLevel(key);
    return (current / max) * 100;
  }

  getTotalUpgradeLevels() {
    let total = 0;
    for (const key in UPGRADE_COSTS) {
      total += this.upgrades[key] || 0;
    }
    return total;
  }

  getTotalUpgradeCost() {
    let total = 0;
    for (const key in UPGRADE_COSTS) {
      total += this.getUpgradeCost(key);
    }
    return total;
  }

  getUpgradeSummary() {
    const summary = {};
    for (const key in UPGRADE_COSTS) {
      summary[key] = {
        level: this.getUpgradeLevel(key),
        maxLevel: this.getMaxLevel(key),
        value: this.getUpgradeValue(key),
        cost: this.getUpgradeCost(key),
        isMax: this.isMaxLevel(key),
        progress: this.getUpgradeProgress(key)
      };
    }
    return summary;
  }

  getAllUpgrades() {
    return Object.keys(UPGRADE_COSTS).map(key => ({
      key,
      name: this.getUpgradeName(key),
      level: this.getUpgradeLevel(key),
      maxLevel: this.getMaxLevel(key),
      value: this.getUpgradeValue(key),
      cost: this.getUpgradeCost(key),
      isMax: this.isMaxLevel(key),
      progress: this.getUpgradeProgress(key)
    }));
  }

  // =========================================================================
  // СБРОС И ОЧИСТКА
  // =========================================================================

  reset() {
    for (const key in UPGRADE_COSTS) {
      this.upgrades[key] = 0;
    }
    gameManager.data.upgrades = this.upgrades;
    gameManager.save();
    this.applyAllUpgrades();
    
    // Удаляем визуальные эффекты
    if (this.scene.player) {
      if (this.scene.player.glowEffect) this.scene.player.glowEffect.destroy();
      if (this.scene.player.trailEffect) this.scene.player.trailEffect.destroy();
      if (this.scene.player.auraEffect) this.scene.player.auraEffect.destroy();
      this.scene.player.glowEffect = null;
      this.scene.player.trailEffect = null;
      this.scene.player.auraEffect = null;
    }
    
    if (this.scene.showNotification) {
      this.scene.showNotification('Все улучшения сброшены!', 2000, '#ffaa00');
    }
  }

  destroy() {
    this.upgradeAnimations.forEach(anim => {
      if (anim && anim.stop) anim.stop();
    });
    this.upgradeAnimations = [];
    this.upgradeEffects.clear();
  }
}