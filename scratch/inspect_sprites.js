import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const srcPng = PNG.sync.read(data);

const outDir = 'd:/games/Mirror-match/scratch/sprites';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function crop(x, y, w, h, outFile) {
  const dstPng = new PNG({ width: w, height: h });
  for (let cy = 0; cy < h; cy++) {
    for (let cx = 0; cx < w; cx++) {
      const srcX = x + cx;
      const srcY = y + cy;
      if (srcX >= 0 && srcX < srcPng.width && srcY >= 0 && srcY < srcPng.height) {
        const srcIdx = (srcPng.width * srcY + srcX) << 2;
        const dstIdx = (w * cy + cx) << 2;
        dstPng.data[dstIdx] = srcPng.data[srcIdx];
        dstPng.data[dstIdx + 1] = srcPng.data[srcIdx + 1];
        dstPng.data[dstIdx + 2] = srcPng.data[srcIdx + 2];
        dstPng.data[dstIdx + 3] = srcPng.data[srcIdx + 3];
      }
    }
  }
  const buffer = PNG.sync.write(dstPng);
  fs.writeFileSync(outFile, buffer);
}

// Let's inspect equal-width grid vs isolated sprite bounding boxes
console.log('--- Inspecting Row 1 (Q Skill) ---');
// Let's check Row 1 (y: 220 to 300)
// Let's check Row 3 (y: 310 to 380)
// Let's check Row 5 (y: 500 to 710) - Trueshot Barrage (Space)
// Let's check Row 6 (y: 720 to 780)

crop(0, 220, srcPng.width, 80, path.join(outDir, 'q_row1.png'));
crop(0, 310, srcPng.width, 70, path.join(outDir, 'q_row2.png'));
crop(0, 500, srcPng.width, 220, path.join(outDir, 'space_row1.png'));
crop(0, 720, srcPng.width, 70, path.join(outDir, 'space_row2.png'));

console.log('Done cropping row sections.');
