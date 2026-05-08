import { Link, useNavigate } from 'react-router-dom';
import { clearAuthToken, isAuthenticated, api } from '../api/axios';
import { Leaf, ShoppingCart, User, Users, Activity, LogOut, LayoutDashboard, Store, Menu, X, HelpCircle, Bell, Clock, Package, Truck, Star, Camera, Repeat, Compass, MapPin, Globe, Stethoscope, Sprout, Box, Cpu } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Navbar() {
    const { t, changeLanguage, language } = useLanguage();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');
    const [isAuth, setIsAuth] = useState(isAuthenticated());
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const updateAuth = () => {
            setIsAuth(isAuthenticated());
            setUserRole(localStorage.getItem('userRole') || 'user');
        };
        window.addEventListener('authChange', updateAuth);
        return () => window.removeEventListener('authChange', updateAuth);
    }, []);

    useEffect(() => {
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            setCartCount(cart.length);
        };
        updateCartCount();
        window.addEventListener('cartUpdated', updateCartCount);
        return () => window.removeEventListener('cartUpdated', updateCartCount);
    }, []);

    useEffect(() => {
        if (isAuth) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [isAuth]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/');
            // Backend returns { unread_count: X, notifications: [...] }
            const data = Array.isArray(res.data) ? res.data : (res.data.notifications || []);
            setNotifications(data.filter(n => !n.is_read));
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/read/`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleLogout = () => {
        clearAuthToken();
        setIsAuth(false);
        setIsProfileOpen(false);
        setIsMenuOpen(false);
        navigate('/login');
    };

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            aria-label="Toggle Menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-nature-700">
                            <Leaf className="w-8 h-8" />
                            <span className="hidden md:inline">Easy Grow Plants</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        {isAuth ? (
                            <>
                                {userRole === 'admin' ? (
                                    <Link to="/admin-dashboard" className="flex items-center gap-2 text-gray-600 hover:text-nature-600 font-medium">
                                        <LayoutDashboard className="w-4 h-4" /> {t('adminCenter')}
                                    </Link>
                                ) : userRole === 'seller' ? (
                                    <Link to="/seller-dashboard" className="flex items-center gap-2 text-gray-600 hover:text-nature-600 font-medium">
                                        <LayoutDashboard className="w-4 h-4" /> {t('sellerDashboard')}
                                    </Link>
                                ) : (
                                    <Link to="/dashboard" className="text-gray-600 hover:text-nature-600 font-medium flex items-center gap-2">
                                        <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">{t('dashboard')}</span>
                                    </Link>
                                )}

                                <Link to="/cart" className="relative text-gray-600 hover:text-nature-600">
                                    <ShoppingCart className="w-6 h-6" />
                                    <span className="absolute -top-2 -right-2 bg-nature-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{cartCount}</span>
                                </Link>

                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                        className="relative text-gray-600 hover:text-nature-600 p-1"
                                    >
                                        <Bell className="w-6 h-6" />
                                        {notifications.length > 0 && (
                                            <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                                                {notifications.length}
                                            </span>
                                        )}
                                    </button>

                                    {isNotificationOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[60]">
                                            <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-sm">
                                                {t('notifications')}
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {notifications.length > 0 ? (
                                                    notifications.map(n => (
                                                        <div key={n.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                            <p className="text-xs text-gray-600">{n.message}</p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <span className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleTimeString()}</span>
                                                                <button onClick={() => markAsRead(n.id)} className="text-[10px] font-bold text-nature-600">{t('markAsRead')}</button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-6 text-center text-gray-400 text-xs">{t('noNotifications')}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="w-8 h-8 rounded-full bg-nature-100 text-nature-700 flex items-center justify-center font-bold text-sm"
                                    >
                                        {localStorage.getItem('username')?.charAt(0).toUpperCase() || 'U'}
                                    </button>

                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[60]">
                                            <div className="py-1">
                                                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>
                                                    {t('myProfile')}
                                                </Link>
                                                <Link to="/track-order" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>
                                                    {t('myOrders')}
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                                                >
                                                    {t('logout')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="text-gray-600 font-medium hover:text-nature-600">
                                    {t('login')}
                                </Link>
                                <Link to="/register" className="bg-nature-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-nature-700 transition-colors">
                                    {t('register')}
                                </Link>
                            </div>
                        )}

                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-inner">
                            <button 
                                onClick={() => changeLanguage('en')} 
                                className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all duration-300 ${language === 'en' ? 'bg-nature-600 text-white shadow-sm scale-105' : 'text-gray-400 hover:text-nature-600 hover:bg-white/50'}`}
                            >
                                EN
                            </button>
                            <button 
                                onClick={() => changeLanguage('bn')} 
                                className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all duration-300 ${language === 'bn' ? 'bg-nature-600 text-white shadow-sm scale-105' : 'text-gray-400 hover:text-nature-600 hover:bg-white/50'}`}
                            >
                                BN
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {isMenuOpen && (
                <div className="fixed inset-0 z-[100]">
                    <div className="absolute inset-0 bg-black/20" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute top-0 left-0 w-64 h-full bg-white shadow-xl animate-slideRight">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <span className="font-bold text-nature-800 uppercase tracking-wider">{t('menu')}</span>
                            <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-2 space-y-1">
                            <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-nature-50 text-gray-700" onClick={() => setIsMenuOpen(false)}>
                                <Activity className="w-5 h-5 text-nature-600" />
                                <span>{t('home')}</span>
                            </Link>
                            <Link to="/marketplace" className="flex items-center gap-3 p-3 rounded-lg hover:bg-nature-50 text-gray-700" onClick={() => setIsMenuOpen(false)}>
                                <Store className="w-5 h-5 text-nature-600" />
                                <span>{t('marketplace')}</span>
                            </Link>
                            <Link to="/smart-finder" className="flex items-center gap-3 p-3 rounded-lg hover:bg-nature-50 text-gray-700" onClick={() => setIsMenuOpen(false)}>
                                <Compass className="w-5 h-5 text-nature-600" />
                                <span>{t('smartFinder')}</span>
                            </Link>
                            <Link to="/ar-decorator" className="flex items-center gap-3 p-3 rounded-lg hover:bg-nature-50 text-gray-700" onClick={() => setIsMenuOpen(false)}>
                                <Box className="w-5 h-5 text-nature-600" />
                                <span>AR Decorator</span>
                            </Link>
                            <Link to="/devices" className="flex items-center gap-3 p-3 rounded-lg hover:bg-nature-50 text-gray-700" onClick={() => setIsMenuOpen(false)}>
                                <Cpu className="w-5 h-5 text-nature-600" />
                                <span>{t('device')}</span>
                            </Link>
                            <Link to="/plant-care" className="flex items-center gap-3 p-3 rounded-lg hover:bg-nature-50 text-gray-700" onClick={() => setIsMenuOpen(false)}>
                                <Sprout className="w-5 h-5 text-nature-600" />
                                <span>{t('plantCare')}</span>
                            </Link>
                            <Link to="/nearby-sellers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-nature-50 text-gray-700" onClick={() => setIsMenuOpen(false)}>
                                <MapPin className="w-5 h-5 text-nature-600" />
                                <span>{t('nearbySellers')}</span>
                            </Link>
                            <Link to="/plant-doctor" className="flex items-center gap-3 p-3 rounded-lg hover:bg-nature-50 text-gray-700" onClick={() => setIsMenuOpen(false)}>
                                <Stethoscope className="w-5 h-5 text-nature-600" />
                                <span>{t('plantDoctor')}</span>
                            </Link>
                            <Link to="/detect-plant" className="flex items-center gap-3 p-3 rounded-lg hover:bg-nature-50 text-gray-700" onClick={() => setIsMenuOpen(false)}>
                                <Camera className="w-5 h-5 text-nature-600" />
                                <span>{t('plantDetection')}</span>
                            </Link>
                            <Link to="/community" className="flex items-center gap-3 p-3 rounded-lg hover:bg-nature-50 text-gray-700" onClick={() => setIsMenuOpen(false)}>
                                <Users className="w-5 h-5 text-nature-600" />
                                <span>{t('community')}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
