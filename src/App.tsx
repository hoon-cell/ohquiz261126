import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import {
  AppTab,
  Criterion,
  DEFAULT_REPORT_HEADER,
  FilterStatus,
  OPERATOR_TYPES,
  PRODUCT_CATEGORIES,
  ReportHeaderConfig,
  SampleRecord,
} from './types';
import {
  STORAGE_KEYS,
  SAMPLE_DUMMY_CRITERIA,
  SAMPLE_DUMMY_RECORDS,
  evaluateSample,
  formatCurrentDateTime,
} from './utils/evaluation';
import {
  HeaderAndDashboard,
  SummaryCounts,
} from './components/HeaderAndDashboard';
import { InspectionTab } from './components/InspectionTab';
import { CriteriaTab } from './components/CriteriaTab';
import { ReportTab } from './components/ReportTab';

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'error';
}

function loadInitialData(): {
  criteria: Criterion[];
  samples: SampleRecord[];
} {
  try {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const rawCriteria = localStorage.getItem(STORAGE_KEYS.CRITERIA);
    const rawSamples = localStorage.getItem(STORAGE_KEYS.SAMPLES);

    if (!initialized && !rawCriteria && !rawSamples) {
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      localStorage.setItem(
        STORAGE_KEYS.CRITERIA,
        JSON.stringify(SAMPLE_DUMMY_CRITERIA)
      );
      localStorage.setItem(
        STORAGE_KEYS.SAMPLES,
        JSON.stringify(SAMPLE_DUMMY_RECORDS)
      );
      return {
        criteria: SAMPLE_DUMMY_CRITERIA,
        samples: SAMPLE_DUMMY_RECORDS,
      };
    }

    const parsedCriteria: Criterion[] = rawCriteria
      ? JSON.parse(rawCriteria)
      : [];
    const parsedSamples: SampleRecord[] = rawSamples
      ? JSON.parse(rawSamples)
      : [];

    let hydratedSamples = Array.isArray(parsedSamples) ? parsedSamples : [];
    const dummyMap = new Map(SAMPLE_DUMMY_RECORDS.map((d) => [d.id, d]));
    let didHydrateDummyPhotos = false;

    hydratedSamples = hydratedSamples.map((s) => {
      const dummy = dummyMap.get(s.id);
      if (dummy && !s.photoUrl && dummy.photoUrl) {
        didHydrateDummyPhotos = true;
        return {
          ...s,
          photoUrl: dummy.photoUrl,
          photoCaption: dummy.photoCaption,
        };
      }
      return s;
    });

    if (
      didHydrateDummyPhotos &&
      !hydratedSamples.some((s) => s.id === 'samp-dummy-6')
    ) {
      const dummy6 = dummyMap.get('samp-dummy-6');
      if (dummy6) {
        hydratedSamples = [...hydratedSamples, dummy6];
      }
    }

    return {
      criteria: Array.isArray(parsedCriteria) ? parsedCriteria : [],
      samples: hydratedSamples,
    };
  } catch {
    return {
      criteria: SAMPLE_DUMMY_CRITERIA,
      samples: SAMPLE_DUMMY_RECORDS,
    };
  }
}

function loadInitialReportHeader(): ReportHeaderConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORT_HEADER);
    if (!raw) return DEFAULT_REPORT_HEADER;
    const parsed = JSON.parse(raw) as Partial<ReportHeaderConfig>;
    return {
      title:
        typeof parsed.title === 'string'
          ? parsed.title
          : DEFAULT_REPORT_HEADER.title,
      documentNo:
        typeof parsed.documentNo === 'string'
          ? parsed.documentNo
          : DEFAULT_REPORT_HEADER.documentNo,
      department:
        typeof parsed.department === 'string'
          ? parsed.department
          : DEFAULT_REPORT_HEADER.department,
      recipient:
        typeof parsed.recipient === 'string'
          ? parsed.recipient
          : DEFAULT_REPORT_HEADER.recipient,
      author:
        typeof parsed.author === 'string'
          ? parsed.author
          : DEFAULT_REPORT_HEADER.author,
    };
  } catch {
    return DEFAULT_REPORT_HEADER;
  }
}

