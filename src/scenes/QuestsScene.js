import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

class QuestSystem {
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
    
    const quests = this.generateDailyQuests();
    this.saveQuests(quests, today);
    return quests;
  }

  generateDailyQuests() {
    const questTemplates = [
      { id: 'daily_coins_1', name: 'Собери 50 монет', target: 50, reward: 20, type: 'coins', icon: '🪙', description: 'Собери 50 монет за день' },
      { id: 'daily_coins_2', name: 'Собери 100 монет', target: 100, reward: 35, type: 'coins', icon: '🪙', description: 'Собери 100 монет за день' },
      { id: 'daily_distance_1', name: 'Пролети 500 м', target: 500, reward: 25, type: 'distance', icon: '📏', description: 'Преодолей 500 метров' },
      { id: 'daily_distance_2', name: 'Пролети 1000 м', target: 1000, reward: 45, type: 'distance', icon: '📏', description: 'Преодолей 1000 метров' },
      { id: 'daily_wagons_1', name: 'Собери 5 вагонов', target: 5, reward: 30, type: 'wagons', icon: '🚃', description: 'Собери 5 вагонов за день' },
      { id: 'daily_enemies_1', name: 'Уничтожь 10 врагов', target: 10, reward: 40, type: 'enemies', icon: '👾', description: 'Уничтожь 10 врагов' },
      { id: 'daily_combo_1', name: 'Комбо x5', target: 5, reward: 30, type: 'combo', icon: '⚡', description: 'Достигни комбо x5' },
      { id: 'daily_shield_1', name: 'Щит 3 раза', target: 3, reward: 25, type: 'shield', icon: '🛡️', description: 'Активируй щит 3 раза' },
      { id: 'daily_magnet_1', name: 'Магнит 3 раза', target: 3, reward: 25, type: 'magnet', icon: '🧲', description: 'Активируй магнит 3 раза' },
      { id: 'daily_speed_1', name: 'Ускорение 3 раза', target: 3, reward: 25, type: 'speed', icon: '🚀', description: 'Активируй ускорение 3 раза' }
    ];

    // Выбираем 4 случайных квеста
    const shuffled = [...questTemplates].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4).map(quest => ({
      ...quest,
      progress: 0,
      completed: false,
      claimed: false
    }));
  }

  saveQuests(quests, date) {
    localStorage.setItem('skypulse_quests', JSON.stringify({ date, quests }));
  }

  claimReward(questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (quest && quest.completed && !quest.claimed) {
      quest.claimed = true;
      gameManager.addCrystals(quest.reward);
      this.saveQuests(this.quests, new Date().toISOString().split('T')[0]);
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
      this.saveQuests(this.quests, new Date().toISOString().split('T')[0]);
    }
    return total;
  }
}

