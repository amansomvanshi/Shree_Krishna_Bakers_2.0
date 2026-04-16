import React from "react";
import { Link } from "react-router-dom";

const LegalFooter = () => {
  const links = [
    { name: "About Us", path: "/about" },
    { name: "Contact Us", path: "/contact" },
    { name: "Privacy Policy", path: "/privacy" },
    { name: "Refund & Return", path: "/refund" },
    { name: "Terms & Conditions", path: "/terms" },
  ];

  return (
    <footer className="w-full bg-white border-t border-gray-100 py-10 px-6 pb-20">
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mb-4">
          Shri Krishna Bakers
        </h2>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-gray-400 hover:text-orange-600 text-sm font-medium transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="text-center space-y-1">
          <p className="text-[10px] text-gray-300 uppercase tracking-[0.2em] font-bold">
            Amul Parlour & Cafe | Jaipur
          </p>
          <p className="text-[10px] text-gray-400">
            © {new Date().getFullYear()} Shri Krishna Bakers. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LegalFooter;
