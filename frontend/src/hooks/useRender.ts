import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { renderService } from '../services/render.service';
import { RenderOptions, RenderResponse } from '../types/render.types';
import { DEFAULT_RENDER_OPTIONS } from '../config/constants';
import {
  loadRenderPreferences,
  saveRenderPreferences,
  loadLastSelectedTemplate,
  saveLastSelectedTemplate,
} from '../utils/localStorage';

/**
 * Render State
 */
interface RenderState {
  photo: File | null;
  template: string | null;
  options: RenderOptions;
  result: RenderResponse | null;
}

/**
 * Custom hook for managing render state and operations
 */
export const useRender = () => {
  // Load preferences from localStorage using utility function
  const loadPreferences = (): RenderOptions => {
    const stored = loadRenderPreferences();
    if (stored) {
      return {
        ...DEFAULT_RENDER_OPTIONS,
        ...stored,
      };
    }
    return DEFAULT_RENDER_OPTIONS;
  };

  // Initialize state
  const [state, setState] = useState<RenderState>({
    photo: null,
    template: loadLastSelectedTemplate(), // Load last selected template on init
    options: loadPreferences(),
    result: null,
  });

  // Persist render preferences to localStorage using utility function
  useEffect(() => {
    saveRenderPreferences(state.options);
  }, [state.options]);

  // Persist last selected template to localStorage
  useEffect(() => {
    if (state.template) {
      saveLastSelectedTemplate(state.template);
    }
  }, [state.template]);

  // Render mutation with React Query
  const renderMutation = useMutation({
    mutationFn: async () => {
      if (!state.photo || !state.template) {
        throw new Error('Photo and template are required');
      }

      return renderService.render({
        photo: state.photo,
        templateId: state.template,
        options: state.options,
      });
    },
    onSuccess: (data) => {
      setState((prev) => ({ ...prev, result: data }));
    },
  });

  // Set photo
  const setPhoto = (photo: File | null) => {
    setState((prev) => ({ ...prev, photo, result: null }));
  };

  // Set template
  const setTemplate = (templateId: string | null) => {
    setState((prev) => ({ ...prev, template: templateId, result: null }));
  };

  // Update render options
  const setOptions = (options: Partial<RenderOptions>) => {
    setState((prev) => ({
      ...prev,
      options: { ...prev.options, ...options },
      result: null, // Clear result when options change
    }));
  };

  // Reset options to defaults
  const resetOptions = () => {
    setState((prev) => ({
      ...prev,
      options: DEFAULT_RENDER_OPTIONS,
      result: null,
    }));
  };

  // Execute render
  const render = () => {
    renderMutation.mutate();
  };

  // Clear all state
  const clear = () => {
    setState({
      photo: null,
      template: null,
      options: loadPreferences(),
      result: null,
    });
  };

  return {
    // State
    photo: state.photo,
    template: state.template,
    options: state.options,
    result: state.result,

    // Actions
    setPhoto,
    setTemplate,
    setOptions,
    resetOptions,
    render,
    clear,

    // Loading and error states
    isLoading: renderMutation.isPending,
    error: renderMutation.error,
    isSuccess: renderMutation.isSuccess,

    // Computed
    canRender: !!(state.photo && state.template),
  };
};
