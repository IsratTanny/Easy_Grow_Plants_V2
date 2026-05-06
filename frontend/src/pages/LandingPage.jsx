import { Link } from 'react-router-dom';
import imgAglaonema from '../assets/2.jpg';
import imgCactus from '../assets/1.webp';
import imgMonstera from '../assets/3.avif';
import imgBonsai from '../assets/4.webp';
import { Leaf, Droplets, CloudSun, Sprout, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function LandingPage() {
    const [featuredPlants, setFeaturedPlants] = useState([]);
    const { t } = useLanguage();

    useEffect(() => {
        const mockPlants = [
            { id: 1, name: 'Aglaonema Red', image: imgAglaonema, price: '880tk' },
            { id: 2, name: 'Cactus Cluster', image: imgCactus, price: '500tk' },
            { id: 3, name: 'Monstera Variegata', image: imgMonstera, price: '1200tk' },
            { id: 4, name: 'Bonsai Pine', image: imgBonsai, price: '3000tk' },
        ];
        setFeaturedPlants(mockPlants);
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto px-4 pb-20 space-y-16">
                {/* Hero Section */}
                <section className="pt-20 pb-12 text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-bold text-nature-800 leading-tight">
                        {t('growPlantsHappiness')}
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Your one-stop destination for healthy plants and expert care advice.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                        <Link to="/marketplace" className="bg-nature-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-nature-700 transition-colors flex items-center justify-center gap-2">
                            {t('shopPlants')}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link to="/register" className="bg-white text-nature-700 border border-nature-200 px-8 py-3 rounded-xl font-bold hover:bg-nature-50 transition-colors">
                            {t('connectDevice')}
                        </Link>
                    </div>
                </section>

                {/* Featured Plants */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-800">{t('featuredPlants')}</h2>
                        <Link to="/marketplace" className="text-nature-600 font-semibold hover:underline flex items-center gap-1">
                            {t('seeAll')} <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="flex overflow-x-auto gap-6 pb-6 scrollbar-hide">
                        {featuredPlants.map((plant) => (
                            <div key={plant.id} className="min-w-[250px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="h-48 overflow-hidden bg-gray-50">
                                    <img
                                        src={plant.image}
                                        alt={plant.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&q=80&w=400';
                                        }}
                                    />
                                </div>
                                <div className="p-4 flex flex-col gap-1">
                                    <h4 className="font-bold text-gray-800">{plant.name}</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-nature-600 font-bold">{plant.price}</span>
                                        <button className="text-nature-600 p-2 hover:bg-nature-50 rounded-lg transition-colors">
                                            <Leaf className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Services */}
                <section className="grid md:grid-cols-3 gap-8 pt-8">
                    <ServiceItem
                        icon={<Droplets className="w-8 h-8 text-blue-500" />}
                        title="Smart Irrigation"
                        desc="Automated water delivery based on real-time soil analysis."
                    />
                    <ServiceItem
                        icon={<Activity className="w-8 h-8 text-nature-600" />}
                        title="Live Monitoring"
                        desc="Track moisture, light, and temperature 24/7 on your phone."
                    />
                    <ServiceItem
                        icon={<ShieldCheck className="w-8 h-8 text-nature-600" />}
                        title="AI Plant Doctor"
                        desc="Instant medical diagnosis and recovery plans via image scanning."
                        to="/plant-doctor"
                    />
                </section>
            </div>
        </div>
    );
}

function ServiceItem({ icon, title, desc, to }) {
    const content = (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col items-center text-center">
            <div className="mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-500">{desc}</p>
        </div>
    );

    if (to) {
        return (
            <Link to={to} className="block no-underline">
                {content}
            </Link>
        );
    }

    return content;
}
