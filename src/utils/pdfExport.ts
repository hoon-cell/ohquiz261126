import { jsPDF } from 'jspdf';
import { EvaluatedSample, ReportHeaderConfig } from '../types';
import { formatCriterionRule, maskSampleId } from './evaluation';

interface ExportReportPdfParams {
  header: ReportHeaderConfig;
  targetSamples: EvaluatedSample[];
  maskIds: boolean;
  generatedAt: string;
  actionNote?: string;
}

const PAGE_W = 1240; // A4 width at ~150 DPI
const PAGE_H = 1754; // A4 height at ~150 DPI
const MARGIN_X = 76;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const FONT_FAMILY =
  '"IBM Plex Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return ['-'];
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para) {
      lines.push('');
      continue;
    }
    let currentLine = '';
    for (const char of para) {
      const testLine = currentLine + char;
      if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines.length > 0 ? lines : ['-'];
}

function createA4Canvas(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context initialization failed.');
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  ctx.textBaseline = 'top';
  return { canvas, ctx };
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  pageIndex: number,
  totalPages: number,
  department: string
) {
  const footerY = PAGE_H - 72;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X, footerY - 14);
  ctx.lineTo(PAGE_W - MARGIN_X, footerY - 14);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = `400 16px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText(
    `${department} · 내부 검토용 요약 문서 (법정 성적서 확정 전 원문 기준 대조 필수)`,
    MARGIN_X,
    footerY
  );

  ctx.textAlign = 'right';
  ctx.fillText(`- ${pageIndex} / ${totalPages} -`, PAGE_W - MARGIN_X, footerY);
  ctx.textAlign = 'left';
}

function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function exportReportToPdf({
  header,
  targetSamples,
  maskIds,
  generatedAt,
  actionNote = '동일 로트 재검사 여부 확인, 원시 크로마토그램/배지 판독 재검토, 관련 부서 통보 준비 등',
}: ExportReportPdfParams): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const pages: Array<{
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
  }> = [];

  const startNewPage = () => {
    const page = createA4Canvas();
    pages.push(page);
    return page;
  };

  let { ctx } = startNewPage();
  let y = 76;

  const deptText = header.department.trim() || '세종특별자치시 보건환경연구원 축산물분석과';
  const titleText =
    header.title.trim() || '축산물 안전성 검사 특이(부적합) 시료 검토 요약 보고서';
  const docNoText = header.documentNo.trim() || '-';
  const recipientText = header.recipient.trim() || '-';
  const authorText = header.author.trim() || '-';

  // 1. 기관 상단 표기 및 공식 문서 제목
  ctx.fillStyle = '#475569';
  ctx.font = `600 18px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(deptText, PAGE_W / 2, y);
  y += 34;

  ctx.fillStyle = '#0f172a';
  ctx.font = `700 32px ${FONT_FAMILY}`;
  const titleLines = wrapTextLines(ctx, titleText, CONTENT_W - 40);
  for (const line of titleLines) {
    ctx.fillText(line, PAGE_W / 2, y);
    y += 42;
  }
  ctx.textAlign = 'left';
  y += 8;

  // 이중선 공식 문서 구분선
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X, y);
  ctx.lineTo(PAGE_W - MARGIN_X, y);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X, y + 6);
  ctx.lineTo(PAGE_W - MARGIN_X, y + 6);
  ctx.stroke();
  y += 28;

  // 2. 문서 메타데이터 표 (2x3 구조)
  const nonConformingCount = targetSamples.filter(
    (s) => s.effectiveStatus === '부적합'
  ).length;
  const recheckCount = targetSamples.filter(
    (s) => s.effectiveStatus === '재확인필요'
  ).length;

  const metaRows: Array<[string, string, string, string]> = [
    ['문서번호', docNoText, '작성일시', generatedAt],
    ['작성부서', deptText, '담당 수의사', authorText],
    [
      '수신(보고대상)',
      recipientText,
      '대상 건수',
      `부적합 ${nonConformingCount}건 / 재확인 필요 ${recheckCount}건 (총 ${targetSamples.length}건)`,
    ],
  ];

  const metaRowH = 44;
  const labelW = 160;
  const valW = CONTENT_W / 2 - labelW;

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#cbd5e1';

  for (const [l1, v1, l2, v2] of metaRows) {
    // 배경 (라벨 셀)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(MARGIN_X, y, labelW, metaRowH);
    ctx.fillRect(MARGIN_X + CONTENT_W / 2, y, labelW, metaRowH);

    // 테두리
    ctx.strokeRect(MARGIN_X, y, labelW, metaRowH);
    ctx.strokeRect(MARGIN_X + labelW, y, valW, metaRowH);
    ctx.strokeRect(MARGIN_X + CONTENT_W / 2, y, labelW, metaRowH);
    ctx.strokeRect(MARGIN_X + CONTENT_W / 2 + labelW, y, valW, metaRowH);

    // 텍스트
    ctx.font = `600 17px ${FONT_FAMILY}`;
    ctx.fillStyle = '#334155';
    ctx.fillText(l1, MARGIN_X + 12, y + 13);
    ctx.fillText(l2, MARGIN_X + CONTENT_W / 2 + 12, y + 13);

    ctx.font = `400 17px ${FONT_FAMILY}`;
    ctx.fillStyle = '#0f172a';
    const v1Trim = wrapTextLines(ctx, v1, valW - 24)[0];
    const v2Trim = wrapTextLines(ctx, v2, valW - 24)[0];
    ctx.fillText(v1Trim, MARGIN_X + labelW + 12, y + 13);
    ctx.fillText(v2Trim, MARGIN_X + CONTENT_W / 2 + labelW + 12, y + 13);

    y += metaRowH;
  }

  y += 18;

  // 3. 검토 보조 안내 바
  ctx.fillStyle = '#fffbeb';
  ctx.fillRect(MARGIN_X, y, CONTENT_W, 40);
  ctx.strokeStyle = '#fde68a';
  ctx.strokeRect(MARGIN_X, y, CONTENT_W, 40);
  ctx.fillStyle = '#92400e';
  ctx.font = `500 16px ${FONT_FAMILY}`;
  ctx.fillText(
    '※ 본 문서는 수의사 검토 보조용 요약 자료이며, 최종 법정 판정 및 성적서 확정은 원문 기준 대조를 거쳐야 합니다.',
    MARGIN_X + 14,
    y + 11
  );
  y += 58;

  // 4. 부적합 및 재확인 필요 시료 상세 표
  ctx.fillStyle = '#0f172a';
  ctx.font = `700 21px ${FONT_FAMILY}`;
  ctx.fillText('1. 특이(부적합 · 재확인 필요) 시료 검토 내역', MARGIN_X, y);
  y += 34;

  // 컬럼 폭 정의 (합계 = CONTENT_W = 1088)
  const cols = [
    { key: 'idx', label: '번호', width: 52 },
    { key: 'sampleId', label: '시료번호', width: 150 },
    { key: 'product', label: '품목 (세부품목)', width: 168 },
    { key: 'testItem', label: '검사항목', width: 160 },
    { key: 'result', label: '측정값 / 기준', width: 170 },
    { key: 'status', label: '판정', width: 102 },
    { key: 'memo', label: '검토의견', width: 286 },
  ];

  const drawTableHeader = (targetCtx: CanvasRenderingContext2D, startY: number) => {
    const headerH = 42;
    let curX = MARGIN_X;
    targetCtx.fillStyle = '#f1f5f9';
    targetCtx.fillRect(MARGIN_X, startY, CONTENT_W, headerH);
    targetCtx.strokeStyle = '#94a3b8';
    targetCtx.lineWidth = 1;

    targetCtx.font = `700 16px ${FONT_FAMILY}`;
    targetCtx.fillStyle = '#1e293b';

    for (const col of cols) {
      targetCtx.strokeRect(curX, startY, col.width, headerH);
      targetCtx.fillText(col.label, curX + 10, startY + 12);
      curX += col.width;
    }
    return startY + headerH;
  };

  y = drawTableHeader(ctx, y);

  if (targetSamples.length === 0) {
    const emptyH = 72;
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(MARGIN_X, y, CONTENT_W, emptyH);
    ctx.fillStyle = '#64748b';
    ctx.font = `400 17px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(
      '현재 부적합 또는 재확인 필요로 분류된 시료가 없습니다.',
      PAGE_W / 2,
      y + 26
    );
    ctx.textAlign = 'left';
    y += emptyH;
  } else {
    for (let i = 0; i < targetSamples.length; i++) {
      const sample = targetSamples[i];
      const displayId = maskIds
        ? maskSampleId(sample.sampleId)
        : sample.sampleId;
      const productText = sample.productDetail
        ? `${sample.category}\n(${sample.productDetail})`
        : sample.category;
      const measuredUnit =
        sample.unit && sample.unit !== '-' ? ` ${sample.unit}` : '';
      const criterionText = sample.matchedCriterion
        ? formatCriterionRule(sample.matchedCriterion)
        : '기준미등록';
      const resultText = `${sample.measuredValue}${measuredUnit}\n/ ${criterionText}`;
      const defaultOpinion =
        sample.effectiveStatus === '부적합'
          ? '기준치 초과 또는 검출 확인 — 원시 데이터 검증 및 재시험 검토 요망'
          : '판정 보류 — 시험 과정 및 측정값 재확인 필요';
      const opinionText = sample.memo.trim() || defaultOpinion;

      ctx.font = `400 16px ${FONT_FAMILY}`;
      const cellLines = [
        [String(i + 1)],
        wrapTextLines(ctx, displayId, cols[1].width - 18),
        wrapTextLines(ctx, productText, cols[2].width - 18),
        wrapTextLines(ctx, sample.testItem, cols[3].width - 18),
        wrapTextLines(ctx, resultText, cols[4].width - 18),
        [sample.effectiveStatus],
        wrapTextLines(ctx, opinionText, cols[6].width - 18),
      ];

      const maxLines = Math.max(...cellLines.map((l) => l.length));
      const rowH = Math.max(46, maxLines * 24 + 20);

      // 페이지 넘김 체크
      if (y + rowH > PAGE_H - 130) {
        ({ ctx } = startNewPage());
        y = 84;
        y = drawTableHeader(ctx, y);
      }

      if (sample.effectiveStatus === '부적합') {
        ctx.fillStyle = '#fff1f2';
        ctx.fillRect(MARGIN_X, y, CONTENT_W, rowH);
      }

      let curX = MARGIN_X;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;

      for (let c = 0; c < cols.length; c++) {
        ctx.strokeRect(curX, y, cols[c].width, rowH);
        const lines = cellLines[c];

        if (c === 5) {
          ctx.font = `700 16px ${FONT_FAMILY}`;
          ctx.fillStyle =
            sample.effectiveStatus === '부적합' ? '#be123c' : '#b45309';
        } else if (c === 1) {
          ctx.font = `600 15px ${FONT_FAMILY}`;
          ctx.fillStyle = '#0f172a';
        } else {
          ctx.font = `400 16px ${FONT_FAMILY}`;
          ctx.fillStyle = '#1e293b';
        }

        let lineY = y + 12;
        for (const line of lines) {
          ctx.fillText(line, curX + 9, lineY);
          lineY += 24;
        }
        curX += cols[c].width;
      }

      y += rowH;
    }
  }

  y += 32;

  // 5. 조치 검토 사항 및 확인란 (공간 부족 시 다음 페이지)
  if (y + 230 > PAGE_H - 96) {
    ({ ctx } = startNewPage());
    y = 84;
  }

  ctx.fillStyle = '#0f172a';
  ctx.font = `700 21px ${FONT_FAMILY}`;
  ctx.fillText('2. 조치 검토 사항 및 확인', MARGIN_X, y);
  y += 32;

  ctx.font = `400 17px ${FONT_FAMILY}`;
  const actionLines = wrapTextLines(ctx, `· ${actionNote}`, CONTENT_W - 36);
  const actionBoxH = Math.max(76, actionLines.length * 26 + 32);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(MARGIN_X, y, CONTENT_W, actionBoxH);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(MARGIN_X, y, CONTENT_W, actionBoxH);

  ctx.fillStyle = '#1e293b';
  let ay = y + 18;
  for (const line of actionLines) {
    ctx.fillText(line, MARGIN_X + 18, ay);
    ay += 26;
  }
  y += actionBoxH + 28;

  // 결재/확인란 (우측 정렬)
  const signW = 360;
  const signX = PAGE_W - MARGIN_X - signW;
  const halfSignW = signW / 2;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(signX, y, signW, 34);
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(signX, y, halfSignW, 34);
  ctx.strokeRect(signX + halfSignW, y, halfSignW, 34);
  ctx.strokeRect(signX, y + 34, halfSignW, 64);
  ctx.strokeRect(signX + halfSignW, y + 34, halfSignW, 64);

  ctx.fillStyle = '#334155';
  ctx.font = `600 16px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('작성(검토)', signX + halfSignW / 2, y + 9);
  ctx.fillText('확인(과장)', signX + halfSignW + halfSignW / 2, y + 9);

  ctx.fillStyle = '#475569';
  ctx.font = `400 15px ${FONT_FAMILY}`;
  ctx.fillText(authorText, signX + halfSignW / 2, y + 58);
  ctx.fillText('(서명)', signX + halfSignW + halfSignW / 2, y + 58);
  ctx.textAlign = 'left';
  y += 126;

  // 6. 첨부 증빙 사진 섹션 (사진이 있는 대상 시료만 출력)
  const photoSamples = targetSamples.filter((s) => Boolean(s.photoUrl));
  if (photoSamples.length > 0) {
    const loadedImages = await Promise.all(
      photoSamples.map((s) => loadImageElement(s.photoUrl!))
    );

    const cardGap = 24;
    const cardW = (CONTENT_W - cardGap) / 2;
    const imgH = Math.round((cardW - 24) * 0.72);
    const cardH = imgH + 92;

    if (y + 54 + cardH > PAGE_H - 96) {
      ({ ctx } = startNewPage());
      y = 84;
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = `700 21px ${FONT_FAMILY}`;
    ctx.fillText('3. 첨부: 부적합 · 재확인 시료 증빙 사진', MARGIN_X, y);
    y += 36;

    for (let i = 0; i < photoSamples.length; i += 2) {
      if (y + cardH > PAGE_H - 96) {
        ({ ctx } = startNewPage());
        y = 84;
      }

      for (let col = 0; col < 2; col++) {
        const idx = i + col;
        if (idx >= photoSamples.length) break;

        const sample = photoSamples[idx];
        const imgEl = loadedImages[idx];
        const cardX = MARGIN_X + col * (cardW + cardGap);
        const displayId = maskIds
          ? maskSampleId(sample.sampleId)
          : sample.sampleId;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cardX, y, cardW, cardH);
        ctx.strokeStyle =
          sample.effectiveStatus === '부적합' ? '#fda4af' : '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX, y, cardW, cardH);

        // 이미지 박스
        const imgBoxX = cardX + 12;
        const imgBoxY = y + 12;
        const imgBoxW = cardW - 24;
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(imgBoxX, imgBoxY, imgBoxW, imgH);

        if (imgEl) {
          const scale = Math.min(
            imgBoxW / imgEl.naturalWidth,
            imgH / imgEl.naturalHeight
          );
          const drawW = imgEl.naturalWidth * scale;
          const drawH = imgEl.naturalHeight * scale;
          const drawX = imgBoxX + (imgBoxW - drawW) / 2;
          const drawY = imgBoxY + (imgH - drawH) / 2;
          ctx.drawImage(imgEl, drawX, drawY, drawW, drawH);
        } else {
          ctx.fillStyle = '#64748b';
          ctx.font = `400 15px ${FONT_FAMILY}`;
          ctx.textAlign = 'center';
          ctx.fillText(
            '이미지를 불러올 수 없습니다.',
            imgBoxX + imgBoxW / 2,
            imgBoxY + imgH / 2 - 8
          );
          ctx.textAlign = 'left';
        }

        // 캡션 텍스트
        const textY = imgBoxY + imgH + 12;
        ctx.font = `700 15px ${FONT_FAMILY}`;
        ctx.fillStyle =
          sample.effectiveStatus === '부적합' ? '#be123c' : '#b45309';
        ctx.fillText(
          `[${sample.effectiveStatus}] ${displayId} · ${sample.testItem}`,
          imgBoxX,
          textY
        );

        ctx.font = `400 14px ${FONT_FAMILY}`;
        ctx.fillStyle = '#475569';
        const capLines = wrapTextLines(
          ctx,
          sample.photoCaption || sample.memo || '검사 증빙 사진',
          imgBoxW
        );
        ctx.fillText(capLines[0], imgBoxX, textY + 24);
      }

      y += cardH + 20;
    }
  }

  // 모든 페이지 하단 푸터 및 페이지 번호 렌더링
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    drawFooter(p.ctx, idx + 1, totalPages, deptText);
  });

  // jsPDF 생성 및 다운로드
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pages.forEach((p, idx) => {
    if (idx > 0) {
      pdf.addPage();
    }
    const imgData = p.canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
  });

  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeDocNo = docNoText.replace(/[^a-zA-Z0-9가-힣-_]/g, '_');
  pdf.save(`축산물_검토요약_${safeDocNo}_${dateStamp}.pdf`);
}
