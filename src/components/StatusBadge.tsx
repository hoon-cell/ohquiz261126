import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { JudgmentStatus } from '../types';

interface StatusBadgeProps {
  status: JudgmentStatus;
  compact?: boolean;
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const paddingClass = compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case '적합':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 font-semibold text-emerald-800 whitespace-nowrap shrink-0 ${paddingClass}`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          적합
        </span>
      );
    case '부적합':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 font-semibold text-rose-800 whitespace-nowrap shrink-0 ${paddingClass}`}
        >
          <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" aria-hidden="true" />
          부적합
        </span>
      );
    case '재확인필요':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 font-semibold text-amber-800 whitespace-nowrap shrink-0 ${paddingClass}`}
        >
          <RotateCcw className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          재확인필요
        </span>
      );
    case '단위확인필요':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 font-semibold text-amber-800 whitespace-nowrap shrink-0 ${paddingClass}`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          단위확인필요
        </span>
      );
    case '기준미등록':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-100 font-medium text-slate-700 whitespace-nowrap shrink-0 ${paddingClass}`}
        >
          <HelpCircle className="h-3.5 w-3.5 text-slate-500 shrink-0" aria-hidden="true" />
          기준미등록
        </span>
      );
  }
}
