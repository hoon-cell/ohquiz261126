import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const VALID_CATEGORIES = new Set([
  '식육',
  '식용란',
  '원유·유가공품',
  '식육가공품',
  '기타',
]);

interface ScanReceiptBody {
  imageBase64?: unknown;
  mimeType?: unknown;
}

interface ScanReceiptResult {
  sampleId: string;
  productDetail: string;
  category: string;
  testItem: string;
  notes: string;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  app.post('/api/scan-receipt', async (req, res) => {
    try {
      const body = (req.body || {}) as ScanReceiptBody;
      const rawBase64 =
        typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
      const mimeType =
        typeof body.mimeType === 'string' ? body.mimeType.trim() : '';

      if (!rawBase64 || !ALLOWED_MIME_TYPES.has(mimeType)) {
        res.status(400).json({
          error:
            '유효한 시료 접수증 이미지(JPG, PNG, WEBP)를 업로드해 주세요.',
        });
        return;
      }

      // Data URL 접두사가 포함된 경우 순수 base64 부분만 분리
      const base64Data = rawBase64.includes(',')
        ? rawBase64.split(',')[1] || ''
        : rawBase64;

      if (!base64Data || base64Data.length > 9_000_000) {
        res.status(400).json({
          error: '이미지 크기가 너무 크거나 올바른 형식이 아닙니다.',
        });
        return;
      }

      const ai = getGeminiClient();

      const prompt = [
        '당신은 대한민국 공공기관 보건환경연구원 축산물분석과의 시료 접수증 판독 보조 도구입니다.',
        '첨부된 시료 접수증(또는 시험의뢰서·시료 라벨) 이미지에서 다음 정보를 정확히 추출하세요.',
        '1. sampleId: 시료번호 또는 접수번호 (예: 2026-축산-001, 2026-A-105 등). 문서에 없으면 빈 문자열("").',
        '2. productDetail: 세부 품목명 또는 시료명 (예: 한우 등심, 돈육 삼겹살, 유정란, 멸균우유, 프레스햄 등). 문서에 없으면 빈 문자열("").',
        '3. category: 다음 5개 중 가장 일치하는 축산물 유형 1개 ("식육", "식용란", "원유·유가공품", "식육가공품", "기타"). 판단이 어려우면 빈 문자열("").',
        '4. testItem: 접수증에 의뢰 검사항목이 적혀 있으면 해당 항목명 (없으면 빈 문자열 "").',
        '5. notes: 수거 장소, 의뢰기관, 특이사항 등 참고 메모 요약 1줄 (없으면 빈 문자열 "").',
        '추측하여 가짜 번호를 지어내지 말고 이미지에 실제로 보이는 내용만 추출하세요.',
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sampleId: {
                type: Type.STRING,
                description: '시료번호 또는 접수번호',
              },
              productDetail: {
                type: Type.STRING,
                description: '세부 품목명 또는 시료명',
              },
              category: {
                type: Type.STRING,
                description:
                  '축산물 유형 (식육, 식용란, 원유·유가공품, 식육가공품, 기타 중 하나 또는 빈 문자열)',
              },
              testItem: {
                type: Type.STRING,
                description: '의뢰 검사항목명 (없으면 빈 문자열)',
              },
              notes: {
                type: Type.STRING,
                description: '추가 참고 메모 (없으면 빈 문자열)',
              },
            },
            required: ['sampleId', 'productDetail'],
          },
        },
      });

      const jsonText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(jsonText) as Partial<ScanReceiptResult>;

      const category =
        typeof parsed.category === 'string' &&
        VALID_CATEGORIES.has(parsed.category.trim())
          ? parsed.category.trim()
          : '';

      res.json({
        sampleId:
          typeof parsed.sampleId === 'string' ? parsed.sampleId.trim() : '',
        productDetail:
          typeof parsed.productDetail === 'string'
            ? parsed.productDetail.trim()
            : '',
        category,
        testItem:
          typeof parsed.testItem === 'string' ? parsed.testItem.trim() : '',
        notes: typeof parsed.notes === 'string' ? parsed.notes.trim() : '',
      });
    } catch (error: unknown) {
      const errObj = error as { message?: string; status?: number };
      if (errObj?.message === 'GEMINI_API_KEY_MISSING') {
        res.status(500).json({
          error:
            '서버에 GEMINI_API_KEY가 설정되어 있지 않습니다. Settings > Secrets에서 API 키를 확인해 주세요.',
        });
        return;
      }
      if (errObj?.status === 403 || errObj?.status === 400) {
        res.status(errObj.status).json({
          error:
            'Gemini API 인증 또는 요청 처리에 실패했습니다. Settings > Secrets의 API 키 설정을 확인해 주세요.',
        });
        return;
      }
      if (errObj?.status === 429) {
        res.status(429).json({
          error:
            '요청 한도를 초과했습니다. 잠시 후 다시 시료 접수증을 스캔해 주세요.',
        });
        return;
      }
      res.status(500).json({
        error:
          '시료 접수증 판독 중 오류가 발생했습니다. 선명한 이미지로 다시 시도해 주세요.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
