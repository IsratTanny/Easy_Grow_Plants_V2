import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { Plus, Package, Trash2, Edit3, TrendingUp, Tag, User, ShoppingCart, Search, XCircle, FileText, ShieldAlert, Bell, Wallet, Truck, MapPin, Monitor, Headphones, List, DollarSign, Cloud, PieChart, Edit, CheckCircle, RotateCcw, CreditCard, Send, Image as ImageIcon, ChevronRight, Clock, ArrowLeft, Copy, Phone, ExternalLink, Calendar, Check, Box, Rocket, Zap, X, Smartphone, Landmark } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ShipfastMerchant from '../components/shipfast/ShipfastMerchant';

const DISTRICTS_DATA = {
    "Dhaka": ["Dhaka-North", "Dhaka-South", "Uttara", "Gulshan", "Bananai", "Dhanmondi", "Mirpur", "Savar", "Gazipur", "Narayanganj"],
    "Chittagong": ["Panchlaish", "Halishahar", "Kotwali", "Bakalia", "Bayezid", "Chandgaon", "Double Mooring", "Pahartali"],
    "Rajshahi": ["Boalia", "Motihar", "Rajpara", "Shah Makdum", "Paba"],
    "Sylhet": ["Sylhet Sadar", "Beanibazar", "Golapganj", "Zakiganj", "Kanaighat"],
    "Khulna": ["Khulna Sadar", "Daulatpur", "Khalishpur", "Khan Jahan Ali", "Sonadanga"],
    "Barisal": ["Barisal Sadar", "Bakerajanj", "Babuganj", "Gournadi", "Mehendiganj"],
    "Rangpur": ["Rangpur Sadar", "Badarganj", "Mithapukur", "Pirganj", "Taraganj"],
    "Mymensingh": ["Mymensingh Sadar", "Muktagacha", "Bhaluka", "Gaffargaon", "Trishal"],
    "Cumilla": ["Cumilla Sadar", "Adarsha Sadar", "Barura", "Brahmanpara", "Burichang"],
    "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sripur"]
};

// Helper to format date: DD-MM-YYYY | HH:MM AM/PM
const formatRegDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hStr = String(hours).padStart(2, '0');
    return `${day}-${month}-${year} | ${hStr}:${minutes} ${ampm}`;
};


// Advanced PDF Receipt Generator
const generatePDFReceipt = (order, sellerName) => {
    const doc = new jsPDF();
    const primaryColor = [20, 83, 45]; // nature-900

    // Header Background
    doc.setFillColor(245, 249, 246);
    doc.rect(0, 0, 210, 40, 'F');

    // Branding
    doc.setFontSize(26);
    doc.setTextColor(20, 83, 45);
    doc.setFont('helvetica', 'bold');
    doc.text('Easy Grow Plants', 105, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(30, 80, 45);
    doc.text('Smart Care for Your Urban Jungle', 105, 26, { align: 'center' });

    // Official Receipt Badge
    doc.setFillColor(20, 83, 45);
    doc.roundedRect(155, 10, 45, 12, 2, 2, 'F');
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL RECEIPT', 177.5, 17.5, { align: 'center' });

    // Nature Accent Line
    doc.setDrawColor(20, 83, 45);
    doc.setLineWidth(1.5);
    doc.line(10, 40, 200, 40);

    // Order & Customer Details Section
    doc.setTextColor(0);
    doc.setFontSize(10);

    // Left side: Order Info
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER INFORMATION', 10, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order ID: #${order.id}`, 10, 58);
    doc.text(`Ordered Date & Time: ${formatRegDate(order.created_at)}`, 10, 64);
    doc.text(`Seller Name: ${sellerName || 'Easy Grow Seller'}`, 10, 70);

    // Right side: Customer Info
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER DETAILS', 120, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(`Customer Name: ${order.customer_name || order.user_username || 'Valued Buyer'}`, 120, 58);
    doc.text(`Phone: ${order.phone || 'N/A'}`, 120, 64);
    doc.text(`Full Address: ${order.address || 'N/A'}`, 120, 70, { maxWidth: 80 });

    // Billing Table
    const itemRows = order.items?.map(it => [
        `${it.plant_name} (${it.price} TK)`,
        it.quantity,
        `${(it.quantity * it.price).toFixed(2)} TK`
    ]) || [];

    const itemSubtotal = order.items?.reduce((sum, it) => sum + (it.price * it.quantity), 0) || 0;
    const deliveryCharge = parseFloat(order.delivery_charge || 70);
    const totalAmount = itemSubtotal + deliveryCharge;

    autoTable(doc, {
        startY: 85,
        head: [['Product Description (Price)', 'Qty', 'Amount']],
        body: [
            ...itemRows,
            [{ content: 'Delivery Charge', colSpan: 2, styles: { fontStyle: 'italic', textColor: [100, 100, 100], halign: 'right' } }, `${deliveryCharge.toFixed(2)} TK`],
            [{ content: 'Total Bill', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 249, 246], halign: 'right' } }, { content: `${totalAmount.toFixed(2)} TK`, styles: { fontStyle: 'bold', fillColor: [245, 249, 246] } }]
        ],
        theme: 'grid',
        headStyles: { fillColor: primaryColor, fontStyle: 'bold', fontSize: 10 },
        styles: { fontSize: 9, cellPadding: 5, font: 'helvetica' },
        columnStyles: { 2: { halign: 'right' } },
        margin: { left: 10, right: 10 }
    });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(20, 83, 45);
    doc.setFont('helvetica', 'bold');
    doc.text('Thank you for shopping with Easy Grow Plants!', 105, 285, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'normal');
    doc.text('This is an official computer-generated receipt.', 105, 292, { align: 'center' });

    doc.save(`Receipt_EasyGrow_Order_${order.id}.pdf`);
};

const CATEGORIES = [
    "Aglonema", "Alocasia", "Anthurium", "Begonia", "Bonsai", "Cactus", "Calathea",
    "Dracena", "Ficus", "Fittonia", "Monstera", "Peperomia", "Philodendron",
    "Pothos", "Sansevieria", "Succulent", "Syngonium", "ZZ Plant", "Air Plant"
];

