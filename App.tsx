
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Map as MapIcon, Loader2, X, RefreshCw, Navigation, 
  Phone, User, Building2, Hash, MapPin, LocateFixed, 
  Settings, ChevronRight 
} from 'lucide-react';
import { Client } from './types';
import MapView from './components/MapView';
import { batchGeocodeWithGemini, getCachedCoords } from './services/geminiService';

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7VTCRMlAbmi0WwxQfxSuBUv4JzgWlNYYChrdAQuoTj68nph8p-C4iMWRfhmWV7TpKmui-SyzKx-Pr/pub?gid=1142932116&single=true&output=csv";

const App: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET_URL);
  const [showConfig, setShowConfig] = useState(false);
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);

  const loadingRef = useRef(false);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.representative.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  const findMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMyLocation([pos.coords.latitude, pos.coords.longitude]);
      }, (err) => console.warn("Location error:", err));
    }
  };

  const parseCSV = (text: string): Client[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length <= 1) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map((line, index) => {
      const values: string[] = [];
      let current = '', inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { values.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
        else { current += char; }
      }
      values.push(current.trim().replace(/^"|"$/g, ''));
      const entry: Record<string, string> = {};
      headers.forEach((header, i) => { entry[header] = values[i] || ''; });
      return {
        id: `client-${index}`,
        name: entry['상호'] || entry['상호명'] || '이름 없음',
        representative: entry['대표자'] || entry['대표'] || '-',
        address: entry['주소'] || '',
        phone: entry['전화번호'] || entry['연락처'] || '',
        businessType: entry['업태'] || '-',
        category: entry['종목'] || '-',
        type: (entry['구분']?.includes('법인') ? 'Corporation' : 'Individual'),
        businessNumber: entry['사업자번호'] || '-',
        lat: entry['lat'] ? parseFloat(entry['lat']) : undefined,
        lng: entry['lng'] ? parseFloat(entry['lng']) : undefined,
      } as Client;
    });
  };

  const loadData = async (url: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    
    try {
      const response = await fetch(url + (url.includes('?') ? '&' : '?') + `t=${Date.now()}`);
      const csvText = await response.text();
      const initialData = parseCSV(csvText);
      const withCached = initialData.map(c => {
        if (c.lat && c.lng && !isNaN(c.lat)) return c;
        const cached = getCachedCoords(c.address);
        return cached ? { ...c, ...cached } : c;
      });
      setClients(withCached);
      setIsLoading(false);
      
      const missing = withCached.filter(c => !c.lat || !c.lng || isNaN(c.lat));
      if (missing.length === 0) { setIsGeocoding(false); return; }

      setIsGeocoding(true);
      const result = await batchGeocodeWithGemini(missing.map(c => c.address));
      const finalizedData = withCached.map(c => {
        if (result[c.address]) return { ...c, ...result[c.address] };
        return c;
      });
      setClients(finalizedData);
    } catch (error) { 
      console.error("Load failed:", error); 
    } finally { 
      setIsLoading(false); 
      setIsGeocoding(false); 
      loadingRef.current = false; 
    }
  };

  useEffect(() => { loadData(sheetUrl); }, []);

  useEffect(() => {
    if (searchQuery.trim() && filteredClients.length === 1) {
      setSelectedClientId(filteredClients[0].id);
    }
  }, [filteredClients, searchQuery]);

  return (
    <div className="relative h-full w-full bg-gray-50 overflow-hidden font-sans">
      <MapView 
        clients={clients} 
        selectedClient={selectedClient} 
        onClientSelect={(c) => setSelectedClientId(c.id)} 
        myLocation={myLocation}
      />

      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <div className="relative flex-1 group shadow-2xl rounded-2xl overflow-hidden border border-white/20">
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xl transition-all group-focus-within:bg-white" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="상호 또는 대표자 검색" 
              className="relative w-full pl-12 pr-12 py-4 bg-transparent outline-none font-bold text-gray-800 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => {setSearchQuery(''); setSelectedClientId(null);}} 
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={() => {setSearchQuery(''); setSelectedClientId(null);}}
            className="p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 text-gray-600 pointer-events-auto active:scale-95 transition-transform"
          >
            <RefreshCw size={22} />
          </button>
          <button 
            onClick={() => setShowConfig(true)}
            className="p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 text-gray-600 pointer-events-auto active:scale-95 transition-transform"
          >
            <Settings size={22} />
          </button>
        </div>

        {searchQuery.trim() && filteredClients.length > 1 && !selectedClientId && (
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 max-h-48 overflow-y-auto no-scrollbar pointer-events-auto slide-up">
            {filteredClients.map(c => (
              <button 
                key={c.id}
                onClick={() => setSelectedClientId(c.id)}
                className="w-full px-5 py-3 text-left hover:bg-blue-50 border-b border-gray-50 last:border-0 flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-gray-900">{c.name}</div>
                  <div className="text-[10px] text-gray-500">{c.representative} 대표 · {c.address.substring(0, 20)}...</div>
                </div>
                <ChevronRight size={14} className="text-gray-300" />
              </button>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={findMyLocation}
        className="absolute bottom-32 right-4 z-[1000] p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 text-blue-600 active:scale-90 transition-all"
      >
        <LocateFixed size={24} />
      </button>

      {selectedClient && (
        <div className="absolute bottom-4 left-4 right-4 z-[1001] slide-up">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 relative overflow-hidden">
            <button 
              onClick={() => setSelectedClientId(null)}
              className="absolute top-5 right-5 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                selectedClient.type === 'Corporation' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {selectedClient.type === 'Corporation' ? '법인' : '개인'}
              </span>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{selectedClient.name}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-tight">
                  <User size={12} /> 대표자
                </div>
                <div className="font-black text-gray-800">{selectedClient.representative}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-tight">
                  <Hash size={12} /> 사업자번호
                </div>
                <div className="font-bold text-gray-700">{selectedClient.businessNumber}</div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Building2 size={16} className="text-gray-400 mt-0.5" />
                <div className="text-sm font-bold text-gray-600">
                  {selectedClient.businessType} <span className="mx-1 text-gray-300">|</span> {selectedClient.category}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div className="text-sm font-medium text-gray-700 leading-snug">{selectedClient.address}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <a 
                href={`tel:${selectedClient.phone}`}
                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black shadow-lg shadow-blue-200 active:scale-95 transition-all"
              >
                <Phone size={18} fill="currentColor" /> 전화하기
              </a>
              <button 
                onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(selectedClient.address)}`, '_blank')}
                className="px-6 bg-gray-900 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black shadow-lg shadow-gray-200 active:scale-95 transition-all"
              >
                <Navigation size={18} /> 길찾기
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfig && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">데이터 설정</h3>
              <button onClick={() => setShowConfig(false)} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase mb-2 block">구글 시트 CSV 주소</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                />
              </div>
              <button 
                onClick={() => {loadData(sheetUrl); setShowConfig(false);}}
                className="w-full py-4 bg-gray-900 text-white rounded-xl font-black"
              >
                갱신 및 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {(isLoading || isGeocoding) && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-white/10">
          <Loader2 className="animate-spin text-blue-400" size={18} />
          <span className="text-xs font-black tracking-tight">{isGeocoding ? 'AI 주소 분석 중...' : '데이터 불러오는 중...'}</span>
        </div>
      )}
    </div>
  );
};

export default App;
