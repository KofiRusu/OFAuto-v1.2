'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Upload, X, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '@/lib/trpc/client';

interface ChunkedUploaderProps {
  onUploadComplete?: (mediaId: string) => void;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
}

interface UploadState {
  file: File | null;
  mediaId: string | null;
  uploadedChunks: number;
  totalChunks: number;
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  error: string | null;
}

export function ChunkedUploader({
  onUploadComplete,
  maxFileSize = 104857600, // 100MB default
  acceptedFileTypes = ['image/*', 'video/*'],
}: ChunkedUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    mediaId: null,
    uploadedChunks: 0,
    totalChunks: 0,
    progress: 0,
    status: 'idle',
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const CHUNK_SIZE = 1048576; // 1MB chunks

  const startUpload = api.media.startUpload.useMutation();
  const uploadChunk = api.media.uploadChunk.useMutation();
  const finishUpload = api.media.finishUpload.useMutation();
  const { data: mediaStatus, refetch: refetchStatus } = api.media.getMediaStatus.useQuery(
    { mediaId: uploadState.mediaId! },
    { 
      enabled: !!uploadState.mediaId && uploadState.status === 'processing',
      refetchInterval: 2000,
    }
  );

  const resetUpload = useCallback(() => {
    setUploadState({
      file: null,
      mediaId: null,
      uploadedChunks: 0,
      totalChunks: 0,
      progress: 0,
      status: 'idle',
      error: null,
    });
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (file.size > maxFileSize) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: `File size exceeds maximum of ${(maxFileSize / 1048576).toFixed(0)}MB`,
      }));
      return;
    }

    setUploadState({
      file,
      mediaId: null,
      uploadedChunks: 0,
      totalChunks: Math.ceil(file.size / CHUNK_SIZE),
      progress: 0,
      status: 'uploading',
      error: null,
    });

    try {
      // Start upload
      const { mediaId } = await startUpload.mutateAsync({
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      setUploadState(prev => ({ ...prev, mediaId }));

      // Upload chunks
      abortControllerRef.current = new AbortController();
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        // Convert chunk to base64
        const reader = new FileReader();
        const chunkData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(chunk);
        });

        const base64Data = chunkData.split(',')[1];

        const result = await uploadChunk.mutateAsync({
          mediaId,
          chunkIndex,
          chunkData: base64Data,
        });

        setUploadState(prev => ({
          ...prev,
          uploadedChunks: chunkIndex + 1,
          progress: result.progress.percentage,
        }));
      }

      // Finish upload and start processing
      await finishUpload.mutateAsync({ mediaId });

      setUploadState(prev => ({
        ...prev,
        status: 'processing',
      }));

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  }, [maxFileSize, startUpload, uploadChunk, finishUpload]);

  // Check if processing is complete
  React.useEffect(() => {
    if (mediaStatus?.status === 'READY') {
      setUploadState(prev => ({ ...prev, status: 'completed' }));
      if (onUploadComplete && uploadState.mediaId) {
        onUploadComplete(uploadState.mediaId);
      }
    } else if (mediaStatus?.status === 'FAILED') {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: 'Media processing failed',
      }));
    }
  }, [mediaStatus, onUploadComplete, uploadState.mediaId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileSelect(acceptedFiles[0]);
    }
  }, [handleFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: 1,
    disabled: uploadState.status === 'uploading' || uploadState.status === 'processing',
  });

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    resetUpload();
  };

  return (
    <div className="space-y-4">
      {uploadState.status === 'idle' && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? 'Drop the file here...'
              : 'Drag & drop a file here, or click to select'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Maximum file size: {(maxFileSize / 1048576).toFixed(0)}MB
          </p>
        </div>
      )}

      {uploadState.file && uploadState.status !== 'idle' && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">{uploadState.file.name}</p>
              <p className="text-sm text-gray-500">
                {(uploadState.file.size / 1048576).toFixed(2)}MB
              </p>
            </div>
            {uploadState.status === 'uploading' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelUpload}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {uploadState.status === 'completed' && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {uploadState.status === 'error' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetUpload}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {uploadState.status === 'uploading' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadState.progress}%</span>
              </div>
              <Progress value={uploadState.progress} />
              <p className="text-xs text-gray-500">
                Chunk {uploadState.uploadedChunks} of {uploadState.totalChunks}
              </p>
            </div>
          )}

          {uploadState.status === 'processing' && (
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing media...</span>
            </div>
          )}

          {uploadState.status === 'completed' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Upload completed successfully!
              </AlertDescription>
            </Alert>
          )}

          {uploadState.status === 'error' && uploadState.error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {uploadState.error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
} 