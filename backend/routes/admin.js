const { Router } = require("express");
const adminRouter = Router();
const fs = require("node:fs");
const path = require("node:path");
const multer = require("multer");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Settings = require("../models/Settings");
const Blog = require("../models/Blog");
const Offer = require("../models/Offer");
const { DEFAULT_DELIVERY_SETTINGS } = require("../utils/deliveryPricing");
const {
  DEFAULT_STORE_TIMING,
  buildStoreAvailability,
  getStoreTimingSettings,
  normaliseStoreTiming,
  parseTimeToMinutes,
} = require("../utils/storeAvailability");
const auth = require("../middleware/auth");
const {
  validateProduct,
  validateBulkProducts,
  validateOrderStatus,
} = require("../middleware/validate");

const adminCheck = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied! Admins only." });
  }
  next();
};

const MAX_BLOG_FILE_SIZE = 5 * 1024 * 1024;
const uploadsDir = path.join(__dirname, "..", "uploads", "blogs");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const sanitizeFileName = (name = "file") =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "file";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const baseName = path.basename(file.originalname || "file", ext);
    cb(null, `${Date.now()}-${sanitizeFileName(baseName)}${ext.toLowerCase()}`);
  },
});

const blogUpload = multer({
  storage,
  limits: {
    fileSize: MAX_BLOG_FILE_SIZE,
    files: 2,
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "mediaFile") {
      const selectedMediaType = req.body.mediaType;

      if (
        selectedMediaType === "video" &&
        !file.mimetype.startsWith("video/")
      ) {
        return cb(
          new Error("Only video files are allowed when media type is Video."),
        );
      }

      if (
        selectedMediaType === "image" &&
        !file.mimetype.startsWith("image/")
      ) {
        return cb(
          new Error("Only image files are allowed when media type is Image."),
        );
      }

      if (
        !["video/", "image/"].some((type) => file.mimetype.startsWith(type))
      ) {
        return cb(new Error("Blog media file must be an image or video."));
      }
      return cb(null, true);
    }

    if (file.fieldname === "thumbnailFile") {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Thumbnail file must be an image."));
      }
      return cb(null, true);
    }

    cb(new Error("Unexpected file field."));
  },
});

const blogUploadFields = blogUpload.fields([
  { name: "mediaFile", maxCount: 1 },
  { name: "thumbnailFile", maxCount: 1 },
]);

const normalizeFileUrl = (req, file) =>
  file
    ? `${req.protocol}://${req.get("host")}/uploads/blogs/${file.filename}`
    : "";

const getLocalUploadPath = (fileUrl = "") => {
  if (!fileUrl) return null;

  try {
    const parsedUrl = new URL(fileUrl);
    if (!parsedUrl.pathname.startsWith("/uploads/blogs/")) return null;
    return path.join(__dirname, "..", parsedUrl.pathname);
  } catch (_error) {
    if (!fileUrl.startsWith("/uploads/blogs/")) return null;
    return path.join(__dirname, "..", fileUrl);
  }
};

const removeLocalUpload = (fileUrl = "") => {
  const filePath = getLocalUploadPath(fileUrl);
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const handleBlogUpload = (req, res, next) => {
  blogUploadFields(req, res, (error) => {
    if (!error) return next();

    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return res
        .status(400)
        .json({ error: "Each blog file must be 5 MB or smaller." });
    }

    return res
      .status(400)
      .json({ error: error.message || "Blog upload failed." });
  });
};

const buildBlogPayload = (req, existingBlog) => {
  const mediaFile = req.files?.mediaFile?.[0];
  const thumbnailFile = req.files?.thumbnailFile?.[0];
  const mediaUrl = req.body.mediaUrl?.trim() || existingBlog?.mediaUrl || "";
  const thumbnailUrl =
    req.body.thumbnailUrl?.trim() || existingBlog?.thumbnailUrl || "";

  return {
    title: req.body.title?.trim(),
    description: req.body.description?.trim() || "",
    mediaType: req.body.mediaType,
    sortOrder: Number(req.body.sortOrder || 0),
    isActive:
      req.body.isActive === "false"
        ? false
        : req.body.isActive !== "true"
          ? (existingBlog?.isActive ?? true)
          : true,
    mediaUrl: mediaFile ? normalizeFileUrl(req, mediaFile) : mediaUrl,
    thumbnailUrl: thumbnailFile
      ? normalizeFileUrl(req, thumbnailFile)
      : thumbnailUrl,
  };
};

