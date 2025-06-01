
// File: src/API/analyzeWithGPT.js

export async function analyzeWithGPT(text) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const MAX_RETRIES = 2;
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    try {
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`❌ GPT API Error (${response.status}):`, errorBody);
        throw new Error(`Failed to analyze text (status: ${response.status})`);
      }

      const data = await response.json();
      return data.results;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);

      // Optional backoff between retries
      if (attempt < MAX_RETRIES) {
        await new Promise((res) => setTimeout(res, 2000)); // 2s delay
      }
    }
  }

  // Final error after all retries
  console.error('❌ analyzeWithGPT error:', lastError.message);
  throw lastError;
}
