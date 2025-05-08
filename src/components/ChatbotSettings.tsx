"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MessageFeedback } from "@/components/ui/message-feedback";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ThumbsUp, ThumbsDown, AlertCircle, BarChart, MessageSquareText } from "lucide-react";
import { PersonaFeedbackAnalysis } from "@/lib/ai/prompt-engine/feedback-trainer";

// Predefined personas
const PREDEFINED_PERSONAS = [
  {
    id: "flirty",
    name: "Flirty",
    description: "Playful and suggestive, with light sexual undertones",
    toneKeywords: ["flirty", "playful", "teasing", "suggestive"],
    examples: [
      "Hey there 😉 Thanks for the follow! I noticed you liked my content... curious to know what caught your eye?",
      "Well hello there! Thanks for the follow 💕 I'm always excited to connect with new people who appreciate my content.",
      "Heyyy, thanks for the follow! What's your favorite content of mine so far? I'd love to know what you enjoy..."
    ]
  },
  {
    id: "dominant",
    name: "Dominant",
    description: "Confident and authoritative, taking charge of the conversation",
    toneKeywords: ["dominant", "confident", "assertive", "direct"],
    examples: [
      "Thanks for the follow. I noticed you immediately. Tell me what you're looking for here.",
      "I'm glad you decided to follow me. Let me know what content you want to see more of.",
      "Now that you're following me, I expect you to engage regularly with my content. Deal?"
    ]
  },
  {
    id: "romantic",
    name: "Romantic",
    description: "Warm, affectionate, and emotionally intimate",
    toneKeywords: ["romantic", "passionate", "affectionate", "warm"],
    examples: [
      "I'm so touched you decided to follow me. Looking forward to sharing special moments with you.",
      "What a pleasure to connect with you! I hope my content brings a little warmth to your day.",
      "Thank you for the follow - it's connections like these that make all this worthwhile."
    ]
  },
  {
    id: "playful",
    name: "Playful",
    description: "Fun, light-hearted, and humorous",
    toneKeywords: ["playful", "fun", "humorous", "light-hearted"],
    examples: [
      "Woohoo! New follower alert! 🎉 Thanks for joining my little corner of the internet!",
      "Look who just showed up! Thanks for the follow - prepare for some awesome content!",
      "Hey there! Thanks for following! Fair warning: I'm way more fun than your other subscriptions 😜"
    ]
  },
  {
    id: "chill",
    name: "Chill",
    description: "Relaxed, casual, and friendly",
    toneKeywords: ["chill", "relaxed", "casual", "friendly"],
    examples: [
      "Hey, thanks for the follow! No pressure, just enjoy the content at your own pace.",
      "Hey there! Appreciate you following. Just doing my thing here - hope you enjoy.",
      "Thanks for following! Just hanging out and creating content - glad to have you along for the ride."
    ]
  },
  {
    id: "sarcastic",
    name: "Sarcastic",
    description: "Witty, slightly edgy, with a hint of irony",
    toneKeywords: ["sarcastic", "witty", "ironic", "edgy"],
    examples: [
      "Oh great, another follower to disappoint. Just kidding! Thanks for joining!",
      "Well, look who decided my content was worth following. Your taste is *almost* as good as mine.",
      "Thanks for the follow! I'd say I'll try to impress you, but we both know you're already impressed."
    ]
  }
];

