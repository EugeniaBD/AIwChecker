// File: src/API/analyzeWithGPT.js

export async function analyzeWithGPT(text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
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
      console.error('❌ GPT API Error:', response.status, errorBody);
      throw new Error(`Failed to analyze text (status: ${response.status})`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    clearTimeout(timeout);
    console.error('❌ analyzeWithGPT error:', error.message);
    throw error;
  }
}
