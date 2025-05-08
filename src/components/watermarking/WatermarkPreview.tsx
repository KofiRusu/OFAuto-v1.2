import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc/client';
import { Loader2 } from 'lucide-react';

interface WatermarkPreviewProps {
  mediaUrl: string;
  selectedWatermarkId: string | null;
  onApplyWatermark?: (mediaId: string, watermarkId: string) => Promise<void>;
  mediaId?: string;
}

export function WatermarkPreview({ 
  mediaUrl, 
  selectedWatermarkId, 
  onApplyWatermark,
  mediaId 
}: WatermarkPreviewProps) {
  const [opacity, setOpacity] = useState(0.5);
  const [position, setPosition] = useState<string>('bottomRight');
  const [isApplying, setIsApplying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Get watermark profiles
  const { data: watermarkProfiles, isLoading: loadingProfiles } = trpc.media.getWatermarkProfiles.useQuery({
    limit: 100
  });

  // Get the selected watermark profile
  const selectedProfile = watermarkProfiles?.items.find(profile => profile.id === selectedWatermarkId);

  // Apply watermark and get preview (mock implementation)
  useEffect(() => {
    // Only generate preview if we have a watermark selected
    if (!selectedWatermarkId || !mediaUrl) {
      setPreviewUrl(null);
      return;
    }

    // In a real implementation, we would call an API to get the preview
    // For now, we'll just use the original image
    setPreviewUrl(mediaUrl);

  }, [selectedWatermarkId, mediaUrl, opacity, position]);

  const handleApplyWatermark = async () => {
    if (!selectedWatermarkId || !mediaId || !onApplyWatermark) return;
    
    try {
      setIsApplying(true);
      await onApplyWatermark(mediaId, selectedWatermarkId);
    } catch (error) {
      console.error('Error applying watermark:', error);
    } finally {
      setIsApplying(false);
    }
  };

  if (!mediaUrl) {
    return <div className="text-center p-4">No media selected</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
        {previewUrl ? (
          <Image 
            src={previewUrl} 
            alt="Preview" 
            fill 
            className="object-contain" 
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="w-full h-full" />
          </div>
        )}
      </div>

      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Watermark Profile</label>
            <Select
              value={selectedWatermarkId || ''}
              onValueChange={(value) => {}}
              disabled={loadingProfiles}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select watermark profile">
                  {loadingProfiles ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading profiles...
                    </div>
                  ) : (
                    selectedProfile?.name || "Select watermark profile"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {watermarkProfiles?.items.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedWatermarkId && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Opacity: {opacity * 100}%</label>
                <Slider
                  value={[opacity * 100]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(value) => setOpacity(value[0] / 100)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Position</label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="topLeft">Top Left</SelectItem>
                    <SelectItem value="topRight">Top Right</SelectItem>
                    <SelectItem value="bottomLeft">Bottom Left</SelectItem>
                    <SelectItem value="bottomRight">Bottom Right</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 