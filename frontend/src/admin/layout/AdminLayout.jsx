import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Layout } from "lucide-react";
import Sidebar from "./Sidebar";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* MOBILE HEADER */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-2 text-orange-600">
          <Layout size={24} />
          <span className="font-bold text-gray-800">Admin Dashboard</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* SIDEBAR */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-0 min-h-screen flex flex-col">
        <div className="flex-1 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
