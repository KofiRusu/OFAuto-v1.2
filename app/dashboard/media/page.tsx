'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChunkedUploader } from '@/app/components/media/ChunkedUploader';
import { api } from '@/lib/trpc/client';
import { RefreshCw, Download, Eye, Play, Volume2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

export default function MediaPage() {
  const [selectedTab, setSelectedTab] = useState('upload');
  
  const { data: mediaAssets, refetch: refetchMedia } = api.media.getMediaAssets.useQuery({
    limit: 20,
  });

  const reprocessMedia = api.media.reprocessMedia.useMutation({
    onSuccess: () => {
      refetchMedia();
    },
  });

  const handleUploadComplete = (mediaId: string) => {
    // Refetch media list after successful upload
    refetchMedia();
    // Switch to media list tab
    setSelectedTab('library');
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'audio':
        return <Volume2 className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: { variant: 'secondary' as const, label: 'Pending' },
      PROCESSING: { variant: 'default' as const, label: 'Processing' },
      READY: { variant: 'success' as const, label: 'Ready' },
      FAILED: { variant: 'destructive' as const, label: 'Failed' },
    };

    const config = variants[status as keyof typeof variants] || variants.PENDING;
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Media Management</h1>
        <p className="text-gray-600 mt-2">Upload and manage your media files</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="library">Media Library</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Media</CardTitle>
              <CardDescription>
                Upload images, videos, or audio files. Large files will be uploaded in chunks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChunkedUploader 
                onUploadComplete={handleUploadComplete}
                maxFileSize={524288000} // 500MB
                acceptedFileTypes={['image/*', 'video/*', 'audio/*']}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Media Library</CardTitle>
                <CardDescription>
                  View and manage your uploaded media files
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetchMedia()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {mediaAssets?.items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No media files uploaded yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mediaAssets?.items.map((media) => (
                    <Card key={media.id} className="overflow-hidden">
                      <div className="aspect-video relative bg-gray-100">
                        {media.type === 'image' && media.url ? (
                          <Image
                            src={media.url}
                            alt={media.filename}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            {getMediaIcon(media.type)}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-sm truncate flex-1">
                              {media.filename}
                            </p>
                            {getStatusBadge(media.status)}
                          </div>
                          
                          {media.fileSize && (
                            <p className="text-xs text-gray-500">
                              {(media.fileSize / 1048576).toFixed(2)} MB
                            </p>
                          )}
                          
                          {media.width && media.height && (
                            <p className="text-xs text-gray-500">
                              {media.width} × {media.height}
                            </p>
                          )}
                          
                          {media.duration && (
                            <p className="text-xs text-gray-500">
                              Duration: {Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(media.createdAt), { addSuffix: true })}
                          </p>

                          <div className="flex gap-2 pt-2">
                            {media.url && media.status === 'READY' && (
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <a href={media.url} download target="_blank" rel="noopener noreferrer">
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </a>
                              </Button>
                            )}
                            
                            {media.status === 'FAILED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => reprocessMedia.mutate({ mediaId: media.id })}
                                disabled={reprocessMedia.isPending}
                              >
                                <RefreshCw className={`h-3 w-3 mr-1 ${reprocessMedia.isPending ? 'animate-spin' : ''}`} />
                                Retry
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {mediaAssets?.nextCursor && (
                <div className="text-center mt-6">
                  <Button variant="outline">
                    Load More
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 