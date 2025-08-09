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

bundle('critical.js', ['vendor.js', 'theme.js']);
bundle('product-features.js', ['product.js', 'colorSwatchToggler.js']);
bundle('collection-features.js', []);
bundle('cart-checkout.js', ['cart.js']);
bundle('app-integrations.js', []);
bundle('non-critical.js', []);
