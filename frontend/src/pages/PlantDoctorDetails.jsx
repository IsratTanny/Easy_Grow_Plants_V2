import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    Stethoscope, ArrowLeft, Calendar, Clock, MapPin, 
    Check, Phone, FileText, Info, ShieldCheck, Zap,
    Activity, User, Star, ChevronRight, CreditCard, AlertCircle
} from 'lucide-react';
import { api } from '../api/axios';

export default function PlantDoctorDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BOTANISTS_LIST = [
        { name: 'Sarah Ahmed', specialty: 'Tropical Plants', photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200' },
        { name: 'Rafiqul Islam', specialty: 'Bonsai & Succulents', photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200' },
        { name: 'Tania Kabir', specialty: 'Soil Nutrition', photo: 'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=200' }
    ];

    useEffect(() => {
        const fetchDetails = async () => {
            console.log(`DEBUG: Fetching details for appointment ID: ${id}`);
            try {
                setLoading(true);
                setError(null);
                
                // Attempt to fetch from API
                try {
                    const response = await api.get(`/plant-care/appointments/${id}/`);
                    if (response.data) {
                        console.log("DEBUG: Data fetched from API", response.data);
                        setAppointment(response.data);
                        setLoading(false);
                        return;
                    }
                } catch (apiErr) {
                    console.warn("DEBUG: API fetch failed, falling back to localStorage", apiErr);
                }

                // Fallback to LocalStorage (Mock DB)
                const saved = localStorage.getItem('local_botanist_appointments');
                if (saved) {
                    const apps = JSON.parse(saved);
                    const found = apps.find(a => a.id === id);
                    if (found) {
                        console.log("DEBUG: Data found in localStorage", found);
                        setAppointment(found);
                    } else {
                        throw new Error('Appointment Details Not Found');
                    }
                } else {
                    throw new Error('Appointment Details Not Found');
                }
            } catch (err) {
                console.error("DEBUG: Error in fetchDetails", err);
                setError(err.message || 'Details not found');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        } else {
            setError("No Appointment ID provided");
            setLoading(false);
        }
    }, [id]);

    // Safety check for rendering
    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 bg-white">
                <div className="w-16 h-16 border-4 border-nature-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-nature-700 font-black uppercase tracking-widest text-xs animate-pulse">Loading Details...</p>
            </div>
        );
    }

    if (error || !appointment) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 bg-white rounded-[2rem] shadow-xl my-10">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Appointment Details Not Found</h2>
                <p className="text-gray-500 font-medium">We couldn't locate any data for appointment <span className="text-nature-700 font-bold">#{id}</span>.</p>
                <div className="flex justify-center gap-4">
                    <button onClick={() => navigate('/plant-doctor')} className="bg-nature-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest inline-flex items-center gap-2 hover:bg-black transition-all">
                        <ArrowLeft size={18} /> Back to History
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="bg-gray-100 text-gray-700 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Safely access properties with optional chaining and fallbacks
    const botName = appointment.botanist || 'Not Assigned';
    const botInfo = BOTANISTS_LIST.find(b => b.name === botName) || {
        name: botName,
        specialty: 'Expert Botanist',
        photo: 'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=200'
    };

    const baseFee = appointment.serviceType === 'urgent' ? 500 : 300;
    const distanceCharge = 20 * Math.max(0, (appointment.distance || 2) - 5);
    const total = baseFee + distanceCharge;

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 animate-fadeIn pb-32">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <button onClick={() => navigate('/plant-doctor')} className="flex items-center gap-2 text-nature-700 font-black uppercase text-xs tracking-widest hover:underline">
                    <ArrowLeft size={16} /> Back to History
                </button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-sm border border-nature-50">
                    <Stethoscope size={20} className="text-nature-600" />
                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">Botanist Record</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Status Card */}
                    <div className="p-8 bg-nature-900 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Record ID</p>
                            <h2 className="text-3xl font-black tracking-tighter">#{appointment.id}</h2>
                        </div>
                        <div className="text-right">
                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 ${appointment.status === 'completed' ? 'bg-nature-500/20' : 'bg-amber-500/20'}`}>
                                {appointment.status?.replace(/_/g, ' ') || 'Pending'}
                            </span>
                        </div>
                    </div>

                    {/* Botanist Detail */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-nature-50">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                            <User size={14} className="text-nature-600" /> Professional Assigned
                        </h3>
                        <div className="flex items-center gap-8">
                            <div className="w-24 h-24 bg-nature-50 rounded-3xl overflow-hidden border border-nature-100">
                                <img src={botInfo.photo} className="w-full h-full object-cover" alt={botInfo.name} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-2xl font-black text-gray-900 tracking-tight">Botanist {botInfo.name}</h4>
                                <p className="text-sm text-nature-700 font-bold flex items-center gap-2">
                                    <ShieldCheck size={16} /> {botInfo.specialty}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Visit Info */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-nature-50 space-y-10">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Visit Date</h3>
                                <p className="font-black text-gray-900 text-lg">{appointment.date || 'To be determined'}</p>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Time Slot</h3>
                                <p className="font-black text-gray-900 text-lg uppercase">{appointment.timeSlot || 'Anytime'}</p>
                            </div>
                        </div>
                        <div className="pt-8 border-t border-gray-100">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Patient Symptoms</h3>
                            <div className="p-6 bg-nature-50 rounded-2xl italic text-gray-600 font-medium border border-nature-100">
                                "{appointment.symptoms || 'No description provided.'}"
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Action Tracker */}
                    {appointment.status !== 'completed' && (
                        <button 
                            onClick={() => navigate('/plant-doctor')}
                            className="w-full bg-nature-900 text-white p-8 rounded-[2.5rem] shadow-xl hover:bg-black transition-all flex flex-col items-center gap-4 group"
                        >
                            <Activity size={32} className="animate-pulse" />
                            <div className="text-center">
                                <p className="font-black text-sm uppercase tracking-widest">Track Live Progress</p>
                            </div>
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    )}

                    {/* Payment Summary */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-nature-50">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <CreditCard size={20} className="text-nature-600" /> Payment
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                                <span>Base Fee</span>
                                <span className="text-gray-900">৳{baseFee}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                                <span>Distance Charge</span>
                                <span className="text-gray-900">৳{distanceCharge}</span>
                            </div>
                            <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                                <span className="font-black uppercase tracking-widest">Total</span>
                                <span className="text-3xl font-black text-nature-700">৳{total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Completed Section */}
                    {appointment.status === 'completed' && (
                        <div className="bg-nature-50 rounded-[2.5rem] p-10 border border-nature-100 space-y-6">
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <FileText size={20} className="text-nature-600" /> Care Plan
                            </h3>
                            <button className="w-full bg-nature-900 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-black shadow-lg">
                                Download Care Plan
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
