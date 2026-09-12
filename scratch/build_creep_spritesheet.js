import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('src/assets/image/creep.png');
const srcPng = PNG.sync.read(data);

const width = srcPng.width;
const height = srcPng.height;

// Helper to check if pixel is part of a frog sprite (excluding white background)
function isFrogPixel(x, y) {
  if (x < 0 || x >= width || y < 0 || y >= height) return false;
  const idx = (width * y + x) << 2;
  const r = srcPng.data[idx];
  const g = srcPng.data[idx + 1];
  const b = srcPng.data[idx + 2];
  const a = srcPng.data[idx + 3];

  if (a < 50) return false;
  if (r > 235 && g > 235 && b > 235) return false; // White background

  return true;
}

// Bounding boxes carefully excluding dark label pills (label pills are at Y: 40..85, 180..220, 340..380, 500..540, 660..700, 820..860)
const SECTIONS = [
  // 0: Idle ("Đứng yên", left column, Y: 710..790)
  { category: 'idle', minX: 30, maxX: 450, minY: 710, maxY: 790 },
  // 1: Walk Down ("Đi xuống", left column, Y: 92..165)
  { category: 'walk_down', minX: 30, maxX: 450, minY: 92, maxY: 165 },
  // 2: Walk Up ("Đi lên", right column, Y: 92..165)
  { category: 'walk_up', minX: 500, maxX: 900, minY: 92, maxY: 165 },
  // 3: Walk Left ("Đi trái", left column, Y: 232..305)
  { category: 'walk_left', minX: 30, maxX: 450, minY: 232, maxY: 305 },
  // 4: Walk Right ("Đi phải", right column, Y: 232..305)
  { category: 'walk_right', minX: 500, maxX: 900, minY: 232, maxY: 305 },
  // 5: Hurt ("Bị đánh", left column, Y: 872..960)
  { category: 'hurt', minX: 30, maxX: 450, minY: 872, maxY: 960 }
];

function extractFramesForSection(sec) {
  const visited = new Uint8Array(width * height);
  const clusters = [];

  for (let y = sec.minY; y <= sec.maxY; y++) {
    for (let x = sec.minX; x <= sec.maxX; x++) {
      const pIdx = y * width + x;
      if (visited[pIdx] || !isFrogPixel(x, y)) continue;

      const queue = [[x, y]];
      visited[pIdx] = 1;

      let minX = x, maxX = x, minY = y, maxY = y;
      const pixels = [];

      while (queue.length > 0) {
        const [currX, currY] = queue.pop();
        pixels.push([currX, currY]);

        if (currX < minX) minX = currX;
        if (currX > maxX) maxX = currX;
        if (currY < minY) minY = currY;
        if (currY > maxY) maxY = currY;

        const neighbors = [
          [currX + 1, currY], [currX - 1, currY],
          [currX, currY + 1], [currX, currY - 1]
        ];

        for (let i = 0; i < neighbors.length; i++) {
          const [nx, ny] = neighbors[i];
          if (nx >= sec.minX && nx <= sec.maxX && ny >= sec.minY && ny <= sec.maxY) {
            const nIdx = ny * width + nx;
            if (!visited[nIdx] && isFrogPixel(nx, ny)) {
              visited[nIdx] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }

      if (maxX - minX >= 10 && maxY - minY >= 10) {
        clusters.push({
          minX, maxX, minY, maxY,
          w: maxX - minX + 1,
          h: maxY - minY + 1,
          cx: (minX + maxX) / 2,
          cy: (minY + maxY) / 2,
          pixels
        });
      }
    }
  }

  // Sort frames horizontally left-to-right
  clusters.sort((a, b) => a.cx - b.cx);

  // Combine any fragmented sub-clusters belonging to the same frame (X center < 20px apart)
  const combined = [];
  clusters.forEach(c => {
    if (combined.length === 0) {
      combined.push(c);
    } else {
      const last = combined[combined.length - 1];
      if (Math.abs(c.cx - last.cx) < 22) {
        last.minX = Math.min(last.minX, c.minX);
        last.maxX = Math.max(last.maxX, c.maxX);
        last.minY = Math.min(last.minY, c.minY);
        last.maxY = Math.max(last.maxY, c.maxY);
        last.w = last.maxX - last.minX + 1;
        last.h = last.maxY - last.minY + 1;
        last.cx = (last.minX + last.maxX) / 2;
        last.cy = (last.minY + last.maxY) / 2;
        last.pixels.push(...c.pixels);
      } else {
        combined.push(c);
      }
    }
  });

  return combined;
}

const FRAME_W = 48;
const FRAME_H = 56;
const FRAMES_PER_ROW = 6;
const NUM_ROWS = SECTIONS.length; // 6 rows

const outWidth = FRAME_W * FRAMES_PER_ROW;
const outHeight = FRAME_H * NUM_ROWS;

const outPng = new PNG({ width: outWidth, height: outHeight });
// Initialize transparent PNG
for (let i = 0; i < outPng.data.length; i += 4) {
  outPng.data[i] = 0;
  outPng.data[i + 1] = 0;
  outPng.data[i + 2] = 0;
  outPng.data[i + 3] = 0;
}

const animFrameCounts = {};

SECTIONS.forEach((sec, rowIdx) => {
  const frames = extractFramesForSection(sec);
  console.log(`Section ${sec.category}: ${frames.length} frames`);
  animFrameCounts[sec.category] = frames.length;

  frames.forEach((frame, colIdx) => {
    if (colIdx >= FRAMES_PER_ROW) return;

    const cellLeft = colIdx * FRAME_W;
    const cellTop = rowIdx * FRAME_H;

    const offsetX = cellLeft + Math.floor((FRAME_W - frame.w) / 2);
    const offsetY = cellTop + Math.floor((FRAME_H - frame.h) / 2);

    frame.pixels.forEach(([srcX, srcY]) => {
      const srcIdx = (width * srcY + srcX) << 2;
      const dstX = offsetX + (srcX - frame.minX);
      const dstY = offsetY + (srcY - frame.minY);

      if (dstX >= cellLeft && dstX < cellLeft + FRAME_W && dstY >= cellTop && dstY < cellTop + FRAME_H) {
        const dstIdx = (outWidth * dstY + dstX) << 2;
        outPng.data[dstIdx] = srcPng.data[srcIdx];
        outPng.data[dstIdx + 1] = srcPng.data[srcIdx + 1];
        outPng.data[dstIdx + 2] = srcPng.data[srcIdx + 2];
        outPng.data[dstIdx + 3] = srcPng.data[srcIdx + 3];
      }
    });
  });
});

const outBuffer = PNG.sync.write(outPng);
fs.writeFileSync('src/assets/image/creep_spritesheet.png', outBuffer);
console.log(`Successfully generated src/assets/image/creep_spritesheet.png (${outWidth}x${outHeight})!`);
console.log('Frame Counts:', animFrameCounts);