const validateBlogPayload = (payload) => {
  if (!payload.title) return "Blog title is required.";
  if (!payload.mediaUrl) return "Media URL or media file is required.";
  if (!["video", "image"].includes(payload.mediaType))
    return "Media type must be image or video.";
  if (Number.isNaN(payload.sortOrder))
    return "Sort order must be a valid number.";
  return null;
};

const validateBlogSourceSelection = (req, existingBlog) => {
  const hasMediaFile = Boolean(req.files?.mediaFile?.[0]);
  const hasThumbnailFile = Boolean(req.files?.thumbnailFile?.[0]);
  const hasMediaUrl = Boolean(req.body.mediaUrl?.trim());
  const hasThumbnailUrl = Boolean(req.body.thumbnailUrl?.trim());
  const hasExistingMedia = Boolean(existingBlog?.mediaUrl);

  if (hasMediaFile && hasMediaUrl) {
    return "Use either a media link or a media file, not both.";
  }

  if (hasThumbnailFile && hasThumbnailUrl) {
    return "Use either a thumbnail link or a thumbnail image file, not both.";
  }

  if (!hasMediaFile && !hasMediaUrl && !hasExistingMedia) {
    return "Media URL or media file is required.";
  }

  return null;
};
//get all the orders

adminRouter.get("/orders", auth, adminCheck, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("userId", "name phone email")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

adminRouter.get("/products", auth, adminCheck, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

//change the order status - PROTECTED & VALIDATED
adminRouter.put(
  "/order-status/:orderId",
  auth,
  adminCheck,
  validateOrderStatus,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      // Validate that the status is one of our allowed steps
      const validStatuses = [
        "Order Placed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid Status Value" });
      }

      // Find order and update
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status: status },
        { new: true }, // Return the updated document
      );

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json({ message: `Status updated to ${status}`, order });
    } catch (error) {
      res.status(500).json({ error: "Failed to update status" });
    }
  },
);

//add a new product - PROTECTED & VALIDATED
adminRouter.post(
  "/add_product",
  auth,
  adminCheck,
  validateProduct,
  async (req, res) => {
    try {
      const {
        name,
        price,
        offerPrice,
        category,
        image,
        description,
        isBestseller,
      } = req.body;
      const newProduct = new Product({
        name,
        price,
        offerPrice,
        category,
        image,
        description,
        isBestseller: isBestseller || false,
      });
      await newProduct.save();
      res.json({
        message: "Product added successfully!",
        product: newProduct,
      });
    } catch (error) {
      console.log(error); // This prints the detailed error in your VS Code Terminal
      res.status(500).json({
        error: "Failed to add product",
        details: error.message, // This sends the specific reason to Postman
      });
    }
  },
);
// BULK ADD PRODUCTS (Upload the whole menu at once) - PROTECTED & VALIDATED
adminRouter.post(
  "/add-bulk-products",
  auth,
  adminCheck,
  validateBulkProducts,
  async (req, res) => {
    try {
      // req.body should be an ARRAY of products
      const products = req.body;

      // insertMany is a special Mongoose command for arrays
      const result = await Product.insertMany(products);

      res.json({
        message: "Menu updated successfully!",
        count: result.length,
        items: result,
      });
    } catch (error) {
      console.log("Bulk Add Error:", error); // <--- LOGS ERROR TO TERMINAL
      res
        .status(500)
        .json({ error: "Failed to add products", details: error.message });
    }
  },
);

