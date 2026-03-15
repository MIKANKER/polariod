import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { templateService } from '../services/template.service';
import { Template } from '../types/template.types';

/**
 * Custom hook for template management
 * Uses React Query for caching, loading states, and optimistic updates
 */
export const useTemplates = () => {
  const queryClient = useQueryClient();

  // Query: Fetch all templates
  const {
    data: templates = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Template[], Error>({
    queryKey: ['templates'],
    queryFn: templateService.list,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
  });

  // Mutation: Upload template
  const uploadMutation = useMutation<
    Template,
    Error,
    {
      file: File;
      metadata?: { filename?: string; photoRectNorm?: { x: number; y: number; w: number; h: number } };
      onProgress?: (progress: number) => void;
    }
  >({
    mutationFn: async ({ file, metadata, onProgress }) => {
      return templateService.upload(file, metadata, (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      });
    },
    onSuccess: (newTemplate) => {
      // Optimistically update the cache with the new template
      queryClient.setQueryData<Template[]>(['templates'], (old = []) => {
        return [newTemplate, ...old];
      });
    },
    onError: (error) => {
      console.error('Template upload failed:', error);
    },
  });

  // Mutation: Delete template
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: templateService.delete,
    onMutate: async (templateId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['templates'] });

      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData<Template[]>(['templates']);

      // Optimistically remove the template from the cache
      queryClient.setQueryData<Template[]>(['templates'], (old = []) => {
        return old.filter((template) => template.id !== templateId);
      });

      // Return context with the snapshot
      return { previousTemplates };
    },
    onError: (error, _templateId, context) => {
      // Rollback to the previous value on error
      if (context && typeof context === 'object' && 'previousTemplates' in context && context.previousTemplates) {
        queryClient.setQueryData(['templates'], context.previousTemplates);
      }
      console.error('Template deletion failed:', error);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  return {
    // Data
    templates,
    
    // Loading states
    isLoading,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Error states
    error,
    uploadError: uploadMutation.error,
    deleteError: deleteMutation.error,
    
    // Actions
    refetch,
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutate,
    deleteTemplateAsync: deleteMutation.mutateAsync,
    
    // Reset mutations
    resetUpload: uploadMutation.reset,
    resetDelete: deleteMutation.reset,
  };
};
