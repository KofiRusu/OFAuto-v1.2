import { Metadata } from 'next'
import { Plus, Search, Filter, Grid, List, Upload } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'

export const metadata: Metadata = {
  title: 'Media Library - OFAuto Dashboard',
  description: 'Manage your media files and content library',
}

// Mock data for demonstration
const mediaItems = [
  { id: 1, name: 'Profile Image 1', type: 'image', size: '2.4 MB', date: '2024-01-15', tags: ['profile', 'verified'] },
  { id: 2, name: 'Welcome Video', type: 'video', size: '45.2 MB', date: '2024-01-14', tags: ['intro', 'pinned'] },
  { id: 3, name: 'Photo Set - Beach', type: 'album', size: '12.8 MB', date: '2024-01-13', tags: ['premium'] },
  { id: 4, name: 'BTS Content', type: 'video', size: '28.5 MB', date: '2024-01-12', tags: ['exclusive'] },
  { id: 5, name: 'Promotional Banner', type: 'image', size: '1.2 MB', date: '2024-01-11', tags: ['promo'] },
  { id: 6, name: 'Tutorial Series', type: 'album', size: '156.3 MB', date: '2024-01-10', tags: ['educational'] },
]

export default function MediaLibraryPage() {
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
              <DropdownMenuItem>Images</DropdownMenuItem>
              <DropdownMenuItem>Videos</DropdownMenuItem>
              <DropdownMenuItem>Albums</DropdownMenuItem>
              <DropdownMenuItem>Documents</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex rounded-md border">
            <Button variant="ghost" size="sm" className="rounded-none">
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-none border-l">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Media Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Media</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45.2 GB</div>
                <p className="text-xs text-muted-foreground">
                  of 100 GB total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">892</div>
                <p className="text-xs text-muted-foreground">
                  72% of all files
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">342</div>
                <p className="text-xs text-muted-foreground">
                  28% of all files
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Media Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mediaItems.map((item) => (
              <Card key={item.id} className="cursor-pointer transition-shadow hover:shadow-lg">
                <CardHeader className="relative h-48 bg-muted">
                  {/* Placeholder for media preview */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {item.type === 'image' && (
                      <div className="text-4xl">🖼️</div>
                    )}
                    {item.type === 'video' && (
                      <div className="text-4xl">🎥</div>
                    )}
                    {item.type === 'album' && (
                      <div className="text-4xl">📁</div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.size} • {item.date}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="images">
          <p className="text-muted-foreground">Image files will be displayed here</p>
        </TabsContent>

        <TabsContent value="videos">
          <p className="text-muted-foreground">Video files will be displayed here</p>
        </TabsContent>

        <TabsContent value="albums">
          <p className="text-muted-foreground">Album collections will be displayed here</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}