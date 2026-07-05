import React, { useState, useCallback, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
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
// Fast, offline, bilingual (English + Bangla) intent table. This is the PRIMARY
// router — it runs instantly with no network call. Ordered most-specific first.
// `keywords` are matched as case-insensitive substrings of the transcript.
// `word` (optional) is matched on a word boundary (for short tokens like "ar").
// ─────────────────────────────────────────────────────────────────────────────
const INTENTS = [
    { route: '/exchange-history', label: 'My Exchanges', keywords: ['exchange history', 'swap history', 'my swaps', 'my exchanges', 'trade history', 'বিনিময় ইতিহাস', 'আমার বিনিময়'] },
    { route: '/exchange', label: 'Plant Exchange', keywords: ['plant exchange', 'exchange', 'swap plant', 'plant swap', 'trade plant', 'swap', 'বিনিময়', 'অদলবদল', 'গাছ বদল'] },
    { route: '/nearby-sellers', label: 'Nearby Sellers', keywords: ['nearby seller', 'nearby', 'near me', 'nearest', 'local seller', 'nurser', 'close by', 'আশেপাশে', 'কাছাকাছি', 'কাছের', 'নার্সারি', 'কাছের দোকান'] },
    { route: '/cart', label: 'Cart', keywords: ['shopping cart', 'my cart', 'cart', 'basket', 'my bag', 'shopping bag', 'checkout', 'কার্ট', 'ব্যাগ', 'ঝুড়ি', 'চেকআউট'] },
    { route: '/reviews', label: 'Reviews', keywords: ['product review', 'review', 'rating', 'feedback', 'testimonial', 'রিভিউ', 'রেটিং', 'মতামত'] },
    { route: '/ar-decorator', label: 'AR Decorator', keywords: ['ar decorator', 'augmented', 'decorate', 'visualize', 'ar view', 'room design', 'plant visualizer', 'ভার্চুয়াল', 'সাজাও', 'ঘর সাজা'], word: 'ar' },
    { route: '/track-order', label: 'Order Tracking', keywords: ['track order', 'order status', 'my order', 'where is my order', 'track my', 'track', 'ট্র্যাক', 'অর্ডার', 'অর্ডার স্ট্যাটাস'] },
    { route: '/expert-potting', label: 'Expert Potting', keywords: ['expert potting', 'repot', 're-pot', 'pot my plant', 'potting service', 'potting', 'পটিং', 'রিপট', 'টব বদল'] },
    { route: '/devices', label: 'Devices', keywords: ['smart pot', 'iot', 'my device', 'device', 'sensor', 'monitor', 'ডিভাইস', 'যন্ত্র', 'সেন্সর', 'স্মার্ট পট'] },
    { route: '/community', label: 'Community', keywords: ['community', 'forum', 'feed', 'social', 'post', 'কমিউনিটি', 'ফোরাম', 'পোস্ট'] },
    { route: '/register-botanist', label: 'Botanist Registration', keywords: ['become a botanist', 'register botanist', 'join botanist', 'botanist registration', 'apply botanist', 'বোটানিস্ট হতে', 'বিশেষজ্ঞ হতে', 'বোটানিস্ট রেজিস্ট্রেশন'] },
    { route: '/plant-doctor', label: 'Plant Doctor', keywords: ['plant doctor', 'doctor', 'book appointment', 'botanist visit', 'sick plant', 'গাছের ডাক্তার', 'ডাক্তার', 'অ্যাপয়েন্টমেন্ট'] },
    { route: '/detect-plant', label: 'Disease Detection', keywords: ['detect', 'disease', 'diagnos', 'scan plant', 'identify problem', 'sick leaf', 'রোগ', 'স্ক্যান', 'রোগ নির্ণয়'] },
    { route: '/smart-finder', label: 'Smart Plant Finder', keywords: ['smart finder', 'find plant', 'suggest plant', 'recommend plant', 'which plant', 'plant finder', 'গাছ খুঁজে', 'সাজেস্ট', 'কোন গাছ'] },
    { route: '/plant-care?tab=subscription', label: 'Subscription Plans', keywords: ['subscription', 'subscribe', 'care plan', 'monthly plan', 'সাবস্ক্রিপশন', 'প্ল্যান'] },
    { route: '/plant-care', label: 'Plant Care', keywords: ['plant care', 'care guide', 'how to care', 'caring for', 'watering guide', 'care instruction', 'পরিচর্যা', 'যত্ন', 'কেয়ার গাইড', 'গাছের যত্ন'] },
    { route: '/notifications', label: 'Notifications', keywords: ['notification', 'alert', 'my notice', 'নোটিফিকেশন', 'বিজ্ঞপ্তি'] },
    { route: '/dashboard', label: 'Dashboard', keywords: ['dashboard', 'my garden', 'overview', 'ড্যাশবোর্ড', 'আমার বাগান'] },
    { route: '/profile', label: 'Profile', keywords: ['my profile', 'profile', 'my account', 'account setting', 'settings', 'প্রোফাইল', 'অ্যাকাউন্ট', 'সেটিংস'] },
    { route: '/help-center', label: 'Help Center', keywords: ['help center', 'help', 'support', 'faq', 'সাহায্য', 'হেল্প', 'সহায়তা'] },
    { route: '/marketplace', label: 'Marketplace', keywords: ['marketplace', 'market place', 'plants market', 'plant market', 'the market', 'market', 'shop', 'store', 'buy plant', 'buy a plant', 'browse plant', 'purchase', 'মার্কেটপ্লেস', 'মার্কেট', 'বাজার', 'দোকান', 'কিনতে', 'গাছ কিনব', 'কেনাকাটা'] },
    { action: 'water', keywords: ['water my', 'water the plant', 'record watering', 'পানি দাও', 'পানি দিলাম'] },
    { action: 'fertilize', keywords: ['fertiliz', 'feed my plant', 'সার দাও', 'সার দিলাম'] },
    { route: '/login', label: 'Login', keywords: ['log in', 'login', 'sign in', 'লগইন', 'লগ ইন'] },
    { route: '/register', label: 'Register', keywords: ['register', 'sign up', 'create account', 'রেজিস্টার', 'সাইন আপ'] },
    { route: '/', label: 'Home', keywords: ['home page', 'go home', 'main page', 'landing page', 'front page', 'take me home', 'হোম', 'হোমপেজ', 'প্রথম পাতা'] },
];

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
        const bn = language === 'bn';
        const msg = confirmMsg || (bn ? `${label} খুলছি` : `Opening ${label}`);
        speak(msg, bn ? 'bn-BD' : 'en-US');
        setFeedback(`✅ ${msg}`);
        setIsListening(false);
        setTimeout(() => {
            window.location.href = window.location.origin + path;
        }, 600);
    }, [speak, language]);

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

    // ── Fast bilingual intent router (PRIMARY path — instant, no network) ──
    const routeCommand = useCallback((rawText) => {
        const t = (rawText || '').toLowerCase().trim();
        if (!t) return false;
        for (const it of INTENTS) {
            const hit = it.keywords.some((k) => t.includes(k))
                || (it.word && new RegExp(`\\b${it.word}\\b`).test(t));
            if (!hit) continue;
            if (it.action === 'water') waterUrgentPlant();
            else if (it.action === 'fertilize') fertilizeUrgentPlant();
            else navigateTo(it.route, it.label);
            return true;
        }
        return false;
    }, [navigateTo, waterUrgentPlant, fertilizeUrgentPlant]);

    // ── "Didn't understand" feedback (bilingual) ──
    const sayNotRecognized = useCallback((rawText) => {
        const bn = language === 'bn';
        const heard = rawText ? (bn ? `শুনলাম: "${rawText}". ` : `Heard: "${rawText}". `) : '';
        const msg = bn
            ? `${heard}দুঃখিত, বুঝতে পারিনি। বলুন "মার্কেটপ্লেস খোলো" বা "কার্ট দেখাও"।`
            : `${heard}Sorry, I didn't catch that. Try "open marketplace" or "show my cart".`;
        speak(msg, bn ? 'bn-BD' : 'en-US');
        setFeedback(`❓ ${msg}`);
    }, [language, speak]);

    // ── Command processor: fast local router first, Gemini only if configured ──
    const processVoiceCommand = useCallback(async (rawText) => {
        setIsProcessing(true);
        setFeedback(`🎙️ "${rawText}"`);

        // 1) Instant offline bilingual routing — handles the vast majority of commands.
        if (routeCommand(rawText)) {
            setIsProcessing(false);
            return;
        }

        // 2) Optional AI fallback — only if a Gemini API key is actually configured.
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            sayNotRecognized(rawText);
            setIsProcessing(false);
            return;
        }

        setFeedback(`🎙️ "${rawText}" — thinking...`);
        try {
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
            console.warn('Gemini routing failed:', err.message);
            sayNotRecognized(rawText);
        } finally {
            setIsProcessing(false);
        }
    }, [speak, navigateTo, waterUrgentPlant, fertilizeUrgentPlant, routeCommand, sayNotRecognized]);

    // ── Start Speech Recognition ────────────────────
    // Chrome's Web Speech API sends audio to Google's servers. The Bangla
    // locale (bn-BD) intermittently returns a "network" error on many systems
    // even with a working connection, while en-US is reliable. So in Bangla
    // mode we try a fallback chain of locales; the bilingual intent router
    // handles English/mixed speech, so the demo keeps working either way.
    const startListening = () => {
        if (isProcessing) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast('Voice assistant is not supported in this browser. Please use Chrome.');
            return;
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
        }

        const langChain = language === 'bn' ? ['bn-BD', 'bn-IN', 'en-US'] : ['en-US'];
        runRecognition(SpeechRecognition, langChain, 0);
    };

    const runRecognition = (SpeechRecognition, langChain, index) => {
        const recognition = new SpeechRecognition();
        recognition.lang = langChain[index];
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
            console.error('Speech error:', event.error, '(lang', langChain[index] + ')');
            // These errors are locale-related — silently try the next fallback locale.
            const canFallback = ['network', 'language-not-supported', 'service-not-allowed']
                .includes(event.error) && index < langChain.length - 1;
            if (canFallback) {
                recognitionRef.current = null;
                setFeedback(language === 'bn' ? '🎙️ শুনছি...' : '🎙️ Listening...');
                try { runRecognition(SpeechRecognition, langChain, index + 1); } catch (e) {}
                return;
            }
            setIsListening(false);
            if (event.error === 'no-speech') {
                setFeedback(language === 'bn' ? 'কিছু শুনতে পাইনি। আবার চেষ্টা করুন।' : "I didn't hear anything. Tap to try again.");
            } else if (event.error === 'network') {
                setFeedback(language === 'bn' ? 'ইন্টারনেট সংযোগ পরীক্ষা করুন।' : 'Network error. Check your internet connection.');
            } else if (event.error === 'not-allowed') {
                setFeedback(language === 'bn' ? 'মাইক্রোফোন অনুমতি দিন।' : 'Please allow microphone access.');
            } else {
                setFeedback(`Error: ${event.error}. Please try again.`);
            }
        };

        recognition.onend = () => {
            // Only reset if this is still the active recognition — during a
            // locale fallback a newer one may already be starting.
            if (recognitionRef.current === recognition) {
                setIsListening(false);
                recognitionRef.current = null;
            }
        };

        try {
            recognition.start();
        } catch (e) {
            setFeedback(language === 'bn' ? 'মাইক্রোফোন চালু করা যায়নি।' : 'Could not start microphone. Please try again.');
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
