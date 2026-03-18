export class SpecialEventManager {
  constructor(scene) {
    this.scene = scene;
    this.events = [];
    this.activeEvent = null;
    this.eventTimer = null;
    this.eventChance = 0.02; // 2% шанс в секунду
    this.eventCooldown = 0;
    this.eventCooldownTime = 30000; // 30 секунд между событиями
    this.lastEventTime = 0;
    
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
    
    // Проверяем шанс события
    if (Math.random() < this.eventChance * (delta / 1000)) {
      this.triggerRandomEvent();
    }
  }

  triggerRandomEvent() {
    const now = Date.now();
    if (now - this.lastEventTime < this.eventCooldownTime) return;
    
    const event = this.events[Math.floor(Math.random() * this.events.length)];
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

  showEventNotification(event) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    // Затемнение фона
    const overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.5)
      .setDepth(90)
      .setScrollFactor(0);
    
    // Основное уведомление
    const container = this.scene.add.container(w / 2, h / 2 - 100).setDepth(91).setScrollFactor(0);
    
    const bg = this.scene.add.rectangle(0, 0, 300, 120, 0x0a0a1a, 0.95)
      .setStrokeStyle(3, event.color, 0.8);
    
    const icon = this.scene.add.text(-120, -30, event.icon, {
      fontSize: '40px'
    }).setOrigin(0.5);
    
    const title = this.scene.add.text(20, -30, event.name, {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: this.getColorString(event.color)
    }).setOrigin(0, 0.5);
    
    const desc = this.scene.add.text(20, 10, event.description, {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    
    const timer = this.scene.add.text(20, 35, `⏱️ ${event.duration / 1000}с`, {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: '#ffaa00'
    }).setOrigin(0, 0.5);
    
    container.add([bg, icon, title, desc, timer]);
    
    // Анимация появления
    container.setScale(0.5);
    this.scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
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
    try { this.scene.sound.play('powerup_sound', { volume: 0.5 }); } catch (e) {}
  }

  endEvent(event) {
    this.activeEvent = null;
    
    const w = this.scale.width;
    const endText = this.scene.add.text(w / 2, 150, `${event.name} ЗАВЕРШЕНО`, {
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
  }

  meteorShower() {
    // Спавним множество астероидов
    for (let i = 0; i < 20; i++) {
      this.scene.time.delayedCall(i * 200, () => {
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
    
    // Используем существующий класс Asteroid или создаём упрощённую версию
    if (this.scene.asteroidClass) {
      const asteroid = new this.scene.asteroidClass(this.scene, x, y, 400);
      this.scene.asteroids.push(asteroid);
    } else {
      // Упрощённый астероид
      const asteroid = this.scene.physics.add.image(x, y, 'bg_asteroid_1');
      asteroid.setScale(Phaser.Math.FloatBetween(0.5, 1.2));
      asteroid.body.setCircle(15 * asteroid.scale);
      asteroid.body.setAllowGravity(false);
      asteroid.body.setVelocityX(-400);
      asteroid.body.setVelocityY(Phaser.Math.Between(-100, 100));
      asteroid.body.setAngularVelocity(Phaser.Math.Between(-100, 100));
      asteroid.asteroidRef = { active: true };
      this.scene.asteroids.push(asteroid);
    }
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
        
        // Меняем гравитацию
        const newGravity = count % 2 === 0 ? originalGravity * 1.5 : originalGravity * 0.5;
        this.scene.physics.world.gravity.y = newGravity;
        
        // Визуальный эффект
        const w = this.scale.width;
        const text = this.scene.add.text(w / 2, 200, newGravity > originalGravity ? '⬇️ ТЯЖЕЛО' : '⬆️ ЛЕГКО', {
          fontSize: '24px',
          fontFamily: "'Orbitron', monospace",
          color: '#00ffff'
        }).setOrigin(0.5).setDepth(90).setScrollFactor(0);
        
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          duration: 1000,
          onComplete: () => text.destroy()
        });
        
        count++;
      },
      repeat: 4
    });
    
    // Возвращаем гравитацию после события
    this.scene.time.delayedCall(10000, () => {
      this.scene.physics.world.gravity.y = originalGravity;
    });
  }

  timeWarp() {
    const originalSpeed = this.scene.currentSpeed;
    this.scene.currentSpeed *= 0.5;
    
    // Визуальный эффект
    const w = this.scale.width;
    const effect = this.scene.add.filter('warp');
    
    this.scene.time.delayedCall(8000, () => {
      this.scene.currentSpeed = originalSpeed;
    });
  }

  emPulse() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    // Эффект пульса
    const pulse = this.scene.add.circle(w / 2, h / 2, 10, 0x00ffff, 0.5)
      .setDepth(25)
      .setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: pulse,
      radius: 300,
      alpha: 0,
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: () => pulse.destroy()
    });
    
    // Притягиваем монеты к игроку
    const pullInterval = this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        if (!this.activeEvent) {
          pullInterval.remove();
          return;
        }
        
        this.scene.coins.forEach(coin => {
          if (coin.active) {
            const angle = Phaser.Math.Angle.Between(coin.x, coin.y, this.scene.player.x, this.scene.player.y);
            coin.x += Math.cos(angle) * 15;
            coin.y += Math.sin(angle) * 15;
          }
        });
      },
      loop: true
    });
  }

  neonFlash() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    // Яркая вспышка
    const flash = this.scene.add.rectangle(w / 2, h / 2, w, h, 0xffffff, 1)
      .setDepth(100)
      .setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
    
    // Временно ослепляем врагов (замедляем их)
    if (this.scene.waveManager) {
      this.scene.waveManager.enemies.forEach(enemy => {
        if (enemy.sprite) {
          enemy.sprite.setTint(0xffffff);
          const originalSpeed = enemy.config.speed;
          enemy.config.speed *= 0.3;
          
          this.scene.time.delayedCall(3000, () => {
            enemy.config.speed = originalSpeed;
            enemy.sprite.clearTint();
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
    
    // Создаём визуальный эффект черной дыры
    for (let i = 0; i < 5; i++) {
      const ring = this.scene.add.circle(centerX, centerY, 50 + i * 30, 0x000000, 0);
      ring.setStrokeStyle(2, 0x660066, 1 - i * 0.15);
      ring.setDepth(30);
      ring.setScrollFactor(0);
      
      this.scene.tweens.add({
        targets: ring,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 2000,
        ease: 'Sine.easeInOut',
        onComplete: () => ring.destroy()
      });
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
          if (coin.active) {
            const angle = Phaser.Math.Angle.Between(coin.x, coin.y, centerX, centerY);
            coin.x += Math.cos(angle) * 5;
            coin.y += Math.sin(angle) * 5;
          }
        });
        
        // Притягиваем врагов
        if (this.scene.waveManager) {
          this.scene.waveManager.enemies.forEach(enemy => {
            if (enemy.sprite && enemy.sprite.active) {
              const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, centerX, centerY);
              enemy.sprite.x += Math.cos(angle) * 3;
              enemy.sprite.y += Math.sin(angle) * 3;
            }
          });
        }
      },
      loop: true
    });
  }

  crystalRain() {
    // Спавним множество ценных монет
    for (let i = 0; i < 15; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        if (!this.scene.dead && this.activeEvent) {
          const x = this.scene.scale.width + 50;
          const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
          this.scene.spawnCoin(x, y, 'purple');
        }
      });
    }
  }

  shieldField() {
    this.scene.shieldActive = true;
    this.scene.player.setTint(0x00ffff);
    this.scene.particleManager.createShieldEffect(this.scene.player);
  }

  magnetStorm() {
    const originalRange = this.scene.magnetRange;
    this.scene.magnetRange = 500; // Огромный радиус
    this.scene.magnetActive = true;
    this.scene.player.setTint(0xff00ff);
    
    this.scene.time.delayedCall(8000, () => {
      this.scene.magnetRange = originalRange;
      this.scene.magnetActive = false;
      this.scene.player.clearTint();
    });
  }

  luckyMoment() {
    if (this.scene.multiplierSystem) {
      this.scene.multiplierSystem.addMultiplier('lucky', 2, 10);
    }
    
    // Визуальный эффект
    const w = this.scale.width;
    const text = this.scene.add.text(w / 2, 200, '💎 УДАЧНЫЙ МОМЕНТ x2 💎', {
      fontSize: '24px',
      fontFamily: "'Orbitron', monospace",
      color: '#ffff00',
      stroke: '#ffaa00',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(90).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
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
  }
}