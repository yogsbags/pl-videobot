const { CartesiaClient } = require('@cartesia/cartesia-js');
const fs = require('fs');
const path = require('path');

// Load API Key from .env.local
const envPath = path.join(__dirname, '../.env.local');
let apiKey = '';
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/CARTESIA_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
} catch (e) { }

if (!apiKey) {
  console.error("CARTESIA_API_KEY not found");
  process.exit(1);
}

async function listVoices() {
  const cartesia = new CartesiaClient({ apiKey });
  try {
    const voices = await cartesia.voices.list();
    console.log("Found", voices.length, "voices.");

    // Filter for Indian/Hindi/Hinglish voices
    const indianVoices = voices.filter(v =>
      v.name.toLowerCase().includes('indian') ||
      v.name.toLowerCase().includes('hindi') ||
      v.language === 'hi' ||
      (v.description && v.description.toLowerCase().includes('india'))
    );

    console.log("\n--- Potential Indian Voices ---");
    indianVoices.forEach(v => {
      console.log(`Name: ${v.name}, ID: ${v.id}, Lang: ${v.language}, Gender: ${v.gender || 'N/A'}`);
    });

    console.log("\n--- All Voices (First 10) ---");
    voices.slice(0, 10).forEach(v => {
      console.log(`Name: ${v.name}, ID: ${v.id}`);
    });

  } catch (error) {
    console.error("Error fetching voices:", error);
  }
}

listVoices();
