const fs = require('fs');
const { PNG } = require('pngjs');

const file = `./src/assets/image/creep_spritesheet.png`;
if (fs.existsSync(file)) {
  const png = PNG.sync.read(fs.readFileSync(file));
  console.log('=== CREEP ===');
  [3, 4].forEach(r => {
    let leftP = 0, rightP = 0;
    for (let c = 0; c < 5; c++) {
      for (let py = 0; py < 56; py++) {
        for (let px = 0; px < 48; px++) {
          const idx = (png.width * (r * 56 + py) + (c * 48 + px)) << 2;
          if (png.data[idx + 3] > 100) {
            if (px < 24) leftP++;
            else rightP++;
          }
        }
      }
    }
    console.log(`Row ${r}: Left = ${leftP}, Right = ${rightP}`);
  });
}
