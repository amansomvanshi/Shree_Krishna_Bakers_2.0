import React from "react";
import { motion } from "framer-motion";
import { RefreshCcw, Search, Clock, CreditCard } from "lucide-react";

const RefundPolicy = () => {
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
                    <h1 className="text-3xl font-extrabold text-wrap">Refund & Return</h1>
                    <p className="mt-2 text-orange-100 font-medium">
                        Transparent policies for fresh quality.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-gray-500 text-sm italic border-l-4 border-orange-500 pl-4 py-2 bg-orange-50/30 rounded-r-lg">
                        Since we deal in fresh and perishable food items, the following policy applies:
                    </p>

                    <div className="space-y-4">
                        <section className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <Search size={20} />
                                </div>
                                <h3 className="font-bold text-gray-800">Instant Quality Check</h3>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Please check your food at the time of delivery. If there is a quality issue or an incorrect item, notify us immediately for a replacement.
                            </p>
                        </section>

                        <section className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                                    <RefreshCcw size={20} />
                                </div>
                                <h3 className="font-bold text-gray-800">Cake Cancellation</h3>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                To cancel a cake order, you must notify us at least <span className="font-bold text-orange-600">4-5 hours</span> prior to the scheduled delivery time. Once preparation has started, no cancellations or refunds will be processed.
                            </p>
                        </section>

                        <section className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                                    <Clock size={20} />
                                </div>
                                <h3 className="font-bold text-gray-800">Fast Food</h3>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                No refund or replacement claims will be entertained for fast food items (Pizza, Burger, Fries, etc.) after <span className="font-bold text-gray-900">30 minutes</span> of delivery.
                            </p>
                        </section>

                        <section className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                                    <CreditCard size={20} />
                                </div>
                                <h3 className="font-bold text-gray-800">Refund Mode</h3>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Approved refunds will be credited to your original payment mode within <span className="font-bold text-gray-900">2-3 working days</span>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default RefundPolicy;
