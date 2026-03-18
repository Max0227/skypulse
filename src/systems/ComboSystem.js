export class ComboSystem {
  constructor(scene) {
    this.scene = scene;
    this.combo = 0;
    this.maxCombo = 0;
    this.multiplier = 1;
    this.timer = null;
    this.comboTimeout = 3000;
    this.comboText = null;
  }

  add() {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.multiplier = 1 + this.combo * 0.1;
    this.showComboText();
    this.resetTimer();
  }

  // Добавляем этот метод для совместимости
  addCombo() {
    this.add();
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
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    this.scene.tweens.add({
      targets: this.comboText,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 1000,
      onComplete: () => { if (this.comboText) this.comboText.destroy(); }
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