import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('src/assets/image/creep.png');
const png = PNG.sync.read(data);

console.log(`Image dimensions: ${png.width} x ${png.height}`);

// Let's sample colors to see background vs label pills vs frog pixels
// Label pills have dark/black background. White text.
// Background is white or transparent.
// Frog sprites have green/brown pixels with black outlines.

let nonWhiteTransparentCount = 0;
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const a = png.data[idx + 3];

    // Check if pixel is frog green (e.g. g > r and g > b and a > 200)
    if (a > 200 && g > r + 15 && g > b + 15) {
      nonWhiteTransparentCount++;
    }
  }
}

console.log(`Found ${nonWhiteTransparentCount} frog green pixels.`);
