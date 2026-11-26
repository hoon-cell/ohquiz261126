import {
  AutoJudgmentStatus,
  Criterion,
  DEFAULT_REPORT_HEADER,
  EvaluatedSample,
  FilterStatus,
  JudgmentStatus,
  ProductCategory,
  ReferencePhotoItem,
  ReportHeaderConfig,
  SampleRecord,
} from '../types';

export const STORAGE_KEYS = {
  CRITERIA: 'sejong_livestock_criteria_v1',
  SAMPLES: 'sejong_livestock_samples_v1',
  REPORT_HEADER: 'sejong_livestock_report_header_v1',
  INITIALIZED: 'sejong_livestock_initialized_v1',
};

/**
 * 실제 법정 기준규격이 아닌 시스템 동작 테스트용 더미 예시 데이터입니다.
 */
export const SAMPLE_DUMMY_CRITERIA: Criterion[] = [
  {
    id: 'crit-dummy-1',
    category: '식육',
    testItem: '옥시테트라사이클린(테스트예시)',
    operator: '이하(<=)',
    threshold: 0.2,
    unit: 'mg/kg',
    note: '[테스트용 더미 예시] 실제 법정 기준 아님 — 정량 잔류물질 판정 테스트용',
    updatedAt: '2026-11-25 09:00',
  },
  {
    id: 'crit-dummy-2',
    category: '식용란',
    testItem: '살모넬라(테스트예시)',
    operator: '불검출',
    threshold: 0,
    unit: '-',
    note: '[테스트용 더미 예시] 실제 법정 기준 아님 — 정성(불검출/음성/양성) 판정 테스트용',
    updatedAt: '2026-11-25 09:00',
  },
  {
    id: 'crit-dummy-3',
    category: '원유·유가공품',
    testItem: '세균수(테스트예시)',
    operator: '미만(<)',
    threshold: 20000,
    unit: 'CFU/mL',
    note: '[테스트용 더미 예시] 실제 법정 기준 아님 — 미만(<) 연산자 경계값 테스트용',
    updatedAt: '2026-11-25 09:00',
  },
  {
    id: 'crit-dummy-4',
    category: '식육가공품',
    testItem: '아질산이온(테스트예시)',
    operator: '이하(<=)',
    threshold: 0.07,
    unit: 'g/kg',
    note: '[테스트용 더미 예시] 실제 법정 기준 아님 — 단위 불일치 경고 테스트용',
    updatedAt: '2026-11-25 09:00',
  },
];

export const REFERENCE_INSPECTION_PHOTOS: ReferencePhotoItem[] = [
  {
    id: 'ref-beef-normal',
    label: '적합 예시 · 한우 등심 정상 시료',
    caseType: '적합 예시',
    productCategory: '식육',
    description:
      '관능·외관 이상이 없고 잔류물질 정량 분석 결과 허용 기준 이하로 판정된 정상 식육 시료 예시입니다.',
    url: '/src/assets/images/sample_beef_normal_1795669746213.jpg',
  },
  {
    id: 'ref-dairy-normal',
    label: '적합 예시 · 원유 시료 및 음성 대조 배지',
    caseType: '적합 예시',
    productCategory: '원유·유가공품',
    description:
      '집락 형성이 관찰되지 않은 정상 대조 배지 및 멸균 채취 원유 시료 예시입니다.',
    url: '/src/assets/images/sample_dairy_normal_1795669746167.jpg',
  },
  {
    id: 'ref-pork-nonconforming',
    label: '부적합 사례 · 잔류물질 기준 초과 검출',
    caseType: '부적합 사례',
    productCategory: '식육',
    description:
      '추출액 바이알 분석 결과 크로마토그램 피크가 허용 기준선(Threshold)을 현저히 초과한 부적합 사례입니다.',
    url: '/src/assets/images/sample_nonconforming_pork_residue_1795669746798.jpg',
  },
  {
    id: 'ref-egg-salmonella',
    label: '부적합 사례 · 살모넬라 양성 배지 판독',
    caseType: '부적합 사례',
    productCategory: '식용란',
    description:
      'XLD 선택배지 상에 중심부가 흑색을 띠는 전형적인 살모넬라균 양성 집락이 확인된 부적합 사례입니다.',
    url: '/src/assets/images/sample_nonconforming_salmonella_plate_1795669746861.jpg',
  },
];

