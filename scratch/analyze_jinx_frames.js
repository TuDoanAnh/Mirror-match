import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Jinx_skill.png');
const png = PNG.sync.read(data);

function inspectRowFrames(minY, maxY, rowName) {
  console.log(`\n=== Inspecting ${rowName} (Y[${minY}..${maxY}]) ===`);
  const colHistogram = new Array(png.width).fill(0);
  for (let x = 0; x < png.width; x++) {
    for (let y = minY; y <= maxY; y++) {
      const idx = (png.width * y + x) * 4;
      if (png.data[idx + 3] > 15) {
        colHistogram[x]++;
      }
    }
  }

  const frames = [];
  let inFrame = false;
  let startX = 0;
  for (let x = 0; x < png.width; x++) {
    if (colHistogram[x] > 2 && !inFrame) {
      inFrame = true;
      startX = x;
    } else if (colHistogram[x] <= 2 && inFrame) {
      inFrame = false;
      if (x - startX > 10) {
        frames.push({ minX: startX, maxX: x - 1, w: x - startX });
      }
    }
  }
  if (inFrame && png.width - startX > 10) {
    frames.push({ minX: startX, maxX: png.width - 1, w: png.width - startX });
  }

  console.log(`Found ${frames.length} frames:`);
  frames.forEach((f, i) => {
    console.log(`  Frame ${i}: X[${f.minX}..${f.maxX}] (w=${f.w})`);
  });
  return frames;
}

inspectRowFrames(79, 212, 'Row 0 (Rocket Projectiles)');
inspectRowFrames(307, 510, 'Row 1 (Explosion AOE)');
