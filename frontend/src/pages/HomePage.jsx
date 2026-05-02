import React from "react";
import CategoryMenu from "../components/CategoryMenu.jsx";
import Bestsellers from "../components/BestsellerItems.jsx";
import Footer from "../components/Footer.jsx";
import LegalFooter from "../components/LegalFooter.jsx";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";
import useStoreAvailability from "../hooks/useStoreAvailability";

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [todaysSpecial, setTodaysSpecial] = useState("Loading offers...");
  const { storeAvailability } = useStoreAvailability({ autoRefreshMs: 60000 });

  useEffect(() => {
    const fetchSpecial = async () => {
      try {
        const res = await api.get("/user/todays-special");
        setTodaysSpecial(res.data.todaysSpecial);
      } catch (error) {
        console.error("Failed to fetch today's special", error);
      }
    };
    fetchSpecial();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/menu", { state: { searchQuery: searchQuery.trim() } });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 5 }}
      transition={{ duration: 0.01, ease: "easeOut" }}
    >
      <div className="bg-gray-50 min-h-screen">
        <div className="w-full max-w-[600px] mx-auto bg-white min-h-screen shadow-x mb-40">
          {/* brand name and tag line */}
          <div
            id="title"
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 rounded-b-[40px] p-6 pb-12 shadow-lg "
          >
            <div className="mt-4">
              <div>
                <h1 className="text-white text-4xl font-extrabold tracking-tight">
                  Shri Krishna Bakers
                </h1>
                <p className="text-orange-100 text-lg mt-1 font-medium">
                  Taste the tradition, feel the love.
                </p>{" "}
              </div>

              <div
                className="mt-8 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-4 flex flex-col"
                id="offers"
              >
                <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
                  Today's Special
                </span>

                <h2 className="text-white mt-1 text-2xl font-bold">
                  {todaysSpecial}
                </h2>

                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                    storeAvailability.isCurrentlyOpen
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                  }`}
                >
                  <p className="font-bold">
                    {storeAvailability.isCurrentlyOpen
                      ? `We are available till ${storeAvailability.closesAtLabel}`
                      : storeAvailability.closedMessage}
                  </p>
                  <p className="mt-1 text-xs opacity-80">
                    Online orders are served between{" "}
                    {storeAvailability.opensAtLabel} and{" "}
                    {storeAvailability.closesAtLabel}.
                  </p>
                </div>
              </div>

              {/* SEARCH BAR */}
              <form onSubmit={handleSearch} className="mt-8 relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="What are you craving today?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/60 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all"
                />
              </form>
            </div>
          </div>

          {/* explore menu section */}
          <div className="">
            <CategoryMenu />
            <Bestsellers />
          </div>
          <LegalFooter />
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;
