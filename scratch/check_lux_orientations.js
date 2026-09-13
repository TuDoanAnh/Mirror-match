import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Lux_skill.png');
const png = PNG.sync.read(data);

// Inspect Lux Q Frame 7 (X[971..1094], Y[80..368])
let qLeft = 0, qRight = 0;
const qMidX = Math.floor((971 + 1094) / 2);
for (let y = 80; y <= 368; y++) {
  for (let x = 971; x <= 1094; x++) {
    const idx = (png.width * y + x) << 2;
    if (png.data[idx + 3] > 20) {
      if (x < qMidX) qLeft++; else qRight++;
    }
  }
}
console.log(`Lux Q Frame 7: Left pixels = ${qLeft}, Right pixels = ${qRight}`);

// Inspect Lux Space Beam (X[60..1511], Y[683..952])
let spaceLeft = 0, spaceRight = 0;
const spaceMidX = Math.floor((60 + 1511) / 2);
for (let y = 683; y <= 952; y++) {
  for (let x = 60; x <= 1511; x++) {
    const idx = (png.width * y + x) << 2;
    if (png.data[idx + 3] > 20) {
      if (x < spaceMidX) spaceLeft++; else spaceRight++;
    }
  }
}
console.log(`Lux Space Beam: Left pixels = ${spaceLeft}, Right pixels = ${spaceRight}`);
