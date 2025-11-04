import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app from './firebaseApp';

// Initialize the Gemini Developer API backend service
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Modelo generativo principal usado por outros serviços (ex.: receiptAI, insights)
export const generativeModel = getGenerativeModel(ai, { model: 'gemini-2.5-flash' });
