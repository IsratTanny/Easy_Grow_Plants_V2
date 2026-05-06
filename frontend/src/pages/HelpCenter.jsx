import { useState, useEffect, useRef } from 'react';
import { api } from '../api/axios';
import { Send, Image, User, Bell, CheckCircle, Clock, AlertCircle, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HelpCenter() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [hasOrders, setHasOrders] = useState(false);
    const [error, setError] = useState('');
    const scrollRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
        checkUserStatus();

        // Polling for new messages every 10 seconds
        const interval = setInterval(fetchHistory, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/support/history/');
            setMessages(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) navigate('/login');
            setLoading(false);
        }
    };

    const checkUserStatus = async () => {
        try {
            const res = await api.get('/auth/me/');
            // Check if user has orders
            // Based on the requirement, we should check if user.orders.exists()
            // The /auth/me/ endpoint might not have this info, so we can check /orders/
            const ordersRes = await api.get('/orders/');
            setHasOrders(ordersRes.data.length > 0);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() && !image) return;
        if (!hasOrders) {
            setError("Only verified customers (those who have made a purchase) can send messages.");
            return;
        }

        setSending(true);
        setError('');
        try {
            const formData = new FormData();
            if (input.trim()) formData.append('message', input);
            if (image) formData.append('image', image);

            await api.post('/support/send/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setInput('');
            setImage(null);
            setImagePreview(null);
            fetchHistory();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-10">
            <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-nature-100">
                <div className="p-3 bg-nature-100 rounded-2xl text-nature-600">
                    <Bell className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Help Center</h1>
                    <p className="text-gray-500 font-medium">How can we help you today?</p>
                </div>
            </div>

            {!hasOrders && !loading && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-amber-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-amber-800 font-bold text-sm">Action Required</p>
                        <p className="text-amber-700 text-sm">
                            Support chat is exclusive to verified customers. Please purchase a plant from our
                            <button onClick={() => navigate('/marketplace')} className="mx-1 font-bold underline">Marketplace</button>
                            to activate this feature.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-[600px]">
                {/* Chat Header */}
                <div className="bg-nature-900 p-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-nature-700 rounded-full flex items-center justify-center">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold">Official Support</p>
                            <p className="text-[10px] uppercase tracking-widest text-nature-300">Online</p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-4 bg-nature-50/50"
                >
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="w-8 h-8 border-4 border-nature-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-10 space-y-4 opacity-50 capitalize">
                            <Clock className="w-12 h-12 mx-auto text-nature-300" />
                            <p className="font-bold text-nature-900">No message history yet.</p>
                            <p className="text-sm">Start a conversation to get help with your plants.</p>
                        </div>
                    ) : (
                        messages.map((m) => (
                            <div
                                key={m.id}
                                className={`flex ${m.is_admin_reply ? 'justify-start' : 'justify-end'}`}
                            >
                                <div className={`max-w-[80%] space-y-1`}>
                                    <div
                                        className={`p-4 rounded-2xl shadow-sm ${m.is_admin_reply
                                            ? 'bg-white text-gray-800 border-nature-100 border rounded-tl-none'
                                            : 'bg-nature-600 text-white rounded-tr-none'
                                            }`}
                                    >
                                        {m.image && (
                                            <div className="mb-2 rounded-lg overflow-hidden border border-nature-200">
                                                <img src={m.image} alt="Support content" className="w-full h-auto max-h-64 object-cover" />
                                            </div>
                                        )}
                                        <p className="text-sm leading-relaxed">{m.message}</p>
                                    </div>
                                    <div className={`flex items-center gap-2 px-1 ${m.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        {!m.is_admin_reply && m.is_read && (
                                            <CheckCircle className="w-3 h-3 text-nature-500" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    {imagePreview && (
                        <div className="mb-4 relative w-32 h-32 rounded-xl group overflow-hidden border-2 border-nature-500">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                onClick={() => { setImage(null); setImagePreview(null); }}
                                className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                                Remove
                            </button>
                        </div>
                    )}

                    {error && <p className="text-red-500 text-xs font-bold mb-2">{error}</p>}

                    <form onSubmit={handleSend} className="flex items-center gap-3">
                        <label className={`p-3 rounded-xl transition-colors cursor-pointer ${!hasOrders ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-nature-50 text-nature-600 hover:bg-nature-100'}`}>
                            <Image className="w-5 h-5" />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={!hasOrders}
                            />
                        </label>
                        <input
                            type="text"
                            className="flex-1 bg-gray-50 border-none focus:ring-2 focus:ring-nature-500 rounded-xl px-4 py-3 text-sm outline-none disabled:opacity-50"
                            placeholder={hasOrders ? "Describe your problem..." : "Purchase a plant to chat"}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={!hasOrders || sending}
                        />
                        <button
                            type="submit"
                            disabled={sending || (!input.trim() && !image) || !hasOrders}
                            className={`p-3 rounded-xl shadow-lg transition-all ${!hasOrders || sending || (!input.trim() && !image)
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-nature-600 text-white hover:bg-nature-700 active:scale-95'
                                }`}
                        >
                            {sending ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-nature-50 p-6 rounded-2xl border border-nature-100 border-l-4 border-l-nature-600">
                    <h3 className="font-black text-nature-900 mb-2">Upload Photo for Quick Fix</h3>
                    <p className="text-sm text-nature-700 opacity-80 leading-relaxed">
                        Attach a clear photo of your plant's leaves or soil. Our experts will analyze it and reply within 24 hours.
                    </p>
                </div>
                <div className="bg-nature-900 text-white p-6 rounded-2xl">
                    <h3 className="font-black mb-2 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-nature-400" />
                        Order History
                    </h3>
                    <p className="text-sm text-nature-300 leading-relaxed">
                        We use your order history (৳) to prioritize your tickets. High-value plant owners get immediate priority in the queue.
                    </p>
                </div>
            </div>
        </div>
    );
}
