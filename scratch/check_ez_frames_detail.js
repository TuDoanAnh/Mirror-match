import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/ezreal_spritesheet.png');
const png = PNG.sync.read(data);

const fw = 48, fh = 56;
const cols = 4;

// Inspect each frame of row 3 (12..15) and row 4 (16..19)
console.log('=== ROW 3 (12..15) ===');
for (let c = 0; c < 4; c++) {
  const fIdx = 12 + c;
  let nonZero = 0;
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < fw; x++) {
      const px = c * fw + x;
      const py = 3 * fh + y;
      if (png.data[(py * png.width + px) * 4 + 3] > 20) nonZero++;
    }
  }
  console.log(`Frame ${fIdx}: non-transparent pixels = ${nonZero}`);
}

console.log('=== ROW 4 (16..19) ===');
for (let c = 0; c < 4; c++) {
  const fIdx = 16 + c;
  let nonZero = 0;
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < fw; x++) {
      const px = c * fw + x;
      const py = 4 * fh + y;
      if (png.data[(py * png.width + px) * 4 + 3] > 20) nonZero++;
    }
  }
  console.log(`Frame ${fIdx}: non-transparent pixels = ${nonZero}`);
}
