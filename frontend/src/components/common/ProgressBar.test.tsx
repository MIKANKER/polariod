import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  it('should render progress bar', () => {
    render(<ProgressBar progress={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display percentage', () => {
    render(<ProgressBar progress={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should have correct ARIA attributes', () => {
    render(<ProgressBar progress={60} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '60');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should not display message when not provided', () => {
    const { container } = render(<ProgressBar progress={50} />);
    const messages = container.querySelectorAll('p');
    // Only percentage should be present
    expect(messages).toHaveLength(1);
    expect(messages[0].textContent).toBe('50%');
  });

  it('should display message when provided', () => {
    render(<ProgressBar progress={50} message="Uploading file..." />);
    expect(screen.getByText('Uploading file...')).toBeInTheDocument();
  });

  it('should clamp progress to 0 when negative', () => {
    render(<ProgressBar progress={-10} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('should clamp progress to 100 when over 100', () => {
    render(<ProgressBar progress={150} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('should display 0% progress', () => {
    render(<ProgressBar progress={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should display 100% progress', () => {
    render(<ProgressBar progress={100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should have animated progress bar', () => {
    const { container } = render(<ProgressBar progress={50} />);
    const progressFill = container.querySelector('.bg-blue-600');
    expect(progressFill).toHaveClass('transition-all', 'duration-300');
  });

  it('should set correct width for progress fill', () => {
    const { container } = render(<ProgressBar progress={65} />);
    const progressFill = container.querySelector('.bg-blue-600') as HTMLElement;
    expect(progressFill.style.width).toBe('65%');
  });

  it('should handle decimal progress values', () => {
    render(<ProgressBar progress={33.33} />);
    expect(screen.getByText('33.33%')).toBeInTheDocument();
  });
});