//  REMOVE PRODUCT (Real Logic) - PROTECTED
adminRouter.delete(
  "/remove-product/:id",
  auth,
  adminCheck,
  async (req, res) => {
    try {
      const productId = req.params.id; // Get ID from URL
      const product = await Product.findByIdAndDelete(productId);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  },
);

// UPDATE PRODUCT - PROTECTED & VALIDATED
adminRouter.put(
  "/update-product/:id",
  auth,
  adminCheck,
  validateProduct,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        price,
        offerPrice,
        category,
        image,
        description,
        isBestseller,
      } = req.body;

      const product = await Product.findByIdAndUpdate(
        id,
        { name, price, offerPrice, category, image, description, isBestseller },
        { new: true },
      );

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({
        message: "Product updated successfully!",
        product,
      });
    } catch (error) {
      console.error("Update Product Error:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  },
);

//  TOGGLE AVAILABILITY (Out of Stock / In Stock) - PROTECTED
adminRouter.put("/toggle-stock/:id", auth, adminCheck, async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. Find the product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2. Flip the switch (True becomes False, False becomes True)
    product.isAvailable = !product.isAvailable;

    // 3. Save the update
    await product.save();

    res.json({
      message: `Product is now ${
        product.isAvailable ? "Available" : "Out of Stock"
      }`,
      product,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update stock status" });
  }
});

// TOGGLE BESTSELLER - PROTECTED
adminRouter.put(
  "/toggle-bestseller/:id",
  auth,
  adminCheck,
  async (req, res) => {
    try {
      const productId = req.params.id;

      // 1. Find the product
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // 2. Flip the bestseller switch
      product.isBestseller = !product.isBestseller;

      // 3. Save the update
      await product.save();

      res.json({
        message: `Product is ${product.isBestseller ? "now" : "no longer"} a bestseller`,
        product,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update bestseller status" });
    }
  },
);

adminRouter.get("/analytics", auth, adminCheck, async (req, res) => {
  try {
    // 1. TOTALS (Lifetime)
    const totalStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $count: {} },
        },
      },
    ]);

    // 2. TODAY'S STATS
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: "$totalAmount" },
          todayOrders: { $count: {} },
        },
      },
    ]);

    // 3. CHART DATA (Last 7 Days)
    const last7Days = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          dailyRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 7 },
    ]);

    // 🟢 4. RECENT HISTORY (Delivered Orders Only)
    // This fetches the actual table data you asked for
    const recentHistory = await Order.find({ status: "Delivered" })
      .sort({ createdAt: -1 }) // Newest first
      .limit(50) // Limit to last 50 to keep it fast
      .populate("userId", "name email");
    console.log("---------------- ANALYTICS DEBUG ----------------");
    console.log("Searching for status: 'Delivered'");
    console.log(`Found ${recentHistory.length} delivered orders.`);
    if (recentHistory.length > 0) {
      console.log("Sample Order:", recentHistory[0]);
    }
    console.log("-------------------------------------------------");
    res.json({
      total: totalStats[0] || { totalRevenue: 0, totalOrders: 0 },
      today: todayStats[0] || { todayRevenue: 0, todayOrders: 0 },
      trend: last7Days,
      history: recentHistory, // <--- Sending this to frontend
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Analytics failed" });
  }
});

