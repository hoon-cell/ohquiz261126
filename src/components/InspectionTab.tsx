import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  Edit3,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  COMMON_UNITS,
  Criterion,
  EvaluatedSample,
  FilterStatus,
  PRODUCT_CATEGORIES,
  ProductCategory,
  SampleRecord,
} from '../types';
import {
  evaluateSample,
  formatCriterionRule,
  formatCurrentDateTime,
} from '../utils/evaluation';
import { StatusBadge } from './StatusBadge';
import { InspectionCharts } from './InspectionCharts';
import { PhotoModal, PhotoModalPayload } from './PhotoModal';
import { PhotoUploadBox } from './PhotoUploadBox';
import {
  ReceiptScannerBox,
  ScannedReceiptData,
} from './ReceiptScannerBox';
import { ReferencePhotoGallery } from './ReferencePhotoGallery';
import { SamplePhotoThumbnail } from './SamplePhotoThumbnail';

interface InspectionTabProps {
  criteria: Criterion[];
  evaluatedSamples: EvaluatedSample[];
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  onAddSample: (record: Omit<SampleRecord, 'id' | 'createdAt'>) => void;
  onToggleRecheck: (id: string) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onUpdatePhoto: (id: string, photoUrl?: string, photoCaption?: string) => void;
  onDeleteSample: (id: string) => void;
  onGoToCriteriaTab: () => void;
  onNotify?: (message: string, tone?: 'success' | 'error') => void;
}

const QUICK_VALUES = ['불검출', '음성', '양성'] as const;

const FILTER_OPTIONS: Array<{ key: FilterStatus; label: string }> = [
  { key: '전체', label: '전체' },
  { key: '적합', label: '적합' },
  { key: '부적합', label: '부적합' },
  { key: '확인필요', label: '확인필요' },
];

