'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Image as ImageIcon, 
  Calendar, 
  Clock, 
  Upload, 
  FileImage, 
  FileVideo, 
  DollarSign, 
  Lock, 
  LockOpen,
  Globe
} from 'lucide-react';

type Platform = 'onlyfans' | 'fansly' | 'instagram' | 'twitter';

interface PostFormData {
  caption: string;
  price?: string;
  isPPV: boolean;
  schedule: {
    date: string;
    time: string;
  };
  mediaItems: MediaItem[];
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  source: 'local' | 'drive';
  name: string;
  thumbnail?: string;
  size?: string;
}

export function PostScheduler() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('onlyfans');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDriveSelector, setShowDriveSelector] = useState(false);
  
  const [formData, setFormData] = useState<PostFormData>({
    caption: '',
    isPPV: false,
    price: '',
    schedule: {
      date: new Date().toISOString().split('T')[0],
      time: '20:00',
    },
    mediaItems: [],
  });
  
  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      caption: e.target.value,
    });
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      price: e.target.value,
    });
  };
  
  const handlePPVToggle = (checked: boolean) => {
    setFormData({
      ...formData,
      isPPV: checked,
    });
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        date: e.target.value,
      },
    });
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        time: e.target.value,
      },
    });
  };
  
  const handleSubmit = () => {
    setIsLoading(true);
    // Simulating API call
    setTimeout(() => {
      setIsLoading(false);
      // Reset form or provide feedback
    }, 2000);
  };
  
  const addMediaItem = (item: MediaItem) => {
    setFormData({
      ...formData,
      mediaItems: [...formData.mediaItems, item],
    });
  };
  
  const removeMediaItem = (id: string) => {
    setFormData({
      ...formData,
      mediaItems: formData.mediaItems.filter(item => item.id !== id),
    });
  };
  
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    
    // Simulating upload delay
    setTimeout(() => {
      const file = e.target.files![0];
      const type = file.type.includes('image') ? 'image' : 'video';
      
      // Create blob URL for preview
      const url = URL.createObjectURL(file);
      
      // In production, this would upload to server and get back a real URL
      addMediaItem({
        id: Date.now().toString(),
        type,
        url,
        source: 'local',
        name: file.name,
        size: formatFileSize(file.size),
        thumbnail: type === 'image' ? url : undefined,
      });
      
      setIsUploading(false);
      
      // Reset file input
      e.target.value = '';
    }, 1500);
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  const selectGoogleDriveFiles = () => {
    setShowDriveSelector(true);
    // In real implementation, this would open a Google Drive picker
  };
  
  // Sample Google Drive files for UI demo
  const sampleDriveFiles = [
    {
      id: 'drive-1',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1526315691150-b5b70287b533',
      source: 'drive' as const,
      name: 'Beach Photo 1.jpg',
      thumbnail: 'https://images.unsplash.com/photo-1526315691150-b5b70287b533?w=200',
      size: '2.4 MB',
    },
    {
      id: 'drive-2',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1560759226-14da22a643ef',
      source: 'drive' as const,
      name: 'Sunset Photo.jpg',
      thumbnail: 'https://images.unsplash.com/photo-1560759226-14da22a643ef?w=200',
      size: '3.1 MB',
    },
    {
      id: 'drive-3',
      type: 'video' as const,
      url: 'https://example.com/video1.mp4',
      source: 'drive' as const,
      name: 'Workout Video.mp4',
      size: '45.8 MB',
    },
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create & Schedule Post</CardTitle>
          <CardDescription>
            Compose your content, select media, and schedule posts for your platforms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="onlyfans" 
            value={selectedPlatform}
            onValueChange={(value) => setSelectedPlatform(value as Platform)}
            className="space-y-6"
          >
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="onlyfans">
                <span className="flex items-center">
                  <Badge className="bg-blue-100 text-blue-800 mr-2">OF</Badge>
                  OnlyFans
                </span>
              </TabsTrigger>
              <TabsTrigger value="fansly">
                <span className="flex items-center">
                  <Badge className="bg-purple-100 text-purple-800 mr-2">F</Badge>
                  Fansly
                </span>
              </TabsTrigger>
              <TabsTrigger value="instagram">
                <span className="flex items-center">
                  <Badge className="bg-pink-100 text-pink-800 mr-2">IG</Badge>
                  Instagram
                </span>
              </TabsTrigger>
              <TabsTrigger value="twitter">
                <span className="flex items-center">
                  <Badge className="bg-sky-100 text-sky-800 mr-2">X</Badge>
                  Twitter
                </span>
              </TabsTrigger>
            </TabsList>
            
            {['onlyfans', 'fansly', 'instagram', 'twitter'].map((platform) => (
              <TabsContent key={platform} value={platform} className="space-y-4">
                {/* Media Upload Section */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Media</h3>
                  <div className="border-2 border-dashed rounded-lg p-4">
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Skeleton className="h-10 w-10 rounded-full mb-2" />
                        <p className="text-sm text-muted-foreground">Uploading media...</p>
                      </div>
                    ) : formData.mediaItems.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                          {formData.mediaItems.map((item) => (
                            <div key={item.id} className="relative group">
                              <div className="aspect-square rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                {item.type === 'image' ? (
                                  <img 
                                    src={item.thumbnail || item.url} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white">
                                    <FileVideo className="h-8 w-8 mb-2" />
                                    <span className="text-xs text-center px-2">{item.name}</span>
                                  </div>
                                )}
                              </div>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeMediaItem(item.id)}
                              >
                                Remove
                              </Button>
                              <div className="mt-1 text-xs text-muted-foreground flex justify-between">
                                <span className="truncate max-w-[80%]">{item.name}</span>
                                <span>{item.size}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <label>
                              <input 
                                type="file" 
                                className="sr-only"
                                accept="image/*,video/*"
                                onChange={handleLocalFileUpload}
                              />
                              <Upload className="h-4 w-4 mr-1" />
                              Add More
                            </label>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={selectGoogleDriveFiles}
                          >
                            <FileImage className="h-4 w-4 mr-1" />
                            Select from Drive
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="bg-gray-100 rounded-full p-3 mb-4">
                          <ImageIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">Add Photos or Videos</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                          Drag and drop files here or click to upload from your device or Google Drive
                        </p>
                        <div className="flex gap-2">
                          <Button variant="default" asChild>
                            <label>
                              <input 
                                type="file" 
                                className="sr-only"
                                accept="image/*,video/*"
                                onChange={handleLocalFileUpload}
                              />
                              <Upload className="h-4 w-4 mr-1" />
                              Upload Files
                            </label>
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={selectGoogleDriveFiles}
                          >
                            <FileImage className="h-4 w-4 mr-1" />
                            Choose from Drive
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Caption Input */}
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    placeholder={`Write your ${platform} caption here...`}
                    rows={4}
                    value={formData.caption}
                    onChange={handleCaptionChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.caption.length}/2200 characters
                  </p>
                </div>
                
                {/* Platform Specific Options */}
                {(platform === 'onlyfans' || platform === 'fansly') && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="ppv-toggle">Pay-per-view content</Label>
                        <p className="text-xs text-muted-foreground">
                          Charge users to view this content
                        </p>
                      </div>
                      <Switch
                        id="ppv-toggle"
                        checked={formData.isPPV}
                        onCheckedChange={handlePPVToggle}
                      />
                    </div>
                    
                    {formData.isPPV && (
                      <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="price"
                            type="number"
                            placeholder="9.99"
                            className="pl-9"
                            value={formData.price}
                            onChange={handlePriceChange}
                            min="1"
                            step="0.99"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Privacy settings - shown for all platforms */}
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1">
                    <h4 className="font-medium">Post Visibility</h4>
                    <p className="text-xs text-muted-foreground">
                      {platform === 'onlyfans' || platform === 'fansly' 
                        ? 'Subscribers only content' 
                        : 'Public or private post'}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-1"
                  >
                    {formData.isPPV ? (
                      <>
                        <Lock className="h-3 w-3" /> 
                        Paid Content
                      </>
                    ) : platform === 'onlyfans' || platform === 'fansly' ? (
                      <>
                        <LockOpen className="h-3 w-3" /> 
                        Subscribers Only
                      </>
                    ) : (
                      <>
                        <Globe className="h-3 w-3" /> 
                        Public
                      </>
                    )}
                  </Badge>
                </div>
                
                {/* Schedule Section */}
                <div className="pt-2">
                  <h3 className="text-sm font-medium mb-2">Schedule</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="date"
                          type="date"
                          className="pl-9"
                          value={formData.schedule.date}
                          onChange={handleDateChange}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="time"
                          type="time"
                          className="pl-9"
                          value={formData.schedule.time}
                          onChange={handleTimeChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Save as Draft</Button>
          <Button onClick={handleSubmit} disabled={isLoading || formData.mediaItems.length === 0}>
            {isLoading ? 'Scheduling...' : 'Schedule Post'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Google Drive Selector Modal - Would be a proper Dialog component in production */}
      {showDriveSelector && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Select Media from Google Drive</CardTitle>
            <CardDescription>
              Choose files from your connected Google Drive account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {sampleDriveFiles.map((file) => (
                <div key={file.id} className="border rounded-md p-2 cursor-pointer hover:bg-gray-50">
                  <div className="aspect-square rounded-md overflow-hidden bg-gray-100 flex items-center justify-center mb-2">
                    {file.type === 'image' ? (
                      <img 
                        src={file.thumbnail} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white">
                        <FileVideo className="h-8 w-8 mb-2" />
                        <span className="text-xs text-center px-2">{file.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span className="truncate max-w-[80%]">{file.name}</span>
                    <span>{file.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => setShowDriveSelector(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // In a real implementation, we would add selected files
                addMediaItem(sampleDriveFiles[0]);
                setShowDriveSelector(false);
              }}
            >
              Add Selected (1)
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 