const fs = require('fs');
const { PNG } = require('pngjs');

['lux', 'jinx', 'ezreal'].forEach(hero => {
  const file = `./src/assets/image/${hero}_spritesheet.png`;
  const png = PNG.sync.read(fs.readFileSync(file));
  console.log(`\n=================== ${hero.toUpperCase()} ===================`);
  
  [3, 4].forEach(r => {
    console.log(`--- ROW ${r} (frames ${r*4}..${r*4+3}) ---`);
    let colXsums = new Array(48).fill(0);
    for (let c = 0; c < 4; c++) {
      for (let py = 0; py < 56; py++) {
        for (let px = 0; px < 48; px++) {
          const idx = (png.width * (r * 56 + py) + (c * 48 + px)) << 2;
          if (png.data[idx + 3] > 50) {
            colXsums[px]++;
          }
        }
      }
    }
    
    // Print ASCII histogram of width 48
    let max = Math.max(...colXsums);
    let line = colXsums.map(v => {
      if (v === 0) return ' ';
      let ratio = v / max;
      if (ratio < 0.25) return '.';
      if (ratio < 0.5) return ':';
      if (ratio < 0.75) return 'o';
      return 'X';
    }).join('');
    console.log(`X Profile [0..47]: ${line}`);
    
    // Calculate center of mass in X
    let totalMass = 0, sumX = 0;
    colXsums.forEach((count, x) => {
      totalMass += count;
      sumX += count * x;
    });
    let comX = (sumX / totalMass).toFixed(2);
    console.log(`Center of Mass X: ${comX} (out of 47)`);
  });
});
