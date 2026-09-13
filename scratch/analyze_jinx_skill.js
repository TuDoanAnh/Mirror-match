import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Jinx_skill.png');
const png = PNG.sync.read(data);

console.log(`Jinx_skill.png dimensions: ${png.width} x ${png.height}`);

// Check non-transparent pixel histogram by Y to identify rows
const rowHistogram = new Array(png.height).fill(0);
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) * 4;
    if (png.data[idx + 3] > 15) {
      rowHistogram[y]++;
    }
  }
}

const rows = [];
let inRow = false;
let startY = 0;
for (let y = 0; y < png.height; y++) {
  if (rowHistogram[y] > 5 && !inRow) {
    inRow = true;
    startY = y;
  } else if (rowHistogram[y] <= 5 && inRow) {
    inRow = false;
    rows.push({ minY: startY, maxY: y - 1, h: y - startY });
  }
}
if (inRow) {
  rows.push({ minY: startY, maxY: png.height - 1, h: png.height - startY });
}

console.log(`Found ${rows.length} rows:`);
rows.forEach((r, i) => {
  console.log(`Row ${i}: Y[${r.minY}..${r.maxY}] (h=${r.h})`);
});
