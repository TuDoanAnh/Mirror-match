import fs from 'fs';
import { PNG } from 'pngjs';

const buf = fs.readFileSync('src/assets/image/Shop_Item.png');
const png = PNG.sync.read(buf);

console.log(`=== Analyzing Shop_Item.png (${png.width}x${png.height}) ===`);

// Check horizontal rows pixel density / presence
const rowHasPixels = new Array(png.height).fill(false);
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    if (png.data[(y * png.width + x) * 4 + 3] > 10) {
      rowHasPixels[y] = true;
      break;
    }
  }
}

const yRanges = [];
let inRange = false;
let startY = 0;
for (let y = 0; y < png.height; y++) {
  if (rowHasPixels[y] && !inRange) {
    inRange = true;
    startY = y;
  } else if (!rowHasPixels[y] && inRange) {
    inRange = false;
    if (y - startY > 5) {
      yRanges.push({ startY, endY: y - 1, height: y - startY });
    }
  }
}
if (inRange) {
  yRanges.push({ startY, endY: png.height - 1, height: png.height - startY });
}

console.log(`Found ${yRanges.length} horizontal bands:`);
yRanges.forEach((r, idx) => {
  console.log(` Band ${idx + 1}: Y=${r.startY}..${r.endY} (H=${r.height})`);
});

// Check column pixel presence
const colHasPixels = new Array(png.width).fill(false);
for (let x = 0; x < png.width; x++) {
  for (let y = 0; y < png.height; y++) {
    if (png.data[(y * png.width + x) * 4 + 3] > 10) {
      colHasPixels[x] = true;
      break;
    }
  }
}

const xRanges = [];
inRange = false;
let startX = 0;
for (let x = 0; x < png.width; x++) {
  if (colHasPixels[x] && !inRange) {
    inRange = true;
    startX = x;
  } else if (!colHasPixels[x] && inRange) {
    inRange = false;
    if (x - startX > 5) {
      xRanges.push({ startX, endX: x - 1, width: x - startX });
    }
  }
}
if (inRange) {
  xRanges.push({ startX, endX: png.width - 1, width: png.width - startX });
}

console.log(`Found ${xRanges.length} vertical bands:`);
xRanges.forEach((r, idx) => {
  console.log(` Col Band ${idx + 1}: X=${r.startX}..${r.endX} (W=${r.width})`);
});
