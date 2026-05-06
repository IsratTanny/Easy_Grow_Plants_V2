import { useState } from 'react';
import { Filter, X, Check } from 'lucide-react';

export default function PlantFilter({ onFilterChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState({
        lowLight: false,
        petFriendly: false,
    });

    const toggleFilter = (key) => {
        const newFilters = { ...filters, [key]: !filters[key] };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const reset = { lowLight: false, petFriendly: false };
        setFilters(reset);
        onFilterChange(reset);
        setIsOpen(false);
    };

    return (
        <div className="relative z-10">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${filters.lowLight || filters.petFriendly
                        ? 'bg-nature-100 border-nature-300 text-nature-800'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-nature-300'
                    }`}
            >
                <Filter size={16} />
                <span className="font-medium">Filters</span>
                {(filters.lowLight || filters.petFriendly) && (
                    <span className="flex items-center justify-center bg-nature-600 text-white text-xs w-5 h-5 rounded-full ml-1">
                        {(filters.lowLight ? 1 : 0) + (filters.petFriendly ? 1 : 0)}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-scaleIn">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-800">Filter Plants</h4>
                        <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500">
                            Clear all
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <span className="text-gray-700">Low Light Tolerant</span>
                            <div
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.lowLight ? 'bg-nature-500 border-nature-500' : 'border-gray-300'
                                    }`}
                                onClick={() => toggleFilter('lowLight')}
                            >
                                {filters.lowLight && <Check size={12} className="text-white" />}
                            </div>
                        </label>

                        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <span className="text-gray-700">Pet Friendly</span>
                            <div
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.petFriendly ? 'bg-nature-500 border-nature-500' : 'border-gray-300'
                                    }`}
                                onClick={() => toggleFilter('petFriendly')}
                            >
                                {filters.petFriendly && <Check size={12} className="text-white" />}
                            </div>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