export const SAMPLE_DUMMY_RECORDS: SampleRecord[] = [
  {
    id: 'samp-dummy-1',
    sampleId: '2026-축산-001',
    category: '식육',
    productDetail: '한우 등심(테스트예시)',
    testItem: '옥시테트라사이클린(테스트예시)',
    measuredValue: '0.08',
    unit: 'mg/kg',
    memo: '관능 정상 및 크로마토그램 피크 기준 이하 양호',
    manualRecheck: false,
    createdAt: '2026-11-23 10:12',
    photoUrl: '/src/assets/images/sample_beef_normal_1795669746213.jpg',
    photoCaption: '적합 예시: 한우 등심 전처리 시료 외관',
  },
  {
    id: 'samp-dummy-2',
    sampleId: '2026-축산-002',
    category: '식육',
    productDetail: '국내산 돈육 삼겹살(테스트예시)',
    testItem: '옥시테트라사이클린(테스트예시)',
    measuredValue: '0.46',
    unit: 'mg/kg',
    memo: '기준치 초과 검출 — 크로마토그램 피크 재확인 및 추출액 희석 재분석 필요',
    manualRecheck: false,
    createdAt: '2026-11-23 14:28',
    photoUrl: '/src/assets/images/sample_nonconforming_pork_residue_1795669746798.jpg',
    photoCaption: '부적합 사례: 기준선 초과 잔류물질 검출 크로마토그램 및 추출 바이알',
  },
  {
    id: 'samp-dummy-3',
    sampleId: '2026-축산-003',
    category: '식용란',
    productDetail: '특란(테스트예시)',
    testItem: '살모넬라(테스트예시)',
    measuredValue: '불검출',
    unit: '-',
    memo: '음성 대조군 및 배지 판독 정상',
    manualRecheck: false,
    createdAt: '2026-11-24 11:05',
  },
  {
    id: 'samp-dummy-4',
    sampleId: '2026-축산-004',
    category: '원유·유가공품',
    productDetail: '집유 원유(테스트예시)',
    testItem: '세균수(테스트예시)',
    measuredValue: '20000',
    unit: 'CFU/mL',
    memo: '경계치(20,000) 도출 — 희석배수 및 집락 계수 재판독 요망',
    manualRecheck: true,
    createdAt: '2026-11-24 15:30',
    photoUrl: '/src/assets/images/sample_dairy_normal_1795669746167.jpg',
    photoCaption: '참고 예시: 원유 시료 및 음성 대조 배지 비교',
  },
  {
    id: 'samp-dummy-5',
    sampleId: '2026-축산-005',
    category: '식육가공품',
    productDetail: '프레스햄(테스트예시)',
    testItem: '아질산이온(테스트예시)',
    measuredValue: '25',
    unit: 'mg/kg',
    memo: '단위 환산(mg/kg ↔ g/kg) 확인 필요',
    manualRecheck: false,
    createdAt: '2026-11-25 13:15',
  },
  {
    id: 'samp-dummy-6',
    sampleId: '2026-축산-006',
    category: '식용란',
    productDetail: '유정란(테스트예시)',
    testItem: '살모넬라(테스트예시)',
    measuredValue: '양성',
    unit: '-',
    memo: 'XLD 배지 흑색 중심 집락 확인 — 생화학 동정 및 관련 농가·유통 이력 확인 필요',
    manualRecheck: false,
    createdAt: '2026-11-25 14:40',
    photoUrl: '/src/assets/images/sample_nonconforming_salmonella_plate_1795669746861.jpg',
    photoCaption: '부적합 사례: XLD 선택배지 살모넬라 양성 집락 판독',
  },
];

export const DUMMY_CATEGORY_DEFAULT: ProductCategory = '식육';

export function formatNumberClean(num: number): string {
  if (!Number.isFinite(num)) return String(num);
  const rounded = Number(num.toFixed(6));
  return rounded.toLocaleString('ko-KR', {
    maximumFractionDigits: 6,
  });
}

