import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

interface ScriptRequest {
  topic: string;
  language?: string;
}

const SYSTEM_INSTRUCTION = `
You are an expert scriptwriter for short-form financial video content (Reels/TikTok).
Your goal is to write a concise, engaging script for a "Financial Advisor" persona.

Constraints:
1.  **Duration:** Strictly under 30 seconds spoken (approx 60-75 words).
2.  **Tone:** Professional, trustworthy, yet accessible and engaging.
3.  **Structure:** Hook (first 3s) -> Value/Insight -> Call to Action.
4.  **Format:** Return ONLY the raw spoken text. No scene directions, no "Host:", no markdown formatting. Just the words to be spoken.

Example Output:
"Stop leaving your cash in a savings account earning pennies. Inflation is eating your wealth. Instead, consider a diversified index fund. It's the simplest way to grow your money over time. Start today, and thank yourself in ten years."
`;

export async function POST(request: Request) {
  try {
    const body: ScriptRequest = await request.json();
    const { topic, language = 'en' } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    let langInstruction = "";
    const langMap: Record<string, string> = {
      hi: "Hindi (Devanagari script)",
      hinglish: "Hinglish (Hindi words written in English alphabet, casual Indian style)",
      bn: "Bengali",
      gu: "Gujarati",
      kn: "Kannada",
      ml: "Malayalam",
      mr: "Marathi",
      pa: "Punjabi",
      ta: "Tamil",
      te: "Telugu"
    };

    if (langMap[language]) {
      langInstruction = `Write the script in ${langMap[language]}.`;
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Topic: "${topic}"\nLanguage: ${language}\n${langInstruction}\n\nWrite the script:` }] }],
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
    });

    const script = result.response.text();

    return NextResponse.json({ script });

  } catch (error: any) {
    console.error('Error generating script:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
