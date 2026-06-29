import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Stethoscope, ArrowLeft, ArrowRight, Activity, Upload, Calendar, 
    Clock, MapPin, Check, Phone, FileText, AlertCircle, Zap, 
    ShieldCheck, CreditCard, Info, ChevronRight, User, Star
} from 'lucide-react';
import { api, isAuthenticated } from '../api/axios';

export default function PlantDoctor() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); 
    const [isAuth] = useState(isAuthenticated());
    const [userRole] = useState(localStorage.getItem('user_role'));
    const [activeView, setActiveView] = useState('book');
    const [activeAppId, setActiveAppId] = useState(null);
    
    // Form State
    const [bookingData, setBookingData] = useState({
        symptoms: '',
        image: null,
        date: '',
        timeSlot: '',
        address: '',
        serviceType: 'standard', 
        paymentMethod: 'online',
        distance: 2,
        preferredBotanist: null,
    });

    const [imgPreview, setImgPreview] = useState(null);
    const [appointments, setAppointments] = useState([]);
    
    const BOTANISTS = [
        { id: 1, name: 'Sarah Ahmed', rating: 4.9, expertise: 'Tropical Plants', photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200' },
        { id: 2, name: 'Rafiqul Islam', rating: 4.7, expertise: 'Bonsai & Succulents', photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200' },
        { id: 3, name: 'Tania Kabir', rating: 4.8, expertise: 'Soil Nutrition', photo: 'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=200' }
    ];

    const STATUS_STAGES = ['requested', 'assigned', 'in_transit', 'treating', 'completed'];

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/plant-care/appointments/');
            setAppointments(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (err) {
            console.error('Error fetching appointments:', err);
        }
    };

    // Load real appointments from the backend.
    useEffect(() => {
        if (isAuth) fetchAppointments();
    }, [isAuth]);

    const BASE_FEES = { standard: 300, urgent: 500 };
    const prices = {
        base: BASE_FEES[bookingData.serviceType],
        distanceCharge: Math.max(0, (bookingData.distance || 0) - 5) * 20,
        total: BASE_FEES[bookingData.serviceType] + (Math.max(0, (bookingData.distance || 0) - 5) * 20)
    };

    const handleNext = () => {
        if (step === 1 && !bookingData.symptoms) {
            toast("Please describe the plant's symptoms");
            return;
        }
        if (step === 2 && (!bookingData.date || !bookingData.timeSlot)) {
            toast("Please select both date and time slot");
            return;
        }
        if (step === 3 && !bookingData.address) {
            toast("Please enter the visit address");
            return;
        }
        setStep(step + 1);
    };

    const [booking, setBooking] = useState(false);

    const handleConfirmBooking = async () => {
        if (!isAuth) { navigate('/login'); return; }
        setBooking(true);
        try {
            const botanistName = bookingData.preferredBotanist
                ? BOTANISTS.find(b => b.id === bookingData.preferredBotanist)?.name || ''
                : '';
            const payload = new FormData();
            payload.append('service_type', bookingData.serviceType);
            payload.append('symptoms', bookingData.symptoms);
            payload.append('time_slot', bookingData.timeSlot);
            payload.append('address', bookingData.address);
            payload.append('distance', bookingData.distance || 0);
            payload.append('payment_method', bookingData.paymentMethod === 'online' ? 'online' : 'cash');
            payload.append('preferred_botanist', botanistName);
            if (bookingData.date) payload.append('visit_date', bookingData.date);
            if (bookingData.image) payload.append('image', bookingData.image);

            await api.post('/plant-care/appointments/', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await fetchAppointments();
            toast.success('Appointment requested successfully!');
            setStep(5);
        } catch (err) {
            console.error('Booking failed:', err);
            toast.error('Could not book the appointment. Please try again.');
        } finally {
            setBooking(false);
        }
    };

    const handleTrack = (id) => {
        setActiveAppId(id);
        setActiveView('my-appointments');
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const StatusTracker = ({ status }) => {
        const stageIndex = STATUS_STAGES.indexOf(status);
        return (
            <div className="w-full bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm mb-10 overflow-x-auto">
                <div className="flex items-center justify-between min-w-[600px] relative px-4">
                    {STATUS_STAGES.map((stage, i) => (
                        <div key={stage} className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${i <= stageIndex ? 'bg-nature-900 text-white scale-110' : 'bg-nature-50 text-nature-300'}`}>
                                {i < stageIndex ? <Check size={14} strokeWidth={3} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest text-center max-w-[80px] ${i <= stageIndex ? 'text-nature-900' : 'text-nature-300'}`}>
                                {stage.replace(/_/g, ' ')}
                            </span>
                        </div>
                    ))}
                    <div className="absolute top-4 left-0 w-full h-[1px] bg-nature-50 -z-0"></div>
                    <div 
                        className="absolute top-4 left-0 h-[1px] bg-nature-900 transition-all duration-1000 ease-out"
                        style={{ width: `${(stageIndex / (STATUS_STAGES.length - 1)) * 100}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    const activeApp = appointments.find(a => a.id === activeAppId);

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 pb-32">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16">
                <div className="text-left space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-sm border border-nature-50 text-nature-700">
                        <Stethoscope size={24} className="text-nature-600" />
                        <span className="font-black uppercase tracking-widest text-xs">Easy Grow Botanist Service</span>
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tighter">Botanist Appointment</h1>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                    <button 
                        onClick={() => { setActiveView('book'); setStep(0); setActiveAppId(null); }}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeView === 'book' ? 'bg-nature-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Book Botanist
                    </button>
                    <button 
                        onClick={() => { setActiveView('my-appointments'); setActiveAppId(null); }}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeView === 'my-appointments' ? 'bg-nature-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        My Appointments
                    </button>
                    {userRole === 'admin' && (
                        <button onClick={() => navigate('/admin-dashboard')} className="px-6 py-2.5 rounded-xl font-bold text-nature-600 hover:bg-nature-50 transition-all flex items-center gap-2">
                            Admin Hub <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>

            {activeView === 'book' ? (
                <div className="grid lg:grid-cols-12 gap-10 items-start">
                    
                    {/* Booking Flow */}
                    <div className="lg:col-span-7 bg-white rounded-[2.5rem] shadow-2xl border border-nature-50 overflow-hidden animate-slideUp">
                        <div className="p-10 min-h-[500px]">
                            
                            {step === 0 && (
                                <div className="space-y-10 animate-fadeIn">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">How urgent is it?</h2>
                                    <div className="space-y-4">
                                        <div 
                                            onClick={() => setBookingData({...bookingData, serviceType: 'standard'})}
                                            className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${bookingData.serviceType === 'standard' ? 'border-nature-900 bg-nature-50' : 'border-nature-50 hover:border-nature-200'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-nature-600 shadow-sm">
                                                        <Activity size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-gray-900">Standard Visit</h3>
                                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Base Fee: ৳300</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div 
                                            onClick={() => setBookingData({...bookingData, serviceType: 'urgent'})}
                                            className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all relative overflow-hidden ${bookingData.serviceType === 'urgent' ? 'border-nature-900 bg-nature-50' : 'border-nature-50 hover:border-nature-200'}`}
                                        >
                                            <div className="absolute top-4 right-4 animate-pulse">
                                                <span className="bg-nature-900 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg">Urgent</span>
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-nature-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
                                                        <Zap size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-gray-900">Urgent Botanist Visit</h3>
                                                        <p className="text-xs text-nature-700 font-bold uppercase tracking-widest mt-1">Arrival within 2 hours • ৳500</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Select Preferred Botanist (Optional)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {BOTANISTS.map(bot => (
                                                <div
                                                    key={bot.id}
                                                    onClick={() => setBookingData({...bookingData, preferredBotanist: bot.id})}
                                                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer text-center ${bookingData.preferredBotanist === bot.id ? 'border-nature-900 bg-nature-50' : 'border-nature-50 hover:border-nature-200'}`}
                                                >
                                                    <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center bg-nature-100 text-nature-700 font-black text-xl shadow-sm">
                                                        {bot.name.charAt(0)}
                                                    </div>
                                                    <p className="font-black text-sm text-gray-900 leading-tight">{bot.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">{bot.expertise}</p>
                                                    <div className="flex items-center justify-center gap-1 text-amber-500 mt-2">
                                                        <Star size={12} fill="currentColor" />
                                                        <span className="text-xs font-black text-gray-700">{bot.rating}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button onClick={() => setStep(1)} className="w-full bg-nature-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                                        Start Booking <ArrowRight size={16} />
                                    </button>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-8 animate-fadeIn">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Plant Symptoms</h2>
                                    <textarea 
                                        className="w-full p-6 bg-nature-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-nature-500 outline-none transition-all font-bold text-gray-800"
                                        rows="5"
                                        placeholder="Describe the leaves, stem, or any pests you've seen..."
                                        value={bookingData.symptoms}
                                        onChange={(e) => setBookingData({...bookingData, symptoms: e.target.value})}
                                    />
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Upload size={14} className="text-nature-600" /> Upload a Photo
                                        </label>
                                        <div className="relative h-48 rounded-[1.5rem] bg-nature-50 border-4 border-dashed border-nature-100 flex flex-col items-center justify-center text-center cursor-pointer group">
                                            <input type="file" onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setBookingData({ ...bookingData, image: file });
                                                    setImgPreview(URL.createObjectURL(file));
                                                }
                                            }} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            {imgPreview ? (
                                                <img src={imgPreview} className="w-full h-full object-cover rounded-[1.2rem]" />
                                            ) : (
                                                <Activity size={32} className="text-nature-200" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setStep(0)} className="px-8 py-5 bg-nature-50 text-nature-900 font-black rounded-2xl hover:bg-nature-100 transition-all uppercase tracking-widest text-xs">Back</button>
                                        <button onClick={handleNext} className="flex-1 bg-nature-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-lg uppercase tracking-widest text-xs">Continue</button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8 animate-fadeIn">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Schedule Your Visit</h2>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Date</label>
                                            <input 
                                                type="date" 
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full p-5 bg-nature-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-nature-500 outline-none transition-all font-black text-gray-800"
                                                value={bookingData.date}
                                                onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Time Slot</label>
                                            <div className="flex flex-col gap-2">
                                                {['Morning', 'Afternoon', 'Evening'].map(slot => (
                                                    <button 
                                                        key={slot}
                                                        onClick={() => setBookingData({...bookingData, timeSlot: slot})}
                                                        className={`py-4 px-6 rounded-xl font-bold text-xs transition-all border-2 text-left ${bookingData.timeSlot === slot ? 'bg-nature-900 border-nature-900 text-white shadow-lg' : 'bg-white border-nature-50 text-gray-500 hover:border-nature-200'}`}
                                                    >
                                                        {slot} Slot
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setStep(1)} className="px-8 py-5 bg-nature-50 text-nature-900 font-black rounded-2xl hover:bg-nature-100 transition-all uppercase tracking-widest text-xs">Back</button>
                                        <button onClick={handleNext} className="flex-1 bg-nature-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-lg uppercase tracking-widest text-xs">Continue</button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-8 animate-fadeIn">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Visit Address</h2>
                                    <textarea 
                                        className="w-full p-6 bg-nature-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-nature-500 outline-none transition-all font-bold text-gray-800"
                                        rows="3"
                                        placeholder="Full address: House, Road, Area..."
                                        value={bookingData.address}
                                        onChange={(e) => setBookingData({...bookingData, address: e.target.value})}
                                    />
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setStep(2)} className="px-8 py-5 bg-nature-50 text-nature-900 font-black rounded-2xl hover:bg-nature-100 transition-all uppercase tracking-widest text-xs">Back</button>
                                        <button onClick={handleNext} className="flex-1 bg-nature-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-lg uppercase tracking-widest text-xs">Final Review</button>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-8 animate-fadeIn">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Review & Pay</h2>
                                    
                                    <div className="p-8 bg-nature-900 rounded-[2.5rem] text-white space-y-6">
                                        <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                                            <span className="font-bold text-nature-300">Consultation Fee</span>
                                            <span className="font-black text-nature-100">৳{prices.base}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                                            <span className="font-bold text-nature-300">Distance Charge</span>
                                            <span className="font-black text-nature-100">৳{prices.distanceCharge}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xl font-black uppercase tracking-widest">Total Bill</span>
                                            <span className="text-4xl font-black text-nature-400 tracking-tighter">৳{prices.total}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setBookingData({...bookingData, paymentMethod: 'online'})} className={`p-5 rounded-2xl border-2 transition-all ${bookingData.paymentMethod === 'online' ? 'border-[#D12053] bg-pink-50' : 'border-gray-100'}`}>
                                            <p className="font-black text-xs uppercase text-gray-900">Pay Now (bKash)</p>
                                        </button>
                                        <button onClick={() => setBookingData({...bookingData, paymentMethod: 'cash'})} className={`p-5 rounded-2xl border-2 transition-all ${bookingData.paymentMethod === 'cash' ? 'border-nature-900 bg-nature-50' : 'border-gray-100'}`}>
                                            <p className="font-black text-xs uppercase text-gray-900">Pay After Visit</p>
                                        </button>
                                    </div>

                                    <button onClick={handleConfirmBooking} disabled={booking} className="w-full bg-nature-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-2xl uppercase tracking-widest text-sm disabled:opacity-50">
                                        {booking ? 'Booking…' : 'Confirm Appointment'}
                                    </button>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="text-center space-y-10 animate-fadeIn py-16">
                                    <div className="w-24 h-24 bg-nature-100 text-nature-900 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
                                        <Check size={48} strokeWidth={3} />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Appointment Requested!</h2>
                                        <p className="text-gray-500 font-medium">Your Botanist will be assigned within 30 minutes.</p>
                                    </div>
                                    <button onClick={() => { setActiveView('my-appointments'); setActiveAppId(null); }} className="px-10 py-4 bg-nature-900 text-white font-black rounded-2xl uppercase text-xs tracking-widest">Track Status</button>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Sidebar: Selected Stats */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-nature-50 rounded-[2.5rem] p-10 border border-nature-100 space-y-8">
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                                <Info size={20} className="text-nature-600" />
                                Why Easy Grow?
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-nature-700 shadow-sm">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 text-xs uppercase">Certified Botanists</p>
                                        <p className="text-[10px] text-gray-500 font-medium mt-1">Our experts are verified professionals with years of experience.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-nature-700 shadow-sm">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 text-xs uppercase">Detailed Care Plans</p>
                                        <p className="text-[10px] text-gray-500 font-medium mt-1">Receive a PDF prescription with specific fertilizer & soil recommendations.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => navigate('/')} className="w-full py-4 text-nature-700 font-black uppercase text-[10px] tracking-widest bg-white border border-nature-100 rounded-2xl hover:bg-nature-50 transition-all flex items-center justify-center gap-2">
                             <ArrowLeft size={14} /> Back to Home
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-10 animate-fadeIn">
                    
                    {activeApp && activeApp.status !== 'completed' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Live Status: #APP-{activeApp.id}</h2>
                                <button onClick={() => setActiveAppId(null)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-nature-700">Close Tracker</button>
                            </div>
                            <StatusTracker status={activeApp.status} />
                        </div>
                    )}

                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Appointment History</h2>
                    
                    <div className="grid md:grid-cols-1 gap-8">
                        {appointments.length === 0 ? (
                            <div className="p-20 text-center bg-nature-50 rounded-[2.5rem] border-2 border-dashed border-nature-100">
                                <p className="text-gray-400 font-black uppercase tracking-widest">No appointments found</p>
                                <button onClick={() => setActiveView('book')} className="mt-4 text-nature-700 font-black uppercase text-xs hover:underline">Book Your First Visit</button>
                            </div>
                        ) : (
                            appointments.map(app => (
                                <div key={app.id} className="bg-white rounded-[2.5rem] shadow-xl border border-nature-50 overflow-hidden hover:shadow-2xl transition-all">
                                    <div className="p-10 space-y-8">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-nature-50 rounded-2xl flex items-center justify-center text-nature-900">
                                                    <Stethoscope size={32} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Appointment ID</p>
                                                    <h3 className="text-xl font-black text-gray-900">#APP-{app.id}</h3>
                                                </div>
                                            </div>
                                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'completed' ? 'bg-nature-100 text-nature-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {app.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-8 py-8 border-y border-dashed border-gray-100">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Visit Date</p>
                                                <p className="font-black text-gray-800">{app.visit_date || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Assigned Botanist</p>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-nature-600" />
                                                    <p className="font-black text-gray-800">{app.assigned_botanist}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Symptoms</p>
                                                <p className="text-xs text-gray-500 font-medium line-clamp-2">{app.symptoms}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <div className="flex items-center gap-4">
                                                {app.status !== 'completed' && (
                                                    <button 
                                                        onClick={() => handleTrack(app.id)}
                                                        className="bg-nature-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                                                    >
                                                        Track Live
                                                    </button>
                                                )}
                                                {app.has_prescription && (
                                                    <button className="flex items-center gap-2 bg-nature-50 text-nature-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-nature-100 transition-all border border-nature-100">
                                                        <FileText size={14} /> Download Care Plan
                                                    </button>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    </div>
                </div>
            )}
        </div>
    );
}
