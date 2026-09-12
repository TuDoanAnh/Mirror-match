import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const srcPng = PNG.sync.read(data);

const outDir = 'd:/games/Mirror-match/src/assets/image';

// 1. Q SKILL (Mystic Shot):
// In Ez_skill.png:
// Row 1: Y[236..286] (Height 51px).
// Let's inspect the 13 sprites in Row 1:
// Sprite 0: X[54..85] (w=32)
// Sprite 1: X[143..178] (w=36)
// Sprite 2: X[239..321] (w=83)
// Sprite 3: X[360..459] (w=100)
// Sprite 4: X[498..621] (w=124)
// Sprite 5: X[655..786] (w=132)
// Sprite 6: X[848..1014] (w=167)
// Sprite 7: X[1033..1231] (w=199)
// Sprite 8: X[1243..1345] (w=103)
// Sprite 9: X[1397..1437] (w=41)
// Sprite 10: X[1456..1481] (w=26)
// Sprite 11: X[1560..1580] (w=21)
// Sprite 12: X[1691..1732] (w=42)

// Sprite 7 (X[1033..1231], w=199, h=51) or Sprite 6 is the full glowing Ezreal Q energy bolt!
// Let's create `ezreal_q_projectile.png` (the beautiful energy arrow/bolt) and `ezreal_q_spritesheet.png`.

// 2. SPACE SKILL (Trueshot Barrage Ultimate):
// In Ez_skill.png:
// Row 5: Y[505..708] (Height 204px).
// Sprite 5: X[673..1090] (w=418, h=204) is the grand golden crescent Trueshot Barrage energy wave!
// Let's create `ezreal_space_projectile.png` (the golden arc wave) and `ezreal_space_spritesheet.png`.

function cropBoundingBox(minX, minY, maxX, maxY) {
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const dst = new PNG({ width: w, height: h });
  for (let cy = 0; cy < h; cy++) {
    for (let cx = 0; cx < w; cx++) {
      const sx = minX + cx;
      const sy = minY + cy;
      const sIdx = (srcPng.width * sy + sx) << 2;
      const dIdx = (w * cy + cx) << 2;
      dst.data[dIdx] = srcPng.data[sIdx];
      dst.data[dIdx + 1] = srcPng.data[sIdx + 1];
      dst.data[dIdx + 2] = srcPng.data[sIdx + 2];
      dst.data[dIdx + 3] = srcPng.data[sIdx + 3];
    }
  }
  return dst;
}

// Save Q Projectile: Frame Sprite 7 (X:1030..1232, Y:236..286)
const qProj = cropBoundingBox(1030, 236, 1232, 286);
fs.writeFileSync(path.join(outDir, 'ezreal_q_projectile.png'), PNG.sync.write(qProj));
console.log(`Saved ezreal_q_projectile.png (${qProj.width}x${qProj.height})`);

// Save Space Projectile: Frame Sprite 5 (X:670..1092, Y:505..708)
const spaceProj = cropBoundingBox(670, 505, 1092, 708);
fs.writeFileSync(path.join(outDir, 'ezreal_space_projectile.png'), PNG.sync.write(spaceProj));
console.log(`Saved ezreal_space_projectile.png (${spaceProj.width}x${spaceProj.height})`);
