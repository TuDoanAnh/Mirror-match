import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/ezreal_spritesheet.png');
const png = PNG.sync.read(data);

// Generate an HTML file with embedded PNG base64 images of all 6 rows so we can inspect them clearly!
function pngToBase64(pngObj) {
  const buf = PNG.sync.write(pngObj);
  return 'data:image/png;base64,' + buf.toString('base64');
}

const fw = 48, fh = 56;
const cols = 4;
const rows = 6;

let html = '<html><body style="background:#222; color:#fff; font-family:sans-serif;"><h2>Ezreal Spritesheet Rows (Scaled 4x)</h2>';

for (let r = 0; r < rows; r++) {
  html += `<h3>Row ${r} (Frames ${r*4}..${r*4+3})</h3><div style="display:flex; gap:10px;">`;
  for (let c = 0; c < cols; c++) {
    const dst = new PNG({ width: fw, height: fh });
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        const srcIdx = ((r * fh + y) * png.width + (c * fw + x)) * 4;
        const dstIdx = (y * fw + x) * 4;
        dst.data[dstIdx] = png.data[srcIdx];
        dst.data[dstIdx + 1] = png.data[srcIdx + 1];
        dst.data[dstIdx + 2] = png.data[srcIdx + 2];
        dst.data[dstIdx + 3] = png.data[srcIdx + 3];
      }
    }
    const b64 = pngToBase64(dst);
    html += `<div style="text-align:center;"><img src="${b64}" style="width:192px; height:224px; image-rendering:pixelated; border:1px solid #555;" /><br/>Frame ${r*4+c}</div>`;
  }
  html += '</div>';
}

html += '</body></html>';
fs.writeFileSync('d:/games/Mirror-match/scratch/inspect_ezreal.html', html);
console.log('Generated scratch/inspect_ezreal.html');
