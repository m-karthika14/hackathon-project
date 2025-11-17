
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPromptTemplate } = require('./promptTemplate');

// Initialize the Google Generative AI client with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates insights by sending a constructed prompt to the Gemini AI model.
 * @param {object} sessionData - The session data to be included in the prompt.
 * @returns {Promise<{jsonReport: object, textReport: string}>} - The generated JSON and text reports.
 */
async function generateInsights(sessionData) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in the environment variables.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  // Replace the placeholder with the actual session data
  const prompt = getPromptTemplate().replace(
    '{{MERGED_SESSION_JSON}}',
    JSON.stringify(sessionData, null, 2)
  );

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // The model is instructed to output JSON first, then text.
    // We'll split the response based on this structure.
    const parts = text.split('```json');
    if (parts.length < 2) {
        // If the expected JSON block is not found, try another split
        const textParts = text.split('\n\n');
        const jsonString = textParts.find(part => part.startsWith('{'));
        const textReport = textParts.filter(part => !part.startsWith('{')).join('\n\n');
        if (!jsonString) {
            throw new Error('Failed to parse Gemini response: No JSON block found.');
        }
        return {
            jsonReport: JSON.parse(jsonString),
            textReport: textReport.trim(),
        };
    }
    
    const jsonPart = parts[1].split('```')[0].trim();
    const textPart = parts[1].split('```')[1] || '';

    return {
      jsonReport: JSON.parse(jsonPart),
      textReport: textPart.trim(),
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate insights from AI model.');
  }
}

module.exports = { generateInsights };
