import { GoogleGenerativeAI } from '@google/generative-ai';
import { convertSvgToPng } from '../../utils/imageUtils';

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface SvgAnalysisResult {
  description: string;
  elements: string[];
  metadata: Record<string, string>;
}

/**
 * Extracts SVG content from binary or text string
 */
function extractSvgContent(content: string): string {
  // If content already has SVG tags, return as is
  if (content.includes('<svg')) {
    return content;
  }
  
  // Otherwise, try to extract from binary/base64
  try {
    // For base64 encoded content
    if (content.startsWith('data:image/svg+xml;base64,')) {
      return atob(content.split(',')[1]);
    }
    
    // For other encoding
    return content;
  } catch (error) {
    console.error('Error extracting SVG content:', error);
    return content;
  }
}

export async function analyzeSvg(svgContent: string): Promise<SvgAnalysisResult> {
  try {
    // Extract SVG content
    const extractedSvgContent = extractSvgContent(svgContent);

    // Clean up SVG content
    const cleanSvgContent = extractedSvgContent
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Try to convert SVG to PNG for better API compatibility
    let imagePart;
    try {
      // Convert SVG to PNG
      const pngFile = await convertSvgToPng(cleanSvgContent);
      
      // Read PNG as base64
      const base64Image = await readFileAsBase64(pngFile);
      
      // Create image part for Gemini API
      imagePart = {
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: 'image/png'
        }
      };
      
      console.log('Using PNG conversion for SVG analysis');
    } catch (error) {
      console.warn('Failed to convert SVG to PNG, using text analysis instead:', error);
      // Fallback to text analysis
      imagePart = null;
    }

    // Get the generative model - use Gemini Pro Vision if we have an image, otherwise Gemini Pro
    const modelName = imagePart ? 'gemini-1.5-flash' : 'gemini-pro';
    const model = genAI.getGenerativeModel({ model: modelName });

    // Create a more detailed prompt for SVG analysis
    const prompt = `
      Analyze this ${imagePart ? 'SVG image' : 'SVG content'} and provide a detailed breakdown in the following format:

      1. A comprehensive description of what the SVG represents, including its visual elements, style, and purpose
      2. List all SVG elements used (e.g., path, rect, circle, etc.) and their purposes
      3. Important attributes and metadata including:
         - Dimensions (width, height, viewBox)
         - Color schemes
         - Gradients or filters if present
         - Animation elements if present
         - Any custom attributes or namespaces
      
      ${!imagePart ? `SVG Content to analyze:\n${cleanSvgContent}` : ''}

      Please format your response with numbered sections (1., 2., 3.) and use clear, technical language.
    `;

    // Generate content based on whether we have an image or not
    let result;
    if (imagePart) {
      // Use image-based analysis
      result = await model.generateContent([prompt, imagePart]);
    } else {
      // Use text-based analysis
      result = await model.generateContent(prompt);
    }
    
    const response = await result.response;
    const text = response.text();

    // Parse the response into structured data
    const sections = text.split('\n\n');
    
    // Extract description (section 1)
    const description = sections
      .find(section => section.trim().startsWith('1.'))
      ?.replace('1.', '')
      .trim() || 'No description available';

    // Extract elements (section 2)
    const elementsSection = sections
      .find(section => section.trim().startsWith('2.'))
      ?.replace('2.', '')
      .trim() || '';
    const elements = elementsSection
      .split(',')
      .map(el => el.trim())
      .filter(el => el.length > 0);

    // Extract metadata (section 3)
    const metadataSection = sections
      .find(section => section.trim().startsWith('3.'))
      ?.replace('3.', '')
      .trim() || '';
    const metadata: Record<string, string> = {};
    
    // Parse metadata lines
    const metadataLines = metadataSection.split('\n');
    metadataLines.forEach(line => {
      // Handle both colon and dash formatted lines
      const matches = line.match(/[-•]?\s*([^:]+):\s*(.+)/);
      if (matches) {
        const [, key, value] = matches;
        metadata[key.trim()] = value.trim();
      }
    });

    // Extract dimensions from SVG content
    const dimensionMatches = {
      width: cleanSvgContent.match(/width="([^"]+)"/),
      height: cleanSvgContent.match(/height="([^"]+)"/),
      viewBox: cleanSvgContent.match(/viewBox="([^"]+)"/)
    };

    // Add dimensions to metadata if found
    Object.entries(dimensionMatches).forEach(([key, match]) => {
      if (match && match[1]) {
        metadata[key] = match[1];
      }
    });

    return {
      description,
      elements: elements.length > 0 ? elements : ['No elements detected'],
      metadata: Object.keys(metadata).length > 0 ? metadata : { note: 'No metadata detected' }
    };
  } catch (error) {
    console.error('Error analyzing SVG with Gemini:', error);
    throw new Error('Failed to analyze SVG with Gemini');
  }
}

// Helper function to read file as base64
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
} 