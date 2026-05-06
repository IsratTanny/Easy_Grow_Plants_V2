import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Briefcase, GraduationCap, FileText, CheckCircle, ShieldCheck } from 'lucide-react';
import { api } from '../api/axios';


const AREAS = [
    "Gulshan", "Banani", "Dhanmondi", "Uttara", "Mirpur", "Badda", "Bashundhara", "Mohammadpur", "Old Dhaka"
];

export default function BotanistRegistration() {
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        area: '',
        experience: '',
        specialty: '',
    });
    const [files, setFiles] = useState({
        nid: null,
        certificate: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Validation
        if (!formData.name || !formData.phone || !formData.experience || !formData.specialty) {
            alert("Please fill in all personal and expertise fields.");
            return;
        }

        if (!files.nid) {
            alert("NID Copy is mandatory for security verification.");
            return;
        }

        const formDataPayload = new FormData();
        formDataPayload.append('name', formData.name);
        formDataPayload.append('phone', formData.phone);
        formDataPayload.append('area', formData.area);
        formDataPayload.append('experience', formData.experience);
        formDataPayload.append('specialty', formData.specialty);
        
        if (files.nid) {
            formDataPayload.append('nid_copy', files.nid);
        }
        if (files.certificate) {
            formDataPayload.append('certificate', files.certificate);
        }

        try {
            const response = await api.post('/botanist-applications/', formDataPayload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.status === 201 || response.data.success) {
                setSubmitted(true);
                setTimeout(() => {
                    navigate('/');
                }, 5000);
            } else {
                throw new Error("Server rejected the application.");
            }
        } catch (error) {
            console.error("Error submitting application:", error);
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            alert(`[v2] Failed to submit application: ${errorMsg}`);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-2 border-emerald-50 max-w-lg w-full text-center animate-scaleUp">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle className="w-12 h-12 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Application Submitted!</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        Thank you for your interest. Our Admin will verify your NID and certificates within <span className="text-emerald-600 font-bold">48 hours</span>. You will receive an update on your registered phone number.
                    </p>
                    <div className="mt-10 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-left">
                        <ShieldCheck className="text-emerald-600 shrink-0" />
                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest leading-tight">
                            Security Verification In Progress
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/')}
                        className="mt-8 text-emerald-600 font-black uppercase text-xs tracking-widest hover:underline"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 animate-fadeIn">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
                    Become a <span className="text-nature-600">Botanist</span>
                </h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">
                    Join the Elite Network of Dhaka's Plant Experts
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
                {/* Left Side: Info */}
                <div className="md:col-span-1 space-y-8">
                    <div className="p-6 bg-nature-900 rounded-3xl text-white shadow-xl">
                        <h3 className="font-black uppercase text-sm mb-4 border-b border-white/10 pb-2">Why Join Us?</h3>
                        <ul className="space-y-4 text-xs font-bold text-nature-200">
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 bg-nature-400 rounded-full mt-1.5"></div>
                                Access to 10k+ plant owners
                            </li>
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 bg-nature-400 rounded-full mt-1.5"></div>
                                Flexible work-from-home support
                            </li>
                            <li className="flex gap-2">
                                <div className="w-1.5 h-1.5 bg-nature-400 rounded-full mt-1.5"></div>
                                Industry-leading consulting fees
                            </li>
                        </ul>
                    </div>

                    <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-black uppercase text-[10px] text-gray-400 mb-4 tracking-widest">Requirements</h3>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                            Must have at least 2 years of professional experience or a relevant degree in Botany/Horticulture.
                        </p>
                    </div>
                </div>

                {/* Right Side: Form */}
                <form onSubmit={handleSubmit} className="md:col-span-2 bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-gray-50 space-y-8">
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <User className="text-nature-600" /> Personal Details
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 px-2">Full Name</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-nature-600 outline-none font-bold transition-all"
                                        placeholder="e.g. Dr. Rayhan Kabir"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 px-2">Phone Number</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="tel" 
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-nature-600 outline-none font-bold transition-all"
                                        placeholder="017XXXXXXXX"
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 px-2">Service Area (Dhaka)</label>
                            <div className="relative">
                                <select 
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-nature-600 outline-none font-bold appearance-none transition-all"
                                    value={formData.area}
                                    onChange={e => setFormData({...formData, area: e.target.value})}
                                >
                                    <option value="">Select Area</option>
                                    {AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                                </select>
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Briefcase className="text-nature-600" /> Expertise
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 px-2">Years of Experience</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="number" 
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-nature-600 outline-none font-bold transition-all"
                                        placeholder="e.g. 5"
                                        value={formData.experience}
                                        onChange={e => setFormData({...formData, experience: e.target.value})}
                                    />
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 px-2">Primary Specialty</label>
                                <div className="relative">
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-nature-600 outline-none font-bold transition-all"
                                        placeholder="e.g. Indoor/Succulents"
                                        value={formData.specialty}
                                        onChange={e => setFormData({...formData, specialty: e.target.value})}
                                    />
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <GraduationCap className="text-nature-600" /> Security Documents
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl hover:border-nature-400 transition-all cursor-pointer bg-gray-50 relative group">
                                <input 
                                    required
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={e => setFiles({...files, nid: e.target.files[0]})}
                                />
                                <div className="text-center">
                                    <FileText className="mx-auto text-gray-300 group-hover:text-nature-600 mb-2" />
                                    <p className="text-[10px] font-black uppercase text-gray-400 group-hover:text-nature-900 transition-colors">
                                        {files.nid ? files.nid.name : "NID Card Copy"}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl hover:border-nature-400 transition-all cursor-pointer bg-gray-50 relative group">
                                <input 
                                    required
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={e => setFiles({...files, certificate: e.target.files[0]})}
                                />
                                <div className="text-center">
                                    <GraduationCap className="mx-auto text-gray-300 group-hover:text-nature-600 mb-2" />
                                    <p className="text-[10px] font-black uppercase text-gray-400 group-hover:text-nature-900 transition-colors">
                                        {files.certificate ? files.certificate.name : "Academic Certificate"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-5 bg-nature-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all hover:-translate-y-1 active:scale-95"
                    >
                        Submit Application
                    </button>
                </form>
            </div>
        </div>
    );
}
