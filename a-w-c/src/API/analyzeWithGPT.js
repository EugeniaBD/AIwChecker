// File: src/API/analyzeWithGPT.js
export async function analyzeWithGPT(text) {
  const response = await fetch('http://localhost:4000/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze text with GPT');
  }

  const data = await response.json();
  return data.results;
}
