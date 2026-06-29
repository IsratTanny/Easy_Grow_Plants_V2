import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/axios';
import { User, MapPin, Phone, ShoppingBag, Leaf, ExternalLink, Check, Star, Award, ShieldCheck, MessageSquare } from 'lucide-react';

export default function PublicProfile() {
    const { username } = useParams();
    const [seller, setSeller] = useState(null);
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);

    const [reviews, setReviews] = useState([]);
    useEffect(() => {
        const fetchSellerData = async () => {
            try {
                const [sellerRes, plantsRes, reviewsRes] = await Promise.all([
                    api.get(`/sellers/${username}/`),
                    api.get(`/plants/?seller=${username}`),
                    api.get(`/reviews/?seller=${username}`)
                ]);
                setSeller(sellerRes.data);
                setPlants(plantsRes.data);
                setReviews(reviewsRes.data);
            } catch (err) {
                console.error("Error fetching seller profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSellerData();
    }, [username]);

    const handleDeleteReview = async (id) => {
        if (!window.confirm("Delete this review?")) return;
        try {
            await api.delete(`/reviews/${id}/`);
            setReviews(reviews.filter(r => r.id !== id));
        } catch (err) {
            toast.error("Failed to delete review.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-nature-50">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-nature-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-nature-900 font-black animate-pulse">Growing Profile...</p>
            </div>
        </div>
    );

    if (!seller || (!seller.username && !seller.full_name)) {
        return (
            <div className="py-20 text-center space-y-6">
                <div className="bg-white w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-xl border border-nature-100">
                    <User className="w-10 h-10 text-gray-300" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-gray-900">Seller Not Found</h3>
                    <p className="text-gray-500 font-medium">This horticulturalist hasn't joined our canopy yet.</p>
                </div>
                <Link to="/marketplace" className="inline-block px-8 py-3 bg-nature-900 text-white rounded-2xl font-black hover:bg-nature-800 transition-all shadow-lg">
                    Back to Marketplace
                </Link>
            </div>
        );
    }

    const resolveImageUrl = (path, fallback) => {
        if (!path) return fallback;
        if (typeof path !== 'string') return fallback;
        if (path.startsWith('http')) return path;
        if (path.startsWith('/media/')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return `/media/${cleanPath}`;
    };

    // Dynamic stats from backend
    const deliveryCount = seller.delivery_count || 0;
    const rating = seller.avg_rating || 0;
    const reviewCount = seller.review_count || 0;
    const joinYear = seller.date_joined ? new Date(seller.date_joined).getFullYear() : new Date().getFullYear();

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-fadeIn pb-20">
            {/* Professional Header Section */}
            <div className="relative mb-40">
                <div className="w-full h-64 md:h-96 rounded-[40px] overflow-hidden relative group shadow-2xl">
                    <img
                        src={resolveImageUrl(seller.cover_photo, 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2000&auto=format&fit=crop')}
                        alt="Cover"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-nature-950/60 via-transparent to-transparent" />
                </div>

                {/* Overlapping Profile Card */}
                <div className="absolute -bottom-32 left-8 right-8 md:left-16 md:right-16 bg-white/95 backdrop-blur-xl p-8 md:p-10 rounded-[35px] shadow-2xl border border-white/50 flex flex-col md:flex-row items-center md:items-end gap-8">
                    <div className="relative -mt-20 md:-mt-24">
                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-[35px] border-[8px] border-white shadow-2xl overflow-hidden bg-nature-50 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <img
                                src={resolveImageUrl(seller.profile_picture, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop')}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {seller.is_verified && (
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2.5 rounded-2xl shadow-xl border-4 border-white">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <h1 className="text-3xl md:text-4xl font-black text-nature-950 tracking-tight">
                                    {seller.full_name || seller.username}
                                </h1>
                                {seller.is_verified && (
                                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                                        <Check className="w-3 h-3" /> Verified Expert
                                    </span>
                                )}
                            </div>
                            <p className="text-nature-600 font-bold text-lg">
                                {seller.bio?.split('.')[0] || `${seller.username}'s Botanical Nursery`}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Rating</span>
                                <div className="flex items-center gap-1.5 text-nature-900 font-black">
                                    <Star className="w-4 h-4 fill-[#2D6A4F] text-[#2D6A4F]" />
                                    <span>{rating || '0.0'}</span>
                                    <span className="text-gray-400 font-medium text-xs">({reviewCount} reviews)</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-gray-100 hidden sm:block"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Deliveries</span>
                                <div className="flex items-center gap-1.5 text-nature-900 font-black">
                                    <Award className="w-4 h-4 text-nature-600" />
                                    <span>{deliveryCount} Successful</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-gray-100 hidden sm:block"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Member Since</span>
                                <div className="flex items-center gap-1.5 text-nature-900 font-black text-sm">
                                    {joinYear}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 px-6 py-4 bg-nature-900 text-white rounded-2xl font-black hover:bg-nature-950 transition-all shadow-xl active:scale-95">
                            Follow
                        </button>
                        <button className="p-4 bg-white text-nature-900 border border-nature-100 rounded-2xl font-black hover:bg-nature-50 transition-all shadow-lg active:scale-95">
                            <MessageSquare className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
                {/* Sidebar Info */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-8 rounded-[35px] shadow-sm border border-nature-50 space-y-6">
                        <h3 className="text-xl font-black text-nature-950 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-nature-600" />
                            Seller Information
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {seller.bio || "This dedicated seller is focused on providing the healthiest ornamental and indoor plants for your urban jungle."}
                        </p>
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-4 p-4 bg-nature-50 rounded-2xl group hover:bg-nature-100 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                    <MapPin className="w-5 h-5 text-nature-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-black uppercase">Location</span>
                                    <span className="text-sm font-bold text-nature-900">{seller.address || "Dhaka, Bangladesh"}</span>
                                </div>
                            </div>
                            {seller.phone && (
                                <div className="flex items-center gap-4 p-4 bg-nature-50 rounded-2xl group hover:bg-nature-100 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <Phone className="w-5 h-5 text-nature-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 font-black uppercase">Contact</span>
                                        <span className="text-sm font-bold text-nature-900">{seller.phone}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Feedback (Reviews) */}
                    <div className="bg-white p-8 rounded-[35px] shadow-sm border border-nature-50 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-nature-950 flex items-center gap-2 tracking-tighter uppercase">
                                Feedback
                            </h3>
                            <Link to="/reviews" className="text-[10px] font-black text-nature-600 uppercase hover:underline">View All</Link>
                        </div>
                        
                        <div className="space-y-6">
                            {reviews.length === 0 ? (
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center py-10 opacity-50 italic">No reviews yet</p>
                            ) : (
                                reviews.slice(0, 5).map(rev => (
                                    <div key={rev.id} className="space-y-2 group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} className={`w-2.5 h-2.5 ${s <= rev.rating ? 'fill-[#2D6A4F] text-[#2D6A4F]' : 'text-gray-100'}`} />
                                                ))}
                                            </div>
                                            <span className="text-[8px] font-black text-gray-300 uppercase">{new Date(rev.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-600 font-medium leading-relaxed">"{rev.comment}"</p>
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-[9px] font-black text-nature-900 uppercase tracking-widest">— {rev.user_name || rev.user_username}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content - Plant Gallery */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="flex items-center justify-between border-b-2 border-nature-100 pb-6">
                        <h2 className="text-3xl font-black text-nature-950 tracking-tighter uppercase">
                            Available Collection
                            <span className="ml-3 px-4 py-1.5 bg-nature-50 text-nature-700 text-[11px] font-black rounded-xl uppercase tracking-[0.2em] shadow-inner">
                                {plants?.length || 0} Listed
                            </span>
                        </h2>
                    </div>

                    {plants.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {plants.map(plant => (
                                <div key={plant.id} className="bg-white rounded-[40px] p-5 shadow-sm hover:shadow-[0_20px_50px_rgba(45,106,79,0.1)] transition-all duration-700 group border border-nature-50 relative overflow-hidden">
                                    <div className="h-72 rounded-[30px] overflow-hidden relative group-hover:shadow-2xl transition-shadow duration-500">
                                        <img
                                            src={resolveImageUrl(plant.image_url || plant.image, 'https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=1000&auto=format&fit=crop')}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                            alt={plant.name}
                                        />
                                        <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl text-xl font-black text-nature-900 shadow-2xl">
                                            ৳{plant.price}
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-black text-2xl text-nature-950 tracking-tight lowercase">{plant.name}</h3>
                                            <span className="px-3 py-1 bg-nature-50 text-nature-600 text-[9px] font-black rounded-lg uppercase tracking-widest shadow-inner">
                                                {plant.category || "Indoor"}
                                            </span>
                                        </div>
                                        <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed font-bold tracking-tight">
                                            {plant.description}
                                        </p>
                                        <Link
                                            to="/marketplace"
                                            className="w-full mt-4 py-4 bg-nature-100/50 text-nature-950 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-nature-900 hover:text-white transition-all group/btn shadow-sm"
                                        >
                                            View Store Item
                                            <ExternalLink className="w-4 h-4 translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-nature-50 p-24 rounded-[50px] text-center space-y-6 border-2 border-dashed border-nature-100">
                            <ShoppingBag className="w-16 h-16 text-nature-100 mx-auto" />
                            <p className="text-nature-900 font-black text-2xl italic uppercase tracking-[0.3em] opacity-10">
                                No active listings
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
