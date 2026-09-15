import fs from 'fs';
import { PNG } from 'pngjs';

const buf = fs.readFileSync('src/assets/image/Shop_Item.png');
const png = PNG.sync.read(buf);

console.log(`=== Detecting Grid Lines in ${png.width}x${png.height} ===`);

// Check vertical line color variance
const colDiffs = [];
for (let x = 1; x < png.width; x++) {
  let diff = 0;
  for (let y = 0; y < png.height; y += 4) {
    const idx1 = (y * png.width + x) * 4;
    const idx0 = (y * png.width + x - 1) * 4;
    diff += Math.abs(png.data[idx1] - png.data[idx0]) +
            Math.abs(png.data[idx1 + 1] - png.data[idx0 + 1]) +
            Math.abs(png.data[idx1 + 2] - png.data[idx0 + 2]);
  }
  colDiffs.push({ x, diff });
}

// Check horizontal line color variance
const rowDiffs = [];
for (let y = 1; y < png.height; y++) {
  let diff = 0;
  for (let x = 0; x < png.width; x += 4) {
    const idx1 = (y * png.width + x) * 4;
    const idx0 = ((y - 1) * png.width + x) * 4;
    diff += Math.abs(png.data[idx1] - png.data[idx0]) +
            Math.abs(png.data[idx1 + 1] - png.data[idx0 + 1]) +
            Math.abs(png.data[idx1 + 2] - png.data[idx0 + 2]);
  }
  rowDiffs.push({ y, diff });
}

// Top peaks in column diffs
colDiffs.sort((a, b) => b.diff - a.diff);
console.log('Top 15 Vertical border peaks (X coordinates):');
colDiffs.slice(0, 15).forEach(c => console.log(`  X=${c.x}, diff=${c.diff}`));

rowDiffs.sort((a, b) => b.diff - a.diff);
console.log('\nTop 15 Horizontal border peaks (Y coordinates):');
rowDiffs.slice(0, 15).forEach(c => console.log(`  Y=${c.y}, diff=${c.diff}`));
