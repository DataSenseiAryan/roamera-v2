'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, Plus, Trash2, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { useCreatePost } from '@roamera/sdk';
import { getApiClient } from '@roamera/sdk';

interface CreateMomentModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'photos' | 'details' | 'preview';

const VACATION_TYPES = [
  { value: 'leisure', label: 'Leisure' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'workation', label: 'Workation' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'religious', label: 'Religious' },
  { value: 'wildlife', label: 'Wildlife' },
] as const;

const TRANSPORT_MODES = [
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'road_trip', label: 'Road Trip' },
  { value: 'bus', label: 'Bus' },
  { value: 'cruise', label: 'Cruise' },
  { value: 'backpack', label: 'Backpack' },
] as const;

export function CreateMomentModal({ open, onClose }: CreateMomentModalProps) {
  const [step, setStep] = useState<Step>('photos');
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [budgetInr, setBudgetInr] = useState('');
  const [vacationType, setVacationType] = useState('');
  const [transportMode, setTransportMode] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  const resetForm = useCallback(() => {
    setStep('photos');
    setPhotos([]);
    setPreviews([]);
    setTitle('');
    setContent('');
    setDestinationName('');
    setDestinationCountry('');
    setHashtagInput('');
    setHashtags([]);
    setBudgetInr('');
    setVacationType('');
    setTransportMode('');
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);

    setPhotos((prev) => [...prev, ...toAdd]);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag) && hashtags.length < 20) {
      setHashtags((prev) => [...prev, tag]);
      setHashtagInput('');
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) return;
    setIsPublishing(true);

    try {
      const destinations = destinationName.trim()
        ? [{ name: destinationName.trim(), country: destinationCountry.trim() || undefined }]
        : [];

      const post = await createPost.mutateAsync({
        title: title.trim(),
        content: content.trim() || undefined,
        destinations,
        hashtags,
        activities: [],
        budgetInr: budgetInr ? parseInt(budgetInr) : undefined,
        vacationType: (vacationType || undefined) as 'leisure' | 'adventure' | 'workation' | 'cultural' | 'religious' | 'wildlife' | undefined,
        transportMode: (transportMode || undefined) as 'flight' | 'train' | 'road_trip' | 'bus' | 'cruise' | 'backpack' | undefined,
      });

      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((f) => formData.append('photos', f));
        await getApiClient().post(`/api/v1/posts/${post.id}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      resetForm();
      onClose();
    } catch {
      // error handled by mutation
    } finally {
      setIsPublishing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            {step !== 'photos' && (
              <button
                onClick={() => setStep(step === 'preview' ? 'details' : 'photos')}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {step === 'photos' && 'Add Photos'}
              {step === 'details' && 'Moment Details'}
              {step === 'preview' && 'Preview & Publish'}
            </h2>
          </div>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Photos */}
          {step === 'photos' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-teal-400 transition"
              >
                <Upload className="h-10 w-10 mx-auto text-slate-400 mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Click or drag photos here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Up to 5 photos, max 10MB each
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden aspect-square group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center hover:border-teal-400 transition"
                    >
                      <Plus className="h-6 w-6 text-slate-400" />
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => setStep('details')}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 transition flex items-center justify-center gap-2"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 3 Days in Coorg"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your travel experience..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={destinationName}
                    onChange={(e) => setDestinationName(e.target.value)}
                    placeholder="e.g. Coorg"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Budget (INR)
                </label>
                <input
                  type="number"
                  value={budgetInr}
                  onChange={(e) => setBudgetInr(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Vacation Type
                  </label>
                  <select
                    value={vacationType}
                    onChange={(e) => setVacationType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Select...</option>
                    {VACATION_TYPES.map((vt) => (
                      <option key={vt.value} value={vt.value}>{vt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Transport
                  </label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Select...</option>
                    {TRANSPORT_MODES.map((tm) => (
                      <option key={tm.value} value={tm.value}>{tm.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hashtags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    placeholder="#travel"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addHashtag();
                      }
                    }}
                  />
                  <button
                    onClick={addHashtag}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm"
                  >
                    Add
                  </button>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-1 rounded-full"
                      >
                        #{tag}
                        <button
                          onClick={() => setHashtags((prev) => prev.filter((t) => t !== tag))}
                          className="hover:text-red-500 transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep('preview')}
                disabled={!title.trim()}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Preview <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-3">
                {previews.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {previews.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="h-32 rounded-xl object-cover flex-shrink-0"
                      />
                    ))}
                  </div>
                )}

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {title}
                </h3>

                {content && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {content}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  {destinationName && (
                    <span className="bg-white dark:bg-slate-700 px-2 py-1 rounded-lg flex items-center gap-1">
                      📍 {destinationName}{destinationCountry ? `, ${destinationCountry}` : ''}
                    </span>
                  )}
                  {budgetInr && (
                    <span className="bg-white dark:bg-slate-700 px-2 py-1 rounded-lg">
                      ₹{parseInt(budgetInr).toLocaleString('en-IN')}
                    </span>
                  )}
                  {vacationType && (
                    <span className="bg-white dark:bg-slate-700 px-2 py-1 rounded-lg capitalize">
                      {vacationType.replace('_', ' ')}
                    </span>
                  )}
                  {transportMode && (
                    <span className="bg-white dark:bg-slate-700 px-2 py-1 rounded-lg capitalize">
                      {transportMode.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {hashtags.map((tag) => (
                      <span key={tag} className="text-xs text-teal-600 dark:text-teal-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Image className="h-4 w-4" />
                    Publish Moment
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
