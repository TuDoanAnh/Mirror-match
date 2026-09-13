import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/ezreal_spritesheet.png');
const png = PNG.sync.read(data);

const fw = 48, fh = 56;
const cols = Math.floor(png.width / fw);
const rows = Math.floor(png.height / fh);

for (let r = 0; r < rows; r++) {
  const dst = new PNG({ width: fw * cols, height: fh });
  for (let c = 0; c < cols; c++) {
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        const srcIdx = ((r * fh + y) * png.width + (c * fw + x)) * 4;
        const dstIdx = (y * (fw * cols) + (c * fw + x)) * 4;
        dst.data[dstIdx] = png.data[srcIdx];
        dst.data[dstIdx + 1] = png.data[srcIdx + 1];
        dst.data[dstIdx + 2] = png.data[srcIdx + 2];
        dst.data[dstIdx + 3] = png.data[srcIdx + 3];
      }
    }
  }
  fs.writeFileSync(`d:/games/Mirror-match/scratch/ez_row_${r}.png`, PNG.sync.write(dst));
  console.log(`Saved scratch/ez_row_${r}.png`);
}
