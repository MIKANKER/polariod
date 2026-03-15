import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderService } from './render.service';
import { api } from './api';
import { RenderRequest } from '../types/render.types';

vi.mock('./api');

describe('renderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  });

  describe('render', () => {
    it('should send FormData with photo, templateId, and options', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/png' });
      const mockResponse = {
        data: mockBlob,
        headers: {
          'x-image-width': '800',
          'x-image-height': '1000',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const request: RenderRequest = {
        photo: new File(['photo'], 'test.jpg', { type: 'image/jpeg' }),
        templateId: 'template-123',
        options: {
          fit: 'cover',
          offsetX: 0.5,
          offsetY: -0.3,
        },
      };

      await renderService.render(request);

      expect(api.post).toHaveBeenCalledWith(
        '/api/render',
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob',
        })
      );

      const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
      
      // El servicio envía 'image' en lugar de 'photo'
      expect(formData.get('image')).toBe(request.photo);
      
      // El servicio envía 'options' como JSON string
      const optionsStr = formData.get('options') as string;
      expect(optionsStr).toBeTruthy();
      const options = JSON.parse(optionsStr);
      expect(options.templateId).toBe('template-123');
      expect(options.fit).toBe('cover');
      expect(options.offsetX).toBe(0.5);
      expect(options.offsetY).toBe(-0.3);
    });

    it('should include optional format and quality parameters', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/jpeg' });
      const mockResponse = {
        data: mockBlob,
        headers: {
          'x-image-width': '800',
          'x-image-height': '1000',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const request: RenderRequest = {
        photo: new File(['photo'], 'test.jpg', { type: 'image/jpeg' }),
        templateId: 'template-123',
        options: {
          fit: 'contain',
          offsetX: 0,
          offsetY: 0,
          outputFormat: 'jpeg',
          quality: 85,
        },
      };

      await renderService.render(request);

      const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
      
      // El servicio envía 'options' como JSON string
      const optionsStr = formData.get('options') as string;
      expect(optionsStr).toBeTruthy();
      const options = JSON.parse(optionsStr);
      expect(options.format).toBe('jpeg');
      expect(options.quality).toBe(85);
    });

    it('should return image URL and dimensions', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/png' });
      const mockResponse = {
        data: mockBlob,
        headers: {
          'x-image-width': '1200',
          'x-image-height': '1600',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const request: RenderRequest = {
        photo: new File(['photo'], 'test.jpg', { type: 'image/jpeg' }),
        templateId: 'template-123',
        options: {
          fit: 'cover',
          offsetX: 0,
          offsetY: 0,
        },
      };

      const result = await renderService.render(request);

      expect(result.imageUrl).toMatch(/^blob:/);
      expect(result.width).toBe(1200);
      expect(result.height).toBe(1600);
    });

    it('should handle missing dimension headers', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/png' });
      const mockResponse = {
        data: mockBlob,
        headers: {},
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const request: RenderRequest = {
        photo: new File(['photo'], 'test.jpg', { type: 'image/jpeg' }),
        templateId: 'template-123',
        options: {
          fit: 'cover',
          offsetX: 0,
          offsetY: 0,
        },
      };

      const result = await renderService.render(request);

      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });
  });
});
