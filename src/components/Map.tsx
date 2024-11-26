import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { MapPin, X, AlertCircle, Loader2 } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface MapProps {
  apiKey: string;
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  onLocationRemove?: (locationId: string) => void;
  previewLocation?: Location | null;
}

function MapStatus({ status }: { status: Status }) {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="w-full h-[600px] bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="w-full h-[600px] bg-red-50 rounded-lg flex items-center justify-center">
          <div className="text-center px-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to load map</h3>
            <p className="text-red-600">Please check your API key and try again.</p>
          </div>
        </div>
      );
    default:
      return null;
  }
}

function MapComponent({ 
  locations,
  onLocationSelect,
  onLocationRemove,
  previewLocation
}: Omit<MapProps, 'apiKey'>) {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new google.maps.Map(ref.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      const newInfoWindow = new google.maps.InfoWindow();

      newMap.addListener('click', async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng || !onLocationSelect) return;

        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${window.GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();

          if (data.results[0]) {
            const location: Location = {
              id: crypto.randomUUID(),
              name: data.results[0].formatted_address,
              address: data.results[0].formatted_address,
              location: { lat, lng }
            };
            onLocationSelect(location);
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
        }
      });

      setMap(newMap);
      setInfoWindow(newInfoWindow);
    }
  }, [ref, map, onLocationSelect]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers = locations.map((location, index) => {
      const marker = new google.maps.Marker({
        position: location.location,
        map,
        title: location.name,
        label: {
          text: (index + 1).toString(),
          color: '#FFFFFF',
          fontSize: '14px'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 12
        }
      });

      marker.addListener('click', () => {
        if (!infoWindow) return;

        const content = document.createElement('div');
        content.className = 'p-2';
        content.innerHTML = `
          <div class="max-w-xs">
            <h3 class="font-medium text-gray-900">${location.name}</h3>
            <p class="text-sm text-gray-500 mt-1">${location.address}</p>
            ${onLocationRemove ? `
              <button
                class="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                onclick="window.removeLocation('${location.id}')"
              >
                Remove Location
              </button>
            ` : ''}
          </div>
        `;

        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Fit bounds if there are locations
    if (locations.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(location => {
        bounds.extend(location.location);
      });
      map.fitBounds(bounds, 50); // 50px padding
    }

    // Add removeLocation to window for marker click handlers
    if (onLocationRemove) {
      (window as any).removeLocation = (locationId: string) => {
        onLocationRemove(locationId);
        infoWindow?.close();
      };
    }

    return () => {
      (window as any).removeLocation = undefined;
    };
  }, [map, locations, infoWindow, onLocationRemove]);

  // Update map center when preview location changes
  useEffect(() => {
    if (!map || !previewLocation) return;

    map.panTo(previewLocation.location);
    map.setZoom(18);
  }, [map, previewLocation]);

  return <div ref={ref} className="w-full h-[600px] rounded-lg overflow-hidden" />;
}

export default function Map({ apiKey, ...props }: MapProps) {
  if (!apiKey) {
    return (
      <div className="w-full h-[600px] bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Missing API Key</h3>
          <p className="text-red-600">Please provide a valid Google Maps API key.</p>
        </div>
      </div>
    );
  }

  return (
    <Wrapper 
      apiKey={apiKey} 
      libraries={['places', 'streetview']}
      render={MapStatus}
      version="beta"
    >
      <MapComponent {...props} />
    </Wrapper>
  );
}