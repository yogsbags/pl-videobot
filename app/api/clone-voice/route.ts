import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'CARTESIA_API_KEY not configured' }, { status: 500 });
    }

    // Prepare FormData for Cartesia
    const cartesiaFormData = new FormData();
    cartesiaFormData.append('file', file);
    cartesiaFormData.append('name', `Cloned Voice ${Date.now()}`);
    cartesiaFormData.append('mode', 'similarity');
    cartesiaFormData.append('enhance', 'true');

    // Cartesia expects the file field to be named 'clip'
    // Let's re-append correctly
    const finalFormData = new FormData();
    finalFormData.append('clip', file);
    finalFormData.append('name', `Cloned Voice ${Date.now()}`);
    finalFormData.append('mode', 'similarity');
    finalFormData.append('enhance', 'true');
    finalFormData.append('language', 'en');

    const response = await fetch('https://api.cartesia.ai/voices/clone', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Cartesia-Version': '2024-06-10',
        // Note: Content-Type is set automatically by fetch with FormData
      },
      body: finalFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cartesia Clone Error:', errorText);
      return NextResponse.json({ error: `Cartesia Error: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Voice cloning failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
