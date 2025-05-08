'use client';

import { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Code,
  Database,
  FileCode,
  Library,
  MessageSquare,
  Server,
  Settings,
  Terminal,
  Workflow
} from "lucide-react";

export default function DeveloperGuide() {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold">OFAuto AI Insights Developer Guide</h2>
        <p className="text-muted-foreground">Technical documentation for developers working with the AI insights system</p>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center">
            <FileCode className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="architecture" className="flex items-center">
            <Workflow className="w-4 h-4 mr-2" />
            Architecture
          </TabsTrigger>
          <TabsTrigger value="prompt-engineering" className="flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            Prompt Engineering
          </TabsTrigger>
          <TabsTrigger value="extending" className="flex items-center">
            <Code className="w-4 h-4 mr-2" />
            Extending
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  About the AI Insights System
                </h3>
                <p className="mt-2 text-sm text-blue-800 dark:text-blue-300">
                  The AI insights system provides data-driven recommendations based on analytics data gathered across platforms. 
                  It uses a structured approach to generate, format, and display actionable insights to help creators optimize their content strategy.
                </p>
              </div>
            </div>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="core-components">
              <AccordionTrigger>
                <span className="flex items-center">
                  <Library className="w-4 h-4 mr-2" />
                  Core Components
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 pl-6 list-disc">
                  <li><code>src/lib/services/reasoningService.ts</code>: Central logic for generating insights</li>
                  <li><code>src/lib/llm/callLLM.ts</code>: API integration with OpenAI/Anthropic</li>
                  <li><code>src/lib/trpc/routers/insights.ts</code>: API endpoints for insights</li>
                  <li><code>src/app/dashboard/insights/page.tsx</code>: Frontend page display</li>
                  <li><code>src/components/dashboard/InsightCard.tsx</code>: Individual insight UI component</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="data-flow">
              <AccordionTrigger>
                <span className="flex items-center">
                  <Workflow className="w-4 h-4 mr-2" />
                  Data Flow
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ol className="space-y-2 pl-6 list-decimal">
                  <li>User requests insights for a client</li>
                  <li>System collects analytics data, scheduled posts, and AutoDM tasks</li>
                  <li>Data is formatted into a structured prompt</li>
                  <li>Prompt is sent to LLM API (OpenAI or Anthropic)</li>
                  <li>Response is parsed and validated with Zod</li>
                  <li>Insights are returned to frontend for display</li>
                  <li>User can filter and take action on insights</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="key-files">
              <AccordionTrigger>
                <span className="flex items-center">
                  <FileCode className="w-4 h-4 mr-2" />
                  Key Files & Responsibilities
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p><strong>reasoningService.ts</strong>: Main entry point for generating insights</p>
                  <ul className="pl-6 list-disc">
                    <li><code>generateRevenueInsights()</code>: Primary function to generate insights</li>
                    <li><code>buildPromptFromData()</code>: Formats data into a prompt</li>
                    <li><code>parseInsights()</code>: Parses and validates response</li>
                  </ul>
                  
                  <p><strong>callLLM.ts</strong>: Handles API communication</p>
                  <ul className="pl-6 list-disc">
                    <li><code>callLLM()</code>: Main API call function</li>
                    <li>Supports OpenAI and Anthropic API formats</li>
                    <li>Includes fallback mock responses for development</li>
                  </ul>
                  
                  <p><strong>insightsRouter.ts</strong>: API endpoints</p>
                  <ul className="pl-6 list-disc">
                    <li><code>getInsights</code>: Main query endpoint</li>
                    <li><code>getPlatformInsights</code>: Platform-specific insights</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
        
        <TabsContent value="architecture" className="space-y-4">
          <div className="rounded-md bg-slate-100 p-6 dark:bg-slate-800">
            <h3 className="text-lg font-medium mb-4">System Architecture</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium mb-2 flex items-center">
                  <Server className="w-4 h-4 mr-2" />
                  Backend Components
                </h4>
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-slate-200 dark:bg-slate-700 p-3 border-b">
                    <code>reasoningService.ts</code>
                  </div>
                  <div className="p-3 text-sm">
                    <p>Core service that orchestrates the insight generation process:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Fetches data from multiple sources (Prisma DB)</li>
                      <li>Formats data into structured prompts</li>
                      <li>Calls LLM API via <code>callLLM()</code></li>
                      <li>Parses and validates response with Zod schema</li>
                      <li>Returns typed <code>Insight[]</code> array</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-2 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  LLM Integration
                </h4>
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-slate-200 dark:bg-slate-700 p-3 border-b">
                    <code>callLLM.ts</code>
                  </div>
                  <div className="p-3 text-sm">
                    <p>Handles communication with LLM providers:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Supports OpenAI and Anthropic APIs</li>
                      <li>Handles API authentication and error handling</li>
                      <li>Configurable via environment variables</li>
                      <li>Provides fallback mock responses for development</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-2 flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  Data Sources
                </h4>
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-slate-200 dark:bg-slate-700 p-3 border-b">
                    <code>Prisma + Analytics Service</code>
                  </div>
                  <div className="p-3 text-sm">
                    <p>Data collected from various sources:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li><code>ScheduledPost</code>: Post history and future schedule</li>
                      <li><code>AutoDMTask</code>: Automated message configurations</li>
                      <li><code>Platform</code>: Connected platform information</li>
                      <li><code>Analytics</code>: Revenue and engagement metrics</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-2 flex items-center">
                  <Workflow className="w-4 h-4 mr-2" />
                  API Flow
                </h4>
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-slate-200 dark:bg-slate-700 p-3 border-b">
                    <code>tRPC Router</code>
                  </div>
                  <div className="p-3 text-sm">
                    <p>API endpoints for insights:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li><code>insights.getInsights</code>: Main query endpoint</li>
                      <li><code>insights.getPlatformInsights</code>: Platform-specific filtering</li>
                      <li>All endpoints include auth and ownership validation</li>
                      <li>Results are cached with a 5-minute stale time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="prompt-engineering" className="space-y-4">
          <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-950">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                  Prompt Engineering Guidelines
                </h3>
                <p className="mt-2 text-sm text-yellow-800 dark:text-yellow-300">
                  When modifying prompts, be careful to maintain the expected output format. The system expects a valid JSON array
                  of insights matching the Zod schema. Test changes thoroughly before deploying.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Prompt Structure</h3>
            <p>The prompt is constructed in the <code>buildPromptFromData()</code> function with several key sections:</p>
            
            <div className="border rounded-md overflow-hidden">
              <div className="bg-slate-200 dark:bg-slate-700 p-3 border-b">
                <code>Prompt Template</code>
              </div>
              <div className="p-4 text-sm bg-slate-50 dark:bg-slate-900 overflow-x-auto">
<pre>{`You are an expert content creator monetization advisor. Analyze the following data about a creator's business and provide 3-5 actionable insights that could help them improve their revenue, engagement, or growth.

CLIENT DATA:
- Platforms: ${JSON.stringify([{platform: "example", username: "user"}])}
- Recent scheduled posts: ${JSON.stringify([{platform: "example", contentType: "type"}])}
- Automated DM tasks: ${JSON.stringify([{platform: "example", triggerType: "trigger"}])}
- Last 30 day metrics: ${JSON.stringify([{totalRevenue: 0, followers: 0}])}

SUMMARY METRICS:
- Total 30-day revenue: $0.00
- Average engagement rate: 0.00%
- Follower growth: 0

Based on this data, provide 3-5 strategic insights formatted as a JSON array of objects with these exact fields:
- title: A short, attention-grabbing title for the insight
- description: A detailed explanation of the insight and its importance (2-3 sentences)
- actionLabel: (optional) Text for a call-to-action button
- actionType: (optional) One of: 'schedule_post', 'edit_campaign', 'adjust_price'
- recommendedValue: (optional) A specific value recommendation if applicable
- importance: A number from 1-5 indicating how important this insight is (5 being most important)
- category: One of: 'revenue', 'engagement', 'growth', 'content'

FORMAT YOUR RESPONSE AS A VALID JSON ARRAY WITH NO OTHER TEXT BEFORE OR AFTER.`}</pre>
              </div>
            </div>
            
            <h3 className="text-lg font-medium mt-6">Modifying Prompts</h3>
            <p>To modify the prompt structure or add new data sources:</p>
            
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>Locate <code>buildPromptFromData()</code> in <code>reasoningService.ts</code></li>
              <li>Add new data sources to the Promise.all array in <code>generateRevenueInsights()</code></li>
              <li>Format the new data and add it to the prompt template</li>
              <li>Update the prompt instructions if new fields are expected</li>
              <li>Update the Zod schema if the response format changes</li>
              <li>Test with various data scenarios to ensure response quality</li>
            </ol>
            
            <div className="rounded-md bg-green-50 p-4 dark:bg-green-950 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-900 dark:text-green-200">
                    Best Practices
                  </h3>
                  <ul className="mt-2 text-sm text-green-800 dark:text-green-300 list-disc pl-5 space-y-1">
                    <li>Always include clear instructions for output format</li>
                    <li>Provide real examples of the expected response format</li>
                    <li>Include context about the client's business and audience</li>
                    <li>Balance between providing enough data for quality insights and keeping the prompt concise</li>
                    <li>Consider using few-shot examples for complex insights</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="extending" className="space-y-4">
          <h3 className="text-lg font-medium">Extending the Insights System</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium mb-2 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Adding New Insight Types
              </h4>
              <div className="space-y-2">
                <p>To add a new insight type or action:</p>
                
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    Update the <code>InsightSchema</code> in <code>reasoningService.ts</code>:
                    <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-x-auto text-sm mt-2">
{`export const InsightSchema = z.object({
  // Existing fields...
  actionType: z.enum([
    'schedule_post', 
    'edit_campaign', 
    'adjust_price',
    'new_action_type' // Add your new action type here
  ]).optional(),
  // Add any other new fields
  newField: z.string().optional(),
});`}
                    </pre>
                  </li>
                  <li>
                    Update the prompt in <code>buildPromptFromData()</code> to include the new action type:
                    <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-x-auto text-sm mt-2">
{`// In the prompt template:
- actionType: (optional) One of: 'schedule_post', 'edit_campaign', 'adjust_price', 'new_action_type'`}
                    </pre>
                  </li>
                  <li>
                    Update the <code>InsightCard</code> component to handle the new action type:
                    <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-x-auto text-sm mt-2">
{`// In InsightCard.tsx
// Add icon mapping
if (insight.actionType === 'new_action_type') return NewIcon;

// Add button handling
{insight.actionType === 'new_action_type' && <NewIcon className="w-4 h-4 mr-2" />}`}
                    </pre>
                  </li>
                  <li>
                    Update the action handler in <code>insights/page.tsx</code>:
                    <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-x-auto text-sm mt-2">
{`// In handleInsightAction function
if (insight.actionType === 'new_action_type') {
  // Handle the new action type
  router.push(\`/dashboard/new-feature?param=\${insight.recommendedValue}\`);
}`}
                    </pre>
                  </li>
                </ol>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium mb-2 flex items-center">
                <Terminal className="w-4 h-4 mr-2" />
                Adding New Data Sources
              </h4>
              <div className="space-y-2">
                <p>To incorporate new data sources for better insights:</p>
                
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    Update the data fetching in <code>generateRevenueInsights()</code>:
                    <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-x-auto text-sm mt-2">
{`// Add to Promise.all array
const [
  scheduledPosts, 
  autoDmTasks, 
  metrics,
  newDataSource // Add new data source here
] = await Promise.all([
  // Existing fetches...
  
  // New data source fetch
  prisma.newTable.findMany({
    where: { clientId },
    // ...other query options
  }),
]);`}
                    </pre>
                  </li>
                  <li>
                    Format the new data in <code>buildPromptFromData()</code>:
                    <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-x-auto text-sm mt-2">
{`// Format new data
const formattedNewData = newDataSource.map(item => ({
  // Transform data as needed
  key: item.value,
  // ...other fields
}));

// Add to prompt
return \`
// Existing prompt sections...

NEW DATA SECTION:
- New data: \${JSON.stringify(formattedNewData)}

// Rest of prompt...
\`;`}
                    </pre>
                  </li>
                </ol>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium mb-2 flex items-center">
                <Code className="w-4 h-4 mr-2" />
                Adding New Visualizations
              </h4>
              <div className="space-y-2">
                <p>To add new chart visualizations for insights:</p>
                
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Create a new component in <code>src/components/dashboard/insights/</code> directory</li>
                  <li>Use the existing <code>Chart</code> component for consistency</li>
                  <li>Import and add to the insights page where appropriate</li>
                  <li>Consider adding a new tab in the insights page for specialized visualizations</li>
                </ol>
                
                <p className="mt-2">Example for adding a new visualization tab:</p>
                <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-x-auto text-sm mt-2">
{`// In insights/page.tsx
<Tabs defaultValue="priority" className="w-full">
  <TabsList className="mb-4">
    <TabsTrigger value="priority">By Priority</TabsTrigger>
    <TabsTrigger value="category">By Category</TabsTrigger>
    <TabsTrigger value="new-viz">New Visualization</TabsTrigger>
  </TabsList>
  
  {/* Existing content... */}
  
  <TabsContent value="new-viz" className="space-y-6">
    <YourNewVisualizationComponent insights={filteredInsights} />
  </TabsContent>
</Tabs>`}
                </pre>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 