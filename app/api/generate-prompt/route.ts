import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

interface PromptRequest {
  userPrompt: string;
  reelType: 'educational' | 'market_update' | 'viral_hook' | 'advisor' | 'cinematic';
}

const SYSTEM_INSTRUCTION = `
You are an expert AI Video Prompt Engineer for PL Capital, a financial services brand.
Your goal is to translate a high-level user request into a technically optimized prompt for specific AI video models (Wan 2.5, Kling 2.6, OmniHuman 1.5).

## 1. Model-Specific Optimization Rules

### A. Wan 2.5 (The "Visual Text & Chart" Specialist)
*   **Best For:** Educational Reels, Market Updates.
*   **Critical Keywords:** 4k resolution, highly detailed chart, legible text, financial dashboard, candlestick pattern, white background, clean UI.
*   **Motion Prompts:** smooth camera pan, slow zoom in on data.

### B. Kling 2.6 (The "Cinematic & Viral" Specialist)
*   **Best For:** Viral Hooks, B-Roll, Cinematic.
*   **Critical Keywords:** cinematic lighting, photorealistic, depth of field, shot on ARRI, film grain, dynamic motion, ambient office sounds.
*   **Motion Prompts:** dynamic camera movement, fpv drone shot, speed ramp.

### C. OmniHuman 1.5 (The "Digital Advisor" Specialist)
*   **Best For:** Advisor, Trust Building.
*   **Critical Keywords:** Indian financial advisor, professional suit, speaking to camera, expressive hand gestures, trustworthy, warm lighting, modern office background.

## 2. Universal "Style" Tokens for PL Capital
Always append these to maintain brand consistency:
*   Color Palette: Emerald green, deep navy blue, and gold accents.
*   Lighting: Soft studio lighting, cinematic backlighting.
*   Vibe: Professional, trustworthy, premium, modern fintech.

## 3. Output Format
Return ONLY the optimized prompt string. Do not include explanations.
`;

const MODEL_MAPPING = {
  educational: 'wan-2.5',
  market_update: 'wan-2.5',
  viral_hook: 'kling-2.6',
  advisor: 'omnihuman-1.5',
  cinematic: 'runway-gen-4'
};

export async function POST(request: Request) {
  try {
    const body: PromptRequest = await request.json();
    const { userPrompt, reelType } = body;

    if (!userPrompt || !reelType) {
      return NextResponse.json({ error: 'Missing userPrompt or reelType' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const recommendedModel = MODEL_MAPPING[reelType] || 'kling-2.6';

    // Fallback if no API key
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found, using basic template fallback.");
      const basicPrompt = `A high-quality video about ${userPrompt} in style of ${reelType}. Professional financial aesthetic, emerald green and navy blue colors.`;
      return NextResponse.json({
        optimizedPrompt: basicPrompt,
        recommendedModel,
        reelType,
        warning: "Gemini API Key missing. Using basic fallback."
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `User Request: "${userPrompt}"\nReel Type: ${reelType}\n\nGenerate the optimized prompt:` }] }],
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
    });

    const optimizedPrompt = result.response.text();

    return NextResponse.json({
      optimizedPrompt,
      recommendedModel,
      reelType
    });

  } catch (error) {
    console.error('Error generating prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
