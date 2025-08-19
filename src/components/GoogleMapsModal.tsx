/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, X, Loader } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  formatted_address: string;
}

interface GoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  initialAddress?: string;
}

interface GoogleMapsEvent {
  latLng: {
    lat: () => number;
    lng: () => number;
  };
}

interface GoogleMapsResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: Record<string, unknown>) => {
          setCenter: (center: { lat: number; lng: number }) => void;
          setZoom: (zoom: number) => void;
          addListener: (event: string, callback: (event: GoogleMapsEvent) => void) => void;
        };
        Marker: new (options: Record<string, unknown>) => {
          setMap: (map: unknown) => void;
          addListener: (event: string, callback: (event: GoogleMapsEvent) => void) => void;
        };
        Geocoder: new () => {
          geocode: (
            request: Record<string, unknown>,
            callback: (results: GoogleMapsResult[], status: string) => void
          ) => void;
        };
      };
    };
    initMap: () => void;
  }
}

export default function GoogleMapsModal({
  isOpen,
  onClose,
  onLocationSelect,
  initialAddress = ''
}: GoogleMapsModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  // Load Google Maps API
  useEffect(() => {
    if (!isOpen) return;

    const loadGoogleMaps = () => {
      if (window.google) {
        setMapsLoaded(true);
        return;
      }

      // Check if script already exists
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Wait for it to load
        const checkGoogle = setInterval(() => {
          if (window.google) {
            setMapsLoaded(true);
            clearInterval(checkGoogle);
          }
        }, 100);
        return;
      }

      window.initMap = () => {
        setMapsLoaded(true);
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [isOpen]);

  // Initialize map when loaded
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || !isOpen) return;

    // Default to Beirut, Lebanon
    const defaultLocation = { lat: 33.8938, lng: 35.5018 };

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: defaultLocation,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const searchLocationInEffect = async (query: string) => {
      if (!mapsLoaded || !query.trim()) return;

      setIsLoading(true);
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: query }, (results: GoogleMapsResult[], status: string) => {
        setIsLoading(false);
        
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          const locationData: LocationData = {
            latitude: lat,
            longitude: lng,
            address: results[0].formatted_address,
            formatted_address: results[0].formatted_address
          };
          
          setSelectedLocation(locationData);
          mapInstance.current.setCenter({ lat, lng });
          mapInstance.current.setZoom(16);
          placeMarker(lat, lng);
        } else {
          alert('Location not found. Please try a different search.');
        }
      });
    };

    // Add click listener
    mapInstance.current.addListener('click', (event: GoogleMapsEvent) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: GoogleMapsResult[], status: string) => {
        if (status === 'OK' && results[0]) {
          const location: LocationData = {
            latitude: lat,
            longitude: lng,
            address: results[0].formatted_address,
            formatted_address: results[0].formatted_address
          };
          setSelectedLocation(location);
          placeMarker(lat, lng);
        }
      });
    });

    // If there's an initial address, search for it
    if (initialAddress) {
      searchLocationInEffect(initialAddress);
    }
  }, [mapsLoaded, isOpen, initialAddress]);

  const placeMarker = (lat: number, lng: number) => {
    if (markerInstance.current) {
      markerInstance.current.setMap(null);
    }

    markerInstance.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstance.current,
      draggable: true,
    });

    // Update location when marker is dragged
    markerInstance.current.addListener('dragend', (event: GoogleMapsEvent) => {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results: GoogleMapsResult[], status: string) => {
        if (status === 'OK' && results[0]) {
          const location: LocationData = {
            latitude: newLat,
            longitude: newLng,
            address: results[0].formatted_address,
            formatted_address: results[0].formatted_address
          };
          setSelectedLocation(location);
        }
      });
    });
  };

  const searchLocation = async (query: string) => {
    if (!mapsLoaded || !query.trim()) return;

    setIsLoading(true);
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results: GoogleMapsResult[], status: string) => {
      setIsLoading(false);
      
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        const locationData: LocationData = {
          latitude: lat,
          longitude: lng,
          address: results[0].formatted_address,
          formatted_address: results[0].formatted_address
        };
        
        setSelectedLocation(locationData);
        mapInstance.current.setCenter({ lat, lng });
        mapInstance.current.setZoom(16);
        placeMarker(lat, lng);
      } else {
        alert('Location not found. Please try a different search.');
      }
    });
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: GoogleMapsResult[], status: string) => {
          setIsLoading(false);
          
          if (status === 'OK' && results[0]) {
            const location: LocationData = {
              latitude: lat,
              longitude: lng,
              address: results[0].formatted_address,
              formatted_address: results[0].formatted_address
            };
            setSelectedLocation(location);
            mapInstance.current.setCenter({ lat, lng });
            mapInstance.current.setZoom(16);
            placeMarker(lat, lng);
          }
        });
      },
      (error) => {
        setIsLoading(false);
        alert('Unable to get your current location. Please search manually.');
      }
    );
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Select Delivery Location</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for an address or landmark..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
              onKeyPress={(e) => e.key === 'Enter' && searchLocation(searchQuery)}
            />
            <Button
              onClick={() => searchLocation(searchQuery)}
              disabled={isLoading}
              className="px-4"
            >
              {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Search'}
            </Button>
            <Button
              onClick={handleCurrentLocation}
              disabled={isLoading}
              variant="outline"
              className="px-4"
            >
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Map */}
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-96"
            style={{ minHeight: '400px' }}
          />
          
          {!mapsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-600" />
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Selected Location */}
        {selectedLocation && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <p className="text-sm font-medium text-gray-900 mb-1">Selected Location:</p>
            <p className="text-sm text-gray-600">{selectedLocation.formatted_address}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Click on the map to select a precise location
          </p>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLocation}
              disabled={!selectedLocation}
              className="bg-zinc-900 hover:bg-zinc-800"
            >
              Confirm Location
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
