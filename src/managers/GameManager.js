import { ACHIEVEMENTS, UPGRADE_COSTS } from '../config';

export class GameManager {
  constructor() {
    this.data = this.loadData();
    this.bgMusic = null;
  }

  loadData() {
    try {
      const saved = localStorage.getItem('skypulse_data');
      const data = saved ? JSON.parse(saved) : this.getDefaultData();
      // Миграции для новых полей
      if (!data.unlockedWorlds) data.unlockedWorlds = [0];
      if (!data.unlockedLevels) data.unlockedLevels = { '0': [0] };
      if (!data.levelStars) data.levelStars = {};
      if (!data.upgrades) data.upgrades = {};
      if (!data.achievements) data.achievements = {};
      if (!data.stats) data.stats = this.getDefaultData().stats;
      if (data.crystals === undefined) data.crystals = 0;
      if (!data.soundEnabled) data.soundEnabled = true;
      if (!data.musicEnabled) data.musicEnabled = true;
      if (!data.vibrationEnabled) data.vibrationEnabled = true;
      if (!data.tutorialCompleted) data.tutorialCompleted = false;
      return data;
    } catch (e) {
      console.error('Failed to load data:', e);
      return this.getDefaultData();
    }
  }

  getDefaultData() {
    return {
      crystals: 0,
      coins: 0,
      totalScore: 0,
      totalMeters: 0,
      totalGates: 0,
      level: 0,
      unlockedWorlds: [0],
      unlockedLevels: { '0': [0] },
      levelStars: {},
      currentWorld: 0,
      currentLevel: 0,
      upgrades: {
        jumpPower: 0,
        gravity: 0,
        shieldDuration: 0,
        magnetRange: 0,
        wagonHP: 0,
        maxWagons: 0,
        wagonGap: 0,
        headHP: 0,
        revival: 0,
        weaponDamage: 0,
        weaponSpeed: 0,
        weaponFireRate: 0,
      },
      achievements: {},
      soundEnabled: true,
      musicEnabled: true,
      vibrationEnabled: true,
      tutorialCompleted: false,
      stats: {
        totalGames: 0,
        totalPlayTime: 0,
        maxScore: 0,
        maxLevel: 0,
        maxWagons: 0,
      }
    };
  }

  save() {
    localStorage.setItem('skypulse_data', JSON.stringify(this.data));
  }

  addCrystals(amount) {
    this.data.crystals += amount;
    this.save();
  }

  unlockAchievement(achievementId) {
    if (!this.data.achievements[achievementId]) {
      this.data.achievements[achievementId] = {
        id: achievementId,
        unlockedAt: Date.now(),
        claimed: false
      };
      this.save();
      return true;
    }
    return false;
  }

  // ===== МИРЫ И УРОВНИ =====
  getCurrentWorld() { return this.data.currentWorld || 0; }
  setCurrentWorld(w) { this.data.currentWorld = w; this.save(); }

  getCurrentLevel() { return this.data.currentLevel || 0; }
  setCurrentLevel(l) { this.data.currentLevel = l; this.save(); }

  isLevelUnlocked(world, level) {
    return this.data.unlockedLevels?.[world]?.includes(level) || false;
  }

  unlockLevel(world, level) {
    if (!this.data.unlockedLevels) this.data.unlockedLevels = {};
    if (!this.data.unlockedLevels[world]) this.data.unlockedLevels[world] = [];
    if (!this.data.unlockedLevels[world].includes(level)) {
      this.data.unlockedLevels[world].push(level);
      this.save();
    }
  }

  getLevelStars(world, level) {
    return this.data.levelStars?.[`${world}-${level}`] || 0;
  }

  setLevelStars(world, level, stars) {
    if (!this.data.levelStars) this.data.levelStars = {};
    this.data.levelStars[`${world}-${level}`] = Math.min(3, stars);
    this.save();
  }

  getStarsForWorld(world) {
    let total = 0;
    for (let l = 0; l < 5; l++) total += this.getLevelStars(world, l);
    return total;
  }
}

export const gameManager = new GameManager();
window.gameManager = gameManager;