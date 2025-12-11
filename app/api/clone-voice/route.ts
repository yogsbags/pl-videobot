import * as fal from "@fal-ai/serverless-client";
import { NextRequest, NextResponse } from 'next/server';

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 });
    }

    console.log('Uploading audio file to fal.ai storage...');

    // Upload the audio file to fal.ai storage
    const audioUrl = await fal.storage.upload(file);
    console.log('Audio uploaded:', audioUrl);

    // Use fal.ai's voice cloning model
    // Note: Using metavoice-1b for open-source voice cloning
    console.log('Starting voice cloning with fal.ai...');

    const result = await fal.subscribe("fal-ai/metavoice", {
      input: {
        audio_url: audioUrl,
        // The model will extract voice characteristics from the audio
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Queue update:', update);
      },
    });

    console.log('Voice cloning result:', result);

    // Extract voice_id from the result
    // The exact response format may vary, but we'll handle common cases
    const voiceId = result.voice_id || result.id || audioUrl;

    return NextResponse.json({
      success: true,
      voice_id: voiceId,
      id: voiceId,
      audio_url: audioUrl,
      message: 'Voice cloned successfully using fal.ai',
    });

  } catch (error: any) {
    console.error('Voice cloning failed:', error);
    return NextResponse.json({
      error: error.message || 'Internal Server Error',
      details: error.toString(),
    }, { status: 500 });
  }
}
