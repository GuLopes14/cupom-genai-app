export type Category =
  | 'alimentacao'
  | 'transporte'
  | 'lazer'
  | 'saude'
  | 'educacao'
  | 'mercado'
  | 'outros';

export interface ReceiptInput {
  base64Image?: string; // optional when editing
  total: number;
  dateTime: string; // ISO string
  merchant: string;
  category: Category;
}

export interface Receipt extends ReceiptInput {
  id: string;
  createdAt: string; // ISO
}

export interface Insight {
  id: string;
  month: string; // e.g., 2025-11
  text: string;
  createdAt: string; // ISO
}

export function monthKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function normalizeCategory(text?: string): Category {
  const t = (text || '').toLowerCase();
  if (/(aliment|rest|food|lanch|caf|bar)/.test(t)) return 'alimentacao';
  if (/(uber|99|transp|bus|metr|gas|combust|estac)/.test(t)) return 'transporte';
  if (/(cinema|lazer|entreten|netflix|spotify|game)/.test(t)) return 'lazer';
  if (/(saude|farm|clinic|medic|plano)/.test(t)) return 'saude';
  if (/(escola|curso|facul|educ)/.test(t)) return 'educacao';
  if (/(mercad|super|hort|atacad|carref|extra|pao de acucar)/.test(t)) return 'mercado';
  return 'outros';
}
