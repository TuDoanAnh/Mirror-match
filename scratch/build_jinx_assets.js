import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Jinx_skill.png');
const src = PNG.sync.read(data);

function cropAndSave(minX, maxX, minY, maxY, outputPath) {
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
  const pad = 10;
  const dstW = w + pad * 2;
  const dstH = h + pad * 2;
  const dst = new PNG({ width: dstW, height: dstH });

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = ((bMinY + y) * src.width + (bMinX + x)) * 4;
      const dstIdx = ((y + pad) * dstW + (x + pad)) * 4;
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }

  fs.writeFileSync(outputPath, PNG.sync.write(dst));
  console.log(`Saved ${outputPath} (${dstW}x${dstH})`);
}

// 1. Jinx Q Rocket (Frame 6 of Row 0)
cropAndSave(701, 923, 79, 212, 'd:/games/Mirror-match/src/assets/image/jinx_rocket_projectile.png');

// 2. Jinx Space Rocket (Frame 8 of Row 0)
cropAndSave(1167, 1499, 79, 212, 'd:/games/Mirror-match/src/assets/image/jinx_space_rocket.png');

// 3. Jinx Explosion Spritesheet (Row 1 frames)
const expFrames = [
  { minX: 52, maxX: 131, minY: 307, maxY: 510 },
  { minX: 159, maxX: 273, minY: 307, maxY: 510 },
  { minX: 304, maxX: 443, minY: 307, maxY: 510 },
  { minX: 477, maxX: 662, minY: 307, maxY: 510 },
  { minX: 691, maxX: 870, minY: 307, maxY: 510 },
  { minX: 915, maxX: 1085, minY: 307, maxY: 510 }
];

const frameSize = 220;
const expSheet = new PNG({ width: frameSize * expFrames.length, height: frameSize });

expFrames.forEach((f, i) => {
  let bMinX = f.maxX, bMaxX = f.minX, bMinY = f.maxY, bMaxY = f.minY;
  for (let y = f.minY; y <= f.maxY; y++) {
    for (let x = f.minX; x <= f.maxX; x++) {
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
  const offsetX = i * frameSize + Math.floor((frameSize - w) / 2);
  const offsetY = Math.floor((frameSize - h) / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = ((bMinY + y) * src.width + (bMinX + x)) * 4;
      const dstIdx = ((offsetY + y) * expSheet.width + (offsetX + x)) * 4;
      expSheet.data[dstIdx] = src.data[srcIdx];
      expSheet.data[dstIdx + 1] = src.data[srcIdx + 1];
      expSheet.data[dstIdx + 2] = src.data[srcIdx + 2];
      expSheet.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }
});

fs.writeFileSync('d:/games/Mirror-match/src/assets/image/jinx_explosion_spritesheet.png', PNG.sync.write(expSheet));
console.log(`Saved d:/games/Mirror-match/src/assets/image/jinx_explosion_spritesheet.png (${expSheet.width}x${expSheet.height})`);
