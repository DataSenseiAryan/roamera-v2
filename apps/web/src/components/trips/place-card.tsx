'use client';

import { Clock, GripVertical, MapPin, Trash2, Utensils, Hotel, Camera, Bus, ShoppingBag } from 'lucide-react';
import type { Assignment, TripPlace } from '@roamera/types';

interface Props {
  place: TripPlace;
  assignment?: Assignment;
  isSelected?: boolean;
  isDragging?: boolean;
  canEdit?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  restaurant: { icon: <Utensils className="h-3.5 w-3.5" />, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  hotel: { icon: <Hotel className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  attraction: { icon: <Camera className="h-3.5 w-3.5" />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  museum: { icon: <Camera className="h-3.5 w-3.5" />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  transport: { icon: <Bus className="h-3.5 w-3.5" />, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  shopping: { icon: <ShoppingBag className="h-3.5 w-3.5" />, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
};

export function PlaceCard({ place, assignment, isSelected, isDragging, canEdit, onSelect, onDelete, dragHandleProps }: Props) {
  const cat = CATEGORY_CONFIG[place.category ?? ''] ?? {
    icon: <MapPin className="h-3.5 w-3.5" />,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  };

  return (
    <div
      onClick={onSelect}
      className={`flex items-start gap-2 p-3 rounded-xl border transition-all cursor-pointer
        ${isSelected
          ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-600'
          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-200 dark:hover:border-teal-700'
        }
        ${isDragging ? 'opacity-50 shadow-lg scale-95' : 'shadow-sm'}`}
    >
      {/* Drag handle */}
      {canEdit && (
        <div
          {...dragHandleProps}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-400"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Category icon */}
      <div className={`flex-shrink-0 p-1.5 rounded-lg ${cat.color}`}>
        {cat.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{place.name}</p>
        {assignment?.placeTime && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <Clock className="h-3 w-3" />
            {assignment.placeTime}
            {assignment.durationMinutes && ` · ${assignment.durationMinutes}min`}
          </span>
        )}
        {place.address && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{place.address}</p>
        )}
      </div>

      {/* Delete button */}
      {canEdit && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
