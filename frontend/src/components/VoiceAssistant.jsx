import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../api/axios';

// ─────────────────────────────────────────────────────────────────────────────
// Fully Complete Intent → Route Mapping for All Features on the Website
// ─────────────────────────────────────────────────────────────────────────────
const INTENT_ROUTES = {
    // 1. Core Landing & Authentication
    go_home:                 '/',
    open_home:               '/',
    open_login:              '/login',
    open_register:           '/register',

    // 2. Marketplace & Cart
    open_marketplace:        '/marketplace',
    marketplace_buy:         '/marketplace',
    open_cart:               '/cart',
    show_cart:               '/cart',
    checkout:                '/cart',
    track_order:             '/track-order',
    order_status:            '/track-order',

    // 3. User, Seller & Admin Dashboards
    open_dashboard:          '/dashboard',
    open_seller_dashboard:   '/seller-dashboard',
    open_admin_dashboard:    '/admin-dashboard',
    open_profile:            '/profile',
    open_settings:           '/profile',

    // 4. Plant Care & Diagnostics
    open_plant_care:         '/plant-care',
    care_guides:             '/plant-care',
    open_disease_detection:  '/detect-plant',
    scan_plant:              '/detect-plant',
    disease_detection:       '/detect-plant',
    open_smart_finder:       '/smart-finder',
    find_plant:              '/smart-finder',

    // 5. IoT Smart Pots & Devices
    open_devices:            '/devices',
    device_manager:          '/devices',
    iot_pots:                '/devices',

    // 6. Community, Social & Exchange
    open_community:          '/community',
    community_forum:         '/community',
    open_exchange:           '/exchange',
    exchange_dashboard:      '/exchange',
    exchange_history:        '/exchange-history',
    my_swaps:                '/exchange-history',

    // 7. Local Directories & AR Tools
    open_ar_decorator:       '/ar-decorator',
    ar_decorator:            '/ar-decorator',
    ar_design:               '/ar-decorator',
    nearby_sellers:          '/nearby-sellers',
    local_nurseries:         '/nearby-sellers',

    // 8. Pathology & Services
    open_plant_doctor:       '/plant-doctor',
    book_appointment:        '/plant-doctor',
    open_expert_potting:     '/expert-potting',
    open_potting:            '/expert-potting',
    register_botanist:       '/register-botanist',
    join_botanists:          '/register-botanist',

    // 9. Support, Reviews & Alerts
    open_reviews:            '/reviews',
    open_help:               '/help-center',
    open_notifications:      '/notifications',
    show_alerts:             '/notifications',
    open_subscription:       '/plant-care?tab=subscription',
    open_plans:              '/plant-care?tab=subscription',

    // 10. Live Actions
    water_plant:             '__ACTION_WATER__',
    record_watering:         '__ACTION_WATER__',
    fertilize_plant:         '__ACTION_FERTILIZE__',
    record_fertilizing:      '__ACTION_FERTILIZE__',
};

// ─────────────────────────────────────────────────────────────────────────────
// Master System Prompt covering every single page and action in full detail
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the AI routing and intent-detection engine for a voice assistant on the "Easy Grow Plants" website.

Your job is to:
1. Understand the user's spoken command naturally.
2. Detect the user's intent accurately.
3. Map the intent to the correct app feature/screen/action.
4. NEVER show generic errors like "something error occurs".
5. If the command is unclear, ask a helpful follow-up question instead.
6. Always return a valid action or fallback response.

