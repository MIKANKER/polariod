import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useTemplates } from '../../hooks/useTemplates';
import { validateTemplateFile } from '../../utils/validation';

interface TemplateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * TemplateUploadModal Component
 * Modal for uploading new templates with drag-and-drop support
 * Includes file validation, preview, and progress tracking
 */
export const TemplateUploadModal = ({ isOpen, onClose, onSuccess }: TemplateUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const { upload, isUploading, uploadError, resetUpload } = useTemplates();

  // Validate file using utility function
  const validateFile = (file: File): string | null => {
    const validation = validateTemplateFile(file);
    return validation.isValid ? null : validation.error || 'Error de validación';
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const error = validateFile(file);

    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
    setFilename(file.name.replace('.png', ''));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
  });

  // Handle upload
  const handleUpload = () => {
    if (!selectedFile) return;

    upload(
      {
        file: selectedFile,
        metadata: { filename: filename || selectedFile.name },
        onProgress: setUploadProgress,
      },
      {
        onSuccess: () => {
          setUploadSuccess(true);
          setTimeout(() => {
            handleClose();
            onSuccess?.();
          }, 1500);
        },
      }
    );
  };

  // Handle close
  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setFilename('');
    setUploadProgress(0);
    setValidationError(null);
    setUploadSuccess(false);
    resetUpload();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">
            Subir Plantilla
          </h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Dropzone */}
          {!selectedFile && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive
                  ? 'Suelta el archivo aquí'
                  : 'Arrastra un archivo PNG o haz clic para seleccionar'}
              </p>
              <p className="text-sm text-gray-500">
                Máximo 10MB
              </p>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{validationError}</p>
            </div>
          )}

          {/* File Preview */}
          {selectedFile && preview && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="max-h-64 mx-auto object-contain"
                />
              </div>

              {/* Filename Input */}
              <div>
                <label
                  htmlFor="filename"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nombre de la plantilla
                </label>
                <div className="relative">
                  <input
                    id="filename"
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    disabled={isUploading}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      filename.trim() ? 'border-green-500' : 'border-gray-300'
                    }`}
                    placeholder="Nombre de la plantilla"
                    aria-invalid={!filename.trim() ? 'true' : 'false'}
                  />
                  {filename.trim() && (
                    <CheckCircle className="absolute right-3 top-2.5 w-5 h-5 text-green-500" aria-hidden="true" />
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subiendo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{uploadError.message}</p>
                </div>
              )}

              {/* Upload Success */}
              {uploadSuccess && (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700">¡Plantilla subida exitosamente!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !filename.trim() || isUploading || uploadSuccess}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Subir plantilla"
          >
            {isUploading ? 'Subiendo...' : 'Subir Plantilla'}
          </button>
        </div>
      </div>
    </div>
  );
};
