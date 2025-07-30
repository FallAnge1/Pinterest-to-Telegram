const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
require('dotenv').config();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

async function sendImagesGroup(chatId, imagePaths) {
    if (!imagePaths || imagePaths.length === 0) {
        console.log('❌ Нет изображений для отправки');
        return;
    }

    const seen = new Set();
    const filteredPaths = imagePaths.filter(p => {
        const base = p.split('/').pop();
        if (seen.has(base)) return false;
        seen.add(base);
        return true;
    });

    const mediaGroup = filteredPaths.slice(0, 10).map((path, idx) => ({
        type: 'photo',
        media: fs.createReadStream(path),
        caption: idx === 0 ? '📸 Подборка на день' : undefined
    }));

    console.log('📤 Отправляем в Telegram:', filteredPaths);

    try {
        await bot.sendMediaGroup(chatId, mediaGroup);
        console.log('✅ Фото отправлены!');
    } catch (error) {
        console.error('❌ Ошибка Telegram:', error.message);
    }
}

module.exports = { sendImagesGroup };
