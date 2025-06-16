'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import { Plus, Search, Filter, Grid, List, Upload, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Skeleton } from '@/src/components/ui/skeleton'
import { EmptyState } from '@/src/components/ui/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { useMedia, useMediaStats, MediaFilters } from '@/src/hooks/useMedia'

// Remove export of metadata for client component
// export const metadata: Metadata = {
//   title: 'Media Library - OFAuto Dashboard',
//   description: 'Manage your media files and content library',
// }

export default function MediaLibraryPage() {
  const [filters, setFilters] = useState<MediaFilters>({
    sortBy: 'date',
    sortOrder: 'desc',
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState('all')

  // Fetch media data
  const { data: mediaItems, isLoading, error } = useMedia(filters)
  const { data: stats } = useMediaStats()

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }

  // Handle filter by type
  const handleFilterType = (type: string | undefined) => {
    setFilters(prev => ({ ...prev, type }))
    setActiveTab(type || 'all')
  }

  // Loading state component
  const LoadingSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <CardContent className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2 mb-2" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            Manage and organize your content files
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search media files..."
            className="pl-9"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleFilterType(undefined)}>
                All types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterType('image')}>
                Images
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterType('video')}>
                Videos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterType('album')}>
                Albums
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterType('document')}>
                Documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none border-l"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Media Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => handleFilterType(undefined)}>
            All Media
          </TabsTrigger>
          <TabsTrigger value="image" onClick={() => handleFilterType('image')}>
            Images
          </TabsTrigger>
          <TabsTrigger value="video" onClick={() => handleFilterType('video')}>
            Videos
          </TabsTrigger>
          <TabsTrigger value="album" onClick={() => handleFilterType('album')}>
            Albums
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Stats Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalFiles?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth || 0}% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.storageUsed || '0 GB'}</div>
                  <p className="text-xs text-muted-foreground">
                    of {stats.storageTotal || '100 GB'} total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.imageCount?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.imagePercentage || 0}% of all files
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.videoCount?.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.videoPercentage || 0}% of all files
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p>Failed to load media files. Please try again.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && <LoadingSkeleton />}

          {/* Empty State */}
          {!isLoading && !error && (!mediaItems || mediaItems.length === 0) && (
            <EmptyState
              icon={<Upload className="h-12 w-12" />}
              title="No media files found"
              description={
                filters.search
                  ? `No files match "${filters.search}"`
                  : 'Upload your first media file to get started'
              }
              action={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              }
            />
          )}

          {/* Media Grid/List */}
          {!isLoading && mediaItems && mediaItems.length > 0 && (
            <div className={viewMode === 'grid' 
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-2"
            }>
              {mediaItems.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  {viewMode === 'grid' ? (
                    <>
                      <CardHeader className="relative h-48 bg-muted p-0 overflow-hidden">
                        {/* Media preview */}
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            {item.type === 'image' && (
                              <div className="text-4xl">🖼️</div>
                            )}
                            {item.type === 'video' && (
                              <div className="text-4xl">🎥</div>
                            )}
                            {item.type === 'album' && (
                              <div className="text-4xl">📁</div>
                            )}
                            {item.type === 'document' && (
                              <div className="text-4xl">📄</div>
                            )}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-4">
                        <h3 className="font-semibold truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.sizeFormatted} • {new Date(item.uploadedAt).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="h-16 w-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        {item.type === 'image' && <div className="text-2xl">🖼️</div>}
                        {item.type === 'video' && <div className="text-2xl">🎥</div>}
                        {item.type === 'album' && <div className="text-2xl">📁</div>}
                        {item.type === 'document' && <div className="text-2xl">📄</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.sizeFormatted} • {new Date(item.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}