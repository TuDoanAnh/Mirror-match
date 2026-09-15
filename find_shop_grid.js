import fs from 'fs';
import { PNG } from 'pngjs';

if (!fs.existsSync('./scratch')) fs.mkdirSync('./scratch');
if (!fs.existsSync('./scratch/shop_grid')) fs.mkdirSync('./scratch/shop_grid');

const buf = fs.readFileSync('src/assets/image/Shop_Item.png');
const png = PNG.sync.read(buf);

function testGrid(cols, rows, label) {
  console.log(`\n=== Testing ${cols}x${rows} Grid (Cell size: ${(png.width / cols).toFixed(1)} x ${(png.height / rows).toFixed(1)}) ===`);
  const cellW = Math.floor(png.width / cols);
  const cellH = Math.floor(png.height / rows);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c + 1;
      const x = c * cellW;
      const y = r * cellH;

      const dst = new PNG({ width: cellW, height: cellH });
      for (let cy = 0; cy < cellH; cy++) {
        for (let cx = 0; cx < cellW; cx++) {
          const srcIdx = ((y + cy) * png.width + (x + cx)) * 4;
          const dstIdx = (cy * cellW + cx) * 4;
          for (let i = 0; i < 4; i++) {
            dst.data[dstIdx + i] = png.data[srcIdx + i];
          }
        }
      }
      const outPath = `./scratch/shop_grid/${label}_cell_${idx}.png`;
      fs.writeFileSync(outPath, PNG.sync.write(dst));
    }
  }
  console.log(`Saved cells for ${label}`);
}

testGrid(5, 4, '5x4');
testGrid(6, 4, '6x4');
testGrid(4, 5, '4x5');
