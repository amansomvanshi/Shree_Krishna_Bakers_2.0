import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AnimatePresence } from "framer-motion"; // 2. Added AnimatePresence
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/Menupage";
import CartPage from "./pages/CartPage";
import BlogsPage from "./pages/BlogsPage";
import Footer from "./components/Footer";
import Account from "./pages/Accounts";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import TermsConditions from "./pages/TermsConditions";
import CartNotification from "./components/CartNotification";
import FloatingCartButton from "./components/FloatingCartButton";
import { useCart } from "./context/CartContext";
import AdminLayout from "./admin/layout/AdminLayout";
import MenuManagement from "./admin/pages/MenuManage"; // 👈 The Real Component
import KitchenBoard from "./admin/pages/KitchenBoard";
import SaleAnalatics from "./admin/pages/Analytics";
import ContentOffers from "./admin/pages/ContentOffers";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

// 3. We create a wrapper component because useLocation must be inside <Router>
function AnimatedRoutes() {
  const location = useLocation();
  const { notification, setNotification } = useCart();
  const showFloatingCart = ["/", "/menu"].includes(location.pathname);

  return (
    /* mode="wait" ensures the old page finishes fading out 
       BEFORE the new page starts fading in */
    <AnimatePresence mode="popLayout">
      <CartNotification
        show={notification.show}
        itemName={notification.itemName}
        onClose={() => setNotification({ show: false, itemName: "" })}
      />
      <FloatingCartButton show={showFloatingCart} />
      {/* 4. We give Routes a key. This is CRITICAL. 
          Without this, Framer Motion won't see the page change. */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/account" element={<Account />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        {/* ADMIN ROUTES - PROTECTED */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Index Route: What shows up when you just go to /admin */}
          <Route
            index
            element={
              <div className="p-4 text-gray-500">
                Welcome back, Admin! Select a tab.
              </div>
            }
          />

          {/* Sub Routes */}
          <Route path="menu" element={<MenuManagement />} />
          <Route path="kitchen" element={<KitchenBoard />} />
          <Route path="analytics" element={<SaleAnalatics />} />
          <Route path="content" element={<ContentOffers />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
const ConditionalFooter = () => {
  const location = useLocation();

  // Logic: If path starts with "/admin", do NOT show footer
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return <Footer />;
};


function App() {
  return (
    <CartProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          {/* ROUTES acts as the switcher */}
          <div className="flex-grow">
            <AnimatedRoutes />
          </div>

          {/* FOOTER stays outside Routes so it is always visible */}
          <ConditionalFooter />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
