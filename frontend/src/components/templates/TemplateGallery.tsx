import { useTemplates } from '../../hooks/useTemplates';
import { TemplateCard } from './TemplateCard';
import { Loader2, ImageOff } from 'lucide-react';

interface TemplateGalleryProps {
  onTemplateSelect?: (templateId: string) => void;
}

/**
 * TemplateGallery Component
 * Displays all user templates in a responsive grid
 * Handles loading, error, and empty states
 */
export const TemplateGallery = ({ onTemplateSelect }: TemplateGalleryProps) => {
  const { templates, isLoading, error, deleteTemplate, refetch } = useTemplates();

  // Sort templates by creation date descending (newest first)
  const sortedTemplates = [...templates].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16" role="status" aria-live="polite">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" aria-hidden="true" />
        <p className="text-gray-600">Cargando plantillas...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16" role="alert">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error al cargar plantillas
          </h3>
          <p className="text-red-700 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
            aria-label="Reintentar carga de plantillas"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedTemplates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" role="status">
        <ImageOff className="w-16 h-16 text-gray-400 mb-4" aria-hidden="true" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No hay plantillas
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          Aún no has subido ninguna plantilla. Haz clic en el botón "Subir Plantilla" para comenzar.
        </p>
      </div>
    );
  }

  // Gallery grid
  return (
    <div
      data-testid="template-grid"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-8"
      role="list"
      aria-label="Galería de plantillas"
    >
      {sortedTemplates.map((template) => (
        <div
          key={template.id}
          onClick={() => onTemplateSelect?.(template.id)}
          className={onTemplateSelect ? 'cursor-pointer' : ''}
          role="listitem"
        >
          <TemplateCard
            template={template}
            onDelete={deleteTemplate}
          />
        </div>
      ))}
    </div>
  );
};
