import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/axios';
import { Leaf, Camera, X, Check, Image as ImageIcon, CreditCard } from 'lucide-react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';

export default function Register() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        phone: '',
        email: '',
        role: 'Plant Buyer',
        full_name: '',
        nid_number: '',
        whatsapp_number: '',
        address: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    // NID & Facial States
    const [nidFront, setNidFront] = useState(null);
    const [nidBack, setNidBack] = useState(null);
    const [nidFrontPreview, setNidFrontPreview] = useState(null);
    const [nidBackPreview, setNidBackPreview] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [verifyingFace, setVerifyingFace] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [capturedBlob, setCapturedBlob] = useState(null);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
            try {
                if (window.faceapi) {
                    await Promise.all([
                        window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                        window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                        window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                    ]);
                    setModelsLoaded(true);
                }
            } catch (err) {
                console.error("Error loading models:", err);
            }
        };
        loadModels();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            });
            setStream(mediaStream);
            setShowCamera(true);
            setTimeout(() => {
                if (videoRef.current) videoRef.current.srcObject = mediaStream;
            }, 100);
        } catch (err) {
            setError("Camera access denied. Please check your browser permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);

            canvas.toBlob((blob) => {
                setCapturedBlob(blob);
                stopCamera();
                performFacialRecall(blob);
            }, 'image/jpeg');
        }
    };

    const handleNidChange = (e, side) => {
        const file = e.target.files[0];
        if (file) {
            if (side === 'front') {
                setNidFront(file);
                setNidFrontPreview(URL.createObjectURL(file));
            } else {
                setNidBack(file);
                setNidBackPreview(URL.createObjectURL(file));
            }
        }
    };

    const performFacialRecall = async (blob) => {
        if (!modelsLoaded) {
            setError('Verification logic is still loading. Please wait a few seconds.');
            return;
        }
        if (!nidFrontPreview) {
            setError('Please upload NID Front Side first.');
            return;
        }

        setVerifying(true);
        setError('');

        try {
            const capImg = await window.faceapi.bufferToImage(blob);
            const nidImg = new Image();
            nidImg.crossOrigin = "anonymous";
            nidImg.src = nidFrontPreview;
            await new Promise(resolve => nidImg.onload = resolve);

            const capDetection = await window.faceapi.detectSingleFace(capImg).withFaceLandmarks().withFaceDescriptor();
            const nidDetection = await window.faceapi.detectSingleFace(nidImg).withFaceLandmarks().withFaceDescriptor();

            if (!capDetection) throw new Error("No face detected in live photo.");
            if (!nidDetection) throw new Error("No face detected on NID Front side.");

            const faceMatcher = new window.faceapi.FaceMatcher(nidDetection);
            const bestMatch = faceMatcher.findBestMatch(capDetection.descriptor);

            if (bestMatch.distance < 0.5) {
                setIsVerified(true);
                setSuccess('Registered Successfully! Identity Verified.');
            } else {
                throw new Error("Verification Failed: Face does not match NID.");
            }
        } catch (err) {
            setError(err.message || 'Verification failed. Try again with clear photos.');
            setIsVerified(false);
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.role === 'seller' && !isVerified) {
            setError('Please complete NID Facial Verification first.');
            return;
        }

        try {
            if (formData.role === 'Plant Buyer') {
                try {
                    let user;
                    try {
                        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                        user = userCredential.user;
                        console.log("Firebase user created:", user.email);
                    } catch (fbCreateErr) {
                        if (fbCreateErr.code === 'auth/email-already-in-use') {
                            console.log("Firebase user already exists, proceeding to Django registration.");
                            // We don't have the user object here easily without signing in, 
                            // but we can proceed to Django and let Login handle verification resend if needed.
                        } else {
                            throw fbCreateErr;
                        }
                    }

                    if (user) {
                        await sendEmailVerification(user);
                        console.log("Verification email sent to:", user.email);
                    }

                    // Save to localStorage for synchronization during login
                    localStorage.setItem('pendingRegistration', JSON.stringify({
                        username: formData.username,
                        email: formData.email,
                        password: formData.password,
                        phone: formData.phone || '',
                        whatsapp_number: formData.whatsapp_number,
                        address: formData.address,
                        role: 'buyer'
                    }));

                    setSuccess('A verification link has been sent to your email. Please verify your email to complete your registration.');
                } catch (firebaseErr) {
                    console.error("Firebase Registration Error:", firebaseErr);
                    setError(firebaseErr.message || 'Firebase Registration failed.');
                    return; 
                }
            }

            // Both Buyers and Sellers will save to Django API
            const payload = new FormData();
            payload.append('username', formData.username);
            payload.append('password', formData.password);
            payload.append('email', formData.email || 'seller@noemail.com');
            payload.append('phone', formData.phone || '');
            payload.append('role', formData.role === 'Plant Buyer' ? 'buyer' : 'seller'); // Kept for safety if bypassing

            if (formData.whatsapp_number) payload.append('whatsapp_number', formData.whatsapp_number);
            if (formData.address) payload.append('address', formData.address);
            if (formData.full_name) payload.append('full_name', formData.full_name);
            if (formData.nid_number) payload.append('nid_number', formData.nid_number);

            if (isVerified) {
                payload.append('is_verified', 'true');
                if (nidFront) payload.append('nid_front', nidFront);
                if (nidBack) payload.append('nid_back', nidBack);
                if (capturedBlob) {
                    const faceFile = new File([capturedBlob], "verified_face.jpg", { type: "image/jpeg" });
                    payload.append('face_captured', faceFile);
                }
            }

            try {
                await api.post('/auth/register/', payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } catch (djangoErr) {
                console.error("Django backend error, but continuing if Firebase worked:", djangoErr);
                // If the user already saw the Firebase success, don't overwrite it with a Django error unless critical
                if (formData.role === 'seller') {
                    throw djangoErr;
                }
            }

            if (formData.role === 'seller') {
                navigate('/login');
            } else {
                // If buyer, wait a moment before navigating or let them read the message
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Registration failed. Check your data.');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-nature-100 mb-20 animate-fadeIn">
            <div className="text-center mb-8">
                <div className="bg-nature-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Leaf className="w-12 h-12 text-nature-600" />
                </div>
                <h2 className="text-3xl font-black text-nature-900 tracking-tight">Join Our Community</h2>
                <div className="mt-2">
                    <p className="inline-block px-4 py-1.5 bg-nature-50/80 rounded-full text-nature-800 font-bold text-[10px] uppercase tracking-widest shadow-sm border border-nature-100">
                        Start your green journey today
                    </p>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-center text-sm font-semibold border border-red-100">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-6 text-center text-sm font-semibold border border-green-100">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500 outline-none transition-all"
                            placeholder="johndoe"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500 outline-none transition-all"
                            placeholder="+8801XXXXXXXXX"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Password</label>
                    <input
                        type="password"
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500 outline-none transition-all"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">I am a...</label>
                    <select
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500 outline-none transition-all appearance-none cursor-pointer"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="Plant Buyer">Plant Buyer</option>
                        <option value="seller">Plant Seller</option>
                    </select>
                </div>

                {formData.role === 'Plant Buyer' && (
                    <div className="animate-slideDown">
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500 outline-none transition-all"
                            placeholder="buyer@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                )}

                {/* Seller Specific Fields */}
                {formData.role === 'seller' && (
                    <div className="space-y-6 pt-6 border-t border-nature-50 animate-slideDown">
                        {/* Seller Personal Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-nature-800 uppercase tracking-widest border-b border-nature-100 pb-2">
                                Seller Personal Details
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 uppercase">Seller Name (As per NID)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500 outline-none transition-all"
                                        placeholder="Enter your full name"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 uppercase">Seller Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500 outline-none transition-all"
                                        placeholder="seller@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 uppercase">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500 outline-none transition-all"
                                            placeholder="Primary Phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 uppercase">WhatsApp Number</label>
                                        <input
                                            type="tel"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500 outline-none transition-all"
                                            placeholder="WhatsApp"
                                            value={formData.whatsapp_number}
                                            onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 uppercase">Full Address</label>
                                    <textarea
                                        rows="2"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500 outline-none transition-all"
                                        placeholder="Your complete address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 uppercase">NID Card Number</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500 outline-none transition-all"
                                        placeholder="10-17 Digit NID"
                                        value={formData.nid_number}
                                        onChange={(e) => setFormData({ ...formData, nid_number: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Identity Verification Section */}
                        <div className="bg-nature-50/50 p-4 rounded-2xl border border-nature-100">
                            <p className="text-xs font-black text-nature-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Identity Verification
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="space-y-2">
                                    <div
                                        onClick={() => document.getElementById('reg-nid-front').click()}
                                        className="aspect-[1.6/1] bg-white border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-nature-400 transition-all overflow-hidden relative group"
                                    >
                                        {nidFrontPreview ? (
                                            <img src={nidFrontPreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-gray-400">NID Front Side</span>
                                        )}
                                    </div>
                                    <input id="reg-nid-front" type="file" hidden accept="image/*" onChange={(e) => handleNidChange(e, 'front')} />
                                </div>
                                <div className="space-y-2">
                                    <div
                                        onClick={() => document.getElementById('reg-nid-back').click()}
                                        className="aspect-[1.6/1] bg-white border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-nature-400 transition-all overflow-hidden relative group"
                                    >
                                        {nidBackPreview ? (
                                            <img src={nidBackPreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-gray-400">NID Back Side</span>
                                        )}
                                    </div>
                                    <input id="reg-nid-back" type="file" hidden accept="image/*" onChange={(e) => handleNidChange(e, 'back')} />
                                </div>
                            </div>

                            {!isVerified && (
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    disabled={verifying}
                                    className="w-full py-3 bg-nature-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-nature-700 transition-all flex items-center justify-center gap-2"
                                >
                                    {verifying ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <><Camera className="w-4 h-4" /> Verify Now</>
                                    )}
                                </button>
                            )}

                            {isVerified && (
                                <div className="w-full py-3 bg-green-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Check className="w-4 h-4" /> Verified
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={formData.role === 'seller' && !isVerified}
                    className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all duration-200 mt-4 ${formData.role === 'seller' && !isVerified
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-nature-600 text-white shadow-nature-200 hover:bg-nature-700 hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                >
                    Create Account
                </button>
            </form>

            <p className="mt-6 text-center text-gray-600">
                Already have an account? <Link to="/login" className="text-nature-600 font-medium hover:underline">Login</Link>
            </p>

            {/* CAMERA INTERFACE */}
            {showCamera && (
                <div className="fixed inset-0 bg-nature-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fadeIn">
                    <div className="bg-white rounded-[2rem] overflow-hidden max-w-sm w-full shadow-2xl relative">
                        <div className="bg-nature-900 p-4 flex justify-between items-center text-white">
                            <h3 className="font-black uppercase tracking-widest text-[10px]">Verify Identity</h3>
                            <button onClick={stopCamera} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="relative aspect-square bg-black flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
                        </div>
                        <div className="p-6 flex items-center justify-center bg-nature-50">
                            <button
                                type="button"
                                onClick={takePhoto}
                                className="h-16 w-16 bg-nature-600 rounded-full border-4 border-white shadow-xl active:scale-90 transition-all"
                            />
                        </div>
                    </div>
                    <canvas ref={canvasRef} hidden />
                </div>
            )}
        </div>
    );
}
