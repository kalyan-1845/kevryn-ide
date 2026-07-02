const sharp = require('sharp');
const fs = require('fs');

async function convert() {
    try {
        const svgPath = 'public/logo.svg';
        const svgBuffer = fs.readFileSync(svgPath);
        
        await sharp(svgBuffer)
            .resize(192, 192)
            .png()
            .toFile('public/logo192.png');
            
        await sharp(svgBuffer)
            .resize(512, 512)
            .png()
            .toFile('public/logo512.png');
            
        console.log('PNGs created successfully.');
    } catch (e) {
        console.error(e);
    }
}
convert();
