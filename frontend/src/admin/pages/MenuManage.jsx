import React, { useState, useEffect, useMemo } from "react";
import api from "../../utils/api";
import AddDishModal from "../components/AddDishModal"; // Import your Modal
import CategoryManagerModal from "../components/CategoryManagerModal"; // Import Category Modal

const MenuManagement = () => {
  // --- 1. STATE MANAGEMENT ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls the popup
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); // Controls Category Modal
  const [editingProduct, setEditingProduct] = useState(null); // The product being edited
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSection, setActiveSection] = useState("menu");

  // --- DELIVERY PRICING SETTINGS ---
  const [deliverySettings, setDeliverySettings] = useState({
    freeDeliveryKm: 3,
    deliveryBaseCharge: 20,
    deliveryPerKmRate: 5,
    additionalCharges: [],
  });
  const [deliveryDraft, setDeliveryDraft] = useState({
    freeDeliveryKm: 3,
    deliveryBaseCharge: 20,
    deliveryPerKmRate: 5,
    additionalCharges: [],
  });
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [storeTiming, setStoreTiming] = useState({
    enabled: true,
    openingTime: "07:30",
    closingTime: "22:45",
    opensAtLabel: "7:30 AM",
    closesAtLabel: "10:45 PM",
    isCurrentlyOpen: true,
    adminStatusLine: "Checking store timing...",
  });
  const [storeTimingDraft, setStoreTimingDraft] = useState({
    enabled: true,
    openingTime: "07:30",
    closingTime: "22:45",
  });
  const [isSavingStoreTiming, setIsSavingStoreTiming] = useState(false);

  // --- NEW: TODAY'S SPECIAL SETTINGS ---
  const [todaysSpecial, setTodaysSpecial] = useState("");
  const [isEditingSpecial, setIsEditingSpecial] = useState(false);
  const [newSpecial, setNewSpecial] = useState("");

  // --- 2. FETCH DATA (READ) ---
  const fetchProducts = async () => {
    try {
      const res = await api.get("/admin/products");
      // Handle response structure { products: [...] }
      const data = res.data.products || res.data || [];
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching menu:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // Fetch current delivery fee on load
    api
      .get("/admin/settings/delivery-fee")
      .then((res) => {
        const settings = {
          freeDeliveryKm: res.data.freeDeliveryKm ?? 3,
          deliveryBaseCharge: res.data.deliveryBaseCharge ?? res.data.fee ?? 20,
          deliveryPerKmRate: res.data.deliveryPerKmRate ?? 5,
          additionalCharges: res.data.additionalCharges ?? [],
        };
        setDeliverySettings(settings);
        setDeliveryDraft(settings);
      })
      .catch((err) => console.error("Failed to fetch delivery fee", err));

    api
      .get("/admin/settings/store-timing")
      .then((res) => {
        const timing = {
          enabled: res.data.enabled !== false,
          openingTime: res.data.openingTime || "07:30",
          closingTime: res.data.closingTime || "22:45",
          opensAtLabel: res.data.opensAtLabel || "7:30 AM",
          closesAtLabel: res.data.closesAtLabel || "10:45 PM",
          isCurrentlyOpen: res.data.isCurrentlyOpen !== false,
          adminStatusLine: res.data.adminStatusLine || "Store timing loaded.",
        };
        setStoreTiming(timing);
        setStoreTimingDraft({
          enabled: timing.enabled,
          openingTime: timing.openingTime,
          closingTime: timing.closingTime,
        });
      })
      .catch((err) => console.error("Failed to fetch store timing", err));

    // Fetch Today's Special on load
    api
      .get("/user/todays-special")
      .then((res) => {
        setTodaysSpecial(res.data.todaysSpecial);
        setNewSpecial(res.data.todaysSpecial);
      })
      .catch((err) => console.error("Failed to fetch todays special", err));
  }, []);

  const handleUpdateDeliverySettings = async () => {
    const nextSettings = {
      freeDeliveryKm: Number(deliveryDraft.freeDeliveryKm),
      deliveryBaseCharge: Number(deliveryDraft.deliveryBaseCharge),
      deliveryPerKmRate: Number(deliveryDraft.deliveryPerKmRate),
      additionalCharges: (deliveryDraft.additionalCharges || [])
        .map((charge) => ({
          name: String(charge.name || "").trim(),
          type: charge.type === "fixed" ? "fixed" : "percentage",
          value: Number(charge.value || 0),
          enabled: charge.enabled !== false,
        }))
        .filter((charge) => charge.name),
    };

    const invalidValue = [
      nextSettings.freeDeliveryKm,
      nextSettings.deliveryBaseCharge,
      nextSettings.deliveryPerKmRate,
    ].some((value) => !Number.isFinite(value) || value < 0);

    const invalidCharge = nextSettings.additionalCharges.some(
      (charge) => !Number.isFinite(charge.value) || charge.value < 0,
    );

    if (invalidValue || invalidCharge) {
      alert("Please enter valid delivery pricing numbers.");
      return;
    }

    try {
      setIsSavingDelivery(true);
      const { data } = await api.put(
        "/admin/settings/delivery-fee",
        nextSettings,
      );
      const savedSettings = {
        freeDeliveryKm: data.freeDeliveryKm,
        deliveryBaseCharge: data.deliveryBaseCharge,
        deliveryPerKmRate: data.deliveryPerKmRate,
        additionalCharges: data.additionalCharges ?? [],
      };
      setDeliverySettings(savedSettings);
      setDeliveryDraft(savedSettings);
    } catch (error) {
      console.error("Failed to update fee", error);
      alert("Failed to update delivery pricing");
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const updateChargeDraft = (index, updates) => {
    setDeliveryDraft((current) => ({
      ...current,
      additionalCharges: current.additionalCharges.map((charge, chargeIndex) =>
        chargeIndex === index ? { ...charge, ...updates } : charge,
      ),
    }));
  };

  const addChargeDraft = () => {
    setDeliveryDraft((current) => ({
      ...current,
      additionalCharges: [
        ...(current.additionalCharges || []),
        { name: "Surge Charge", type: "fixed", value: 0, enabled: true },
      ],
    }));
  };

  const removeChargeDraft = (index) => {
    setDeliveryDraft((current) => ({
      ...current,
      additionalCharges: current.additionalCharges.filter(
        (_, chargeIndex) => chargeIndex !== index,
      ),
    }));
  };

  const handleUpdateSpecial = async () => {
    try {
      await api.put("/admin/settings/todays-special", {
        todaysSpecial: newSpecial,
      });
      setTodaysSpecial(newSpecial);
      setIsEditingSpecial(false);
    } catch (error) {
      console.error("Failed to update today's special", error);
      alert("Failed to update Today's Special");
    }
  };

  const handleUpdateStoreTiming = async () => {
    try {
      setIsSavingStoreTiming(true);
      const { data } = await api.put("/admin/settings/store-timing", {
        enabled: storeTimingDraft.enabled,
        openingTime: storeTimingDraft.openingTime,
        closingTime: storeTimingDraft.closingTime,
      });

      const savedTiming = {
        enabled: data.enabled !== false,
        openingTime: data.openingTime || "07:30",
        closingTime: data.closingTime || "22:45",
        opensAtLabel: data.opensAtLabel || "7:30 AM",
        closesAtLabel: data.closesAtLabel || "10:45 PM",
        isCurrentlyOpen: data.isCurrentlyOpen !== false,
        adminStatusLine: data.adminStatusLine || "Store timing updated.",
      };

      setStoreTiming(savedTiming);
      setStoreTimingDraft({
        enabled: savedTiming.enabled,
        openingTime: savedTiming.openingTime,
        closingTime: savedTiming.closingTime,
      });
    } catch (error) {
      console.error("Failed to update store timing", error);
      alert(error.response?.data?.error || "Failed to update store timing");
    } finally {
      setIsSavingStoreTiming(false);
    }
  };

  // --- 3. TOGGLE STOCK (UPDATE) ---
  const handleToggleStock = async (id) => {
    try {
      // A. Optimistic Update: Update UI immediately so it feels instant
      const updatedProducts = products.map((p) =>
        p._id === id ? { ...p, isAvailable: !p.isAvailable } : p,
      );
      setProducts(updatedProducts);

      // B. API Call: Tell Backend to flip the switch
      await api.put(`/admin/toggle-stock/${id}`);
    } catch (error) {
      console.error("Stock update failed", error);
      alert("Failed to update stock");
      fetchProducts(); // Revert changes if server fails
    }
  };

  // --- 3.5 TOGGLE BESTSELLER (UPDATE) ---
  const handleToggleBestseller = async (id) => {
    try {
      const updatedProducts = products.map((p) =>
        p._id === id ? { ...p, isBestseller: !p.isBestseller } : p,
      );
      setProducts(updatedProducts);

      await api.put(`/admin/toggle-bestseller/${id}`);
    } catch (error) {
      console.error("Bestseller update failed", error);
      alert("Failed to update bestseller status");
      fetchProducts();
    }
  };

  // --- 4. DELETE PRODUCT (DELETE) ---
  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this item?")
    )
      return;

    try {
      // A. API Call
      await api.delete(`/admin/remove-product/${id}`);

      // B. UI Update: Remove item from list without reloading
      setProducts(products.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Delete failed", error);
      alert("Could not delete product");
    }
  };

  // --- 5. EDIT PRODUCT ---
  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // --- 5. DYNAMIC CATEGORIES ---
  const dynamicCategories = useMemo(() => {
    if (!products.length) return ["All"];
    const allCats = products.map((p) => p.category);
    // Remove duplicates and sort
    return ["All", ...[...new Set(allCats)].sort()];
  }, [products]);

  // --- 6. FILTER LOGIC ---
  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

  // --- 7. IMAGE HELPER (URL vs EMOJI) ---
  const renderImage = (imgString) => {
    if (!imgString)
      return (
        <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-400">
          No Image
        </div>
      );

    // Check if it's a URL (http/https)
    if (imgString.startsWith("http")) {
      return (
        <img
          src={imgString}
          alt="Dish"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      );
    }
    // Assume it's an Emoji
    return (
      <div className="bg-orange-50 w-full h-full flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">
        {imgString}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage {products.length} items across your menu.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* MANAGE CATEGORIES BUTTON */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-gray-200 transition-transform active:scale-95 h-[48px]"
          >
            Manage Categories
          </button>

          {/* ADD BUTTON (Opens Modal) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-2 transition-transform active:scale-95 h-[48px]"
          >
            <span>+</span> Add New Dish
          </button>
        </div>
      </div>

      {/* SECTION TABS */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <div className="flex gap-2 min-w-max p-1">
          {[
            { id: "menu", label: "Menu Items" },
            { id: "delivery", label: "Delivery Pricing" },
            { id: "timing", label: "Store Timing" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeSection === tab.id
                  ? "bg-gray-800 text-white shadow-md"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TODAY'S SPECIAL SETTER */}
      {activeSection === "menu" && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <span className="text-sm font-bold text-gray-600 min-w-max">
            Today's Special:
          </span>
          {isEditingSpecial ? (
            <div className="flex items-center gap-2 w-full max-w-lg">
              <input
                type="text"
                value={newSpecial}
                onChange={(e) => setNewSpecial(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-orange-500"
                placeholder="e.g. 20% OFF on all Cakes! 🎂"
              />
              <button
                onClick={handleUpdateSpecial}
                className="text-green-600 text-sm font-bold bg-green-50 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingSpecial(false);
                  setNewSpecial(todaysSpecial);
                }}
                className="text-gray-400 text-sm font-bold hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-orange-600 font-bold text-md truncate">
                {todaysSpecial}
              </span>
              <button
                onClick={() => setIsEditingSpecial(true)}
                className="text-xs text-blue-500 hover:underline font-semibold flex-shrink-0"
              >
                Edit Text
              </button>
            </div>
          )}
        </div>
      )}

      {activeSection === "delivery" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Delivery Pricing
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Cart aur payment dono me yahi distance based delivery fee apply
                hogi.
              </p>
            </div>
            <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 text-sm text-orange-800">
              Free {deliverySettings.freeDeliveryKm} km, then ₹
              {deliverySettings.deliveryBaseCharge} + ₹
              {deliverySettings.deliveryPerKmRate}/km
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-bold text-gray-600">
                Free delivery up to (km)
              </span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={deliveryDraft.freeDeliveryKm}
                onChange={(e) =>
                  setDeliveryDraft({
                    ...deliveryDraft,
                    freeDeliveryKm: e.target.value,
                  })
                }
                className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-gray-600">
                Charge starts from (₹)
              </span>
              <input
                type="number"
                min="0"
                value={deliveryDraft.deliveryBaseCharge}
                onChange={(e) =>
                  setDeliveryDraft({
                    ...deliveryDraft,
                    deliveryBaseCharge: e.target.value,
                  })
                }
                className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-gray-600">
                Per km rate (₹)
              </span>
              <input
                type="number"
                min="0"
                value={deliveryDraft.deliveryPerKmRate}
                onChange={(e) =>
                  setDeliveryDraft({
                    ...deliveryDraft,
                    deliveryPerKmRate: e.target.value,
                  })
                }
                className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-gray-800">
                  GST, Surge & Other Charges
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Percentage charges item total par calculate honge. Fixed
                  charges direct add honge.
                </p>
              </div>
              <button
                type="button"
                onClick={addChargeDraft}
                className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-bold"
              >
                + Add Charge
              </button>
            </div>

            <div className="space-y-3">
              {(deliveryDraft.additionalCharges || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-400">
                  No tax or extra charge added yet.
                </div>
              ) : (
                deliveryDraft.additionalCharges.map((charge, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 lg:grid-cols-[1fr_150px_130px_90px_80px] gap-3 rounded-xl border border-gray-100 bg-white p-3"
                  >
                    <input
                      type="text"
                      value={charge.name}
                      onChange={(e) =>
                        updateChargeDraft(index, { name: e.target.value })
                      }
                      placeholder="GST & Other Tax"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
                    />
                    <select
                      value={charge.type}
                      onChange={(e) =>
                        updateChargeDraft(index, { type: e.target.value })
                      }
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
                    >
                      <option value="percentage">Percentage %</option>
                      <option value="fixed">Fixed ₹</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={charge.value}
                      onChange={(e) =>
                        updateChargeDraft(index, { value: e.target.value })
                      }
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateChargeDraft(index, {
                          enabled: charge.enabled === false,
                        })
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                        charge.enabled === false
                          ? "bg-gray-100 text-gray-500"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {charge.enabled === false ? "Off" : "On"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeChargeDraft(index)}
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleUpdateDeliverySettings}
              disabled={isSavingDelivery}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-100 transition-transform active:scale-95"
            >
              {isSavingDelivery ? "Saving..." : "Save Delivery Pricing"}
            </button>
            <button
              onClick={() => setDeliveryDraft(deliverySettings)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {activeSection === "timing" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Store Timing</h2>
              <p className="text-sm text-gray-500 mt-1">
                Yahin se online order ka opening aur closing time control hoga.
              </p>
            </div>
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                storeTiming.isCurrentlyOpen
                  ? "bg-emerald-50 border border-emerald-100 text-emerald-800"
                  : "bg-amber-50 border border-amber-100 text-amber-800"
              }`}
            >
              {storeTiming.adminStatusLine}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-4">
            <label className="flex items-center justify-between gap-4 rounded-xl bg-white border border-gray-100 px-4 py-3">
              <div>
                <p className="font-bold text-gray-800">Enable timing control</p>
                <p className="text-xs text-gray-500 mt-1">
                  Off karne par users kisi bhi time order place kar paayenge.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setStoreTimingDraft((current) => ({
                    ...current,
                    enabled: !current.enabled,
                  }))
                }
                className={`relative h-7 w-14 rounded-full transition-colors duration-300 cursor-pointer ${
                  storeTimingDraft.enabled ? "bg-orange-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    storeTimingDraft.enabled ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-bold text-gray-600">
                  Opening Time
                </span>
                <input
                  type="time"
                  value={storeTimingDraft.openingTime}
                  onChange={(e) =>
                    setStoreTimingDraft((current) => ({
                      ...current,
                      openingTime: e.target.value,
                    }))
                  }
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-gray-600">
                  Closing Time
                </span>
                <input
                  type="time"
                  value={storeTimingDraft.closingTime}
                  onChange={(e) =>
                    setStoreTimingDraft((current) => ({
                      ...current,
                      closingTime: e.target.value,
                    }))
                  }
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
                />
              </label>
            </div>

            <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              Customers can browse menu anytime, but payment/order proceed only
              during the active store window.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Live customer line
              </p>
              <p className="mt-2 text-lg font-bold text-gray-900">
                {storeTiming.isCurrentlyOpen
                  ? `We are available till ${storeTiming.closesAtLabel}.`
                  : storeTiming.adminStatusLine}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Service window: {storeTiming.opensAtLabel} to{" "}
                {storeTiming.closesAtLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-900 p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                Checkout warning
              </p>
              <p className="mt-2 text-lg font-bold">
                We are not serviceable currently. Tomorrow opens at{" "}
                {storeTiming.opensAtLabel}.
              </p>
              <p className="mt-2 text-sm text-white/70">
                This line cart page me View Offers ke niche show hogi jab store
                closed hoga.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleUpdateStoreTiming}
              disabled={isSavingStoreTiming}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-100 transition-transform active:scale-95"
            >
              {isSavingStoreTiming ? "Saving..." : "Save Store Timing"}
            </button>
            <button
              onClick={() =>
                setStoreTimingDraft({
                  enabled: storeTiming.enabled,
                  openingTime: storeTiming.openingTime,
                  closingTime: storeTiming.closingTime,
                })
              }
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* CATEGORY TABS */}
      {activeSection === "menu" && (
        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <div className="flex gap-2 min-w-max p-1">
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-gray-800 text-white shadow-md"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCT GRID */}
      {activeSection === "menu" &&
        (loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">
            Loading Menu...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
              >
                {/* IMAGE CONTAINER */}
                <div className="h-36 rounded-xl overflow-hidden relative mb-4 shadow-inner bg-gray-50">
                  {renderImage(product.image)}

                  {/* 'SOLD OUT' OVERLAY */}
                  {!product.isAvailable && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                        Sold Out
                      </span>
                    </div>
                  )}
                  {/* 'BESTSELLER' BADGE */}
                  {product.isBestseller && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
                      <span>⭐</span> Bestseller
                    </div>
                  )}
                </div>

                {/* DETAILS */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-md font-bold text-gray-800 leading-tight line-clamp-1">
                    {product.name}
                  </h3>
                  {/* PRICE SECTION */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    {product.offerPrice &&
                    product.offerPrice < product.price ? (
                      <>
                        <span className="text-orange-600 font-bold text-lg">
                          ₹{product.offerPrice}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          ₹{product.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-orange-600 font-bold text-lg">
                        ₹{product.price}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-400 text-xs line-clamp-2 h-8 mb-4">
                  {product.description || "No description available."}
                </p>

                {/* ACTION FOOTER */}
                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-2">
                  {/* 1. STOCK TOGGLE */}
                  <button
                    type="button"
                    onClick={() => handleToggleStock(product._id)}
                    className="flex items-center gap-3 group/toggle"
                    aria-pressed={product.isAvailable}
                  >
                    <div
                      className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${
                        product.isAvailable ? "bg-green-500" : "bg-red-400"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm transition-transform duration-300 ${
                          product.isAvailable
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      ></div>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        product.isAvailable ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {product.isAvailable ? "In Stock" : "Out"}
                    </span>
                  </button>

                  {/* 2. BESTSELLER TOGGLE */}
                  <div
                    onClick={() => handleToggleBestseller(product._id)}
                    className="flex items-center justify-center cursor-pointer"
                    title={
                      product.isBestseller
                        ? "Remove from Bestsellers"
                        : "Mark as Bestseller"
                    }
                  >
                    <span
                      className={`text-xl transition-all hover:scale-125 ${product.isBestseller ? "text-yellow-400 drop-shadow-md" : "text-gray-200 grayscale hover:grayscale-0"}`}
                    >
                      ⭐
                    </span>
                  </div>

                  {/* 3. EDIT & DELETE BUTTONS */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(product)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      title="Edit Dish"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete Dish"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* --- ADD DISH MODAL --- */}
      {/* When successful, calls fetchProducts to update the grid instantly */}
      <AddDishModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onProductAdded={fetchProducts}
        editingProduct={editingProduct}
        existingCategories={dynamicCategories.filter((c) => c !== "All")}
      />

      {/* --- CATEGORY MANAGER MODAL --- */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};

export default MenuManagement;
