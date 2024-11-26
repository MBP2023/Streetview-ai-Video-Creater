import React, { useState } from 'react';
import { Search, AlertCircle, Loader2, MapPin, Plus, Link } from 'lucide-react';
import axios from 'axios';

interface Location {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface LocationSearchProps {
  onLocationFound: (location: Location) => void;
}

export default function LocationSearch({ onLocationFound }: LocationSearchProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResult, setSearchResult] = useState<Location | null>(null);
  const [searchType, setSearchType] = useState<'url' | 'text'>('text');

  const validateInput = (value: string) => {
    if (!value.trim()) {
      throw new Error('Please enter a location name or Google Maps URL');
    }

    if (value.includes('google.com/maps') || value.includes('goo.gl/maps')) {
      setSearchType('url');
      if (!value.match(/maps\/place\/|@|-?\d+\.\d+,-?\d+\.\d+|cid=\d+/)) {
        throw new Error('Invalid Google Maps URL format');
      }
    } else {
      setSearchType('text');
      if (value.length < 3) {
        throw new Error('Location name must be at least 3 characters long');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSearchResult(null);

    try {
      validateInput(input);
      setIsLoading(true);

      const response = await axios.post('http://localhost:3000/api/location/find', { 
        input: input.trim() 
      });
      
      if (response.data.success) {
        const location = {
          id: crypto.randomUUID(),
          ...response.data.data
        };
        setSearchResult(location);
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch location details');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to find location');
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocation = () => {
    if (searchResult) {
      onLocationFound(searchResult);
      setSearchResult(null);
      setInput('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Find Location</h2>
        <p className="text-sm text-gray-500">
          Enter a Google Maps URL or location name to find its CID and add it to your journey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="location-input" className="block text-sm font-medium text-gray-700 mb-1">
              Location or Google Maps URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {searchType === 'url' ? (
                  <Link className="h-5 w-5 text-gray-400" />
                ) : (
                  <MapPin className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <input
                id="location-input"
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError('');
                  setSearchResult(null);
                }}
                placeholder={
                  searchType === 'url'
                    ? 'Paste Google Maps URL (e.g., https://goo.gl/maps/...)'
                    : 'Enter location name (e.g., Eiffel Tower, Paris)'
                }
                className={`w-full pl-10 pr-12 py-2 border ${
                  error ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:ring-2 ${
                  error ? 'focus:ring-red-200' : 'focus:ring-blue-200'
                } focus:border-blue-500 transition-colors`}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-2.5">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
              !input.trim() || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition-colors`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {searchType === 'url' ? 'Extracting CID...' : 'Searching Location...'}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                {searchType === 'url' ? 'Extract CID' : 'Search Location'}
              </>
            )}
          </button>
        </div>
      </form>

      {searchResult && (
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{searchResult.name}</h3>
              <p className="text-sm text-gray-500 break-words">{searchResult.address}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Lat: {searchResult.location.lat.toFixed(6)}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Lng: {searchResult.location.lng.toFixed(6)}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleAddLocation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add to Journey
          </button>
        </div>
      )}

      <div className="text-sm text-gray-500 space-y-2">
        <p className="font-medium">Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Paste a Google Maps URL to extract the CID automatically</li>
          <li>Or enter a location name to search for its CID</li>
          <li>For best results, include the city or area name</li>
        </ul>
      </div>
    </div>
  );
}