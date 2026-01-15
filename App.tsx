
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Search, Map as MapIcon, Loader2, UploadCloud, X, Database, AlertTriangle, RefreshCw } from 'lucide-react';
import { Client } from './types';
import ClientCard from './components/ClientCard';
import MapView from './components/MapView';
import { geocodeAddress } from './services/geminiService';

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7VTCRMlAbmi0WwxQfxSuBUv4JzgWlNYYChrdAQuoTj68nph8p-C4iMWRfhmWV7TpKmui-SyzKx-Pr/pub?gid=1142932116&single=true&output=csv"; 

const App: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET_URL);
  const [showImportModal, setShowImportModal] = useState(false);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.representative.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  const handleClientSelect = useCallback((client: Client) => {
    setSelectedClientId(client.id);
  }, []);

  const parseCSV = (text: string): Client[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    return lines.slice(1).map((line, index) => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''));
      
      const entry: Record<string, string> = {};
      headers.forEach((header, i) => {
        entry[header] = values[i] || '';
      });

      return {
        id: `gsheet-${index}-${Date.now()}`,
        name: entry['상호'] || entry['상호명'] || '이름 없음',
        representative: entry['대표자'] || entry['대표'] || '-',
        businessType: entry['업태'] || '-',
        category: entry['종목'] || '-',
        type: (entry['구분'] === '법인' ? 'Corporation' : 'Individual'),
        address: entry['주소'] || '',
        businessNumber: entry['사업자번호'] || '-',
        phone: entry['전화번호'] || entry['연락처'] || '',
      } as Client;
    });
  };

  const loadData = async (url: string) => {
    if (!url || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("데이터를 가져오는데 실패했습니다.");
      
      const csvText = await response.text();
      const parsedData = parseCSV(csvText);
      
      if (parsedData.length === 0) {
        setIsLoading(false);
        return;
      }

      // 1단계: 마커 없이 리스트 먼저 표시
      setClients(parsedData);
      
      // 2단계: 좌표 순차적 업데이트 (Nominatim 속도 제한 준수)
      const withCoords: Client[] = [];
      for (const client of parsedData) {
        if (client.address) {
          const coords = await geocodeAddress(client.address);
          withCoords.push({ ...client, lat: coords?.lat, lng: coords?.lng });
          // Nominatim TOS 준수를 위한 아주 짧은 지연 (선택 사항)
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          withCoords.push(client);
        }
      }
      setClients(withCoords);
      setShowImportModal(false);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(DEFAULT_SHEET_URL);
  }, []);

  const handleManualRefresh = () => {
    loadData(sheetUrl || DEFAULT_SHEET_URL);
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-gray-900">
      <div className={`transition-all duration-300 bg-white border-r border-gray-200 flex flex-col shadow-2xl z-20 ${isSidebarOpen ? 'w-96' : 'w-0 overflow-hidden'}`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0">
          <h1 className="text-xl font-black text-blue-600 flex items-center gap-2 tracking-tight">
            <MapIcon size={24} strokeWidth={3} /> 거래처 방문지도
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={20} /></button>
        </div>

        <div className="p-4 space-y-4 flex-1 flex flex-col min-h-0 bg-white">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="상호명, 대표자, 주소 검색..."
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-1">
            {isLoading && clients.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                    <p className="text-gray-500 font-bold animate-pulse">데이터 로딩 중...</p>
                </div>
            ) : filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <ClientCard 
                  key={client.id} 
                  client={client} 
                  isSelected={selectedClientId === client.id}
                  onSelect={handleClientSelect}
                />
              ))
            ) : (
              <div className="py-24 text-center space-y-5 px-6">
                <Database size={56} className="mx-auto text-gray-200" />
                <div className="space-y-2">
                    <p className="text-gray-600 font-bold">표시할 데이터가 없습니다.</p>
                </div>
                <button 
                    onClick={() => setShowImportModal(true)} 
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                    데이터 소스 설정
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-2">
            <button 
                onClick={handleManualRefresh} 
                className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
            >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                새로고침
            </button>
            <button 
                onClick={() => setShowImportModal(true)} 
                className="flex-1 py-4 bg-gray-800 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-black transition-all active:scale-95"
            >
                설정
            </button>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <MapView clients={filteredClients} selectedClient={selectedClient} onClientSelect={handleClientSelect} />
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="absolute top-6 left-6 z-[1000] bg-white px-5 py-3 rounded-2xl shadow-2xl text-blue-600 font-black border border-gray-100 hover:bg-blue-50 transition-all flex items-center gap-2"
          >
            <MapIcon size={18} /> 목록 열기
          </button>
        )}
        {isLoading && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-blue-100 animate-bounce">
            <Loader2 className="animate-spin text-blue-600" size={18} />
            <span className="text-sm font-black text-gray-800 tracking-tight">주소 좌표 변환 중...</span>
          </div>
        )}
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-gray-900">
                <UploadCloud className="text-blue-600" strokeWidth={3} /> 소스 설정
              </h2>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={28} /></button>
            </div>
            <div className="space-y-6">
                <div>
                    <label className="text-xs font-black text-gray-400 ml-2 mb-2 block uppercase tracking-widest">Google Sheet CSV URL</label>
                    <input 
                      type="text" 
                      placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                      className="w-full p-5 bg-gray-50 border-2 border-gray-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-sm font-medium shadow-inner"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => loadData(sheetUrl)} 
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
                >
                    데이터 동기화
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
