import React, { useRef, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { REFERENCE_INSPECTION_PHOTOS } from '../utils/evaluation';
import { SamplePhotoThumbnail } from './SamplePhotoThumbnail';

interface PhotoUploadBoxProps {
  photoUrl?: string;
  photoCaption?: string;
  onChangePhoto: (photoUrl?: string, photoCaption?: string) => void;
  onPreviewPhoto?: (url: string, title: string, caption?: string) => void;
  title?: string;
  helperText?: string;
  compact?: boolean;
  showPresets?: boolean;
}

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('이미지 파일(JPG, PNG, WEBP 등)만 업로드할 수 있습니다.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('올바른 이미지 형식이 아닙니다.'));
      img.onload = () => {
        const maxDim = 840;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('이미지 처리에 실패했습니다.'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoUploadBox({
  photoUrl,
  photoCaption = '',
  onChangePhoto,
  onPreviewPhoto,
  title = '부적합 · 검사 증빙 사진 업로드',
  helperText = '사진 파일을 이 박스 안으로 끌어다 놓거나 클릭하여 업로드하세요. (JPG, PNG)',
  compact = false,
  showPresets = false,
}: PhotoUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFile = async (file: File) => {
    setErrorMsg('');
    setIsProcessing(true);
    try {
      const dataUrl = await compressImageFile(file);
      onChangePhoto(dataUrl, photoCaption.trim() || file.name);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : '사진 업로드에 실패했습니다.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {!photoUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-rose-500 bg-rose-50/70'
              : 'border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-50'
          } ${compact ? 'px-3.5 py-3' : 'px-4 py-4'}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-3 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600">
                <ImagePlus className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800">
                  {isProcessing ? '이미지 처리 중...' : title}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {helperText}
                </p>
              </div>
            </button>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                사진 파일 선택
              </button>

              {showPresets && (
                <select
                  aria-label="참고 사진 선택"
                  value=""
                  onChange={(e) => {
                    const selected = REFERENCE_INSPECTION_PHOTOS.find(
                      (p) => p.url === e.target.value
                    );
                    if (selected) {
                      onChangePhoto(selected.url, selected.label);
                    }
                  }}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-800 focus:outline-none"
                >
                  <option value="">예시·부적합 참고 사진 선택</option>
                  {REFERENCE_INSPECTION_PHOTOS.map((p) => (
                    <option key={p.id} value={p.url}>
                      [{p.caseType}] {p.label.replace(`${p.caseType} · `, '')}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col gap-3 rounded-lg border bg-white p-3 sm:flex-row sm:items-center sm:justify-between ${
            isDragging ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SamplePhotoThumbnail
              src={photoUrl}
              alt={photoCaption || title}
              onClick={
                onPreviewPhoto
                  ? () =>
                      onPreviewPhoto(
                        photoUrl,
                        title,
                        photoCaption || '첨부된 증빙 사진'
                      )
                  : undefined
              }
              className="h-14 w-20 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-slate-500">
                첨부된 사진 설명 (PDF 캡션 반영)
              </div>
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => onChangePhoto(photoUrl, e.target.value)}
                placeholder="예: XLD 배지 양성 집락, 크로마토그램 피크 초과 등"
                className="mt-1 w-full rounded border border-slate-300 bg-slate-50/50 px-2.5 py-1 text-xs text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
            >
              <Upload className="h-3 w-3" aria-hidden="true" />
              사진 교체
            </button>
            <button
              type="button"
              onClick={() => onChangePhoto(undefined, undefined)}
              aria-label="첨부 사진 삭제"
              className="inline-flex items-center gap-1 rounded border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 whitespace-nowrap cursor-pointer"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              삭제
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <p role="alert" className="text-xs font-medium text-rose-700">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
