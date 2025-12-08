const fs = require('fs');
const path = require('path');

// 1. Load FAL_KEY from .env.local
const envPath = path.join(__dirname, '../.env.local');
let falKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/FAL_KEY=(.+)/);
  if (match) {
    falKey = match[1].trim();
  }
} catch (err) {
  console.error("Error reading .env.local:", err.message);
  process.exit(1);
}

if (!falKey) {
  console.error("FAL_KEY not found in .env.local");
  process.exit(1);
}

console.log("Loaded FAL_KEY:", falKey.substring(0, 5) + "..." + falKey.substring(falKey.length - 5));

// 2. Test Connection
async function testConnection() {
  const targetUrl = 'https://queue.fal.run/fal-ai/wan-25-preview/text-to-video';
  console.log("\nTesting connection to:", targetUrl);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        prompt: "test video",
        aspect_ratio: "16:9"
      })
    });

    console.log("Status:", response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error("Error Body:", text);
    } else {
      const json = await response.json();
      console.log("Success! Request ID:", json.request_id);
      console.log("Connection verified.");
    }

  } catch (error) {
    console.error("Connection failed:", error.message);
  }
}

testConnection();
