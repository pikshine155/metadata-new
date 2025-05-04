# SVG Processor with Gemini AI

A modern web application built with React and Vite that processes SVG files using Google's Gemini AI API. The application provides analysis and metadata generation for SVG files.

## Features

- Upload and preview SVG files
- SVG validation and parsing
- SVG-to-PNG conversion for AI model compatibility
- Integration with Google Gemini AI for image analysis
- Detailed SVG element breakdown
- Metadata extraction

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Google Gemini AI API
- HTML5 Canvas for SVG-to-PNG conversion

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- NPM or Yarn
- Google Gemini API key

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```
   npm run dev
   ```

### Usage

1. Navigate to the application in your browser
2. Upload an SVG file by dragging and dropping or using the file browser
3. The SVG will be displayed and validated
4. Click "Analyze SVG" to process the image with Gemini AI
5. View the detailed analysis of your SVG elements, styles, and metadata

## License

This project is licensed under the MIT License - see the LICENSE file for details. 