# Voice Recording & Cloning Feature

## Overview
Added voice recording capability to the voice cloning feature, allowing users to record audio directly from their browser instead of only uploading audio files.

## Changes Made

### 1. New Component: AudioRecorder.tsx
Created a new audio recording component with the following features:
- **Microphone Access**: Requests browser permission to access user's microphone
- **Real-time Recording**: Shows recording duration with visual feedback (pulsing red microphone icon)
- **Audio Playback**: Preview recorded audio before submitting
- **Controls**: Start, stop, discard, and confirm recording
- **Timer Display**: Shows recording duration in MM:SS format
- **Minimum Duration Tip**: Recommends at least 10 seconds for best voice cloning results

**Location**: `/components/AudioRecorder.tsx`

### 2. Updated Component: AudioUploader.tsx
Enhanced the existing audio uploader with:
- **Modal Dialog**: Shows options when clicking "Clone Voice from Audio"
- **Two Options**:
  - **Record Now**: Opens the AudioRecorder component
  - **Upload File**: Traditional file upload (existing functionality)
- **Unified Cloning Logic**: Extracted `cloneVoice()` function to handle both recorded and uploaded audio
- **Better UX**: Clear visual distinction between record and upload options

**Location**: `/components/AudioUploader.tsx`

### 3. Updated API: clone-voice Route
Replaced Cartesia API with fal.ai open-source voice cloning:

**Previous Implementation** (Cartesia):
```typescript
const response = await fetch('https://api.cartesia.ai/voices/clone', {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey,
    'Cartesia-Version': '2024-06-10',
  },
  body: finalFormData,
});
```

**New Implementation** (fal.ai):
```typescript
// Upload audio to fal.ai storage
const audioUrl = await fal.storage.upload(file);

// Clone voice using fal.ai's metavoice model
const result = await fal.subscribe("fal-ai/metavoice", {
  input: {
    audio_url: audioUrl,
  },
  logs: true,
});
```

**Why fal.ai?**
- Open-source voice cloning model (metavoice-1b)
- FAL_KEY already configured in environment
- No additional API key setup required
- Free/affordable compared to proprietary services

**Location**: `/app/api/clone-voice/route.ts`

## User Flow

### Recording Voice
1. User clicks "Clone Voice from Audio"
2. Modal appears with two options: "Record Now" or "Upload File"
3. User clicks "Record Now"
4. Browser requests microphone permission
5. User grants permission and clicks "Start Recording"
6. Recording begins with visual feedback (pulsing red mic icon + timer)
7. User speaks for at least 10 seconds (recommended)
8. User clicks "Stop Recording"
9. Audio player appears for preview
10. User can either:
    - Click "Discard" to re-record
    - Click "Use This Recording" to proceed with cloning
11. Voice is cloned via fal.ai API
12. Success message shows the voice ID

### Uploading Voice
1. User clicks "Clone Voice from Audio"
2. Modal appears with two options: "Record Now" or "Upload File"
3. User clicks "Upload File"
4. File picker opens
5. User selects audio file (.mp3, .wav, .webm, etc.)
6. Voice is cloned via fal.ai API
7. Success message shows the voice ID

## Technical Details

### Audio Format
- **Recording Format**: WebM (browser default for MediaRecorder API)
- **Accepted Upload Formats**: Any audio format supported by browser (`audio/*`)
- **Conversion**: fal.ai handles format conversion automatically

### Browser Compatibility
- **MediaRecorder API**: Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- **getUserMedia API**: Requires HTTPS or localhost
- **Audio Playback**: Standard HTML5 audio element

### Security & Permissions
- **Microphone Permission**: Required for recording
- **Permission Prompt**: Shown automatically by browser
- **User Control**: Can deny permission or revoke later
- **Privacy**: Recording happens locally in browser, only uploaded when user confirms

### Error Handling
- Microphone access denied → Alert message
- Recording failure → Console error + alert
- Upload failure → Console error + alert
- API failure → Detailed error response with status code

