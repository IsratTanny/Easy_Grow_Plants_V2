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

import VoiceAssistant from './components/VoiceAssistant';

function App() {
    return (
        <LanguageProvider>
            <LanguageSelectionModal />
            <div className="min-h-screen bg-nature-50 text-gray-800 font-sans">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/seller-dashboard" element={<SellerDashboard />} />
                        <Route path="/admin-dashboard" element={<AdminDashboard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/sellers/:username" element={<PublicProfile />} />
                        <Route path="/plant-care" element={<PlantCare />} />
                        <Route path="/plant-care/:categoryId" element={<PlantCare />} />
                        <Route path="/plant-care/:categoryId/:varietyId" element={<PlantCare />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/track-order" element={<OrderTracking />} />
                        <Route path="/help-center" element={<HelpCenter />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/reviews" element={<Reviews />} />
                        <Route path="/ar-decorator" element={<ARDecorator />} />
                        <Route path="/detect-plant" element={<PlantDetection />} />
                        <Route path="/devices" element={<DeviceManager />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="/exchange" element={<ExchangeDashboard />} />
                        <Route path="/exchange-history" element={<MyExchanges />} />
                        <Route path="/smart-finder" element={<SmartPlantFinder />} />
                        <Route path="/smart-plant-finder" element={<SmartPlantFinder />} />
                        <Route path="/plant-detection" element={<PlantDetection />} />
                        <Route path="/nearby-sellers" element={<NearbySellers />} />
                        <Route path="/plant-doctor" element={<PlantDoctor />} />
                        <Route path="/plant-doctor/details/:id" element={<PlantDoctorDetails />} />
                        <Route path="/expert-potting" element={<ExpertPotting />} />
                        <Route path="/register-botanist" element={<BotanistRegistration />} />
                    </Routes>
                </main>
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
            </div>
            <ChatbotWidget />
            <VoiceAssistant />
        </LanguageProvider>
    )
}

export default App
