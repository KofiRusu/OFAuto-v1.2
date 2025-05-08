'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileImage, 
  FileVideo, 
  FileText, 
  Folder, 
  Search, 
  Filter, 
  Upload, 
  MoreVertical, 
  Download, 
  Trash, 
  Share, 
  Copy, 
  CheckCircle, 
  RefreshCw,
  Grid2X2,
  List,
  Plus,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

// Mock data for content items
const MOCK_CONTENT = [
  {
    id: '1',
    name: 'Beach photoshoot.jpg',
    type: 'image',
    size: '2.4 MB',
    date: '2023-10-15',
    thumbnail: '/mock/beach-photo.jpg',
    tags: ['summer', 'photoshoot'],
    usage: 'Used in 3 posts'
  },
  {
    id: '2',
    name: 'Workout routine.mp4',
    type: 'video',
    size: '15.7 MB',
    date: '2023-10-12',
    thumbnail: '/mock/workout-thumb.jpg',
    tags: ['fitness', 'workout'],
    usage: 'Used in 1 post'
  },
  {
    id: '3',
    name: 'Product review.jpg',
    type: 'image',
    size: '1.8 MB',
    date: '2023-10-08',
    thumbnail: '/mock/product-review.jpg',
    tags: ['review', 'sponsored'],
    usage: 'Not used yet'
  },
  {
    id: '4',
    name: 'Coffee morning.jpg',
    type: 'image',
    size: '3.2 MB',
    date: '2023-10-05',
    thumbnail: '/mock/coffee-morning.jpg',
    tags: ['lifestyle', 'morning'],
    usage: 'Used in 2 posts'
  },
  {
    id: '5',
    name: 'Cooking tutorial.mp4',
    type: 'video',
    size: '24.6 MB',
    date: '2023-10-01',
    thumbnail: '/mock/cooking-thumb.jpg',
    tags: ['cooking', 'tutorial'],
    usage: 'Used in 1 post'
  },
  {
    id: '6',
    name: 'Travel diary.jpg',
    type: 'image',
    size: '4.1 MB',
    date: '2023-09-28',
    thumbnail: '/mock/travel-diary.jpg',
    tags: ['travel', 'vacation'],
    usage: 'Not used yet'
  },
  {
    id: '7',
    name: 'Makeup tutorial.mp4',
    type: 'video',
    size: '18.3 MB',
    date: '2023-09-25',
    thumbnail: '/mock/makeup-thumb.jpg',
    tags: ['beauty', 'tutorial'],
    usage: 'Used in 4 posts'
  },
  {
    id: '8',
    name: 'New outfit.jpg',
    type: 'image',
    size: '2.7 MB',
    date: '2023-09-20',
    thumbnail: '/mock/outfit.jpg',
    tags: ['fashion', 'outfit'],
    usage: 'Used in 1 post'
  }
];

// For demo purposes, we'll use placeholder images
// In a real implementation, these would be proper URLs from your storage
const getPlaceholderImg = (type: string, id: string) => {
  const colors = ['blue', 'green', 'purple', 'red', 'orange', 'pink'];
  const colorIndex = parseInt(id) % colors.length;
  return `https://via.placeholder.com/300/${colors[colorIndex]}/ffffff?text=${type === 'video' ? 'Video' : 'Image'}`;
};

export default function ContentLibraryPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterType, setFilterType] = useState('all');
  
  // Filter content based on search term and filters
  const filteredContent = MOCK_CONTENT.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesType = 
      filterType === 'all' || 
      (filterType === 'image' && item.type === 'image') ||
      (filterType === 'video' && item.type === 'video');
      
    return matchesSearch && matchesType;
  });
  
  // Sort the filtered content
  const sortedContent = [...filteredContent].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'size-asc':
        return parseFloat(a.size) - parseFloat(b.size);
      case 'size-desc':
        return parseFloat(b.size) - parseFloat(a.size);
      default:
        return 0;
    }
  });
  
  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };
  
  // Handle bulk actions
  const handleBulkAction = (action: 'download' | 'delete' | 'share') => {
    // In a real app, you'd implement the actual actions here
    console.log(`Performing ${action} on items:`, selectedItems);
    
    // After action is complete, deselect items
    setSelectedItems([]);
  };
  
  // Upload dialog placeholder
  const handleUpload = () => {
    // In a real app, you'd open a file picker or upload dialog
    console.log('Upload clicked');
  };
  
  // Render file icon based on type
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <FileImage className="h-6 w-6 text-blue-500" />;
      case 'video':
        return <FileVideo className="h-6 w-6 text-red-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Content Library</h1>
          <p className="text-muted-foreground">
            Manage and organize your media for use in posts and campaigns
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView('grid')} className={view === 'grid' ? 'bg-accent' : ''}>
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setView('list')} className={view === 'list' ? 'bg-accent' : ''}>
            <List className="h-4 w-4" />
          </Button>
          <Button onClick={handleUpload} className="gap-2">
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search files..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="size-asc">Size (Small to Large)</SelectItem>
              <SelectItem value="size-desc">Size (Large to Small)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Bulk Actions (only visible when items are selected) */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-accent rounded-md">
          <span className="text-sm font-medium">{selectedItems.length} items selected</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('download')}>
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('share')}>
              <Share className="h-4 w-4 mr-1" /> Share
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
              <Trash className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="used">Used in Posts</TabsTrigger>
          <TabsTrigger value="unused">Unused</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {sortedContent.length > 0 ? (
            view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedContent.map((item) => (
                  <Card key={item.id} className={`overflow-hidden ${selectedItems.includes(item.id) ? 'ring-2 ring-primary' : ''}`}>
                    <div className="relative">
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        <Image 
                          src={getPlaceholderImg(item.type, item.id)} 
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-12 w-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                              <FileVideo className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <Checkbox 
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                            className="h-5 w-5 bg-white bg-opacity-70"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="truncate">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.size} • {item.date}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share className="h-4 w-4 mr-2" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" /> Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{item.usage}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {sortedContent.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center gap-3 p-2 rounded-md hover:bg-accent ${
                      selectedItems.includes(item.id) ? 'bg-accent' : ''
                    }`}
                  >
                    <Checkbox 
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                    />
                    {getFileIcon(item.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.date}</span>
                        <span>•</span>
                        <span>{item.size}</span>
                        <span>•</span>
                        <span>{item.usage}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="h-4 w-4 mr-2" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" /> Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No files found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? `No files match "${searchTerm}"`
                  : "Upload some content to get started"}
              </p>
              <Button onClick={handleUpload} className="gap-2">
                <Upload className="h-4 w-4" /> Upload Content
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="images">
          <div className="p-8 text-center text-muted-foreground">
            Filter applied: Only showing image files
          </div>
        </TabsContent>
        
        <TabsContent value="videos">
          <div className="p-8 text-center text-muted-foreground">
            Filter applied: Only showing video files
          </div>
        </TabsContent>
        
        <TabsContent value="used">
          <div className="p-8 text-center text-muted-foreground">
            Filter applied: Only showing files used in posts
          </div>
        </TabsContent>
        
        <TabsContent value="unused">
          <div className="p-8 text-center text-muted-foreground">
            Filter applied: Only showing unused files
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 