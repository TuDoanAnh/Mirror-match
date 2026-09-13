import fs from 'fs';
import { PNG } from 'pngjs';

for (let r = 0; r < 6; r++) {
  const data = fs.readFileSync(`d:/games/Mirror-match/scratch/ez_row_${r}.png`);
  const png = PNG.sync.read(data);
  let left = 0, right = 0, top = 0, bottom = 0;
  const midX = png.width / 2;
  const midY = png.height / 2;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const a = png.data[(y * png.width + x) * 4 + 3];
      if (a > 20) {
        if (x < midX) left += a;
        else right += a;
        if (y < midY) top += a;
        else bottom += a;
      }
    }
  }
  console.log(`Row ${r}: left=${left}, right=${right}, top=${top}, bottom=${bottom}`);
}