export function parseNumericValue(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatCriterionRule(criterion: Criterion): string {
  if (criterion.operator === '불검출') {
    const unitPart =
      criterion.unit && criterion.unit !== '-' ? ` (${criterion.unit})` : '';
    return `불검출${unitPart}`;
  }
  const opSymbol = criterion.operator === '이하(<=)' ? '이하' : '미만';
  const unitPart = criterion.unit ? ` ${criterion.unit}` : '';
  return `${formatNumberClean(criterion.threshold)}${unitPart} ${opSymbol}`;
}

export function evaluateSample(
  sample: SampleRecord,
  criteria: Criterion[]
): EvaluatedSample {
  const normalizedItem = sample.testItem.trim().toLowerCase();
  const matchedCriterion =
    criteria.find(
      (c) =>
        c.category === sample.category &&
        c.testItem.trim().toLowerCase() === normalizedItem
    ) ?? null;

  if (!matchedCriterion) {
    const autoStatus: AutoJudgmentStatus = '기준미등록';
    return {
      ...sample,
      autoStatus,
      effectiveStatus: sample.manualRecheck ? '재확인필요' : autoStatus,
      matchedCriterion: null,
      comparisonText: '일치하는 검사 기준 없음',
      isExceeding: false,
    };
  }

  const sampleUnit = sample.unit.trim();
  const criterionUnit = matchedCriterion.unit.trim();
  if (sampleUnit !== criterionUnit) {
    const autoStatus: AutoJudgmentStatus = '단위확인필요';
    return {
      ...sample,
      autoStatus,
      effectiveStatus: sample.manualRecheck ? '재확인필요' : autoStatus,
      matchedCriterion,
      comparisonText: `단위 불일치 (입력: ${sampleUnit || '없음'} / 기준: ${criterionUnit || '없음'})`,
      isExceeding: false,
    };
  }

  const rawVal = sample.measuredValue.trim();
  const isNonDetectWord = rawVal === '불검출' || rawVal === '음성';
  const isPositiveWord = rawVal === '양성';
  const numericVal = parseNumericValue(rawVal);

  let autoStatus: AutoJudgmentStatus | '재확인필요' = '재확인필요';
  let comparisonText = '';
  let isExceeding = false;

  if (matchedCriterion.operator === '불검출') {
    if (isNonDetectWord || numericVal === 0) {
      autoStatus = '적합';
      comparisonText = '불검출 기준 충족';
    } else if (isPositiveWord) {
      autoStatus = '부적합';
      comparisonText = '양성 검출 (불검출 기준 위배)';
      isExceeding = true;
    } else if (numericVal !== null) {
      autoStatus = '부적합';
      const unitSuffix = criterionUnit && criterionUnit !== '-' ? ` ${criterionUnit}` : '';
      comparisonText = `검출됨 (+${formatNumberClean(numericVal)}${unitSuffix})`;
      isExceeding = true;
    } else {
      autoStatus = '재확인필요';
      comparisonText = '측정값 판독 불가 (수치 또는 불검출/음성/양성 입력)';
    }
  } else {
    // '이하(<=)' 또는 '미만(<)'
    const threshold = matchedCriterion.threshold;
    const unitSuffix = criterionUnit && criterionUnit !== '-' ? ` ${criterionUnit}` : '';

    if (isNonDetectWord) {
      const passNonDetect =
        matchedCriterion.operator === '이하(<=)'
          ? 0 <= threshold
          : 0 < threshold;
      autoStatus = passNonDetect ? '적합' : '부적합';
      comparisonText = passNonDetect
        ? `불검출 (기준 대비 여유 ${formatNumberClean(threshold)}${unitSuffix})`
        : '불검출 입력 (기준치 0 미만 판정 확인 필요)';
      isExceeding = !passNonDetect;
    } else if (isPositiveWord) {
      autoStatus = '부적합';
      comparisonText = '양성 검출 — 정량 수치 확인 필요';
      isExceeding = true;
    } else if (numericVal !== null) {
      const passed =
        matchedCriterion.operator === '이하(<=)'
          ? numericVal <= threshold
          : numericVal < threshold;
      autoStatus = passed ? '적합' : '부적합';

      const diff = Number((numericVal - threshold).toFixed(6));
      if (passed) {
        const margin = Number((threshold - numericVal).toFixed(6));
        if (threshold > 0) {
          const ratioPct = Math.round((numericVal / threshold) * 100);
          comparisonText = `여유 ${formatNumberClean(margin)}${unitSuffix} (기준의 ${ratioPct}%)`;
        } else {
          comparisonText = `기준 이내 (${formatNumberClean(numericVal)}${unitSuffix})`;
        }
      } else {
        isExceeding = true;
        if (threshold > 0) {
          const multiple = (numericVal / threshold).toFixed(2);
          comparisonText =
            diff === 0
              ? `기준치 도달 (${multiple}배 · 미만 기준 초과)`
              : `기준 대비 ${multiple}배 (+${formatNumberClean(diff)}${unitSuffix})`;
        } else {
          comparisonText = `기준 초과 (+${formatNumberClean(diff)}${unitSuffix})`;
        }
      }
    } else {
      autoStatus = '재확인필요';
      comparisonText = '측정값 형식 확인 필요';
    }
  }

  const effectiveStatus: JudgmentStatus = sample.manualRecheck
    ? '재확인필요'
    : autoStatus;

  return {
    ...sample,
    autoStatus,
    effectiveStatus,
    matchedCriterion,
    comparisonText,
    isExceeding,
  };
}

export function matchesFilterStatus(
  status: JudgmentStatus,
  filter: FilterStatus
): boolean {
  if (filter === '전체') return true;
  if (filter === '적합') return status === '적합';
  if (filter === '부적합') return status === '부적합';
  return (
    status === '재확인필요' ||
    status === '기준미등록' ||
    status === '단위확인필요'
  );
}

export function maskSampleId(sampleId: string): string {
  const trimmed = sampleId.trim();
  if (!trimmed) return '';
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    const last = parts[parts.length - 1];
    const maskedLast = '*'.repeat(Math.max(last.length, 3));
    return [...parts.slice(0, -1), maskedLast].join('-');
  }
  if (trimmed.length <= 3) {
    return '*'.repeat(trimmed.length);
  }
  const keepCount = Math.ceil(trimmed.length / 2);
  return (
    trimmed.slice(0, keepCount) + '*'.repeat(trimmed.length - keepCount)
  );
}

