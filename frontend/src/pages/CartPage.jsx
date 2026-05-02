import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import OrderSuccess from "../components/OrderSuccess";
import LegalFooter from "../components/LegalFooter";
import { User, Mail, Phone, MapPin } from "lucide-react";
import useStoreAvailability from "../hooks/useStoreAvailability";

const CartPage = () => {
  const { cartItems, clearCart, addToCart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [orderError, setOrderError] = useState("");
  const [offers, setOffers] = useState([]);
  const [showOffers, setShowOffers] = useState(false);
  const [appliedOfferCode, setAppliedOfferCode] = useState("");
  const { storeAvailability, setStoreAvailability } = useStoreAvailability({
    autoRefreshMs: 60000,
  });

  // 🟢 NEW: Live Location States
  const [liveLocation, setLiveLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [deliveryMeta, setDeliveryMeta] = useState({
    distanceKm: null,
    deliveryCharge: 0,
    pricingLabel: "Share live location to calculate delivery fee",
  });
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [pricingMeta, setPricingMeta] = useState({
    itemsSubtotal: 0,
    deliveryCharge: 0,
    additionalCharges: [],
    additionalChargesTotal: 0,
    discount: null,
    discountAmount: 0,
    totalAmount: 0,
  });

  // 🟢 NEW: Customer Details State
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // 🟢 NEW: State for Admin/Table logic
  const [tableNo, setTableNo] = useState("");
  const [userRole, setUserRole] = useState("user");
  const [roleReady, setRoleReady] = useState(false);

  const buildOrderItems = useCallback(
    () =>
      cartItems.map((item) => {
        const payload = {
          name: item.name,
          quantity: item.quantity,
          price: item.offerPrice || item.price,
        };

        if (item._id) {
          payload.productId = item._id;
        }

        return payload;
      }),
    [cartItems],
  );

  // 1. Check User Role & Pre-fill Details on Load
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserRole(user.role);
      setCustomerInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
    setRoleReady(true);
  }, []);

  // 2. Calculate Totals
  // IMPORTANT: This assumes getCartTotal() in your context is also updated.
  // We recalculate here to be safe and for display.
  const subtotal = cartItems.reduce(
    (total, item) => total + (item.offerPrice || item.price) * item.quantity,
    0,
  );
  // Delivery fee now comes from the backend based on live distance.
  const delivery =
    userRole === "admin" ? 0 : subtotal > 0 ? pricingMeta.deliveryCharge : 0;
  const additionalCharges =
    subtotal > 0 ? pricingMeta.additionalCharges || [] : [];
  const additionalChargesTotal =
    subtotal > 0 ? pricingMeta.additionalChargesTotal || 0 : 0;
  const discount = subtotal > 0 ? pricingMeta.discount : null;
  const discountAmount = subtotal > 0 ? pricingMeta.discountAmount || 0 : 0;
  const total =
    subtotal > 0
      ? pricingMeta.totalAmount || subtotal + delivery + additionalChargesTotal
      : 0;

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data } = await api.get("/user/offers");
        setOffers(data.offers || []);
      } catch (error) {
        console.error("Failed to load offers", error);
      }
    };

    fetchOffers();
  }, []);

  // --- HANDLE LIVE LOCATION ---
  const handleGetLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLiveLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setFieldErrors((current) => ({ ...current, location: "" }));
          setLocationLoading(false);
        },
        (error) => {
          console.error(error);
          setLocationError(
            "Location access nahi mila. Please browser me location permission allow karein.",
          );
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      setLocationError("Aapke browser me geolocation support nahi hai.");
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      roleReady &&
      userRole !== "admin" &&
      cartItems.length > 0 &&
      !liveLocation &&
      !locationLoading
    ) {
      handleGetLocation();
    }
  }, [
    cartItems.length,
    handleGetLocation,
    liveLocation,
    locationLoading,
    roleReady,
    userRole,
  ]);

  useEffect(() => {
    const fetchPricingSummary = async () => {
      if (!roleReady || cartItems.length === 0) {
        setPricingMeta({
          itemsSubtotal: 0,
          deliveryCharge: 0,
          additionalCharges: [],
          additionalChargesTotal: 0,
          discount: null,
          discountAmount: 0,
          totalAmount: 0,
        });
        return;
      }

      if (userRole !== "admin" && !liveLocation) {
        return;
      }

      setDeliveryLoading(true);

      try {
        const { data } = await api.post("/user/pricing-summary", {
          isDineIn: userRole === "admin",
          orderData: {
            items: buildOrderItems(),
            location: liveLocation,
            offerCode: appliedOfferCode,
          },
        });

        setPricingMeta({
          itemsSubtotal: data.itemsSubtotal,
          deliveryCharge: data.deliveryCharge,
          additionalCharges: data.additionalCharges || [],
          additionalChargesTotal: data.additionalChargesTotal || 0,
          discount: data.discount,
          discountAmount: data.discountAmount || 0,
          totalAmount: data.totalAmount,
        });
        setDeliveryMeta({
          distanceKm: data.distanceKm,
          deliveryCharge: data.deliveryCharge,
          pricingLabel: data.pricingLabel,
        });
        if (data.storeAvailability) {
          setStoreAvailability((current) => ({
            ...current,
            ...data.storeAvailability,
          }));
        }
      } catch (error) {
        console.error("Delivery charge fetch failed:", error);
        setDeliveryMeta({
          distanceKm: null,
          deliveryCharge: 0,
          pricingLabel: "Delivery fee could not be calculated",
        });
      } finally {
        setDeliveryLoading(false);
      }
    };

    fetchPricingSummary();
  }, [
    appliedOfferCode,
    buildOrderItems,
    cartItems.length,
    liveLocation,
    roleReady,
    setStoreAvailability,
    userRole,
  ]);

  const validateOrderFields = () => {
    const errors = {};

    if (!customerInfo.name.trim()) {
      errors.name = "Customer name required hai.";
    }

    if (userRole === "admin") {
      if (!tableNo) {
        errors.tableNo = "Table number select karein.";
      }
    } else {
      if (!customerInfo.email.trim()) {
        errors.email = "Email address required hai.";
      } else if (!/^\S+@\S+\.\S+$/.test(customerInfo.email.trim())) {
        errors.email = "Valid email address enter karein.";
      }

      if (!customerInfo.phone.trim()) {
        errors.phone = "Phone number required hai.";
      } else if (!/^[6-9]\d{9}$/.test(customerInfo.phone.trim())) {
        errors.phone = "Valid 10 digit Indian phone number enter karein.";
      }

      if (!customerInfo.address.trim()) {
        errors.address = "Complete delivery address required hai.";
      }

      if (!liveLocation) {
        errors.location =
          "Live location required hai. Please location allow karein.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- HANDLE ORDER LOGIC ---
  const handlePlaceOrder = async () => {
    setOrderError("");

    if (userRole !== "admin" && !storeAvailability.isCurrentlyOpen) {
      setOrderError(
        storeAvailability.closedMessage || "We are not serviceable currently.",
      );
      return;
    }

    if (!validateOrderFields()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Prepare Order Data
      const orderData = {
        items: buildOrderItems(),
        totalAmount: total,
        offerCode: appliedOfferCode,
        address:
          userRole === "admin"
            ? customerInfo.address || "Dine-in"
            : customerInfo.address,
        tableNo: userRole === "admin" ? tableNo : "",
        customerDetails: {
          name: customerInfo.name,
          email:
            userRole === "admin"
              ? customerInfo.email || "admin@order.com"
              : customerInfo.email,
          phone:
            userRole === "admin"
              ? customerInfo.phone || "0000000000"
              : customerInfo.phone,
        },
        location: liveLocation,
      };

      // 🛑 DIFFERENT LOGIC FOR ADMIN (Kitchen Orders) VS USER (Payments)
      if (userRole === "admin") {
        // Direct order for Kitchen (Cash/Offline)
        await api.post("/user/place-order", orderData);
        setLoading(false);
        setShowSuccess(true);
        clearCart();
        return;
      }

      // 💳 RAZORPAY PAYMENT FLOW FOR USERS
      // 2. Create Razorpay Order on Backend
      const { data: rzpOrder } = await api.post("/user/create-razorpay-order", {
        orderData,
      });

      // 3. Open Razorpay Checkout Modal
      const razorpayKey =
        rzpOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay checkout script load nahi hua. Please internet connection check karein.",
        );
      }

      if (!razorpayKey) {
        throw new Error(
          "Razorpay key configure nahi hai. Backend .env me RAZORPAY_KEY_ID set karein.",
        );
      }

      const options = {
        key: razorpayKey,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "Shree Krishna Bakers",
        description: "Payment for your yummy order",
        order_id: rzpOrder.id,
        handler: async (response) => {
          try {
            // 4. Verify Payment on Backend
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: orderData, // Pass the original order data to save in DB
            };

            const verifyRes = await api.post(
              "/user/verify-payment",
              verificationData,
            );

            if (verifyRes.data.orderId) {
              setLoading(false);
              setShowSuccess(true);
              clearCart();
            }
          } catch (err) {
            console.error("Verification Failed:", err);
            setOrderError(
              "Payment verification failed. Please support se contact karein.",
            );
            setLoading(false);
          }
        },
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone,
        },
        notes: {
          address: customerInfo.address,
        },
        theme: {
          color: "#EA580C", // orange-600
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response.error);
        setOrderError(
          response.error?.description ||
            "Payment failed. Please dobara try karein.",
        );
        setLoading(false);
      });
      rzp.open();
    } catch (error) {
      console.error("Order Failed:", error);
      if (error.response?.data?.storeAvailability) {
        setStoreAvailability((current) => ({
          ...current,
          ...error.response.data.storeAvailability,
        }));
      }
      setOrderError(
        error.response?.data?.error ||
          error.message ||
          "Failed to initiate payment. Try again.",
      );
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    // Logic: Admin -> Back to Menu (for next order), User -> Account (to track order)
    if (userRole === "admin") {
      navigate("/menu");
    } else {
      navigate("/account");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 max-w-[600px] mx-auto bg-white min-h-screen relative"
    >
      <h1 className="text-2xl font-bold mb-6">
        {userRole === "admin" ? "🍽️ New Table Order" : "Your Cart"}
      </h1>

      {cartItems.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-gray-500 text-lg">Your cart is empty 🛒</p>
          <button
            onClick={() => navigate("/menu")}
            className="mt-4 text-orange-600 font-bold hover:underline"
          >
            Browse Menu
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-10">
            {cartItems.map((item) => (
              <div
                key={item._id || item.id}
                className="flex flex-col p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-gray-800 text-lg">
                    {item.name}
                  </span>
                  <span className="font-bold text-gray-900 text-lg tabular-nums">
                    ₹{(item.offerPrice || item.price) * item.quantity}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-auto">
                  {item.offerPrice && item.offerPrice < item.price ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-orange-600 font-bold">
                        ₹{item.offerPrice} each
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        ₹{item.price}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 font-medium">
                      ₹{item.price} each
                    </span>
                  )}

                  {/* Interactive Add/Remove Section */}
                  <div className="flex items-center justify-between w-24 px-2 py-1 bg-orange-600 border border-orange-600 rounded-lg text-white font-bold shadow-md">
                    <button
                      onClick={() => removeFromCart(item._id || item.id)}
                      className="text-xl px-2 active:scale-75 transition-transform"
                    >
                      -
                    </button>
                    <span className="tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="text-xl px-2 active:scale-75 transition-transform"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 🟢 DELIVERY / ORDER DETAILS FORM */}
          <div className="mb-8 space-y-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MapPin size={20} className="text-orange-600" />
              {userRole === "admin" ? "Order Details" : "Delivery Details"}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerInfo.name}
                  onChange={(e) => {
                    setCustomerInfo({ ...customerInfo, name: e.target.value });
                    setFieldErrors((current) => ({ ...current, name: "" }));
                  }}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-sm ${fieldErrors.name ? "border-red-300" : "border-gray-100"}`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs font-semibold text-red-500">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {userRole !== "admin" && (
                <>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={customerInfo.email}
                      onChange={(e) => {
                        setCustomerInfo({
                          ...customerInfo,
                          email: e.target.value,
                        });
                        setFieldErrors((current) => ({
                          ...current,
                          email: "",
                        }));
                      }}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-sm ${fieldErrors.email ? "border-red-300" : "border-gray-100"}`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs font-semibold text-red-500">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={customerInfo.phone}
                      onChange={(e) => {
                        setCustomerInfo({
                          ...customerInfo,
                          phone: e.target.value,
                        });
                        setFieldErrors((current) => ({
                          ...current,
                          phone: "",
                        }));
                      }}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-sm ${fieldErrors.phone ? "border-red-300" : "border-gray-100"}`}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs font-semibold text-red-500">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-3 text-gray-400"
                      size={18}
                    />
                    <textarea
                      placeholder="Complete Delivery Address"
                      value={customerInfo.address}
                      onChange={(e) => {
                        setCustomerInfo({
                          ...customerInfo,
                          address: e.target.value,
                        });
                        setFieldErrors((current) => ({
                          ...current,
                          address: "",
                        }));
                      }}
                      rows={3}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-sm resize-none ${fieldErrors.address ? "border-red-300" : "border-gray-100"}`}
                    />
                    {fieldErrors.address && (
                      <p className="mt-1 text-xs font-semibold text-red-500">
                        {fieldErrors.address}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={locationLoading}
                      className="mt-2 w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold transition-all text-sm border bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {locationLoading
                        ? "Fetching Location..."
                        : liveLocation
                          ? `Location Added (${liveLocation.lat.toFixed(4)}, ${liveLocation.lng.toFixed(4)})`
                          : "Share Live Location"}
                    </button>
                    {(fieldErrors.location || locationError) && (
                      <p className="mt-1 text-xs font-semibold text-red-500">
                        {fieldErrors.location || locationError}
                      </p>
                    )}

                    {liveLocation && (
                      <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm">
                        <div className="flex items-center justify-between gap-3 text-gray-800">
                          <span className="font-semibold">
                            Distance from bakery
                          </span>
                          <span className="font-bold">
                            {deliveryLoading
                              ? "Calculating..."
                              : `${deliveryMeta.distanceKm ?? "--"} km`}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3 text-gray-800">
                          <span className="font-semibold">Delivery fee</span>
                          <span className="font-bold text-orange-700">
                            {deliveryLoading
                              ? "Calculating..."
                              : deliveryMeta.deliveryCharge === 0
                                ? "FREE"
                                : `₹${deliveryMeta.deliveryCharge}`}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-orange-700">
                          {deliveryMeta.pricingLabel}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 🟢 ADMIN ONLY: TABLE SELECTION GRID */}
          {userRole === "admin" && (
            <div className="mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
              <label className="block text-orange-800 font-bold mb-2">
                Select Table Number
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setTableNo(String(num));
                      setFieldErrors((current) => ({
                        ...current,
                        tableNo: "",
                      }));
                    }}
                    className={`py-2 rounded-lg font-bold transition-all ${
                      tableNo === String(num)
                        ? "bg-orange-600 text-white shadow-md transform scale-105"
                        : "bg-white text-gray-600 border border-orange-200"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {fieldErrors.tableNo && (
                <p className="mt-2 text-xs font-semibold text-red-500">
                  {fieldErrors.tableNo}
                </p>
              )}
            </div>
          )}

          {/* BILL DETAILS */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Item Total</span>
              <span>₹{subtotal}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowOffers(true)}
              className="w-full rounded-xl border border-dashed border-orange-200 bg-orange-50 px-4 py-3 text-left text-sm font-bold text-orange-700"
            >
              View Offers
              {discount
                ? ` • Applied: ${discount.title}`
                : " • Apply coupon or auto offer"}
            </button>

            {userRole !== "admin" && (
              <div
                className={`rounded-xl border px-4 py-3 text-xs ${
                  storeAvailability.isCurrentlyOpen
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {storeAvailability.checkoutNotice}
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>{discount?.title || "Offer Discount"}</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}

            {/* Show Delivery Fee ONLY for regular users */}
            {userRole !== "admin" && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
              </div>
            )}

            {additionalCharges.map((charge, index) => (
              <div
                key={`${charge.name}-${index}`}
                className="flex justify-between text-gray-600"
              >
                <span>
                  {charge.name}
                  {charge.type === "percentage" ? ` (${charge.value}%)` : ""}
                </span>
                <span>₹{charge.amount}</span>
              </div>
            ))}

            <div className="flex justify-between text-xl font-bold pt-4 border-t">
              <span>Total to Pay</span>
              <span>₹{total}</span>
            </div>
          </div>

          {orderError && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {orderError}
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={loading || deliveryLoading}
            className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl mt-8 shadow-lg active:scale-95 transition-transform disabled:bg-gray-400"
          >
            {loading
              ? "Processing..."
              : deliveryLoading
                ? "Calculating total..."
                : userRole !== "admin" && !storeAvailability.isCurrentlyOpen
                  ? "Store Currently Closed"
                  : userRole === "admin"
                    ? "Fire Order to Kitchen"
                    : "Place Order"}
          </button>
        </>
      )}

      <LegalFooter />
      {/* SUCCESS ANIMATION POPUP */}
      <OrderSuccess show={showSuccess} onClose={handleCloseSuccess} />

      {showOffers && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-[520px] rounded-3xl p-5 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Available Offers
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Active offers only. Manual coupon apply kar sakte ho.
                </p>
              </div>
              <button
                onClick={() => setShowOffers(false)}
                className="w-9 h-9 rounded-full bg-gray-100 font-bold text-gray-500"
              >
                x
              </button>
            </div>

            <div className="space-y-3">
              {offers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">
                  No active offers right now.
                </div>
              ) : (
                offers.map((offer) => {
                  const canApply =
                    subtotal >= Number(offer.minOrderAmount || 0);
                  const isManual = offer.applyType === "manual";
                  const isApplied =
                    (isManual && appliedOfferCode === offer.code) ||
                    (!isManual &&
                      discount?.applyType === "automatic" &&
                      discount?.title === offer.title);

                  return (
                    <div
                      key={offer._id}
                      className="rounded-2xl border border-gray-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-gray-900">
                            {offer.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {offer.discountType === "percentage"
                              ? `${offer.discountValue}% off`
                              : `₹${offer.discountValue} off`}{" "}
                            on orders above ₹{offer.minOrderAmount}
                          </p>
                          <p className="text-xs font-bold text-orange-600 mt-1">
                            {isManual
                              ? `Coupon: ${offer.code}`
                              : "Automatic offer"}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${canApply ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {canApply
                            ? "Eligible"
                            : `Add ₹${Number(offer.minOrderAmount || 0) - subtotal}`}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {isManual ? (
                          <button
                            type="button"
                            disabled={!canApply}
                            onClick={() => {
                              setAppliedOfferCode(offer.code);
                              setShowOffers(false);
                            }}
                            className="flex-1 rounded-xl bg-orange-600 disabled:bg-gray-300 text-white py-2 text-sm font-bold"
                          >
                            {isApplied ? "Applied" : "Apply Coupon"}
                          </button>
                        ) : (
                          <div className="flex-1 rounded-xl bg-green-50 text-green-700 py-2 text-center text-sm font-bold">
                            {isApplied
                              ? "Auto Applied"
                              : "Auto applies when eligible"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {appliedOfferCode && (
              <button
                type="button"
                onClick={() => {
                  setAppliedOfferCode("");
                  setShowOffers(false);
                }}
                className="mt-4 w-full rounded-xl bg-red-50 py-3 text-sm font-bold text-red-600"
              >
                Remove Applied Coupon
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CartPage;