export function InspectionTab({
  criteria,
  evaluatedSamples,
  activeFilter,
  onFilterChange,
  onAddSample,
  onToggleRecheck,
  onUpdateMemo,
  onUpdatePhoto,
  onDeleteSample,
  onGoToCriteriaTab,
  onNotify,
}: InspectionTabProps) {
  const suggestedSampleId = useMemo(() => {
    const nextNum = String(evaluatedSamples.length + 1).padStart(3, '0');
    return `2026-축산-${nextNum}`;
  }, [evaluatedSamples.length]);

  const [sampleId, setSampleId] = useState('');
  const [category, setCategory] = useState<ProductCategory>('식육');
  const [productDetail, setProductDetail] = useState('');
  const [testItem, setTestItem] = useState('');
  const [measuredValue, setMeasuredValue] = useState('');
  const [unit, setUnit] = useState('mg/kg');
  const [memo, setMemo] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [formError, setFormError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingMemoDraft, setEditingMemoDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [modalPhoto, setModalPhoto] = useState<PhotoModalPayload | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  // 선택된 축산물 유형에 해당하는 기준표 항목 우선 정렬
  const categoryCriteria = useMemo(
    () => criteria.filter((c) => c.category === category),
    [criteria, category]
  );

  const allTestItemNames = useMemo(() => {
    const names = new Set<string>();
    categoryCriteria.forEach((c) => names.add(c.testItem));
    criteria.forEach((c) => names.add(c.testItem));
    return Array.from(names);
  }, [categoryCriteria, criteria]);

  const handleTestItemChange = (nextItem: string) => {
    setTestItem(nextItem);
    const matched = criteria.find(
      (c) =>
        c.category === category &&
        c.testItem.trim().toLowerCase() === nextItem.trim().toLowerCase()
    );
    if (matched) {
      setUnit(matched.unit);
    }
  };

  const handleCategoryChange = (nextCat: ProductCategory) => {
    setCategory(nextCat);
    const matched = criteria.find(
      (c) =>
        c.category === nextCat &&
        c.testItem.trim().toLowerCase() === testItem.trim().toLowerCase()
    );
    if (matched) {
      setUnit(matched.unit);
    }
  };

  // 입력 중인 값 기준 실시간 판정 미리보기
  const livePreview = useMemo(() => {
    if (!testItem.trim() && !measuredValue.trim()) {
      return null;
    }
    const draftRecord: SampleRecord = {
      id: 'preview',
      sampleId: sampleId.trim() || suggestedSampleId,
      category,
      productDetail: productDetail.trim(),
      testItem: testItem.trim(),
      measuredValue: measuredValue.trim(),
      unit: unit.trim(),
      memo: memo.trim(),
      manualRecheck: false,
      createdAt: formatCurrentDateTime(),
    };
    return evaluateSample(draftRecord, criteria);
  }, [
    sampleId,
    suggestedSampleId,
    category,
    productDetail,
    testItem,
    measuredValue,
    unit,
    memo,
    criteria,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedSampleId = sampleId.trim() || suggestedSampleId;
    if (!resolvedSampleId) {
      setFormError('시료번호를 입력해 주세요.');
      return;
    }
    if (!testItem.trim()) {
      setFormError('검사항목명을 입력하거나 기준표 항목에서 선택해 주세요.');
      return;
    }
    if (!measuredValue.trim()) {
      setFormError('측정값(숫자 또는 불검출/음성/양성)을 입력해 주세요.');
      return;
    }

    setFormError('');
    onAddSample({
      sampleId: resolvedSampleId,
      category,
      productDetail: productDetail.trim(),
      testItem: testItem.trim(),
      measuredValue: measuredValue.trim(),
      unit: unit.trim() || '-',
      memo: memo.trim(),
      manualRecheck: false,
      photoUrl: photoUrl || undefined,
      photoCaption: photoCaption.trim() || undefined,
    });

    setSampleId('');
    setProductDetail('');
    setTestItem('');
    setMeasuredValue('');
    setMemo('');
    setPhotoUrl('');
    setPhotoCaption('');
  };

  const uploadTargetSample = useMemo(
    () => evaluatedSamples.find((s) => s.id === uploadTargetId) ?? null,
    [evaluatedSamples, uploadTargetId]
  );

  const handleApplyScannedData = (scanned: ScannedReceiptData) => {
    const targetCategory = scanned.category ?? category;
    if (scanned.sampleId) {
      setSampleId(scanned.sampleId);
    }
    if (scanned.productDetail) {
      setProductDetail(scanned.productDetail);
    }
    if (scanned.category) {
      setCategory(scanned.category);
    }
    if (scanned.testItem) {
      setTestItem(scanned.testItem);
      const matched = criteria.find(
        (c) =>
          c.category === targetCategory &&
          c.testItem.trim().toLowerCase() ===
            scanned.testItem!.trim().toLowerCase()
      );
      if (matched) {
        setUnit(matched.unit);
      }
    }
    if (scanned.notes && !memo.trim()) {
      setMemo(scanned.notes);
    }
    setFormError('');
    onNotify?.(
      `접수증 스캔 완료: 시료번호(${scanned.sampleId || '-'}) · 세부품목명(${scanned.productDetail || '-'}) 자동 입력됨`
    );
  };

  // 검색 + 상태 필터링
  const filteredSamples = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return evaluatedSamples.filter((s) => {
      if (activeFilter === '적합' && s.effectiveStatus !== '적합') return false;
      if (activeFilter === '부적합' && s.effectiveStatus !== '부적합')
        return false;
      if (
        activeFilter === '확인필요' &&
        s.effectiveStatus !== '재확인필요' &&
        s.effectiveStatus !== '기준미등록' &&
        s.effectiveStatus !== '단위확인필요'
      ) {
        return false;
      }

      if (!q) return true;
      return (
        s.sampleId.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.productDetail.toLowerCase().includes(q) ||
        s.testItem.toLowerCase().includes(q) ||
        s.memo.toLowerCase().includes(q)
      );
    });
  }, [evaluatedSamples, activeFilter, searchQuery]);

  const startMemoEdit = (sample: EvaluatedSample) => {
    setEditingMemoId(sample.id);
    setEditingMemoDraft(sample.memo);
  };

  const saveMemoEdit = (id: string) => {
    onUpdateMemo(id, editingMemoDraft.trim());
    setEditingMemoId(null);
    setEditingMemoDraft('');
  };

  return (
    <div className="space-y-6">
      {/* 상단 검사 현황 시각화 (적합/부적합 비율 파이 차트 · 날짜별 검사 건수 추이 막대 그래프) */}
      <InspectionCharts evaluatedSamples={evaluatedSamples} />

      {/* 단건 시료 검사 결과 입력 폼 */}
      <section
        aria-labelledby="sample-entry-heading"
        className="rounded-lg border border-slate-200 bg-white p-5"
      >
        <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="sample-entry-heading"
              className="text-base font-bold text-slate-900"
            >
              시료 검사 결과 입력 및 자동 판정
            </h2>
            <p className="text-xs text-slate-500">
              축산물 유형과 검사항목명을 입력하면 등록된 기준표와 자동 대조하여 판정합니다.
            </p>
          </div>
          {categoryCriteria.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500">
                {category} 등록 기준 빠른 선택:
              </span>
              {categoryCriteria.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setTestItem(c.testItem);
                    setUnit(c.unit);
                  }}
                  className={`rounded border px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    testItem.trim() === c.testItem
                      ? 'border-slate-800 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {c.testItem}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 시료 접수증 스캔 자동 입력 박스 */}
          <ReceiptScannerBox
            onApplyScannedData={handleApplyScannedData}
            onPreviewReceipt={(url, title, caption) =>
              setModalPhoto({
                url,
                title,
                caption,
                badgeText: '시료 접수증',
              })
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {/* 시료번호 */}
            <div className="lg:col-span-2">
              <label
                htmlFor="input-sample-id"
                className="block text-xs font-semibold text-slate-700"
              >
                시료번호
              </label>
              <input
                id="input-sample-id"
                type="text"
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                placeholder={suggestedSampleId}
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none"
              />
            </div>

            {/* 축산물 유형 */}
            <div className="lg:col-span-2">
              <label
                htmlFor="input-category"
                className="block text-xs font-semibold text-slate-700"
              >
                축산물 유형
              </label>
              <select
                id="input-category"
                value={category}
                onChange={(e) =>
                  handleCategoryChange(e.target.value as ProductCategory)
                }
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-800 focus:outline-none"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 세부 품목명 */}
            <div className="lg:col-span-2">
              <label
                htmlFor="input-product-detail"
                className="block text-xs font-semibold text-slate-700"
              >
                세부 품목명
              </label>
              <input
                id="input-product-detail"
                type="text"
                value={productDetail}
                onChange={(e) => setProductDetail(e.target.value)}
                placeholder="예: 한우 등심, 계란"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none"
              />
            </div>

            {/* 검사항목명 */}
            <div className="lg:col-span-3">
              <label
                htmlFor="input-test-item"
                className="block text-xs font-semibold text-slate-700"
              >
                검사항목명 <span className="text-rose-600">*</span>
              </label>
              <input
                id="input-test-item"
                type="text"
                list="test-item-suggestions"
                value={testItem}
                onChange={(e) => handleTestItemChange(e.target.value)}
                placeholder="예: 옥시테트라사이클린, 살모넬라"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none"
              />
              <datalist id="test-item-suggestions">
                {allTestItemNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* 측정값 + 빠른 선택 */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-measured-value"
                  className="block text-xs font-semibold text-slate-700"
                >
                  측정값 <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-1">
                  {QUICK_VALUES.map((qv) => (
                    <button
                      key={qv}
                      type="button"
                      onClick={() => setMeasuredValue(qv)}
                      className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                        measuredValue.trim() === qv
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {qv}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="input-measured-value"
                type="text"
                value={measuredValue}
                onChange={(e) => setMeasuredValue(e.target.value)}
                placeholder="수치 또는 불검출"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-slate-800 focus:outline-none"
              />
            </div>

            {/* 단위 */}
            <div className="lg:col-span-1">
              <label
                htmlFor="input-unit"
                className="block text-xs font-semibold text-slate-700"
              >
                단위
              </label>
              <input
                id="input-unit"
                type="text"
                list="common-unit-suggestions"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="mg/kg"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none"
              />
              <datalist id="common-unit-suggestions">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
            {/* 담당 수의사 메모 */}
            <div className="lg:col-span-6">
              <label
                htmlFor="input-memo"
                className="block text-xs font-semibold text-slate-700"
              >
                담당 수의사 메모 (선택)
              </label>
              <input
                id="input-memo"
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="특이소견, 희석배수, 재시험 사유 등 검토 메모"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none"
              />
            </div>

            {/* 실시간 판정 미리보기 */}
            <div className="lg:col-span-4">
              {livePreview ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-700 truncate">
                      {livePreview.matchedCriterion
                        ? `기준: ${formatCriterionRule(livePreview.matchedCriterion)}`
                        : '일치하는 기준표 항목 없음'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {livePreview.comparisonText}
                    </div>
                  </div>
                  {measuredValue.trim() ? (
                    <StatusBadge status={livePreview.effectiveStatus} compact />
                  ) : (
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      측정값 대기
                    </span>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-400">
                  검사항목명과 측정값을 입력하면 판정 결과가 미리 표시됩니다.
                </div>
              )}
            </div>

            {/* 등록 버튼 */}
            <div className="lg:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                검사 결과 등록
              </button>
            </div>
          </div>

          {/* 부적합 · 시료 증빙 사진 업로드 박스 */}
          <PhotoUploadBox
            photoUrl={photoUrl || undefined}
            photoCaption={photoCaption}
            onChangePhoto={(nextUrl, nextCaption) => {
              setPhotoUrl(nextUrl ?? '');
              setPhotoCaption(nextCaption ?? '');
            }}
            onPreviewPhoto={(url, title, caption) =>
              setModalPhoto({ url, title, caption })
            }
            title={
              livePreview?.effectiveStatus === '부적합'
                ? '부적합 증빙 사진 업로드 (드래그 앤 드롭 또는 파일 선택)'
                : '시료 · 부적합 증빙 사진 업로드 박스 (선택)'
            }
            helperText="배지 판독 사진, 크로마토그램, 시료 외관 사진을 끌어다 놓거나 선택해 첨부하세요."
            showPresets
          />

          {formError && (
            <p role="alert" className="text-xs font-medium text-rose-700">
              {formError}
            </p>
          )}
        </form>
      </section>

      {/* 시료 목록 테이블 섹션 */}
      <section
        aria-labelledby="sample-table-heading"
        className="rounded-lg border border-slate-200 bg-white"
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              id="sample-table-heading"
              className="text-base font-bold text-slate-900"
            >
              시료 판정 내역
            </h2>
            <p className="text-xs text-slate-500 tabular-nums">
              조회 {filteredSamples.length}건 / 전체 {evaluatedSamples.length}건
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* 검색창 */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="시료번호·품목·검사항목 검색"
                aria-label="시료번호, 품목, 검사항목 검색"
                className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none sm:w-64"
              />
            </div>

            {/* 상태별 필터 */}
            <div
              role="group"
              aria-label="판정 상태별 필터"
              className="flex items-center gap-1 rounded-md bg-slate-100 p-1"
            >
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onFilterChange(opt.key)}
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeFilter === opt.key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredSamples.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              {evaluatedSamples.length === 0
                ? '등록된 시료 검사 내역이 없습니다.'
                : '검색 또는 필터 조건에 일치하는 시료가 없습니다.'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {evaluatedSamples.length === 0
                ? '상단 입력 폼에서 시료 검사 결과를 등록하거나, 검사 기준표 관리 탭에서 테스트용 샘플 데이터를 불러올 수 있습니다.'
                : '검색어를 지우거나 상태 필터를 전체로 변경해 보세요.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {(activeFilter !== '전체' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange('전체');
                    setSearchQuery('');
                  }}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  필터 초기화
                </button>
              )}
              {criteria.length === 0 && (
                <button
                  type="button"
                  onClick={onGoToCriteriaTab}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
                >
                  기준표 관리로 이동
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 pl-5 pr-3 whitespace-nowrap">시료번호</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    축산물 유형 · 세부 품목
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">검사항목</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">
                    측정값
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">기준치</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    기준 대비 · 판정 근거
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">판정결과</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">증빙 사진</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">담당 수의사 메모</th>
                  <th className="py-2.5 pl-3 pr-5 text-right whitespace-nowrap">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSamples.map((sample) => {
                  const isRowWarning =
                    sample.effectiveStatus === '부적합'
                      ? 'bg-rose-50/30 hover:bg-rose-50/60'
                      : 'hover:bg-slate-50/80';

                  return (
                    <tr key={sample.id} className={`transition-colors ${isRowWarning}`}>
                      <td className="py-3 pl-5 pr-3 align-top font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        <div>{sample.sampleId}</div>
                        <div className="mt-0.5 font-sans text-[11px] font-normal text-slate-400">
                          {sample.createdAt}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                          {sample.category}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {sample.productDetail || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top text-xs font-medium text-slate-900">
                        {sample.testItem}
                      </td>
                      <td className="px-3 py-3 align-top text-right font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        <span>{sample.measuredValue}</span>
                        {sample.unit && sample.unit !== '-' && (
                          <span className="ml-1 font-normal text-slate-500">
                            {sample.unit}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {sample.matchedCriterion ? (
                          formatCriterionRule(sample.matchedCriterion)
                        ) : (
                          <span className="font-sans text-slate-400">
                            미등록
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top text-xs">
                        {sample.autoStatus === '단위확인필요' ? (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-800">
                            <AlertTriangle
                              className="h-3.5 w-3.5 shrink-0 text-amber-600"
                              aria-hidden="true"
                            />
                            {sample.comparisonText}
                          </span>
                        ) : (
                          <span
                            className={`tabular-nums ${
                              sample.isExceeding
                                ? 'font-semibold text-rose-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {sample.comparisonText}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={sample.effectiveStatus} />
                          {sample.manualRecheck && (
                            <span className="text-[11px] text-slate-500">
                              수동 전환 (자동: {sample.autoStatus})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        {sample.photoUrl ? (
                          <div className="flex items-center gap-1.5">
                            <SamplePhotoThumbnail
                              src={sample.photoUrl}
                              alt={
                                sample.photoCaption ||
                                `${sample.sampleId} 검사 사진`
                              }
                              onClick={() =>
                                setModalPhoto({
                                  url: sample.photoUrl!,
                                  title: `${sample.sampleId} · ${sample.testItem}`,
                                  caption:
                                    sample.photoCaption ||
                                    sample.memo ||
                                    undefined,
                                  status: sample.effectiveStatus,
                                })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => setUploadTargetId(sample.id)}
                              title="사진 교체 또는 삭제"
                              aria-label={`${sample.sampleId} 사진 편집`}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setUploadTargetId(sample.id)}
                            className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium whitespace-nowrap cursor-pointer ${
                              sample.effectiveStatus === '부적합'
                                ? 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Camera className="h-3 w-3" aria-hidden="true" />
                            사진 업로드
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-slate-600 max-w-xs">
                        {editingMemoId === sample.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingMemoDraft}
                              onChange={(e) =>
                                setEditingMemoDraft(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveMemoEdit(sample.id);
                                } else if (e.key === 'Escape') {
                                  setEditingMemoId(null);
                                }
                              }}
                              autoFocus
                              className="w-40 rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                              placeholder="검토 메모 입력"
                            />
                            <button
                              type="button"
                              onClick={() => saveMemoEdit(sample.id)}
                              aria-label="메모 저장"
                              className="rounded p-1 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMemoId(null)}
                              aria-label="메모 편집 취소"
                              className="rounded p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="group flex items-start gap-1.5">
                            <span className="leading-relaxed">
                              {sample.memo || (
                                <span className="text-slate-400">-</span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => startMemoEdit(sample)}
                              title="메모 수정"
                              aria-label={`${sample.sampleId} 메모 수정`}
                              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0 cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 pl-3 pr-5 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onToggleRecheck(sample.id)}
                            title={
                              sample.manualRecheck
                                ? '자동 판정 상태로 복귀'
                                : '재확인필요 상태로 수동 지정'
                            }
                            className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                              sample.manualRecheck
                                ? 'border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <RotateCcw className="h-3 w-3 shrink-0" aria-hidden="true" />
                            {sample.manualRecheck ? '자동복귀' : '재확인'}
                          </button>

                          {confirmDeleteId === sample.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteSample(sample.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
                              >
                                삭제확인
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(sample.id)}
                              aria-label={`${sample.sampleId} 삭제`}
                              title="시료 삭제"
                              className="rounded border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 적합 예시 · 부적합 사례 판독 참고 사진 */}
      <ReferencePhotoGallery onOpenPhoto={setModalPhoto} />

      {/* 사진 확대 모달 */}
      <PhotoModal photo={modalPhoto} onClose={() => setModalPhoto(null)} />

      {/* 기존 시료 증빙 사진 업로드/교체 모달 */}
      {uploadTargetSample && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="row-photo-upload-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setUploadTargetId(null)}
        >
          <div
            className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3
                  id="row-photo-upload-title"
                  className="text-sm font-bold text-slate-900"
                >
                  시료 증빙 사진 업로드 · 편집 ({uploadTargetSample.sampleId})
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {uploadTargetSample.category} · {uploadTargetSample.testItem} (
                  {uploadTargetSample.effectiveStatus})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadTargetId(null)}
                aria-label="창 닫기"
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <PhotoUploadBox
                photoUrl={uploadTargetSample.photoUrl}
                photoCaption={uploadTargetSample.photoCaption}
                onChangePhoto={(nextUrl, nextCaption) =>
                  onUpdatePhoto(uploadTargetSample.id, nextUrl, nextCaption)
                }
                onPreviewPhoto={(url, title, caption) =>
                  setModalPhoto({
                    url,
                    title,
                    caption,
                    status: uploadTargetSample.effectiveStatus,
                  })
                }
                title={
                  uploadTargetSample.effectiveStatus === '부적합'
                    ? '부적합 시료 증빙 사진 업로드'
                    : '시료 검사 사진 업로드'
                }
                showPresets
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setUploadTargetId(null)}
                className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
