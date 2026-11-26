import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  FileScan,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { PRODUCT_CATEGORIES, ProductCategory } from '../types';
import { SamplePhotoThumbnail } from './SamplePhotoThumbnail';

export interface ScannedReceiptData {
  sampleId: string;
  productDetail: string;
  category?: ProductCategory;
  testItem?: string;
  notes?: string;
}

interface ReceiptScannerBoxProps {
  onApplyScannedData: (data: ScannedReceiptData) => void;
  onPreviewReceipt?: (url: string, title: string, caption?: string) => void;
}

function resizeReceiptImage(
  file: File
): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(
        new Error('이미지 파일(JPG, PNG, WEBP)만 스캔할 수 있습니다.')
      );
      return;
    }

    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error('접수증 파일을 읽는 중 오류가 발생했습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () =>
        reject(new Error('올바른 이미지 형식이 아닙니다.'));
      img.onload = () => {
        const maxDim = 1400;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('이미지 변환에 실패했습니다.'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.9),
          mimeType: 'image/jpeg',
        });
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

async function createSampleReceiptPng(): Promise<{
  dataUrl: string;
  mimeType: string;
}> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 560;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('예시 접수증 이미지 생성에 실패했습니다.');
  }

  const font =
    '"IBM Plex Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 외곽 문서 테두리
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, 844, 504);

  ctx.fillStyle = '#475569';
  ctx.font = `600 18px ${font}`;
  ctx.textAlign = 'center';
  ctx.fillText('세종특별자치시 보건환경연구원 축산물분석과', 450, 68);

  ctx.fillStyle = '#0f172a';
  ctx.font = `700 30px ${font}`;
  ctx.fillText('축산물 위생·안전성 검사 시료 접수증 (예시)', 450, 110);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(56, 134);
  ctx.lineTo(844, 134);
  ctx.stroke();

  const rows: Array<[string, string]> = [
    ['시료번호', '2026-축산-019'],
    ['축산물 유형', '식육'],
    ['세부 품목명', '한우 채끝 (냉장)'],
    ['의뢰 검사항목', '옥시테트라사이클린(테스트예시)'],
    ['채취 · 의뢰 일시', '2026-11-25 14:20'],
    ['특이사항(메모)', '도축장 정기 수거 검사 의뢰 시료'],
  ];

  let y = 162;
  const labelW = 210;
  const valW = 578;
  const rowH = 54;
  ctx.textAlign = 'left';

  for (const [label, value] of rows) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(56, y, labelW, rowH);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(56, y, labelW, rowH);
    ctx.strokeRect(56 + labelW, y, valW, rowH);

    ctx.fillStyle = '#334155';
    ctx.font = `600 18px ${font}`;
    ctx.fillText(label, 74, y + 34);

    ctx.fillStyle = '#0f172a';
    ctx.font = `700 20px ${font}`;
    ctx.fillText(value, 56 + labelW + 18, y + 34);

    y += rowH;
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    mimeType: 'image/png',
  };
}

export function ReceiptScannerBox({
  onApplyScannedData,
  onPreviewReceipt,
}: ReceiptScannerBoxProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [lastResult, setLastResult] = useState<ScannedReceiptData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const runScan = async (dataUrl: string, mimeType: string) => {
    setIsScanning(true);
    setErrorMsg('');
    setLastResult(null);
    setReceiptUrl(dataUrl);

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType,
        }),
      });

      const payload = (await response.json()) as Partial<
        ScannedReceiptData & { error?: string }
      >;

      if (!response.ok) {
        throw new Error(
          payload.error || '시료 접수증 판독 요청 처리에 실패했습니다.'
        );
      }

      const validCategory = PRODUCT_CATEGORIES.includes(
        payload.category as ProductCategory
      )
        ? (payload.category as ProductCategory)
        : undefined;

      const scanned: ScannedReceiptData = {
        sampleId: typeof payload.sampleId === 'string' ? payload.sampleId : '',
        productDetail:
          typeof payload.productDetail === 'string'
            ? payload.productDetail
            : '',
        category: validCategory,
        testItem:
          typeof payload.testItem === 'string' ? payload.testItem : '',
        notes: typeof payload.notes === 'string' ? payload.notes : '',
      };

      setLastResult(scanned);
      if (!scanned.sampleId && !scanned.productDetail) {
        setErrorMsg(
          '이미지에서 시료번호 또는 세부 품목명을 찾지 못했습니다. 글자가 선명한 접수증 이미지로 다시 스캔해 주세요.'
        );
        return;
      }

      onApplyScannedData(scanned);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : '시료 접수증 스캔 중 오류가 발생했습니다.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleFile = async (file: File) => {
    try {
      const { dataUrl, mimeType } = await resizeReceiptImage(file);
      await runScan(dataUrl, mimeType);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : '파일 처리 중 오류가 발생했습니다.'
      );
    }
  };

  const handleTestSampleReceipt = async () => {
    try {
      const { dataUrl, mimeType } = await createSampleReceiptPng();
      await runScan(dataUrl, mimeType);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : '예시 접수증 스캔 실행 중 오류가 발생했습니다.'
      );
    }
  };

  const handleClear = () => {
    setReceiptUrl('');
    setLastResult(null);
    setErrorMsg('');
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
          void handleFile(file);
        }
      }}
      className={`rounded-lg border px-4 py-3 transition-colors ${
        isDragging
          ? 'border-slate-800 bg-slate-100'
          : 'border-slate-200 bg-slate-50/80'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
        className="hidden"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700">
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileScan className="h-4 w-4" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              시료 접수증 스캔 자동 입력
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              시료 접수증 사진이나 스캔 이미지를 올리면 시료번호와 세부 품목명(필요 시 검사항목)을 자동으로 채워 넣습니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isScanning}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            {isScanning ? '접수증 판독 중...' : '접수증 스캔 업로드'}
          </button>

          <button
            type="button"
            disabled={isScanning}
            onClick={() => void handleTestSampleReceipt()}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            예시 접수증으로 테스트
          </button>
        </div>
      </div>

      {/* 스캔 결과 또는 진행/오류 피드백 */}
      {(receiptUrl || errorMsg) && (
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {receiptUrl && (
              <SamplePhotoThumbnail
                src={receiptUrl}
                alt="스캔된 시료 접수증"
                onClick={
                  onPreviewReceipt
                    ? () =>
                        onPreviewReceipt(
                          receiptUrl,
                          '스캔된 시료 접수증',
                          lastResult
                            ? `인식 결과 — 시료번호: ${lastResult.sampleId || '-'} / 세부품목명: ${lastResult.productDetail || '-'}`
                            : undefined
                        )
                    : undefined
                }
                className="h-11 w-16 shrink-0"
              />
            )}

            <div className="min-w-0 text-xs">
              {isScanning && (
                <span className="font-medium text-slate-700">
                  접수증에서 시료번호와 세부 품목명을 판독하고 있습니다...
                </span>
              )}

              {!isScanning && errorMsg && (
                <span role="alert" className="font-medium text-rose-700">
                  {errorMsg}
                </span>
              )}

              {!isScanning && !errorMsg && lastResult && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-emerald-800">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    자동 입력 완료:
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    시료번호 {lastResult.sampleId || '미인식'}
                  </span>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  <span className="font-semibold text-slate-900">
                    세부 품목명 {lastResult.productDetail || '미인식'}
                  </span>
                  {lastResult.testItem && (
                    <>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className="text-slate-700">
                        검사항목 {lastResult.testItem}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {!isScanning && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="스캔 결과 닫기"
              className="self-end rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 sm:self-center cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
