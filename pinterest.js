const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchHighQualityPinsViaDownload(cookies, count = 5, downloadFolder = './downloads') {
    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    // Убедимся, что папка есть
    await fs.promises.mkdir(downloadFolder, { recursive: true });

    // Установка политики скачивания
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: path.resolve(downloadFolder)
    });

    await page.setCookie(...cookies);
    await page.goto('https://www.pinterest.com/', { waitUntil: 'domcontentloaded' });
    await wait(5000);
    await page.evaluate(() => window.scrollBy(0, 5000));
    await wait(3000);

    const pinLinks = await page.$$eval('a[href*="/pin/"]', links =>
        [...new Set(links.map(a => a.href))]
    );

    const downloadedFiles = [];

    for (let i = 0; i < Math.min(count, pinLinks.length); i++) {
        const pinUrl = pinLinks[i];
        const pinPage = await browser.newPage();
        await pinPage.setCookie(...cookies);

        try {
            await pinPage.goto(pinUrl, { waitUntil: 'domcontentloaded' });
            await wait(3000);

            const buttonSelector = 'button[aria-label*="Другие действия"], button[aria-label*="More"], button[aria-label*="Ещё"]';
            await pinPage.waitForSelector(buttonSelector, { timeout: 8000 });

            const menuButton = await pinPage.$(buttonSelector);
            if (menuButton) {
                await menuButton.click();
                console.log('✅ Кнопка "⋯" нажата');
            }

            await wait(2000);

            await pinPage.waitForSelector('div[role="menu"], div[data-test-id*="dropdown"]', { timeout: 8000 });
            const menuItems = await pinPage.$$('div[role="menu"] div, div[data-test-id*="dropdown"] div');

            let clicked = false;
            for (const item of menuItems) {
                const text = await item.evaluate(el => el.textContent?.trim());
                console.log('🧩 Меню пункт:', JSON.stringify(text));

                if (text === 'Скачать изображение' || text === 'Download image') {
                    await item.click();
                    clicked = true;
                    break;
                }
            }

            if (clicked) {
                console.log(`📥 Ждём загрузку...`);
                const renamedFile = await waitDownloadAndRename(downloadFolder, i);
                if (renamedFile && fs.existsSync(renamedFile)) {
                    downloadedFiles.push(renamedFile);
                    console.log(`✅ Файл переименован: ${path.basename(renamedFile)}`);
                } else {
                    console.warn('⚠️ Файл не найден после переименования');
                }
            } else {
                console.warn('⚠️ Кнопка "Скачать изображение" не найдена — fallback');

                const imgUrl = await pinPage.$$eval('img[src*="i.pinimg.com"]', imgs => {
                    const best = imgs.find(img =>
                        img.src.includes('/originals/') || img.naturalWidth >= 800
                    );
                    return best?.src || null;
                });

                if (imgUrl) {
                    const fileName = `fallback_${Date.now()}_${i}${path.extname(imgUrl).split('?')[0] || '.jpg'}`;
                    const fullPath = path.join(downloadFolder, fileName);
                    const writer = fs.createWriteStream(fullPath);

                    const res = await axios({
                        url: imgUrl,
                        method: 'GET',
                        responseType: 'stream'
                    });

                    res.data.pipe(writer);
                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });

                    downloadedFiles.push(fullPath);
                    console.log(`✅ Fallback: загружено ${fileName}`);
                } else {
                    console.warn('❌ Fallback не удалось — нет <img>');
                }
            }

        } catch (err) {
            console.error(`❌ Ошибка при обработке ${pinUrl}:`, err.message);
        }

        await pinPage.close();
    }

    await browser.close();

    const uniqueFiles = [...new Set(downloadedFiles)];
    return uniqueFiles;
}

// ⏳ Функция ожидания и переименования файла download.*
async function waitDownloadAndRename(downloadFolder, index) {
    const timeout = 10000;
    const pollInterval = 500;
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const files = fs.readdirSync(downloadFolder);
        const file = files.find(f => /^download/i.test(f));
        if (file) {
            const oldPath = path.join(downloadFolder, file);
            const ext = path.extname(file) || '.jpeg';
            const newName = `pinterest_${Date.now()}_${index}${ext}`;
            const newPath = path.join(downloadFolder, newName);

            fs.renameSync(oldPath, newPath);
            return newPath;
        }
        await wait(pollInterval);
    }

    return null;
}

module.exports = { fetchHighQualityPinsViaDownload };
