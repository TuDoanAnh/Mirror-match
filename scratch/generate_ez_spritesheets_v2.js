import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const srcPng = PNG.sync.read(data);

const outDir = 'd:/games/Mirror-match/src/assets/image';

function cropToCanvas(srcX, srcY, srcW, srcH, dstCanvas, dstX, dstY) {
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

// 1. Q SKILL SPRITESHEET: F12 -> F11 -> F10 -> F9 -> F8 (5 frames)
const qFrames = [
  { f: 12, minX: 1691, maxX: 1732, minY: 234, maxY: 289 },
  { f: 11, minX: 1560, maxX: 1580, minY: 234, maxY: 289 },
  { f: 10, minX: 1456, maxX: 1481, minY: 234, maxY: 289 },
  { f: 9,  minX: 1397, maxX: 1437, minY: 234, maxY: 289 },
  { f: 8,  minX: 1243, maxX: 1345, minY: 234, maxY: 289 } // F8 Max Q
];

const qFrameW = 204;
const qFrameH = 64;
const qSheetW = qFrameW * qFrames.length;
const qSheetH = qFrameH;

const qPng = new PNG({ width: qSheetW, height: qSheetH });

qFrames.forEach((frame, i) => {
  const w = frame.maxX - frame.minX + 1;
  const h = frame.maxY - frame.minY + 1;
  const dstX = i * qFrameW + Math.floor((qFrameW - w) / 2);
  const dstY = Math.floor((qFrameH - h) / 2);

  cropToCanvas(frame.minX, frame.minY, w, h, qPng, dstX, dstY);
});

fs.writeFileSync(path.join(outDir, 'ezreal_q_spritesheet.png'), PNG.sync.write(qPng));
console.log(`Saved ezreal_q_spritesheet.png (${qSheetW}x${qSheetH}, ${qFrames.length} frames [F12->F8])`);


// 2. SPACE SKILL SPRITESHEET: F12 -> F11 -> F10 -> F9 -> F8 -> F7 -> F6 (7 frames)
const spaceFrames = [
  { f: 12, minX: 1669, maxX: 1727, minY: 731, maxY: 767 },
  { f: 11, minX: 1553, maxX: 1611, minY: 731, maxY: 767 },
  { f: 10, minX: 1444, maxX: 1518, minY: 505, maxY: 708 },
  { f: 9,  minX: 1272, maxX: 1429, minY: 505, maxY: 708 },
  { f: 8,  minX: 1092, maxX: 1269, minY: 505, maxY: 708 },
  { f: 7,  minX: 673,  maxX: 1090, minY: 505, maxY: 708 },
  { f: 6,  minX: 455,  maxX: 621,  minY: 505, maxY: 708 } // F6 Max Space
];

const spaceFrameW = 424;
const spaceFrameH = 208;
const spaceSheetW = spaceFrameW * spaceFrames.length;
const spaceSheetH = spaceFrameH;

const spacePng = new PNG({ width: spaceSheetW, height: spaceSheetH });

spaceFrames.forEach((frame, i) => {
  const w = frame.maxX - frame.minX + 1;
  const h = frame.maxY - frame.minY + 1;
  const dstX = i * spaceFrameW + Math.floor((spaceFrameW - w) / 2);
  const dstY = Math.floor((spaceFrameH - h) / 2);

  cropToCanvas(frame.minX, frame.minY, w, h, spacePng, dstX, dstY);
});

fs.writeFileSync(path.join(outDir, 'ezreal_space_spritesheet.png'), PNG.sync.write(spacePng));
console.log(`Saved ezreal_space_spritesheet.png (${spaceSheetW}x${spaceSheetH}, ${spaceFrames.length} frames [F12->F6])`);
