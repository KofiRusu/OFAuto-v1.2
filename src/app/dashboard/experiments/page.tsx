import { CampaignExperimentData, CampaignVariant } from '@/lib/services/reasoningService';
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

export default function ExperimentsPage() {
  // ... existing code ...

  // Add this right after existing tabs
  const [selectedTab, setSelectedTab] = useState("active");
  
  // Add this near other state variables
  const [aiSummary, setAiSummary] = useState<{
    [key: string]: {
      summary: string;
      keyTakeaways: string[];
      confidence: number;
    }
  }>({});
  
  // Add this function near other functions
  const generateExperimentSummary = async (experimentId: string) => {
    toast({
      title: "Generating AI summary",
      description: "Please wait while we analyze the experiment results...",
    });
    
    try {
      // In production, this would call an actual API endpoint
      // For now we'll simulate a delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI-generated summary data
      const mockSummary = {
        summary: "This A/B test shows a statistically significant improvement in conversion rate for Variant B over the control. The new headline and CTA combination resulted in a 24% lift in conversions with 98% confidence.",
        keyTakeaways: [
          "Variant B outperformed the control on all key metrics",
          "The biggest improvement was seen in mobile users (32% increase)",
          "Average time on page increased by 15 seconds for Variant B"
        ],
        confidence: 98
      };
      
      setAiSummary(prev => ({
        ...prev,
        [experimentId]: mockSummary
      }));
      
      toast({
        title: "Analysis complete",
        description: "AI summary has been generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error generating summary",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  // Modify the existing TabsList to include a completed tab
  // Find the TabsList that looks like this:
  // <TabsList className="grid w-full grid-cols-2">
  //   <TabsTrigger value="active">Active</TabsTrigger>
  //   <TabsTrigger value="past">Past</TabsTrigger>
  // </TabsList>
  
  // Replace it with:
  // <TabsList className="grid w-full grid-cols-3">
  //   <TabsTrigger 
  //     value="active" 
  //     onClick={() => setSelectedTab("active")}
  //   >
  //     Active
  //   </TabsTrigger>
  //   <TabsTrigger 
  //     value="completed"
  //     onClick={() => setSelectedTab("completed")}
  //   >
  //     Completed
  //   </TabsTrigger>
  //   <TabsTrigger 
  //     value="past"
  //     onClick={() => setSelectedTab("past")}
  //   >
  //     Archived
  //   </TabsTrigger>
  // </TabsList>
  
  // Add this new TabsContent after the active tab content and before the past tab content:
  // <TabsContent value="completed">
  //   <div className="grid gap-4">
  //     {experiments
  //       .filter(exp => exp.status === 'completed')
  //       .map(experiment => (
  //         <Card key={experiment.id} className="overflow-hidden">
  //           <CardHeader className="pb-2">
  //             <div className="flex justify-between">
  //               <div>
  //                 <Badge 
  //                   variant="success"
  //                   className="mb-2"
  //                 >
  //                   <CheckCheck className="h-3 w-3 mr-1" />
  //                   Completed
  //                 </Badge>
  //                 <CardTitle>{experiment.name}</CardTitle>
  //               </div>
  //               <div className="flex gap-2">
  //                 <Button
  //                   variant="outline"
  //                   size="sm"
  //                   onClick={() => {
  //                     setSelectedExperiment(experiment);
  //                     setViewDetailsOpen(true);
  //                   }}
  //                 >
  //                   View Details
  //                 </Button>
  //                 {!aiSummary[experiment.id] && (
  //                   <Button
  //                     variant="default"
  //                     size="sm"
  //                     onClick={() => generateExperimentSummary(experiment.id)}
  //                   >
  //                     <Sparkles className="h-4 w-4 mr-1" />
  //                     Generate AI Summary
  //                   </Button>
  //                 )}
  //               </div>
  //             </div>
  //             <CardDescription>
  //               {experiment.description || "No description provided"}
  //             </CardDescription>
  //             <div className="text-xs text-muted-foreground mt-1">
  //               Completed on {format(new Date(experiment.endDate || new Date()), 'PPP')}
  //             </div>
  //           </CardHeader>
  //           <CardContent>
  //             {aiSummary[experiment.id] ? (
  //               <div className="bg-muted/50 rounded-md p-4 mt-2">
  //                 <div className="flex items-center gap-2 mb-3">
  //                   <Sparkles className="h-5 w-5 text-primary" />
  //                   <h3 className="font-medium">AI-Generated Experiment Summary</h3>
  //                   <Badge variant="outline" className="ml-auto">
  //                     {aiSummary[experiment.id].confidence}% confidence
  //                   </Badge>
  //                 </div>
  //                 <p className="text-sm mb-3">
  //                   {aiSummary[experiment.id].summary}
  //                 </p>
  //                 <div className="mt-3">
  //                   <h4 className="text-sm font-medium mb-1">Key Takeaways:</h4>
  //                   <ul className="text-sm space-y-1 list-disc pl-5">
  //                     {aiSummary[experiment.id].keyTakeaways.map((point, idx) => (
  //                       <li key={idx}>{point}</li>
  //                     ))}
  //                   </ul>
  //                 </div>
  //               </div>
  //             ) : (
  //               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  //                 {experiment.variants.map((variant) => (
  //                   <div 
  //                     key={variant.id}
  //                     className="flex flex-col p-3 rounded-md border"
  //                   >
  //                     <div className="font-medium">{variant.name}</div>
  //                     <div className="text-sm text-muted-foreground mb-2">
  //                       {variant.description || "No description"}
  //                     </div>
  //                     {experiment.performanceData && experiment.performanceData[variant.id] && (
  //                       <div className="mt-auto">
  //                         <div className="text-xs text-muted-foreground">
  //                           Conversion Rate
  //                         </div>
  //                         <div className="text-lg font-medium">
  //                           {((experiment.performanceData[variant.id].count / 
  //                              experiment.performanceData[variant.id].visitors) * 100).toFixed(2)}%
  //                         </div>
  //                       </div>
  //                     )}
  //                   </div>
  //                 ))}
  //               </div>
  //             )}
  //           </CardContent>
  //         </Card>
  //       ))}
  //   </div>
  // </TabsContent>

  // Modify the experiment details dialog to include the AI summary section
  // Find the section in the dialog that displays experiment details
  // Add this before the Dialog close button:
  
  // {selectedExperiment && selectedExperiment.status === 'completed' && (
  //   <div className="mt-6">
  //     <div className="flex items-center justify-between">
  //       <h3 className="text-lg font-medium">Experiment Analysis</h3>
  //       {!aiSummary[selectedExperiment.id] && (
  //         <Button 
  //           variant="outline" 
  //           onClick={() => generateExperimentSummary(selectedExperiment.id)}
  //         >
  //           <Sparkles className="h-4 w-4 mr-1" />
  //           Generate AI Summary
  //         </Button>
  //       )}
  //     </div>
  //     
  //     {aiSummary[selectedExperiment.id] ? (
  //       <div className="bg-muted/50 rounded-md p-4 mt-2">
  //         <div className="flex items-center gap-2 mb-3">
  //           <Sparkles className="h-5 w-5 text-primary" />
  //           <h3 className="font-medium">AI-Generated Experiment Summary</h3>
  //           <Badge variant="outline" className="ml-auto">
  //             {aiSummary[selectedExperiment.id].confidence}% confidence
  //           </Badge>
  //         </div>
  //         <p className="text-sm mb-3">
  //           {aiSummary[selectedExperiment.id].summary}
  //         </p>
  //         <div className="mt-3">
  //           <h4 className="text-sm font-medium mb-1">Key Takeaways:</h4>
  //           <ul className="text-sm space-y-1 list-disc pl-5">
  //             {aiSummary[selectedExperiment.id].keyTakeaways.map((point, idx) => (
  //               <li key={idx}>{point}</li>
  //             ))}
  //           </ul>
  //         </div>
  //       </div>
  //     ) : (
  //       <div className="bg-muted/50 rounded-md p-4 mt-2 text-center">
  //         <p className="text-sm text-muted-foreground">
  //           Generate an AI summary to get insights about this experiment's results.
  //         </p>
  //       </div>
  //     )}
  //   </div>
  // )}
// ... existing code ...
} 