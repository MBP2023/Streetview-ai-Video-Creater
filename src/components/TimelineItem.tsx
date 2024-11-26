import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Compass, Camera } from 'lucide-react';

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

interface TimelineItemProps {
  item: TimelineLocation;
  index: number;
  isActive: boolean;
  onDurationChange: (id: string, duration: number) => void;
  onHeadingChange: (id: string, heading: number) => void;
  onPitchChange: (id: string, pitch: number) => void;
  onZoomChange: (id: string, zoom: number) => void;
}

export function TimelineItem({
  item,
  index,
  isActive,
  onDurationChange,
  onHeadingChange,
  onPitchChange,
  onZoomChange
}: TimelineItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white border rounded-lg p-4 ${
        isActive ? 'ring-2 ring-blue-500' : ''
      } ${isDragging ? 'shadow-lg' : 'shadow-sm'}`}
    >
      <div className="flex items-start gap-4">
        <button
          className="mt-2 cursor-move touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </button>

        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">
              {index + 1}. {item.name}
            </h3>
            <p className="text-sm text-gray-500">{item.address}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4" />
                Duration (s)
              </label>
              <input
                type="number"
                value={item.duration}
                onChange={(e) => onDurationChange(item.id, Number(e.target.value))}
                min="5"
                max="15"
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Compass className="w-4 h-4" />
                Heading (°)
              </label>
              <input
                type="number"
                value={item.heading}
                onChange={(e) => onHeadingChange(item.id, Number(e.target.value))}
                min="0"
                max="360"
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Camera className="w-4 h-4" />
                Pitch (°)
              </label>
              <input
                type="number"
                value={item.pitch}
                onChange={(e) => onPitchChange(item.id, Number(e.target.value))}
                min="-90"
                max="90"
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Camera className="w-4 h-4" />
                Zoom
              </label>
              <input
                type="number"
                value={item.zoom}
                onChange={(e) => onZoomChange(item.id, Number(e.target.value))}
                min="0.5"
                max="2"
                step="0.1"
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}