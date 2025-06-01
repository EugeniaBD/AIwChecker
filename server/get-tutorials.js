import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

/**
 * Get React-related tutorial suggestions using GPT-4 with a project-scoped key
 * @param {string} question - Developer's question
 * @returns {Promise<string>} - Suggested tutorials as a string
 */
export async function getTutorialSuggestions(question) {
  try {
    if (!question || question.trim() === '') {
      throw new Error('A valid question must be provided.');
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const projectId = process.env.OPENAI_PROJECT_ID;

    if (!apiKey || !projectId) {
      throw new Error('OPENAI_API_KEY and OPENAI_PROJECT_ID must be set in your .env file.');
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant specialized in React JS.',
      },
      {
        role: 'user',
        content: `A developer asked: "${question}". Provide concise, practical tutorial or documentation suggestions with links if relevant.`,
      },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Project': projectId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error:', errorText);
      throw new Error(`OpenAI API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('No content returned from OpenAI.');
    }

    return content;
  } catch (err) {
    console.error('❌ Error in getTutorialSuggestions:', err);
    throw new Error('Failed to fetch tutorial suggestions.');
  }
}
