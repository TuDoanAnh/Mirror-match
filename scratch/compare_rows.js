import fs from 'fs';
import { PNG } from 'pngjs';

const row3 = PNG.sync.read(fs.readFileSync('d:/games/Mirror-match/scratch/ez_row_3.png'));
const row4 = PNG.sync.read(fs.readFileSync('d:/games/Mirror-match/scratch/ez_row_4.png'));

// Check how similar row4 is to flipped row3 vs unflipped row3
let diffUnflipped = 0;
let diffFlipped = 0;

for (let y = 0; y < row3.height; y++) {
  for (let x = 0; x < row3.width; x++) {
    const idx3 = (y * row3.width + x) * 4;
    const a3 = row3.data[idx3 + 3];

    // Unflipped row4
    const idx4 = (y * row4.width + x) * 4;
    const a4 = row4.data[idx4 + 3];
    diffUnflipped += Math.abs(a3 - a4);

    // Flipped row4
    const fx = row4.width - 1 - x;
    const fidx4 = (y * row4.width + fx) * 4;
    const fa4 = row4.data[fidx4 + 3];
    diffFlipped += Math.abs(a3 - fa4);
  }
}

console.log(`Diff Unflipped (row 3 vs row 4): ${diffUnflipped}`);
console.log(`Diff Flipped (row 3 vs flipped row 4): ${diffFlipped}`);
