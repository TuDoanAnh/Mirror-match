import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Lux_skill.png');
const srcPng = PNG.sync.read(data);

const outDir = 'd:/games/Mirror-match/src/assets/image';

function copySubImage(srcX, srcY, srcW, srcH, dstCanvas, dstX, dstY) {
  for (let cy = 0; cy < srcH; cy++) {
    for (let cx = 0; cx < srcW; cx++) {
      const sx = srcX + cx;
      const sy = srcY + cy;
      if (sx >= 0 && sx < srcPng.width && sy >= 0 && sy < srcPng.height) {
        const sIdx = (srcPng.width * sy + sx) << 2;
        const dX = dstX + cx;
        const dY = dstY + cy;
        const dIdx = (dstCanvas.width * dY + dX) << 2;

        dstCanvas.data[dIdx] = srcPng.data[sIdx];
        dstCanvas.data[dIdx + 1] = srcPng.data[sIdx + 1];
        dstCanvas.data[dIdx + 2] = srcPng.data[sIdx + 2];
        dstCanvas.data[dIdx + 3] = srcPng.data[sIdx + 3];
      }
    }
  }
}

// 1. LUX Q PROJECTILE SPRITESHEET (Row 0: Y[80..368])
const qFrames = [
  { minX: 32, maxX: 143 },
  { minX: 153, maxX: 267 },
  { minX: 271, maxX: 366 },
  { minX: 386, maxX: 482 },
  { minX: 490, maxX: 589 },
  { minX: 600, maxX: 710 },
  { minX: 729, maxX: 832 },
  { minX: 848, maxX: 958 },
  { minX: 971, maxX: 1094 },
  { minX: 1101, maxX: 1229 }
];

const qFrameW = 160;
const qFrameH = 160;
const qSheetW = qFrameW * qFrames.length;
const qSheetH = qFrameH;
const qPng = new PNG({ width: qSheetW, height: qSheetH });

qFrames.forEach((f, i) => {
  const w = f.maxX - f.minX + 1;
  const h = 280;
  const startY = 85;

  const dstX = i * qFrameW + Math.floor((qFrameW - w) / 2);
  const dstY = Math.floor((qFrameH - 160) / 2);

  copySubImage(f.minX, startY, w, Math.min(h, 160), qPng, dstX, Math.max(0, dstY));
});

fs.writeFileSync(path.join(outDir, 'lux_q_spritesheet.png'), PNG.sync.write(qPng));
console.log(`Saved lux_q_spritesheet.png (${qSheetW}x${qSheetH})`);


// 2. LUX ROOT SNARE SPRITESHEET (Row 2: Y[405..614])
const rootFrames = [
  { minX: 39, maxX: 172 },
  { minX: 221, maxX: 386 },
  { minX: 424, maxX: 596 },
  { minX: 632, maxX: 829 },
  { minX: 855, maxX: 1060 },
  { minX: 1101, maxX: 1282 },
  { minX: 1321, maxX: 1408 },
  { minX: 1415, maxX: 1488 }
];

const rootFrameW = 210;
const rootFrameH = 210;
const rootSheetW = rootFrameW * rootFrames.length;
const rootSheetH = rootFrameH;
const rootPng = new PNG({ width: rootSheetW, height: rootSheetH });

rootFrames.forEach((f, i) => {
  const w = f.maxX - f.minX + 1;
  const h = 205;
  const startY = 405;

  const dstX = i * rootFrameW + Math.floor((rootFrameW - w) / 2);
  const dstY = Math.floor((rootFrameH - h) / 2);

  copySubImage(f.minX, startY, w, h, rootPng, dstX, Math.max(0, dstY));
});

fs.writeFileSync(path.join(outDir, 'lux_root_spritesheet.png'), PNG.sync.write(rootPng));
console.log(`Saved lux_root_spritesheet.png (${rootSheetW}x${rootSheetH})`);


// 3. LUX SPACE ULTIMATE BEAM (Row 4: Y[683..952])
// Final Spark laser beam (X[50..1515], Y[683..952])
const spaceBeamW = 1460;
const spaceBeamH = 270;
const spacePng = new PNG({ width: spaceBeamW, height: spaceBeamH });

copySubImage(55, 683, spaceBeamW, spaceBeamH, spacePng, 0, 0);

fs.writeFileSync(path.join(outDir, 'lux_space_beam.png'), PNG.sync.write(spacePng));
console.log(`Saved lux_space_beam.png (${spaceBeamW}x${spaceBeamH})`);
