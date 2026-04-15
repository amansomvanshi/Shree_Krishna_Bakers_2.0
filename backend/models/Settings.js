const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
    deliveryFee: { type: Number, default: 40 },
    bakeryLocation: {
        lat: { type: Number, default: 26.7831716 },
        lng: { type: Number, default: 75.8243111 },
    },
    freeDeliveryKm: { type: Number, default: 3 },
    deliveryBaseCharge: { type: Number, default: 20 },
    deliveryPerKmRate: { type: Number, default: 5 },
    additionalCharges: {
        type: [
            {
                name: { type: String, required: true },
                type: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
                value: { type: Number, default: 0 },
                enabled: { type: Boolean, default: true },
            },
        ],
        default: [
            { name: "GST & Other Tax", type: "percentage", value: 0, enabled: false },
        ],
    },
    todaysSpecial: { type: String, default: "25% OFF on Large Pizzas 🍕" },
    categories: {
        type: [{ name: String, image: String }],
        default: [
            { name: "Chinese", image: "🍜" },
            { name: "Pizza", image: "🍕" },
            { name: "Rolls", image: "🌯" },
            { name: "Paratha", image: "🫓" },
            { name: "Burger", image: "🍔" },
            { name: "South Indian", image: "🍲" },
            { name: "Pasta", image: "🍝" },
            { name: "Sandwich", image: "🥪" },
            { name: "Cakes", image: "🎂" },
            { name: "Pastries", image: "🍰" },
            { name: "Shakes", image: "🥤" },
            { name: "Special Foods", image: "🍱" }
        ]
    }
});

module.exports = mongoose.model("Settings", settingsSchema);
