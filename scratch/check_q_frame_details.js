import fs from 'fs';
import { PNG } from 'pngjs';

// Inspect saved frames: width, height, center of mass, bounding box
for (let i = 0; i <= 7; i++) {
  const data = fs.readFileSync(`d:/games/Mirror-match/src/assets/image/lux_q_frame_${i}.png`);
  const png = PNG.sync.read(data);
  let minX = png.width, maxX = 0, minY = png.height, maxY = 0, count = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const alpha = png.data[(y * png.width + x) * 4 + 3];
      if (alpha > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        count++;
      }
    }
  }
  console.log(`Frame ${i}: ${png.width}x${png.height}, bbox: [${minX}, ${minY}, ${maxX}, ${maxY}] (w=${maxX-minX+1}, h=${maxY-minY+1}), non-transparent pixels=${count}`);
}
