import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { Plus, Package, Users, ShoppingCart, Tag, User, ShieldAlert, ShieldCheck, XCircle, Search, AlertTriangle, Bell, MessageCircle, Send, Image, Clock, FileText, Stethoscope, MapPin, Star, Hammer, Flower2, GraduationCap, Download, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '../i18n/LanguageContext';
import ShipfastMerchant from '../components/shipfast/ShipfastMerchant';
import ShipfastAdmin from '../components/shipfast/ShipfastAdmin';

const CATEGORIES = [
    "Aglonema", "Alocasia", "Anthurium", "Begonia", "Bonsai", "Cactus", "Calathea",
    "Dracena", "Ficus", "Fittonia", "Monstera", "Peperomia", "Philodendron",
    "Pothos", "Sansevieria", "Succulent", "Syngonium", "ZZ Plant", "Air Plant"
];

const FRAUD_NUMBERS = [
    "01712345678", "01898765432", "01911223344", "01600000000", "01311223344",
    "01887409064", "01511223344", "01715987456", "01801259002", "01989123753"
];

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
const generatePDFReceipt = (order) => {
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
    doc.text(`Seller Name: Easy Grow Plants (Admin)`, 10, 70);

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

export default function AdminDashboard() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [sellers, setSellers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [plants, setPlants] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [selectedSub, setSelectedSub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sellers'); // sellers, orders, shop, support, botanists
    const [supportTickets, setSupportTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketHistory, setTicketHistory] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [replyImage, setReplyImage] = useState(null);
    const [formData, setFormData] = useState({
        plant_name: '', stock_quantity: 0, price: 0, buying_price: 0, description: '', category: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [formError, setFormError] = useState('');

    // Fraud Checker States
    const [isFraudModalOpen, setIsFraudModalOpen] = useState(false);
    const [fraudData, setFraudData] = useState(null);
    const [checkingPhone, setCheckingPhone] = useState('');
    const [fraudLoading, setFraudLoading] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [botanistRequests, setBotanistRequests] = useState([]);
    const [allBotanists, setAllBotanists] = useState([]);
    const [pottingRequests, setPottingRequests] = useState([]);
    const [allGardeners, setAllGardeners] = useState([]);
    const [botanistApps, setBotanistApps] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const chatScrollRef = useRef(null);

    const setSortedTickets = (data) => {
        if (!Array.isArray(data)) return;
        setSupportTickets([...data].sort((a, b) => new Date(b.last_timestamp) - new Date(a.last_timestamp)));
    };

    useEffect(() => {
        fetchAdminData();

        const handleSwitchTab = () => {
            try {
                const pending = localStorage.getItem('pending_support_ticket');
                if (pending) {
                    const ticketData = JSON.parse(pending);
                    setActiveTab('support');
                    // Data might not be set yet if fetch is still running
                    if (supportTickets && Array.isArray(supportTickets)) {
                        const existing = supportTickets.find(t => t.user_id === ticketData.user_id);
                        handleSelectTicket(existing || ticketData);
                    } else {
                        handleSelectTicket(ticketData);
                    }
                    localStorage.removeItem('pending_support_ticket');
                }
            } catch (err) {
                console.error("Tab switch error:", err);
            }
        };

        window.addEventListener('switch_to_support', handleSwitchTab);
        handleSwitchTab();

        return () => window.removeEventListener('switch_to_support', handleSwitchTab);
    }, [supportTickets.length]);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // Check auth and role
            const userRes = await api.get('/auth/me/');
            if (userRes.data.role !== 'admin') {
                navigate('/dashboard');
                return;
            }
            setUser(userRes.data);

            // Fetch Data
            const [sellersRes, ordersRes, plantsRes, supportRes, subRes] = await Promise.all([
                api.get('/admin/sellers/'),
                api.get('/orders/'),
                api.get('/plants/my-plants/'),
                api.get('/support/admin/tickets/'),
                api.get('/plant-care/subscriptions/')
            ]);

            setSellers(Array.isArray(sellersRes.data) ? sellersRes.data : []);
            setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
            setPlants(Array.isArray(plantsRes.data) ? plantsRes.data : []);
            setSubscriptions(Array.isArray(subRes.data) ? subRes.data : []);
            setSortedTickets(supportRes.data);

            // Load Botanist Data from Mock DB (localStorage)
            const savedApps = localStorage.getItem('local_botanist_appointments');
            if (savedApps) {
                setBotanistRequests(JSON.parse(savedApps));
            } else {
                const initial = [
                    { id: 'APP-1021', date: '2024-10-20', status: 'completed', botanist: 'Sarah Ahmed', symptoms: 'Yellow leaves on Monstera', prescription: true, user: 'Mock User' },
                    { id: 'APP-1105', date: '2024-10-25', status: 'requested', botanist: 'Not Assigned', symptoms: 'Root rot in Succulents', prescription: false, user: 'Mock User' }
                ];
                setBotanistRequests(initial);
                localStorage.setItem('local_botanist_appointments', JSON.stringify(initial));
            }

            setAllBotanists([
                { id: 1, name: 'Sarah Ahmed', rating: 4.9, location: 'Gulshan', active_tasks: 1 },
                { id: 2, name: 'Rafiqul Islam', rating: 4.7, location: 'Mirpur', active_tasks: 0 },
                { id: 3, name: 'Tania Kabir', rating: 4.8, location: 'Dhanmondi', active_tasks: 0 }
            ]);

            // Load Potting Requests from Mock DB
            const savedPotting = localStorage.getItem('local_potting_requests');
            if (savedPotting) {
                setPottingRequests(JSON.parse(savedPotting));
            } else {
                const initial = [
                    { id: 'POT-8821', date: '2024-11-05', status: 'completed', expert: 'Rahat Hasan', pots: '3 Small, 1 Large', package: 'Soil & Fertilizer', total: 1000, user: 'Mock User', location: 'Banani' },
                    { id: 'POT-9012', date: '2024-11-12', status: 'requested', expert: 'Not Assigned', pots: '5 Medium', package: 'Labor Only', total: 500, user: 'Mock User', location: 'Uttara' }
                ];
                setPottingRequests(initial);
                localStorage.setItem('local_potting_requests', JSON.stringify(initial));
            }

            setAllGardeners([
                { id: 1, name: 'Rahat Hasan', rating: 4.8, location: 'Banani', active_tasks: 1 },
                { id: 2, name: 'Sumon Mia', rating: 4.6, location: 'Uttara', active_tasks: 0 },
                { id: 3, name: 'Karim Ullah', rating: 4.9, location: 'Badda', active_tasks: 0 }
            ]);

            // Load Botanist Applications
            try {
                const response = await api.get('/botanist-applications/');
                setBotanistApps(response.data);
            } catch (e) {
                console.error("Error loading botanist apps:", e);
                setBotanistApps([]);
            }

        } catch (err) {
            console.error("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTicket = async (ticket) => {
        setSelectedTicket(ticket);
        try {
            const res = await api.get(`/support/admin/tickets/${ticket.user_id}/`);
            setTicketHistory(res.data);

            // Refresh counts (mark read happens in backend on GET)
            const supportRes = await api.get('/support/admin/tickets/');
            setSortedTickets(supportRes.data);
        } catch (err) { console.error(err); }
    };

    const handleOrderUpdate = async (orderId, field, value) => {
        try {
            await api.patch(`/orders/${orderId}/`, { [field]: value });

            setOrders(prev => {
                const updated = prev.map(o => o.id === orderId ? { ...o, [field]: value } : o);
                if (field === 'status' && value === 'completed') {
                    const targetOrder = updated.find(o => o.id === orderId);
                    if (targetOrder) generatePDFReceipt(targetOrder);
                }
                return updated;
            });
        } catch (err) {
            console.error("Update error:", err);
            alert("Failed to update. Please try again.");
        }
    };

    const handleSeeMoreOrders = () => {
        setOrders(prev => [...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    };

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [ticketHistory]);

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() && !replyImage) return;
        try {
            const fd = new FormData();
            if (replyText.trim()) fd.append('message', replyText);
            if (replyImage) fd.append('image', replyImage);

            await api.post(`/support/admin/tickets/${selectedTicket.user_id}/`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setReplyText('');
            setReplyImage(null);
            const res = await api.get(`/support/admin/tickets/${selectedTicket.user_id}/`);
            setTicketHistory(res.data);

            // Refresh ticket list to move this user to top
            const supportRes = await api.get('/support/admin/tickets/');
            setSortedTickets(supportRes.data);
        } catch (err) { console.error(err); }
    };

    const getCookie = (name) => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };

    const handleAddPlant = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccessMessage('');

        // 1. Image Processing Validation
        if (!imageFile) {
            setFormError('Please upload an image before launching.');
            return;
        }

        // 2. Data Validation & Mapping
        const cleanPrice = String(formData.price).replace(/[^\d.]/g, '');
        const cleanStock = String(formData.stock_quantity).replace(/[^\d]/g, '');

        if (!formData.plant_name || !formData.category || !formData.description || !cleanPrice || !cleanStock) {
            setFormError('Please fill all required fields before launching.');
            return;
        }

        try {
            const payload = new FormData();
            // 3. Mapping Alignment: match backend keys
            payload.append('plant_name', formData.plant_name);
            payload.append('stock_quantity', cleanStock);
            payload.append('price', cleanPrice);
            payload.append('buying_price', formData.buying_price || 0);
            payload.append('description', formData.description);
            payload.append('category', formData.category);

            // Multipart/Form-Data handled automatically by sending payload
            payload.append('image_url', imageFile);

            const response = await api.post('/plants/', payload, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'X-CSRFToken': getCookie('csrftoken') // CSRF Protection
                }
            });

            // 4. Success State: Clear form and show specific message
            if (response.status === 201 || response.status === 200) {
                setFormData({ plant_name: '', stock_quantity: 0, price: 0, buying_price: 0, description: '', category: '' });
                setImageFile(null);
                setImagePreview(null);
                setSuccessMessage('Plant Added Successfully!');
                
                setFormError('');
                setTimeout(() => setSuccessMessage(''), 5000);

                // Refresh listings
                const res = await api.get('/plants/my-plants/');
                setPlants(Array.isArray(res.data) ? res.data : []);
            }
        } catch (err) {
            console.error("Submission Error:", err.response?.data || err.message);
            const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            setFormError(`Error: ${errorDetail}`);
        }
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

    const handleCheckFraud = async (phone) => {
        if (!phone || phone === 'N/A') return;
        setCheckingPhone(phone);
        setFraudLoading(true);
        setIsFraudModalOpen(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const phoneStr = String(phone).replace(/\D/g, '');

            // Generate a robust deterministic hash from the phone number
            let hash = 0;
            for (let i = 0; i < phoneStr.length; i++) {
                hash = ((hash << 5) - hash) + phoneStr.charCodeAt(i);
                hash |= 0;
            }
            const h = Math.abs(hash);

            let mockData = {};

            if (FRAUD_NUMBERS.includes(phoneStr)) {
                // Fixed High-Risk Stats for Fraud List
                const total = 12 + (h % 15); // 12-27 orders
                const returned = Math.max(5, Math.floor(total * (0.45 + (h % 25) / 100))); // 45-70% return rate, min 5
                mockData = {
                    totalOrders: total,
                    delivered: total - returned,
                    returned: returned,
                    isRisky: true,
                    status: 'Risky Customer'
                };
            } else {
                // Seeded "Safe" Stats with High Variance
                const total = (h % 18) + 2; // 2-20 orders
                let returned = 0;

                // Deterministic variance for safe users
                const variance = h % 10;
                if (variance < 3) {
                    returned = 0; // 30% have perfect 0 returns
                } else if (variance < 6) {
                    returned = total > 5 ? 1 : 0; // 30% have only 1 return if active
                } else {
                    // Others have a small percentage (5-15%)
                    returned = Math.max(1, Math.floor(total * (0.05 + (h % 10) / 100)));
                }

                // Hard clamp for safety status
                if ((returned / total) > 0.22) returned = Math.floor(total * 0.12);

                mockData = {
                    totalOrders: total,
                    delivered: total - returned,
                    returned: Math.min(returned, total - 1), // Ensure at least 1 delivered for safe
                    isRisky: false,
                    status: 'Safe Customer'
                };
            }

            setFraudData(mockData);
        } catch (err) {
            console.error("Fraud check failed:", err);
            alert("Could not connect to Fraud Database.");
        } finally {
            setFraudLoading(false);
        }
    };

    const handleMarkShipped = async (subId) => {
        try {
            const res = await api.post(`/plant-care/subscriptions/${subId}/mark_shipped/`);
            setSubscriptions(prev => prev.map(s => s.id === subId ? res.data : s));
            if (selectedSub && selectedSub.id === subId) {
                setSelectedSub(res.data);
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Failed to mark as shipped");
        }
    };

    const isDueTomorrow = (dateStr) => {
        if (!dateStr) return false;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const d = new Date(dateStr);
        return d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth() && d.getFullYear() === tomorrow.getFullYear();
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Admin Command Center
                    </h1>
                    <p className="text-gray-500 font-medium">Manage sellers, orders, and official listings.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/profile"
                        className="btn bg-white text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm"
                    >
                        <User className="w-5 h-5" /> Admin Profile
                    </Link>
                </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="flex space-x-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('sellers')}
                    className={`py-3 px-6 font-bold uppercase tracking-widest text-sm transition-colors ${activeTab === 'sellers'
                        ? 'border-b-4 border-nature-600 text-nature-800'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    {t('sellerInfo')}
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`py-3 px-6 font-bold uppercase tracking-widest text-sm transition-colors ${activeTab === 'orders'
                        ? 'border-b-4 border-nature-600 text-nature-800'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    {t('orderManagement')}
                </button>
                <button
                    onClick={() => setActiveTab('shop')}
                    className={`py-3 px-6 font-bold uppercase tracking-widest text-sm transition-colors ${activeTab === 'shop'
                        ? 'border-b-4 border-nature-600 text-nature-800'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    {t('adminShop')}
                </button>
                <button
                    onClick={() => setActiveTab('support')}
                    className={`py-3 px-6 font-bold uppercase tracking-widest text-sm transition-colors relative ${activeTab === 'support'
                        ? 'border-b-4 border-nature-600 text-nature-800'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    {t('supportCenter')}
                    {supportTickets.some(t => t.unread_count > 0) && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('subscriptions')}
                    className={`py-3 px-6 font-bold uppercase tracking-widest text-sm transition-colors relative ${activeTab === 'subscriptions'
                        ? 'border-b-4 border-nature-600 text-nature-800'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    {t('subscriptions')}
                    {subscriptions.some(s => isDueTomorrow(s.next_delivery_date) && s.status === 'active') && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('shipfast_merchant')}
                    className={`py-3 px-6 font-bold uppercase tracking-widest text-sm transition-colors ${activeTab === 'shipfast_merchant'
                        ? 'border-b-4 border-[#1B4332] text-[#1B4332]'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    {t('shipfastMerchant')}
                </button>
                <button
                    onClick={() => setActiveTab('shipfast_admin')}
                    className={`py-3 px-6 font-bold uppercase tracking-widest text-sm transition-colors ${activeTab === 'shipfast_admin'
                        ? 'border-b-4 border-teal-600 text-teal-800'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    {t('shipfastAdmin')}
                </button>
                <button
                    onClick={() => setActiveTab('botanists')}
                    className={`py-3 px-6 font-bold uppercase tracking-widest text-sm transition-colors relative ${activeTab === 'botanists'
                        ? 'border-b-4 border-nature-600 text-nature-800'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Botanists
                    {botanistRequests.some(r => r.status === 'requested') && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-nature-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('potting')}
                    className={`py-3 px-6 font-bold uppercase tracking-widest text-sm transition-colors relative ${activeTab === 'potting'
                        ? 'border-b-4 border-nature-600 text-nature-800'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Potting Requests
                    {pottingRequests.some(r => r.status === 'requested') && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-nature-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('botanist_apps')}
                    className={`py-3 px-6 font-bold uppercase tracking-widest text-sm transition-colors relative ${activeTab === 'botanist_apps'
                        ? 'border-b-4 border-nature-600 text-nature-800'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Botanist Apps
                    {botanistApps.some(a => a.status === 'pending') && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </button>
            </div>

            {loading && <div className="p-20 text-center text-gray-500 animate-pulse">{t('loadingAdmin')}</div>}

            {!loading && activeTab === 'sellers' && (
                <div className="card overflow-hidden shadow-xl border-none">
                    <div className="p-6 border-b border-gray-100 bg-nature-50">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-nature-800">
                            <Users className="text-nature-600" /> {t('registeredSellers')}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-nature-900 border-b border-nature-800 text-nature-100">
                                <tr>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider text-center w-16">#</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('name')}</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('username')}</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('phone')}</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('nid')}</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('address')}</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider text-right">{t('regDate')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sellers.length === 0 ? (
                                    <tr><td colSpan="7" className="p-10 text-center text-gray-400 font-bold">{t('noSellers')}</td></tr>
                                ) : (
                                    sellers.map((s, idx) => (
                                        <tr key={s.id} className="hover:bg-nature-50/50 transition-colors border-b border-nature-50">
                                            <td className="p-5 text-center font-bold text-nature-600">{idx + 1}</td>
                                            <td className="p-5 font-bold text-gray-800">{s.full_name || s.username}</td>
                                            <td className="p-5 text-gray-600">{s.username}</td>
                                            <td className="p-5 text-gray-600 font-mono text-xs">{s.phone || 'N/A'}</td>
                                            <td className="p-5 text-gray-600">{s.nid_number || 'N/A'}</td>
                                            <td className="p-5 text-gray-600 text-xs w-48 truncate" title={s.address}>{s.address || 'N/A'}</td>
                                            <td className="p-5 text-right font-black text-xs text-nature-800 bg-nature-50/30 whitespace-nowrap">
                                                {formatRegDate(s.date_joined)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'orders' && (
                <div className="space-y-4">
                    {/* Latest Order Banner */}
                    <div className="bg-nature-900 p-6 rounded-3xl flex items-center justify-between shadow-lg border border-white/10 animate-fadeIn">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                <ShoppingCart className="text-nature-400 w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t('totalCustomers')}</h2>
                                <p className="text-3xl font-black text-white tracking-tighter">{sellers.length}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSeeMoreOrders}
                            className="px-8 py-3 bg-white text-nature-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95"
                        >
                            See More
                        </button>
                    </div>

                    <div className="card overflow-hidden shadow-xl border-none">
                        <div className="p-6 border-b border-gray-100 bg-nature-50">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-nature-800 uppercase tracking-tighter">
                                    <Package className="text-nature-600" /> {t('merchantRegistry')}
                                </h2>
                                <span className="text-[10px] px-3 py-1 bg-white rounded-full border border-gray-100 font-bold text-gray-400 uppercase tracking-widest">
                                    {orders.length} {t('activeRecords')}
                                </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-nature-900 border-b border-nature-800 text-nature-100">
                                    <tr>
                                        <th className="p-5 font-semibold text-sm uppercase tracking-wider text-center w-16">#</th>
                                        <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('trackingId')}</th>
                                        <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('buyerInfo')}</th>
                                        <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('orderDetails')}</th>
                                        <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('transactionDate')}</th>
                                        <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('amount')}</th>
                                        <th className="p-5 font-semibold text-sm uppercase tracking-wider text-right">{t('fulfillment')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.length === 0 ? (
                                        <tr><td colSpan="7" className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest">{t('noSalesYet')}</td></tr>
                                    ) : (
                                        orders.map((o, index) => (
                                            <tr key={o.id} className="hover:bg-nature-50/50 transition-colors border-b border-nature-50 text-[11px]">
                                                <td className="p-5 text-center font-bold text-gray-400">{index + 1}</td>
                                                <td className="p-5 font-bold text-gray-800">#{o.id}</td>
                                                <td className="p-5 uppercase font-black text-[10px] text-nature-900 leading-tight">
                                                    {o.customer_name || o.user_username || o.user_full_name}
                                                </td>
                                                <td className="p-5 text-gray-600 font-mono">{o.phone || o.user_phone || 'N/A'}</td>
                                                <td className="p-5 text-gray-600 w-40 truncate" title={o.address}>{o.address || o.user_address || 'N/A'}</td>
                                                <td className="p-5">
                                                    <div className="flex flex-col gap-2 min-w-[120px]">
                                                        {o.items?.map((it, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 group/prod">
                                                                <div className="relative">
                                                                    <img src={it.plant_image || '/placeholder.png'} alt="P" className="w-8 h-8 rounded-lg object-cover shadow-sm border border-gray-100" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEnlargedImage(it.plant_image)}
                                                                        className="absolute inset-0 bg-nature-900/40 opacity-0 group-hover/prod:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer"
                                                                    >
                                                                        <Search className="w-4 h-4 text-white" />
                                                                    </button>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-nature-800 line-clamp-1">{it.plant_name}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEnlargedImage(it.plant_image)}
                                                                        className="text-[7px] font-black text-nature-500 uppercase tracking-widest hover:text-nature-900 text-left"
                                                                    >
                                                                        View Enlarge
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-gray-500 font-bold">
                                                    {formatRegDate(o.created_at)}
                                                </td>
                                                <td className="p-5 font-black text-nature-700">৳{o.total_bill}</td>
                                                <td className="p-5">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="text-[10px] font-mono text-nature-800 bg-nature-100 px-2 py-1 rounded">{o.tracking_id || 'N/A'}</span>
                                                        <select
                                                            value={o.courier_service || ''}
                                                            onChange={(e) => handleOrderUpdate(o.id, 'courier_service', e.target.value)}
                                                            className="text-[9px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg border focus:border-nature-600 outline-none w-full"
                                                        >
                                                            <option value="" disabled>Select Courier</option>
                                                            <option value="Pathao">Pathao (Inside)</option>
                                                            <option value="Steadfast">Steadfast (Outside)</option>
                                                            <option value="RedX">RedX</option>
                                                            <option value="eCourier">eCourier</option>
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="text-[9px] font-black uppercase text-gray-500">COD: {o.payment_method}</span>
                                                        <select
                                                            value={o.payment_status || 'pending'}
                                                            onChange={(e) => handleOrderUpdate(o.id, 'payment_status', e.target.value)}
                                                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg border-2 transition-all outline-none 
                                                                ${o.payment_status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-50 text-red-600 border-red-100'}`}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="paid">Paid</option>
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <button
                                                        onClick={() => handleCheckFraud(o.phone || o.user_phone)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-nature-50 text-nature-700 rounded-lg hover:bg-nature-100 transition-all border border-nature-100 shadow-sm"
                                                    >
                                                        <ShieldAlert className="w-3 h-3" /> <span className="text-[8px] font-black uppercase tracking-widest">Fraud Check</span>
                                                    </button>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex flex-col gap-1">
                                                        <select
                                                            value={o.status}
                                                            onChange={(e) => handleOrderUpdate(o.id, 'status', e.target.value)}
                                                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg border-2 transition-all outline-none 
                                                                ${o.status === 'completed' ? 'bg-nature-900 text-white border-nature-900' :
                                                                    o.status === 'delivered' ? 'bg-green-600 text-white border-green-600' :
                                                                        'bg-white text-gray-500 border-gray-100 focus:border-nature-600'}`}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="processing">Processing</option>
                                                            <option value="shipped">Shipped</option>
                                                            <option value="out_for_delivery">Out for Delivery</option>
                                                            <option value="delivered">Delivered</option>
                                                            <option value="completed">Completed</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                        {o.status === 'completed' && (
                                                            <button
                                                                onClick={() => generatePDFReceipt(o)}
                                                                className="flex items-center justify-center gap-1 text-[8px] font-black uppercase text-nature-600 hover:text-nature-900 mt-1"
                                                            >
                                                                <FileText className="w-3 h-3" /> RECEIPT (PDF)
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

            {!loading && activeTab === 'shop' && (
                <div className="space-y-6 animate-slideIn">
                    {/* Success/Error Notifications */}
                    {successMessage && (
                        <div className="bg-emerald-50 border-2 border-emerald-500/20 text-emerald-900 px-8 py-4 rounded-[24px] font-black flex items-center gap-4 animate-bounce">
                            <ShieldCheck className="w-6 h-6 text-emerald-600" />
                            {successMessage}
                        </div>
                    )}
                    {formError && (
                        <div className="bg-red-50 border-2 border-red-500/20 text-red-900 px-8 py-4 rounded-[24px] font-black flex items-center gap-4">
                            <ShieldAlert className="w-6 h-6 text-red-600" />
                            {formError}
                        </div>
                    )}
                    <div className="card p-10 bg-white border-2 border-gray-100 shadow-xl rounded-[40px]">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                                <Plus className="w-8 h-8 p-1.5 bg-nature-900 text-white rounded-xl" />
                                Admin Shop Editor
                            </h3>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50 px-4 py-2 rounded-full border border-gray-100">Official Submission Mode</div>
                        </div>

                        <form onSubmit={handleAddPlant} className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] uppercase font-black text-nature-800 mb-2 px-2 tracking-widest">Plant Name</label>
                                    <input 
                                        required 
                                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-900 outline-none transition-all font-bold" 
                                        placeholder="e.g. Monstera Deliciosa" 
                                        value={formData.plant_name} 
                                        onChange={e => setFormData({ ...formData, plant_name: e.target.value })} 
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] uppercase font-black text-nature-800 mb-2 px-2 tracking-widest">Selling Price (৳)</label>
                                        <input 
                                            required 
                                            type="number" 
                                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-900 outline-none transition-all font-bold" 
                                            value={formData.price} 
                                            onChange={e => setFormData({ ...formData, price: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-black text-nature-800 mb-2 px-2 tracking-widest">Stock Units</label>
                                        <input 
                                            required 
                                            type="number" 
                                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-900 outline-none transition-all font-bold" 
                                            value={formData.stock_quantity} 
                                            onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-black text-nature-800 mb-2 px-2 tracking-widest">Category</label>
                                    <select 
                                        required 
                                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold appearance-none outline-none focus:border-nature-900 transition-all" 
                                        value={formData.category} 
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="" disabled>Select Category</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-black text-nature-800 mb-2 px-2 tracking-widest">Upload Image</label>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl" 
                                        onChange={handleImageChange} 
                                    />
                                    {imagePreview && (
                                        <div className="mt-4 relative h-40 rounded-2xl border-2 border-nature-100 flex items-center justify-center bg-white overflow-hidden shadow-inner">
                                            <img src={imagePreview} alt="Preview" className="h-full object-contain p-2" />
                                            <button 
                                                type="button" 
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                className="absolute top-2 right-2 bg-nature-900/80 text-white p-1.5 rounded-lg hover:bg-red-500 transition-colors"
                                            >
                                                <ShieldAlert className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="block text-[10px] uppercase font-black text-nature-800 mb-2 px-2 tracking-widest">Description</label>
                                <textarea 
                                    required 
                                    rows="14" 
                                    className="w-full flex-1 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold resize-none focus:ring-4 focus:ring-nature-500/10 focus:border-nature-900 outline-none transition-all" 
                                    placeholder="Tell buyers about the specific care, media, and requirements of this botanical listing..." 
                                    value={formData.description} 
                                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                />
                            </div>

                            <button className="md:col-span-2 w-full py-6 bg-nature-900 text-white rounded-[20px] font-black text-lg uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-[0.98] mt-4 flex items-center justify-center gap-4">
                                LAUNCH LISTING NOW
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'support' && (
                <div className="animate-fadeIn min-h-[600px]">
                    {!selectedTicket ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div>
                                    <h2 className="text-xl font-black text-nature-900 uppercase tracking-tight">Support Inbox</h2>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                                        Showing all user conversations
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-nature-50 text-nature-700 rounded-xl border border-nature-100">
                                    <MessageCircle className="w-5 h-5" />
                                    <span className="text-sm font-black">{supportTickets.length} Threads</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {supportTickets.map(t => (
                                    <button
                                        key={t.user_id}
                                        onClick={() => handleSelectTicket(t)}
                                        className={`p-6 rounded-3xl transition-all border-2 text-left relative group hover:scale-[1.02] active:scale-95 flex flex-col justify-between h-48 shadow-sm
                                            ${t.unread_count > 0
                                                ? 'bg-nature-50 border-nature-400 border-dashed shadow-nature-100 shadow-lg'
                                                : 'bg-white border-gray-100 hover:border-nature-200 shadow-gray-200 shadow-sm'}`}
                                    >
                                        <div className="w-full">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${t.unread_count > 0 ? 'bg-nature-900 text-white' : 'bg-nature-100 text-nature-700'}`}>
                                                        {t.username[0].toUpperCase()}
                                                    </div>
                                                    <span className={`text-sm uppercase tracking-tighter ${t.unread_count > 0 ? 'font-black text-nature-900' : 'font-bold text-gray-700'}`}>
                                                        {t.full_name || t.username}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(t.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className={`text-xs line-clamp-2 leading-relaxed ${t.unread_count > 0 ? 'font-black text-nature-700' : 'text-gray-400'}`}>
                                                {t.last_message || 'Image attachment sent...'}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className={t.unread_count > 0 ? 'text-nature-600' : 'text-gray-300'}>
                                                {t.unread_count > 0 ? `${t.unread_count} New Message` : 'Completed'}
                                            </span>
                                            <span className="text-nature-500 group-hover:translate-x-1 transition-transform flext items-center gap-1">
                                                Open Chat →
                                            </span>
                                        </div>

                                        {t.unread_count > 0 && (
                                            <div className="absolute top-4 right-4 w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-sm ring-4 ring-nature-100"></div>
                                        )}
                                    </button>
                                ))}
                                {supportTickets.length === 0 && (
                                    <div className="col-span-full p-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">Sky is Clear</h3>
                                        <p className="text-sm text-gray-400">No support tickets found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-[750px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 animate-scaleUp">
                            {/* Chat Header */}
                            <div className="p-4 bg-nature-900 text-white flex items-center justify-between shadow-lg z-10">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setSelectedTicket(null)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 font-black text-xs uppercase tracking-widest"
                                    >
                                        <XCircle className="w-6 h-6" /> <span className="hidden sm:inline">Back to Inbox</span>
                                    </button>
                                    <div className="h-8 w-[2px] bg-white/10"></div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-white border border-white/20">
                                            {selectedTicket.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-white text-sm leading-tight uppercase tracking-tighter">
                                                {selectedTicket.full_name || selectedTicket.username}
                                            </h3>
                                            <p className="text-[9px] text-nature-300 font-bold uppercase tracking-widest">
                                                {selectedTicket.email || 'Plant Buyer'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-2">
                                    <span className="text-[10px] bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 font-black uppercase tracking-widest">
                                        Ticket ID: {selectedTicket.user_id}
                                    </span>
                                </div>
                            </div>

                            {/* Chat History */}
                            <div
                                ref={chatScrollRef}
                                className="flex-1 overflow-y-auto p-6 space-y-6 bg-nature-50/50 scrollbar-hide"
                            >
                                {ticketHistory.map(m => (
                                    <div key={m.id} className={`flex ${m.is_admin_reply ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] md:max-w-[60%] space-y-1.5`}>
                                            <div className={`p-4 rounded-3xl shadow-sm ${m.is_admin_reply ? 'bg-nature-900 text-white rounded-tr-none' : 'bg-white text-gray-800 border-gray-100 border rounded-tl-none'}`}>
                                                {m.image && (
                                                    <a href={m.image} target="_blank" rel="noopener noreferrer" className="block mb-3 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 hover:opacity-90 transition-opacity ring-1 ring-gray-100">
                                                        <img src={m.image} alt="Ref Attachment" className="w-full h-auto max-h-96 object-contain" />
                                                    </a>
                                                )}
                                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.message}</p>
                                            </div>
                                            <p className={`text-[9px] text-gray-400 font-black px-2 uppercase tracking-tight ${m.is_admin_reply ? 'text-right' : 'text-left'}`}>
                                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {m.is_admin_reply ? 'Admin Support' : 'Customer'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chat Footer / Reply Area */}
                            <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-5px_30px_rgba(0,0,0,0.04)]">
                                {replyImage && (
                                    <div className="mb-4 relative inline-block p-1 bg-white rounded-2xl border-2 border-nature-600 shadow-xl animate-bounce-subtle">
                                        <img src={URL.createObjectURL(replyImage)} alt="Preview" className="w-24 h-24 rounded-xl object-cover" />
                                        <button
                                            onClick={() => setReplyImage(null)}
                                            className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-black text-xs shadow-md border-2 border-white"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                                <form onSubmit={handleSendReply} className="flex gap-4 items-end">
                                    <label className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-nature-100 hover:text-nature-700 cursor-pointer transition-all border border-gray-100 shadow-sm">
                                        <Image className="w-6 h-6" />
                                        <input type="file" className="hidden" accept="image/*" onChange={e => setReplyImage(e.target.files[0])} />
                                    </label>
                                    <div className="flex-1">
                                        <textarea
                                            rows="1"
                                            className="w-full bg-gray-50 border-gray-100 border-2 focus:border-nature-600 focus:ring-0 rounded-2xl px-6 py-4 text-sm font-bold resize-none transition-all outline-none"
                                            placeholder="Type your reply to the customer..."
                                            value={replyText}
                                            style={{ minHeight: '56px', maxHeight: '150px' }}
                                            onChange={e => {
                                                setReplyText(e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendReply(e);
                                                }
                                            }}
                                        />
                                    </div>
                                    <button
                                        disabled={!replyText.trim() && !replyImage}
                                        className="h-[56px] px-10 bg-nature-900 text-white rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-30 font-black uppercase text-xs tracking-widest flex items-center gap-2 group"
                                    >
                                        Send <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                </form>
                                <div className="mt-3 flex justify-between items-center text-[10px] font-black uppercase text-gray-400 px-2 tracking-tighter">
                                    <span>Press Shift + Enter for new lines</span>
                                    <span className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Standard Support Protocol Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}



            {/* Image Inspection Modal */}
            {enlargedImage && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn" onClick={() => setEnlargedImage(null)}>
                    <button className="absolute top-6 right-6 text-white hover:text-nature-400 transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20">
                        <XCircle className="w-10 h-10" />
                    </button>
                    <div className="max-w-4xl max-h-[90vh] bg-white p-4 rounded-3xl shadow-2xl relative animate-scaleUp" onClick={e => e.stopPropagation()}>
                        <img src={enlargedImage} alt="Inspection" className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-inner" />
                        <div className="mt-4 flex justify-between items-center text-nature-900 border-t border-gray-100 pt-4 px-2">
                            <span className="font-black uppercase text-sm tracking-widest flex items-center gap-2">
                                <Package className="w-5 h-5 text-nature-600" /> Botanical Inspection Mode
                            </span>
                            <button
                                onClick={() => setEnlargedImage(null)}
                                className="px-8 py-3 bg-nature-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
                            >
                                Close Inspection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'subscriptions' && (
                <div className="card overflow-hidden shadow-xl border-none">
                    <div className="p-6 border-b border-gray-100 bg-nature-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-nature-800 uppercase tracking-tighter">
                            <Plus className="text-nature-600 w-6 h-6" /> {t('subscriptionPlans')}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-nature-900 border-b border-nature-800 text-nature-100">
                                <tr>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider text-center w-16">#</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('userInfo')}</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('customerAddress')}</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('packageInfo')}</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('duration')}</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('nextDeliveryDate')}</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider">{t('status')}</th>
                                    <th className="p-5 font-semibold text-sm uppercase tracking-wider text-center">{t('action')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {subscriptions.length === 0 ? (
                                    <tr><td colSpan="8" className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest">{t('noSubscriptionsFound')}</td></tr>
                                ) : (
                                    subscriptions.map((s, idx) => {
                                        let durationStr = 'Unknown';
                                        let plan = s.plan_type.toLowerCase();
                                        if (plan.includes('3m')) durationStr = '3m';
                                        else if (plan.includes('6m')) durationStr = '6m';
                                        else if (plan.includes('12m')) durationStr = '12m';
                                        else if (plan.includes('24m')) durationStr = '24m';

                                        const dueTomorrow = isDueTomorrow(s.next_delivery_date);

                                        return (
                                            <tr key={s.id} className="hover:bg-nature-50/50 transition-colors border-b border-nature-50">
                                                <td className="p-5 text-center font-bold text-gray-400">{idx + 1}</td>
                                                <td className="p-5">
                                                    <div className="font-bold text-gray-800 uppercase tracking-tight text-xs">{s.user ? s.user_full_name || s.user_username : s.customer_name}</div>
                                                    <div className="text-gray-500 font-mono text-xs">{s.user ? s.user_phone || 'No Phone' : s.customer_phone}</div>
                                                </td>
                                                <td className="p-5 text-[10px] text-gray-600 leading-relaxed max-w-[150px] break-words">
                                                    {s.shipping_address || s.user_address || 'No Address Provided'}
                                                    {s.district && <span className="block font-bold text-nature-800 tracking-widest mt-0.5">({s.district})</span>}
                                                </td>
                                                <td className="p-5 font-black text-nature-800 uppercase text-[10px] tracking-tight">{s.plan_type}</td>
                                                <td className="p-5 font-bold text-gray-600 uppercase text-xs">{durationStr}</td>
                                                <td className="p-5 font-mono text-xs flex items-center gap-2">
                                                    {formatRegDate(s.next_delivery_date)}
                                                    {dueTomorrow && s.status === 'active' && (
                                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Due for Delivery Tomorrow"></span>
                                                    )}
                                                </td>
                                                <td className="p-5">
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                                                        s.status === 'active' ? 'bg-green-100 border-green-200 text-green-800' :
                                                        s.status === 'completed' ? 'bg-nature-900 border-nature-900 text-white' :
                                                        s.status === 'expired' ? 'bg-red-100 border-red-200 text-red-800' :
                                                        'bg-yellow-100 border-yellow-200 text-yellow-800'
                                                    }`}>
                                                        {t(s.status) || s.status}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <button
                                                        onClick={() => setSelectedSub(s)}
                                                        className="px-4 py-2 bg-white text-nature-700 font-bold border border-nature-200 hover:bg-nature-50 rounded-xl transition text-[10px] uppercase tracking-widest shadow-sm"
                                                    >
                                                        {t('viewDetails')}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Customer Details Modal for Subscription */}
            {selectedSub && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-nature-900 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Plus className="w-5 h-5"/> {t('subscriptionDetails') || 'Subscription Details'}</h3>
                            <button onClick={() => setSelectedSub(null)} className="text-white/60 hover:text-white transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t('userInfo')}</h4>
                                <p className="font-bold text-gray-800 text-sm">{selectedSub.user ? selectedSub.user_full_name || selectedSub.user_username : selectedSub.customer_name}</p>
                                <p className="text-gray-500 font-mono text-sm">{selectedSub.user ? selectedSub.user_phone : selectedSub.customer_phone}</p>
                            </div>
                            
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Detailed Address</h4>
                                <p className="text-gray-600 bg-nature-50 p-3 rounded-xl border border-nature-100 text-sm leading-relaxed">
                                    {selectedSub.shipping_address || selectedSub.user_address || 'No Address Provided'}<br/>
                                    {selectedSub.district && <span className="font-bold text-nature-800 uppercase text-[10px] tracking-widest mt-1 block">District: {selectedSub.district}</span>}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t('paymentStatus')}</h4>
                                    <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${
                                            selectedSub.payment_status === 'paid' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-50 border-red-100 text-red-600'
                                    }`}>
                                        {t(selectedSub.payment_status) || selectedSub.payment_status}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t('deliveries')}</h4>
                                    <p className="font-bold text-gray-800 text-sm bg-gray-50 px-3 py-1 rounded border inline-block">
                                        {selectedSub.deliveries_completed} {t('completed')}
                                    </p>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('orderHistory')}</h4>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-48 overflow-y-auto space-y-2">
                                    {!selectedSub.history || selectedSub.history.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center font-bold">No deliveries completed yet.</p>
                                    ) : (
                                        selectedSub.history.map((h, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs p-2 bg-white rounded border border-gray-100 shadow-sm">
                                                <span className="font-bold text-nature-800 uppercase">Delivery #{h.delivery}</span>
                                                <span className="text-gray-500 font-mono tracking-tighter">{formatRegDate(h.date)}</span>
                                                <span className="text-[9px] font-black bg-nature-100 text-nature-700 px-2 py-0.5 rounded uppercase">{h.status}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            
                            {selectedSub.status !== 'completed' && selectedSub.status !== 'expired' && (
                                <button
                                    onClick={() => handleMarkShipped(selectedSub.id)}
                                    className="w-full bg-nature-600 hover:bg-nature-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                                >
                                    {t('markShipped')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'shipfast_merchant' && (
                <div className="card shadow-xl border-none">
                    <ShipfastMerchant userRole="admin" />
                </div>
            )}

            {!loading && activeTab === 'shipfast_admin' && (
                <div className="card shadow-xl border-none">
                    <ShipfastAdmin />
                </div>
            )}

            {!loading && activeTab === 'botanists' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Service Requests */}
                        <div className="card overflow-hidden shadow-xl border-none">
                            <div className="p-6 border-b border-gray-100 bg-nature-50 flex justify-between items-center">
                                <h2 className="text-xl font-black text-nature-800 flex items-center gap-2">
                                    <Stethoscope className="w-6 h-6 text-nature-600" /> Service Requests
                                </h2>
                                <span className="text-[10px] font-black text-gray-400 bg-white px-3 py-1 rounded-full">{botanistRequests.length} Pending</span>
                            </div>
                            <div className="p-6 space-y-4">
                                {botanistRequests.map(req => (
                                    <div key={req.id} className="p-5 bg-nature-50/50 rounded-2xl border border-nature-50 hover:border-nature-100 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-black text-gray-900">#{req.id} - {req.user}</h4>
                                                <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
                                                    <MapPin size={10} /> {req.location}
                                                </p>
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${req.status === 'requested' ? 'bg-amber-100 text-amber-700' : 'bg-nature-100 text-nature-700'}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl mb-4 border border-nature-50">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Symptoms</p>
                                            <p className="text-xs text-gray-600 font-medium italic">"{req.symptoms}"</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {req.status === 'requested' ? (
                                                <button 
                                                    onClick={() => {
                                                        const botanist = allBotanists[Math.floor(Math.random() * allBotanists.length)].name;
                                                        const updated = botanistRequests.map(r => r.id === req.id ? {...r, status: 'assigned', botanist: botanist} : r);
                                                        setBotanistRequests(updated);
                                                        localStorage.setItem('local_botanist_appointments', JSON.stringify(updated));
                                                        window.dispatchEvent(new Event('storage'));
                                                    }}
                                                    className="flex-1 bg-nature-900 text-white font-black py-2.5 rounded-lg text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                                                >
                                                    Assign Nearest Botanist
                                                </button>
                                            ) : (
                                                <div className="flex-1 flex gap-2">
                                                    <select 
                                                        className="flex-1 text-[10px] font-black uppercase bg-white border border-nature-100 rounded-lg px-2"
                                                        value={req.status}
                                                        onChange={(e) => {
                                                            const updated = botanistRequests.map(r => r.id === req.id ? {...r, status: e.target.value} : r);
                                                            setBotanistRequests(updated);
                                                            localStorage.setItem('local_botanist_appointments', JSON.stringify(updated));
                                                            window.dispatchEvent(new Event('storage'));
                                                        }}
                                                    >
                                                        <option value="assigned">Assigned</option>
                                                        <option value="in_transit">In Transit</option>
                                                        <option value="treating">Treating</option>
                                                        <option value="completed">Completed</option>
                                                    </select>
                                                    {req.status === 'completed' && (
                                                        <button className="bg-nature-100 text-nature-700 px-3 py-2 rounded-lg font-black text-[10px] uppercase">
                                                            Upload Plan
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Botanist Management */}
                        <div className="card overflow-hidden shadow-xl border-none">
                            <div className="p-6 border-b border-gray-100 bg-nature-50 flex justify-between items-center">
                                <h2 className="text-xl font-black text-nature-800 flex items-center gap-2">
                                    <Users className="w-6 h-6 text-nature-600" /> Expert Botanists
                                </h2>
                                <button className="bg-nature-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">+ Register New</button>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {allBotanists.map(bot => (
                                        <div key={bot.id} className="flex items-center justify-between p-4 bg-white border border-nature-50 rounded-2xl hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-nature-50 rounded-xl flex items-center justify-center text-nature-700 font-black">
                                                    {bot.name[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 text-sm">Botanist {bot.name}</h4>
                                                    <p className="text-[10px] font-black text-nature-600 uppercase tracking-widest mt-0.5">
                                                        {bot.specialty || 'Generalist'} • {bot.experience || '2+'} Years Exp.
                                                    </p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                                                        <Star size={10} className="text-amber-500 fill-amber-500" /> {bot.rating} • {bot.location}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${bot.active_tasks > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {bot.active_tasks > 0 ? `${bot.active_tasks} Active Task` : 'Available'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'potting' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Potting Requests */}
                        <div className="card overflow-hidden shadow-xl border-none">
                            <div className="p-6 border-b border-gray-100 bg-nature-50 flex justify-between items-center">
                                <h2 className="text-xl font-black text-nature-800 flex items-center gap-2">
                                    <Hammer className="w-6 h-6 text-nature-600" /> Potting Requests
                                </h2>
                                <span className="text-[10px] font-black text-gray-400 bg-white px-3 py-1 rounded-full">{pottingRequests.length} Total</span>
                            </div>
                            <div className="p-6 space-y-4">
                                {pottingRequests.map(req => (
                                    <div key={req.id} className="p-5 bg-nature-50/50 rounded-2xl border border-nature-50 hover:border-nature-100 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-black text-gray-900">#{req.id} - {req.user}</h4>
                                                <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
                                                    <MapPin size={10} /> {req.location || 'N/A'}
                                                </p>
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${req.status === 'requested' ? 'bg-amber-100 text-amber-700' : 'bg-nature-100 text-nature-700'}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl mb-4 border border-nature-50">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Items & Plan</p>
                                            <p className="text-xs text-gray-900 font-black">{req.pots}</p>
                                            <p className="text-[9px] text-nature-600 font-bold mt-0.5">{req.package}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {req.status === 'requested' ? (
                                                <button 
                                                    onClick={() => {
                                                        const expert = allGardeners[Math.floor(Math.random() * allGardeners.length)].name;
                                                        const updated = pottingRequests.map(r => r.id === req.id ? {...r, status: 'assigned', expert: expert} : r);
                                                        setPottingRequests(updated);
                                                        localStorage.setItem('local_potting_requests', JSON.stringify(updated));
                                                        window.dispatchEvent(new Event('storage'));
                                                    }}
                                                    className="flex-1 bg-nature-900 text-white font-black py-2.5 rounded-lg text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                                                >
                                                    Assign Nearest Expert
                                                </button>
                                            ) : (
                                                <select 
                                                    className="flex-1 text-[10px] font-black uppercase bg-white border border-nature-100 rounded-lg px-2 py-2"
                                                    value={req.status}
                                                    onChange={(e) => {
                                                        const updated = pottingRequests.map(r => r.id === req.id ? {...r, status: e.target.value} : r);
                                                        setPottingRequests(updated);
                                                        localStorage.setItem('local_potting_requests', JSON.stringify(updated));
                                                        window.dispatchEvent(new Event('storage'));
                                                    }}
                                                >
                                                    <option value="assigned">Assigned</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gardener Management */}
                        <div className="card overflow-hidden shadow-xl border-none">
                            <div className="p-6 border-b border-gray-100 bg-nature-50 flex justify-between items-center">
                                <h2 className="text-xl font-black text-nature-800 flex items-center gap-2">
                                    <Users className="w-6 h-6 text-nature-600" /> Gardening Experts
                                </h2>
                                <button className="bg-nature-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">+ Register New</button>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {allGardeners.map(bot => (
                                        <div key={bot.id} className="flex items-center justify-between p-4 bg-white border border-nature-50 rounded-2xl hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-nature-50 rounded-xl flex items-center justify-center text-nature-700 font-black">
                                                    {bot.name[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 text-sm">Expert {bot.name}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Star size={10} className="text-amber-500 fill-amber-500" /> {bot.rating} • {bot.location}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${bot.active_tasks > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {bot.active_tasks > 0 ? `${bot.active_tasks} Active Task` : 'Available'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fraud Checker Modal */}
            {isFraudModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
                        <div className="p-6 bg-nature-900 flex justify-between items-center text-white">
                            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <Search className="w-5 h-5" /> Courier Fraud Check
                            </h3>
                            <button onClick={() => setIsFraudModalOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8">
                            {fraudLoading ? (
                                <div className="text-center py-10 space-y-4">
                                    <div className="w-12 h-12 border-4 border-nature-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-gray-500 font-bold animate-pulse tracking-widest text-sm">SCANNING COURIER DATABASES...</p>
                                    <p className="text-xs text-gray-400">Checking: {checkingPhone}</p>
                                </div>
                            ) : fraudData ? (
                                <div className="space-y-6">
                                    <div className={`p-4 rounded-2xl flex items-center gap-4 border ${fraudData.isRisky ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                                        {fraudData.isRisky ? <AlertTriangle className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                                        <div>
                                            <p className="text-xs uppercase font-black tracking-widest opacity-70">Safety Status</p>
                                            <h4 className="text-xl font-black">{fraudData.status}</h4>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-2xl font-black text-gray-800">{fraudData.totalOrders}</p>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Total Orders</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-2xl font-black text-green-600">{fraudData.delivered}</p>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Delivered</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-2xl font-black text-red-500">{fraudData.returned}</p>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Returned</p>
                                        </div>
                                    </div>

                                    <div className="bg-nature-50 p-4 rounded-2xl border border-nature-100 italic text-sm text-nature-700">
                                        "Consolidated data from Steadfast, RedX, and Pathao history."
                                    </div>

                                    <button
                                        onClick={() => setIsFraudModalOpen(false)}
                                        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
                                    >
                                        Close Report
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'botanist_apps' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div>
                            <h2 className="text-xl font-black text-nature-900 uppercase tracking-tight">Pending Botanist Applications</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                                Review security documents and verify expertise
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-nature-50 text-nature-700 rounded-xl border border-nature-100 font-black text-xs">
                            <GraduationCap className="w-4 h-4" />
                            {botanistApps.filter(a => a.status === 'pending').length} New Applications
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {botanistApps.filter(a => a.status === 'pending').length === 0 ? (
                            <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No Pending Applications</p>
                            </div>
                        ) : (
                            botanistApps.filter(app => app.status === 'pending').map(app => (
                                <div key={app.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 flex flex-col md:flex-row justify-between gap-8 animate-slideUp">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 leading-tight uppercase tracking-tighter italic">
                                                    {app.name}
                                                </h3>
                                                <p className="text-[10px] font-black text-nature-600 uppercase tracking-widest flex items-center gap-2 mt-1">
                                                    <MapPin className="w-3 h-3" /> {app.area} • ID: {app.id}
                                                </p>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${
                                                app.status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                app.status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                                'bg-red-50 border-red-200 text-red-700'
                                            }`}>
                                                {app.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone</p>
                                                <p className="text-sm font-bold text-gray-800">{app.phone}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Exp.</p>
                                                <p className="text-sm font-bold text-gray-800">{app.experience} Years</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Specialty</p>
                                                <p className="text-sm font-bold text-gray-800 truncate" title={app.specialty}>{app.specialty}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Applied</p>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {formatRegDate(app.applied_at)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex-1 p-4 bg-nature-50 rounded-2xl border border-nature-100 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[8px] font-black text-nature-800 uppercase tracking-widest">NID Copy</p>
                                                    {app.nid_copy && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const link = document.createElement('a');
                                                                link.href = app.nid_copy;
                                                                link.download = `NID_${app.name.replace(/\s/g, '_')}`;
                                                                link.click();
                                                            }}
                                                            className="p-1.5 bg-white rounded-lg border border-nature-200 text-nature-600 hover:text-nature-900 transition-colors"
                                                            title="Download NID"
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div 
                                                    onClick={() => app.nid_copy && setPreviewImage(app.nid_copy)}
                                                    className={`relative group overflow-hidden rounded-xl h-24 border-2 border-white shadow-sm ${app.nid_copy ? 'cursor-pointer' : 'cursor-default bg-gray-100 flex items-center justify-center'}`}
                                                >
                                                    {app.nid_copy ? (
                                                        <>
                                                            <img 
                                                                src={app.nid_copy} 
                                                                alt="NID Preview"
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                onError={(e) => {
                                                                    const parent = e.target.closest('div');
                                                                    if (parent) {
                                                                        parent.innerHTML = `
                                                                            <div class="flex flex-col items-center justify-center h-full bg-red-50 p-2">
                                                                                <svg class="w-6 h-6 text-red-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                                                                <p class="text-[7px] font-black text-red-500 uppercase text-center leading-tight">File Corrupted or Missing</p>
                                                                            </div>
                                                                        `;
                                                                    }
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-nature-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <ExternalLink className="text-white w-5 h-5" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center">
                                                            <ShieldAlert className="w-6 h-6 mx-auto text-gray-300 mb-1" />
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none px-2">No Image Provided</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[9px] font-bold text-nature-400 truncate text-center">{app.nid_copy ? app.nid_copy.split('/').pop() : 'N/A'}</p>
                                            </div>

                                            <div className="flex-1 p-4 bg-nature-50 rounded-2xl border border-nature-100 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[8px] font-black text-nature-800 uppercase tracking-widest">Certificate</p>
                                                    {app.certificate && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const link = document.createElement('a');
                                                                link.href = app.certificate;
                                                                link.download = `Cert_${app.name.replace(/\s/g, '_')}`;
                                                                link.click();
                                                            }}
                                                            className="p-1.5 bg-white rounded-lg border border-nature-200 text-nature-600 hover:text-nature-900 transition-colors"
                                                            title="Download Certificate"
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div 
                                                    onClick={() => app.certificate && setPreviewImage(app.certificate)}
                                                    className={`relative group overflow-hidden rounded-xl h-24 border-2 border-white shadow-sm ${app.certificate ? 'cursor-pointer' : 'cursor-default bg-gray-100 flex items-center justify-center'}`}
                                                >
                                                    {app.certificate ? (
                                                        <>
                                                            <img 
                                                                src={app.certificate} 
                                                                alt="Cert Preview"
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                onError={(e) => {
                                                                    const parent = e.target.closest('div');
                                                                    if (parent) {
                                                                        parent.innerHTML = `
                                                                            <div class="flex flex-col items-center justify-center h-full bg-red-50 p-2">
                                                                                <svg class="w-6 h-6 text-red-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                                                                <p class="text-[7px] font-black text-red-500 uppercase text-center leading-tight">File Corrupted or Missing</p>
                                                                            </div>
                                                                        `;
                                                                    }
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-nature-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <ExternalLink className="text-white w-5 h-5" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center">
                                                            <GraduationCap className="w-6 h-6 mx-auto text-gray-300 mb-1" />
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none px-2">No Image Provided</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[9px] font-bold text-nature-400 truncate text-center">{app.certificate ? app.certificate.split('/').pop() : 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {app.status === 'pending' && (
                                        <div className="flex flex-col gap-3 justify-center border-l border-gray-100 pl-8 md:w-48">
                                             <button 
                                                onClick={async () => {
                                                    try {
                                                        const response = await api.patch(`/botanist-applications/${app.id}/approve/`, {}, {
                                                            headers: { 'X-CSRFToken': getCookie('csrftoken') }
                                                        });
                                                        
                                                        if (response.data.success) {
                                                            // 1. Technical Cleanup: Remove from pending list immediately
                                                            setBotanistApps(prev => prev.filter(a => a.id !== app.id));
                                                            
                                                            // 2. Automatically Migrate to Expert List
                                                            const newBotanist = {
                                                                id: app.id,
                                                                name: app.name,
                                                                rating: 5.0,
                                                                location: app.area,
                                                                specialty: app.specialty,
                                                                experience: app.experience,
                                                                active_tasks: 0
                                                            };
                                                            setAllBotanists(prev => [...prev, newBotanist]);
                                                            
                                                            setSuccessMessage('Botanist Approved Successfully');
                                                            setTimeout(() => setSuccessMessage(''), 5000);
                                                        }
                                                    } catch (e) {
                                                        console.error("Error approving:", e.response?.data || e.message);
                                                        alert(`Failed to approve botanist: ${e.response?.data?.error || e.message}`);
                                                    }
                                                }}
                                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        const response = await api.patch(`/botanist-applications/${app.id}/reject/`, {}, {
                                                            headers: { 'X-CSRFToken': getCookie('csrftoken') }
                                                        });
                                                        if (response.data.success) {
                                                            // Technical Cleanup: Remove from pending list immediately
                                                            setBotanistApps(prev => prev.filter(a => a.id !== app.id));
                                                            setSuccessMessage('Botanist Application Rejected');
                                                            setTimeout(() => setSuccessMessage(''), 5000);
                                                        }
                                                    } catch (e) {
                                                        console.error("Error rejecting:", e.response?.data || e.message);
                                                        alert(`Failed to reject botanist: ${e.response?.data?.error || e.message}`);
                                                    }
                                                }}
                                                className="w-full py-4 bg-white text-red-500 border-2 border-red-50 font-black uppercase tracking-widest text-xs hover:bg-red-50 transition-all"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Document Preview Lightbox */}
            {previewImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fadeIn" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-4xl w-full animate-scaleUp" onClick={e => e.stopPropagation()}>
                        <div className="absolute -top-14 right-0 flex items-center gap-4">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const link = document.createElement('a');
                                    link.href = previewImage;
                                    link.download = `Document_${new Date().getTime()}.jpg`;
                                    link.click();
                                }}
                                className="bg-nature-600 text-white px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-nature-700 transition-all flex items-center gap-2 shadow-xl"
                            >
                                <Download className="w-4 h-4" /> Download Original
                            </button>
                            <button 
                                onClick={() => setPreviewImage(null)}
                                className="text-white hover:text-nature-400 transition-colors flex items-center gap-2 font-black uppercase text-xs tracking-widest"
                            >
                                Close Preview <XCircle className="w-8 h-8" />
                            </button>
                        </div>
                        <div className="bg-white p-2 rounded-[2rem] shadow-2xl overflow-hidden border-4 border-white/20 relative group">
                            <img 
                                src={previewImage} 
                                alt="Large Preview" 
                                className="w-full h-auto rounded-[1.5rem] max-h-[80vh] object-contain shadow-inner" 
                                onError={(e) => {
                                    e.target.parentElement.innerHTML = `
                                        <div class="bg-gray-50 p-20 text-center rounded-[1.5rem]">
                                            <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                            </div>
                                            <h3 class="text-xl font-black text-gray-900 uppercase tracking-tight">File Corrupted or Missing</h3>
                                            <p class="text-gray-500 font-bold mt-2">The original document could not be retrieved from the server.</p>
                                        </div>
                                    `;
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
