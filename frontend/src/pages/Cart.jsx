import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Truck, MapPin, CreditCard, Check, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { api, isAuthenticated } from '../api/axios';
import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1501004318641-729e8439a7df?q=80&w=400&auto=format&fit=crop';

const resolveImg = (item) => {
    const url = item.image_url;
    if (!url) return PLACEHOLDER;
    if (url.startsWith('http')) return url;
    return url; // server-relative (/media/...), same-origin in dev & prod
};

export default function Cart() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const isAuth = isAuthenticated();
    const [cartItems, setCartItems] = useState([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [orderDone, setOrderDone] = useState(false);
    const [placing, setPlacing] = useState(false);

    const [formData, setFormData] = useState({
        name: '', address: '', phone: '', location: 'inside_dhaka', paymentMethod: 'cod',
    });

    useEffect(() => {
        setCartItems(JSON.parse(localStorage.getItem('cart') || '[]'));
    }, []);

    const persist = (items) => {
        setCartItems(items);
        localStorage.setItem('cart', JSON.stringify(items));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    // Group the flat array of plant objects into unique lines with a quantity.
    const grouped = Object.values(
        cartItems.reduce((acc, item) => {
            const key = item.id ?? item.plant_name;
            if (!acc[key]) acc[key] = { ...item, quantity: 0 };
            acc[key].quantity += 1;
            return acc;
        }, {})
    );

    const addUnit = (id) => {
        const one = cartItems.find((i) => i.id === id);
        if (one) persist([...cartItems, one]);
    };
    const removeUnit = (id) => {
        const idx = cartItems.findIndex((i) => i.id === id);
        if (idx === -1) return;
        const next = [...cartItems];
        next.splice(idx, 1);
        persist(next);
    };
    const removeLine = (id) => persist(cartItems.filter((i) => i.id !== id));

    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    const deliveryCharge = formData.location === 'inside_dhaka' ? 70 : 130;
    const total = subtotal + deliveryCharge;
    const itemCount = cartItems.length;

    const handleCheckoutButton = () => {
        if (!isAuth) { navigate('/register'); return; }
        setIsCheckingOut(true);
    };

    const handleConfirmOrder = async (e) => {
        e.preventDefault();
        setPlacing(true);
        try {
            const payload = {
                items: grouped.map((g) => ({ id: g.id, quantity: g.quantity })),
                customer_name: formData.name,
                address: formData.address,
                phone: formData.phone,
                location: formData.location,
                delivery_charge: deliveryCharge,
                payment_method: formData.paymentMethod,
            };
            await api.post('/orders/checkout/', payload);
            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cartUpdated'));
            setOrderDone(true);
        } catch (err) {
            console.error('Order failed:', err);
            toast.error('Order failed. Please try again.');
        } finally {
            setPlacing(false);
        }
    };

    if (orderDone) {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-12 bg-white rounded-3xl shadow-2xl border border-nature-100 text-center animate-fadeIn">
                <div className="w-20 h-20 bg-nature-100 text-nature-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">{t('orderConfirmed') || 'Order Confirmed!'}</h2>
                <p className="text-gray-500 mb-8 font-medium">{t('thankYouPurchase') || 'Thank you for your purchase. We will be in touch shortly.'}</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => navigate('/marketplace')} className="bg-nature-900 text-white px-7 py-3 rounded-2xl font-bold hover:bg-nature-700 transition-colors">
                        {t('continueShopping') || 'Continue Shopping'}
                    </button>
                    <button onClick={() => navigate('/track-order')} className="bg-nature-50 text-nature-700 px-7 py-3 rounded-2xl font-bold hover:bg-nature-100 transition-colors">
                        Track Order
                    </button>
                </div>
            </div>
        );
    }

    // Empty cart
    if (itemCount === 0) {
        return (
            <div className="max-w-2xl mx-auto mt-16 text-center animate-fadeIn">
                <div className="w-24 h-24 bg-nature-50 text-nature-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-12 h-12" />
                </div>
                <h1 className="text-2xl font-black text-gray-900">Your cart is empty</h1>
                <p className="text-gray-500 font-medium mt-2 mb-6">Discover healthy, nursery-grown plants in the marketplace.</p>
                <Link to="/marketplace" className="inline-flex items-center gap-2 bg-nature-900 text-white px-7 py-3.5 rounded-2xl font-bold hover:bg-nature-700 transition-colors shadow-lg shadow-nature-900/10">
                    Browse Plants <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-black text-nature-900 tracking-tight flex items-center gap-3">
                    <ShoppingBag className="w-7 h-7 text-nature-600" />
                    {isCheckingOut ? (t('checkoutDetails') || 'Checkout') : (t('yourCart') || 'Your Cart')}
                </h1>
                <span className="text-sm font-bold text-gray-400">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* Left: items or checkout form */}
                <div className="lg:col-span-2 space-y-4">
                    {!isCheckingOut ? (
                        grouped.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <img src={resolveImg(item)} alt={item.plant_name}
                                    onError={(e) => { e.target.src = PLACEHOLDER; }}
                                    className="w-20 h-20 rounded-xl object-cover bg-nature-50 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{item.plant_name}</h3>
                                    <p className="text-xs text-gray-400 font-semibold">{item.category || 'Plant'}</p>
                                    <p className="text-nature-700 font-black mt-1">৳{parseFloat(item.price || 0).toFixed(2)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100">
                                        <button onClick={() => removeUnit(item.id)} className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-7 text-center font-black text-gray-900 text-sm">{item.quantity}</span>
                                        <button onClick={() => addUnit(item.id)} className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <button onClick={() => removeLine(item.id)} className="text-[11px] font-bold text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" /> Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <form id="checkout-form" onSubmit={handleConfirmOrder} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <button type="button" onClick={() => setIsCheckingOut(false)} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-nature-700 transition-colors mb-2">
                                <ArrowLeft className="w-4 h-4" /> Back to cart
                            </button>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">{t('fullName') || 'Full Name'}</label>
                                <input required type="text" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nature-500/30 focus:border-nature-500 outline-none bg-gray-50 transition-all"
                                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Your full name" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">{t('shippingAddress') || 'Shipping Address'}</label>
                                <textarea required rows="3" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nature-500/30 focus:border-nature-500 outline-none bg-gray-50 transition-all resize-none"
                                    value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Complete delivery address" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">{t('phoneNumber') || 'Phone Number'}</label>
                                <input required type="tel" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nature-500/30 focus:border-nature-500 outline-none bg-gray-50 transition-all"
                                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Contact number" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-nature-600" /> {t('location') || 'Location'}</label>
                                    <select className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nature-500/30 outline-none bg-white transition-all font-medium"
                                        value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}>
                                        <option value="inside_dhaka">Inside Dhaka</option>
                                        <option value="outside_dhaka">Outside Dhaka</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-nature-600" /> {t('payment') || 'Payment'}</label>
                                    <select className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nature-500/30 outline-none bg-white transition-all font-medium"
                                        value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                        <option value="cod">Cash on Delivery</option>
                                        <option value="bkash">bKash</option>
                                        <option value="card">Card</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Right: order summary */}
                <div className="card p-6 lg:sticky lg:top-24 space-y-4">
                    <h2 className="font-black text-gray-900">Order Summary</h2>
                    <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between text-gray-600 font-medium">
                            <span>{t('subtotal') || 'Subtotal'}</span>
                            <span className="font-bold text-gray-900">৳{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 font-medium">
                            <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" /> {t('deliveryFee') || 'Delivery'}</span>
                            <span className="font-bold text-gray-900">৳{deliveryCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-gray-100">
                            <span className="font-black text-gray-900 uppercase tracking-tight">{t('totalBill') || 'Total'}</span>
                            <span className="text-2xl font-black text-nature-700">৳{total.toFixed(2)}</span>
                        </div>
                    </div>

                    {!isCheckingOut ? (
                        <button onClick={handleCheckoutButton}
                            className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 bg-nature-900 text-white hover:bg-nature-700 active:scale-[0.98] transition-all shadow-lg shadow-nature-900/10">
                            {t('checkout') || 'Checkout'} <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button type="submit" form="checkout-form" disabled={placing}
                            className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 bg-nature-900 text-white hover:bg-nature-700 active:scale-[0.98] transition-all shadow-lg shadow-nature-900/10 disabled:opacity-50">
                            {placing ? 'Placing order…' : (<>{t('confirmOrder') || 'Confirm Order'} <Check className="w-5 h-5" /></>)}
                        </button>
                    )}
                    <Link to="/marketplace" className="block text-center text-sm font-bold text-gray-400 hover:text-nature-600 transition-colors">
                        Continue shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
