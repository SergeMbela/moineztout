const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist', 'moineztout-dashboard', 'browser');
const indexHtml = path.join(distDir, 'index.html');
const indexCsr = path.join(distDir, 'index.csr.html');
const dest = path.join(distDir, '404.html');

if (!fs.existsSync(distDir)) {
  console.error(`❌ Error: Directory not found: ${distDir}`);
  console.error('   Did the build run successfully?');
  process.exit(1);
}

let source = indexHtml;

// Handle Angular 19+ SSR structure where index.html might be index.csr.html
if (!fs.existsSync(indexHtml)) {
  if (fs.existsSync(indexCsr)) {
    console.log(`⚠️  index.html missing. Creating from index.csr.html...`);
    fs.copyFileSync(indexCsr, indexHtml);
    source = indexHtml;
  } else {
    console.error(`❌ Error: Neither index.html nor index.csr.html found in: ${distDir}`);
    console.log('   Folder contents:', fs.readdirSync(distDir));
    process.exit(1);
  }
}

try {
  fs.copyFileSync(source, dest);
  console.log(`✅ Success: Copied index.html to 404.html`);
} catch (err) {
  console.error(`❌ Error copying file:`, err);
  process.exit(1);
}