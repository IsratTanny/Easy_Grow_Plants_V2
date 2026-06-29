import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const getStoredLanguage = () => {
        try {
            const local = window.localStorage.getItem('preferred_language');
            if (local === 'en' || local === 'bn') return local;
            
            const cookieMatch = document.cookie.match(/preferred_language=(en|bn)/);
            if (cookieMatch) return cookieMatch[1];
        } catch (e) {
            console.error("Language retrieval error:", e);
        }
        return 'en';
    };

    const [language, setLanguage] = useState(getStoredLanguage());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const t = (key) => {
        return translations[language][key] || key;
    };

    const changeLanguage = (lang) => {
        window.localStorage.setItem('preferred_language', lang);
        document.cookie = "preferred_language=" + lang + "; path=/";
        // Updating state re-renders every consumer of the context, so there is
        // no need for a full page reload (which would wipe in-memory state).
        setLanguage(lang);
        setIsModalOpen(false);
    };

    return (
        <LanguageContext.Provider value={{ language, t, changeLanguage, isModalOpen, setIsModalOpen }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
