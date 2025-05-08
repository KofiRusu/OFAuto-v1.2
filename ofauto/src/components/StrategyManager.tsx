import { useState, useEffect } from "react";
import { Strategy, StrategyType, StrategyStatus } from "@/lib/ai-strategy/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Loader2, TrendingUp, Lightbulb, Target } from "lucide-react";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/api-client";

interface StrategyManagerProps {
  clientId: string;
}

export function StrategyManager({ clientId }: StrategyManagerProps) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [selectedType, setSelectedType] = useState<StrategyType>("PRICING");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [roi, setRoi] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    fetchStrategies();
  }, [clientId, retryCount]);

  useEffect(() => {
    if (selectedStrategy) {
      fetchStrategyDetails(selectedStrategy.id);
    }
  }, [selectedStrategy]);

  const fetchStrategies = async () => {
    try {
      // Use apiClient to fetch strategies
      const response = await apiClient.strategies.list({ clientId });
      
      if (response.success && response.data) {
        setStrategies(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch strategies");
      }
    } catch (error: any) {
      toast.error("Failed to fetch strategies: " + (error.message || "Unknown error"));
      
      // Implement minimal retry logic
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 3000); // retry after 3 seconds
      }
    }
  };

  const fetchStrategyDetails = async (strategyId: string) => {
    setFetchingDetails(true);
    try {
      // Use apiClient to fetch strategy details
      const [insightsResponse, roiResponse] = await Promise.all([
        apiClient.strategies.getInsights(strategyId),
        apiClient.strategies.getRoi(strategyId)
      ]);

      if (insightsResponse.success && insightsResponse.data) {
        setInsights(insightsResponse.data);
      } else {
        throw new Error(insightsResponse.error || "Failed to fetch insights");
      }

      if (roiResponse.success && roiResponse.data) {
        setRoi(roiResponse.data.roi);
      } else {
        throw new Error(roiResponse.error || "Failed to fetch ROI data");
      }
    } catch (error: any) {
      toast.error("Failed to fetch strategy details: " + (error.message || "Unknown error"));
      // Set fallback data for better UX
      setInsights([]);
      setRoi(null);
    } finally {
      setFetchingDetails(false);
    }
  };

  const generateStrategy = async () => {
    setLoading(true);
    try {
      // Use apiClient to generate a new strategy
      const response = await apiClient.strategies.create({
        clientId,
        type: selectedType,
        data: {} // Add any additional data needed for the strategy
      });

      if (response.success && response.data) {
        setStrategies((prev) => [response.data, ...prev]);
        setSelectedStrategy(response.data);
        toast.success("New strategy generated successfully");
      } else {
        throw new Error(response.error || "Failed to generate strategy");
      }
    } catch (error: any) {
      toast.error("Failed to generate strategy: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Strategy Manager</h2>
        <div className="flex items-center gap-4">
          <Select value={selectedType} onValueChange={(value: StrategyType) => setSelectedType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select strategy type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(StrategyType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generateStrategy} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Strategy"
            )}
          </Button>
        </div>
      </div>

      {strategies.length === 0 && !loading ? (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No strategies found. Generate your first AI strategy.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <Card 
              key={strategy.id}
              className={`cursor-pointer transition-all ${
                selectedStrategy?.id === strategy.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedStrategy(strategy)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{strategy.type}</span>
                  <span className={`text-sm ${
                    strategy.status === "ACTIVE" ? "text-green-500" :
                    strategy.status === "PENDING" ? "text-yellow-500" :
                    strategy.status === "COMPLETED" ? "text-blue-500" :
                    "text-red-500"
                  }`}>
                    {strategy.status}
                  </span>
                </CardTitle>
                <CardDescription>
                  Generated on {new Date(strategy.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{strategy.reasoning}</p>
                <div className="space-y-2">
                  {strategy.recommendations.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-3">
                      <h4 className="font-medium">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="text-green-500">Impact: {rec.expectedImpact}</span>
                        <span className="text-yellow-500">Difficulty: {rec.implementationDifficulty}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedStrategy && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Strategy Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Projected ROI</p>
                <p className="font-semibold">{fetchingDetails ? 'Loading...' : roi ? `${roi.toFixed(1)}%` : 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold">{selectedStrategy.status}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Key Insights</p>
                <p className="font-semibold">{fetchingDetails ? 'Loading...' : `${insights.length} insights`}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Key Insights</h4>
            {fetchingDetails ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Loading insights...</span>
              </div>
            ) : insights.length > 0 ? (
              <ul className="list-disc list-inside space-y-2">
                {insights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-600">{insight}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No insights available for this strategy.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 