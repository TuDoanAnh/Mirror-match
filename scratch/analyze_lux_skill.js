import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Lux_skill.png');
const png = PNG.sync.read(data);

console.log(`Width: ${png.width}, Height: ${png.height}`);

// Scan row histogram to find non-empty Y bands
const rowHistogram = new Array(png.height).fill(0);
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    if (png.data[idx + 3] > 10) rowHistogram[y]++;
  }
}

const rowSegments = [];
let inRow = false;
let startY = 0;
for (let y = 0; y < png.height; y++) {
  if (rowHistogram[y] > 5 && !inRow) {
    inRow = true;
    startY = y;
  } else if (rowHistogram[y] <= 5 && inRow) {
    inRow = false;
    rowSegments.push({ startY, endY: y - 1, h: y - startY });
  }
}
if (inRow) rowSegments.push({ startY, endY: png.height - 1, h: png.height - startY });

console.log('Row segments found in Lux_skill.png:');
rowSegments.forEach((row, i) => {
  const colHistogram = new Array(png.width).fill(0);
  for (let x = 0; x < png.width; x++) {
    for (let y = row.startY; y <= row.endY; y++) {
      const idx = (png.width * y + x) << 2;
      if (png.data[idx + 3] > 10) colHistogram[x]++;
    }
  }

  const colSegments = [];
  let inCol = false;
  let startX = 0;
  for (let x = 0; x < png.width; x++) {
    if (colHistogram[x] > 5 && !inCol) {
      inCol = true;
      startX = x;
    } else if (colHistogram[x] <= 5 && inCol) {
      inCol = false;
      colSegments.push({ startX, endX: x - 1, w: x - startX });
    }
  }
  if (inCol) colSegments.push({ startX, endX: png.width - 1, w: png.width - startX });

  console.log(`Row ${i} (Y[${row.startY}..${row.endY}], h=${row.h}): ${colSegments.length} sprites found:`);
  colSegments.forEach((col, j) => {
    console.log(`  Sprite ${j}: X[${col.startX}..${col.endX}] (w=${col.w})`);
  });
});
