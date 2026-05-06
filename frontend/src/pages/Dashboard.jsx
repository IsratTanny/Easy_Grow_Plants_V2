import { useState, useEffect } from 'react';
import { api, iotApi } from '../api/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplets, Thermometer, Sun, Zap, MessageCircle, Activity } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Dashboard() {
    const { t } = useLanguage();
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [readings, setReadings] = useState([]); 
    const [realTimeReadings, setRealTimeReadings] = useState({});
    const [pumpStatus, setPumpStatus] = useState('OFF');
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [subscriptions, setSubscriptions] = useState([]);
    const [pottingRequests, setPottingRequests] = useState([]);

    useEffect(() => {
        // Fetch User's Devices
        const fetchDevices = async () => {
            try {
                const res = await api.get('/devices/');
                setDevices(res.data);
                if (res.data.length > 0) setSelectedDevice(res.data[0]);
            } catch (err) { console.error(err); }
        };
        fetchDevices();

        // ... subscriptions and potting requests ...
        const fetchSubscriptions = async () => {
            try {
                const res = await api.get('/plant-care/subscriptions/');
                setSubscriptions(Array.isArray(res.data) ? res.data : (res.data.results || []));
            } catch (err) { console.error(err); }
        };
        fetchSubscriptions();

        const savedPotting = localStorage.getItem('local_potting_requests');
        if (savedPotting) setPottingRequests(JSON.parse(savedPotting));

        const mockData = Array.from({ length: 10 }, (_, i) => ({
            name: `${i}:00`,
            moisture: Math.floor(Math.random() * 40) + 30,
            temp: Math.floor(Math.random() * 10) + 20,
        }));
        setReadings(mockData);
    }, []);

    useEffect(() => {
        if (!selectedDevice) return;

        const fetchStatus = async () => {
            try {
                const res = await api.get(`/devices/${selectedDevice.device_id}/status/`);
                setRealTimeReadings(prev => ({
                    ...prev,
                    [selectedDevice.device_id]: res.data
                }));
                setPumpStatus(res.data.pump === 1 ? 'ON' : 'OFF');
            } catch (err) { console.warn("Device status fetch failed"); }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, [selectedDevice]);

    const togglePump = async () => {
        if (!selectedDevice) return;
        try {
            const action = pumpStatus === 'ON' ? 'control-pump' : 'water'; // Simple toggle logic or specific endpoint
            const res = await api.get(`/devices/${selectedDevice.device_id}/${action}/`);
            // The water endpoint returns command sent, we rely on polling to update status
            if (action === 'control-pump') setPumpStatus(res.data.pump_status);
        } catch (err) { console.error(err); }
    };

    const sendChat = async () => {
        if (!inputMsg.trim()) return;
        const newMsgs = [...chatMessages, { role: 'user', content: inputMsg }];
        setChatMessages(newMsgs);
        setInputMsg('');

        try {
            const res = await iotApi.post('/iot/chat/', { message: inputMsg });
            setChatMessages([...newMsgs, { role: 'bot', content: res.data.response }]);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-8 relative">
            <h1 className="text-3xl font-bold text-nature-900">{t('mySmartGarden')}</h1>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Device Status Card / Main Area */}
                <div className="md:col-span-2 space-y-6">
                    <div className="card p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ActivityIcon className="text-blue-500" /> {t('liveMonitor')}
                            </h2>
                            <select
                                className="border rounded-lg p-2"
                                onChange={(e) => setSelectedDevice(devices.find(d => d.id === parseInt(e.target.value)))}
                            >
                                {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={readings}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="moisture" stroke="#34ae6f" strokeWidth={2} />
                                    <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <StatCard 
                            icon={<Droplets className="text-blue-500" />} 
                            label={t('soilMoisture')} 
                            value={selectedDevice && realTimeReadings[selectedDevice.device_id] ? `${realTimeReadings[selectedDevice.device_id].percent}%` : '--'} 
                        />
                        <StatCard 
                            icon={<Thermometer className="text-red-500" />} 
                            label={t('temperature')} 
                            value={selectedDevice && realTimeReadings[selectedDevice.device_id] ? `${realTimeReadings[selectedDevice.device_id].temp}°C` : '--'} 
                        />
                    </div>

                    {/* Subscriptions Section */}
                    {subscriptions.length > 0 && (
                        <div className="card p-6 border-l-4 border-l-nature-600 bg-nature-50/30">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-nature-600" /> {t('activeSubscriptions')}
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {subscriptions.map(sub => (
                                    <div key={sub.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-xl border border-nature-100 shadow-sm gap-4">
                                        <div>
                                            <p className="font-bold text-nature-900 text-lg capitalize">{(sub.plan_type || '').replace('_', ' ')}</p>
                                            <p className="text-sm text-gray-500">Started on {new Date(sub.start_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="bg-nature-100 px-4 py-2 rounded-lg">
                                            <p className="text-[10px] uppercase font-bold text-nature-600 tracking-wider">{t('nextDelivery')}</p>
                                            <p className="font-bold text-nature-800">{new Date(sub.next_delivery_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Potting Requests Section */}
                    {pottingRequests.some(r => r.status !== 'completed') && (
                        <div className="card p-6 border-l-4 border-l-amber-600 bg-amber-50/30">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-amber-600" /> Active Potting Service
                                </h3>
                                <Link to="/expert-potting" className="text-[10px] font-black text-amber-700 uppercase tracking-widest hover:underline">View History</Link>
                            </div>
                            <div className="space-y-4">
                                {pottingRequests.filter(r => r.status !== 'completed').map(req => (
                                    <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-xl border border-amber-100 shadow-sm gap-4">
                                        <div>
                                            <p className="font-black text-gray-900">Potting #{req.id}</p>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{req.pots}</p>
                                        </div>
                                        <div className="px-4 py-2 rounded-lg bg-amber-900 text-white text-center">
                                            <p className="text-[8px] uppercase font-black tracking-widest opacity-70">Status</p>
                                            <p className="font-black text-[10px] uppercase">{req.status.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="space-y-6">
                    <div className="card p-6 text-center">
                        <h3 className="text-lg font-bold mb-4">{t('pumpControl')}</h3>
                        <div className={`text-2xl font-bold mb-4 ${pumpStatus === 'ON' ? 'text-green-500' : 'text-gray-400'}`}>
                            {pumpStatus}
                        </div>
                        <button
                            onClick={togglePump}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all ${pumpStatus === 'ON' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                        >
                            <Zap className="inline-block mr-2" />
                            {pumpStatus === 'ON' ? t('stopWatering') : t('activatePump')}
                        </button>
                    </div>

                    <div className="card p-6 bg-nature-50 border-nature-200">
                        <h3 className="font-bold text-nature-800 mb-2">{t('sustainableTip')}</h3>
                        <p className="text-sm text-nature-600">{t('sustainableTipContent') || 'Water early in the morning to minimize evaporation and ensure your plants stay hydrated longer.'}</p>
                    </div>
                </div>
            </div>


            {/* Chatbot Bubble */}
            <div className={`fixed bottom-8 right-8 w-80 bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100 transition-all transform ${chatOpen ? 'scale-100' : 'scale-0'}`}>
                <div className="bg-nature-600 p-4 text-white font-bold flex justify-between items-center">
                    <span>{t('aiExpert') || 'Plant Expert AI'}</span>
                    <button onClick={() => setChatOpen(false)}>×</button>
                </div>
                <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {chatMessages.map((m, i) => (
                        <div key={i} className={`p-2 rounded-lg text-sm max-w-[80%] ${m.role === 'user' ? 'ml-auto bg-nature-500 text-white' : 'bg-white border'}`}>
                            {m.content}
                        </div>
                    ))}
                </div>
                <div className="p-2 border-t flex gap-2">
                    <input
                        className="flex-1 border rounded px-2 py-1 text-sm"
                        value={inputMsg}
                        onChange={(e) => setInputMsg(e.target.value)}
                        placeholder={t('askExpert') || 'Ask about plants...'}
                    />
                    <button onClick={sendChat} className="bg-nature-600 text-white px-3 rounded">{t('send') || 'Send'}</button>
                </div>
            </div>

            {!chatOpen && (
                <button
                    onClick={() => setChatOpen(true)}
                    className="fixed bottom-8 right-8 bg-nature-600 text-white p-4 rounded-full shadow-lg hover:bg-nature-700 transition-transform hover:scale-110"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="card p-4 flex items-center gap-4">
            <div className="p-3 bg-gray-50 rounded-full">{icon}</div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
}

function ActivityIcon(props) {
    return <Activity {...props} />
}
