import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Truck, Search, ChevronRight, Wallet, Bell, Plus, Headphones, List, DollarSign, ArrowLeft, Package, MapPin, Calendar, CheckCircle, RotateCcw, Send, User, Clock, Check, Box, Rocket, Copy, Phone, Edit } from 'lucide-react';

const DISTRICTS_DATA = {
    "Dhaka": ["Dhaka-North", "Dhaka-South", "Uttara", "Gulshan", "Bananai"],
    "Chittagong": ["Panchlaish", "Halishahar", "Kotwali"],
    "Rajshahi": ["Boalia", "Motihar", "Rajpara"]
};

export default function ShipfastMerchant({ userRole = 'merchant' }) {
    const [shipfastView, setShipfastView] = useState('main'); 
    
    // 4. Amount option: Cleared bills from admin will show here
    const [clearedBalance, setClearedBalance] = useState(() => {
        return parseFloat(localStorage.getItem('shipfast_cleared_balance')) || 0;
    });

    const [shipments, setShipments] = useState(() => {
        const saved = localStorage.getItem('shipfast_parcels');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('shipfast_parcels', JSON.stringify(shipments));
    }, [shipments]);
    
    const [parcelData, setParcelData] = useState({
        phone: '', name: '', address: '', district: '', thana: '', cod: '', note: ''
    });
    
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [newParcelId, setNewParcelId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedParcel, setSelectedParcel] = useState(null);
    const [idCopied, setIdCopied] = useState(false);
    const [consignmentTab, setConsignmentTab] = useState('In Review');
    
    // 5. Payment req: bKash account number
    const [paymentPhone, setPaymentPhone] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState('');
    
    // 6. Pickup req
    const [pickupAddress, setPickupAddress] = useState('House 45, Road 12, Sector 7, Uttara, Dhaka');
    const [editAddressMode, setEditAddressMode] = useState(false);
    const [pickupSuccess, setPickupSuccess] = useState('');

    useEffect(() => {
        // Sync custom events from admin if simulating inside the same browser window for testing
        const handleAdminClearBill = (e) => {
            const { amount } = e.detail;
            setClearedBalance(prev => prev + amount);
        };
        const handleStorageChange = (e) => {
            if (e.key === 'shipfast_parcels') {
                setShipments(JSON.parse(e.newValue || '[]'));
            }
            if (e.key === 'shipfast_cleared_balance') {
                setClearedBalance(parseFloat(e.newValue) || 0);
            }
        };
        window.addEventListener('admin_cleared_bill', handleAdminClearBill);
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('admin_cleared_bill', handleAdminClearBill);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleSearchParcel = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            const query = searchQuery.trim().toLowerCase();
            if (!query) return;
            const found = shipments.find(s => s.id.toLowerCase().includes(query) || (s.full_id && s.full_id.includes(query)));
            if (found) {
                setSelectedParcel(found);
                setShipfastView('parcel_detail');
            } else {
                toast.error("Parcel not found! Please check the ID.");
            }
        }
    };

    const handleShipfastSubmit = (e) => {
        e.preventDefault();
        const id = Math.floor(10000000 + Math.random() * 90000000).toString();
        const fullId = `SF-${id.slice(-4)}`;
        setNewParcelId(fullId);
        
        let charge = parcelData.district === 'Dhaka' ? 70 : 130;
        
        const newShipment = {
            id: fullId,
            full_id: id,
            date: new Date().toLocaleString(),
            customer: parcelData.name,
            cod: parseFloat(parcelData.cod) || 0,
            charge: charge,
            status: 'In Review',
            address: parcelData.address,
            thana: parcelData.thana,
            phone: parcelData.phone,
            merchant: 'Easy Grow Merchant',
            billCleared: false
        };
        setShipments(prev => [newShipment, ...prev]);
        setSuccessModalOpen(true);
        setParcelData({ phone: '', name: '', address: '', district: '', thana: '', cod: '', note: '' });
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(newParcelId);
        setIdCopied(true);
        setTimeout(() => setIdCopied(false), 2000);
    };

    const handlePaymentReq = () => {
        if(!paymentPhone) return toast("Please enter bKash number");
        setPaymentSuccess('Successful notification: Payment Request Sent!');
        setClearedBalance(0);
        localStorage.setItem('shipfast_cleared_balance', '0');
        setTimeout(() => setPaymentSuccess(''), 3000);
    };

    const handlePickupReq = () => {
        setPickupSuccess('Successful notification: Pickup Request Sent!');
        setTimeout(() => setPickupSuccess(''), 3000);
    };

    const tabs = ['In Review', 'Pending', 'Deliveried', 'Partial delivery', 'Cancelled'];

    return (
        <div className="animate-fadeIn bg-gray-50/50 rounded-[40px] p-8 space-y-8 border border-gray-100 min-h-[700px]">
            <div className="bg-white p-6 rounded-[28px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="bg-[#1B4332] p-3 rounded-2xl text-white"><Truck className="w-6 h-6" /></div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase">{userRole === 'admin' ? 'ShipFast Merchant' : 'ShipFast Courier'}</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Merchant Account</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group min-w-[250px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input placeholder="Search Consignment (ID)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearchParcel} className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl focus:bg-white focus:border-[#1B4332] outline-none text-xs font-bold transition-all border-2 border-transparent" />
                        <button onClick={handleSearchParcel} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#1B4332] text-white rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity"><ChevronRight className="w-3 h-3" /></button>
                    </div>
                </div>
            </div>

            {shipfastView === 'main' && (
                <div className="space-y-10 animate-fadeIn">
                    <div className="grid grid-cols-1 gap-6 max-w-lg mx-auto">
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Amount (Cleared Balance)</p>
                                <p className="text-3xl font-black text-gray-900 tracking-tighter">৳{clearedBalance.toFixed(2)}</p>
                            </div>
                            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-inner">Available</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        {[
                            { id: 'add_parcel', label: 'Add Parcel', icon: Plus },
                            { id: 'pickup_req', label: 'Pickup Req', icon: Truck },
                            { id: 'payment_req', label: 'Payment Req', icon: Wallet },
                            { id: 'consignments', label: 'Consignment', icon: List }
                        ].map((action, idx) => (
                            <button key={action.id} onClick={() => setShipfastView(action.id)} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-md flex flex-col items-center gap-5 group hover:scale-105 hover:shadow-2xl transition-all hover:bg-[#1B4332]/5 aspect-square justify-center text-center">
                                <div className="p-5 bg-teal-50 text-teal-600 rounded-[24px] group-hover:bg-[#1B4332] group-hover:text-white transition-all shadow-inner">
                                    <action.icon className="w-6 h-6 stroke-[1.5]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 group-hover:text-gray-900">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {shipfastView === 'add_parcel' && (
                <div className="bg-white rounded-[40px] p-10 space-y-10 shadow-2xl border border-gray-100 max-w-4xl mx-auto animate-scaleUp">
                    <div className="flex items-center gap-5 border-b border-gray-50 pb-6">
                        <button onClick={() => setShipfastView('main')} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-neutral-100"><ArrowLeft className="w-5 h-5" /></button>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Add Parcel</h3>
                    </div>
                    {successModalOpen ? (
                        <div className="text-center py-10 space-y-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600"><CheckCircle className="w-10 h-10" /></div>
                            <h4 className="text-xl font-black uppercase text-gray-900">Parcel Entry Successful!</h4>
                            <div className="flex items-center justify-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 mx-auto max-w-sm">
                                <span className="text-xl font-mono font-black text-[#1B4332]">{newParcelId}</span>
                                <button onClick={copyToClipboard} className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:text-nature-600 transition-colors">
                                    {idCopied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">Parcel ID generated and saved.</p>
                            <button onClick={() => setSuccessModalOpen(false)} className="px-8 py-3 bg-[#1B4332] text-white rounded-xl font-black uppercase text-xs mt-4">Add Another</button>
                        </div>
                    ) : (
                        <form onSubmit={handleShipfastSubmit} className="grid grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Phone</label>
                                <input required value={parcelData.phone} onChange={e => setParcelData({...parcelData, phone: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl" placeholder="Phone" />
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Name</label>
                                <input required value={parcelData.name} onChange={e => setParcelData({...parcelData, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl" placeholder="Full Name" />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</label>
                                <input required value={parcelData.address} onChange={e => setParcelData({...parcelData, address: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl" placeholder="Details" />
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">District Selection</label>
                                <select required value={parcelData.district} onChange={e => setParcelData({...parcelData, district: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl outline-none border-r-8 border-transparent">
                                    <option value="">Select District</option>
                                    {Object.keys(DISTRICTS_DATA).map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">City Selection (Thana)</label>
                                <select required disabled={!parcelData.district} value={parcelData.thana} onChange={e => setParcelData({...parcelData, thana: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl outline-none border-r-8 border-transparent">
                                    <option value="">Select City</option>
                                    {parcelData.district && DISTRICTS_DATA[parcelData.district].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">COD Amount</label>
                                <input required type="number" value={parcelData.cod} onChange={e => setParcelData({...parcelData, cod: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold" placeholder="৳0.00" />
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Note (Optional)</label>
                                <input value={parcelData.note} onChange={e => setParcelData({...parcelData, note: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl" placeholder="e.g. handle with care" />
                            </div>
                            <button className="col-span-2 w-full py-5 bg-[#1B4332] text-white rounded-xl font-black uppercase tracking-widest shadow-xl mt-4 hover:bg-black transition-all">Entry Parcel</button>
                        </form>
                    )}
                </div>
            )}

            {shipfastView === 'consignments' && (
                <div className="bg-white rounded-[40px] p-10 space-y-6 shadow-2xl border border-gray-100 max-w-6xl mx-auto animate-scaleUp">
                    <div className="flex items-center gap-5 border-b border-gray-50 pb-6">
                        <button onClick={() => setShipfastView('main')} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-neutral-100"><ArrowLeft className="w-5 h-5" /></button>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Consignment</h3>
                    </div>
                    
                    <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl w-fit overflow-x-auto max-w-full text-[10px] font-black uppercase tracking-widest border border-gray-100">
                        {tabs.map(t => (
                            <button key={t} onClick={() => setConsignmentTab(t)} className={`px-6 py-3 rounded-xl transition-all whitespace-nowrap ${consignmentTab === t ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                    
                    <div className="overflow-x-auto border border-gray-100 rounded-3xl mt-6">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-700">
                                <tr>
                                    <th className="p-4 text-[10px] font-black uppercase">Parcel ID</th>
                                    <th className="p-4 text-[10px] font-black uppercase">Date</th>
                                    <th className="p-4 text-[10px] font-black uppercase">Customer</th>
                                    <th className="p-4 text-[10px] font-black uppercase">COD</th>
                                    <th className="p-4 text-[10px] font-black uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shipments.filter(s => s.status.toLowerCase() === consignmentTab.toLowerCase()).length === 0 ? (
                                    <tr><td colSpan="5" className="p-10 text-center font-bold text-gray-400 uppercase tracking-widest">No Parcels in this category</td></tr>
                                ) : (
                                    shipments.filter(s => s.status.toLowerCase() === consignmentTab.toLowerCase()).map(s => (
                                        <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <td className="p-4 font-black">{s.id}</td>
                                            <td className="p-4 text-xs font-bold text-gray-500">{s.date}</td>
                                            <td className="p-4 text-xs font-bold">{s.customer}</td>
                                            <td className="p-4 text-sm font-black text-nature-700">৳{s.cod}</td>
                                            <td className="p-4"><span className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase">{s.status}</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {shipfastView === 'payment_req' && (
                <div className="bg-white rounded-[40px] p-10 space-y-8 shadow-2xl border border-gray-100 max-w-2xl mx-auto animate-scaleUp">
                    <div className="flex items-center gap-5 border-b border-gray-50 pb-6">
                        <button onClick={() => setShipfastView('main')} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-neutral-100"><ArrowLeft className="w-5 h-5" /></button>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Payment Req</h3>
                    </div>
                    {paymentSuccess && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-2xl border border-green-200 font-bold flex items-center gap-3">
                            <CheckCircle className="w-5 h-5" /> {paymentSuccess}
                        </div>
                    )}
                    <div className="space-y-6 text-center py-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available to Request</p>
                        <p className="text-4xl font-black text-gray-900">৳{clearedBalance.toFixed(2)}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">bKash Account Number</label>
                        <input value={paymentPhone} onChange={e => setPaymentPhone(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-[#1B4332] font-black" placeholder="01XXXXXXXXX" />
                    </div>
                    <button onClick={handlePaymentReq} className="w-full py-5 bg-[#1B4332] text-white rounded-xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Send Payment Req</button>
                </div>
            )}

            {shipfastView === 'pickup_req' && (
                <div className="bg-white rounded-[40px] p-10 space-y-8 shadow-2xl border border-gray-100 max-w-3xl mx-auto animate-scaleUp">
                    <div className="flex items-center gap-5 border-b border-gray-50 pb-6">
                        <button onClick={() => setShipfastView('main')} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-neutral-100"><ArrowLeft className="w-5 h-5" /></button>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Pickup Req</h3>
                    </div>
                    {pickupSuccess && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-2xl border border-green-200 font-bold flex items-center gap-3">
                            <CheckCircle className="w-5 h-5" /> {pickupSuccess}
                        </div>
                    )}
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200 flex justify-between items-center">
                        <div className="space-y-1 w-3/4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pickup Address</p>
                            {editAddressMode ? (
                                <textarea value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} className="w-full p-3 bg-white rounded-xl border border-gray-200 text-sm font-bold resize-none" />
                            ) : (
                                <p className="text-sm font-black text-gray-800">{pickupAddress}</p>
                            )}
                        </div>
                        <div>
                            {editAddressMode ? (
                                <button onClick={() => setEditAddressMode(false)} className="px-4 py-2 bg-[#1B4332] text-white rounded-xl text-[10px] font-black uppercase">Save</button>
                            ) : (
                                <button onClick={() => setEditAddressMode(true)} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-gray-300 transition-colors"><Edit className="w-3 h-3" /> Edit Address</button>
                            )}
                        </div>
                    </div>
                    <button onClick={handlePickupReq} className="w-full py-5 bg-[#1B4332] text-white rounded-xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Send Pickup Req</button>
                </div>
            )}

            {shipfastView === 'parcel_detail' && selectedParcel && (
                <div className="bg-white rounded-[40px] p-10 space-y-8 shadow-2xl border border-gray-100 max-w-3xl mx-auto animate-scaleUp">
                    <div className="flex items-center gap-5 border-b border-gray-50 pb-6">
                        <button onClick={() => setShipfastView('main')} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-neutral-100"><ArrowLeft className="w-5 h-5" /></button>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Parcel: {selectedParcel.id}</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                            <span className="text-sm font-black text-gray-900 uppercase">{selectedParcel.status}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</span>
                            <span className="text-sm font-black text-gray-900">{selectedParcel.customer}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">COD</span>
                            <span className="text-sm font-black text-nature-700">৳{selectedParcel.cod}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
