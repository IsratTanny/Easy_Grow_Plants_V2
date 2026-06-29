import React, { useState, useEffect, useMemo } from 'react';
import { Compass, Sun, Search, CheckCircle2, AlertCircle, ChevronRight, Info, MapPin, Lock, RefreshCw } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

// Local Error Boundary Component to prevent white screen
class FinderErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) { return { hasError: true }; }
    componentDidCatch(error, errorInfo) { console.error("Smart Finder Error:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-20 text-center bg-red-50 rounded-[40px] border-2 border-red-100">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-red-900">System Interruption</h2>
                    <p className="text-red-600 font-bold mt-2">We encountered an issue. Please refresh the page.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

function SmartPlantFinderContent() {
    const { language, t } = useLanguage();

    // Static images are served at the Vite base ("/" in dev, "/static/" in prod).
    const img = (file) => `${import.meta.env.BASE_URL}images/${file}`;

    const PLANT_DB = useMemo(() => [
        { name: "Monstera Deliciosa", category: "Monstera", sunlight_pref: "4-6 Hrs", directions: ["East", "West"], image: img("monstera.jpg") },
        { name: "Aglonema Red", category: "Aglonema", sunlight_pref: "2-4 Hrs", directions: ["North", "East"], image: img("aglonema.jpg") },
        { name: "Golden Pothos", category: "Pothos", sunlight_pref: "2-4 Hrs", directions: ["North", "West"], image: img("pothos.jpg") },
        { name: "Desert Cactus", category: "Cactus", sunlight_pref: "6+ Hrs", directions: ["South", "West"], image: img("cactus.jpg") },
        { name: "Juniper Bonsai", category: "Bonsai", sunlight_pref: "6+ Hrs", directions: ["South", "East"], image: img("bonsai.jpg") },
        { name: "Snake Plant", category: "Sansevieria", sunlight_pref: "2-4 Hrs", directions: ["North", "South", "East", "West"], image: img("sansevieria.jpg") }
    ], []);

    const [heading, setHeading] = useState(0);
    const [isCompassActive, setIsCompassActive] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [sunlight, setSunlight] = useState('4-6 Hrs');
    const [balconyType, setBalconyType] = useState('Semi-Shaded');
    const [recommendations, setRecommendations] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sustainabilityResult, setSustainabilityResult] = useState(null);
    const [hasDetected, setHasDetected] = useState(false);

    // Live Quadrant String Mapping
    const headingName = useMemo(() => {
        let alpha = heading;
        if (alpha >= 315 || alpha < 45) return 'North Facing Balcony';
        if (alpha >= 45 && alpha < 135) return 'East Facing Balcony';
        if (alpha >= 135 && alpha < 225) return 'South Facing Balcony';
        if (alpha >= 225 && alpha < 315) return 'West Facing Balcony';
        return 'Detecting...';
    }, [heading]);

    const directionKey = useMemo(() => {
        let alpha = heading;
        if (alpha >= 315 || alpha < 45) return 'North';
        if (alpha >= 45 && alpha < 135) return 'East';
        if (alpha >= 135 && alpha < 225) return 'South';
        if (alpha >= 225 && alpha < 315) return 'West';
        return 'North';
    }, [heading]);

    // Live Sensor Access & Rotation Logic
    useEffect(() => {
        const handleOrientation = (e) => {
            if (isLocked) return;

            // Fetch alpha (heading) - absolute orientation preferred
            let alpha = e.webkitCompassHeading || e.alpha;

            if (alpha !== null && alpha !== undefined) {
                setHeading(Math.round(alpha));
                if (!hasDetected) setHasDetected(true);
            }
        };

        if (isCompassActive && !isLocked) {
            // Try both standard and absolute events for maximum compatibility
            window.addEventListener('deviceorientation', handleOrientation);
            window.addEventListener('deviceorientationabsolute', handleOrientation);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            window.removeEventListener('deviceorientationabsolute', handleOrientation);
        };
    }, [isCompassActive, isLocked, hasDetected]);

    const requestPermission = async () => {
        // Trigger DeviceOrientationEvent.requestPermission() for iOS/Chrome Mobile
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === 'granted') {
                    setIsCompassActive(true);
                    setIsLocked(false);
                }
            } catch (err) { console.error("Permission failed:", err); }
        } else {
            setIsCompassActive(true);
            setIsLocked(false);
        }
    };

    const cycleManualDirection = () => {
        if (!isCompassActive) setIsCompassActive(true);
        if (!hasDetected) setHasDetected(true);
        setHeading((prev) => (prev + 90) % 360);
    };

    const findMatches = () => {
        const matches = PLANT_DB.filter(p => {
            const dirMatch = p.directions.some(d => directionKey.includes(d));
            const sunMatch = p.sunlight_pref === sunlight || p.sunlight_pref === 'Any';
            return dirMatch || sunMatch;
        }).map(p => {
            let reason = language === 'bn'
                ? `যেহেতু আপনার বারান্দা ${t(directionKey.toLowerCase())} মুখী, এটি ${t(p.sunlight_pref)} সূর্যালোকের জন্য উপযুক্ত।`
                : `Since your balcony is ${directionKey}-facing, this plant will thrive in ${p.sunlight_pref} of light.`;
            return { ...p, reason };
        });
        setRecommendations(matches);
        setHasSearched(true);
    };

    const checkSustainability = () => {
        const plant = PLANT_DB.find(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!plant) {
            setSustainabilityResult({ status: 'unknown', message: t('plantNotFound') });
            return;
        }
        const isCompatible = plant.directions.some(d => directionKey.includes(d)) &&
            (plant.sunlight_pref === sunlight || plant.sunlight_pref === 'Any');
        if (isCompatible) {
            setSustainabilityResult({
                status: 'perfect',
                message: language === 'bn' ? 'চমৎকার! এটি আপনার পরিবেশের জন্য উপযুক্ত।' : 'Perfect! This plant is highly sustainable in your conditions.',
                plant
            });
        } else {
            setSustainabilityResult({
                status: 'warning',
                message: language === 'bn' ? `সতর্কতা: এটি আপনার পরিবেশে ভালো নাও থাকতে পারে।` : `Warning: This plant might struggle in your ${directionKey}-facing balcony with ${sunlight} sun.`,
            });
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-fadeIn bg-nature-50/50 p-6 rounded-[40px]">
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 bg-nature-900 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                    <Compass className="w-4 h-4" /> {t('aiEnvironmentalAnalysis')}
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-nature-900 tracking-tighter">{t('smartFinderTitle')}</h1>
                <p className="text-gray-500 font-bold text-lg max-w-2xl mx-auto">{t('smartFinderDesc')}</p>
            </header>

            <div className="grid lg:grid-cols-3 gap-10">
                <div className="card p-8 space-y-8 bg-white/80 backdrop-blur-xl border-2 border-nature-100 rounded-[40px] shadow-2xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-nature-900 uppercase">1. {t('direction')}</h2>
                        <div className="flex gap-2">
                            {!isCompassActive ? (
                                <button onClick={requestPermission} className="text-[10px] px-4 py-2 rounded-xl font-black bg-nature-900 text-white hover:scale-105 active:scale-95 transition-all">{t('enableCompass')}</button>
                            ) : (
                                <button onClick={() => setIsLocked(!isLocked)} className={`p-2 rounded-xl transition-all ${isLocked ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white hover:scale-110'}`}>{isLocked ? <Lock className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}</button>
                            )}
                        </div>
                    </div>

                    <div className="relative flex flex-col items-center">
                        {/* LIVE ROTATING DISC */}
                        <div
                            onClick={cycleManualDirection}
                            className={`w-52 h-52 border-4 rounded-full flex items-center justify-center relative shadow-2xl bg-white cursor-pointer border-nature-900`}
                            style={{
                                transform: `rotate(${-heading}deg)`,
                                transition: 'none' // Remove transition for live, snappy rotation
                            }}
                        >
                            <div className="absolute top-2 font-black text-nature-900 text-xs">N</div>
                            <div className="absolute bottom-2 font-black text-nature-900 text-xs">S</div>
                            <div className="absolute left-2 font-black text-nature-900 text-xs">W</div>
                            <div className="absolute right-2 font-black text-nature-900 text-xs">E</div>
                            <div className="w-40 h-40 border-2 border-nature-100 rounded-full flex items-center justify-center">
                                <Compass className="w-10 h-10 text-nature-900" />
                            </div>
                            <div className="w-1.5 h-26 bg-red-600 rounded-full absolute -top-4 shadow-lg ring-4 ring-white z-10"></div>
                        </div>

                        <div className="mt-8 text-center min-h-[60px] flex flex-col items-center justify-center">
                            {!hasDetected ? (
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                                    POINT PHONE TO BALCONY
                                </p>
                            ) : (
                                <p className="text-xl font-black uppercase tracking-tighter" style={{ color: '#1B4332' }}>
                                    {isLocked ? 'STABILIZED: ' : ''}{headingName}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card p-8 space-y-8 bg-white/80 backdrop-blur-xl border-2 border-nature-100 rounded-[40px] shadow-2xl">
                    <h2 className="text-xl font-black text-nature-900 uppercase">2. {t('lightSpace')}</h2>
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block flex items-center gap-2"><Sun className="w-3 h-3 text-amber-500" /> Manual Sunlight Input</label>
                            <div className="grid grid-cols-1 gap-2">
                                {['2-4 Hrs', '4-6 Hrs', '6+ Hrs'].map(val => (
                                    <button key={val} onClick={() => setSunlight(val)} className={`p-4 rounded-2xl font-black text-xs text-left transition-all border-2 flex items-center justify-between ${sunlight === val ? 'bg-nature-900 text-white border-nature-900 shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-nature-200'}`}>
                                        <span>{t(val)}</span>
                                        {sunlight === val && <CheckCircle2 className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Space Type</label>
                            <select className="w-full p-4 bg-nature-50 border-2 border-transparent rounded-2xl font-bold text-nature-900 cursor-pointer" value={balconyType} onChange={(e) => setBalconyType(e.target.value)}>
                                <option value="Direct Sun">{t('directSun')}</option>
                                <option value="Covered Balcony">{t('coveredBalcony')}</option>
                                <option value="Semi-Shaded">{t('semiShaded')}</option>
                            </select>
                        </div>
                        <button onClick={findMatches} className="w-full py-5 bg-nature-900 text-white rounded-[22px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3">{t('findMatches')} <ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="card p-8 space-y-8 bg-white/80 backdrop-blur-xl border-2 border-nature-100 rounded-[40px] shadow-2xl">
                    <h2 className="text-xl font-black text-nature-900 uppercase">3. Sustainability</h2>
                    <div className="space-y-6">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="text" className="w-full py-5 pl-14 pr-6 bg-nature-50 rounded-[22px] font-bold text-nature-900 border-2 border-transparent focus:border-nature-900 outline-none transition-all" placeholder="Search plant for survival test..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <button onClick={checkSustainability} className="w-full py-5 bg-nature-100 text-nature-900 rounded-[22px] font-black uppercase tracking-widest hover:bg-nature-200 border-2 border-nature-200">Analyze Survival Rate</button>
                        {sustainabilityResult && (
                            <div className={`p-6 rounded-3xl animate-scaleUp border ${sustainabilityResult.status === 'perfect' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>
                                <div className="flex gap-4">
                                    {sustainabilityResult.status === 'perfect' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
                                    <div className="space-y-1">
                                        <p className="font-black text-[10px] uppercase tracking-wider">{sustainabilityResult.status === 'perfect' ? 'Safe to Grow' : 'Caution Advice'}</p>
                                        <p className="text-xs font-bold leading-relaxed">{sustainabilityResult.message}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {hasSearched && (
                <div className="space-y-10 animate-slideUp pt-10">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-nature-900 rounded-full"></div>
                        <h2 className="text-3xl font-black text-nature-900 tracking-tight uppercase">{t('tailoredRecommendations')}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {recommendations.length > 0 ? recommendations.map((plant, idx) => (
                            <div key={idx} className="group bg-white rounded-[40px] overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-nature-100 flex flex-col">
                                <div className="h-56 relative overflow-hidden">
                                    <img src={plant.image} alt={plant.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-nature-900 shadow-xl flex items-center gap-2"><MapPin className="w-3 h-3 text-emerald-600" /> {t('bestFor')} {t(plant.directions[0].toLowerCase())}</div>
                                </div>
                                <div className="p-8 space-y-4 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-black text-nature-900">{t(plant.name)}</h3>
                                    <div className="bg-nature-50 p-4 rounded-2xl border border-nature-100/50 flex-1"><p className="text-xs font-bold text-nature-800 leading-relaxed italic">"{plant.reason}"</p></div>
                                    <button className="w-full py-4 bg-nature-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all">{t('marketplace')}</button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-nature-200"><AlertCircle className="w-12 h-12 text-nature-200 mx-auto mb-4" /><h3 className="text-xl font-black text-nature-900">{t('noMatchesFound')}</h3></div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SmartPlantFinder() {
    return (
        <FinderErrorBoundary>
            <SmartPlantFinderContent />
        </FinderErrorBoundary>
    );
}
