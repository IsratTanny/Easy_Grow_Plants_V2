import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Marketplace from './pages/Marketplace';
import Dashboard from './pages/Dashboard';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PlantCare from './pages/PlantCare';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Cart from './pages/Cart';
import HelpCenter from './pages/HelpCenter';
import OrderTracking from './pages/OrderTracking';
import NotificationsPage from './pages/NotificationsPage';
import Reviews from './pages/Reviews';
import ARDecorator from './pages/ARDecorator';
import PlantDetection from './pages/PlantDetection';
import ChatbotWidget from './components/ChatbotWidget';
import Community from './pages/Community';
import ExchangeDashboard from './pages/ExchangeDashboard';
import MyExchanges from './pages/MyExchanges';
import SmartPlantFinder from './pages/SmartPlantFinder';
import NearbySellers from './pages/NearbySellers';
import PlantDoctor from './pages/PlantDoctor';
import PlantDoctorDetails from './pages/PlantDoctorDetails';
import ExpertPotting from './pages/ExpertPotting';
import BotanistRegistration from './pages/BotanistRegistration';
import DeviceManager from './pages/DeviceManager';
import { LanguageProvider } from './i18n/LanguageContext';
import LanguageSelectionModal from './components/LanguageSelectionModal';
import PrivateRoute from './components/PrivateRoute';
import { isAuthenticated } from './api/axios';

import VoiceAssistant from './components/VoiceAssistant';
import { Toaster } from 'react-hot-toast';

function App() {
    const [isAuth, setIsAuth] = useState(isAuthenticated());

    useEffect(() => {
        const updateAuth = () => {
            setIsAuth(isAuthenticated());
        };
        window.addEventListener('authChange', updateAuth);
        return () => window.removeEventListener('authChange', updateAuth);
    }, []);

    return (
        <LanguageProvider>
            <Toaster position="top-center" reverseOrder={false} />
            <LanguageSelectionModal />
            <div className="min-h-screen bg-nature-50 text-gray-800 font-sans">
                {isAuth && <Navbar />}
                <main className="container mx-auto px-4 py-8">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected Routes */}
                        <Route path="/marketplace" element={<PrivateRoute><Marketplace /></PrivateRoute>} />
                        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="/seller-dashboard" element={<PrivateRoute><SellerDashboard /></PrivateRoute>} />
                        <Route path="/admin-dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/sellers/:username" element={<PrivateRoute><PublicProfile /></PrivateRoute>} />
                        <Route path="/plant-care" element={<PrivateRoute><PlantCare /></PrivateRoute>} />
                        <Route path="/plant-care/:categoryId" element={<PrivateRoute><PlantCare /></PrivateRoute>} />
                        <Route path="/plant-care/:categoryId/:varietyId" element={<PrivateRoute><PlantCare /></PrivateRoute>} />
                        <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
                        <Route path="/track-order" element={<PrivateRoute><OrderTracking /></PrivateRoute>} />
                        <Route path="/help-center" element={<PrivateRoute><HelpCenter /></PrivateRoute>} />
                        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
                        <Route path="/reviews" element={<PrivateRoute><Reviews /></PrivateRoute>} />
                        <Route path="/ar-decorator" element={<PrivateRoute><ARDecorator /></PrivateRoute>} />
                        <Route path="/detect-plant" element={<PrivateRoute><PlantDetection /></PrivateRoute>} />
                        <Route path="/devices" element={<PrivateRoute><DeviceManager /></PrivateRoute>} />
                        <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />
                        <Route path="/exchange" element={<PrivateRoute><ExchangeDashboard /></PrivateRoute>} />
                        <Route path="/exchange-history" element={<PrivateRoute><MyExchanges /></PrivateRoute>} />
                        <Route path="/smart-finder" element={<PrivateRoute><SmartPlantFinder /></PrivateRoute>} />
                        <Route path="/nearby-sellers" element={<PrivateRoute><NearbySellers /></PrivateRoute>} />
                        <Route path="/plant-doctor" element={<PrivateRoute><PlantDoctor /></PrivateRoute>} />
                        <Route path="/plant-doctor/details/:id" element={<PrivateRoute><PlantDoctorDetails /></PrivateRoute>} />
                        <Route path="/expert-potting" element={<PrivateRoute><ExpertPotting /></PrivateRoute>} />
                        <Route path="/register-botanist" element={<PrivateRoute><BotanistRegistration /></PrivateRoute>} />
                    </Routes>
                </main>
                {isAuth && (
                    <footer className="bg-nature-900 text-nature-100 py-10 px-4 border-t border-white/5">
                        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                            <p className="text-sm font-medium opacity-60">&copy; 2024 Easy Grow Plants. Cultivating a Greener Future.</p>
                            <div className="flex items-center gap-6">
                                <Link to="/help-center" className="text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Help Center</Link>
                                <Link to="/register-botanist" className="text-[14px] font-black uppercase tracking-tighter bg-white text-nature-900 px-6 py-3 rounded-2xl hover:bg-emerald-50 hover:scale-105 transition-all flex items-center gap-2 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.3)]">
                                    <GraduationCap className="w-6 h-6 text-nature-600" /> BECOME A BOTANIST
                                </Link>
                            </div>
                        </div>
                    </footer>
                )}
            </div>
            {isAuth && <ChatbotWidget />}
            {isAuth && <VoiceAssistant />}
        </LanguageProvider>
    );
}

export default App;
