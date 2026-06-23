const fs = require('fs');
const jpeg = require('jpeg-js');

const file = 'e:/GLITCH GALAXY CLIENTS/qr code generator/public/assets/logo_dark.jpg';
const jpegData = fs.readFileSync(file);
const rawImageData = jpeg.decode(jpegData, { useTArray: true });

let minX = rawImageData.width;
let maxX = 0;
let minY = rawImageData.height;
let maxY = 0;
let found = false;

for (let y = 0; y < rawImageData.height; y++) {
  for (let x = 0; x < rawImageData.width; x++) {
    const idx = (y * rawImageData.width + x) * 4;
    const r = rawImageData.data[idx];
    const g = rawImageData.data[idx+1];
    const b = rawImageData.data[idx+2];
    
    if (r > 8 || g > 8 || b > 8) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      found = true;
    }
  }
}

if (found) {
  console.log(`Bounding Box: X = [${minX}, ${maxX}], Y = [${minY}, ${maxY}]`);
  console.log(`Width: ${maxX - minX + 1}, Height: ${maxY - minY + 1}`);
  console.log(`Aspect Ratio: ${(maxX - minX + 1) / (maxY - minY + 1)}`);
} else {
  console.log('No pixels found');
}
