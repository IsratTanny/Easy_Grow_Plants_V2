import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, RefreshCw, Leaf, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export default function PlantDetection() {
    const { t } = useLanguage();
    const [stream, setStream] = useState(null);
    const [image, setImage] = useState(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [result, setResult] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Dynamic Image Compression to prevent Payload/404 errors from massive files
    const compressImage = (dataUrl, maxWidth = 800, maxHeight = 800) => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height *= maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width *= maxHeight / height));
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Heavy compression (Quality: 0.7) to shrink the base64 string size dramatically
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = dataUrl;
        });
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            alert(t('cameraDenied'));
            console.error(err);
        }
    };

    const capturePhoto = async () => {
        if (!videoRef.current) return;
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        const ctx = canvasRef.current.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        const rawBase64 = canvasRef.current.toDataURL('image/jpeg');
        const optimizedBase64 = await compressImage(rawBase64);
        setImage(optimizedBase64);
        stopCamera();
        processImage(optimizedBase64);
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        stopCamera();
        const reader = new FileReader();
        reader.onloadend = async () => {
            const rawBase64 = reader.result;
            const optimizedBase64 = await compressImage(rawBase64);
            setImage(optimizedBase64);
            processImage(optimizedBase64);
        };
        reader.readAsDataURL(file);
    };

    const processImage = async (base64Image) => {
        setIsDetecting(true);
        setResult(null);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCxY2dbAGeLhTnq7-srxEUldJOhqfRyWrY";
            // Professional payload endpoint for Google Gemini API
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

            // Clean Base64 Extraction
            const commaIndex = base64Image.indexOf(',');
            const data = commaIndex !== -1 ? base64Image.substring(commaIndex + 1) : base64Image;
            const mimeMatch = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            
            const payload = {
                contents: [{
                    parts: [
                        { text: "You are an expert plant pathologist. Analyze this image. Identify the plant and detect any leaf diseases or pests. Respond ONLY with a JSON object using this exact structure: {\"plant_name\": \"Name of plant\", \"disease\": \"Name of disease or 'None'\", \"status\": \"'Healthy' or 'Diseased'\", \"recommendation\": \"Short advice\"}" },
                        { inlineData: { mimeType: mimeType, data: data } }
                    ]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errData = await response.json();
                console.error("API Error Details:", errData);
                throw new Error("Detection API Failure");
            }

            const resData = await response.json();
            
            if (resData.candidates && resData.candidates.length > 0) {
                const text = resData.candidates[0].content.parts[0].text;
                try {
                    const parsed = JSON.parse(text);
                    setResult(parsed);
                } catch (e) {
                    console.error("JSON parse error:", e);
                    setResult({ error: t('analysisFailed') });
                }
            } else {
                setResult({ error: t('analysisFailed') });
            }
        } catch (error) {
            console.error("Visual Detection Error:", error);
            setResult({ error: t('analysisFailed') });
        } finally {
            setIsDetecting(false);
        }
    };

    const resetDetection = () => {
        setImage(null);
        setResult(null);
    };

    React.useEffect(() => {
        return () => stopCamera();
    }, [stream]);

    return (
        <div id="plant-detection-container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
            <h1 style={{ color: '#1B4332', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{t('detectionTitle')}</h1>
            <p style={{ color: '#475569', marginBottom: '2rem' }}>{t('detectionDesc')}</p>

            {!image && !stream && (
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
                    <button 
                        onClick={startCamera}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#1B4332', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}>
                        <Camera size={20} />
                        {t('takePhoto')}
                    </button>
                    
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'white', color: '#1B4332', border: '2px solid #1B4332', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}>
                        <ImageIcon size={20} />
                        {t('uploadGallery')}
                    </button>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileUpload} />
                </div>
            )}

            {stream && (
                <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: 'block' }}></video>
                    <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                        <button onClick={capturePhoto} style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}></button>
                        <button onClick={stopCamera} style={{ position: 'absolute', right: '20px', bottom: '12px', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#EF4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {image && (
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                        <img src={image} alt="Captured plant" style={{ width: '100%', display: 'block' }} />
                    </div>

                    {isDetecting ? (
                        <div style={{ padding: '24px', backgroundColor: '#F0FDF4', border: '2px solid #1B4332', borderRadius: '12px', marginBottom: '1.5rem', animation: 'pulse 2s infinite' }}>
                            <p style={{ color: '#166534', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{t('scanning')}</p>
                            <Leaf size={32} className="animate-spin" color="#1B4332" style={{ margin: '0 auto 12px' }} />
                            <h3 style={{ color: '#1B4332', fontSize: '1.25rem', margin: 0 }}>{t('scanning')}</h3>
                        </div>
                    ) : (
                        result?.error ? (
                            <div style={{ padding: '24px', backgroundColor: '#FEF2F2', border: '2px solid #DC2626', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                <p style={{ color: '#991B1B', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{t('analysisFailed')}</p>
                                <h2 style={{ color: '#DC2626', fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 16px 0' }}>{result.error}</h2>
                            </div>
                        ) : result?.plant_name ? (
                            <div style={{ padding: '24px', backgroundColor: result.status === 'Healthy' ? '#F0FDF4' : '#FEF2F2', border: `2px solid ${result.status === 'Healthy' ? '#1B4332' : '#DC2626'}`, borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left' }}>
                                <p style={{ color: result.status === 'Healthy' ? '#166534' : '#991B1B', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', textAlign: 'center' }}>{t('analysisComplete')}</p>
                                
                                <div style={{ marginBottom: '12px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#475569' }}>{t('detectPlant')}: </span>
                                    <span style={{ color: '#1B4332', fontWeight: '600', fontSize: '1.1rem' }}>{t(result.plant_name) || result.plant_name}</span>
                                </div>
                                
                                <div style={{ marginBottom: '12px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#475569' }}>{t('status') || 'Status'}: </span>
                                    <span style={{ color: result.status === 'Healthy' ? '#10B981' : '#EF4444', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', backgroundColor: result.status === 'Healthy' ? '#D1FAE5' : '#FEE2E2', fontSize: '0.9rem' }}>{t(result.status) || result.status}</span>
                                </div>

                                {result.disease && result.disease !== 'None' && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#475569' }}>{t('detectedIssue')}: </span>
                                        <span style={{ color: '#DC2626', fontWeight: '600' }}>{t(result.disease) || result.disease}</span>
                                    </div>
                                )}

                                {result.recommendation && (
                                    <div style={{ marginBottom: '20px', backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>{t('recommendation')}:</span>
                                        <span style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.5' }}>{t(result.recommendation) || result.recommendation}</span>
                                    </div>
                                )}

                                <button 
                                    onClick={() => navigate('/community', { state: { shared_plant: result.plant_name, shared_disease: result.disease, shared_image: image } })}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', width: '100%', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600', marginTop: '16px' }}>
                                    <Share2 size={18} />
                                    {t('shareResult') || 'Share Result to Community'}
                                </button>
                            </div>
                        ) : null
                    )}

                    {!isDetecting && (
                        <button 
                            onClick={resetDetection}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', margin: '0 auto', backgroundColor: 'white', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}>
                            <RefreshCw size={18} />
                            {t('scanAnother') || 'Scan Another Plant'}
                        </button>
                    )}
                </div>
            )}
            
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </div>
    );
}
