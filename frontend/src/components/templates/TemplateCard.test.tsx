import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateCard } from './TemplateCard';
import { Template } from '../../types/template.types';

const mockTemplate: Template = {
  id: 'template-123',
  filename: 'test-template.png',
  url: 'https://example.com/templates/test.png',
  width: 1000,
  height: 1200,
  photoRectNorm: { x: 0.1, y: 0.2, w: 0.8, h: 0.6 },
  createdAt: '2024-01-15T10:30:00Z',
};

describe('TemplateCard', () => {
  it('should render template thumbnail, name, and date', () => {
    const onDelete = vi.fn();
    render(<TemplateCard template={mockTemplate} onDelete={onDelete} />);

    // Check thumbnail
    const img = screen.getByAltText('Plantilla test-template.png');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockTemplate.url);

    // Check filename
    expect(screen.getByText('test-template.png')).toBeInTheDocument();

    // Check date (formatted)
    expect(screen.getByText(/ene/i)).toBeInTheDocument(); // Spanish month abbreviation
  });

  it('should show delete button on hover', () => {
    const onDelete = vi.fn();
    render(<TemplateCard template={mockTemplate} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText(/eliminar plantilla/i);
    expect(deleteButton).toBeInTheDocument();
  });

  it('should show confirmation dialog when delete is clicked', () => {
    const onDelete = vi.fn();
    render(<TemplateCard template={mockTemplate} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText(/eliminar plantilla/i);
    fireEvent.click(deleteButton);

    expect(screen.getByText('¿Eliminar plantilla?')).toBeInTheDocument();
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();
  });

  it('should call onDelete when confirmed', () => {
    const onDelete = vi.fn();
    render(<TemplateCard template={mockTemplate} onDelete={onDelete} />);

    // Click delete button
    const deleteButton = screen.getByLabelText(/eliminar plantilla/i);
    fireEvent.click(deleteButton);

    // Confirm deletion using aria-label for better targeting
    const confirmButton = screen.getByRole('button', { name: /Confirmar eliminación de test-template\.png/i });
    fireEvent.click(confirmButton);

    expect(onDelete).toHaveBeenCalledWith('template-123');
  });

  it('should close confirmation dialog when cancelled', () => {
    const onDelete = vi.fn();
    render(<TemplateCard template={mockTemplate} onDelete={onDelete} />);

    // Click delete button
    const deleteButton = screen.getByLabelText(/eliminar plantilla/i);
    fireEvent.click(deleteButton);

    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    // Dialog should be closed
    expect(screen.queryByText('¿Eliminar plantilla?')).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('should format date correctly', () => {
    const onDelete = vi.fn();
    const template = {
      ...mockTemplate,
      createdAt: '2024-12-25T15:30:00Z',
    };
    render(<TemplateCard template={template} onDelete={onDelete} />);

    // Check for December date
    expect(screen.getByText(/dic/i)).toBeInTheDocument();
  });
});
