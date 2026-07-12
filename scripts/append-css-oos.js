const fs = require('fs');
const path = require('path');

const cssContent = `
// --- Out of Stock Styles ---
.shop-product-card--out-of-stock {
  opacity: 0.6;
  pointer-events: none;
  cursor: not-allowed !important;
  filter: grayscale(80%);
}

.shop-product-card__add-btn--disabled {
  background: #e0e0e0 !important;
  color: #888888 !important;
  border-color: #d0d0d0 !important;
  cursor: not-allowed !important;
  pointer-events: none;
}
`;

const filePath = path.join(__dirname, '..', 'src', 'app', 'home.scss');
fs.appendFileSync(filePath, cssContent, 'utf8');
console.log("Successfully appended OOS CSS!");
