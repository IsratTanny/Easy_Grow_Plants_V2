import { useState, useEffect, useRef } from 'react';
import { api } from '../api/axios';
import {
    Camera, Save, ArrowLeft, Package, ChevronRight, Droplets, Heart, Leaf,
    BadgeCheck, Award, MapPin, Phone, Mail, User as UserIcon, Sprout, Calendar,
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import VoiceInput from '../components/VoiceInput';
import toast from 'react-hot-toast';

const ORDER_STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    out_for_delivery: 'bg-purple-100 text-purple-700',
    delivered: 'bg-nature-100 text-nature-700',
    completed: 'bg-nature-100 text-nature-700',
    cancelled: 'bg-red-100 text-red-700',
};

export default function Profile() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(location.state?.showCare ? 'care' : 'profile');

    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [careCards, setCareCards] = useState([]);

    const [formData, setFormData] = useState({
        full_name: '', phone: '', whatsapp_number: '', address: '', bio: '',
        email: '', profile_picture: '',
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchProfile();
        fetchOrders();
        fetchCareCards();
        const pollInterval = setInterval(() => {
            fetchOrders();
            fetchCareCards();
        }, 30000);
        return () => clearInterval(pollInterval);
    }, []);

    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me/');
            setProfile(res.data);
            setFormData({
                full_name: res.data.full_name || '',
                phone: res.data.phone || '',
                whatsapp_number: res.data.whatsapp_number || '',
                address: res.data.address || '',
                bio: res.data.bio || '',
                email: res.data.email || '',
                profile_picture: res.data.profile_picture || '',
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/');
            setOrders(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) { console.error('Error fetching orders:', err); }
    };

    const fetchCareCards = async () => {
        try {
            const res = await api.get('/plant-care/care-cards/');
            setCareCards(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) { console.error('Error fetching care cards:', err); }
    };

    const handleTaskComplete = async (cardId, taskType) => {
        try {
            await api.post(`/plant-care/care-cards/${cardId}/task_completed/`, { task_type: taskType });
            const today = new Date().toISOString().split('T')[0];
            setCareCards((prev) => prev.map((card) => {
                if (card.id !== cardId) return card;
                return taskType === 'water'
                    ? { ...card, last_watered_date: today }
                    : { ...card, last_fertilized_date: today };
            }));
            window.dispatchEvent(new Event('careTaskCompleted'));
            toast.success(taskType === 'water' ? 'Marked as watered 💧' : 'Marked as fertilized 🌱');
        } catch (err) {
            console.error('Task update failed:', err);
            toast.error(`Failed to update task: ${err.response?.data?.error || 'Server connection error'}`);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(file);
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = new FormData();
            payload.append('full_name', formData.full_name);
            payload.append('phone', formData.phone);
            payload.append('whatsapp_number', formData.whatsapp_number);
            payload.append('address', formData.address);
            payload.append('bio', formData.bio);
            if (selectedFile) payload.append('profile_picture', selectedFile);

            await api.patch('/auth/me/', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Profile updated successfully!');
            setSelectedFile(null);
            fetchProfile();
        } catch (err) {
            toast.error('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const resolveImg = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return url; // server-relative (/media/...), same-origin in dev & prod
    };

    const avatarSrc = previewUrl || resolveImg(formData.profile_picture);
    const initial = (formData.full_name || profile?.username || 'U').charAt(0).toUpperCase();
    const memberSince = profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : '';

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse space-y-6">
                <div className="h-44 bg-gray-100 rounded-3xl" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 h-96 bg-gray-100 rounded-3xl" />
                    <div className="h-96 bg-gray-100 rounded-3xl" />
                </div>
            </div>
        );
    }

    const STATS = [
        { label: 'Orders', value: orders.length, icon: Package },
        { label: 'Plants Tracked', value: careCards.length, icon: Sprout },
        { label: 'Green Points', value: profile?.green_points ?? 0, icon: Award },
    ];

    const TABS = [
        { key: 'profile', label: 'Edit Profile', icon: UserIcon },
        { key: 'orders', label: `Orders (${orders.length})`, icon: Package },
        { key: 'care', label: `Plant Care (${careCards.length})`, icon: Leaf },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-nature-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Identity banner */}
            <div className="relative rounded-3xl overflow-hidden shadow-sm border border-nature-100/50">
                <div className="h-32 bg-gradient-to-r from-nature-700 via-nature-600 to-emerald-500" />
                <div className="px-6 md:px-8 pb-6 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white bg-nature-100 shadow-lg flex items-center justify-center">
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-black text-nature-600">{initial}</span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 p-2.5 bg-nature-600 text-white rounded-2xl shadow-lg hover:bg-nature-700 transition-colors"
                                title="Change photo"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        </div>
                        <div className="flex-1 sm:pb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-black text-gray-900">{formData.full_name || profile?.username}</h1>
                                {profile?.is_verified && (
                                    <span className="inline-flex items-center gap-1 text-nature-600" title="Verified">
                                        <BadgeCheck className="w-5 h-5" />
                                    </span>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest bg-nature-100 text-nature-700 px-2.5 py-1 rounded-full">
                                    {profile?.role || 'buyer'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 font-semibold">@{profile?.username}</p>
                            {memberSince && (
                                <p className="text-xs text-gray-400 font-medium mt-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Member since {memberSince}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        {STATS.map((s) => (
                            <div key={s.label} className="text-center p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                                <s.icon className="w-5 h-5 text-nature-600 mx-auto mb-1.5" />
                                <p className="text-2xl font-black text-gray-900 leading-none">{s.value}</p>
                                <p className="text-[11px] text-gray-500 font-semibold mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-gray-100/70 rounded-2xl w-full sm:w-fit overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-white text-nature-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: Edit Profile */}
            {activeTab === 'profile' && (
                <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-6 animate-fadeIn">
                    <div className="grid md:grid-cols-2 gap-5">
                        <Field label={t('fullName') || 'Full Name'} icon={UserIcon}>
                            <input type="text" value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="profile-input" placeholder="Your full name" />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <VoiceInput onResult={(val) => setFormData((p) => ({ ...p, full_name: val }))} />
                            </div>
                        </Field>
                        <Field label="Email" icon={Mail}>
                            <input type="email" value={formData.email} disabled
                                className="profile-input bg-gray-100 text-gray-400 cursor-not-allowed" placeholder="—" />
                        </Field>
                        <Field label={t('mobileNumber') || 'Phone'} icon={Phone}>
                            <input type="tel" value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="profile-input" placeholder="01XXXXXXXXX" />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <VoiceInput onResult={(val) => setFormData((p) => ({ ...p, phone: val }))} />
                            </div>
                        </Field>
                        <Field label="WhatsApp" icon={Phone}>
                            <input type="tel" value={formData.whatsapp_number}
                                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                                className="profile-input" placeholder="WhatsApp number" />
                        </Field>
                        <Field label="Address" icon={MapPin} className="md:col-span-2">
                            <input type="text" value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="profile-input" placeholder="Delivery address" />
                        </Field>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Bio</label>
                        <textarea rows="3" value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nature-500/30 focus:border-nature-500 outline-none transition-all resize-none"
                            placeholder="Tell the community about your green thumb..." />
                    </div>
                    <button type="submit" disabled={saving}
                        className="bg-nature-900 text-white px-7 py-3.5 rounded-2xl font-bold hover:bg-nature-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-nature-900/10">
                        <Save className="w-5 h-5" /> {saving ? 'Saving…' : (t('updateProfile') || 'Save Changes')}
                    </button>
                </form>
            )}

            {/* Tab: Orders */}
            {activeTab === 'orders' && (
                <div className="card p-6 md:p-8 animate-fadeIn">
                    {orders.length === 0 ? (
                        <EmptyState icon={Package} title="No orders yet"
                            body="When you order plants, they'll show up here." cta="Browse Marketplace" to="/marketplace" />
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {[...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((o) => (
                                <div key={o.id} className="flex items-center justify-between py-4 gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-2xl bg-nature-50 text-nature-600 flex items-center justify-center font-black flex-shrink-0">#{o.id}</div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900">৳{parseFloat(o.total_bill || 0).toFixed(2)}</p>
                                            <p className="text-xs text-gray-400 font-medium">
                                                {new Date(o.created_at).toLocaleDateString()} · {o.payment_method?.toUpperCase() || 'COD'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${ORDER_STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {(o.status || 'pending').replace(/_/g, ' ')}
                                        </span>
                                        <Link to="/track-order" className="text-gray-300 hover:text-nature-600 transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Plant Care */}
            {activeTab === 'care' && (
                <div className="card p-6 md:p-8 animate-fadeIn">
                    {careCards.length === 0 ? (
                        <EmptyState icon={Leaf} title="No plants tracked yet"
                            body="Add a care plan to get watering and fertilizing reminders." cta="Open Plant Care" to="/plant-care" />
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {careCards.map((card) => (
                                <div key={card.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-900 truncate">{card.plant_name}</h4>
                                            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{card.category || 'Plant'}</p>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button onClick={() => handleTaskComplete(card.id, 'water')}
                                                className="p-2.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors" title="Mark watered">
                                                <Droplets className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleTaskComplete(card.id, 'fertilize')}
                                                className="p-2.5 bg-pink-100 text-pink-600 rounded-xl hover:bg-pink-600 hover:text-white transition-colors" title="Mark fertilized">
                                                <Heart className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-gray-500 font-medium pt-2 border-t border-gray-100">
                                        <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-400" /> {card.last_watered_date || '—'}</span>
                                        <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-pink-400" /> {card.last_fertilized_date || '—'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Field({ label, icon: Icon, children, className = '' }) {
    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />} {label}
            </label>
            <div className="relative">{children}</div>
        </div>
    );
}

function EmptyState({ icon: Icon, title, body, cta, to }) {
    return (
        <div className="text-center py-12">
            <Icon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">{body}</p>
            <Link to={to} className="inline-flex items-center gap-2 bg-nature-50 text-nature-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-nature-100 transition-colors">
                {cta} <ChevronRight className="w-4 h-4" />
            </Link>
        </div>
    );
}
