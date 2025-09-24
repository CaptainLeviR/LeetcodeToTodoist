const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const srcDir = path.resolve(__dirname, '..', 'src');
const staticFiles = ['manifest.json', 'options.html', 'popup.html'];

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

for (const fileName of staticFiles) {
  const sourcePath = path.join(srcDir, fileName);
  const targetPath = path.join(distDir, fileName);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`Skipping missing static file: ${fileName}`);
    continue;
  }

  fs.copyFileSync(sourcePath, targetPath);
}
