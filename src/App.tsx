import React, { useState } from 'react';
import LocationSearch from './components/LocationSearch';
import LocationForm from './components/LocationForm';
import Map from './components/Map';
import TimelineEditor from './components/TimelineEditor';
import VideoRenderer from './components/VideoRenderer';
import Feedback from './components/Feedback';
import { MapPin, AlertCircle, Video, Clock, Map as MapIcon, Settings, MessageSquare } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface TimelineLocation extends Location {
  duration: number;
  heading: number;
  pitch: number;
  zoom: number;
}

export default function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [previewLocation, setPreviewLocation] = useState<TimelineLocation | null>(null);
  const [timeline, setTimeline] = useState<TimelineLocation[]>([]);
  const [activeTab, setActiveTab] = useState<'locations' | 'timeline' | 'preview' | 'feedback'>('locations');
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const handleLocationSelect = (location: Location) => {
    if (locations.length >= 6) {
      alert('Maximum of 6 locations allowed');
      return;
    }
    if (!locations.find(loc => loc.id === location.id)) {
      setLocations(prev => [...prev, location]);
    }
  };

  const handleLocationRemove = (locationId: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== locationId));
    setTimeline(prev => prev.filter(loc => loc.id !== locationId));
  };

  const handleTimelineChange = (newTimeline: TimelineLocation[]) => {
    setTimeline(newTimeline);
  };

  const handlePreview = (previewTimeline: TimelineLocation[]) => {
    let currentIndex = 0;

    const animate = () => {
      if (currentIndex >= previewTimeline.length) {
        setPreviewLocation(null);
        return;
      }

      const location = previewTimeline[currentIndex];
      setPreviewLocation(location);

      setTimeout(() => {
        currentIndex++;
        animate();
      }, location.duration * 1000);
    };

    animate();
  };

  const handleFeedbackSubmit = (feedback: { rating: number; comment: string }) => {
    console.log('Feedback received:', feedback);
    // Here you would typically send this to your backend
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">Missing API Key</h1>
          <p className="text-red-600 max-w-md mx-auto">
            Please add your Google Maps API key to the .env file as VITE_GOOGLE_MAPS_API_KEY
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <MapPin className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Street View Video Maker</h1>
            </div>
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('locations')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  activeTab === 'locations'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span>Locations</span>
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  activeTab === 'timeline'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Timeline</span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  activeTab === 'preview'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Preview & Export</span>
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  activeTab === 'feedback'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Feedback</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-600">Progress</h2>
            <span className="text-sm text-gray-500">
              {locations.length} of 6 locations added
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(locations.length / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {activeTab === 'locations' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <LocationSearch onLocationFound={handleLocationSelect} />
                <LocationForm 
                  onLocationAdd={handleLocationSelect}
                  onLocationRemove={handleLocationRemove}
                  locations={locations}
                />
              </div>
              <div className="space-y-4">
                <Map
                  apiKey={apiKey}
                  locations={locations}
                  onLocationSelect={handleLocationSelect}
                  onLocationRemove={handleLocationRemove}
                  previewLocation={previewLocation}
                />
                <p className="text-sm text-gray-500 text-center">
                  Click on the map to add custom locations or use the search to find places
                </p>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <TimelineEditor
              locations={locations}
              onTimelineChange={handleTimelineChange}
              onPreview={handlePreview}
            />
          )}

          {activeTab === 'preview' && (
            <div className="space-y-8">
              <VideoRenderer
                timeline={timeline}
                onRenderComplete={(blob) => console.log('Video rendering complete:', blob.size)}
              />
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="max-w-2xl mx-auto">
              <Feedback onSubmit={handleFeedbackSubmit} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>Create beautiful video journeys from Street View locations</p>
            <p className="mt-1">© {new Date().getFullYear()} Street View Video Maker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}