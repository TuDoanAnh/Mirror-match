import fs from 'fs';
import { PNG } from 'pngjs';

function checkRocketOrientation(file) {
  const data = fs.readFileSync(file);
  const png = PNG.sync.read(data);
  let leftSum = 0, rightSum = 0;
  const midX = png.width / 2;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const a = png.data[(y * png.width + x) * 4 + 3];
      if (a > 20) {
        if (x < midX) leftSum += a;
        else rightSum += a;
      }
    }
  }
  console.log(`${file}: leftSum=${leftSum}, rightSum=${rightSum}`);
}

checkRocketOrientation('d:/games/Mirror-match/scratch/jinx_r_f6.png');
checkRocketOrientation('d:/games/Mirror-match/scratch/jinx_r_f7.png');
checkRocketOrientation('d:/games/Mirror-match/scratch/jinx_r_f8.png');
