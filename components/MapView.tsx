
import React, { useEffect, useRef } from 'react';
import { Client } from '../types';

interface MapViewProps {
  clients: Client[];
  selectedClient: Client | null;
  onClientSelect: (client: Client) => void;
}

// 브라우저에 전역으로 로드된 Leaflet(L)을 사용하기 위한 선언
declare const L: any;

const MapView: React.FC<MapViewProps> = ({ clients, selectedClient, onClientSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Leaflet 라이브러리가 완전히 준비되었는지 확인하는 함수
    const initMap = () => {
      if (typeof L === 'undefined') {
        // 아직 준비 안 됐으면 0.1초 뒤에 다시 시도
        setTimeout(initMap, 100);
        return;
      }

      if (mapInstanceRef.current) return;

      // 지도 초기화 (서울 시청 기준)
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: false // 기본 줌 버튼 숨김 (나중에 커스텀 가능)
      }).setView([37.5665, 126.9780], 11);
      
      // 오픈스트리트맵 타일 추가
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // 마커 클러스터(뭉쳐 보이는 기능) 설정
      clusterGroupRef.current = L.markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          maxClusterRadius: 50
      });
      
      mapInstanceRef.current.addLayer(clusterGroupRef.current);

      // 중요: 지도가 처음에 깨져 보이지 않도록 화면 크기를 다시 계산하게 함
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current || typeof L === 'undefined') return;

    clusterGroupRef.current.clearLayers();
    markersRef.current = {};

    clients.forEach(client => {
      if (client.lat && client.lng) {
        const marker = L.marker([client.lat, client.lng]);
        
        const popupContent = `
          <div class="p-2 min-w-[150px]">
            <h4 class="font-bold text-base border-b pb-1 mb-2">${client.name}</h4>
            <p class="text-xs text-gray-600">대표: ${client.representative}</p>
            <div class="mt-2 pt-1 border-t">
              <a href="tel:${client.phone}" class="text-blue-600 font-bold text-sm inline-flex items-center gap-1">
                📞 전화하기
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          onClientSelect(client);
        });

        clusterGroupRef.current.addLayer(marker);
        markersRef.current[client.id] = marker;
      }
    });

    if (clients.length > 0) {
        const coords = clients
            .filter(c => c.lat && c.lng)
            .map(c => [c.lat, c.lng]);
        
        if (coords.length > 0) {
            mapInstanceRef.current.fitBounds(coords, { padding: [50, 50] });
        }
    }
  }, [clients, onClientSelect]);

  useEffect(() => {
    if (selectedClient && markersRef.current[selectedClient.id] && mapInstanceRef.current) {
        const marker = markersRef.current[selectedClient.id];
        mapInstanceRef.current.setView([selectedClient.lat, selectedClient.lng], 16);
        marker.openPopup();
    }
  }, [selectedClient]);

  return <div ref={mapContainerRef} className="w-full h-full bg-slate-100" />;
};

export default MapView;
