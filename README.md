# 📸 Pinterest Autopost Bot

> 🤖 Бот, который автоматически скачивает фотографии с ленты Pinterest и публикует их в Telegram-канал

---

## 🚀 Возможности

- 🔐 Авторизация через Pinterest cookies (без логина/пароля)
- 🖼️ Скачивание оригинальных фото, а не превью
- ✨ Автоматическая публикация в Telegram (группой)
- 📁 Очистка папки перед каждой сессией
- 🔒 Использует `.env` для хранения токенов и ID канала

---

## 📦 Установка

```bash
git clone https://github.com/yourname/pinterest-autopost-bot.git
npm install


⚙️ Настройка
1. Создай файл .env:
#BOT_TOKEN=ваш_telegram_bot_token
#TELEGRAM_CHAT_ID=@ваш_канал_или_chat_id

2. Добавь cookies.json в корень проекта
📄 Файл должен содержать экспортированные cookies от Pinterest после входа в аккаунт.

🧪 Запуск
node index.js

