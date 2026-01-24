import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Client } from '../types';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

interface MapViewProps {
  clients: Client[];
  selectedClient: Client | null;
  onClientSelect: (client: Client) => void;
  myLocation: [number, number] | null;
}

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
  const isFirstLoad = useRef(true); // 처음 로딩 시에만 fitBounds 하기 위함

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([37.5665, 126.9780], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

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

  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current) return;

    clusterGroupRef.current.clearLayers();
    markersRef.current = {};

    clients.forEach(client => {
      if (client.lat && client.lng) {
        const isSelected = selectedClient?.id === client.id;
        
        const marker = L.marker([client.lat, client.lng], {
          icon: isSelected ? L.divIcon({
            className: 'selected-marker',
            html: `<div style="width: 24px; height: 24px; background: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(239,68,68,0.8); z-index: 1000;"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          }) : new L.Icon.Default()
        });
        
        marker.bindTooltip(`<b>${client.name}</b>`, { direction: 'top', offset: [0, -10] });
        
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onClientSelect(client);
        });

        clusterGroupRef.current?.addLayer(marker);
        markersRef.current[client.id] = marker;
      }
    });

    // 앱 실행 후 "최초 1회만" 모든 마커가 보이게 자동 줌
    if (isFirstLoad.current && clients.length > 0) {
      const validCoords = clients
        .filter(c => c.lat && c.lng)
        .map(c => [c.lat!, c.lng!] as L.LatLngExpression);
      
      if (validCoords.length > 0) {
        mapInstanceRef.current.fitBounds(validCoords, { padding: [50, 50], maxZoom: 15 });
        isFirstLoad.current = false;
      }
    }
  }, [clients]); // onClientSelect는 의존성에서 제거 (무한루프 방지)

  useEffect(() => {
    if (selectedClient?.lat && selectedClient?.lng && mapInstanceRef.current) {
      const { lat, lng, id } = selectedClient;
      mapInstanceRef.current.flyTo([lat, lng], 15);
      const marker = markersRef.current[id];
      if (marker && clusterGroupRef.current) {
        clusterGroupRef.current.zoomToShowLayer(marker, () => {
          marker.bindPopup(`<b>${selectedClient.name}</b><br>${selectedClient.address}`).openPopup();
        });
      }
    }
  }, [selectedClient]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};

export default MapView;