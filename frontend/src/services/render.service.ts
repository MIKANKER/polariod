import { api } from './api';
import { RenderRequest, RenderResponse } from '../types/render.types';

/**
 * Render Service
 * Handles photo rendering with templates
 */
export const renderService = {
  /**
   * Render a photo with a template
   * @param request - Render request with photo, templateId, and options
   * @returns Rendered image URL and dimensions
   */
  async render(request: RenderRequest): Promise<RenderResponse> {
    // Build FormData with image and options
    const formData = new FormData();
    formData.append('image', request.photo); // Backend expects 'image', not 'photo'
    
    // Build options object
    const options = {
      templateId: request.templateId,
      fit: request.options.fit,
      offsetX: request.options.offsetX,
      offsetY: request.options.offsetY,
      format: request.options.outputFormat,
      quality: request.options.quality,
    };
    
    // Send options as JSON string
    formData.append('options', JSON.stringify(options));

    // Send POST request to /api/render
    const response = await api.post('/api/render', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob', // Handle blob response
    });

    // Convert blob to URL
    const imageBlob = response.data as Blob;
    const imageUrl = URL.createObjectURL(imageBlob);

    // Extract image dimensions from response headers
    const width = parseInt(response.headers['x-image-width'] || '0', 10);
    const height = parseInt(response.headers['x-image-height'] || '0', 10);

    return {
      imageUrl,
      width,
      height,
    };
  },
};