export class QuestsScene extends Phaser.Scene {
  constructor() {
    super('quests');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('quests_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'quests_bg').setOrigin(0);

    // Звёзды
    this.createStars();

    // Заголовок
    this.add.text(w / 2, 30, 'ЕЖЕДНЕВНЫЕ КВЕСТЫ', {
      fontSize: '28px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Информация о сбросе
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const hoursLeft = Math.floor((tomorrow - new Date()) / (1000 * 60 * 60));
    
    this.add.text(w / 2, 70, `Сброс через: ${hoursLeft} ч`, {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_secondary
    }).setOrigin(0.5);

    const questSystem = new QuestSystem();
    let y = 120;
    const spacing = 90;

    questSystem.quests.forEach(quest => {
      const isCompleted = quest.progress >= quest.target;
      const isClaimed = quest.claimed;
      const progressPercent = (quest.progress / quest.target) * 100;

      // Определяем цвет
      let color = COLORS.text_muted;
      if (isClaimed) color = COLORS.text_muted;
      else if (isCompleted) color = COLORS.success;
      else color = COLORS.text_primary;

      // Карточка квеста
      const bg = this.add.rectangle(w / 2, y, w - 40, 75, 0x1a1a3a)
        .setStrokeStyle(2, color);

      // Иконка
      this.add.text(20, y - 20, quest.icon, {
        fontSize: '30px'
      }).setOrigin(0, 0.5);

      // Название
      this.add.text(60, y - 20, quest.name, {
        fontSize: '16px',
        fontFamily: "'Orbitron', sans-serif",
        color: color
      }).setOrigin(0, 0.5);

      // Описание
      this.add.text(60, y + 5, quest.description, {
        fontSize: '11px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);

      // Прогресс-бар
      const barWidth = 150;
      const barX = w - 180;
      const barY = y - 10;
      
      const progressBg = this.add.rectangle(barX, barY, barWidth, 8, 0x333333)
        .setOrigin(0, 0.5);
      
      const progressFill = this.add.rectangle(barX, barY, barWidth * (progressPercent / 100), 8, color)
        .setOrigin(0, 0.5);

      // Текст прогресса
      this.add.text(barX, y + 15, `${quest.progress}/${quest.target}`, {
        fontSize: '12px',
        fontFamily: "'Space Mono', monospace",
        color: color
      }).setOrigin(0, 0.5);

      // Награда
      this.add.text(w - 30, y - 10, `${quest.reward} 💎`, {
        fontSize: '14px',
        fontFamily: "'Space Mono', monospace",
        color: isClaimed ? COLORS.text_muted : COLORS.accent
      }).setOrigin(1, 0.5);

      // Кнопка получения награды
      if (isCompleted && !isClaimed) {
        const claimBtn = this.add.text(w - 30, y + 15, 'ПОЛУЧИТЬ', {
          fontSize: '10px',
          fontFamily: "'Orbitron', sans-serif",
          color: '#00ff00',
          backgroundColor: '#1a1a3a',
          padding: { x: 8, y: 3 }
        }).setInteractive().setOrigin(0.5, 0.5);

        claimBtn.on('pointerover', () => {
          claimBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' });
        });

        claimBtn.on('pointerout', () => {
          claimBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a1a3a' });
        });

        claimBtn.on('pointerdown', () => {
          if (questSystem.claimReward(quest.id)) {
            try { audioManager.playSound(this, 'purchase_sound', 0.5); } catch (e) {}
            this.scene.restart();
          }
        });
      } else if (isClaimed) {
        this.add.text(w - 30, y + 15, 'ВЫПОЛНЕНО', {
          fontSize: '10px',
          fontFamily: "'Orbitron', sans-serif",
          color: COLORS.text_muted
        }).setOrigin(0.5, 0.5);
      }

      y += spacing;
    });

    // Кнопка "Забрать все"
    const claimAllBtn = this.add.text(w / 2, h - 90, 'ЗАБРАТЬ ВСЕ', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.accent,
      backgroundColor: '#1a1a3a',
      padding: { x: 30, y: 8 },
      stroke: COLORS.accent,
      strokeThickness: 2
    }).setInteractive().setOrigin(0.5);

    claimAllBtn.on('pointerover', () => {
      claimAllBtn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.accent });
      claimAllBtn.setScale(1.05);
    });

    claimAllBtn.on('pointerout', () => {
      claimAllBtn.setStyle({ color: COLORS.accent, backgroundColor: '#1a1a3a' });
      claimAllBtn.setScale(1);
    });

    claimAllBtn.on('pointerdown', () => {
      const total = questSystem.claimAllRewards();
      if (total > 0) {
        this.showNotification(`+${total} 💎`, 1500, COLORS.accent);
        this.scene.restart();
      }
    });

    // Кнопка назад
    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('menu'));
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < 100; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setScale(Phaser.Math.FloatBetween(0.2, 1.0));
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
      star.setDepth(-5);
    }
  }

  showNotification(text, duration, color) {
    const w = this.scale.width;
    
    const notification = this.add.text(w / 2, 100, text, {
      fontSize: '20px',
      fontFamily: "'Orbitron', sans-serif",
      color: color
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: duration,
      ease: 'Power2.easeOut',
      onComplete: () => notification.destroy()
    });
  }

  createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      backgroundColor: '#1a1a3a',
      padding: { x: 30, y: 10 },
      stroke: COLORS.primary,
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerover', () => {
      btn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary });
      btn.setScale(1.05);
    });

    btn.on('pointerout', () => {
      btn.setStyle({ color: COLORS.primary, backgroundColor: '#1a1a3a' });
      btn.setScale(1);
    });

    btn.on('pointerdown', callback);
    return btn;
  }
}