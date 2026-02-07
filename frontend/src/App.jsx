import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Marketplace from './pages/Marketplace';
import Dashboard from './pages/Dashboard';
import SellerDashboard from './pages/SellerDashboard';
import PlantCare from './pages/PlantCare';


function App() {
    return (
        <div className="min-h-screen bg-nature-50 text-gray-800 font-sans">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/seller" element={<SellerDashboard />} />
                    <Route path="/plant-care" element={<PlantCare />} />
                </Routes>
            </main>
            <footer className="bg-nature-900 text-nature-100 py-6 text-center">
                <p>&copy; 2024 Easy Grow Plants. Cultivating a Greener Future.</p>
            </footer>
        </div>
    )
}

export default App
