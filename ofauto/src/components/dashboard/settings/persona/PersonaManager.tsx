'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, AlertCircle, RefreshCcw, Trash2, Info, HelpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api-client";

// --- Types --- 

interface Persona {
  id: string;
  name: string;
  isPredefined?: boolean;
  description?: string;
  toneKeywords: string[];
  examples: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default personas to offer if user has none
const defaultPersonas: Omit<Persona, 'id' | 'isDefault' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Flirty & Playful', isPredefined: true, toneKeywords: ['flirty', 'playful', 'teasing', 'suggestive', 'witty'], examples: ['Hey there 😉 what are you up to?', 'You always know how to make me smile...', 'Feeling a little mischievous today... want to join? 😈'] },
  { name: 'Chill & Friendly', isPredefined: true, toneKeywords: ['chill', 'friendly', 'casual', 'relaxed', 'approachable'], examples: ['Hey! How's your day going?', 'Just relaxing, hbu?', 'Hope you have a great weekend!'] },
  { name: 'Dominant & Assertive', isPredefined: true, toneKeywords: ['dominant', 'assertive', 'confident', 'commanding', 'in control'], examples: ['You know what I want.', 'Tell me what you're thinking. Now.', 'Follow my lead.'] },
  { name: 'Sweet & Caring', isPredefined: true, toneKeywords: ['sweet', 'caring', 'gentle', 'supportive', 'kind'], examples: ['Aw, thank you! That's so sweet of you.', 'Hope you're having a lovely day ❤️', 'Thinking of you!'] },
];

// --- Components --- 

interface PersonaEditorProps {
  persona: Partial<Persona> | null;
  onSave: (persona: Partial<Persona>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function PersonaEditor({ persona, onSave, onCancel, isLoading }: PersonaEditorProps) {
  const [name, setName] = useState(persona?.name || '');
  const [description, setDescription] = useState(persona?.description || '');
  const [keywords, setKeywords] = useState((persona?.toneKeywords || []).join(', '));
  const [examples, setExamples] = useState((persona?.examples || []).join('\n'));
  const isPredefined = persona?.isPredefined || false;
  const isDefault = persona?.isDefault || false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saveData: Partial<Persona> = {
      ...(persona?.id && { id: persona.id }),
      name,
      description,
      toneKeywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      examples: examples.split('\n').map(ex => ex.trim()).filter(Boolean),
      isDefault: isDefault,
    };
    onSave(saveData);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{persona?.id ? 'Edit Persona' : 'Create New Persona'}</CardTitle>
        <CardDescription>
          {isPredefined ? 'Predefined personas cannot be fully edited.' : 'Define the tone and style for your AI chatbot.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="persona-name">Persona Name</Label>
            <Input 
              id="persona-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sassy Bestie, Professional Assistant"
              required
              disabled={isPredefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="persona-description">Description (optional)</Label>
            <Input 
              id="persona-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's unique about this persona?"
              disabled={isPredefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="persona-keywords">Tone Keywords (comma-separated)</Label>
            <Input 
              id="persona-keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., playful, witty, teasing, emojis"
              disabled={isPredefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="persona-examples">Example Messages (one per line)</Label>
            <Textarea
              id="persona-examples"
              value={examples}
              onChange={(e) => setExamples(e.target.value)}
              placeholder="Hey there 😉\nWhat's up? 🔥\nCan't wait to chat more!"
              rows={5}
              disabled={isPredefined}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isPredefined}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPredefined ? 'Cannot Save Predefined' : 'Save Persona'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}


interface PersonaCardProps {
  persona: Persona;
  onEdit: (persona: Persona) => void;
  onDelete: (personaId: string) => void;
  onSetActive: (personaId: string) => void;
  isDeleting: boolean;
  isActivating: boolean;
}

function PersonaCard({ persona, onEdit, onDelete, onSetActive, isDeleting, isActivating }: PersonaCardProps) {
  return (
    <Card className={cn(persona.isDefault && "border-primary ring-2 ring-primary")}>
        <CardHeader>
            <div className="flex justify-between items-start">
                <CardTitle>{persona.name}</CardTitle>
                {persona.isDefault ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">Active</span>
                ) : (
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onSetActive(persona.id)}
                        disabled={isActivating}
                    >
                        {isActivating ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Set Active'}
                    </Button>
                )}
            </div>
            {persona.isPredefined && <CardDescription>Predefined Persona</CardDescription>}
            {persona.description && <CardDescription>{persona.description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
                <p className="font-medium text-foreground mb-1">Tone Keywords:</p>
                <div className="flex flex-wrap gap-1">
                    {persona.toneKeywords.map(k => <span key={k} className="text-xs bg-muted px-1.5 py-0.5 rounded">{k}</span>)}
                </div>
            </div>
            <div>
                <p className="font-medium text-foreground mb-1">Example Message:</p>
                <p className="italic">"{persona.examples[0] || 'No examples provided.'}"</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs">Created: {new Date(persona.createdAt).toLocaleDateString()}</span>
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            {!persona.isPredefined && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive/80"
                    onClick={() => onDelete(persona.id)}
                    disabled={isDeleting || persona.isDefault} // Can't delete active persona
                    title={persona.isDefault ? "Cannot delete active persona" : "Delete"}
                >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
                </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onEdit(persona)}>
                {persona.isPredefined ? 'View' : 'Edit'}
            </Button>
        </CardFooter>
    </Card>
  );
}

// --- Main Component --- 

export default function PersonaManager() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPersona, setEditingPersona] = useState<Partial<Persona> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPersonas() {
      setIsLoading(true);
      try {
        const response = await apiClient.personas.list();
        
        if (response.success && response.data) {
          setPersonas(response.data);
        } else {
          // If no personas are found and we got an empty array, we might want to offer defaults
          if (response.data && response.data.length === 0) {
            // User might need default personas
            toast.info("No personas found. You can create a new one or use our predefined options.");
          } else {
            throw new Error(response.error || "Failed to load personas");
          }
        }
      } catch (error) {
        toast.error("Failed to load personas. Please try again later.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPersonas();
  }, []);

  const handleSave = async (personaData: Partial<Persona>) => {
    setIsSaving(true);
    try {
      let response;
      
      if (personaData.id) {
        // Update existing persona
        response = await apiClient.personas.update(personaData.id, personaData);
      } else {
        // Create new persona
        response = await apiClient.personas.create(personaData);
      }
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      const savedPersona = response.data;
      
      setPersonas(prev => {
        const index = prev.findIndex(p => p.id === savedPersona.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = savedPersona;
          return updated;
        } else {
          return [...prev, savedPersona];
        }
      });
      
      setEditingPersona(null);
      toast.success(`"${savedPersona.name}" has been saved successfully.`);
    } catch (error: any) {
      toast.error(error.message || "Could not save the persona.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (personaId: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) return;
    
    setDeletingId(personaId);
    try {
      const response = await apiClient.personas.delete(personaId);
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      setPersonas(prev => prev.filter(p => p.id !== personaId));
      toast.success("Persona deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Could not delete the persona.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetActive = async (personaId: string) => {
    setActivatingId(personaId);
    try {
      // Find the persona to get its details
      const personaToActivate = personas.find(p => p.id === personaId);
      if (!personaToActivate) throw new Error("Persona not found");
      
      // Update it to make it the default
      const response = await apiClient.personas.update(personaId, {
        ...personaToActivate,
        isDefault: true
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      // Update local state to reflect the new active persona
      setPersonas(prev => 
        prev.map(p => ({ ...p, isDefault: p.id === personaId }))
      );
      
      toast.success(`"${personaToActivate.name}" is now your active persona.`);
    } catch (error: any) {
      toast.error(error.message || "Could not activate the persona.");
    } finally {
      setActivatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
         <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                    <CardFooter><Skeleton className="h-8 w-20 ml-auto" /></CardFooter>
                </Card>
            ))}
         </div>
      </div>
    );
  }

  if (editingPersona) {
    return (
      <PersonaEditor 
        persona={editingPersona} 
        onSave={handleSave} 
        onCancel={() => setEditingPersona(null)}
        isLoading={isSaving}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
            <div>
                <h2 className="text-xl font-semibold">Manage AI Personas</h2>
                <p className="text-muted-foreground text-sm">Define how your AI assistant communicates.</p>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                <HelpCircle size={18} />
                <span className="sr-only">Help with Personas</span>
            </Button>
        </div>
        <Button onClick={() => setEditingPersona({})}>
          Create New Persona
        </Button>
      </div>

       <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <Info size={20} className="text-blue-600"/>
                <div>
                    <CardTitle className="text-blue-800 text-base">How Personas Work</CardTitle>
                    <CardDescription className="text-blue-700 text-xs">
                        Select an active persona to guide the AI's tone in automated messages. You can create custom personas or use predefined ones. Only one persona can be active at a time.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.length > 0 ? (
          personas.map(p => (
            <PersonaCard 
              key={p.id} 
              persona={p} 
              onEdit={setEditingPersona} 
              onDelete={handleDelete}
              onSetActive={handleSetActive}
              isDeleting={deletingId === p.id}
              isActivating={activatingId === p.id}
            />
          ))
        ) : (
          // Offer predefined personas if no custom ones exist
          defaultPersonas.map((p, i) => (
            <PersonaCard 
              key={`default-${i}`} 
              persona={{
                ...p, 
                id: `default-${i}`,
                isDefault: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }} 
              onEdit={() => {
                // When user clicks a predefined persona, create a copy they can customize
                setEditingPersona({
                  ...p,
                  name: `My ${p.name}`,
                  isPredefined: false
                });
              }} 
              onDelete={() => {}} // No-op for predefined
              onSetActive={() => {
                // Create this predefined persona for the user when they activate it
                handleSave({
                  ...p,
                  name: p.name,
                  isPredefined: false,
                  isDefault: true
                });
              }}
              isDeleting={false}
              isActivating={false}
            />
          ))
        )}
      </div>
    </div>
  );
} 