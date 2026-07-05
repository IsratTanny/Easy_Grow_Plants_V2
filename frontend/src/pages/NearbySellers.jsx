import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { MapPin, Navigation, Map as MapIcon, Store, Star, Info, Search, LocateFixed, Trees, ChevronRight, XCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Marker Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// DEFAULT FALLBACK: Central Dhaka (Sadarghat/Old Dhaka area)
const DEFAULT_CENTER = { lat: 23.7104, lon: 90.4074 };

const DHAKA_AREAS = [
    { name: 'Dhanmondi', lat: 23.7461, lon: 90.3742 },
    { name: 'Gulshan', lat: 23.7925, lon: 90.4126 },
    { name: 'Uttara', lat: 23.8759, lon: 90.3795 },
    { name: 'Banani', lat: 23.7940, lon: 90.4043 },
    { name: 'Mirpur', lat: 23.8223, lon: 90.3654 },
];

export default function NearbySellers() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerLayer = useRef(null);
    const userMarker = useRef(null);
    const radiusCircle = useRef(null);
    const selectRef = useRef(null);

    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeLocation, setActiveLocation] = useState(null);
    const [radius, setRadius] = useState(10);
    const [selectedArea, setSelectedArea] = useState('');

    // Initialize map once
    useEffect(() => {
        if (!mapInstance.current && mapRef.current) {
            try {
                mapInstance.current = L.map(mapRef.current, {
                    center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lon],
                    zoom: 13,
                    zoomControl: false
                });

                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(mapInstance.current);

                markerLayer.current = L.layerGroup().addTo(mapInstance.current);
            } catch (e) { console.error("Map Load Error:", e); }
        }
    }, []);

    // Error Clearer Effect
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const updateMap = (lat, lon, dist, nearbySellers) => {
        if (!mapInstance.current) return;
        try {
            const pos = [lat, lon];
            mapInstance.current.setView(pos, 14);

            if (userMarker.current) userMarker.current.remove();
            userMarker.current = L.marker(pos, {
                icon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32]
                })
            }).addTo(mapInstance.current);

            if (radiusCircle.current) radiusCircle.current.remove();
            radiusCircle.current = L.circle(pos, {
                radius: dist * 1000,
                color: '#1b4332',
                fillOpacity: 0.1,
                weight: 1
            }).addTo(mapInstance.current);

            if (markerLayer.current) markerLayer.current.clearLayers();
            nearbySellers.forEach(s => {
                L.marker([parseFloat(s.latitude), parseFloat(s.longitude)], {
                    icon: L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/628/628283.png',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32]
                    })
                }).addTo(markerLayer.current).bindPopup(`<b>${s.full_name || s.username}</b>`);
            });
        } catch (e) { console.error("Map Sync Error:", e); }
    };

    const fetchSellers = async (lat, lon, dist) => {
        setLoading(true);
        try {
            const res = await api.get(`/sellers-location/nearby/`, {
                params: { lat, lon, distance: dist }
            });
            const data = res.data || [];
            setSellers(data);
            setActiveLocation({ lat, lon });
            updateMap(lat, lon, dist, data);
        } catch (err) {
            setError("SERVER_OFFLINE");
        } finally {
            setLoading(false);
        }
    };

    const handleGPS = async () => {
        console.log("Checking security context...");
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            console.warn("GEOLOCATION_WARNING: Browser may block GPS on non-HTTPS origins like 127.0.0.1. Using central fallback.");
        }

        setLoading(true);
        
        try {
            // Permission check before calling
            if (navigator.permissions && navigator.permissions.query) {
                const status = await navigator.permissions.query({ name: 'geolocation' });
                if (status.state === 'denied') {
                    handleGPSFallback("GPS_BLOCKED_BY_USER");
                    return;
                }
            }

            navigator.geolocation.getCurrentPosition(
                (p) => fetchSellers(p.coords.latitude, p.coords.longitude, radius),
                (err) => {
                    console.error("Geolocation Error Code:", err.code);
                    handleGPSFallback(err.code === 1 ? "PERMISSION_DENIED" : "GPS_UNAVAILABLE");
                },
                { timeout: 5000, enableHighAccuracy: true }
            );
        } catch (e) {
            handleGPSFallback("CRITICAL_GPS_FAILURE");
        }
    };

    const handleGPSFallback = (reason) => {
        console.warn(`GEOLOCATION_FALLBACK: ${reason}. Using Default Dhaka Center.`);
        setError("GPS_FAIL_FALLBACK_ACTIVE"); // Shows briefly
        setLoading(false);
        
        // Auto-focus select to guide user
        if (selectRef.current) {
            selectRef.current.focus();
            selectRef.current.style.boxShadow = "0 0 0 3px rgba(27,67,50,0.2)";
        }

        // Silent jump to default center
        fetchSellers(DEFAULT_CENTER.lat, DEFAULT_CENTER.lon, radius);
    };

    const handleAreaChange = (e) => {
        const name = e.target.value;
        setSelectedArea(name);
        if (selectRef.current) selectRef.current.style.boxShadow = "none";
        const area = DHAKA_AREAS.find(a => a.name === name);
        if (area) fetchSellers(area.lat, area.lon, radius);
    };

    return (
        <div className="min-h-screen bg-white pt-24 pb-20">
            <div className="container mx-auto px-4 max-w-7xl">
                
                {error && (
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3 bg-[#1b4332] text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl animate-bounce">
                        {error === "GPS_FAIL_FALLBACK_ACTIVE" 
                            ? "📍 " + (t('gpsFallback') || "GPS unavailable. Please select your area manually.") 
                            : `⚠️ ${error}`}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-nature-50 p-8 rounded-[40px] border border-nature-100">
                            <h1 className="text-2xl font-black text-[#1b4332] mb-8 uppercase tracking-tighter">{t('nearbyTitle')}</h1>
                            
                            <div className="space-y-4">
                                <button 
                                    onClick={handleGPS} disabled={loading}
                                    className="w-full h-14 bg-[#1b4332] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                                >
                                    {loading ? (t('scanning') || 'CALCULATING...') : <><Navigation className="w-4 h-4" /> {t('useMyLocation')}</>}
                                </button>

                                <select 
                                    ref={selectRef}
                                    value={selectedArea}
                                    onChange={handleAreaChange}
                                    className="w-full bg-white border border-nature-100 rounded-2xl p-4 font-black text-[#1b4332] text-xs outline-none transition-all"
                                >
                                    <option value="">{t('selectNeighborhood')}</option>
                                    {DHAKA_AREAS.map(a => <option key={a.name} value={a.name}>{t(a.name) || a.name}</option>)}
                                </select>

                                <div className="p-5 bg-white rounded-2xl border border-nature-100">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-nature-300 mb-4">
                                        <span>{t('searchRadius')}</span>
                                        <span className="text-[#1b4332]">{radius} {t('distanceAway')}</span>
                                    </div>
                                    <input 
                                        type="range" min="1" max="50" value={radius} 
                                        onChange={(e) => setRadius(parseInt(e.target.value))}
                                        className="w-full h-1 bg-nature-100 appearance-none cursor-pointer accent-[#1b4332]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[40px] border border-nature-100 p-6 min-h-[300px]">
                            <h2 className="text-[10px] font-black text-nature-300 uppercase tracking-widest mb-4">{t('liveMonitor')} ({sellers.length})</h2>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {sellers.map(s => (
                                    <div key={s.id} className="p-4 bg-nature-50/50 rounded-2xl border border-transparent hover:border-[#1b4332]/10 flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/sellers/${s.username}`)}>
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#1b4332] font-black text-xs shadow-sm">{s.username[0].toUpperCase()}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-[#1b4332] text-[10px] uppercase truncate">{s.full_name || s.username}</p>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase">{s.distance} km</p>
                                        </div>
                                    </div>
                                ))}
                                {sellers.length === 0 && <p className="text-center py-20 text-[10px] font-bold text-gray-300 uppercase">{t('loading')}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 relative">
                        <div ref={mapRef} className="w-full rounded-[40px] border-4 border-white shadow-2xl" style={{ height: '600px' }}></div>
                    </div>

                </div>
            </div>
        </div>
    );
}
