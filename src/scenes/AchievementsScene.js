import Phaser from 'phaser';
import { COLORS, ACHIEVEMENTS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class AchievementsScene extends Phaser.Scene {
  constructor() {
    super('achievements');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('achievements_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'achievements_bg').setOrigin(0);

    // Звёзды
    this.createStars();

    // Заголовок
    this.add.text(w / 2, 30, 'ДОСТИЖЕНИЯ', {
      fontSize: '32px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Счётчик достижений
    const unlockedCount = Object.keys(gameManager.data.achievements).length;
    const totalCount = Object.keys(ACHIEVEMENTS).length;
    
    this.add.text(w / 2, 70, `${unlockedCount}/${totalCount}`, {
      fontSize: '16px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5);

    // Контейнер для скролла
    const startY = 110;
    const spacing = 65;
    let currentY = startY;

    // Сортируем достижения: сначала неполученные, потом полученные
    const sortedAchievements = Object.entries(ACHIEVEMENTS).sort((a, b) => {
      const aUnlocked = gameManager.data.achievements[a[0]] !== undefined;
      const bUnlocked = gameManager.data.achievements[b[0]] !== undefined;
      if (aUnlocked && !bUnlocked) return 1;
      if (!aUnlocked && bUnlocked) return -1;
      return 0;
    });

    sortedAchievements.forEach(([key, ach]) => {
      const unlocked = gameManager.data.achievements[key] !== undefined;
      const color = unlocked ? COLORS.accent : COLORS.text_muted;
      const icon = unlocked ? ach.icon : '❓';

      // Карточка достижения
      const bg = this.add.rectangle(w / 2, currentY, w - 40, 55, 0x1a1a3a)
        .setStrokeStyle(2, color);

      // Иконка
      this.add.text(20, currentY - 10, icon, {
        fontSize: '24px'
      }).setOrigin(0, 0.5);

      // Название
      this.add.text(60, currentY - 10, ach.name, {
        fontSize: '14px',
        fontFamily: "'Orbitron', sans-serif",
        color: color
      }).setOrigin(0, 0.5);

      // Описание
      this.add.text(60, currentY + 10, ach.description || 'Выполните условие', {
        fontSize: '10px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);

      // Награда
      const rewardText = unlocked ? `+${ach.reward} 💎` : `${ach.reward} 💎`;
      this.add.text(w - 20, currentY, rewardText, {
        fontSize: '14px',
        fontFamily: "'Space Mono', monospace",
        color: unlocked ? COLORS.accent : COLORS.text_muted
      }).setOrigin(1, 0.5);

      // Дата получения
      if (unlocked) {
        const date = new Date(gameManager.data.achievements[key].unlockedAt);
        const dateStr = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
        this.add.text(w - 100, currentY + 12, dateStr, {
          fontSize: '8px',
          fontFamily: "'Space Mono', monospace",
          color: COLORS.text_secondary
        }).setOrigin(1, 0.5);
      }

      // Прогресс (для будущих достижений)
      if (!unlocked && ach.target) {
        const progress = gameManager.data.achievementsProgress?.[key] || 0;
        const percent = (progress / ach.target) * 100;
        
        const barWidth = 100;
        const barX = w - 150;
        const barY = currentY + 15;
        
        const progressBg = this.add.rectangle(barX, barY, barWidth, 4, 0x333333)
          .setOrigin(0, 0.5);
        
        const progressFill = this.add.rectangle(barX, barY, barWidth * (percent / 100), 4, COLORS.primary)
          .setOrigin(0, 0.5);
      }

      currentY += spacing;
    });

    // Статистика
    const statsY = h - 130;
    const statsBg = this.add.rectangle(w / 2, statsY, w - 40, 80, 0x1a1a3a, 0.8)
      .setStrokeStyle(2, COLORS.primary);

    this.add.text(w / 2, statsY - 25, 'СТАТИСТИКА', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary
    }).setOrigin(0.5);

    const stats = gameManager.data.stats;
    const statsText = [
      `Игр: ${stats.totalGames}`,
      `Рекорд: ${stats.maxScore}`,
      `Уровень: ${stats.maxLevel}`,
      `Вагоны: ${stats.maxWagons}`,
      `Комбо: ${stats.maxCombo || 0}`,
      `Монет: ${stats.totalCoinsCollected || 0}`
    ];

    let statsX = 40;
    statsText.forEach((text, index) => {
      const x = 40 + (index % 3) * 110;
      const y = statsY + (index < 3 ? -5 : 15);
      
      this.add.text(x, y, text, {
        fontSize: '10px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);
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