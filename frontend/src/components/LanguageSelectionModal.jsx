import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe, Check } from 'lucide-react';

export default function LanguageSelectionModal() {
    const { changeLanguage, t, isModalOpen, setIsModalOpen } = useLanguage();

    useEffect(() => {
        // Check if language has already been chosen in this session or ever
        const hasChosen = localStorage.getItem('preferred_language');
        if (!hasChosen) {
            setIsModalOpen(true);
        }
    }, []);

    const handleSelect = (lang) => {
        changeLanguage(lang);
    };

    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-nature-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-md mx-4 rounded-[2.5rem] shadow-2xl overflow-hidden border border-nature-100 animate-slideUp">
                <div className="p-10 text-center">
                    <div className="w-20 h-20 bg-nature-100 text-nature-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Globe className="w-10 h-10" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                        Select Your Language
                    </h2>
                    <p className="text-gray-500 font-medium mb-10">
                        আপনার ভাষা নির্বাচন করুন
                    </p>

                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => handleSelect('en')}
                            className="group flex items-center justify-between p-6 bg-nature-50 border-2 border-transparent hover:border-nature-500 rounded-3xl transition-all active:scale-95"
                        >
                            <div className="text-left">
                                <span className="block text-lg font-black text-nature-900 group-hover:text-nature-600 transition-colors">English</span>
                                <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Global Default</span>
                            </div>
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-nature-500 shadow-sm">
                                <Check className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                console.log('Bangla selected');
                                window.localStorage.setItem('preferred_language', 'bn');
                                changeLanguage('bn');
                            }}
                            className="group flex items-center justify-between p-6 bg-nature-50 border-2 border-transparent hover:border-nature-500 rounded-3xl transition-all active:scale-95"
                        >
                            <div className="text-left">
                                <span className="block text-lg font-black text-nature-900 group-hover:text-nature-600 transition-colors">Bangla (বাংলা)</span>
                                <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">স্থানীয় ভাষা</span>
                            </div>
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-nature-500 shadow-sm">
                                <Check className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-50">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                            Easy Grow Plants • Cultivating Connections
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
