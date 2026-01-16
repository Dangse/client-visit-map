
import React, { useEffect, useRef } from 'react';
import { Client } from '../types';

interface MapViewProps {
  clients: Client[];
  selectedClient: Client | null;
  onClientSelect: (client: Client) => void;
  myLocation: [number, number] | null;
}

declare const L: any;

const MapView: React.FC<MapViewProps> = ({ clients, selectedClient, onClientSelect, myLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const myLocMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initMap = () => {
      if (typeof L === 'undefined') {
        setTimeout(initMap, 100);
        return;
      }

      if (mapInstanceRef.current) return;

      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([37.5665, 126.9780], 11);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstanceRef.current);

      clusterGroupRef.current = L.markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          maxClusterRadius: 40
      });
      
      mapInstanceRef.current.addLayer(clusterGroupRef.current);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 내 위치 표시 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !myLocation) return;
    
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

  // 거래처 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current || typeof L === 'undefined') return;

    clusterGroupRef.current.clearLayers();
    markersRef.current = {};

    clients.forEach(client => {
      if (client.lat && client.lng) {
        const marker = L.marker([client.lat, client.lng]);
        
        marker.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          onClientSelect(client);
        });

        clusterGroupRef.current.addLayer(marker);
        markersRef.current[client.id] = marker;
      }
    });

    // 검색 결과가 있는 경우 해당 범위로 지도 맞춤
    if (clients.length > 0) {
      const validCoords = clients
        .filter(c => c.lat && c.lng)
        .map(c => [c.lat, c.lng]);
      
      if (validCoords.length > 0 && clients.length < 10) { // 너무 많을 때는 맞춤 방지 (클러스터가 알아서 함)
         mapInstanceRef.current.fitBounds(validCoords, { padding: [100, 100], maxZoom: 15 });
      }
    }
  }, [clients, onClientSelect]);

  // 카드 선택 시 지도 이동
  useEffect(() => {
    if (selectedClient && selectedClient.lat && selectedClient.lng && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedClient.lat, selectedClient.lng], 16, {
        duration: 0.8
      });
    }
  }, [selectedClient]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};

export default MapView;
