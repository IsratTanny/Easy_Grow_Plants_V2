import React, { useState, useEffect, useRef } from 'react';
import { api, isAuthenticated } from '../api/axios';
import { Leaf, MessageSquare, Repeat, X, Send, Image as ImageIcon, MapPin, CheckCircle, Trash2 } from 'lucide-react';

export default function MyExchanges() {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem('user_email'); 
    const currentUsername = localStorage.getItem('user_name') || 'You';
    
    // Chat Modal State
    const [chatProposal, setChatProposal] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchProposals();
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages]);

    const fetchProposals = async () => {
        try {
            if (!isAuthenticated()) return;
            const res = await api.get('/exchange-proposals/');
            setProposals(res.data);
        } catch (error) {
            console.error("Failed to fetch proposals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChat = async (proposal) => {
        setChatProposal(proposal);
        fetchChatMessages(proposal.id);
    };

    // Auto-refresh chat messages every 3 seconds when modal is open
    useEffect(() => {
        let interval;
        if (chatProposal) {
            interval = setInterval(() => {
                fetchChatMessages(chatProposal.id);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [chatProposal]);

    const fetchChatMessages = async (proposalId) => {
        try {
            const res = await api.get(`/exchange-messages/?proposal_id=${proposalId}`);
            setChatMessages(res.data);
        } catch (e) {
            console.error("Failed to fetch messages", e);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !imageFile) return;
        
        const formData = new FormData();
        formData.append('proposal', chatProposal.id);
        if(newMessage) formData.append('text', newMessage);
        if(imageFile) formData.append('image', imageFile);

        try {
            await api.post('/exchange-messages/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewMessage('');
            setImageFile(null);
            fetchChatMessages(chatProposal.id);
        } catch (error) {
            console.error("Msg send error", error);
        }
    };

    const sendLiveLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
                const formData = new FormData();
                formData.append('proposal', chatProposal.id);
                formData.append('text', `📍 Shared Live Location\n${mapLink}`);
                
                try {
                    await api.post('/exchange-messages/', formData);
                    fetchChatMessages(chatProposal.id);
                } catch (error) {
                    console.error("Location send error", error);
                }
            });
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    const markAsCompleted = async (proposal) => {
        try {
            await api.post(`/exchange-proposals/${proposal.id}/complete/`);
            alert("Exchange marked as completed!");
            fetchProposals();
        } catch (e) {
            console.error("Error completing", e);
        }
    };

    const deletePost = async (proposal) => {
        if(!window.confirm("Are you sure you want to delete this listing permanently?")) return;
        try {
            await api.delete(`/exchange-posts/${proposal.plant}/`);
            alert("Post deleted successfully.");
            fetchProposals();
        } catch (e) {
            console.error("Error deleting", e);
        }
    };

    if (!isAuthenticated()) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Leaf className="w-16 h-16 text-nature-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-700">Please Login</h2>
                <p className="text-gray-500">You must be logged in to view your exchanges.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-5xl px-4 py-12 min-h-screen">
            <h1 className="text-4xl font-black text-nature-800 mb-8 flex items-center gap-3">
                <Repeat className="w-8 h-8 text-nature-600" />
                My Exchanges
            </h1>
            
            {loading ? (
                <div className="text-center text-nature-600 py-20 animate-pulse">Loading history...</div>
            ) : proposals.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-nature-100 flex flex-col items-center">
                    <Repeat className="w-16 h-16 text-nature-200 mb-4" />
                    <h2 className="text-xl font-bold text-gray-700">No exchange history found</h2>
                    <p className="text-gray-500 mt-2">Head over to the Plant Exchange to start trading!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {proposals.map(prop => {
                        const isOwner = prop.sender_username !== currentUsername;
                        return (
                        <div key={prop.id} className="bg-white p-6 rounded-2xl shadow-sm border border-nature-100 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">
                                        Proposal for: <span className="text-nature-600">{prop.plant_name}</span>
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {isOwner ? `Proposal From: ${prop.sender_username}` : `Sent to Owner`}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    prop.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    prop.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {prop.status === 'accepted' ? 'Completed' : prop.status}
                                </span>
                            </div>
                            
                            <div className="bg-nature-50 p-4 rounded-xl text-sm text-gray-700 italic border border-nature-100">
                                "{prop.message}"
                            </div>
                            
                            <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100">
                                <span className="text-xs text-gray-400">
                                    {new Date(prop.created_at).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-3">
                                    {isOwner && prop.status !== 'accepted' && (
                                        <>
                                            <button 
                                                onClick={() => markAsCompleted(prop)}
                                                className="bg-nature-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-nature-700 transition"
                                            >
                                                Mark as Swapped (Complete)
                                            </button>
                                            <button 
                                                onClick={() => deletePost(prop)}
                                                title="Delete Post"
                                                className="text-red-500 hover:text-red-700 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    <button 
                                        onClick={() => handleOpenChat(prop)}
                                        className="text-nature-600 hover:text-nature-800 font-bold text-sm flex items-center gap-2 px-2"
                                    >
                                        <MessageSquare className="w-4 h-4" /> Open Chat
                                    </button>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}

            {/* Chat Modal */}
            {chatProposal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                    <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ height: '70vh' }}>
                        
                        {/* Header */}
                        <div className="bg-nature-700 p-4 flex justify-between items-center text-white">
                            <div>
                                <h3 className="font-bold text-lg">Exchange Chat</h3>
                                <p className="text-xs text-nature-200">Regarding: {chatProposal.plant_name}</p>
                            </div>
                            <button onClick={() => setChatProposal(null)} className="p-1 hover:bg-nature-600 rounded text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                            {chatMessages.length === 0 ? (
                                <div className="text-center text-gray-400 my-auto">No messages yet. Say hi!</div>
                            ) : (
                                chatMessages.map((msg, idx) => {
                                    const isMe = msg.sender_username === currentUsername;
                                    return (
                                        <div key={idx} className={`max-w-[75%] rounded-xl p-3 ${
                                            isMe ? 'bg-nature-600 text-white self-end rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 self-start rounded-tl-none shadow-sm'
                                        }`}>
                                            {!isMe && <p className="text-xs font-bold text-nature-600 mb-1">{msg.sender_username}</p>}
                                            {msg.text && (
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {msg.text.includes('maps.google.com') ? (
                                                        <a href={msg.text.split('\n')[1]} target="_blank" rel="noreferrer" className="underline font-bold text-amber-200 hover:text-amber-100">
                                                            {msg.text.split('\n')[0]}
                                                        </a>
                                                    ) : msg.text}
                                                </p>
                                            )}
                                            {msg.image && (
                                                <img src={msg.image} alt="Upload" className="mt-2 rounded-lg max-h-40 object-cover" />
                                            )}
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                            {imageFile && (
                                <div className="mb-2 flex items-center gap-2 text-xs text-nature-600 bg-nature-50 p-2 rounded">
                                    <ImageIcon className="w-4 h-4" /> {imageFile.name}
                                    <button type="button" onClick={() => setImageFile(null)} className="ml-auto text-red-500"><X className="w-4 h-4"/></button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    title="Share Live Location"
                                    onClick={sendLiveLocation}
                                    className="p-2 text-amber-500 hover:bg-amber-50 rounded-full transition"
                                >
                                    <MapPin className="w-5 h-5" />
                                </button>
                                <label className="p-2 text-nature-500 hover:bg-nature-50 rounded-full cursor-pointer transition">
                                    <ImageIcon className="w-5 h-5" />
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => setImageFile(e.target.files[0])}
                                    />
                                </label>
                                <input 
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-nature-500 text-sm"
                                />
                                <button 
                                    type="submit"
                                    disabled={!newMessage.trim() && !imageFile}
                                    className="p-2 bg-nature-600 text-white rounded-full hover:bg-nature-700 disabled:opacity-50 transition"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
