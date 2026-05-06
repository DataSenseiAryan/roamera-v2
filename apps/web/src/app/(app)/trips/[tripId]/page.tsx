'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, Plus, Users, Share2, Download, Loader2, MapPin, Copy, X,
  Calendar, DollarSign, Package, MessageCircle,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useTripQuery,
  useDaysQuery,
  usePlacesQuery,
  useAssignmentsQuery,
  useCreateDay,
  useCreateAssignment,
  useMoveAssignment,
  useReorderAssignment,
  useDeleteAssignment,
  useDeletePlace,
  getApiClient,
} from '@roamera/sdk';
import type { Assignment, Day, TripPlace } from '@roamera/types';
import { PlaceCard } from '@/components/trips/place-card';
import { AddPlacePanel } from '@/components/trips/add-place';
import { MembersModal } from '@/components/trips/members-modal';
import { WeatherWidget } from '@/components/trips/weather-widget';
import { BudgetPanel } from '@/components/trips/budget/budget-panel';
import { PackingPanel } from '@/components/trips/packing/packing-panel';
import { CollabPanel } from '@/components/trips/collab/collab-panel';

// Load Leaflet dynamically (SSR-safe)
const TripMap = dynamic(() => import('@/components/trips/trip-map'), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800 rounded-xl">
    <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
  </div>
) });

// ─── Sortable Place Item ────────────────────────────────────────────