export default function ChatbotSettings() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [enableFeedback, setEnableFeedback] = useState(true);
  const [activeTab, setActiveTab] = useState("edit");
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<PersonaFeedbackAnalysis | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    toneKeywords: "",
    examples: "",
  });
  
  // Load personas on mount
  useEffect(() => {
    const fetchPersonas = async () => {
      setIsLoading(true);
      try {
        // This would be an API call in a real implementation
        // For now, just set the predefined personas plus any from localStorage
        const savedPersonas = localStorage.getItem("customPersonas");
        const customPersonas = savedPersonas ? JSON.parse(savedPersonas) : [];
        
        setPersonas([...PREDEFINED_PERSONAS, ...customPersonas]);
        
        // Set first persona as selected if none is selected
        if (!selectedPersonaId && PREDEFINED_PERSONAS.length > 0) {
          setSelectedPersonaId(PREDEFINED_PERSONAS[0].id);
          updateFormFromPersona(PREDEFINED_PERSONAS[0]);
        }
      } catch (error) {
        console.error("Error fetching personas:", error);
        toast.error("Failed to load chatbot personas");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPersonas();
  }, []);
  
  // Update form when persona selection changes
  const handlePersonaChange = (personaId: string) => {
    setSelectedPersonaId(personaId);
    
    if (personaId === "custom") {
      setIsCustom(true);
      setFormData({
        name: "",
        description: "",
        toneKeywords: "",
        examples: "",
      });
      // Reset feedback analysis when switching to a new persona
      setFeedbackAnalysis(null);
    } else {
      setIsCustom(false);
      const selectedPersona = personas.find(p => p.id === personaId);
      if (selectedPersona) {
        updateFormFromPersona(selectedPersona);
        // Load feedback analysis for this persona
        loadFeedbackAnalysis(personaId);
      }
    }
  };
  
  // Load feedback analysis data for a specific persona
  const loadFeedbackAnalysis = async (personaId: string) => {
    if (!personaId || personaId === "custom") return;
    
    setIsLoadingAnalytics(true);
    
    try {
      const response = await fetch(`/api/chatbot/feedback/analysis?personaId=${personaId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load feedback analysis");
      }
      
      const data = await response.json();
      setFeedbackAnalysis(data);
    } catch (error) {
      console.error("Error loading feedback analysis:", error);
      toast.error("Failed to load feedback analytics");
    } finally {
      setIsLoadingAnalytics(false);
    }
  };
  
  // Handle feedback on example messages
  const handleExampleFeedback = (
    exampleText: string, 
    feedbackType: string
  ) => {
    // Generate a unique ID for this example message
    const messageId = `preview-${Date.now()}`;
    
    // Send feedback to API
    fetch("/api/chatbot/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personaId: selectedPersonaId,
        messageId,
        messageText: exampleText,
        feedback: feedbackType,
        source: "preview",
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }
      // Refresh analytics data
      if (selectedPersonaId) {
        loadFeedbackAnalysis(selectedPersonaId);
      }
    })
    .catch(error => {
      console.error("Error submitting example feedback:", error);
    });
  };
  
  // Update form fields from persona object
  const updateFormFromPersona = (persona: any) => {
    setFormData({
      name: persona.name || "",
      description: persona.description || "",
      toneKeywords: persona.toneKeywords ? persona.toneKeywords.join(", ") : "",
      examples: persona.examples ? persona.examples.join("\n\n") : "",
    });
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Save persona
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Validate
      if (!formData.name) {
        toast.error("Persona name is required");
        return;
      }
      
      // Create persona object
      const personaData = {
        id: isCustom ? `custom-${Date.now()}` : selectedPersonaId,
        name: formData.name,
        description: formData.description,
        toneKeywords: formData.toneKeywords.split(",").map(kw => kw.trim()),
        examples: formData.examples.split("\n\n").filter(ex => ex.trim()),
        isCustom: isCustom
      };
      
      // This would be an API call in a real implementation
      // For demo purposes, we'll save to localStorage if it's a custom persona
      if (isCustom) {
        const savedPersonas = localStorage.getItem("customPersonas");
        const customPersonas = savedPersonas ? JSON.parse(savedPersonas) : [];
        
        localStorage.setItem(
          "customPersonas", 
          JSON.stringify([...customPersonas, personaData])
        );
        
        // Update personas state
        setPersonas(prev => [...prev, personaData]);
        setSelectedPersonaId(personaData.id);
      }
      
      // Save selected persona preference
      localStorage.setItem("selectedPersonaId", personaData.id);
      localStorage.setItem("enableFeedback", enableFeedback.toString());
      
      toast.success("Chatbot persona saved successfully");
    } catch (error) {
      console.error("Error saving persona:", error);
      toast.error("Failed to save chatbot persona");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new custom persona
  const handleCreateNew = () => {
    setIsCustom(true);
    setSelectedPersonaId("custom");
    setFormData({
      name: "",
      description: "",
      toneKeywords: "",
      examples: "",
    });
  };
  
  const renderPerformanceSummary = () => {
    if (isLoadingAnalytics) {
      return (
        <div className="py-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics data...</p>
        </div>
      );
    }
    
    if (!feedbackAnalysis || !feedbackAnalysis.stats) {
      return (
        <div className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No feedback data available</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            This persona hasn't received any feedback yet. Feedback data will appear
            here once users start interacting with messages.
          </p>
        </div>
      );
    }
    
    const { stats, samples, tonePerformance, recommendations } = feedbackAnalysis;
    
    return (
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Total Feedback
                </h3>
                <p className="text-3xl font-bold">{stats.totalFeedback}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Positive Rate
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {stats.positivePercentage}%
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 pb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">
                  Feedback Breakdown
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center">
                      <ThumbsUp className="w-4 h-4 mr-1 text-green-500" />
                      Positive
                    </span>
                    <span className="text-sm font-medium">{stats.positiveCount}</span>
                  </div>
                  <Progress value={stats.positivePercentage} className="h-2 bg-gray-100" />
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm flex items-center">
                      <ThumbsDown className="w-4 h-4 mr-1 text-red-500" />
                      Negative
                    </span>
                    <span className="text-sm font-medium">{stats.negativeCount}</span>
                  </div>
                  <Progress 
                    value={stats.totalFeedback ? (stats.negativeCount / stats.totalFeedback) * 100 : 0} 
                    className="h-2 bg-gray-100" 
                    indicatorClassName="bg-red-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tone Performance */}
        {tonePerformance && tonePerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="w-5 h-5 mr-2" />
                Tone Effectiveness
              </CardTitle>
              <CardDescription>
                How different tone elements perform with users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tonePerformance.map((tone) => (
                  <div key={tone.tone} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{tone.tone}</span>
                      <span className="text-sm">{tone.positiveRate}% positive ({tone.feedbackCount} feedbacks)</span>
                    </div>
                    <Progress
                      value={tone.positiveRate}
                      className="h-2 bg-gray-100"
                      indicatorClassName={
                        tone.positiveRate > 70 ? "bg-green-500" :
                        tone.positiveRate > 40 ? "bg-yellow-500" : "bg-red-500"
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Suggested improvements based on feedback patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        
        {/* Recent Feedback Samples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positive Samples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ThumbsUp className="w-5 h-5 mr-2 text-green-500" />
                Positive Feedback
              </CardTitle>
              <CardDescription>
                Messages that received positive responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {samples.positive && samples.positive.length > 0 ? (
                <div className="space-y-4">
                  {samples.positive.map((feedback) => (
                    <div key={feedback.id} className="p-3 bg-green-50 rounded-md">
                      <p className="text-sm mb-2">{feedback.messageText}</p>
                      <div className="text-xs text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No positive feedback samples yet.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Negative Samples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ThumbsDown className="w-5 h-5 mr-2 text-red-500" />
                Negative Feedback
              </CardTitle>
              <CardDescription>
                Messages that need improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {samples.negative && samples.negative.length > 0 ? (
                <div className="space-y-4">
                  {samples.negative.map((feedback) => (
                    <div key={feedback.id} className="p-3 bg-red-50 rounded-md">
                      <p className="text-sm mb-2">{feedback.messageText}</p>
                      {feedback.comment && (
                        <div className="text-xs bg-white p-2 rounded border border-red-100 mb-2">
                          <span className="font-medium">Comment:</span> {feedback.comment}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No negative feedback samples yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Chatbot Personality Settings</h1>
      
      <div className="grid md:grid-cols-[300px_1fr] gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personas</CardTitle>
              <CardDescription>
                Choose a predefined persona or create your own
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select 
                value={selectedPersonaId} 
                onValueChange={handlePersonaChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">➕ Custom Persona</SelectItem>
                  {personas.map(persona => (
                    <SelectItem key={persona.id} value={persona.id}>
                      {persona.name} {persona.isCustom && "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex flex-col space-y-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCreateNew}
                  disabled={isLoading}
                >
                  Create New Persona
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Only show tabs if a persona is selected and it's not custom */}
          {selectedPersonaId && !isCustom && (
            <Card>
              <CardContent className="pt-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit" className="flex items-center">
                      <MessageSquareText className="w-4 h-4 mr-2" />
                      Edit
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="flex items-center">
                      <BarChart className="w-4 h-4 mr-2" />
                      Analytics
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Main Content */}
        <div>
          {activeTab === "edit" ? (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    {isCustom ? "Custom Persona" : "Edit Persona"}
                  </CardTitle>
                  <CardDescription>
                    Configure how your chatbot will interact with followers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Persona Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Flirty Friend"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isCustom && !selectedPersonaId}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Brief description of this persona"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={!isCustom && !selectedPersonaId}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="toneKeywords">
                      Tone Keywords (comma-separated)
                    </Label>
                    <Input
                      id="toneKeywords"
                      name="toneKeywords"
                      placeholder="e.g., flirty, playful, teasing"
                      value={formData.toneKeywords}
                      onChange={handleInputChange}
                      disabled={!isCustom && !selectedPersonaId}
                    />
                    {formData.toneKeywords && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.toneKeywords.split(",").map((kw, i) => (
                          <Badge key={i} variant="secondary">
                            {kw.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="examples">
                      Example Messages (separate with blank lines)
                    </Label>
                    <Textarea
                      id="examples"
                      name="examples"
                      placeholder="Hey there! Thanks for the follow 💕&#10;&#10;I noticed you just followed me! What caught your interest?"
                      value={formData.examples}
                      onChange={handleInputChange}
                      disabled={!isCustom && !selectedPersonaId}
                      rows={8}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-4">
                    <Switch
                      id="enableFeedback"
                      checked={enableFeedback}
                      onCheckedChange={setEnableFeedback}
                    />
                    <Label htmlFor="enableFeedback">
                      Enable feedback learning
                    </Label>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading || !selectedPersonaId}
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
              
              {formData.examples && (
                <Card>
                  <CardHeader>
                    <CardTitle>Message Preview</CardTitle>
                    <CardDescription>
                      How your messages will appear to followers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.examples.split("\n\n").map((example, i) => (
                      example.trim() && (
                        <div key={i} className="p-4 bg-muted rounded-lg">
                          <div className="flex justify-between items-start">
                            <p>{example}</p>
                            
                            {/* Add feedback buttons to example messages */}
                            {selectedPersonaId && (
                              <div className="ml-4 mt-1">
                                <MessageFeedback
                                  messageId={`preview-${i}`}
                                  personaId={selectedPersonaId}
                                  messageText={example}
                                  size="sm"
                                  onFeedbackGiven={(type) => handleExampleFeedback(example, type)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            // Performance tab content
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  Track how this persona is performing with real users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderPerformanceSummary()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 