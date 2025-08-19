'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface GoogleMapsLocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  onClose: () => void;
  initialAddress?: string;
}

export default function GoogleMapsLocationPicker({
  onLocationSelect,
  onClose,
  initialAddress = ''
}: GoogleMapsLocationPickerProps) {
  const [searchAddress, setSearchAddress] = useState(initialAddress);

  // Placeholder implementation - in the future this would integrate with Google Maps API
  const handleLocationSearch = async () => {
    // Mock location data for demonstration
    const mockLocation: LocationData = {
      latitude: 33.8938,
      longitude: 35.5018,
      address: searchAddress || 'Beirut, Lebanon'
    };

    onLocationSelect(mockLocation);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: 'Current Location'
          };
          onLocationSelect(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please enter your address manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Select Location</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Address Search */}
          <div>
            <label htmlFor="searchAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Search Address
            </label>
            <input
              type="text"
              id="searchAddress"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
              placeholder="Enter your address..."
            />
          </div>

          {/* Map Placeholder */}
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-48 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Google Maps integration</p>
              <p className="text-xs text-gray-500">Coming Soon</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleCurrentLocation}
              variant="outline"
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Use Current Location
            </Button>
            
            <Button
              onClick={handleLocationSearch}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white"
              disabled={!searchAddress.trim()}
            >
              Select This Address
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            This will help our delivery team find your exact location
          </p>
        </div>
      </div>
    </div>
  );
}
