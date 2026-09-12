import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const png = PNG.sync.read(data);

// Let's create two spritesheets or individual frame sheets for Q and Space!
// Let's inspect the bounding box of Q effect (Row 1: Y 230 to 370)
// And Space effect (Row 5: Y 500 to 770)

function getCropData(x, y, w, h) {
  const dst = new PNG({ width: w, height: h });
  for (let cy = 0; cy < h; cy++) {
    for (let cx = 0; cx < w; cx++) {
      const sx = x + cx;
      const sy = y + cy;
      if (sx >= 0 && sx < png.width && sy >= 0 && sy < png.height) {
        const sIdx = (png.width * sy + sx) << 2;
        const dIdx = (w * cy + cx) << 2;
        dst.data[dIdx] = png.data[sIdx];
        dst.data[dIdx + 1] = png.data[sIdx + 1];
        dst.data[dIdx + 2] = png.data[sIdx + 2];
        dst.data[dIdx + 3] = png.data[sIdx + 3];
      }
    }
  }
  return dst;
}

// 1. Q Skill Projectile (Mystic Shot):
// Row 1 (y: 236..286) has 13 animation frames of the expanding mystic shot energy bolt!
// Max frame height is 51px, max frame width is ~200px.
// Let's crop Row 1 into a clean horizontal spritesheet `ezreal_q_spritesheet.png`!

// 2. Space Skill Ultimate (Trueshot Barrage):
// Row 5 (y: 505..708) has 9 animation frames of the massive golden crescent energy barrage wave!
// Max height ~204px, max width ~418px.
// Let's crop Row 5 into a clean horizontal spritesheet `ezreal_space_spritesheet.png`!

console.log('Ready to generate clean spritesheets for Q and Space skills!');
