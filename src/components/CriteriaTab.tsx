import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Edit3,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  COMMON_UNITS,
  Criterion,
  OPERATOR_TYPES,
  OperatorType,
  PRODUCT_CATEGORIES,
  ProductCategory,
  SampleRecord,
} from '../types';
import { formatCriterionRule } from '../utils/evaluation';

interface CriteriaTabProps {
  criteria: Criterion[];
  samples: SampleRecord[];
  onSaveCriterion: (
    data: Omit<Criterion, 'id' | 'updatedAt'>,
    editingId?: string
  ) => void;
  onDeleteCriterion: (id: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onLoadDummyData: () => void;
  onClearAllData: () => void;
}

export function CriteriaTab({
  criteria,
  samples,
  onSaveCriterion,
  onDeleteCriterion,
  onExportJson,
  onImportJson,
  onLoadDummyData,
  onClearAllData,
}: CriteriaTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<ProductCategory>('식육');
  const [testItem, setTestItem] = useState('');
  const [operator, setOperator] = useState<OperatorType>('이하(<=)');
  const [thresholdInput, setThresholdInput] = useState('0.1');
  const [unit, setUnit] = useState('mg/kg');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  const [filterCategory, setFilterCategory] = useState<ProductCategory | '전체'>(
    '전체'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'dummy' | 'clear' | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setCategory('식육');
    setTestItem('');
    setOperator('이하(<=)');
    setThresholdInput('0.1');
    setUnit('mg/kg');
    setNote('');
    setFormError('');
  };

  const handleOperatorChange = (nextOp: OperatorType) => {
    setOperator(nextOp);
    if (nextOp === '불검출') {
      setThresholdInput('0');
      if (!unit || unit === 'mg/kg') {
        setUnit('-');
      }
    }
  };

  const handleStartEdit = (item: Criterion) => {
    setEditingId(item.id);
    setCategory(item.category);
    setTestItem(item.testItem);
    setOperator(item.operator);
    setThresholdInput(String(item.threshold));
    setUnit(item.unit);
    setNote(item.note);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedItem = testItem.trim();
    if (!trimmedItem) {
      setFormError('검사항목명을 입력해 주세요.');
      return;
    }

    const numericThreshold =
      operator === '불검출' ? 0 : Number(thresholdInput.replace(/,/g, '').trim());
    if (
      operator !== '불검출' &&
      (!thresholdInput.trim() || !Number.isFinite(numericThreshold) || numericThreshold < 0)
    ) {
      setFormError('허용 기준치는 0 이상의 유효한 숫자로 입력해 주세요.');
      return;
    }

    // 동일 품목 유형 + 검사항목명 중복 검사
    const duplicate = criteria.find(
      (c) =>
        c.id !== editingId &&
        c.category === category &&
        c.testItem.trim().toLowerCase() === trimmedItem.toLowerCase()
    );
    if (duplicate) {
      setFormError(
        `[${category}]에 이미 '${duplicate.testItem}' 기준이 등록되어 있습니다. 기존 기준을 수정해 주세요.`
      );
      return;
    }

    onSaveCriterion(
      {
        category,
        testItem: trimmedItem,
        operator,
        threshold: numericThreshold,
        unit: unit.trim() || '-',
        note: note.trim(),
      },
      editingId ?? undefined
    );
    resetForm();
  };

  const filteredCriteria = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return criteria.filter((c) => {
      if (filterCategory !== '전체' && c.category !== filterCategory) {
        return false;
      }
      if (!q) return true;
      return (
        c.testItem.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.note.toLowerCase().includes(q)
      );
    });
  }, [criteria, filterCategory, searchQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* 기준 항목 등록 / 수정 폼 */}
      <section
        aria-labelledby="criteria-form-heading"
        className="rounded-lg border border-slate-200 bg-white p-5"
      >
        <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="criteria-form-heading"
              className="text-base font-bold text-slate-900"
            >
              {editingId ? '검사 기준 항목 수정' : '검사 기준 항목 등록'}
            </h2>
            <p className="text-xs text-slate-500">
              실제 적용할 법정 기준·규격을 직접 입력·관리하세요. 등록 즉시 시료 판정에 반영됩니다.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              수정 취소
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {/* 품목 유형 */}
            <div className="lg:col-span-2">
              <label
                htmlFor="crit-category"
                className="block text-xs font-semibold text-slate-700"
              >
                품목 유형
              </label>
              <select
                id="crit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-800 focus:outline-none"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 검사항목명 */}
            <div className="lg:col-span-3">
              <label
                htmlFor="crit-test-item"
                className="block text-xs font-semibold text-slate-700"
              >
                검사항목명 <span className="text-rose-600">*</span>
              </label>
              <input
                id="crit-test-item"
                type="text"
                value={testItem}
                onChange={(e) => setTestItem(e.target.value)}
                placeholder="예: 엔로플록사신, 대장균군"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none"
              />
            </div>

            {/* 판정 연산자 */}
            <div className="lg:col-span-2">
              <label
                htmlFor="crit-operator"
                className="block text-xs font-semibold text-slate-700"
              >
                판정 연산자
              </label>
              <select
                id="crit-operator"
                value={operator}
                onChange={(e) =>
                  handleOperatorChange(e.target.value as OperatorType)
                }
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-800 focus:outline-none"
              >
                {OPERATOR_TYPES.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            {/* 허용 기준치 */}
            <div className="lg:col-span-2">
              <label
                htmlFor="crit-threshold"
                className="block text-xs font-semibold text-slate-700"
              >
                허용 기준치 (숫자)
              </label>
              <input
                id="crit-threshold"
                type="number"
                step="any"
                min="0"
                disabled={operator === '불검출'}
                value={operator === '불검출' ? '0' : thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                placeholder="0.1"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 focus:border-slate-800 focus:outline-none"
              />
            </div>

            {/* 단위 */}
            <div className="lg:col-span-1">
              <label
                htmlFor="crit-unit"
                className="block text-xs font-semibold text-slate-700"
              >
                단위
              </label>
              <input
                id="crit-unit"
                type="text"
                list="crit-unit-list"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="mg/kg"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 font-mono text-sm text-slate-900 focus:border-slate-800 focus:outline-none"
              />
              <datalist id="crit-unit-list">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>

            {/* 등록/수정 버튼 */}
            <div className="lg:col-span-2 flex items-end">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                {editingId ? '기준 수정 저장' : '기준표에 추가'}
              </button>
            </div>
          </div>

          {/* 비고 */}
          <div>
            <label
              htmlFor="crit-note"
              className="block text-xs font-semibold text-slate-700"
            >
              비고 (근거 규정·고시 조항 또는 시험법 메모)
            </label>
            <input
              id="crit-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 식품의 기준 및 규격 제2. 5. 동물용의약품 잔류허용기준 참조"
              className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none"
            />
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-rose-700">
              {formError}
            </p>
          )}
        </form>
      </section>

      {/* 기준표 목록 테이블 */}
      <section
        aria-labelledby="criteria-list-heading"
        className="rounded-lg border border-slate-200 bg-white"
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              id="criteria-list-heading"
              className="text-base font-bold text-slate-900"
            >
              등록된 검사 기준표
            </h2>
            <p className="text-xs text-slate-500 tabular-nums">
              표시 {filteredCriteria.length}건 / 전체 {criteria.length}건
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검사항목명·비고 검색"
                aria-label="기준표 검색"
                className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none sm:w-56"
              />
            </div>

            <select
              aria-label="품목 유형 필터"
              value={filterCategory}
              onChange={(e) =>
                setFilterCategory(
                  e.target.value as ProductCategory | '전체'
                )
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-slate-800 focus:outline-none"
            >
              <option value="전체">전체 품목 유형</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredCriteria.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              {criteria.length === 0
                ? '등록된 검사 기준이 없습니다.'
                : '조건에 일치하는 기준 항목이 없습니다.'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              상단 폼에서 기준을 직접 등록하거나, 아래 데이터 관리에서 테스트용 샘플 데이터를 불러올 수 있습니다.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 pl-5 pr-3 whitespace-nowrap">
                    품목 유형
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">검사항목명</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">판정 연산자</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">
                    허용 기준 및 단위
                  </th>
                  <th className="px-3 py-2.5 whitespace-nowrap">비고 (근거 메모)</th>
                  <th className="py-2.5 pl-3 pr-5 text-right whitespace-nowrap">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCriteria.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      editingId === item.id ? 'bg-slate-50' : ''
                    }`}
                  >
                    <td className="py-3 pl-5 pr-3 text-xs font-semibold text-slate-800 whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-slate-900">
                      {item.testItem}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {item.operator}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatCriterionRule(item)}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600 max-w-md">
                      {item.note || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3" aria-hidden="true" />
                          수정
                        </button>
                        {confirmDeleteId === item.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteCriterion(item.id);
                                setConfirmDeleteId(null);
                                if (editingId === item.id) resetForm();
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
                            onClick={() => setConfirmDeleteId(item.id)}
                            aria-label={`${item.testItem} 삭제`}
                            className="rounded border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 데이터 백업 / 복원 및 샘플 초기화 */}
      <section
        aria-labelledby="data-management-heading"
        className="rounded-lg border border-slate-200 bg-white p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              id="data-management-heading"
              className="text-sm font-bold text-slate-900"
            >
              기준표 및 시료 데이터 백업 · 복원 · 테스트 초기화
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              모든 데이터는 현재 브라우저(localStorage)에만 저장됩니다. PC 변경 또는 백업 시 JSON 파일로 내보내기·불러오기를 이용하세요.
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-800">
              <AlertTriangle
                className="h-3.5 w-3.5 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <span>
                샘플 데이터 불러오기 기능은 실제 법정 기준이 아닌 시스템 동작 확인용 더미 예시(기준 4건, 시료 5건)를 적재합니다.
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              JSON 내보내기 ({criteria.length}기준·{samples.length}시료)
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              JSON 불러오기
            </button>

            {confirmAction === 'dummy' ? (
              <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5">
                <span className="text-xs font-medium text-amber-900">
                  기존 데이터를 샘플(테스트 더미)로 대체할까요?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onLoadDummyData();
                    setConfirmAction(null);
                  }}
                  className="rounded bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
                >
                  확인
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (criteria.length === 0 && samples.length === 0) {
                    onLoadDummyData();
                  } else {
                    setConfirmAction('dummy');
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                샘플 데이터 불러오기(초기화)
              </button>
            )}

            {confirmAction === 'clear' ? (
              <div className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1.5">
                <span className="text-xs font-medium text-rose-900">
                  전체 기준표와 시료를 비울까요?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAllData();
                    setConfirmAction(null);
                  }}
                  className="rounded bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
                >
                  비우기 확인
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmAction('clear')}
                className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                전체 데이터 비우기
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