Here is the COMPLETE list of features and pages on this website:
- Home Page (Intent: go_home, open_home) -> "/"
- Login Page (Intent: open_login) -> "/login"
- Register Page (Intent: open_register) -> "/register"
- Marketplace (Intent: open_marketplace, marketplace_buy) -> "/marketplace"
- Shopping Cart (Intent: open_cart, show_cart, checkout) -> "/cart"
- Order Tracking (Intent: track_order, order_status) -> "/track-order"
- User Dashboard (Intent: open_dashboard) -> "/dashboard"
- Seller Dashboard (Intent: open_seller_dashboard) -> "/seller-dashboard"
- Admin Dashboard (Intent: open_admin_dashboard) -> "/admin-dashboard"
- User Profile & Settings (Intent: open_profile, open_settings) -> "/profile"
- Plant Care Guides (Intent: open_plant_care, care_guides) -> "/plant-care"
- Plant Disease Detection & Scan (Intent: open_disease_detection, scan_plant, disease_detection) -> "/detect-plant"
- Smart Plant Finder (Intent: open_smart_finder, find_plant) -> "/smart-finder"
- Smart IoT Pots & Device Manager (Intent: open_devices, device_manager, iot_pots) -> "/devices"
- Community Blog & Forum (Intent: open_community, community_forum) -> "/community"
- Plant Exchange Dashboard (Intent: open_exchange, exchange_dashboard) -> "/exchange"
- Exchange History & Swaps (Intent: exchange_history, my_swaps) -> "/exchange-history"
- AR Decorator Design Tool (Intent: open_ar_decorator, ar_decorator, ar_design) -> "/ar-decorator"
- Nearby Sellers Directory (Intent: nearby_sellers, local_nurseries) -> "/nearby-sellers"
- Plant Doctor Appointment (Intent: open_plant_doctor, book_appointment) -> "/plant-doctor"
- Expert Potting Service (Intent: open_expert_potting, open_potting) -> "/expert-potting"
- Join as Botanist Registration (Intent: register_botanist, join_botanists) -> "/register-botanist"
- Subscription Plans (Intent: open_subscription, open_plans) -> "/plant-care?tab=subscription"
- Product Reviews (Intent: open_reviews) -> "/reviews"
- Help & Support Center (Intent: open_help) -> "/help-center"
- Alerts & Notifications (Intent: open_notifications, show_alerts) -> "/notifications"
- Water Plant Action (Intent: water_plant, record_watering) -> Trigger Live Watering Task Completed
- Fertilize Plant Action (Intent: fertilize_plant, record_fertilizing) -> Trigger Live Fertilizing Task Completed

Respond ONLY with a valid JSON object. No extra text. No markdown.

If the command maps to a known feature:
{"status": "success", "intent": "intent_name", "action": "Short description of where to go", "message": "Friendly confirmation message"}

If the command is unclear but close to something:
{"status": "clarify", "intent": "best_guess_intent", "action": "Short description", "message": "I think you want X. Say yes to confirm or tell me more."}

If the command is completely unrelated to plant features:
{"status": "fallback", "intent": "unknown", "action": "none", "message": "I can only help you with plant care features. Try saying 'open augmented reality' or 'check my shopping cart'."}