## Environment Variables

### Required
```env
FAL_KEY=your_fal_api_key_here
```

### Optional (Not Used Anymore)
```env
# CARTESIA_API_KEY=... (replaced with fal.ai)
```

## Dependencies

### Already Installed
- `@fal-ai/serverless-client`: ^0.15.0
- `lucide-react`: ^0.556.0 (for icons)
- `react`: 19.2.0

### No New Dependencies Required
All necessary packages were already installed in the project.

## File Structure
```
video-gen/
├── components/
│   ├── AudioRecorder.tsx          # New: Voice recording component
│   └── AudioUploader.tsx           # Updated: Added recording option
├── app/
│   └── api/
│       └── clone-voice/
│           └── route.ts            # Updated: fal.ai integration
└── .env.local
    └── FAL_KEY=...                 # Required: fal.ai API key
```

## Testing Checklist

- [ ] Click "Clone Voice from Audio" → Modal appears
- [ ] Click "Record Now" → AudioRecorder opens
- [ ] Grant microphone permission → Recording UI shows
- [ ] Click "Start Recording" → Timer starts, mic icon pulses
- [ ] Speak for 10+ seconds → Audio is captured
- [ ] Click "Stop Recording" → Audio player appears
- [ ] Play recorded audio → Audio plays correctly
- [ ] Click "Discard" → Returns to recording UI
- [ ] Record again → Can re-record
- [ ] Click "Use This Recording" → Cloning starts
- [ ] Wait for cloning → Success message with voice ID
- [ ] Click "Upload File" → File picker opens
- [ ] Select audio file → Cloning works
- [ ] Test on HTTPS/localhost → All features work
- [ ] Test error cases → Appropriate error messages

## Future Enhancements

### Potential Improvements
1. **Audio Format Selection**: Let users choose output format (MP3, WAV, etc.)
2. **Visual Waveform**: Show waveform during recording/playback
3. **Noise Reduction**: Apply noise cancellation before cloning
4. **Multi-language Support**: Detect/select language for better cloning
5. **Voice Preview**: Generate a test sample before final cloning
6. **ElevenLabs Integration**: Add ElevenLabs as alternative (requires API key)
7. **Recording Quality Settings**: Allow users to adjust bitrate/sample rate
8. **Maximum Duration**: Add optional max recording length
9. **Countdown Timer**: Add 3-2-1 countdown before recording starts
10. **Save Recordings**: Option to download recording before cloning

### ElevenLabs Alternative
If you want to use ElevenLabs instead of fal.ai:

1. Install ElevenLabs SDK (already installed):
   ```bash
   npm install elevenlabs
   ```

2. Add API key to `.env.local`:
   ```env
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

3. Update `app/api/clone-voice/route.ts`:
   ```typescript
   import { ElevenLabsClient } from "elevenlabs";

   const client = new ElevenLabsClient({
     apiKey: process.env.ELEVENLABS_API_KEY,
   });

   const voice = await client.voices.add({
     name: `Cloned Voice ${Date.now()}`,
     files: [file],
   });

   return NextResponse.json({
     voice_id: voice.voice_id,
     id: voice.voice_id,
   });
   ```

## Support & Troubleshooting

### Common Issues

**Issue**: "Could not access microphone"
- **Solution**: Check browser permissions, ensure HTTPS or localhost, try different browser

**Issue**: "FAL_KEY not configured"
- **Solution**: Add FAL_KEY to `.env.local` file

**Issue**: Recording is silent
- **Solution**: Check system microphone settings, test with other apps, check browser permissions

**Issue**: Voice cloning fails
- **Solution**: Ensure audio is at least 5-10 seconds, check audio quality, try different format

**Issue**: Modal doesn't appear
- **Solution**: Check console for errors, ensure components are imported correctly

## Credits
- Voice cloning powered by [fal.ai](https://fal.ai/)
- Audio recording uses native [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- UI components built with [lucide-react](https://lucide.dev/)
