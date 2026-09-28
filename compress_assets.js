import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const IMAGE_DIR = path.resolve('src/assets/image');

async function processImage(filePath) {
  const fileName = path.basename(filePath);
  const stat = fs.statSync(filePath);
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

  if (stat.size < 100 * 1024) {
    // Skip small images < 100KB
    return;
  }

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    let transform = sharp(filePath);

    // Spritesheets must NEVER be resized in width/height because Phaser frame dimensions rely on exact pixel grids
    const isSpritesheet = fileName.toLowerCase().includes('spritesheet') || fileName.toLowerCase().includes('sheet');
    const isBackground = fileName.toLowerCase().includes('bg') || fileName.toLowerCase().includes('background') || fileName.toLowerCase().includes('map');
    const maxDim = isBackground ? 1920 : 512;

    if (!isSpritesheet && ((metadata.width && metadata.width > maxDim) || (metadata.height && metadata.height > maxDim))) {
      transform = transform.resize({
        width: metadata.width > maxDim ? maxDim : null,
        height: metadata.height > maxDim ? maxDim : null,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Compress PNG
    const tempPath = filePath + '.tmp';
    await transform
      .png({ quality: 80, compressionLevel: 9, palette: true })
      .toFile(tempPath);

    const newStat = fs.statSync(tempPath);
    const newSizeMB = (newStat.size / (1024 * 1024)).toFixed(2);

    if (newStat.size < stat.size) {
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
      console.log(`[OPTIMIZED] ${fileName}: ${sizeMB} MB -> ${newSizeMB} MB (${Math.round((1 - newStat.size / stat.size) * 100)}% saved)`);
    } else {
      fs.unlinkSync(tempPath);
      console.log(`[SKIPPED] ${fileName}: Already optimal (${sizeMB} MB)`);
    }
  } catch (err) {
    console.error(`[ERROR] Processing ${fileName}:`, err.message);
  }
}

async function main() {
  console.log('Starting image asset compression in:', IMAGE_DIR);
  const files = fs.readdirSync(IMAGE_DIR);
  for (const file of files) {
    if (file.toLowerCase().endsWith('.png')) {
      const fullPath = path.join(IMAGE_DIR, file);
      await processImage(fullPath);
    }
  }
  console.log('Image compression complete!');
}

main();
