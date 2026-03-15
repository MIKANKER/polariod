import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TemplateGallery } from './TemplateGallery';
import { templateService } from '../../services/template.service';
import { Template } from '../../types/template.types';

// Mock the template service
vi.mock('../../services/template.service', () => ({
  templateService: {
    list: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockTemplate1: Template = {
  id: 'template-1',
  filename: 'template-1.png',
  url: 'https://example.com/templates/1.png',
  width: 1000,
  height: 1200,
  photoRectNorm: { x: 0.1, y: 0.2, w: 0.8, h: 0.6 },
  createdAt: '2024-01-15T10:30:00Z',
};

const mockTemplate2: Template = {
  id: 'template-2',
  filename: 'template-2.png',
  url: 'https://example.com/templates/2.png',
  width: 1000,
  height: 1200,
  photoRectNorm: { x: 0.1, y: 0.2, w: 0.8, h: 0.6 },
  createdAt: '2024-01-20T14:00:00Z',
};

describe('TemplateGallery', () => {
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

  it('should show loading state', () => {
    vi.mocked(templateService.list).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<TemplateGallery />, { wrapper });

    expect(screen.getByText('Cargando plantillas...')).toBeInTheDocument();
  });

  it('should display templates in grid', async () => {
    vi.mocked(templateService.list).mockResolvedValue([mockTemplate1, mockTemplate2]);

    render(<TemplateGallery />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('template-1.png')).toBeInTheDocument();
      expect(screen.getByText('template-2.png')).toBeInTheDocument();
    });

    const grid = screen.getByTestId('template-grid');
    expect(grid).toBeInTheDocument();
  });

  it('should sort templates by creation date descending', async () => {
    vi.mocked(templateService.list).mockResolvedValue([mockTemplate1, mockTemplate2]);

    render(<TemplateGallery />, { wrapper });

    await waitFor(() => {
      const templates = screen.getAllByRole('img');
      expect(templates).toHaveLength(2);
    });

    // template-2 should appear first (newer date)
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('alt', 'Plantilla template-2.png');
    expect(images[1]).toHaveAttribute('alt', 'Plantilla template-1.png');
  });

  it('should show empty state when no templates exist', async () => {
    vi.mocked(templateService.list).mockResolvedValue([]);

    render(<TemplateGallery />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('No hay plantillas')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Aún no has subido ninguna plantilla/i)
    ).toBeInTheDocument();
  });

  it('should show error state with retry button', async () => {
    const error = new Error('Network error');
    vi.mocked(templateService.list).mockRejectedValue(error);

    render(<TemplateGallery />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Error al cargar plantillas')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('should call onTemplateSelect when template is clicked', async () => {
    vi.mocked(templateService.list).mockResolvedValue([mockTemplate1]);
    const onTemplateSelect = vi.fn();

    render(<TemplateGallery onTemplateSelect={onTemplateSelect} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('template-1.png')).toBeInTheDocument();
    });

    const templateCard = screen.getByText('template-1.png').closest('div');
    if (templateCard?.parentElement) {
      fireEvent.click(templateCard.parentElement);
      expect(onTemplateSelect).toHaveBeenCalledWith('template-1');
    }
  });

  it('should be responsive with correct grid classes', async () => {
    vi.mocked(templateService.list).mockResolvedValue([mockTemplate1]);

    render(<TemplateGallery />, { wrapper });

    await waitFor(() => {
      const grid = screen.getByTestId('template-grid');
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('md:grid-cols-3');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });
  });
});
