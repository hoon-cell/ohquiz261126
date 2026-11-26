import { AlertCircle, CheckCircle2, ZoomIn } from 'lucide-react';
import { ReferencePhotoItem } from '../types';
import { REFERENCE_INSPECTION_PHOTOS } from '../utils/evaluation';
import { PhotoModalPayload } from './PhotoModal';

interface ReferencePhotoGalleryProps {
  onOpenPhoto: (payload: PhotoModalPayload) => void;
}

export function ReferencePhotoGallery({
  onOpenPhoto,
}: ReferencePhotoGalleryProps) {
  const handlePreview = (item: ReferencePhotoItem) => {
    onOpenPhoto({
      url: item.url,
      title: item.label,
      caption: item.description,
      status: item.caseType === '적합 예시' ? '적합' : '부적합',
    });
  };

  return (
    <section
      aria-labelledby="reference-photo-gallery-heading"
      className="rounded-lg border border-slate-200 bg-white p-5"
    >
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="reference-photo-gallery-heading"
            className="text-base font-bold text-slate-900"
          >
            적합 예시 · 부적합 사례 판독 참고 사진
          </h2>
          <p className="text-xs text-slate-500">
            정상(적합) 시료와 기준 초과·양성(부적합) 사례의 시각적 판독 기준을 비교하고 클릭해 확대할 수 있습니다.
          </p>
        </div>
        <span className="text-[11px] text-slate-500">
          ※ 시료 입력 폼에서 참고 사진 또는 현장 촬영 이미지를 첨부할 수 있습니다.
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REFERENCE_INSPECTION_PHOTOS.map((item) => {
          const isNonConforming = item.caseType === '부적합 사례';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePreview(item)}
              className={`group flex flex-col overflow-hidden rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 ${
                isNonConforming
                  ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                  : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
              }`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                <img
                  src={item.url}
                  alt={item.label}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-105"
                />
                <span className="pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded bg-slate-900/75 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <ZoomIn className="h-3 w-3" aria-hidden="true" />
                  확대
                </span>
              </div>

              <div className="flex flex-1 flex-col p-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                      isNonConforming
                        ? 'border border-rose-200 bg-rose-50 text-rose-800'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {isNonConforming ? (
                      <AlertCircle className="h-3 w-3 text-rose-600" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                    )}
                    {item.caseType}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    {item.productCategory}
                  </span>
                </div>

                <h3 className="mt-2 text-xs font-bold text-slate-900">
                  {item.label}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
