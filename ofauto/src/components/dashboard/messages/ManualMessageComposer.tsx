'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip, Send, Loader2, Bot } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// --- Mock Data & API ---
interface PersonaStub {
  id: string;
  name: string;
}

// Should reuse the fetchUserPersonas logic or a shared hook eventually
async function fetchActivePersonas(): Promise<PersonaStub[]> {
  console.log("Fetching active personas...");
  await new Promise(resolve => setTimeout(resolve, 600));
  return [
    { id: 'custom-123', name: 'My Custom Vibe' },
    { id: 'default-0', name: 'Flirty & Playful' },
    { id: 'default-1', name: 'Chill & Friendly' },
    // Add other active/available personas
  ];
}

export interface MessageToSend {
    text: string;
    personaId: string | null;
    // media?: File; // Stub for future implementation
}

interface ManualMessageComposerProps {
  onSendMessage: (message: MessageToSend) => Promise<boolean>; // Returns true on success
  disabled?: boolean;
}

export default function ManualMessageComposer({ onSendMessage, disabled }: ManualMessageComposerProps) {
  const [messageText, setMessageText] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [personas, setPersonas] = useState<PersonaStub[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPersonas, setIsFetchingPersonas] = useState(true);

  useEffect(() => {
    async function loadPersonas() {
      setIsFetchingPersonas(true);
      try {
        const fetchedPersonas = await fetchActivePersonas();
        setPersonas(fetchedPersonas);
        // Optionally default to the first active persona
        if (fetchedPersonas.length > 0) {
            // setSelectedPersonaId(fetchedPersonas[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch personas for composer");
        // Non-critical, don't show toast, just disable selector
      } finally {
        setIsFetchingPersonas(false);
      }
    }
    loadPersonas();
  }, []);

  const handleSend = async () => {
    if (!messageText.trim()) return;
    setIsLoading(true);
    const messageData: MessageToSend = {
        text: messageText,
        personaId: selectedPersonaId,
    };
    const success = await onSendMessage(messageData);
    if (success) {
      setMessageText(''); // Clear input on success
      // Persona selection could be reset or maintained based on desired UX
    }
    setIsLoading(false);
  };

  return (
    <div className="border-t p-4 space-y-3 bg-background">
      <Textarea
        placeholder="Type your manual message here..."
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        rows={3}
        className="resize-none"
        disabled={disabled || isLoading}
      />
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" disabled={disabled || isLoading}>
            <Paperclip size={18} />
            <span className="sr-only">Attach Media (Coming Soon)</span>
          </Button>
          <Select 
            value={selectedPersonaId || 'manual'} 
            onValueChange={(value) => setSelectedPersonaId(value === 'manual' ? null : value)}
            disabled={disabled || isLoading || isFetchingPersonas || personas.length === 0}
          >
            <SelectTrigger className="w-[180px] text-xs h-8">
                 <div className="flex items-center gap-1">
                    <Bot size={14} className="text-muted-foreground"/>
                    <SelectValue placeholder="Send as myself" />
                 </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Send as myself</SelectItem>
              {isFetchingPersonas ? (
                  <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>
                  </div>
              ) : (
                 personas.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                 ))
              )}
            </SelectContent>
          </Select>
           {isFetchingPersonas && personas.length === 0 && <span className="text-xs text-muted-foreground">Loading personas...</span>}
           {!isFetchingPersonas && personas.length === 0 && <span className="text-xs text-muted-foreground">No personas available</span>}
        </div>
        <Button 
            onClick={handleSend} 
            disabled={disabled || isLoading || !messageText.trim()}
            size="sm"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send size={16} className="mr-2" />
          )}
          Send Message
        </Button>
      </div>
    </div>
  );
} 