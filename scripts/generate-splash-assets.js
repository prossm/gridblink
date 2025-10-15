import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate splash background
const splashSvgPath = path.join(__dirname, '../assets/splash-background.svg');
const splashSvgBuffer = fs.readFileSync(splashSvgPath);

const splashResvg = new Resvg(splashSvgBuffer, {
  fitTo: {
    mode: 'width',
    value: 2048,
  },
});

const splashPngData = splashResvg.render();
const splashPngBuffer = splashPngData.asPng();

const splashOutputPath = path.join(__dirname, '../assets/splash-background.png');
fs.writeFileSync(splashOutputPath, splashPngBuffer);

console.log(`Generated splash background: ${splashOutputPath}`);
console.log(`Size: ${splashPngData.width}x${splashPngData.height}`);

// Generate app icon
const iconSvgPath = path.join(__dirname, '../assets/app-icon.svg');
const iconSvgBuffer = fs.readFileSync(iconSvgPath);

const iconResvg = new Resvg(iconSvgBuffer, {
  fitTo: {
    mode: 'width',
    value: 512,
  },
});

const iconPngData = iconResvg.render();
const iconPngBuffer = iconPngData.asPng();

const iconOutputPath = path.join(__dirname, '../assets/app-icon.png');
fs.writeFileSync(iconOutputPath, iconPngBuffer);

console.log(`Generated app icon: ${iconOutputPath}`);
console.log(`Size: ${iconPngData.width}x${iconPngData.height}`);
