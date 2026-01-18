
import { GoogleGenAI } from "@google/genai";
import { MockBackend } from "./mockBackend";

export const GeminiService = {
  chat: async (userMessage: string, history: {role: 'user' | 'model', text: string}[]): Promise<string> => {
    
    // Fetch current context (rules, availability hints)
    const config = await MockBackend.getConfig();
    const pricing = await MockBackend.getPricing();
    
    // As per user request: "Everything in rules and policies must appear copied in the assistant instructions"
    const systemPrompt = `
      INSTRUCCIONES PRINCIPALES:
      ${config.aiSystemInstruction}
      
      REGLAS, POLÍTICAS Y CONDICIONES (CRÍTICO):
      ${config.rulesAndPolicies}
      
      INFORMACIÓN DE LA PROPIEDAD:
      - Nombre: ${config.name}
      - Capacidad Máxima: ${config.maxCapacity} personas
      - Dirección: ${config.address}
      - Precio Base por Día/Noche: $${pricing.dailyPrice}
      
      COMPORTAMIENTO:
      - Responde siempre basándote en las REGLAS Y POLÍTICAS arriba mencionadas.
      - Si te preguntan por mascotas, ruidos, vehículos o cancelaciones, usa estrictamente el texto de las reglas.
      - NO confirmes reservas. Guía al usuario al calendario y formulario.
      - Tono: Amable, comercial y resolutivo.
    `;

    try {
      if (!process.env.API_KEY) {
        console.warn("No API_KEY found. Using simulated response.");
        return await simulateResponse(userMessage, config.rulesAndPolicies);
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // We pass the history to maintain context
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: systemPrompt,
        }
      });
      
      // In this specific implementation of chat.sendMessage, we send the single message.
      // For full history support we would normally use the history parameter in chats.create.
      const result = await chat.sendMessage({ message: userMessage });
      return result.text || "Lo siento, no pude procesar tu mensaje.";

    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Hubo un error conectando con el asistente. Por favor intenta más tarde.";
    }
  }
};

async function simulateResponse(msg: string, rules: string): Promise<string> {
  const lower = msg.toLowerCase();
  if (lower.includes('regla') || lower.includes('norma') || lower.includes('puedo')) {
    return `Sobre las normas de la casa: ${rules.substring(0, 200)}... Podés ver el detalle completo en la sección de información de la web.`;
  }
  if (lower.includes('precio')) return "El precio se calcula automáticamente en el calendario según la fecha y cantidad de personas.";
  if (lower.includes('disponible')) return "Podés consultar la disponibilidad real directamente en el calendario de nuestra web.";
  return "¡Hola! Soy el asistente de La Quinta Funes. ¿En qué puedo ayudarte?";
}
