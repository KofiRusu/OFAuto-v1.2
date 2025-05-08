import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DriveFileMetadata } from '@/integrations/google/google-drive-service'; // Import type
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from 'next/image';
import { Paperclip } from 'lucide-react';

// --- Placeholder Data & Types --- 
type SelectedMedia = {
    source: 'local' | 'gdrive';
    file?: File; // For local uploads
    gdriveFile?: DriveFileMetadata; // For Drive selections
    localUrl?: string; // For previewing local files
}
// ------------------------------

export function PostComposer() {
    const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
    const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
    const [driveFiles, setDriveFiles] = useState<DriveFileMetadata[]>([]);
    const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
    const [driveNextPageToken, setDriveNextPageToken] = useState<string | undefined>(undefined);

    const platformId = 'current-platform-id'; // Get this from context or props

    // Function to fetch files from Google Drive via API
    const fetchDriveFiles = async (pageToken?: string) => {
        setIsLoadingDriveFiles(true);
        try {
            const response = await fetch(`/api/integrations/google/files?platformId=${platformId}${pageToken ? `&pageToken=${pageToken}` : ''}`);
            if (!response.ok) throw new Error('Failed to fetch Google Drive files');
            const data = await response.json();
            // Append new files if paginating, otherwise set
            setDriveFiles(prev => pageToken ? [...prev, ...data.files] : data.files);
            setDriveNextPageToken(data.nextPageToken);
        } catch (error) { console.error('Error fetching drive files:', error); }
        finally { setIsLoadingDriveFiles(false); }
    };

    // Handle opening the Drive modal and fetching initial files
    const openDriveModal = () => {
        setIsDriveModalOpen(true);
        setDriveFiles([]); // Reset files on open
        setDriveNextPageToken(undefined);
        fetchDriveFiles(); // Fetch first page
    };

    // Handle selecting a file from the Drive modal
    const handleSelectDriveFile = (file: DriveFileMetadata) => {
        // Check if already selected
        if (!selectedMedia.some(m => m.source === 'gdrive' && m.gdriveFile?.id === file.id)) {
             setSelectedMedia(prev => [...prev, { source: 'gdrive', gdriveFile: file }]);
        }
        setIsDriveModalOpen(false); // Close modal after selection
    };

    // TODO: Implement handleLocalFileUpload

    return (
        <div>
            {/* Other composer elements: text area, platform tabs, etc. */}
            <textarea placeholder="Compose your post..."></textarea>
            
             {/* Display selected media previews */}
             <div className="my-2 flex flex-wrap gap-2">
                {selectedMedia.map((media, index) => (
                    <div key={index} className="relative h-20 w-20 border rounded overflow-hidden">
                        {media.source === 'gdrive' && media.gdriveFile?.thumbnailLink && (
                            <Image src={media.gdriveFile.thumbnailLink} alt={media.gdriveFile.name} layout="fill" objectFit="cover" />
                        )}
                         {media.source === 'local' && media.localUrl && (
                             <Image src={media.localUrl} alt={media.file?.name || 'local file'} layout="fill" objectFit="cover" />
                         )}
                         {/* Add remove button overlay */} 
                    </div>
                ))}
             </div>

            {/* Attachment Buttons */}
            <div className="flex space-x-2">
                {/* Existing Local Upload Button */}
                <Button variant="outline" size="sm">
                    <Paperclip className="mr-2 h-4 w-4" /> Attach Local File
                </Button>

                {/* Google Drive Button & Modal */}
                <Dialog open={isDriveModalOpen} onOpenChange={setIsDriveModalOpen}>\n                    <DialogTrigger asChild>\n                        <Button variant="outline" size="sm" onClick={openDriveModal}>\n                           <Paperclip className="mr-2 h-4 w-4" /> Attach from Google Drive\n                        </Button>\n                    </DialogTrigger>\n                    <DialogContent className="sm:max-w-[600px]">\n                        <DialogHeader>\n                            <DialogTitle>Select from Google Drive</DialogTitle>\n                        </DialogHeader>\n                        <ScrollArea className="h-[400px] border rounded-md p-2">\n                            {isLoadingDriveFiles && driveFiles.length === 0 ? (\n                                <p>Loading files...</p>\n                            ) : driveFiles.length === 0 ? (\n                                <p>No compatible media files found in the configured folder.</p>\n                            ) : (\n                                <div className="grid grid-cols-3 gap-2">\n                                    {driveFiles.map(file => (\n                                        <button \n                                            key={file.id}\n                                            onClick={() => handleSelectDriveFile(file)}\n                                            className="relative aspect-square border rounded overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:opacity-80"\n                                        >\n                                            {file.thumbnailLink ? (\n                                                <Image src={file.thumbnailLink} alt={file.name} layout="fill" objectFit="cover" />\n                                            ) : (\n                                                <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground p-1 text-center">{file.name}</span>\n                                            )}\n                                        </button>\n                                    ))}\n                                </div>\n                            )}
                            {driveNextPageToken && !isLoadingDriveFiles && (\n                                <div className="mt-4 flex justify-center">\n                                    <Button variant="outline" onClick={() => fetchDriveFiles(driveNextPageToken)}>Load More</Button>\n                                </div>\n                            )}
                        </ScrollArea>\n                        <DialogFooter>\n                            {/* Optional: Add a close button */}\n                            <Button variant=\"ghost\" onClick={() => setIsDriveModalOpen(false)}>Cancel</Button>\n                        </DialogFooter>\n                    </DialogContent>\n                </Dialog>\n            </div>

            {/* Submit/Schedule Button */}
            <Button className="mt-4">Schedule/Post</Button>
        </div>
    );
} 