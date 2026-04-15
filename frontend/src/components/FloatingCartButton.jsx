import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const FloatingCartButton = ({ show = false }) => {
  const navigate = useNavigate();
  const { cartItems } = useCart();

  const cartQuantity = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  return (
    <AnimatePresence>
      {show && cartQuantity > 0 && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          onClick={() => navigate("/cart")}
          className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[90] mx-auto flex max-w-[560px] items-center justify-between rounded-2xl bg-gray-900 px-5 py-4 text-white shadow-2xl shadow-gray-400/40 active:scale-[0.98]"
        >
          <span className="flex items-center gap-3 font-bold">
            <span className="rounded-xl bg-orange-600 p-2">
              <ShoppingBag size={20} />
            </span>
            Go to Cart
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-gray-900">
            {cartQuantity} {cartQuantity === 1 ? "item" : "items"}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default FloatingCartButton;
