import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import plantsData from '../data/plants/plants.json';
import PlantFilter from '../components/PlantFilter';
import { useLanguage } from '../i18n/LanguageContext';
import { Leaf, ChevronRight, Info, Droplets, Sun, Sprout, Search, Beaker, Mountain, Package, Check, CreditCard, Bell, X, AlertCircle, Calendar } from 'lucide-react';
import { api, isAuthenticated } from '../api/axios';

const VarietyCard = ({ variety, onClick }) => {
    const { t } = useLanguage();
    const [imgError, setImgError] = useState(false);

    return (
        <div
            onClick={() => onClick(variety)}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
        >
            <div className="h-48 bg-gray-100 relative overflow-hidden">
                {variety.image && !imgError ? (
                    <img
                        src={variety.image}
                        alt={t(variety.name) || variety.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-nature-50 text-nature-300">
                        <Sprout className="w-12 h-12" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white font-medium text-sm flex items-center gap-1">
                        Read Guide <ChevronRight className="w-4 h-4" />
                    </span>
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-nature-600 transition-colors">{t(variety.name) || variety.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">{variety.description}</p>
            </div>
        </div>
    );
};

const SubscriptionCard = ({ plan, onSelect }) => {
    const { t } = useLanguage();
    return (
    <div className="bg-white rounded-3xl shadow-lg border border-nature-100 overflow-hidden hover:shadow-2xl transition-all duration-500 group relative">
        <div className="bg-nature-900 p-8 text-white">
            <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
            <p className="text-nature-300 text-sm mb-4">{plan.description}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">৳{plan.price}</span>
                <span className="text-nature-400 text-sm">/ {plan.duration}</span>
            </div>
        </div>
        <div className="p-8">
            <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-600">
                        <div className="mt-1 bg-nature-100 p-1 rounded-full text-nature-600">
                            <Check className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-medium">{feature}</span>
                    </li>
                ))}
            </ul>
            <button
                onClick={() => onSelect(plan)}
                className="w-full bg-nature-600 hover:bg-nature-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-nature-200 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
            >
                <CreditCard className="w-5 h-5" /> {t('getStarted')}
            </button>
        </div>
    </div>
    );
};