export default function App() {
  const initialData = useMemo(() => loadInitialData(), []);
  const initialReportHeader = useMemo(() => loadInitialReportHeader(), []);

  const [criteria, setCriteria] = useState<Criterion[]>(initialData.criteria);
  const [samples, setSamples] = useState<SampleRecord[]>(initialData.samples);
  const [reportHeader, setReportHeader] = useState<ReportHeaderConfig>(
    initialReportHeader
  );
  const [activeTab, setActiveTab] = useState<AppTab>('inspection');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('전체');
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (
    message: string,
    tone: 'success' | 'error' = 'success'
  ) => {
    setToast({ id: Date.now(), message, tone });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      localStorage.setItem(STORAGE_KEYS.CRITERIA, JSON.stringify(criteria));
    } catch {
      // localStorage 용량 초과 등 예외 무시
    }
  }, [criteria]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      localStorage.setItem(STORAGE_KEYS.SAMPLES, JSON.stringify(samples));
    } catch {
      // localStorage 용량 초과 등 예외 무시
    }
  }, [samples]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.REPORT_HEADER,
        JSON.stringify(reportHeader)
      );
    } catch {
      // localStorage 용량 초과 등 예외 무시
    }
  }, [reportHeader]);

  // 기준표 변경 시 모든 시료 실시간 재판정
  const evaluatedSamples = useMemo(
    () => samples.map((sample) => evaluateSample(sample, criteria)),
    [samples, criteria]
  );

  const summaryCounts: SummaryCounts = useMemo(() => {
    let conforming = 0;
    let nonConforming = 0;
    let attentionNeeded = 0;
    let reportTargetCount = 0;

    for (const s of evaluatedSamples) {
      if (s.effectiveStatus === '적합') {
        conforming += 1;
      } else if (s.effectiveStatus === '부적합') {
        nonConforming += 1;
        reportTargetCount += 1;
      } else {
        attentionNeeded += 1;
        if (s.effectiveStatus === '재확인필요') {
          reportTargetCount += 1;
        }
      }
    }

    return {
      total: evaluatedSamples.length,
      conforming,
      nonConforming,
      attentionNeeded,
      reportTargetCount,
    };
  }, [evaluatedSamples]);

  const handleSelectFilterCard = (filter: FilterStatus) => {
    setActiveFilter(filter);
    setActiveTab('inspection');
  };

  const handleAddSample = (
    record: Omit<SampleRecord, 'id' | 'createdAt'>
  ) => {
    const newSample: SampleRecord = {
      ...record,
      id: `samp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: formatCurrentDateTime(),
    };
    setSamples((prev) => [newSample, ...prev]);
    const evaluated = evaluateSample(newSample, criteria);
    showToast(
      `시료 ${newSample.sampleId} 등록 완료 (판정: ${evaluated.effectiveStatus})`
    );
  };

  const handleToggleRecheck = (id: string) => {
    setSamples((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, manualRecheck: !s.manualRecheck } : s
      )
    );
  };

  const handleUpdateMemo = (id: string, memo: string) => {
    setSamples((prev) =>
      prev.map((s) => (s.id === id ? { ...s, memo } : s))
    );
    showToast('수의사 검토 메모가 저장되었습니다.');
  };

  const handleUpdatePhoto = (
    id: string,
    photoUrl?: string,
    photoCaption?: string
  ) => {
    setSamples((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, photoUrl, photoCaption } : s
      )
    );
    if (photoUrl) {
      showToast('증빙 사진이 저장되었습니다.');
    } else {
      showToast('첨부된 사진이 삭제되었습니다.');
    }
  };

  const handleDeleteSample = (id: string) => {
    setSamples((prev) => prev.filter((s) => s.id !== id));
    showToast('시료 검사 내역이 삭제되었습니다.');
  };

  const handleSaveCriterion = (
    data: Omit<Criterion, 'id' | 'updatedAt'>,
    editingId?: string
  ) => {
    const now = formatCurrentDateTime();
    if (editingId) {
      setCriteria((prev) =>
        prev.map((c) =>
          c.id === editingId ? { ...c, ...data, updatedAt: now } : c
        )
      );
      showToast(`기준 '${data.testItem}'이(가) 수정되었습니다.`);
    } else {
      const newCriterion: Criterion = {
        ...data,
        id: `crit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        updatedAt: now,
      };
      setCriteria((prev) => [newCriterion, ...prev]);
      showToast(`기준 '${data.testItem}'이(가) 기준표에 등록되었습니다.`);
    }
  };

  const handleDeleteCriterion = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
    showToast('검사 기준 항목이 삭제되었습니다.');
  };

  const handleExportJson = () => {
    const payload = {
      system: '축산물 안전성 검사 판정 및 부적합 요약 보조 시스템',
      exportedAt: new Date().toISOString(),
      criteria,
      samples,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `livestock-inspection-backup-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('기준표 및 시료 데이터가 JSON 파일로 내보내기 되었습니다.');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        if (
          !parsed ||
          !Array.isArray(parsed.criteria) ||
          !Array.isArray(parsed.samples)
        ) {
          showToast(
            '올바른 백업 JSON 형식이 아닙니다. (criteria, samples 배열 필요)',
            'error'
          );
          return;
        }

        const validCriteria: Criterion[] = parsed.criteria
          .filter(
            (c: unknown): c is Criterion =>
              typeof c === 'object' &&
              c !== null &&
              typeof (c as Criterion).testItem === 'string' &&
              PRODUCT_CATEGORIES.includes((c as Criterion).category) &&
              OPERATOR_TYPES.includes((c as Criterion).operator) &&
              typeof (c as Criterion).threshold === 'number'
          )
          .map((c: Criterion, index: number) => ({
            ...c,
            id: c.id || `crit-imp-${Date.now()}-${index}`,
            unit: typeof c.unit === 'string' ? c.unit : '-',
            note: typeof c.note === 'string' ? c.note : '',
            updatedAt: c.updatedAt || formatCurrentDateTime(),
          }));

        const validSamples: SampleRecord[] = parsed.samples
          .filter(
            (s: unknown): s is SampleRecord =>
              typeof s === 'object' &&
              s !== null &&
              typeof (s as SampleRecord).sampleId === 'string' &&
              typeof (s as SampleRecord).testItem === 'string' &&
              PRODUCT_CATEGORIES.includes((s as SampleRecord).category)
          )
          .map((s: SampleRecord, index: number) => ({
            ...s,
            id: s.id || `samp-imp-${Date.now()}-${index}`,
            productDetail:
              typeof s.productDetail === 'string' ? s.productDetail : '',
            measuredValue:
              typeof s.measuredValue === 'string'
                ? s.measuredValue
                : String(s.measuredValue ?? ''),
            unit: typeof s.unit === 'string' ? s.unit : '-',
            memo: typeof s.memo === 'string' ? s.memo : '',
            manualRecheck: Boolean(s.manualRecheck),
            createdAt: s.createdAt || formatCurrentDateTime(),
          }));

        setCriteria(validCriteria);
        setSamples(validSamples);
        showToast(
          `JSON 복원 완료: 기준 ${validCriteria.length}건, 시료 ${validSamples.length}건`
        );
      } catch {
        showToast('JSON 파일을 읽는 중 오류가 발생했습니다.', 'error');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleLoadDummyData = () => {
    setCriteria(SAMPLE_DUMMY_CRITERIA);
    setSamples(SAMPLE_DUMMY_RECORDS);
    setActiveFilter('전체');
    showToast(
      '테스트용 더미 샘플 데이터(기준 4건, 시료 5건)를 불러왔습니다.'
    );
  };

  const handleClearAllData = () => {
    setCriteria([]);
    setSamples([]);
    setActiveFilter('전체');
    showToast('모든 기준표 및 시료 데이터가 초기화되었습니다.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <HeaderAndDashboard
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeFilter={activeFilter}
        onSelectFilterCard={handleSelectFilterCard}
        counts={summaryCounts}
        criteriaCount={criteria.length}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'inspection' && (
          <InspectionTab
            criteria={criteria}
            evaluatedSamples={evaluatedSamples}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onAddSample={handleAddSample}
            onToggleRecheck={handleToggleRecheck}
            onUpdateMemo={handleUpdateMemo}
            onUpdatePhoto={handleUpdatePhoto}
            onDeleteSample={handleDeleteSample}
            onGoToCriteriaTab={() => setActiveTab('criteria')}
            onNotify={(msg, tone = 'success') => showToast(msg, tone)}
          />
        )}

        {activeTab === 'criteria' && (
          <CriteriaTab
            criteria={criteria}
            samples={samples}
            onSaveCriterion={handleSaveCriterion}
            onDeleteCriterion={handleDeleteCriterion}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onLoadDummyData={handleLoadDummyData}
            onClearAllData={handleClearAllData}
          />
        )}

        {activeTab === 'report' && (
          <ReportTab
            evaluatedSamples={evaluatedSamples}
            reportHeader={reportHeader}
            onChangeReportHeader={setReportHeader}
            onResetReportHeader={() => {
              setReportHeader(DEFAULT_REPORT_HEADER);
              showToast('보고서 헤더가 기본값으로 초기화되었습니다.');
            }}
            onUpdateMemo={handleUpdateMemo}
            onUpdatePhoto={handleUpdatePhoto}
            onToggleRecheck={handleToggleRecheck}
            onGoToInspectionFilter={() => {
              setActiveFilter('확인필요');
              setActiveTab('inspection');
            }}
            onNotify={(msg, tone = 'success') => showToast(msg, tone)}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>
            세종특별자치시 보건환경연구원 축산물분석과 · 브라우저 로컬 저장소(localStorage) 기반 오프라인 검토 보조 도구
          </span>
          <span>
            법정 판정 및 최종 성적서 발행 시 반드시 공고된 원문 기준규격과 대조하십시오.
          </span>
        </div>
      </footer>

      {/* 토스트 알림 */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex max-w-md items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-lg"
        >
          {toast.tone === 'success' ? (
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle
              className="h-4 w-4 shrink-0 text-rose-400"
              aria-hidden="true"
            />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="알림 닫기"
            className="ml-1 rounded p-0.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
