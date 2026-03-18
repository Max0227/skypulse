import { gameManager } from '../managers/GameManager';
import { UPGRADE_COSTS } from '../config';

export class UpgradeSystem {
  constructor(scene) {
    this.scene = scene;
    this.upgrades = gameManager.data.upgrades;
    this.applyAllUpgrades();
  }

  applyAllUpgrades() {
    this.scene.jumpPower = 300 + (this.upgrades.jumpPower || 0) * 25;
    const gravityValue = 1300 - (this.upgrades.gravity || 0) * 60;
    this.scene.physics.world.gravity.y = gravityValue;
    this.scene.maxHeadHP = 3 + (this.upgrades.headHP || 0);
    this.scene.headHP = this.scene.maxHeadHP;
    this.scene.wagonBaseHP = 1 + (this.upgrades.wagonHP || 0);
    this.scene.magnetRange = 220 + (this.upgrades.magnetRange || 0) * 40;
    this.scene.maxWagons = 12 + (this.upgrades.maxWagons || 0) * 2;
    this.scene.wagonGap = 28 - (this.upgrades.wagonGap || 0) * 2;
    this.scene.shieldDuration = 5 + (this.upgrades.shieldDuration || 0) * 1.5;
    this.scene.revivals = this.upgrades.revival || 0;
    this.scene.weaponDamage = 1 + (this.upgrades.weaponDamage || 0);
    this.scene.weaponBulletSpeed = 400 + (this.upgrades.weaponSpeed || 0) * 20;
    this.scene.weaponFireDelay = Math.max(100, 500 - (this.upgrades.weaponFireRate || 0) * 20);
    this.scene.weaponCooldown = 0;
  }

  applyUpgrade(key) {
    this.upgrades[key] = (this.upgrades[key] || 0) + 1;
    gameManager.data.upgrades = this.upgrades;
    gameManager.save();
    this.applyAllUpgrades();
    if (this.scene.particleManager) {
      this.scene.particleManager.createBonusEffect('speed', this.scene.player.x, this.scene.player.y);
    }
  }

  getUpgradeValue(key) {
    switch(key) {
      case 'jumpPower': return 300 + (this.upgrades.jumpPower || 0) * 25;
      case 'gravity': return 1300 - (this.upgrades.gravity || 0) * 60;
      case 'headHP': return 3 + (this.upgrades.headHP || 0);
      case 'magnetRange': return 220 + (this.upgrades.magnetRange || 0) * 40;
      case 'wagonHP': return 1 + (this.upgrades.wagonHP || 0);
      case 'maxWagons': return 12 + (this.upgrades.maxWagons || 0) * 2;
      case 'wagonGap': return 28 - (this.upgrades.wagonGap || 0) * 2;
      case 'shieldDuration': return 5 + (this.upgrades.shieldDuration || 0) * 1.5;
      case 'weaponDamage': return 1 + (this.upgrades.weaponDamage || 0);
      case 'weaponSpeed': return 400 + (this.upgrades.weaponSpeed || 0) * 20;
      case 'weaponFireRate': return Math.max(100, 500 - (this.upgrades.weaponFireRate || 0) * 20);
      default: return 0;
    }
  }

  getUpgradeCost(key) {
    const level = this.upgrades[key] || 0;
    const cfg = UPGRADE_COSTS[key];
    if (!cfg) return 999999;
    return Math.floor(cfg.base * Math.pow(cfg.multiplier, level));
  }
}