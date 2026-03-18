import Phaser from 'phaser';
import { COLORS, SHOP_UPGRADES } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super('shop');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('shop_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'shop_bg').setOrigin(0);

    // Звёзды
    this.createStars();

    // Заголовок
    this.add.text(w / 2, 30, 'МАГАЗИН УЛУЧШЕНИЙ', {
      fontSize: '28px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Баланс кристаллов
    this.balanceText = this.add.text(w / 2, 80, `💎 ${gameManager.data.crystals}`, {
      fontSize: '24px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5);

    // Контейнер для скролла
    const startY = 130;
    const spacing = 70;
    let currentY = startY;

    SHOP_UPGRADES.forEach(upgrade => {
      const level = gameManager.getUpgradeLevel(upgrade.key);
      const maxLevel = upgrade.maxLevel;
      const cost = gameManager.getUpgradeCost(upgrade.key);
      const canAfford = gameManager.data.crystals >= cost && level < maxLevel;
      const isMax = level >= maxLevel;

      // Карточка улучшения
      const bg = this.add.rectangle(w / 2, currentY, w - 40, 60, 0x1a1a3a)
        .setStrokeStyle(2, isMax ? COLORS.success : (canAfford ? COLORS.primary : COLORS.text_muted))
        .setInteractive();

      // Иконка и название
      this.add.text(20, currentY - 15, `${upgrade.icon} ${upgrade.name}`, {
        fontSize: '16px',
        fontFamily: "'Orbitron', sans-serif",
        color: COLORS.text_primary
      }).setOrigin(0, 0.5);

      // Текущий уровень
      this.add.text(20, currentY + 10, `Уровень: ${level}/${maxLevel}`, {
        fontSize: '12px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);

      // Следующий уровень
      if (!isMax) {
        const nextValue = this.getNextValue(upgrade.key, level);
        this.add.text(200, currentY - 15, `→ ${nextValue}`, {
          fontSize: '14px',
          fontFamily: "'Space Mono', monospace",
          color: COLORS.accent
        }).setOrigin(0, 0.5);
      }

      // Цена или MAX
      if (isMax) {
        this.add.text(w - 20, currentY, 'MAX', {
          fontSize: '16px',
          fontFamily: "'Orbitron', sans-serif",
          color: COLORS.success
        }).setOrigin(1, 0.5);
      } else {
        const priceText = this.add.text(w - 20, currentY, `${cost} 💎`, {
          fontSize: '16px',
          fontFamily: "'Space Mono', monospace",
          color: canAfford ? COLORS.accent : COLORS.text_muted
        }).setOrigin(1, 0.5);

        // Прогресс-бар к следующему уровню
        const progressWidth = 100;
        const progressX = w - 150;
        const progressY = currentY + 15;
        
        const progressBg = this.add.rectangle(progressX, progressY, progressWidth, 4, 0x333333)
          .setOrigin(0, 0.5);
        
        const progressFill = this.add.rectangle(progressX, progressY, progressWidth * (level / maxLevel), 4, COLORS.primary)
          .setOrigin(0, 0.5);

        // Эффект наведения
        bg.on('pointerover', () => {
          if (!isMax) {
            bg.setFillStyle(0x2a2a4a);
            if (canAfford) {
              priceText.setColor(COLORS.accent);
            }
          }
        });

        bg.on('pointerout', () => {
          bg.setFillStyle(0x1a1a3a);
        });

        // Покупка
        if (canAfford) {
          bg.on('pointerdown', () => {
            if (gameManager.upgrade(upgrade.key)) {
              try { audioManager.playSound(this, 'purchase_sound', 0.5); } catch (e) {}
              this.balanceText.setText(`💎 ${gameManager.data.crystals}`);
              this.scene.restart();
            }
          });
        }
      }

      currentY += spacing;
    });

    // Кнопка "Сброс улучшений"
    this.createButton(w / 2, h - 90, 'СБРОСИТЬ УЛУЧШЕНИЯ', () => this.confirmReset(), 'danger');

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

  getNextValue(key, level) {
    const values = {
      jumpPower: 300 + (level + 1) * 25,
      gravity: 1300 - (level + 1) * 60,
      shieldDuration: 5 + (level + 1) * 1.5,
      magnetRange: 220 + (level + 1) * 40,
      wagonHP: 1 + (level + 1),
      maxWagons: 12 + (level + 1) * 2,
      wagonGap: 28 - (level + 1) * 2,
      headHP: 3 + (level + 1),
      revival: level + 1,
      weaponDamage: 1 + (level + 1),
      weaponSpeed: 400 + (level + 1) * 20,
      weaponFireRate: 500 - (level + 1) * 20
    };
    return values[key] || 0;
  }

  confirmReset() {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(50)
      .setScrollFactor(0);

    const panel = this.add.rectangle(w / 2, h / 2, 300, 200, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, COLORS.danger)
      .setDepth(51)
      .setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 50, 'Сбросить все улучшения?', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.danger,
      align: 'center'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 20, 'Кристаллы НЕ вернутся', {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_secondary
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2 + 10, 'Вы уверены?', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.warning
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const yesBtn = this.add.text(w / 2 - 80, h / 2 + 60, 'СБРОСИТЬ', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ff0000',
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 8 }
    }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const noBtn = this.add.text(w / 2 + 80, h / 2 + 60, 'ОТМЕНА', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#00ff00',
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 8 }
    }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0);

    yesBtn.on('pointerover', () => yesBtn.setStyle({ color: '#ffffff', backgroundColor: '#aa0000' }));
    yesBtn.on('pointerout', () => yesBtn.setStyle({ color: '#ff0000', backgroundColor: '#1a1a3a' }));
    yesBtn.on('pointerdown', () => {
      SHOP_UPGRADES.forEach(up => {
        gameManager.data.upgrades[up.key] = 0;
      });
      gameManager.save();
      try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
      this.scene.restart();
      overlay.destroy();
      panel.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    });

    noBtn.on('pointerover', () => noBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }));
    noBtn.on('pointerout', () => noBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a1a3a' }));
    noBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    });
  }

  createButton(x, y, text, callback, type = 'normal') {
    const colors = {
      normal: { bg: '#1a1a3a', text: COLORS.primary },
      danger: { bg: '#3a1a1a', text: '#ff4444' }
    };
    const col = colors[type];

    const btn = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: col.text,
      backgroundColor: col.bg,
      padding: { x: 20, y: 8 },
      stroke: col.text,
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerover', () => {
      btn.setStyle({ color: '#ffffff', backgroundColor: col.text });
      btn.setScale(1.05);
    });

    btn.on('pointerout', () => {
      btn.setStyle({ color: col.text, backgroundColor: col.bg });
      btn.setScale(1);
    });

    btn.on('pointerdown', callback);
    return btn;
  }
}