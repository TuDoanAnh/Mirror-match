import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const srcPng = PNG.sync.read(data);

const outDir = 'd:/games/Mirror-match/src/assets/image';

function cropToCanvasFlipped(srcX, srcY, srcW, srcH, dstCanvas, dstX, dstY) {
  for (let cy = 0; cy < srcH; cy++) {
    for (let cx = 0; cx < srcW; cx++) {
      const sx = srcX + (srcW - 1 - cx);
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

// Q SKILL SPRITESHEET: F12 -> F11 -> F10 -> F9 -> F7 (5 frames, max held frame is F7!)
const qFrames = [
  { f: 12, minX: 1691, maxX: 1732, minY: 234, maxY: 289 },
  { f: 11, minX: 1560, maxX: 1580, minY: 234, maxY: 289 },
  { f: 10, minX: 1456, maxX: 1481, minY: 234, maxY: 289 },
  { f: 9,  minX: 1397, maxX: 1437, minY: 234, maxY: 289 },
  { f: 7,  minX: 1033, maxX: 1231, minY: 234, maxY: 289 } // F7 Max Q Energy Bolt!
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

  cropToCanvasFlipped(frame.minX, frame.minY, w, h, qPng, dstX, dstY);
});

fs.writeFileSync(path.join(outDir, 'ezreal_q_spritesheet.png'), PNG.sync.write(qPng));
console.log(`Saved Ezreal Q Spritesheet with F7 as max frame (${qSheetW}x${qSheetH}, 5 frames)`);
