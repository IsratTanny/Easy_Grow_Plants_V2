import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api, isAuthenticated } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Leaf, MapPin, Search, Plus, X, Heart, Star } from 'lucide-react';

export default function ExchangeDashboard() {
    const navigate = useNavigate();
    const isAuth = isAuthenticated();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterLocation, setFilterLocation] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterRarity, setFilterRarity] = useState('');

    // Modals
    const [showPostModal, setShowPostModal] = useState(false);
    const [showProposeModal, setShowProposeModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    // Form states
    const [postForm, setPostForm] = useState({
        plant_name: '',
        health_status: 'Healthy',
        looking_for: '',
        location: '',
        rarity: 'Common',
        plant_type: 'Indoor',
        image: null
    });

    const [proposeMessage, setProposeMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const queryLocation = filterLocation ? `?location=${encodeURIComponent(filterLocation)}` : '';
            const res = await api.get(`/exchange-posts/${queryLocation}`);
            setPosts(res.data || []);
        } catch (error) {
            console.error("Failed to fetch exchange posts", error);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when location filter changes, with a small debounce natively handled via user clicking search or just on blur
    // For simplicity, we can just fetch immediately but it's better to fetch on a button click or when filterType changes
    // Wait, let's keep it simple and just do it on useEffect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchPosts();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [filterLocation]);

    const handleCreatePostClick = () => {
        if (!isAuth) {
            navigate('/login');
            return;
        }
        setShowPostModal(true);
    };

    const handleProposeClick = (post) => {
        if (!isAuth) {
            navigate('/login');
            return;
        }
        setSelectedPost(post);
        setShowProposeModal(true);
    };

    const submitPost = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(postForm).forEach(key => {
            if (postForm[key] !== null) {
                formData.append(key, postForm[key]);
            }
        });

        try {
            await api.post('/exchange-posts/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowPostModal(false);
            setPostForm({
                plant_name: '', health_status: 'Healthy', looking_for: '',
                location: '', rarity: 'Common', plant_type: 'Indoor', image: null
            });
            fetchPosts();
        } catch (error) {
            console.error("Failed to submit post", error);
            toast.error("Error creating post.");
        }
    };

    const submitProposal = async (e) => {
        e.preventDefault();
        try {
            await api.post('/exchange-proposals/', {
                plant: selectedPost.id,
                receiver: selectedPost.user,
                message: proposeMessage
            });
            
            // Initiate Chat Thread
            const userId = localStorage.getItem('user_email') || 'unknown';
            const chatHistoryKey = `chat_history_${userId}`;
            const history = JSON.parse(localStorage.getItem(chatHistoryKey) || '[]');
            history.push({ 
                sender: 'user', 
                text: `I sent an exchange proposal to ${selectedPost.user_username} for their ${selectedPost.plant_name}.\nMessage: "${proposeMessage}"` 
            });
            history.push({ 
                sender: 'bot', 
                text: `Your proposal for ${selectedPost.plant_name} has been securely logged! ${selectedPost.user_username} will review it. You can track messages here.` 
            });
            localStorage.setItem(chatHistoryKey, JSON.stringify(history));
            window.dispatchEvent(new Event('storage'));

            setShowProposeModal(false);
            setProposeMessage('');
            setSuccessMessage("Exchange proposal sent successfully!");
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Failed to send proposal", error);
            let errMsg = "Error proposing exchange.";
            if (error.response && error.response.data) {
                if (Array.isArray(error.response.data)) {
                    errMsg = error.response.data[0];
                } else if (error.response.data.non_field_errors) {
                    errMsg = error.response.data.non_field_errors[0];
                } else if (error.response.data.detail) {
                    errMsg = error.response.data.detail;
                } else if (typeof error.response.data === 'object') {
                    const firstVal = Object.values(error.response.data)[0];
                    if (Array.isArray(firstVal)) errMsg = firstVal[0];
                    else if (typeof firstVal === 'string') errMsg = firstVal;
                }
            }
            toast.error("Error: " + errMsg);
        }
    };

    const filteredPosts = posts.filter(post => {
        if (filterLocation && !post.location.toLowerCase().includes(filterLocation.toLowerCase())) return false;
        if (filterType && post.plant_type !== filterType) return false;
        if (filterRarity && post.rarity !== filterRarity) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-nature-50 pb-20">
            {/* Header */}
            <div className="bg-nature-800 text-white py-12 px-4 shadow-md rounded-b-[3rem]">
                <div className="container mx-auto max-w-5xl text-center">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 flex justify-center items-center gap-3">
                        <Heart className="w-10 h-10 text-nature-300" />
                        Plant Exchange
                    </h1>
                    <p className="text-nature-200 text-lg max-w-2xl mx-auto">
                        Trade your lovely plants with the community. Find the perfect addition to your home garden!
                    </p>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl px-4 mt-8">
                {/* Filters */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full relative">
                        <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter by location..."
                            className="input relative pl-10 w-full"
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                        />
                    </div>
                    <select className="input w-full md:w-48" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="">All Types</option>
                        <option value="Indoor">Indoor</option>
                        <option value="Outdoor">Outdoor</option>
                        <option value="Succulent">Succulent</option>
                        <option value="Aquatic">Aquatic</option>
                    </select>
                    <select className="input w-full md:w-48" value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)}>
                        <option value="">All Rarities</option>
                        <option value="Common">Common</option>
                        <option value="Uncommon">Uncommon</option>
                        <option value="Rare">Rare</option>
                        <option value="Ultra Rare">Ultra Rare</option>
                    </select>
                    <button 
                        onClick={handleCreatePostClick}
                        className="btn btn-primary whitespace-nowrap px-6 py-3 font-bold shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Post a Plant
                    </button>
                </div>

                {/* Posts Feed */}
                {loading ? (
                    <div className="text-center text-nature-600 py-20 animate-pulse">Loading exchanges...</div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-nature-100 flex flex-col items-center">
                        <Leaf className="w-16 h-16 text-nature-200 mb-4" />
                        <h2 className="text-xl font-bold text-gray-700">No plants found</h2>
                        <p className="text-gray-500 mt-2">Try adjusting your filters or be the first to post!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPosts.map(post => {
                            const isDone = post.is_available === false || post.status === 'completed' || post.status === 'done';
                            return (
                            <div key={post.id} className="relative bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-nature-50 group flex flex-col">
                                <div className="h-56 relative overflow-hidden bg-nature-100">
                                    {isDone && (
                                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                                            <span className="bg-red-100/90 text-red-700 px-6 py-2 rounded-full font-black text-lg shadow-lg border border-red-200 transform -rotate-12 uppercase tracking-wider backdrop-blur-md">Not Available</span>
                                        </div>
                                    )}
                                    {post.image ? (
                                        <img src={post.image} alt={post.plant_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-nature-300">
                                            <Leaf className="w-16 h-16" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-nature-700 shadow-sm flex items-center gap-1">
                                        <Star className="w-3 h-3 text-amber-500" /> {post.rarity}
                                    </div>
                                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                        <Leaf className="w-3 h-3" /> {post.plant_type}
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{post.plant_name}</h3>
                                    
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 bg-nature-50 w-max px-3 py-1 rounded-lg">
                                        <Heart className="w-4 h-4 text-rose-500" /> {post.health_status}
                                    </div>
                                    
                                    <div className="space-y-3 flex-1">
                                        <div>
                                            <span className="text-xs uppercase tracking-wider font-bold text-nature-600 block mb-1">Looking For</span>
                                            <p className="text-gray-700 bg-gray-50 p-3 rounded-xl text-sm border border-gray-100">
                                                {post.looking_for}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                                            <MapPin className="w-4 h-4 text-nature-500" /> {post.location}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-nature-200 flex items-center justify-center text-nature-700 font-bold text-xs uppercase">
                                                {post.user_username ? post.user_username.substring(0, 2) : 'US'}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{post.user_username}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleProposeClick(post)} 
                                            className="btn btn-secondary py-2 px-4 text-sm font-bold flex items-center gap-2"
                                        >
                                            Request Trade
                                        </button>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={handleCreatePostClick}
                className="fixed bottom-8 right-8 w-16 h-16 bg-nature-600 text-white rounded-full shadow-2xl hover:bg-nature-700 hover:scale-110 hover:-translate-y-1 transition-all flex items-center justify-center z-40"
                title="Post an Exchange"
            >
                <Plus className="w-8 h-8" />
            </button>

            {/* Create Post Modal */}
            {showPostModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
                        <div className="bg-nature-50 p-6 flex justify-between items-center border-b border-nature-100">
                            <h2 className="text-2xl font-bold text-nature-800 flex items-center gap-2">
                                <Plus className="w-6 h-6" /> Post an Exchange
                            </h2>
                            <button onClick={() => setShowPostModal(false)} className="text-gray-400 hover:text-gray-700 bg-white rounded-full p-2 shadow-sm">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={submitPost} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Plant Name</label>
                                <input type="text" required className="input w-full" value={postForm.plant_name} onChange={e => setPostForm({...postForm, plant_name: e.target.value})} placeholder="e.g. Monstera Deliciosa" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Health Status</label>
                                    <select className="input w-full" value={postForm.health_status} onChange={e => setPostForm({...postForm, health_status: e.target.value})}>
                                        <option value="Healthy">Healthy</option>
                                        <option value="Needs TLC">Needs TLC</option>
                                        <option value="Recovering">Recovering</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Rarity</label>
                                    <select className="input w-full" value={postForm.rarity} onChange={e => setPostForm({...postForm, rarity: e.target.value})}>
                                        <option value="Common">Common</option>
                                        <option value="Uncommon">Uncommon</option>
                                        <option value="Rare">Rare</option>
                                        <option value="Ultra Rare">Ultra Rare</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Plant Type</label>
                                    <select className="input w-full" value={postForm.plant_type} onChange={e => setPostForm({...postForm, plant_type: e.target.value})}>
                                        <option value="Indoor">Indoor</option>
                                        <option value="Outdoor">Outdoor</option>
                                        <option value="Succulent">Succulent</option>
                                        <option value="Aquatic">Aquatic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                                    <input type="text" required className="input w-full" value={postForm.location} onChange={e => setPostForm({...postForm, location: e.target.value})} placeholder="City or Area" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Looking For (in exchange)</label>
                                <textarea required className="input w-full h-24 resize-none" placeholder="What plant would you like in return?" value={postForm.looking_for} onChange={e => setPostForm({...postForm, looking_for: e.target.value})}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Photo</label>
                                <input type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-nature-50 file:text-nature-700 hover:file:bg-nature-100 cursor-pointer" onChange={e => setPostForm({...postForm, image: e.target.files[0]})} />
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="btn btn-primary w-full py-3 text-lg font-bold shadow-lg hover:shadow-xl">Post Exchange</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Propose Modal */}
            {showProposeModal && selectedPost && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="bg-nature-50 p-6 flex justify-between items-center border-b border-nature-100">
                            <h2 className="text-xl font-bold text-nature-800">Propose Exchange</h2>
                            <button onClick={() => setShowProposeModal(false)} className="text-gray-400 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={submitProposal} className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    You are asking to exchange with <strong>{selectedPost.user_username}</strong> for their <strong>{selectedPost.plant_name}</strong>.
                                </p>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                                <textarea required className="input w-full h-32 resize-none" placeholder="Hi! I have a healthy Pothos I'd like to trade for your Monstera..." value={proposeMessage} onChange={e => setProposeMessage(e.target.value)}></textarea>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="btn btn-secondary w-full py-3 font-bold">Send Proposal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Notification Toast */}
            {successMessage && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-nature-700 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-fadeIn font-medium">
                    <Heart className="w-5 h-5 text-nature-300" />
                    {successMessage}
                </div>
            )}
        </div>
    );
}
