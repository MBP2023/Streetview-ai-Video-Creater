import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { TimelineItem } from './TimelineItem';
import PanoramaPreview from './PanoramaPreview';
import { Clock, Play, Pause, Save } from 'lucide-react';

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

interface TimelineEditorProps {
  locations: Location[];
  onTimelineChange: (timeline: TimelineLocation[]) => void;
  onPreview: (timeline: TimelineLocation[]) => void;
}

export default function TimelineEditor({
  locations,
  onTimelineChange,
  onPreview
}: TimelineEditorProps) {
  const [timelineItems, setTimelineItems] = useState<TimelineLocation[]>(
    locations.map(location => ({
      ...location,
      duration: 7,
      heading: 0,
      pitch: 0,
      zoom: 1
    }))
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTimelineItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        onTimelineChange(newItems);
        return newItems;
      });
    }
  };

  const handleDurationChange = (id: string, duration: number) => {
    setTimelineItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, duration: Math.max(5, Math.min(15, duration)) } : item
      )
    );
  };

  const handleHeadingChange = (id: string, heading: number) => {
    setTimelineItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, heading: Math.max(0, Math.min(360, heading)) } : item
      )
    );
  };

  const handlePitchChange = (id: string, pitch: number) => {
    setTimelineItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, pitch: Math.max(-90, Math.min(90, pitch)) } : item
      )
    );
  };

  const handleZoomChange = (id: string, zoom: number) => {
    setTimelineItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, zoom: Math.max(0.5, Math.min(2, zoom)) } : item
      )
    );
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setCurrentPreviewIndex(null);
    } else {
      setIsPlaying(true);
      setCurrentPreviewIndex(0);
      onPreview(timelineItems);
    }
  };

  const handleNext = () => {
    if (currentPreviewIndex !== null && currentPreviewIndex < timelineItems.length - 1) {
      setCurrentPreviewIndex(currentPreviewIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPreviewIndex !== null && currentPreviewIndex > 0) {
      setCurrentPreviewIndex(currentPreviewIndex - 1);
    }
  };

  const handleTransitionComplete = () => {
    if (isPlaying && currentPreviewIndex !== null) {
      if (currentPreviewIndex < timelineItems.length - 1) {
        setCurrentPreviewIndex(currentPreviewIndex + 1);
      } else {
        setIsPlaying(false);
        setCurrentPreviewIndex(null);
      }
    }
  };

  const getTotalDuration = () => {
    return timelineItems.reduce((total, item) => total + item.duration, 0);
  };

  return (
    <div className="space-y-8">
      <PanoramaPreview
        currentLocation={currentPreviewIndex !== null ? timelineItems[currentPreviewIndex] : null}
        isPlaying={isPlaying}
        onTransitionComplete={handleTransitionComplete}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onPlayPause={handlePlayPause}
        totalLocations={timelineItems.length}
        currentIndex={currentPreviewIndex ?? 0}
      />

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Timeline Editor</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Total Duration: {getTotalDuration()}s
            </div>
            <button
              onClick={handlePlayPause}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Stop Preview
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Preview
                </>
              )}
            </button>
            <button
              onClick={() => onTimelineChange(timelineItems)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Timeline
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={timelineItems}
              strategy={verticalListSortingStrategy}
            >
              {timelineItems.map((item, index) => (
                <TimelineItem
                  key={item.id}
                  item={item}
                  index={index}
                  isActive={currentPreviewIndex === index}
                  onDurationChange={handleDurationChange}
                  onHeadingChange={handleHeadingChange}
                  onPitchChange={handlePitchChange}
                  onZoomChange={handleZoomChange}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {timelineItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Add locations to start building your timeline
          </div>
        )}
      </div>
    </div>
  );
}