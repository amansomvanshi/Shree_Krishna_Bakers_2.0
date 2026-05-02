const { Router } = require("express");
const userRouter = Router();
const auth = require("../middleware/auth");
const {
  validateSignup,
  validateSignin,
  validateVerifyOtp,
  validatePlaceOrder,
  validateForgotPassword,
  validateResetPassword,
} = require("../middleware/validate");

// Import Controllers
// Import Controllers
const {
  signup,
  signin,
  verifyOtp,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const {
  createRazorpayOrder,
  verifyPayment,
} = require("../controllers/paymentController");

// Import Models
const Order = require("../models/Order");
const Product = require("../models/Product");
const Settings = require("../models/Settings");
const Blog = require("../models/Blog");
const Offer = require("../models/Offer");
const {
  calculateDeliveryCharge,
  getDeliveryPricingSettings,
  buildOrderPricing,
} = require("../utils/deliveryPricing");
const {
  buildStoreAvailability,
  getStoreTimingSettings,
  assertStoreIsOpenForOnlineOrders,
} = require("../utils/storeAvailability");

// 🟢 Apply Validation Middleware
userRouter.post("/signup", validateSignup, signup);
userRouter.post("/signin", validateSignin, signin);
userRouter.post("/verify-otp", validateVerifyOtp, verifyOtp);
userRouter.post("/forgot-password", validateForgotPassword, forgotPassword);
userRouter.post("/reset-password", validateResetPassword, resetPassword);

// ... (Keep the rest of your Order/Menu routes exactly as they were) ...
const optionalAuth = require("../middleware/optionalAuth");

// 🟢 Payment Routes
userRouter.post("/delivery-charge", optionalAuth, async (req, res) => {
  try {
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({ error: "Customer location is required" });
    }

    const deliverySettings = await getDeliveryPricingSettings();
    const deliverySummary = calculateDeliveryCharge(location, deliverySettings);
    res.json(deliverySummary);
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate delivery charge" });
  }
});

userRouter.post("/pricing-summary", optionalAuth, async (req, res) => {
  try {
    const { orderData = {}, isDineIn = false } = req.body;

    if (!orderData.items?.length) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    if (!isDineIn && !orderData.location) {
      return res.status(400).json({ error: "Customer location is required" });
    }

    const pricing = await buildOrderPricing(orderData, Boolean(isDineIn));
    const storeTiming = await getStoreTimingSettings();
    res.json({
      ...pricing,
      storeAvailability: buildStoreAvailability(storeTiming),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate pricing" });
  }
});

userRouter.get("/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: -1,
    });
    res.json({ blogs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

userRouter.get("/offers", async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: -1,
    });
    res.json({ offers });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

userRouter.post("/create-razorpay-order", optionalAuth, createRazorpayOrder);
userRouter.post("/verify-payment", optionalAuth, verifyPayment);

// Place Order Route - OPTIONAL AUTH & VALIDATED
userRouter.post(
  "/place-order",
  optionalAuth,
  validatePlaceOrder,
  async (req, res) => {
    try {
      const isDineIn = Boolean(req.body.tableNo);

      if (!isDineIn) {
        await assertStoreIsOpenForOnlineOrders();
      }

      const pricing = await buildOrderPricing(req.body, isDineIn);

      if (!isDineIn && !req.body.location) {
        return res
          .status(400)
          .json({ error: "Live location is required for delivery orders" });
      }

      const orderData = {
        items: req.body.items,
        itemsSubtotal: pricing.itemsSubtotal,
        totalAmount: pricing.totalAmount,
        deliveryCharge: pricing.deliveryCharge,
        discount: pricing.discount,
        additionalCharges: pricing.additionalCharges,
        distanceKm: pricing.distanceKm || 0,
        address: req.body.address,
        tableNo: req.body.tableNo || "",
        customerDetails: req.body.customerDetails,
        location: req.body.location,
      };

      // If logged in, attach userId
      if (req.user) {
        orderData.userId = req.user.id;
      }

      const newOrder = new Order(orderData);
      await newOrder.save();
      res.json({
        message: "Order placed successfully!",
        orderId: newOrder._id,
      });
    } catch (error) {
      console.log("❌ Order Error:", error.message);
      if (error.code === "STORE_CLOSED") {
        return res.status(error.statusCode || 403).json({
          error: error.message,
          code: error.code,
          storeAvailability: error.storeAvailability,
        });
      }
      res.status(500).json({ error: "Could not place order" });
    }
  },
);

// Menu Route
userRouter.get("/menu", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// Orders Route
userRouter.get("/orders", auth, async (req, res) => {
  try {
    const myOrders = await Order.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ orders: myOrders });
  } catch (error) {
    res.status(500).json({ error: "Could not fetch orders" });
  }
});

// Menu Categories Route (Public)
userRouter.get("/categories", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ categories: settings.categories || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Today's Special Route (Public)
userRouter.get("/todays-special", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({
      todaysSpecial: settings.todaysSpecial || "25% OFF on Large Pizzas 🍕",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Today's Special" });
  }
});

userRouter.get("/store-availability", async (_req, res) => {
  try {
    const storeTiming = await getStoreTimingSettings();
    res.json(buildStoreAvailability(storeTiming));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch store availability" });
  }
});

module.exports = { userRouter };
