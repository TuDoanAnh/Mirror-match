import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const srcPng = PNG.sync.read(data);

const outDir = 'd:/games/Mirror-match/src/assets/image';

// --- 1. Q SKILL ANIMATION SPRITESHEET ---
// Row 1 (y: 230..290)
const qBoxes = [
  { minX: 54, maxX: 85 },
  { minX: 143, maxX: 178 },
  { minX: 239, maxX: 321 },
  { minX: 360, maxX: 459 },
  { minX: 498, maxX: 621 },
  { minX: 655, maxX: 786 },
  { minX: 848, maxX: 1014 },
  { minX: 1033, maxX: 1231 },
  { minX: 1243, maxX: 1345 },
  { minX: 1397, maxX: 1437 },
  { minX: 1456, maxX: 1481 },
  { minX: 1560, maxX: 1580 },
  { minX: 1691, maxX: 1732 }
];

const qFrameW = 204;
const qFrameH = 64;
const qSheetW = qFrameW * qBoxes.length;
const qSheetH = qFrameH;

const qPng = new PNG({ width: qSheetW, height: qSheetH });

qBoxes.forEach((box, i) => {
  const w = box.maxX - box.minX + 1;
  const h = 55;
  const startY = 234;

  const destOffsetX = i * qFrameW + Math.floor((qFrameW - w) / 2);
  const destOffsetY = Math.floor((qFrameH - h) / 2);

  for (let cy = 0; cy < h; cy++) {
    for (let cx = 0; cx < w; cx++) {
      const sx = box.minX + cx;
      const sy = startY + cy;
      if (sx >= 0 && sx < srcPng.width && sy >= 0 && sy < srcPng.height) {
        const sIdx = (srcPng.width * sy + sx) << 2;
        const dX = destOffsetX + cx;
        const dY = destOffsetY + cy;
        const dIdx = (qSheetW * dY + dX) << 2;

        qPng.data[dIdx] = srcPng.data[sIdx];
        qPng.data[dIdx + 1] = srcPng.data[sIdx + 1];
        qPng.data[dIdx + 2] = srcPng.data[sIdx + 2];
        qPng.data[dIdx + 3] = srcPng.data[sIdx + 3];
      }
    }
  }
});

fs.writeFileSync(path.join(outDir, 'ezreal_q_spritesheet.png'), PNG.sync.write(qPng));
console.log(`Saved ezreal_q_spritesheet.png (${qSheetW}x${qSheetH}, ${qBoxes.length} frames of ${qFrameW}x${qFrameH})`);

// --- 2. SPACE SKILL ANIMATION SPRITESHEET ---
// Row 5 (y: 505..708)
const spaceBoxes = [
  { minX: 53, maxX: 95 },
  { minX: 114, maxX: 183 },
  { minX: 201, maxX: 292 },
  { minX: 306, maxX: 453 },
  { minX: 455, maxX: 621 },
  { minX: 673, maxX: 1090 },
  { minX: 1092, maxX: 1269 },
  { minX: 1272, maxX: 1429 },
  { minX: 1444, maxX: 1518 }
];

const spaceFrameW = 424;
const spaceFrameH = 208;
const spaceSheetW = spaceFrameW * spaceBoxes.length;
const spaceSheetH = spaceFrameH;

const spacePng = new PNG({ width: spaceSheetW, height: spaceSheetH });

spaceBoxes.forEach((box, i) => {
  const w = box.maxX - box.minX + 1;
  const h = 204;
  const startY = 505;

  const destOffsetX = i * spaceFrameW + Math.floor((spaceFrameW - w) / 2);
  const destOffsetY = Math.floor((spaceFrameH - h) / 2);

  for (let cy = 0; cy < h; cy++) {
    for (let cx = 0; cx < w; cx++) {
      const sx = box.minX + cx;
      const sy = startY + cy;
      if (sx >= 0 && sx < srcPng.width && sy >= 0 && sy < srcPng.height) {
        const sIdx = (srcPng.width * sy + sx) << 2;
        const dX = destOffsetX + cx;
        const dY = destOffsetY + cy;
        const dIdx = (spaceSheetW * dY + dX) << 2;

        spacePng.data[dIdx] = srcPng.data[sIdx];
        spacePng.data[dIdx + 1] = srcPng.data[sIdx + 1];
        spacePng.data[dIdx + 2] = srcPng.data[sIdx + 2];
        spacePng.data[dIdx + 3] = srcPng.data[sIdx + 3];
      }
    }
  }
});

fs.writeFileSync(path.join(outDir, 'ezreal_space_spritesheet.png'), PNG.sync.write(spacePng));
console.log(`Saved ezreal_space_spritesheet.png (${spaceSheetW}x${spaceSheetH}, ${spaceBoxes.length} frames of ${spaceFrameW}x${spaceFrameH})`);
