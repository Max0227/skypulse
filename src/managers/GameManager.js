import { ACHIEVEMENTS, UPGRADE_COSTS, SKINS } from '../config';

export class GameManager {
  constructor() {
    this.data = this.loadData();
    this.bgMusic = null;
    this.eventListeners = {};
    this.skinStatsCache = new Map();
    this.upgradeCache = new Map();
    this.achievementProgress = new Map();
    this.dailyRewardTimer = null;
    this.autoSaveTimer = null;
    this.sessionStartTime = Date.now();
    this.isInitialized = false;
  }

  // =========================================================================
  // ИНИЦИАЛИЗАЦИЯ
  // =========================================================================

  init() {
    if (this.isInitialized) return;
    
    this.startAutoSave();
    this.checkDailyReward(); // <- этот метод нужно добавить
    this.updateLastPlayed();
    this.isInitialized = true;
    
    console.log('GameManager initialized', this.getGameSummary());
  }

  startAutoSave() {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    this.autoSaveTimer = setInterval(() => {
      if (this.getSetting('autoSave')) {
        this.save();
      }
    }, 60000);
  }

  // =========================================================================
  // ДНЕВНЫЕ НАГРАДЫ (ДОБАВЛЯЕМ ОТСУТСТВУЮЩИЙ МЕТОД)
  // =========================================================================

