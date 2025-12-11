import { CartesiaClient } from '@cartesia/cartesia-js';
import { NextResponse } from 'next/server';

// Hardcoded for now, or move to env
const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;

// Voice IDs
const VOICES = {
  female: '3b554273-4299-48b9-9aaf-eefd438e3941', // Indian Lady
  male: '6303e5fb-a0a7-48f9-bb1a-dd42c216dc5d',   // Sagar (Indian Male)
};

interface AudioRequest {
  text: string;
  language?: 'en' | 'hi' | 'hinglish' | 'ta' | 'bn' | 'te' | 'gu' | 'kn' | 'ml' | 'mr' | 'pa';
  gender?: 'male' | 'female';
  voiceId?: string;
}

export async function POST(request: Request) {
  try {
    const body: AudioRequest = await request.json();
    const { text, language = 'en', gender = 'female', voiceId: customVoiceId } = body;

    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const voiceId = customVoiceId || VOICES[gender];
    // Use sonic-english for pure English, sonic-multilingual for others
    // Actually, sonic-multilingual is better for Indian English too usually, but let's stick to sonic-english for 'en' if user explicitly wants English.
    // However, for "Indian English", sonic-multilingual might be better.
    // Let's use sonic-multilingual for everything to be safe with accents, or switch based on lang.
    // User asked for "latest sonic 3". Sonic 3 usually implies the new multilingual model.
    // Let's try 'sonic-multilingual' for all, as it's the most capable.
    const modelId = 'sonic-3-2025-10-27';

    const cartesia = new CartesiaClient({ apiKey: CARTESIA_API_KEY });
    const websocket = cartesia.tts.websocket({
      container: 'raw',
      encoding: 'pcm_f32le',
      sampleRate: 44100,
    });

    await websocket.connect();

    const response = await websocket.send({
      modelId,
      voice: { mode: 'id', id: voiceId },
      transcript: text,
      language: language === 'hinglish' ? 'hi' : language,
      addTimestamps: true, // Enable word-level timestamps
    });

    const chunks: Buffer[] = [];
    const timestamps: any[] = [];

    // Wrap event listener in a promise
    await new Promise<void>((resolve, reject) => {
      response.on('message', (message: any) => {
        if (typeof message === 'string') {
          try {
            const parsed = JSON.parse(message);
            if (parsed.data) {
              chunks.push(Buffer.from(parsed.data, 'base64'));
            }
            if (parsed.word_timestamps) {
              timestamps.push(...parsed.word_timestamps.words);
            }
            if (parsed.done) {
              resolve();
            }
          } catch (e) {
            console.error("Error parsing chunk:", e);
          }
        }
      });



      // Safety timeout
      setTimeout(() => resolve(), 15000);
    });

    const audioBuffer = Buffer.concat(chunks);
    const wavBuffer = addWavHeader(audioBuffer, 44100, 1, 32); // 44.1kHz, 1 channel, 32-bit float

    // Return as base64
    return NextResponse.json({
      audioBase64: wavBuffer.toString('base64'),
      timestamps: timestamps // Include word timestamps for splitting
    });

  } catch (error: any) {
    console.error('Error generating audio:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

function addWavHeader(samples: Buffer, sampleRate: number, numChannels: number, bitDepth: number): Buffer {
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = samples.length;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(3, 20); // AudioFormat (3 for IEEE Float)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitDepth, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  samples.copy(buffer, 44);
  return buffer;
}
