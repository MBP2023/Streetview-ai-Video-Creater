import React, { useRef, useState } from 'react';
import { Download, Video, Loader2 } from 'lucide-react';

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

interface VideoRendererProps {
  timeline: TimelineLocation[];
  onRenderComplete?: (videoBlob: Blob) => void;
}

export default function VideoRenderer({ timeline, onRenderComplete }: VideoRendererProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const renderVideo = async () => {
    if (!canvasRef.current || timeline.length === 0) return;

    setIsRendering(true);
    setProgress(0);
    setVideoBlob(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const stream = canvas.captureStream(30); // 30 FPS
    const chunks: BlobPart[] = [];

    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000 // 5 Mbps
    });

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoBlob(blob);
      setIsRendering(false);
      if (onRenderComplete) {
        onRenderComplete(blob);
      }
    };

    // Start recording
    mediaRecorderRef.current.start();

    // Render each location
    for (let i = 0; i < timeline.length; i++) {
      const location = timeline[i];
      
      // Fetch Street View image
      const image = await fetchStreetViewImage(
        location.location.lat,
        location.location.lng,
        {
          heading: location.heading,
          pitch: location.pitch,
          zoom: location.zoom
        }
      );

      // Draw the image with transition
      await renderLocationWithTransition(ctx, image, location);
      
      setProgress(((i + 1) / timeline.length) * 100);
    }

    // Stop recording
    mediaRecorderRef.current.stop();
  };

  const fetchStreetViewImage = async (
    lat: number,
    lng: number,
    options: { heading: number; pitch: number; zoom: number }
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      
      const params = new URLSearchParams({
        size: '640x640',
        location: `${lat},${lng}`,
        heading: options.heading.toString(),
        pitch: options.pitch.toString(),
        fov: (90 / options.zoom).toString(),
        key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      });

      img.src = `https://maps.googleapis.com/maps/api/streetview?${params}`;
    });
  };

  const renderLocationWithTransition = async (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    location: TimelineLocation
  ): Promise<void> => {
    const fps = 30;
    const frames = location.duration * fps;
    
    for (let frame = 0; frame < frames; frame++) {
      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Calculate transition progress
      const progress = frame / frames;
      
      // Apply zoom effect
      const scale = 1 + (location.zoom - 1) * progress;
      const x = (ctx.canvas.width - image.width * scale) / 2;
      const y = (ctx.canvas.height - image.height * scale) / 2;

      // Draw image with current scale
      ctx.save();
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
      ctx.drawImage(image, x, y, image.width, image.height);
      ctx.restore();

      // Wait for next frame
      await new Promise(resolve => setTimeout(resolve, 1000 / fps));
    }
  };

  const handleDownload = () => {
    if (!videoBlob) return;

    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'street-view-journey.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        width={640}
        height={640}
        className="hidden"
      />

      <div className="flex items-center gap-4">
        <button
          onClick={renderVideo}
          disabled={isRendering || timeline.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isRendering
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } transition-colors`}
        >
          {isRendering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Rendering...
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              Render Video
            </>
          )}
        </button>

        {videoBlob && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Video
          </button>
        )}
      </div>

      {isRendering && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            Rendering: {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
}