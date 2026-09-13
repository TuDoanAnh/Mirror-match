import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/ezreal_spritesheet.png');
const png = PNG.sync.read(data);

console.log(`ezreal_spritesheet.png size: ${png.width} x ${png.height}`);
const cols = Math.floor(png.width / 48);
const rows = Math.floor(png.height / 56);
console.log(`Cols: ${cols}, Rows: ${rows}, Total Frames: ${cols * rows}`);
