import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Sprout, ArrowLeft, ArrowRight, Activity, Calendar, 
    Clock, MapPin, Check, Phone, FileText, AlertCircle, 
    ShieldCheck, CreditCard, Info, ChevronRight, User, Star, Hammer, Package
} from 'lucide-react';
import { api, isAuthenticated } from '../api/axios';

export default function ExpertPotting() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); 
    const [isAuth] = useState(isAuthenticated());
    const [userRole] = useState(localStorage.getItem('user_role'));
    const [activeView, setActiveView] = useState('book');
    const [activeReqId, setActiveReqId] = useState(null);
    
    // Form State
    const [bookingData, setBookingData] = useState({
        smallPots: 0,
        mediumPots: 0,
        largePots: 0,
        packageType: 'labor', // 'labor' or 'soil'
        date: '',
        timeSlot: '',
        address: '',
        distance: 2,
        paymentMethod: 'online',
    });

    const [requests, setRequests] = useState([]);
    
    const STATUS_STAGES = ['requested', 'assigned', 'in_progress', 'completed'];

    // Load from LocalStorage (Mock DB)
    useEffect(() => {
        const saved = localStorage.getItem('local_potting_requests');
        if (saved) {
            setRequests(JSON.parse(saved));
        } else {
            const initial = [
                { id: 'POT-8821', date: '2024-11-05', status: 'completed', expert: 'Rahat Hasan', pots: '3 Small, 1 Large', package: 'Soil & Fertilizer', total: 1000 },
                { id: 'POT-9012', date: '2024-11-12', status: 'requested', expert: 'Not Assigned', pots: '5 Medium', package: 'Labor Only', total: 500 }
            ];
            setRequests(initial);
            localStorage.setItem('local_potting_requests', JSON.stringify(initial));
        }
    }, []);

    // Listen for changes
    useEffect(() => {
        const handleStorage = () => {
            const saved = localStorage.getItem('local_potting_requests');
            if (saved) setRequests(JSON.parse(saved));
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const PRICING = {
        labor: 100,
        soil: 250,
        travelBase: 5,
        travelRate: 20
    };

    const calculateTotal = () => {
        const totalPots = bookingData.smallPots + bookingData.mediumPots + bookingData.largePots;
        const perPotPrice = bookingData.packageType === 'soil' ? PRICING.soil : PRICING.labor;
        const laborSubtotal = totalPots * perPotPrice;
        const travelCharge = Math.max(0, bookingData.distance - PRICING.travelBase) * PRICING.travelRate;
        return {
            subtotal: laborSubtotal,
            travel: travelCharge,
            total: laborSubtotal + travelCharge
        };
    };

    const totals = calculateTotal();

    const handleNext = () => {
        if (step === 0) {
            const totalPots = bookingData.smallPots + bookingData.mediumPots + bookingData.largePots;
            if (totalPots <= 0) {
                alert("Please add at least one pot to proceed");
                return;
            }
        }
        if (step === 1 && (!bookingData.date || !bookingData.timeSlot)) {
            alert("Please select both date and time slot");
            return;
        }
        if (step === 2 && !bookingData.address) {
            alert("Please enter the visit address");
            return;
        }
        setStep(step + 1);
    };

    const handleConfirmBooking = () => {
        const potSummary = [
            bookingData.smallPots > 0 ? `${bookingData.smallPots} Small` : '',
            bookingData.mediumPots > 0 ? `${bookingData.mediumPots} Medium` : '',
            bookingData.largePots > 0 ? `${bookingData.largePots} Large` : '',
        ].filter(Boolean).join(', ');

        const newReq = {
            id: `POT-${Math.floor(1000 + Math.random() * 9000)}`,
            date: bookingData.date,
            status: 'requested',
            expert: 'Not Assigned',
            pots: potSummary,
            package: bookingData.packageType === 'soil' ? 'Soil & Fertilizer Included' : 'Labor Only',
            total: totals.total,
            timestamp: new Date().toISOString()
        };

        const updated = [newReq, ...requests];
        setRequests(updated);
        localStorage.setItem('local_potting_requests', JSON.stringify(updated));
        
        window.dispatchEvent(new Event('storage'));
        setStep(4);
    };

    const StatusTracker = ({ status }) => {
        const stageIndex = STATUS_STAGES.indexOf(status);
        return (
            <div className="w-full bg-white p-6 rounded-[2rem] border border-nature-100 shadow-sm mb-10 overflow-x-auto">
                <div className="flex items-center justify-between min-w-[500px] relative px-4">
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

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 pb-32">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16">
                <div className="text-left space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-sm border border-nature-50 text-nature-700">
                        <Hammer size={24} className="text-nature-600" />
                        <span className="font-black uppercase tracking-widest text-xs">Easy Grow Home-Visit Service</span>
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tighter">Expert Potting Service</h1>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                    <button 
                        onClick={() => { setActiveView('book'); setStep(0); setActiveReqId(null); }}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeView === 'book' ? 'bg-nature-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Book Service
                    </button>
                    <button 
                        onClick={() => { setActiveView('history'); setActiveReqId(null); }}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeView === 'history' ? 'bg-nature-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        My Requests
                    </button>
                </div>
            </div>

            {activeView === 'book' ? (
                <div className="grid lg:grid-cols-12 gap-10 items-start">
                    
                    <div className="lg:col-span-7 bg-white rounded-[2.5rem] shadow-2xl border border-nature-50 overflow-hidden animate-slideUp">
                        <div className="p-10 min-h-[500px]">
                            
                            {step === 0 && (
                                <div className="space-y-10 animate-fadeIn">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Potting Details</h2>
                                    
                                    <div className="space-y-6">
                                        {[
                                            { key: 'smallPots', label: 'Small Pots', sub: 'Up to 6 inches' },
                                            { key: 'mediumPots', label: 'Medium Pots', sub: '6 to 12 inches' },
                                            { key: 'largePots', label: 'Large Pots', sub: 'Above 12 inches' }
                                        ].map(pot => (
                                            <div key={pot.key} className="flex items-center justify-between p-6 bg-nature-50 rounded-[1.5rem] border border-nature-100">
                                                <div>
                                                    <h3 className="font-black text-gray-900">{pot.label}</h3>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{pot.sub}</p>
                                                </div>
                                                <div className="flex items-center gap-6 bg-white px-4 py-2 rounded-2xl shadow-sm border border-nature-100">
                                                    <button 
                                                        onClick={() => setBookingData({...bookingData, [pot.key]: Math.max(0, bookingData[pot.key] - 1)})}
                                                        className="w-10 h-10 rounded-xl bg-nature-50 text-nature-900 flex items-center justify-center font-black hover:bg-nature-200 transition-all"
                                                    >-</button>
                                                    <span className="font-black text-xl text-gray-900 w-8 text-center">{bookingData[pot.key]}</span>
                                                    <button 
                                                        onClick={() => setBookingData({...bookingData, [pot.key]: bookingData[pot.key] + 1})}
                                                        className="w-10 h-10 rounded-xl bg-nature-900 text-white flex items-center justify-center font-black hover:bg-black transition-all shadow-md"
                                                    >+</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Material Package</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div 
                                                onClick={() => setBookingData({...bookingData, packageType: 'labor'})}
                                                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${bookingData.packageType === 'labor' ? 'border-nature-900 bg-nature-50' : 'border-nature-50 hover:border-nature-200'}`}
                                            >
                                                <Hammer size={24} className={bookingData.packageType === 'labor' ? 'text-nature-900' : 'text-gray-300'} />
                                                <h4 className="font-black text-gray-900 mt-4">Labor Only</h4>
                                                <p className="text-[10px] text-nature-700 font-bold mt-1">৳100 / Pot</p>
                                            </div>
                                            <div 
                                                onClick={() => setBookingData({...bookingData, packageType: 'soil'})}
                                                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${bookingData.packageType === 'soil' ? 'border-nature-900 bg-nature-50' : 'border-nature-50 hover:border-nature-200'}`}
                                            >
                                                <Package size={24} className={bookingData.packageType === 'soil' ? 'text-nature-900' : 'text-gray-300'} />
                                                <h4 className="font-black text-gray-900 mt-4">Soil & Fertilizer</h4>
                                                <p className="text-[10px] text-nature-700 font-bold mt-1">৳250 / Pot</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button onClick={handleNext} className="w-full bg-nature-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                                        Continue <ArrowRight size={16} />
                                    </button>
                                </div>
                            )}

                            {step === 1 && (
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
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Time Slot</label>
                                            <select 
                                                className="w-full p-5 bg-nature-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-nature-500 outline-none transition-all font-black text-gray-800"
                                                value={bookingData.timeSlot}
                                                onChange={(e) => setBookingData({...bookingData, timeSlot: e.target.value})}
                                            >
                                                <option value="">Choose a slot</option>
                                                <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                                                <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                                                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                                                <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                                            </select>
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
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Visit Address</h2>
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <MapPin size={14} className="text-nature-600" /> Full Address
                                            </label>
                                            <textarea 
                                                className="w-full p-6 bg-nature-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-nature-500 outline-none transition-all font-bold text-gray-800"
                                                rows="3"
                                                placeholder="House, Road, Block, Area..."
                                                value={bookingData.address}
                                                onChange={(e) => setBookingData({...bookingData, address: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Distance from City Center (km)</label>
                                            <input 
                                                type="number"
                                                className="w-full p-5 bg-nature-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-nature-500 outline-none transition-all font-black text-gray-800"
                                                value={bookingData.distance}
                                                onChange={(e) => setBookingData({...bookingData, distance: Number(e.target.value)})}
                                            />
                                            <p className="text-[10px] text-nature-600 font-bold italic">* ৳20/km surcharge applies after 5km</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setStep(1)} className="px-8 py-5 bg-nature-50 text-nature-900 font-black rounded-2xl hover:bg-nature-100 transition-all uppercase tracking-widest text-xs">Back</button>
                                        <button onClick={handleNext} className="flex-1 bg-nature-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-lg uppercase tracking-widest text-xs">Review Request</button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-8 animate-fadeIn">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Summary & Payment</h2>
                                    
                                    <div className="bg-nature-50 rounded-[2rem] p-8 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 font-bold uppercase tracking-widest">Service Fee</span>
                                                <span className="font-black text-gray-900">৳{totals.subtotal}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 font-bold uppercase tracking-widest">Travel Charge</span>
                                                <span className="font-black text-gray-900">৳{totals.travel}</span>
                                            </div>
                                            <div className="pt-4 border-t border-nature-200 flex justify-between items-center">
                                                <span className="text-nature-900 font-black uppercase tracking-[0.2em] text-xs">Total Bill</span>
                                                <span className="text-3xl font-black text-nature-900 tracking-tighter">৳{totals.total}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Payment Method</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button 
                                                onClick={() => setBookingData({...bookingData, paymentMethod: 'online'})}
                                                className={`p-4 rounded-2xl border-2 font-black text-xs transition-all ${bookingData.paymentMethod === 'online' ? 'border-nature-900 bg-nature-50 text-nature-900' : 'border-nature-50 text-gray-400'}`}
                                            >
                                                Online (bKash)
                                            </button>
                                            <button 
                                                onClick={() => setBookingData({...bookingData, paymentMethod: 'cod'})}
                                                className={`p-4 rounded-2xl border-2 font-black text-xs transition-all ${bookingData.paymentMethod === 'cod' ? 'border-nature-900 bg-nature-50 text-nature-900' : 'border-nature-50 text-gray-400'}`}
                                            >
                                                Cash on Service
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setStep(2)} className="px-8 py-5 bg-nature-50 text-nature-900 font-black rounded-2xl hover:bg-nature-100 transition-all uppercase tracking-widest text-xs">Back</button>
                                        <button onClick={handleConfirmBooking} className="flex-1 bg-nature-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all shadow-2xl uppercase tracking-widest text-xs">Confirm Request</button>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="py-12 text-center space-y-8 animate-bounce-slow">
                                    <div className="w-24 h-24 bg-nature-100 rounded-full flex items-center justify-center mx-auto text-nature-600 shadow-xl border-4 border-white">
                                        <ShieldCheck size={48} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Request Received!</h2>
                                        <p className="text-gray-500 font-bold">A gardening expert will be assigned shortly.</p>
                                    </div>
                                    <button 
                                        onClick={() => { setActiveView('history'); setStep(0); }}
                                        className="bg-nature-900 text-white font-black px-10 py-4 rounded-2xl hover:bg-black transition-all shadow-xl uppercase tracking-widest text-xs"
                                    >
                                        Track Status
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-nature-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                            <h3 className="text-2xl font-black tracking-tight mb-6 relative z-10">Why Hire Our Experts?</h3>
                            <div className="space-y-6 relative z-10">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Check size={20} /></div>
                                    <div>
                                        <h4 className="font-black text-sm uppercase tracking-widest">Premium Soil Mix</h4>
                                        <p className="text-xs text-nature-300 mt-1">Custom organic media tailored for your specific plant varieties.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Check size={20} /></div>
                                    <div>
                                        <h4 className="font-black text-sm uppercase tracking-widest">Expert Handling</h4>
                                        <p className="text-xs text-nature-300 mt-1">Our gardeners ensure root health and proper drainage for every pot.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Check size={20} /></div>
                                    <div>
                                        <h4 className="font-black text-sm uppercase tracking-widest">No Mess Guarantee</h4>
                                        <p className="text-xs text-nature-300 mt-1">We clean up the workspace completely after the potting is done.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-8 border border-nature-100 shadow-sm space-y-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Need Help?</h4>
                            <div className="flex items-center gap-4 p-4 bg-nature-50 rounded-2xl">
                                <div className="w-10 h-10 rounded-full bg-nature-600 flex items-center justify-center text-white shadow-md"><Phone size={18} /></div>
                                <div>
                                    <p className="font-black text-[10px] text-gray-900 uppercase">Support Hotline</p>
                                    <p className="font-bold text-sm text-nature-700">+880 1788 740906</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-fadeIn">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">My Potting Requests</h2>
                    
                    {requests.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-nature-50 shadow-sm">
                            <Sprout size={64} className="mx-auto text-nature-100 mb-6" />
                            <p className="text-gray-400 font-bold text-lg">No potting requests found.</p>
                            <button onClick={() => setActiveView('book')} className="mt-4 text-nature-600 font-black uppercase tracking-widest text-xs hover:underline">Book Your First Visit</button>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {requests.map(req => (
                                <div key={req.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-nature-50 hover:shadow-xl transition-all group">
                                    <div className="flex flex-col md:flex-row justify-between gap-8">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-nature-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg">#{req.id}</span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${
                                                    req.status === 'completed' ? 'bg-nature-100 text-nature-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-nature-50 flex items-center justify-center shrink-0 text-nature-600"><Sprout size={20} /></div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Expert Assigned</p>
                                                        <p className="font-black text-gray-900">{req.expert}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-nature-50 flex items-center justify-center shrink-0 text-nature-600"><Package size={20} /></div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Plan & Items</p>
                                                        <p className="font-black text-gray-900">{req.pots} • {req.package}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <StatusTracker status={req.status} />
                                        </div>

                                        <div className="md:w-64 bg-nature-50 rounded-3xl p-6 flex flex-col justify-between items-center text-center">
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Visit Date</p>
                                                <div className="flex items-center gap-2 justify-center text-nature-900 font-black">
                                                    <Calendar size={16} />
                                                    {req.date}
                                                </div>
                                            </div>
                                            <div className="mt-6">
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Bill</p>
                                                <p className="text-3xl font-black text-nature-900 tracking-tighter">৳{req.total}</p>
                                            </div>
                                            {req.status === 'requested' && (
                                                <button className="w-full mt-6 bg-white text-red-500 font-black py-3 rounded-2xl hover:bg-red-50 transition-all text-xs uppercase tracking-widest shadow-sm">Cancel</button>
                                            )}
                                        </div>
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
