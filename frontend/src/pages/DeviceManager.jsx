import { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { Cpu, Plus, Droplets, Wind, Clock, Trash2, ExternalLink, AlertCircle,
    Pencil, ImagePlus, BookOpen, X, Sparkles, Leaf } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import toast from 'react-hot-toast';

const BLANK_DEVICE = {
    device_id: '',
    name: '',
    plant_name: '',
    nickname: '',
    ip_address: '',
    schedule_time: '20:00',
    moisture_threshold: 30,
    pump_duration_seconds: 5,
    auto_watering_enabled: false,
};

// Resolve a device's plant image to a loadable URL (backend may return an
// absolute or a /media-relative path).
const mediaUrl = (u) => {
    if (!u) return null;
    if (u.startsWith('http') || u.startsWith('blob:') || u.startsWith('data:')) return u;
    return u.startsWith('/') ? u : `/${u}`;
};

export default function DeviceManager() {
    const { t } = useLanguage();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);        // device_id being edited, null = adding new
    const [newDevice, setNewDevice] = useState({ ...BLANK_DEVICE });
    const [plantImageFile, setPlantImageFile] = useState(null);
    const [plantImagePreview, setPlantImagePreview] = useState(null);
    const [guideDevice, setGuideDevice] = useState(null);    // device whose care guide is shown
    const [guideText, setGuideText] = useState('');
    const [guideLoading, setGuideLoading] = useState(false);
    
    // Initial fetch
    useEffect(() => {
        fetchDevices();
        
        // Poll for updates from backend every 5 seconds
        // This allows real-time monitoring during calibration
        const pollInterval = setInterval(() => {
            fetchDevices();
        }, 5000);

        return () => clearInterval(pollInterval);
    }, []);

    const fetchDevices = async () => {
        try {
            const res = await api.get('/devices/');
            setDevices(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching devices:', err);
            setLoading(false);
        }
    };

    const refreshDeviceStatus = async (device) => {
        if (refreshing[device.device_id]) return;
        
        setRefreshing(prev => ({ ...prev, [device.device_id]: true }));
        try {
            // This endpoint still calls Arduino directly, so we keep it manual only
            const res = await api.get(`/devices/${device.device_id}/status/`);
            if (res.data.success) {
                toast.success('Device status refreshed');
                // Refresh list to get the newly saved telemetry in latest_reading
                await fetchDevices();
            } else {
                toast.error(`Refresh failed: ${res.data.message}`);
            }
        } catch (err) {
            console.error('Refresh error:', err);
        } finally {
            setRefreshing(prev => ({ ...prev, [device.device_id]: false }));
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setNewDevice({ ...BLANK_DEVICE });
        setPlantImageFile(null);
        setPlantImagePreview(null);
        setShowAddModal(true);
    };

    const openEditModal = (device) => {
        setEditingId(device.device_id);
        setNewDevice({
            device_id: device.device_id,
            name: device.name || '',
            plant_name: device.plant_name || '',
            nickname: device.nickname || '',
            ip_address: device.ip_address || '',
            schedule_time: device.schedule_time || '20:00',
            moisture_threshold: device.moisture_threshold ?? 30,
            pump_duration_seconds: device.pump_duration_seconds ?? 5,
            auto_watering_enabled: !!device.auto_watering_enabled,
        });
        setPlantImageFile(null);
        setPlantImagePreview(mediaUrl(device.plant_image));
        setShowAddModal(true);
    };

    const onPickImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPlantImageFile(file);
        setPlantImagePreview(URL.createObjectURL(file));
    };

    const handleSaveDevice = async (e) => {
        e.preventDefault();
        const payload = {
            ...newDevice,
            name: newDevice.name || newDevice.plant_name || newDevice.device_id,
        };
        // Use multipart only when a new image was picked; otherwise send JSON.
        let body = payload;
        const cfg = {};
        if (plantImageFile) {
            const fd = new FormData();
            Object.entries(payload).forEach(([k, v]) => fd.append(k, v));
            fd.append('plant_image', plantImageFile);
            body = fd;
            cfg.headers = { 'Content-Type': 'multipart/form-data' };
        }
        try {
            if (editingId) {
                await api.patch(`/devices/${editingId}/`, body, cfg);
                toast.success('Device updated!');
            } else {
                await api.post('/devices/', body, cfg);
                toast.success('Device added successfully!');
            }
            setShowAddModal(false);
            setEditingId(null);
            setNewDevice({ ...BLANK_DEVICE });
            setPlantImageFile(null);
            setPlantImagePreview(null);
            await fetchDevices();
        } catch (err) {
            toast.error(editingId
                ? 'Could not update the device.'
                : 'Error adding device. Check if Device ID is unique.');
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

    const openCareGuide = async (device, refresh = false) => {
        setGuideDevice(device);
        setGuideText(refresh ? '' : (device.care_guide || ''));
        if (!refresh && device.care_guide) return;   // already have it
        setGuideLoading(true);
        try {
            const res = await api.post(`/devices/${device.device_id}/care-guide/${refresh ? '?refresh=1' : ''}`);
            setGuideText(res.data.care_guide || '');
            // reflect the freshly generated guide in local state
            setDevices((prev) => prev.map((d) => d.device_id === device.device_id
                ? { ...d, care_guide: res.data.care_guide } : d));
        } catch (err) {
            toast.error('Could not generate the care guide.');
        } finally {
            setGuideLoading(false);
        }
    };

    const handleWaterNow = async (device) => {
        try {
            const res = await api.post(`/devices/${device.device_id}/water/`);
            if (res.data.success) {
                toast.success(res.data.message);
                await fetchDevices(); // Refresh to get updated stats
            } else {
                toast.error(res.data.message);
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            toast.error(msg);
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
                    onClick={openAddModal}
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
                                    <div className="flex items-center gap-3 min-w-0">
                                        {device.plant_image ? (
                                            <img src={mediaUrl(device.plant_image)} alt={device.plant_name}
                                                className="w-11 h-11 rounded-xl object-cover border-2 border-white/40 flex-shrink-0" />
                                        ) : (
                                            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                                                <Leaf className="w-5 h-5 text-white/80" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${device.is_online ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                                                <h3 className="font-bold text-lg truncate">{device.plant_name || device.name}</h3>
                                            </div>
                                            <p className="text-nature-100 text-xs opacity-80 truncate">{device.nickname || 'Living Room'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => openEditModal(device)}
                                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                            title="Edit device"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDevice(device.device_id)}
                                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                            title="Delete device"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
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
                                        <span className={`text-lg font-bold ${device.latest_reading?.soil_moisture < device.moisture_threshold ? 'text-red-500' : 'text-nature-700'}`}>
                                            {device.latest_reading?.soil_moisture ?? '--'}%
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <div className="bg-blue-50 p-2 rounded-lg">
                                                <Wind className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <span className="text-sm font-medium">Pump Status</span>
                                        </div>
                                        <span className={`text-sm font-bold ${device.latest_reading?.pump_status ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`}>
                                            {device.latest_reading?.pump_status ? 'RUNNING' : 'IDLE'}
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
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <div className="bg-purple-50 p-2 rounded-lg">
                                                <AlertCircle className="w-5 h-5 text-purple-500" />
                                            </div>
                                            <span className="text-sm font-medium">Auto Watering</span>
                                        </div>
                                        <span className={`text-sm font-bold ${device.auto_watering_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                                            {device.auto_watering_enabled ? 'ON' : 'OFF'}
                                        </span>
                                    </div>
                                    
                                    {/* Removed stale error display from background polling */}
                                </div>

                                <div className="space-y-1 mb-4">
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        Last Seen: {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : 'Never'}
                                        {!device.is_online && <span className="text-red-400 font-bold ml-1">(! OFFLINE)</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        Last Sync: {device.latest_reading?.timestamp ? new Date(device.latest_reading.timestamp).toLocaleTimeString() : 'Never'}
                                        <span className="ml-auto opacity-60">(Auto sync 5s)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                        <Droplets className="w-3 h-3" />
                                        Last Auto: {device.last_auto_water_date || 'Never'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        Last Watered (Any): {device.last_watered_at ? new Date(device.last_watered_at).toLocaleString() : 'Never'}
                                    </div>
                                    {!device.is_online && (
                                        <div className="mt-2 p-2 bg-red-50 rounded-lg text-[9px] text-red-600 border border-red-100">
                                            Tip: Start backend with <code>0.0.0.0:8000</code> and check Arduino IP.
                                        </div>
                                    )}
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
                                        onClick={() => openCareGuide(device)}
                                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                                        title="Care Guide"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => refreshDeviceStatus(device)}
                                        disabled={refreshing[device.device_id]}
                                        className={`p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors ${refreshing[device.device_id] ? 'animate-spin' : ''}`}
                                        title="Sync Now (Ping Arduino)"
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
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-nature-800 mb-6">
                            {editingId ? 'Edit Smart Pot' : 'Link New Smart Pot'}
                        </h2>
                        <form onSubmit={handleSaveDevice} className="space-y-4">
                            {/* Plant photo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plant Photo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {plantImagePreview ? (
                                            <img src={plantImagePreview} alt="Plant" className="w-full h-full object-cover" />
                                        ) : (
                                            <Leaf className="w-7 h-7 text-gray-300" />
                                        )}
                                    </div>
                                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-nature-50 text-nature-700 font-bold text-sm cursor-pointer hover:bg-nature-100 transition-colors">
                                        <ImagePlus className="w-4 h-4" />
                                        {plantImagePreview ? 'Change photo' : 'Upload photo'}
                                        <input type="file" accept="image/*" onChange={onPickImage} className="hidden" />
                                    </label>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Used to tailor the plant's care guide.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Device ID (Unique Code)</label>
                                <input
                                    type="text"
                                    required
                                    disabled={!!editingId}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Device IP Address <span className="text-gray-400 font-normal">(optional)</span></label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 outline-none"
                                    placeholder="Auto-detected when the device powers on"
                                    value={newDevice.ip_address}
                                    onChange={(e) => setNewDevice({...newDevice, ip_address: e.target.value})}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Leave blank — the pot broadcasts its IP and the backend fills this in automatically.</p>
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
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pump Duration (s)</label>
                                    <input 
                                        type="number"
                                        required
                                        min="1"
                                        max="10"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 outline-none"
                                        value={newDevice.pump_duration_seconds}
                                        onChange={(e) => setNewDevice({...newDevice, pump_duration_seconds: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center cursor-pointer gap-2 mt-4">
                                        <input 
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-300 text-nature-600 focus:ring-nature-500"
                                            checked={newDevice.auto_watering_enabled}
                                            onChange={(e) => setNewDevice({...newDevice, auto_watering_enabled: e.target.checked})}
                                        />
                                        <span className="text-sm font-medium text-gray-700">Enable Auto Watering</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); setEditingId(null); }}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-nature-600 text-white py-3 rounded-xl font-bold hover:bg-nature-700 transition-colors shadow-lg shadow-nature-100"
                                >
                                    {editingId ? 'Update Device' : 'Save Device'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Care Guide Modal */}
            {guideDevice && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={() => setGuideDevice(null)}>
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl animate-scaleUp max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3 min-w-0">
                                {guideDevice.plant_image ? (
                                    <img src={mediaUrl(guideDevice.plant_image)} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-nature-50 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-6 h-6 text-nature-500" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h2 className="text-xl font-bold text-nature-800 truncate">
                                        {guideDevice.plant_name || guideDevice.name}
                                    </h2>
                                    <p className="text-xs text-gray-400 font-medium">AI Care Guide</p>
                                </div>
                            </div>
                            <button onClick={() => setGuideDevice(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {guideLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nature-600 mb-3"></div>
                                    <p className="text-sm font-medium">Generating care guide…</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{guideText}</p>
                            )}
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={() => openCareGuide(guideDevice, true)}
                                disabled={guideLoading}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-nature-50 text-nature-700 py-3 rounded-xl font-bold text-sm hover:bg-nature-100 transition-colors disabled:opacity-50"
                            >
                                <Sparkles className="w-4 h-4" /> Regenerate
                            </button>
                            <button
                                onClick={() => setGuideDevice(null)}
                                className="flex-1 bg-nature-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-nature-700 transition-colors"
                            >
                                Done
                            </button>
                        </div>
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
