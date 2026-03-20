import Phaser from 'phaser';
import { COLORS, WORLD_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

class QuestSystem {
  constructor(scene) {
    this.scene = scene;
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
      // Базовые квесты
      { id: 'daily_coins_1', name: 'Собери монеты', target: 50, reward: 20, type: 'coins', icon: '🪙', description: 'Собери 50 монет за день', difficulty: 'common' },
      { id: 'daily_coins_2', name: 'Коллекционер', target: 100, reward: 35, type: 'coins', icon: '🪙', description: 'Собери 100 монет за день', difficulty: 'common' },
      { id: 'daily_coins_3', name: 'Богатство', target: 200, reward: 60, type: 'coins', icon: '💰', description: 'Собери 200 монет за день', difficulty: 'rare' },
      
      { id: 'daily_distance_1', name: 'Путешественник', target: 500, reward: 25, type: 'distance', icon: '📏', description: 'Преодолей 500 метров', difficulty: 'common' },
      { id: 'daily_distance_2', name: 'Марафонец', target: 1000, reward: 45, type: 'distance', icon: '🏃', description: 'Преодолей 1000 метров', difficulty: 'rare' },
      { id: 'daily_distance_3', name: 'Дальнобойщик', target: 2000, reward: 80, type: 'distance', icon: '🚀', description: 'Преодолей 2000 метров', difficulty: 'epic' },
      
      { id: 'daily_wagons_1', name: 'Сборщик', target: 5, reward: 30, type: 'wagons', icon: '🚃', description: 'Собери 5 вагонов', difficulty: 'common' },
      { id: 'daily_wagons_2', name: 'Состав', target: 10, reward: 55, type: 'wagons', icon: '🚂', description: 'Собери 10 вагонов', difficulty: 'rare' },
      { id: 'daily_wagons_3', name: 'Экспресс', target: 15, reward: 90, type: 'wagons', icon: '🚆', description: 'Собери 15 вагонов', difficulty: 'epic' },
      
      { id: 'daily_enemies_1', name: 'Охотник', target: 10, reward: 40, type: 'enemies', icon: '👾', description: 'Уничтожь 10 врагов', difficulty: 'common' },
      { id: 'daily_enemies_2', name: 'Истребитель', target: 25, reward: 75, type: 'enemies', icon: '⚔️', description: 'Уничтожь 25 врагов', difficulty: 'rare' },
      { id: 'daily_enemies_3', name: 'Легенда', target: 50, reward: 120, type: 'enemies', icon: '🏆', description: 'Уничтожь 50 врагов', difficulty: 'epic' },
      
      { id: 'daily_combo_1', name: 'Комбо', target: 5, reward: 30, type: 'combo', icon: '⚡', description: 'Достигни комбо x5', difficulty: 'common' },
      { id: 'daily_combo_2', name: 'Мастер комбо', target: 10, reward: 60, type: 'combo', icon: '🔥', description: 'Достигни комбо x10', difficulty: 'rare' },
      { id: 'daily_combo_3', name: 'Бесконечность', target: 20, reward: 100, type: 'combo', icon: '💫', description: 'Достигни комбо x20', difficulty: 'epic' },
      
      { id: 'daily_shield_1', name: 'Защитник', target: 3, reward: 25, type: 'shield', icon: '🛡️', description: 'Активируй щит 3 раза', difficulty: 'common' },
      { id: 'daily_magnet_1', name: 'Магнит', target: 3, reward: 25, type: 'magnet', icon: '🧲', description: 'Активируй магнит 3 раза', difficulty: 'common' },
      { id: 'daily_speed_1', name: 'Скорость', target: 3, reward: 25, type: 'speed', icon: '🚀', description: 'Активируй ускорение 3 раза', difficulty: 'common' },
      
      { id: 'daily_no_damage', name: 'Идеальный полёт', target: 1, reward: 50, type: 'no_damage', icon: '❤️', description: 'Пройди уровень без урона', difficulty: 'rare' },
      { id: 'daily_perfect_combo', name: 'Идеальное комбо', target: 1, reward: 75, type: 'perfect_combo', icon: '✨', description: 'Достигни комбо x15 без сброса', difficulty: 'epic' },
      
      // Квесты миров
      { id: 'daily_cyberpunk', name: 'Неоновый драйвер', target: 3, reward: 60, type: 'world_1', icon: '🌃', description: 'Пройди 3 уровня в Киберпанке', difficulty: 'rare' },
      { id: 'daily_dungeon', name: 'Исследователь тьмы', target: 3, reward: 70, type: 'world_2', icon: '🏰', description: 'Пройди 3 уровня в Подземелье', difficulty: 'rare' },
      { id: 'daily_asteroids', name: 'Астероидный рейнджер', target: 3, reward: 80, type: 'world_3', icon: '☄️', description: 'Пройди 3 уровня в Астероидах', difficulty: 'epic' },
      { id: 'daily_blackhole', name: 'Повелитель бездны', target: 2, reward: 100, type: 'world_4', icon: '⚫', description: 'Пройди 2 уровня в Чёрной дыре', difficulty: 'epic' }
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

  saveQuests(quests, date) {
    localStorage.setItem('skypulse_quests', JSON.stringify({ date, quests }));
  }

  updateProgress(type, amount = 1) {
    let updated = false;
    
    this.quests.forEach(quest => {
      if (!quest.completed && quest.type === type) {
        quest.progress = Math.min(quest.target, quest.progress + amount);
        if (quest.progress >= quest.target) {
          quest.completed = true;
          quest.completedAt = Date.now();
          if (this.scene) {
            this.scene.showQuestComplete(quest);
          }
        }
        updated = true;
      }
    });
    
    if (updated) {
      this.saveQuests(this.quests, new Date().toISOString().split('T')[0]);
    }
  }

  claimReward(questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (quest && quest.completed && !quest.claimed) {
      quest.claimed = true;
      gameManager.addCrystals(quest.reward, 'quest');
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
      gameManager.addCrystals(total, 'quest');
      this.saveQuests(this.quests, new Date().toISOString().split('T')[0]);
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
    return this.quests.filter(q => !q.completed);
  }

  getCompletedQuests() {
    return this.quests.filter(q => q.completed && !q.claimed);
  }

  getTotalRewards() {
    return this.quests.reduce((total, q) => total + (q.completed && !q.claimed ? q.reward : 0), 0);
  }

  resetDaily() {
    this.quests = this.generateDailyQuests();
    this.saveQuests(this.quests, new Date().toISOString().split('T')[0]);
  }

  setScene(scene) {
    this.scene = scene;
  }
}

export class QuestsScene extends Phaser.Scene {
  constructor() {
    super('quests');
    this.questCards = [];
    this.stars = [];
    this.particles = [];
    this.scrollOffset = 0;
    this.isDragging = false;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Создаём систему квестов
    this.questSystem = new QuestSystem(this);
    this.questSystem.setScene(this);

    // Создаём эпический фон
    this.createBackground();

    // Создаём звёзды с мерцанием
    this.createStars();

    // Создаём плавающие частицы
    this.createParticles();

    // Заголовок с анимацией
    this.createHeader();

    // Информация о сбросе
    this.createTimerDisplay();

    // Контейнер для квестов с прокруткой
    this.createQuestList();

    // Кнопка "Забрать все"
    this.createClaimAllButton();

    // Кнопка назад
    this.createBackButton();

    // Обработка скролла
    this.setupScrolling();

    // Обработка ресайза
    this.scale.on('resize', this.onResize, this);
  }

  // =========================================================================
  // СОЗДАНИЕ ФОНА
  // =========================================================================

  createBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Градиентный фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('quests_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'quests_bg').setOrigin(0);

    // Неоновые линии
    const glowLines = this.add.graphics();
    glowLines.lineStyle(2, COLORS.primary, 0.2);
    glowLines.strokeRect(10, 10, w - 20, h - 20);
    
    this.tweens.add({
      targets: glowLines,
      alpha: { from: 0.1, to: 0.3 },
      duration: 2000,
      yoyo: true,
      repeat: -1
    });
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < 120; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      const scale = Phaser.Math.FloatBetween(0.2, 1.2);
      star.setScale(scale);
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
      star.setDepth(-5);
      star.setBlendMode(Phaser.BlendModes.ADD);
      
      this.stars.push({
        sprite: star,
        speed: Phaser.Math.FloatBetween(0.01, 0.05),
        baseAlpha: Phaser.Math.FloatBetween(0.2, 0.7),
        rotationSpeed: Phaser.Math.FloatBetween(-0.02, 0.02)
      });
    }
    
    // Анимация звёзд
    this.time.addEvent({
      delay: 50,
      callback: () => {
        const time = Date.now() / 1000;
        this.stars.forEach(star => {
          star.sprite.alpha = star.baseAlpha + Math.sin(time * 5 * star.speed) * 0.3;
          star.sprite.rotation += star.rotationSpeed;
        });
      },
      loop: true
    });
  }

  createParticles() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    for (let i = 0; i < 40; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.Between(1, 3),
        Phaser.Math.Between(0x88aaff, 0xff88ff),
        Phaser.Math.FloatBetween(0.1, 0.3)
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-150, 150),
        y: particle.y + Phaser.Math.Between(-80, 80),
        alpha: 0,
        duration: Phaser.Math.Between(5000, 10000),
        yoyo: true,
        repeat: -1,
        delay: i * 150
      });
      
      this.particles.push(particle);
    }
  }

  // =========================================================================
  // ЗАГОЛОВОК И ТАЙМЕР
  // =========================================================================

  createHeader() {
    const w = this.scale.width;
    
    // Основной заголовок
    const title = this.add.text(w / 2, 40, 'ЕЖЕДНЕВНЫЕ КВЕСТЫ', {
      fontSize: '32px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#ffffff',
      stroke: COLORS.primary,
      strokeThickness: 4,
      shadow: { blur: 15, color: COLORS.primary, fill: true }
    }).setOrigin(0.5);
    
    // Анимация заголовка
    this.tweens.add({
      targets: title,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Подзаголовок
    const subtitle = this.add.text(w / 2, 78, 'ВЫПОЛНЯЙ ЗАДАНИЯ И ПОЛУЧАЙ НАГРАДЫ', {
      fontSize: '10px',
      fontFamily: "'Share Tech Mono', monospace",
      color: COLORS.text_secondary
    }).setOrigin(0.5);
  }

  createTimerDisplay() {
    const w = this.scale.width;
    
    const timerContainer = this.add.container(w / 2, 115);
    
    const bg = this.add.rectangle(0, 0, 180, 32, 0x1a1a3a, 0.8)
      .setStrokeStyle(1, COLORS.primary, 0.5);
    
    const icon = this.add.text(-75, 0, '⏰', {
      fontSize: '16px'
    }).setOrigin(0.5);
    
    this.timerText = this.add.text(-30, 0, this.getTimeRemaining(), {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0, 0.5);
    
    timerContainer.add([bg, icon, this.timerText]);
    
    // Обновляем таймер каждую секунду
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timerText.setText(this.getTimeRemaining());
      },
      loop: true
    });
  }

  getTimeRemaining() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - new Date();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Обновление: ${hours}ч ${minutes}м`;
  }

  // =========================================================================
  // СПИСОК КВЕСТОВ
  // =========================================================================

  createQuestList() {
    const w = this.scale.width;
    const startY = 150;
    
    this.questContainer = this.add.container(0, startY);
    
    // Маска для скролла
    const maskGraphics = this.add.graphics();
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.fillRect(0, startY, w, this.scale.height - 210);
    const mask = maskGraphics.createGeometryMask();
    this.questContainer.setMask(mask);
    
    this.createQuestCards();
  }

  createQuestCards() {
    const w = this.scale.width;
    const spacing = 95;
    let currentY = 10;
    
    this.questSystem.quests.forEach((quest, index) => {
      const card = this.createQuestCard(quest, currentY, index);
      this.questContainer.add(card);
      this.questCards.push(card);
      currentY += spacing;
    });
    
    this.totalHeight = currentY + 20;
  }

  createQuestCard(quest, y, index) {
    const w = this.scale.width;
    const isCompleted = quest.progress >= quest.target;
    const isClaimed = quest.claimed;
    const progressPercent = (quest.progress / quest.target) * 100;
    
    // Определяем цвет и стиль в зависимости от статуса и сложности
    let borderColor;
    let bgColor = 0x1a1a3a;
    let iconScale = 1;
    
    if (isClaimed) {
      borderColor = COLORS.text_muted;
    } else if (isCompleted) {
      borderColor = COLORS.success;
      iconScale = 1.1;
    } else {
      if (quest.difficulty === 'epic') borderColor = 0xff44ff;
      else if (quest.difficulty === 'rare') borderColor = 0xffaa00;
      else borderColor = COLORS.primary;
    }
    
    const card = this.add.container(w / 2, y);
    
    // Фон карточки
    const bg = this.add.rectangle(0, 0, w - 40, 85, bgColor, 0.9)
      .setStrokeStyle(isCompleted ? 2 : 1, borderColor, isCompleted ? 0.8 : 0.5);
    
    // Иконка с анимацией
    const icon = this.add.text(-(w - 40) / 2 + 28, -15, quest.icon, {
      fontSize: isCompleted ? '38px' : '32px'
    }).setOrigin(0.5);
    
    // Название
    const name = this.add.text(-(w - 40) / 2 + 65, -22, quest.name, {
      fontSize: '15px',
      fontFamily: "'Orbitron', sans-serif",
      color: isClaimed ? COLORS.text_muted : (isCompleted ? COLORS.success : '#ffffff')
    }).setOrigin(0, 0.5);
    
    // Описание
    const description = this.add.text(-(w - 40) / 2 + 65, -2, quest.description, {
      fontSize: '10px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_secondary
    }).setOrigin(0, 0.5);
    
    // Прогресс-бар
    const barWidth = 140;
    const barX = (w - 40) / 2 - barWidth - 15;
    const barY = 8;
    
    const progressBg = this.add.rectangle(barX, barY, barWidth, 8, 0x333333)
      .setOrigin(0, 0.5);
    
    const progressFill = this.add.rectangle(barX, barY, barWidth * (progressPercent / 100), 8, borderColor)
      .setOrigin(0, 0.5);
    
    // Текст прогресса
    const progressText = this.add.text(barX + barWidth + 10, barY, `${quest.progress}/${quest.target}`, {
      fontSize: '10px',
      fontFamily: "'Space Mono', monospace",
      color: isCompleted ? COLORS.success : COLORS.text_secondary
    }).setOrigin(0, 0.5);
    
    // Награда
    const rewardText = this.add.text((w - 40) / 2 - 20, -28, `${quest.reward} 💎`, {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: isClaimed ? COLORS.text_muted : COLORS.accent
    }).setOrigin(1, 0.5);
    
    // Кнопка получения
    let claimBtn = null;
    if (isCompleted && !isClaimed) {
      claimBtn = this.add.text((w - 40) / 2 - 20, 12, 'ПОЛУЧИТЬ', {
        fontSize: '10px',
        fontFamily: "'Orbitron', sans-serif",
        color: '#00ff00',
        backgroundColor: '#1a3a1a',
        padding: { x: 10, y: 4 }
      }).setInteractive({ useHandCursor: true }).setOrigin(1, 0.5);
      
      claimBtn.on('pointerover', () => {
        claimBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' });
        claimBtn.setScale(1.05);
      });
      
      claimBtn.on('pointerout', () => {
        claimBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a3a1a' });
        claimBtn.setScale(1);
      });
      
      claimBtn.on('pointerdown', () => {
        const reward = this.questSystem.claimReward(quest.id);
        if (reward > 0) {
          audioManager.playSound(this, 'purchase_sound', 0.5);
          this.showRewardNotification(`+${reward} 💎`, '#00ff00');
          this.refreshQuestList();
        }
      });
    } else if (isClaimed) {
      const claimedText = this.add.text((w - 40) / 2 - 20, 12, '✓ ПОЛУЧЕНО', {
        fontSize: '10px',
        fontFamily: "'Orbitron', sans-serif",
        color: COLORS.text_muted
      }).setOrigin(1, 0.5);
      card.add(claimedText);
    }
    
    // Бейдж сложности
    const difficultyColors = {
      common: 0x88aaff,
      rare: 0xffaa00,
      epic: 0xff44ff
    };
    const difficultyNames = {
      common: 'ОБЫЧНЫЙ',
      rare: 'РЕДКИЙ',
      epic: 'ЭПИЧЕСКИЙ'
    };
    
    const difficultyBadge = this.add.text(-(w - 40) / 2 + 65, 22, difficultyNames[quest.difficulty], {
      fontSize: '8px',
      fontFamily: "'Share Tech Mono', monospace",
      color: Phaser.Display.Color.ValueToColor(difficultyColors[quest.difficulty]).rgba,
      backgroundColor: 0x000000,
      padding: { x: 4, y: 1 }
    }).setOrigin(0, 0.5);
    
    card.add([bg, icon, name, description, progressBg, progressFill, progressText, rewardText, difficultyBadge]);
    if (claimBtn) card.add(claimBtn);
    
    // Анимация появления
    card.setAlpha(0);
    card.setY(y + 20);
    this.tweens.add({
      targets: card,
      alpha: 1,
      y: y,
      duration: 300,
      delay: index * 80,
      ease: 'Back.out'
    });
    
    return card;
  }

  refreshQuestList() {
    // Очищаем старые карточки
    this.questCards.forEach(card => card.destroy());
    this.questCards = [];
    this.questContainer.removeAll(true);
    
    // Создаём новые
    this.createQuestCards();
  }

  // =========================================================================
  // ПРОКРУТКА
  // =========================================================================

  setupScrolling() {
    const w = this.scale.width;
    const startY = 150;
    const scrollHeight = this.scale.height - 210;
    
    const scrollZone = this.add.zone(0, startY, w, scrollHeight).setOrigin(0).setInteractive();
    let startYPos = 0;
    let startContainerY = 0;
    let isDragging = false;
    
    scrollZone.on('pointerdown', (pointer) => {
      startYPos = pointer.y;
      startContainerY = this.questContainer.y;
      isDragging = true;
    });
    
    scrollZone.on('pointermove', (pointer) => {
      if (!isDragging) return;
      
      const deltaY = pointer.y - startYPos;
      let newY = startContainerY + deltaY;
      
      const minY = startY - this.totalHeight + scrollHeight;
      const maxY = startY;
      
      if (newY < minY) {
        newY = minY + (newY - minY) * 0.2;
      } else if (newY > maxY) {
        newY = maxY + (newY - maxY) * 0.2;
      }
      
      this.questContainer.y = newY;
    });
    
    scrollZone.on('pointerup', () => {
      isDragging = false;
      
      const minY = startY - this.totalHeight + scrollHeight;
      const maxY = startY;
      
      this.tweens.add({
        targets: this.questContainer,
        y: Phaser.Math.Clamp(this.questContainer.y, minY, maxY),
        duration: 300,
        ease: 'Power2.easeOut'
      });
    });
  }

  // =========================================================================
  // КНОПКИ
  // =========================================================================

  createClaimAllButton() {
    const w = this.scale.width;
    const h = this.scale.height;
    const totalRewards = this.questSystem.getTotalRewards();
    
    const btnContainer = this.add.container(w / 2, h - 85);
    
    const bg = this.add.rectangle(0, 0, 200, 44, 0x1a3a1a, 0.9)
      .setStrokeStyle(2, COLORS.accent, 0.8);
    
    const text = this.add.text(0, 0, `ЗАБРАТЬ ВСЕ (${totalRewards} 💎)`, {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffaa00'
    }).setOrigin(0.5);
    
    const hitArea = this.add.rectangle(0, 0, 200, 44, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      bg.setFillStyle(0x2a5a2a, 0.9);
      text.setScale(1.05);
      audioManager.playSound(this, 'tap_sound', 0.1);
    });
    
    hitArea.on('pointerout', () => {
      bg.setFillStyle(0x1a3a1a, 0.9);
      text.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
      const total = this.questSystem.claimAllRewards();
      if (total > 0) {
        audioManager.playSound(this, 'purchase_sound', 0.6);
        this.showRewardNotification(`+${total} 💎`, '#ffaa00');
        this.refreshQuestList();
      }
    });
    
    btnContainer.add([bg, text, hitArea]);
    
    // Анимация пульсации
    this.tweens.add({
      targets: bg,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  createBackButton() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const backBtn = this.add.text(w / 2, h - 35, '⏎ НАЗАД В МЕНЮ', {
      fontSize: '18px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffffff',
      stroke: COLORS.primary,
      strokeThickness: 2,
      backgroundColor: '#1a1a3a',
      padding: { x: 25, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    backBtn.on('pointerover', () => {
      backBtn.setStyle({ backgroundColor: '#2a2a5a', stroke: '#ffffff' });
      backBtn.setScale(1.05);
      audioManager.playSound(this, 'tap_sound', 0.1);
    });
    
    backBtn.on('pointerout', () => {
      backBtn.setStyle({ backgroundColor: '#1a1a3a', stroke: COLORS.primary });
      backBtn.setScale(1);
    });
    
    backBtn.on('pointerdown', () => {
      audioManager.playSound(this, 'tap_sound', 0.3);
      this.scene.start('menu');
    });
  }

  // =========================================================================
  // УВЕДОМЛЕНИЯ
  // =========================================================================

  showQuestComplete(quest) {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const notification = this.add.container(w / 2, -80).setDepth(100).setScrollFactor(0);
    
    const bg = this.add.rectangle(0, 0, 280, 70, 0x0a2a0a, 0.95)
      .setStrokeStyle(2, COLORS.success, 0.8);
    
    const icon = this.add.text(-110, -10, quest.icon, {
      fontSize: '32px'
    }).setOrigin(0.5);
    
    const title = this.add.text(0, -15, 'КВЕСТ ВЫПОЛНЕН!', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.success
    }).setOrigin(0.5);
    
    const desc = this.add.text(0, 10, quest.name, {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: '#ffffff'
    }).setOrigin(0.5);
    
    const reward = this.add.text(0, 28, `+${quest.reward} 💎`, {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5);
    
    notification.add([bg, icon, title, desc, reward]);
    
    this.tweens.add({
      targets: notification,
      y: 100,
      duration: 500,
      ease: 'Back.out',
      onComplete: () => {
        this.tweens.add({
          targets: notification,
          alpha: 0,
          y: 160,
          duration: 500,
          delay: 2000,
          onComplete: () => notification.destroy()
        });
      }
    });
    
    audioManager.playSound(this, 'level_up_sound', 0.5);
  }

  showRewardNotification(text, color) {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const notification = this.add.text(w / 2, h / 2, text, {
      fontSize: '24px',
      fontFamily: "'Audiowide', sans-serif",
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: '#0a1a0a',
      padding: { x: 30, y: 15 }
    }).setOrigin(0.5).setDepth(100);
    
    notification.setScale(0.5);
    this.tweens.add({
      targets: notification,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.out'
    });
    
    this.tweens.add({
      targets: notification,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1000,
      delay: 1500,
      onComplete: () => notification.destroy()
    });
  }

  // =========================================================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // =========================================================================

  onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.tweens.killAll();
    this.stars = [];
    this.particles = [];
    this.questCards = [];
  }
}