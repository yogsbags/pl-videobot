import { ElevenLabsClient } from "elevenlabs";
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'ELEVENLABS_API_KEY not configured. Please add it to .env.local'
      }, { status: 500 });
    }

    console.log('Starting voice cloning with ElevenLabs...');
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    tempFilePath = path.join(tempDir, `${Date.now()}-${file.name}`);
    await writeFile(tempFilePath, buffer);

    console.log('Temp file saved:', tempFilePath);

    const client = new ElevenLabsClient({
      apiKey: apiKey,
    });

    // Clone voice using ElevenLabs with file path
    console.log('Calling ElevenLabs API...');
    const voice = await client.voices.add({
      name: `Cloned Voice ${Date.now()}`,
      files: [fs.createReadStream(tempFilePath)],
      description: `Voice cloned from ${file.name}`,
    });

    // Ensure voice_id exists
    if (!voice.voice_id) {
      throw new Error('Voice cloning failed: No voice_id returned from ElevenLabs');
    }

    console.log('Voice cloned successfully:', {
      voice_id: voice.voice_id,
    });

    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      tempFilePath = null;
    }

    return NextResponse.json({
      success: true,
      voice_id: voice.voice_id,
      id: voice.voice_id,
      message: 'Voice cloned successfully using ElevenLabs',
    });

  } catch (error: any) {
    console.error('Voice cloning failed:', error);
    console.error('Error stack:', error.stack);

    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError);
      }
    }

    // Better error handling for ElevenLabs specific errors
    let errorMessage = error.message || 'Internal Server Error';
    let statusCode = 500;

    if (error.statusCode) {
      statusCode = error.statusCode;
    }

    if (error.body) {
      try {
        const errorBody = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
        errorMessage = errorBody.detail?.message || errorBody.message || errorMessage;
      } catch (e) {
        // Keep original error message if parsing fails
      }
    }

    return NextResponse.json({
      error: errorMessage,
      details: error.toString(),
      stack: error.stack,
    }, { status: statusCode });
  }
}
