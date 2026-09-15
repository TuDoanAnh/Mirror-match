import fs from 'fs';
import { PNG } from 'pngjs';

// 1. Process Zed Q Spinning Shuriken Spritesheet
const zedBuf = fs.readFileSync('src/assets/image/Zed_skill.png');
const zedPng = PNG.sync.read(zedBuf);

// Bounds of the 4 spinning frames in Zed_skill.png (966x229)
const zedFrames = [
  { minX: 51, maxX: 234, minY: 18, maxY: 210 },
  { minX: 283, maxX: 462, minY: 24, maxY: 206 },
  { minX: 511, maxX: 689, minY: 23, maxY: 206 },
  { minX: 739, maxX: 917, minY: 23, maxY: 207 }
];

const targetFrameSize = 180;
const zedSheet = new PNG({ width: targetFrameSize * 4, height: targetFrameSize });

zedFrames.forEach((f, idx) => {
  const fw = f.maxX - f.minX + 1;
  const fh = f.maxY - f.minY + 1;
  const offsetX = idx * targetFrameSize + Math.floor((targetFrameSize - fw) / 2);
  const offsetY = Math.floor((targetFrameSize - fh) / 2);

  for (let cy = 0; cy < fh; cy++) {
    for (let cx = 0; cx < fw; cx++) {
      const srcIdx = ((f.minY + cy) * zedPng.width + (f.minX + cx)) * 4;
      const dstIdx = ((offsetY + cy) * zedSheet.width + (offsetX + cx)) * 4;
      for (let i = 0; i < 4; i++) {
        zedSheet.data[dstIdx + i] = zedPng.data[srcIdx + i];
      }
    }
  }
});

fs.writeFileSync('src/assets/image/zed_q_spritesheet.png', PNG.sync.write(zedSheet));
console.log(`Generated src/assets/image/zed_q_spritesheet.png (${zedSheet.width}x${zedSheet.height})`);

// 2. Process Riven R 3 Crescent Wave Rays
const rivenBuf = fs.readFileSync('src/assets/image/Riven_Skill.png');
const rivenPng = PNG.sync.read(rivenBuf);

const rivenWaveBounds = [
  { minX: 1040, maxX: 2175, minY: 196, maxY: 534 }, // Wave 1: 1136x339
  { minX: 1161, maxX: 2290, minY: 512, maxY: 826 }, // Wave 2: 1130x315
  { minX: 1126, maxX: 2349, minY: 824, maxY: 1182 } // Wave 3: 1224x359
];

rivenWaveBounds.forEach((b, idx) => {
  const fw = b.maxX - b.minX + 1;
  const fh = b.maxY - b.minY + 1;
  // Crop
  const cropped = new PNG({ width: fw, height: fh });
  for (let cy = 0; cy < fh; cy++) {
    for (let cx = 0; cx < fw; cx++) {
      const srcIdx = ((b.minY + cy) * rivenPng.width + (b.minX + cx)) * 4;
      const dstIdx = (cy * fw + cx) * 4;
      for (let i = 0; i < 4; i++) {
        cropped.data[dstIdx + i] = rivenPng.data[srcIdx + i];
      }
    }
  }

  // Rotate 270 degrees counter-clockwise so apex faces right (0 rad)
  const rot270 = new PNG({ width: fh, height: fw });
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < fw; x++) {
      const srcIdx = (y * fw + x) * 4;
      const dx = y;
      const dy = fw - 1 - x;
      const dstIdx = (dy * rot270.width + dx) * 4;
      for (let i = 0; i < 4; i++) {
        rot270.data[dstIdx + i] = cropped.data[srcIdx + i];
      }
    }
  }

  const outPath = `src/assets/image/riven_r_wave${idx + 1}.png`;
  fs.writeFileSync(outPath, PNG.sync.write(rot270));
  console.log(`Generated ${outPath} (${rot270.width}x${rot270.height})`);
});