export function formatCurrentDateTime(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function generateReportDraft(
  targetSamples: EvaluatedSample[],
  maskIds: boolean,
  generatedAt: string,
  header: ReportHeaderConfig = DEFAULT_REPORT_HEADER
): string {
  const nonConformingCount = targetSamples.filter(
    (s) => s.effectiveStatus === '부적합'
  ).length;
  const recheckCount = targetSamples.filter(
    (s) => s.effectiveStatus === '재확인필요'
  ).length;

  const titleLine = header.title.trim() || DEFAULT_REPORT_HEADER.title;
  const docNoLine = header.documentNo.trim() || '-';
  const deptLine = header.department.trim() || DEFAULT_REPORT_HEADER.department;
  const recipientLine = header.recipient.trim() || '-';
  const authorLine = header.author.trim() || '-';

  const lines: string[] = [
    `[${titleLine}]`,
    `- 문서번호: ${docNoLine} | 작성일시: ${generatedAt}`,
    `- 작성부서: ${deptLine} | 담당자: ${authorLine}`,
    `- 수신(보고대상): ${recipientLine}`,
    `- 대상 건수: 부적합 ${nonConformingCount}건 / 재확인 필요 ${recheckCount}건`,
    '',
  ];

  if (targetSamples.length === 0) {
    lines.push('현재 부적합 또는 재확인 필요로 분류된 시료가 없습니다.');
  } else {
    targetSamples.forEach((sample, index) => {
      const displayId = maskIds
        ? maskSampleId(sample.sampleId)
        : sample.sampleId;
      const productLabel = sample.productDetail
        ? `${sample.category} (${sample.productDetail})`
        : sample.category;
      const measuredUnit =
        sample.unit && sample.unit !== '-' ? `(${sample.unit})` : '';
      const criterionText = sample.matchedCriterion
        ? formatCriterionRule(sample.matchedCriterion)
        : '기준미등록';
      const defaultOpinion =
        sample.effectiveStatus === '부적합'
          ? '기준치 초과 또는 검출 확인 — 원시 데이터 검증 및 재시험 검토 요망'
          : '판정 보류 — 시험 과정 및 측정값 재확인 필요';
      const opinion = sample.memo.trim() ? sample.memo.trim() : defaultOpinion;

      lines.push(
        `${index + 1}. 시료번호: ${displayId} | 품목: ${productLabel} | 검사항목: ${sample.testItem}`
      );
      lines.push(
        `   · 검사결과: ${sample.measuredValue}${measuredUnit} / 기준: ${criterionText} -> ${sample.effectiveStatus}`
      );
      lines.push(`   · 검토의견: ${opinion}`);
    });
  }

  lines.push('');
  lines.push(
    '- 조치 검토 사항: 동일 로트 재검사 여부 확인, 원시 크로마토그램/배지 판독 재검토, 관련 부서 통보 준비 등'
  );

  return lines.join('\n');
}
