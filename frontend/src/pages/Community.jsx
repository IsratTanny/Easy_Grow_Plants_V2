import React, { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { Heart, MessageCircle, Share2, Plus, X, Image as ImageIcon, Leaf, Trash2, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Community() {
    const location = useLocation();
    const [allPosts, setAllPosts] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPostModal, setShowPostModal] = useState(false);
    const [page, setPage] = useState(1);
    const POSTS_PER_PAGE = 5;
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(localStorage.getItem('user_role'));
    const [commentTexts, setCommentTexts] = useState({});
    const [likedPosts, setLikedPosts] = useState({});
    
    // Automatically pre-fill modal if routed from Identification match
    const initialPlantState = location.state?.shared_plant || '';
    const initialImageState = location.state?.shared_image || '';
    
    const [newPost, setNewPost] = useState({ 
        caption: '', 
        image_base64: initialImageState 
    });
    
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const initData = async () => {
            try {
                const userRes = await api.get('/auth/me/');
                setCurrentUser(userRes.data);
            } catch (err) {
                console.error('Could not fetch user', err);
            }
            fetchPosts();
        };
        initData();
        
        // If data was passed, instantly show the modal for user review and post
        if (initialPlantState && initialImageState) {
            handleOpenModal();
        }
    }, [initialPlantState, initialImageState]);

    const fetchPosts = async () => {
        try {
            const res = await api.get('/plant-care/posts/');
            const postsData = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            setAllPosts(postsData);
            setPosts(postsData.slice(0, POSTS_PER_PAGE));
            
            const initialLikes = {};
            postsData.forEach(p => {
                initialLikes[p.id] = p.is_liked_by_user || false;
            });
            setLikedPosts(initialLikes);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setAllPosts([]);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop + 50 >= document.documentElement.offsetHeight) {
                setPage(prev => prev + 1);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (Array.isArray(allPosts)) {
            setPosts(allPosts.slice(0, page * POSTS_PER_PAGE));
        } else {
            setPosts([]);
        }
    }, [page, allPosts]);

    const handleOpenModal = () => {
        if (!currentUser) {
            alert('Please login to post in the community.');
            return;
        }
        if (userRole === 'seller' || userRole === 'admin') {
            alert('This section is for community members only.');
            return;
        }
        setShowPostModal(true);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPost(prev => ({ ...prev, image_base64: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitPost = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/plant-care/posts/', newPost);
            setShowPostModal(false);
            setNewPost({ caption: '', image_base64: '' });
            fetchPosts(); // Refresh feed
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (postId) => {
        if (!currentUser) {
            alert('Please login to like posts.');
            return;
        }

        const isLiked = likedPosts[postId];
        // Optimistic UI
        setLikedPosts(prev => ({ ...prev, [postId]: !isLiked }));
        setAllPosts(prevPosts => prevPosts.map(post => {
            if (post.id === postId) {
                return { ...post, likes_count: isLiked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1 };
            }
            return post;
        }));

        try {
            const res = await api.post(`/plant-care/posts/${postId}/like/`);
            if (res.data.status === 'success') {
                setLikedPosts(prev => ({ ...prev, [postId]: res.data.is_liked_by_user }));
                setAllPosts(prevPosts => prevPosts.map(post => {
                    if (post.id === postId) {
                        return { ...post, likes_count: res.data.likes_count, is_liked_by_user: res.data.is_liked_by_user };
                    }
                    return post;
                }));
            }
        } catch (error) {
            console.error('Error liking post:', error);
            // Revert on error
            setLikedPosts(prev => ({ ...prev, [postId]: isLiked }));
            setAllPosts(prevPosts => prevPosts.map(post => {
                if (post.id === postId) {
                    return { ...post, likes_count: isLiked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1) };
                }
                return post;
            }));
        }
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await api.delete(`/plant-care/posts/${postId}/`);
                setAllPosts(prev => Array.isArray(prev) ? prev.filter(p => p.id !== postId) : []);
            } catch (err) {
                alert("Failed to delete post");
            }
        }
    };

    const handleCommentSubmit = async (postId) => {
        const text = commentTexts[postId];
        if (!text) return;
        try {
            const res = await api.post(`/plant-care/posts/${postId}/add_comment/`, { text });
            setAllPosts(prev => Array.isArray(prev) ? prev.map(post => {
                if (post.id === postId) {
                    return { ...post, comments: [...(post.comments || []), res.data] };
                }
                return post;
            }) : []);
            setCommentTexts(prev => ({ ...prev, [postId]: '' }));
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        if (window.confirm("Delete this comment?")) {
            try {
                await api.delete(`/plant-care/posts/delete_comment/${commentId}/`);
                setAllPosts(prev => Array.isArray(prev) ? prev.map(post => {
                    if (post.id === postId) {
                        return { ...post, comments: (post.comments || []).filter(c => c.id !== commentId) };
                    }
                    return post;
                }) : []);
            } catch (err) {
                alert("Failed to delete comment");
            }
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading Community Feed...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', paddingBottom: '80px', fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ color: '#1B4332', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Community Echo</h1>
            <p style={{ color: '#475569', marginBottom: '24px' }}>See what others are growing in Dhaka. Share your progress!</p>

            {/* Create Post Input Widget */}
            {currentUser && (
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                            {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <button 
                            onClick={handleOpenModal}
                            style={{ flex: 1, textAlign: 'left', padding: '12px 16px', borderRadius: '24px', backgroundColor: '#F1F5F9', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '15px' }}
                        >
                            Share your plant progress, {currentUser.username}...
                        </button>
                    </div>
                    <div style={{ display: 'flex', borderTop: '1px solid #F1F5F9', marginTop: '12px', paddingTop: '12px', gap: '16px' }}>
                        <button onClick={handleOpenModal} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '14px', padding: '8px 12px', borderRadius: '8px' }} className="hover:bg-gray-50">
                            <ImageIcon size={20} color="#10B981" /> Photo
                        </button>
                        <button onClick={handleOpenModal} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '14px', padding: '8px 12px', borderRadius: '8px' }} className="hover:bg-gray-50">
                            <Leaf size={20} color="#1B4332" /> Growing Tips
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {posts && Array.isArray(posts) && posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
                            {/* Post Header */}
                        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #F1F5F9' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1B4332', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                                {post.username ? post.username.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1E293B' }}>@{post.username}</h3>
                                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                {post.plant_name && <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Growing: {post.plant_name}</p>}
                            </div>
                            {(post.user === currentUser?.id || userRole === 'admin') && (
                                <button onClick={() => handleDeletePost(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}>
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>

                        {/* Post Image */}
                        {post.image_base64 && (
                            <img src={post.image_base64} alt={post.plant_name || 'Plant upload'} style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }} />
                        )}

                        {/* Post Actions & Caption */}
                        <div style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                                <button onClick={() => handleLike(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: likedPosts[post.id] ? '#EF4444' : '#64748B', padding: 0 }}>
                                    <Heart size={24} fill={likedPosts[post.id] ? '#EF4444' : 'none'} className="hover:scale-110 transition-transform" />
                                    <span style={{ fontWeight: '600', color: likedPosts[post.id] ? '#EF4444' : '#475569' }}>{post.likes_count}</span>
                                </button>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', padding: 0 }}>
                                    <MessageCircle size={24} className="hover:scale-110 transition-transform" />
                                    <span style={{ fontWeight: '600' }}>{post.comments?.length || 0}</span>
                                </button>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', padding: 0, marginLeft: 'auto' }}>
                                    <Share2 size={24} className="hover:scale-110 transition-transform" />
                                </button>
                            </div>
                            
                            {post.caption && (
                                <p style={{ margin: 0, color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                                    <span style={{ fontWeight: '600', marginRight: '8px' }}>{post.username}</span>
                                    {post.caption}
                                </p>
                            )}

                            {/* Comments Section */}
                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {post.comments && post.comments.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {post.comments.map(comment => (
                                            <div key={comment.id} style={{ padding: '8px', backgroundColor: '#F8FAFC', borderRadius: '8px', position: 'relative' }}>
                                                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#334155' }}>
                                                    <span style={{ fontWeight: '600', marginRight: '6px' }}>@{comment.username}</span>
                                                    {comment.text}
                                                </p>
                                                {(comment.user === currentUser?.id || userRole === 'admin') && (
                                                    <button onClick={() => handleDeleteComment(post.id, comment.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 0 }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Comment Input */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Write a comment..." 
                                        value={commentTexts[post.id] || ''}
                                        onChange={(e) => setCommentTexts({...commentTexts, [post.id]: e.target.value})}
                                        onKeyPress={(e) => { if (e.key === 'Enter') handleCommentSubmit(post.id); }}
                                        style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', backgroundColor: '#F8FAFC' }}
                                    />
                                    <button 
                                        onClick={() => handleCommentSubmit(post.id)}
                                        disabled={!commentTexts[post.id]?.trim()}
                                        style={{ background: 'none', border: 'none', color: commentTexts[post.id]?.trim() ? '#10B981' : '#CBD5E1', cursor: commentTexts[post.id]?.trim() ? 'pointer' : 'not-allowed', padding: '0 8px' }}
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>No posts yet. Be the first to share!</div>
                )}
            </div>

            {/* Floating Action Button */}
            <button 
                onClick={handleOpenModal}
                style={{
                    position: 'fixed',
                    bottom: '40px',
                    right: 'auto',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#10B981',
                    color: 'white',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    boxShadow: '0 10px 25px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.2)',
                    cursor: 'pointer',
                    zIndex: 10000,
                    transition: 'transform 0.2s',
                }}
            >
                <Plus size={32} />
            </button>

            {/* Post Creation Modal */}
            {showPostModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', position: 'relative' }}>
                        <button 
                            onClick={() => setShowPostModal(false)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                        >
                            <X size={24} />
                        </button>
                        
                        <h2 style={{ margin: '0 0 20px 0', color: '#1E293B', fontSize: '20px' }}>Share Your Plant</h2>
                        
                        <form onSubmit={handleSubmitPost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>Photo</label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                                        <ImageIcon size={20} />
                                        Upload Image
                                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                    </label>
                                    {newPost.image_base64 && <span style={{ fontSize: '13px', color: '#10B981', fontWeight: '500' }}>Image Selected ✓</span>}
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>Story / Tips</label>
                                <textarea 
                                    placeholder="Share your progress or ask for tips..." 
                                    value={newPost.caption}
                                    onChange={(e) => setNewPost({...newPost, caption: e.target.value})}
                                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px', minHeight: '100px', resize: 'vertical', outline: 'none' }}
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={submitting || !newPost.image_base64}
                                style={{ 
                                    padding: '14px', 
                                    backgroundColor: submitting || !newPost.image_base64 ? '#94A3B8' : '#10B981', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '8px', 
                                    fontSize: '16px', 
                                    fontWeight: 'bold', 
                                    cursor: submitting || !newPost.image_base64 ? 'not-allowed' : 'pointer',
                                    marginTop: '8px'
                                }}
                            >
                                {submitting ? 'Posting...' : 'Share to Community'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
