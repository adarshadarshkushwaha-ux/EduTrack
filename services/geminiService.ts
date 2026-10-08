import { GoogleGenAI, Type } from "@google/genai";
import { AttendanceStatus } from "../types";

// Helper to get API key safely
const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
};

// Initialize Gemini Client
const getAiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeAttendanceSheet = async (base64Image: string): Promise<any> => {
  const ai = getAiClient();
  
  // Clean base64 string if it contains data URL prefix
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Multimodal model capable of reading text in images
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity from capture
              data: cleanBase64
            }
          },
          {
            text: `Analyze this handwritten or printed attendance sheet. 
            Identify student names and their marked status if visible (e.g., checks, 'P', 'A'). 
            If no status is explicitly marked, assume 'Present' but flag confidence as lower.
            Return a JSON object with a 'students' array.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            students: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  status: { type: Type.STRING, enum: [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE] },
                  confidence: { type: Type.NUMBER, description: "Confidence score 0-1" }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No data returned from AI");

  } catch (error) {
    console.error("Error analyzing sheet:", error);
    throw error;
  }
};

export const generateParentMessage = async (studentName: string, daysAbsent: number, guardianName: string): Promise<string> => {
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a polite, encouraging, short text message (SMS format) to ${guardianName}, the parent of ${studentName}.
      The student has been absent for ${daysAbsent} days this month.
      Express concern and emphasize the importance of regular attendance for their future.
      Keep it under 160 characters if possible, or slightly more if needed for warmth.
      Do not include placeholders.`
    });

    return response.text || "Could not generate message.";
  } catch (error) {
    console.error("Error generating message:", error);
    return generateOfflineMessage(studentName, daysAbsent, guardianName);
  }
};

export const generateDailySummary = async (stats: { present: number, absent: number, late: number }): Promise<string> => {
  const ai = getAiClient();
  try {
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Generate a brief 2-sentence daily summary for the school principal based on these stats: 
          Present: ${stats.present}, Absent: ${stats.absent}, Late: ${stats.late}. 
          Highlight any anomalies or good trends.`
      });
      return response.text || "Summary unavailable.";
  } catch (error) {
      return generateOfflineSummary(stats);
  }
}

// --- Offline Fallbacks ---

export const generateOfflineMessage = (studentName: string, daysAbsent: number, guardianName: string): string => {
    return `Hello ${guardianName}, we noticed ${studentName} has been absent for ${daysAbsent} days recently. Regular attendance is key to success. Please ensure they attend school. - Principal`;
};

export const generateOfflineSummary = (stats: { present: number, absent: number, late: number }): string => {
    const total = stats.present + stats.absent + stats.late;
    const rate = total > 0 ? Math.round((stats.present / total) * 100) : 0;
    return `Today's attendance is ${rate}%. We have ${stats.present} present, ${stats.absent} absent, and ${stats.late} late students.`;
};
// --- AI Copilot: answers questions grounded in the school's attendance data ---
export const askCopilot = async (question: string, context: string, lang: 'en' | 'hi'): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are EduTrack Copilot, an assistant for a rural school principal. Use ONLY the data below. If the answer is not in the data, say so. Be concise (max 120 words), practical, plain text, and reply in ${lang === 'hi' ? 'Hindi' : 'English'}.

DATA:
${context}

QUESTION: ${question}`
  });
  return response.text || "No answer returned.";
};
