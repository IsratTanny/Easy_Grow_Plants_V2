import React, { useEffect, useState, useRef } from 'react';
import { api, isAuthenticated } from '../api/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Clock, CheckCircle, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [userRole, setUserRole] = useState(localStorage.getItem('user_role'));
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletedIds, setDeletedIds] = useState(() => JSON.parse(localStorage.getItem('deleted_notifications') || '[]'));
    
    // Check if we came from a redirect that requested highlighting
    const highlightId = location.state?.highlightId;
    const itemRefs = useRef({});

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!loading && highlightId && itemRefs.current[highlightId]) {
            itemRefs.current[highlightId].scrollIntoView({ behavior: 'smooth', block: 'center' });
            itemRefs.current[highlightId].classList.add('bg-nature-100', 'ring-2', 'ring-nature-400');
            setTimeout(() => {
                if (itemRefs.current[highlightId]) {
                    itemRefs.current[highlightId].classList.remove('bg-nature-100', 'ring-2', 'ring-nature-400');
                }
            }, 3000);
            
            // Auto mark it as read immediately if not already
            const notif = notifications.find(n => n.id === highlightId);
            if (notif && !notif.is_read) {
                markAsRead(notif);
            }
        }
    }, [loading, highlightId]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            
            // Support: ?all=true
            const supportRes = await api.get('/support/notifications/?all=true');
            const supportNotifs = (supportRes.data.notifications || []).map(n => ({
                ...n,
                source: 'support',
                date: new Date(n.timestamp),
                title: userRole === 'admin' ? `Support Message from ${n.username}` : 'Support Admin Reply',
                is_read: n.is_read
            }));

            // Plant Care: returns all
            const careRes = await api.get('/plant-care/notifications/');
            const rawCareNotifs = Array.isArray(careRes.data) ? careRes.data : (careRes.data.results || []);
            const careNotifs = rawCareNotifs.map(n => ({
                ...n,
                source: 'plant_care',
                date: new Date(n.created_at),
                title: 'Plant Care System',
                message: n.message,
                is_read: n.is_read
            }));

            let allNotifs = [...supportNotifs, ...careNotifs].sort((a, b) => b.date - a.date);
            allNotifs = allNotifs.filter(n => !deletedIds.includes(n.source + '_' + n.id));

            setNotifications(allNotifs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notif) => {
        try {
            if (notif.source === 'support') {
                await api.post(`/support/notifications/${notif.id}/read/`);
            } else {
                await api.patch(`/plant-care/notifications/${notif.id}/`, { is_read: true });
            }
            
            setNotifications(prev => prev.map(n => {
                if (n.id === notif.id && n.source === notif.source) {
                    return { ...n, is_read: true };
                }
                return n;
            }));
        } catch (err) {
            console.error("Error marking read:", err);
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.is_read);
        for (const notif of unread) {
            await markAsRead(notif);
        }
    };

    const handleDelete = (notif) => {
        const hash = notif.source + '_' + notif.id;
        const updated = [...deletedIds, hash];
        setDeletedIds(updated);
        localStorage.setItem('deleted_notifications', JSON.stringify(updated));
        
        setNotifications(prev => prev.filter(n => !(n.id === notif.id && n.source === notif.source)));
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="card overflow-hidden shadow-xl border-none">
                <div className="p-6 border-b border-gray-100 bg-nature-50 flex justify-between items-center flex-wrap gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-nature-800 uppercase tracking-tighter">
                        <Bell className="text-nature-600 w-6 h-6" /> All Notifications
                    </h2>
                    <button 
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-nature-200 text-nature-700 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-nature-50 transition-colors shadow-sm"
                    >
                        <CheckCircle className="w-4 h-4" /> Mark All Read
                    </button>
                </div>
                
                <div className="flex flex-col bg-white">
                    {loading ? (
                        <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">Loading Notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center gap-4 text-gray-400 font-bold uppercase tracking-widest">
                            <Bell className="w-12 h-12 opacity-20" />
                            No Notifications Found
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((n) => (
                                <div 
                                    key={`${n.source}_${n.id}`} 
                                    ref={el => itemRefs.current[n.id] = el}
                                    className={`p-6 flex items-start gap-4 transition-all duration-500 hover:bg-nature-50 ${!n.is_read ? 'bg-nature-50/50' : ''}`}
                                >
                                    <div className="pt-1">
                                        <div className={`w-3 h-3 rounded-full ${!n.is_read ? 'bg-nature-500 animate-pulse ring-4 ring-nature-100' : 'bg-gray-300'}`}></div>
                                    </div>
                                    
                                    <div className="flex-1 cursor-pointer" onClick={() => !n.is_read && markAsRead(n)}>
                                        <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                                            <h3 className={`text-sm uppercase tracking-tight ${!n.is_read ? 'font-black text-gray-900' : 'font-bold text-gray-600'}`}>
                                                {n.title}
                                            </h3>
                                            <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                                <Clock className="w-3 h-3" />
                                                {n.date.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                            {n.message || 'Image attachment / Media notification'}
                                        </p>
                                    </div>
                                    
                                    <div className="pl-4">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(n); }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Message"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