function SortablePlaceItem({
  assignment,
  place,
  canEdit,
  isSelected,
  onSelect,
  onDelete,
}: {
  assignment: Assignment;
  place: TripPlace;
  canEdit: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: assignment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <PlaceCard
        place={place}
        assignment={assignment}
        canEdit={canEdit}
        isSelected={isSelected}
        isDragging={isDragging}
        onSelect={onSelect}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// ─── Day Column ─────────────────────────────────────────────────────

function DayColumn({
  day,
  assignments,
  places,
  canEdit,
  selectedPlaceId,
  tripId,
  onSelectPlace,
  onAddPlace,
}: {
  day: Day;
  assignments: Assignment[];
  places: TripPlace[];
  canEdit: boolean;
  selectedPlaceId: string | null;
  tripId: string;
  onSelectPlace: (placeId: string) => void;
  onAddPlace: (dayId: string) => void;
}) {
  const dayAssignments = assignments.filter((a) => a.dayId === day.id).sort((a, b) => a.orderIndex - b.orderIndex);
  const placeMap = new Map(places.map((p) => [p.id, p]));
  const deleteAssignment = useDeleteAssignment();

  // Extract coordinates for weather
  const firstAssignedPlace = dayAssignments.map((a) => placeMap.get(a.placeId)).find((p) => p?.lat && p?.lng);
  const weatherLat = firstAssignedPlace?.lat ?? null;
  const weatherLng = firstAssignedPlace?.lng ?? null;
  const dayDate = day.date ? new Date(day.date).toISOString().split('T')[0] : undefined;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
      {/* Day header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-teal-100 uppercase tracking-wider">Day {day.dayNumber}</p>
            <h3 className="font-bold text-white text-sm mt-0.5">{day.title}</h3>
            {day.date && (
              <p className="text-xs text-teal-200 mt-0.5">
                {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
          {canEdit && (
            <button
              onClick={() => onAddPlace(day.id)}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              <Plus className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Weather for this day */}
      {weatherLat && weatherLng && (
        <div className="px-3 pt-3">
          <WeatherWidget lat={weatherLat} lng={weatherLng} date={dayDate} />
        </div>
      )}

      {/* Places list */}
      <div className="p-3 space-y-2">
        <SortableContext items={dayAssignments.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {dayAssignments.map((assign) => {
            const place = placeMap.get(assign.placeId);
            if (!place) return null;
            return (
              <SortablePlaceItem
                key={assign.id}
                assignment={assign}
                place={place}
                canEdit={canEdit}
                isSelected={selectedPlaceId === place.id}
                onSelect={() => onSelectPlace(place.id)}
                onDelete={() => deleteAssignment.mutate({ tripId, assignmentId: assign.id })}
              />
            );
          })}
        </SortableContext>

        {dayAssignments.length === 0 && (
          <div className="text-center py-4 text-sm text-slate-400 dark:text-slate-500">
            {canEdit ? (
              <button onClick={() => onAddPlace(day.id)} className="text-teal-600 hover:underline text-xs">
                + Add a place
              </button>
            ) : 'No places yet'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

export default function TripDetailPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);

  const { data: tripData, isLoading: tripLoading } = useTripQuery(tripId);
  const { data: days = [] } = useDaysQuery(tripId);
  const { data: places = [] } = usePlacesQuery(tripId);
  const { data: assignments = [] } = useAssignmentsQuery(tripId);

  const createDay = useCreateDay();
  const createAssignment = useCreateAssignment();
  const moveAssignment = useMoveAssignment();
  const reorderAssignment = useReorderAssignment();
  const deletePlace = useDeletePlace();

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'add' | 'detail' | null>(null);
  const [addForDayId, setAddForDayId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'packing' | 'collab'>('itinerary');

  const trip = tripData?.trip;
  const canEdit = trip?.myRole === 'owner' || trip?.myRole === 'editor';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeAssignment = assignments.find((a) => a.id === active.id);
    const overAssignment = assignments.find((a) => a.id === over.id);

    if (!activeAssignment || !overAssignment) return;

    if (activeAssignment.dayId !== overAssignment.dayId) {
      await moveAssignment.mutateAsync({
        tripId,
        assignmentId: activeAssignment.id,
        data: { targetDayId: overAssignment.dayId, orderIndex: overAssignment.orderIndex },
      });
    } else {
      await reorderAssignment.mutateAsync({
        tripId,
        assignmentId: activeAssignment.id,
        orderIndex: overAssignment.orderIndex,
      });
    }
  }, [assignments, tripId, moveAssignment, reorderAssignment]);

  const handleAddDay = async () => {
    await createDay.mutateAsync({ tripId, data: {} });
  };

  const handlePlaceAdded = useCallback(async (placeId: string) => {
    if (!addForDayId) return;
    const dayAssignments = assignments.filter((a) => a.dayId === addForDayId);
    await createAssignment.mutateAsync({
      tripId,
      data: { dayId: addForDayId, placeId, orderIndex: dayAssignments.length },
    });
    setActivePanel(null);
    setAddForDayId(null);
  }, [addForDayId, assignments, createAssignment, tripId]);

  const handleShare = async () => {
    try {
      const res = await getApiClient().post<{ shareToken: string }>(`/api/v1/trips/${tripId}/share`);
      const url = `${window.location.origin}/trips/shared/${res.data.shareToken}`;
      setShareUrl(url);
    } catch { /* ignore */ }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
    }
  };

  const selectedPlace = places.find((p) => p.id === selectedPlaceId);

  if (tripLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Trip not found</h2>
        <Link href="/trips" className="text-teal-600 hover:underline mt-2 block">← Back to Trips</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/trips" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-1">
            <ArrowLeft className="h-4 w-4" /> All Trips
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">{trip.title}</h1>
          {trip.dateFrom && trip.dateTo && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {new Date(trip.dateFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} –{' '}
              {new Date(trip.dateTo).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowMembers(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Members</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <a
            href={`/api/v1/trips/${tripId}/export/ics`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">ICS</span>
          </a>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit flex-wrap">
        {([
          { id: 'itinerary' as const, label: 'Itinerary', icon: Calendar },
          { id: 'budget' as const, label: 'Budget', icon: DollarSign },
          { id: 'packing' as const, label: 'Packing', icon: Package },
          { id: 'collab' as const, label: 'Collab', icon: MessageCircle },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {shareUrl && (
        <div className="flex items-center gap-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl px-4 py-3">
          <MapPin className="h-4 w-4 text-teal-600 flex-shrink-0" />
          <p className="text-sm text-teal-800 dark:text-teal-300 truncate flex-1">{shareUrl}</p>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline"
          >
            <Copy className="h-3.5 w-3.5" />
            {copySuccess ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={() => setShareUrl(null)}>
            <X className="h-4 w-4 text-teal-600" />
          </button>
        </div>
      )}

      {activeTab === 'itinerary' && (
      <div className="flex gap-4 min-h-[calc(100vh-220px)]">
        {/* Left panel: day list */}
        <div className="w-72 flex-shrink-0 overflow-y-auto space-y-3 pb-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {days.map((day) => (
              <DayColumn
                key={day.id}
                day={day}
                assignments={assignments}
                places={places}
                canEdit={canEdit}
                selectedPlaceId={selectedPlaceId}
                tripId={tripId}
                onSelectPlace={(pid) => { setSelectedPlaceId(pid); setActivePanel('detail'); }}
                onAddPlace={(did) => { setAddForDayId(did); setActivePanel('add'); }}
              />
            ))}
          </DndContext>

          {canEdit && (
            <button
              onClick={handleAddDay}
              disabled={createDay.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 hover:border-teal-400 hover:text-teal-600 transition"
            >
              {createDay.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Day
            </button>
          )}
        </div>

        {/* Center panel: map */}
        <div className="flex-1 min-w-0 rounded-2xl overflow-hidden" style={{ minHeight: 400 }}>
          <TripMap
            places={places}
            selectedPlaceId={selectedPlaceId}
            onPlaceClick={(id) => { setSelectedPlaceId(id); setActivePanel('detail'); }}
          />
        </div>

        {/* Right panel: place detail or add-place form */}
        {activePanel && (
          <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 overflow-y-auto">
            {activePanel === 'add' && (
              <AddPlacePanel
                tripId={tripId}
                dayId={addForDayId ?? undefined}
                onPlaceAdded={handlePlaceAdded}
                onClose={() => setActivePanel(null)}
              />
            )}

            {activePanel === 'detail' && selectedPlace && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{selectedPlace.name}</h3>
                  <button onClick={() => setActivePanel(null)}>
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>

                {selectedPlace.address && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-1">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    {selectedPlace.address}
                  </p>
                )}

                {selectedPlace.notes && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                    {selectedPlace.notes}
                  </p>
                )}

                {selectedPlace.website && (
                  <a
                    href={selectedPlace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-teal-600 hover:underline truncate"
                  >
                    {selectedPlace.website}
                  </a>
                )}

                {selectedPlace.lat && selectedPlace.lng && (
                  <p className="text-xs text-slate-400">
                    {selectedPlace.lat.toFixed(5)}, {selectedPlace.lng.toFixed(5)}
                  </p>
                )}

                {canEdit && (
                  <button
                    onClick={() => {
                      deletePlace.mutate({ tripId, placeId: selectedPlace.id });
                      setSelectedPlaceId(null);
                      setActivePanel(null);
                    }}
                    className="text-sm text-red-500 hover:text-red-700 transition"
                  >
                    Remove place
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {activeTab === 'budget' && (
        <div className="min-h-[calc(100vh-220px)] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden overflow-y-auto">
          <BudgetPanel tripId={tripId} canEdit={canEdit} myRole={trip.myRole} />
        </div>
      )}

      {activeTab === 'packing' && (
        <div className="min-h-[calc(100vh-220px)] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden overflow-y-auto">
          <PackingPanel tripId={tripId} canEdit={canEdit} myRole={trip.myRole} />
        </div>
      )}

      {activeTab === 'collab' && (
        <div className="h-full min-h-[calc(100vh-220px)] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <CollabPanel tripId={tripId} canEdit={canEdit} />
        </div>
      )}

      {showMembers && trip.myRole && (
        <MembersModal tripId={tripId} myRole={trip.myRole} onClose={() => setShowMembers(false)} />
      )}
    </div>
  );
}
