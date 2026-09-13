import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/lux_space_beam.png');
const png = PNG.sync.read(data);

console.log(`lux_space_beam.png size: ${png.width} x ${png.height}`);

let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const a = png.data[(y * png.width + x) * 4 + 3];
    if (a > 20) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log(`BBox: X[${minX}..${maxX}] (w=${maxX-minX+1}), Y[${minY}..${maxY}] (h=${maxY-minY+1})`);
