import React, { useState, useRef } from 'react';
import { analyzeSvg, SvgAnalysisResult } from '../integrations/gemini/gemini';
import { convertSvgToPng } from '../utils/imageUtils';

export const SvgAnalyzer: React.FC = () => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [analysis, setAnalysis] = useState<SvgAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [convertedPngUrl, setConvertedPngUrl] = useState<string | null>(null);
  const [useConvertedPng, setUseConvertedPng] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessSvg = (file: File) => {
    // Clear previous states
    setError(null);
    setAnalysis(null);
    setPreviewUrl(null);
    setConvertedPngUrl(null);

    // Validate file type and extension
    const validTypes = ['image/svg+xml'];
    const validExtensions = ['.svg'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('Please upload a valid SVG file');
      return;
    }

    // Read file as text
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        
        // Validate SVG content
        if (!content.includes('<svg')) {
          setError('Invalid SVG content');
          return;
        }

        // Clean up SVG content
        const cleanContent = content
          .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/[\r\n]+/g, ' ') // Remove line breaks
          .trim();

        // Ensure SVG has proper XML declaration and namespace
        let finalContent = cleanContent;
        if (!finalContent.startsWith('<?xml')) {
          finalContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + finalContent;
        }
        if (!finalContent.includes('xmlns="http://www.w3.org/2000/svg"')) {
          finalContent = finalContent.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        // Create preview URL
        const svgDataUrl = `data:image/svg+xml;base64,${btoa(finalContent)}`;
        
        // Validate SVG
        const img = new Image();
        img.onload = async () => {
          setSvgContent(finalContent);
          setPreviewUrl(svgDataUrl);
          
          // Also convert to PNG for API compatibility
          try {
            const pngFile = await convertSvgToPng(finalContent);
            const pngUrl = URL.createObjectURL(pngFile);
            setConvertedPngUrl(pngUrl);
          } catch (convErr) {
            console.error('Error converting SVG to PNG:', convErr);
            // Continue with SVG only if conversion fails
          }
        };
        img.onerror = () => {
          setError('Invalid SVG format');
        };
        img.src = svgDataUrl;

      } catch (err) {
        console.error('Error processing SVG:', err);
        setError('Error processing SVG file');
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
    };

    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndProcessSvg(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      validateAndProcessSvg(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleAnalyze = async () => {
    if (!svgContent) return;

    setLoading(true);
    setError(null);

    try {
      // If we have a PNG conversion and it's enabled, use it instead
      if (useConvertedPng && convertedPngUrl) {
        // Create a temporary image to load the PNG
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const pngData = await new Promise<string>((resolve, reject) => {
          img.onload = () => {
            // Create a canvas to get the PNG data
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }
            
            // Draw the PNG
            ctx.drawImage(img, 0, 0);
            
            // Convert to data URL
            resolve(canvas.toDataURL('image/png'));
          };
          
          img.onerror = () => {
            reject(new Error('Failed to load PNG image'));
          };
          
          img.src = convertedPngUrl;
        });
        
        // Fallback to SVG analysis until we implement PNG analysis
        const result = await analyzeSvg(svgContent);
        setAnalysis(result);
      } else {
        // Use original SVG analysis
        const result = await analyzeSvg(svgContent);
        setAnalysis(result);
      }
    } catch (err) {
      setError('Failed to analyze SVG. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    for (const item of items) {
      if (item.type.includes('svg')) {
        const file = item.getAsFile();
        if (file && fileInputRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
          handleFileUpload({ target: { files: dataTransfer.files } } as any);
          break;
        }
      }
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div 
        className="mb-6 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onPaste={handlePaste}
      >
        <label className="block mb-4 text-lg font-medium text-gray-700">
          Upload SVG File
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
        <p className="mt-2 text-sm text-gray-500">
          Drag and drop an SVG file here, or click to select a file
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {previewUrl && (
          <div className="p-4 bg-white rounded shadow">
            <h3 className="font-semibold mb-2">Preview</h3>
            <div className="border rounded p-4 bg-gray-50 flex items-center justify-center min-h-[200px]">
              <img 
                src={previewUrl} 
                alt="SVG Preview" 
                className="max-w-full max-h-[300px] object-contain"
              />
            </div>
            {convertedPngUrl && (
              <div className="mt-4">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useConvertedPng}
                    onChange={(e) => setUseConvertedPng(e.target.checked)}
                    className="rounded text-blue-500"
                  />
                  <span>Use PNG conversion for API compatibility</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Gemini API doesn't support SVG format directly. Converting to PNG ensures compatibility.
                </p>
              </div>
            )}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze SVG'}
            </button>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded shadow">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{analysis.description}</p>
            </div>

            <div className="p-4 bg-white rounded shadow">
              <h3 className="font-semibold mb-2">SVG Elements</h3>
              <ul className="list-disc pl-5 text-gray-700">
                {analysis.elements.map((element, index) => (
                  <li key={index}>{element}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-white rounded shadow">
              <h3 className="font-semibold mb-2">Metadata</h3>
              <ul className="space-y-1 text-gray-700">
                {Object.entries(analysis.metadata).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium">{key}:</span> {value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 