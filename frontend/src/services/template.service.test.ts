import { describe, it, expect, vi, beforeEach } from 'vitest';
import { templateService } from './template.service';
import { api } from './api';
import { Template } from '../types/template.types';

// Mock the api module
vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('templateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTemplate: Template = {
    id: 'template-123',
    filename: 'test-template.png',
    url: 'https://example.com/templates/test.png',
    width: 1000,
    height: 1200,
    photoRectNorm: { x: 0.1, y: 0.2, w: 0.8, h: 0.6 },
    createdAt: '2024-01-15T10:30:00Z',
  };

  describe('list', () => {
    it('should fetch all templates', async () => {
      const mockTemplates = [mockTemplate];
      vi.mocked(api.get).mockResolvedValue({
        data: { templates: mockTemplates },
      });

      const result = await templateService.list();

      expect(api.get).toHaveBeenCalledWith('/api/templates');
      expect(result).toEqual(mockTemplates);
    });

    it('should return empty array when no templates exist', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { templates: [] },
      });

      const result = await templateService.list();

      expect(result).toEqual([]);
    });
  });

  describe('get', () => {
    it('should fetch a specific template by id', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { template: mockTemplate },
      });

      const result = await templateService.get('template-123');

      expect(api.get).toHaveBeenCalledWith('/api/templates/template-123');
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('upload', () => {
    it('should upload template with file only', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      vi.mocked(api.post).mockResolvedValue({
        data: { template: mockTemplate },
      });

      const result = await templateService.upload(file);

      expect(api.post).toHaveBeenCalledWith(
        '/api/templates',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockTemplate);
    });

    it('should upload template with metadata', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const metadata = {
        filename: 'My Custom Template',
        photoRectNorm: { x: 0.1, y: 0.2, w: 0.8, h: 0.6 },
      };
      vi.mocked(api.post).mockResolvedValue({
        data: { template: mockTemplate },
      });

      const result = await templateService.upload(file, metadata);

      expect(api.post).toHaveBeenCalled();
      expect(result).toEqual(mockTemplate);
    });

    it('should track upload progress', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const onProgress = vi.fn();
      
      vi.mocked(api.post).mockImplementation((_url, _data, config) => {
        // Simulate progress callback
        if (config?.onUploadProgress) {
          config.onUploadProgress({ loaded: 50, total: 100 } as any);
        }
        return Promise.resolve({ data: { template: mockTemplate } });
      });

      await templateService.upload(file, undefined, onProgress);

      expect(onProgress).toHaveBeenCalledWith({ loaded: 50, total: 100 });
    });
  });

  describe('delete', () => {
    it('should delete a template by id', async () => {
      vi.mocked(api.delete).mockResolvedValue({});

      await templateService.delete('template-123');

      expect(api.delete).toHaveBeenCalledWith('/api/templates/template-123');
    });
  });
});
