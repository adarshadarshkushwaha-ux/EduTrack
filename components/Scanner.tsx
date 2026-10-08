import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle, AlertCircle, FileText, Loader2, ArrowRight, WifiOff, Trash2, Clock, HelpCircle, X } from 'lucide-react';
import { analyzeAttendanceSheet } from '../services/geminiService';
import { AttendanceStatus, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface ScannerProps {
  isOnline: boolean;
  lang: Language;
}

interface OfflineScan {
  id: string;
  image: string;
  timestamp: string;
}

export const Scanner: React.FC<ScannerProps> = ({ isOnline, lang }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<OfflineScan[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const saved = localStorage.getItem('offlineScanQueue');
    if (saved) {
      try {
        setOfflineQueue(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse offline queue", e);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeAttendanceSheet(image);
      setResult(data);
    } catch (err) {
      setError("Failed to analyze image. Please ensure the image is clear and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveOffline = () => {
    if (!image) return;
    const newItem: OfflineScan = {
      id: Date.now().toString(),
      image,
      timestamp: new Date().toLocaleString()
    };
    const updated = [newItem, ...offlineQueue];
    setOfflineQueue(updated);
    localStorage.setItem('offlineScanQueue', JSON.stringify(updated));
    setImage(null);
    alert("Image saved to offline queue. You can analyze it when internet is restored.");
  };

  const handleSaveResult = () => {
    alert("Data saved to database! (Mock action)");
    setImage(null);
    setResult(null);
  };

  const loadFromQueue = (item: OfflineScan) => {
    setImage(item.image);
    setResult(null);
    setError(null);
    // Optional: We keep it in the queue until processed successfully, 
    // or user can manually delete it.
  };

  const removeFromQueue = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = offlineQueue.filter(item => item.id !== id);
    setOfflineQueue(updated);
    localStorage.setItem('offlineScanQueue', JSON.stringify(updated));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {t.digitizer}
                <button 
                  onClick={() => setShowGuide(true)}
                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Help"
                >
                    <HelpCircle size={20} />
                </button>
            </h1>
            <p className="text-gray-500">{t.uploadDesc}</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                  onClick={() => setShowGuide(true)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors md:hidden"
            >
              {t.scanGuide}
            </button>
            {!isOnline && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    <WifiOff size={16} />
                    {t.offline}
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                
                {image ? (
                <div className="relative w-full h-64">
                    <img src={image} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                    <button 
                    onClick={(e) => { e.stopPropagation(); setImage(null); setResult(null); }}
                    className="absolute top-2 right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200"
                    >
                    <AlertCircle size={20} />
                    </button>
                </div>
                ) : (
                <>
                    <Camera className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-700 font-medium">{t.tapToScan}</p>
                    <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG</p>
                </>
                )}
                <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
                />
            </div>

            <div className="mt-6">
                {isOnline ? (
                    <button
                    onClick={handleAnalyze}
                    disabled={!image || isAnalyzing}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                        !image || isAnalyzing
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                    }`}
                    >
                    {isAnalyzing ? (
                        <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t.analyzing}
                        </>
                    ) : (
                        <>
                        <FileText className="w-5 h-5" />
                        {t.analyze}
                        </>
                    )}
                    </button>
                ) : (
                    <button
                    onClick={handleSaveOffline}
                    disabled={!image}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                        !image
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-600 text-white hover:bg-yellow-700 shadow-lg shadow-yellow-200'
                    }`}
                    >
                    <WifiOff className="w-5 h-5" />
                    {t.saveQueue}
                    </button>
                )}
            </div>
            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                {error}
                </div>
            )}
            </div>

            {/* Offline Queue List */}
            {offlineQueue.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Clock size={16} /> Pending Uploads ({offlineQueue.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {offlineQueue.map((item) => (
                            <div 
                                key={item.id} 
                                onClick={() => loadFromQueue(item)}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-indigo-100 cursor-pointer transition-colors"
                            >
                                <img src={item.image} alt="Thumbnail" className="w-10 h-10 object-cover rounded bg-gray-200" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">Scan {item.id.slice(-4)}</p>
                                    <p className="text-xs text-gray-500">{item.timestamp}</p>
                                </div>
                                <button 
                                    onClick={(e) => removeFromQueue(item.id, e)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Results Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            {t.results}
          </h2>
          
          {!result && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <ArrowRight className="w-12 h-12 mb-2" />
              <p>Results will appear here</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg w-full"></div>
                ))}
            </div>
          )}

          {result && result.students && (
            <div className="space-y-4">
               <div className="bg-blue-50 p-3 rounded-lg text-blue-800 text-sm mb-4">
                  <strong>AI Note:</strong> Please verify the status below. Low confidence entries are highlighted.
               </div>
               <div className="overflow-y-auto max-h-[350px] pr-2 space-y-2">
                 {result.students.map((student: any, idx: number) => (
                   <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${
                     student.confidence < 0.7 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-gray-50'
                   }`}>
                     <span className="font-medium text-gray-900">{student.name}</span>
                     <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold
                            ${student.status === AttendanceStatus.PRESENT ? 'bg-green-100 text-green-700' : ''}
                            ${student.status === AttendanceStatus.ABSENT ? 'bg-red-100 text-red-700' : ''}
                            ${student.status === AttendanceStatus.LATE ? 'bg-yellow-100 text-yellow-700' : ''}
                        `}>
                            {student.status}
                        </span>
                     </div>
                   </div>
                 ))}
               </div>
               <button 
                onClick={handleSaveResult}
                className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
               >
                   {t.confirmSave}
               </button>
            </div>
          )}
        </div>
      </div>

      {/* Guide Modal */}
      {showGuide && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fade-in">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          <HelpCircle size={18} className="text-indigo-600"/>
                          {t.scanGuideTitle}
                      </h3>
                      <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">1</div>
                          <div>
                              <p className="text-gray-700 font-medium">{t.scanTip1}</p>
                          </div>
                      </div>
                      <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">2</div>
                          <div>
                              <p className="text-gray-700 font-medium">{t.scanTip2}</p>
                              <div className="mt-2 border border-gray-200 rounded p-2 bg-gray-50 text-xs font-mono text-gray-600">
                                  Arjun Singh &nbsp;&nbsp;&nbsp;[ P ]<br/>
                                  Priya Sharma &nbsp;&nbsp;[ A ]
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">3</div>
                          <div>
                              <p className="text-gray-700 font-medium">{t.scanTip3}</p>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                      <button 
                        onClick={() => setShowGuide(false)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
                      >
                          Got it
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};