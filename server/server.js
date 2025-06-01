import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeWithGPT } from './analyze-openai.js';
import { getTutorialSuggestions } from './get-tutorials.js';

dotenv.config(); // Make sure env variables are loaded

console.log("🔑 Loaded API Key?", process.env.OPENAI_API_KEY ? "✅ YES" : "❌ NO");


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ✅ Analyze Endpoint
app.post('/analyze', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Text is required for analysis.' });
  }

  try {
    const result = await analyzeWithGPT(text);
    return res.json({ results: result });
  } catch (err) {
    console.error('❌ GPT Analysis Error:', err.message);
    return res.status(500).json({ error: 'Failed to analyze with GPT' });
  }
});

// ✅ GPT Tutorial Suggestions Endpoint
app.post('/help', async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.trim() === '') {
    return res.status(400).json({ error: 'A valid question is required.' });
  }

  try {
    console.log('📩 GPT Tutorial Query:', question);
    const suggestions = await getTutorialSuggestions(question);
    return res.json({ answer: suggestions });
  } catch (err) {
    console.error('❌ GPT Tutorial Error:', err); // <- FULL error
    return res.status(500).json({ error: 'Failed to get tutorial suggestions.' });
  }
});


// ✅ Root health check (optional)
app.get('/', (req, res) => {
  res.send('✅ GPT API Server is running');
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);

});
