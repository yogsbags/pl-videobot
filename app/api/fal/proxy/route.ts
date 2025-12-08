import { NextRequest, NextResponse } from "next/server";

const FAL_KEY = process.env.FAL_KEY;
const TARGET_URL_HEADER = "x-fal-target-url";

async function proxyHandler(request: NextRequest) {
  const targetUrl = request.headers.get(TARGET_URL_HEADER);
  console.log("Proxy Request:", { targetUrl, hasFalKey: !!FAL_KEY });
  if (!targetUrl) {
    return NextResponse.json({ error: "Missing x-fal-target-url header" }, { status: 400 });
  }

  try {
    const urlObj = new URL(targetUrl);
    if (!/(\.|^)fal\.(run|ai)$/.test(urlObj.host)) {
      return NextResponse.json({ error: "Invalid target URL" }, { status: 412 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid target URL format" }, { status: 400 });
  }

  if (!FAL_KEY) {
    console.error("FAL_KEY is missing in environment variables");
    return NextResponse.json({ error: "Missing Fal credentials" }, { status: 401 });
  }

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase().startsWith("x-fal-")) {
      headers.set(key, value);
    }
  });
  headers.set("Authorization", `Key ${FAL_KEY}`);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const body = request.method === "GET" ? undefined : await request.text();

  try {
    // Increase timeout to 60 seconds to avoid ConnectTimeoutError
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      signal: AbortSignal.timeout(60000),
    });

    const responseHeaders = new Headers(response.headers);

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: error.message || "Proxy failed" }, { status: 500 });
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
