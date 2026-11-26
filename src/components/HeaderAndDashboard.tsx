import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  FlaskConical,
  Layers,
} from 'lucide-react';
import { AppTab, FilterStatus } from '../types';

export interface SummaryCounts {
  total: number;
  conforming: number;
  nonConforming: number;
  attentionNeeded: number;
  reportTargetCount: number;
}

interface HeaderAndDashboardProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  activeFilter: FilterStatus;
  onSelectFilterCard: (filter: FilterStatus) => void;
  counts: SummaryCounts;
  criteriaCount: number;
}

export function HeaderAndDashboard({
  activeTab,
  onSelectTab,
  activeFilter,
  onSelectFilterCard,
  counts,
  criteriaCount,
}: HeaderAndDashboardProps) {
  const cards: Array<{
    key: FilterStatus;
    label: string;
    sublabel: string;
    count: number;
    icon: typeof Layers;
    emphasis?: 'danger' | 'success' | 'warning' | 'neutral';
  }> = [
    {
      key: '전체',
      label: '전체 시료 건수',
      sublabel: '등록된 전체 검사 건',
      count: counts.total,
      icon: Layers,
      emphasis: 'neutral',
    },
    {
      key: '적합',
      label: '적합 건수',
      sublabel: '기준치 충족 판정',
      count: counts.conforming,
      icon: CheckCircle2,
      emphasis: 'success',
    },
    {
      key: '부적합',
      label: '부적합 건수',
      sublabel: '기준 초과 또는 검출',
      count: counts.nonConforming,
      icon: AlertCircle,
      emphasis: 'danger',
    },
    {
      key: '확인필요',
      label: '기준미등록 / 재확인 필요',
      sublabel: '기준표·단위·재판독 대기',
      count: counts.attentionNeeded,
      icon: AlertTriangle,
      emphasis: 'warning',
    },
  ];

  const getCardStyle = (
    key: FilterStatus,
    emphasis: 'danger' | 'success' | 'warning' | 'neutral' = 'neutral'
  ) => {
    const isSelected = activeTab === 'inspection' && activeFilter === key;

    if (emphasis === 'danger') {
      return isSelected
        ? 'border-rose-500 bg-rose-50/70 ring-1 ring-rose-500'
        : 'border-rose-200 bg-rose-50/40 hover:border-rose-300';
    }
    if (isSelected) {
      return 'border-slate-800 bg-white ring-1 ring-slate-800';
    }
    return 'border-slate-200 bg-white hover:border-slate-300';
  };

  const getCountColor = (
    emphasis: 'danger' | 'success' | 'warning' | 'neutral' = 'neutral'
  ) => {
    switch (emphasis) {
      case 'danger':
        return 'text-rose-700';
      case 'success':
        return 'text-emerald-700';
      case 'warning':
        return 'text-amber-700';
      default:
        return 'text-slate-900';
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 상단 기관 및 시스템 타이틀 영역 */}
        <div className="flex flex-col gap-3 py-3.5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>세종특별자치시 보건환경연구원</span>
              <span aria-hidden="true">·</span>
              <span>축산물분석과 수의사 검토 보조</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">등록 기준 {criteriaCount}건</span>
            </div>
            <h1 className="mt-0.5 flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              <FlaskConical
                className="h-5 w-5 shrink-0 text-slate-700"
                aria-hidden="true"
              />
              <span className="truncate">
                축산물 안전성 검사 판정 및 부적합 요약 보조 시스템 (검토용 프로토타입)
              </span>
            </h1>
          </div>

          {/* 3개 메인 탭 내비게이션 */}
          <nav
            aria-label="주요 업무 화면 이동"
            className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 shrink-0 overflow-x-auto"
          >
            <button
              type="button"
              onClick={() => onSelectTab('inspection')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'inspection'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              시료 검사 및 판정
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('criteria')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'criteria'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              검사 기준표 관리
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('report')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>부적합 요약 보고서</span>
              {counts.reportTargetCount > 0 && (
                <span className="ml-0.5 tabular-nums font-mono text-[11px] font-bold text-rose-700">
                  ({counts.reportTargetCount})
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* 상단 안내 배너 */}
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="h-3.5 w-3.5 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <span>
              ※ 본 도구는 수의사 검토 보조용이며, 최종 법정 판정 및 성적서 확정은 원문 기준 대조를 거쳐야 합니다.
            </span>
          </div>
        </div>

        {/* 실시간 요약 대시보드 카드 4개 (클릭 시 시료 목록 필터링 연동) */}
        <div className="grid grid-cols-2 gap-3 pb-3.5 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            const isSelected =
              activeTab === 'inspection' && activeFilter === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => onSelectFilterCard(card.key)}
                className={`group flex flex-col justify-between rounded-lg border px-4 py-3 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 ${getCardStyle(
                  card.key,
                  card.emphasis
                )}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {card.label}
                  </span>
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      card.emphasis === 'danger'
                        ? 'text-rose-600'
                        : card.emphasis === 'success'
                        ? 'text-emerald-600'
                        : card.emphasis === 'warning'
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span
                    className={`font-mono text-2xl font-bold tracking-tight tabular-nums ${getCountColor(
                      card.emphasis
                    )}`}
                  >
                    {card.count}
                    <span className="ml-1 font-sans text-xs font-medium text-slate-500">
                      건
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-500 truncate">
                    {isSelected ? '필터 적용 중' : card.sublabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
