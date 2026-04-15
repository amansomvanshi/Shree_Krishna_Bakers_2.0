const DEFAULT_BAKERY_LOCATION = {
  lat: 26.7831716,
  lng: 75.8243111,
};

const Settings = require("../models/Settings");
const Offer = require("../models/Offer");

const EARTH_RADIUS_KM = 6371;
const DEFAULT_DELIVERY_SETTINGS = {
  bakeryLocation: DEFAULT_BAKERY_LOCATION,
  freeDeliveryKm: 3,
  deliveryBaseCharge: 20,
  deliveryPerKmRate: 5,
  additionalCharges: [
    { name: "GST & Other Tax", type: "percentage", value: 0, enabled: false },
  ],
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const calculateDistanceKm = (from, to) => {
  const hasValidCoordinates =
    Number.isFinite(from?.lat) &&
    Number.isFinite(from?.lng) &&
    Number.isFinite(to?.lat) &&
    Number.isFinite(to?.lng);

  if (!hasValidCoordinates) {
    return null;
  }

  const latDiff = toRadians(to.lat - from.lat);
  const lngDiff = toRadians(to.lng - from.lng);

  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(lngDiff / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const roundToTwo = (value) => Math.round(value * 100) / 100;

const normaliseBakeryLocation = (location = {}) => ({
  lat: Number.isFinite(Number(location.lat))
    ? Number(location.lat)
    : DEFAULT_BAKERY_LOCATION.lat,
  lng: Number.isFinite(Number(location.lng))
    ? Number(location.lng)
    : DEFAULT_BAKERY_LOCATION.lng,
});

const normaliseDeliverySettings = (settings = {}) => ({
  bakeryLocation: normaliseBakeryLocation(settings.bakeryLocation),
  freeDeliveryKm: Number.isFinite(Number(settings.freeDeliveryKm))
    ? Math.max(0, Number(settings.freeDeliveryKm))
    : DEFAULT_DELIVERY_SETTINGS.freeDeliveryKm,
  deliveryBaseCharge: Number.isFinite(Number(settings.deliveryBaseCharge))
    ? Math.max(0, Number(settings.deliveryBaseCharge))
    : DEFAULT_DELIVERY_SETTINGS.deliveryBaseCharge,
  deliveryPerKmRate: Number.isFinite(Number(settings.deliveryPerKmRate))
    ? Math.max(0, Number(settings.deliveryPerKmRate))
    : DEFAULT_DELIVERY_SETTINGS.deliveryPerKmRate,
  additionalCharges: Array.isArray(settings.additionalCharges)
    ? settings.additionalCharges
        .map((charge) => ({
          name: String(charge.name || "").trim(),
          type: charge.type === "fixed" ? "fixed" : "percentage",
          value: Number(charge.value || 0),
          enabled: charge.enabled !== false,
        }))
        .filter(
          (charge) =>
            charge.name && Number.isFinite(charge.value) && charge.value >= 0,
        )
    : DEFAULT_DELIVERY_SETTINGS.additionalCharges,
});

const getDeliveryPricingSettings = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create(DEFAULT_DELIVERY_SETTINGS);
  }

  return normaliseDeliverySettings(settings);
};

const calculateDeliveryCharge = (
  customerLocation,
  settings = DEFAULT_DELIVERY_SETTINGS,
) => {
  const deliverySettings = normaliseDeliverySettings(settings);
  const bakeryLocation = deliverySettings.bakeryLocation;
  const distanceKm = calculateDistanceKm(bakeryLocation, customerLocation);

  if (distanceKm === null) {
    return {
      bakeryLocation,
      distanceKm: null,
      deliveryCharge: 0,
      pricingLabel: "Location unavailable",
      deliverySettings,
    };
  }

  const roundedDistanceKm = roundToTwo(distanceKm);
  const { freeDeliveryKm, deliveryBaseCharge, deliveryPerKmRate } =
    deliverySettings;
  let deliveryCharge = 0;
  let pricingLabel = `Free delivery within ${freeDeliveryKm} km`;

  if (distanceKm > freeDeliveryKm) {
    const chargeableDistanceKm = distanceKm - freeDeliveryKm;
    deliveryCharge =
      deliveryBaseCharge + Math.ceil(chargeableDistanceKm * deliveryPerKmRate);
    // pricingLabel = `After ${freeDeliveryKm} km: Rs. ${deliveryBaseCharge} base + Rs. ${deliveryPerKmRate}/km`;
  }

  return {
    bakeryLocation,
    distanceKm: roundedDistanceKm,
    deliveryCharge,
    pricingLabel,
    deliverySettings,
  };
};

const calculateItemsSubtotal = (items = []) =>
  items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );

