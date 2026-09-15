import fs from 'fs';
import { PNG } from 'pngjs';

function inspectBladeShape(filename) {
  const buf = fs.readFileSync(filename);
  const png = PNG.sync.read(buf);

  console.log(`\n=== Blade Shape analysis for ${filename} (${png.width}x${png.height}) ===`);
  const scaleX = Math.ceil(png.width / 40);
  const scaleY = Math.ceil(png.height / 30);

  for (let y = 0; y < png.height; y += scaleY) {
    let line = "";
    for (let x = 0; x < png.width; x += scaleX) {
      let count = 0;
      for (let dy = 0; dy < scaleY && y + dy < png.height; dy++) {
        for (let dx = 0; dx < scaleX && x + dx < png.width; dx++) {
          if (png.data[((y + dy) * png.width + (x + dx)) * 4 + 3] > 30) count++;
        }
      }
      line += count > (scaleX * scaleY * 0.15) ? "*" : " ";
    }
    console.log(line);
  }
}

inspectBladeShape('./scratch/riven_frames/frame_1_rot90.png');
inspectBladeShape('./scratch/riven_frames/frame_1_rot270.png');
