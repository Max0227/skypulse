import { gameManager } from './GameManager';

export class AudioManager {
  constructor() {
    this.music = null;
    this.sounds = {};
  }

  playMusic(scene, volume = 0.4) {
    if (!gameManager.data.musicEnabled) return;
    try {
      if (!this.music) {
        this.music = scene.sound.add('bg_music', { loop: true, volume });
      } else {
        this.music.setVolume(volume);
      }
      if (!this.music.isPlaying) {
        this.music.play();
      }
    } catch (e) {
      console.warn('Music playback error:', e);
    }
  }

  stopMusic() {
    if (this.music && this.music.isPlaying) {
      this.music.stop();
    }
  }

  playSound(scene, key, volume = 0.5) {
    if (!gameManager.data.soundEnabled) return;
    try {
      if (!this.sounds[key]) {
        this.sounds[key] = scene.sound.add(key, { volume });
      }
      this.sounds[key].play();
    } catch (e) {
      console.warn(`Sound ${key} playback error:`, e);
    }
  }
}

export const audioManager = new AudioManager();