// --- BLOG / VIDEO CONTENT MANAGEMENT ---
adminRouter.get("/blogs", auth, adminCheck, async (req, res) => {
  try {
    const blogs = await Blog.find({}).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ blogs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

adminRouter.post(
  "/blogs",
  auth,
  adminCheck,
  handleBlogUpload,
  async (req, res) => {
    try {
      const sourceSelectionError = validateBlogSourceSelection(req);
      if (sourceSelectionError) {
        removeLocalUpload(
          req.files?.mediaFile?.[0]
            ? normalizeFileUrl(req, req.files.mediaFile[0])
            : "",
        );
        removeLocalUpload(
          req.files?.thumbnailFile?.[0]
            ? normalizeFileUrl(req, req.files.thumbnailFile[0])
            : "",
        );
        return res.status(400).json({ error: sourceSelectionError });
      }

      const payload = buildBlogPayload(req);
      const validationError = validateBlogPayload(payload);

      if (validationError) {
        removeLocalUpload(payload.mediaUrl);
        removeLocalUpload(payload.thumbnailUrl);
        return res.status(400).json({ error: validationError });
      }

      const blog = await Blog.create(payload);
      res.json({ message: "Blog added successfully", blog });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to add blog", details: error.message });
    }
  },
);

adminRouter.put(
  "/blogs/:id",
  auth,
  adminCheck,
  handleBlogUpload,
  async (req, res) => {
    try {
      const existingBlog = await Blog.findById(req.params.id);
      if (!existingBlog)
        return res.status(404).json({ error: "Blog not found" });

      const sourceSelectionError = validateBlogSourceSelection(
        req,
        existingBlog,
      );
      if (sourceSelectionError) {
        removeLocalUpload(
          req.files?.mediaFile?.[0]
            ? normalizeFileUrl(req, req.files.mediaFile[0])
            : "",
        );
        removeLocalUpload(
          req.files?.thumbnailFile?.[0]
            ? normalizeFileUrl(req, req.files.thumbnailFile[0])
            : "",
        );
        return res.status(400).json({ error: sourceSelectionError });
      }

      const payload = buildBlogPayload(req, existingBlog);
      const validationError = validateBlogPayload(payload);

      if (validationError) {
        removeLocalUpload(req.files?.mediaFile?.[0] ? payload.mediaUrl : "");
        removeLocalUpload(
          req.files?.thumbnailFile?.[0] ? payload.thumbnailUrl : "",
        );
        return res.status(400).json({ error: validationError });
      }

      const oldMediaUrl = existingBlog.mediaUrl;
      const oldThumbnailUrl = existingBlog.thumbnailUrl;

      const blog = await Blog.findByIdAndUpdate(req.params.id, payload, {
        new: true,
      });
      if (!blog) return res.status(404).json({ error: "Blog not found" });

      if (req.files?.mediaFile?.[0] && oldMediaUrl !== blog.mediaUrl) {
        removeLocalUpload(oldMediaUrl);
      }
      if (
        req.files?.thumbnailFile?.[0] &&
        oldThumbnailUrl !== blog.thumbnailUrl
      ) {
        removeLocalUpload(oldThumbnailUrl);
      }

      res.json({ message: "Blog updated successfully", blog });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to update blog", details: error.message });
    }
  },
);

adminRouter.put("/blogs/:id/toggle", auth, adminCheck, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    blog.isActive = !blog.isActive;
    await blog.save();
    res.json({ message: "Blog status updated", blog });
  } catch (error) {
    res.status(500).json({ error: "Failed to update blog status" });
  }
});

adminRouter.delete("/blogs/:id", auth, adminCheck, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    removeLocalUpload(blog.mediaUrl);
    removeLocalUpload(blog.thumbnailUrl);
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

// --- OFFERS MANAGEMENT ---
const seedDefaultOffers = async () => {
  const count = await Offer.countDocuments();
  if (count > 0) return;

  await Offer.insertMany([
    {
      title: "Flat Rs. 50 off on orders above Rs. 199",
      code: "SAVE50",
      applyType: "manual",
      discountType: "fixed",
      discountValue: 50,
      minOrderAmount: 199,
      isActive: true,
      sortOrder: 1,
    },
    {
      title: "Auto Rs. 25 off above Rs. 299",
      code: "",
      applyType: "automatic",
      discountType: "fixed",
      discountValue: 25,
      minOrderAmount: 299,
      isActive: true,
      sortOrder: 2,
    },
  ]);
};

adminRouter.get("/offers", auth, adminCheck, async (req, res) => {
  try {
    await seedDefaultOffers();
    const offers = await Offer.find({}).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ offers });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

adminRouter.post("/offers", auth, adminCheck, async (req, res) => {
  try {
    const offer = await Offer.create({
      ...req.body,
      code:
        req.body.applyType === "manual"
          ? String(req.body.code || "").toUpperCase()
          : "",
    });
    res.json({ message: "Offer added successfully", offer });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to add offer", details: error.message });
  }
});

adminRouter.put("/offers/:id", auth, adminCheck, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      code:
        req.body.applyType === "manual"
          ? String(req.body.code || "").toUpperCase()
          : "",
    };
    const offer = await Offer.findByIdAndUpdate(req.params.id, payload, {
      new: true,
    });
    if (!offer) return res.status(404).json({ error: "Offer not found" });
    res.json({ message: "Offer updated successfully", offer });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update offer", details: error.message });
  }
});

adminRouter.put("/offers/:id/toggle", auth, adminCheck, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: "Offer not found" });
    offer.isActive = !offer.isActive;
    await offer.save();
    res.json({ message: "Offer status updated", offer });
  } catch (error) {
    res.status(500).json({ error: "Failed to update offer status" });
  }
});

