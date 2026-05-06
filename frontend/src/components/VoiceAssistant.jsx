import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, Navigation, AlertCircle, Droplets, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';

const VoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [transcript, setTranscript] = useState('');
    const navigate = useNavigate();
    const recognitionRef = useRef(null);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    const speak = useCallback((text, lang = 'bn-BD') => {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        synth.speak(utterance);
    }, []);

    const Maps = useCallback((path, pageNameEn) => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch(e) {}
        }
        
        const confirmMsg = `Moving to ${pageNameEn}`;
        speak(confirmMsg, 'en-US');
        setFeedback(confirmMsg);
        setIsListening(false);
        
        // Forced immediate redirection logic
        try {
            navigate(path);
            // Backup fallback: Force redirection if React Router fails to sync
            setTimeout(() => {
                if (window.location.pathname !== path) {
                    window.location.href = window.location.origin + path;
                }
            }, 300);
        } catch (err) {
            window.location.href = window.location.origin + path;
        }

        resetTranscript(); 
    }, [navigate, speak, resetTranscript]);

    const waterUrgentPlant = async () => {
        setIsProcessing(true);
        try {
            const res = await api.get('/plant-care/care-cards/');
            const cards = res.data;
            if (cards.length > 0) {
                const urgentCard = cards[0];
                await api.post(`/plant-care/care-cards/${urgentCard.id}/task_completed/`, { task_type: 'watering' });
                const msg = 'আপনার গাছে পানি দেয়া রেকর্ড করা হয়েছে';
                speak(msg);
                setFeedback(msg);
            } else {
                speak('আপনার কোনো সক্রিয় কেয়ার কার্ড নেই');
            }
        } catch (err) {
            console.error(err);
            speak('দুঃখিত, পানি দেওয়ার রেকর্ড করা সম্ভব হয়নি');
        } finally {
            setIsProcessing(false);
            setIsListening(false);
            resetTranscript();
        }
    };

    const fertilizeUrgentPlant = async () => {
        setIsProcessing(true);
        try {
            const res = await api.get('/plant-care/care-cards/');
            const cards = res.data;
            if (cards.length > 0) {
                const urgentCard = cards[0];
                await api.post(`/plant-care/care-cards/${urgentCard.id}/task_completed/`, { task_type: 'fertilizing' });
                const msg = 'আপনার গাছে খাবার দেয়া রেকর্ড করা হয়েছে';
                speak(msg);
                setFeedback(msg);
            } else {
                speak('আপনার কোনো সক্রিয় কেয়ার কার্ড নেই');
            }
        } catch (err) {
            console.error(err);
            speak('দুঃখিত, খাবার দেওয়ার রেকর্ড করা সম্ভব হয়নি');
        } finally {
            setIsProcessing(false);
            setIsListening(false);
            resetTranscript();
        }
    };

    // Direct Watcher for Voice Navigation
    useEffect(() => {
        if (!transcript) return;
        
        const t = transcript.trim().toLowerCase();
        
        // Broad Marketplace Match
        const toMarket = t.indexOf('কিন') !== -1 || t.indexOf('market') !== -1 || t.indexOf('kin') !== -1 || t.indexOf('শপ') !== -1;
        
        // Broad Profile Match
        const toProfile = t.indexOf('যত্ন') !== -1 || t.indexOf('care') !== -1 || t.indexOf('profile') !== -1 || t.indexOf('jotno') !== -1;

        if (toMarket) {
            if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
            setTranscript('');
            setFeedback('Moving to Marketplace...');
            window.location.href = '/marketplace';
        } else if (toProfile) {
            if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
            setTranscript('');
            setFeedback('Moving to Profile...');
            window.location.href = '/profile';
        } else if (t.indexOf('osukh') !== -1 || t.indexOf('detect') !== -1 || t.indexOf('অসুখ') !== -1) {
            if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
            setTranscript('');
            setFeedback('Moving to Detection...');
            window.location.href = '/detect-plant';
        }
    }, [transcript]);

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice assistant is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'bn-BD'; 
        recognition.continuous = false;
        recognition.interimResults = false;
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsListening(true);
            setFeedback('শুনছি...');
        };

        recognition.onresult = (event) => {
            const raw = event.results[0][0].transcript;
            const t = raw.toLowerCase();
            
            // AGGRESSIVE MULTI-KEYWORD MATCH
            const isMarket = t.includes('\u0995\u09bf\u09a8') || t.includes('\u0997\u09be\u099b') || t.includes('market') || t.includes('kin');
            const isProfile = t.includes('\u09af\u09a4\u09cd\u09a8') || t.includes('care') || t.includes('profile');

            if (isMarket) {
                recognition.stop();
                setTimeout(() => { 
                    window.location.href = window.location.origin + '/marketplace';
                }, 50);
                return;
            }
            if (isProfile) {
                recognition.stop();
                setTimeout(() => { 
                    window.location.href = window.location.origin + '/profile';
                }, 50);
                return;
            }

            setFeedback(raw);
            setTranscript(raw);
        };

        recognition.onerror = (event) => {
            console.error(event.error);
            setIsListening(false);
            setFeedback('ত্রুটি হয়েছে, আবার চেষ্টা করুন');
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.start();
    };

    return (
        <div style={{ position: 'fixed', bottom: '100px', right: '25px', zIndex: 9999 }}>
            <div className="flex flex-col items-end gap-3">
                {feedback && (
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-nature-100 text-xs font-bold text-nature-900 animate-slideDown max-w-[200px] text-right">
                        {feedback}
                    </div>
                )}
                <button
                    onClick={startListening}
                    disabled={isProcessing}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-nature-900'}`}
                >
                    {isListening ? <MicOff color="white" /> : <Mic color="white" />}
                </button>
            </div>
        </div>
    );
};

export default VoiceAssistant;
