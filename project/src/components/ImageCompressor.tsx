import React, { useState, useCallback } from 'react';
import { Upload, Download, Image as ImageIcon } from 'lucide-react';

interface CompressedImage {
  originalSize: number;
  compressedSize: number;
  compressedDataUrl: string;
  name: string;
}

export function ImageCompressor() {
  const [image, setImage] = useState<CompressedImage | null>(null);
  const [loading, setLoading] = useState(false);

  const compressImage = useCallback((file: File): Promise<CompressedImage> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Calculate new dimensions while maintaining aspect ratio
          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress the image
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          resolve({
            originalSize: file.size,
            compressedSize: Math.round((compressedDataUrl.length * 3) / 4),
            compressedDataUrl,
            name: file.name
          });
        };
      };
    });
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      setImage(compressed);
    } catch (error) {
      console.error('Error compressing image:', error);
    }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!image) return;
    
    const link = document.createElement('a');
    link.href = image.compressedDataUrl;
    link.download = `compressed-${image.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Image Compressor</h1>
        <p className="text-gray-600">Compress your images without losing too much quality</p>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-t-2 border-gray-500 rounded-full animate-spin" />
                <span className="text-gray-500">Processing...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-gray-500">Click to upload an image</span>
              </div>
            )}
          </label>
        </div>

        {image && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Original size:</span>
                <span className="text-sm text-gray-900">{formatSize(image.originalSize)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Compressed size:</span>
                <span className="text-sm text-gray-900">{formatSize(image.compressedSize)}</span>
              </div>
              <div className="mt-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Reduction:</span>
                  <span className="text-sm font-medium text-green-600">
                    {Math.round((1 - image.compressedSize / image.originalSize) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="relative rounded-lg overflow-hidden">
              <img
                src={image.compressedDataUrl}
                alt="Preview"
                className="w-full h-auto"
              />
            </div>

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Compressed Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}