import { GoogleGenAI, Type } from "@google/genai";
import { StudentProfile, Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const createAssistantChat = (profile: StudentProfile) => {
  const systemInstruction = `
    ROLE: You are an expert Personal AI English Coach and Marketing Communication Mentor for an ambitious marketing professional.
    
    CORE OBJECTIVES & BEHAVIOR:
    1. PROACTIVE MENTORSHIP & FEEDBACK:
       - Do NOT just answer questions passively; evaluate the student's question formulation itself.
       - Whenever the student asks a grammar, vocabulary, or communication question, answer thoroughly and clearly, then kindly point out any grammatical nuances or better phrasing for the question they just asked.
    2. NOT A YES-MAN (CRITICAL):
       - Be constructive and honest. If the student's phrasing is awkward, outdated, grammatically incorrect, or inappropriate for business marketing contexts, tell them politely and explain why.
       - Never blindly validate flawed English or marketing logic.
    3. POLITE & PROFESSIONAL MANNER:
       - Always frame corrections positively and supportively (e.g., "Great question! By the way, in professional settings it is smoother to write '...' rather than '...'. Here is why...").
       - Never sound harsh, condescending, or pedantic.
    4. MEMORY & CONTINUOUS LEARNING:
       - Maintain context based on what the student has shared before.
       - Relate grammar rules to real-world marketing situations (pitches, client emails, brand storytelling, campaign analysis, KPIs).
    5. STYLE ADAPTATION:
       - Challenge the student with sophisticated marketing terminology (e.g., "streamline", "leverage", "omnidirectional strategy", "value proposition") tailored to their current skill level.

    STUDENT CONTEXT (MEMORY):
    ${profile.memory || "Student is a marketing professional working to achieve high business English fluency."}

    STUDENT STYLE NOTES:
    ${profile.style || "Standard business English learner developing natural executive presence."}

    STUDENT TONE:
    ${profile.tone || "Curious, professional, and receptive to constructive feedback."}
  `;

  return ai.chats.create({
    model: "gemini-3.8-flash",
    config: {
      systemInstruction,
    },
  });
};

export const analyzeStudentProfile = async (messages: Message[], currentProfile: StudentProfile): Promise<Partial<StudentProfile>> => {
  try {
    const conversationText = messages.slice(-10).map(m => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.text}`).join("\n\n");
    
    const prompt = `
      Analyze this recent conversation between a marketing English student and their AI coach:
      
      CURRENT PROFILE:
      Memory: ${currentProfile.memory}
      Style: ${currentProfile.style}
      Tone: ${currentProfile.tone}
      
      RECENT CONVERSATION:
      ${conversationText}
      
      Synthesize an updated student profile in JSON.
      - "memory": Cumulative summary of what we learned about the student (goals, company context, recurring mistakes, achievements). Keep concise under 300 words.
      - "style": Observed linguistic habits and English proficiency notes (e.g. grammar patterns, vocabulary choice).
      - "tone": Student's attitude and confidence level.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            memory: { type: Type.STRING },
            style: { type: Type.STRING },
            tone: { type: Type.STRING }
          },
          required: ["memory", "style", "tone"]
        }
      }
    });

    const text = response.text?.trim() || "";
    if (!text) return {};
    
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse profile analysis", e);
    return {};
  }
};
