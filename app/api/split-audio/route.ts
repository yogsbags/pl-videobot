import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promisify } from 'util';

const unlink = promisify(fs.unlink);

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];

  try {
    const body = await request.json();
    const { audioBase64, timestamps, targetDuration = 10 } = body;

    if (!audioBase64 || !timestamps || !Array.isArray(timestamps)) {
      return NextResponse.json({
        error: 'audioBase64 and timestamps array are required'
      }, { status: 400 });
    }

    // Find optimal split points around 10s and 20s marks
    const splitPoints = findSplitPoints(timestamps, targetDuration);

    if (splitPoints.length === 0) {
      // Audio is too short to split, return as single segment
      return NextResponse.json({
        success: true,
        segments: [audioBase64],
        splitPoints: []
      });
    }

    // Save audio to temp file
    const inputPath = path.join('/tmp', `audio_${Date.now()}.wav`);
    tempFiles.push(inputPath);

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    await fs.writeFile(inputPath, audioBuffer);

    // Split audio using ffmpeg
    const segments: string[] = [];
    const boundaries = [0, ...splitPoints];

    for (let i = 0; i < boundaries.length; i++) {
      const startTime = boundaries[i];
      const endTime = i < boundaries.length - 1 ? boundaries[i + 1] : undefined;

      const outputPath = path.join('/tmp', `segment_${Date.now()}_${i}.wav`);
      tempFiles.push(outputPath);

      await splitAudioSegment(inputPath, outputPath, startTime, endTime);

      // Read segment and convert to base64
      const segmentBuffer = await fs.readFile(outputPath);
      segments.push(segmentBuffer.toString('base64'));
    }

    // Clean up temp files
    for (const file of tempFiles) {
      try {
        await unlink(file);
      } catch (err) {
        console.error(`Failed to delete ${file}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      segments: segments,
      splitPoints: splitPoints
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

    console.error('Audio splitting failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to split audio'
    }, { status: 500 });
  }
}

// Split audio segment using ffmpeg
function splitAudioSegment(inputPath: string, outputPath: string, startTime: number, endTime?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .setStartTime(startTime);

    if (endTime !== undefined) {
      command = command.setDuration(endTime - startTime);
    }

    command
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: any) => reject(err))
      .run();
  });
}

// Find natural break points around target durations (10s, 20s)
function findSplitPoints(timestamps: WordTimestamp[], targetDuration: number): number[] {
  if (timestamps.length === 0) return [];

  const totalDuration = timestamps[timestamps.length - 1].end;
  const splitPoints: number[] = [];

  // We want to split around 10s and 20s for a 30s audio
  const targets = [targetDuration, targetDuration * 2];

  for (const target of targets) {
    if (target >= totalDuration) continue;

    // Find the word closest to the target time
    // Prefer words that end sentences (followed by punctuation or pause)
    let bestIndex = 0;
    let minDiff = Infinity;

    for (let i = 0; i < timestamps.length; i++) {
      const wordEnd = timestamps[i].end;
      const diff = Math.abs(wordEnd - target);

      // Prefer this word if it's closer to target
      // OR if it's reasonably close AND ends a sentence
      const isSentenceEnd = i < timestamps.length - 1 &&
        (timestamps[i].word.endsWith('.') ||
          timestamps[i].word.endsWith('!') ||
          timestamps[i].word.endsWith('?') ||
          timestamps[i + 1].start - timestamps[i].end > 0.3); // Pause > 300ms

      if (diff < minDiff || (diff < minDiff * 1.5 && isSentenceEnd)) {
        minDiff = diff;
        bestIndex = i;
      }
    }

    splitPoints.push(timestamps[bestIndex].end);
  }

  return splitPoints;
}
