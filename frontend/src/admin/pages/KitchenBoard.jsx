import React, { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";

// SOUND URL
const ALERT_SOUND =
  "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const KitchenBoard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  // 1. FETCH ORDERS
  const fetchOrders = async () => {
    try {
      const res = await api.get("/admin/orders");
      // Keep only active orders
      const activeOrders = res.data.orders.filter(
        (o) => o.status !== "Delivered" && o.status !== "Cancelled",
      );

      // Check for new orders to play the ringtone using localStorage
      // This ensures it rings even if the admin just navigated to this page
      let rangOrders;
      try {
        rangOrders = new Set(
          JSON.parse(localStorage.getItem("rangOrders") || "[]"),
        );
      } catch (e) {
        rangOrders = new Set();
      }

      let hasNew = false;
      activeOrders.forEach((o) => {
        if (o.status === "Order Placed" && !rangOrders.has(o._id)) {
          hasNew = true;
          rangOrders.add(o._id);
        }
      });

      if (hasNew) {
        playNewOrderSound();
        // Keep only the last 200 orders so localStorage doesn't get too big
        localStorage.setItem(
          "rangOrders",
          JSON.stringify([...rangOrders].slice(-200)),
        );
      }

      setOrders(activeOrders);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // 2. POLLING (Auto-refresh)
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // 3. SOUND
  const playSound = () => {
    const audio = new Audio(ALERT_SOUND);
    audio.play().catch((e) => console.log("Audio play blocked", e));
  };

  const playNewOrderSound = () => {
    // Stop any currently playing alarm before starting a new one
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(ALERT_SOUND);
    audio.loop = true;
    audioRef.current = audio;
    audio.play().catch((e) => console.log("Audio play blocked", e));

    setTimeout(() => {
      if (audioRef.current === audio) {
        audio.pause();
        audio.currentTime = 0;
        audioRef.current = null;
      }
    }, 15000); // Stop ringing after 15 seconds
  };

  // 4. STATUS UPDATE HANDLER
  const handleStatusUpdate = async (orderId, newStatus) => {
    // Stop the alarm immediately when the admin interacts with an order
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    try {
      // Optimistic Update
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)),
      );

      // Remove from list if Delivered
      if (newStatus === "Delivered") {
        setTimeout(() => {
          setOrders((prev) => prev.filter((o) => o._id !== orderId));
        }, 500);
      }

      playSound();
      await api.put(`/admin/order-status/${orderId}`, { status: newStatus });
    } catch (error) {
      console.error("Status update failed", error);
      toast.error("Failed to update status");
      fetchOrders();
    }
  };

  // --- PRINT LOGIC ---
  const handlePrint = (order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print receipts.");
      return;
    }

    const isDineIn = !!order.tableNo;
    const orderType = isDineIn
      ? `Dine-In (Table ${order.tableNo})`
      : `Delivery/Online`;
    const customerName =
      order.userId?.name || order.customerDetails?.name || "Customer";
    const customerPhone =
      order.userId?.phone || order.customerDetails?.phone || "";
    const itemsSubtotal =
      order.itemsSubtotal ||
      order.items.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * Number(item.quantity || 0),
        0,
      );
    const additionalCharges = order.additionalCharges || [];
    const discount = order.discount;

    const itemsHtml = order.items
      .map(
        (item) => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 7px; font-size: 16px;">
        <span>${item.quantity}x ${item.name}</span>
        <span>₹${Number(item.price || 0) * Number(item.quantity || 0)}</span>
      </div>
    `,
      )
      .join("");

    const chargesHtml = additionalCharges
      .map(
        (charge) => `
      <p class="row">
        <span>${charge.name}${charge.type === "percentage" ? ` (${charge.value}%)` : ""}</span>
        <span>₹${charge.amount}</span>
      </p>
    `,
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Receipt - Order #${order._id.slice(-6).toUpperCase()}</title>
          <style>
            body { font-family: monospace; padding: 20px; width: 340px; margin: 0 auto; color: #000; }
            h2 { text-align: center; margin-bottom: 5px; font-size: 22px; }
            p { margin: 5px 0; font-size: 16px; }
            .divider { border-bottom: 1px dashed #000; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; gap: 12px; }
            .total { font-weight: bold; font-size: 20px; text-align: right; margin-top: 10px; }
            .customer-phone { font-weight: 700; font-size: 17px; }
            @media print { body { width: 100%; padding: 0; margin: 0; } }
          </style>
        </head>
        <body>
          <h2>Shri Krishna Bakers</h2>
          <p style="text-align: center; font-size: 15px; margin-top: 0;">Amul Parlour & Cafe</p>
          <div class="divider"></div>
          <p><strong>Order ID:</strong> #${order._id.slice(-6).toUpperCase()}</p>
          <p><strong>Type:</strong> ${orderType}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          ${customerPhone ? `<p class="customer-phone"><strong>Phone:</strong> ${customerPhone}</p>` : ""}
          <p><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleString()}</p>
          ${order.address && !order.tableNo ? `<p><strong>Address:</strong> ${order.address}</p>` : ""}
          ${order.location ? `<p><strong>Map Link:</strong> https://www.google.com/maps/search/?api=1&query=${order.location.lat},${order.location.lng}</p>` : ""}
          <div class="divider"></div>
          ${itemsHtml}
          <div class="divider"></div>
          <p class="row"><span>Item Total</span><span>₹${itemsSubtotal}</span></p>
          ${discount?.amount > 0 ? `<p class="row"><span>${discount.title}</span><span>-₹${discount.amount}</span></p>` : ""}
          ${!isDineIn ? `<p class="row"><span>Delivery Fee</span><span>${order.deliveryCharge === 0 ? "FREE" : `₹${order.deliveryCharge || 0}`}</span></p>` : ""}
          ${chargesHtml}
          <div class="divider"></div>
          <p><strong>Payment:</strong> ${order.paymentStatus || "Pending"}</p>
          <p class="total">Total: ₹${order.totalAmount || "-"}</p>
          <div class="divider"></div>
          <p style="text-align: center; margin-top: 15px; font-size: 15px;">Thank you for your order!</p>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // --- FILTER ORDERS ---
  // Online orders go to Kanban, Table orders go to bottom grid
  const deliveryOrders = orders.filter((o) => !o.tableNo);
  const dineInOrders = orders.filter((o) => o.tableNo);

  // --- STYLES FOR DELIVERY BADGES ---
  const STATUS_STYLES = {
    blue: {
      badge: "bg-blue-100 text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    orange: {
      badge: "bg-orange-100 text-orange-600",
      button: "bg-orange-600 hover:bg-orange-700 text-white",
    },
    purple: {
      badge: "bg-purple-100 text-purple-600",
      button: "bg-purple-600 hover:bg-purple-700 text-white",
    },
  };

  // COMPONENT: CARD FOR DELIVERY FLOW
  const DeliveryCard = ({ order, nextStatus, buttonText, colorType }) => {
    const styles = STATUS_STYLES[colorType];
    const customerPhone =
      order.userId?.phone || order.customerDetails?.phone || "";
    return (
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4 transition-all hover:shadow-md">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-xs font-bold text-gray-400">
              #{order._id.slice(-6).toUpperCase()}
            </span>
            <h4 className="font-bold text-gray-800">
              {order.userId?.name ||
                order.customerDetails?.name ||
                "Online Customer"}
            </h4>
            {customerPhone && (
              <p className="text-sm font-bold text-gray-700 mt-1">
                {customerPhone}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => handlePrint(order)}
                className="text-gray-400 hover:text-gray-800 transition-colors bg-gray-50 p-1.5 rounded-md shadow-sm"
                title="Print Receipt"
              >
                🖨️
              </button>
              <span
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${styles.badge}`}
              >
                {order.status}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                order.paymentStatus === "Paid"
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {order.paymentStatus || "Pending"}
            </span>
          </div>
        </div>

        {/* Display Address & Live Location Link on Card */}
        {order.address && !order.tableNo && (
          <p className="text-xs text-gray-500 mb-2 px-1 line-clamp-2">
            🏠 {order.address}
          </p>
        )}
        {order.location && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${order.location.lat},${order.location.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 font-bold flex items-center gap-1 mb-3 px-1 hover:underline"
          >
            📍 Open in Maps
          </a>
        )}

        <div className="space-y-1 mb-4">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between text-sm text-gray-600"
            >
              <span>
                {item.quantity}x {item.name}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-50">
          <button
            onClick={() => handleStatusUpdate(order._id, nextStatus)}
            className={`w-full text-xs font-bold py-2 rounded-lg transition-colors shadow-sm ${styles.button}`}
          >
            {buttonText} →
          </button>
        </div>
      </div>
    );
  };

  // COMPONENT: CARD FOR DINE-IN (Simple "Done" Button)
  const DineInCard = ({ order }) => {
    const customerPhone =
      order.userId?.phone || order.customerDetails?.phone || "";

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-bold text-lg">
              Table {order.tableNo}
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(order)}
                  className="text-gray-400 hover:text-gray-800 transition-colors bg-gray-50 p-1.5 rounded-md shadow-sm"
                  title="Print Receipt"
                >
                  🖨️
                </button>
                <span className="text-xs font-mono text-gray-400">
                  #{order._id.slice(-6).toUpperCase()}
                </span>
              </div>
              <span
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase mt-1 ${order.status === "Order Placed" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"}`}
              >
                {order.status}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  order.paymentStatus === "Paid"
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {order.paymentStatus || "Pending"}
              </span>
            </div>
          </div>

          {customerPhone && (
            <p className="text-sm font-bold text-gray-700 mb-3">
              Customer No: {customerPhone}
            </p>
          )}

          <div className="space-y-2 mb-6">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center text-gray-700 border-b border-dashed border-gray-100 pb-1 last:border-0"
              >
                <span className="font-medium text-lg">
                  {item.quantity}x {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {order.status === "Order Placed" ? (
          <button
            onClick={() => handleStatusUpdate(order._id, "Preparing")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🔔</span> Accept Order
          </button>
        ) : (
          <button
            onClick={() => handleStatusUpdate(order._id, "Delivered")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-100 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>✅</span> Mark Served
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-8 overflow-y-auto pb-20">
      {/* --- SECTION 1: DELIVERY ORDERS (Kanban) --- */}
      <div>
        <div className="flex items-center gap-3 mb-4 px-1">
          <h2 className="text-xl font-bold text-gray-800">
            🛵 Online / Delivery Orders
          </h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
            {deliveryOrders.length} active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* COLUMN 1: RECEIVED */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 min-h-[300px]">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>{" "}
              Received
            </h3>
            {deliveryOrders
              .filter((o) => o.status === "Order Placed")
              .map((order) => (
                <DeliveryCard
                  key={order._id}
                  order={order}
                  nextStatus="Preparing"
                  buttonText="Accept Order"
                  colorType="blue"
                />
              ))}
          </div>

          {/* COLUMN 2: PROCESSING */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 min-h-[300px]">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>{" "}
              Cooking
            </h3>
            {deliveryOrders
              .filter((o) => o.status === "Preparing")
              .map((order) => (
                <DeliveryCard
                  key={order._id}
                  order={order}
                  nextStatus="Out for Delivery"
                  buttonText="Ready for Driver"
                  colorType="orange"
                />
              ))}
          </div>

          {/* COLUMN 3: ON THE WAY */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 min-h-[300px]">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span> On
              The Way
            </h3>
            {deliveryOrders
              .filter((o) => o.status === "Out for Delivery")
              .map((order) => (
                <DeliveryCard
                  key={order._id}
                  order={order}
                  nextStatus="Delivered"
                  buttonText="Mark Delivered"
                  colorType="purple"
                />
              ))}
          </div>
        </div>
      </div>

      {/* --- SECTION 2: DINE-IN ORDERS (Grid) --- */}
      {dineInOrders.length > 0 && (
        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center gap-3 mb-4 px-1">
            <h2 className="text-xl font-bold text-gray-800">
              🍽️ Dine-In / Table Orders
            </h2>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
              {dineInOrders.length} active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {dineInOrders.map((order) => (
              <DineInCard key={order._id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenBoard;
