import React, { useState } from 'react';
import { Save, Clock, ShieldCheck, School, AlertCircle, Image } from 'lucide-react';
import { AppSettings, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  lang: Language;
}

export const Settings: React.FC<SettingsProps> = ({ settings: initialSettings, onSave, lang }) => {
  const [formData, setFormData] = useState<AppSettings>(initialSettings);
  const [isSaved, setIsSaved] = useState(false);
  const t = TRANSLATIONS[lang];

  const handleChange = (key: keyof AppSettings, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keywords = e.target.value.split(',').map(k => k.trim());
    setFormData(prev => ({ ...prev, autoExcuseKeywords: keywords }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.systemSettings}</h1>
        <p className="text-gray-500">{t.setDesc}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General School Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" />
            {t.genInfo}
          </h2>
          <div className="space-y-4 max-w-md">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.schoolName}</label>
                <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => handleChange('schoolName', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.schoolLogo}</label>
                <div className="flex gap-2">
                    <div className="relative flex-grow">
                         <Image className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                         <input
                            type="text"
                            value={formData.logoUrl || ''}
                            onChange={(e) => handleChange('logoUrl', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="https://example.com/logo.png"
                        />
                    </div>
                </div>
                {formData.logoUrl && (
                    <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Preview:</p>
                        <img src={formData.logoUrl} alt="Logo Preview" className="h-12 object-contain border p-1 rounded bg-gray-50" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Attendance Rules */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            {t.attRules}
          </h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.lateThreshold}</label>
              <input
                type="time"
                value={formData.lateThreshold}
                onChange={(e) => handleChange('lateThreshold', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Students arriving after this time during the scan or check-in process will be flagged as 'Late'.
              </p>
            </div>
          </div>
        </div>

        {/* Automation Rules */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            {t.automation}
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <label className="font-medium text-gray-700">{t.enableAuto}</label>
                    <p className="text-xs text-gray-500">Allow system to automatically suggest 'Excused' status based on criteria.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('enableAutoExcuse', !formData.enableAutoExcuse)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.enableAutoExcuse ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.enableAutoExcuse ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
            </div>

            <div className={`transition-opacity ${formData.enableAutoExcuse ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.excuseKeywords}</label>
              <input
                type="text"
                value={formData.autoExcuseKeywords.join(', ')}
                onChange={handleKeywordsChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="sick, doctor, emergency..."
              />
              <div className="mt-2 flex gap-2 text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-100">
                <AlertCircle size={14} className="text-blue-600 mt-0.5" />
                <p>If a parent message or note contains these words, the system will mark the absence as 'Excused'.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
          >
            <Save size={20} />
            {isSaved ? t.saved : t.saveConfig}
          </button>
        </div>
      </form>
    </div>
  );
};