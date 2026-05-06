import { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { Cpu, Plus, Droplets, Thermometer, Wind, Clock, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function DeviceManager() {
    const { t } = useLanguage();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDevice, setNewDevice] = useState({
        device_id: '',
        name: '',
        plant_name: '',
        nickname: '',
        ip_address: '',
        schedule_time: '20:00',
        moisture_threshold: 30
    });
    const [readings, setReadings] = useState({});

    useEffect(() => {
        fetchDevices();
        
        // Start polling for real-time updates every 5 seconds
        const pollInterval = setInterval(() => {
            devices.forEach(device => {
                fetchDeviceData(device);
            });
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [devices]);

    const fetchDevices = async () => {
        try {
            const res = await api.get('/devices/');
            setDevices(res.data);
            setLoading(false);
            // Fetch initial readings for all devices
            res.data.forEach(device => {
                fetchDeviceData(device);
            });
        } catch (err) {
            console.error('Error fetching devices:', err);
            setLoading(false);
        }
    };

    const fetchDeviceData = async (device) => {
        try {
            // Using backend proxy to avoid CORS and reachable issues
            const res = await api.get(`/devices/${device.device_id}/status/`);
            setReadings(prev => ({
                ...prev,
                [device.device_id]: {
                    ...res.data,
                    timestamp: new Date().toLocaleTimeString()
                }
            }));
        } catch (err) {
            console.warn(`Could not reach device ${device.device_id} via backend`);
        }
    };

    const handleAddDevice = async (e) => {
        e.preventDefault();
        try {
            const deviceData = {
                ...newDevice,
                name: newDevice.name || newDevice.plant_name || newDevice.device_id
            };
            const res = await api.post('/devices/', deviceData);
            setDevices([...devices, res.data]);
            setShowAddModal(false);
            setNewDevice({
                device_id: '',
                name: '',
                plant_name: '',
                nickname: '',
                ip_address: '',
                schedule_time: '20:00',
                moisture_threshold: 30
            });
        } catch (err) {
            alert('Error adding device. Check if Device ID is unique.');
        }
    };

    const handleDeleteDevice = async (deviceId) => {
        if (!window.confirm('Delete this device?')) return;
        try {
            await api.delete(`/devices/${deviceId}/`);
            setDevices(devices.filter(d => d.device_id !== deviceId));
        } catch (err) {
            console.error('Error deleting device:', err);
        }
    };

    const handleWaterNow = async (device) => {
        try {
            const res = await api.get(`/devices/${device.device_id}/water/`);
            if (res.data.status === 'command sent') {
                alert(`Watering command sent to ${device.plant_name || device.name}`);
                fetchDeviceData(device); // Refresh data
            }
        } catch (err) {
            alert(`Failed to reach device. Backend error: ${err.response?.data?.error || err.message}`);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-nature-800 flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-nature-600" />
                        Device Management
                    </h1>
                    <p className="text-gray-600 mt-2">Monitor and control your smart plant pots</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-nature-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-nature-700 transition-all flex items-center gap-2 shadow-lg shadow-nature-200"
                >
                    <Plus className="w-5 h-5" />
                    Add Device
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-600"></div>
                </div>
            ) : devices.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                    <div className="bg-nature-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Cpu className="w-10 h-10 text-nature-400" />
                    </div>
                    <h3 className="text-xl font-bold text-nature-800">No Devices Linked</h3>
                    <p className="text-gray-500 mt-2 max-w-sm mx-auto">Link your Arduino-based Smart Pots to start monitoring your plants in real-time.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {devices.map(device => (
                        <div key={device.id} className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-nature-100 transition-all group">
                            <div className="bg-nature-600 p-4 text-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg truncate">{device.plant_name || device.name}</h3>
                                        <p className="text-nature-100 text-xs opacity-80">{device.nickname || 'Living Room'}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteDevice(device.device_id)}
                                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <div className="bg-blue-50 p-2 rounded-lg">
                                                <Droplets className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <span className="text-sm font-medium">Moisture</span>
                                        </div>
                                        <span className={`text-lg font-bold ${readings[device.device_id]?.percent < device.moisture_threshold ? 'text-red-500' : 'text-nature-700'}`}>
                                            {readings[device.device_id]?.percent ?? '--'}%
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <div className="bg-orange-50 p-2 rounded-lg">
                                                <Thermometer className="w-5 h-5 text-orange-500" />
                                            </div>
                                            <span className="text-sm font-medium">Temperature</span>
                                        </div>
                                        <span className="text-lg font-bold text-nature-700">
                                            {readings[device.device_id]?.temp ?? '--'}°C
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <div className="bg-emerald-50 p-2 rounded-lg">
                                                <Clock className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <span className="text-sm font-medium">Schedule</span>
                                        </div>
                                        <span className="text-sm font-bold text-nature-700 uppercase">
                                            {device.schedule_time || 'No Schedule'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-4">
                                    <Clock className="w-3 h-3" />
                                    Last Updated: {readings[device.device_id]?.timestamp || 'Never'}
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleWaterNow(device)}
                                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Droplets className="w-4 h-4" />
                                        Water Now
                                    </button>
                                    <button 
                                        onClick={() => fetchDeviceData(device)}
                                        className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                                        title="Refresh Data"
                                    >
                                        <Repeat className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                {device.ip_address && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-[10px] font-mono text-gray-400">IP: {device.ip_address}</span>
                                        <a 
                                            href={`http://${device.ip_address}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-[10px] text-nature-600 hover:underline flex items-center gap-1"
                                        >
                                            Web Panel <ExternalLink className="w-2 h-2" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Device Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scaleUp">
                        <h2 className="text-2xl font-bold text-nature-800 mb-6">Link New Smart Pot</h2>
                        <form onSubmit={handleAddDevice} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Device ID (Unique Code)</label>
                                <input 
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 outline-none"
                                    placeholder="e.g. POT_001"
                                    value={newDevice.device_id}
                                    onChange={(e) => setNewDevice({...newDevice, device_id: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Plant Name</label>
                                    <input 
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 outline-none"
                                        placeholder="e.g. Aloe Vera"
                                        value={newDevice.plant_name}
                                        onChange={(e) => setNewDevice({...newDevice, plant_name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                                    <input 
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 outline-none"
                                        placeholder="e.g. Kitchen Pot"
                                        value={newDevice.nickname}
                                        onChange={(e) => setNewDevice({...newDevice, nickname: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Device IP Address</label>
                                <input 
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 outline-none"
                                    placeholder="e.g. 192.168.1.15"
                                    value={newDevice.ip_address}
                                    onChange={(e) => setNewDevice({...newDevice, ip_address: e.target.value})}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Found in your Arduino Serial Monitor</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Check Time</label>
                                    <input 
                                        type="time"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 outline-none"
                                        value={newDevice.schedule_time}
                                        onChange={(e) => setNewDevice({...newDevice, schedule_time: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Threshold (%)</label>
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 outline-none"
                                        value={newDevice.moisture_threshold}
                                        onChange={(e) => setNewDevice({...newDevice, moisture_threshold: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-nature-600 text-white py-3 rounded-xl font-bold hover:bg-nature-700 transition-colors shadow-lg shadow-nature-100"
                                >
                                    Save Device
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Repeat({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
    )
}
