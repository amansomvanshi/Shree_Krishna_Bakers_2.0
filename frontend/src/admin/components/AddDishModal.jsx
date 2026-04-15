import React, { useState } from "react";
import api from "../../utils/api"; // Importing our central API helper (Axios)

// PROPS EXPLAINED:
// isOpen: A boolean (true/false) that tells this component whether to show up or hide.
// onClose: A function to set 'isOpen' to false (closes the modal).
// onProductAdded: A function to refresh the Menu page after we successfully add a dish.
const AddDishModal = ({ isOpen, onClose, onProductAdded, existingCategories, editingProduct }) => {
  // 1. STATE: This holds the temporary data the user is typing into the form.
  const initialForm = {
    name: "",
    price: "",
    offerPrice: "",
    category: "",
    image: "",
    description: "",
    isBestseller: false,
  };

  const [formData, setFormData] = React.useState(initialForm);
  const [loading, setLoading] = React.useState(false);
  const [adminCategories, setAdminCategories] = React.useState([]); // Store Home Page categories
  const [showCategoryDropdown, setShowCategoryDropdown] = React.useState(false);

  // 1.1 Sync form with editingProduct when it changes
  React.useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || "",
        price: editingProduct.price || "",
        offerPrice: editingProduct.offerPrice || "",
        category: editingProduct.category || "",
        image: editingProduct.image || "",
        description: editingProduct.description || "",
        isBestseller: editingProduct.isBestseller || false,
      });
    } else {
      setFormData(initialForm);
    }
  }, [editingProduct, isOpen]);

  // 1.2 Fetch the categories created by the admin in "Manage Categories"
  React.useEffect(() => {
    if (isOpen) {
      api.get("/user/categories")
        .then(res => setAdminCategories(res.data.categories.map(c => c.name)))
        .catch(err => console.error("Failed to fetch admin categories", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Combine existing product categories with the ones managed by the admin
  const allCategorySuggestions = [...new Set([...(existingCategories || []), ...adminCategories])].sort();

  const filteredCategories = allCategorySuggestions.filter((cat) =>
    cat.toLowerCase().includes(formData.category.toLowerCase())
  );

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Create a payload and ensure price is a number for validation
    const payload = {
      ...formData,
      price: Number(formData.price), // Always required
      // Offer price is optional. Send null if empty so it can be unset in DB.
      offerPrice: formData.offerPrice ? Number(formData.offerPrice) : null,
    };

    if (payload.offerPrice && payload.offerPrice >= payload.price) {
      alert("Offer price must be less than the original price.");
      setLoading(false);
      return;
    }

    try {
      if (editingProduct) {
        // UPDATE MODE
        await api.put(`/admin/update-product/${editingProduct._id}`, payload);
        alert("Dish Updated Successfully! ✨");
      } else {
        // ADD MODE
        await api.post("/admin/add_product", payload);
        alert("Dish Added Successfully! 🥘");
      }

      onProductAdded();
      onClose();
    } catch (error) {
      // Provide more specific feedback to the user from the backend error
      const errorMessage =
        error.response?.data?.msg ||
        "Failed to save dish. Please check the console for details.";
      console.error("Save Dish Error:", error.response?.data || error);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingProduct ? "Edit Dish" : "Add New Dish"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-all shadow-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto no-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                  Dish Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-gray-50 focus:bg-white shadow-inner"
                  placeholder="e.g. Truffle Burger"
                />
              </div>

              {/* Custom Category Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                  Category
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                    placeholder="Select or Type New..."
                    className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-gray-50 focus:bg-white shadow-inner pr-10"
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                    ▼
                  </div>
                </div>

                {showCategoryDropdown && (
                  <ul className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-48 overflow-y-auto py-2">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((cat, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setFormData({ ...formData, category: cat });
                            setShowCategoryDropdown(false);
                          }}
                          className="px-4 py-2 hover:bg-orange-50 text-sm text-gray-700 cursor-pointer transition-colors font-medium"
                        >
                          {cat}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-sm text-gray-400 italic">Press enter to add new category</li>
                    )}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-gray-50 focus:bg-white shadow-inner"
                  placeholder="e.g. 450"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                  Offer Price (₹) <span className="normal-case text-gray-400">- Optional</span>
                </label>
                <input
                  type="number"
                  name="offerPrice"
                  value={formData.offerPrice}
                  onChange={handleChange}
                  className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-gray-50 focus:bg-white shadow-inner"
                  placeholder="e.g. 399"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                Image URL / Emoji
              </label>
              <input
                type="text"
                name="image"
                required
                value={formData.image}
                onChange={handleChange}
                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-gray-50 focus:bg-white shadow-inner"
                placeholder="https://... or 🍕"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none bg-gray-50 focus:bg-white shadow-inner"
                placeholder="Briefly describe ingredients..."
              ></textarea>
            </div>

            <div className="flex items-center gap-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100 mt-2">
              <input
                type="checkbox"
                id="isBestseller"
                name="isBestseller"
                checked={formData.isBestseller}
                onChange={handleChange}
                className="w-5 h-5 text-orange-600 rounded border-orange-300 focus:ring-orange-500 cursor-pointer"
              />
              <label htmlFor="isBestseller" className="text-sm font-bold text-orange-900 cursor-pointer flex items-center gap-2 select-none">
                <span>⭐</span> Mark as Bestseller
              </label>
            </div>

            <div className="pt-4 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-transform active:scale-[0.98] flex justify-center items-center"
              >
                {loading ? "Saving..." : editingProduct ? "Update Dish" : "Add Dish to Menu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDishModal;
