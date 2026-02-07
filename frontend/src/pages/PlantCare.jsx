import { useState, useEffect } from 'react';
import { getPlantCategories, getPlantVarieties } from '../api/plantCare';
import { Leaf, ChevronRight, Info, Droplets, Sun, Sprout } from 'lucide-react';

export default function PlantCare() {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [varieties, setVarieties] = useState([]);
    const [selectedVariety, setSelectedVariety] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchVarieties(selectedCategory.id);
        }
    }, [selectedCategory]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await getPlantCategories();
            setCategories(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load plant categories. Please try again later.');
            setLoading(false);
        }
    };

    const fetchVarieties = async (categoryId) => {
        try {
            const data = await getPlantVarieties(categoryId);
            setVarieties(data);
            // Reset selected variety when category changes
            setSelectedVariety(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load varieties.');
        }
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
    };

    const handleVarietyClick = (variety) => {
        setSelectedVariety(variety);
    };

    const handleBackToCategories = () => {
        setSelectedCategory(null);
        setVarieties([]);
        setSelectedVariety(null);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-nature-800 mb-8 flex items-center gap-2">
                <Leaf className="w-8 h-8 text-nature-600" />
                Plant Care Guide
            </h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading plant care info...</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-12 gap-8">
                    {/* Sidebar / Categories List (Visible if no category selected on mobile, or always on desktop) */}
                    <div className={`md:col-span-3 ${selectedCategory ? 'hidden md:block' : 'block'}`}>
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Categories</h2>
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${selectedCategory?.id === category.id
                                            ? 'bg-nature-100 text-nature-800 font-medium border-l-4 border-nature-500'
                                            : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-100'
                                        }`}
                                >
                                    <span>{category.name}</span>
                                    <ChevronRight className={`w-4 h-4 ${selectedCategory?.id === category.id ? 'text-nature-600' : 'text-gray-400'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="md:col-span-9">
                        {!selectedCategory ? (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                                <div className="inline-block p-4 bg-nature-50 rounded-full mb-4">
                                    <Leaf className="w-12 h-12 text-nature-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a Plant Category</h2>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Choose a plant type from the list to explore specific varieties and learn how to care for them properly.
                                </p>
                            </div>
                        ) : (
                            <div className="animate-fadeIn">
                                <div className="flex items-center gap-2 mb-6 md:hidden">
                                    <button onClick={handleBackToCategories} className="text-sm text-nature-600 hover:underline">
                                        &larr; Back to Categories
                                    </button>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                                    {selectedCategory.name} Varieties
                                </h2>

                                {!selectedVariety ? (
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {varieties.map((variety) => (
                                            <div
                                                key={variety.id}
                                                onClick={() => handleVarietyClick(variety)}
                                                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-nature-200 transition-all cursor-pointer group overflow-hidden"
                                            >
                                                <div className="h-48 bg-gray-100 relative overflow-hidden">
                                                    {variety.image_url ? (
                                                        <img src={variety.image_url} alt={variety.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-nature-50 text-nature-300">
                                                            <Sprout className="w-16 h-16" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-nature-700 transition-colors">{variety.name}</h3>
                                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{variety.description || "No description available."}</p>
                                                    <div className="mt-4 flex items-center text-nature-600 text-sm font-medium">
                                                        View Care Guide <ChevronRight className="w-4 h-4 ml-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {varieties.length === 0 && (
                                            <p className="text-gray-500 col-span-full py-8 text-center italic">No varieties found for this category yet.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-slideUp">
                                        <div className="relative h-64 md:h-80 bg-gray-100">
                                            {selectedVariety.image_url ? (
                                                <img src={selectedVariety.image_url} alt={selectedVariety.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-nature-50 text-nature-300">
                                                    <Sprout className="w-24 h-24" />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setSelectedVariety(null)}
                                                className="absolute top-4 left-4 bg-white/90 backdrop-blur text-gray-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-white transition-colors"
                                            >
                                                &larr; Back to Varieties
                                            </button>
                                        </div>

                                        <div className="p-6 md:p-8">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                                                <div>
                                                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedVariety.name}</h3>
                                                    <span className="inline-block bg-nature-100 text-nature-800 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wide">
                                                        {selectedCategory.name}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="prose prose-nature max-w-none">
                                                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                                    {selectedVariety.description}
                                                </p>

                                                <div className="bg-nature-50 rounded-xl p-6 border border-nature-100">
                                                    <h4 className="flex items-center gap-2 text-xl font-bold text-nature-800 mb-4">
                                                        <Info className="w-6 h-6" /> Care Instructions
                                                    </h4>
                                                    <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                                                        {selectedVariety.care_instructions}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
