import { LEVEL_CONFIG } from '../config';

export class LevelManager {
  constructor(scene) {
    this.scene = scene;
    this.currentLevel = 0;
    this.levelConfig = LEVEL_CONFIG;
  }

  switchLevel(levelIndex) {
    if (levelIndex > 5) levelIndex = 5;
    this.currentLevel = levelIndex;
    this.applyTheme();
  }

  applyTheme() {
    const config = this.levelConfig[this.currentLevel];
    if (config) {
      this.scene.cameras.main.setBackgroundColor(config.bgColor);
      this.scene.gateTextures = config.gateColors;
      this.scene.currentLevelConfig = config;
    }
  }

  getCurrentTheme() {
    return this.levelConfig[this.currentLevel].theme;
  }

  getLevelName() {
    return this.levelConfig[this.currentLevel].name;
  }

  getLevelDescription() {
    return this.levelConfig[this.currentLevel].description;
  }
}