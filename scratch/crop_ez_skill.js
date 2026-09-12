import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const srcPng = PNG.sync.read(data);

const outDir = 'd:/games/Mirror-match/scratch/crops';
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
  console.log(`Saved ${outFile} (${w}x${h})`);
}

// Crop main rows:
crop(0, 140, srcPng.width, 240, path.join(outDir, 'row_top_q.png'));
crop(0, 430, srcPng.width, 360, path.join(outDir, 'row_bottom_ult.png'));
