import fs from 'fs';
import { PNG } from 'pngjs';

function inspectCellContent(filename) {
  const buf = fs.readFileSync(filename);
  const png = PNG.sync.read(buf);

  // Find non-black & non-transparent region
  let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
  let nonBlackPixels = 0;

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (y * png.width + x) * 4;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];

      // Ignore near black (r<15 && g<15 && b<15) or transparent (a < 15)
      if (a > 15 && (r > 15 || g > 15 || b > 15)) {
        nonBlackPixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`=== ${filename} ===`);
  console.log(`Size: ${png.width}x${png.height}`);
  console.log(`Active icon bounds: X=${minX}..${maxX} (W=${maxX - minX + 1}), Y=${minY}..${maxY} (H=${maxY - minY + 1}), nonBlackPixels=${nonBlackPixels}`);
}

inspectCellContent('src/assets/image/item_doransBlade.png');
inspectCellContent('src/assets/image/item_boots.png');
inspectCellContent('src/assets/image/item_infinityEdge.png');
inspectCellContent('src/assets/image/item_zhonya.png');
