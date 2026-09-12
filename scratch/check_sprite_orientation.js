import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const srcPng = PNG.sync.read(data);

// Let's inspect Frame 6 of Space (X[455..621], Y[505..708]):
// Is the crescent arc concave facing left or right?
let leftPixels = 0;
let rightPixels = 0;

const midX = Math.floor((455 + 621) / 2);
for (let y = 505; y <= 708; y++) {
  for (let x = 455; x <= 621; x++) {
    const idx = (srcPng.width * y + x) << 2;
    if (srcPng.data[idx + 3] > 20) {
      if (x < midX) leftPixels++;
      else rightPixels++;
    }
  }
}

console.log(`Space F6: Left half alpha pixels = ${leftPixels}, Right half alpha pixels = ${rightPixels}`);

// If leftPixels vs rightPixels shows how the curve faces:
// Let's also check Q F8 (X[1243..1345], Y[234..289]):
let qLeftPixels = 0;
let qRightPixels = 0;
const qMidX = Math.floor((1243 + 1345) / 2);

for (let y = 234; y <= 289; y++) {
  for (let x = 1243; x <= 1345; x++) {
    const idx = (srcPng.width * y + x) << 2;
    if (srcPng.data[idx + 3] > 20) {
      if (x < qMidX) qLeftPixels++;
      else qRightPixels++;
    }
  }
}

console.log(`Q F8: Left half alpha pixels = ${qLeftPixels}, Right half alpha pixels = ${qRightPixels}`);
