const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Read a file from the assets directory if it exists
function safeRead(file) {
  const filePath = path.join(assetsDir, file);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

// Concatenate the listed files into a single bundle in /assets
function bundle(output, files) {
  const content = files.map(safeRead).join('\n');
  fs.writeFileSync(path.join(assetsDir, output), content);
}

// critical.js - core vendor libraries and theme runtime
bundle('critical.js', ['vendor.js', 'theme.js']);

// product-features.js - product page functionality
bundle('product-features.js', ['product.js', 'colorSwatchToggler.js']);

// cart-checkout.js - cart interactions and checkout helpers
bundle('cart-checkout.js', ['cart.js']);

