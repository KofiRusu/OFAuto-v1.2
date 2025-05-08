'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Image, Calendar as CalendarIcon, Upload, DollarSign, CheckCircle, AlertCircle, Loader2, X, HardDrive, Video } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api-client";

export default function PostScheduler() {
  const [selectedPlatform, setSelectedPlatform] = useState('onlyfans');
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [selectedDriveFile, setSelectedDriveFile] = useState<any | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [isPpv, setIsPpv] = useState(false);
  const [ppvPrice, setPpvPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleDriveFiles, setGoogleDriveFiles] = useState<any[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [isDriveOpen, setIsDriveOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
      setSelectedDriveFile(null); // Clear drive selection if local file is chosen
    }
  };

  const handleOpenDrive = async () => {
    setIsDriveOpen(true);
    setIsDriveLoading(true);
    try {
      // Use apiClient to fetch Google Drive files
      const response = await apiClient.integrations.getDriveFiles();
      if (response.success && response.data) {
        setGoogleDriveFiles(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch files");
      }
    } catch (error: any) {
      console.error("Failed to fetch Google Drive files:", error);
      toast.error("Could not load files from Google Drive.");
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleSelectDriveFile = (file: any) => {
    setSelectedDriveFile(file);
    setMediaFile(null); // Clear local file selection
    setIsDriveOpen(false); // Close the drive selector
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const postData = {
      platform: selectedPlatform,
      caption,
      media: mediaFile ? { type: 'local', name: mediaFile.name, file: mediaFile } : 
             selectedDriveFile ? { type: 'drive', id: selectedDriveFile.id, name: selectedDriveFile.name } : null,
      scheduleTime: scheduleDate,
      isPpv: (selectedPlatform === 'onlyfans' || selectedPlatform === 'fansly') && isPpv,
      ppvPrice: (selectedPlatform === 'onlyfans' || selectedPlatform === 'fansly') && isPpv ? parseFloat(ppvPrice) : undefined,
    };

    try {
      // Use apiClient to schedule post
      const response = await apiClient.scheduler.create(postData);
      
      if (response.success && response.data) {
        toast.success(`Post scheduled successfully. Task ID: ${response.data.taskId}`);
        // Reset form
        setCaption('');
        setMediaFile(null);
        setSelectedDriveFile(null);
        setScheduleDate(undefined);
        setIsPpv(false);
        setPpvPrice('');
      } else {
        throw new Error(response.error || "Failed to schedule post");
      }
    } catch (error: any) {
      toast.error(error.message || "An unknown error occurred while scheduling your post.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create & Schedule Post</CardTitle>
        <CardDescription>Plan your content across different platforms.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Platform</Label>
            <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="onlyfans">OnlyFans</TabsTrigger>
                <TabsTrigger value="fansly">Fansly</TabsTrigger>
                <TabsTrigger value="instagram">Instagram</TabsTrigger>
                <TabsTrigger value="twitter">Twitter/X</TabsTrigger>
              </TabsList>
              {/* Content can be added per tab if needed, or just use the value */}
            </Tabs>
          </div>

          {/* Caption Input */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write your caption here... Use {username} for personalization."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              required
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label>Media (Optional)</Label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 border rounded-md p-4 text-center space-y-2 bg-muted/20">
                <Label htmlFor="media-upload" className="cursor-pointer space-y-1">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <span className="block text-sm font-medium">Upload File</span>
                  <span className="block text-xs text-muted-foreground">Drag & drop or click</span>
                </Label>
                <Input id="media-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
              </div>
              <div className="flex items-center justify-center text-muted-foreground">OR</div>
              <Popover open={isDriveOpen} onOpenChange={setIsDriveOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex-1 flex flex-col h-auto p-4 space-y-2 bg-muted/20"
                    onClick={handleOpenDrive} // Fetch files when opening
                    type="button"
                  >
                    <HardDrive className="h-8 w-8 text-muted-foreground" />
                    <span className="block text-sm font-medium">Select from Google Drive</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Select Drive File</p>
                    {isDriveLoading ? (
                      <div className="flex justify-center items-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : googleDriveFiles.length > 0 ? (
                      googleDriveFiles.map((file) => (
                        <Button
                          key={file.id}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => handleSelectDriveFile(file)}
                        >
                          {file.type === 'image' && <Image size={16} className="mr-2" />}
                          {file.type === 'video' && <Video size={16} className="mr-2" />}
                          {file.name}
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground p-4 text-center">No files found.</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {(mediaFile || selectedDriveFile) && (
              <div className="mt-2 text-sm text-muted-foreground flex items-center border rounded p-2 bg-muted/50">
                <Image size={18} className="mr-2 flex-shrink-0" />
                <span className="truncate flex-grow">
                  Selected: {mediaFile?.name || selectedDriveFile?.name}
                </span>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-auto p-1" 
                  onClick={() => { setMediaFile(null); setSelectedDriveFile(null); }}
                  type="button"
                >
                  <X size={14} />
                </Button>
              </div>
            )}
          </div>

          {/* PPV Options (OnlyFans/Fansly) */}
          {(selectedPlatform === 'onlyfans' || selectedPlatform === 'fansly') && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ppv-toggle" className="flex flex-col space-y-1">
                  <span>Pay-Per-View (PPV) Post</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Lock this post behind a paywall.
                  </span>
                </Label>
                <Switch
                  id="ppv-toggle"
                  checked={isPpv}
                  onCheckedChange={setIsPpv}
                />
              </div>
              {isPpv && (
                <div className="space-y-2">
                  <Label htmlFor="ppv-price">PPV Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ppv-price"
                      type="number"
                      placeholder="0.00"
                      value={ppvPrice}
                      onChange={(e) => setPpvPrice(e.target.value)}
                      className="pl-8"
                      required={isPpv}
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scheduling */}
          <div className="space-y-2 border-t pt-4">
            <Label>Schedule (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !scheduleDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduleDate ? format(scheduleDate, "PPP HH:mm") : <span>Schedule for later</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={scheduleDate}
                  onSelect={setScheduleDate}
                  initialFocus
                />
                 {/* Basic Time Picker - Replace with a proper one if needed */}
                 <div className="p-2 border-t">
                    <Input 
                        type="time" 
                        defaultValue={scheduleDate ? format(scheduleDate, "HH:mm") : "12:00"}
                        onChange={(e) => {
                            if (!scheduleDate) return; // Requires a date to be selected first
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const newDate = new Date(scheduleDate);
                            newDate.setHours(hours, minutes);
                            setScheduleDate(newDate);
                        }}
                    />
                 </div>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">Leave blank to post immediately (or add to queue based on priority).</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || !caption}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Scheduling...' : scheduleDate ? 'Schedule Post' : 'Add to Queue Now'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 