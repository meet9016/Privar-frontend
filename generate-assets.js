const fs = require('fs');
const path = require('path');

const letterpad = fs.readFileSync(path.join(__dirname, 'src/assets/letterpad.png')).toString('base64');
const memon = fs.readFileSync(path.join(__dirname, 'src/assets/memon.png')).toString('base64');
const banner = fs.readFileSync(path.join(__dirname, 'src/assets/letterpad-banner.png')).toString('base64');
const golden = fs.readFileSync(path.join(__dirname, 'src/assets/glodentop.png')).toString('base64');
const corner = fs.readFileSync(path.join(__dirname, 'src/assets/corner.png')).toString('base64');

// Upgraded WebP decorative assets
const cornerWebp = fs.readFileSync(path.join(__dirname, 'src/assets/corner.webp')).toString('base64');
const goldenTopWebp = fs.readFileSync(path.join(__dirname, 'src/assets/golden-top.webp')).toString('base64');
const goldenBottomWebp = fs.readFileSync(path.join(__dirname, 'src/assets/golden-bottom.webp')).toString('base64');
const goldenRibbonWebp = fs.readFileSync(path.join(__dirname, 'src/assets/golden-ribbon.webp')).toString('base64');

const content = `// Auto-generated Base64 Embedded Assets for 100% reliable rendering without network or CORS issues
export const letterpadLogo = 'data:image/png;base64,${letterpad}';
export const memonLogo = 'data:image/png;base64,${memon}';
export const letterpadBanner = 'data:image/png;base64,${banner}';
export const goldenTopOrnament = 'data:image/png;base64,${golden}';
export const goldCornerOrnament = 'data:image/png;base64,${corner}';

// Upgraded Premium WebP Decorative Assets
export const cornerWebpOrnament = 'data:image/webp;base64,${cornerWebp}';
export const goldenTopWebpOrnament = 'data:image/webp;base64,${goldenTopWebp}';
export const goldenBottomWebpOrnament = 'data:image/webp;base64,${goldenBottomWebp}';
export const goldenRibbonWebpOrnament = 'data:image/webp;base64,${goldenRibbonWebp}';
`;

fs.writeFileSync(path.join(__dirname, 'src/assets/embeddedCertAssets.js'), content, 'utf8');
console.log('Embedded assets file created successfully, size:', content.length);
