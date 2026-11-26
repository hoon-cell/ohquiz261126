import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Edit3,
  EyeOff,
  FileDown,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { EvaluatedSample, ReportHeaderConfig } from '../types';
import {
  formatCriterionRule,
  formatCurrentDateTime,
  generateReportDraft,
  maskSampleId,
} from '../utils/evaluation';
import { exportReportToPdf } from '../utils/pdfExport';
import { PhotoModal, PhotoModalPayload } from './PhotoModal';
import { PhotoUploadBox } from './PhotoUploadBox';
import { StatusBadge } from './StatusBadge';

interface ReportTabProps {
  evaluatedSamples: EvaluatedSample[];
  reportHeader: ReportHeaderConfig;
  onChangeReportHeader: (next: ReportHeaderConfig) => void;
  onResetReportHeader: () => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onUpdatePhoto: (id: string, photoUrl?: string, photoCaption?: string) => void;
  onToggleRecheck: (id: string) => void;
  onGoToInspectionFilter: () => void;
  onNotify: (message: string, tone?: 'success' | 'error') => void;
}

export function ReportTab({
  evaluatedSamples,
  reportHeader,
  onChangeReportHeader,
  onResetReportHeader,
  onUpdateMemo,
  onUpdatePhoto,
  onToggleRecheck,
  onGoToInspectionFilter,
  onNotify,
}: ReportTabProps) {
  const [maskIds, setMaskIds] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(() => formatCurrentDateTime());
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState('');
  const [modalPhoto, setModalPhoto] = useState<PhotoModalPayload | null>(null);

  // 부적합 및 재확인필요 건만 자동 수집 (부적합 우선 정렬)
  const targetSamples = useMemo(() => {
    return evaluatedSamples
      .filter(
        (s) =>
          s.effectiveStatus === '부적합' ||
          s.effectiveStatus === '재확인필요'
      )
      .sort((a, b) => {
        if (a.effectiveStatus === b.effectiveStatus) return 0;
        return a.effectiveStatus === '부적합' ? -1 : 1;
      });
  }, [evaluatedSamples]);

  // 별도로 기준미등록 또는 단위확인필요 건수 확인 (누락 방지 안내용)
  const pendingAdminCount = useMemo(
    () =>
      evaluatedSamples.filter(
        (s) =>
          s.effectiveStatus === '기준미등록' ||
          s.effectiveStatus === '단위확인필요'
      ).length,
    [evaluatedSamples]
  );

  const autoDraft = useMemo(
    () =>
      generateReportDraft(targetSamples, maskIds, generatedAt, reportHeader),
    [targetSamples, maskIds, generatedAt, reportHeader]
  );

  const [draftText, setDraftText] = useState(autoDraft);
  const [isCustomEdited, setIsCustomEdited] = useState(false);

  useEffect(() => {
    if (!isCustomEdited) {
      setDraftText(autoDraft);
    }
  }, [autoDraft, isCustomEdited]);

  const handleResetDraft = () => {
    const now = formatCurrentDateTime();
    setGeneratedAt(now);
    setIsCustomEdited(false);
    setDraftText(
      generateReportDraft(targetSamples, maskIds, now, reportHeader)
    );
  };

  const handleToggleMask = (checked: boolean) => {
    setMaskIds(checked);
    setIsCustomEdited(false);
  };

  const handleHeaderFieldChange = (
    field: keyof ReportHeaderConfig,
    value: string
  ) => {
    onChangeReportHeader({
      ...reportHeader,
      [field]: value,
    });
    setIsCustomEdited(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftText);
      setCopied(true);
      onNotify('보고서 요약 초안이 클립보드에 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = draftText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      onNotify('보고서 요약 초안이 클립보드에 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      const now = formatCurrentDateTime();
      setGeneratedAt(now);
      await exportReportToPdf({
        header: reportHeader,
        targetSamples,
        maskIds,
        generatedAt: now,
      });
      onNotify('정식 문서 포맷 PDF 파일이 생성되어 다운로드되었습니다.');
    } catch {
      onNotify('PDF 파일 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  const nonConformingCount = targetSamples.filter(
    (s) => s.effectiveStatus === '부적합'
  ).length;
  const recheckCount = targetSamples.filter(
    (s) => s.effectiveStatus === '재확인필요'
  ).length;

  return (
    <div className="space-y-6">
      {pendingAdminCount > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>
            현재 시료 목록에 판정 전 확인이 필요한 항목(기준미등록·단위확인필요)이{' '}
            <strong className="font-mono tabular-nums">
              {pendingAdminCount}건
            </strong>{' '}
            있습니다. 기준 대조 후 부적합으로 판정되면 본 요약 목록에 자동 포함됩니다.
          </span>
          <button
            type="button"
            onClick={onGoToInspectionFilter}
            className="rounded border border-amber-300 bg-white px-3 py-1 font-semibold text-amber-900 hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            확인필요 시료 보기
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* 좌측: 부적합 및 재확인필요 대상 시료 목록 */}
        <section
          aria-labelledby="nonconforming-list-heading"
          className="rounded-lg border border-slate-200 bg-white lg:col-span-5"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2
                id="nonconforming-list-heading"
                className="text-base font-bold text-slate-900"
              >
                부적합 및 재확인 필요 시료 모아보기
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                부적합 {nonConformingCount}건 · 재확인필요 {recheckCount}건 (총{' '}
                {targetSamples.length}건)
              </p>
            </div>
          </div>

          {targetSamples.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle
                className="mx-auto h-7 w-7 text-slate-300"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-medium text-slate-700">
                현재 부적합 또는 재확인 필요 시료가 없습니다.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                시료 검사 및 판정 탭에서 부적합 판정되거나 재확인필요로 전환된 건이 자동으로 여기에 모입니다.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {targetSamples.map((sample, idx) => {
                const displayId = maskIds
                  ? maskSampleId(sample.sampleId)
                  : sample.sampleId;

                return (
                  <li key={sample.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-slate-700 tabular-nums">
                            #{idx + 1}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                            {displayId}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700">
                            {sample.category}
                            {sample.productDetail
                              ? ` (${sample.productDetail})`
                              : ''}
                          </span>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {sample.testItem}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={sample.effectiveStatus} />
                        {sample.manualRecheck && (
                          <button
                            type="button"
                            onClick={() => onToggleRecheck(sample.id)}
                            title="자동 판정 상태로 복귀"
                            className="rounded border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                          >
                            <RotateCcw
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 grid grid-cols-1 gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs sm:grid-cols-2">
                      <div>
                        <span className="text-slate-500">측정값: </span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {sample.measuredValue}
                          {sample.unit && sample.unit !== '-'
                            ? ` ${sample.unit}`
                            : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">적용 기준: </span>
                        <span className="font-mono font-medium text-slate-800 tabular-nums">
                          {sample.matchedCriterion
                            ? formatCriterionRule(sample.matchedCriterion)
                            : '기준미등록'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">판정 근거: </span>
                        <span
                          className={`font-medium tabular-nums ${
                            sample.isExceeding
                              ? 'text-rose-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {sample.comparisonText}
                        </span>
                      </div>
                    </div>

                    {/* 부적합 · 재확인 증빙 사진 업로드 박스 */}
                    <div className="mt-3">
                      <PhotoUploadBox
                        compact
                        photoUrl={sample.photoUrl}
                        photoCaption={sample.photoCaption}
                        onChangePhoto={(nextUrl, nextCaption) =>
                          onUpdatePhoto(sample.id, nextUrl, nextCaption)
                        }
                        onPreviewPhoto={(url, _title, caption) =>
                          setModalPhoto({
                            url,
                            title: `${displayId} · ${sample.testItem}`,
                            caption,
                            status: sample.effectiveStatus,
                          })
                        }
                        title="부적합 증빙 사진 업로드 (PDF 자동 첨부)"
                        helperText="사진을 드래그하거나 선택하면 보고서 PDF에 자동 포함됩니다."
                      />
                    </div>

                    {/* 검토의견(메모) 빠른 편집 */}
                    <div className="mt-2.5 text-xs">
                      {editingMemoId === sample.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={memoDraft}
                            onChange={(e) => setMemoDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onUpdateMemo(sample.id, memoDraft.trim());
                                setEditingMemoId(null);
                              } else if (e.key === 'Escape') {
                                setEditingMemoId(null);
                              }
                            }}
                            placeholder="보고서 초안에 반영할 검토의견 입력"
                            className="flex-1 rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateMemo(sample.id, memoDraft.trim());
                              setEditingMemoId(null);
                            }}
                            className="rounded bg-slate-900 px-2.5 py-1 font-semibold text-white hover:bg-slate-800 cursor-pointer"
                          >
                            적용
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMemoId(null)}
                            className="rounded border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2 text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-700">
                              검토의견:{' '}
                            </span>
                            <span>
                              {sample.memo.trim()
                                ? sample.memo
                                : '(미입력 — 보고서에는 기본 검토 문구가 자동 삽입됩니다)'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMemoId(sample.id);
                              setMemoDraft(sample.memo);
                            }}
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 shrink-0 cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" aria-hidden="true" />
                            의견 편집
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 우측: 보고서 헤더 편집 + 내부 보고용 요약 초안 및 정식 PDF 생성 */}
        <section
          aria-labelledby="report-draft-heading"
          className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-7"
        >
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                id="report-draft-heading"
                className="text-base font-bold text-slate-900"
              >
                보고서 헤더 설정 및 요약 보고서 생성
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                보고서 헤더 정보를 직접 수정하고, 텍스트 복사 또는 정식 A4 문서 PDF로 다운로드할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onResetReportHeader}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
              >
                헤더 기본값
              </button>
              <button
                type="button"
                onClick={handleResetDraft}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                초안 갱신
              </button>
            </div>
          </div>

          {/* 수의사 직접 편집 가능한 보고서 헤더 필드 */}
          <div className="mt-4 grid grid-cols-1 gap-3 border-b border-slate-100 pb-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="report-header-title"
                className="block text-xs font-semibold text-slate-700"
              >
                보고서 제목 (문서 헤더)
              </label>
              <input
                id="report-header-title"
                type="text"
                value={reportHeader.title}
                onChange={(e) =>
                  handleHeaderFieldChange('title', e.target.value)
                }
                placeholder="예: 축산물 안전성 검사 특이(부적합) 시료 검토 요약 보고서"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="report-header-docno"
                className="block text-xs font-semibold text-slate-700"
              >
                문서번호
              </label>
              <input
                id="report-header-docno"
                type="text"
                value={reportHeader.documentNo}
                onChange={(e) =>
                  handleHeaderFieldChange('documentNo', e.target.value)
                }
                placeholder="예: 축산검토-2026-001"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="report-header-author"
                className="block text-xs font-semibold text-slate-700"
              >
                담당 수의사 (작성자)
              </label>
              <input
                id="report-header-author"
                type="text"
                value={reportHeader.author}
                onChange={(e) =>
                  handleHeaderFieldChange('author', e.target.value)
                }
                placeholder="예: 홍길동 수의사"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="report-header-dept"
                className="block text-xs font-semibold text-slate-700"
              >
                작성 부서 (발신)
              </label>
              <input
                id="report-header-dept"
                type="text"
                value={reportHeader.department}
                onChange={(e) =>
                  handleHeaderFieldChange('department', e.target.value)
                }
                placeholder="예: 세종특별자치시 보건환경연구원 축산물분석과"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="report-header-recipient"
                className="block text-xs font-semibold text-slate-700"
              >
                수신 (보고 대상)
              </label>
              <input
                id="report-header-recipient"
                type="text"
                value={reportHeader.recipient}
                onChange={(e) =>
                  handleHeaderFieldChange('recipient', e.target.value)
                }
                placeholder="예: 축산물분석과장 (내부 검토용)"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* 옵션 바 */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={maskIds}
                onChange={(e) => handleToggleMask(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
              />
              <EyeOff className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>시료번호 일부 마스킹 (예: 2026-축산-***)</span>
            </label>

            {isCustomEdited && (
              <span className="text-[11px] font-medium text-amber-700">
                본문 수동 편집됨 (초안 갱신 클릭 시 자동 서식으로 복원)
              </span>
            )}
          </div>

          {/* 생성된 보고서 초안 텍스트 영역 */}
          <div className="mt-3">
            <label htmlFor="report-draft-textarea" className="sr-only">
              내부 보고용 요약 초안
            </label>
            <textarea
              id="report-draft-textarea"
              rows={13}
              value={draftText}
              onChange={(e) => {
                setDraftText(e.target.value);
                setIsCustomEdited(true);
              }}
              className="w-full rounded-md border border-slate-300 bg-slate-50/70 p-3.5 font-mono text-xs leading-relaxed text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[11px] text-slate-500">
              ※ PDF에는 수정된 헤더, 시료별 검토 표, 조치사항 및 확인란이 A4 정식 문서 형식으로 포함됩니다.
            </span>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check
                      className="h-3.5 w-3.5 text-emerald-600"
                      aria-hidden="true"
                    />
                    복사 완료
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    클립보드에 복사
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                {exportingPdf ? 'PDF 생성 중...' : '정식 문서 PDF 다운로드'}
              </button>
            </div>
          </div>
        </section>
      </div>

      <PhotoModal photo={modalPhoto} onClose={() => setModalPhoto(null)} />
    </div>
  );
}
