'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  RefreshCw
} from 'lucide-react';

export default function GoogleDrivePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState('My Content');
  
  // Mock data for demonstration
  const files = [
    {
      id: 'file1',
      name: 'Beach Photoshoot.jpg',
      type: 'image/jpeg',
      size: '3.2 MB',
      modified: 'Today, 2:30 PM',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200'
    },
    {
      id: 'file2',
      name: 'Promotional Video.mp4',
      type: 'video/mp4',
      size: '24.5 MB',
      modified: 'Yesterday, 10:15 AM',
      thumbnailUrl: null
    },
    {
      id: 'file3',
      name: 'Sunset Photo.jpg',
      type: 'image/jpeg',
      size: '2.8 MB',
      modified: 'Yesterday, 9:45 AM',
      thumbnailUrl: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=200'
    },
    {
      id: 'file4',
      name: 'Content Ideas.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: '152 KB',
      modified: 'Apr 2, 2024, 11:30 AM',
      thumbnailUrl: null
    },
    {
      id: 'file5',
      name: 'Studio Session.jpg',
      type: 'image/jpeg',
      size: '4.1 MB',
      modified: 'Apr 1, 2024, 3:20 PM',
      thumbnailUrl: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=200'
    },
    {
      id: 'file6',
      name: 'Behind the Scenes.mp4',
      type: 'video/mp4',
      size: '75.3 MB',
      modified: 'Mar 29, 2024, 5:45 PM',
      thumbnailUrl: null
    },
  ];
  
  const folders = [
    { id: 'folder1', name: 'Photoshoots', itemCount: 24 },
    { id: 'folder2', name: 'Videos', itemCount: 8 },
    { id: 'folder3', name: 'Content Drafts', itemCount: 12 },
  ];
  
  const handleFileSelect = (fileId: string) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(file => file.id));
    }
  };
  
  const handleFolderClick = (folderName: string) => {
    setCurrentFolder(folderName);
    // In a real implementation, this would load the contents of the folder
  };
  
  const handleAttachToPost = () => {
    // In a real implementation, this would add the selected files to a post
    alert(`Attached ${selectedFiles.length} files to post composer`);
    setSelectedFiles([]);
  };
  
  if (!isConnected) {
    return (
      <GoogleDriveConnect onConnect={() => setIsConnected(true)} />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Google Drive Media</h1>
          <p className="text-muted-foreground">Browse and manage your content files from Google Drive.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Folders sidebar */}
        <div className="w-full md:w-64 space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-md">Folders</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="space-y-1">
                <div 
                  className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 ${currentFolder === 'My Content' ? 'bg-gray-100' : ''}`}
                  onClick={() => handleFolderClick('My Content')}
                >
                  <div className="flex items-center">
                    <Folder className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm">My Content</span>
                  </div>
                  <Badge variant="outline">All</Badge>
                </div>
                {folders.map(folder => (
                  <div 
                    key={folder.id}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 ${currentFolder === folder.name ? 'bg-gray-100' : ''}`}
                    onClick={() => handleFolderClick(folder.name)}
                  >
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm">{folder.name}</span>
                    </div>
                    <Badge variant="outline">{folder.itemCount}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" size="sm">
                <Folder className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-md">Storage</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>12.4 GB used</span>
                    <span>15 GB total</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full">
                    <div className="w-4/5 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Images: 8.2 GB</span>
                  <span>Videos: 3.9 GB</span>
                  <span>Other: 0.3 GB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Files browser */}
        <div className="flex-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="py-3 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex-1">
                  <CardTitle>{currentFolder}</CardTitle>
                  <CardDescription>{files.length} items</CardDescription>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search files..."
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-auto">
              <Tabs defaultValue="grid">
                <div className="flex justify-between items-center p-2">
                  <div className="flex items-center">
                    <Checkbox 
                      id="select-all" 
                      className="mr-2" 
                      checked={selectedFiles.length === files.length && files.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm cursor-pointer">
                      {selectedFiles.length > 0 ? `${selectedFiles.length} selected` : 'Select all'}
                    </label>
                  </div>
                  <TabsList>
                    <TabsTrigger value="grid">Grid</TabsTrigger>
                    <TabsTrigger value="list">List</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="grid" className="mt-2">
                  {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
                      {Array(6).fill(0).map((_, i) => (
                        <FileCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
                      {files.map(file => (
                        <FileCard 
                          key={file.id}
                          file={file}
                          isSelected={selectedFiles.includes(file.id)}
                          onSelect={() => handleFileSelect(file.id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="list" className="mt-2">
                  <div className="min-w-full">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Modified
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {files.map(file => (
                          <tr key={file.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center">
                                <Checkbox 
                                  checked={selectedFiles.includes(file.id)}
                                  onCheckedChange={() => handleFileSelect(file.id)}
                                  className="mr-2"
                                />
                                {file.type.startsWith('image/') ? (
                                  <FileImage className="h-5 w-5 text-blue-500 mr-2" />
                                ) : file.type.startsWith('video/') ? (
                                  <FileVideo className="h-5 w-5 text-purple-500 mr-2" />
                                ) : (
                                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                                )}
                                <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                  {file.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {file.size}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {file.modified}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                              <FileActionsMenu />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="py-3 border-t">
              <div className="flex justify-between items-center w-full">
                <div className="text-sm text-muted-foreground">
                  {selectedFiles.length} of {files.length} files selected
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={selectedFiles.length === 0}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    size="sm" 
                    disabled={selectedFiles.length === 0}
                    onClick={handleAttachToPost}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Attach to Post
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FileCardSkeleton() {
  return (
    <div className="border rounded-md overflow-hidden">
      <Skeleton className="h-32 w-full" />
      <div className="p-2 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

interface FileCardProps {
  file: {
    id: string;
    name: string;
    type: string;
    size: string;
    modified: string;
    thumbnailUrl: string | null;
  };
  isSelected: boolean;
  onSelect: () => void;
}

function FileCard({ file, isSelected, onSelect }: FileCardProps) {
  return (
    <div 
      className={`border rounded-md overflow-hidden hover:shadow-md transition-shadow ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="relative">
        <div className="absolute top-2 left-2 z-10">
          <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        </div>
        <div className="h-32 bg-gray-100 flex items-center justify-center">
          {file.type.startsWith('image/') ? (
            file.thumbnailUrl ? (
              <img 
                src={file.thumbnailUrl} 
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FileImage className="h-10 w-10 text-blue-500" />
            )
          ) : file.type.startsWith('video/') ? (
            <FileVideo className="h-10 w-10 text-purple-500" />
          ) : (
            <FileText className="h-10 w-10 text-gray-500" />
          )}
        </div>
        <div className="absolute top-2 right-2 z-10">
          <FileActionsMenu />
        </div>
      </div>
      <div className="p-2">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{file.size} • {file.modified}</p>
      </div>
    </div>
  );
}

function FileActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Download className="h-4 w-4 mr-2" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Share className="h-4 w-4 mr-2" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="h-4 w-4 mr-2" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600">
          <Trash className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GoogleDriveConnect({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connect Google Drive</h1>
        <p className="text-muted-foreground">Link your Google Drive to store and manage your content files.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect Google Drive</CardTitle>
          <CardDescription>
            Link your Google Drive to store and manage your content files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4">
              <svg width="70" height="60" viewBox="0 0 70 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M70 36.1283L55.7767 8.87866L36.205 41.8799L50.4283 60L70 36.1283Z" fill="#1C8ADB"/>
                <path d="M44.9533 8.87866L25.3816 8.75H25.2699L45.065 41.8799L70 36.1283L44.9533 8.87866Z" fill="#4CB749"/>
                <path d="M25.2699 8.75L0 36.1283L14.2233 60L39.4933 36.1283L25.2699 8.75Z" fill="#FA3913"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-1">Google Drive Integration</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Connect your Google Drive to easily manage your media files and use them in your posts across platforms.
            </p>
            <Button onClick={onConnect}>
              Connect with Google Drive
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
            <div className="text-center">
              <h3 className="text-sm font-medium mb-1">Unified Storage</h3>
              <p className="text-xs text-muted-foreground">
                Keep all your content in one place
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium mb-1">Cross-platform Posting</h3>
              <p className="text-xs text-muted-foreground">
                Use the same files across all platforms
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium mb-1">15GB Free Storage</h3>
              <p className="text-xs text-muted-foreground">
                Comes with your Google account
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 