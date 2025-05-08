import { useState } from "react";
import { Strategy, StrategyComparison } from "@/lib/ai-strategy/types";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, ScatterChart } from "recharts";
import { Loader2, Download, PlayCircle } from "lucide-react";
import { toast } from "sonner";

interface StrategyComparisonProps {
  strategies: Strategy[];
  onCompare: (strategyIds: string[]) => Promise<StrategyComparison>;
}

export function StrategyComparison({ strategies, onCompare }: StrategyComparisonProps) {
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [comparison, setComparison] = useState<StrategyComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [autoImplementing, setAutoImplementing] = useState<string | null>(null);

  const handleStrategySelect = (strategyId: string) => {
    setSelectedStrategies(prev => {
      if (prev.includes(strategyId)) {
        return prev.filter(id => id !== strategyId);
      }
      if (prev.length < 3) { // Limit to 3 strategies for comparison
        return [...prev, strategyId];
      }
      return prev;
    });
  };

  const handleCompare = async () => {
    if (selectedStrategies.length < 2) return;
    
    setLoading(true);
    try {
      const result = await onCompare(selectedStrategies);
      setComparison(result);
    } catch (error) {
      console.error("Error comparing strategies:", error);
      toast.error("Failed to compare strategies");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (type: "strategy" | "comparison") => {
    try {
      const response = await fetch("/api/strategies/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          strategyId: type === "strategy" ? selectedStrategies[0] : comparison?.id,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `strategy-report-${type === "strategy" ? selectedStrategies[0] : comparison?.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
    }
  };

  const handleAutoImplement = async (strategyId: string) => {
    setAutoImplementing(strategyId);
    try {
      const response = await fetch("/api/strategies/auto-implement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ strategyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.reason || "Failed to auto-implement strategy");
      }

      toast.success("Strategy auto-implementation started");
    } catch (error) {
      console.error("Error auto-implementing strategy:", error);
      toast.error(error instanceof Error ? error.message : "Failed to auto-implement strategy");
    } finally {
      setAutoImplementing(null);
    }
  };

  const renderROIChart = () => {
    if (!comparison) return null;

    const data = comparison.strategies.map(id => {
      const strategy = strategies.find(s => s.id === id);
      return {
        name: strategy?.type || id,
        roi: comparison.metrics.roi,
        complexity: comparison.metrics.complexity,
        impact: comparison.metrics.expectedImpact,
        time: comparison.metrics.implementationTime
      };
    });

    return (
      <div className="h-[300px]">
        <BarChart
          width={600}
          height={300}
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <BarChart.CartesianGrid strokeDasharray="3 3" />
          <BarChart.XAxis dataKey="name" />
          <BarChart.YAxis />
          <BarChart.Tooltip />
          <BarChart.Legend />
          <BarChart.Bar dataKey="roi" fill="#8884d8" name="ROI" />
          <BarChart.Bar dataKey="complexity" fill="#82ca9d" name="Complexity" />
        </BarChart>
      </div>
    );
  };

  const renderImplementationTimeChart = () => {
    if (!comparison) return null;

    const data = comparison.strategies.map(id => {
      const strategy = strategies.find(s => s.id === id);
      return {
        name: strategy?.type || id,
        time: comparison.metrics.implementationTime,
        impact: comparison.metrics.expectedImpact
      };
    });

    return (
      <div className="h-[300px]">
        <ScatterChart
          width={600}
          height={300}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <ScatterChart.CartesianGrid strokeDasharray="3 3" />
          <ScatterChart.XAxis type="number" dataKey="time" name="Time" />
          <ScatterChart.YAxis type="number" dataKey="impact" name="Impact" />
          <ScatterChart.Tooltip />
          <ScatterChart.Legend />
          <ScatterChart.Scatter data={data} fill="#8884d8" name="Time vs Impact" />
        </ScatterChart>
      </div>
    );
  };

  const renderCategoryPerformanceChart = () => {
    if (!comparison) return null;

    const categoryData = strategies
      .filter(s => selectedStrategies.includes(s.id))
      .flatMap(s => s.recommendations)
      .reduce((acc, rec) => {
        const category = rec.category || "Uncategorized";
        if (!acc[category]) {
          acc[category] = {
            name: category,
            performance: 0,
            count: 0
          };
        }
        acc[category].performance += rec.projectedMetrics.revenue;
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { name: string; performance: number; count: number }>);

    const data = Object.values(categoryData).map(cat => ({
      ...cat,
      performance: cat.performance / cat.count
    }));

    return (
      <div className="h-[300px]">
        <LineChart
          width={600}
          height={300}
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <LineChart.CartesianGrid strokeDasharray="3 3" />
          <LineChart.XAxis dataKey="name" />
          <LineChart.YAxis />
          <LineChart.Tooltip />
          <LineChart.Legend />
          <LineChart.Line type="monotone" dataKey="performance" stroke="#8884d8" name="Performance" />
        </LineChart>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Strategy Comparison</h2>
        <div className="flex items-center gap-4">
          {comparison && (
            <Button
              variant="outline"
              onClick={() => handleDownloadReport("comparison")}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          )}
          <Button
            onClick={handleCompare}
            disabled={selectedStrategies.length < 2 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Comparing...
              </>
            ) : (
              "Compare Strategies"
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {strategies.map((strategy) => (
          <Card
            key={strategy.id}
            className={`cursor-pointer transition-all ${
              selectedStrategies.includes(strategy.id)
                ? "ring-2 ring-blue-500"
                : ""
            }`}
            onClick={() => handleStrategySelect(strategy.id)}
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
              <p className="text-sm text-muted-foreground mb-4">
                {strategy.reasoning}
              </p>
              <div className="space-y-2">
                {strategy.recommendations.slice(0, 2).map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-3">
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {rec.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="text-green-500">
                        Impact: {rec.expectedImpact}
                      </span>
                      <span className="text-yellow-500">
                        Difficulty: {rec.implementationDifficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadReport("strategy");
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAutoImplement(strategy.id);
                  }}
                  disabled={autoImplementing === strategy.id}
                  className="flex items-center gap-2"
                >
                  {autoImplementing === strategy.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                  Auto-Implement
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {comparison && (
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
              <TabsTrigger value="implementation">Implementation</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg shadow">
                  <h3 className="font-semibold mb-2">Average ROI</h3>
                  <p className="text-2xl text-green-500">
                    {comparison.metrics.roi.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                  <h3 className="font-semibold mb-2">Complexity Score</h3>
                  <p className="text-2xl text-yellow-500">
                    {comparison.metrics.complexity.toFixed(1)}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                  <h3 className="font-semibold mb-2">Implementation Time</h3>
                  <p className="text-2xl text-blue-500">
                    {comparison.metrics.implementationTime} min
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="roi">
              {renderROIChart()}
            </TabsContent>

            <TabsContent value="implementation">
              {renderImplementationTimeChart()}
            </TabsContent>

            <TabsContent value="categories">
              {renderCategoryPerformanceChart()}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
} 