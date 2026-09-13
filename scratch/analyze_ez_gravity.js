import fs from 'fs';
import { PNG } from 'pngjs';

// Analyze Ezreal row 3 vs row 4
const row3 = PNG.sync.read(fs.readFileSync('d:/games/Mirror-match/scratch/ez_row_3.png'));
const row4 = PNG.sync.read(fs.readFileSync('d:/games/Mirror-match/scratch/ez_row_4.png'));

// Check center of gravity (x-offset of non-transparent pixels) for each frame in row 3 vs row 4
console.log('=== Row 3 (Frames 12..15) Frame X Centers ===');
for (let c = 0; c < 4; c++) {
  let totalX = 0, count = 0;
  for (let y = 0; y < 56; y++) {
    for (let x = 0; x < 48; x++) {
      const idx = (y * row3.width + (c * 48 + x)) * 4;
      if (row3.data[idx + 3] > 20) {
        totalX += x;
        count++;
      }
    }
  }
  console.log(`Frame ${12+c}: avg X = ${(totalX/count).toFixed(2)}`);
}

console.log('=== Row 4 (Frames 16..19) Frame X Centers ===');
for (let c = 0; c < 4; c++) {
  let totalX = 0, count = 0;
  for (let y = 0; y < 56; y++) {
    for (let x = 0; x < 48; x++) {
      const idx = (y * row4.width + (c * 48 + x)) * 4;
      if (row4.data[idx + 3] > 20) {
        totalX += x;
        count++;
      }
    }
  }
  console.log(`Frame ${16+c}: avg X = ${(totalX/count).toFixed(2)}`);
}
