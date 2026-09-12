import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const srcPng = PNG.sync.read(data);

const outDir = 'd:/games/Mirror-match/scratch/frames';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function crop(minX, minY, maxX, maxY, outFile) {
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const dst = new PNG({ width: w, height: h });
  for (let cy = 0; cy < h; cy++) {
    for (let cx = 0; cx < w; cx++) {
      const sx = minX + cx;
      const sy = minY + cy;
      const sIdx = (srcPng.width * sy + sx) << 2;
      const dIdx = (w * cy + cx) << 2;
      dst.data[dIdx] = srcPng.data[sIdx];
      dst.data[dIdx + 1] = srcPng.data[sIdx + 1];
      dst.data[dIdx + 2] = srcPng.data[sIdx + 2];
      dst.data[dIdx + 3] = srcPng.data[sIdx + 3];
    }
  }
  fs.writeFileSync(outFile, PNG.sync.write(dst));
}

// Q skill boxes in row (Y: 236..286)
// From left to right on sheet:
const qBoxesOnSheet = [
  { minX: 54, maxX: 85 },     // index 0
  { minX: 143, maxX: 178 },   // index 1
  { minX: 239, maxX: 321 },   // index 2
  { minX: 360, maxX: 459 },   // index 3
  { minX: 498, maxX: 621 },   // index 4
  { minX: 655, maxX: 786 },   // index 5
  { minX: 848, maxX: 1014 },  // index 6
  { minX: 1033, maxX: 1231 }, // index 7
  { minX: 1243, maxX: 1345 }, // index 8
  { minX: 1397, maxX: 1437 }, // index 9
  { minX: 1456, maxX: 1481 }, // index 10
  { minX: 1560, maxX: 1580 }, // index 11
  { minX: 1691, maxX: 1732 }  // index 12
];

// Let's label them from F0 (index 0) to F12 (index 12)
qBoxesOnSheet.forEach((b, idx) => {
  crop(b.minX, 234, b.maxX, 289, path.join(outDir, `q_index_${idx}_w${b.maxX - b.minX + 1}.png`));
});

// SPACE skill boxes in row (Y: 505..708)
const spaceBoxesOnSheet = [
  { minX: 53, maxX: 95 },     // index 0
  { minX: 114, maxX: 183 },   // index 1
  { minX: 201, maxX: 292 },   // index 2
  { minX: 306, maxX: 453 },   // index 3
  { minX: 455, maxX: 621 },   // index 4
  { minX: 673, maxX: 1090 },  // index 5
  { minX: 1092, maxX: 1269 }, // index 6
  { minX: 1272, maxX: 1429 }, // index 7
  { minX: 1444, maxX: 1518 }  // index 8
];

spaceBoxesOnSheet.forEach((b, idx) => {
  crop(b.minX, 505, b.maxX, 708, path.join(outDir, `space_index_${idx}_w${b.maxX - b.minX + 1}.png`));
});

console.log('Done extracting individual frame files.');
