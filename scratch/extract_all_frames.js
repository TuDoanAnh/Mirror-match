import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const srcPng = PNG.sync.read(data);

const outDir = 'd:/games/Mirror-match/scratch/extracted_frames';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function cropBox(minX, minY, maxX, maxY) {
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const dst = new PNG({ width: w, height: h });
  for (let cy = 0; cy < h; cy++) {
    for (let cx = 0; cx < w; cx++) {
      const sx = minX + cx;
      const sy = minY + cy;
      if (sx >= 0 && sx < srcPng.width && sy >= 0 && sy < srcPng.height) {
        const sIdx = (srcPng.width * sy + sx) << 2;
        const dIdx = (w * cy + cx) << 2;
        dst.data[dIdx] = srcPng.data[sIdx];
        dst.data[dIdx + 1] = srcPng.data[sIdx + 1];
        dst.data[dIdx + 2] = srcPng.data[sIdx + 2];
        dst.data[dIdx + 3] = srcPng.data[sIdx + 3];
      }
    }
  }
  return dst;
}

// Q SKILL ROW (13 sprites across Row 1):
// From Right to Left on sheet (F12 at right edge down to F0 at left edge):
const qBoxesRightToLeft = [
  { f: 12, minX: 1691, maxX: 1732 }, // Rightmost F12
  { f: 11, minX: 1560, maxX: 1580 }, // F11
  { f: 10, minX: 1456, maxX: 1481 }, // F10
  { f: 9,  minX: 1397, maxX: 1437 }, // F9
  { f: 8,  minX: 1243, maxX: 1345 }, // F8 (Maximum size Q arrow bolt!)
  { f: 7,  minX: 1033, maxX: 1231 }, // F7
  { f: 6,  minX: 848,  maxX: 1014 }, // F6
  { f: 5,  minX: 655,  maxX: 786 },  // F5
  { f: 4,  minX: 498,  maxX: 621 },  // F4
  { f: 3,  minX: 360,  maxX: 459 },  // F3
  { f: 2,  minX: 239,  maxX: 321 },  // F2
  { f: 1,  minX: 143,  maxX: 178 },  // F1
  { f: 0,  minX: 54,   maxX: 85 }    // F0
];

// SPACE SKILL ROW (Row 5 & Row 6):
// From Right to Left on sheet:
const spaceBoxesRightToLeft = [
  { f: 12, minX: 1669, maxX: 1727, minY: 731, maxY: 767 }, // Rightmost F12
  { f: 11, minX: 1553, maxX: 1611, minY: 731, maxY: 767 }, // F11
  { f: 10, minX: 1444, maxX: 1518, minY: 505, maxY: 708 }, // F10
  { f: 9,  minX: 1272, maxX: 1429, minY: 505, maxY: 708 }, // F9
  { f: 8,  minX: 1092, maxX: 1269, minY: 505, maxY: 708 }, // F8
  { f: 7,  minX: 673,  maxX: 1090, minY: 505, maxY: 708 }, // F7
  { f: 6,  minX: 455,  maxX: 621,  minY: 505, maxY: 708 }, // F6 (Maximum size Space wave!)
  { f: 5,  minX: 306,  maxX: 453,  minY: 505, maxY: 708 }, // F5
  { f: 4,  minX: 201,  maxX: 292,  minY: 505, maxY: 708 }, // F4
  { f: 3,  minX: 114,  maxX: 183,  minY: 505, maxY: 708 }, // F3
  { f: 2,  minX: 53,   maxX: 95,   minY: 505, maxY: 708 }, // F2
  { f: 1,  minX: 530,  maxX: 580,  minY: 731, maxY: 767 }, // F1
  { f: 0,  minX: 42,   maxX: 93,   minY: 731, maxY: 767 }  // F0
];

qBoxesRightToLeft.forEach((item) => {
  const framePng = cropBox(item.minX, 234, item.maxX, 289);
  fs.writeFileSync(path.join(outDir, `q_F${item.f}.png`), PNG.sync.write(framePng));
  console.log(`Q F${item.f}: width ${framePng.width}px`);
});

spaceBoxesRightToLeft.forEach((item) => {
  const framePng = cropBox(item.minX, item.minY, item.maxX, item.maxY);
  fs.writeFileSync(path.join(outDir, `space_F${item.f}.png`), PNG.sync.write(framePng));
  console.log(`Space F${item.f}: width ${framePng.width}px, height ${framePng.height}px`);
});

console.log('Successfully mapped F12 down to F0 for Q and Space!');
