import { useState } from 'react';
import { Download } from 'lucide-react';
import { RenderResponse } from '../../types/render.types';

interface RenderPreviewProps {
  result: RenderResponse;
}

export const RenderPreview = ({ result }: RenderPreviewProps) => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(90);

  // Generate filename with timestamp
  const generateFilename = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `polaroid-${timestamp}.${format}`;
  };

  // Trigger download
  const handleDownload = async () => {
    try {
      // Fetch the blob from the URL
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();

      // If format conversion is needed (JPEG with quality)
      if (format === 'jpeg' && quality !== 100) {
        // Create canvas to convert
        const img = new Image();
        img.src = result.imageUrl;
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const canvas = document.createElement('canvas');
        canvas.width = result.width;
        canvas.height = result.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(
            (convertedBlob) => {
              if (convertedBlob) {
                downloadBlob(convertedBlob, generateFilename());
              }
            },
            `image/${format}`,
            quality / 100
          );
          return;
        }
      }

      // Direct download without conversion
      downloadBlob(blob, generateFilename());
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Helper to download blob
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Resultado
      </h3>

      {/* Preview Image */}
      <div className="relative rounded-lg overflow-hidden shadow-lg bg-gray-100">
        <img
          src={result.imageUrl}
          alt="Imagen renderizada con marco Polaroid"
          className="w-full h-auto"
        />
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded" aria-label={`Dimensiones: ${result.width} por ${result.height} píxeles`}>
          {result.width} × {result.height}
        </div>
      </div>

      {/* Download Controls */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        {/* Format Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Formato de descarga
          </label>
          <div className="flex gap-4" role="group" aria-label="Seleccionar formato de descarga">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="png"
                checked={format === 'png'}
                onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                aria-label="Formato PNG sin pérdida"
              />
              <span className="text-sm text-gray-700">PNG (sin pérdida)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="jpeg"
                checked={format === 'jpeg'}
                onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                aria-label="Formato JPEG menor tamaño"
              />
              <span className="text-sm text-gray-700">JPEG (menor tamaño)</span>
            </label>
          </div>
        </div>

        {/* Quality Slider (only for JPEG) */}
        {format === 'jpeg' && (
          <div className="space-y-2">
            <label htmlFor="jpeg-quality" className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>Calidad JPEG</span>
              <span className="text-blue-600 font-mono">{quality}%</span>
            </label>
            <input
              id="jpeg-quality"
              type="range"
              min="1"
              max="100"
              step="1"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              aria-label="Ajustar calidad JPEG"
              aria-valuemin={1}
              aria-valuemax={100}
              aria-valuenow={quality}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Baja (1%)</span>
              <span>Media (50%)</span>
              <span>Alta (100%)</span>
            </div>
          </div>
        )}

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
          aria-label="Descargar imagen renderizada"
        >
          <Download className="w-5 h-5" aria-hidden="true" />
          Descargar imagen
        </button>
      </div>
    </div>
  );
};
