import React, { useState, useEffect } from "react";
import api from "../../utils/api";

const CategoryManagerModal = ({ isOpen, onClose }) => {
    const [categories, setCategories] = useState([]);
    const [newName, setNewName] = useState("");
    const [newImage, setNewImage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            const res = await api.get("/user/categories");
            setCategories(res.data.categories || []);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const handleAdd = () => {
        if (!newName || !newImage) return alert("Please provide both name and image/emoji");
        setCategories([...categories, { name: newName, image: newImage }]);
        setNewName("");
        setNewImage("");
    };

    const handleRemove = (index) => {
        const updated = [...categories];
        updated.splice(index, 1);
        setCategories(updated);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put("/admin/settings/categories", { categories });
            alert("Categories updated successfully!");
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to save categories");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl transform transition-all scale-100 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Manage Home Categories</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                    Add or remove categories displayed on the Home Page "Explore Menu" section. This will not affect your existing products.
                </p>

                {/* Add New Category */}
                <div className="flex gap-2 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <input
                        type="text"
                        placeholder="Name (e.g. Burger)"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-500"
                    />
                    <input
                        type="text"
                        placeholder="Emoji / URL (e.g. 🍔)"
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-500"
                    />
                    <button onClick={handleAdd} className="bg-orange-600 text-white px-4 rounded-lg font-bold hover:bg-orange-700">
                        Add
                    </button>
                </div>

                {/* List Categories */}
                <div className="overflow-y-auto flex-1 mb-4 pr-2 space-y-2">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full">{cat.image?.startsWith("http") ? <img src={cat.image} className="w-full h-full object-cover rounded-full" alt="cat" /> : cat.image}</span>
                                <span className="font-bold text-gray-700">{cat.name}</span>
                            </div>
                            <button onClick={() => handleRemove(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                <button onClick={handleSave} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-md mt-auto">
                    {loading ? "Saving..." : "Save Categories"}
                </button>
            </div>
        </div>
    );
};

export default CategoryManagerModal;