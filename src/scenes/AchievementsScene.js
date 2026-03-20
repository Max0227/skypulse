import Phaser from 'phaser';
import { COLORS, ACHIEVEMENTS, WORLD_CONFIG, WORLD_ACHIEVEMENTS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class AchievementsScene extends Phaser.Scene {
  constructor() {
    super('achievements');
    this.currentFilter = 'all'; // all, space, cyberpunk, dungeon, asteroids, blackhole
    this.achievementCards = [];
    this.scrollOffset = 0;
    this.isDragging = false;
    this.dragStartY = 0;
    this.scrollVelocity = 0;
    this.lastScrollTime = 0;
    this.animations = [];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Создаём эпический фон
    this.createEpicBackground();

    // Создаём звёзды с мерцанием
    this.createStars();

    // Заголовок с анимацией
    this.createHeader();

    // Фильтры по мирам
    this.createFilters();

    // Счётчик достижений
    this.createProgressBar();

    // Контейнер для скролла
    this.createScrollableAchievements();

    // Статистика с анимацией
    this.createStatsPanel();

    // Кнопка назад
    this.createBackButton();

    // Запускаем анимации
    this.startAnimations();

    // Обработка скролла
    this.setupScrolling();

    // Обработка ресайза
    this.scale.on('resize', this.onResize, this);
  }

  // =========================================================================
  // СОЗДАНИЕ ЭЛЕМЕНТОВ
  // =========================================================================

  createEpicBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Базовый градиент
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('achievements_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'achievements_bg').setOrigin(0);

    // Неоновые линии по краям
    const glowLines = this.add.graphics();
    glowLines.lineStyle(2, 0x00ffff, 0.2);
    glowLines.strokeRect(10, 10, w - 20, h - 20);
    
    // Пульсация рамки
    this.tweens.add({
      targets: glowLines,
      alpha: { from: 0.2, to: 0.5 },
      duration: 2000,
      yoyo: true,
      repeat: -1
    });
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.stars = [];

    for (let i = 0; i < 150; i++) {
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
  }

  createHeader() {
    const w = this.scale.width;
    
    // Основной заголовок
    this.title = this.add.text(w / 2, 35, 'ДОСТИЖЕНИЯ', {
      fontSize: '42px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: COLORS.primary,
      strokeThickness: 5,
      shadow: { blur: 20, color: COLORS.primary, fill: true }
    }).setOrigin(0.5);
    
    // Подзаголовок
    this.subtitle = this.add.text(w / 2, 80, 'КОЛЛЕКЦИЯ ТРОФЕЕВ', {
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      color: COLORS.text_secondary,
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    
    // Анимация заголовка
    this.tweens.add({
      targets: this.title,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createFilters() {
    const w = this.scale.width;
    const filters = [
      { id: 'all', name: 'ВСЕ', icon: '🌟', color: COLORS.primary },
      { id: 'space', name: 'КОСМОС', icon: '🌌', color: 0x00ffff },
      { id: 'cyberpunk', name: 'КИБЕРПАНК', icon: '🌃', color: 0xff00ff },
      { id: 'dungeon', name: 'ПОДЗЕМЕЛЬЕ', icon: '🏰', color: 0xff6600 },
      { id: 'asteroids', name: 'АСТЕРОИДЫ', icon: '☄️', color: 0xffaa00 },
      { id: 'blackhole', name: 'ЧЁРНАЯ ДЫРА', icon: '⚫', color: 0xaa00aa }
    ];
    
    const filterContainer = this.add.container(w / 2, 115);
    let xOffset = -150;
    
    filters.forEach((filter, index) => {
      const isActive = this.currentFilter === filter.id;
      const bgColor = isActive ? filter.color : 0x333333;
      const textColor = isActive ? '#ffffff' : COLORS.text_secondary;
      
      const bg = this.add.rectangle(xOffset, 0, 50, 28, bgColor, 0.8)
        .setStrokeStyle(1, filter.color, isActive ? 1 : 0.3);
      
      const icon = this.add.text(xOffset - 18, 0, filter.icon, {
        fontSize: '14px'
      }).setOrigin(0.5);
      
      const text = this.add.text(xOffset + 5, 0, filter.name, {
        fontSize: '12px',
        fontFamily: "'Orbitron', sans-serif",
        color: textColor
      }).setOrigin(0, 0.5);
      
      const hitArea = this.add.rectangle(xOffset, 0, 50, 28, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      
      hitArea.on('pointerover', () => {
        if (!isActive) {
          bg.setFillStyle(filter.color, 0.6);
          icon.setScale(1.1);
          text.setColor('#ffffff');
        }
      });
      
      hitArea.on('pointerout', () => {
        if (!isActive) {
          bg.setFillStyle(0x333333, 0.8);
          icon.setScale(1);
          text.setColor(COLORS.text_secondary);
        }
      });
      
      hitArea.on('pointerdown', () => {
        if (this.currentFilter !== filter.id) {
          this.currentFilter = filter.id;
          audioManager.playSound(this, 'tap_sound', 0.2);
          this.refreshAchievementsList();
        }
      });
      
      filterContainer.add([bg, icon, text, hitArea]);
      xOffset += 60;
    });
  }

  createProgressBar() {
    const w = this.scale.width;
    const unlockedCount = Object.keys(gameManager.data.achievements).length;
    const totalCount = Object.keys(ACHIEVEMENTS).length;
    const percent = (unlockedCount / totalCount) * 100;
    
    // Контейнер прогресса
    const progressContainer = this.add.container(w / 2, 155);
    
    // Фон прогресс-бара
    const barBg = this.add.rectangle(0, 0, 250, 12, 0x333333, 0.8)
      .setStrokeStyle(1, COLORS.primary, 0.5);
    
    // Заполнение
    const barFill = this.add.rectangle(-125, 0, 250 * (percent / 100), 10, COLORS.primary, 0.9)
      .setOrigin(0, 0.5);
    
    // Текст прогресса
    const progressText = this.add.text(0, -12, `${unlockedCount}/${totalCount}`, {
      fontSize: '12px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.accent
    }).setOrigin(0.5);
    
    progressContainer.add([barBg, barFill, progressText]);
    
    // Анимация заполнения
    this.tweens.add({
      targets: barFill,
      width: 250 * (percent / 100),
      duration: 1000,
      ease: 'Quad.easeOut'
    });
  }

  createScrollableAchievements() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Контейнер для достижений
    this.achievementsContainer = this.add.container(0, 185);
    
    // Маска для скролла
    const maskGraphics = this.add.graphics();
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.fillRect(0, 185, w, h - 280);
    const mask = maskGraphics.createGeometryMask();
    this.achievementsContainer.setMask(mask);
    
    this.refreshAchievementsList();
  }

  refreshAchievementsList() {
    // Очищаем старые карточки
    this.achievementCards.forEach(card => {
      if (card && card.destroy) card.destroy();
    });
    this.achievementCards = [];
    
    // Получаем достижения с учётом фильтра
    const achievements = this.getFilteredAchievements();
    const spacing = 70;
    let currentY = 10;
    
    achievements.forEach(([key, ach]) => {
      const card = this.createAchievementCard(key, ach, currentY);
      this.achievementsContainer.add(card);
      this.achievementCards.push(card);
      currentY += spacing;
    });
    
    // Обновляем высоту контейнера
    this.totalHeight = currentY + 20;
  }

  getFilteredAchievements() {
    const allAchievements = Object.entries(ACHIEVEMENTS);
    
    if (this.currentFilter === 'all') {
      return allAchievements;
    }
    
    // Фильтруем по миру
    const worldMap = {
      space: ['first_coin', 'first_wagon', 'five_wagons', 'ten_wagons', 'level_5', 'level_10', 'level_20'],
      cyberpunk: ['world_2_complete', 'cyberpunk_master'],
      dungeon: ['world_3_complete', 'dungeon_master'],
      asteroids: ['world_4_complete', 'asteroid_hunter'],
      blackhole: ['world_5_complete', 'blackhole_survivor']
    };
    
    const allowedKeys = worldMap[this.currentFilter] || [];
    return allAchievements.filter(([key]) => allowedKeys.includes(key));
  }

  createAchievementCard(key, ach, y) {
    const w = this.scale.width;
    const unlocked = gameManager.data.achievements[key] !== undefined;
    const claimed = gameManager.data.achievements[key]?.claimed || false;
    
    // Определяем цвет в зависимости от редкости
    let borderColor = unlocked ? COLORS.accent : COLORS.text_muted;
    let bgColor = unlocked ? 0x1a3a1a : 0x1a1a3a;
    
    if (ach.rarity === 'legendary') borderColor = 0xffaa00;
    if (ach.rarity === 'epic') borderColor = 0xff44ff;
    if (ach.rarity === 'rare') borderColor = 0x44aaff;
    
    const card = this.add.container(w / 2, y);
    
    // Фон карточки
    const bg = this.add.rectangle(0, 0, w - 40, 62, bgColor, 0.9)
      .setStrokeStyle(2, borderColor, unlocked ? 0.8 : 0.3);
    
    // Иконка с анимацией
    const icon = this.add.text(-(w - 40) / 2 + 25, 0, unlocked ? ach.icon : '❓', {
      fontSize: '28px'
    }).setOrigin(0.5);
    
    // Название
    const name = this.add.text(-(w - 40) / 2 + 65, -12, ach.name, {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: unlocked ? '#ffffff' : COLORS.text_secondary
    }).setOrigin(0, 0.5);
    
    // Описание
    const description = this.add.text(-(w - 40) / 2 + 65, 8, ach.description || 'Выполните условие', {
      fontSize: '10px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_secondary
    }).setOrigin(0, 0.5);
    
    // Награда
    const rewardText = unlocked ? `+${ach.reward} 💎` : `${ach.reward} 💎`;
    const reward = this.add.text((w - 40) / 2 - 15, -8, rewardText, {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: unlocked ? COLORS.accent : COLORS.text_muted
    }).setOrigin(1, 0.5);
    
    // Кнопка получения награды
    let claimBtn = null;
    if (unlocked && !claimed && ach.reward > 0) {
      claimBtn = this.add.text((w - 40) / 2 - 15, 15, 'ЗАБРАТЬ', {
        fontSize: '9px',
        fontFamily: "'Orbitron', sans-serif",
        color: '#00ff00',
        backgroundColor: '#1a3a1a',
        padding: { x: 6, y: 2 }
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
      
      claimBtn.on('pointerover', () => {
        claimBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' });
      });
      
      claimBtn.on('pointerout', () => {
        claimBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a3a1a' });
      });
      
      claimBtn.on('pointerdown', () => {
        this.claimReward(key, ach.reward);
      });
    }
    
    // Дата получения
    if (unlocked && gameManager.data.achievements[key]?.unlockedAt) {
      const date = new Date(gameManager.data.achievements[key].unlockedAt);
      const dateStr = `${date.getDate()}.${date.getMonth() + 1}`;
      const dateText = this.add.text((w - 40) / 2 - 15, -22, dateStr, {
        fontSize: '8px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_muted
      }).setOrigin(1, 0.5);
      card.add(dateText);
    }
    
    // Прогресс-бар (для неполученных достижений с target)
    let progressFill = null;
    if (!unlocked && ach.target) {
      const progress = gameManager.data.achievementsProgress?.[key] || 0;
      const percent = (progress / ach.target) * 100;
      const barWidth = 80;
      const barX = (w - 40) / 2 - barWidth - 10;
      const barY = 15;
      
      const progressBg = this.add.rectangle(barX, barY, barWidth, 4, 0x333333)
        .setOrigin(0, 0.5);
      
      progressFill = this.add.rectangle(barX, barY, barWidth * (percent / 100), 4, borderColor)
        .setOrigin(0, 0.5);
      
      card.add(progressBg, progressFill);
    }
    
    // Добавляем все элементы
    card.add([bg, icon, name, description, reward]);
    if (claimBtn) card.add(claimBtn);
    
    // Анимация появления
    card.setAlpha(0);
    card.setY(y + 20);
    this.tweens.add({
      targets: card,
      alpha: 1,
      y: y,
      duration: 300,
      delay: y * 2,
      ease: 'Back.out'
    });
    
    return card;
  }

  claimReward(key, reward) {
    if (!gameManager.data.achievements[key]?.claimed) {
      gameManager.data.achievements[key].claimed = true;
      gameManager.addCrystals(reward, 'achievement');
      gameManager.save();
      
      audioManager.playSound(this, 'purchase_sound', 0.5);
      this.showNotification(`+${reward} 💎`, '#00ff00');
      this.refreshAchievementsList();
    }
  }

  createStatsPanel() {
    const w = this.scale.width;
    const h = this.scale.height;
    const statsY = h - 115;
    
    // Фон панели
    const statsBg = this.add.rectangle(w / 2, statsY, w - 30, 95, 0x0a0a1a, 0.9)
      .setStrokeStyle(2, COLORS.primary, 0.5);
    
    // Заголовок
    this.add.text(w / 2, statsY - 32, 'СТАТИСТИКА', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary
    }).setOrigin(0.5);
    
    // Статистика
    const stats = gameManager.getFormattedStats();
    const statItems = [
      { label: 'ИГР', value: stats.totalGames, icon: '🎮' },
      { label: 'РЕКОРД', value: stats.maxScore, icon: '🏆' },
      { label: 'УРОВЕНЬ', value: stats.maxLevel, icon: '⭐' },
      { label: 'ВАГОНЫ', value: stats.maxWagons, icon: '🚃' },
      { label: 'КОМБО', value: stats.maxCombo || 0, icon: '⚡' },
      { label: 'МОНЕТЫ', value: stats.totalCoinsCollected || 0, icon: '💎' },
      { label: 'ВРАГИ', value: stats.totalEnemiesKilled || 0, icon: '👾' },
      { label: 'ДИСТАНЦИЯ', value: `${Math.floor(stats.totalDistance || 0)}м`, icon: '📏' },
      { label: 'ВРЕМЯ', value: stats.totalPlayTimeFormatted || '0ч', icon: '⏱️' }
    ];
    
    const startX = 30;
    const startY = statsY - 12;
    
    statItems.forEach((item, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = startX + col * 110;
      const y = startY + row * 25;
      
      const container = this.add.container(x, y);
      
      const icon = this.add.text(0, 0, item.icon, {
        fontSize: '12px'
      }).setOrigin(0, 0.5);
      
      const label = this.add.text(14, 0, `${item.label}:`, {
        fontSize: '9px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);
      
      const value = this.add.text(50, 0, String(item.value), {
        fontSize: '10px',
        fontFamily: "'Orbitron', sans-serif",
        color: COLORS.accent
      }).setOrigin(0, 0.5);
      
      container.add([icon, label, value]);
    });
    
    // Украшения
    const corners = [
      { x: 20, y: statsY - 45 },
      { x: w - 20, y: statsY - 45 },
      { x: 20, y: statsY + 45 },
      { x: w - 20, y: statsY + 45 }
    ];
    
    corners.forEach(pos => {
      const dot = this.add.circle(pos.x, pos.y, 3, COLORS.primary, 0.5);
      dot.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: dot,
        alpha: 0.2,
        scale: 1.5,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    });
  }

  createBackButton() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const backBtn = this.add.text(w / 2, h - 25, '⏎ НАЗАД В МЕНЮ', {
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
  // СКРОЛЛ
  // =========================================================================

  setupScrolling() {
    const w = this.scale.width;
    const h = this.scale.height;
    const scrollY = 185;
    const scrollHeight = h - 280;
    
    const scrollZone = this.add.zone(0, scrollY, w, scrollHeight).setOrigin(0).setInteractive();
    let startY = 0;
    let startContainerY = 0;
    let isDragging = false;
    
    scrollZone.on('pointerdown', (pointer) => {
      startY = pointer.y;
      startContainerY = this.achievementsContainer.y;
      isDragging = true;
      this.scrollVelocity = 0;
    });
    
    scrollZone.on('pointermove', (pointer) => {
      if (!isDragging) return;
      
      const deltaY = pointer.y - startY;
      let newY = startContainerY + deltaY;
      
      const minY = scrollY - this.totalHeight + scrollHeight;
      const maxY = scrollY;
      
      if (newY < minY) {
        newY = minY + (newY - minY) * 0.2;
      } else if (newY > maxY) {
        newY = maxY + (newY - maxY) * 0.2;
      }
      
      this.achievementsContainer.y = newY;
      this.scrollVelocity = deltaY * 0.5;
    });
    
    scrollZone.on('pointerup', () => {
      isDragging = false;
      
      if (Math.abs(this.scrollVelocity) > 1) {
        this.tweens.add({
          targets: this.achievementsContainer,
          y: this.achievementsContainer.y + this.scrollVelocity * 5,
          duration: 500,
          ease: 'Power2.easeOut',
          onUpdate: () => {
            const minY = scrollY - this.totalHeight + scrollHeight;
            const maxY = scrollY;
            this.achievementsContainer.y = Phaser.Math.Clamp(this.achievementsContainer.y, minY, maxY);
          }
        });
      }
    });
  }

  // =========================================================================
  // АНИМАЦИИ
  // =========================================================================

  startAnimations() {
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
    
    // Сканирующая линия
    const scanLine = this.add.graphics();
    let y = 0;
    this.tweens.add({
      targets: { y: 0 },
      y: this.scale.height,
      duration: 4000,
      repeat: -1,
      onUpdate: (tween) => {
        y = tween.getValue();
        scanLine.clear();
        scanLine.lineStyle(2, 0x00ffff, 0.1);
        scanLine.lineBetween(0, y, this.scale.width, y);
      }
    });
  }

  showNotification(text, color) {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const notification = this.add.text(w / 2, h / 2, text, {
      fontSize: '24px',
      fontFamily: "'Audiowide', sans-serif",
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: '#0a1a0a',
      padding: { x: 30, y: 15 },
      shadow: { blur: 10, color: color, fill: true }
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0);
    
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

  onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.tweens.killAll();
    this.stars = [];
    this.achievementCards = [];
  }
}