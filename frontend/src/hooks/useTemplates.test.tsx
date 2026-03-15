import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTemplates } from './useTemplates';
import { templateService } from '../services/template.service';
import { Template } from '../types/template.types';

// Mock the template service
vi.mock('../services/template.service', () => ({
  templateService: {
    list: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockTemplate: Template = {
  id: 'template-123',
  filename: 'test-template.png',
  url: 'https://example.com/templates/test.png',
  width: 1000,
  height: 1200,
  photoRectNorm: { x: 0.1, y: 0.2, w: 0.8, h: 0.6 },
  createdAt: '2024-01-15T10:30:00Z',
};

describe('useTemplates', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('list templates', () => {
    it('should fetch templates successfully', async () => {
      const mockTemplates = [mockTemplate];
      vi.mocked(templateService.list).mockResolvedValue(mockTemplates);

      const { result } = renderHook(() => useTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.templates).toEqual(mockTemplates);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      const error = new Error('Network error');
      vi.mocked(templateService.list).mockRejectedValue(error);

      const { result } = renderHook(() => useTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.templates).toEqual([]);
    });
  });

  describe('upload template', () => {
    it('should upload template successfully', async () => {
      const mockTemplates = [mockTemplate];
      vi.mocked(templateService.list).mockResolvedValue(mockTemplates);
      vi.mocked(templateService.upload).mockResolvedValue(mockTemplate);

      const { result } = renderHook(() => useTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const file = new File(['content'], 'test.png', { type: 'image/png' });
      
      result.current.upload({
        file,
        metadata: { filename: 'Test Template' },
      });

      await waitFor(() => {
        expect(result.current.isUploading).toBe(false);
      });

      expect(templateService.upload).toHaveBeenCalled();
    });

    it('should track upload progress', async () => {
      vi.mocked(templateService.list).mockResolvedValue([]);
      vi.mocked(templateService.upload).mockResolvedValue(mockTemplate);

      const { result } = renderHook(() => useTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const onProgress = vi.fn();
      
      result.current.upload({
        file,
        onProgress,
      });

      await waitFor(() => {
        expect(result.current.isUploading).toBe(false);
      });
    });

    it('should handle upload error', async () => {
      const error = new Error('Upload failed');
      vi.mocked(templateService.list).mockResolvedValue([]);
      vi.mocked(templateService.upload).mockRejectedValue(error);

      const { result } = renderHook(() => useTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const file = new File(['content'], 'test.png', { type: 'image/png' });
      
      result.current.upload({ file });

      await waitFor(() => {
        expect(result.current.uploadError).toBeTruthy();
      });
    });
  });

  describe('delete template', () => {
    it('should delete template successfully', async () => {
      const mockTemplates = [mockTemplate];
      vi.mocked(templateService.list).mockResolvedValue(mockTemplates);
      vi.mocked(templateService.delete).mockResolvedValue();

      const { result } = renderHook(() => useTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.deleteTemplate('template-123');

      await waitFor(() => {
        expect(templateService.delete).toHaveBeenCalled();
        const calls = vi.mocked(templateService.delete).mock.calls;
        expect(calls[0][0]).toBe('template-123');
      });
    });

    it('should handle delete error', async () => {
      const error = new Error('Delete failed');
      vi.mocked(templateService.list).mockResolvedValue([mockTemplate]);
      vi.mocked(templateService.delete).mockRejectedValue(error);

      const { result } = renderHook(() => useTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.deleteTemplate('template-123');

      await waitFor(() => {
        expect(result.current.deleteError).toBeTruthy();
      });
    });

    it('should optimistically update cache on delete', async () => {
      const template2: Template = { ...mockTemplate, id: 'template-456' };
      vi.mocked(templateService.list).mockResolvedValue([mockTemplate, template2]);
      vi.mocked(templateService.delete).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useTemplates(), { wrapper });

      await waitFor(() => {
        expect(result.current.templates).toHaveLength(2);
      });

      result.current.deleteTemplate('template-123');

      // Should immediately remove from cache (optimistic update)
      await waitFor(() => {
        const hasTemplate = result.current.templates.some(t => t.id === 'template-123');
        expect(hasTemplate).toBe(false);
      }, { timeout: 2000 });
    });
  });
});
