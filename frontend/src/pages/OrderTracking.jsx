import { useState } from 'react';
import { Truck, Search, Package, CheckCircle, PackageOpen, AlertCircle, MapPin, Map, Navigation } from 'lucide-react';
import { api } from '../api/axios';

export default function OrderTracking() {
    const [trackingId, setTrackingId] = useState('');
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e) => {
        e.preventDefault();
        if (!trackingId.trim()) return;
        
        setLoading(true);
        setError('');
        setOrderData(null);
        
        try {
            const res = await api.get(`/orders/track/?id=${trackingId.trim()}`);
            setOrderData(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not find order with this Tracking ID');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = (status) => {
        switch (status) {
            case 'pending': return 1;
            case 'processing': return 2;
            case 'shipped': return 3;
            case 'out_for_delivery': return 4;
            case 'delivered': return 5;
            case 'completed': return 5;
            default: return 0;
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-10 p-4 md:p-8 animate-fadeIn">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-black text-nature-900 tracking-tight flex items-center justify-center gap-3">
                    <Truck className="w-10 h-10 text-nature-600" /> Track Parcel
                </h1>
                <p className="text-gray-500 font-medium mt-2">Enter your Tracking ID to view the live status of your delivery</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 mb-8">
                <form onSubmit={handleTrack} className="flex gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="e.g. EGP-240510-A1B2C"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-nature-500 focus:ring-4 focus:ring-nature-500/10 outline-none font-mono text-lg transition-all uppercase"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                        />
                        <Search className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                    <button 
                        type="submit" 
                        className="btn btn-primary px-8 rounded-2xl text-lg font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 text-white"
                        style={{ backgroundColor: '#14532D' }}
                        disabled={loading}
                    >
                        {loading ? 'Tracking...' : 'Track'}
                    </button>
                </form>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center animate-fadeIn">
                    <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
                    <h3 className="font-black text-xl mb-1">Parcel Not Found</h3>
                    <p className="font-medium text-red-500/80">{error}</p>
                </div>
            )}

            {orderData && (
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-slideUp">
                    <div className="bg-nature-900 text-white p-8 relative overflow-hidden">
                        <Navigation className="absolute -right-4 -bottom-4 w-32 h-32 text-nature-800 opacity-50 rotate-45" />
                        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-black text-nature-100 uppercase tracking-widest mb-1">Tracking Summary</h2>
                                <p className="text-3xl font-mono tracking-wider">{orderData.tracking_id}</p>
                            </div>
                            <div className="bg-nature-800 px-6 py-3 rounded-2xl border border-nature-700/50 self-start md:self-auto uppercase">
                                <span className="text-xs text-nature-300 font-bold block tracking-widest">Current Status</span>
                                <span className="text-xl font-black text-white">
                                    {orderData.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Progress Bar */}
                        <div className="relative mb-12 mt-4 max-w-2xl mx-auto">
                            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-gray-100 rounded-full"></div>
                            
                            {/* Dynamic colored progress line */}
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-nature-600 rounded-full transition-all duration-1000 ease-in-out"
                                style={{ width: `${Math.min(((getStatusStep(orderData.status) - 1) / 4) * 100, 100)}%` }}
                            ></div>

                            <div className="relative flex justify-between">
                                {[
                                    { icon: Package, label: 'Pending' },
                                    { icon: PackageOpen, label: 'Processing' },
                                    { icon: Map, label: 'Shipped' },
                                    { icon: Truck, label: 'Out for Delivery' },
                                    { icon: CheckCircle, label: 'Delivered' }
                                ].map((step, idx) => {
                                    const isActive = getStatusStep(orderData.status) >= idx + 1;
                                    const isCurrent = getStatusStep(orderData.status) === idx + 1;
                                    const Icon = step.icon;
                                    
                                    return (
                                        <div key={step.label} className="flex flex-col items-center relative gap-2">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 outline outline-4 outline-white z-10
                                                ${isActive ? 'bg-nature-600 text-white shadow-nature-600/30 shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                                                <Icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                                            </div>
                                            <span className={`text-xs font-black uppercase tracking-widest hidden md:block w-24 text-center mt-2
                                                ${isActive ? 'text-nature-900' : 'text-gray-400'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-nature-50 p-6 rounded-2xl border border-nature-100/50">
                                <h3 className="text-sm font-black uppercase tracking-widest text-nature-800 flex items-center gap-2 mb-4">
                                    <MapPin className="w-4 h-4" /> Delivery Information
                                </h3>
                                <div className="space-y-4 font-medium text-sm">
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-widest">Recipient</span>
                                        <span className="text-gray-900 text-base">{orderData.customer_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-widest">Location Zone</span>
                                        <span className="text-gray-900 text-base capitalize">{orderData.delivery_location.replace('_', ' ')}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-widest">Order Amount</span>
                                        <span className="text-nature-700 font-bold text-lg">৳{orderData.total_bill}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
                                <h3 className="text-sm font-black uppercase tracking-widest text-blue-800 flex items-center gap-2 mb-4">
                                    <Truck className="w-4 h-4" /> Courier Details
                                </h3>
                                <div className="space-y-4 font-medium text-sm">
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-widest">Assigned Courier</span>
                                        <span className="text-gray-900 text-base font-bold bg-white px-3 py-1 rounded-lg border border-gray-100 inline-block mt-1">
                                            {orderData.courier_service || 'Awaiting Assignment'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-widest">Payment Method</span>
                                        <span className="text-gray-900 text-base uppercase">{orderData.payment_method}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-widest">Payment Status</span>
                                        <span className={`text-xs px-2 py-1 rounded-md font-black uppercase inline-block mt-1
                                            ${orderData.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {orderData.payment_status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
