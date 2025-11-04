# genai-app-react-native

Aplicativo móvel (Expo/React Native + TypeScript) para capturar cupons fiscais, extrair informações com IA (Firebase AI Logic · Gemini 2.5 Flash), salvar no Firestore e gerar insights financeiros por mês.


## • Funcionalidades

- Captura via câmera/galeria com `expo-image-picker`.
- Extração de dados do cupom com IA (imagem base64 → JSON):
	- total, dateTime (ISO), merchant, category (PT-BR)
- Persistência no Firestore (coleção `receipts`).
- Lista de registros com filtro por mês (navegação mês anterior/próximo) e total do mês.
- Tela de Insights: gráfico simples por categoria + geração de texto com IA (coleção `insights`).

## • Stack

- Expo SDK 54, React Native 0.81.x, TypeScript.
- Firebase Web SDK v12: Firestore + AI Logic (GoogleAIBackend/Gemini).
- Bibliotecas: `expo-image-picker`.

## • Pré‑requisitos

- Projeto Firebase criado.
- Firestore habilitado.
- Firebase AI Logic habilitado e “Get started” concluído com Gemini Developer API (ou Vertex AI).

## ⚙️ Configuração

1) Crie um arquivo `.env` na raiz com as credenciais Web do Firebase (Console → Configurações do projeto → Seus apps → Web):

```
EXPO_PUBLIC_API_KEY="..."
EXPO_PUBLIC_AUTH_DOMAIN="..."
EXPO_PUBLIC_PROJECT_ID="..."
EXPO_PUBLIC_STORAGE_BUCKET="..."
EXPO_PUBLIC_MESSAGING_SENDER_ID="..."
EXPO_PUBLIC_APP_ID="..."
EXPO_PUBLIC_MEASUREMENT_ID="..."   # opcional
```

2) AI Logic (Gemini)

- Este app usa o SDK client do Firebase AI Logic, com backend `GoogleAIBackend`.
- Modelo padrão: `gemini-2.5-flash` (mude em `firebaseService.ts` se necessário).
- Imagens são enviadas inline (base64). Tamanho total máx. da requisição: ~20 MB.

3) Firestore

- Coleções: `receipts` e `insights`.
- Os filtros por mês usam o prefixo de data ISO (YYYY-MM). O helper `monthKey()` gera a chave (ex.: `2025-11`).
- Índices: se o console pedir um índice composto (ex.: `dateTime desc` + `category`), crie seguindo o link que aparece no erro do Firestore.

## ▶️ Executar

1) Instale dependências e inicie o Metro Bundler.
2) Abra pelo Expo Go (Android) ou Câmera (iOS) escaneando o QR code.

## • Como usar

1) Aba “Capturar”: fotografe ou escolha da galeria. O app envia a imagem para a IA (Gemini) e mostra o JSON extraído.
2) Salve para gravar no Firestore.
3) Aba “Registros”: navegue entre meses (◀ anterior, ▶ próximo, Mês atual). Veja a lista e o total do mês atual.
4) Aba “Insights”: gráfico por categoria + botão para gerar texto de insights com IA (também salvo em `insights`).

## • IA e Prompts

- `receiptAI.ts` aplica instruções para retornar somente JSON com:
	- `total` (number), `dateTime` (ISO), `merchant` (string), `category` (PT-BR)
- Há tratamento para quedas de formatação (fallback parsing) e normalização de categorias.
- Insights: gera um texto curto com até ~4 pontos objetivos.

## 📊 Modelo de dados

Receipts (`receipts`)

```
{
	id: string,
	total: number,
	dateTime: string,    // ISO (ex.: 2025-10-15T18:20:00Z)
	merchant: string,
	category: 'alimentacao'|'transporte'|'lazer'|'saude'|'educacao'|'mercado'|'outros',
	createdAt: string     // ISO
}
```

Insights (`insights`)

```
{
	id: string,
	month: string,       // ex.: 2025-11
	text: string,
	createdAt: string    // ISO
}
```

## 🧠 Relatório técnico

### 1) Arquitetura do app

