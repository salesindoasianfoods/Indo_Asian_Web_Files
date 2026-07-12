const fs = require('fs');
const path = require('path');

const cssContent = `
// --- Mobile Category Drawer Styles ---
.shop-chip-categories-btn {
  display: none !important;
}

@media (max-width: 900px) {
  .shop-chip-categories-btn {
    display: flex !important;
    align-items: center;
    justify-content: center;
    color: #cc0000 !important;
    border-color: #cc0000 !important;
    background: rgba(204, 0, 0, 0.05) !important;
    font-weight: 500 !important;
  }
  
  .shop-mobile-category-drawer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    pointer-events: none;

    &__backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      pointer-events: auto;
      animation: shopDrawerFadeIn 0.3s ease forwards;
    }

    &__content {
      position: relative;
      background: #f7f7f7;
      width: 100%;
      max-height: 85vh;
      border-radius: 16px 16px 0 0;
      display: flex;
      flex-direction: column;
      pointer-events: auto;
      animation: shopDrawerSlideUp 0.3s ease forwards;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
    }

    &__header {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eaeaea;
      background: #ffffff;
      border-radius: 16px 16px 0 0;

      h2 {
        margin: 0;
        font-size: 17px;
        color: #333;
        font-weight: 600;
      }

      button {
        background: transparent;
        border: none;
        font-size: 22px;
        line-height: 1;
        color: #888;
        padding: 4px;
        cursor: pointer;
      }
    }

    &__body {
      padding: 10px 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      
      button {
        background: transparent;
        border: none;
        text-align: left;
        padding: 14px 24px;
        font-size: 15px;
        color: #444;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 500;

        &.is-active {
          color: #cc0000;
          font-weight: 600;
          background: rgba(204, 0, 0, 0.03);
        }
      }
    }
  }
}

@keyframes shopDrawerFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes shopDrawerSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
`;

const filePath = path.join(__dirname, '..', 'src', 'app', 'home.scss');
fs.appendFileSync(filePath, cssContent, 'utf8');
console.log("Successfully appended CSS!");
