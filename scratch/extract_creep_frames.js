import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('src/assets/image/creep.png');
const srcPng = PNG.sync.read(data);

const width = srcPng.width;
const height = srcPng.height;

// Helper to check if pixel is part of a frog sprite (not white background, not black label pill background)
// Label pill background is very dark (r < 30, g < 30, b < 30) AND text is white.
// Frog sprite has outline, green body, pink cheeks, etc.
// Background is white (r > 240, g > 240, b > 240) or alpha == 0.

function isFrogPixel(x, y) {
  if (x < 0 || x >= width || y < 0 || y >= height) return false;
  const idx = (width * y + x) << 2;
  const r = srcPng.data[idx];
  const g = srcPng.data[idx + 1];
  const b = srcPng.data[idx + 2];
  const a = srcPng.data[idx + 3];

  if (a < 50) return false; // Transparent

  // Check white background
  if (r > 235 && g > 235 && b > 235) return false;

  // Check black label pills:
  // Label pills are pill-shaped dark rectangles.
  // Dark label pixels have r < 40, g < 40, b < 40.
  // EXCEPT frog black outline pixels which are adjacent to green/pink/cream pixels!
  if (r < 40 && g < 40 && b < 40) {
    // Check neighbors within 3px for frog colors (green/cream/pink)
    let hasFrogNeighbor = false;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = (width * ny + nx) << 2;
          const nr = srcPng.data[nidx];
          const ng = srcPng.data[nidx + 1];
          const nb = srcPng.data[nidx + 2];
          const na = srcPng.data[nidx + 3];
          if (na > 100 && ((ng > nr + 10 && ng > 50) || (nr > 180 && ng > 100 && nb > 100))) {
            hasFrogNeighbor = true;
            break;
          }
        }
      }
      if (hasFrogNeighbor) break;
    }
    if (!hasFrogNeighbor) return false; // It's part of a label pill!
  }

  return true;
}

// Find connected component clusters of frog pixels
const visited = new Uint8Array(width * height);
const clusters = [];

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const pIdx = y * width + x;
    if (visited[pIdx]) continue;
    if (!isFrogPixel(x, y)) {
      visited[pIdx] = 1;
      continue;
    }

    // Flood fill cluster
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
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          if (!visited[nIdx] && isFrogPixel(nx, ny)) {
            visited[nIdx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }

    // Only keep clusters of decent size (e.g. width >= 15, height >= 15)
    if (maxX - minX >= 12 && maxY - minY >= 12) {
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

console.log(`Extracted ${clusters.length} frog frame clusters!`);

// Sort clusters by row Y, then by X
// Group clusters into horizontal rows
clusters.sort((a, b) => a.cy - b.cy);

// Group into rows with Y threshold ~40px
const rows = [];
let currentRow = [];
let currentY = -999;

clusters.forEach(c => {
  if (Math.abs(c.cy - currentY) > 50) {
    if (currentRow.length > 0) {
      currentRow.sort((a, b) => a.cx - b.cx);
      rows.push(currentRow);
    }
    currentRow = [c];
    currentY = c.cy;
  } else {
    currentRow.push(c);
  }
});
if (currentRow.length > 0) {
  currentRow.sort((a, b) => a.cx - b.cx);
  rows.push(currentRow);
}

console.log(`Found ${rows.length} rows of frog frames:`);
rows.forEach((r, idx) => {
  console.log(`Row ${idx}: ${r.length} frames at Y ~ ${Math.round(r[0].cy)}`);
});
