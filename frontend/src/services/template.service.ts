import { api } from './api';
import { Template, TemplateUploadRequest } from '../types/template.types';

/**
 * Template Service
 * Handles all template-related API operations
 */
export const templateService = {
  /**
   * Get list of all templates for the authenticated user
   * GET /api/templates
   */
  async list(): Promise<Template[]> {
    const response = await api.get<{ templates: Template[] }>('/api/templates');
    return response.data.templates;
  },

  /**
   * Get a specific template by ID
   * GET /api/templates/:id
   */
  async get(id: string): Promise<Template> {
    const response = await api.get<{ template: Template }>(`/api/templates/${id}`);
    return response.data.template;
  },

  /**
   * Upload a new template
   * POST /api/templates
   * @param file - PNG file to upload
   * @param metadata - Optional filename and photoRectNorm
   * @param onUploadProgress - Optional callback for upload progress tracking
   */
  async upload(
    file: File,
    metadata?: { filename?: string; photoRectNorm?: { x: number; y: number; w: number; h: number } },
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ): Promise<Template> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata?.filename) {
      formData.append('filename', metadata.filename);
    }
    
    if (metadata?.photoRectNorm) {
      formData.append('photoRectNorm', JSON.stringify(metadata.photoRectNorm));
    }

    const response = await api.post<{ template: Template }>('/api/templates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          onUploadProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
          });
        }
      },
    });
    
    return response.data.template;
  },

  /**
   * Delete a template by ID
   * DELETE /api/templates/:id
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/api/templates/${id}`);
  },
};
