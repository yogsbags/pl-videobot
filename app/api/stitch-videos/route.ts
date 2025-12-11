import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

// Helper to download a file
async function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    protocol.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => { });
      reject(err);
    });
  });
}

// Helper to stitch videos using ffmpeg
async function stitchVideos(inputFiles: string[], outputFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();

    // Add all input files
    inputFiles.forEach(file => command.input(file));

    // Concatenate videos
    command
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .mergeToFile(outputFile, '/tmp');
  });
}

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];

  try {
    const body = await request.json();
    const { video_urls } = body;

    if (!video_urls || !Array.isArray(video_urls) || video_urls.length === 0) {
      return NextResponse.json({ error: 'video_urls array is required' }, { status: 400 });
    }

    // If only one video, return it directly
    if (video_urls.length === 1) {
      return NextResponse.json({
        video_url: video_urls[0],
        success: true
      });
    }

    // Download all video segments
    const downloadedFiles: string[] = [];
    for (let i = 0; i < video_urls.length; i++) {
      const tempPath = path.join('/tmp', `segment_${Date.now()}_${i}.mp4`);
      await downloadFile(video_urls[i], tempPath);
      downloadedFiles.push(tempPath);
      tempFiles.push(tempPath);
    }

    // Stitch videos together
    const outputPath = path.join('/tmp', `stitched_${Date.now()}.mp4`);
    tempFiles.push(outputPath);

    await stitchVideos(downloadedFiles, outputPath);

    // Read the stitched video and convert to base64
    const videoBuffer = fs.readFileSync(outputPath);
    const videoBase64 = videoBuffer.toString('base64');

    // Clean up temp files
    for (const file of tempFiles) {
      try {
        await unlink(file);
      } catch (err) {
        console.error(`Failed to delete ${file}:`, err);
      }
    }

    return NextResponse.json({
      video_base64: videoBase64,
      success: true,
      message: 'Videos stitched successfully'
    });

  } catch (error: any) {
    // Clean up temp files on error
    for (const file of tempFiles) {
      try {
        await unlink(file);
      } catch (err) {
        // Ignore cleanup errors
      }
    }

    console.error('Video stitching failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to stitch videos'
    }, { status: 500 });
  }
}
