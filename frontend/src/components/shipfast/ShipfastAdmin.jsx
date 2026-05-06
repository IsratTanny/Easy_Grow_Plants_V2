import React, { useState } from 'react';
import { Truck, Search, ChevronRight, CheckCircle, Package, AlertCircle } from 'lucide-react';

export default function ShipfastAdmin() {
    const [searchQuery, setSearchQuery] = useState('');
    
    // Simulating system-wide parcels using localStorage to share state with Merchant
    const [parcels, setParcels] = useState(() => {
        const saved = localStorage.getItem('shipfast_parcels');
        return saved ? JSON.parse(saved) : [];
    });

    React.useEffect(() => {
        localStorage.setItem('shipfast_parcels', JSON.stringify(parcels));
        
        const handleStorageChange = (e) => {
            if (e.key === 'shipfast_parcels') {
                setParcels(JSON.parse(e.newValue || '[]'));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [parcels]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            const query = searchQuery.trim().toLowerCase();
            // In a real app, API fetch happens here
        }
    };

    const handleStatusChange = (id, newStatus) => {
        setParcels(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    };

    const handleClearBill = (parcel) => {
        if(parcel.billCleared || (parcel.status !== 'Deliveried' && parcel.status !== 'Partial delivery')) return;

        const payableAmt = parcel.cod - parcel.charge;

        // Dispatch simulated event to update Merchant's UI balance locally
        // (In a real app, this updates standard database rows and the merchant polls/loads it)
        const event = new CustomEvent('admin_cleared_bill', { detail: { amount: payableAmt } });
        window.dispatchEvent(event);

        // Also persist balance
        const currentBalance = parseFloat(localStorage.getItem('shipfast_cleared_balance')) || 0;
        localStorage.setItem('shipfast_cleared_balance', (currentBalance + payableAmt).toString());

        setParcels(prev => prev.map(p => p.id === parcel.id ? { ...p, billCleared: true } : p));
        alert(`Bill Cleared! ৳${payableAmt} deposited to ${parcel.merchant}'s balance.`);
    };

    return (
        <div className="animate-fadeIn bg-gray-50/50 rounded-[40px] p-8 space-y-8 border border-gray-100 min-h-[700px]">
            <div className="bg-[#1B4332] p-6 rounded-[28px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border border-teal-900">
                <div className="flex items-center gap-4 text-white">
                    <div className="bg-white/20 p-3 rounded-2xl"><Truck className="w-6 h-6" /></div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter uppercase">ShipFast Admin Dashboard</h2>
                        <p className="text-[10px] font-black text-teal-200 uppercase tracking-widest mt-1">Courier Control Center</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#1B4332]" />
                        <input placeholder="Search Parcels globally..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearch} className="w-full pl-11 pr-4 py-3 bg-white/10 text-white placeholder-teal-200 rounded-xl focus:bg-white focus:text-gray-900 outline-none text-xs font-bold transition-all border-2 border-transparent" />
                        <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white text-[#1B4332] rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity"><ChevronRight className="w-3 h-3" /></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Consignments</p>
                        <p className="text-3xl font-black text-gray-900 tracking-tighter">{parcels.length}</p>
                    </div>
                    <div className="bg-blue-50 text-blue-600 p-4 rounded-xl shadow-inner"><Package className="w-6 h-6" /></div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Awaiting Bills</p>
                        <p className="text-3xl font-black text-orange-600 tracking-tighter">{parcels.filter(p => !p.billCleared && (p.status === 'Deliveried' || p.status === 'Partial delivery')).length}</p>
                    </div>
                    <div className="bg-orange-50 text-orange-600 p-4 rounded-xl shadow-inner"><AlertCircle className="w-6 h-6" /></div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total System Revenue</p>
                        <p className="text-3xl font-black text-green-600 tracking-tighter">৳{parcels.filter(p => p.billCleared).reduce((acc, p) => acc + p.charge, 0)}</p>
                    </div>
                    <div className="bg-green-50 text-green-600 p-4 rounded-xl shadow-inner"><CheckCircle className="w-6 h-6" /></div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] p-10 space-y-6 shadow-2xl border border-gray-100">
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase border-b border-gray-50 pb-6">Global Consignment Registry</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#1B4332] text-white">
                            <tr>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Parcel ID / Meta</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Merchant</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Pricing</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Delivery Status</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-right">Bill Clearance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {parcels.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-5">
                                        <p className="font-black text-sm text-gray-900">{p.id}</p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1">{p.date}</p>
                                    </td>
                                    <td className="p-5 font-bold text-xs text-gray-600">{p.merchant}</td>
                                    <td className="p-5">
                                        <p className="text-xs font-black text-[#1B4332]">COD: ৳{p.cod}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Charge: ৳{p.charge}</p>
                                    </td>
                                    <td className="p-5">
                                        <select 
                                            value={p.status} 
                                            onChange={(e) => handleStatusChange(p.id, e.target.value)}
                                            className="px-3 py-2 border-2 border-gray-100 rounded-lg text-[10px] font-black uppercase outline-none focus:border-[#1B4332]"
                                        >
                                            <option value="In Review">In Review</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Deliveried">Deliveried</option>
                                            <option value="Partial delivery">Partial delivery</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="p-5 text-right">
                                        {(p.status === 'Deliveried' || p.status === 'Partial delivery') ? (
                                            p.billCleared ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-2 rounded-lg"><CheckCircle className="w-3 h-3" /> Cleared</span>
                                            ) : (
                                                <button onClick={() => handleClearBill(p)} className="px-5 py-2 bg-[#1B4332] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md">Clear Bill</button>
                                            )
                                        ) : (
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
