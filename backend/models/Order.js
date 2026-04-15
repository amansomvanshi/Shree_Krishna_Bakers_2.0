const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // 1. Who placed the order? (Optional for Guest orders)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    // For Guest Orders or just for redundancy
    customerDetails: {
      name: String,
      email: String,
      phone: String,
    },

    // 2. What did they order? (Array of items)
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String, // Store name too, in case product is deleted later
        price: Number,
        quantity: { type: Number, required: true, min: 1 },
        image: String,
      },
    ],

    // 3. Payment Details
    totalAmount: {
      type: Number,
      required: true,
    },
    itemsSubtotal: {
      type: Number,
      default: 0,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    discount: {
      title: String,
      code: String,
      applyType: String,
      discountType: String,
      discountValue: Number,
      amount: { type: Number, default: 0 },
    },
    additionalCharges: [
      {
        name: String,
        type: {
          type: String,
          enum: ["percentage", "fixed"],
          default: "fixed",
        },
        value: Number,
        amount: Number,
      },
    ],
    distanceKm: {
      type: Number,
      default: 0,
    },

    // 4. Delivery Address
    address: {
      type: String,
      required: true,
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    tableNo: {
      type: String,
      default: ""
    },
    // 5. TRACKING STATUS (The most important part for Admin & User)
    status: {
      type: String,
      enum: [
        "Order Placed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Order Placed",
    },
    // 6. Payment Details (Razorpay)
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
  },
  { timestamps: true },
); // Automatically adds 'createdAt' (Order Time)

module.exports = mongoose.model("Order", orderSchema);
