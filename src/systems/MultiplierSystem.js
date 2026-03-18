export class MultiplierSystem {
  constructor(scene) {
    this.scene = scene;
    this.baseMultiplier = 1;
    this.bonusMultipliers = {};
    this.totalMultiplier = 1;
  }

  addMultiplier(key, value) {
    this.bonusMultipliers[key] = value;
    this.recalculateMultiplier();
  }

  removeMultiplier(key) {
    delete this.bonusMultipliers[key];
    this.recalculateMultiplier();
  }

  recalculateMultiplier() {
    this.totalMultiplier = this.baseMultiplier;
    for (let key in this.bonusMultipliers) {
      this.totalMultiplier *= this.bonusMultipliers[key];
    }
  }

  getMultiplier() {
    return this.totalMultiplier;
  }

  setBaseMultiplier(value) {
    this.baseMultiplier = value;
    this.recalculateMultiplier();
  }

  reset() {
    this.baseMultiplier = 1;
    this.bonusMultipliers = {};
    this.totalMultiplier = 1;
  }
}