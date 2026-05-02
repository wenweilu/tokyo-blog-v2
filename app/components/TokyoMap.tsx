'use client';
import { useEffect, useRef } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Place, CATEGORIES } from '../../types';

const TOKYO = { lat: 35.6762, lng: 139.6903 };

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ saturation: -100 }, { lightness: 15 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#999999' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d8d8d8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f0f0f0' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e8e8e8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dedede' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#ececec' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#cccccc' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f2f0ed' }] },
];

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#B5896A', drink: '#6A8BA0', coffee: '#8A7260',
  hair_salon: '#8A7A9A', gallery_museum: '#6A7D6A', shopping: '#9A7878',
  music: '#687890', other: '#888878',
};

function PlaceMarker({ place, isSelected, isHovered, onSelect, onHover, map }: {
  place: Place;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
  map: google.maps.Map | null;
}) {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const active = isSelected || isHovered;
  const color = CATEGORY_COLORS[place.category] ?? '#888878';

  useEffect(() => {
    if (!map) return;

    const marker = new google.maps.Marker({
      map,
      position: { lat: place.lat, lng: place.lng },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 10 : active ? 8 : 6,
        fillColor: active ? color : '#d0ceca',
        fillOpacity: 1,
        strokeColor: isSelected ? '#ffffff' : active ? color : '#bab8b4',
        strokeWeight: 2,
      },
      zIndex: isSelected ? 200 : isHovered ? 100 : 1,
      title: place.name,
    });

    const clickListener = marker.addListener('click', onSelect);
    const enterListener = marker.addListener('mouseover', () => onHover(place.id));
    const leaveListener = marker.addListener('mouseout', () => onHover(null));

    markerRef.current = marker;

    return () => {
      google.maps.event.removeListener(clickListener);
      google.maps.event.removeListener(enterListener);
      google.maps.event.removeListener(leaveListener);
      marker.setMap(null);
      markerRef.current = null;
    };
  }, [map, place.lat, place.lng, isSelected, isHovered, color]);

  return null;
}

function MapContent({ places, selectedId, hoveredId, onSelect, onHover }: {
  places: Place[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const map = useMap();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !selectedId || selectedId === prevId.current) return;
    prevId.current = selectedId;
    const place = places.find(p => p.id === selectedId);
    if (!place) return;

    if ((map.getZoom() ?? 12) < 14) map.setZoom(14);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (!isMobile) {
      map.panTo({ lat: place.lat, lng: place.lng });
      return;
    }

    // Mobile: first center on selected place, then shift map down so marker appears higher
    // in the visible top map strip above the bottom sheet.
    map.panTo({ lat: place.lat, lng: place.lng });
    google.maps.event.addListenerOnce(map, 'idle', () => {
      map.panBy(0, Math.round(window.innerHeight * 0.32));
    });
  }, [selectedId, map, places]);

  useEffect(() => {
    if (!selectedId) prevId.current = null;
  }, [selectedId]);

  return (
    <>
      {places.map(place => (
        <PlaceMarker
          key={place.id}
          place={place}
          isSelected={selectedId === place.id}
          isHovered={hoveredId === place.id}
          onSelect={() => onSelect(place.id)}
          onHover={onHover}
          map={map}
        />
      ))}
    </>
  );
}

interface Props {
  places: Place[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  apiKey: string;
  listRef?: React.RefObject<HTMLDivElement>;
}

export default function TokyoMap({ places, selectedId, hoveredId, onSelect, onHover, apiKey }: Props) {
  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={TOKYO}
        defaultZoom={12}
        styles={MAP_STYLES}
        disableDefaultUI
        zoomControl
        gestureHandling="greedy"
        style={{ width: '100%', height: '100%' }}
      >
        <MapContent
          places={places}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onHover={onHover}
        />
      </Map>
    </APIProvider>
  );
}