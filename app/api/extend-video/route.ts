import * as fal from "@fal-ai/serverless-client";
import { NextRequest, NextResponse } from 'next/server';

fal.config({
  proxyUrl: "/api/fal/proxy",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { video_url, prompt, model = 'wan-2.5', duration_seconds = 10, resolution = '720p', audio_url } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // Note: We're generating a new segment with the same prompt
    // True frame chaining would require extracting the last frame from video_url
    // For now, we generate independent segments with consistent prompts

    // Determine endpoint - use text-to-video for continuation
    const endpoint = model === 'wan-2.5'
      ? 'fal-ai/wan-25-preview/text-to-video'
      : 'fal-ai/kling-video/v2.6/pro/text-to-video';

    // Build input payload
    const input: any = {
      prompt: prompt,
      aspect_ratio: resolution === '720p' ? "9:16" : resolution === '480p' ? "9:16" : "16:9",
      duration_seconds: parseInt(duration_seconds.toString()),
    };

    if (audio_url && model === 'wan-2.5') {
      input.audio_url = audio_url;
    }

    // Generate extended segment
    const result: any = await fal.subscribe(endpoint, {
      input,
      logs: true,
    });

    if (result.video && result.video.url) {
      return NextResponse.json({
        video_url: result.video.url,
        success: true
      });
    } else {
      throw new Error("No video URL in response");
    }

  } catch (error: any) {
    console.error('Video extension failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to extend video'
    }, { status: 500 });
  }
}
