import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, UserCircle, Cookie } from "lucide-react";

const PrivacyPolicy = () => {
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
                    <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
                    <p className="mt-2 text-orange-100 font-medium">
                        Your privacy and data security are our top priorities.
                    </p>
                </div>

                <div className="p-6 space-y-8">
                    <section className="flex gap-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
                        <div className="bg-blue-100 p-3 h-fit rounded-xl text-blue-600">
                            <UserCircle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Personal Data</h3>
                            <p className="text-gray-600 mt-1 leading-relaxed">
                                We collect your name, address, and phone number solely for the purpose of processing your orders and providing delivery updates.
                            </p>
                        </div>
                    </section>

                    <section className="flex gap-4 p-5 rounded-2xl bg-green-50/50 border border-green-100">
                        <div className="bg-green-100 p-3 h-fit rounded-xl text-green-600">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Data Safety</h3>
                            <p className="text-gray-600 mt-1 leading-relaxed">
                                Your personal information is never shared or sold to any third-party organizations. We use industry-standard encryption to protect your data.
                            </p>
                        </div>
                    </section>

                    <section className="flex gap-4 p-5 rounded-2xl bg-purple-50/50 border border-purple-100">
                        <div className="bg-purple-100 p-3 h-fit rounded-xl text-purple-600">
                            <Cookie size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Cookies</h3>
                            <p className="text-gray-600 mt-1 leading-relaxed">
                                Our website uses basic cookies to enhance your browsing experience and remember your preferences, such as your authentication state and cart items.
                            </p>
                        </div>
                    </section>

                    <div className="text-center pt-8">
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                            Last Updated: February 2026
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PrivacyPolicy;
