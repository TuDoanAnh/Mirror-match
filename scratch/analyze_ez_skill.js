import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const png = PNG.sync.read(data);

console.log(`Width: ${png.width}, Height: ${png.height}`);

// Grid check: divide into 8x8 or 4x4 or row/column scanning
// Find alpha bounding box
let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
let alphaPixels = 0;

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    const alpha = png.data[idx + 3];
    if (alpha > 10) {
      alphaPixels++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log(`Alpha pixels count: ${alphaPixels}`);
console.log(`Bounding Box: X[${minX}..${maxX}], Y[${minY}..${maxY}]`);

// Scan row histogram
const rowHistogram = new Array(png.height).fill(0);
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    if (png.data[idx + 3] > 10) rowHistogram[y]++;
  }
}

// Find non-empty row segments
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

console.log('Row segments:', rowSegments);

// For each row segment, scan column histogram
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

  console.log(`Row ${i} (${row.startY}..${row.endY}, h=${row.h}): ${colSegments.length} sprites found:`);
  colSegments.forEach((col, j) => {
    console.log(`  Sprite ${j}: X[${col.startX}..${col.endX}] (w=${col.w})`);
  });
});