adminRouter.delete("/offers/:id", auth, adminCheck, async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ error: "Offer not found" });
    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete offer" });
  }
});

// --- DELIVERY FEE SETTINGS ---

const buildDeliverySettingsPayload = (settings) => ({
  bakeryLocation:
    settings.bakeryLocation ?? DEFAULT_DELIVERY_SETTINGS.bakeryLocation,
  fee: settings.deliveryFee ?? settings.deliveryBaseCharge ?? 40,
  deliveryFee: settings.deliveryFee ?? settings.deliveryBaseCharge ?? 40,
  freeDeliveryKm:
    settings.freeDeliveryKm ?? DEFAULT_DELIVERY_SETTINGS.freeDeliveryKm,
  deliveryBaseCharge:
    settings.deliveryBaseCharge ??
    settings.deliveryFee ??
    DEFAULT_DELIVERY_SETTINGS.deliveryBaseCharge,
  deliveryPerKmRate:
    settings.deliveryPerKmRate ?? DEFAULT_DELIVERY_SETTINGS.deliveryPerKmRate,
  additionalCharges:
    settings.additionalCharges ?? DEFAULT_DELIVERY_SETTINGS.additionalCharges,
});

const buildStoreTimingPayload = (storeTiming) => {
  const normalised = normaliseStoreTiming(storeTiming);
  return {
    ...normalised,
    ...buildStoreAvailability(normalised),
  };
};

// GET Delivery Fee (Public route so the user cart can read it)
adminRouter.get("/settings/delivery-fee", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        deliveryFee: 40,
        ...DEFAULT_DELIVERY_SETTINGS,
      });
    }
    res.json(buildDeliverySettingsPayload(settings));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch delivery fee" });
  }
});

