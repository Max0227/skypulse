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
  0: { speed: 240, gap: 240, spawnDelay: 1500, coinChance: 0.8, asteroidChance: 0.3, powerUpChance: 0.1 },
  3: { speed: 280, gap: 230, spawnDelay: 1400, coinChance: 0.75, asteroidChance: 0.4, powerUpChance: 0.12 },
  6: { speed: 320, gap: 220, spawnDelay: 1300, coinChance: 0.7, asteroidChance: 0.5, powerUpChance: 0.14 },
  9: { speed: 360, gap: 210, spawnDelay: 1200, coinChance: 0.65, asteroidChance: 0.6, powerUpChance: 0.16 },
  12: { speed: 400, gap: 200, spawnDelay: 1100, coinChance: 0.6, asteroidChance: 0.7, powerUpChance: 0.18 },
};

export const SHOP_UPGRADES = [
  { key: 'jumpPower', name: 'Сила прыжка', icon: '🚀', maxLevel: 10 },
  { key: 'gravity', name: 'Гравитация', icon: '⬇️', maxLevel: 10 },
  { key: 'shieldDuration', name: 'Длительность щита', icon: '🛡️', maxLevel: 10 },
  { key: 'magnetRange', name: 'Радиус магнита', icon: '🧲', maxLevel: 10 },
  { key: 'wagonHP', name: 'Прочность вагонов', icon: '💪', maxLevel: 10 },
  { key: 'maxWagons', name: 'Макс. вагонов', icon: '🚃', maxLevel: 10 },
  { key: 'wagonGap', name: 'Дистанция вагонов', icon: '📏', maxLevel: 10 },
  { key: 'headHP', name: 'Макс. здоровье', icon: '❤️', maxLevel: 10 },
  { key: 'revival', name: 'Воскрешение', icon: '🔄', maxLevel: 5 },
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

export const LEVEL_CONFIG = {
  0: {
    name: 'КОСМОС',
    bgColor: 0x0a0a1a,
    gateColors: ['gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'],
    description: 'Начни свой путь в открытом космосе',
    goalScore: 500,
    unlockPrice: 0,
  },
  1: {
    name: 'КИБЕРПАНК',
    bgColor: 0x1a0a2a,
    gateColors: ['gate_purple', 'gate_blue', 'gate_green', 'gate_yellow', 'gate_red'],
    description: 'Неоновые огни киберпанка',
    goalScore: 800,
    unlockPrice: 200,
  },
  2: {
    name: 'ПОДЗЕМЕЛЬЕ',
    bgColor: 0x2a1a0a,
    gateColors: ['gate_red', 'gate_yellow', 'gate_green', 'gate_blue', 'gate_purple'],
    description: 'Тёмные коридоры подземелья',
    goalScore: 1200,
    unlockPrice: 400,
  },
  3: {
    name: 'АСТЕРОИДЫ',
    bgColor: 0x0a2a2a,
    gateColors: ['gate_blue', 'gate_purple', 'gate_yellow', 'gate_green', 'gate_red'],
    description: 'Опасные астероиды',
    goalScore: 1600,
    unlockPrice: 600,
  },
  4: {
    name: 'ЧЁРНАЯ ДЫРА',
    bgColor: 0x000000,
    gateColors: ['gate_red', 'gate_purple', 'gate_blue', 'gate_green', 'gate_yellow'],
    description: 'Финальное испытание',
    goalScore: 2000,
    unlockPrice: 800,
  },
};

export const SKINS = [
  { id: 'default', name: 'Классика', price: 0, texture: 'player', description: 'Стандартное такси' },
  { id: 'neon', name: 'Неоновое', price: 100, texture: 'player_neon', description: 'Светится в темноте' },
  { id: 'cyber', name: 'Киберпанк', price: 250, texture: 'player_cyber', description: 'Стиль будущего' },
  { id: 'gold', name: 'Золотое', price: 500, texture: 'player_gold', description: 'Для коллекционеров' },
  { id: 'rainbow', name: 'Радужное', price: 1000, texture: 'player_rainbow', description: 'Переливается цветами' },
  { id: 'crystal', name: 'Кристальное', price: 1500, texture: 'player_crystal', description: 'Сверкает как алмаз' },
];