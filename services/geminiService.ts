import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Block } from "../types";

// Helper for UUID since we are in a pure frontend env without 'uuid' package guarantee
const generateId = () => Math.random().toString(36).substr(2, 9);

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BREAKDOWN_SYSTEM_INSTRUCTION = `
You are a project management assistant. Your goal is to break down complex projects or topics into actionable steps or detailed outlines.
Output MUST be a strictly structured JSON array of "blocks".
Block types available: 'h1', 'h2', 'text', 'todo', 'bullet'.
Keep titles concise. Make todos actionable.
`;

export const generatePageBreakdown = async (title: string, context: string): Promise<Block[]> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found");
    return [
      { id: generateId(), type: 'text', content: 'API Key missing. Please configure your environment.' }
    ];
  }

  try {
    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['h1', 'h2', 'text', 'todo', 'bullet'] },
          content: { type: Type.STRING },
          checked: { type: Type.BOOLEAN } // Optional, usually false for new lists
        },
        required: ['type', 'content']
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Break down the following project/topic into a structured plan: "${title}". \nContext: ${context}`,
      config: {
        systemInstruction: BREAKDOWN_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    });

    const rawBlocks = JSON.parse(response.text || '[]');
    
    // Map to our internal Block structure with IDs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rawBlocks.map((b: any) => ({
      id: generateId(),
      type: b.type,
      content: b.content,
      checked: b.checked || false
    }));

  } catch (error) {
    console.error("Gemini generation failed:", error);
    return [
      { id: generateId(), type: 'text', content: 'Failed to generate plan. Please try again.' }
    ];
  }
};

export const suggestNextSteps = async (currentBlocks: Block[]): Promise<Block[]> => {
  if (!process.env.API_KEY) return [];

  // Extract text context from current blocks
  const context = currentBlocks.map(b => `${b.type}: ${b.content}`).join('\n');

  try {
    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['todo'] },
          content: { type: Type.STRING },
        },
        required: ['type', 'content']
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on the following project content, suggest 3 immediate next actionable steps (todos).\n\nContent:\n${context}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    });

    const rawBlocks = JSON.parse(response.text || '[]');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rawBlocks.map((b: any) => ({
      id: generateId(),
      type: 'todo',
      content: b.content,
      checked: false
    }));

  } catch (error) {
    console.error("Gemini suggestion failed", error);
    return [];
  }
}