// UPDATE Delivery Fee (Protected - Admin Only)
adminRouter.put(
  "/settings/delivery-fee",
  auth,
  adminCheck,
  async (req, res) => {
    try {
      const {
        fee,
        bakeryLocation,
        freeDeliveryKm,
        deliveryBaseCharge,
        deliveryPerKmRate,
        additionalCharges,
      } = req.body;

      let settings = await Settings.findOne();
      const currentSettings = {
        bakeryLocation:
          settings?.bakeryLocation ?? DEFAULT_DELIVERY_SETTINGS.bakeryLocation,
        freeDeliveryKm:
          settings?.freeDeliveryKm ?? DEFAULT_DELIVERY_SETTINGS.freeDeliveryKm,
        deliveryBaseCharge:
          settings?.deliveryBaseCharge ??
          settings?.deliveryFee ??
          DEFAULT_DELIVERY_SETTINGS.deliveryBaseCharge,
        deliveryPerKmRate:
          settings?.deliveryPerKmRate ??
          DEFAULT_DELIVERY_SETTINGS.deliveryPerKmRate,
        additionalCharges:
          settings?.additionalCharges ??
          DEFAULT_DELIVERY_SETTINGS.additionalCharges,
      };

      const nextSettings = {
        bakeryLocation:
          bakeryLocation === undefined
            ? currentSettings.bakeryLocation
            : {
                lat: Number(bakeryLocation.lat),
                lng: Number(bakeryLocation.lng),
              },
        freeDeliveryKm:
          freeDeliveryKm === undefined
            ? currentSettings.freeDeliveryKm
            : Number(freeDeliveryKm),
        deliveryBaseCharge:
          deliveryBaseCharge === undefined
            ? fee === undefined
              ? currentSettings.deliveryBaseCharge
              : Number(fee)
            : Number(deliveryBaseCharge),
        deliveryPerKmRate:
          deliveryPerKmRate === undefined
            ? currentSettings.deliveryPerKmRate
            : Number(deliveryPerKmRate),
        additionalCharges:
          additionalCharges === undefined
            ? currentSettings.additionalCharges
            : additionalCharges,
      };

      nextSettings.deliveryFee = nextSettings.deliveryBaseCharge;

      const invalidDeliveryValue = [
        nextSettings.deliveryFee,
        nextSettings.freeDeliveryKm,
        nextSettings.deliveryBaseCharge,
        nextSettings.deliveryPerKmRate,
      ].some((value) => !Number.isFinite(value) || value < 0);

      const invalidBakeryLocation =
        !Number.isFinite(nextSettings.bakeryLocation.lat) ||
        !Number.isFinite(nextSettings.bakeryLocation.lng) ||
        Math.abs(nextSettings.bakeryLocation.lat) > 90 ||
        Math.abs(nextSettings.bakeryLocation.lng) > 180;

      if (invalidDeliveryValue || invalidBakeryLocation) {
        return res
          .status(400)
          .json({
            error:
              "Delivery settings and bakery location must contain valid numbers",
          });
      }

      if (!Array.isArray(nextSettings.additionalCharges)) {
        return res
          .status(400)
          .json({ error: "Additional charges must be an array" });
      }

      nextSettings.additionalCharges = nextSettings.additionalCharges
        .map((charge) => ({
          name: String(charge.name || "").trim(),
          type: charge.type === "fixed" ? "fixed" : "percentage",
          value: Number(charge.value || 0),
          enabled: charge.enabled !== false,
        }))
        .filter((charge) => charge.name);

      const invalidCharge = nextSettings.additionalCharges.some(
        (charge) => !Number.isFinite(charge.value) || charge.value < 0,
      );

      if (invalidCharge) {
        return res
          .status(400)
          .json({
            error: "Additional charge values must be valid positive numbers",
          });
      }

      if (!settings) settings = new Settings(nextSettings);
      else {
        settings.bakeryLocation = nextSettings.bakeryLocation;
        settings.deliveryFee = nextSettings.deliveryFee;
        settings.freeDeliveryKm = nextSettings.freeDeliveryKm;
        settings.deliveryBaseCharge = nextSettings.deliveryBaseCharge;
        settings.deliveryPerKmRate = nextSettings.deliveryPerKmRate;
        settings.additionalCharges = nextSettings.additionalCharges;
      }
      await settings.save();
      res.json({
        message: "Delivery fee updated successfully",
        ...buildDeliverySettingsPayload(settings),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update delivery fee" });
    }
  },
);

adminRouter.get(
  "/settings/store-timing",
  auth,
  adminCheck,
  async (_req, res) => {
    try {
      const storeTiming = await getStoreTimingSettings();
      res.json(buildStoreTimingPayload(storeTiming));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch store timing" });
    }
  },
);

adminRouter.put(
  "/settings/store-timing",
  auth,
  adminCheck,
  async (req, res) => {
    try {
      const enabled =
        req.body.enabled === undefined
          ? DEFAULT_STORE_TIMING.enabled
          : req.body.enabled !== false;
      const openingTime = String(
        req.body.openingTime || DEFAULT_STORE_TIMING.openingTime,
      ).trim();
      const closingTime = String(
        req.body.closingTime || DEFAULT_STORE_TIMING.closingTime,
      ).trim();

      if (
        parseTimeToMinutes(openingTime) === null ||
        parseTimeToMinutes(closingTime) === null
      ) {
        return res
          .status(400)
          .json({ error: "Opening and closing times must be in HH:MM format" });
      }

      let settings = await Settings.findOne();
      if (!settings) settings = new Settings({});

      settings.storeTiming = {
        enabled,
        openingTime,
        closingTime,
        timezone: DEFAULT_STORE_TIMING.timezone,
      };

      await settings.save();
      res.json({
        message: "Store timing updated successfully",
        ...buildStoreTimingPayload(settings.storeTiming),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update store timing" });
    }
  },
);

// UPDATE Categories (Protected - Admin Only)
adminRouter.put("/settings/categories", auth, adminCheck, async (req, res) => {
  try {
    const { categories } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings({ categories });
    else settings.categories = categories;
    await settings.save();
    res.json({
      message: "Categories updated successfully",
      categories: settings.categories,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update categories" });
  }
});

// UPDATE Today's Special (Protected - Admin Only)
adminRouter.put(
  "/settings/todays-special",
  auth,
  adminCheck,
  async (req, res) => {
    try {
      const { todaysSpecial } = req.body;
      let settings = await Settings.findOne();
      if (!settings) settings = new Settings({ todaysSpecial });
      else settings.todaysSpecial = todaysSpecial;
      await settings.save();
      res.json({
        message: "Today's Special updated successfully",
        todaysSpecial: settings.todaysSpecial,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update Today's Special" });
    }
  },
);

module.exports = { adminRouter };
