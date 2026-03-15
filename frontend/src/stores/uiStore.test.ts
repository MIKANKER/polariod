import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('UI Store', () => {
  beforeEach(() => {
    // Reset store state
    useUIStore.setState({
      isMobileMenuOpen: false,
      activeModal: null,
      toasts: [],
    });
  });

  it('should initialize with default state', () => {
    const state = useUIStore.getState();
    expect(state.isMobileMenuOpen).toBe(false);
    expect(state.activeModal).toBeNull();
    expect(state.toasts).toEqual([]);
  });

  it('should toggle mobile menu', () => {
    const { toggleMobileMenu } = useUIStore.getState();
    
    // Initially closed
    expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
    
    // Toggle open
    toggleMobileMenu();
    expect(useUIStore.getState().isMobileMenuOpen).toBe(true);
    
    // Toggle closed
    toggleMobileMenu();
    expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
  });

  it('should open and close modals', () => {
    const { openModal, closeModal } = useUIStore.getState();
    
    // Open modal
    openModal('upload-template');
    expect(useUIStore.getState().activeModal).toBe('upload-template');
    
    // Close modal
    closeModal();
    expect(useUIStore.getState().activeModal).toBeNull();
  });

  it('should show toast', () => {
    const { showToast } = useUIStore.getState();
    
    const toast = {
      type: 'success' as const,
      message: 'Test message',
    };
    
    // Show toast
    showToast(toast);
    const toasts = useUIStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject(toast);
    expect(toasts[0].id).toBeDefined();
  });

  it('should hide specific toast by id', () => {
    const { showToast, hideToast } = useUIStore.getState();
    
    // Show multiple toasts
    showToast({ type: 'success', message: 'First' });
    showToast({ type: 'error', message: 'Second' });
    showToast({ type: 'info', message: 'Third' });
    
    const toasts = useUIStore.getState().toasts;
    expect(toasts).toHaveLength(3);
    
    // Hide second toast
    const secondToastId = toasts[1].id;
    hideToast(secondToastId);
    
    const remainingToasts = useUIStore.getState().toasts;
    expect(remainingToasts).toHaveLength(2);
    expect(remainingToasts.find(t => t.id === secondToastId)).toBeUndefined();
  });

  it('should stack multiple toasts', () => {
    const { showToast } = useUIStore.getState();
    
    showToast({ type: 'success', message: 'First' });
    showToast({ type: 'error', message: 'Second' });
    showToast({ type: 'info', message: 'Third' });
    
    const toasts = useUIStore.getState().toasts;
    expect(toasts).toHaveLength(3);
    expect(toasts[0].message).toBe('First');
    expect(toasts[1].message).toBe('Second');
    expect(toasts[2].message).toBe('Third');
  });

  it('should generate unique ids for toasts', () => {
    const { showToast } = useUIStore.getState();
    
    showToast({ type: 'success', message: 'Test' });
    showToast({ type: 'success', message: 'Test' });
    
    const toasts = useUIStore.getState().toasts;
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });
});
