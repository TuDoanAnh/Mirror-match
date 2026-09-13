import fs from 'fs';
import { PNG } from 'pngjs';

function compareSheet(file, hero) {
  const data = fs.readFileSync(file);
  const png = PNG.sync.read(data);
  const fw = 48, fh = 56;
  const cols = 4;
  
  let diffUnflipped = 0;
  let diffFlipped = 0;

  for (let c = 0; c < cols; c++) {
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        // Row 3 (Left)
        const px3 = c * fw + x;
        const py3 = 3 * fh + y;
        const a3 = png.data[(py3 * png.width + px3) * 4 + 3];

        // Row 4 (Right)
        const px4 = c * fw + x;
        const py4 = 4 * fh + y;
        const a4 = png.data[(py4 * png.width + px4) * 4 + 3];
        diffUnflipped += Math.abs(a3 - a4);

        // Flipped Row 4
        const fpx4 = c * fw + (fw - 1 - x);
        const fa4 = png.data[(py4 * png.width + fpx4) * 4 + 3];
        diffFlipped += Math.abs(a3 - fa4);
      }
    }
  }

  console.log(`${hero}: Unflipped diff = ${diffUnflipped}, Flipped diff = ${diffFlipped}`);
}

compareSheet('d:/games/Mirror-match/src/assets/image/ezreal_spritesheet.png', 'Ezreal');
compareSheet('d:/games/Mirror-match/src/assets/image/lux_spritesheet.png', 'Lux');
compareSheet('d:/games/Mirror-match/src/assets/image/jinx_spritesheet.png', 'Jinx');
