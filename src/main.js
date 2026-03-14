import './styles.css';
import './game.js';

// Инициализация Telegram Mini App
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();                // Сообщаем Telegram, что приложение готово
  tg.expand();               // Растягиваем на весь экран
  // Можно установить цвета (опционально)
  tg.setHeaderColor?.('#030712');
  tg.setBackgroundColor?.('#030712');
}
