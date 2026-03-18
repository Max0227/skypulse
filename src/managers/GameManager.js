import { ACHIEVEMENTS, UPGRADE_COSTS, SKINS } from '../config';

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
      if (!data.upgrades) data.upgrades = this.getDefaultData().upgrades;
      if (!data.ownedSkins) data.ownedSkins = ['default'];
      if (!data.currentSkin) data.currentSkin = 'default';
      if (!data.achievements) data.achievements = {};
      if (!data.stats) data.stats = this.getDefaultData().stats;
      if (data.crystals === undefined) data.crystals = 0;
      if (!data.soundEnabled) data.soundEnabled = true;
      if (!data.musicEnabled) data.musicEnabled = true;
      if (!data.vibrationEnabled) data.vibrationEnabled = true;
      if (!data.tutorialCompleted) data.tutorialCompleted = false;
      if (!data.levelPrices) data.levelPrices = this.getDefaultLevelPrices();
      if (!data.worldProgress) data.worldProgress = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      
      return data;
    } catch (e) {
      console.error('Failed to load data, using defaults', e);
      return this.getDefaultData();
    }
  }

  getDefaultData() {
    return {
      crystals: 1000, // Для тестирования
      unlockedWorlds: [0],
      unlockedLevels: { '0': [0] },
      levelStars: {},
      worldProgress: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
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
      ownedSkins: ['default'],
      currentSkin: 'default',
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
        maxCombo: 0,
        totalCoinsCollected: 0,
        totalEnemiesKilled: 0,
        totalDistance: 0,
      }
    };
  }

  getDefaultLevelPrices() {
    return {
      '0-0': 0, '0-1': 100, '0-2': 200, '0-3': 300, '0-4': 400,
      '0-5': 500, '0-6': 600, '0-7': 700, '0-8': 800, '0-9': 900,
      '1-0': 200, '1-1': 300, '1-2': 400, '1-3': 500, '1-4': 600,
      '1-5': 700, '1-6': 800, '1-7': 900, '1-8': 1000, '1-9': 1100,
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
      if (level > (this.data.worldProgress[world] || -1)) {
        this.data.worldProgress[world] = level;
      }
      this.save();
    }
  }

  purchaseLevel(world, level) {
    const price = this.getLevelPrice(world, level);
    if (price === undefined) return false;
    if (this.data.crystals < price) return false;
    if (this.isLevelUnlocked(world, level)) return false;
    this.data.crystals -= price;
    this.unlockLevel(world, level);
    return true;
  }

  getLevelPrice(world, level) {
    const key = `${world}-${level}`;
    return this.data.levelPrices?.[key] || 0;
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
    for (let l = 0; l < 10; l++) total += this.getLevelStars(world, l);
    return total;
  }

  // ===== СКИНЫ =====
  getOwnedSkins() { 
    return this.data.ownedSkins || ['default']; 
  }

  getCurrentSkin() { 
    return this.data.currentSkin || 'default'; 
  }

  purchaseSkin(skinId) {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) return false;
    if (this.data.ownedSkins.includes(skinId)) return false;
    if (this.data.crystals < skin.price) return false;
    
    this.data.crystals -= skin.price;
    this.data.ownedSkins.push(skinId);
    this.save();
    return true;
  }

  selectSkin(skinId) {
    if (this.data.ownedSkins.includes(skinId)) {
      this.data.currentSkin = skinId;
      this.save();
      return true;
    }
    return false;
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
      return true;
    }
    return false;
  }

  // ===== СТАТИСТИКА =====
  updateStats(score, level, wagons, combo, coins, enemies, distance) {
    const s = this.data.stats;
    s.totalGames++;
    s.maxScore = Math.max(s.maxScore, score);
    s.maxLevel = Math.max(s.maxLevel, level);
    s.maxWagons = Math.max(s.maxWagons, wagons);
    s.maxCombo = Math.max(s.maxCombo || 0, combo);
    s.totalCoinsCollected += coins;
    s.totalEnemiesKilled += enemies;
    s.totalDistance += distance;
    this.save();
  }

  // ===== ВИБРАЦИЯ =====
  vibrate(pattern = [50]) {
    if (!this.data.vibrationEnabled) return;
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      } else if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      console.warn('Vibration not supported');
    }
  }
}

export const gameManager = new GameManager();
window.gameManager = gameManager;