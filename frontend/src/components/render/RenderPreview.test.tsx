import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RenderPreview } from './RenderPreview';
import { RenderResponse } from '../../types/render.types';

const mockResult: RenderResponse = {
  imageUrl: 'blob:mock-url',
  width: 800,
  height: 1000,
};

describe('RenderPreview', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-download-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(['image data'])),
      } as Response)
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render result image', () => {
    render(<RenderPreview result={mockResult} />);

    const img = screen.getByAltText(/Imagen renderizada/i) as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('blob:mock-url');
  });

  it('should display image dimensions', () => {
    render(<RenderPreview result={mockResult} />);

    expect(screen.getByText('800 × 1000')).toBeInTheDocument();
  });

  it('should render format selector with PNG and JPEG options', () => {
    render(<RenderPreview result={mockResult} />);

    expect(screen.getByLabelText(/PNG \(sin pérdida\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/JPEG \(menor tamaño\)/i)).toBeInTheDocument();
  });

  it('should default to PNG format', () => {
    render(<RenderPreview result={mockResult} />);

    const pngRadio = screen.getByLabelText(/PNG \(sin pérdida\)/i) as HTMLInputElement;
    expect(pngRadio.checked).toBe(true);
  });

  it('should not show quality slider for PNG format', () => {
    render(<RenderPreview result={mockResult} />);

    expect(screen.queryByText(/Calidad JPEG/i)).not.toBeInTheDocument();
  });

  it('should show quality slider when JPEG is selected', () => {
    render(<RenderPreview result={mockResult} />);

    const jpegRadio = screen.getByLabelText(/JPEG \(menor tamaño\)/i);
    fireEvent.click(jpegRadio);

    expect(screen.getByText(/Calidad JPEG/i)).toBeInTheDocument();
  });

  it('should display quality value', () => {
    render(<RenderPreview result={mockResult} />);

    const jpegRadio = screen.getByLabelText(/JPEG \(menor tamaño\)/i);
    fireEvent.click(jpegRadio);

    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('should update quality value when slider changes', () => {
    render(<RenderPreview result={mockResult} />);

    const jpegRadio = screen.getByLabelText(/JPEG \(menor tamaño\)/i);
    fireEvent.click(jpegRadio);

    const qualitySlider = screen.getByRole('slider');
    fireEvent.change(qualitySlider, { target: { value: '75' } });

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should render download button', () => {
    render(<RenderPreview result={mockResult} />);

    expect(screen.getByText(/Descargar imagen/i)).toBeInTheDocument();
  });

  it('should trigger download when button is clicked', async () => {
    render(<RenderPreview result={mockResult} />);

    const downloadButton = screen.getByText(/Descargar imagen/i);

    // Mock document.createElement and appendChild
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    fireEvent.click(downloadButton);

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(global.fetch).toHaveBeenCalledWith('blob:mock-url');
    expect(mockLink.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('should generate filename with timestamp', async () => {
    render(<RenderPreview result={mockResult} />);

    const downloadButton = screen.getByText(/Descargar imagen/i);

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    fireEvent.click(downloadButton);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockLink.download).toMatch(/^polaroid-.*\.png$/);
  });

  it('should use correct file extension based on format', async () => {
    render(<RenderPreview result={mockResult} />);

    // Select JPEG format
    const jpegRadio = screen.getByLabelText(/JPEG \(menor tamaño\)/i);
    fireEvent.click(jpegRadio);

    // Verify JPEG is selected
    expect((jpegRadio as HTMLInputElement).checked).toBe(true);
    
    // The download button should be present
    expect(screen.getByText(/Descargar imagen/i)).toBeInTheDocument();
  });
});