export default function SellerDashboard() {
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        plant_name: '', stock_quantity: 0, price: 0, buying_price: 0, description: '', category: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [activeTab, setActiveTab] = useState('inventory');
    const [orders, setOrders] = useState([]);
    const [enlargedImage, setEnlargedImage] = useState(null);

    // ShipFast State
    const [shipfastView, setShipfastView] = useState('main'); // main, add_parcel, pickup, consignments, payments, support
    const [shipments, setShipments] = useState([
        { id: 'SF-9921', date: '2024-03-08 10:30 AM', customer: 'Ariful Islam', cod: 1200, charge: 100, status: 'unassigned' },
        { id: 'SF-9922', date: '2024-03-08 11:45 AM', customer: 'Saima Akter', cod: 850, charge: 70, status: 'unassigned' }
    ]);
    const [pickupPoints, setPickupPoints] = useState([
        { id: 1, name: 'Home Warehouse', address: 'House 45, Road 12, Sector 7, Uttara, Dhaka', phone: '01712345678', hub: 'Uttara Hub' }
    ]);
    const [tickets, setTickets] = useState([
        { id: 'TIC-102', issue: 'Payment Delay', status: 'active', lastMsg: 'We are checking your bank details.' }
    ]);
    const [selectedTicket, setShipfastTicket] = useState(null);
    const [parcelData, setParcelData] = useState({
        phone: '', name: '', address: '', district: '', thana: '',
        deliveryType: 'home', cod: '', invoice: '', description: '', weight: '', instruction: ''
    });
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [newParcelId, setNewParcelId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedParcel, setSelectedParcel] = useState(null);
    const [idCopied, setIdCopied] = useState(false);
    const [pickupRequests, setPickupRequests] = useState([]);
    const [pickupModalOpen, setPickupModalOpen] = useState(false);
    const [editAddressMode, setEditAddressMode] = useState(false);
    const [registeredPickupAddress, setRegisteredPickupAddress] = useState('11/159, Dream Garden 1, Samadnagar, Kajla, van sojib');
    const [tempPickupAddress, setTempPickupAddress] = useState('11/159, Dream Garden 1, Samadnagar, Kajla, van sojib');
    const [pickupDistrict, setPickupDistrict] = useState('Dhaka City');
    const [pickupThana, setPickupThana] = useState('Jatrabari');
    const [estimatedParcels, setEstimatedParcels] = useState('');
    const [pickupNote, setPickupNote] = useState('');
    const [selectedPickupRequest, setSelectedPickupRequest] = useState(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMsg, setToastMsg] = useState('Action Completed Successfully!');
    const [pickupLoading, setPickupLoading] = useState(false);
    const [selectedPickupService, setSelectedPickupService] = useState('Regular');

    // Payment States
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [currentPaymentMethod, setCurrentPaymentMethod] = useState(null);
    const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
    const [paymentRequestLoading, setPaymentRequestLoading] = useState(false);
    const [paymentMethodForm, setPaymentMethodForm] = useState({
        provider: 'bKash',
        account_number: '',
        account_details: '',
        is_default: true
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            // Fetch User first for safety and display
            const userRes = await api.get('/auth/me/');

            // Safety: If not a seller, redirect
            if (userRes.data.role !== 'seller') {
                navigate('/dashboard');
                return;
            }

            setUser(userRes.data);

            const res = await api.get('/plants/my-plants/');
            setPlants(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/');
            setOrders(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Orders error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'orders') fetchOrders();
        else if (activeTab === 'shipfast') {
            fetchPickupRequests();
            fetchPaymentMethods();
        }
    }, [activeTab]);

    const fetchPickupRequests = async () => {
        try {
            const res = await api.get('shipfast-requests/');
            const formatted = res.data.map(req => ({
                id: req.request_id,
                date: new Date(req.created_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
                address: req.pickup_address,
                status: req.status,
                rider: req.rider || 'Unassigned',
                parcels: req.estimated_parcels,
                note: req.note,
                serviceType: req.service_type
            }));
            setPickupRequests(formatted);
        } catch (err) { }
    };

    const fetchPaymentMethods = async () => {
        try {
            const res = await api.get('seller-payment-methods/');
            setPaymentMethods(res.data);
            const defaultMethod = res.data.find(m => m.is_default);
            setCurrentPaymentMethod(defaultMethod || res.data[0] || null);
        } catch (err) { }
    };

    const handleAddPaymentMethod = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('seller-payment-methods/', paymentMethodForm);
            setToastMsg("Payment Method Added Successfully!");
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
            setShowAddPaymentModal(false);
            fetchPaymentMethods();
            setPaymentMethodForm({
                provider: 'bKash',
                account_number: '',
                account_details: '',
                is_default: true
            });
        } catch (err) {
            setToastMsg("Failed to add payment method");
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        }
    };

    const handleSelectPaymentMethod = async (method) => {
        try {
            await api.patch(`seller-payment-methods/${method.id}/`, { is_default: true });
            fetchPaymentMethods();
            setToastMsg(`${method.provider} set as current payment method`);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (err) { }
    };

    const handlePaymentRequest = async () => {
        if (!currentPaymentMethod) {
            setToastMsg("Please add a payment method first");
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
            return;
        }
        setPaymentRequestLoading(true);
        try {
            await api.post('payment-requests/', { payment_method: currentPaymentMethod.id });
            setToastMsg("Successfully request send");
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (err) {
            setToastMsg("Payment request failed");
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } finally {
            setPaymentRequestLoading(false);
        }
    };

    const handleOrderStatusChange = async (orderId, newStatus) => {
        try {
            await api.patch(`/orders/${orderId}/`, { status: newStatus });
            setOrders(prev => {
                const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
                if (newStatus === 'completed') {
                    const targetOrder = updated.find(o => o.id === orderId);
                    if (targetOrder) generatePDFReceipt(targetOrder, user?.full_name || user?.username);
                }
                return updated;
            });
        } catch (err) { console.error(err); }
    };

    const handleSeeMoreOrders = () => {
        setOrders(prev => [...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    };

    const handleShipfastSubmit = (e) => {
        e.preventDefault();
        const id = Math.floor(10000000 + Math.random() * 90000000).toString();
        setNewParcelId(id);

        // Add to local shipments list for simulation
        const newShipment = {
            id: `SF-${id.slice(-4)}`,
            full_id: id,
            date: new Date().toLocaleString(),
            customer: parcelData.name,
            cod: parseFloat(parcelData.cod) || 0,
            charge: 70,
            status: 'pending',
            address: parcelData.address,
            thana: parcelData.thana,
            phone: parcelData.phone,
            timeline: [
                { time: new Date().toLocaleString(), status: 'Consignment Created successfully.' }
            ]
        };
        setShipments(prev => [newShipment, ...prev]);
        setSuccessModalOpen(true);
    };

    const handleSearchParcel = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            const query = searchQuery.trim().toLowerCase();
            if (!query) return;

            // Find in local shipments (simulate database search)
            const found = shipments.find(s =>
                s.id.toLowerCase().includes(query) ||
                (s.full_id && s.full_id.includes(query))
            );

            if (found) {
                setSelectedParcel(found);
                setShipfastView('parcel_detail');
            } else {
                toast.error("Parcel not found! Please check the ID.");
            }
        }
    };

    const handleAddPlant = async (e) => {
        e.preventDefault();
        try {
            const payload = new FormData();
            payload.append('plant_name', formData.plant_name);
            payload.append('stock_quantity', formData.stock_quantity);
            payload.append('price', formData.price);
            payload.append('buying_price', formData.buying_price);
            payload.append('description', formData.description);
            payload.append('category', formData.category);

            if (imageFile) {
                payload.append('image_url', imageFile);
            }

            if (formData.id) {
                await api.put(`/plants/${formData.id}/`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/plants/', payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setShowForm(false);
            setFormData({ plant_name: '', stock_quantity: 0, price: 0, buying_price: 0, description: '', category: '' });
            setImageFile(null);
            setImagePreview(null);
            fetchInventory();
        } catch (err) { console.error(err); }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleEdit = (plant) => {
        setFormData({
            id: plant.id,
            plant_name: plant.plant_name,
            stock_quantity: plant.stock_quantity,
            price: plant.price,
            buying_price: plant.buying_price || 0,
            description: plant.description,
            category: plant.category
        });
        setImagePreview(plant.image_url);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this listing?")) return;
        try {
            await api.delete(`/plants/${id}/`);
            fetchInventory();
        } catch (err) { console.error(err); }
    };

    const stats = [
        { label: 'Total Listings', value: plants?.length || 0, icon: Package, color: 'text-blue-500' },
        { label: 'Total Stock', value: plants?.reduce((acc, p) => acc + (parseInt(p.stock_quantity) || 0), 0) || 0, icon: TrendingUp, color: 'text-green-500' },
    ];

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        {user ? `${t('hello') || 'Hello'}, ${user.full_name || user.username}` : t('sellerDashboard')}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="flex items-center gap-2 text-[10px] font-black text-[#2D6A4F] uppercase tracking-widest bg-[#2D6A4F]/5 px-4 py-2 rounded-full border border-[#2D6A4F]/10 w-fit">
                            <span className="w-2 h-2 bg-[#2D6A4F] rounded-full animate-pulse"></span>
                            BOTANICAL MERCHANT DASHBOARD ACTIVE [v2.0]
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/profile"
                        className="btn bg-white text-gray-700 border-gray-200 hover:bg-nature-50 hover:text-nature-700 flex items-center gap-2 transition-all shadow-sm font-black uppercase text-[10px] tracking-widest px-6"
                    >
                        <User className="w-4 h-4" /> {t('profile')}
                    </Link>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`btn ${showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-nature-900 text-white hover:bg-black'} flex items-center gap-2 transition-all font-black uppercase text-[10px] tracking-widest px-6 shadow-xl active:scale-95`}
                    >
                        {showForm ? t('cancel') : <><Plus className="w-4 h-4" /> {t('addNewListing')}</>}
                    </button>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-[24px] w-fit border border-gray-200 shadow-inner">

                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex items-center gap-2 px-10 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-nature-900 shadow-xl border border-nature-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}
                >
                    <Package className="w-4 h-4" /> {t('inventory')}
                </button>
                <button
                    onClick={() => setActiveTab('shipfast_merchant')}
                    className={`flex items-center gap-2 px-10 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'shipfast_merchant' ? 'bg-[#1B4332] text-white shadow-xl' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}
                >
                    <Truck className="w-4 h-4" /> {t('shipfastMerchant')}
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-2 px-10 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-white text-nature-900 shadow-xl border border-nature-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}
                >
                    <ShoppingCart className="w-4 h-4" /> {t('orderManagement')}
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="card p-8 flex items-center justify-between border-2 border-transparent hover:border-nature-100 transition-all group">
                        <div>
                            <p className="text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest">{stat.label}</p>
                            <p className="text-3xl font-black text-gray-900 group-hover:text-nature-900 transition-colors tracking-tighter">{stat.value}</p>
                        </div>
                        <div className={`p-4 rounded-3xl group-hover:scale-110 transition-transform ${stat.color} bg-gray-50 shadow-inner`}>
                            <stat.icon className="w-8 h-8" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            {!loading && activeTab === 'inventory' && (
                <div className="space-y-6 animate-fadeIn">
                    {showForm && (
                        <div className="card p-10 bg-nature-50 border-nature-200 animate-slideDown shadow-2xl relative overflow-hidden">
                            <h3 className="text-2xl font-black mb-10 flex items-center gap-2 text-nature-900 uppercase tracking-tighter">
                                <Plus className="w-8 h-8 p-1.5 bg-nature-900 text-white rounded-xl" /> {t('createNewListing')}
                            </h3>
                            <form onSubmit={handleAddPlant} className="grid md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] uppercase font-black text-nature-800 mb-2 px-2 tracking-widest">{t('plantName')}</label>
                                        <input required className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-900 outline-none transition-all font-bold" placeholder="e.g. Monstera Deliciosa" value={formData.plant_name} onChange={e => setFormData({ ...formData, plant_name: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] uppercase font-black text-nature-800 mb-2 px-2 tracking-widest">{t('sellingPrice')} (৳)</label>
                                            <input required type="number" className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-900 outline-none transition-all font-bold" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-black text-nature-800 mb-2 px-2 tracking-widest">{t('stockUnits')}</label>
                                            <input required type="number" className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-900 outline-none transition-all font-bold" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-black text-nature-800 mb-2 px-2 tracking-widest">{t('categories')}</label>
                                        <select required className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold bg-white" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                            <option value="" disabled>Select Category</option>
                                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-black text-nature-800 mb-2 px-2 tracking-widest">{t('uploadImage')}</label>
                                        <input type="file" accept="image/*" className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl" onChange={handleImageChange} />
                                        {imagePreview && (
                                            <div className="mt-4 relative h-40 rounded-2xl border-2 border-nature-100 flex items-center justify-center bg-white"><img src={imagePreview} alt="Preview" className="h-full object-contain p-2" /></div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-nature-800 mb-2 px-2 tracking-widest">{t('description')}</label>
                                    <textarea required rows="14" className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <button className="btn bg-nature-900 text-white py-5 font-black uppercase tracking-widest rounded-[20px] md:col-span-2 shadow-2xl hover:bg-black">{t('launchListing')}</button>
                            </form>
                        </div>
                    )}

                    <div className="card overflow-hidden shadow-2xl border-none bg-white rounded-[32px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-nature-900 border-b-4 border-nature-800 text-nature-100">
                                    <tr>
                                        <th className="p-6 font-black text-[10px] uppercase tracking-widest">{t('product')}</th>
                                        <th className="p-6 font-black text-[10px] uppercase tracking-widest">{t('categories')}</th>
                                        <th className="p-6 font-black text-[10px] uppercase tracking-widest">{t('stockStatus')}</th>
                                        <th className="p-6 font-black text-[10px] uppercase tracking-widest">{t('unitPrice')}</th>
                                        <th className="p-6 font-black text-[10px] uppercase tracking-widest text-right">{t('settings')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {plants.length === 0 ? (
                                        <tr><td colSpan="5" className="p-20 text-center"><Package className="w-20 h-20 text-gray-100 mx-auto mb-6" /><h4 className="text-2xl font-black text-gray-300">Garden is Empty</h4></td></tr>
                                    ) : (
                                        plants.map(p => (
                                            <tr key={p.id} className="hover:bg-nature-50/30">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-16 h-16 rounded-[20px] bg-gray-50 overflow-hidden border border-gray-100"><img src={p.image_url} className="w-full h-full object-cover" alt={p.plant_name} /></div>
                                                        <div><p className="font-black text-lg">{p.plant_name}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.description}</p></div>
                                                    </div>
                                                </td>
                                                <td className="p-6"><span className="text-[10px] font-black uppercase text-nature-800 bg-nature-50 px-4 py-2 rounded-xl">{p.category}</span></td>
                                                <td className="p-6"><span className="text-[11px] font-black uppercase">{p.stock_quantity} {t('unitsAvailable')}</span></td>
                                                <td className="p-6 font-black text-nature-900 text-xl">৳{p.price}</td>
                                                <td className="p-6 text-right">
                                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100">
                                                        <button
                                                            onClick={() => handleEdit(p)}
                                                            className="p-4 bg-nature-50 text-nature-600 rounded-2xl hover:bg-nature-900 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Edit3 className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(p.id)} className="p-3 bg-red-50 text-red-300"><Trash2 className="w-5 h-5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'shipfast_merchant' && (
                <div className="card shadow-xl border-none">
                    <ShipfastMerchant userRole="seller" />
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="space-y-6">
                    {/* Latest Order Banner */}
                    <div className="bg-nature-900 p-8 rounded-[32px] flex items-center justify-between shadow-2xl border border-white/10 animate-fadeIn overflow-hidden relative group">
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-16 h-16 bg-white/10 rounded-[24px] flex items-center justify-center border border-white/20 backdrop-blur-md">
                                <ShoppingCart className="text-nature-400 w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{t('salesActivity')}</h2>
                                <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-2">{t('manageOrdersDesc') || 'Manage your plant orders and customer fulfillments'}</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchOrders}
                            className="px-10 py-4 bg-white text-nature-900 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                        >
                            {t('refreshFeed')}
                        </button>
                    </div>

                    <div className="card overflow-hidden shadow-2xl border-none bg-white rounded-[32px]">
                        <div className="p-8 border-b border-gray-100 bg-nature-50/50 flex justify-between items-center">
                            <h2 className="text-xl font-black flex items-center gap-3 text-nature-900 uppercase tracking-tighter">
                                <Package className="text-nature-700 w-6 h-6" /> {t('merchantOrderRegistry')}
                            </h2>
                            <span className="text-[10px] px-4 py-2 bg-white rounded-xl border border-gray-100 font-black text-gray-400 uppercase tracking-widest shadow-sm">
                                {orders.length} ACTIVE RECORDS
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-nature-900 border-b-4 border-nature-800 text-nature-100">
                                    <tr>
                                        <th className="p-6 font-black text-[10px] uppercase tracking-widest text-center">#</th>
                                        <th className="p-6 font-black text-[10px] uppercase tracking-widest">{t('trackingId')}</th>
                                        <th className="p-6 font-black text-[10px] uppercase tracking-widest">{t('buyerInfo')}</th>
                                        <th className="p-6 font-black text-[10px] uppercase tracking-widest">{t('orderDetails')}</th>
                                        <th className="p-6 font-black text-[10px] uppercase tracking-widest">{t('transactionDate')}</th>
                                        <th className="p-6 font-black text-[10px] uppercase tracking-widest">{t('amount')}</th>
                                        <th className="p-6 font-black text-[10px] uppercase tracking-widest text-right">{t('fulfillment')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-20 text-center">
                                                <div className="max-w-xs mx-auto opacity-20">
                                                    <ShoppingCart className="w-20 h-20 mx-auto mb-4" />
                                                </div>
                                                <h4 className="text-2xl font-black text-gray-300 uppercase tracking-widest">{t('noSalesYet')}</h4>
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((o, index) => (
                                            <tr key={o.id} className="hover:bg-nature-50/30 transition-all group">
                                                <td className="p-6 text-center font-black text-gray-300 group-hover:text-nature-600">{index + 1}</td>
                                                <td className="p-6 font-black text-gray-800">#{o.id}</td>
                                                <td className="p-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-nature-900 uppercase tracking-tight">{o.customer_name || o.user_username || 'Valued Buyer'}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 font-mono mt-1">{o.phone || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex -space-x-3 hover:space-x-1 transition-all">
                                                        {o.items?.map((it, idx) => (
                                                            <div key={idx} className="relative group/item">
                                                                <img
                                                                    src={it.plant_image || '/placeholder.png'}
                                                                    className="w-10 h-10 rounded-[14px] object-cover ring-4 ring-white shadow-lg border border-gray-100 cursor-pointer hover:z-20 hover:scale-125 transition-all"
                                                                    alt="P"
                                                                    onClick={() => setEnlargedImage(it.plant_image)}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-[11px] font-black text-gray-500 uppercase">{formatRegDate(o.created_at)}</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-lg font-black text-nature-900">৳{o.total_bill}</span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex flex-col items-end gap-2">
                                                        <select
                                                            value={o.status}
                                                            onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                                                            className={`text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border-2 transition-all outline-none 
                                                                ${o.status === 'completed' ? 'bg-nature-900 text-white border-nature-900 shadow-lg' :
                                                                    o.status === 'delivered' ? 'bg-green-600 text-white border-green-600 shadow-lg' :
                                                                        'bg-white text-gray-700 border-gray-100 hover:border-nature-600 cursor-pointer shadow-sm'}`}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="delivered">Delivered</option>
                                                            <option value="completed">Completed</option>
                                                        </select>
                                                        {o.status === 'completed' && (
                                                            <button
                                                                onClick={() => generatePDFReceipt(o, user?.full_name)}
                                                                className="flex items-center gap-1.5 text-[9px] font-black uppercase text-nature-600 hover:text-nature-900 transition-colors tracking-widest mt-1 group-hover:scale-110"
                                                            >
                                                                <FileText className="w-4 h-4" /> {t('downloadReceipt')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'shipfast' && (
                <div className="animate-fadeIn min-h-[700px] bg-gray-50/50 rounded-[40px] p-8 space-y-8 border border-gray-100">
                    {/* ShipFast Header */}
                    <div className="bg-white p-6 rounded-[28px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-100">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="bg-[#1B4332] p-3 rounded-2xl text-white">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">ShipFast Courier</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Merchant Logistics Portal</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <div className="relative group min-w-[250px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#1B4332] transition-colors" />
                                <input
                                    placeholder="Search Consignment (ID)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchParcel}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[#1B4332] outline-none text-xs font-bold transition-all"
                                />
                                <button
                                    onClick={handleSearchParcel}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#1B4332] text-white rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity"
                                >
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase text-gray-700 hover:bg-white hover:text-[#2D6A4F] transition-all whitespace-nowrap">
                                <Wallet className="w-4 h-4" /> Check Balance
                            </button>
                            <button className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 transition-all relative">
                                <Bell className="w-5 h-5" />
                                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
                            </button>
                        </div>
                    </div>

                    {shipfastView === 'main' && (
                        <div className="space-y-10 animate-fadeIn">
                            {/* Status Indicators (Top Row) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pending Payment</p>
                                        <p className="text-3xl font-black text-gray-900 tracking-tighter">৳0.00</p>
                                    </div>
                                    <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-inner">Processing</div>
                                </div>
                                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Successfully Paid</p>
                                        <p className="text-3xl font-black text-gray-900 tracking-tighter">৳12,450.00</p>
                                    </div>
                                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-inner">Paid</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                                {[
                                    { id: 'add_parcel', label: 'Add Parcel', icon: Plus },
                                    { id: 'pickup_request', label: 'Pickup Request', icon: Truck },
                                    { id: 'payments_req', label: 'Payment Request', icon: Wallet },
                                    { id: 'support', label: 'Support', icon: Headphones }
                                ].map(action => (
                                    <button
                                        key={action.id}
                                        onClick={() => setShipfastView(action.id === 'pick_drop' ? 'main' : action.id)}
                                        className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-md flex flex-col items-center gap-5 group hover:scale-105 hover:shadow-2xl transition-all hover:bg-[#1B4332]/5 aspect-square justify-center"
                                    >
                                        <div className="p-5 bg-teal-50 text-teal-600 rounded-[24px] group-hover:bg-[#1B4332] group-hover:text-white transition-all shadow-inner">
                                            <action.icon className="w-6 h-6 stroke-[1.5]" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 group-hover:text-gray-900 text-center leading-tight">{action.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Management Row (Colored Backgrounds) */}
                            <div className="flex flex-wrap gap-4 p-2 bg-teal-50/50 rounded-[32px] border border-teal-100/50">
                                {[
                                    { id: 'consignments', label: 'Consignments', icon: List },
                                    { id: 'payments', label: 'Payments', icon: DollarSign }
                                ].map((act, i) => (
                                    <button
                                        key={i}
                                        onClick={() => act.id ? setShipfastView(act.id) : null}
                                        className="flex-1 min-w-[140px] flex items-center justify-center gap-3 px-8 py-5 bg-teal-100/40 border border-teal-200/50 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-[#1B4332] hover:bg-[#1B4332] hover:text-white hover:shadow-lg transition-all"
                                    >
                                        <act.icon className="w-4 h-4" /> {act.label}
                                    </button>
                                ))}
                            </div>

                        </div>
                    )}

                    {shipfastView === 'parcel_detail' && selectedParcel && (
                        <div className="bg-gray-50/50 rounded-[40px] p-8 space-y-8 animate-scaleUp">
                            {/* Detailed Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setShipfastView('main')} className="p-3 bg-white text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Parcel Id: #{selectedParcel.full_id || selectedParcel.id}</h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-[10px] font-black text-[#1B4332] uppercase tracking-[0.2em] bg-teal-50 px-3 py-1 rounded-full border border-teal-100">Safe Delivery Active</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="flex items-center gap-2 px-5 py-3 bg-teal-50 text-[#1B4332] rounded-xl text-[9px] font-black uppercase tracking-widest border border-teal-100/50 hover:bg-[#1B4332] hover:text-white transition-all">
                                        <Headphones className="w-3.5 h-3.5" /> Support Ticket
                                    </button>
                                    <button className="p-3 bg-white text-gray-400 rounded-xl border border-gray-100 hover:text-[#1B4332] transition-colors shadow-sm">
                                        <FileText className="w-4 h-4" />
                                    </button>
                                    <button className="p-3 bg-white text-gray-400 rounded-xl border border-gray-100 hover:text-[#1B4332] transition-colors shadow-sm">
                                        <Tag className="w-4 h-4" />
                                    </button>
                                    <button className="p-3 bg-white text-gray-400 rounded-xl border border-gray-100 hover:text-[#1B4332] transition-colors shadow-sm">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-3 gap-8">
                                {/* Left/Center Section: Parcel Info */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl space-y-10">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-4 h-4 text-gray-300" />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Created at: <span className="text-gray-900">{selectedParcel.date}</span></span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle className="w-4 h-4 text-[#1B4332]" />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Approved at: <span className="text-gray-900">Processing...</span></span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-5 py-2.5 bg-yellow-50 text-yellow-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-200">
                                                    {selectedParcel.status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tracking Link</p>
                                                <p className="text-sm font-black text-[#1B4332] flex items-center gap-2 cursor-pointer hover:underline">
                                                    {selectedParcel.id} <ExternalLink className="w-3 h-3" />
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">COD Price</p>
                                                <p className="text-4xl font-black text-gray-900 tracking-tighter">৳ {selectedParcel.cod}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 pt-4">
                                            <button className="w-full py-6 bg-teal-50 text-[#1B4332] rounded-[24px] font-black text-[10px] uppercase tracking-widest border border-teal-100 hover:bg-teal-100 transition-all flex items-center justify-center gap-3">
                                                <RotateCcw className="w-4 h-4" /> Create Return Request
                                            </button>
                                            <button className="w-full py-6 bg-[#1B4332] text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:shadow-[#1B4332]/40 transition-all flex items-center justify-center gap-3">
                                                <DollarSign className="w-4 h-4" /> Pay With bKash
                                            </button>
                                        </div>

                                        <div className="pt-10 border-t border-gray-50">
                                            <h4 className="text-[11px] font-black text-[#1B4332] uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                                <User className="w-4 h-4" /> Recipient Details
                                            </h4>
                                            <div className="grid grid-cols-2 gap-10">
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Recipient Name</label>
                                                        <p className="text-sm font-black text-gray-900">{selectedParcel.customer || selectedParcel.name || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Police Station (Thana)</label>
                                                        <p className="text-sm font-black text-gray-900">{selectedParcel.thana || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Full Delivery Address</label>
                                                        <p className="text-sm font-bold text-gray-600 leading-relaxed">{selectedParcel.address || 'Address detail not provided'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Phone Number</label>
                                                        <div className="flex items-center gap-4">
                                                            <p className="text-sm font-black text-gray-900">{selectedParcel.phone || 'N/A'}</p>
                                                            <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                                <Phone className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Tracking Timeline */}
                                <div className="space-y-8">
                                    <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl h-full flex flex-col">
                                        <h4 className="text-[11px] font-black text-[#1B4332] uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                                            <List className="w-4 h-4" /> Tracking Updates
                                        </h4>
                                        <div className="flex-1 space-y-12 relative pl-8">
                                            {/* Timeline Vertical Line */}
                                            <div className="absolute left-[3.5px] top-4 bottom-4 w-[1.5px] bg-blue-50"></div>

                                            {(selectedParcel.timeline || [
                                                { time: selectedParcel.date, status: 'Consignment Created successfully.' }
                                            ]).map((log, i) => (
                                                <div key={i} className="relative">
                                                    {/* Node */}
                                                    <div className="absolute -left-[32.5px] top-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10"></div>
                                                    <div className="space-y-2">
                                                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">{log.time}</p>
                                                        <p className="text-xs font-black text-gray-800 leading-relaxed">{log.status}</p>
                                                        {i === 1 && (
                                                            <p className="text-[10px] font-bold text-gray-400 mt-2 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">Dispatch ID: 12433227</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Static Simulation Node */}
                                            {selectedParcel.status === 'pending' && (
                                                <div className="opacity-30 relative grayscale">
                                                    <div className="absolute -left-[32.5px] top-1.5 w-2 h-2 rounded-full bg-gray-300 z-10"></div>
                                                    <div className="space-y-2">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">NEXT PHASE</p>
                                                        <p className="text-xs font-black text-gray-400">Parcel Pickup & Hub Dispatch</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {shipfastView === 'add_parcel' && (
                        <div className="bg-white rounded-[40px] p-10 space-y-10 animate-scaleUp shadow-2xl border border-gray-100 max-w-6xl mx-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-50 pb-8">
                                <div className="flex items-center gap-5">
                                    <button
                                        onClick={() => setShipfastView('main')}
                                        className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all shadow-inner group"
                                    >
                                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                    </button>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">New Consignment</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Create fresh delivery request</p>
                                    </div>
                                </div>
                                <div className="px-6 py-2 bg-teal-50 text-[#1B4332] text-[10px] font-black uppercase tracking-widest rounded-full border border-teal-100 shadow-sm">
                                    Safe Delivery Protocol
                                </div>
                            </div>

                            <form className="grid lg:grid-cols-2 gap-16" onSubmit={handleShipfastSubmit}>
                                {/* Left Column: Recipient Info */}
                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <h4 className="flex items-center gap-3 text-[11px] font-black text-[#1B4332] uppercase tracking-[0.3em] pl-1">
                                            <User className="w-4 h-4" /> Recipient Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Recipient Phone</label>
                                                <input
                                                    placeholder="017XXXXXXXX"
                                                    value={parcelData.phone}
                                                    onChange={e => setParcelData({ ...parcelData, phone: e.target.value })}
                                                    className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-[20px] focus:bg-white focus:border-[#1B4332] outline-none font-bold text-sm shadow-sm transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                                <input
                                                    placeholder="Type Recipient Name"
                                                    value={parcelData.name}
                                                    onChange={e => setParcelData({ ...parcelData, name: e.target.value })}
                                                    className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-[20px] focus:bg-white focus:border-[#1B4332] outline-none font-bold text-sm shadow-sm transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Delivery Address</label>
                                            <textarea
                                                placeholder="Type House, Road, Block, Area details..."
                                                value={parcelData.address}
                                                onChange={e => setParcelData({ ...parcelData, address: e.target.value })}
                                                className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-[20px] focus:bg-white focus:border-[#1B4332] outline-none font-bold text-sm shadow-sm transition-all resize-none h-32"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Select District</label>
                                                <select
                                                    value={parcelData.district}
                                                    onChange={e => setParcelData({ ...parcelData, district: e.target.value, thana: '' })}
                                                    className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-[20px] font-bold text-sm shadow-sm outline-none appearance-none focus:bg-white focus:border-[#1B4332]"
                                                >
                                                    <option value="">Select District</option>
                                                    {Object.keys(DISTRICTS_DATA).map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Thana / Area</label>
                                                <select
                                                    disabled={!parcelData.district}
                                                    value={parcelData.thana}
                                                    onChange={e => setParcelData({ ...parcelData, thana: e.target.value })}
                                                    className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-[20px] font-bold text-sm shadow-sm outline-none appearance-none focus:bg-white focus:border-[#1B4332] disabled:opacity-50"
                                                >
                                                    <option value="">{parcelData.district ? 'Select Thana' : 'Select District First'}</option>
                                                    {parcelData.district && DISTRICTS_DATA[parcelData.district].map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black text-[#1B4332] uppercase tracking-[0.3em] pl-1">Delivery Type</h4>
                                        <div className="flex gap-5 p-2 bg-gray-100/50 rounded-[24px] shadow-inner border border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => setParcelData({ ...parcelData, deliveryType: 'home' })}
                                                className={`flex-1 py-5 rounded-[18px] font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${parcelData.deliveryType === 'home' ? 'bg-white text-[#1B4332] shadow-xl' : 'text-gray-400 hover:bg-gray-200'}`}
                                            >
                                                <MapPin className="w-4 h-4" /> Home Delivery
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setParcelData({ ...parcelData, deliveryType: 'point' })}
                                                className={`flex-1 py-5 rounded-[18px] font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${parcelData.deliveryType === 'point' ? 'bg-white text-[#1B4332] shadow-xl' : 'text-gray-400 hover:bg-gray-200'}`}
                                            >
                                                <Package className="w-4 h-4" /> Point Delivery
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Parcel Metadata */}
                                <div className="space-y-10 flex flex-col justify-between">
                                    <div className="space-y-8">
                                        <h4 className="flex items-center gap-3 text-[11px] font-black text-[#1B4332] uppercase tracking-[0.3em] pl-1">
                                            <Package className="w-4 h-4" /> Parcel Metadata
                                        </h4>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">COD Amount (৳)</label>
                                                <div className="relative group">
                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#1B4332] text-sm group-focus-within:scale-110 transition-transform">৳</div>
                                                    <input
                                                        placeholder="0.00"
                                                        type="number"
                                                        value={parcelData.cod}
                                                        onChange={e => setParcelData({ ...parcelData, cod: e.target.value })}
                                                        className="w-full pl-12 pr-5 py-5 bg-[#1B4332]/5 border-2 border-transparent rounded-[20px] focus:bg-white focus:border-[#1B4332] outline-none font-black text-lg transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Invoice Number</label>
                                                <input
                                                    placeholder="Optional Invoice No"
                                                    value={parcelData.invoice}
                                                    onChange={e => setParcelData({ ...parcelData, invoice: e.target.value })}
                                                    className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-[20px] focus:bg-white focus:border-[#1B4332] outline-none font-bold text-sm shadow-sm transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Item Description</label>
                                            <textarea
                                                placeholder="E.g. 2x Aloe Vera, 1x Monstera Small..."
                                                value={parcelData.description}
                                                onChange={e => setParcelData({ ...parcelData, description: e.target.value })}
                                                className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-[20px] focus:bg-white focus:border-[#1B4332] outline-none font-bold text-sm shadow-sm transition-all resize-none h-32"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Parcel Weight (KG)</label>
                                                <input
                                                    placeholder="0.5"
                                                    type="number"
                                                    step="0.1"
                                                    value={parcelData.weight}
                                                    onChange={e => setParcelData({ ...parcelData, weight: e.target.value })}
                                                    className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-[20px] focus:bg-white focus:border-[#1B4332] outline-none font-bold text-sm shadow-sm transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Instruction Note</label>
                                                <input
                                                    placeholder="E.g. Handle with care"
                                                    value={parcelData.instruction}
                                                    onChange={e => setParcelData({ ...parcelData, instruction: e.target.value })}
                                                    className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-[20px] focus:bg-white focus:border-[#1B4332] outline-none font-bold text-sm shadow-sm transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button className="w-full py-7 bg-[#1B4332] text-white rounded-[28px] font-black uppercase tracking-[0.25em] shadow-2xl hover:shadow-[#1B4332]/40 hover:scale-[1.02] active:scale-95 transition-all text-[11px] mt-10 flex items-center justify-center gap-3">
                                        <Send className="w-5 h-5" /> Submit Consignment
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {shipfastView === 'pickup_request' && (
                        <div className="space-y-10 animate-scaleUp">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setShipfastView('main')} className="p-3 bg-white text-gray-400 rounded-2xl hover:bg-neutral-100 transition-all shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Pickup Request</h3>
                            </div>

                            {/* Service Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 max-w-3xl mx-auto">
                                {[
                                    {
                                        label: 'Regular', icon: Box, sub: '24h', color: 'text-blue-500',
                                        onClick: () => { setSelectedPickupService('Regular'); setPickupModalOpen(true); setEditAddressMode(false); }
                                    },
                                    {
                                        label: 'Express', icon: Rocket, sub: '8h', color: 'text-orange-500',
                                        onClick: () => { setSelectedPickupService('Express'); setPickupModalOpen(true); setEditAddressMode(false); }
                                    }
                                ].map((service, i) => (
                                    <div
                                        key={i}
                                        onClick={service.onClick}
                                        className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center gap-4 group hover:shadow-2xl hover:border-nature-100/50 transition-all cursor-pointer"
                                    >
                                        <div className={`p-5 bg-teal-50/50 rounded-2xl ${service.color} group-hover:scale-110 transition-transform`}>
                                            <service.icon className="w-6 h-6 stroke-[1.5]" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black uppercase text-gray-900 tracking-tight">{service.label}</p>
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">{service.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Table */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-black text-[#1B4332] uppercase tracking-[0.3em] pl-1">Recent Pick-Up Requests</h4>
                                    <button className="text-[10px] font-black text-nature-600 uppercase tracking-widest hover:underline">View All History</button>
                                </div>
                                <div className="bg-white rounded-[32px] shadow-xl border border-gray-50 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#1B4332] text-white">
                                            <tr>
                                                <th className="p-7 text-[10px] font-black uppercase tracking-widest">Date / Request ID</th>
                                                <th className="p-7 text-[10px] font-black uppercase tracking-widest">Pick Address</th>
                                                <th className="p-7 text-[10px] font-black uppercase tracking-widest">Pick Up Status</th>
                                                <th className="p-7 text-[10px] font-black uppercase tracking-widest text-center">Pick-Up Rider</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {pickupRequests.length > 0 ? (
                                                pickupRequests.map(req => (
                                                    <tr key={req.id} className="hover:bg-gray-50/50 transition-all">
                                                        <td className="p-7">
                                                            <div className="flex items-center gap-3">
                                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                                <span className="text-xs font-black text-gray-800 tracking-tight">
                                                                    {req.date} {req.serviceType === 'Express' && <span className="text-nature-600 italic ml-1">(Express)</span>}
                                                                </span>
                                                            </div>
                                                            <span
                                                                onClick={() => setSelectedPickupRequest(req)}
                                                                className="text-[10px] font-bold text-gray-400 block pl-7 hover:underline cursor-pointer"
                                                            >
                                                                {req.id}
                                                            </span>
                                                        </td>
                                                        <td className="p-7">
                                                            <div className="flex items-start gap-3">
                                                                <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                                                                <p className="text-xs font-bold text-gray-500 leading-relaxed max-w-xs">{req.address}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-7">
                                                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div> {req.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-7 text-center">
                                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest italic">{req.rider}</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="p-20 text-center">
                                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                                            <div className="p-6 bg-gray-50 rounded-full border-2 border-dashed border-gray-200">
                                                                <List className="w-10 h-10 text-gray-300" />
                                                            </div>
                                                            <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">No recent pickup requests found</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                    {shipfastView === 'payments_req' && (
                        <div className="space-y-10 animate-scaleUp">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setShipfastView('main')} className="p-3 bg-white text-gray-400 rounded-2xl hover:bg-neutral-100 transition-all shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Payment Request</h3>
                                </div>
                                <button
                                    id="add-payment-btn"
                                    onClick={() => setShowAddPaymentModal(true)}
                                    className="flex items-center gap-2 px-8 py-4 bg-[#1B4332] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Add Payment Method
                                </button>
                            </div>

                            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Left Side: Current Method & Request */}
                                <div className="space-y-8">
                                    <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 p-12 space-y-10">
                                        <div className="text-center space-y-6">
                                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Current Payment Method</h4>
                                            {currentPaymentMethod ? (
                                                <div className="p-10 bg-gray-50/50 rounded-[32px] border-2 border-[#1B4332]/10 space-y-4">
                                                    <div className="flex justify-center">
                                                        <div className="p-6 bg-white rounded-3xl text-[#1B4332] shadow-sm ring-1 ring-[#1B4332]/5">
                                                            {currentPaymentMethod.provider === 'Bank' ? <Landmark className="w-10 h-10" /> : <Smartphone className="w-10 h-10" />}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-3xl font-black text-[#1B4332] tracking-tighter uppercase">{currentPaymentMethod.provider}</p>
                                                        <p className="text-sm font-bold text-gray-500 mt-2">{currentPaymentMethod.account_number}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-20 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center gap-4 opacity-50">
                                                    <Wallet className="w-10 h-10 text-gray-300" />
                                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Active Method</p>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handlePaymentRequest}
                                            disabled={paymentRequestLoading || !currentPaymentMethod}
                                            className={`w-full py-7 text-white rounded-[28px] font-black uppercase tracking-[0.25em] shadow-2xl transition-all text-[11px] ${paymentRequestLoading || !currentPaymentMethod ? 'bg-gray-400' : 'bg-[#1B4332] hover:scale-[1.02] hover:shadow-[#1B4332]/40'}`}
                                        >
                                            {paymentRequestLoading ? 'Processing Request...' : 'Send Request'}
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side: Select Saved Methods */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between pl-2">
                                        <h4 className="text-[11px] font-black text-[#1B4332] uppercase tracking-[0.3em]">Saved Accounts</h4>
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{paymentMethods.length} Saved</span>
                                    </div>
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide pr-2">
                                        {paymentMethods.length > 0 ? (
                                            paymentMethods.map(method => (
                                                <div
                                                    key={method.id}
                                                    onClick={() => !method.is_default && handleSelectPaymentMethod(method)}
                                                    className={`p-6 rounded-[28px] border-2 transition-all cursor-pointer group ${method.is_default ? 'bg-white border-[#1B4332] shadow-xl' : 'bg-white/50 border-gray-100 hover:border-[#1B4332]/30 hover:bg-white'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-5">
                                                            <div className={`p-4 rounded-2xl ${method.is_default ? 'bg-[#1B4332] text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-[#1B4332]/10 group-hover:text-[#1B4332]'} transition-all`}>
                                                                {method.provider === 'Bank' ? <Landmark className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <p className={`text-sm font-black uppercase tracking-tight ${method.is_default ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>{method.provider}</p>
                                                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">{method.account_number}</p>
                                                            </div>
                                                        </div>
                                                        {method.is_default ? (
                                                            <div className="bg-nature-50 text-nature-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-nature-100 shadow-inner">Default</div>
                                                        ) : (
                                                            <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Select</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-white/50 border-2 border-dashed border-gray-100 rounded-[32px] p-20 text-center opacity-40">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Save Your First Account</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {shipfastView === 'consignments' && (
                        <div className="space-y-6 animate-scaleUp">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setShipfastView('main')} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-neutral-100 transition-all"><ArrowLeft className="w-5 h-5" /></button>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">All Parcels</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Real-time logistics stream</p>
                                    </div>
                                </div>
                                <div className="bg-[#2D6A4F] px-8 py-4 rounded-[20px] shadow-xl shadow-nature-100">
                                    <p className="text-[10px] font-black text-nature-100 uppercase tracking-widest mb-1 opacity-70">Fleet Performance</p>
                                    <p className="text-white font-black text-lg tracking-tight">Total Parcels: <span className="text-nature-300">{shipments.length}</span> | Total COD: <span className="text-nature-300">৳{shipments.reduce((acc, s) => acc + s.cod, 0)}</span></p>
                                </div>
                            </div>

                            <div className="card overflow-hidden border-none shadow-2xl rounded-[32px]">
                                <table className="w-full text-left">
                                    <thead className="bg-[#2D6A4F] text-white">
                                        <tr>
                                            <th className="p-6 text-[10px] font-black uppercase tracking-widest">Date/Time</th>
                                            <th className="p-6 text-[10px] font-black uppercase tracking-widest">Tracking ID</th>
                                            <th className="p-6 text-[10px] font-black uppercase tracking-widest">Customer</th>
                                            <th className="p-6 text-[10px] font-black uppercase tracking-widest">COD Amount</th>
                                            <th className="p-6 text-[10px] font-black uppercase tracking-widest">Charge</th>
                                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Rider status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-50">
                                        {shipments.map(s => (
                                            <tr key={s.id} className="hover:bg-nature-50/20 transition-all">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <Clock className="w-4 h-4 text-gray-300" />
                                                        <span className="text-xs font-bold text-gray-500">{s.date}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 font-black text-teal-600 hover:underline cursor-pointer text-xs">{s.id}</td>
                                                <td className="p-6 font-black text-gray-800 text-xs uppercase tracking-tight">{s.customer}</td>
                                                <td className="p-6 font-black text-[#2D6A4F] text-sm">৳{s.cod}</td>
                                                <td className="p-6 font-bold text-gray-400 text-xs">৳{s.charge}</td>
                                                <td className="p-6 text-center">
                                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                                                        <User className="w-3 h-3" /> Unassigned
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {shipfastView === 'payments' && (
                        <div className="grid md:grid-cols-2 gap-10 animate-scaleUp">
                            <div className="bg-white rounded-[40px] p-10 shadow-2xl border border-gray-100 flex flex-col justify-between">
                                <div className="space-y-10">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setShipfastView('main')} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-neutral-100 transition-all shadow-inner"><ArrowLeft className="w-5 h-5" /></button>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Payment Request</h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-[#2D6A4F] uppercase tracking-[0.3em] mb-3 px-1">Withdrawal Method</label>
                                            <div className="relative group">
                                                <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D6A4F]/40 group-focus-within:text-[#2D6A4F] transition-all" />
                                                <select className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[24px] font-black text-sm text-gray-700 shadow-inner appearance-none outline-none focus:bg-white focus:border-[#2D6A4F]">
                                                    <option>Bank Transfer (Default)</option>
                                                    <option>Cash (Collection)</option>
                                                    <option>bkash Personal</option>
                                                    <option>Nagad Personal</option>
                                                    <option>Rocket</option>
                                                </select>
                                                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none rotate-90" />
                                            </div>
                                        </div>
                                        <div className="p-6 bg-[#2D6A4F]/5 rounded-3xl border border-[#2D6A4F]/10 space-y-4">
                                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available for Payout</span>
                                                <span className="text-2xl font-black text-[#2D6A4F] tracking-tighter">৳12,450.00</span>
                                            </div>
                                            <p className="text-[9px] text-gray-400 text-center font-bold px-4">Processing time for bank withdrawal: 24-48 Hours. MFS transfers may take up to 2 hours.</p>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full py-6 mt-10 bg-[#2D6A4F] text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                                    <Send className="w-5 h-5" /> Send Payout Request
                                </button>
                            </div>

                            <div className="bg-white rounded-[40px] p-10 shadow-xl border border-gray-100 space-y-8">
                                <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Settlement Details</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Verified Bank Credentials</p>
                                    </div>
                                    <button className="p-3 text-[#2D6A4F] bg-teal-50 rounded-xl hover:bg-[#2D6A4F] hover:text-white transition-all"><Edit className="w-5 h-5" /></button>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Account Name</p>
                                            <p className="text-xs font-black text-gray-800">Israt Jahan Rimi</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Account Number</p>
                                            <p className="text-xs font-black text-gray-800 font-mono">223.102.445.670</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bank Name</p>
                                            <p className="text-xs font-black text-gray-800">Dutch-Bangla Bank PLC</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Branch & Routing</p>
                                            <p className="text-xs font-black text-gray-800">Uttara (002245)</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-3xl flex items-center gap-4 border border-gray-100">
                                        <div className="p-3 bg-white rounded-2xl text-green-500 shadow-sm"><CheckCircle className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-gray-900 tracking-tight">Status: Active & Verified</p>
                                            <p className="text-[9px] font-bold text-gray-400 mt-0.5">Automated payments are enabled for this account.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {shipfastView === 'support' && (
                        <div className="bg-white rounded-[40px] h-[600px] shadow-2xl border border-gray-100 overflow-hidden flex animate-scaleUp">
                            {/* Left Side: Tickets List */}
                            <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/30">
                                <div className="p-8 border-b border-gray-100 bg-white">
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={() => setShipfastView('main')} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                                        <button className="px-4 py-2 bg-[#2D6A4F] text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Open Ticket</button>
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Support Inbox</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {tickets.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setShipfastTicket(t)}
                                            className={`w-full p-6 rounded-[28px] border-2 text-left transition-all hover:border-[#2D6A4F] relative group ${selectedTicket?.id === t.id ? 'bg-white border-[#2D6A4F] shadow-xl' : 'bg-transparent border-transparent'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[9px] font-black text-[#2D6A4F] uppercase tracking-widest">{t.id}</span>
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                            </div>
                                            <h4 className="text-xs font-black text-gray-800 uppercase leading-none mb-2">{t.issue}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold line-clamp-1">{t.lastMsg}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right Side: Chat Area */}
                            <div className="flex-1 flex flex-col bg-white">
                                {selectedTicket ? (
                                    <>
                                        <div className="p-8 border-b border-gray-100 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-teal-50 text-[#2D6A4F] rounded-2xl flex items-center justify-center font-black">TIC</div>
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedTicket.issue}</h4>
                                                    <p className="text-[9px] font-black text-[#2D6A4F] uppercase tracking-widest">Assigned to: ShipFast Agent #405</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] font-black uppercase border border-green-100">Live Connection</div>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-hide">
                                            {/* System Message */}
                                            <div className="flex justify-center">
                                                <span className="px-6 py-2 bg-gray-50 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-widest">Encypted Session Started</span>
                                            </div>

                                            {/* Merchant Message */}
                                            <div className="flex justify-end pr-4">
                                                <div className="max-w-[70%] bg-[#2D6A4F] text-white p-6 rounded-[32px] rounded-tr-lg shadow-xl relative animate-slideLeft">
                                                    <p className="text-sm font-medium leading-relaxed">Hello, I haven't received my COD payment for Consignment SF-9821 yet. It shows delivered since yesterday.</p>
                                                    <span className="absolute bottom-2 right-6 text-[8px] font-black opacity-50 uppercase tracking-widest">10:45 AM</span>
                                                </div>
                                            </div>

                                            {/* Agent Message */}
                                            <div className="flex justify-start pl-4">
                                                <div className="flex gap-4 max-w-[70%]">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0 border-2 border-white shadow-md flex items-center justify-center text-xs font-black text-gray-400">AG</div>
                                                    <div className="bg-gray-100 text-gray-800 p-6 rounded-[32px] rounded-tl-lg shadow-sm relative animate-slideRight">
                                                        <p className="text-sm font-medium leading-relaxed">Hello Merchant! We are checking your bank details. Payment batches are processed every day at 4 PM. You will see it in your balance by then.</p>
                                                        <span className="absolute bottom-2 left-6 text-[8px] font-black opacity-30 uppercase tracking-widest">11:02 AM</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-gray-50/50">
                                            <div className="flex items-center gap-3 bg-white p-2 rounded-[28px] shadow-2xl border border-gray-100 focus-within:ring-4 focus-within:ring-[#2D6A4F]/10 transition-all">
                                                <button className="p-4 text-gray-300 hover:text-[#2D6A4F] transition-all"><ImageIcon className="w-5 h-5" /></button>
                                                <input placeholder="Type your message here..." className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder-gray-300 px-2" />
                                                <button className="p-4 bg-[#2D6A4F] text-white rounded-full shadow-xl shadow-nature-100 hover:scale-110 active:scale-95 transition-all"><Send className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-30">
                                        <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center border-2 border-dashed border-gray-200">
                                            <RotateCcw className="w-10 h-10 text-gray-300 animate-spin-slow" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-gray-400 uppercase tracking-widest">Waiting for Selection</h4>
                                            <p className="text-sm font-bold text-gray-300 mt-2">Open a ticket from the left panel to start chatting</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {loading && (
                <div className="p-40 text-center space-y-4 animate-pulse">
                    <div className="w-20 h-20 border-8 border-nature-600 border-t-transparent rounded-full animate-spin mx-auto opacity-20"></div>
                </div>
            )}


            {/* HD Inspection Modal */}
            {enlargedImage && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fadeIn" onClick={() => setEnlargedImage(null)}>
                    <button className="absolute top-10 right-10 text-white hover:text-nature-400 transition-all hover:rotate-90"><XCircle className="w-12 h-12" /></button>
                    <div className="max-w-5xl max-h-[90vh] bg-white p-6 rounded-[48px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative animate-scaleUp overflow-hidden" onClick={e => e.stopPropagation()}>
                        <img src={enlargedImage} alt="Inspection" className="max-w-full max-h-[75vh] rounded-[32px] object-contain shadow-2xl border border-gray-100" />
                        <div className="mt-8 flex justify-between items-center text-nature-900 border-t border-gray-100 pt-8 px-4">
                            <span className="font-black uppercase text-lg tracking-tighter flex items-center gap-3"><Package className="w-8 h-8 p-1.5 bg-nature-900 text-white rounded-xl" /> HD Botanical Analysis</span>
                            <button onClick={() => setEnlargedImage(null)} className="px-12 py-5 bg-nature-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl">Close Analysis</button>
                        </div>
                    </div>
                </div>
            )}
            {/* ShipFast Success Modal */}
            {successModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="bg-white max-w-md w-full rounded-[40px] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.3)] animate-scaleUp text-center relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#1B4332]/5 rounded-full -mt-20"></div>

                        <div className="relative z-10 space-y-8">
                            <div className="w-24 h-24 bg-green-50 text-[#1B4332] rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-white ring-8 ring-green-50/30">
                                <Check className="w-12 h-12 stroke-[3]" />
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-4">PARCEL ADDED SUCCESSFULLY!</h3>
                                <p className="text-xs font-bold text-gray-400 leading-relaxed tracking-wide">Parcel has been added successfully. Our rider will contact you shortly.</p>
                            </div>

                            <div className="bg-gray-50/80 p-6 rounded-[24px] border border-gray-100 flex items-center justify-between group">
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Generated Parcel ID</p>
                                    <p className="text-lg font-black text-gray-800 tracking-tighter">{newParcelId}</p>
                                </div>
                                <div className="relative">
                                    {idCopied && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap animate-bounce">
                                            ID COPIED!
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(newParcelId);
                                            setIdCopied(true);
                                            setTimeout(() => setIdCopied(false), 2000);
                                        }}
                                        className="p-3 bg-white text-blue-500 rounded-xl shadow-sm hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <Copy className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 space-y-4">
                                <button
                                    onClick={() => {
                                        setSuccessModalOpen(false);
                                        setShipfastView('consignments');
                                    }}
                                    className="w-full py-6 bg-[#1B4332] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:shadow-[#1B4332]/40 transition-all active:scale-95"
                                >
                                    In-Review Parcels
                                </button>
                                <button
                                    onClick={() => {
                                        setSuccessModalOpen(false);
                                        setParcelData({
                                            phone: '', name: '', address: '', district: '', thana: '',
                                            deliveryType: 'home', cod: '', invoice: '', description: '', weight: '', instruction: ''
                                        });
                                    }}
                                    className="w-full py-6 bg-white text-[#1B4332] border-2 border-[#1B4332]/10 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-all"
                                >
                                    Add More
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pickup Request Modal */}
            {pickupModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="bg-white max-w-lg w-full rounded-[40px] p-10 shadow-2xl animate-scaleUp relative overflow-hidden">
                        <button
                            onClick={() => setPickupModalOpen(false)}
                            className="absolute top-8 right-8 p-3 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>

                        {!editAddressMode ? (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Pickup Address</h3>
                                    <button
                                        onClick={() => setEditAddressMode(true)}
                                        className="text-[10px] font-black text-[#2D6A4F] uppercase tracking-widest hover:underline flex items-center gap-1"
                                    >
                                        <Edit className="w-3 h-3" /> Edit Address
                                    </button>
                                </div>

                                <div className="p-6 bg-teal-50/50 rounded-3xl border border-teal-100/50 flex items-start gap-4">
                                    <MapPin className="w-5 h-5 text-[#2D6A4F] shrink-0 mt-1" />
                                    <p className="text-sm font-bold text-gray-700 leading-relaxed">{registeredPickupAddress}</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estimated Parcel (Optional)</label>
                                        <input
                                            type="number"
                                            placeholder="E.g. 5"
                                            value={estimatedParcels}
                                            onChange={e => setEstimatedParcels(e.target.value)}
                                            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:bg-white focus:border-[#2D6A4F] outline-none font-black text-sm transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Note (Optional)</label>
                                        <textarea
                                            placeholder="Any instruction for rider..."
                                            value={pickupNote}
                                            onChange={e => setPickupNote(e.target.value)}
                                            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:bg-white focus:border-[#2D6A4F] outline-none font-black text-sm transition-all h-32 resize-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    id="shipfast-send-request-btn"
                                    type="button"
                                    disabled={pickupLoading}
                                    onClick={async (e) => {
                                        e.preventDefault();

                                        if (!registeredPickupAddress) {
                                            setToastMsg("Pickup address missing!");
                                            setShowSuccessToast(true);
                                            setTimeout(() => setShowSuccessToast(false), 3000);
                                            return;
                                        }

                                        setPickupLoading(true);
                                        const reqIdValue = `#${Math.floor(15000000 + Math.random() * 9999999)}`;

                                        // Capture data
                                        const payload = {
                                            request_id: reqIdValue,
                                            pickup_address: registeredPickupAddress,
                                            estimated_parcels: parseInt(estimatedParcels) || 0,
                                            note: pickupNote || '',
                                            service_type: selectedPickupService
                                        };

                                        try {
                                            // 1. Instantly update UI for the "WOW" effect
                                            const now = new Date();
                                            const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                                            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                            const formattedDate = `${dateStr}, ${timeStr}`;

                                            const newEntry = {
                                                id: reqIdValue,
                                                date: formattedDate,
                                                address: registeredPickupAddress,
                                                status: 'PENDING',
                                                rider: 'Unassigned',
                                                parcels: payload.estimated_parcels,
                                                note: payload.note,
                                                serviceType: selectedPickupService
                                            };

                                            setPickupRequests(prev => [newEntry, ...prev]);

                                            // 2. Clear and Close Modal immediately
                                            setPickupModalOpen(false);
                                            setEstimatedParcels('');
                                            setPickupNote('');

                                            // 3. Show Success Toast
                                            setToastMsg("Pickup Request Submitted!");
                                            setShowSuccessToast(true);
                                            setTimeout(() => setShowSuccessToast(false), 3000);

                                            // 4. Send to server in background
                                            await api.post('shipfast-requests/', payload);

                                            // 5. Final sync from server
                                            fetchPickupRequests();
                                        } catch (err) {
                                            console.error("Critical: Pickup Submission Error", err);
                                            // Inform the user if it truly failed in the background
                                            if (err.response?.status === 403) {
                                                setToastMsg("PERMISSION DENIED (403) - CHECK LOGIN");
                                                setShowSuccessToast(true);
                                                setTimeout(() => setShowSuccessToast(false), 5000);
                                            }
                                        } finally {
                                            setPickupLoading(false);
                                        }
                                    }}
                                    className={`w-full py-6 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all ${pickupLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2D6A4F] hover:scale-[1.02] active:scale-95'}`}
                                >
                                    {pickupLoading ? 'Processing...' : 'Send Request'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setEditAddressMode(false)} className="p-2 text-gray-400 hover:text-nature-900 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Update Address</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Address</label>
                                        <textarea
                                            value={tempPickupAddress}
                                            onChange={e => setTempPickupAddress(e.target.value)}
                                            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:bg-white focus:border-[#2D6A4F] outline-none font-black text-sm transition-all h-32 resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">District</label>
                                            <select
                                                value={pickupDistrict}
                                                onChange={e => setPickupDistrict(e.target.value)}
                                                className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] font-black text-sm outline-none appearance-none focus:bg-white focus:border-[#2D6A4F]"
                                            >
                                                <option>Dhaka City</option>
                                                <option>Chittagong</option>
                                                <option>Rajshahi</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Thana</label>
                                            <input
                                                placeholder="Search Thana..."
                                                value={pickupThana}
                                                onChange={e => setPickupThana(e.target.value)}
                                                className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-[24px] focus:bg-white focus:border-[#2D6A4F] outline-none font-black text-sm transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setRegisteredPickupAddress(tempPickupAddress);
                                        setEditAddressMode(false);
                                        setToastMsg("Address Updated Successfully!");
                                        setShowSuccessToast(true);
                                        setTimeout(() => setShowSuccessToast(false), 3000);
                                    }}
                                    className="w-full py-6 bg-[#2D6A4F] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all"
                                >
                                    Update
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Request Detail Modal */}
            {selectedPickupRequest && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="bg-white max-w-lg w-full rounded-[40px] p-10 shadow-2xl animate-scaleUp relative overflow-hidden">
                        <button
                            onClick={() => setSelectedPickupRequest(null)}
                            className="absolute top-8 right-8 p-3 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>

                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Request Details</h3>
                                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">{selectedPickupRequest.id}</p>
                                </div>
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                    {selectedPickupRequest.status}
                                </span>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup Address</p>
                                        <p className="text-sm font-bold text-gray-700 leading-relaxed">{selectedPickupRequest.address}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Date Requested</p>
                                            <p className="text-xs font-black text-gray-800">{selectedPickupRequest.date}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">parcels</p>
                                            <p className="text-xs font-black text-gray-800">{selectedPickupRequest.parcels} Units</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Note from Merchant</p>
                                    <p className="text-sm font-bold text-gray-700 leading-relaxed italic">"{selectedPickupRequest.note || 'No instruction'}"</p>
                                </div>

                                <div className="flex items-center gap-4 p-6 bg-[#1B4332]/5 rounded-3xl border border-[#1B4332]/10">
                                    <div className="p-3 bg-white rounded-2xl text-nature-600 shadow-sm"><User className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-900 tracking-tight">Rider Assigned: {selectedPickupRequest.rider}</p>
                                        <p className="text-[9px] font-bold text-gray-400 mt-0.5">Wait for hub dispatch confirmation.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Payment Method Modal */}
            {showAddPaymentModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#1B4332]/40 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden animate-scaleUp border border-gray-100">
                        <div id="payment-modal-content" className="p-12 space-y-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Add Payment Method</h3>
                                <button onClick={() => setShowAddPaymentModal(false)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition-all"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleAddPaymentMethod} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                                    <select
                                        value={paymentMethodForm.provider}
                                        onChange={e => setPaymentMethodForm({ ...paymentMethodForm, provider: e.target.value })}
                                        className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-[20px] focus:bg-white focus:border-[#1B4332] outline-none font-bold text-sm shadow-sm transition-all appearance-none"
                                    >
                                        <option value="bKash">bKash</option>
                                        <option value="Nagad">Nagad</option>
                                        <option value="Rocket">Rocket</option>
                                        <option value="Bank">Bank</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Account {paymentMethodForm.provider === 'Bank' ? 'Details' : 'Number'}</label>
                                    <input
                                        placeholder={paymentMethodForm.provider === 'Bank' ? 'A/C Name, Number, Branch...' : '01XXXXXXXXX'}
                                        required
                                        value={paymentMethodForm.account_number}
                                        onChange={e => setPaymentMethodForm({ ...paymentMethodForm, account_number: e.target.value })}
                                        className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-[20px] focus:bg-white focus:border-[#1B4332] outline-none font-bold text-sm shadow-sm transition-all"
                                    />
                                </div>

                                <div className="flex items-center gap-3 ml-1">
                                    <input
                                        type="checkbox"
                                        id="default_payment"
                                        checked={paymentMethodForm.is_default}
                                        onChange={e => setPaymentMethodForm({ ...paymentMethodForm, is_default: e.target.checked })}
                                        className="w-5 h-5 accent-[#1B4332]"
                                    />
                                    <label htmlFor="default_payment" className="text-[10px] font-black text-gray-600 uppercase tracking-widest cursor-pointer">Set as Default Payment Method</label>
                                </div>

                                <button type="submit" className="w-full py-7 bg-[#1B4332] text-white rounded-[28px] font-black uppercase tracking-[0.25em] shadow-2xl hover:shadow-[#1B4332]/40 hover:scale-[1.02] transition-all text-[11px]">
                                    Save Payment Method
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[10001] bg-nature-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideDown">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-[11px] font-black uppercase tracking-widest">{toastMsg}</span>
                </div>
            )}
        </div>
    );
}


