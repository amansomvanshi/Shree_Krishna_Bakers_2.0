import React from "react";
import { motion } from "framer-motion";
import { Gavel, Clock, Tag, MapPin, UserCheck } from "lucide-react";

const TermsConditions = () => {
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
                    <h1 className="text-3xl font-extrabold text-wrap">Terms & Conditions</h1>
                    <p className="mt-2 text-orange-100 font-medium italic">
                        "Serving with rules, delivering with love."
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-4">

                        <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="text-orange-600">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-1">Order Timing</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Fast food orders typically require 15-20 minutes of preparation time. For cakes, we request you to place your order 4-5 hours in advance to ensure the best quality.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="text-orange-600">
                                <Tag size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-1">Pricing</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Menu prices are subject to change without prior notice based on market rates. All prices shown are final at the time of order checkout.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="text-orange-600">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-1">Service Area</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    We currently provide delivery services within a specific radius of our Tonk Road and Sitapura outlets in Jaipur.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="text-orange-600">
                                <UserCheck size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-1">Customer Conduct</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Any form of misconduct at our cafe premises will not be tolerated, and we reserve the right to refuse service.
                                </p>
                            </div>
                        </div>

                    </div>

                    <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl mt-6">
                        <div className="flex items-center gap-2 mb-2 text-orange-600">
                            <Gavel size={20} />
                            <h4 className="font-bold italic">Note</h4>
                        </div>
                        <p className="text-sm text-gray-700 italic">
                            By using our service, you agree to these terms. We at Shri Krishna Bakers strive to maintain the highest standards of service for all our customers.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TermsConditions;
