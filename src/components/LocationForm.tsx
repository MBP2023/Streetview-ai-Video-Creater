import React, { useState, useCallback } from 'react';
import { PlusCircle, MinusCircle, Loader2, CheckCircle2, XCircle, MapPin } from 'lucide-react';
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

interface LocationFormProps {
  onLocationAdd?: (location: Location) => void;
  onLocationRemove?: (locationId: string) => void;
  locations: Location[];
}

interface CIDInput {
  id: string;
  value: string;
  isValid: boolean;
  isLoading: boolean;
  error: string;
  metadata?: Location;
}

const MAX_LOCATIONS = 6;
const CID_REGEX = /^[0-9]+$/;

export default function LocationForm({ onLocationAdd, onLocationRemove, locations }: LocationFormProps) {
  const [inputs, setInputs] = useState<CIDInput[]>([
    { id: crypto.randomUUID(), value: '', isValid: false, isLoading: false, error: '' }
  ]);

  const validateCID = useCallback(async (cid: string): Promise<Location> => {
    try {
      const response = await axios.post('http://localhost:3000/api/location', { cid });
      if (response.data.success) {
        return {
          id: crypto.randomUUID(),
          ...response.data.data
        };
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to validate CID');
      }
      throw error;
    }
  }, []);

  const handleInputChange = useCallback(async (index: number, value: string) => {
    setInputs(prev => prev.map((input, i) => 
      i === index 
        ? { ...input, value, isValid: false, error: '', metadata: undefined }
        : input
    ));

    if (!value || !CID_REGEX.test(value)) {
      setInputs(prev => prev.map((input, i) => 
        i === index 
          ? { ...input, error: 'Please enter a valid CID (numbers only)' }
          : input
      ));
      return;
    }

    setInputs(prev => prev.map((input, i) => 
      i === index ? { ...input, isLoading: true, error: '' } : input
    ));

    try {
      const metadata = await validateCID(value);
      setInputs(prev => prev.map((input, i) => 
        i === index 
          ? { ...input, isLoading: false, isValid: true, metadata }
          : input
      ));
      if (onLocationAdd && metadata) {
        onLocationAdd(metadata);
      }
    } catch (error) {
      setInputs(prev => prev.map((input, i) => 
        i === index 
          ? { ...input, isLoading: false, error: error instanceof Error ? error.message : 'Validation failed' }
          : input
      ));
    }
  }, [validateCID, onLocationAdd]);

  const addInput = useCallback(() => {
    if (inputs.length < MAX_LOCATIONS) {
      setInputs(prev => [...prev, { 
        id: crypto.randomUUID(),
        value: '',
        isValid: false,
        isLoading: false,
        error: ''
      }]);
    }
  }, [inputs.length]);

  const removeInput = useCallback((index: number) => {
    const input = inputs[index];
    if (input.metadata && onLocationRemove) {
      onLocationRemove(input.metadata.id);
    }
    setInputs(prev => prev.filter((_, i) => i !== index));
  }, [inputs, onLocationRemove]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {inputs.map((input, index) => (
          <div key={input.id} className="flex items-start gap-2">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={input.value}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  placeholder="Enter Google Maps CID"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    input.error
                      ? 'border-red-300 focus:border-red-500'
                      : input.isValid
                      ? 'border-green-300 focus:border-green-500'
                      : 'border-gray-300 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 ${
                    input.error
                      ? 'focus:ring-red-200'
                      : input.isValid
                      ? 'focus:ring-green-200'
                      : 'focus:ring-blue-200'
                  } transition-colors`}
                />
                <div className="absolute right-3 top-2.5">
                  {input.isLoading ? (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : input.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : input.error ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : null}
                </div>
              </div>
              {input.error && (
                <p className="mt-1 text-sm text-red-500">{input.error}</p>
              )}
              {input.metadata && (
                <div className="mt-1 text-sm text-gray-600">
                  {input.metadata.name} - {input.metadata.address}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeInput(index)}
              className="mt-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove location"
            >
              <MinusCircle className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {inputs.length < MAX_LOCATIONS && (
        <button
          type="button"
          onClick={addInput}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Add Location
        </button>
      )}

      {locations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Locations</h3>
          <div className="space-y-2">
            {locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">{location.name}</p>
                    <p className="text-sm text-gray-500">{location.address}</p>
                  </div>
                </div>
                <button
                  onClick={() => onLocationRemove?.(location.id)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}