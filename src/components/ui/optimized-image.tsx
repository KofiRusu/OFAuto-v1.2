'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/src/lib/utils'

interface OptimizedImageProps extends React.ComponentPropsWithoutRef<typeof Image> {
  fallback?: string
  aspectRatio?: number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  showSkeleton?: boolean
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallback = '/images/placeholder.png',
  aspectRatio,
  objectFit = 'cover',
  showSkeleton = true,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)
  const [imageSrc, setImageSrc] = React.useState(src)

  React.useEffect(() => {
    setImageSrc(src)
    setHasError(false)
  }, [src])

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false)
    if (onLoad) {
      onLoad(event)
    }
  }

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true)
    setIsLoading(false)
    if (fallback && imageSrc !== fallback) {
      setImageSrc(fallback)
    }
    if (onError) {
      onError(event)
    }
  }

  const imageClasses = cn(
    'transition-opacity duration-300',
    isLoading ? 'opacity-0' : 'opacity-100',
    className
  )

  const containerStyle = aspectRatio
    ? { aspectRatio, position: 'relative' as const, width: '100%' }
    : undefined

  return (
    <div style={containerStyle} className={cn('relative overflow-hidden', aspectRatio && 'w-full')}>
      {showSkeleton && isLoading && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      
      <Image
        src={imageSrc}
        alt={alt}
        className={imageClasses}
        onLoad={handleLoad}
        onError={handleError}
        style={{ objectFit }}
        {...props}
      />
      
      {hasError && imageSrc === fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <svg
              className="mx-auto h-12 w-12 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Image not available</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Utility to generate blur data URL
export async function getBlurDataURL(imageSrc: string): Promise<string> {
  try {
    const response = await fetch(
      `/_next/image?url=${encodeURIComponent(imageSrc)}&w=16&q=1`
    )
    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const base64 = btoa(Array.from(bytes).map(b => String.fromCharCode(b)).join(''))
    return `data:image/jpeg;base64,${base64}`
  } catch {
    return ''
  }
}

// Hook for progressive image loading
export function useProgressiveImage(src: string) {
  const [sourceLoaded, setSourceLoaded] = React.useState<string | null>(null)

  React.useEffect(() => {
    const img = new window.Image()
    img.src = src
    img.onload = () => setSourceLoaded(src)
  }, [src])

  return sourceLoaded
}