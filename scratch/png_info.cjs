const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '../src/assets/image/Map.png');
const buffer = fs.readFileSync(mapPath);

const width = buffer.readUInt32BE(16);
const height = buffer.readUInt32BE(20);

console.log(`Map.png dimensions: ${width} x ${height}`);
