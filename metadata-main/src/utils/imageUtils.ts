/**
 * Utility functions for image processing
 */

/**
 * Converts an SVG to PNG format using HTML5 Canvas
 * @param svgContent - The SVG content as string
 * @param width - The desired width of the PNG (default: 800)
 * @param height - The desired height of the PNG (default: 600)
 * @returns Promise resolving to a File object containing the PNG data
 */
export async function convertSvgToPng(svgContent: string, width = 800, height = 600): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      // Create a data URL from the SVG content
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      
      // Create an image element to load the SVG
      const img = new Image();
      img.onload = () => {
        // Create a canvas to render the image
        const canvas = document.createElement('canvas');
        
        // Get original SVG dimensions if possible
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        
        // Try to get dimensions from SVG attributes
        const svgWidth = svgElement.getAttribute('width');
        const svgHeight = svgElement.getAttribute('height');
        const viewBox = svgElement.getAttribute('viewBox')?.split(' ');
        
        // Set canvas dimensions
        if (svgWidth && svgHeight) {
          // Use dimensions from SVG attributes
          canvas.width = parseInt(svgWidth, 10) || width;
          canvas.height = parseInt(svgHeight, 10) || height;
        } else if (viewBox && viewBox.length === 4) {
          // Use dimensions from viewBox
          canvas.width = parseInt(viewBox[2], 10) || width;
          canvas.height = parseInt(viewBox[3], 10) || height;
        } else {
          // Use default dimensions
          canvas.width = width;
          canvas.height = height;
        }
        
        // Draw the image to the canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Set background to white (optional)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to PNG blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create PNG blob'));
            return;
          }
          
          // Create a File object from the blob
          const pngFile = new File([blob], 'converted-svg.png', { type: 'image/png' });
          
          // Clean up
          URL.revokeObjectURL(url);
          
          resolve(pngFile);
        }, 'image/png');
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG image'));
      };
      
      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
} 