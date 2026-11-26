import { useState } from 'react';
import { ImageOff, ZoomIn } from 'lucide-react';

interface SamplePhotoThumbnailProps {
  src: string;
  alt: string;
  onClick?: () => void;
  className?: string;
}

export function SamplePhotoThumbnail({
  src,
  alt,
  onClick,
  className = 'h-12 w-16',
}: SamplePhotoThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded border border-slate-200 bg-slate-100 text-slate-400 ${className}`}
        title={alt}
      >
        <ImageOff className="h-4 w-4" aria-hidden="true" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded border border-slate-200 bg-slate-100 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${className}`}
      title={onClick ? `${alt} (클릭하여 확대)` : alt}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-105"
      />
      {onClick && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors group-hover:bg-slate-900/35">
          <ZoomIn
            className="h-4 w-4 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </span>
      )}
    </button>
  );
}
