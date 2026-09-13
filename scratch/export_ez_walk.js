import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/ezreal_spritesheet.png');
const png = PNG.sync.read(data);

function exportFrame(frameIdx, path) {
  const fw = 48, fh = 56;
  const cols = Math.floor(png.width / fw);
  const r = Math.floor(frameIdx / cols);
  const c = frameIdx % cols;

  const dst = new PNG({ width: fw, height: fh });
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < fw; x++) {
      const srcIdx = ((r * fh + y) * png.width + (c * fw + x)) * 4;
      const dstIdx = (y * fw + x) * 4;
      dst.data[dstIdx] = png.data[srcIdx];
      dst.data[dstIdx + 1] = png.data[srcIdx + 1];
      dst.data[dstIdx + 2] = png.data[srcIdx + 2];
      dst.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }
  fs.writeFileSync(path, PNG.sync.write(dst));
}

// Export Ezreal walk left (12..15) and walk right (16..19)
for (let i = 12; i <= 15; i++) {
  exportFrame(i, `d:/games/Mirror-match/scratch/ez_walk_left_${i}.png`);
}
for (let i = 16; i <= 19; i++) {
  exportFrame(i, `d:/games/Mirror-match/scratch/ez_walk_right_${i}.png`);
}
console.log('Exported Ezreal walk frames 12..19');
