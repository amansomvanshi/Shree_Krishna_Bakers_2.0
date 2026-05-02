const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const { buildOrderPricing } = require("../utils/deliveryPricing");
const {
  assertStoreIsOpenForOnlineOrders,
} = require("../utils/storeAvailability");

const getRazorpayKeys = () => ({
  keyId: (process.env.RAZORPAY_KEY_ID || "").trim(),
  keySecret: (process.env.RAZORPAY_KEY_SECRET || "").trim(),
});

const getRazorpayInstance = () => {
  const { keyId, keySecret } = getRazorpayKeys();

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderData, currency = "INR" } = req.body;

    if (!orderData?.items?.length) {
      return res.status(400).json({ error: "Valid order data is required" });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res
        .status(500)
        .json({ error: "Razorpay keys are not configured on server" });
    }

    const isDineIn = Boolean(orderData.tableNo);

    if (!isDineIn) {
      await assertStoreIsOpenForOnlineOrders();
    }

    const pricing = await buildOrderPricing(orderData, isDineIn);

    if (!isDineIn && !orderData.location) {
      return res
        .status(400)
        .json({ error: "Live location is required for delivery orders" });
    }

    const options = {
      amount: Math.round(pricing.totalAmount * 100),
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({
      ...order,
      pricing,
      keyId: getRazorpayKeys().keyId,
    });
  } catch (error) {
    if (error.code === "STORE_CLOSED") {
      return res.status(error.statusCode || 403).json({
        error: error.message,
        code: error.code,
        storeAvailability: error.storeAvailability,
      });
    }
    console.error("Razorpay Order Error:", error);
    const statusCode = error.statusCode || 500;
    const razorpayMessage = error.error?.description || error.message;
    res.status(statusCode === 401 ? 502 : 500).json({
      error:
        statusCode === 401
          ? "Razorpay authentication failed. Please verify that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are from the same Razorpay mode/account."
          : "Failed to create Razorpay order",
      details: razorpayMessage,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData, // Data to save the order in our DB
    } = req.body;

    const { keySecret } = getRazorpayKeys();

    if (!keySecret) {
      return res
        .status(500)
        .json({ error: "Razorpay keys are not configured on server" });
    }

    // Verify Signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", keySecret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const isDineIn = Boolean(orderData?.tableNo);
    const pricing = await buildOrderPricing(orderData, isDineIn);

    if (!isDineIn && !orderData?.location) {
      return res
        .status(400)
        .json({ error: "Live location is required for delivery orders" });
    }

    // Payment is verified, save order to DB
    const newOrder = new Order({
      ...orderData,
      itemsSubtotal: pricing.itemsSubtotal,
      totalAmount: pricing.totalAmount,
      deliveryCharge: pricing.deliveryCharge,
      discount: pricing.discount,
      additionalCharges: pricing.additionalCharges,
      distanceKm: pricing.distanceKm || 0,
      paymentStatus: "Paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (req.user) {
      newOrder.userId = req.user.id;
    }

    await newOrder.save();

    res.json({
      message: "Payment verified and order placed successfully!",
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error during verification" });
  }
};
