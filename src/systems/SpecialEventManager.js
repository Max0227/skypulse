export class SpecialEventManager {
  constructor(scene) {
    this.scene = scene;
    this.events = [];
    this.activeEvent = null;
    this.eventTimer = null;
    this.eventChance = 0.02;
    this.eventCooldown = 0;
    this.eventCooldownTime = 30000;
    this.lastEventTime = 0;
    this.eventIntervals = [];
    this.eventTweens = [];
    
    this.initEvents();
  }

  initEvents() {
    this.events = [
      {
        name: 'МЕТЕОРИТНЫЙ ДОЖДЬ',
        description: 'Интенсивный поток астероидов',
        duration: 8000,
        color: 0xff6600,
        icon: '☄️',
        action: () => this.meteorShower()
      },
      {
        name: 'ГРАВИТАЦИОННЫЙ СКАЧОК',
        description: 'Гравитация меняется каждые 2 секунды',
        duration: 10000,
        color: 0x6600ff,
        icon: '⬇️⬆️',
        action: () => this.gravityShift()
      },
      {
        name: 'ВРЕМЕННОЙ СКАЧОК',
        description: 'Замедление времени',
        duration: 8000,
        color: 0x00ffff,
        icon: '⏳',
        action: () => this.timeWarp()
      },
      {
        name: 'ЭЛЕКТРОМАГНИТНЫЙ ИМПУЛЬС',
        description: 'Все монеты притягиваются к игроку',
        duration: 6000,
        color: 0xff00ff,
        icon: '🧲',
        action: () => this.emPulse()
      },
      {
        name: 'НЕОНОВАЯ ВСПЫШКА',
        description: 'Яркая вспышка, временная слепота врагов',
        duration: 5000,
        color: 0xffff00,
        icon: '💥',
        action: () => this.neonFlash()
      },
      {
        name: 'ЧЕРНАЯ ДЫРА',
        description: 'Притягивает всё к центру экрана',
        duration: 7000,
        color: 0x000000,
        icon: '⚫',
        action: () => this.blackHole()
      },
      {
        name: 'КРИСТАЛЛЬНЫЙ ДОЖДЬ',
        description: 'Множество ценных кристаллов',
        duration: 8000,
        color: 0xffaa00,
        icon: '💎',
        action: () => this.crystalRain()
      },
      {
        name: 'ЩИТОВОЕ ПОЛЕ',
        description: 'Игрок получает временный щит',
        duration: 10000,
        color: 0x00ffff,
        icon: '🛡️',
        action: () => this.shieldField()
      },
      {
        name: 'МАГНИТНАЯ БУРЯ',
        description: 'Сильное притяжение монет',
        duration: 8000,
        color: 0xff00ff,
        icon: '🧲',
        action: () => this.magnetStorm()
      },
      {
        name: 'УДАЧНЫЙ МОМЕНТ',
        description: 'Удвоение всех кристаллов',
        duration: 10000,
        color: 0xffff00,
        icon: '🍀',
        action: () => this.luckyMoment()
      }
    ];
  }

  update(delta) {
    if (this.eventCooldown > 0) {
      this.eventCooldown -= delta;
      return;
    }
    
    if (this.activeEvent) return;
    
    // Увеличиваем шанс события в сложных мирах
    const worldBonus = (this.scene.world || 0) * 0.01;
    const chance = this.eventChance + worldBonus;
    
    if (Math.random() < chance * (delta / 1000)) {
      this.triggerRandomEvent();
    }
  }

  triggerRandomEvent() {
    const now = Date.now();
    if (now - this.lastEventTime < this.eventCooldownTime) return;
    
    // Исключаем события, которые не подходят для текущего мира
    const availableEvents = this.getAvailableEvents();
    if (availableEvents.length === 0) return;
    
    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    this.activeEvent = event;
    this.lastEventTime = now;
    this.eventCooldown = this.eventCooldownTime;
    
    this.showEventNotification(event);
    event.action();
    
    // Завершаем событие через duration
    this.scene.time.delayedCall(event.duration, () => {
      this.endEvent(event);
    });
  }

  getAvailableEvents() {
    const world = this.scene.world || 0;
    
    // В космосе все события доступны
    if (world === 0) return this.events;
    
    // В киберпанке больше световых событий
    if (world === 1) {
      return this.events.filter(e => 
        e.name !== 'ЧЕРНАЯ ДЫРА'
      );
    }
    
    // В подземелье больше тёмных событий
    if (world === 2) {
      return this.events.filter(e => 
        e.name !== 'НЕОНОВАЯ ВСПЫШКА' && e.name !== 'КРИСТАЛЛЬНЫЙ ДОЖДЬ'
      );
    }
    
    // В астероидах больше метеоритов
    if (world === 3) {
      return this.events.filter(e => 
        e.name !== 'ГРАВИТАЦИОННЫЙ СКАЧОК'
      );
    }
    
    return this.events;
  }

  showEventNotification(event) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const worldColor = this.scene.levelManager?.getWorldColor?.(this.scene.world) || event.color;
    
    // Затемнение фона
    const overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.5)
      .setDepth(90)
      .setScrollFactor(0);
    
    // Основное уведомление с неоновым эффектом
    const container = this.scene.add.container(w / 2, h / 2 - 100).setDepth(91).setScrollFactor(0);
    
    const bg = this.scene.add.rectangle(0, 0, 320, 130, 0x0a0a1a, 0.95)
      .setStrokeStyle(3, event.color, 0.8);
    
    // Анимация свечения рамки
    this.scene.tweens.add({
      targets: bg,
      alpha: { from: 0.8, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    const icon = this.scene.add.text(-130, -35, event.icon, {
      fontSize: '48px'
    }).setOrigin(0.5);
    
    const title = this.scene.add.text(10, -35, event.name, {
      fontSize: '20px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: this.getColorString(event.color),
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);
    
    const desc = this.scene.add.text(10, 0, event.description, {
      fontSize: '11px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#cccccc'
    }).setOrigin(0, 0.5);
    
    const timer = this.scene.add.text(10, 25, `⏱️ ${event.duration / 1000}с`, {
      fontSize: '11px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#ffaa00'
    }).setOrigin(0, 0.5);
    
    container.add([bg, icon, title, desc, timer]);
    
    // Анимация появления
    container.setScale(0.5);
    container.setAlpha(0);
    this.scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.out'
    });
    
    // Удаляем через 3 секунды
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: [container, overlay],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          container.destroy();
          overlay.destroy();
        }
      });
    });
    
    // Звук события
    try { 
      if (this.scene.sound) {
        this.scene.sound.play('powerup_sound', { volume: 0.5 });
      }
    } catch (e) {}
  }

  endEvent(event) {
    this.activeEvent = null;
    
    // Очищаем все интервалы и таймеры
    this.eventIntervals.forEach(interval => {
      if (interval && interval.remove) interval.remove();
    });
    this.eventIntervals = [];
    
    this.eventTweens.forEach(tween => {
      if (tween && tween.stop) tween.stop();
    });
    this.eventTweens = [];
    
    const w = this.scene.scale.width;
    const endText = this.scene.add.text(w / 2, 150, `${event.icon} ${event.name} ЗАВЕРШЕНО ${event.icon}`, {
      fontSize: '18px',
      fontFamily: "'Orbitron', monospace",
      color: '#cccccc',
      stroke: '#666666',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(90).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: endText,
      alpha: 0,
      duration: 2000,
      onComplete: () => endText.destroy()
    });
    
    // Восстанавливаем гравитацию если была изменена
    if (this.scene.physics.world.gravity.y !== 1300) {
      this.scene.physics.world.gravity.y = 1300;
    }
  }

  meteorShower() {
    const count = 25;
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        if (!this.scene.dead && this.activeEvent) {
          this.spawnEventAsteroid();
        }
      });
    }
  }

  spawnEventAsteroid() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const x = w + 50;
    const y = Phaser.Math.Between(50, h - 50);
    
    const asteroid = this.scene.physics.add.image(x, y, 'bg_asteroid_1');
    const scale = Phaser.Math.FloatBetween(0.5, 1.2);
    asteroid.setScale(scale);
    asteroid.body.setCircle(15 * scale);
    asteroid.body.setAllowGravity(false);
    asteroid.body.setVelocityX(-500);
    asteroid.body.setVelocityY(Phaser.Math.Between(-150, 150));
    asteroid.body.setAngularVelocity(Phaser.Math.Between(-200, 200));
    asteroid.asteroidRef = { active: true, health: 2 };
    asteroid.setTint(0xff6600);
    asteroid.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.asteroids.push(asteroid);
  }

  gravityShift() {
    const originalGravity = this.scene.physics.world.gravity.y;
    let count = 0;
    
    const interval = this.scene.time.addEvent({
      delay: 2000,
      callback: () => {
        if (!this.activeEvent) {
          interval.remove();
          return;
        }
        
        const newGravity = count % 2 === 0 ? originalGravity * 1.8 : originalGravity * 0.5;
        this.scene.physics.world.gravity.y = Math.max(300, Math.min(2000, newGravity));
        
        const w = this.scene.scale.width;
        const text = this.scene.add.text(w / 2, 200, newGravity > originalGravity ? '⬇️ ТЯЖЕЛО ⬇️' : '⬆️ ЛЕГКО ⬆️', {
          fontSize: '28px',
          fontFamily: "'Audiowide', monospace",
          color: '#00ffff',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(90).setScrollFactor(0);
        
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          y: text.y - 50,
          duration: 1500,
          onComplete: () => text.destroy()
        });
        
        count++;
      },
      repeat: 4
    });
    this.eventIntervals.push(interval);
    
    this.scene.time.delayedCall(10000, () => {
      this.scene.physics.world.gravity.y = originalGravity;
    });
  }

  timeWarp() {
    const originalSpeed = this.scene.currentSpeed;
    const targetSpeed = originalSpeed * 0.4;
    
    // Плавное замедление
    this.scene.tweens.add({
      targets: this.scene,
      currentSpeed: targetSpeed,
      duration: 500,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        if (this.scene.currentSpeed < 50) this.scene.currentSpeed = 50;
      }
    });
    
    // Эффект замедления времени
    const slowEffect = this.scene.add.graphics();
    slowEffect.fillStyle(0x88aaff, 0.1);
    slowEffect.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    slowEffect.setDepth(95);
    
    this.scene.tweens.add({
      targets: slowEffect,
      alpha: 0,
      duration: 8000,
      onComplete: () => slowEffect.destroy()
    });
    
    this.scene.time.delayedCall(8000, () => {
      this.scene.tweens.add({
        targets: this.scene,
        currentSpeed: originalSpeed,
        duration: 500,
        ease: 'Quad.easeIn'
      });
    });
  }

  emPulse() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    // Эффект пульса
    const pulse = this.scene.add.circle(w / 2, h / 2, 10, 0x00ffff, 0.8);
    pulse.setBlendMode(Phaser.BlendModes.ADD);
    pulse.setDepth(25);
    
    this.scene.tweens.add({
      targets: pulse,
      radius: 400,
      alpha: 0,
      duration: 600,
      ease: 'Power2.easeOut',
      onComplete: () => pulse.destroy()
    });
    
    // Притягиваем монеты к игроку
    const pullInterval = this.scene.time.addEvent({
      delay: 80,
      callback: () => {
        if (!this.activeEvent || !this.scene.player) {
          pullInterval.remove();
          return;
        }
        
        this.scene.coins.forEach(coin => {
          if (coin.active && coin.sprite) {
            const angle = Phaser.Math.Angle.Between(coin.x, coin.y, this.scene.player.x, this.scene.player.y);
            coin.x += Math.cos(angle) * 12;
            coin.y += Math.sin(angle) * 12;
          }
        });
      },
      loop: true
    });
    this.eventIntervals.push(pullInterval);
  }

  neonFlash() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    // Яркая вспышка с цветами
    const colors = [0xff00ff, 0x00ffff, 0xffff00, 0xff6600];
    let flashIndex = 0;
    
    const flashInterval = this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        if (!this.activeEvent) {
          flashInterval.remove();
          return;
        }
        const flash = this.scene.add.rectangle(w / 2, h / 2, w, h, colors[flashIndex % colors.length], 0.6);
        flash.setDepth(100);
        flash.setBlendMode(Phaser.BlendModes.ADD);
        
        this.scene.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 150,
          onComplete: () => flash.destroy()
        });
        flashIndex++;
      },
      repeat: 20
    });
    this.eventIntervals.push(flashInterval);
    
    // Временно ослепляем врагов
    if (this.scene.waveManager && this.scene.waveManager.enemies) {
      this.scene.waveManager.enemies.forEach(enemy => {
        if (enemy.sprite && enemy.sprite.active) {
          enemy.sprite.setTint(0xffffff);
          const originalSpeed = enemy.config.speed;
          enemy.config.speed *= 0.2;
          
          this.scene.time.delayedCall(3000, () => {
            if (enemy.sprite && enemy.sprite.active) {
              enemy.config.speed = originalSpeed;
              enemy.sprite.clearTint();
            }
          });
        }
      });
    }
  }

  blackHole() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const centerX = w / 2;
    const centerY = h / 2;
    
    // Создаём вращающиеся кольца
    for (let i = 0; i < 8; i++) {
      const radius = 40 + i * 25;
      const ring = this.scene.add.ellipse(centerX, centerY, radius * 2, radius, 0x000000, 0);
      ring.setStrokeStyle(2, 0x8800ff, 0.8 - i * 0.08);
      ring.setDepth(30);
      ring.setScrollFactor(0);
      
      this.scene.tweens.add({
        targets: ring,
        angle: 360,
        duration: 4000 + i * 500,
        repeat: -1,
        ease: 'Linear'
      });
      this.eventTweens.push(ring);
    }
    
    // Притягиваем всё к центру
    const pullInterval = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!this.activeEvent) {
          pullInterval.remove();
          return;
        }
        
        // Притягиваем монеты
        this.scene.coins.forEach(coin => {
          if (coin.active && coin.sprite) {
            const angle = Phaser.Math.Angle.Between(coin.x, coin.y, centerX, centerY);
            coin.x += Math.cos(angle) * 6;
            coin.y += Math.sin(angle) * 6;
          }
        });
        
        // Притягиваем врагов
        if (this.scene.waveManager && this.scene.waveManager.enemies) {
          this.scene.waveManager.enemies.forEach(enemy => {
            if (enemy.sprite && enemy.sprite.active) {
              const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, centerX, centerY);
              enemy.sprite.x += Math.cos(angle) * 4;
              enemy.sprite.y += Math.sin(angle) * 4;
            }
          });
        }
        
        // Притягиваем игрока (слабее)
        if (this.scene.player && this.scene.player.active) {
          const angle = Phaser.Math.Angle.Between(this.scene.player.x, this.scene.player.y, centerX, centerY);
          this.scene.player.x += Math.cos(angle) * 1.5;
          this.scene.player.y += Math.sin(angle) * 1.5;
        }
      },
      loop: true
    });
    this.eventIntervals.push(pullInterval);
  }

  crystalRain() {
    const count = 20;
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        if (!this.scene.dead && this.activeEvent) {
          const x = this.scene.scale.width + 50;
          const y = Phaser.Math.Between(80, this.scene.scale.height - 80);
          // Спавн ценных монет
          if (this.scene.spawnCoin) {
            this.scene.spawnCoin(x, y, 'purple');
          }
        }
      });
    }
  }

  shieldField() {
    this.scene.shieldActive = true;
    if (this.scene.player) {
      this.scene.player.setTint(0x00ffff);
    }
    if (this.scene.particleManager) {
      this.scene.particleManager.createShieldEffect(this.scene.player);
    }
    
    // Эффект щита на игроке
    const shieldRing = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 35, 0x00ffff, 0.3);
    shieldRing.setBlendMode(Phaser.BlendModes.ADD);
    shieldRing.setDepth(13);
    
    this.scene.tweens.add({
      targets: shieldRing,
      alpha: 0,
      scale: 1.5,
      duration: 10000,
      onComplete: () => shieldRing.destroy()
    });
  }

  magnetStorm() {
    const originalRange = this.scene.magnetRange;
    this.scene.magnetRange = 550;
    this.scene.magnetActive = true;
    if (this.scene.player) {
      this.scene.player.setTint(0xff00ff);
    }
    
    // Визуальный эффект магнитного поля
    const magnetField = this.scene.add.graphics();
    const updateField = () => {
      if (!this.activeEvent || !this.scene.player) return;
      magnetField.clear();
      magnetField.lineStyle(2, 0xff00ff, 0.5);
      magnetField.strokeCircle(this.scene.player.x, this.scene.player.y, this.scene.magnetRange);
      requestAnimationFrame(updateField);
    };
    updateField();
    
    this.scene.time.delayedCall(8000, () => {
      this.scene.magnetRange = originalRange;
      this.scene.magnetActive = false;
      if (this.scene.player) {
        this.scene.player.clearTint();
      }
      magnetField.destroy();
    });
  }

  luckyMoment() {
    if (this.scene.multiplierSystem) {
      this.scene.multiplierSystem.addMultiplier('lucky', 2, 10);
    }
    
    // Визуальный эффект
    const w = this.scene.scale.width;
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.text(
        w / 2 + Phaser.Math.Between(-150, 150),
        200 + Phaser.Math.Between(-50, 50),
        '💎',
        { fontSize: `${Phaser.Math.Between(16, 32)}px` }
      );
      particle.setAlpha(0.8);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.scene.tweens.add({
        targets: particle,
        y: particle.y - 100,
        alpha: 0,
        duration: 1500,
        onComplete: () => particle.destroy()
      });
    }
    
    const text = this.scene.add.text(w / 2, 180, '✨ УДАЧНЫЙ МОМЕНТ x2 ✨', {
      fontSize: '28px',
      fontFamily: "'Audiowide', monospace",
      color: '#ffff00',
      stroke: '#ffaa00',
      strokeThickness: 4,
      shadow: { blur: 15, color: '#ffff00', fill: true }
    }).setOrigin(0.5).setDepth(90).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 50,
      duration: 3000,
      onComplete: () => text.destroy()
    });
  }

  getColorString(colorHex) {
    const r = (colorHex >> 16) & 255;
    const g = (colorHex >> 8) & 255;
    const b = colorHex & 255;
    return `rgb(${r}, ${g}, ${b})`;
  }

  destroy() {
    if (this.eventTimer) {
      this.eventTimer.remove();
    }
    this.eventIntervals.forEach(interval => {
      if (interval && interval.remove) interval.remove();
    });
    this.eventIntervals = [];
    this.eventTweens.forEach(tween => {
      if (tween && tween.stop) tween.stop();
    });
    this.eventTweens = [];
  }
}