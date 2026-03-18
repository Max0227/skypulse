export class ComboSystem {
  constructor(scene) {
    this.scene = scene;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = null;
    this.comboTimeout = 3000;
  }

  addCombo() {
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    
    if (this.comboTimer) {
      this.comboTimer.remove();
    }

    this.showComboText();

    this.comboTimer = this.scene.time.delayedCall(this.comboTimeout, () => {
      this.resetCombo();
    });
  }

  resetCombo() {
    this.combo = 0;
    if (this.comboTimer) {
      this.comboTimer.remove();
      this.comboTimer = null;
    }
  }

  showComboText() {
    if (this.combo > 1) {
      const w = this.scene.scale.width;
      const comboText = this.scene.add.text(w / 2, 150, `КОМБО x${this.combo}`, {
        fontSize: '28px',
        fontFamily: "'Orbitron', monospace",
        color: '#ffff00',
        stroke: '#ff8800',
        strokeThickness: 3,
        shadow: { blur: 10, color: '#ffff00', fill: true }
      }).setOrigin(0.5).setDepth(50).setScrollFactor(0);

      this.scene.tweens.add({
        targets: comboText,
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 0,
        duration: 1000,
        ease: 'Power2.easeOut',
        onComplete: () => comboText.destroy()
      });
    }
  }

  getMultiplier() {
    return 1 + (this.combo * 0.1);
  }

  destroy() {
    if (this.comboTimer) {
      this.comboTimer.remove();
    }
  }
}