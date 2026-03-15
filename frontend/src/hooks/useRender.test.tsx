import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRender } from './useRender';
import { renderService } from '../services/render.service';
import { DEFAULT_RENDER_OPTIONS } from '../config/constants';

vi.mock('../services/render.service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useRender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });

    expect(result.current.photo).toBeNull();
    expect(result.current.template).toBeNull();
    expect(result.current.options).toEqual(DEFAULT_RENDER_OPTIONS);
    expect(result.current.result).toBeNull();
    expect(result.current.canRender).toBe(false);
  });

  it('should set photo', () => {
    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });
    const mockFile = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.setPhoto(mockFile);
    });

    expect(result.current.photo).toBe(mockFile);
  });

  it('should set template', () => {
    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });

    act(() => {
      result.current.setTemplate('template-123');
    });

    expect(result.current.template).toBe('template-123');
  });

  it('should update render options', () => {
    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });

    act(() => {
      result.current.setOptions({ fit: 'contain', offsetX: 0.5 });
    });

    expect(result.current.options.fit).toBe('contain');
    expect(result.current.options.offsetX).toBe(0.5);
    expect(result.current.options.offsetY).toBe(0); // Should preserve other options
  });

  it('should reset options to defaults', () => {
    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });

    act(() => {
      result.current.setOptions({ fit: 'contain', offsetX: 0.8 });
    });

    act(() => {
      result.current.resetOptions();
    });

    expect(result.current.options).toEqual(DEFAULT_RENDER_OPTIONS);
  });

  it('should enable render when both photo and template are set', () => {
    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });
    const mockFile = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });

    expect(result.current.canRender).toBe(false);

    act(() => {
      result.current.setPhoto(mockFile);
    });

    expect(result.current.canRender).toBe(false);

    act(() => {
      result.current.setTemplate('template-123');
    });

    expect(result.current.canRender).toBe(true);
  });

  it('should call render service and update result on success', async () => {
    const mockResult = {
      imageUrl: 'blob:mock-url',
      width: 800,
      height: 1000,
    };

    vi.mocked(renderService.render).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });
    const mockFile = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.setPhoto(mockFile);
      result.current.setTemplate('template-123');
    });

    act(() => {
      result.current.render();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(renderService.render).toHaveBeenCalledWith({
      photo: mockFile,
      templateId: 'template-123',
      options: DEFAULT_RENDER_OPTIONS,
    });

    expect(result.current.result).toEqual(mockResult);
  });

  it('should handle render errors', async () => {
    const mockError = new Error('Render failed');
    vi.mocked(renderService.render).mockRejectedValue(mockError);

    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });
    const mockFile = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.setPhoto(mockFile);
      result.current.setTemplate('template-123');
    });

    act(() => {
      result.current.render();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('should persist render preferences to localStorage', async () => {
    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });

    act(() => {
      result.current.setOptions({ fit: 'contain', offsetX: 0.7, offsetY: -0.3 });
    });

    await waitFor(() => {
      const stored = localStorage.getItem('renderPreferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.fit).toBe('contain');
      expect(parsed.offsetX).toBe(0.7);
      expect(parsed.offsetY).toBe(-0.3);
    });
  });

  it('should load preferences from localStorage on init', () => {
    const savedPreferences = {
      fit: 'contain',
      offsetX: 0.5,
      offsetY: -0.2,
    };

    localStorage.setItem('renderPreferences', JSON.stringify(savedPreferences));

    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });

    expect(result.current.options.fit).toBe('contain');
    expect(result.current.options.offsetX).toBe(0.5);
    expect(result.current.options.offsetY).toBe(-0.2);
  });

  it('should clear all state', () => {
    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });
    const mockFile = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.setPhoto(mockFile);
      result.current.setTemplate('template-123');
      result.current.setOptions({ offsetX: 0.5 });
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.photo).toBeNull();
    expect(result.current.template).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('should clear result when photo changes', () => {
    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });
    const mockFile1 = new File(['photo1'], 'test1.jpg', { type: 'image/jpeg' });
    const mockFile2 = new File(['photo2'], 'test2.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.setPhoto(mockFile1);
    });

    // Simulate having a result
    act(() => {
      result.current.setPhoto(mockFile2);
    });

    expect(result.current.result).toBeNull();
  });

  it('should persist last selected template to localStorage', async () => {
    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });

    act(() => {
      result.current.setTemplate('template-456');
    });

    await waitFor(() => {
      const stored = localStorage.getItem('lastSelectedTemplate');
      expect(stored).toBe('template-456');
    });
  });

  it('should load last selected template from localStorage on init', () => {
    localStorage.setItem('lastSelectedTemplate', 'template-789');

    const { result } = renderHook(() => useRender(), { wrapper: createWrapper() });

    expect(result.current.template).toBe('template-789');
  });
});
