const fal = require("@fal-ai/serverless-client");
require("dotenv").config({ path: ".env.local" });

fal.config({
  credentials: process.env.FAL_KEY,
});

async function testFlux() {
  console.log("Testing fal-ai/flux-2-flex...");
  try {
    const result = await fal.subscribe("fal-ai/flux-2-flex", {
      input: {
        prompt: "A photo of a cat",
        image_size: "portrait_4_3", // Testing if this is valid
      },
      logs: true,
    });
    console.log("Success!", result);
  } catch (error) {
    console.error("Error with portrait_4_3:", error.message);

    // Try fallback
    try {
      console.log("Retrying with explicit dimensions...");
      const result2 = await fal.subscribe("fal-ai/flux-2-flex", {
        input: {
          prompt: "A photo of a cat",
          image_size: { width: 832, height: 1216 }
        },
        logs: true,
      });
      console.log("Success with dimensions!", result2);
    } catch (e2) {
      console.error("Error with dimensions:", e2.message);
    }
  }
}

testFlux();
