import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';
import {
    ShoppingBag, Leaf, CalendarCheck, Cpu, Sprout, Stethoscope, MapPin,
    Users, RefreshCw, ArrowRight, Package, Droplets, Plus, ChevronRight,
} from 'lucide-react';

const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    out_for_delivery: 'bg-purple-100 text-purple-700',
    delivered: 'bg-nature-100 text-nature-700',
    completed: 'bg-nature-100 text-nature-700',
    cancelled: 'bg-red-100 text-red-700',
};

const QUICK_ACTIONS = [
    { to: '/marketplace', label: 'Shop Plants', icon: ShoppingBag, color: 'text-nature-600' },
    { to: '/plant-doctor', label: 'Plant Doctor', icon: Stethoscope, color: 'text-rose-500' },
    { to: '/smart-finder', label: 'Smart Finder', icon: Sprout, color: 'text-emerald-500' },
    { to: '/nearby-sellers', label: 'Nearby Sellers', icon: MapPin, color: 'text-blue-500' },
    { to: '/community', label: 'Community', icon: Users, color: 'text-violet-500' },
    { to: '/exchange', label: 'Exchange', icon: RefreshCw, color: 'text-amber-500' },
];

export default function Dashboard() {
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [careCards, setCareCards] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [devices, setDevices] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const safe = (p) => p.then((r) => r.data).catch(() => null);
        const arr = (x) => (Array.isArray(x) ? x : x?.results || []);

        (async () => {
            const [me, ord, cards, subs, devs] = await Promise.all([
                safe(api.get('/auth/me/')),
                safe(api.get('/orders/')),
                safe(api.get('/plant-care/care-cards/')),
                safe(api.get('/plant-care/subscriptions/')),
                safe(api.get('/devices/')),
            ]);
            if (!mounted) return;
            setUser(me);
            setOrders(arr(ord));
            setCareCards(arr(cards));
            setSubscriptions(arr(subs));
            setDevices(arr(devs));
            setLoading(false);
        })();

        const readCart = () => setCartCount(JSON.parse(localStorage.getItem('cart') || '[]').length);
        readCart();
        window.addEventListener('cartUpdated', readCart);
        return () => {
            mounted = false;
            window.removeEventListener('cartUpdated', readCart);
        };
    }, []);

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    })();

    const displayName = user?.full_name || user?.username || 'Gardener';
    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4);

    const nextWatering = (card) => {
        if (!card.last_watered_date) return null;
        const d = new Date(card.last_watered_date);
        d.setDate(d.getDate() + (card.watering_frequency || 7));
        return d;
    };
    const relativeDays = (date) => {
        const diff = Math.round((date - new Date()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, urgent: true };
        if (diff === 0) return { label: 'Today', urgent: true };
        if (diff === 1) return { label: 'Tomorrow', urgent: false };
        return { label: `In ${diff} days`, urgent: false };
    };

    const STATS = [
        { label: 'Orders', value: orders.length, icon: Package, to: '/track-order', color: 'bg-blue-50 text-blue-600' },
        { label: 'Care Plans', value: careCards.length, icon: Leaf, to: '/plant-care', color: 'bg-nature-50 text-nature-600' },
        { label: 'Subscriptions', value: subscriptions.length, icon: CalendarCheck, to: '/plant-care?tab=subscription', color: 'bg-violet-50 text-violet-600' },
        { label: 'Cart Items', value: cartCount, icon: ShoppingBag, to: '/cart', color: 'bg-amber-50 text-amber-600' },
    ];

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-10 w-72 bg-gray-100 rounded-xl" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
                </div>
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-80 bg-gray-100 rounded-2xl" />
                    <div className="h-80 bg-gray-100 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-nature-600 uppercase tracking-widest">{greeting}</p>
                    <h1 className="text-3xl md:text-4xl font-black text-nature-900 tracking-tight">{displayName}</h1>
                    <p className="text-gray-500 font-medium mt-1">Here's what's happening in your garden today.</p>
                </div>
                <Link to="/marketplace" className="inline-flex items-center gap-2 bg-nature-900 text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-nature-700 transition-colors shadow-lg shadow-nature-900/10 w-fit">
                    <Plus className="w-4 h-4" /> Shop Plants
                </Link>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STATS.map((s) => (
                    <Link key={s.label} to={s.to} className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${s.color}`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </div>
                        <p className="text-3xl font-black text-gray-900 mt-4">{s.value}</p>
                        <p className="text-sm text-gray-500 font-semibold">{s.label}</p>
                    </Link>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Orders */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-nature-600" /> Recent Orders
                            </h2>
                            <Link to="/track-order" className="text-xs font-bold text-nature-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                                Track <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        {recentOrders.length === 0 ? (
                            <div className="text-center py-10">
                                <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No orders yet.</p>
                                <Link to="/marketplace" className="text-nature-600 font-bold text-sm hover:underline">Browse the marketplace →</Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {recentOrders.map((o) => (
                                    <div key={o.id} className="flex items-center justify-between py-3.5">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-nature-50 text-nature-600 flex items-center justify-center font-black text-sm flex-shrink-0">
                                                #{o.id}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 truncate">৳{parseFloat(o.total_bill || 0).toFixed(2)}</p>
                                                <p className="text-xs text-gray-400 font-medium">{new Date(o.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {(o.status || 'pending').replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Plant Care Reminders */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <Droplets className="w-5 h-5 text-blue-500" /> Care Reminders
                            </h2>
                            <Link to="/plant-care" className="text-xs font-bold text-nature-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                                Manage <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        {careCards.length === 0 ? (
                            <div className="text-center py-10">
                                <Leaf className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No plants being tracked yet.</p>
                                <Link to="/plant-care" className="text-nature-600 font-bold text-sm hover:underline">Add a care plan →</Link>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-3">
                                {careCards.slice(0, 6).map((c) => {
                                    const due = nextWatering(c);
                                    const rel = due ? relativeDays(due) : null;
                                    return (
                                        <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-gray-50/50">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-nature-100 text-nature-600 flex items-center justify-center flex-shrink-0">
                                                <Sprout className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-gray-900 text-sm truncate">{c.plant_name}</p>
                                                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{c.category || 'Plant'}</p>
                                            </div>
                                            {rel && (
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap ${rel.urgent ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {rel.label}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Side column */}
                <div className="space-y-6">
                    {/* Quick actions */}
                    <div className="card p-6">
                        <h2 className="text-lg font-black text-gray-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {QUICK_ACTIONS.map((a) => (
                                <Link key={a.to} to={a.to} className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-100 hover:border-nature-200 hover:bg-nature-50/40 transition-all text-center">
                                    <a.icon className={`w-6 h-6 ${a.color}`} />
                                    <span className="text-[11px] font-bold text-gray-600 leading-tight">{a.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Smart devices summary */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-nature-600" /> Smart Devices
                            </h2>
                            <Link to="/devices" className="text-xs font-bold text-nature-600 uppercase tracking-widest hover:underline">Manage</Link>
                        </div>
                        {devices.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-gray-500 font-medium text-sm mb-3">No IoT devices connected.</p>
                                <Link to="/devices" className="inline-flex items-center gap-2 bg-nature-50 text-nature-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-nature-100 transition-colors">
                                    <Plus className="w-4 h-4" /> Connect a device
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {devices.slice(0, 4).map((d) => (
                                    <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/60 border border-gray-100">
                                        <span className="font-bold text-gray-800 text-sm truncate">{d.name || `Device ${d.device_id}`}</span>
                                        <span className="w-2 h-2 rounded-full bg-nature-500 flex-shrink-0" title="online" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Active subscriptions */}
                    {subscriptions.length > 0 && (
                        <div className="card p-6 border-l-4 border-l-nature-500">
                            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                <CalendarCheck className="w-5 h-5 text-nature-600" /> Subscriptions
                            </h2>
                            <div className="space-y-3">
                                {subscriptions.slice(0, 3).map((sub) => (
                                    <div key={sub.id} className="flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 text-sm capitalize truncate">{(sub.plan_type || 'Plan').replace(/_/g, ' ')}</p>
                                            <p className="text-[11px] text-gray-400 font-semibold">
                                                {sub.next_delivery_date ? `Next: ${new Date(sub.next_delivery_date).toLocaleDateString()}` : 'Active'}
                                            </p>
                                        </div>
                                        <span className="w-2.5 h-2.5 rounded-full bg-nature-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tip */}
                    <div className="p-6 rounded-[15px] shadow-sm overflow-hidden bg-nature-900 text-white">
                        <h3 className="font-black mb-1.5 flex items-center gap-2 text-nature-50">
                            <Leaf className="w-4 h-4" /> Sustainable Tip
                        </h3>
                        <p className="text-sm text-nature-100/80 leading-relaxed">
                            {t('sustainableTipContent') || 'Water early in the morning to minimize evaporation and keep your plants hydrated longer.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
