const sharp = require('sharp');
const path = require('path');

const mapPath = path.join(__dirname, '../src/assets/image/Map.png');

sharp(mapPath)
  .metadata()
  .then(meta => {
    console.log('Map image dimensions:', meta.width, 'x', meta.height, 'channels:', meta.channels);
  })
  .catch(err => console.error(err));
