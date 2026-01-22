import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Loader2, LocateFixed } from 'lucide-react';
import { Client } from './types';

// 분리된 컴포넌트 불러오기
import MapView from './components/MapView';
import ClientDetailCard from './components/ClientDetailCard';
import SearchBar from './components/SearchBar';
import ConfigModal from './components/ConfigModal';

// 서비스 로직 불러오기
import { batchGeocodeWithGemini, getCachedCoords } from './services/geminiService';

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7VTCRMlAbmi0WwxQfxSuBUv4JzgWlNYYChrdAQuoTj68nph8p-C4iMWRfhmWV7TpKmui-SyzKx-Pr/pub?gid=1142932116&single=true&output=csv";

const App: React.FC = () => {
  // 1. 상태 관리 (State)
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET_URL);
  const [showConfig, setShowConfig] = useState(false);
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);

  const loadingRef = useRef(false);

  // 2. 필터링 및 선택 로직 (Memo)
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

  // 3. 기능 함수 (Functions)
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

  // 4. 실행 주기 (Effects)
  useEffect(() => { loadData(sheetUrl); }, []);

  useEffect(() => {
    if (searchQuery.trim() && filteredClients.length === 1) {
      setSelectedClientId(filteredClients[0].id);
    }
  }, [filteredClients, searchQuery]);

  // 5. 화면 렌더링 (UI)
  return (
    <div className="relative h-full w-full bg-gray-50 overflow-hidden font-sans">
      {/* 지도 영역 */}
      <MapView 
        clients={clients} 
        selectedClient={selectedClient} 
        onClientSelect={(c) => setSelectedClientId(c.id)} 
        myLocation={myLocation}
      />

      {/* 상단 검색바 (분리된 컴포넌트) */}
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onRefresh={() => {setSearchQuery(''); setSelectedClientId(null);}}
        onOpenConfig={() => setShowConfig(true)}
        filteredClients={filteredClients}
        selectedClientId={selectedClientId}
        onSelectClient={(id) => setSelectedClientId(id)}
      />

      {/* 내 위치 버튼 */}
      <button 
        onClick={findMyLocation}
        className="absolute bottom-32 right-4 z-[1000] p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 text-blue-600 active:scale-90 transition-all"
      >
        <LocateFixed size={24} />
      </button>

      {/* 하단 상세 카드 (분리된 컴포넌트) */}
      {selectedClient && (
        <ClientDetailCard 
          client={selectedClient} 
          onClose={() => setSelectedClientId(null)} 
        />
      )}

      {/* 설정 모달 (분리된 컴포넌트) */}
      <ConfigModal 
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        sheetUrl={sheetUrl}
        setSheetUrl={setSheetUrl}
        onSave={() => {loadData(sheetUrl); setShowConfig(false);}}
      />

      {/* 로딩 표시기 */}
      {(isLoading || isGeocoding) && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-white/10">
          <Loader2 className="animate-spin text-blue-400" size={18} />
          <span className="text-xs font-black tracking-tight">
            {isGeocoding ? 'AI 주소 분석 중...' : '데이터 불러오는 중...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default App;