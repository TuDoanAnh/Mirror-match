import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Lux_skill.png');
const src = PNG.sync.read(data);

// Cut Lux Q frame 0, frame 3, frame 4 etc.
// Let's create single frame png files to inspect
const frameBounds = [
  { minX: 32, maxX: 143, minY: 80, maxY: 368 },
  { minX: 153, maxX: 366, minY: 80, maxY: 368 },
  { minX: 386, maxX: 482, minY: 80, maxY: 368 },
  { minX: 490, maxX: 589, minY: 80, maxY: 368 },
  { minX: 600, maxX: 710, minY: 80, maxY: 368 },
  { minX: 729, maxX: 832, minY: 80, maxY: 368 },
  { minX: 848, maxX: 958, minY: 80, maxY: 368 },
  { minX: 971, maxX: 1094, minY: 80, maxY: 368 },
];

frameBounds.forEach((b, i) => {
  const w = b.maxX - b.minX + 1;
  const h = b.maxY - b.minY + 1;
  const dst = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = ((b.minY + y) * src.width + (b.minX + x)) << 2;
      const dstIdx = (y * w + x) << 2;
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }
  fs.writeFileSync(`d:/games/Mirror-match/src/assets/image/lux_q_frame_${i}.png`, PNG.sync.write(dst));
});

console.log('Saved individual Lux Q frames 0..7');
