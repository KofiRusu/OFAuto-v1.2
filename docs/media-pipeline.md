# Media Pipeline Refactor Documentation

## Overview

The media pipeline has been refactored to support:
- Chunked uploads for large files
- Asynchronous processing with job queues
- Progress tracking and resumable uploads
- Optimized media transformations
- Support for images, videos, and audio files

## Architecture

### Components

1. **Database Schema**
   - `MediaAsset`: Main media record with processing status and metadata
   - `MediaChunk`: Temporary storage for upload chunks

2. **Service Layer**
   - `MediaProcessingService`: Core logic for chunk handling and processing
   - Methods: `uploadChunk`, `assembleChunks`, `enqueueProcessing`, `processMediaTask`

3. **Job Queue (BullMQ)**
   - Redis-backed queue for asynchronous processing
   - Worker processes for media transformation tasks
   - Automatic retry on failure

4. **tRPC Router**
   - `startUpload`: Initialize upload session
   - `uploadChunk`: Upload individual chunks
   - `finishUpload`: Assemble chunks and start processing
   - `getMediaStatus`: Check processing progress
   - `reprocessMedia`: Retry failed processing (managers only)

5. **Frontend Components**
   - `ChunkedUploader`: React component with drag-and-drop
   - Progress tracking with cancel support
   - Automatic status polling

## Usage

### Upload Flow

1. **Start Upload**
```typescript
const { mediaId, chunkSize } = await trpc.media.startUpload.mutate({
  filename: 'video.mp4',
  fileSize: file.size,
  mimeType: file.type
});
```

2. **Upload Chunks**
```typescript
for (let i = 0; i < totalChunks; i++) {
  const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
  await trpc.media.uploadChunk.mutate({
    mediaId,
    chunkIndex: i,
    chunkData: base64Chunk
  });
}
```

3. **Finish Upload**
```typescript
await trpc.media.finishUpload.mutate({ mediaId });
```

4. **Check Status**
```typescript
const status = await trpc.media.getMediaStatus.query({ mediaId });
```

### Configuration

Environment variables:
- `UPLOAD_DIR`: Directory for file storage (default: `./uploads`)
- `CHUNK_SIZE`: Size of each chunk in bytes (default: 1MB)
- `MAX_FILE_SIZE`: Maximum allowed file size (default: 100MB)
- `MEDIA_WORKER_CONCURRENCY`: Number of concurrent processing workers
- `REDIS_URL`: Redis connection string for job queue

### Processing Pipeline

1. **Image Processing**
   - Resize large images (max 2048px width)
   - Generate thumbnails (200x200)
   - Extract metadata (dimensions, format)
   - Optimize with progressive JPEG

2. **Video Processing** (placeholder)
   - Extract metadata
   - Generate thumbnails
   - Transcode if needed

3. **Audio Processing** (placeholder)
   - Extract metadata
   - Generate waveforms

## Running the Worker

Start the media processing worker:
```bash
npm run worker:media
```

Or add to package.json:
```json
{
  "scripts": {
    "worker:media": "tsx src/workers/mediaProcessor.ts"
  }
}
```

## Testing

### Unit Tests
```bash
npm test src/lib/services/__tests__/mediaProcessingService.test.ts
```

### API Tests
```bash
npm test tests/api/media-chunked.test.ts
```

### E2E Tests
```bash
npm run test:e2e tests/e2e/media-upload.spec.ts
```

## Security Considerations

1. **File Type Validation**: Validate MIME types on both client and server
2. **Size Limits**: Enforce maximum file sizes
3. **User Isolation**: Users can only access their own media
4. **Manager Permissions**: Managers can view/reprocess any media
5. **Chunk Validation**: Verify chunk integrity and order

## Performance Optimizations

1. **Chunked Uploads**: Allows uploading large files without timeout
2. **Resumable Uploads**: Can resume from last successful chunk
3. **Parallel Processing**: Multiple workers process media concurrently
4. **Lazy Loading**: Media library uses cursor-based pagination
5. **CDN Ready**: Processed files can be served via CDN

## Monitoring

The system logs:
- Upload progress and completion
- Processing start/completion times
- Worker errors and retries
- Queue metrics (pending, completed, failed)

## Future Enhancements

1. **Video Processing**
   - FFmpeg integration for transcoding
   - Adaptive bitrate streaming
   - Thumbnail generation at intervals

2. **Advanced Features**
   - AI-based content moderation
   - Smart cropping for social media
   - Batch processing operations
   - WebP/AVIF format support

3. **Storage Backends**
   - S3/CloudFront integration
   - Multi-region replication
   - Cold storage for archives 