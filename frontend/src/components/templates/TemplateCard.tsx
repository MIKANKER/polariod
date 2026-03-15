import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Template } from '../../types/template.types';

interface TemplateCardProps {
  template: Template;
  onDelete: (id: string) => void;
}

/**
 * TemplateCard Component
 * Displays a single template with thumbnail, name, date, and delete action
 * Responsive and includes hover animations
 */
export const TemplateCard = ({ template, onDelete }: TemplateCardProps) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(template.id);
    setShowConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Template Thumbnail */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        <img
          src={template.url}
          alt={`Plantilla ${template.filename}`}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Template Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate mb-1">
          {template.filename}
        </h3>
        <p className="text-sm text-gray-500">
          <time dateTime={template.createdAt}>
            {formatDate(template.createdAt)}
          </time>
        </p>
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDeleteClick}
        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:opacity-100 min-h-[44px] min-w-[44px]"
        aria-label={`Eliminar plantilla ${template.filename}`}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-confirm-${template.id}`}
        >
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h4 id={`delete-confirm-${template.id}`} className="text-lg font-semibold text-gray-900 mb-2">
              ¿Eliminar plantilla?
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
                aria-label={`Confirmar eliminación de ${template.filename}`}
              >
                Eliminar
              </button>
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px]"
                aria-label="Cancelar eliminación"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
