import { GoogleGenAI, Type } from '@google/genai';
import { GeminiAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to fetch an image and convert it to Base64
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  // Use a CORS proxy to bypass potential Google Drive download restrictions
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract the base64 part from the data URL
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image as base64:', error);
    throw error;
  }
}

export async function analyzeImage(imageUrl: string): Promise<GeminiAnalysis> {
  try {
    const { base64, mimeType } = await fetchImageAsBase64(imageUrl);

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64,
              mimeType: mimeType,
            },
          },
          {
            text: 'Analyze this image of a bus shelter. Are the lights in the ceiling turned on? Output strictly valid JSON with this structure: { "lightsOn": boolean, "confidence": number, "explanation": "Brief reason" }',
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lightsOn: {
              type: Type.BOOLEAN,
              description: 'Whether the lights in the ceiling are turned on.',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence level of the assessment, from 0.0 to 1.0.',
            },
            explanation: {
              type: Type.STRING,
              description: 'Brief reason for the assessment.',
            },
          },
          required: ['lightsOn', 'confidence', 'explanation'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const result = JSON.parse(jsonText) as GeminiAnalysis;
    return result;
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    throw error;
  }
}
