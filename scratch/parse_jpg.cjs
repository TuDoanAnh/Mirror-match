const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '../src/assets/image/Map.png');
const buf = fs.readFileSync(mapPath);

let offset = 2;
while (offset < buf.length) {
  if (buf[offset] !== 0xff) break;
  const marker = buf[offset + 1];
  if (marker === 0xc0 || marker === 0xc2) {
    const h = buf.readUInt16BE(offset + 5);
    const w = buf.readUInt16BE(offset + 7);
    console.log(`JPEG Dimensions: Width = ${w}, Height = ${h}`);
    break;
  }
  const len = buf.readUInt16BE(offset + 2);
  offset += 2 + len;
}
