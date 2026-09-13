import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Lux_skill.png');
const srcPng = PNG.sync.read(data);

const outDir = 'd:/games/Mirror-match/scratch/lux_crops';
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

// 1. Top: Lux Q skill
crop(0, 80, srcPng.width, 290, path.join(outDir, 'lux_q_row.png'));

// 2. Middle: Lux Q Root / Snare effect on hit
crop(0, 400, srcPng.width, 220, path.join(outDir, 'lux_root_row.png'));

// 3. Bottom: Lux Space ultimate Final Spark beam
crop(0, 680, srcPng.width, 280, path.join(outDir, 'lux_space_row.png'));
