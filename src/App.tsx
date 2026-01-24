import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';
import MapView from './components/MapView';
import SearchBar from './components/SearchBar';
import ClientDetailCard from './components/ClientDetailCard';
import ConfigModal from './components/ConfigModal';
import { Client } from './types';
import { batchGeocodeWithGemini } from './Services/geminiService';

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7VTCRMlAbmi0WwxQfxSuBUv4JzgWlNYYChrdAQuoTj68nph8p-C4iMWRfhmWV7TpKmui-SyzKx-Pr/pub?gid=1142932116&single=true&output=csv";

const App: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // MapView와 타입을 맞추기 위해 [lat, lng] 배열 형태로 관리
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);
  const loadingRef = useRef(false);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.representative.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId) || null
  , [clients, selectedClientId]);

// 데이터 로드 함수시작 
  // App.tsx 내부의 loadData 함수 핵심 수정 부분
const loadData = useCallback(async (url: string) => {
  if (loadingRef.current) return;
  loadingRef.current = true;
  setIsLoading(true);

  try {
    const response = await fetch(url);
    const csvText = await response.text();
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l !== '');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const getIdx = (name: string) => headers.findIndex(h => h.includes(name));

    const parsedClients: Client[] = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      return {
        id: `client-${index}`,
        name: values[getIdx("상호")] || '',
        representative: values[getIdx("대표자")] || '',
        type: (values[getIdx("개인/법인")] || '').includes("법인") ? 'Corporation' : 'Individual',
        businessNumber: values[getIdx("사업자번호")] || '',
        address: values[getIdx("주소")] || '',
        phone: values[getIdx("전화")] || '',
        businessType: values[getIdx("종목")] || '',
        category: values[getIdx("업태")] || '',
        lat: parseFloat(values[getIdx("lat")]) || 0,
        lng: parseFloat(values[getIdx("lng")]) || 0,
      };
    });

    // 좌표 변환 로직 (좌표가 없는 것만 수행)
    setIsGeocoding(true);
    const clientsWithCoords = await batchGeocodeWithGemini(parsedClients);
    
    // 🔥 중요: 전체 거래처 리스트를 상태에 반영
    setClients(clientsWithCoords); 

  } catch (error) {
    console.error("데이터 로드 실패", error);
  } finally {
    setIsLoading(false);
    setIsGeocoding(false);
    loadingRef.current = false;
  }
}, []);

      //데이터로드함수 끝

      // 🔍 모든 데이터에 좌표가 있는지 확인
      const needsGeocoding = parsedClients.some(c => !c.lat || !c.lng);

      if (needsGeocoding) {
        setIsGeocoding(true);
        // 좌표가 없는 데이터만 AI가 분석하도록 서비스 내부에서 처리됨
        const clientsWithCoords = await batchGeocodeWithGemini(parsedClients);
        setClients(clientsWithCoords);
      } else {
        // 모든 좌표가 이미 있다면 AI 분석 생략! 즉시 상태 업데이트
        setClients(parsedClients);
        console.log("모든 좌표가 시트에 존재함: 즉시 로딩 완료");
      }

    } catch (error) {
      console.error(error);
      alert("데이터를 불러오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
      setIsGeocoding(false);
      loadingRef.current = false;
    }
  }, []);

  const findMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMyLocation([pos.coords.latitude, pos.coords.longitude]),
        () => alert("위치 권한 필요")
      );
    }
  };

  useEffect(() => { loadData(sheetUrl); }, [loadData, sheetUrl]);

  return (
    <div className="relative h-screen w-full bg-gray-50 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapView 
          clients={filteredClients} 
          selectedClient={selectedClient} 
          onClientSelect={(c) => setSelectedClientId(c.id)} 
          myLocation={myLocation}
        />
      </div>

      <div className="absolute top-0 left-0 right-0 z-[1001] p-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <SearchBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onRefresh={() => loadData(sheetUrl)}
            onOpenConfig={() => setShowConfig(true)}
            filteredClients={filteredClients}
            selectedClientId={selectedClientId}
            onSelectClient={(id) => setSelectedClientId(id)}
          />
        </div>
      </div>

      <button 
        onClick={findMyLocation}
        className="absolute bottom-32 right-4 z-[1000] p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 text-blue-600 active:scale-90 transition-all"
      >
        <LocateFixed size={24} />
      </button>

      {selectedClient && (
        <div className="absolute bottom-0 left-0 right-0 z-[1002] p-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <ClientDetailCard client={selectedClient} onClose={() => setSelectedClientId(null)} />
          </div>
        </div>
      )}

      <ConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} sheetUrl={sheetUrl} setSheetUrl={setSheetUrl} onSave={() => { loadData(sheetUrl); setShowConfig(false); }} />

      {(isLoading || isGeocoding) && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1050] bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-white/10">
          <Loader2 className="animate-spin text-blue-400" size={18} />
          <span className="text-xs font-black tracking-tight">
            {isGeocoding ? '주소 분석 중...' : '데이터 로딩 중...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default App;