import { gameManager } from '../managers/GameManager';

export class QuestSystem {
  constructor() {
    this.quests = this.loadQuests();
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
    const quests = [
      { id: 'daily_1', name: 'Пройти 5 уровней', target: 5, progress: 0, reward: 20, type: 'level' },
      { id: 'daily_2', name: 'Собрать 100 кристаллов', target: 100, progress: 0, reward: 30, type: 'crystals' },
      { id: 'daily_3', name: 'Получить 3 щита', target: 3, progress: 0, reward: 25, type: 'shield' },
    ];
    localStorage.setItem('skypulse_quests', JSON.stringify({ date: today, quests }));
    return quests;
  }

  updateProgress(type, amount) {
    let updated = false;
    this.quests.forEach(q => {
      if (q.type === type && q.progress < q.target) {
        q.progress = Math.min(q.target, q.progress + amount);
        updated = true;
      }
    });
    if (updated) this.saveQuests();
  }

  saveQuests() {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('skypulse_quests', JSON.stringify({ date: today, quests: this.quests }));
  }

  claimReward(questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (quest && quest.progress >= quest.target) {
      gameManager.addCrystals(quest.reward);
      quest.progress = -1;
      this.saveQuests();
      return true;
    }
    return false;
  }

  isCompleted(questId) {
    const quest = this.quests.find(q => q.id === questId);
    return quest && quest.progress >= quest.target;
  }

  isClaimed(questId) {
    const quest = this.quests.find(q => q.id === questId);
    return quest && quest.progress === -1;
  }
}