Handle natural speech variations, spelling errors, mixed language (English/Bangla), and incomplete goals intelligently.`;

const VoiceAssistant = () => {
    const { language } = useLanguage();
    const [isListening, setIsListening]     = useState(false);
    const [isProcessing, setIsProcessing]   = useState(false);
    const [feedback, setFeedback]           = useState('');
    const recognitionRef                    = useRef(null);

    // Clean up speech recognition on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }
        };
    }, []);

    // ── Text-to-Speech ──────────────────────────────
    const speak = useCallback((text, lang) => {
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang || (language === 'bn' ? 'bn-BD' : 'en-US');
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
        } catch (e) { console.warn('TTS failed:', e); }
    }, [language]);

    // ── Navigate with hard redirect (avoids stale closures) ──
    const navigateTo = useCallback((path, label, confirmMsg) => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
        }
        const msg = confirmMsg || `Moving to ${label}`;
        speak(msg, 'en-US');
        setFeedback(`✅ ${msg}`);
        setIsListening(false);
        setTimeout(() => {
            window.location.href = window.location.origin + path;
        }, 600);
    }, [speak]);

    // ── Water Plant Action ──────────────────────────
    const waterUrgentPlant = useCallback(async (confirmMsg) => {
        setIsProcessing(true);
        setFeedback('💧 Recording watering...');
        try {
            const res = await api.get('/plant-care/care-cards/');
            const cards = res.data;
            if (cards.length > 0) {
                await api.post(`/plant-care/care-cards/${cards[0].id}/task_completed/`, { task_type: 'watering' });
                const msg = confirmMsg || 'Watering recorded for your plant!';
                speak(msg, 'en-US');
                setFeedback(`✅ ${msg}`);
            } else {
                const msg = 'No active care cards found.';
                speak(msg, 'en-US');
                setFeedback(msg);
            }
        } catch (err) {
            speak('Could not record watering. Please try again.', 'en-US');
            setFeedback('❌ Watering record failed.');
        } finally {
            setIsProcessing(false);
            setIsListening(false);
        }
    }, [speak]);

    // ── Fertilize Plant Action ──────────────────────
    const fertilizeUrgentPlant = useCallback(async (confirmMsg) => {
        setIsProcessing(true);
        setFeedback('🌱 Recording fertilizing...');
        try {
            const res = await api.get('/plant-care/care-cards/');
            const cards = res.data;
            if (cards.length > 0) {
                await api.post(`/plant-care/care-cards/${cards[0].id}/task_completed/`, { task_type: 'fertilizing' });
                const msg = confirmMsg || 'Fertilizing recorded for your plant!';
                speak(msg, 'en-US');
                setFeedback(`✅ ${msg}`);
            } else {
                const msg = 'No active care cards found.';
                speak(msg, 'en-US');
                setFeedback(msg);
            }
        } catch (err) {
            speak('Could not record fertilizing. Please try again.', 'en-US');
            setFeedback('❌ Fertilizing record failed.');
        } finally {
            setIsProcessing(false);
            setIsListening(false);
        }
    }, [speak]);

    // ── Local keyword fallback if Gemini is completely unavailable ──
    const localFallbackRouter = useCallback((rawText) => {
        const t = rawText.toLowerCase();

        // 1. Shopping Cart (Must be checked BEFORE AR due to substring 'ar' inside 'cart')
        if (t.includes('cart') || t.includes('checkout') || t.includes('ব্যাগ') || t.includes('কার্ট')) {
            navigateTo('/cart', 'Cart');
        }
        // 2. Nearby Sellers (Must be checked BEFORE AR due to substring 'ar' inside 'nearby')
        else if (t.includes('nearby') || t.includes('seller') || t.includes('local') || t.includes('আশেপাশে')) {
            navigateTo('/nearby-sellers', 'Nearby Sellers');
        }
        // 3. Product Reviews (Must be checked BEFORE AR)
        else if (t.includes('review') || t.includes('rating') || t.includes('feedback') || t.includes('রিভিউ') || t.includes('রেটিং') || t.includes('মতামত')) {
            navigateTo('/reviews', 'Reviews');
        }
        // 4. AR Decorator (Use word boundaries for 'ar' so it doesn't match 'cart', 'nearby', 'marketplace')
        else if (/\bar\b/.test(t) || t.includes('decorat') || t.includes('design') || t.includes('augmented') || t.includes('ভার্চুয়াল')) {
            navigateTo('/ar-decorator', 'AR Decorator');
        }
        // 5. Order Tracking
        else if (t.includes('track') || t.includes('order') || t.includes('ট্যাক')) {
            navigateTo('/track-order', 'Order Tracking');
        }
        // 6. Device Manager
        else if (t.includes('device') || t.includes('iot') || t.includes('pot') || t.includes('টব') || t.includes('যন্ত্র')) {
            navigateTo('/devices', 'Device Manager');
        }
        // 7. Community Forum
        else if (t.includes('commun') || t.includes('forum') || t.includes('blog') || t.includes('ব্লগ')) {
            navigateTo('/community', 'Community');
        }
        // 8. Exchange / Swap
        else if (t.includes('exchan') || t.includes('swap') || t.includes('বিনিময়')) {
            navigateTo('/exchange', 'Exchange');
        }
        else if (t.includes('swap history') || t.includes('my swap') || t.includes('exchange history')) {
            navigateTo('/exchange-history', 'Exchange History');
        }
        // 9. Botanist Registration
        else if (t.includes('join botanist') || t.includes('register botanist') || t.includes('বিজ্ঞানী')) {
            navigateTo('/register-botanist', 'Botanist Registration');
        }
        // 10. Standard features
        else if (t.includes('market') || t.includes('buy') || t.includes('shop') || t.includes('কিন')) {
            navigateTo('/marketplace', 'Marketplace');
        } else if (t.includes('water') || t.includes('পানি')) {
            waterUrgentPlant();
        } else if (t.includes('fertil') || t.includes('সার')) {
            fertilizeUrgentPlant();
        } else if (t.includes('detect') || t.includes('disease') || t.includes('scan') || t.includes('রোগ')) {
            navigateTo('/detect-plant', 'Disease Detection');
        } else if (t.includes('doctor') || t.includes('botanist') || t.includes('ডাক্তার')) {
            navigateTo('/plant-doctor', 'Plant Doctor');
        } else if (t.includes('help') || t.includes('faq')) {
            navigateTo('/help-center', 'Help Center');
        } else if (t.includes('profile') || t.includes('care') || t.includes('dashboard')) {
            navigateTo('/profile', 'Profile');
        } else if (t.includes('home') || t.includes('back')) {
            navigateTo('/', 'Home');
        } else {
            const msg = "I didn't recognize that command. Try 'open AR decorator' or 'show my cart'.";
            speak(msg, 'en-US');
            setFeedback(`❓ ${msg}`);
        }
    }, [navigateTo, speak, waterUrgentPlant, fertilizeUrgentPlant]);

    // ── Gemini AI Intent Router ─────────────────────
    const processVoiceCommand = useCallback(async (rawText) => {
        setIsProcessing(true);
        setFeedback(`🎙️ "${rawText}" — thinking...`);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const modelName = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash-lite';
            const cleanModel = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
            const url = `https://generativelanguage.googleapis.com/v1beta/${cleanModel}:generateContent?key=${apiKey}`;

            const payload = {
                contents: [{
                    parts: [{
                        text: `${SYSTEM_PROMPT}\n\nUser command: "${rawText}"`
                    }]
                }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    maxOutputTokens: 120,   // Strict limit to save tokens
                    temperature: 0.1,       // More deterministic routing
                }
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(10000)
            });

            if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('Empty Gemini response');

            const result = JSON.parse(text.trim());
            const { status, intent, message } = result;

            if (status === 'fallback' || status === 'clarify' || intent === 'unknown') {
                const msg = message || "Sorry, I'm not sure what you mean. Try saying 'open ar decorator' or 'show my devices'.";
                speak(msg, 'en-US');
                setFeedback(`🤖 ${msg}`);
                setIsProcessing(false);
                return;
            }

            // Resolve intent to route or action
            const route = INTENT_ROUTES[intent];

            if (!route) {
                const msg = message || "I understood but couldn't locate that page. Try another command.";
                speak(msg, 'en-US');
                setFeedback(`🤖 ${msg}`);
                setIsProcessing(false);
                return;
            }

            if (route === '__ACTION_WATER__') {
                await waterUrgentPlant(message);
            } else if (route === '__ACTION_FERTILIZE__') {
                await fertilizeUrgentPlant(message);
            } else {
                const label = result.action || intent;
                navigateTo(route, label, message);
            }

        } catch (err) {
            console.warn('Gemini routing failed, using local fallback:', err.message);
            localFallbackRouter(rawText);
        } finally {
            setIsProcessing(false);
        }
    }, [speak, navigateTo, waterUrgentPlant, fertilizeUrgentPlant, localFallbackRouter]);

    // ── Start Speech Recognition ────────────────────
    const startListening = () => {
        if (isProcessing) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice assistant is not supported in this browser. Please use Chrome.');
            return;
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
        }

        const recognition = new SpeechRecognition();
        recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsListening(true);
            setFeedback(language === 'bn' ? '🎙️ শুনছি...' : '🎙️ Listening...');
        };

        recognition.onresult = (event) => {
            const raw = event.results[0][0].transcript;
            setFeedback(`🎙️ "${raw}"`);
            setIsListening(false);
            processVoiceCommand(raw);
        };

        recognition.onerror = (event) => {
            console.error('Speech error:', event.error);
            setIsListening(false);
            if (event.error === 'no-speech') {
                setFeedback("I didn't hear anything. Tap to try again.");
            } else if (event.error === 'network') {
                setFeedback('Network error. Check your internet connection.');
            } else {
                setFeedback(`Error: ${event.error}. Please try again.`);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        try {
            recognition.start();
        } catch (e) {
            setFeedback('Could not start microphone. Please try again.');
            setIsListening(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '100px', right: '25px', zIndex: 9999 }}>
            <div className="flex flex-col items-end gap-3">
                {feedback && (
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-nature-100 text-xs font-bold text-nature-900 animate-slideDown max-w-[220px] text-right leading-relaxed">
                        {feedback}
                    </div>
                )}
                <button
                    onClick={startListening}
                    disabled={isProcessing}
                    title={isListening ? 'Listening...' : 'Tap to speak'}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                        isListening
                            ? 'bg-red-500 animate-pulse'
                            : isProcessing
                                ? 'bg-yellow-500 animate-pulse'
                                : 'bg-nature-900'
                    }`}
                >
                    {isListening ? <MicOff color="white" size={22} /> : <Mic color="white" size={22} />}
                </button>
            </div>
        </div>
    );
};

export default VoiceAssistant;
