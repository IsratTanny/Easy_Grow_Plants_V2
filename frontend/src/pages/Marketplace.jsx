import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';
import { ShoppingBag, Search, Filter, Tag, MessageSquare, Send, X, MapPin, Check } from 'lucide-react';
import VoiceInput from '../components/VoiceInput';
import toast from 'react-hot-toast';

const CATEGORIES = [
    "All", "Aglonema", "Air Plant", "Alocasia", "Anthurium", "Begonia", "Bonsai", "Cactus", "Calathea",
    "Dracena", "Ficus", "Fittonia", "Monstera", "Peperomia", "Philodendron",
    "Pothos", "Sansevieria", "Succulent", "Syngonium", "ZZ Plant"
];

const categoryMapping = {
    "All": "All",
    "Aglonema": "Aglonema",
    "Air Plant": "Air Plant",
    "Alocasia": "Alocasia",
    "Anthurium": "Anthurium",
    "Begonia": "Begonia",
    "Bonsai": "Bonsai",
    "Cactus": "Cactus",
    "Calathea": "Calathea",
    "Dracena": "Dracena",
    "Ficus": "Ficus",
    "Fittonia": "Fittonia",
    "Monstera": "Monstera",
    "Peperomia": "Peperomia",
    "Philodendron": "Philodendron",
    "Pothos": "Pothos",
    "Sansevieria": "Sansevieria",
    "Succulent": "Succulent",
    "Syngonium": "Syngonium",
    "ZZ Plant": "ZZ Plant"
};

// Static images live in frontend/public/images and are served at the Vite
// base path: "/" in dev, "/static/" in a production build. Build the URLs from
// BASE_URL so they resolve in both environments.
const img = (file) => `${import.meta.env.BASE_URL}images/${file}`;

// Fallback Botanical Placeholder
const DEFAULT_PLANT_IMAGE = img("monstera.jpg");
const BOTANICAL_PLACEHOLDER = DEFAULT_PLANT_IMAGE;

export const CATEGORY_IMAGES = {
    "Aglonema": img("aglonema.jpg"),
    "Air Plant": img("airplant.jpg"),
    "Alocasia": img("alocasia.jpg"),
    "Anthurium": img("anthurium.jpg"),
    "Begonia": img("begonia.jpg"),
    "Bonsai": img("bonsai.jpg"),
    "Cactus": img("cactus.jpg"),
    "Calathea": img("calathea.jpg"),
    "Dracena": img("dracena.jpg"),
    "Ficus": img("ficus.jpg"),
    "Fittonia": img("fittonia.jpg"),
    "Monstera": img("monstera.jpg"),
    "Peperomia": img("peperomia.jpg"),
    "Philodendron": img("philodendron.jpg"),
    "Pothos": img("pothos.jpg"),
    "Sansevieria": img("sansevieria.jpg"),
    "Succulent": img("succulent.jpg"),
    "Syngonium": img("syngonium.jpg"),
    "ZZ Plant": img("zzplant.jpg")
};


const COLLECTIONS = Object.entries(CATEGORY_IMAGES).map(([name, image]) => ({
    name,
    label: name,
    image: image
})).sort((a, b) => a.name.localeCompare(b.name));

