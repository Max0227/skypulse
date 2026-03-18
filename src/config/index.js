export const COLORS = {
  primary: '#00ffff',
  secondary: '#ff00ff',
  accent: '#ffaa00',
  success: '#00ff00',
  danger: '#ff0000',
  warning: '#ffaa00',
  bg_dark: '#0a0a1a',
  bg_darker: '#030712',
  text_primary: '#ffffff',
  text_secondary: '#cbd5e1',
  text_muted: '#64748b',
};

export const DIFFICULTY_CURVE = {
  0: { speed: 240, gap: 240, spawnDelay: 1500, coinChance: 0.8 },
  1: { speed: 260, gap: 235, spawnDelay: 1400, coinChance: 0.75 },
  2: { speed: 280, gap: 230, spawnDelay: 1300, coinChance: 0.7 },
  3: { speed: 300, gap: 225, spawnDelay: 1200, coinChance: 0.65 },
  4: { speed: 320, gap: 220, spawnDelay: 1100, coinChance: 0.6 },
};

// Настройка миров (уровней) – добавляйте новые сюда
export const WORLD_CONFIG = {
  0: {
    name: 'КОСМОС',
    theme: 'space',
    bgColor: 0x0a0a1a,
    gateTexture: 'gate_blue',
    enemyTypes: [], // врагов нет
    goalScore: 500,
    description: 'Начни свой путь в открытом космосе',
    // Слои фона (параллакс)
    backgroundLayers: [
      { key: 'stars_far', speed: 0.1, count: 150 },
      { key: 'stars_mid', speed: 0.3, count: 100 },
      { key: 'planets', speed: 0.05, count: 5 },
    ],
  },
  1: {
    name: 'КИБЕРПАНК-ГОРОД',
    theme: 'cyberpunk',
    bgColor: 0x1a0a2a,
    gateTexture: 'gate_purple',
    enemyTypes: [],
    goalScore: 800,
    description: 'Неоновые огни и летающие машины',
    backgroundLayers: [
      { key: 'city_bg', speed: 0.15, count: 1 }, // дальний фон города
      { key: 'buildings', speed: 0.3, count: 20 }, // здания
      { key: 'cars', speed: 0.6, count: 10 }, // машины
      { key: 'people', speed: 0.4, count: 15 }, // силуэты людей
    ],
  },
  2: {
    name: 'ПОДЗЕМЕЛЬЕ',
    theme: 'dungeon',
    bgColor: 0x2a1a0a,
    gateTexture: 'gate_red',
    enemyTypes: [],
    goalScore: 1200,
    description: 'Тёмные коридоры и древние ловушки',
    backgroundLayers: [
      { key: 'dungeon_wall', speed: 0.2, count: 1 },
      { key: 'torches', speed: 0.3, count: 8 },
      { key: 'chains', speed: 0.5, count: 5 },
    ],
  },
};

export const SHOP_UPGRADES = [
  { key: 'jumpPower', name: 'Сила прыжка', icon: '🚀', cost: 10, maxLevel: 10 },
  { key: 'gravity', name: 'Гравитация', icon: '⬇️', cost: 15, maxLevel: 10 },
  { key: 'shieldDuration', name: 'Длительность щита', icon: '🛡️', cost: 20, maxLevel: 10 },
  { key: 'magnetRange', name: 'Радиус магнита', icon: '🧲', cost: 20, maxLevel: 10 },
  { key: 'wagonHP', name: 'Прочность вагонов', icon: '💪', cost: 25, maxLevel: 10 },
  { key: 'maxWagons', name: 'Макс. вагонов', icon: '🚃', cost: 30, maxLevel: 10 },
  { key: 'wagonGap', name: 'Дистанция вагонов', icon: '📏', cost: 30, maxLevel: 10 },
  { key: 'headHP', name: 'Макс. здоровье', icon: '❤️', cost: 40, maxLevel: 10 },
  { key: 'revival', name: 'Воскрешение', icon: '🔄', cost: 50, maxLevel: 5 },
];

export const ACHIEVEMENTS = {
  first_wagon: { id: 'first_wagon', name: 'Первый вагон', icon: '🚃', reward: 10 },
  five_wagons: { id: 'five_wagons', name: '5 вагонов', icon: '🚃🚃', reward: 25 },
  ten_wagons: { id: 'ten_wagons', name: '10 вагонов', icon: '🚃🚃🚃', reward: 50 },
  level_5: { id: 'level_5', name: 'Уровень 5', icon: '⭐', reward: 30 },
  level_10: { id: 'level_10', name: 'Уровень 10', icon: '⭐⭐', reward: 75 },
  score_100: { id: 'score_100', name: '100 очков', icon: '🏆', reward: 40 },
  score_500: { id: 'score_500', name: '500 очков', icon: '🏆🏆', reward: 100 },
  no_damage: { id: 'no_damage', name: 'Безопасный полёт', icon: '❤️', reward: 50 },
  all_bonuses: { id: 'all_bonuses', name: 'Все бонусы', icon: '✨', reward: 75 },
};

export const UPGRADE_COSTS = {
  jumpPower: { base: 10, multiplier: 1.15 },
  gravity: { base: 15, multiplier: 1.15 },
  shieldDuration: { base: 20, multiplier: 1.2 },
  magnetRange: { base: 20, multiplier: 1.2 },
  wagonHP: { base: 25, multiplier: 1.15 },
  maxWagons: { base: 30, multiplier: 1.25 },
  wagonGap: { base: 30, multiplier: 1.2 },
  headHP: { base: 40, multiplier: 1.2 },
  revival: { base: 50, multiplier: 1.5 },
};