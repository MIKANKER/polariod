import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AppLayout } from '../components/layout';
import { TemplateGallery } from '../components/templates/TemplateGallery';
import { TemplateUploadModal } from '../components/templates/TemplateUploadModal';

/**
 * TemplateGalleryPage
 * Main page for viewing and managing templates
 * Integrates gallery display and upload functionality
 */
export const TemplateGalleryPage = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleUploadSuccess = () => {
    // Modal will close automatically after success
    // Gallery will update automatically via React Query
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Mis Plantillas
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona tus plantillas personalizadas para marcos Polaroid
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
          aria-label="Abrir modal para subir nueva plantilla"
        >
          <Plus size={20} aria-hidden="true" />
          <span>Subir Plantilla</span>
        </button>
      </div>

      {/* Gallery Content */}
      <TemplateGallery />

      {/* Upload Modal */}
      <TemplateUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </AppLayout>
  );
};
