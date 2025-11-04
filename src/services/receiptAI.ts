import { ReceiptInput, normalizeCategory } from '../types';
import { generativeModel } from './firebaseService';

type Extracted = {
  total?: number;
  dateTime?: string; // ISO if possible
  merchant?: string;
  category?: string;
};

export async function analyzeReceiptBase64(base64: string): Promise<ReceiptInput> {
  // Prompt the model to return strict JSON only
  const system = `Você é um extrator de dados de cupons fiscais.\n` +
    `Retorne SOMENTE JSON válido com as chaves: total(number), dateTime(string ISO), merchant(string), category(string PT-BR).`;

  const prompt = `A imagem a seguir é um cupom fiscal.\n` +
    `Extraia: valor total da compra, data e hora da transação, nome do estabelecimento e categoria da despesa.\n` +
    `Categoria deve ser uma palavra curta em PT-BR (ex.: alimentacao, transporte, lazer, mercado, saude, educacao, outros).`;

  const imagePart = {
    inlineData: {
      data: base64,
      mimeType: 'image/jpeg',
    },
  } as any;

  const result = await generativeModel.generateContent([
    { text: system },
    imagePart,
    { text: prompt + '\nResponda apenas com JSON.' },
  ] as any);

  const text = result.response.text() || '{}';
  let parsed: Extracted = {};
  try { parsed = JSON.parse(text); } catch {
    // tentativa de recuperar um JSON de dentro de texto
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try { parsed = JSON.parse(m[0]); } catch {}
    }
  }

  const total = Number(parsed.total ?? 0);
  const merchant = String(parsed.merchant ?? '').trim() || 'Desconhecido';
  const dateTime = (parsed.dateTime && !isNaN(Date.parse(parsed.dateTime)))
    ? new Date(parsed.dateTime).toISOString()
    : new Date().toISOString();
  const category = normalizeCategory(parsed.category);

  return { total, merchant, dateTime, category };
}

export async function generateInsightsFromSummary(summary: string): Promise<string> {
  const sys = `Você é um analista financeiro pessoal. Gere no máximo 4 insights objetivos, em PT-BR, com números comparativos quando possível.`;
  const prompt = `Dados agregados de despesas (JSON ou texto):\n${summary}\n` +
    `Crie recomendações e observações curtas e acionáveis.`;
  const res = await generativeModel.generateContent([{ text: sys }, { text: prompt }] as any);
  return res.response.text() ?? '';
}

export default {
  analyzeReceiptBase64,
  generateInsightsFromSummary,
};
