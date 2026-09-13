const fs = require('fs');
const { PNG } = require('pngjs');

['lux', 'jinx', 'ezreal'].forEach(hero => {
  const file = `./src/assets/image/${hero}_spritesheet.png`;
  const png = PNG.sync.read(fs.readFileSync(file));
  console.log(`\n=================== ${hero.toUpperCase()} ===================`);
  
  for (let r = 0; r < 6; r++) {
    // Check skin/face color or highlights on left half vs right half of each frame in row r
    let leftSkin = 0, rightSkin = 0;
    for (let c = 0; c < 4; c++) {
      for (let py = 0; py < 56; py++) {
        for (let px = 0; px < 48; px++) {
          const idx = (png.width * (r * 56 + py) + (c * 48 + px)) << 2;
          const R = png.data[idx];
          const G = png.data[idx + 1];
          const B = png.data[idx + 2];
          const A = png.data[idx + 3];
          
          // Detect skin tones / bright face pixels
          if (A > 100 && R > 200 && G > 160 && B > 120) {
            if (px < 24) leftSkin++;
            else rightSkin++;
          }
        }
      }
    }
    console.log(`Row ${r}: Left face/skin pixels = ${leftSkin}, Right face/skin pixels = ${rightSkin} (Diff Right-Left: ${rightSkin - leftSkin})`);
  }
});
