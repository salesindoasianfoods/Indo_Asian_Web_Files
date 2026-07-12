import "./style.scss";
import { CartPageScreen } from "@/components/cart-page/CartPageScreen";

const CartPage = () => {
  return (
    <div className="cart-page-container-main flex items-center justify-center">
      <div className="cart-page-container container">
        <CartPageScreen />
      </div>
    </div>
  );
};

export default CartPage;
