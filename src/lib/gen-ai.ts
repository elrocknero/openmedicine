import OpenAI from "openai";
// Importamos la nueva librería. Usamos require porque es una librería de Node pura.
const PDFParser = require("pdf2json");

// --- 1. CONFIGURACIÓN OPENAI ---
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://open-medicine.app",
    "X-Title": "Open Medicine",
  },
});

// --- 2. NUEVA FUNCIÓN DE EXTRACCIÓN (Limpia y Nativa) ---
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Envolvemos la librería basada en eventos en una Promesa moderna
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, 1); // El '1' indica modo texto, null para el contexto

    parser.on("pdfParser_dataError", (errData: any) => {
      console.error("Error PDF2JSON:", errData.parserError);
      reject(new Error("No se pudo leer el PDF. Asegúrate de que no esté corrupto."));
    });

    parser.on("pdfParser_dataReady", (pdfData: any) => {
      // La librería devuelve el texto como URI encoded, hay que limpiarlo
      try {
        const rawText = parser.getRawTextContent();
        const cleanText = rawText.trim();
        
        if (cleanText.length < 20) {
          reject(new Error("El PDF parece vacío o es una imagen escaneada."));
        } else {
          resolve(cleanText);
        }
      } catch (e) {
        reject(new Error("Error procesando el texto del PDF."));
      }
    });

    // Iniciar la lectura del buffer
    parser.parseBuffer(buffer);
  });
}

// --- 3. GENERADOR DE QUIZ (IA) ---
export async function generateQuizFromText(text: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un profesor experto en medicina."
        },
        {
          role: "user",
          content: `Genera un quiz de 5 preguntas basado en el siguiente texto.
          Devuelve SOLO un objeto JSON válido con esta estructura:
          { "questions": [{ "question": "...", "options": ["..."], "answer": 0, "explanation": "..." }] }.
          El campo 'answer' debe ser el índice numérico (0-3) de la opción correcta.
          
          Texto a analizar:
          ${text.slice(0, 15000)}`
        },
      ],
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) throw new Error("La IA no devolvió respuesta.");
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("Error IA:", error);
    throw new Error("Error conectando con la IA.");
  }
}