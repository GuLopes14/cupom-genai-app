import {
    addDoc,
    collection,
    getDocs,
    getFirestore,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    where,
} from 'firebase/firestore';
import { Insight, Receipt, ReceiptInput } from '../types';

import app from './firebaseApp';
const db = getFirestore(app);

const colReceipts = (projectId?: string) => collection(db, 'receipts');
const colInsights = () => collection(db, 'insights');

export async function addReceipt(data: ReceiptInput): Promise<Receipt> {
  const docRef = await addDoc(colReceipts(), {
    total: data.total,
    dateTime: data.dateTime,
    merchant: data.merchant,
    category: data.category,
    createdAt: serverTimestamp(),
  });
  return {
    id: docRef.id,
    ...data,
    createdAt: new Date().toISOString(),
  };
}

export async function listReceipts(opts?: {
  month?: string; // YYYY-MM
  category?: string;
}): Promise<Receipt[]> {
  const constraints: any[] = [];
  if (opts?.month) {
    // Filter by month using date string prefix (ISO format begins with YYYY-MM)
    constraints.push(where('dateTime', '>=', `${opts.month}-01`));
    constraints.push(where('dateTime', '<', `${opts.month}-99`));
  }
  if (opts?.category) constraints.push(where('category', '==', opts.category));
  constraints.push(orderBy('dateTime', 'desc'));

  const q = query(colReceipts(), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    const createdAtIso = (data.createdAt instanceof Timestamp)
      ? data.createdAt.toDate().toISOString()
      : new Date().toISOString();
    return {
      id: d.id,
      total: data.total,
      dateTime: data.dateTime,
      merchant: data.merchant,
      category: data.category,
      createdAt: createdAtIso,
    } as Receipt;
  });
}

export async function addInsight(text: string, month: string): Promise<Insight> {
  const docRef = await addDoc(colInsights(), {
    text,
    month,
    createdAt: serverTimestamp(),
  });
  return {
    id: docRef.id,
    text,
    month,
    createdAt: new Date().toISOString(),
  };
}

export async function listInsights(month?: string): Promise<Insight[]> {
  const constraints: any[] = [];
  if (month) constraints.push(where('month', '==', month));
  constraints.push(orderBy('createdAt', 'desc'));
  const q = query(colInsights(), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    const createdAtIso = (data.createdAt instanceof Timestamp)
      ? data.createdAt.toDate().toISOString()
      : new Date().toISOString();
    return { id: d.id, month: data.month, text: data.text, createdAt: createdAtIso } as Insight;
  });
}

export const firestoreService = {
  addReceipt,
  listReceipts,
  addInsight,
  listInsights,
};

export default firestoreService;
