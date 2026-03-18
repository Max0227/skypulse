import { gameManager } from './GameManager';

export class AudioManager {
  constructor() {
    this.music = null;
    this.sounds = {};
    this.musicVolume = 0.3;
    this.soundVolume = 0.5;
    this.context = null;
  }

  init(scene) {
    this.context = scene.sound.context;
  }

  playMusic(scene, key = 'bg_music', volume = 0.4) {
    if (!gameManager.data.musicEnabled) return;
    
    try {
      if (!scene.cache.audio.has(key)) {
        console.warn(`⚠️ Music file "${key}" not found in cache`);
        return;
      }
      
      if (!this.music) {
        this.music = scene.sound.add(key, { 
          loop: true, 
          volume: volume 
        });
      } else {
        this.music.setVolume(volume);
      }
      
      if (scene.sound.context.state === 'suspended') {
        scene.sound.context.resume().then(() => {
          if (!this.music.isPlaying) {
            this.music.play();
          }
        }).catch(e => console.warn('Failed to resume audio context:', e));
      } else {
        if (!this.music.isPlaying) {
          this.music.play();
        }
      }
    } catch (e) {
      console.warn('⚠️ Music playback error:', e);
    }
  }

  stopMusic() {
    if (this.music && this.music.isPlaying) {
      this.music.stop();
    }
  }

  pauseMusic() {
    if (this.music && this.music.isPlaying) {
      this.music.pause();
    }
  }

  resumeMusic(scene) {
    if (this.music && this.music.isPaused) {
      this.music.resume();
    } else {
      this.playMusic(scene);
    }
  }

  playSound(scene, key, volume = 0.5) {
    if (!gameManager.data.soundEnabled) return;
    
    try {
      if (!scene.cache.audio.has(key)) {
        return;
      }
      
      if (scene.sound.context.state === 'suspended') {
        scene.sound.context.resume().catch(e => console.warn('Failed to resume audio context:', e));
      }
      
      if (!this.sounds[key]) {
        this.sounds[key] = scene.sound.add(key, { volume });
      }
      
      this.sounds[key].play();
    } catch (e) {
      // Игнорируем ошибки звука
    }
  }

  playRandomSound(scene, keys, volume = 0.5) {
    if (!keys || keys.length === 0) return;
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    this.playSound(scene, randomKey, volume);
  }

  setMusicVolume(volume) {
    this.musicVolume = volume;
    if (this.music) {
      this.music.setVolume(volume);
    }
  }

  setSoundVolume(volume) {
    this.soundVolume = volume;
    
    for (let key in this.sounds) {
      if (this.sounds[key]) {
        this.sounds[key].setVolume(volume);
      }
    }
  }

  mute() {
    this.stopMusic();
    
    for (let key in this.sounds) {
      if (this.sounds[key] && this.sounds[key].isPlaying) {
        this.sounds[key].stop();
      }
    }
  }

  unmute(scene) {
    this.playMusic(scene);
  }

  preloadSounds(scene) {
    const soundFiles = [
      { key: 'coin_sound', file: 'sounds/coin.mp3' },
      { key: 'item_sound', file: 'sounds/item.mp3' },
      { key: 'tap_sound', file: 'sounds/tap.mp3' },
      { key: 'wagon_sound', file: 'sounds/wagon.mp3' },
      { key: 'level_up_sound', file: 'sounds/level_up.mp3' },
      { key: 'purchase_sound', file: 'sounds/purchase.mp3' },
      { key: 'revive_sound', file: 'sounds/revive.mp3' },
      { key: 'bg_music', file: 'sounds/fifth_element_theme.mp3' },
      { key: 'shoot_sound', file: 'sounds/shoot.mp3' },
      { key: 'explosion_sound', file: 'sounds/explosion.mp3' },
      { key: 'hit_sound', file: 'sounds/hit.mp3' },
      { key: 'powerup_sound', file: 'sounds/powerup.mp3' },
      { key: 'shield_sound', file: 'sounds/shield.mp3' },
      { key: 'magnet_sound', file: 'sounds/magnet.mp3' },
      { key: 'slow_sound', file: 'sounds/slow.mp3' },
      { key: 'speed_sound', file: 'sounds/speed.mp3' },
      { key: 'gameover_sound', file: 'sounds/gameover.mp3' },
      { key: 'win_sound', file: 'sounds/win.mp3' },
      { key: 'enemy_die_sound', file: 'sounds/enemy_die.mp3' },
    ];

    soundFiles.forEach(sound => {
      try {
        scene.load.audio(sound.key, sound.file);
      } catch (e) {
        console.warn(`⚠️ Failed to load sound ${sound.key}:`, e);
      }
    });
  }

  isSoundLoaded(scene, key) {
    return scene.cache.audio.has(key);
  }
}

export const audioManager = new AudioManager();
window.audioManager = audioManager;