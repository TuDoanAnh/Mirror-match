import fs from 'fs';
import { PNG } from 'pngjs';

function inspectOrientation(file) {
  const data = fs.readFileSync(file);
  const png = PNG.sync.read(data);
  let leftSum = 0, rightSum = 0, topSum = 0, bottomSum = 0;
  const midX = png.width / 2;
  const midY = png.height / 2;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const a = png.data[(y * png.width + x) * 4 + 3];
      if (a > 20) {
        if (x < midX) leftSum += a;
        else rightSum += a;
        if (y < midY) topSum += a;
        else bottomSum += a;
      }
    }
  }
  console.log(`${file}: left=${leftSum}, right=${rightSum}, top=${topSum}, bottom=${bottomSum}`);
}

inspectOrientation('d:/games/Mirror-match/src/assets/image/lux_q_single.png');
inspectOrientation('d:/games/Mirror-match/scratch/lux_q_f2.png');
inspectOrientation('d:/games/Mirror-match/scratch/lux_q_f4.png');
