import fs from 'fs';
import { PNG } from 'pngjs';

['Buy.png', 'Ready.png', 'Sell.png'].forEach(filename => {
  const buf = fs.readFileSync(`src/assets/image/${filename}`);
  const png = PNG.sync.read(buf);
  console.log(`${filename}: ${png.width}x${png.height}`);
});
