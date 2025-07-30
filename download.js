// download.js
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function downloadImages(imageUrls, folder = 'downloads') {
    await fs.ensureDir(folder);
    const paths = [];

    for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        const ext = path.extname(url).split('?')[0] || '.jpg';
        const filePath = path.join(folder, `img_${i}${ext}`);
        const writer = fs.createWriteStream(filePath);

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', () => {
                paths.push(filePath);
                resolve();
            });
            writer.on('error', reject);
        });
    }

    return paths;
}

module.exports = { downloadImages };
