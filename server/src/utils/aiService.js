import axios from 'axios';

// Local backend endpoint (not OpenAI directly)
const API_URL = import.meta.env.VITE_API_URL + '/analyze';


// Function to analyze text through backend
export const analyzeText = async (text) => {
  try {
    const response = await axios.post(
      API_URL,
      { text }, // Just pass the text
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // The backend returns { results: {...} }
    return response.data.results;
  } catch (error) {
    console.error('Error analyzing text: ', error);
    throw new Error('Text analysis failed.');
  }
};
