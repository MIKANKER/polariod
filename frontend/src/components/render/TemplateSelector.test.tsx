import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateSelector } from './TemplateSelector';
import { Template } from '../../types/template.types';

const mockTemplates: Template[] = [
  {
    id: 'template-1',
    filename: 'Template 1',
    url: 'https://example.com/template1.png',
    width: 800,
    height: 1000,
    photoRectNorm: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'template-2',
    filename: 'Template 2',
    url: 'https://example.com/template2.png',
    width: 800,
    height: 1000,
    photoRectNorm: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    createdAt: '2024-01-02T00:00:00Z',
  },
];

describe('TemplateSelector', () => {
  it('should render empty state when no templates', () => {
    const mockOnSelect = vi.fn();
    render(<TemplateSelector templates={[]} selectedId={null} onSelect={mockOnSelect} />);

    expect(screen.getByText(/No hay plantillas disponibles/i)).toBeInTheDocument();
    expect(screen.getByText(/Sube una plantilla primero/i)).toBeInTheDocument();
  });

  it('should render all templates', () => {
    const mockOnSelect = vi.fn();
    render(
      <TemplateSelector templates={mockTemplates} selectedId={null} onSelect={mockOnSelect} />
    );

    // Corregido: El componente usa el prefijo "Plantilla" en español
    expect(screen.getByAltText('Plantilla Template 1')).toBeInTheDocument();
    expect(screen.getByAltText('Plantilla Template 2')).toBeInTheDocument();
  });

  it('should call onSelect when template is clicked', () => {
    const mockOnSelect = vi.fn();
    render(
      <TemplateSelector templates={mockTemplates} selectedId={null} onSelect={mockOnSelect} />
    );

    const template1Button = screen.getByLabelText(/Seleccionar plantilla Template 1/i);
    fireEvent.click(template1Button);

    expect(mockOnSelect).toHaveBeenCalledWith('template-1');
  });

  it('should highlight selected template', () => {
    const mockOnSelect = vi.fn();
    render(
      <TemplateSelector
        templates={mockTemplates}
        selectedId="template-1"
        onSelect={mockOnSelect}
      />
    );

    const template1Button = screen.getByLabelText(/Seleccionar plantilla Template 1/i);

    // Check if it has the selected styling (ring-4 ring-blue-500)
    expect(template1Button.className).toContain('ring-4');
    expect(template1Button.className).toContain('ring-blue-500');
  });

  it('should not highlight unselected templates', () => {
    const mockOnSelect = vi.fn();
    render(
      <TemplateSelector
        templates={mockTemplates}
        selectedId="template-1"
        onSelect={mockOnSelect}
      />
    );

    const template2Button = screen.getByLabelText(/Seleccionar plantilla Template 2/i);

    // Check if it has the unselected styling (ring-2 ring-gray-200)
    expect(template2Button.className).toContain('ring-2');
    expect(template2Button.className).toContain('ring-gray-200');
  });

  it('should display template thumbnails', () => {
    const mockOnSelect = vi.fn();
    render(
      <TemplateSelector templates={mockTemplates} selectedId={null} onSelect={mockOnSelect} />
    );

    // Corregido: El componente usa el prefijo "Plantilla" en español
    const img1 = screen.getByAltText('Plantilla Template 1') as HTMLImageElement;
    const img2 = screen.getByAltText('Plantilla Template 2') as HTMLImageElement;

    expect(img1.src).toBe('https://example.com/template1.png');
    expect(img2.src).toBe('https://example.com/template2.png');
  });

  it('should render in horizontal scrollable layout', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <TemplateSelector templates={mockTemplates} selectedId={null} onSelect={mockOnSelect} />
    );

    const scrollContainer = container.querySelector('.overflow-x-auto');
    expect(scrollContainer).toBeInTheDocument();
  });
});
