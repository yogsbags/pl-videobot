// Test script for audio splitting functionality
// Run with: node test-audio-split.js

const fs = require('fs');
const path = require('path');

// Mock word timestamps (simulating Cartesia output)
const mockTimestamps = [
  { word: "Welcome", start: 0.0, end: 0.5 },
  { word: "to", start: 0.5, end: 0.7 },
  { word: "our", start: 0.7, end: 0.9 },
  { word: "financial", start: 0.9, end: 1.4 },
  { word: "advisor", start: 1.4, end: 1.9 },
  { word: "channel.", start: 1.9, end: 2.5 },
  { word: "Today", start: 2.8, end: 3.2 },
  { word: "we'll", start: 3.2, end: 3.5 },
  { word: "discuss", start: 3.5, end: 4.0 },
  { word: "investment", start: 4.0, end: 4.7 },
  { word: "strategies.", start: 4.7, end: 5.5 },
  { word: "First,", start: 6.0, end: 6.4 },
  { word: "let's", start: 6.4, end: 6.7 },
  { word: "talk", start: 6.7, end: 7.0 },
  { word: "about", start: 7.0, end: 7.3 },
  { word: "diversification.", start: 7.3, end: 8.5 },
  { word: "This", start: 9.0, end: 9.3 },
  { word: "is", start: 9.3, end: 9.5 },
  { word: "crucial", start: 9.5, end: 10.0 },
  { word: "for", start: 10.0, end: 10.2 },
  { word: "risk", start: 10.2, end: 10.5 },
  { word: "management.", start: 10.5, end: 11.3 },
  { word: "Next,", start: 11.8, end: 12.2 },
  { word: "we'll", start: 12.2, end: 12.5 },
  { word: "explore", start: 12.5, end: 13.0 },
  { word: "market", start: 13.0, end: 13.4 },
  { word: "trends.", start: 13.4, end: 14.2 },
  { word: "Understanding", start: 14.7, end: 15.5 },
  { word: "these", start: 15.5, end: 15.8 },
  { word: "patterns", start: 15.8, end: 16.4 },
  { word: "helps", start: 16.4, end: 16.8 },
  { word: "you", start: 16.8, end: 17.0 },
  { word: "make", start: 17.0, end: 17.3 },
  { word: "informed", start: 17.3, end: 17.9 },
  { word: "decisions.", start: 17.9, end: 18.7 },
  { word: "Finally,", start: 19.2, end: 19.8 },
  { word: "remember", start: 19.8, end: 20.3 },
  { word: "to", start: 20.3, end: 20.5 },
  { word: "stay", start: 20.5, end: 20.8 },
  { word: "disciplined", start: 20.8, end: 21.5 },
  { word: "and", start: 21.5, end: 21.7 },
  { word: "patient.", start: 21.7, end: 22.5 },
  { word: "Long-term", start: 23.0, end: 23.6 },
  { word: "success", start: 23.6, end: 24.1 },
  { word: "requires", start: 24.1, end: 24.7 },
  { word: "consistency.", start: 24.7, end: 25.7 },
  { word: "Thank", start: 26.2, end: 26.5 },
  { word: "you", start: 26.5, end: 26.7 },
  { word: "for", start: 26.7, end: 26.9 },
  { word: "watching!", start: 26.9, end: 27.7 },
];

// Copy the findSplitPoints function from split-audio/route.ts
function findSplitPoints(timestamps, targetDuration = 10) {
  if (timestamps.length === 0) return [];

  const totalDuration = timestamps[timestamps.length - 1].end;
  const splitPoints = [];

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

// Test the function
console.log('Testing Audio Splitting Logic\n');
console.log('Total audio duration:', mockTimestamps[mockTimestamps.length - 1].end, 'seconds\n');

const splitPoints = findSplitPoints(mockTimestamps, 10);
console.log('Split points found:', splitPoints, '\n');

// Show what each segment contains
const boundaries = [0, ...splitPoints, mockTimestamps[mockTimestamps.length - 1].end];

for (let i = 0; i < boundaries.length - 1; i++) {
  const start = boundaries[i];
  const end = boundaries[i + 1];
  const duration = end - start;

  const wordsInSegment = mockTimestamps.filter(w => w.start >= start && w.end <= end);
  const text = wordsInSegment.map(w => w.word).join(' ');

  console.log(`Segment ${i + 1}:`);
  console.log(`  Duration: ${duration.toFixed(2)}s (${start.toFixed(2)}s - ${end.toFixed(2)}s)`);
  console.log(`  Words: ${wordsInSegment.length}`);
  console.log(`  Text: ${text}`);
  console.log(`  Last word: "${wordsInSegment[wordsInSegment.length - 1]?.word}"`);
  console.log('');
}

// Verify no mid-word cuts
console.log('Verification:');
for (let i = 0; i < splitPoints.length; i++) {
  const splitPoint = splitPoints[i];
  const wordAtSplit = mockTimestamps.find(w => w.end === splitPoint);
  if (wordAtSplit) {
    console.log(`✓ Split ${i + 1} at ${splitPoint}s ends cleanly at word: "${wordAtSplit.word}"`);
  } else {
    console.log(`✗ Split ${i + 1} at ${splitPoint}s does NOT align with word boundary!`);
  }
}
