import { Link, useNavigate } from 'react-router-dom';
import { clearAuthToken, isAuthenticated } from '../api/axios';
import { Leaf, ShoppingCart, User, Activity, LogOut } from 'lucide-react';

export default function Navbar() {
    const navigate = useNavigate();
    const isAuth = isAuthenticated();

    const handleLogout = () => {
        clearAuthToken();
        navigate('/login');
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-nature-100 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-nature-700">
                    <Leaf className="w-8 h-8" />
                    <span>Easy Grow Plants</span>
                </Link>

                <div className="flex items-center gap-6">
                    <Link to="/marketplace" className="text-gray-600 hover:text-nature-600 font-medium">Marketplace</Link>
                    <Link to="/plant-care" className="text-gray-600 hover:text-nature-600 font-medium">Plant Care</Link>
                    <Link to="/plant-library" className="text-gray-600 hover:text-nature-600 font-medium">Plant Library</Link>

                    {isAuth ? (
                        <>
                            <Link to="/dashboard" className="text-gray-600 hover:text-nature-600 font-medium">Dashboard</Link>
                            <Link to="/cart" className="relative text-gray-600 hover:text-nature-600">
                                <ShoppingCart className="w-6 h-6" />
                                <span className="absolute -top-2 -right-2 bg-nature-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">0</span>
                            </Link>
                            <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium">
                                <LogOut className="w-5 h-5" /> Logout
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-nature-600 font-medium hover:underline">Login</Link>
                            <Link to="/register" className="btn btn-primary">Get Started</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
