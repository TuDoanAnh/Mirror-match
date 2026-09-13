const fs = require('fs');
const { PNG } = require('pngjs');

['lux', 'jinx', 'ezreal'].forEach(hero => {
  const file = `./src/assets/image/${hero}_spritesheet.png`;
  if (!fs.existsSync(file)) return;
  const png = PNG.sync.read(fs.readFileSync(file));
  for (let r = 0; r < 6; r++) {
    const out = new PNG({ width: 192, height: 56 });
    PNG.bitblt(png, out, 0, r * 56, 192, 56, 0, 0);
    fs.writeFileSync(`./scratch/${hero}_row_${r}.png`, PNG.sync.write(out));
  }
});
console.log('Saved row images successfully');
