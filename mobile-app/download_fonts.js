const https = require('https');
const fs = require('fs');
const path = require('path');

const fonts = {
  'Inter-Regular.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter-Regular.ttf',
  'Inter-Medium.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter-Medium.ttf',
  'Inter-SemiBold.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter-SemiBold.ttf',
  'Inter-Bold.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter-Bold.ttf'
};

const fontDir = path.join(__dirname, 'assets', 'fonts');

if (!fs.existsSync(fontDir)) {
  fs.mkdirSync(fontDir, { recursive: true });
}

Object.entries(fonts).forEach(([filename, url]) => {
  const filePath = path.join(fontDir, filename);
  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download ${filename}: ${response.statusCode}`);
      return;
    }
    const fileStream = fs.createWriteStream(filePath);
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Downloaded ${filename}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${filename}: ${err.message}`);
  });
});
