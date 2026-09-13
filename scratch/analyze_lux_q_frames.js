import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Lux_skill.png');
const png = PNG.sync.read(data);

function inspectRow(minY, maxY, name) {
  console.log(`\n=== Inspecting ${name} (Y[${minY}..${maxY}]) ===`);
  const colHistogram = new Array(png.width).fill(0);
  for (let x = 0; x < png.width; x++) {
    for (let y = minY; y <= maxY; y++) {
      const idx = (png.width * y + x) << 2;
      if (png.data[idx + 3] > 15) colHistogram[x]++;
    }
  }

  const frames = [];
  let inFrame = false;
  let startX = 0;
  for (let x = 0; x < png.width; x++) {
    if (colHistogram[x] > 3 && !inFrame) {
      inFrame = true;
      startX = x;
    } else if (colHistogram[x] <= 3 && inFrame) {
      inFrame = false;
      if (x - startX > 15) { // Filter out tiny noise dots (< 15px)
        frames.push({ minX: startX, maxX: x - 1, w: x - startX });
      }
    }
  }
  if (inFrame && png.width - startX > 15) {
    frames.push({ minX: startX, maxX: png.width - 1, w: png.width - startX });
  }

  console.log(`Found ${frames.length} main frames:`);
  frames.forEach((f, i) => {
    console.log(`  Frame ${i}: X[${f.minX}..${f.maxX}] (w=${f.w})`);
  });
  return frames;
}

inspectRow(80, 368, 'Lux Q Projectile (Row 0)');
inspectRow(405, 614, 'Lux Q Root Snare (Row 2)');
inspectRow(683, 952, 'Lux Space Beam (Row 4)');
