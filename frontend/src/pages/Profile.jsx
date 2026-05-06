import { useState, useEffect, useRef } from 'react';
import { api } from '../api/axios';
import { User, Mail, Phone, Camera, Save, ArrowLeft, Package, Clock, ChevronRight, Droplets, Heart, Trees, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import VoiceInput from '../components/VoiceInput';

export default function Profile() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showOrders, setShowOrders] = useState(false);
    const [orders, setOrders] = useState([]);
    
    const [showCare, setShowCare] = useState(location.state?.showCare || false);
    const [careCards, setCareCards] = useState([]);
    const [justWatered, setJustWatered] = useState({});
    const [justFertilized, setJustFertilized] = useState({});
    
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        profile_picture: ''
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchProfile();
        fetchOrders();
        fetchCareCards();

        if (location.state?.showCare) {
            setTimeout(() => {
                window.scrollTo({ top: document.body.scrollHeight/2, behavior: 'smooth' });
            }, 300);
        }

        const pollInterval = setInterval(() => {
            fetchOrders();
            fetchCareCards();
        }, 30000);
        return () => clearInterval(pollInterval);
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me/');
            setFormData({
                full_name: res.data.full_name || '',
                phone: res.data.phone || '',
                email: res.data.email || '',
                profile_picture: res.data.profile_picture || ''
            });
        } catch (err) {
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/');
            setOrders(res.data);
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    };

    const fetchCareCards = async () => {
        try {
            const res = await api.get('/plant-care/care-cards/');
            setCareCards(res.data);
        } catch (err) {
            console.error("Error fetching care cards:", err);
        }
    };

    const handleTaskComplete = async (cardId, taskType) => {
        try {
            await api.post(`/plant-care/care-cards/${cardId}/task_completed/`, { task_type: taskType });
            
            setCareCards(prev => prev.map(card => {
                if (card.id === cardId) {
                    const today = new Date().toISOString().split('T')[0];
                    if (taskType === 'water') {
                        setJustWatered(p => ({...p, [cardId]: true}));
                        return { ...card, last_watered_date: today };
                    } else if (taskType === 'fertilize') {
                        setJustFertilized(p => ({...p, [cardId]: true}));
                        return { ...card, last_fertilized_date: today };
                    }
                }
                return card;
            }));
            
            window.dispatchEvent(new Event('careTaskCompleted'));
        } catch (err) {
            console.error("Task update failed:", err);
            alert(`Failed to update task: ${err.response?.data?.error || 'Server connection error'}.`);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('full_name', formData.full_name);
            formDataToSend.append('phone', formData.phone);
            if (selectedFile) {
                formDataToSend.append('profile_picture', selectedFile);
            }

            await api.patch('/auth/me/', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            fetchProfile();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    const resolveImg = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1501004318641-729e8439a7df?q=80&w=2574&auto=format&fit=crop';
        if (url.startsWith('http')) return url;
        return `http://localhost:8000${url}`;
    };

    if (loading) return <div className="p-20 text-center">{t('loading')}</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-12 bg-white min-h-screen">
            <div className="flex items-center justify-between border-b pb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-nature-800">{t('profile')}</h1>
                <div className="w-10 h-10" /> {/* Spacer */}
            </div>

            <div className="grid md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {message.text && (
                            <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-nature-50 text-nature-700' : 'bg-red-50 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-nature-200">
                                    <img 
                                        src={previewUrl || resolveImg(formData.profile_picture)} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-nature-600 text-white rounded-full shadow-lg"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{formData.full_name || 'User'}</h3>
                                <p className="text-sm text-gray-500">{formData.email}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-600">{t('fullName')}</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nature-500 outline-none"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <VoiceInput onResult={(val) => setFormData(p => ({...p, full_name: val}))} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-600">{t('mobileNumber')}</label>
                                <div className="relative">
                                    <input 
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nature-500 outline-none"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <VoiceInput onResult={(val) => setFormData(p => ({...p, phone: val}))} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={saving}
                            className="bg-nature-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-nature-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? 'Saving...' : t('updateProfile')}
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    <button
                        onClick={() => setShowCare(!showCare)}
                        className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between ${showCare ? 'border-nature-500 bg-nature-50' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center gap-4">
                            <Trees className="w-6 h-6 text-nature-600" />
                            <div className="text-left">
                                <h3 className="font-bold text-gray-800">{t('myPlantCare')}</h3>
                                <p className="text-xs text-gray-500">{careCards.length} {t('myPlantCare')}</p>
                            </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showCare ? 'rotate-90' : ''}`} />
                    </button>

                    <button
                        onClick={() => setShowOrders(!showOrders)}
                        className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between ${showOrders ? 'border-nature-500 bg-nature-50' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center gap-4">
                            <Package className="w-6 h-6 text-nature-600" />
                            <div className="text-left">
                                <h3 className="font-bold text-gray-800">{t('myOrders')}</h3>
                                <p className="text-xs text-gray-500">{orders.length} Orders</p>
                            </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showOrders ? 'rotate-90' : ''}`} />
                    </button>

                    {showCare && (
                        <div className="space-y-3 animate-slideDown max-h-[400px] overflow-y-auto pr-2">
                            {careCards.map(card => (
                                <div key={card.id} className="bg-gray-50 p-4 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-gray-800 text-sm">{card.plant_name}</h4>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleTaskComplete(card.id, 'water')} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                                                <Droplets className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleTaskComplete(card.id, 'fertilize')} className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-600 hover:text-white transition-colors">
                                                <Heart className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-gray-500 flex justify-between">
                                        <span>Last Watered: {justWatered[card.id] ? 'Today' : card.last_watered_date}</span>
                                        <span>Last Fed: {justFertilized[card.id] ? 'Today' : card.last_fertilized_date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
