const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Process SVG endpoint
app.post('/api/process-svg', async (req, res) => {
  try {
    const { svgContent, query, mode } = req.body;

    if (!svgContent) {
      return res.status(400).json({ error: 'SVG content is required' });
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    let prompt;
    if (mode === 'text') {
      // Text mode - analyze SVG structure
      prompt = `
        Analyze this SVG content and provide a detailed breakdown:
        ${query || 'Describe the SVG structure and elements'}

        SVG Content:
        ${svgContent}
      `;
    } else {
      // Image mode - describe visual content
      prompt = `
        Analyze this SVG image and provide a detailed visual description:
        ${query || 'Describe what you see in this image'}

        SVG Content:
        ${svgContent}
      `;
    }

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      result: text
    });

  } catch (error) {
    console.error('Error processing SVG:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process SVG',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 