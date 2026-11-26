import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EvaluatedSample } from '../types';

interface InspectionChartsProps {
  evaluatedSamples: EvaluatedSample[];
}

interface PieSlice {
  name: string;
  value: number;
  color: string;
  percent: number;
}

interface DailyTrendRow {
  date: string;
  label: string;
  적합: number;
  부적합: number;
  확인필요: number;
  total: number;
}

interface CustomTooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  payload?: PieSlice & DailyTrendRow;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string;
}

function PieCustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const percent = item.payload?.percent ?? 0;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <span
          className="inline-block h-2.5 w-2.5 rounded-xs"
          style={{ backgroundColor: item.payload?.color || '#0f172a' }}
        />
        <span>{item.name}</span>
      </div>
      <div className="mt-1 font-mono text-slate-700 tabular-nums">
        {item.value ?? 0}건 ({percent.toFixed(1)}%)
      </div>
    </div>
  );
}

function BarCustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  const fullDate = row?.date || label;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <div className="border-b border-slate-100 pb-1 font-mono font-semibold text-slate-900 tabular-nums">
        {fullDate} (총 {row?.total ?? 0}건)
      </div>
      <div className="mt-1.5 space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-4 tabular-nums"
          >
            <span className="flex items-center gap-1.5 text-slate-700">
              <span
                className="inline-block h-2 w-2 rounded-xs"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-mono font-semibold text-slate-900">
              {entry.value ?? 0}건
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InspectionCharts({ evaluatedSamples }: InspectionChartsProps) {
  const { pieData, allBuckets, totalCount, conformingRate } = useMemo(() => {
    let conforming = 0;
    let nonConforming = 0;
    let attention = 0;

    for (const s of evaluatedSamples) {
      if (s.effectiveStatus === '적합') conforming += 1;
      else if (s.effectiveStatus === '부적합') nonConforming += 1;
      else attention += 1;
    }

    const total = evaluatedSamples.length;
    const calcPct = (val: number) => (total > 0 ? (val / total) * 100 : 0);

    const buckets: PieSlice[] = [
      {
        name: '적합',
        value: conforming,
        color: '#059669',
        percent: calcPct(conforming),
      },
      {
        name: '부적합',
        value: nonConforming,
        color: '#e11d48',
        percent: calcPct(nonConforming),
      },
      {
        name: '확인필요',
        value: attention,
        color: '#d97706',
        percent: calcPct(attention),
      },
    ];

    return {
      pieData: buckets.filter((b) => b.value > 0),
      allBuckets: buckets,
      totalCount: total,
      conformingRate: total > 0 ? ((conforming / total) * 100).toFixed(1) : '0.0',
    };
  }, [evaluatedSamples]);

  const dailyData = useMemo<DailyTrendRow[]>(() => {
    const map = new Map<string, DailyTrendRow>();

    for (const sample of evaluatedSamples) {
      const dateStr =
        sample.createdAt && sample.createdAt.length >= 10
          ? sample.createdAt.slice(0, 10)
          : '날짜미상';

      const existing = map.get(dateStr) ?? {
        date: dateStr,
        label: dateStr.length === 10 ? dateStr.slice(5) : dateStr,
        적합: 0,
        부적합: 0,
        확인필요: 0,
        total: 0,
      };

      if (sample.effectiveStatus === '적합') {
        existing.적합 += 1;
      } else if (sample.effectiveStatus === '부적합') {
        existing.부적합 += 1;
      } else {
        existing.확인필요 += 1;
      }
      existing.total += 1;
      map.set(dateStr, existing);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [evaluatedSamples]);

  return (
    <section
      aria-label="검사 현황 시각화 요약"
      className="grid grid-cols-1 gap-5 lg:grid-cols-12"
    >
      {/* 좌측: 적합 / 부적합 비율 파이 차트 */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-5">
        <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              판정 결과 비율 (적합 · 부적합)
            </h2>
            <p className="text-xs text-slate-500">
              등록 시료 {totalCount}건 기준 실시간 집계
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">
            적합률 {conformingRate}%
          </span>
        </div>

        {totalCount === 0 ? (
          <div className="flex h-52 items-center justify-center text-xs text-slate-400">
            시료 데이터가 등록되면 판정 비율 차트가 표시됩니다.
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
            <div className="relative h-52 sm:col-span-7">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={pieData.length > 1 ? 2 : 0}
                    stroke="#ffffff"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieCustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* 도넛 중앙 요약 */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-medium text-slate-500">
                  전체
                </span>
                <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {totalCount}건
                </span>
              </div>
            </div>

            <div className="space-y-2.5 sm:col-span-5">
              {allBuckets.map((bucket) => (
                <div
                  key={bucket.name}
                  className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-xs last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-xs"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <span>{bucket.name}</span>
                  </div>
                  <div className="font-mono tabular-nums text-right">
                    <span className="font-semibold text-slate-900">
                      {bucket.value}건
                    </span>
                    <span className="ml-1.5 text-[11px] text-slate-500">
                      ({bucket.percent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 우측: 날짜별 검사 건수 추이 막대 그래프 */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-7">
        <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              날짜별 검사 건수 추이
            </h2>
            <p className="text-xs text-slate-500">
              등록 일자별 시료 판정 분포 현황
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            집계 일수 {dailyData.length}일
          </span>
        </div>

        {dailyData.length === 0 ? (
          <div className="flex h-52 items-center justify-center text-xs text-slate-400">
            시료 데이터가 등록되면 날짜별 추이 그래프가 표시됩니다.
          </div>
        ) : (
          <div className="mt-3 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyData}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                barCategoryGap="28%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<BarCustomTooltip />}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }}
                  iconType="square"
                  iconSize={9}
                />
                <Bar
                  dataKey="적합"
                  stackId="daily"
                  fill="#059669"
                  maxBarSize={44}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="부적합"
                  stackId="daily"
                  fill="#e11d48"
                  maxBarSize={44}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="확인필요"
                  stackId="daily"
                  fill="#d97706"
                  maxBarSize={44}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
