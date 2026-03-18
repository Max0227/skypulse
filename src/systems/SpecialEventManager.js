export class SpecialEventManager {
  constructor(scene) {
    this.scene = scene;
    this.events = [];
    this.eventTimer = null;
    this.eventChance = 0.05;
  }

  update(delta) {
    if (Math.random() < this.eventChance * (delta / 1000)) {
      this.triggerRandomEvent();
    }
  }

  triggerRandomEvent() {
    const events = [
      { name: 'МЕТЕОРИТНЫЙ ДОЖДЬ', action: () => this.meteorShower() },
      { name: 'ВРЕМЕННОЙ СКАЧОК', action: () => this.timeWarp() },
      { name: 'ГРАВИТАЦИОННЫЙ СКАЧОК', action: () => this.gravityShift() },
      { name: 'ЭЛЕКТРОМАГНИТНЫЙ ИМПУЛЬС', action: () => this.emPulse() }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    this.showEventNotification(event.name);
    event.action();
  }

  meteorShower() {
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const x = this.scene.scale.width + 50;
        const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
        const meteor = this.scene.physics.add.image(x, y, 'bg_asteroid_1')
          .setScale(1.5)
          .setVelocityX(-this.scene.currentSpeed * 1.5)
          .setVelocityY(Phaser.Math.Between(-100, 100));
        meteor.setAngularVelocity(200);
        meteor.setDepth(-5);
      });
    }
  }

  timeWarp() {
    const originalSpeed = this.scene.currentSpeed;
    this.scene.currentSpeed *= 0.5;
    this.scene.time.delayedCall(5000, () => {
      this.scene.currentSpeed = originalSpeed;
    });
  }

  gravityShift() {
    const originalGravity = this.scene.physics.world.gravity.y;
    this.scene.physics.world.gravity.y *= 1.5;
    this.scene.time.delayedCall(4000, () => {
      this.scene.physics.world.gravity.y = originalGravity;
    });
  }

  emPulse() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
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

    this.scene.coins.forEach(coin => {
      const angle = Phaser.Math.Angle.Between(w / 2, h / 2, coin.x, coin.y);
      coin.setVelocityX(Math.cos(angle) * 300);
      coin.setVelocityY(Math.sin(angle) * 300);
    });
  }

  showEventNotification(eventName) {
    const w = this.scene.scale.width;
    const notification = this.scene.add.text(w / 2, 200, `⚡ ${eventName}`, {
      fontSize: '24px',
      fontFamily: "'Orbitron', monospace",
      color: '#ff00ff',
      stroke: '#ffff00',
      strokeThickness: 3,
      shadow: { blur: 15, color: '#ff00ff', fill: true }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    this.scene.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 2000,
      ease: 'Power2.easeOut',
      onComplete: () => notification.destroy()
    });
  }

  destroy() {
    if (this.eventTimer) {
      this.eventTimer.remove();
    }
  }
}