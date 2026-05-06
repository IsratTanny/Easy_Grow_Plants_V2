import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/axios';
import { Star, MessageSquare, Image as ImageIcon, Trash2, User, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [image, setImage] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchReviews();
        checkUser();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await api.get('/reviews/');
            // Handle both array and paginated object responses
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setReviews(data);
        } catch (err) {
            console.error("Error fetching reviews", err);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const checkUser = async () => {
        try {
            const res = await api.get('/auth/me/');
            setCurrentUser(res.data);
        } catch (err) {
            // Not logged in
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSubmitLoading(true);

        const formData = new FormData();
        formData.append('rating', rating);
        formData.append('comment', comment);
        if (image) {
            formData.append('image', image);
        }

        try {
            const res = await api.post('/reviews/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Immediate UI update: Add the new review to the top of the list
            setReviews(prev => [res.data, ...prev]);
            
            setIsFormOpen(false);
            setRating(5);
            setComment('');
            setImage(null);
            alert('Review posted successfully!');
        } catch (err) {
            if (err.response?.status === 403) {
                setErrorMsg(err.response.data.detail || "Only customers who have purchased from us can leave a review.");
            } else {
                setErrorMsg("Failed to submit review. Please try again.");
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;
        try {
            await api.delete(`/reviews/${reviewId}/`);
            fetchReviews();
        } catch (err) {
            console.error("Failed to delete review", err);
        }
    };

    const resolveImg = (url) => {
        if (!url) return null;
        if (typeof url !== 'string') return null;
        if (url.startsWith('http')) return url;
        return url.startsWith('/media/') ? url : `/media/${url}`;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-12 bg-white/50 backdrop-blur-sm min-h-screen">
            <div className="flex items-center justify-between border-b pb-8 border-nature-100">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white shadow-md hover:shadow-lg rounded-2xl text-gray-400 hover:text-nature-700 transition-all group">
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Product Reviews</h1>
                        <div className="h-1.5 w-16 bg-nature-600 mt-2 rounded-full" />
                    </div>
                </div>
                {currentUser && !isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="px-8 py-3.5 bg-nature-700 text-white font-bold rounded-2xl shadow-lg hover:bg-nature-800 transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-widest text-xs"
                    >
                        Write a Review
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-nature-50 animate-slideDown max-w-2xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Post Your Review</h2>
                        <button onClick={() => setIsFormOpen(false)} className="text-gray-300 hover:text-gray-600 font-bold text-3xl transition-colors">×</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Select Rating</label>
                            <div className="flex gap-3">
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setRating(num)}
                                        className={`p-1 transition-all ${rating >= num ? 'text-orange-400 scale-110' : 'text-gray-100 hover:text-orange-200'}`}
                                    >
                                        <Star className={`w-10 h-10 ${rating >= num ? 'fill-current' : ''}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Your Experience</label>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                required
                                rows={5}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-nature-600 outline-none transition-all font-medium text-gray-700 shadow-inner"
                                placeholder="Describe your experience with the plant..."
                            />
                        </div>

                        <div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => setImage(e.target.files[0])} />
                            <div
                                onClick={() => fileInputRef.current.click()}
                                className="w-full flex items-center justify-center gap-3 p-6 border-2 border-dashed border-nature-100 rounded-[2rem] bg-nature-50/50 text-nature-700 font-bold text-sm cursor-pointer hover:bg-nature-50 transition-all group"
                            >
                                <ImageIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                {image ? <span className="text-green-600">{image.name}</span> : "Upload Plant Photo (Optional)"}
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 animate-shake">
                                {errorMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitLoading}
                            className="w-full py-5 bg-nature-700 text-white font-black uppercase tracking-[0.3em] text-[11px] rounded-[2rem] shadow-2xl hover:bg-nature-900 transition-all hover:shadow-nature-200 active:scale-[0.98] disabled:opacity-50"
                        >
                            {submitLoading ? "Submitting..." : "Post Review"}
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="w-12 h-12 border-4 border-nature-600 border-t-transparent rounded-full animate-spin shadow-lg" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-[3rem] border border-gray-100 text-gray-300 shadow-xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-nature-50/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <MessageSquare className="w-20 h-20 mx-auto mb-6 text-gray-100" />
                    <p className="text-2xl font-black uppercase tracking-tighter text-gray-400">No Reviews Yet</p>
                    <p className="font-bold mt-2 lowercase">Be the first to share your green journey!</p>
                </div>
            ) : (
                <div className="grid gap-8">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-nature-50 hover:shadow-xl transition-all duration-500 overflow-hidden group/card relative">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                                <div className="flex-1 space-y-6">
                                    {/* Top Left User Information */}
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-full bg-nature-900 text-white flex items-center justify-center font-black text-2xl border-4 border-nature-50 shadow-xl">
                                            {review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-black text-gray-950 text-xl tracking-tight uppercase">{review.user_name || review.user_username || 'Anonymous'}</h3>
                                                <div className="flex items-center gap-1.5 bg-nature-50 text-nature-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-nature-100">
                                                    <Check className="w-3 h-3" /> Verified Purchase
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rating and Content Section */}
                                    <div className="space-y-4">
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-5 h-5 ${i < review.rating ? 'text-orange-400 fill-current' : 'text-gray-100'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-gray-600 leading-relaxed font-bold text-base tracking-tight italic">
                                            "{review.comment}"
                                        </p>
                                    </div>

                                    {/* Delete Button */}
                                    {currentUser && (currentUser.role === 'admin' || currentUser.username === review.user_username) && (
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all absolute top-6 right-6"
                                            title="Delete Review"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {/* Review Photo on Far Right */}
                                {review.image && (
                                    <div className="md:w-64 w-full shrink-0">
                                        <div className="aspect-square rounded-[2rem] overflow-hidden bg-nature-50/30 border-8 border-white shadow-2xl group/img relative">
                                            <img
                                                src={resolveImg(review.image)}
                                                alt="Plant review"
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-nature-950/10 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const Check = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
