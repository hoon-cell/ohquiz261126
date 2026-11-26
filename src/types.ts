export type ProductCategory =
  | '식육'
  | '식용란'
  | '원유·유가공품'
  | '식육가공품'
  | '기타';

export type OperatorType = '이하(<=)' | '미만(<)' | '불검출';

export type AutoJudgmentStatus =
  | '적합'
  | '부적합'
  | '기준미등록'
  | '단위확인필요';

export type JudgmentStatus = AutoJudgmentStatus | '재확인필요';

export type FilterStatus = '전체' | '적합' | '부적합' | '확인필요';

export type AppTab = 'inspection' | 'criteria' | 'report';

export interface Criterion {
  id: string;
  category: ProductCategory;
  testItem: string;
  operator: OperatorType;
  threshold: number;
  unit: string;
  note: string;
  updatedAt: string;
}

export interface SampleRecord {
  id: string;
  sampleId: string;
  category: ProductCategory;
  productDetail: string;
  testItem: string;
  measuredValue: string;
  unit: string;
  memo: string;
  manualRecheck: boolean;
  createdAt: string;
  photoUrl?: string;
  photoCaption?: string;
}

export interface ReferencePhotoItem {
  id: string;
  label: string;
  caseType: '적합 예시' | '부적합 사례';
  productCategory: ProductCategory;
  description: string;
  url: string;
}

export interface EvaluatedSample extends SampleRecord {
  autoStatus: AutoJudgmentStatus | '재확인필요';
  effectiveStatus: JudgmentStatus;
  matchedCriterion: Criterion | null;
  comparisonText: string;
  isExceeding: boolean;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  '식육',
  '식용란',
  '원유·유가공품',
  '식육가공품',
  '기타',
];

export const OPERATOR_TYPES: OperatorType[] = ['이하(<=)', '미만(<)', '불검출'];

export const COMMON_UNITS: string[] = [
  'mg/kg',
  'µg/kg',
  'CFU/g',
  'CFU/mL',
  '%',
  '-',
];

export interface ReportHeaderConfig {
  title: string;
  documentNo: string;
  department: string;
  recipient: string;
  author: string;
}

export const DEFAULT_REPORT_HEADER: ReportHeaderConfig = {
  title: '축산물 안전성 검사 특이(부적합) 시료 검토 요약 보고서',
  documentNo: '축산검토-2026-001',
  department: '세종특별자치시 보건환경연구원 축산물분석과',
  recipient: '축산물분석과장 (내부 검토용)',
  author: '담당 수의사',
};
