const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');
const { fetchHighQualityPinsViaDownload } = require('./pinterest');
const { sendImagesGroup } = require('./telegram');
require('dotenv').config();
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // ⚠️ Укажи свой канал или ID

(async () => {
    try {
        // Очистка папки перед запуском
        console.log('🧹 Очищаем папку downloads...');
        fsExtra.emptyDirSync('./downloads');

        // Загрузка куков
        console.log('🔐 Загружаем cookies...');
        const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf-8'));

        // Скачивание изображений
        console.log('📥 Скачиваем изображения с Pinterest...');
        await fetchHighQualityPinsViaDownload(cookies, 5, './downloads');

        // Получаем все изображения из папки
        const allFiles = fs.readdirSync('./downloads')
            .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
            .map(f => path.join('./downloads', f));

        if (allFiles.length > 0) {
            console.log(`📤 Отправляем ${allFiles.length} фото в Telegram...`);
            await sendImagesGroup(TELEGRAM_CHAT_ID, allFiles);
        } else {
            console.warn('⚠️ В папке downloads не найдено изображений для отправки.');
        }

    } catch (err) {
        console.error('❌ Ошибка выполнения:', err.message || err);
    }
})();
