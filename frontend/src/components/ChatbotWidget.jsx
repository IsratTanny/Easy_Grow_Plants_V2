import React, { useState, useRef, useEffect } from 'react';
import { Leaf, MessageSquare, X, Camera, Send, Mic } from 'lucide-react';
import { isAuthenticated, api } from '../api/axios'; // Import auth to check if user is logged in
import { useNavigate } from 'react-router-dom';

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [userRole, setUserRole] = useState('GUEST');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [pendingImage, setPendingImage] = useState(null);

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice search is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            if (event.results && event.results[0] && event.results[0][0]) {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                
                // Automatically trigger search after state applies
                setTimeout(() => {
                    const sendBtn = document.getElementById('chatbot-send-btn');
                    if (sendBtn && !sendBtn.disabled) sendBtn.click();
                }, 100);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const systemPrompt = `IDENTITY: You are the "Easy Grow Expert," a professional botanist and plant scientist available 24/7.
RESEARCH-FIRST PROTOCOL: For every user query or image, you MUST use your search tool to research the most up-to-date botanical data. Determine precise distinctions between similar plants before answering.
THE "ANTI-STATIC" RULE: Every plant species must trigger highly specific, unique context. Stop using a fixed template structure. Answer naturally like a real human expert listening to the specific problem.
THE "ONE BEST WAY" PROTOCOL: You are STRICTLY FORBIDDEN from providing multiple options or "it could be X or Y" answers. 
FINAL OUTPUT FORMAT: Do NOT provide a list. Combine the most critical care factors (Watering, Soil, Light, Humidity) into ONE single, definitive expert paragraph. This paragraph MUST be the "best and only" solution the user needs to follow.
NO CODE BLOCKS: You must never output code, JSON, or technical jargon.
NON-PLANT QUERIES: If asked about unrelated news, politics, etc., use research only to confirm it is off-topic, then decline EXACTLY with: "I am specialized only in plant care. How can I help your green friends?"
ROLE AWARENESS: User Role: ${userRole}.`;

    useEffect(() => {
        const checkAuth = async () => {
            const authStatus = isAuthenticated();
            setIsLoggedIn(authStatus);
            if (authStatus) {
                const storedRole = localStorage.getItem('user_role');
                setUserRole(storedRole ? storedRole.toUpperCase() : 'USER');
                setUserId(localStorage.getItem('user_email') || 'unknown_user');
            } else {
                setUserRole('GUEST');
                const guestId = localStorage.getItem('guest_chat_id') || `guest_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('guest_chat_id', guestId);
                setUserId(guestId);
            }
        };
        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [isOpen]);

    useEffect(() => {
        if (userId) {
            setMessages([]); // Force state clear on switch
            const storedHistory = localStorage.getItem(`chat_history_${userId}`);
            if (storedHistory) {
                setMessages(JSON.parse(storedHistory));
            } else if (isOpen) {
                setMessages([{ sender: 'bot', text: "Hello! I am your Easy Grow Expert. Show me a photo of your plant for an instant diagnosis, or ask a plant care question." }]);
            }
        }
    }, [userId, isOpen]);

    useEffect(() => {
        if (userId && messages.length > 0) {
            localStorage.setItem(`chat_history_${userId}`, JSON.stringify(messages));
        }
    }, [messages, userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, isOpen]);

    const fetchWithRetry = async (url, payload, retries = 3, delay = 1000) => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.error?.message || response.statusText;
                
                if (response.status === 400 && payload.tools) {
                    console.warn("Google Search grounding unsupported or invalid. Retrying without tools...");
                    const fallbackPayload = { ...payload };
                    delete fallbackPayload.tools;
                    return fetchWithRetry(url, fallbackPayload, 0, delay);
                }

                throw new Error(`Gemini API error [${response.status}]: ${errMsg}`);
            }
            return await response.json();
        } catch (error) {
            if (retries > 0 && !error.message.includes('[400]')) {
                await new Promise(res => setTimeout(res, delay));
                return fetchWithRetry(url, payload, retries - 1, delay * 2);
            }
            throw error;
        }
    };

    const callGeminiAPI = async (textPrompt, base64Image = null) => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY in .env file.");

        let modelName = 'models/gemini-1.5-flash-latest';
        try {
            const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            if (modelsRes.ok) {
                const modelsData = await modelsRes.json();
                const availableModels = modelsData.models || [];
                const flashModel = availableModels.find(m => m.name.includes('flash') && m.supportedGenerationMethods?.includes('generateContent'));
                const proModel = availableModels.find(m => m.name.includes('gemini-1.5-pro') && m.supportedGenerationMethods?.includes('generateContent'));
                if (flashModel) modelName = flashModel.name;
                else if (proModel) modelName = proModel.name;
            }
        } catch (e) {
            console.warn("Model auto-detection failed, falling back to default:", modelName);
        }

        const cleanModelName = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
        const url = `https://generativelanguage.googleapis.com/v1beta/${cleanModelName}:generateContent?key=${apiKey}`;
        
        const systemPromptLive = `IDENTITY: You are the "Easy Grow Expert," a professional botanist available 24/7.
RULE 1 (Visual & Text Processing): Analyze the uploaded image (if any) and user text together. Identify plants accurately (do not call a Cactus a Philodendron).
RULE 2 (Context Filtering):
- If user asks for "Name" or identity: Reply with ONLY the name (e.g., "This is an Njoy Pothos").
- If user asks for "Media" or "Procedure": Provide the specific soil mix and potting procedure for that plant. NEVER say "I don't know".
- If user asks for "Care": Provide ONE expert paragraph on water, light, and humidity.
- If user asks for "Disease": Give ONE single best solution for the disease.
RULE 3 (Constraints): Provide one single, definitive answer. Do not give lists or multiple options. Do not use code blocks or JSON.
RULE 4 (Dynamic Generation): Generate a fresh response every time based on your botanical training database. Do not use static templates.`;

        const contents = [{
            role: "user",
            parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPromptLive}\n\nUSER PROMPT: ${textPrompt}` }]
        }];

        if (base64Image) {
            const mimeType = base64Image.split(';')[0].split(':')[1];
            const data = base64Image.split(',')[1];
            contents[0].parts.unshift({
                inlineData: { data, mimeType }
            });
        }

        const payload = {
            contents,
            tools: [{ googleSearch: {} }]
        };

        const data = await fetchWithRetry(url, payload);
        return data.candidates[0].content.parts[0].text;
    };

    const handleSend = async () => {
        if (!inputValue.trim() && !pendingImage) return;
        
        const textToProcess = inputValue.trim() || 'Please analyze this image.';
        const imageToProcess = pendingImage;
        
        setMessages(prev => [...prev, { sender: 'user', text: inputValue.trim(), image: imageToProcess }]);
        setInputValue('');
        setPendingImage(null);
        setIsTyping(true);

        try {
            let botResponse = await callGeminiAPI(textToProcess, imageToProcess);
            if (!isLoggedIn) botResponse += "\n\n*(Tip: Log in to save this advice to your profile.)*";
            setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { sender: 'bot', text: `System error: ${error.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setPendingImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 9999 }}>
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    style={{
                        backgroundColor: '#1B4332',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Leaf color="white" size={32} />
                    <div style={{ 
                        position: 'absolute', 
                        bottom: '10px', 
                        right: '10px', 
                        backgroundColor: '#F97316', 
                        borderRadius: '50%', 
                        padding: '4px',
                        display: 'flex',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        <MessageSquare color="white" size={12} />
                    </div>
                </button>
            )}

            {isOpen && (
                <div style={{
                    width: '380px',
                    height: '520px',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    {/* Header */}
                    <div style={{
                        backgroundColor: '#1B4332',
                        color: 'white',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Plant Care Assistant</span>
                                {userRole === 'ADMIN' && (
                                    <span style={{ backgroundColor: '#2563EB', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>ADMIN</span>
                                )}
                                {userRole === 'SELLER' && (
                                    <span style={{ backgroundColor: '#EA580C', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>SELLER</span>
                                )}
                            </div>
                            <span style={{ fontSize: '12px', color: '#86EFAC' }}>Easy Grow Expert</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} aria-label="Close Chatbot" style={{ background: '#EF4444', border: 'none', cursor: 'pointer', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#DC2626'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#EF4444'}>
                            <X size={18} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        padding: '20px',
                        overflowY: 'auto',
                        backgroundColor: '#F8FAFC',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        {messages.map((msg, index) => (
                            <div key={index} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                backgroundColor: msg.sender === 'user' ? '#1B4332' : 'white',
                                color: msg.sender === 'user' ? 'white' : '#1E293B',
                                padding: '12px 16px',
                                borderRadius: '16px',
                                maxWidth: '85%',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                border: msg.sender === 'bot' ? '1px solid #E2E8F0' : 'none',
                                whiteSpace: 'pre-line',
                                wordWrap: 'break-word',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word'
                            }}>
                                {msg.image && (
                                    <img 
                                        src={msg.image} 
                                        alt="Uploaded plant" 
                                        style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: msg.text ? '8px' : '0' }}
                                    />
                                )}
                                {msg.text && <div>{msg.text}</div>}
                            </div>
                        ))}
                        {isTyping && (
                            <div style={{ alignSelf: 'flex-start', padding: '12px', color: '#94A3B8', fontSize: '13px', fontStyle: 'italic' }}>
                                Assistant is analyzing...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{
                        padding: '16px',
                        backgroundColor: 'white',
                        borderTop: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {pendingImage && (
                            <div style={{ position: 'relative', width: 'fit-content' }}>
                                <img src={pendingImage} alt="Pending" style={{ height: '60px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                <button 
                                    onClick={() => setPendingImage(null)}
                                    style={{
                                        position: 'absolute', top: '-6px', right: '-6px',
                                        background: '#EF4444', color: 'white', borderRadius: '50%',
                                        border: 'none', width: '20px', height: '20px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                onChange={handleFileUpload}
                                accept="image/*"
                            />
                            <button 
                                onClick={() => fileInputRef.current.click()}
                                style={{ 
                                    background: '#F1F5F9', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    padding: '10px', 
                                    borderRadius: '50%',
                                    color: '#475569',
                                    display: 'flex',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#E2E8F0'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#F1F5F9'}
                                title="Upload plant photo"
                            >
                                <Camera size={20} />
                            </button>
                            
                            <input 
                                type="text" 
                                placeholder={isListening ? "Listening..." : "Describe your plant's issue..."} 
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isTyping || isListening}
                                style={{
                                    flex: 1,
                                    border: isListening ? '1px solid #EF4444' : '1px solid #CBD5E1',
                                    borderRadius: '24px',
                                    padding: '12px 16px',
                                    outline: 'none',
                                    fontSize: '14px',
                                    backgroundColor: isTyping ? '#F8FAFC' : 'white',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                            
                            <div style={{ position: 'relative' }}>
                                {isListening && (
                                    <span style={{
                                        position: 'absolute',
                                        top: 8, left: 8, right: 8, bottom: 8,
                                        borderRadius: '50%',
                                        backgroundColor: '#FEF2F2',
                                        border: '1px solid #EF4444',
                                        animation: 'pulse 1.5s infinite',
                                        zIndex: 0
                                    }}></span>
                                )}
                                <button 
                                    onClick={startListening}
                                    disabled={isTyping || isListening}
                                    style={{ 
                                        background: 'transparent', 
                                        border: 'none', 
                                        cursor: isTyping ? 'not-allowed' : 'pointer', 
                                        padding: '10px', 
                                        borderRadius: '50%',
                                        color: isListening ? '#EF4444' : '#475569',
                                        display: 'flex',
                                        zIndex: 1,
                                        position: 'relative'
                                    }}
                                    title="Voice Search"
                                >
                                    <Mic size={20} />
                                </button>
                            </div>

                            <button 
                                id="chatbot-send-btn"
                                onClick={handleSend}
                                disabled={isTyping || (!inputValue.trim() && !pendingImage)}
                                style={{ 
                                    backgroundColor: (inputValue.trim() || pendingImage) && !isTyping ? '#1B4332' : '#94A3B8', 
                                    border: 'none', 
                                    cursor: (inputValue.trim() || pendingImage) && !isTyping ? 'pointer' : 'not-allowed', 
                                    padding: '12px', 
                                    borderRadius: '50%', 
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Send size={18} style={{ marginLeft: '2px' }} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
