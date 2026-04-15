import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import api from "../utils/api";

const BestsellerCard = ({ item, onAdd }) => {
  const { name, price, offerPrice, image } = item;

  // Helper for rendering Image vs Emoji
  const renderImage = (imgString) => {
    if (!imgString) return "🍽️";
    if (imgString.startsWith("http")) {
      return (
        <img
          src={imgString}
          alt={name}
          className="w-full h-full object-cover rounded-xl"
        />
      );
    }
    return imgString; // It's an emoji
  };

  return (
    <div className="flex flex-col justify-center items-center bg-white min-w-[160px] rounded-xl border border-gray-100 p-3 shadow-sm">
      {/*  icon container */}
      <div className="rounded-xl w-full aspect-square bg-gray-50 flex items-center justify-center mb-3 overflow-hidden text-4xl">
        {renderImage(image)}
      </div>
      <span className="text-gray-800 font-bold text-sm leading-tight h-10 line-clamp-2 text-center">
        {name}
      </span>

      <div className="w-full flex items-center justify-between mt-auto px-1 gap-1">
        {offerPrice && offerPrice < price ? (
          <div className="flex flex-col items-start">
            <span className="text-orange-600 font-extrabold text-lg">₹{offerPrice}</span>
            <span className="text-xs text-gray-400 line-through">₹{price}</span>
          </div>
        ) : (
          <span className="text-orange-600 font-extrabold text-lg">
            {" "}
            ₹ {price}
          </span>
        )}

        <button
          onClick={onAdd}
          className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full font-bold text-xl hover:bg-orange-600 hover:text-white transition-colors duration-200 active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
};

const Bestsellers = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        const res = await api.get("/user/menu");
        // Safely extract the array, fallback to empty array if something weird is returned
        const allProducts = Array.isArray(res.data.products) ? res.data.products
          : Array.isArray(res.data) ? res.data : [];

        // Filter products that are marked as bestsellers and are currently available
        const bestsellers = allProducts.filter(p => p.isBestseller && p.isAvailable !== false);
        setItems(bestsellers);
      } catch (error) {
        console.error("Failed to fetch bestsellers", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestsellers();
  }, []);

  const handleAdd = (item) => {
    addToCart(item);
  };

  if (loading) {
    return (
      <div className="w-full px-5 py-4 mb-4">
        <h2 className="font-bold text-xl font-serif mb-6">Bestsellers</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[160px] h-[220px] bg-gray-50 rounded-xl animate-pulse border border-gray-100"></div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null; // Don't show the section if there are no bestsellers
  }

  return (
    <>
      <div className="w-full max-w-full overflow-hidden px-5 py-4 mb-4 ">
        <h2 className="font-bold text-xl font-serif mb-6">Bestsellers</h2>

        {/* body of bestsellers */}

        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
          {items.map((item) => (
            <BestsellerCard
              key={item._id || item.id}
              item={item}
              onAdd={() => handleAdd(item)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Bestsellers;
