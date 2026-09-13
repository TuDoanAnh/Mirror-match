import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Lux_skill.png');
const src = PNG.sync.read(data);

function cropAndCenter(minX, maxX, minY, maxY, outputPath) {
  // Find actual non-transparent bounding box
  let bMinX = maxX, bMaxX = minX, bMinY = maxY, bMaxY = minY;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = (y * src.width + x) * 4;
      if (src.data[idx + 3] > 20) {
        if (x < bMinX) bMinX = x;
        if (x > bMaxX) bMaxX = x;
        if (y < bMinY) bMinY = y;
        if (y > bMaxY) bMaxY = y;
      }
    }
  }

  const w = bMaxX - bMinX + 1;
  const h = bMaxY - bMinY + 1;
  const dim = Math.max(w, h) + 20; // square padded container
  const dst = new PNG({ width: dim, height: dim });

  const offsetX = Math.floor((dim - w) / 2);
  const offsetY = Math.floor((dim - h) / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = ((bMinY + y) * src.width + (bMinX + x)) * 4;
      const dstIdx = ((offsetY + y) * dim + (offsetX + x)) * 4;
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }

  fs.writeFileSync(outputPath, PNG.sync.write(dst));
  console.log(`Saved ${outputPath} (${dim}x${dim}, original sprite ${w}x${h})`);
}

// Frame 0 in Row 0
cropAndCenter(32, 143, 80, 368, 'd:/games/Mirror-match/src/assets/image/lux_q_single.png');
// Frame 2 in Row 0
cropAndCenter(386, 482, 80, 368, 'd:/games/Mirror-match/scratch/lux_q_f2.png');
// Frame 4 in Row 0
cropAndCenter(600, 710, 80, 368, 'd:/games/Mirror-match/scratch/lux_q_f4.png');
