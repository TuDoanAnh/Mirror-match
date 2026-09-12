const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '../src/assets/image/Map.png');
const buffer = fs.readFileSync(mapPath);

console.log('Header bytes:', buffer.subarray(0, 16).toString('hex'));
console.log('File size:', buffer.length);