const PaymentModal = ({ plan, onClose, onSuccess }) => {
    // 0: Shipping Details, 1: bKash input, 2: processing, 3: Success
    const [step, setStep] = useState(0); 
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pin, setPin] = useState('');
    
    // Shipping fields
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        address: '',
        district: 'Dhaka',
        save_account: false
    });

    const handleShippingSubmit = (e) => {
        e.preventDefault();
        if (!formData.customer_name || !formData.customer_phone || !formData.address) {
            toast.error("Please fill all required fields");
            return;
        }
        setStep(1); // proceed to bKash UI
    };

    const [paymentMode, setPaymentMode] = useState('full'); // 'full' or 'installment'
    
    const installmentAmount = Math.round(plan.price / (parseInt(plan.duration) / 3));

    const handlePayment = async () => {
        if (paymentMode === 'full' && (!phoneNumber || phoneNumber.length < 11)) {
            toast("Please enter a valid bKash number");
            return;
        }
        setStep(2); // processing
        try {
            // Actual API call
            await onSuccess({ ...formData, payment_mode: paymentMode });
            setStep(3);
        } catch (err) {
            toast.error("Subscription activation failed. Please check your data and try again.");
            setStep(1); // revert back
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp">
                {step < 3 && (
                    <div className="bg-nature-900 p-6 flex flex-col items-center">
                        <div className="flex justify-between w-full mb-4">
                            <span className="text-white font-bold text-lg flex items-center gap-2"><Sprout className="w-5 h-5"/> Easy Grow</span>
                            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="text-center text-white">
                            <h3 className="font-bold text-lg mb-1">{step === 0 ? "Shipping Details" : "Checkout"}</h3>
                            <p className="text-white/80 text-sm">
                                {paymentMode === 'installment' ? `First Installment: ৳${installmentAmount}` : `Total Amount: ৳${plan.price}`}
                            </p>
                        </div>
                    </div>
                )}

                <div className="p-8">
                    {step === 0 && (
                        <form onSubmit={handleShippingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Israt Jahan"
                                    className="w-full px-4 py-3 bg-nature-50 border border-nature-200 rounded-xl focus:ring-2 focus:ring-nature-500 outline-none transition-all"
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile Number *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Valid mobile number"
                                    className="w-full px-4 py-3 bg-nature-50 border border-nature-200 rounded-xl focus:ring-2 focus:ring-nature-500 outline-none transition-all"
                                    value={formData.customer_phone}
                                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Detailed Address *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="House, Road, Block, Area"
                                    className="w-full px-4 py-3 bg-nature-50 border border-nature-200 rounded-xl focus:ring-2 focus:ring-nature-500 outline-none transition-all"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">District / Region</label>
                                <select 
                                    className="w-full px-4 py-3 bg-nature-50 border border-nature-200 rounded-xl focus:ring-2 focus:ring-nature-500 outline-none transition-all"
                                    value={formData.district}
                                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                                >
                                    <option value="Dhaka">Inside Dhaka</option>
                                    <option value="Outside Dhaka">Outside Dhaka</option>
                                </select>
                            </div>
                            {!isAuthenticated() && (
                                <label className="flex items-center gap-3 mt-4 p-3 bg-nature-100/50 rounded-xl cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="rounded text-nature-600 focus:ring-nature-500 w-5 h-5 border-nature-300"
                                        checked={formData.save_account}
                                        onChange={(e) => setFormData({...formData, save_account: e.target.checked})}
                                    />
                                    <span className="text-sm text-nature-800 font-medium">Save this information for future use</span>
                                </label>
                            )}
                            <button
                                type="submit"
                                className="w-full mt-4 bg-nature-600 hover:bg-nature-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                            >
                                Proceed to Payment
                            </button>
                        </form>
                    )}

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button 
                                    onClick={() => setPaymentMode('full')}
                                    className={`p-4 rounded-2xl border-2 font-bold text-xs transition-all ${paymentMode === 'full' ? 'border-nature-900 bg-nature-50 text-nature-900' : 'border-gray-100 text-gray-400'}`}
                                >
                                    Full Payment (bKash)
                                </button>
                                <button 
                                    onClick={() => setPaymentMode('installment')}
                                    className={`p-4 rounded-2xl border-2 font-bold text-xs transition-all ${paymentMode === 'installment' ? 'border-nature-900 bg-nature-50 text-nature-900' : 'border-gray-100 text-gray-400'}`}
                                >
                                    Installment (COD)
                                </button>
                            </div>

                            {paymentMode === 'full' ? (
                                <>
                                    <div className="flex justify-center mb-6">
                                        <img src="https://www.logo.wine/a/logo/BKash/BKash-Icon-Logo.wine.svg" alt="bKash" className="h-16" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Your bKash Number</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 017XXXXXXXX"
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#D12053] outline-none transition-all font-bold text-lg"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="p-6 bg-nature-50 rounded-2xl border border-nature-100 space-y-4">
                                    <div className="flex items-center gap-3 text-nature-900">
                                        <CreditCard className="w-6 h-6" />
                                        <span className="font-black">Cash on Delivery</span>
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">
                                        You will pay **৳{installmentAmount}** upon receiving your first 3-month delivery. 
                                        Remaining installments will be collected during future deliveries.
                                    </p>
                                </div>
                            )}

                            <div className="p-4 bg-gray-50 rounded-2xl flex gap-3 items-start border border-gray-100">
                                <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                    {paymentMode === 'full' 
                                        ? "By clicking 'Confirm Payment', you agree to pay the full amount via bKash."
                                        : "By clicking 'Confirm Order', you agree to pay the installments on delivery."}
                                </p>
                            </div>

                            <button
                                onClick={handlePayment}
                                className={`w-full ${paymentMode === 'full' ? 'bg-[#D12053] hover:bg-[#B11B46]' : 'bg-nature-900 hover:bg-black'} text-white font-bold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2`}
                            >
                                {paymentMode === 'full' ? 'Confirm bKash Payment' : 'Confirm COD Order'}
                            </button>
                            <button onClick={() => setStep(0)} className="w-full text-center text-sm font-bold text-gray-500 hover:text-gray-800 mt-2">
                                Go Back
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="py-12 flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 border-4 border-nature-200 border-t-nature-600 rounded-full animate-spin"></div>
                            <div>
                                <h3 className="font-bold text-xl text-gray-900">Processing Checkout</h3>
                                <p className="text-gray-500">Please do not close this window</p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="py-8 flex flex-col items-center text-center space-y-6">
                            <div className="w-24 h-24 bg-nature-100 rounded-full flex items-center justify-center text-nature-600 animate-bounce-slow">
                                <Check className="w-12 h-12" />
                            </div>
                            <div>
                                <h3 className="font-bold text-2xl text-gray-900 mb-2">Order Confirmed!</h3>
                                <p className="text-gray-500 max-w-[240px] mx-auto text-sm">
                                    Your {plan.duration} subscription plan is now active.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/plant-care');
                                }}
                                className="w-full bg-nature-900 text-white font-bold py-4 rounded-2xl transition hover:bg-black"
                            >
                                Finish
                            </button>
                        </div>
                    )}
                </div>
                {step < 3 && (
                    <div className="p-4 bg-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure 128-bit Encrypted Checkout</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default function PlantCare() {
    const { t } = useLanguage();
    const { categoryId, varietyId } = useParams();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('guides'); // 'guides' or 'subscription'

    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tab = queryParams.get('tab');
        if (tab === 'subscription') {
            setActiveTab('subscription');
        } else {
            setActiveTab('guides');
        }
    }, [location.search]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedVariety, setSelectedVariety] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState({ lowLight: false, petFriendly: false });
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [detailImgError, setDetailImgError] = useState(false);
    
    // Subscription states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [subFilter, setSubFilter] = useState({ type: 'All Packages', value: null });
    const [openDropdown, setOpenDropdown] = useState(null);
    const [isCustomMode, setIsCustomMode] = useState(false);

    const [customConfig, setCustomConfig] = useState({
        duration: 3,
        mediaType: 'Cactus Media',
        mediaQty: 0,
        supplements: {},
        addons: [],
        deliveryLocation: 'Inside Dhaka',
        expertPotting: false,
        pottingDate: ''
    });

    const PRICING = {
        media: {
            'Cactus Media': 100,
            'Aroid Media': 120,
            'Pothos Media': 80,
            'Aglaonema Media': 110,
            'Orchid Bark': 150,
            'Succulent Media': 90
        },
        supplements: {
            'Vermicompost': 40,
            'Cocopeat': 30,
            'NPK': 50,
            'Bone/Horn Meal': 60,
            'Neem Cake': 45,
            'Liquid Foliar Spray': 150
        },
        addons: {
            'Automated delivery notifications': 0,
            'Expert consultation access': 0
        },
        pottingFee: 100,
        deliveryCost: 60
    };

    const updateSupplementQty = (item, qty) => {
        if (qty < 0) return;
        setCustomConfig(prev => ({
            ...prev,
            supplements: {
                ...prev.supplements,
                [item]: qty
            }
        }));
    };

    const toggleAddon = (item) => {
        setCustomConfig(prev => ({
            ...prev,
            addons: prev.addons.includes(item)
                ? prev.addons.filter(s => s !== item)
                : [...prev.addons, item]
        }));
    };

    const calcCustomTotal = () => {
        let subtotalPerDelivery = (PRICING.media[customConfig.mediaType] || 0) * (customConfig.mediaQty || 0);
        Object.entries(customConfig.supplements).forEach(([sup, qty]) => {
            subtotalPerDelivery += (PRICING.supplements[sup] || 0) * (qty || 0);
        });

        // Add potting fee if selected
        if (customConfig.expertPotting) {
            subtotalPerDelivery += PRICING.pottingFee;
        }

        const numDeliveries = Math.max(1, Math.floor(customConfig.duration / 3));
        const baseDC = customConfig.deliveryLocation === 'Inside Dhaka' ? 70 : 120;
        
        // Final values based on recurrence
        const totalProducts = subtotalPerDelivery * numDeliveries;
        const totalDelivery = subtotalPerDelivery > 0 ? (baseDC * numDeliveries) : 0;
        
        return { 
            subtotal: subtotalPerDelivery, 
            numDeliveries, 
            totalDelivery, 
            total: totalProducts + totalDelivery 
        };
    };

    const totals = calcCustomTotal();

    const handleCustomSubscribe = () => {
        
        const selectedSupplements = Object.entries(customConfig.supplements)
            .filter(([sup, qty]) => qty > 0)
            .map(([sup, qty]) => qty + ' kg ' + sup);

        const customPlanDetails = {
            id: 'custom_package_' + customConfig.duration + 'm_' + Date.now(),
            name: 'Custom Package (' + customConfig.duration + ' Months)',
            price: totals.total,
            duration: customConfig.duration + ' Months',
            description: 'Custom tailored plant care subscription plan.',
            features: [
                customConfig.mediaQty + ' kg ' + customConfig.mediaType,
                ...selectedSupplements,
                ...customConfig.addons,
                ...(customConfig.expertPotting ? [`Expert Potting Service (${customConfig.pottingDate})`] : [])
            ]
        };

        setSelectedPlan(customPlanDetails);
        setShowPaymentModal(true);
    };

    const subscriptionPlans = [
        {
            id: 'essential_soil_booster_3m',
            name: 'Essential Soil Booster',
            price: 450,
            duration: '3 Months',
            category: 'Essential Nutrients',
            description: 'A quick nutrient recharge for all your indoor and outdoor plants.',
            features: [
                'Premium Vermicompost (1 kg)',
                'Sterilized Cocopeat (0.5 kg)',
                'Balanced NPK Fertilizer (100g)',
                'Organic Neem Cake Powder (200g)',
                'One-time doorstep delivery',
                '7-day advance delivery notifications',
                'Expert consultation access'
            ]
        },
        {
            id: 'essential_soil_booster_6m',
            name: 'Essential Soil Booster',
            price: 850,
            duration: '6 Months',
            category: 'Essential Nutrients',
            description: 'A quick nutrient recharge for all your indoor and outdoor plants.',
            features: [
                'Premium Vermicompost (2 kg)',
                'Wash-treated Cocopeat (1.5 kg)',
                'Hargura & Shing Kuchi (500g)',
                'Balanced NPK Booster (250g)',
                'Automated delivery every 3 months',
                '7-day advance delivery notifications',
                'Expert consultation access'
            ]
        },
        {
            id: 'essential_soil_booster_12m',
            name: 'Essential Soil Booster',
            price: 1000,
            duration: '12 Months',
            category: 'Essential Nutrients',
            description: 'A quick nutrient recharge for all your indoor and outdoor plants.',
            features: [
                'Premium Vermicompost (4 kg)',
                'High-Grade Cocopeat (3 kg)',
                'Hargura and Shing Kuchi (1 kg)',
                'Master Micronutrient Mix (200g)',
                'Automated delivery every 4 months',
                '7-day advance delivery notifications',
                'Expert consultation access'
            ]
        },
        {
            id: 'essential_soil_booster_24m',
            name: 'Essential Soil Booster',
            price: 3000,
            duration: '24 Months',
            category: 'Essential Nutrients',
            description: 'A quick nutrient recharge for all your indoor and outdoor plants.',
            features: [
                'Premium Vermicompost (8 kg)',
                'Wash-treated Cocopeat (6 kg)',
                'Organic Mustard Oil Cake (2 kg)',
                'Har Gura and Shing Kuchi (2.5 kg)',
                'Complete NPK & Micronutrient Kit (1 kg)',
                'Automated delivery every 4 months',
                '7-day advance delivery notifications',
                'Expert consultation access'
            ]
        },
        {
            id: 'cactus_elite_3m',
            name: 'Cactus Elite',
            price: 550,
            duration: '3 Months',
            category: 'Cactus Package',
            plantType: 'Cactus',
            description: 'Premium care package tailored specifically for desert and tropical cacti.',
            features: [
                'Special Cactus Media (1 kg)',
                'Volcanic Rocks (0.5 kg)',
                'Sterilized Sand (1 kg)',
                'Liquid Cactus Food (50 ml)',
                'One-time doorstep delivery',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'cactus_pro_6m',
            name: 'Cactus Pro',
            price: 1050,
            duration: '6 Months',
            category: 'Cactus Package',
            plantType: 'Cactus',
            description: 'Premium care package tailored specifically for desert and tropical cacti.',
            features: [
                'Special Cactus Media (2 kg)',
                'Volcanic Rocks (1 kg)',
                'Sterilized Sand (2 kg)',
                'Slow-release Cactus Pellets (100g)',
                'Automated delivery (3 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'cactus_master_12m',
            name: 'Cactus Master',
            price: 1950,
            duration: '12 Months',
            category: 'Cactus Package',
            plantType: 'Cactus',
            description: 'Premium care package tailored specifically for desert and tropical cacti.',
            features: [
                'Special Cactus Media (4 kg)',
                'Volcanic Rocks (2 kg)',
                'Sterilized Sand (3 kg)',
                'Liquid Cactus Bloom Booster (250g)',
                'Automated delivery (4 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'cactus_legend_24m',
            name: 'Cactus Legend',
            price: 3750,
            duration: '24 Months',
            category: 'Cactus Package',
            plantType: 'Cactus',
            description: 'Premium care package tailored specifically for desert and tropical cacti.',
            features: [
                'Special Cactus Media (10 kg)',
                'Volcanic Rocks (4 kg)',
                'Sterilized Sand (5 kg)',
                'Anti-Rot Liquid Kit',
                'Automated delivery (4 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'aroid_elite_3m',
            name: 'Aroid Elite',
            price: 550,
            duration: '3 Months',
            category: 'Aroid Package',
            plantType: 'Aroids',
            description: 'The perfect chunky soil mix for your climbing vines.',
            features: [
                'Premium Aroid Media (1.5 kg)',
                'Chunky Coconut Husk (0.5 kg)',
                'Organic Vermicompost (0.5 kg)',
                'Liquid Foliar Spray (100 ml)',
                'One-time doorstep delivery',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'aroid_pro_6m',
            name: 'Aroid Pro',
            price: 1050,
            duration: '6 Months',
            category: 'Aroid Package',
            plantType: 'Aroids',
            description: 'Semi-annual supply for faster growth and bigger leaves.',
            features: [
                'Premium Aroid Media (3 kg)',
                'Chunky Coconut Husk (1 kg)',
                'Organic Vermicompost (1 kg)',
                'High-Nitrogen Leaf Booster (150g)',
                'Automated delivery (3 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'aroid_master_12m',
            name: 'Aroid Master',
            price: 1950,
            duration: '12 Months',
            category: 'Aroid Package',
            plantType: 'Aroids',
            description: 'Annual care for lush greenery and strong root systems.',
            features: [
                'Premium Aroid Media (6 kg)',
                'Chunky Coconut Husk (2 kg)',
                'Organic Vermicompost (2 kg)',
                'Specialized Aroid Nutrient Kit',
                'Automated delivery (4 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'aroid_legend_24m',
            name: 'Aroid Legend',
            price: 3750,
            duration: '24 Months',
            category: 'Aroid Package',
            plantType: 'Aroids',
            description: 'Long-term support for your rare and massive aroid collection.',
            features: [
                'Premium Aroid Media (12 kg)',
                'Chunky Coconut Husk (4 kg)',
                'Organic Vermicompost (5 kg)',
                'Professional Pest & Fungus Protection',
                'Automated delivery (4 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'pothos_elite_3m',
            name: 'Pothos Elite',
            price: 450,
            duration: '3 Months',
            category: 'Pothos Package',
            plantType: 'Pothos',
            description: 'Essential nutrition for lush and trailing vines.',
            features: [
                'Premium Pothos Media (1.5 kg)',
                'Sterilized Cocopeat (0.5 kg)',
                'Organic Vermicompost (0.5 kg)',
                'Liquid Foliage Booster (100 ml)',
                'One-time doorstep delivery',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'pothos_pro_6m',
            name: 'Pothos Pro',
            price: 850,
            duration: '6 Months',
            category: 'Pothos Package',
            plantType: 'Pothos',
            description: 'Semi-annual supply for bigger leaves and faster growth.',
            features: [
                'Premium Pothos Media (3 kg)',
                'Sterilized Cocopeat (1 kg)',
                'Organic Vermicompost (1 kg)',
                'Magnesium-rich Epsom Salt (100g)',
                'Automated delivery (3 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'pothos_master_12m',
            name: 'Pothos Master',
            price: 1650,
            duration: '12 Months',
            category: 'Pothos Package',
            plantType: 'Pothos',
            description: 'The ultimate annual kit for a green indoor jungle.',
            features: [
                'Premium Pothos Media (6 kg)',
                'Sterilized Cocopeat (2 kg)',
                'Organic Vermicompost (2 kg)',
                'Master Liquid Fertilizer (250 ml)',
                'Automated delivery (4 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'pothos_legend_24m',
            name: 'Pothos Legend',
            price: 3200,
            duration: '24 Months',
            category: 'Pothos Package',
            plantType: 'Pothos',
            description: 'Long-term care for massive and healthy money plant vines.',
            features: [
                'Premium Pothos Media (12 kg)',
                'Sterilized Cocopeat (4 kg)',
                'Organic Vermicompost (5 kg)',
                'Professional Leaf Shine & Protection',
                'Automated delivery (4 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'aglaonema_elite_3m',
            name: 'Aglaonema Elite',
            price: 650,
            duration: '3 Months',
            category: 'Aglaonema Package',
            plantType: 'Aglonema',
            description: 'Essential media and nutrition for vibrant foliage.',
            features: [
                'Special Aglaonema Media (1.5 kg)',
                'Premium Vermicompost (0.5 kg)',
                'Specialized Foliar Spray (100 ml)',
                'Neem Cake Powder (100g)',
                'One-time doorstep delivery',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'aglaonema_pro_6m',
            name: 'Aglaonema Pro',
            price: 1250,
            duration: '6 Months',
            category: 'Aglaonema Package',
            plantType: 'Aglonema',
            description: 'Semi-annual media and nutrient supply for healthy growth.',
            features: [
                'Special Aglaonema Media (3 kg)',
                'Premium Vermicompost (1.5 kg)',
                'Balanced Foliage Booster (150g)',
                'Neem Cake Powder (250g)',
                'Automated delivery (3 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'aglaonema_master_12m',
            name: 'Aglaonema Master',
            price: 2400,
            duration: '12 Months',
            category: 'Aglaonema Package',
            plantType: 'Aglonema',
            description: 'Annual media and nutrient kit for ultimate plant health.',
            features: [
                'Special Aglaonema Media (6 kg)',
                'Premium Vermicompost (3 kg)',
                'Master Leaf Shine & Booster (250 ml)',
                'Micronutrient & Rooting Mix (100g)',
                'Automated delivery (4 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'aglaonema_legend_24m',
            name: 'Aglaonema Legend',
            price: 4500,
            duration: '24 Months',
            category: 'Aglaonema Package',
            plantType: 'Aglonema',
            description: 'Long-term royal treatment with premium media and care.',
            features: [
                'Special Aglaonema Media (12 kg)',
                'Premium Vermicompost (6 kg)',
                'Professional Anti-Fungal Solution',
                'Complete Vitamin & Nutrient Kit',
                'Automated delivery (4 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'orchid_elite_3m',
            name: 'Orchid Elite',
            price: 650,
            duration: '3 Months',
            category: 'Orchid Package',
            plantType: 'Orchid',
            description: 'The essential aeration and nutrient kit for healthy blooms.',
            features: [
                'Premium Orchid Bark Mix (1 kg)',
                'Sterilized Coconut Chips (0.5 kg)',
                'Orchid Bloom Booster Spray (100 ml)',
                'Specialized Orchid Fertilizer (50g)',
                'One-time doorstep delivery',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'orchid_pro_6m',
            name: 'Orchid Pro',
            price: 1250,
            duration: '6 Months',
            category: 'Orchid Package',
            plantType: 'Orchid',
            description: 'Semi-annual supply to ensure strong roots and flowering.',
            features: [
                'Premium Orchid Bark Mix (2 kg)',
                'Sterilized Coconut Chips (1 kg)',
                'Water-soluble Bloom Booster (150g)',
                'Charcoal & Perlite Mix (250g)',
                'Automated delivery (3 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'orchid_master_12m',
            name: 'Orchid Master',
            price: 2400,
            duration: '12 Months',
            category: 'Orchid Package',
            plantType: 'Orchid',
            description: 'The ultimate annual package for exotic orchid lovers.',
            features: [
                'Premium Orchid Bark Mix (5 kg)',
                'Sterilized Coconut Chips (2 kg)',
                'Professional Orchid Food Kit (250g)',
                'Anti-Fungal Root Protection Spray',
                'Automated delivery (4 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'orchid_legend_24m',
            name: 'Orchid Legend',
            price: 4500,
            duration: '24 Months',
            category: 'Orchid Package',
            plantType: 'Orchid',
            description: 'Long-term royal care for your rare and prize orchid collection.',
            features: [
                'Premium Orchid Bark Mix (12 kg)',
                'Sterilized Coconut Chips (4 kg)',
                'Complete Vitamin & Nutrient Kit',
                'Moss & Hydration Management Kit',
                'Automated delivery (4 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'succulent_elite_3m',
            name: 'Succulent Elite',
            price: 550,
            duration: '3 Months',
            category: 'Succulent Package',
            plantType: 'Succulent',
            description: 'Essential mineral-rich media for plump and healthy leaves.',
            features: [
                'Special Succulent Media (1.5 kg)',
                'Premium Volcanic Pumice (0.5 kg)',
                'Succulent Liquid Food (50 ml)',
                'Sterilized Coarse Sand (0.5 kg)',
                'One-time doorstep delivery',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'succulent_pro_6m',
            name: 'Succulent Pro',
            price: 1050,
            duration: '6 Months',
            category: 'Succulent Package',
            plantType: 'Succulent',
            description: 'Semi-annual supply to prevent rot and promote growth.',
            features: [
                'Special Succulent Media (3 kg)',
                'Premium Volcanic Pumice (1 kg)',
                'Slow-release Succulent Pellets (100g)',
                'Sterilized Coarse Sand (1 kg)',
                'Automated delivery (3 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'succulent_master_12m',
            name: 'Succulent Master',
            price: 1950,
            duration: '12 Months',
            category: 'Succulent Package',
            plantType: 'Succulent',
            description: 'The ultimate annual kit for vibrant colors and strong roots.',
            features: [
                'Special Succulent Media (6 kg)',
                'Premium Volcanic Pumice (2 kg)',
                'Liquid Bloom & Color Booster (150 ml)',
                'Specialized Anti-Rot Solution (50 ml)',
                'Automated delivery (4 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        },
        {
            id: 'succulent_legend_24m',
            name: 'Succulent Legend',
            price: 3750,
            duration: '24 Months',
            category: 'Succulent Package',
            plantType: 'Succulent',
            description: 'Long-term royal treatment for your rare succulent collection.',
            features: [
                'Special Succulent Media (12 kg)',
                'Premium Volcanic Pumice (4 kg)',
                'Complete Vitamin & Nutrient Kit',
                'Professional Pest & Fungus Protection',
                'Automated delivery (4 mo)',
                '7-day notification',
                'Expert consultation'
            ]
        }
    ];

    const filteredPlans = subscriptionPlans.filter(plan => {
        if (subFilter.type === 'All Packages') return true;
        if (subFilter.type === 'Essential Nutrients') return plan.category === 'Essential Nutrients';
        if (subFilter.type === 'Duration Based') return plan.duration.startsWith(subFilter.value);
        if (subFilter.type === 'By Plant Type') return plan.plantType === subFilter.value;
        return true;
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.dropdown-container')) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Reset image error state when variety changes

    useEffect(() => {
        setDetailImgError(false);
    }, [selectedVariety]);

    useEffect(() => {
        // Initialize data from local JSON
        setCategories(plantsData);
        setFilteredCategories(plantsData);
    }, []);

    // Sync state with URL params
    useEffect(() => {
        if (categoryId) {
            const category = plantsData.find(c => c.id === categoryId);
            if (category) {
                setSelectedCategory(category);
                if (varietyId) {
                    const variety = category.varieties.find(v => v.id === varietyId);
                    if (variety) {
                        setSelectedVariety(variety);
                    } else {
                        setSelectedVariety(null);
                    }
                } else {
                    setSelectedVariety(null);
                }
            } else {
                // Invalid category, maybe redirect or show error? staying on main view for now
                setSelectedCategory(null);
            }
        } else {
            setSelectedCategory(null);
            setSelectedVariety(null);
        }
    }, [categoryId, varietyId]);

    // Enhanced Search/Filter Logic
    useEffect(() => {
        let results = categories;

        // 1. Text Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            results = results.filter(category =>
                category.name.toLowerCase().includes(query) ||
                category.varieties.some(v => v.name.toLowerCase().includes(query))
            );
        }

        // 2. Attribute Filters
        if (activeFilters.lowLight) {
            results = results.filter(category => {
                // Check general care if available
                if (category.care?.light && category.care.light.toLowerCase().includes('low')) return true;
                // Check if ANY variety has low light tolerance
                return category.varieties.some(v => v.care?.light?.toLowerCase().includes('low'));
            });
        }

        if (activeFilters.petFriendly) {
            results = results.filter(category => {
                // Check general care
                if (category.care?.toxicity && (category.care.toxicity.toLowerCase().includes('non-toxic') || category.care.toxicity.toLowerCase().includes('safe'))) return true;
                // Check if ANY variety is non-toxic
                return category.varieties.some(v => v.care?.toxicity && (v.care.toxicity.toLowerCase().includes('non-toxic') || v.care.toxicity.toLowerCase().includes('safe')));
            });
        }

        setFilteredCategories(results);
    }, [searchQuery, activeFilters, categories]);

    const handleFilterChange = (newFilters) => {
        setActiveFilters(newFilters);
    };


    const handleCategoryClick = (category) => {
        navigate(`/plant-care/${category.id}`);
        setSearchQuery(""); // Clear search on selection to see full category
    };

    const handleVarietyClick = (variety) => {
        navigate(`/plant-care/${selectedCategory.id}/${variety.id}`);
    };

    const handleBackToCategories = () => {
        navigate('/plant-care');
    };

    const handleBackToVarieties = () => {
        navigate(`/plant-care/${categoryId}`);
    }

    const handleSubscribeClick = (plan) => {
        setSelectedPlan(plan);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = async (shippingDetails) => {
        try {
            await api.post('/plant-care/subscriptions/', {
                plan_type: selectedPlan.id,
                customer_name: shippingDetails.customer_name,
                customer_phone: shippingDetails.customer_phone,
                shipping_address: shippingDetails.address,
                district: shippingDetails.district,
                save_account: shippingDetails.save_account,
                payment_mode: shippingDetails.payment_mode
            });
        } catch (err) {
            console.error("Subscription failed:", err);
            throw err;
        }
    };

    // Helper to determine which care data to use

    const getCareData = () => {
        if (!selectedCategory) return null;

        // If variety has specific care, use it. Otherwise use category general care.
        if (selectedVariety && selectedVariety.care) {
            return selectedVariety.care;
        }
        return selectedCategory.care;
    };

    const careData = getCareData();

    const CareItem = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-4 p-4 bg-nature-50 rounded-xl hover:bg-nature-100 transition-colors">
            <div className="bg-white p-3 rounded-full shadow-sm text-nature-600">
                <Icon size={24} />
            </div>
            <div>
                <h5 className="font-bold text-gray-900 mb-1">{label}</h5>
                <p className="text-gray-600 text-sm leading-relaxed">{value}</p>
            </div>
        </div>
    );    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Tab Navigation */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('guides')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'guides' ? 'bg-nature-900 text-white shadow-xl' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                    <Leaf className="w-5 h-5" /> {t('plantCare')}
                </button>
                <button
                    onClick={() => setActiveTab('subscription')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'subscription' ? 'bg-nature-900 text-white shadow-xl' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                    <Package className="w-5 h-5" /> {t('subscriptionPlans')}
                </button>
            </div>

            {activeTab === 'guides' ? (
                <>
                    {/* Header Area */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-nature-800 flex items-center gap-3 mb-2">
                                <Leaf className="w-10 h-10 text-nature-600" />
                                Plant Care Guide
                            </h1>
                            <p className="text-gray-500">Expert care instructions for your indoor jungle.</p>
                        </div>

                        {/* Search Bar & Filter */}
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <input
                                    type="text"
                                    placeholder="Search for a plant..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-nature-500 focus:border-transparent"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            </div>
                            <PlantFilter onFilterChange={handleFilterChange} />
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Sidebar / Categories List */}
                        <div className={`lg:col-span-3 space-y-4 ${selectedCategory ? 'hidden lg:block' : 'block'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-bold text-gray-800">Categories</h2>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{filteredCategories.length}</span>
                            </div>
                            <div className="space-y-2 h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredCategories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => handleCategoryClick(category)}
                                        className={`w-full text-left px-4 py-3.5 rounded-xl transition-all flex items-center justify-between group ${selectedCategory?.id === category.id
                                            ? 'bg-nature-600 text-white shadow-md'
                                            : 'bg-white hover:bg-gray-50 text-gray-600 border border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        <span className="font-medium truncate">{category.name}</span>
                                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedCategory?.id === category.id ? 'text-white rotate-90' : 'text-gray-400 group-hover:translate-x-1'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-9">
                            {!selectedCategory ? (
                                <div className="h-full flex flex-col items-center justify-center bg-white p-12 rounded-3xl border border-dashed border-gray-300 text-center min-h-[400px]">
                                    <div className="p-6 bg-nature-50 rounded-full mb-6 animate-bounce-slow">
                                        <Leaf className="w-16 h-16 text-nature-500" />
                                    </div>
                                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-4">{t('plantCare')}</h1>
                                    <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                                        {t('selectPlantFamilyDesc') || 'Choose a plant family from the sidebar to explore specific varieties and discover their unique care requirements.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="animate-fadeIn">
                                    {!selectedVariety ? (
                                        <>
                                            <div className="flex items-center gap-2 mb-6 lg:hidden">
                                                <button onClick={handleBackToCategories} className="flex items-center text-sm font-medium text-gray-500 hover:text-nature-600 transition-colors">
                                                    <ChevronRight className="w-4 h-4 rotate-180" /> {t('backToCategories') || 'Back to Categories'}
                                                </button>
                                            </div>

                                            <div className="bg-gradient-to-r from-nature-50 to-white p-8 rounded-3xl mb-8 border border-nature-100">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h2 className="text-3xl font-bold text-gray-800 mb-2">{t(selectedCategory.name) || selectedCategory.name}</h2>
                                                        <div className="flex gap-2">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-600">
                                                                {t('plantType')}: {t(selectedCategory.type) || selectedCategory.type}
                                                            </span>
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-nature-100 text-nature-700">
                                                                {selectedCategory.careType === 'general' ? t('generalCare') : t('varietySpecificCare')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {selectedCategory.careType === 'general' && (
                                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                                                            <Info className="w-4 h-4" /> {t('generalCareOverview')}
                                                        </h4>
                                                        <p className="text-gray-600 text-sm italic">
                                                            {t('generalCareInstruction')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {selectedCategory.varieties.map((variety) => (
                                                    <VarietyCard
                                                        key={variety.id}
                                                        variety={variety}
                                                        onClick={handleVarietyClick}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="animate-slideUp">
                                            <button
                                                onClick={handleBackToVarieties}
                                                className="mb-4 flex items-center text-sm font-medium text-gray-500 hover:text-nature-600 transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4 rotate-180" /> {t('backToVarieties')}
                                            </button>

                                            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                                                <div className="relative h-64 md:h-96 w-full">
                                                    {selectedVariety.image && !detailImgError ? (
                                                        <img
                                                            src={selectedVariety.image}
                                                            alt={selectedVariety.name}
                                                            className="w-full h-full object-cover"
                                                            onError={() => setDetailImgError(true)}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-nature-50 text-nature-300">
                                                            <Sprout className="w-32 h-32" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                                                    <div className="absolute bottom-0 left-0 p-8 text-white">
                                                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3 inline-block">
                                                            {selectedCategory.name}
                                                        </span>
                                                        <h3 className="text-4xl md:text-5xl font-bold mb-2">{selectedVariety.name}</h3>
                                                        <p className="text-white/90 max-w-2xl text-lg md:text-xl font-light">
                                                            {selectedVariety.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="p-8 md:p-10">
                                                    <div className="mb-8">
                                                        <h4 className="flex items-center gap-2 text-xl font-bold text-nature-800 mb-6 border-b border-gray-100 pb-4">
                                                            <Info className="w-6 h-6" />
                                                            Care Requirements
                                                        </h4>

                                                        <div className="grid md:grid-cols-2 gap-6">
                                                            {careData ? (
                                                                <>
                                                                    <CareItem icon={Droplets} label="Water" value={careData.water} />
                                                                    <CareItem icon={Sun} label="Light" value={careData.light} />
                                                                    <CareItem icon={Mountain} label="Soil" value={careData.soil} />
                                                                    <CareItem icon={Beaker} label="Toxicity" value={careData.toxicity} />
                                                                </>
                                                            ) : (
                                                                <div className="col-span-full p-6 bg-gray-50 rounded-xl text-center text-gray-500 italic">
                                                                    No specific care instructions available for this variety.
                                                                </div>
                                                            )}
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
                </>
            ) : (
                <div className="animate-fadeIn">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-5xl font-black text-nature-900 mb-6 tracking-tight">
                            Expert Plant Care, Delivered to Your Door
                        </h1>
                        <p className="text-lg text-gray-500 leading-relaxed">
                            Subscribe to our premium care plans and receive curated kits, expert nutrients, and professional media for your plants automatically every quarter.
                        </p>
                    </div>

                    {/* Subscription Filter Bar */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                        <button 
                            onClick={() => { setSubFilter({ type: 'All Packages', value: null }); setIsCustomMode(false); }}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${subFilter.type === 'All Packages' && !isCustomMode ? 'bg-nature-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                        >
                            All Packages
                        </button>

                        <div className="relative dropdown-container">
                            <button 
                                onClick={() => setOpenDropdown(openDropdown === 'plant' ? null : 'plant')}
                                className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${subFilter.type === 'By Plant Type' && !isCustomMode ? 'bg-nature-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                            >
                                By Plant Type {subFilter.type === 'By Plant Type' && !isCustomMode && subFilter.value ? `(${subFilter.value})` : ''} <ChevronRight className={`w-4 h-4 transition-transform ${openDropdown === 'plant' ? 'rotate-90' : ''}`} />
                            </button>
                            {openDropdown === 'plant' && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {['Cactus', 'Aroids', 'Pothos', 'Aglonema', 'Orchid', 'Succulent'].map(opt => (
                                        <button 
                                            key={opt}
                                            onClick={() => { setSubFilter({ type: 'By Plant Type', value: opt }); setIsCustomMode(false); setOpenDropdown(null); }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-nature-50 border-b border-gray-50 last:border-0"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => { setSubFilter({ type: 'Essential Nutrients', value: null }); setIsCustomMode(false); }}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${subFilter.type === 'Essential Nutrients' && !isCustomMode ? 'bg-nature-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                        >
                            Essential Nutrients
                        </button>

                        <div className="relative dropdown-container">
                            <button 
                                onClick={() => setOpenDropdown(openDropdown === 'duration' ? null : 'duration')}
                                className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${subFilter.type === 'Duration Based' && !isCustomMode ? 'bg-nature-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                            >
                                Duration Based {subFilter.type === 'Duration Based' && !isCustomMode && subFilter.value ? `(${subFilter.value} Months)` : ''} <ChevronRight className={`w-4 h-4 transition-transform ${openDropdown === 'duration' ? 'rotate-90' : ''}`} />
                            </button>
                            {openDropdown === 'duration' && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {['3', '6', '12', '24'].map(opt => (
                                        <button 
                                            key={opt}
                                            onClick={() => { setSubFilter({ type: 'Duration Based', value: opt }); setIsCustomMode(false); setOpenDropdown(null); }}
                                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-nature-50 border-b border-gray-50 last:border-0"
                                        >
                                            {opt} Months
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => setIsCustomMode(true)}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${isCustomMode ? 'bg-nature-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                        >
                            Custom Package
                        </button>
                    </div>

                    {isCustomMode ? (
                        <div className="max-w-4xl mx-auto pb-20 fade-in bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                            <h2 className="text-3xl font-bold text-nature-800 mb-8 text-center">Build Your Custom Package</h2>
                            
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold text-nature-700 mb-4">1. Select Duration</h3>
                                    <select 
                                        className="w-full p-3 bg-nature-50 border border-nature-200 rounded-xl text-gray-700 font-medium focus:ring-nature-500 outline-none"
                                        value={customConfig.duration}
                                        onChange={(e) => setCustomConfig({...customConfig, duration: Number(e.target.value)})}
                                    >
                                        <option value={3}>3 Months</option>
                                        <option value={6}>6 Months</option>
                                        <option value={12}>12 Months</option>
                                        <option value={24}>24 Months</option>
                                    </select>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-nature-700 mb-4">2. Select Primary Media (kg)</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 md:col-span-1">
                                            <select 
                                                className="w-full p-3 bg-nature-50 border border-nature-200 rounded-xl text-gray-700 font-medium focus:ring-nature-500 outline-none"
                                                value={customConfig.mediaType}
                                                onChange={(e) => setCustomConfig({...customConfig, mediaType: e.target.value})}
                                            >
                                                {Object.keys(PRICING.media).map(m => <option key={m} value={m}>{m} (৳{PRICING.media[m]}/kg)</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2 md:col-span-1 flex items-center gap-4 border border-nature-200 bg-nature-50 rounded-xl px-4 py-2">
                                            <span className="font-bold text-gray-500 w-16">Qty:</span>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max="100" 
                                                className="w-full bg-transparent text-gray-700 font-medium outline-none"
                                                value={customConfig.mediaQty} 
                                                onChange={(e) => setCustomConfig({...customConfig, mediaQty: Number(e.target.value) || 0})}
                                            />
                                            <span className="font-bold text-nature-600">kg</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-xl font-bold text-nature-700 mb-4">3. Select Supplements & Fertilizers</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {Object.keys(PRICING.supplements).map(sup => {
                                            const qty = customConfig.supplements[sup] || 0;
                                            return (
                                            <div key={sup} className={`p-4 bg-nature-50 rounded-2xl transition-all border-2 flex flex-col items-center gap-3 ${qty > 0 ? 'border-[#1b4d3e] bg-nature-100/50 shadow-md' : 'border-transparent hover:border-nature-200'}`}>
                                                <div className="text-center w-full">
                                                    <div className="text-gray-800 font-bold text-sm mb-1">{sup}</div>
                                                    <div className="text-nature-600 text-xs font-black">৳{PRICING.supplements[sup]} / kg</div>
                                                </div>
                                                <div className="flex items-center justify-between w-full mt-2 bg-white rounded-xl p-1 shadow-sm border border-nature-100">
                                                    <button 
                                                        onClick={() => updateSupplementQty(sup, qty - 1)}
                                                        className="w-8 h-8 rounded-lg bg-nature-50 text-nature-800 flex items-center justify-center font-bold hover:bg-nature-200 transition-colors"
                                                    >-</button>
                                                    <span className="font-bold text-gray-800 text-sm">{qty} <span className="text-[10px] text-gray-400 font-normal ml-0.5">kg</span></span>
                                                    <button 
                                                        onClick={() => updateSupplementQty(sup, qty + 1)}
                                                        className="w-8 h-8 rounded-lg bg-[#1b4d3e] text-white flex items-center justify-center font-bold hover:bg-[#143a2f] transition-colors shadow-sm"
                                                    >+</button>
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-nature-700 mb-4">4. Additional Services</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {Object.keys(PRICING.addons).map(add => (
                                            <label key={add} className="flex items-center gap-3 p-4 bg-nature-50 border border-nature-100 rounded-xl hover:bg-nature-100 cursor-pointer transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded text-nature-600 focus:ring-nature-500 w-5 h-5 bg-white border-nature-300"
                                                    checked={customConfig.addons.includes(add)}
                                                    onChange={() => toggleAddon(add)}
                                                />
                                                <span className="text-gray-700 font-medium">{add} {PRICING.addons[add] > 0 ? `(৳${PRICING.addons[add]})` : '(Free)'}</span>
                                            </label>
                                        ))}

                                        {/* Expert Potting Service */}
                                        <div className="col-span-full space-y-4">
                                            <label 
                                                className={`flex items-center gap-3 p-4 bg-nature-50 border rounded-xl transition-all ${
                                                    (Number(customConfig.mediaQty || 0) + Object.values(customConfig.supplements || {}).reduce((a, b) => a + b, 0)) > 0 
                                                    ? 'hover:bg-nature-100 cursor-pointer border-nature-100' 
                                                    : 'opacity-50 cursor-not-allowed border-gray-100'
                                                }`}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    disabled={(Number(customConfig.mediaQty || 0) + Object.values(customConfig.supplements || {}).reduce((a, b) => a + b, 0)) <= 0}
                                                    className="rounded text-nature-600 focus:ring-nature-500 w-5 h-5 bg-white border-nature-300"
                                                    checked={!!customConfig.expertPotting}
                                                    onChange={(e) => setCustomConfig(prev => ({...prev, expertPotting: e.target.checked}))}
                                                />
                                                <span className="text-gray-700 font-bold">Doorstep Expert Potting Service (৳100)</span>
                                            </label>
                                            
                                            {customConfig.expertPotting && (
                                                <div className="p-6 bg-nature-100/50 border border-nature-200 rounded-2xl animate-fadeIn space-y-3">
                                                    <label className="block text-xs font-black text-nature-700 uppercase tracking-widest flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" /> Preferred Potting Date
                                                    </label>
                                                    <input 
                                                        type="date"
                                                        required
                                                        className="w-full p-3 bg-white border border-nature-200 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-nature-500"
                                                        value={customConfig.pottingDate || ''}
                                                        onChange={(e) => setCustomConfig(prev => ({...prev, pottingDate: e.target.value}))}
                                                    />
                                                    <p className="text-[10px] text-nature-600 font-bold italic">
                                                        * Our expert will arrive with your first delivery.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-nature-700 mb-4">5. Delivery Location</h3>
                                    <select 
                                        className="w-full p-4 bg-nature-50 border border-nature-200 rounded-2xl text-gray-700 font-bold focus:ring-2 focus:ring-nature-500 outline-none transition-all cursor-pointer shadow-sm"
                                        value={customConfig.deliveryLocation}
                                        onChange={(e) => setCustomConfig({...customConfig, deliveryLocation: e.target.value})}
                                    >
                                        <option value="Inside Dhaka">Inside Dhaka (৳70)</option>
                                        <option value="Outside Dhaka">Outside Dhaka (৳120)</option>
                                    </select>
                                </div>
                                
                                <div className="mt-8 p-8 bg-nature-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-nature-300 text-xs font-black uppercase tracking-[0.2em]">
                                                <span>Subtotal: ৳{totals.subtotal}</span>
                                                <span className="w-1 h-1 bg-nature-500 rounded-full"></span>
                                                <span>Delivery: ৳{customConfig.deliveryLocation === 'Inside Dhaka' ? 70 : 120}</span>
                                            </div>
                                            <p className="text-nature-200 uppercase tracking-widest text-[10px] font-black">Total Bill</p>
                                            <p className="text-5xl font-black tracking-tighter">৳{totals.total}</p>
                                            <p className="text-xs text-nature-300 font-bold bg-white/10 py-1 px-3 rounded-full border border-white/10 mt-2 inline-block">
                                                Includes {totals.numDeliveries} deliveries over {customConfig.duration} months
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleCustomSubscribe}
                                            className="px-10 py-5 bg-white text-nature-900 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl w-full md:w-auto"
                                        >
                                            Subscribe Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto pb-20">
                            {filteredPlans.length > 0 ? filteredPlans.map(plan => (
                                <SubscriptionCard
                                    key={plan.id}
                                    plan={plan}
                                    onSelect={handleSubscribeClick}
                                />
                            )) : (
                                <div className="col-span-full py-12 text-center text-gray-500 font-medium">
                                    No plans available for this category yet.
                                </div>
                            )}
                            
                            {/* Coming Soon Card */}
                            <div className="bg-nature-50 rounded-3xl border-2 border-dashed border-nature-200 p-8 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="bg-white p-4 rounded-full shadow-sm text-nature-300">
                                    <Sprout className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-nature-800 text-xl">More Plans Coming</h3>
                                    <p className="text-nature-400 text-sm">We're designing tailored packages for succulents and exotic tropicals.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showPaymentModal && (
                <PaymentModal
                    plan={selectedPlan}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}