export default function Marketplace() {
    const { t } = useLanguage();
    const [plants, setPlants] = useState([]);
    const [filteredPlants, setFilteredPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [messagingSeller, setMessagingSeller] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [userLocation, setUserLocation] = useState({ lat: 23.7390, lon: 90.3957 }); // Default: Shahbagh

    // Haversine formula for distance
    const getDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return (R * c).toFixed(1);
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                () => console.log("Location access denied")
            );
        }
    }, []);

    const handleImageError = (e) => {
        e.target.src = DEFAULT_PLANT_IMAGE;
    };

    const handleAddToCart = (plant) => {
        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        existingCart.push(plant);
        localStorage.setItem('cart', JSON.stringify(existingCart));
        window.dispatchEvent(new Event('cartUpdated'));
        const count = existingCart.length;

        // Professional dashboard-style notification (replaces the old alert()).
        toast.custom((tst) => (
            <div
                className={`${tst.visible ? 'animate-slideIn' : 'opacity-0'} max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex items-center gap-3 p-3 pr-4 border border-nature-100 ring-1 ring-black/5`}
            >
                <img
                    src={getImagePath(plant)}
                    alt={plant.plant_name}
                    onError={handleImageError}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-nature-50"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-nature-600">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-nature-500 text-white">
                            <Check className="w-3 h-3" strokeWidth={3} />
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-widest">Added to cart</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate">{plant.plant_name}</p>
                    <p className="text-xs text-gray-500 font-semibold">৳{parseFloat(plant.price || 0).toFixed(2)} · {count} item{count > 1 ? 's' : ''} in cart</p>
                </div>
                <Link
                    to="/cart"
                    onClick={() => toast.dismiss(tst.id)}
                    className="flex-shrink-0 bg-nature-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-nature-700 transition-colors"
                >
                    View
                </Link>
            </div>
        ), { duration: 2600, position: 'top-center' });
    };

    useEffect(() => {
        const englishCategory = categoryMapping[selectedCategory] || selectedCategory;
        fetchPlants(englishCategory);
    }, [selectedCategory]);

    const fetchPlants = async (category = 'All') => {
        setLoading(true);
        try {
            // Ensure we use English slug for API
            const categorySlug = categoryMapping[category] || category;
            const res = await api.get('/plants/', {
                params: categorySlug !== 'All' ? { category: categorySlug } : {}
            });
            setPlants(res.data);
            setFilteredPlants(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = plants.filter(p =>
            p.plant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.seller_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setFilteredPlants(filtered);
    }, [searchQuery, plants]);

    const getImagePath = (plant) => {
        if (!plant.image_url) return BOTANICAL_PLACEHOLDER;
        const url = plant.image_url;
        if (url.startsWith('http')) return url;
        let path = "";
        if (url.startsWith('/media/')) {
            path = url; // uploaded media, served by Django (proxied in dev)
        } else if (url.startsWith('/static/')) {
            // Re-root onto the current Vite base ("/" in dev, "/static/" in prod).
            path = `${import.meta.env.BASE_URL}${url.slice('/static/'.length)}`;
        } else if (url.startsWith('/')) {
            path = `${import.meta.env.BASE_URL}${url.slice(1)}`;
        } else {
            path = `/media/${url}`;
        }
        return `${path}?v=1779038000`;
    };


    return (
        <div className="space-y-12 animate-fadeIn min-h-[80vh] pb-24 bg-nature-50/30">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-2">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-nature-900 tracking-tight mb-2">{t('marketplace')}</h1>
                    <p className="text-gray-500 font-bold text-lg">{t('curatedCollections') || 'Curated collections for every green soul.'}</p>
                </div>

                <div className="relative w-full md:w-[450px] group">
                    <Search className="absolute left-5 top-4 w-5 h-5 text-gray-400 group-focus-within:text-nature-600 transition-colors" />
                    <input
                        type="text"
                        placeholder={t('searchPlants')}
                        className="w-full pl-14 pr-14 py-4 bg-white border border-nature-100 rounded-[22px] shadow-sm focus:ring-4 focus:ring-nature-400/20 focus:border-nature-300 focus:outline-none transition-all placeholder:text-gray-300 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute right-4 top-2">
                        <VoiceInput onResult={(val) => setSearchQuery(val)} />
                    </div>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3 text-nature-800 font-black">
                        <Filter className="w-5 h-5 text-nature-600" />
                        <span className="text-xs uppercase tracking-[0.2em] font-black">{t('categories')}</span>
                    </div>
                    {categoryMapping[selectedCategory] !== 'All' && (
                        <button
                            onClick={() => setSelectedCategory('All')}
                            className="bg-nature-100 text-nature-900 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider hover:bg-nature-200 transition-colors flex items-center gap-2"
                        >
                            <X className="w-3 h-3" />
                            {t('clearFilter') || 'Clear Filter'}
                        </button>
                    )}
                </div>
                <div className="flex overflow-x-auto gap-4 pb-4 px-2 scrollbar-none snap-x">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-8 py-3 rounded-2xl font-black whitespace-nowrap transition-all duration-500 snap-start border ${selectedCategory === cat
                                ? 'bg-nature-900 text-white shadow-2xl shadow-nature-900/40 border-nature-900 -translate-y-1'
                                : 'bg-white text-gray-500 hover:bg-nature-50 border-nature-100'
                                }`}
                        >
                            {t(cat) || cat}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-96 animate-pulse bg-white rounded-[32px] border border-nature-50 shadow-sm"></div>
                    ))}
                </div>
            ) : (
                <div className="animate-scaleUp px-2">
                    {categoryMapping[selectedCategory] === 'All' && searchQuery === '' ? (
                        <div className="space-y-10">
                            {/* 1. Category Navigator Grid */}
                            <div className="flex items-center gap-4 px-2">
                                <div className="h-10 w-2 bg-nature-900 rounded-full" />
                                <h2 className="text-3xl font-black text-nature-900 uppercase tracking-tighter">{t('categoryCollections') || 'Category Collections'}</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
                                {COLLECTIONS.map((col) => (
                                    <div
                                        key={col.name}
                                        onClick={() => {
                                            setSelectedCategory(col.name);
                                        }}
                                        className="relative h-80 rounded-[32px] overflow-hidden cursor-pointer group shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 border-4 border-white hover:border-nature-200 bg-nature-100"
                                    >
                                        <img
                                            src={col.image}
                                            alt={col.name}
                                            onError={handleImageError}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms]"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-nature-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />

                                        <div className="absolute inset-0 flex flex-col justify-end p-8">
                                            <h3 className="text-2xl font-black text-white leading-tight tracking-tight drop-shadow-lg transform group-hover:translate-x-2 transition-transform duration-500">
                                                {t(col.label) || col.label}
                                            </h3>
                                            <div className="flex items-center gap-2 text-nature-300 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                                <span>Browse Varieties</span>
                                                <div className="w-8 h-[2px] bg-nature-400" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-2 bg-nature-600 rounded-full" />
                                <h2 className="text-3xl font-black text-nature-900">{t(selectedCategory) || selectedCategory} {t('marketplace')}</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {filteredPlants.map((plant) => (
                                    <PlantCard 
                                        key={plant.id} 
                                        plant={plant} 
                                        handleAddToCart={handleAddToCart} 
                                        getImagePath={getImagePath} 
                                        setMessagingSeller={setMessagingSeller}
                                        distance={userLocation ? getDistance(userLocation.lat, userLocation.lon, plant.seller_lat, plant.seller_lon) : null}
                                    />
                                ))}
                            </div>
                            {filteredPlants.length === 0 && (
                                <div className="text-center py-32 bg-white rounded-[40px] border-4 border-dashed border-nature-50 shadow-inner">
                                    <div className="w-24 h-24 bg-nature-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ShoppingBag className="w-10 h-10 text-nature-200" />
                                    </div>
                                    <h3 className="text-2xl font-black text-nature-900">{t('noActivePlans')}</h3>
                                    <p className="text-gray-400 font-medium mt-3 max-w-sm mx-auto">{t('noPlantsInStock')}</p>
                                    <button
                                        onClick={() => setSelectedCategory('All')}
                                        className="mt-10 px-10 py-4 bg-nature-900 text-white rounded-2xl font-black hover:bg-nature-800 transition-all shadow-xl shadow-nature-900/20 active:scale-95"
                                    >
                                        {t('exploreAllCategories')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Message Seller Modal */}
            {messagingSeller && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
                    <div
                        className="absolute inset-0 bg-nature-950/60 backdrop-blur-md"
                        onClick={() => setMessagingSeller(null)}
                    />
                    <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl border border-white/20 overflow-hidden animate-scaleUp">
                        <div className="bg-nature-900 p-10 text-white relative">
                            <button
                                onClick={() => setMessagingSeller(null)}
                                className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-2xl transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <MessageSquare className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">{t('directQuery')}</h3>
                                    <p className="text-nature-200 text-sm font-bold uppercase tracking-widest mt-1">Sending to: @{messagingSeller}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">{t('yourInquiry')}</label>
                                <textarea
                                    className="w-full h-44 p-8 bg-nature-50 rounded-[32px] border-2 border-transparent focus:border-nature-400 focus:bg-white focus:outline-none transition-all resize-none font-bold text-gray-700 text-lg placeholder:text-gray-300"
                                    placeholder={t('localPickup')}
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={() => {
                                    if (messageText.trim()) {
                                        toast.success(`Message sent to ${messagingSeller}!`);
                                        setMessageText('');
                                        setMessagingSeller(null);
                                    }
                                }}
                                disabled={!messageText.trim()}
                                className="w-full py-6 bg-nature-900 text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-4 hover:bg-nature-950 transition-all shadow-2xl shadow-nature-900/40 active:scale-95 disabled:opacity-50 disabled:scale-100"
                            >
                                <Send className="w-6 h-6" />
                                {t('sendQuery')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PlantCard({ plant, handleAddToCart, getImagePath, setMessagingSeller, distance }) {
    const { t } = useLanguage();
    return (
        <div className="card group hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-700 rounded-[32px] bg-white border border-nature-50 overflow-hidden flex flex-col h-full">
            {/* Image Container */}
            <div className="h-72 overflow-hidden relative bg-nature-50">
                <img
                    src={getImagePath(plant)}
                    alt={t(plant.plant_name) || plant.plant_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms]"
                    onError={(e) => e.target.src = BOTANICAL_PLACEHOLDER}
                />

                {/* Nearby Badge */}
                {distance && (
                    <div className="absolute top-5 right-5 animate-slideDown">
                        <span className="bg-white/90 backdrop-blur-md text-nature-700 text-[9px] font-black px-4 py-2 rounded-full shadow-lg border border-nature-100 flex items-center gap-1 uppercase tracking-tighter">
                            <MapPin className="w-2.5 h-2.5 text-nature-600" />
                            {distance} KM AWAY
                        </span>
                    </div>
                )}

                {/* 1. NEW ARRIVAL Badge (Top-Left) */}
                <div className="absolute top-5 left-5">
                    <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black px-5 py-2.5 rounded-[14px] shadow-xl uppercase tracking-[0.1em]">
                        {t('newArrival')}
                    </span>
                </div>

                {/* 2. Price Display in ৳ (Bottom-Right) */}
                <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-lg px-6 py-3 rounded-[20px] text-xl font-black text-nature-950 shadow-2xl border border-white/40">
                    ৳{plant.price}
                </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-5 flex-1 flex flex-col">
                <div className="flex-1">
                    {/* 3. Bold Plant Name */}
                    <h3 className="text-2xl font-black text-gray-900 leading-none mb-3 group-hover:text-nature-700 transition-colors tracking-tight">
                        {t(plant.plant_name) || plant.plant_name}
                    </h3>
                    {/* 3. Short 'With pot Media' description */}
                    <p className="text-sm text-gray-400 font-bold leading-relaxed mb-4 flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5" />
                        {plant.description || 'With pot Media'}
                    </p>
                </div>

                {/* 4. Seller Info (Bottom-Left) */}
                <div className="flex items-center justify-between pt-6 border-t border-nature-50">
                    <div className="flex items-center gap-4">
                        {/* Seller's Initial Avatar */}
                        <div className="w-12 h-12 rounded-[18px] bg-nature-100 border-2 border-white shadow-md flex items-center justify-center text-base font-black text-nature-800 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            {plant.seller_username?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-300 font-black uppercase tracking-[0.2em] leading-none mb-1">Seller</span>
                            <div className="flex items-center gap-2">
                                <Link
                                    to={`/sellers/${plant.seller_username}`}
                                    className="text-sm font-black text-gray-900 hover:text-nature-600 transition-colors"
                                >
                                    {plant.seller_username}
                                </Link>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setMessagingSeller(plant.seller_username);
                                    }}
                                    className="text-nature-300 hover:text-nature-700 transition-all p-1 hover:bg-nature-50 rounded-lg"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => handleAddToCart(plant)}
                        className="w-14 h-14 bg-nature-50 text-nature-900 rounded-[22px] flex items-center justify-center hover:bg-nature-900 hover:text-white transition-all duration-500 shadow-sm active:scale-90"
                    >
                        <ShoppingBag className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
}
