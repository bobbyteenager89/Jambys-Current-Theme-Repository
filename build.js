const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

function safeRead(file) {
  const filePath = path.join(assetsDir, file);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function bundle(output, files) {
  const content = files.map(safeRead).join('\n');
  fs.writeFileSync(path.join(assetsDir, output), content);
}

bundle('scripts/critical.js', ['scripts/vendor.js', 'scripts/theme.js']);
bundle('scripts/product-features.js', ['scripts/product.js', 'scripts/colorSwatchToggler.js']);
bundle('scripts/collection-features.js', []);
bundle('scripts/cart-checkout.js', ['scripts/cart.js']);
bundle('scripts/app-integrations.js', []);
bundle('scripts/non-critical.js', []);
