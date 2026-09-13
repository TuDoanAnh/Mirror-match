import fs from 'fs';
import { PNG } from 'pngjs';

function inspectRowByRow(file, heroName) {
  const data = fs.readFileSync(file);
  const png = PNG.sync.read(data);
  const fw = 48, fh = 56;
  const cols = Math.floor(png.width / fw);
  const rows = Math.floor(png.height / fh);

  console.log(`\n================ ${heroName} (${file}) ================`);
  console.log(`Dimensions: ${png.width}x${png.height} => ${cols} cols x ${rows} rows`);

  for (let r = 0; r < rows; r++) {
    let rowPixels = 0;
    let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
    for (let c = 0; c < cols; c++) {
      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) {
          const px = c * fw + x;
          const py = r * fh + y;
          const idx = (py * png.width + px) * 4;
          if (png.data[idx + 3] > 20) {
            rowPixels++;
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
          }
        }
      }
    }
    console.log(`Row ${r} (frames ${r*cols}..${(r+1)*cols-1}): Total Non-Transparent Pixels = ${rowPixels}, Bounds: X[${minX}..${maxX}], Y[${minY}..${maxY}]`);
  }
}

inspectRowByRow('d:/games/Mirror-match/src/assets/image/ezreal_spritesheet.png', 'Ezreal');
inspectRowByRow('d:/games/Mirror-match/src/assets/image/lux_spritesheet.png', 'Lux');
inspectRowByRow('d:/games/Mirror-match/src/assets/image/jinx_spritesheet.png', 'Jinx');
