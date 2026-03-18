import { gameManager } from '../managers/GameManager';

export class QuestSystem {
  constructor() {
    this.quests = this.loadQuests();
    this.lastUpdate = Date.now();
  }

  loadQuests() {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem('skypulse_quests');
    
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === today) {
        return data.quests;
      }
    }
    
    const quests = this.generateDailyQuests();
    this.saveQuests(quests, today);
    return quests;
  }

  generateDailyQuests() {
    const questTemplates = [
      { id: 'daily_coins_1', name: 'Собери 50 монет', target: 50, reward: 20, type: 'coins', icon: '🪙' },
      { id: 'daily_coins_2', name: 'Собери 100 монет', target: 100, reward: 35, type: 'coins', icon: '🪙' },
      { id: 'daily_coins_3', name: 'Собери 200 монет', target: 200, reward: 60, type: 'coins', icon: '🪙' },
      { id: 'daily_distance_1', name: 'Пролети 500 метров', target: 500, reward: 25, type: 'distance', icon: '📏' },
      { id: 'daily_distance_2', name: 'Пролети 1000 метров', target: 1000, reward: 45, type: 'distance', icon: '📏' },
      { id: 'daily_distance_3', name: 'Пролети 2000 метров', target: 2000, reward: 80, type: 'distance', icon: '📏' },
      { id: 'daily_wagons_1', name: 'Собери 5 вагонов', target: 5, reward: 30, type: 'wagons', icon: '🚃' },
      { id: 'daily_wagons_2', name: 'Собери 10 вагонов', target: 10, reward: 55, type: 'wagons', icon: '🚃' },
      { id: 'daily_enemies_1', name: 'Уничтожь 10 врагов', target: 10, reward: 40, type: 'enemies', icon: '👾' },
      { id: 'daily_enemies_2', name: 'Уничтожь 25 врагов', target: 25, reward: 75, type: 'enemies', icon: '👾' },
      { id: 'daily_combo_1', name: 'Достигни комбо x5', target: 5, reward: 30, type: 'combo', icon: '⚡' },
      { id: 'daily_combo_2', name: 'Достигни комбо x10', target: 10, reward: 60, type: 'combo', icon: '⚡' },
      { id: 'daily_shield_1', name: 'Активируй щит 3 раза', target: 3, reward: 25, type: 'shield', icon: '🛡️' },
      { id: 'daily_magnet_1', name: 'Активируй магнит 3 раза', target: 3, reward: 25, type: 'magnet', icon: '🧲' },
      { id: 'daily_speed_1', name: 'Активируй ускорение 3 раза', target: 3, reward: 25, type: 'speed', icon: '🚀' },
      { id: 'daily_no_damage', name: 'Пройди уровень без урона', target: 1, reward: 50, type: 'no_damage', icon: '❤️' },
    ];

    // Выбираем 5 случайных квестов на день
    const shuffled = [...questTemplates].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5).map(quest => ({
      ...quest,
      progress: 0,
      completed: false,
      claimed: false,
    }));

    return selected;
  }

  saveQuests(quests, date = null) {
    const today = date || new Date().toISOString().split('T')[0];
    localStorage.setItem('skypulse_quests', JSON.stringify({ date: today, quests }));
  }

  updateProgress(type, amount) {
    let updated = false;
    
    this.quests.forEach(quest => {
      if (!quest.completed && quest.type === type) {
        quest.progress = Math.min(quest.target, quest.progress + amount);
        if (quest.progress >= quest.target) {
          quest.completed = true;
          this.showQuestComplete(quest);
        }
        updated = true;
      }
    });
    
    if (updated) {
      this.saveQuests(this.quests);
    }
  }

  showQuestComplete(quest) {
    if (!this.scene) return;
    
    const w = this.scene.scale.width;
    const notification = this.scene.add.container(w / 2, -80).setDepth(100).setScrollFactor(0);
    
    const bg = this.scene.add.rectangle(0, 0, 280, 70, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, 0x00ffff, 0.8);
    
    const title = this.scene.add.text(0, -15, `${quest.icon} Квест выполнен!`, {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#00ff00'
    }).setOrigin(0.5);
    
    const desc = this.scene.add.text(0, 10, quest.name, {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: '#ffffff'
    }).setOrigin(0.5);
    
    const reward = this.scene.add.text(0, 25, `+${quest.reward} 💎`, {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: '#ffaa00'
    }).setOrigin(0.5);
    
    notification.add([bg, title, desc, reward]);
    
    this.scene.tweens.add({
      targets: notification,
      y: 80,
      duration: 2000,
      ease: 'Back.out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: notification,
          alpha: 0,
          duration: 500,
          delay: 2000,
          onComplete: () => notification.destroy()
        });
      }
    });
  }

  claimReward(questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (quest && quest.completed && !quest.claimed) {
      quest.claimed = true;
      gameManager.addCrystals(quest.reward);
      this.saveQuests(this.quests);
      
      if (this.scene && this.scene.showNotification) {
        this.scene.showNotification(`+${quest.reward} 💎`, 1500, '#ffaa00');
      }
      
      return quest.reward;
    }
    return 0;
  }

  claimAllRewards() {
    let total = 0;
    this.quests.forEach(quest => {
      if (quest.completed && !quest.claimed) {
        quest.claimed = true;
        total += quest.reward;
      }
    });
    
    if (total > 0) {
      gameManager.addCrystals(total);
      this.saveQuests(this.quests);
    }
    
    return total;
  }

  getProgress(questId) {
    const quest = this.quests.find(q => q.id === questId);
    return quest ? quest.progress : 0;
  }

  isCompleted(questId) {
    const quest = this.quests.find(q => q.id === questId);
    return quest ? quest.completed : false;
  }

  isClaimed(questId) {
    const quest = this.quests.find(q => q.id === questId);
    return quest ? quest.claimed : false;
  }

  getActiveQuests() {
    return this.quests.filter(q => !q.claimed);
  }

  getCompletedQuests() {
    return this.quests.filter(q => q.completed && !q.claimed);
  }

  resetDaily() {
    this.quests = this.generateDailyQuests();
    this.saveQuests(this.quests);
  }

  setScene(scene) {
    this.scene = scene;
  }
}