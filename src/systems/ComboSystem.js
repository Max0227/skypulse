export class ComboSystem {
  constructor(scene) {
    this.scene = scene;
    this.combo = 0;
    this.maxCombo = 0;
    this.multiplier = 1;
    this.timer = null;
    this.comboTimeout = 3000; // 3 секунды
    this.comboText = null;
  }

  add() {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    
    // Множитель: x1, x1.1, x1.2, x1.3 и т.д. до x3 максимум
    this.multiplier = Math.min(1 + this.combo * 0.1, 3);
    
    this.showComboText();
    this.resetTimer();
  }

  reset() {
    this.combo = 0;
    this.multiplier = 1;
    if (this.timer) this.timer.remove();
    if (this.comboText) this.comboText.destroy();
  }

  resetTimer() {
    if (this.timer) this.timer.remove();
    this.timer = this.scene.time.delayedCall(this.comboTimeout, () => this.reset());
  }

  showComboText() {
    if (this.combo < 2) return;
    if (this.comboText) this.comboText.destroy();
    
    const w = this.scene.scale.width;
    this.comboText = this.scene.add.text(w / 2, 150, `x${this.multiplier.toFixed(1)}`, {
      fontSize: '48px',
      fontFamily: "'Orbitron', monospace",
      color: '#ffff00',
      stroke: '#ff8800',
      strokeThickness: 4,
      shadow: { blur: 10, color: '#ffff00', fill: true }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    this.scene.tweens.add({
      targets: this.comboText,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => {
        if (this.comboText) this.comboText.destroy();
      }
    });
  }

  getMultiplier() {
    return this.multiplier;
  }

  update(delta) {}

  destroy() {
    if (this.timer) this.timer.remove();
    if (this.comboText) this.comboText.destroy();
  }
}