  /**
   * Проверка и обновление дневной награды
   */
  checkDailyReward() {
    const today = new Date().toISOString().split('T')[0];
    const lastClaim = this.data.dailyReward?.lastClaimDate || '';
    
    if (lastClaim !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastClaim === yesterdayStr) {
        this.data.dailyReward.streak = Math.min((this.data.dailyReward.streak || 0) + 1, 10);
      } else if (lastClaim !== today) {
        this.data.dailyReward.streak = 1;
      }
      
      this.data.dailyReward.lastClaimDate = today;
      this.data.dailyReward.available = true;
      this.save();
      
      console.log('Daily reward updated, streak:', this.data.dailyReward.streak);
    }
  }

  claimDailyReward() {
    const today = new Date().toISOString().split('T')[0];
    const reward = this.data.dailyReward;
    
    if (reward.lastClaimDate !== today && reward.available) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (reward.lastClaimDate === yesterdayStr) {
        reward.streak = Math.min(reward.streak + 1, 10);
      } else {
        reward.streak = 1;
      }
      
      reward.lastClaimDate = today;
      reward.available = false;
      
      const rewardAmount = reward.rewards[reward.streak - 1] || 10;
      this.addCrystals(rewardAmount, 'daily');
      this.save();
      this.emit('dailyRewardClaimed', { streak: reward.streak, amount: rewardAmount });
      
      if (reward.streak >= 7) this.unlockAchievement('weekly_streak');
      if (reward.streak >= 30) this.unlockAchievement('monthly_streak');
      
      return rewardAmount;
    }
    return 0;
  }

  canClaimDailyReward() {
    const today = new Date().toISOString().split('T')[0];
    return this.data.dailyReward.lastClaimDate !== today && this.data.dailyReward.available;
  }

  getDailyRewardStreak() {
    return this.data.dailyReward.streak || 0;
  }

  getDailyRewardProgress() {
    return {
      streak: this.getDailyRewardStreak(),
      nextReward: this.data.dailyReward.rewards[this.getDailyRewardStreak()] || 10,
      canClaim: this.canClaimDailyReward()
    };
  }

  // =========================================================================
  // ЗАГРУЗКА И СОХРАНЕНИЕ
  // =========================================================================

  loadData() {
    try {
      const saved = localStorage.getItem('skypulse_data');
      const data = saved ? JSON.parse(saved) : this.getDefaultData();
      
      // Миграции для новых полей
      data.unlockedWorlds = data.unlockedWorlds || [0];
      data.unlockedLevels = data.unlockedLevels || { '0': [0] };
      data.levelStars = data.levelStars || {};
      data.upgrades = data.upgrades || this.getDefaultData().upgrades;
      data.ownedSkins = data.ownedSkins || ['taxi_classic'];
      data.currentSkin = data.currentSkin || 'taxi_classic';
      data.achievements = data.achievements || {};
      data.stats = data.stats || this.getDefaultData().stats;
      data.crystals = data.crystals ?? 0;
      data.soundEnabled = data.soundEnabled ?? true;
      data.musicEnabled = data.musicEnabled ?? true;
      data.vibrationEnabled = data.vibrationEnabled ?? true;
      data.tutorialCompleted = data.tutorialCompleted ?? false;
      data.levelPrices = data.levelPrices || this.getDefaultLevelPrices();
      data.worldProgress = data.worldProgress || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      data.dailyReward = data.dailyReward || this.getDefaultDailyReward();
      data.leaderboard = data.leaderboard || [];
      data.settings = data.settings || this.getDefaultSettings();
      data.currentWorld = data.currentWorld ?? 0;
      data.currentLevel = data.currentLevel ?? 0;
      data.totalPlayTime = data.totalPlayTime ?? 0;
      data.lastPlayed = data.lastPlayed ?? null;
      data.skinStats = data.skinStats || {};
      data.selectedEffects = data.selectedEffects || {};
      data.favoriteSkins = data.favoriteSkins || [];
      data.skinUsage = data.skinUsage || {};
      data.completedAchievements = data.completedAchievements || [];
      data.secretAchievements = data.secretAchievements || [];
      data.purchasedItems = data.purchasedItems || {};
      data.consumables = data.consumables || {};
      data.dailyQuests = data.dailyQuests || this.generateDailyQuests();
      data.weeklyQuests = data.weeklyQuests || this.generateWeeklyQuests();
      data.eventProgress = data.eventProgress || {};
      data.seasonPass = data.seasonPass || this.getDefaultSeasonPass();
      data.goldenTickets = data.goldenTickets || 0;
      data.prestigeLevel = data.prestigeLevel || 0;
      data.prestigePoints = data.prestigePoints || 0;
      data.achievementPoints = data.achievementPoints || 0;
      data.collectionScore = data.collectionScore || 0;
      
      return data;
    } catch (e) {
      console.error('Failed to load data, using defaults', e);
      return this.getDefaultData();
    }
  }

  getDefaultData() {
    return {
      crystals: 0,
      goldenTickets: 0,
      prestigeLevel: 0,
      prestigePoints: 0,
      achievementPoints: 0,
      collectionScore: 0,
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
      ownedSkins: ['taxi_classic'],
      currentSkin: 'taxi_classic',
      favoriteSkins: [],
      skinUsage: {},
      skinStats: {},
      selectedEffects: {},
      achievements: {},
      completedAchievements: [],
      secretAchievements: [],
      purchasedItems: {},
      consumables: {},
      dailyQuests: [],
      weeklyQuests: [],
      eventProgress: {},
      seasonPass: {},
      soundEnabled: true,
      musicEnabled: true,
      vibrationEnabled: true,
      tutorialCompleted: false,
      currentWorld: 0,
      currentLevel: 0,
      totalPlayTime: 0,
      lastPlayed: null,
      dailyReward: {
        lastClaimDate: '',
        streak: 0,
        available: true,
        rewards: [10, 20, 30, 50, 75, 100, 150, 200, 250, 300]
      },
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
        totalDeaths: 0,
        totalPurchases: 0,
        totalCrystalsEarned: 0,
        totalCrystalsSpent: 0,
        totalGatesPassed: 0,
        totalPowerupsCollected: 0,
        longestSession: 0,
        bestCombo: 0,
        favoriteSkin: 'taxi_classic',
        totalPerfectGames: 0,
        totalNoHitRuns: 0,
        totalSpeedRuns: 0,
        fastestCompletion: 999999,
        longestCombo: 0,
      }
    };
  }

  getDefaultLevelPrices() {
    return {
      '0-0': 0, '0-1': 100, '0-2': 200, '0-3': 300, '0-4': 400,
      '0-5': 500, '0-6': 600, '0-7': 700, '0-8': 800, '0-9': 900,
      '1-0': 200, '1-1': 300, '1-2': 400, '1-3': 500, '1-4': 600,
      '1-5': 700, '1-6': 800, '1-7': 900, '1-8': 1000, '1-9': 1100,
      '2-0': 400, '2-1': 500, '2-2': 600, '2-3': 700, '2-4': 800,
      '2-5': 900, '2-6': 1000, '2-7': 1100, '2-8': 1200, '2-9': 1300,
      '3-0': 600, '3-1': 700, '3-2': 800, '3-3': 900, '3-4': 1000,
      '3-5': 1100, '3-6': 1200, '3-7': 1300, '3-8': 1400, '3-9': 1500,
      '4-0': 800, '4-1': 900, '4-2': 1000, '4-3': 1100, '4-4': 1200,
      '4-5': 1300, '4-6': 1400, '4-7': 1500, '4-8': 1600, '4-9': 1700,
    };
  }

  getDefaultDailyReward() {
    return {
      lastClaimDate: '',
      streak: 0,
      available: true,
      rewards: [10, 20, 30, 50, 75, 100, 150, 200, 250, 300]
    };
  }

  getDefaultSettings() {
    return {
      soundEnabled: true,
      musicEnabled: true,
      vibrationEnabled: true,
      language: 'ru',
      difficulty: 'normal',
      autoSave: true,
      showTutorial: true,
      highQualityEffects: true,
      showFPS: false,
      autoCollect: true,
      screenShake: true,
      hapticFeedback: true,
      cloudSave: false,
      showNotifications: true,
      reduceMotion: false,
      highContrast: false,
    };
  }

  getDefaultSeasonPass() {
    return {
      level: 0,
      xp: 0,
      claimedRewards: [],
      premium: false,
      premiumClaimed: []
    };
  }

  save() {
    try {
      localStorage.setItem('skypulse_data', JSON.stringify(this.data));
      this.emit('save', this.data);
      return true;
    } catch (e) {
      console.error('Failed to save data', e);
      return false;
    }
  }

  reset() {
    try {
      localStorage.removeItem('skypulse_data');
      this.data = this.getDefaultData();
      this.clearCaches();
      this.emit('reset');
      return true;
    } catch (e) {
      console.error('Failed to reset data', e);
      return false;
    }
  }

  clearCaches() {
    this.skinStatsCache.clear();
    this.upgradeCache.clear();
    this.achievementProgress.clear();
  }

  exportData() {
    return JSON.stringify({
      data: this.data,
      version: '3.0.0',
      timestamp: Date.now(),
      gameVersion: this.getVersion(),
      platform: navigator.platform,
      userAgent: navigator.userAgent
    });
  }

  importData(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.data) {
        this.data = imported.data;
        this.clearCaches();
        this.save();
        this.emit('import', imported);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import data', e);
      return false;
    }
  }

  backup() {
    const backup = this.exportData();
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skypulse_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // МИРЫ И УРОВНИ (остальные методы остаются без изменений)
  // =========================================================================

  getCurrentWorld() { 
    return this.data.currentWorld || 0; 
  }
  
  setCurrentWorld(w) { 
    this.data.currentWorld = w; 
    this.save();
    this.emit('worldChanged', w);
  }

  getCurrentLevel() { 
    return this.data.currentLevel || 0; 
  }
  
  setCurrentLevel(l) { 
    this.data.currentLevel = l; 
    this.save();
    this.emit('levelChanged', l);
  }

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
      this.emit('levelUnlocked', { world, level });
      this.checkLevelAchievements();
      return true;
    }
    return false;
  }

  purchaseLevel(world, level) {
    const price = this.getLevelPrice(world, level);
    if (price === undefined) return false;
    if (this.data.crystals < price) return false;
    if (this.isLevelUnlocked(world, level)) return false;

    this.data.crystals -= price;
    this.data.stats.totalPurchases += price;
    this.data.stats.totalCrystalsSpent += price;
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
    this.emit('starsUpdated', { world, level, stars });
    this.checkStarAchievements();
  }

  getStarsForWorld(world) {
    let total = 0;
    for (let l = 0; l < 10; l++) total += this.getLevelStars(world, l);
    return total;
  }

  getWorldProgress(world) {
    return this.data.worldProgress[world] || 0;
  }

  getNextUnlockableLevel(world) {
    const progress = this.getWorldProgress(world);
    return progress < 9 ? progress + 1 : null;
  }

  checkLevelAchievements() {
    const totalStars = this.getTotalStars();
    if (totalStars >= 10) this.unlockAchievement('star_collector_1');
    if (totalStars >= 25) this.unlockAchievement('star_collector_2');
    if (totalStars >= 50) this.unlockAchievement('star_collector_3');
    if (totalStars >= 100) this.unlockAchievement('star_collector_4');
    if (totalStars >= 150) this.unlockAchievement('star_collector_5');
  }

  checkStarAchievements() {
    for (let w = 0; w < 5; w++) {
      let allThree = true;
      for (let l = 0; l < 10; l++) {
        if (this.getLevelStars(w, l) < 3) {
          allThree = false;
          break;
        }
      }
      if (allThree) {
        this.unlockAchievement(`world_${w}_perfect`);
      }
    }
  }

  getTotalStars() {
    let total = 0;
    for (let w = 0; w < 5; w++) {
      total += this.getStarsForWorld(w);
    }
    return total;
  }

  // =========================================================================
  // СКИНЫ (остаются без изменений)
  // =========================================================================

  getOwnedSkins() { 
    return this.data.ownedSkins || ['taxi_classic']; 
  }
  
  getCurrentSkin() { 
    return this.data.currentSkin || 'taxi_classic'; 
  }

  getSkinById(skinId) {
    return SKINS.find(s => s.id === skinId);
  }

  getSkinStats(skinId) {
    if (this.skinStatsCache.has(skinId)) {
      return this.skinStatsCache.get(skinId);
    }
    
    const skin = this.getSkinById(skinId);
    const defaultStats = {
      speedBonus: 0,
      armorBonus: 0,
      handlingBonus: 0,
      jumpBonus: 0
    };
    
    const stats = skin ? { ...defaultStats, ...skin.stats } : defaultStats;
    this.skinStatsCache.set(skinId, stats);
    return stats;
  }

  getCurrentSkinStats() {
    return this.getSkinStats(this.getCurrentSkin());
  }

  purchaseSkin(skinId) {
    const skin = this.getSkinById(skinId);
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
      const oldSkin = this.data.currentSkin;
      this.data.currentSkin = skinId;
      this.data.skinUsage[skinId] = (this.data.skinUsage[skinId] || 0) + 1;
      this.updateFavoriteSkin();
      this.save();
      this.clearCaches();
      this.emit('skinSelected', { skinId, oldSkin });
      this.checkSkinSelectionAchievements();
      return true;
    }
    return false;
  }

  isSkinOwned(skinId) {
    return this.data.ownedSkins.includes(skinId);
  }

  toggleFavoriteSkin(skinId) {
    if (!this.isSkinOwned(skinId)) return false;
    const index = this.data.favoriteSkins.indexOf(skinId);
    if (index === -1) {
      this.data.favoriteSkins.push(skinId);
    } else {
      this.data.favoriteSkins.splice(index, 1);
    }
    this.save();
    this.emit('favoritesUpdated', this.data.favoriteSkins);
    return true;
  }

  isFavoriteSkin(skinId) {
    return this.data.favoriteSkins.includes(skinId);
  }

  getFavoriteSkins() {
    return this.data.favoriteSkins || [];
  }

  updateFavoriteSkin() {
    const usage = this.data.skinUsage || {};
    let maxUsage = 0;
    let favorite = 'taxi_classic';
    Object.entries(usage).forEach(([skinId, count]) => {
      if (count > maxUsage) {
        maxUsage = count;
        favorite = skinId;
      }
    });
    this.data.stats.favoriteSkin = favorite;
  }

  getSkinUsage(skinId) {
    return this.data.skinUsage[skinId] || 0;
  }

  getTotalSkins() {
    return SKINS.length;
  }

  getOwnedSkinsCount() {
    return this.data.ownedSkins.length;
  }

  getCollectionProgress() {
    return {
      owned: this.getOwnedSkinsCount(),
      total: this.getTotalSkins(),
      percentage: (this.getOwnedSkinsCount() / this.getTotalSkins()) * 100
    };
  }

  getSkinsByRarity(rarity) {
    return SKINS.filter(s => s.rarity === rarity);
  }

  getOwnedSkinsByRarity(rarity) {
    return this.data.ownedSkins.filter(skinId => {
      const skin = this.getSkinById(skinId);
      return skin && skin.rarity === rarity;
    });
  }

  getRarityCount(rarity) {
    return this.getSkinsByRarity(rarity).length;
  }

  getOwnedRarityCount(rarity) {
    return this.getOwnedSkinsByRarity(rarity).length;
  }

  updateCollectionScore() {
    let score = 0;
    score += this.getOwnedSkinsCount() * 10;
    score += this.getOwnedRarityCount('RARE') * 20;
    score += this.getOwnedRarityCount('EPIC') * 50;
    score += this.getOwnedRarityCount('LEGENDARY') * 100;
    
    if (this.getOwnedRarityCount('COMMON') === this.getRarityCount('COMMON')) {
      score += 100;
      this.unlockAchievement('complete_common');
    }
    if (this.getOwnedRarityCount('RARE') === this.getRarityCount('RARE')) {
      score += 200;
      this.unlockAchievement('complete_rare');
    }
    if (this.getOwnedRarityCount('EPIC') === this.getRarityCount('EPIC')) {
      score += 500;
      this.unlockAchievement('complete_epic');
    }
    if (this.getOwnedRarityCount('LEGENDARY') === this.getRarityCount('LEGENDARY')) {
      score += 1000;
      this.unlockAchievement('complete_legendary');
    }
    
    this.data.collectionScore = score;
    this.save();
  }

  checkSkinCollectionAchievements() {
    const owned = this.getOwnedSkinsCount();
    if (owned >= 5) this.unlockAchievement('skin_collector_1');
    if (owned >= 10) this.unlockAchievement('skin_collector_2');
    if (owned >= 15) this.unlockAchievement('skin_collector_3');
    if (owned >= 20) this.unlockAchievement('skin_collector_4');
    if (owned >= 25) this.unlockAchievement('skin_collector_5');
    
    if (this.getOwnedRarityCount('LEGENDARY') >= 1) this.unlockAchievement('legendary_collector_1');
    if (this.getOwnedRarityCount('LEGENDARY') >= 3) this.unlockAchievement('legendary_collector_2');
    if (this.getOwnedRarityCount('LEGENDARY') >= 5) this.unlockAchievement('legendary_collector_3');
  }

  checkSkinSelectionAchievements() {
    const totalSelections = Object.values(this.data.skinUsage || {}).reduce((a, b) => a + b, 0);
    if (totalSelections >= 10) this.unlockAchievement('skin_selector_1');
    if (totalSelections >= 50) this.unlockAchievement('skin_selector_2');
    if (totalSelections >= 100) this.unlockAchievement('skin_selector_3');
    if (totalSelections >= 500) this.unlockAchievement('skin_selector_4');
    if (totalSelections >= 1000) this.unlockAchievement('skin_selector_5');
  }

  // =========================================================================
  // ЭФФЕКТЫ СКИНОВ
  // =========================================================================

  getSkinEffect(skinId) {
    const skin = this.getSkinById(skinId);
    return skin?.effects || 'none';
  }

  getCurrentSkinEffect() {
    return this.getSkinEffect(this.getCurrentSkin());
  }

  enableSkinEffect(skinId, effect) {
    if (!this.data.selectedEffects) this.data.selectedEffects = {};
    this.data.selectedEffects[skinId] = effect;
    this.save();
  }

  getEnabledSkinEffect(skinId) {
    return this.data.selectedEffects?.[skinId];
  }

  // =========================================================================
  // ПРОКАЧКИ
  // =========================================================================

  getUpgradeLevel(key) { 
    return this.data.upgrades[key] || 0; 
  }

  upgrade(key) {
    const cost = this.getUpgradeCost(key);
    if (this.data.crystals >= cost) {
      this.data.crystals -= cost;
      this.data.stats.totalPurchases += cost;
      this.data.stats.totalCrystalsSpent += cost;
      this.data.upgrades[key] = this.getUpgradeLevel(key) + 1;
      this.clearCaches();
      this.save();
      this.emit('upgrade', { key, level: this.data.upgrades[key] });
      this.checkUpgradeAchievements();
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

  getUpgradeValue(key) {
    const cacheKey = `${key}-${this.getUpgradeLevel(key)}`;
    if (this.upgradeCache.has(cacheKey)) {
      return this.upgradeCache.get(cacheKey);
    }
    
    const level = this.getUpgradeLevel(key);
    let value;
    
    switch(key) {
      case 'jumpPower': value = 300 + level * 25; break;
      case 'gravity': value = 1300 - level * 60; break;
      case 'headHP': value = 3 + level; break;
      case 'magnetRange': value = 220 + level * 40; break;
      case 'wagonHP': value = 1 + level; break;
      case 'maxWagons': value = 12 + level * 2; break;
      case 'wagonGap': value = 28 - level * 2; break;
      case 'shieldDuration': value = 5 + level * 1.5; break;
      case 'weaponDamage': value = 1 + level; break;
      case 'weaponSpeed': value = 400 + level * 20; break;
      case 'weaponFireRate': value = Math.max(100, 500 - level * 20); break;
      case 'revival': value = level; break;
      default: value = 0;
    }
    
    this.upgradeCache.set(cacheKey, value);
    return value;
  }

  getAllUpgrades() {
    return Object.keys(UPGRADE_COSTS).map(key => ({
      key,
      level: this.getUpgradeLevel(key),
      cost: this.getUpgradeCost(key),
      value: this.getUpgradeValue(key)
    }));
  }

  getTotalUpgradeLevels() {
    return Object.values(this.data.upgrades).reduce((a, b) => a + b, 0);
  }

  getUpgradeProgress() {
    const total = this.getTotalUpgradeLevels();
    const maxTotal = Object.keys(UPGRADE_COSTS).length * 20;
    return (total / maxTotal) * 100;
  }

  checkUpgradeAchievements() {
    const total = this.getTotalUpgradeLevels();
    if (total >= 10) this.unlockAchievement('upgrader_1');
    if (total >= 25) this.unlockAchievement('upgrader_2');
    if (total >= 50) this.unlockAchievement('upgrader_3');
    if (total >= 100) this.unlockAchievement('upgrader_4');
    if (total >= 200) this.unlockAchievement('upgrader_5');
  }

  // =========================================================================
  // КРИСТАЛЛЫ
  // =========================================================================

  addCrystals(amount, source = 'unknown') {
    if (amount > 0) {
      this.data.crystals += amount;
      this.data.stats.totalCrystalsEarned += amount;
      this.save();
      this.emit('crystalsChanged', { amount: this.data.crystals, added: amount, source });
      return true;
    }
    return false;
  }

  spendCrystals(amount, reason = 'unknown') {
    if (amount <= this.data.crystals) {
      this.data.crystals -= amount;
      this.data.stats.totalPurchases += amount;
      this.data.stats.totalCrystalsSpent += amount;
      this.save();
      this.emit('crystalsChanged', { amount: this.data.crystals, spent: amount, reason });
      return true;
    }
    return false;
  }

  getCrystals() {
    return this.data.crystals || 0;
  }

  getTotalCrystalsEarned() {
    return this.data.stats.totalCrystalsEarned || 0;
  }

  getTotalCrystalsSpent() {
    return this.data.stats.totalCrystalsSpent || 0;
  }

  getCrystalBalance() {
    return {
      current: this.getCrystals(),
      earned: this.getTotalCrystalsEarned(),
      spent: this.getTotalCrystalsSpent(),
      net: this.getTotalCrystalsEarned() - this.getTotalCrystalsSpent()
    };
  }

  // =========================================================================
  // ДОСТИЖЕНИЯ
  // =========================================================================

  unlockAchievement(id) {
    if (!this.data.achievements[id]) {
      const achievement = ACHIEVEMENTS[id];
      const reward = achievement?.reward || 0;
      
      this.data.achievements[id] = { 
        unlockedAt: Date.now(),
        claimed: false 
      };
      
      if (reward > 0) {
        this.addCrystals(reward, 'achievement');
        this.data.achievementPoints += reward;
      }
      
      this.data.completedAchievements.push(id);
      
      if (achievement?.secret) {
        this.data.secretAchievements.push(id);
      }
      
      this.save();
      this.emit('achievementUnlocked', { id, achievement, reward });
      return true;
    }
    return false;
  }

  isAchievementUnlocked(id) {
    return !!this.data.achievements[id];
  }

  getAchievementProgress(id) {
    return this.data.achievements[id]?.progress || 0;
  }

  updateAchievementProgress(id, progress) {
    if (!this.data.achievements[id]) {
      this.data.achievements[id] = { progress: 0 };
    }
    this.data.achievements[id].progress = Math.min(progress, 100);
    
    if (progress >= 100) {
      this.unlockAchievement(id);
    }
    
    this.save();
  }

  getAllAchievements() {
    return Object.keys(ACHIEVEMENTS).map(id => ({
      id,
      ...ACHIEVEMENTS[id],
      unlocked: this.isAchievementUnlocked(id),
      progress: this.getAchievementProgress(id),
      unlockedAt: this.data.achievements[id]?.unlockedAt
    }));
  }

  getCompletedAchievementsCount() {
    return this.data.completedAchievements.length;
  }

  getTotalAchievements() {
    return Object.keys(ACHIEVEMENTS).length;
  }

  getAchievementPoints() {
    return this.data.achievementPoints || 0;
  }

  getAchievementProgressPercentage() {
    return (this.getCompletedAchievementsCount() / this.getTotalAchievements()) * 100;
  }

  // =========================================================================
  // СТАТИСТИКА
  // =========================================================================

  updateStats(score, level, wagons, combo, coins, enemies, distance) {
    const s = this.data.stats;
    s.totalGames++;
    s.maxScore = Math.max(s.maxScore, score);
    s.maxLevel = Math.max(s.maxLevel, level);
    s.maxWagons = Math.max(s.maxWagons, wagons);
    s.maxCombo = Math.max(s.maxCombo || 0, combo);
    s.bestCombo = Math.max(s.bestCombo || 0, combo);
    s.totalCoinsCollected += coins;
    s.totalEnemiesKilled += enemies;
    s.totalDistance += distance;
    
    if (this.data.stats.totalDeaths === 0) {
      s.totalPerfectGames++;
    }
    
    const currentTime = Date.now() - this.sessionStartTime;
    if (currentTime < s.fastestCompletion) {
      s.fastestCompletion = currentTime;
    }
    
    this.save();
    this.emit('statsUpdated', s);
    this.checkStatsAchievements();
  }

  addDeath() {
    this.data.stats.totalDeaths = (this.data.stats.totalDeaths || 0) + 1;
    this.save();
  }

  updatePlayTime(delta) {
    this.data.totalPlayTime = (this.data.totalPlayTime || 0) + delta;
    this.data.stats.totalPlayTime = (this.data.stats.totalPlayTime || 0) + delta;
    
    if (delta > (this.data.stats.longestSession || 0)) {
      this.data.stats.longestSession = delta;
    }
    
    this.save();
    this.checkTimeAchievements();
  }

  addGatePassed() {
    this.data.stats.totalGatesPassed = (this.data.stats.totalGatesPassed || 0) + 1;
    this.save();
  }

  addPowerupCollected() {
    this.data.stats.totalPowerupsCollected = (this.data.stats.totalPowerupsCollected || 0) + 1;
    this.save();
  }

  getStats() {
    return this.data.stats;
  }

  getFormattedStats() {
    const s = this.data.stats;
    return {
      ...s,
      totalPlayTimeFormatted: this.formatTime(s.totalPlayTime),
      longestSessionFormatted: this.formatTime(s.longestSession),
      averageScorePerGame: s.totalGames ? Math.floor(s.maxScore / s.totalGames) : 0,
      crystalsPerGame: s.totalGames ? Math.floor(this.getTotalCrystalsEarned() / s.totalGames) : 0,
      gatesPerGame: s.totalGames ? Math.floor(s.totalGatesPassed / s.totalGames) : 0,
      enemiesPerGame: s.totalGames ? Math.floor(s.totalEnemiesKilled / s.totalGames) : 0,
      deathsPerGame: s.totalGames ? (s.totalDeaths / s.totalGames).toFixed(2) : 0,
      winRate: s.totalGames ? ((s.totalGames - s.totalDeaths) / s.totalGames * 100).toFixed(1) : 0
    };
  }

  checkStatsAchievements() {
    const s = this.data.stats;
    if (s.totalGames >= 10) this.unlockAchievement('veteran_1');
    if (s.totalGames >= 50) this.unlockAchievement('veteran_2');
    if (s.totalGames >= 100) this.unlockAchievement('veteran_3');
    if (s.totalGames >= 500) this.unlockAchievement('veteran_4');
    if (s.totalGames >= 1000) this.unlockAchievement('veteran_5');
    
    if (s.maxScore >= 1000) this.unlockAchievement('score_1k');
    if (s.maxScore >= 5000) this.unlockAchievement('score_5k');
    if (s.maxScore >= 10000) this.unlockAchievement('score_10k');
    if (s.maxScore >= 50000) this.unlockAchievement('score_50k');
    
    if (s.totalDistance >= 10000) this.unlockAchievement('distance_10k');
    if (s.totalDistance >= 50000) this.unlockAchievement('distance_50k');
    if (s.totalDistance >= 100000) this.unlockAchievement('distance_100k');
    
    if (s.bestCombo >= 10) this.unlockAchievement('combo_10');
    if (s.bestCombo >= 25) this.unlockAchievement('combo_25');
    if (s.bestCombo >= 50) this.unlockAchievement('combo_50');
    if (s.bestCombo >= 100) this.unlockAchievement('combo_100');
    
    if (s.totalPerfectGames >= 1) this.unlockAchievement('perfect_1');
    if (s.totalPerfectGames >= 10) this.unlockAchievement('perfect_10');
    if (s.totalPerfectGames >= 50) this.unlockAchievement('perfect_50');
  }

  checkTimeAchievements() {
    const totalTime = this.data.totalPlayTime;
    if (totalTime >= 3600) this.unlockAchievement('time_1h');
    if (totalTime >= 36000) this.unlockAchievement('time_10h');
    if (totalTime >= 86400) this.unlockAchievement('time_24h');
    if (totalTime >= 604800) this.unlockAchievement('time_7d');
    if (totalTime >= 2592000) this.unlockAchievement('time_30d');
  }

  // =========================================================================
  // КВЕСТЫ
  // =========================================================================

  generateDailyQuests() {
    const quests = [
      { id: 'daily_1', type: 'score', target: 1000, reward: 50, progress: 0, completed: false },
      { id: 'daily_2', type: 'distance', target: 5000, reward: 75, progress: 0, completed: false },
      { id: 'daily_3', type: 'combo', target: 20, reward: 100, progress: 0, completed: false },
      { id: 'daily_4', type: 'crystals', target: 50, reward: 150, progress: 0, completed: false },
      { id: 'daily_5', type: 'gates', target: 30, reward: 80, progress: 0, completed: false }
    ];
    return this.shuffleArray(quests).slice(0, 3);
  }

  generateWeeklyQuests() {
    const quests = [
      { id: 'weekly_1', type: 'score', target: 10000, reward: 300, progress: 0, completed: false },
      { id: 'weekly_2', type: 'distance', target: 50000, reward: 500, progress: 0, completed: false },
      { id: 'weekly_3', type: 'combo', target: 100, reward: 750, progress: 0, completed: false },
      { id: 'weekly_4', type: 'crystals', target: 500, reward: 1000, progress: 0, completed: false },
      { id: 'weekly_5', type: 'games', target: 20, reward: 400, progress: 0, completed: false },
      { id: 'weekly_6', type: 'perfect', target: 5, reward: 600, progress: 0, completed: false },
      { id: 'weekly_7', type: 'no_hit', target: 3, reward: 800, progress: 0, completed: false }
    ];
    return this.shuffleArray(quests).slice(0, 5);
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  updateQuestProgress(type, amount) {
    this.data.dailyQuests.forEach(quest => {
      if (quest.type === type && !quest.completed) {
        quest.progress = Math.min(quest.progress + amount, quest.target);
        if (quest.progress >= quest.target) {
          quest.completed = true;
          this.emit('questCompleted', quest);
        }
      }
    });
    
    this.data.weeklyQuests.forEach(quest => {
      if (quest.type === type && !quest.completed) {
        quest.progress = Math.min(quest.progress + amount, quest.target);
        if (quest.progress >= quest.target) {
          quest.completed = true;
          this.emit('questCompleted', quest);
        }
      }
    });
    
    this.save();
  }

  claimQuestReward(questId, isDaily = true) {
    const quests = isDaily ? this.data.dailyQuests : this.data.weeklyQuests;
    const quest = quests.find(q => q.id === questId);
    
    if (quest && quest.completed && !quest.claimed) {
      quest.claimed = true;
      this.addCrystals(quest.reward, 'quest');
      this.save();
      this.emit('questClaimed', quest);
      return true;
    }
    return false;
  }

  getActiveQuests() {
    return {
      daily: this.data.dailyQuests.filter(q => !q.completed),
      weekly: this.data.weeklyQuests.filter(q => !q.completed)
    };
  }

  getCompletedQuests() {
    return {
      daily: this.data.dailyQuests.filter(q => q.completed && !q.claimed),
      weekly: this.data.weeklyQuests.filter(q => q.completed && !q.claimed)
    };
  }

  // =========================================================================
  // ЛИДЕРБОРД
  // =========================================================================

  addLeaderboardEntry(score, level, wagons, meters, skinId) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      score,
      level,
      wagons,
      meters,
      skin: skinId || this.getCurrentSkin(),
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('ru-RU'),
      playerName: 'Player',
      prestige: this.data.prestigeLevel || 0
    };
    
    this.data.leaderboard.unshift(entry);
    this.data.leaderboard = this.data.leaderboard.slice(0, 100);
    this.save();
    this.emit('leaderboardUpdated', this.data.leaderboard);
  }

  getLeaderboard(limit = 50) {
    return (this.data.leaderboard || []).slice(0, limit);
  }

  getPersonalBest() {
    const entries = this.data.leaderboard || [];
    return Math.max(...entries.map(e => e.score), 0);
  }

  getPersonalBestBySkin(skinId) {
    const entries = this.data.leaderboard || [];
    const skinEntries = entries.filter(e => e.skin === skinId);
    return Math.max(...skinEntries.map(e => e.score), 0);
  }

  getLeaderboardRank(score) {
    const entries = this.data.leaderboard || [];
    const sorted = [...entries].sort((a, b) => b.score - a.score);
    const index = sorted.findIndex(e => e.score <= score);
    return index === -1 ? sorted.length + 1 : index + 1;
  }

  clearLeaderboard() {
    this.data.leaderboard = [];
    this.save();
    this.emit('leaderboardUpdated', []);
  }

  // =========================================================================
  // ПРЕСТИЖ
  // =========================================================================

  canPrestige() {
    return this.getTotalStars() >= 150;
  }

  prestige() {
    if (!this.canPrestige()) return false;
    
    this.data.prestigeLevel += 1;
    this.data.prestigePoints += 100 * this.data.prestigeLevel;
    
    const oldCrystals = this.data.crystals;
    const oldSkins = this.data.ownedSkins;
    const oldPrestige = this.data.prestigeLevel;
    const oldPoints = this.data.prestigePoints;
    
    this.data = this.getDefaultData();
    this.data.crystals = oldCrystals + 1000;
    this.data.ownedSkins = oldSkins;
    this.data.prestigeLevel = oldPrestige;
    this.data.prestigePoints = oldPoints;
    
    this.save();
    this.emit('prestige', this.data.prestigeLevel);
    return true;
  }

  getPrestigeBonus() {
    return {
      crystalMultiplier: 1 + (this.data.prestigeLevel * 0.1),
      scoreMultiplier: 1 + (this.data.prestigeLevel * 0.05),
      luckMultiplier: 1 + (this.data.prestigeLevel * 0.02)
    };
  }

  // =========================================================================
  // НАСТРОЙКИ
  // =========================================================================

  getSetting(key) {
    return this.data.settings?.[key] ?? this.getDefaultSettings()[key];
  }

  setSetting(key, value) {
    if (!this.data.settings) this.data.settings = this.getDefaultSettings();
    this.data.settings[key] = value;
    this.save();
    this.emit('settingChanged', { key, value });
  }

  toggleSound() {
    this.setSetting('soundEnabled', !this.getSetting('soundEnabled'));
    return this.getSetting('soundEnabled');
  }

  toggleMusic() {
    this.setSetting('musicEnabled', !this.getSetting('musicEnabled'));
    return this.getSetting('musicEnabled');
  }

  toggleVibration() {
    this.setSetting('vibrationEnabled', !this.getSetting('vibrationEnabled'));
    return this.getSetting('vibrationEnabled');
  }

  toggleHapticFeedback() {
    this.setSetting('hapticFeedback', !this.getSetting('hapticFeedback'));
    return this.getSetting('hapticFeedback');
  }

  // =========================================================================
  // ТУТОРИАЛ
  // =========================================================================

  isTutorialCompleted() {
    return this.data.tutorialCompleted || false;
  }

  setTutorialCompleted() {
    this.data.tutorialCompleted = true;
    this.save();
    this.emit('tutorialCompleted');
  }

  // =========================================================================
  // ВИБРАЦИЯ
  // =========================================================================

  vibrate(pattern) {
    if (!this.getSetting('vibrationEnabled') || !this.getSetting('hapticFeedback')) return;
    
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        if (typeof pattern === 'string') {
          window.Telegram.WebApp.HapticFeedback.impactOccurred(pattern);
        } else {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
      } else if (window.navigator?.vibrate) {
        window.navigator.vibrate(pattern);
      }
    } catch (e) {}
  }

  // =========================================================================
  // СОБЫТИЯ
  // =========================================================================

  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event] = this.eventListeners[event].filter(
      cb => cb !== callback
    );
  }

  emit(event, data) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error(`Error in event listener for ${event}:`, e);
      }
    });
  }

  // =========================================================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // =========================================================================

  getVersion() {
    return '3.0.0';
  }

  getLastPlayed() {
    return this.data.lastPlayed;
  }

  updateLastPlayed() {
    this.data.lastPlayed = Date.now();
    this.save();
  }

  getTotalPlayTime() {
    return this.data.totalPlayTime || 0;
  }

  formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) return `${hrs}ч ${mins}м`;
    if (mins > 0) return `${mins}м ${secs}с`;
    return `${secs}с`;
  }

  getProgressPercentage(world) {
    return (this.getWorldProgress(world) + 1) * 10;
  }

  getTotalProgress() {
    let total = 0;
    for (let w = 0; w < 5; w++) {
      total += this.getWorldProgress(w) + 1;
    }
    return Math.floor(total * 2);
  }

  getGameSummary() {
    return {
      crystals: this.getCrystals(),
      totalCrystalsEarned: this.getTotalCrystalsEarned(),
      totalCrystalsSpent: this.getTotalCrystalsSpent(),
      ownedSkins: this.getOwnedSkinsCount(),
      totalSkins: this.getTotalSkins(),
      collectionProgress: this.getCollectionProgress().percentage,
      completedAchievements: this.getCompletedAchievementsCount(),
      totalAchievements: this.getTotalAchievements(),
      achievementProgress: this.getAchievementProgressPercentage(),
      totalGames: this.data.stats.totalGames,
      maxScore: this.data.stats.maxScore,
      maxCombo: this.data.stats.maxCombo,
      totalDistance: this.data.stats.totalDistance,
      totalPlayTime: this.formatTime(this.getTotalPlayTime()),
      favoriteSkin: this.data.stats.favoriteSkin,
      prestigeLevel: this.data.prestigeLevel,
      collectionScore: this.data.collectionScore,
      achievementPoints: this.getAchievementPoints(),
      dailyStreak: this.getDailyRewardStreak()
    };
  }

  getFullPlayerProfile() {
    return {
      general: {
        crystals: this.getCrystals(),
        prestige: this.data.prestigeLevel,
        playTime: this.formatTime(this.getTotalPlayTime()),
        lastPlayed: this.data.lastPlayed ? new Date(this.data.lastPlayed).toLocaleString() : 'Никогда'
      },
      progression: {
        worlds: this.getTotalProgress() + '%',
        stars: this.getTotalStars(),
        levelsUnlocked: Object.values(this.data.unlockedLevels).flat().length,
        currentWorld: this.getCurrentWorld() + 1,
        currentLevel: this.getCurrentLevel() + 1
      },
      collection: {
        skins: this.getOwnedSkinsCount() + '/' + this.getTotalSkins(),
        favorites: this.getFavoriteSkins().length,
        collectionScore: this.data.collectionScore,
        byRarity: {
          common: this.getOwnedRarityCount('COMMON') + '/' + this.getRarityCount('COMMON'),
          rare: this.getOwnedRarityCount('RARE') + '/' + this.getRarityCount('RARE'),
          epic: this.getOwnedRarityCount('EPIC') + '/' + this.getRarityCount('EPIC'),
          legendary: this.getOwnedRarityCount('LEGENDARY') + '/' + this.getRarityCount('LEGENDARY')
        }
      },
      achievements: {
        completed: this.getCompletedAchievementsCount() + '/' + this.getTotalAchievements(),
        points: this.getAchievementPoints(),
        progress: this.getAchievementProgressPercentage().toFixed(1) + '%'
      },
      stats: this.getFormattedStats()
    };
  }
}

export const gameManager = new GameManager();
window.gameManager = gameManager;

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    gameManager.init();
  });
}