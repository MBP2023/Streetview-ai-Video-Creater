import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Maximize2, Minimize2, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface TimelineLocation {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  duration: number;
  heading: number;
  pitch: number;
  zoom: number;
}

interface PanoramaPreviewProps {
  currentLocation: TimelineLocation | null;
  isPlaying: boolean;
  onTransitionComplete?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onPlayPause?: () => void;
  totalLocations: number;
  currentIndex: number;
}

function PanoramaSphere({ url, rotation, zoom }: { 
  url: string; 
  rotation: THREE.Euler;
  zoom: number;
}) {
  const texture = useLoader(THREE.TextureLoader, url);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.copy(rotation);
    }
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }, [rotation, zoom, camera]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function Scene({ currentLocation, isPlaying }: { 
  currentLocation: TimelineLocation;
  isPlaying: boolean;
}) {
  const panoramaUrl = `https://maps.googleapis.com/maps/api/streetview?size=2048x1024&location=${
    currentLocation.location.lat
  },${currentLocation.location.lng}&heading=${
    currentLocation.heading
  }&pitch=${currentLocation.pitch}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;

  const rotation = new THREE.Euler(
    THREE.MathUtils.degToRad(currentLocation.pitch),
    THREE.MathUtils.degToRad(currentLocation.heading),
    0,
    'YXZ'
  );

  return (
    <>
      <PanoramaSphere 
        url={panoramaUrl} 
        rotation={rotation} 
        zoom={currentLocation.zoom} 
      />
      <OrbitControls 
        enableZoom={!isPlaying}
        enablePan={!isPlaying}
        enableRotate={!isPlaying}
        autoRotate={isPlaying}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export default function PanoramaPreview({ 
  currentLocation, 
  isPlaying,
  onTransitionComplete,
  onNext,
  onPrevious,
  onPlayPause,
  totalLocations,
  currentIndex
}: PanoramaPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<number>();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (isPlaying && currentLocation) {
      const startTime = Date.now();
      const duration = currentLocation.duration * 1000;

      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(100, (elapsed / duration) * 100);
        setProgress(newProgress);

        if (elapsed >= duration) {
          onTransitionComplete?.();
          return;
        }

        progressInterval.current = requestAnimationFrame(updateProgress);
      };

      progressInterval.current = requestAnimationFrame(updateProgress);

      return () => {
        if (progressInterval.current) {
          cancelAnimationFrame(progressInterval.current);
        }
      };
    } else {
      setProgress(0);
    }
  }, [isPlaying, currentLocation, onTransitionComplete]);

  if (!currentLocation) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">Select a location to preview</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-black' 
          : 'w-full aspect-video'
      }`}
    >
      <Canvas
        camera={{ 
          fov: 75, 
          aspect: 16/9,
          near: 0.1, 
          far: 1000, 
          position: [0, 0, 0.1] 
        }}
        className="w-full h-full rounded-lg overflow-hidden"
      >
        <Scene 
          currentLocation={currentLocation}
          isPlaying={isPlaying}
        />
      </Canvas>

      {/* Controls Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-600 rounded-full mb-4 overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="p-2 text-white/90 hover:text-white disabled:text-white/50 disabled:cursor-not-allowed transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={onPlayPause}
              className="p-2 text-white/90 hover:text-white transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={onNext}
              disabled={currentIndex === totalLocations - 1}
              className="p-2 text-white/90 hover:text-white disabled:text-white/50 disabled:cursor-not-allowed transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-white/90 text-sm">
              {currentIndex + 1} / {totalLocations}
            </span>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white/90 hover:text-white transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-6 h-6" />
              ) : (
                <Maximize2 className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black/50 text-white p-3 rounded-lg max-w-lg">
          <h3 className="font-medium">{currentLocation.name}</h3>
          <p className="text-sm text-gray-300">{currentLocation.address}</p>
        </div>
      </div>
    </div>
  );
}