const { CartesiaClient } = require('@cartesia/cartesia-js');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk_car_BEwV1Gerv1Y7AbMZ2w5VQb'; // User provided key
const VOICE_ID = '3b554273-4299-48b9-9aaf-eefd438e3941'; // Indian Lady Voice ID found in research
const OUTPUT_FILE = path.join(__dirname, '../public/generated-audio.wav');

// Ensure public directory exists
if (!fs.existsSync(path.join(__dirname, '../public'))) {
  fs.mkdirSync(path.join(__dirname, '../public'));
}

async function generateAudio() {
  console.log("Initializing Cartesia...");
  const cartesia = new CartesiaClient({ apiKey: API_KEY });

  console.log("Generating audio...");
  const websocket = cartesia.tts.websocket({
    container: 'raw',
    encoding: 'pcm_f32le',
    sampleRate: 44100,
  });

  try {
    await websocket.connect();

    const response = await websocket.send({
      modelId: 'sonic-english', // Or sonic-multilingual if needed
      voice: {
        mode: 'id',
        id: VOICE_ID,
      },
      transcript: "Namaste! Welcome to PL Capital. Today we are discussing the latest market trends. Don't panic sell, stay invested for the long term.",
    });

    // console.log("Response keys:", Object.keys(response));
    // console.log("Response type:", response.constructor.name);

    const fileStream = fs.createWriteStream(OUTPUT_FILE);

    response.on('message', (msg) => {
      if (typeof msg === 'string') {
        try {
          const parsed = JSON.parse(msg);

          if (parsed.data) {
            // Assuming data is base64 encoded audio
            fileStream.write(Buffer.from(parsed.data, 'base64'));
          }

          if (parsed.done) {
            console.log("Generation complete.");
            fileStream.end();
            process.exit(0);
          }
        } catch (e) {
          console.error("Error parsing message:", e);
        }
      }
    });

    // Timeout fallback
    await new Promise(resolve => setTimeout(resolve, 15000));
    console.log("Timeout reached.");
    fileStream.end();

  } catch (error) {
    console.error("Generation failed:", error);
  } finally {
    websocket.disconnect();
  }
}

generateAudio();
