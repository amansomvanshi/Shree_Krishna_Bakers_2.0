import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, CheckCircle } from "lucide-react";

const CartNotification = ({ show, itemName, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
                    className="fixed bottom-[calc(10.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[100] mx-auto max-w-[400px]"
                >
                    <div className="bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-600 p-2 rounded-xl">
                                <ShoppingBag size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Added to Cart</p>
                                <p className="font-bold text-sm truncate max-w-[200px]">{itemName}</p>
                            </div>
                        </div>
                        <CheckCircle className="text-green-500" size={24} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CartNotification;
