import Phaser from 'phaser';
import { COLORS, LEVEL_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('levelSelect');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const world = gameManager.getCurrentWorld();
    const worldConfig = LEVEL_CONFIG[world];

    // Фон с цветом мира
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('level_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'level_bg').setOrigin(0);

    // Звёзды с цветом мира
    this.createStars(world);

    // Заголовок с названием мира
    const title = this.add.text(w / 2, 40, worldConfig.name, {
      fontSize: '28px',
      fontFamily: "'Orbitron', sans-serif",
      color: this.getWorldColorString(world),
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Анимация заголовка
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Баланс кристаллов
    this.balanceText = this.add.text(w - 20, 80, `💎 ${gameManager.data.crystals}`, {
      fontSize: '18px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(1, 0.5);

    let y = 130;
    const spacing = 80;

    // Уровни 0-9 (10 уровней)
    for (let level = 0; level < 10; level++) {
      const unlocked = gameManager.isLevelUnlocked(world, level) || level === 0;
      const stars = gameManager.getLevelStars(world, level);
      const price = gameManager.getLevelPrice(world, level);
      const canBuy = gameManager.data.crystals >= price;
      const isBoss = level === 9;

      // Цвет рамки
      let borderColor = COLORS.text_muted;
      if (unlocked) borderColor = this.getWorldColor(world);
      else if (canBuy) borderColor = COLORS.accent;

      // Карточка уровня
      const bg = this.add.rectangle(w / 2, y, w - 40, 70, 0x1a1a3a, 0.8)
        .setStrokeStyle(isBoss ? 3 : 2, borderColor)
        .setInteractive({ useHandCursor: true });

      // Эффект свечения для разблокированных
      if (unlocked) {
        this.tweens.add({
          targets: bg,
          alpha: 0.9,
          duration: 1000,
          yoyo: true,
          repeat: -1
        });
      }

      // Номер уровня
      const levelNum = this.add.text(30, y - 20, `${level + 1}`, {
        fontSize: '24px',
        fontFamily: "'Orbitron', sans-serif",
        color: unlocked ? COLORS.text_primary : COLORS.text_muted
      }).setOrigin(0, 0.5);

      // Название уровня
      const levelName = this.add.text(30, y + 5, isBoss ? 'БОСС' : `УРОВЕНЬ ${level + 1}`, {
        fontSize: '14px',
        fontFamily: "'Orbitron', sans-serif",
        color: unlocked ? COLORS.text_primary : COLORS.text_muted
      }).setOrigin(0, 0.5);

      // Цель уровня
      const goalScore = worldConfig.goalScore * (level + 1);
      this.add.text(30, y + 22, `Цель: ${goalScore}`, {
        fontSize: '10px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);

      // Звёзды
      this.add.text(w - 100, y - 15, '⭐'.repeat(stars) + '☆'.repeat(3 - stars), {
        fontSize: '16px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.accent
      }).setOrigin(0, 0.5);

      // Цена или статус
      if (!unlocked && price > 0) {
        this.add.text(w - 100, y + 10, `${price} 💎`, {
          fontSize: '14px',
          fontFamily: "'Space Mono', monospace",
          color: canBuy ? COLORS.accent : COLORS.text_muted
        }).setOrigin(0, 0.5);
      } else if (unlocked) {
        this.add.text(w - 100, y + 10, 'ОТКРЫТ', {
          fontSize: '12px',
          fontFamily: "'Orbitron', sans-serif",
          color: COLORS.success
        }).setOrigin(0, 0.5);
      }

      // Обработчики
      bg.on('pointerover', () => {
        if (unlocked) bg.setFillStyle(0x2a2a4a);
      });

      bg.on('pointerout', () => {
        bg.setFillStyle(0x1a1a3a, 0.8);
      });

      bg.on('pointerdown', () => {
        if (unlocked) {
          gameManager.setCurrentLevel(level);
          this.scene.start('play');
          try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
        } else if (price > 0 && canBuy) {
          this.confirmPurchase(world, level, price);
        } else if (price > 0 && !canBuy) {
          this.showNoFunds();
        }
      });

      y += spacing;
    }

    // Кнопка назад
    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('worldSelect'));
  }

  createStars(world) {
    const w = this.scale.width;
    const h = this.scale.height;
    const colors = this.getStarColors(world);

    for (let i = 0; i < 100; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setScale(Phaser.Math.FloatBetween(0.2, 1.0));
      star.setTint(colors[Math.floor(Math.random() * colors.length)]);
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
      star.setDepth(-5);
    }
  }

  getStarColors(world) {
    const colorSets = {
      0: [0x4444ff, 0x8844ff, 0xff44ff], // Космос
      1: [0xff44aa, 0xff88ff, 0xaa88ff], // Киберпанк
      2: [0xff6600, 0xffaa00, 0xcc5500], // Подземелье
      3: [0x44aaff, 0x88ccff, 0xaaddff], // Астероиды
      4: [0xaa0000, 0xcc00cc, 0x4400aa]  // Чёрная дыра
    };
    return colorSets[world] || colorSets[0];
  }

  getWorldColor(world) {
    const colors = [0x00ffff, 0xff00ff, 0xff6600, 0xffaa00, 0xaa00aa];
    return colors[world] || 0x00ffff;
  }

  getWorldColorString(world) {
    const colors = ['#00ffff', '#ff00ff', '#ff6600', '#ffaa00', '#aa00aa'];
    return colors[world] || '#00ffff';
  }

  confirmPurchase(world, level, price) {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(50)
      .setScrollFactor(0);

    const panel = this.add.rectangle(w / 2, h / 2, 300, 200, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, COLORS.primary)
      .setDepth(51)
      .setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 50, 'Открыть уровень?', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 20, `Стоимость: ${price} 💎`, {
      fontSize: '16px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2 + 10, 'Или набери очки в игре', {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_secondary
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const yesBtn = this.add.text(w / 2 - 80, h / 2 + 70, 'КУПИТЬ', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#00ff00',
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 8 }
    }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const noBtn = this.add.text(w / 2 + 80, h / 2 + 70, 'ОТМЕНА', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ff0000',
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 8 }
    }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0);

    yesBtn.on('pointerover', () => yesBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }));
    yesBtn.on('pointerout', () => yesBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a1a3a' }));
    yesBtn.on('pointerdown', () => {
      if (gameManager.purchaseLevel(world, level)) {
        try { audioManager.playSound(this, 'purchase_sound', 0.5); } catch (e) {}
        this.scene.restart();
      }
      overlay.destroy();
      panel.destroy();
      this.children.list.filter(c => c.depth >= 50).forEach(c => c.destroy());
    });

    noBtn.on('pointerover', () => noBtn.setStyle({ color: '#ffffff', backgroundColor: '#aa0000' }));
    noBtn.on('pointerout', () => noBtn.setStyle({ color: '#ff0000', backgroundColor: '#1a1a3a' }));
    noBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      this.children.list.filter(c => c.depth >= 50).forEach(c => c.destroy());
    });
  }

  showNoFunds() {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(50)
      .setScrollFactor(0);

    const panel = this.add.rectangle(w / 2, h / 2, 300, 150, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, COLORS.danger)
      .setDepth(51)
      .setScrollFactor(0);

    this.add.text(w / 2, h / 2, 'НЕДОСТАТОЧНО\nКРИСТАЛЛОВ!', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.danger,
      align: 'center'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.time.delayedCall(1500, () => {
      overlay.destroy();
      panel.destroy();
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