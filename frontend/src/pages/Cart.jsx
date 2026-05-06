import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Truck, MapPin, CreditCard, Check, Trash2 } from 'lucide-react';
import { api, isAuthenticated } from '../api/axios';
import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Cart() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const isAuth = isAuthenticated();
    const [cartItems, setCartItems] = useState([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [orderDone, setOrderDone] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        location: 'inside_dhaka',
        paymentMethod: 'cod'
    });

    useEffect(() => {
        const items = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(items);
    }, []);

    const removeFromCart = (index) => {
        const newCart = [...cartItems];
        newCart.splice(index, 1);
        setCartItems(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    const deliveryCharge = formData.location === 'inside_dhaka' ? 70 : 130;
    const total = subtotal + deliveryCharge;

    const handleCheckoutButton = () => {
        if (!isAuth) {
            navigate('/register');
        } else {
            setIsCheckingOut(true);
        }
    };

    const handleConfirmOrder = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                items: cartItems,
                customer_name: formData.name,
                address: formData.address,
                phone: formData.phone,
                location: formData.location,
                delivery_charge: deliveryCharge,
                payment_method: formData.paymentMethod
            };

            await api.post('/orders/checkout/', payload);
            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cartUpdated'));
            setOrderDone(true);
        } catch (err) {
            console.error("Order failed:", err);
            alert("Order failed. Please try again.");
        }
    };

    if (orderDone) {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-12 bg-white rounded-3xl shadow-2xl border border-nature-100 text-center animate-fadeIn">
                <div className="w-20 h-20 bg-nature-100 text-nature-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">{t('orderConfirmed')}</h2>
                <p className="text-gray-500 mb-8 font-medium">{t('thankYouPurchase')}</p>
                <button onClick={() => navigate('/marketplace')} className="btn btn-primary px-8 py-3">
                    {t('continueShopping')}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-nature-100 animate-fadeIn">
            <h1 className="text-3xl font-extrabold text-nature-900 tracking-tight flex items-center gap-3 mb-6">
                <ShoppingBag className="w-8 h-8 text-nature-600" /> {isCheckingOut ? t('checkoutDetails') : t('yourCart')}
            </h1>

            {!isCheckingOut ? (
                // View Cart
                <>
                    {cartItems.length === 0 ? (
                        <div className="text-center py-10 bg-nature-50 rounded-xl mb-6 border border-nature-100 border-dashed">
                            <p className="text-gray-500 font-medium tracking-wide">Your cart items will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-4 mb-6">
                            {cartItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800">{item.name}</h3>
                                        <p className="text-sm text-gray-500">{t('seller')}: {item.seller_username}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="font-bold text-nature-700">৳{item.price}</div>
                                        <button
                                            onClick={() => removeFromCart(index)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Remove Item"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-between items-center py-4 border-t border-gray-100 mt-4">
                                <span className="font-bold text-lg text-gray-600">{t('subtotal')}:</span>
                                <span className="font-black text-2xl text-nature-900">৳{subtotal}</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleCheckoutButton}
                        disabled={cartItems.length === 0}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${cartItems.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                            : 'bg-nature-900 text-white hover:bg-nature-800 active:scale-[0.98] shadow-nature-900/10'
                            }`}
                    >
                        {t('checkout')} <ArrowRight className="w-5 h-5" />
                    </button>
                </>
            ) : (
                // Checkout Form
                <form onSubmit={handleConfirmOrder} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('fullName')}</label>
                            <input
                                required
                                type="text"
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-nature-500 outline-none bg-gray-50"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Your full name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('shippingAddress')}</label>
                            <textarea
                                required
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-nature-500 outline-none bg-gray-50"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Complete delivery address"
                                rows="3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">{t('phoneNumber')}</label>
                            <input
                                required
                                type="tel"
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-nature-500 outline-none bg-gray-50"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Contact number"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-nature-600" /> {t('location')}
                                </label>
                                <select
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-nature-500 outline-none bg-white"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                >
                                    <option value="inside_dhaka">Inside Dhaka</option>
                                    <option value="outside_dhaka">Outside Dhaka</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-nature-600" /> {t('payment')}
                                </label>
                                <select
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-nature-500 outline-none bg-white"
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                >
                                    <option value="cod">Cash on Delivery</option>
                                    <option value="bkash">bKash</option>
                                    <option value="card">Card</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-nature-50 p-6 rounded-2xl border border-nature-100 space-y-2">
                        <div className="flex justify-between text-gray-600 font-medium">
                            <span>{t('subtotal')}</span>
                            <span>৳{subtotal}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 font-medium">
                            <span className="flex items-center gap-2 italic">
                                <Truck className="w-4 h-4" /> {t('deliveryFee')} ({formData.location === 'inside_dhaka' ? 'Inside' : 'Outside'} Dhaka)
                            </span>
                            <span>৳{deliveryCharge}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-nature-200 mt-2">
                            <span className="text-lg font-black text-gray-800 uppercase tracking-tighter">{t('totalBill')}</span>
                            <span className="text-2xl font-black text-nature-700 tracking-tight">৳{total}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsCheckingOut(false)}
                            className="w-1/3 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                        >
                            {t('back')}
                        </button>
                        <button
                            type="submit"
                            className="w-2/3 py-4 bg-nature-900 text-white rounded-xl font-bold hover:bg-nature-800 active:scale-95 transition-all shadow-lg shadow-nature-900/10 flex items-center justify-center gap-2"
                        >
                            {t('confirmOrder')} <Check className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
