import fs from 'fs';
import { PNG } from 'pngjs';

function inspectSheet(file, hero) {
  const data = fs.readFileSync(file);
  const png = PNG.sync.read(data);
  console.log(`\n=== ${hero} (${file}) ${png.width}x${png.height} ===`);
  const frameW = 48;
  const frameH = 56;
  const cols = Math.floor(png.width / frameW);
  const rows = Math.floor(png.height / frameH);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fIdx = r * cols + c;
      let nonZero = 0;
      let minX = frameW, maxX = 0;
      for (let y = 0; y < frameH; y++) {
        for (let x = 0; x < frameW; x++) {
          const px = c * frameW + x;
          const py = r * frameH + y;
          const alpha = png.data[(py * png.width + px) * 4 + 3];
          if (alpha > 20) {
            nonZero++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }
      }
      console.log(`  Frame ${fIdx} (Row ${r}, Col ${c}): non-transparent pixels = ${nonZero}, bbox X[${minX}..${maxX}]`);
    }
  }
}

inspectSheet('d:/games/Mirror-match/src/assets/image/ezreal_spritesheet.png', 'ezreal');
inspectSheet('d:/games/Mirror-match/src/assets/image/lux_spritesheet.png', 'lux');
inspectSheet('d:/games/Mirror-match/src/assets/image/jinx_spritesheet.png', 'jinx');
