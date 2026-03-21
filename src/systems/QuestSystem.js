import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class QuestSystem {
  constructor() {
    this.quests = this.loadQuests();
    this.lastUpdate = Date.now();
    this.dailyResetTime = null;
    this.weeklyQuests = this.loadWeeklyQuests();
    this.eventQuests = this.loadEventQuests();
    this.completionAnimations = [];
  }

  // =========================================================================
  // ЗАГРУЗКА И СОХРАНЕНИЕ
  // =========================================================================
  loadQuests() {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem('skypulse_daily_quests');
    
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

  loadWeeklyQuests() {
    const weekStart = this.getWeekStart();
    const saved = localStorage.getItem('skypulse_weekly_quests');
    
    if (saved) {
      const data = JSON.parse(saved);
      if (data.weekStart === weekStart) {
        return data.quests;
      }
    }
    
    const quests = this.generateWeeklyQuests();
    this.saveWeeklyQuests(quests, weekStart);
    return quests;
  }

  loadEventQuests() {
    const currentEvent = this.getCurrentEvent();
    if (!currentEvent) return [];
    
    const saved = localStorage.getItem('skypulse_event_quests');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.eventId === currentEvent.id) {
        return data.quests;
      }
    }
    
    const quests = this.generateEventQuests(currentEvent);
    this.saveEventQuests(quests, currentEvent.id);
    return quests;
  }

  getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  }

  getCurrentEvent() {
    // Возвращает текущее событие или null
    const events = [
      { id: 'cyber_week', name: 'КИБЕР НЕДЕЛЯ', start: '2024-01-01', end: '2024-01-07', multiplier: 1.5 },
      { id: 'asteroid_storm', name: 'АСТЕРОИДНАЯ БУРЯ', start: '2024-01-08', end: '2024-01-14', multiplier: 1.3 }
    ];
    const today = new Date().toISOString().split('T')[0];
    return events.find(e => e.start <= today && e.end >= today);
  }

  saveQuests(quests, date) {
    localStorage.setItem('skypulse_daily_quests', JSON.stringify({ date, quests }));
  }

  saveWeeklyQuests(quests, weekStart) {
    localStorage.setItem('skypulse_weekly_quests', JSON.stringify({ weekStart, quests }));
  }

  saveEventQuests(quests, eventId) {
    localStorage.setItem('skypulse_event_quests', JSON.stringify({ eventId, quests }));
  }

  // =========================================================================
  // ГЕНЕРАЦИЯ КВЕСТОВ
  // =========================================================================
  generateDailyQuests() {
    const questTemplates = [
      // Базовые квесты
      { id: 'daily_coins_1', name: 'Собери монеты', target: 50, reward: 20, type: 'coins', icon: '🪙', difficulty: 'common', description: 'Собери 50 монет за день' },
      { id: 'daily_coins_2', name: 'Коллекционер', target: 100, reward: 35, type: 'coins', icon: '🪙', difficulty: 'common', description: 'Собери 100 монет за день' },
      { id: 'daily_coins_3', name: 'Богатство', target: 200, reward: 60, type: 'coins', icon: '💰', difficulty: 'rare', description: 'Собери 200 монет за день' },
      
      { id: 'daily_distance_1', name: 'Путешественник', target: 500, reward: 25, type: 'distance', icon: '📏', difficulty: 'common', description: 'Преодолей 500 метров' },
      { id: 'daily_distance_2', name: 'Марафонец', target: 1000, reward: 45, type: 'distance', icon: '🏃', difficulty: 'rare', description: 'Преодолей 1000 метров' },
      { id: 'daily_distance_3', name: 'Дальнобойщик', target: 2000, reward: 80, type: 'distance', icon: '🚀', difficulty: 'epic', description: 'Преодолей 2000 метров' },
      
      { id: 'daily_wagons_1', name: 'Сборщик', target: 5, reward: 30, type: 'wagons', icon: '🚃', difficulty: 'common', description: 'Собери 5 вагонов' },
      { id: 'daily_wagons_2', name: 'Состав', target: 10, reward: 55, type: 'wagons', icon: '🚂', difficulty: 'rare', description: 'Собери 10 вагонов' },
      { id: 'daily_wagons_3', name: 'Экспресс', target: 15, reward: 90, type: 'wagons', icon: '🚆', difficulty: 'epic', description: 'Собери 15 вагонов' },
      
      { id: 'daily_enemies_1', name: 'Охотник', target: 10, reward: 40, type: 'enemies', icon: '👾', difficulty: 'common', description: 'Уничтожь 10 врагов' },
      { id: 'daily_enemies_2', name: 'Истребитель', target: 25, reward: 75, type: 'enemies', icon: '⚔️', difficulty: 'rare', description: 'Уничтожь 25 врагов' },
      { id: 'daily_enemies_3', name: 'Легенда', target: 50, reward: 120, type: 'enemies', icon: '🏆', difficulty: 'epic', description: 'Уничтожь 50 врагов' },
      
      { id: 'daily_combo_1', name: 'Комбо', target: 5, reward: 30, type: 'combo', icon: '⚡', difficulty: 'common', description: 'Достигни комбо x5' },
      { id: 'daily_combo_2', name: 'Мастер комбо', target: 10, reward: 60, type: 'combo', icon: '🔥', difficulty: 'rare', description: 'Достигни комбо x10' },
      { id: 'daily_combo_3', name: 'Бесконечность', target: 20, reward: 100, type: 'combo', icon: '💫', difficulty: 'epic', description: 'Достигни комбо x20' },
      
      { id: 'daily_shield', name: 'Защитник', target: 3, reward: 25, type: 'shield', icon: '🛡️', difficulty: 'common', description: 'Активируй щит 3 раза' },
      { id: 'daily_magnet', name: 'Магнит', target: 3, reward: 25, type: 'magnet', icon: '🧲', difficulty: 'common', description: 'Активируй магнит 3 раза' },
      { id: 'daily_speed', name: 'Скорость', target: 3, reward: 25, type: 'speed', icon: '🚀', difficulty: 'common', description: 'Активируй ускорение 3 раза' },
      
      { id: 'daily_no_damage', name: 'Идеальный полёт', target: 1, reward: 50, type: 'no_damage', icon: '❤️', difficulty: 'rare', description: 'Пройди уровень без урона' },
      { id: 'daily_perfect_combo', name: 'Идеальное комбо', target: 1, reward: 75, type: 'perfect_combo', icon: '✨', difficulty: 'epic', description: 'Достигни комбо x15 без сброса' },
      
      // Квесты миров
      { id: 'daily_cyberpunk', name: 'Неоновый драйвер', target: 3, reward: 60, type: 'world_1', icon: '🌃', difficulty: 'rare', description: 'Пройди 3 уровня в Киберпанке' },
      { id: 'daily_dungeon', name: 'Исследователь тьмы', target: 3, reward: 70, type: 'world_2', icon: '🏰', difficulty: 'rare', description: 'Пройди 3 уровня в Подземелье' },
      { id: 'daily_asteroids', name: 'Астероидный рейнджер', target: 3, reward: 80, type: 'world_3', icon: '☄️', difficulty: 'epic', description: 'Пройди 3 уровня в Астероидах' },
      { id: 'daily_blackhole', name: 'Повелитель бездны', target: 2, reward: 100, type: 'world_4', icon: '⚫', difficulty: 'epic', description: 'Пройди 2 уровня в Чёрной дыре' }
    ];

    // Выбираем 5 случайных квестов с учётом сложности
    const shuffled = [...questTemplates].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5).map(quest => ({
      ...quest,
      progress: 0,
      completed: false,
      claimed: false,
      startTime: Date.now()
    }));

    return selected;
  }

  generateWeeklyQuests() {
    const questTemplates = [
      { id: 'weekly_score', name: 'Мастер счёта', target: 10000, reward: 200, type: 'score', icon: '🏆', description: 'Набери 10000 очков за неделю' },
      { id: 'weekly_distance', name: 'Марафонец', target: 50000, reward: 300, type: 'distance', icon: '📏', description: 'Пролети 50 км за неделю' },
      { id: 'weekly_wagons', name: 'Составитель', target: 50, reward: 250, type: 'wagons_collected', icon: '🚃', description: 'Собери 50 вагонов за неделю' },
      { id: 'weekly_enemies', name: 'Истребитель', target: 100, reward: 400, type: 'enemies', icon: '👾', description: 'Уничтожь 100 врагов за неделю' },
      { id: 'weekly_combo', name: 'Комбо-мастер', target: 50, reward: 350, type: 'combo_total', icon: '⚡', description: 'Сделай 50 комбо за неделю' },
      { id: 'weekly_perfect', name: 'Идеалист', target: 5, reward: 500, type: 'perfect_runs', icon: '✨', description: 'Пройди 5 уровней без урона' }
    ];
    
    return questTemplates.map(quest => ({
      ...quest,
      progress: 0,
      completed: false,
      claimed: false
    }));
  }

  generateEventQuests(event) {
    const questTemplates = [
      { id: 'event_play', name: `Участие в ${event.name}`, target: 10, reward: 150, type: 'games', icon: '🎮', description: 'Сыграй 10 игр во время события' },
      { id: 'event_score', name: 'Событийный рекорд', target: 5000, reward: 200, type: 'score', icon: '🏆', description: `Набери 5000 очков в ${event.name}` },
      { id: 'event_special', name: 'Особое задание', target: 5, reward: 100, type: 'special', icon: '⭐', description: 'Выполни специальные задания события' }
    ];
    
    return questTemplates.map(quest => ({
      ...quest,
      progress: 0,
      completed: false,
      claimed: false,
      eventId: event.id
    }));
  }

  // =========================================================================
  // ОБНОВЛЕНИЕ ПРОГРЕССА
  // =========================================================================
  updateProgress(type, amount = 1, extra = null) {
    let updated = false;
    
    // Обновляем дневные квесты
    this.quests.forEach(quest => {
      if (!quest.completed && this.matchQuestType(quest, type, extra)) {
        quest.progress = Math.min(quest.target, quest.progress + amount);
        if (quest.progress >= quest.target) {
          quest.completed = true;
          quest.completedAt = Date.now();
          this.showQuestComplete(quest);
        }
        updated = true;
      }
    });
    
    // Обновляем недельные квесты
    this.weeklyQuests.forEach(quest => {
      if (!quest.completed && this.matchQuestType(quest, type, extra)) {
        quest.progress = Math.min(quest.target, quest.progress + amount);
        if (quest.progress >= quest.target) {
          quest.completed = true;
          quest.completedAt = Date.now();
          this.showQuestComplete(quest, true);
        }
        updated = true;
      }
    });
    
    // Обновляем ивентовые квесты
    this.eventQuests.forEach(quest => {
      if (!quest.completed && this.matchQuestType(quest, type, extra)) {
        quest.progress = Math.min(quest.target, quest.progress + amount);
        if (quest.progress >= quest.target) {
          quest.completed = true;
          quest.completedAt = Date.now();
          this.showQuestComplete(quest, false, true);
        }
        updated = true;
      }
    });
    
    if (updated) {
      this.saveAllQuests();
    }
  }

  matchQuestType(quest, type, extra) {
    if (quest.type === type) return true;
    
    // Специальные соответствия
    if (quest.type === 'wagons_collected' && type === 'wagons') return true;
    if (quest.type === 'combo_total' && type === 'combo') return true;
    if (quest.type === 'perfect_runs' && type === 'no_damage') return true;
    if (quest.type === 'games' && type === 'game_start') return true;
    if (quest.type === 'special' && extra?.event === true) return true;
    
    return false;
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================
  showQuestComplete(quest, isWeekly = false, isEvent = false) {
    if (!this.scene) return;
    
    const w = this.scene.scale.width;
    const typeColor = isWeekly ? '#ffaa44' : (isEvent ? '#ff44ff' : '#00ff00');
    const typeIcon = isWeekly ? '📅' : (isEvent ? '🎪' : '⭐');
    
    const container = this.scene.add.container(w / 2, -100);
    container.setDepth(100).setScrollFactor(0);
    
    const bg = this.scene.add.rectangle(0, 0, 320, 90, 0x0a0a1a, 0.98);
    bg.setStrokeStyle(3, typeColor, 0.9);
    
    const icon = this.scene.add.text(-130, -20, quest.icon || typeIcon, {
      fontSize: '36px'
    }).setOrigin(0.5);
    
    const title = this.scene.add.text(0, -25, `${typeIcon} КВЕСТ ВЫПОЛНЕН!`, {
      fontSize: '14px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: typeColor
    }).setOrigin(0.5);
    
    const name = this.scene.add.text(0, -2, quest.name, {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffffff'
    }).setOrigin(0.5);
    
    const reward = this.scene.add.text(0, 22, `+${quest.reward} 💎`, {
      fontSize: '14px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffaa00'
    }).setOrigin(0.5);
    
    container.add([bg, icon, title, name, reward]);
    
    // Анимация появления
    this.scene.tweens.add({
      targets: container,
      y: 90,
      duration: 400,
      ease: 'Back.out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: container,
          alpha: 0,
          y: 70,
          duration: 500,
          delay: 2000,
          onComplete: () => container.destroy()
        });
      }
    });
    
    // Звук
    try {
      audioManager.playSound(this.scene, 'level_up_sound', 0.5);
    } catch (e) {}
    
    // Частицы
    this.createQuestCompleteParticles();
  }

  createQuestCompleteParticles() {
    if (!this.scene) return;
    
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.circle(
        w / 2 + Phaser.Math.Between(-100, 100),
        h / 2 - 50 + Phaser.Math.Between(-30, 30),
        Phaser.Math.Between(2, 5),
        0xffaa00,
        0.7
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.scene.tweens.add({
        targets: particle,
        y: particle.y - Phaser.Math.Between(50, 120),
        alpha: 0,
        scale: 0,
        duration: 800,
        onComplete: () => particle.destroy()
      });
    }
  }

  // =========================================================================
  // ПОЛУЧЕНИЕ НАГРАД
  // =========================================================================
  claimReward(questId, isWeekly = false, isEvent = false) {
    const quests = isWeekly ? this.weeklyQuests : (isEvent ? this.eventQuests : this.quests);
    const quest = quests.find(q => q.id === questId);
    
    if (quest && quest.completed && !quest.claimed) {
      quest.claimed = true;
      let reward = quest.reward;
      
      // Применяем множитель от события
      const event = this.getCurrentEvent();
      if (event && !isWeekly && !isEvent) {
        reward = Math.floor(reward * event.multiplier);
      }
      
      gameManager.addCrystals(reward, 'quest');
      this.saveAllQuests();
      
      if (this.scene && this.scene.showNotification) {
        this.scene.showNotification(`+${reward} 💎`, 1500, '#ffaa00');
      }
      
      // Эффект получения
      this.createClaimEffect();
      
      return reward;
    }
    return 0;
  }

  claimAllRewards() {
    let total = 0;
    
    // Дневные
    this.quests.forEach(quest => {
      if (quest.completed && !quest.claimed) {
        quest.claimed = true;
        total += quest.reward;
      }
    });
    
    // Недельные
    this.weeklyQuests.forEach(quest => {
      if (quest.completed && !quest.claimed) {
        quest.claimed = true;
        total += quest.reward;
      }
    });
    
    // Ивентовые
    this.eventQuests.forEach(quest => {
      if (quest.completed && !quest.claimed) {
        quest.claimed = true;
        total += quest.reward;
      }
    });
    
    if (total > 0) {
      gameManager.addCrystals(total, 'quest');
      this.saveAllQuests();
      this.createClaimEffect(true);
    }
    
    return total;
  }

  createClaimEffect(massive = false) {
    if (!this.scene) return;
    
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const count = massive ? 40 : 20;
    
    for (let i = 0; i < count; i++) {
      const particle = this.scene.add.circle(
        w / 2 + Phaser.Math.Between(-150, 150),
        h / 2 + Phaser.Math.Between(-80, 80),
        Phaser.Math.Between(2, 6),
        0xffaa00,
        0.8
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.scene.tweens.add({
        targets: particle,
        y: particle.y - Phaser.Math.Between(50, 150),
        x: particle.x + Phaser.Math.Between(-50, 50),
        alpha: 0,
        scale: 0,
        duration: 800,
        onComplete: () => particle.destroy()
      });
    }
  }

  // =========================================================================
  // СОХРАНЕНИЕ
  // =========================================================================
  saveAllQuests() {
    const today = new Date().toISOString().split('T')[0];
    this.saveQuests(this.quests, today);
    this.saveWeeklyQuests(this.weeklyQuests, this.getWeekStart());
    
    const event = this.getCurrentEvent();
    if (event) {
      this.saveEventQuests(this.eventQuests, event.id);
    }
  }

  // =========================================================================
  // ГЕТТЕРЫ
  // =========================================================================
  getProgress(questId, isWeekly = false, isEvent = false) {
    const quests = isWeekly ? this.weeklyQuests : (isEvent ? this.eventQuests : this.quests);
    const quest = quests.find(q => q.id === questId);
    return quest ? quest.progress : 0;
  }

  isCompleted(questId, isWeekly = false, isEvent = false) {
    const quests = isWeekly ? this.weeklyQuests : (isEvent ? this.eventQuests : this.quests);
    const quest = quests.find(q => q.id === questId);
    return quest ? quest.completed : false;
  }

  isClaimed(questId, isWeekly = false, isEvent = false) {
    const quests = isWeekly ? this.weeklyQuests : (isEvent ? this.eventQuests : this.quests);
    const quest = quests.find(q => q.id === questId);
    return quest ? quest.claimed : false;
  }

  getActiveQuests() {
    return {
      daily: this.quests.filter(q => !q.claimed && !q.completed),
      weekly: this.weeklyQuests.filter(q => !q.claimed && !q.completed),
      event: this.eventQuests.filter(q => !q.claimed && !q.completed)
    };
  }

  getCompletedQuests() {
    return {
      daily: this.quests.filter(q => q.completed && !q.claimed),
      weekly: this.weeklyQuests.filter(q => q.completed && !q.claimed),
      event: this.eventQuests.filter(q => q.completed && !q.claimed)
    };
  }

  getTotalRewards() {
    let total = 0;
    this.quests.forEach(q => { if (q.completed && !q.claimed) total += q.reward; });
    this.weeklyQuests.forEach(q => { if (q.completed && !q.claimed) total += q.reward; });
    this.eventQuests.forEach(q => { if (q.completed && !q.claimed) total += q.reward; });
    return total;
  }

  getQuestStats() {
    return {
      dailyCompleted: this.quests.filter(q => q.completed).length,
      dailyTotal: this.quests.length,
      weeklyCompleted: this.weeklyQuests.filter(q => q.completed).length,
      weeklyTotal: this.weeklyQuests.length,
      eventCompleted: this.eventQuests.filter(q => q.completed).length,
      eventTotal: this.eventQuests.length
    };
  }

  // =========================================================================
  // СБРОС
  // =========================================================================
  resetDaily() {
    this.quests = this.generateDailyQuests();
    this.saveQuests(this.quests, new Date().toISOString().split('T')[0]);
  }

  resetWeekly() {
    this.weeklyQuests = this.generateWeeklyQuests();
    this.saveWeeklyQuests(this.weeklyQuests, this.getWeekStart());
  }

  resetEvent() {
    const event = this.getCurrentEvent();
    if (event) {
      this.eventQuests = this.generateEventQuests(event);
      this.saveEventQuests(this.eventQuests, event.id);
    }
  }

  // =========================================================================
  // ПРОВЕРКА СБРОСА
  // =========================================================================
  checkReset() {
    const today = new Date().toISOString().split('T')[0];
    const savedDaily = localStorage.getItem('skypulse_daily_quests');
    
    if (savedDaily) {
      const data = JSON.parse(savedDaily);
      if (data.date !== today) {
        this.resetDaily();
      }
    }
    
    const weekStart = this.getWeekStart();
    const savedWeekly = localStorage.getItem('skypulse_weekly_quests');
    
    if (savedWeekly) {
      const data = JSON.parse(savedWeekly);
      if (data.weekStart !== weekStart) {
        this.resetWeekly();
      }
    }
    
    const event = this.getCurrentEvent();
    if (event) {
      const savedEvent = localStorage.getItem('skypulse_event_quests');
      if (savedEvent) {
        const data = JSON.parse(savedEvent);
        if (data.eventId !== event.id) {
          this.resetEvent();
        }
      } else {
        this.resetEvent();
      }
    }
  }

  setScene(scene) {
    this.scene = scene;
    this.checkReset();
  }

  // =========================================================================
  // ОЧИСТКА
  // =========================================================================
  destroy() {
    this.completionAnimations.forEach(anim => {
      if (anim && anim.stop) anim.stop();
    });
    this.completionAnimations = [];
  }
}