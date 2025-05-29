import axios from 'axios';

// Access the OpenAI API key from environment variables
const OPENAI_API_KEY = import.meta.env.REACT_APP_OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/completions'; // GPT model API URL

// Function to detect AI content or analyze text
export const analyzeText = async (text) => {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: 'gpt-4', // change this model to any other model, like GPT-3, if needed.
        prompt: text,
        max_tokens: 200, // You can adjust this value based on your needs.
        temperature: 0.7, // Controls the randomness of the output (higher = more random).
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`, // Include the API key in the header
        },
      }
    );
    return response.data.choices[0].text.trim(); // Return the AI-generated response
  } catch (error) {
    console.error('Error detecting AI content: ', error);
    throw new Error('AI content detection failed.');
  }
};
