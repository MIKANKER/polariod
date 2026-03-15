import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RenderControls } from './RenderControls';
import { RenderOptions } from '../../types/render.types';

const defaultOptions: RenderOptions = {
  fit: 'cover',
  offsetX: 0,
  offsetY: 0,
};

describe('RenderControls', () => {
  it('should render all control elements', () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();

    render(
      <RenderControls values={defaultOptions} onChange={mockOnChange} onReset={mockOnReset} />
    );

    expect(screen.getByText(/Ajustes de renderizado/i)).toBeInTheDocument();
    expect(screen.getByText(/Modo de ajuste/i)).toBeInTheDocument();
    expect(screen.getByText(/Desplazamiento horizontal/i)).toBeInTheDocument();
    expect(screen.getByText(/Desplazamiento vertical/i)).toBeInTheDocument();
    expect(screen.getByText(/Restablecer/i)).toBeInTheDocument();
  });

  it('should display current fit mode', () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();

    render(
      <RenderControls values={defaultOptions} onChange={mockOnChange} onReset={mockOnReset} />
    );

    const coverRadio = screen.getByLabelText(/Cover \(cubrir\)/i) as HTMLInputElement;
    const containRadio = screen.getByLabelText(/Contain \(contener\)/i) as HTMLInputElement;

    expect(coverRadio.checked).toBe(true);
    expect(containRadio.checked).toBe(false);
  });

  it('should call onChange when fit mode changes', () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();

    render(
      <RenderControls values={defaultOptions} onChange={mockOnChange} onReset={mockOnReset} />
    );

    const containRadio = screen.getByLabelText(/Contain \(contener\)/i);
    fireEvent.click(containRadio);

    expect(mockOnChange).toHaveBeenCalledWith({ fit: 'contain' });
  });

  it('should display current offsetX value', () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();
    const options = { ...defaultOptions, offsetX: 0.5 };

    render(<RenderControls values={options} onChange={mockOnChange} onReset={mockOnReset} />);

    expect(screen.getByText('0.50')).toBeInTheDocument();
  });

  it('should display current offsetY value', () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();
    const options = { ...defaultOptions, offsetY: -0.3 };

    render(<RenderControls values={options} onChange={mockOnChange} onReset={mockOnReset} />);

    expect(screen.getByText('-0.30')).toBeInTheDocument();
  });

  it('should call onChange when offsetX slider changes', () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();

    render(
      <RenderControls values={defaultOptions} onChange={mockOnChange} onReset={mockOnReset} />
    );

    const sliders = screen.getAllByRole('slider');
    const offsetXSlider = sliders[0]; // First slider is offsetX

    fireEvent.change(offsetXSlider, { target: { value: '0.75' } });

    expect(mockOnChange).toHaveBeenCalledWith({ offsetX: 0.75 });
  });

  it('should call onChange when offsetY slider changes', () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();

    render(
      <RenderControls values={defaultOptions} onChange={mockOnChange} onReset={mockOnReset} />
    );

    const sliders = screen.getAllByRole('slider');
    const offsetYSlider = sliders[1]; // Second slider is offsetY

    fireEvent.change(offsetYSlider, { target: { value: '-0.5' } });

    expect(mockOnChange).toHaveBeenCalledWith({ offsetY: -0.5 });
  });

  it('should call onReset when reset button is clicked', () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();

    render(
      <RenderControls values={defaultOptions} onChange={mockOnChange} onReset={mockOnReset} />
    );

    const resetButton = screen.getByText(/Restablecer/i);
    fireEvent.click(resetButton);

    expect(mockOnReset).toHaveBeenCalled();
  });

  it('should have sliders with correct range', () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();

    render(
      <RenderControls values={defaultOptions} onChange={mockOnChange} onReset={mockOnReset} />
    );

    const sliders = screen.getAllByRole('slider') as HTMLInputElement[];

    sliders.forEach((slider) => {
      expect(slider.min).toBe('-1');
      expect(slider.max).toBe('1');
      expect(slider.step).toBe('0.01');
    });
  });

  it('should display tooltips for each control', () => {
    const mockOnChange = vi.fn();
    const mockOnReset = vi.fn();

    render(
      <RenderControls values={defaultOptions} onChange={mockOnChange} onReset={mockOnReset} />
    );

    // Check for tooltip indicators (ⓘ)
    const tooltips = screen.getAllByText('ⓘ');
    expect(tooltips.length).toBeGreaterThan(0);
  });
});
