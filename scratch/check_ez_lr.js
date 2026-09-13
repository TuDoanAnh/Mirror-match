import fs from 'fs';
import { PNG } from 'pngjs';

function inspectLeftRight(file) {
  const data = fs.readFileSync(file);
  const png = PNG.sync.read(data);
  let left = 0, right = 0;
  const midX = png.width / 2;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const a = png.data[(y * png.width + x) * 4 + 3];
      if (a > 20) {
        if (x < midX) left += a;
        else right += a;
      }
    }
  }
  console.log(`${file}: left=${left}, right=${right}`);
}

for (let i = 12; i <= 15; i++) inspectLeftRight(`d:/games/Mirror-match/scratch/ez_walk_left_${i}.png`);
for (let i = 16; i <= 19; i++) inspectLeftRight(`d:/games/Mirror-match/scratch/ez_walk_right_${i}.png`);
