"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

export default function DriveFilesListPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  
  // Query to get Drive status
  const { data: driveStatus, isLoading: isStatusLoading } = trpc.drive.getDriveStatus.useQuery();
  
  // Query to list files
  const { 
    data: files, 
    isLoading: isFilesLoading,
    refetch: refetchFiles
  } = trpc.drive.listDriveFiles.useQuery({ 
    folderId: currentFolderId 
  }, {
    enabled: driveStatus?.connected === true,
  });
  
  // Mutation to upload files
  const uploadFileMutation = trpc.drive.uploadToDrive.useMutation({
    onSuccess: () => {
      toast({
        title: "File uploaded successfully",
        description: "Your file has been uploaded to Google Drive.",
      });
      refetchFiles();
      setIsUploading(false);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });
  
  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      
      // Convert file to base64
      const base64 = await fileToBase64(selectedFile);
      
      // Upload file
      uploadFileMutation.mutate({
        name: selectedFile.name,
        content: base64,
        mimeType: selectedFile.type,
        folderId: currentFolderId,
      });
    } catch (error) {
      toast({
        title: "File processing failed",
        description: "Could not process the selected file.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };
  
  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };
  
  // Handle folder navigation
  const navigateToFolder = (folderId: string) => {
    setCurrentFolderId(folderId);
    refetchFiles();
  };
  
  // Go back to parent folder
  const goBack = () => {
    setCurrentFolderId(undefined);
    refetchFiles();
  };
  
  // Handle connect Drive if not connected
  const handleConnectDrive = () => {
    router.push('/dashboard/media/drive/connect');
  };
  
  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Icons.folder className="h-4 w-4" />;
    } else if (mimeType.startsWith('image/')) {
      return <Icons.image className="h-4 w-4" />;
    } else if (mimeType.startsWith('video/')) {
      return <Icons.video className="h-4 w-4" />;
    } else if (mimeType.startsWith('audio/')) {
      return <Icons.music className="h-4 w-4" />;
    } else if (mimeType === 'application/pdf') {
      return <Icons.fileText className="h-4 w-4" />;
    } else {
      return <Icons.file className="h-4 w-4" />;
    }
  };
  
  // Format file size
  const formatFileSize = (sizeInBytes?: number) => {
    if (!sizeInBytes) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = sizeInBytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };
  
  // Render content based on connection status
  if (isStatusLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!driveStatus?.connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Google Drive Not Connected</CardTitle>
            <CardDescription>
              Connect your Google Drive account to browse and manage your files.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Icons.googleDrive className="h-16 w-16 text-blue-500" />
            <Button onClick={handleConnectDrive}>Connect Google Drive</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Google Drive Files</h1>
          {isFilesLoading && <Icons.spinner className="h-4 w-4 animate-spin" />}
        </div>
        
        <div className="flex items-center gap-2">
          {currentFolderId && (
            <Button variant="outline" onClick={goBack} size="sm">
              <Icons.arrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <>
                <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Icons.upload className="h-4 w-4 mr-2" />
                Upload File
              </>
            )}
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isFilesLoading ? (
            <div className="flex justify-center p-8">
              <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
          ) : !files || files.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Icons.inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No files found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {currentFolderId ? 'This folder is empty.' : 'Your Google Drive is empty.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.mimeType)}
                        {file.mimeType === 'application/vnd.google-apps.folder' ? (
                          <button
                            className="hover:underline text-left"
                            onClick={() => navigateToFolder(file.id)}
                          >
                            {file.name}
                          </button>
                        ) : (
                          <span>{file.name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(file.modifiedTime, { addSuffix: true })}
                    </TableCell>
                    <TableCell>{file.mimeType.split('/').pop()}</TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Icons.moreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {file.webViewLink && (
                            <DropdownMenuItem asChild>
                              <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                                <Icons.externalLink className="h-4 w-4 mr-2" />
                                Open in Drive
                              </a>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 