const calculateAdditionalCharges = (itemsSubtotal, charges = []) =>
  charges
    .filter((charge) => charge.enabled !== false && Number(charge.value) > 0)
    .map((charge) => {
      const amount =
        charge.type === "percentage"
          ? roundToTwo((itemsSubtotal * Number(charge.value)) / 100)
          : roundToTwo(Number(charge.value));

      return {
        name: charge.name,
        type: charge.type,
        value: Number(charge.value),
        amount,
      };
    });

const calculateOfferDiscountAmount = (offer, itemsSubtotal) => {
  if (!offer || itemsSubtotal < Number(offer.minOrderAmount || 0)) {
    return 0;
  }

  const rawDiscount =
    offer.discountType === "percentage"
      ? (itemsSubtotal * Number(offer.discountValue || 0)) / 100
      : Number(offer.discountValue || 0);

  return Math.min(roundToTwo(rawDiscount), itemsSubtotal);
};

const normaliseOfferPayload = (offer, amount) => {
  if (!offer || amount <= 0) {
    return null;
  }

  return {
    title: offer.title,
    code: offer.code || "",
    applyType: offer.applyType,
    discountType: offer.discountType,
    discountValue: Number(offer.discountValue || 0),
    minOrderAmount: Number(offer.minOrderAmount || 0),
    amount,
  };
};

const findApplicableOffer = async (itemsSubtotal, couponCode = "") => {
  const requestedCode = String(couponCode || "")
    .trim()
    .toUpperCase();

  if (requestedCode) {
    const manualOffer = await Offer.findOne({
      isActive: true,
      applyType: "manual",
      code: requestedCode,
    }).lean();
    const discountAmount = calculateOfferDiscountAmount(
      manualOffer,
      itemsSubtotal,
    );
    return normaliseOfferPayload(manualOffer, discountAmount);
  }

  const automaticOffers = await Offer.find({
    isActive: true,
    applyType: "automatic",
  })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  return automaticOffers.reduce((bestOffer, offer) => {
    const discountAmount = calculateOfferDiscountAmount(offer, itemsSubtotal);
    const payload = normaliseOfferPayload(offer, discountAmount);

    if (!payload) {
      return bestOffer;
    }

    if (!bestOffer || payload.amount > bestOffer.amount) {
      return payload;
    }

    return bestOffer;
  }, null);
};

const buildOrderPricing = async (orderData = {}, isDineIn = false) => {
  const itemsSubtotal = calculateItemsSubtotal(orderData.items);
  const discount = await findApplicableOffer(
    itemsSubtotal,
    orderData.offerCode,
  );
  const discountAmount = discount?.amount || 0;
  const taxableSubtotal = Math.max(0, itemsSubtotal - discountAmount);
  const deliverySettings = await getDeliveryPricingSettings();
  const additionalCharges = calculateAdditionalCharges(
    taxableSubtotal,
    deliverySettings.additionalCharges,
  );
  const additionalChargesTotal = roundToTwo(
    additionalCharges.reduce((sum, charge) => sum + charge.amount, 0),
  );
  const deliverySummary = isDineIn
    ? {
        bakeryLocation: deliverySettings.bakeryLocation,
        distanceKm: 0,
        deliveryCharge: 0,
        pricingLabel: "Dine-in order",
        deliverySettings,
      }
    : calculateDeliveryCharge(orderData.location, deliverySettings);

  return {
    ...deliverySummary,
    itemsSubtotal,
    discount,
    discountAmount,
    additionalCharges,
    additionalChargesTotal,
    totalAmount: roundToTwo(
      taxableSubtotal + deliverySummary.deliveryCharge + additionalChargesTotal,
    ),
  };
};

module.exports = {
  BAKERY_LOCATION: DEFAULT_BAKERY_LOCATION,
  DEFAULT_BAKERY_LOCATION,
  DEFAULT_DELIVERY_SETTINGS,
  calculateDistanceKm,
  calculateDeliveryCharge,
  calculateItemsSubtotal,
  calculateAdditionalCharges,
  findApplicableOffer,
  getDeliveryPricingSettings,
  buildOrderPricing,
};
