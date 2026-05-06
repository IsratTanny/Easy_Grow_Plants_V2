import React, { useState } from 'react';
import { Mic } from 'lucide-react';

const VoiceInput = ({ onResult, placeholder = "Speak..." }) => {
    const [isListening, setIsListening] = useState(false);

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'bn-BD'; // Support Bangla by default for this app
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            const raw = event.results[0][0].transcript;
            const t = raw.toLowerCase();

            // AGGRESSIVE REDIRECT: Matches 'গাছ', 'কিন', or 'market'
            const isMarket = t.includes('\u0997\u09be\u099b') || t.includes('\u0995\u09bf\u09a8') || t.includes('market') || t.includes('kin');
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

            onResult(raw);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    return (
        <button
            type="button"
            onClick={startListening}
            className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-nature-50 text-gray-400'}`}
            title="Voice Input"
        >
            <Mic size={18} />
        </button>
    );
};

export default VoiceInput;
