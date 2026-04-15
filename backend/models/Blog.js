const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    mediaUrl: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ["video", "image"], default: "video" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Blog", blogSchema);
