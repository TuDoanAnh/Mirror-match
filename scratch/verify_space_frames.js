import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const png = PNG.sync.read(data);

// Let's inspect the row of Space (Row 5: Y 500..710) and check if there are 13 frames or 9 frames or if there's another row!
// Let's scan all alpha segments in Y 490..780
const rowHistogram = new Array(png.height).fill(0);
for (let y = 490; y < 780; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    if (png.data[idx + 3] > 10) rowHistogram[y]++;
  }
}

const colHistogram = new Array(png.width).fill(0);
for (let x = 0; x < png.width; x++) {
  for (let y = 500; y < 780; y++) {
    const idx = (png.width * y + x) << 2;
    if (png.data[idx + 3] > 10) colHistogram[x]++;
  }
}

// Find all sprite bounds in Y:500..780
const sprites = [];
let inSprite = false;
let startX = 0;
for (let x = 0; x < png.width; x++) {
  if (colHistogram[x] > 5 && !inSprite) {
    inSprite = true;
    startX = x;
  } else if (colHistogram[x] <= 5 && inSprite) {
    inSprite = false;
    sprites.push({ startX, endX: x - 1, w: x - startX });
  }
}
if (inSprite) sprites.push({ startX, endX: png.width - 1, w: png.width - startX });

console.log(`Found ${sprites.length} sprites in Space region:`);
sprites.forEach((s, idx) => {
  console.log(`  Frame index ${idx}: X[${s.startX}..${s.endX}] (w=${s.w})`);
});
