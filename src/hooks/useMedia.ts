import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/src/components/ui/use-toast'

export interface MediaItem {
  id: string
  name: string
  type: 'image' | 'video' | 'album' | 'document'
  size: number
  sizeFormatted: string
  url: string
  thumbnailUrl?: string
  tags: string[]
  uploadedAt: string
  lastModified: string
  metadata?: {
    width?: number
    height?: number
    duration?: number
    format?: string
  }
}

export interface MediaFilters {
  type?: string
  search?: string
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
  sortBy?: 'name' | 'date' | 'size'
  sortOrder?: 'asc' | 'desc'
}

export interface MediaUploadData {
  file: File
  tags?: string[]
  metadata?: Record<string, any>
}

// Fetch media items
async function fetchMedia(filters: MediaFilters): Promise<MediaItem[]> {
  const params = new URLSearchParams()
  
  if (filters.type) params.append('type', filters.type)
  if (filters.search) params.append('search', filters.search)
  if (filters.tags?.length) params.append('tags', filters.tags.join(','))
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString())
  if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString())
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

  const response = await fetch(`/api/media?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch media')
  }
  
  return response.json()
}

// Upload media file
async function uploadMedia(data: MediaUploadData): Promise<MediaItem> {
  const formData = new FormData()
  formData.append('file', data.file)
  
  if (data.tags?.length) {
    formData.append('tags', JSON.stringify(data.tags))
  }
  
  if (data.metadata) {
    formData.append('metadata', JSON.stringify(data.metadata))
  }

  const response = await fetch('/api/media/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to upload media')
  }

  return response.json()
}

// Delete media item
async function deleteMedia(id: string): Promise<void> {
  const response = await fetch(`/api/media/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete media')
  }
}

// Update media item
async function updateMedia(id: string, data: Partial<MediaItem>): Promise<MediaItem> {
  const response = await fetch(`/api/media/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update media')
  }

  return response.json()
}

// Hook to fetch media
export function useMedia(filters: MediaFilters = {}) {
  return useQuery({
    queryKey: ['media', filters],
    queryFn: () => fetchMedia(filters),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Hook to upload media
export function useUploadMedia() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: uploadMedia,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      toast({
        title: 'Media uploaded',
        description: `${data.name} has been uploaded successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Hook to delete media
export function useDeleteMedia() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      toast({
        title: 'Media deleted',
        description: 'The media item has been deleted successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Hook to update media
export function useUpdateMedia() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MediaItem> }) => 
      updateMedia(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      toast({
        title: 'Media updated',
        description: `${data.name} has been updated successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Hook for media statistics
export function useMediaStats() {
  return useQuery({
    queryKey: ['media-stats'],
    queryFn: async () => {
      const response = await fetch('/api/media/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch media stats')
      }
      return response.json()
    },
    staleTime: 60 * 1000, // 1 minute
  })
}