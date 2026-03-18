import { gameManager } from './GameManager';

export class AudioManager {
  constructor() {
    this.music = null;
    this.sounds = {};
    this.musicVolume = 0.3;
    this.soundVolume = 0.5;
  }

  /**
   * Воспроизведение фоновой музыки
   * @param {Phaser.Scene} scene - текущая сцена
   * @param {string} key - ключ аудиофайла (по умолчанию 'bg_music')
   * @param {number} volume - громкость (по умолчанию 0.4)
   */
  playMusic(scene, volume = 0.4) {
    // Проверяем, включена ли музыка в настройках
    if (!gameManager.data.musicEnabled) return;
    
    // Проверяем, есть ли аудиофайл в кэше
    if (!scene.cache.audio.has('bg_music')) {
      console.warn('⚠️ Music file "bg_music" not found in cache');
      return;
    }
    
    try {
      if (!this.music) {
        this.music = scene.sound.add('bg_music', { 
          loop: true, 
          volume: volume 
        });
      } else {
        this.music.setVolume(volume);
      }
      
      // Проверяем, не заблокирован ли аудиоконтекст (для мобильных браузеров)
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

  /**
   * Остановка фоновой музыки
   */
  stopMusic() {
    if (this.music && this.music.isPlaying) {
      this.music.stop();
    }
  }

  /**
   * Воспроизведение звукового эффекта с защитой от отсутствующих файлов
   * @param {Phaser.Scene} scene - текущая сцена
   * @param {string} key - ключ аудиофайла (например 'coin_sound')
   * @param {number} volume - громкость (по умолчанию 0.5)
   */
  playSound(scene, key, volume = 0.5) {
    // Проверяем, включены ли звуки в настройках
    if (!gameManager.data.soundEnabled) return;
    
    // Проверяем, есть ли аудиофайл в кэше
    if (!scene.cache.audio.has(key)) {
      // Не выводим предупреждение в консоль для каждого звука, чтобы не засорять лог
      // Можно раскомментировать для отладки:
      // console.warn(`⚠️ Sound file "${key}" not found in cache`);
      return;
    }
    
    try {
      // Проверяем, не заблокирован ли аудиоконтекст
      if (scene.sound.context.state === 'suspended') {
        scene.sound.context.resume().catch(e => console.warn('Failed to resume audio context:', e));
      }
      
      // Создаём звук, если его ещё нет в кэше менеджера
      if (!this.sounds[key]) {
        this.sounds[key] = scene.sound.add(key, { volume });
      }
      
      this.sounds[key].play();
    } catch (e) {
      // Игнорируем ошибки звука, чтобы не ломать игру
      console.warn(`⚠️ Sound "${key}" playback error:`, e);
    }
  }

  /**
   * Установка громкости музыки
   * @param {number} volume - громкость от 0 до 1
   */
  setMusicVolume(volume) {
    this.musicVolume = volume;
    if (this.music) {
      this.music.setVolume(volume);
    }
  }

  /**
   * Установка громкости звуков
   * @param {number} volume - громкость от 0 до 1
   */
  setSoundVolume(volume) {
    this.soundVolume = volume;
    
    // Обновляем громкость всех уже созданных звуков
    for (let key in this.sounds) {
      if (this.sounds[key]) {
        this.sounds[key].setVolume(volume);
      }
    }
  }

  /**
   * Выключение всей музыки и звуков
   */
  mute() {
    this.stopMusic();
    
    // Останавливаем все текущие звуки
    for (let key in this.sounds) {
      if (this.sounds[key] && this.sounds[key].isPlaying) {
        this.sounds[key].stop();
      }
    }
  }

  /**
   * Включение музыки и звуков (воспроизведение текущей музыки заново)
   * @param {Phaser.Scene} scene - текущая сцена
   */
  unmute(scene) {
    this.playMusic(scene);
  }

  /**
   * Предзагрузка всех звуков (можно вызвать из BootScene)
   * @param {Phaser.Scene} scene - сцена BootScene
   */
  preloadSounds(scene) {
    // Список всех звуков, используемых в игре
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
      { key: 'explosion_sound', file: 'sounds/explosion.mp3' }
    ];

    soundFiles.forEach(sound => {
      try {
        scene.load.audio(sound.key, sound.file);
      } catch (e) {
        console.warn(`⚠️ Failed to load sound ${sound.key}:`, e);
      }
    });
  }

  /**
   * Проверка, загружен ли звук в кэш
   * @param {Phaser.Scene} scene - текущая сцена
   * @param {string} key - ключ аудиофайла
   * @returns {boolean}
   */
  isSoundLoaded(scene, key) {
    return scene.cache.audio.has(key);
  }
}

// Создаём глобальный экземпляр менеджера и делаем его доступным везде
export const audioManager = new AudioManager();
window.audioManager = audioManager;