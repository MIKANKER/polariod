import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, X } from 'lucide-react';
import { ACCEPTED_PHOTO_FORMATS, MAX_FILE_SIZE } from '../../config/constants';

interface PhotoUploadZoneProps {
  onPhotoSelected: (file: File) => void;
}

export const PhotoUploadZone = ({ onPhotoSelected }: PhotoUploadZoneProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ACCEPTED_PHOTO_FORMATS.includes(file.type)) {
      return 'Formato no válido. Use JPEG, PNG o WebP.';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'El archivo es demasiado grande (máximo 10MB)';
    }

    return null;
  };

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);

      if (acceptedFiles.length === 0) {
        setError('No se seleccionó ningún archivo válido');
        return;
      }

      const file = acceptedFiles[0];
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      onPhotoSelected(file);
    },
    [onPhotoSelected]
  );

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    multiple: false,
  });

  // Clear selection
  const clearPhoto = () => {
    setPreview(null);
    setError(null);
    onPhotoSelected(null as any);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200 min-h-[200px] flex items-center justify-center
            ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
            ${error ? 'border-red-500 bg-red-50' : ''}
          `}
          role="button"
          aria-label="Zona de carga de fotos. Arrastra una foto aquí o haz clic para seleccionar"
          tabIndex={0}
        >
          <input {...getInputProps()} aria-label="Seleccionar archivo de foto" />
          
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <Upload className="w-12 h-12 text-gray-400" aria-hidden="true" />
              <Camera className="w-12 h-12 text-gray-400 md:hidden" aria-hidden="true" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragActive ? 'Suelta la foto aquí' : 'Arrastra una foto o haz clic para seleccionar'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                JPEG, PNG o WebP (máximo 10MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Vista previa de la foto seleccionada"
            className="w-full h-auto rounded-lg shadow-md"
          />
          <button
            onClick={clearPhoto}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px] min-w-[44px]"
            aria-label="Eliminar foto seleccionada"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};
