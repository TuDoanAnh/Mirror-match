import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Jinx_skill.png');
const src = PNG.sync.read(data);

function cropAndCenter(minX, maxX, minY, maxY, outputPath) {
  let bMinX = maxX, bMaxX = minX, bMinY = maxY, bMaxY = minY;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = (y * src.width + x) * 4;
      if (src.data[idx + 3] > 15) {
        if (x < bMinX) bMinX = x;
        if (x > bMaxX) bMaxX = x;
        if (y < bMinY) bMinY = y;
        if (y > bMaxY) bMaxY = y;
      }
    }
  }

  const w = bMaxX - bMinX + 1;
  const h = bMaxY - bMinY + 1;
  const dim = Math.max(w, h) + 20;
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
  console.log(`Saved ${outputPath} (dim=${dim}x${dim}, original=${w}x${h})`);
}

// Row 0 Rocket frames
cropAndCenter(701, 923, 79, 212, 'd:/games/Mirror-match/scratch/jinx_r_f6.png');
cropAndCenter(931, 1130, 79, 212, 'd:/games/Mirror-match/scratch/jinx_r_f7.png');
cropAndCenter(1167, 1499, 79, 212, 'd:/games/Mirror-match/scratch/jinx_r_f8.png');

// Row 1 Explosion frames
const expBounds = [
  { minX: 52, maxX: 131 },
  { minX: 159, maxX: 273 },
  { minX: 304, maxX: 443 },
  { minX: 477, maxX: 662 },
  { minX: 691, maxX: 870 },
  { minX: 915, maxX: 1085 },
];

expBounds.forEach((b, i) => {
  cropAndCenter(b.minX, b.maxX, 307, 510, `d:/games/Mirror-match/scratch/jinx_exp_${i}.png`);
});
