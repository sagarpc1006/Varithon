import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Language } from '../types';

interface LanguageDropdownProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  className?: string;
  variant?: 'light' | 'glass';
}

const languages: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
];

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  currentLanguage,
  onLanguageChange,
  className = '',
  variant = 'light',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangObj = languages.find((l) => l.code === currentLanguage) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isGlass = variant === 'glass';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        id="language-selector-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/30 active:scale-98 cursor-pointer ${
          isGlass
            ? 'bg-[#182333]/70 hover:bg-[#182333]/90 text-white border border-white/25 backdrop-blur-md'
            : 'bg-white/95 hover:bg-white text-slate-700 border border-slate-200/90 hover:border-slate-300'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className={`w-4 h-4 ${isGlass ? 'text-white' : 'text-slate-600'}`} />
        <span>{currentLangObj.native}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isGlass ? 'text-white/80' : 'text-slate-400'}`} />
      </button>

      {isOpen && (
        <div
          id="language-dropdown-menu"
          className="absolute right-0 mt-2 w-36 rounded-xl bg-slate-900/95 backdrop-blur-md shadow-2xl ring-1 ring-white/10 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 border border-white/10 text-white"
        >
          {languages.map((lang) => {
            const isSelected = lang.code === currentLanguage;
            return (
              <button
                key={lang.code}
                id={`lang-opt-${lang.code}`}
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'font-semibold text-orange-400 bg-orange-950/40'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{lang.native}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
