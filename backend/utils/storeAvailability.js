const Settings = require("../models/Settings");

const DEFAULT_STORE_TIMING = {
  enabled: true,
  openingTime: "07:30",
  closingTime: "22:45",
  timezone: "Asia/Kolkata",
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const pad = (value) => String(value).padStart(2, "0");

const parseTimeToMinutes = (value = "") => {
  const trimmed = String(value || "").trim();
  const match = trimmed.match(TIME_PATTERN);

  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
};

const formatTime12Hour = (value = "") => {
  const totalMinutes = parseTimeToMinutes(value);

  if (totalMinutes === null) {
    return value;
  }

  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${pad(minutes)} ${period}`;
};

const getTimePartsInZone = (
  date = new Date(),
  timeZone = DEFAULT_STORE_TIMING.timezone,
) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: values.weekday,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
};

const normaliseStoreTiming = (storeTiming = {}) => ({
  enabled: storeTiming.enabled !== false,
  openingTime:
    parseTimeToMinutes(storeTiming.openingTime) === null
      ? DEFAULT_STORE_TIMING.openingTime
      : storeTiming.openingTime,
  closingTime:
    parseTimeToMinutes(storeTiming.closingTime) === null
      ? DEFAULT_STORE_TIMING.closingTime
      : storeTiming.closingTime,
  timezone: String(storeTiming.timezone || DEFAULT_STORE_TIMING.timezone),
});

const getStoreTimingSettings = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({ storeTiming: DEFAULT_STORE_TIMING });
  } else if (!settings.storeTiming) {
    settings.storeTiming = DEFAULT_STORE_TIMING;
    await settings.save();
  }

  return normaliseStoreTiming(settings.storeTiming);
};

const isMinuteWithinWindow = (
  currentMinutes,
  openingMinutes,
  closingMinutes,
) => {
  if (openingMinutes === closingMinutes) {
    return true;
  }

  if (openingMinutes < closingMinutes) {
    return currentMinutes >= openingMinutes && currentMinutes <= closingMinutes;
  }

  return currentMinutes >= openingMinutes || currentMinutes <= closingMinutes;
};

const getNextOpeningLabel = (storeTiming, currentMinutes, isCurrentlyOpen) => {
  if (!storeTiming.enabled || isCurrentlyOpen) {
    return "";
  }

  const openingMinutes = parseTimeToMinutes(storeTiming.openingTime);
  const closingMinutes = parseTimeToMinutes(storeTiming.closingTime);
  const opensAtLabel = formatTime12Hour(storeTiming.openingTime);

  if (openingMinutes === null || closingMinutes === null) {
    return "";
  }

  if (openingMinutes < closingMinutes && currentMinutes < openingMinutes) {
    return `Today opens at ${opensAtLabel}`;
  }

  if (
    openingMinutes > closingMinutes &&
    currentMinutes < openingMinutes &&
    currentMinutes > closingMinutes
  ) {
    return `Today opens at ${opensAtLabel}`;
  }

  return `Tomorrow opens at ${opensAtLabel}`;
};

const buildStoreAvailability = (storeTimingInput = {}, now = new Date()) => {
  const storeTiming = normaliseStoreTiming(storeTimingInput);
  const currentTime = getTimePartsInZone(now, storeTiming.timezone);
  const currentMinutes = currentTime.hour * 60 + currentTime.minute;
  const openingMinutes = parseTimeToMinutes(storeTiming.openingTime);
  const closingMinutes = parseTimeToMinutes(storeTiming.closingTime);
  const opensAtLabel = formatTime12Hour(storeTiming.openingTime);
  const closesAtLabel = formatTime12Hour(storeTiming.closingTime);
  const isCurrentlyOpen =
    !storeTiming.enabled ||
    (openingMinutes !== null &&
      closingMinutes !== null &&
      isMinuteWithinWindow(currentMinutes, openingMinutes, closingMinutes));
  const nextOpeningLabel = getNextOpeningLabel(
    storeTiming,
    currentMinutes,
    isCurrentlyOpen,
  );

  return {
    enabled: storeTiming.enabled,
    timezone: storeTiming.timezone,
    openingTime: storeTiming.openingTime,
    closingTime: storeTiming.closingTime,
    opensAtLabel,
    closesAtLabel,
    isCurrentlyOpen,
    currentDayLabel: currentTime.weekday,
    currentTimeLabel: `${pad(currentTime.hour)}:${pad(currentTime.minute)}`,
    statusLine: !storeTiming.enabled
      ? "Store timing control is disabled. Orders are being accepted anytime."
      : isCurrentlyOpen
        ? `We are available right now. Orders are live till ${closesAtLabel}.`
        : `We are not serviceable currently. ${nextOpeningLabel}.`,
    adminStatusLine: !storeTiming.enabled
      ? "Timing control is off, so online orders are open all day."
      : isCurrentlyOpen
        ? `Store is currently live for online orders till ${closesAtLabel}.`
        : `Store is currently closed for online orders. ${nextOpeningLabel}.`,
    checkoutNotice: !storeTiming.enabled
      ? `Online ordering is active anytime.`
      : isCurrentlyOpen
        ? `Orders placed before ${closesAtLabel} will continue to payment normally.`
        : `We are not serviceable currently. ${nextOpeningLabel}.`,
    closedMessage: `We are not serviceable currently. ${nextOpeningLabel}.`,
  };
};

const assertStoreIsOpenForOnlineOrders = async () => {
  const storeTiming = await getStoreTimingSettings();
  const availability = buildStoreAvailability(storeTiming);

  if (!availability.isCurrentlyOpen) {
    const error = new Error(availability.closedMessage);
    error.statusCode = 403;
    error.code = "STORE_CLOSED";
    error.storeAvailability = availability;
    throw error;
  }

  return availability;
};

module.exports = {
  DEFAULT_STORE_TIMING,
  parseTimeToMinutes,
  formatTime12Hour,
  normaliseStoreTiming,
  getStoreTimingSettings,
  buildStoreAvailability,
  assertStoreIsOpenForOnlineOrders,
};
