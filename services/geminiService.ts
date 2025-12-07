import { GoogleGenAI } from "@google/genai";
import { Briefing } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are "AURA", the tactical AI for a starfighter pilot. 
Your personality is calm, precise, and slightly robotic but encouraging.
Keep responses extremely short and punchy (max 2 sentences). 
Focus on tactical advice for arcade space shooters (e.g., "Aim for the flanks," "Prioritize diving enemies," "Shields critical").`;

export const getMissionBriefing = async (level: number, score: number, previousStatus: string): Promise<Briefing> => {
  try {
    const prompt = `Generate a mission briefing for Level ${level}. Current Score: ${score}. Context: ${previousStatus}. Format as JSON with keys: "title" (short cool name) and "message".`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return { title: "COMM LINK ERROR", message: "Static detected. Proceed with caution." };
    
    return JSON.parse(text) as Briefing;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      title: "OFFLINE MODE",
      message: "Tactical uplink failed. Rely on instincts, pilot."
    };
  }
};
