import React, { useState, useRef } from 'react';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface SvgProcessorProps {
  className?: string;
}

export const SvgProcessor: React.FC<SvgProcessorProps> = ({ className }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessSvg = (file: File) => {
    // Clear previous states
    setError(null);
    setResult('');
    setPreviewUrl(null);

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

        // Create preview URL
        const svgDataUrl = `data:image/svg+xml;base64,${btoa(content)}`;
        
        // Validate SVG
        const img = new Image();
        img.onload = () => {
          setSvgContent(content);
          setPreviewUrl(svgDataUrl);
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

  const handleProcess = async () => {
    if (!svgContent) {
      setError('Please upload an SVG file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/process-svg`, {
        svgContent,
        query,
        mode
      });

      if (response.data.success) {
        setResult(response.data.result);
      } else {
        setError(response.data.error || 'Failed to process SVG');
      }
    } catch (err) {
      console.error('Error processing SVG:', err);
      setError('Failed to process SVG. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("p-4 max-w-4xl mx-auto space-y-6", className)}>
      <div 
        className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
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
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {previewUrl && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded shadow">
              <h3 className="font-semibold mb-2">Preview</h3>
              <div className="border rounded p-4 bg-gray-50 flex items-center justify-center min-h-[200px]">
                <img 
                  src={previewUrl} 
                  alt="SVG Preview" 
                  className="max-w-full max-h-[300px] object-contain"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Processing Mode
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="text"
                      checked={mode === 'text'}
                      onChange={() => setMode('text')}
                      className="mr-2"
                    />
                    Text Analysis
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="image"
                      checked={mode === 'image'}
                      onChange={() => setMode('image')}
                      className="mr-2"
                    />
                    Image Analysis
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Query (optional)
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., List all shapes or Describe the image"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <button
                onClick={handleProcess}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Process SVG'}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="p-4 bg-white rounded shadow">
            <h3 className="font-semibold mb-2">Analysis Result</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}; 