import React from "react";
import { motion } from "framer-motion";
import { Star, Utensils, Zap, Heart } from "lucide-react";

const AboutUs = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 5 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-gray-50 pb-24"
    >
      <div className="w-full max-w-[600px] mx-auto bg-white min-h-screen shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-8 pt-12 rounded-b-[40px] shadow-lg text-white">
          <h1 className="text-3xl font-extrabold">About Us</h1>
          <p className="mt-2 text-orange-100 font-medium">
            Where Taste Meets Quality & Trust
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Intro */}
          <section>
            <p className="text-gray-600 leading-relaxed text-lg">
              <span className="font-bold text-gray-900">Shri Krishna Bakers, Amul Parlour & Cafe</span> is Jaipur’s premier food destination, bringing together Fresh Bakery, Premium Dairy, and Delicious Fast Food under one roof. 
            </p>
            <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 italic text-gray-700">
              "Founded by an engineering student, our startup is built on the perfect blend of quality, innovation, and taste."
            </div>
          </section>

          {/* Grid Sections */}
          <div className="grid grid-cols-1 gap-6">
            <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-orange-100">
              <div className="bg-orange-100 p-3 h-fit rounded-xl">
                <Utensils className="text-orange-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Our Range</h3>
                <p className="text-sm text-gray-500 mt-1">
                  We serve freshly baked cakes and pastries, the entire range of Amul premium products, and sizzling fast food including Pizzas, Burgers, Sandwiches, and Fries.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-orange-100">
              <div className="bg-orange-100 p-3 h-fit rounded-xl">
                <Zap className="text-orange-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Our Mission</h3>
                <p className="text-sm text-gray-500 mt-1">
                  To provide the people of Jaipur with high-quality, hygienic, and mouth-watering food at a single location.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-orange-100">
              <div className="bg-orange-100 p-3 h-fit rounded-xl">
                <Heart className="text-orange-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Our Speciality</h3>
                <p className="text-sm text-gray-500 mt-1 italic">
                  "Fresh to Order"
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Whether it’s your custom birthday cake or your favorite cheesy burger, we prepare it fresh just for you.
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof/Footer Note */}
          <div className="text-center pt-8 border-t border-gray-100">
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={16} className="fill-orange-400 text-orange-400" />
              ))}
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
              Trusted by 1000+ Happy Customers
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AboutUs;
