import { useEffect, useState } from 'react';
import { ImageOff, X } from 'lucide-react';
import { JudgmentStatus } from '../types';
import { StatusBadge } from './StatusBadge';

export interface PhotoModalPayload {
  url: string;
  title: string;
  caption?: string;
  status?: JudgmentStatus;
  badgeText?: string;
}

interface PhotoModalProps {
  photo: PhotoModalPayload | null;
  onClose: () => void;
}

export function PhotoModal({ photo, onClose }: PhotoModalProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [photo?.url]);

  useEffect(() => {
    if (!photo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, onClose]);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {photo.status && <StatusBadge status={photo.status} compact />}
            {!photo.status && photo.badgeText && (
              <span className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
                {photo.badgeText}
              </span>
            )}
            <h3
              id="photo-modal-title"
              className="truncate text-sm font-bold text-slate-900"
            >
              {photo.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="사진 창 닫기"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-slate-950 p-3">
          {hasError ? (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded bg-slate-900 text-slate-400">
              <ImageOff className="h-8 w-8" aria-hidden="true" />
              <p className="mt-2 text-xs">이미지를 불러올 수 없습니다.</p>
            </div>
          ) : (
            <img
              src={photo.url}
              alt={photo.title}
              referrerPolicy="no-referrer"
              onError={() => setHasError(true)}
              className="mx-auto max-h-[68vh] w-auto rounded object-contain"
            />
          )}
        </div>

        {photo.caption && (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs leading-relaxed text-slate-700">
            {photo.caption}
          </div>
        )}
      </div>
    </div>
  );
}
