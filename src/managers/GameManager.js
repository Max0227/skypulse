import { ACHIEVEMENTS, UPGRADE_COSTS } from '../config';

export class GameManager {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      const saved = localStorage.getItem('skypulse_data');
      const data = saved ? JSON.parse(saved) : this.getDefaultData();
      // Миграции для новых полей
      if (!data.unlockedWorlds) data.unlockedWorlds = [0];
      if (!data.unlockedLevels) data.unlockedLevels = { '0': [0] };
      if (!data.levelStars) data.levelStars = {};
      if (!data.currentWorld) data.currentWorld = 0;
      if (!data.currentLevel) data.currentLevel = 0;
      if (!data.upgrades) data.upgrades = this.getDefaultData().upgrades;
      if (!data.achievements) data.achievements = {};
      if (!data.stats) data.stats = this.getDefaultData().stats;
      if (data.crystals === undefined) data.crystals = 0;
      if (!data.soundEnabled) data.soundEnabled = true;
      if (!data.musicEnabled) data.musicEnabled = true;
      if (!data.vibrationEnabled) data.vibrationEnabled = true;
      if (!data.tutorialCompleted) data.tutorialCompleted = false;
      return data;
    } catch (e) {
      console.error('Failed to load data, using defaults', e);
      return this.getDefaultData();
    }
  }

  getDefaultData() {
    return {
      crystals: 0,
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
      },
      ownedSkins: ['default'],
      currentSkin: 'player',
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

  // ===== МИРЫ И УРОВНИ =====
  getCurrentWorld() { return this.data.currentWorld || 0; }
  setCurrentWorld(w) { this.data.currentWorld = w; this.save(); }

  getCurrentLevel() { return this.data.currentLevel || 0; }
  setCurrentLevel(l) { this.data.currentLevel = l; this.save(); }

  isLevelUnlocked(world, level) {
    return this.data.unlockedLevels[world]?.includes(level) || false;
  }

  unlockLevel(world, level) {
    if (!this.data.unlockedLevels[world]) this.data.unlockedLevels[world] = [];
    if (!this.data.unlockedLevels[world].includes(level)) {
      this.data.unlockedLevels[world].push(level);
      this.save();
    }
  }

  getLevelStars(world, level) {
    return this.data.levelStars[`${world}-${level}`] || 0;
  }

  setLevelStars(world, level, stars) {
    this.data.levelStars[`${world}-${level}`] = Math.min(3, stars);
    this.save();
  }

  getStarsForWorld(world) {
    let total = 0;
    for (let l = 0; l < 5; l++) total += this.getLevelStars(world, l);
    return total;
  }

  // ===== ПРОКАЧКИ =====
  getUpgradeLevel(key) { return this.data.upgrades[key] || 0; }

  upgrade(key) {
    const cost = this.getUpgradeCost(key);
    if (this.data.crystals >= cost) {
      this.data.crystals -= cost;
      this.data.upgrades[key] = this.getUpgradeLevel(key) + 1;
      this.save();
      return true;
    }
    return false;
  }

  getUpgradeCost(key) {
    const level = this.getUpgradeLevel(key);
    const cfg = UPGRADE_COSTS[key];
    if (!cfg) return 999999;
    return Math.floor(cfg.base * Math.pow(cfg.multiplier, level));
  }

  // ===== КРИСТАЛЛЫ =====
  addCrystals(amount) {
    this.data.crystals += amount;
    this.save();
  }

  // ===== ДОСТИЖЕНИЯ =====
  unlockAchievement(id) {
    if (!this.data.achievements[id]) {
      this.data.achievements[id] = { unlockedAt: Date.now() };
      this.addCrystals(ACHIEVEMENTS[id]?.reward || 0);
      this.save();
    }
  }

  // ===== СТАТИСТИКА =====
  updateStats(score, level, wagons) {
    const s = this.data.stats;
    s.totalGames++;
    s.maxScore = Math.max(s.maxScore, score);
    s.maxLevel = Math.max(s.maxLevel, level);
    s.maxWagons = Math.max(s.maxWagons, wagons);
    this.save();
  }
}

export const gameManager = new GameManager();
window.gameManager = gameManager;