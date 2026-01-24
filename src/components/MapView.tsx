import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Client } from '../types';

// 스타일 임포트 (지도가 정상적으로 보이려면 필수입니다)
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// MarkerCluster 플러그인 활성화
import 'leaflet.markercluster';

interface MapViewProps {
  clients: Client[];
  selectedClient: Client | null;
  onClientSelect: (client: Client) => void;
  myLocation: [number, number] | null;
}

// Vite 빌드 시 Leaflet 마커 아이콘이 깨지는 문제 해결
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapView: React.FC<MapViewProps> = ({ clients, selectedClient, onClientSelect, myLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const myLocMarkerRef = useRef<L.Marker | null>(null);

  // 1. 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // 지도 인스턴스 생성
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([37.5665, 126.9780], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // 클러스터 그룹 생성
    const clusters = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 40
    });
    
    map.addLayer(clusters);
    
    mapInstanceRef.current = map;
    clusterGroupRef.current = clusters;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. 내 위치 표시 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !myLocation) return;
    
    const [lat, lng] = myLocation;

    if (myLocMarkerRef.current) {
      myLocMarkerRef.current.setLatLng(myLocation);
    } else {
      const myIcon = L.divIcon({
        className: 'my-location-marker',
        html: `<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59,130,246,0.6);"></div>`,
        iconSize: [20, 20]
      });
      myLocMarkerRef.current = L.marker(myLocation, { icon: myIcon }).addTo(mapInstanceRef.current);
    }
    
    mapInstanceRef.current.flyTo(myLocation, 14);
  }, [myLocation]);

  // 3. 거래처 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current) return;

    // 기존 마커 제거
    clusterGroupRef.current.clearLayers();
    markersRef.current = {};

    clients.forEach(client => {
      if (client.lat && client.lng) {
        const isSelected = selectedClient?.id === client.id;
        
        const marker = L.marker([client.lat, client.lng], {
          icon: isSelected ? L.divIcon({
            className: 'selected-marker',
            html: `<div style="width: 20px; height: 20px; background: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(239,68,68,0.6);"></div>`,
            iconSize: [20, 20]
          }) : new L.Icon.Default()
        });
        
        // 툴팁 & 팝업
        marker.bindTooltip(`${client.representative || ''} ${client.name}`, { direction: 'top' });
        marker.bindPopup(`<b>${client.name}</b><br>${client.address}`);
        
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onClientSelect(client);
        });

        clusterGroupRef.current?.addLayer(marker);
        markersRef.current[client.id] = marker;
      }
    });

    // 초기 로딩 시 모든 마커가 보이도록 범위 조정
    if (clients.length > 0) {
      const validCoords = clients
        .filter(c => c.lat && c.lng)
        .map(c => [c.lat!, c.lng!] as L.LatLngExpression);
      
      if (validCoords.length > 0) {
        mapInstanceRef.current.fitBounds(validCoords, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [clients, onClientSelect]);

  // 4. 리스트에서 카드 선택 시 해당 마커로 이동
  useEffect(() => {
    if (selectedClient?.lat && selectedClient?.lng && mapInstanceRef.current) {
      const { lat, lng, id } = selectedClient;
      
      mapInstanceRef.current.flyTo([lat, lng], 15);

      const marker = markersRef.current[id];
      if (marker && clusterGroupRef.current) {
        // 클러스터 안에 숨겨져 있어도 줌을 풀고 마커를 보여줌
        clusterGroupRef.current.zoomToShowLayer(marker, () => {
          marker.openPopup();
        });
      }
    }
  }, [selectedClient]);

  return <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: '400px' }} />;
};

export default MapView;