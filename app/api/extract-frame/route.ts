import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { video_url } = body;

    if (!video_url) {
      return NextResponse.json({ error: 'video_url is required' }, { status: 400 });
    }

    // For client-side frame extraction, we'll return instructions
    // The actual extraction will happen in the browser using a video element and canvas
    // This is a placeholder - the real extraction happens client-side

    return NextResponse.json({
      success: true,
      message: 'Frame extraction should be done client-side',
      video_url: video_url
    });

  } catch (error: any) {
    console.error('Frame extraction failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to extract frame'
    }, { status: 500 });
  }
}