- Camadas principais
	- UI (Expo Router em abas): `app/(tabs)` → `capture`, `receipts`, `insights`
	- Screens: `src/screens/*` (cada aba renderiza um screen dedicado)
	- Serviços: `src/services/*`
		- `firebaseApp.ts`: inicialização única do Firebase (evita erro de app duplicado em hot reload)
		- `firebaseService.ts`: AI Logic (Gemini) — instancia `generativeModel`
		- `receiptAI.ts`: prompts e utilitários para análise de imagem (imagem → JSON) e geração de insights textuais
		- `firestore.ts`: acesso ao Firestore (CRUD de `receipts` e `insights`)
	- Tipos/Helpers: `src/types.ts` (modelos, `monthKey`, `normalizeCategory`)

- Fluxo de dados (captura → extração → persistência)
	1. Usuário escolhe “Fotografar” ou “Galeria” (Expo Image Picker)
	2. A imagem é convertida para base64 (inlineData)
	3. `receiptAI.analyzeReceiptBase64(base64)` chama o `generativeModel.generateContent(...)` com prompt que exige JSON
	4. A resposta é validada/parseada; se necessário, há fallback para correção de formatação
	5. O usuário confirma e salva → `firestore.addReceipt(...)`
	6. `ReceiptsListScreen` filtra por mês com prefixo ISO (`YYYY-MM`) e exibe total do mês
	7. `InsightsScreen` agrega por categoria e pode gerar texto de insights com IA; os insights podem ser salvos em `insights`

- Decisões de design
	- Navegação por meses (mês anterior / próximo / atual) com chave `YYYY-MM` — simples, eficiente e compatível com consultas prefixadas no Firestore
	- Inicialização única do Firebase para evitar `Firebase App named '[DEFAULT]' already exists`
	- Ausência de login por simplicidade; regras do Firestore devem ser endurecidas para produção
	- Remoção do chat para foco no objetivo principal

### 2) Como a IA foi utilizada (no app e no desenvolvimento)

- No app
	- Extração de informações de cupons: o modelo Gemini recebe a imagem em base64 com instruções para retornar estritamente JSON contendo `total`, `dateTime` (ISO), `merchant`, `category` (PT-BR)
	- Geração de insights: a partir de um resumo estruturado (totais por categoria e total do mês), a IA produz um texto curto e objetivo

- No desenvolvimento
	- Auxiliou na configuração correta do fluxo de captura e envio da imagem como `inlineData` para o Gemini
	- Sugeriu prompts mais robustos (exigir somente JSON, campos e formatos, e fallback de parsing)
	- Apoio em correções de erros: duplicidade de inicialização do Firebase, avisos de linking do Expo, e ajustes de consultas no Firestore

### 3) Principais dificuldades e aprendizados

- Integração com o Gemini (Firebase AI Logic)
	- Entender o proxy do Firebase e o uso do `GoogleAIBackend`
	- Tratar respostas de IA para garantir JSON válido; acrescentar fallback e normalização de categoria

- Geração de prompts
	- Especificar claramente o formato de saída (apenas JSON), tipos, idioma e exemplos reduz muito retrabalho
	- Limitar tamanho/resposta e orientar o modelo a não incluir texto adicional

- Navegação de meses e consultas no Firestore
	- Optamos por filtrar por prefixo de `dateTime` (ISO) com `where('>= YYYY-MM-01')` e `where('< YYYY-MM-99')` + `orderBy('dateTime')`
	- Aprendizado: quando o console solicitar, criar índice composto para consultas com múltiplos filtros e ordenação

- Regras e permissões do Firestore
	- Durante o desenvolvimento, regras permissivas foram úteis para validar o fluxo rapidamente
	- Para produção, é essencial exigir autenticação e considerar App Check para proteger o backend

- Expo Linking e ergonomia
	- Adicionar `scheme` no `app.json` elimina avisos e previne problemas em builds
	- A separação `firebaseApp.ts` evitou erros de app duplicado durante hot reload

- Uso estratégico de IA no desenvolvimento
	- A IA acelerou a resolução de problemas e a criação de prompts eficazes
	- Aprendizado principal: usar a IA como co‑piloto — validar respostas, testar e iterar