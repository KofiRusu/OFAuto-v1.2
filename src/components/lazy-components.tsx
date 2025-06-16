import dynamic from 'next/dynamic'
import { ComponentType, lazy } from 'react'

// Lazy load heavy components for better performance
export const LazyMediaLibrary = dynamic(
  () => import('@/src/app/dashboard/media/page'),
  {
    loading: () => <div className="flex items-center justify-center h-64">Loading media library...</div>,
    ssr: false,
  }
)

export const LazyDataTable = dynamic(
  () => import('@/src/components/ui/data-table').then(mod => ({ default: mod.DataTable })),
  {
    loading: () => <div className="animate-pulse h-96 bg-muted rounded-md" />,
    ssr: false,
  }
)

export const LazyChartCard = dynamic(
  () => import('@/src/components/dashboard/chart-card'),
  {
    loading: () => <div className="animate-pulse h-64 bg-muted rounded-md" />,
    ssr: false,
  }
)

export const LazyKanbanBoard = dynamic(
  () => import('@/src/components/ui/KanbanBoard').then(mod => ({ default: mod.KanbanBoard })),
  {
    loading: () => <div className="animate-pulse h-96 bg-muted rounded-md" />,
    ssr: false,
  }
)

export const LazyNotificationCenter = dynamic(
  () => import('@/src/components/ui/NotificationCenter').then(mod => ({ default: mod.NotificationCenter })),
  {
    loading: () => <div className="animate-pulse h-64 bg-muted rounded-md" />,
    ssr: false,
  }
)

// Lazy load route components
export const LazyDashboardPage = dynamic(
  () => import('@/src/app/dashboard/page'),
  {
    loading: () => <div className="flex items-center justify-center h-screen">Loading dashboard...</div>,
  }
)

export const LazyCampaignsPage = dynamic(
  () => import('@/src/app/dashboard/campaigns/page'),
  {
    loading: () => <div className="flex items-center justify-center h-screen">Loading campaigns...</div>,
  }
)

export const LazyInsightsPage = dynamic(
  () => import('@/src/app/dashboard/insights/page'),
  {
    loading: () => <div className="flex items-center justify-center h-screen">Loading insights...</div>,
  }
)

// Lazy load modals and dialogs
export const LazyUploadModal = dynamic(
  () => import('@/src/components/media/upload-modal'),
  {
    loading: () => null,
    ssr: false,
  }
)

export const LazyCampaignModal = dynamic(
  () => import('@/src/components/campaigns/campaign-modal'),
  {
    loading: () => null,
    ssr: false,
  }
)

// Utility function to preload components
export const preloadComponent = (component: ComponentType<any>) => {
  if ('preload' in component && typeof component.preload === 'function') {
    component.preload()
  }
}

// Intersection Observer for lazy loading images
export const lazyLoadImage = (imageElement: HTMLImageElement) => {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const src = img.dataset.src
        if (src) {
          img.src = src
          img.classList.remove('lazy')
          observer.unobserve(img)
        }
      }
    })
  })
  
  imageObserver.observe(imageElement)
}