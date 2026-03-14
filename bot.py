import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
GAME_URL = os.getenv("GAME_URL", "https://skypulse.vercel.app")  # замените при необходимости

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

RULES_TEXT = """
🌟 Добро пожаловать в **SkyPulse: Пятый элемент**! 🌟

Ты управляешь легендарным жёлтым такси из будущего. Твоя цель – пролететь как можно дальше, собирая монеты и уклоняясь от препятствий.

🚖 **Как играть:**
- Нажимай на экран, чтобы такси подпрыгивало.
- Пролетай через ворота, чтобы получать очки и продвигаться по уровням.
- Собирай монеты (золотые и цветные), чтобы увеличивать свой состав.
- Каждые 10 монет к твоему такси пристыковывается новый вагончик! Максимум – 10 вагонов.
- Вагончики делают игру сложнее, но и зрелищнее. Если вагон врежется в препятствие – он отвалится.
- Головное такси уязвимо: любое его столкновение – конец игры.

🌈 **Бонусные монетки:**
- 🔴 Красная – ускорение (x2 к очкам)
- 🔵 Синяя – щит (временная неуязвимость)
- 🟢 Зелёная – магнит (притягивает монеты)
- 🟣 Фиолетовая – замедление времени

🏆 С каждым уровнем скорость растёт, а проходы сужаются. Сколько вагонов ты сможешь накопить?

Нажми кнопку ниже, чтобы начать!
"""

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🚀 Играть в SkyPulse", web_app=WebAppInfo(url=GAME_URL))]
        ]
    )
    await message.answer(
        "Привет! Это игра SkyPulse – такси-поезд в стиле Пятого элемента.\n"
        "Нажми кнопку, чтобы начать, или /rules для правил.",
        reply_markup=keyboard
    )

@dp.message(Command("rules"))
async def cmd_rules(message: types.Message):
    await message.answer(RULES_TEXT, parse_mode="Markdown")

@dp.message(Command("game"))
async def cmd_game(message: types.Message):
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🚖 Играть", web_app=WebAppInfo(url=GAME_URL))]
        ]
    )
    await message.answer("Нажми кнопку, чтобы запустить игру:", reply_markup=keyboard)

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())