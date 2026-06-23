const fs = require('fs');
const PNG = require('pngjs').PNG;

const data = fs.readFileSync('C:\\Users\\Admin\\.gemini\\antigravity\\brain\\2126d1ab-b0ab-43d4-8600-1977626736e5\\scratch\\debug_frame.png');
const png = PNG.sync.read(data);

console.log(`Image dimensions: ${png.width}x${png.height}`);

// Scan the UPI logo area (Y: 740 to 840, X: 250 to 430) for non-white pixels
let upiPixels = [];
for (let y = 740; y < 840; y++) {
  for (let x = 250; x < 430; x++) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx+1];
    const b = png.data[idx+2];
    
    if (r < 245 || g < 245 || b < 245) {
      upiPixels.push({ x, y });
    }
  }
}

console.log(`Found ${upiPixels.length} non-white pixels in the UPI logo area.`);
if (upiPixels.length > 0) {
  const sumX = upiPixels.reduce((sum, p) => sum + p.x, 0);
  const sumY = upiPixels.reduce((sum, p) => sum + p.y, 0);
  const centerX = sumX / upiPixels.length;
  const centerY = sumY / upiPixels.length;
  console.log(`Calculated UPI Center: X = ${centerX.toFixed(2)}, Y = ${centerY.toFixed(2)}`);
  
  const minX = Math.min(...upiPixels.map(p => p.x));
  const maxX = Math.max(...upiPixels.map(p => p.x));
  const minY = Math.min(...upiPixels.map(p => p.y));
  const maxY = Math.max(...upiPixels.map(p => p.y));
  console.log(`UPI Boundaries: X = [${minX}, ${maxX}], Y = [${minY}, ${maxY}]`);
  console.log(`UPI Box: Width = ${maxX - minX + 1}, Height = ${maxY - minY + 1}`);
} else {
  console.log('No pixels found');
}
