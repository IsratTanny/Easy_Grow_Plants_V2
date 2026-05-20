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
