import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X, ChevronLeft, UtensilsCrossed, ClipboardList, BarChart3, Store, Tags } from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const NAV_ITEMS = [
    { path: "/admin/menu", label: "Menu Management", icon: <UtensilsCrossed size={18} /> },
    { path: "/admin/content", label: "Blogs & Offers", icon: <Tags size={18} /> },
    { path: "/admin/kitchen", label: "Kitchen Board", icon: <ClipboardList size={18} /> },
    { path: "/admin/analytics", label: "Sales Analytics", icon: <BarChart3 size={18} /> },
  ];

  return (
    <>
      {/* MOBILE OVERLAY */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-8 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-200">
              SK
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-gray-800 tracking-tight leading-none">
                Shri Krishna
              </h1>
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-0.5">
                Bakers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
          <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Management
          </p>

          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? "bg-orange-600 text-white font-bold shadow-lg shadow-orange-200"
                  : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                  }`}
              >
                <span className={isActive ? "text-white" : "text-gray-400 group-hover:text-orange-600"}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-2">
          <button
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-3 text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all w-full px-4 py-3 rounded-xl font-bold text-sm"
          >
            <ChevronLeft size={18} />
            Back to Website
          </button>

          <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <Store size={20} className="text-gray-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-xs font-bold text-gray-800 truncate">Store Manager</h4>
              <p className="text-[9px] text-gray-500">Store #1042</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
