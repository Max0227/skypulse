export class MultiplierSystem {
  constructor(scene) {
    this.scene = scene;
    this.baseMultiplier = 1;
    this.bonusMultipliers = {};
    this.tempMultipliers = [];
    this.totalMultiplier = 1;
  }

  addMultiplier(key, value, duration = null) {
    if (duration) {
      // Временный множитель
      this.tempMultipliers.push({
        key,
        value,
        duration,
        startTime: Date.now()
      });
      
      // Автоматическое удаление через duration
      this.scene.time.delayedCall(duration * 1000, () => {
        this.removeTempMultiplier(key);
      });
    } else {
      // Постоянный множитель
      this.bonusMultipliers[key] = value;
    }
    
    this.recalculateMultiplier();
  }

  removeMultiplier(key) {
    delete this.bonusMultipliers[key];
    this.recalculateMultiplier();
  }

  removeTempMultiplier(key) {
    this.tempMultipliers = this.tempMultipliers.filter(m => m.key !== key);
    this.recalculateMultiplier();
  }

  recalculateMultiplier() {
    this.totalMultiplier = this.baseMultiplier;
    
    // Применяем постоянные множители
    for (let key in this.bonusMultipliers) {
      this.totalMultiplier *= this.bonusMultipliers[key];
    }
    
    // Применяем временные множители
    for (let temp of this.tempMultipliers) {
      this.totalMultiplier *= temp.value;
    }
    
    // Округляем до 2 знаков
    this.totalMultiplier = Math.round(this.totalMultiplier * 100) / 100;
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
    this.tempMultipliers = [];
    this.totalMultiplier = 1;
  }

  getMultiplierBreakdown() {
    return {
      base: this.baseMultiplier,
      permanent: { ...this.bonusMultipliers },
      temporary: [...this.tempMultipliers],
      total: this.totalMultiplier
    };
  }

  update(delta) {
    // Обновляем временные множители
    const now = Date.now();
    this.tempMultipliers = this.tempMultipliers.filter(m => {
      const elapsed = (now - m.startTime) / 1000;
      return elapsed < m.duration;
    });
    
    if (this.tempMultipliers.length > 0) {
      this.recalculateMultiplier();
    }
  }
}