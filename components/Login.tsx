import React, { useState } from 'react';
import { Lock, User, ArrowRight, Loader2, School } from 'lucide-react';
import { Language, AppSettings } from '../types';
import { TRANSLATIONS } from '../translations';

interface LoginProps {
  onLogin: () => void;
  lang: Language;
  onToggleLanguage: () => void;
  settings: AppSettings;
}

export const Login: React.FC<LoginProps> = ({ onLogin, lang, onToggleLanguage, settings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const t = TRANSLATIONS[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Mock authentication delay
    setTimeout(() => {
      // Simple mock validation
      if (username === 'admin' && password === 'password') {
        onLogin();
      } else {
        setError('Invalid credentials. Please try again.');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-indigo-50 p-8 text-center border-b border-indigo-100 relative">
          <button 
             onClick={onToggleLanguage}
             className="absolute top-4 right-4 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 px-2 py-1 rounded shadow-sm hover:bg-indigo-50"
          >
             {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>
          
          <div className="flex justify-center mb-4">
             {settings.logoUrl ? (
                 <img 
                    src={settings.logoUrl} 
                    alt="School Logo" 
                    className="h-20 w-auto object-contain drop-shadow-md" 
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        // Fallback logic could go here, but hiding is safe
                    }}
                 />
             ) : (
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <School className="text-white w-9 h-9" />
                </div>
             )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">EduTrack</h1>
          <p className="text-indigo-600 font-medium mt-1">{settings.schoolName || t.adminPortal}</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.username}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
                  placeholder={t.username}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-md disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>{t.authenticating}</span>
                </>
              ) : (
                <>
                  <span>{t.signIn}</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};