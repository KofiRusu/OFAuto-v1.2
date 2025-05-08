"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { TransactionType } from "@prisma/client";

interface TestDataGeneratorProps {
  clientId: string;
}

export function TestDataGenerator({ clientId }: TestDataGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [daysToGenerate, setDaysToGenerate] = useState(30);
  
  const trackEngagement = trpc.analytics.trackEngagement.useMutation();
  const trackFinancial = trpc.analytics.trackFinancial.useMutation();
  
  const generateRandomData = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setStatus("Generating test data...");
    
    try {
      // Create a platform for testing if it doesn't exist
      const platformId = "test-platform-" + clientId;
      
      // Generate data for the specified number of days
      const today = new Date();
      
      for (let dayOffset = daysToGenerate - 1; dayOffset >= 0; dayOffset--) {
        const date = new Date();
        date.setDate(today.getDate() - dayOffset);
        
        setStatus(`Generating data for ${date.toDateString()} (${daysToGenerate - dayOffset}/${daysToGenerate})`);
        
        // Generate engagement metrics
        await generateEngagementData(platformId, date);
        
        // Generate financial metrics
        await generateFinancialData(date);
        
        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setStatus("Test data generated successfully!");
    } catch (error) {
      setStatus(`Error generating test data: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const generateEngagementData = async (platformId: string, date: Date) => {
    // Generate followers
    const dailyNewFollowers = Math.floor(Math.random() * 20) + 5;
    await trackEngagement.mutateAsync({
      clientId,
      platformId,
      date,
      eventType: "follower",
      count: dailyNewFollowers,
    });
    
    // Generate likes (20-100 per day)
    const dailyLikes = Math.floor(Math.random() * 80) + 20;
    await trackEngagement.mutateAsync({
      clientId,
      platformId,
      date,
      eventType: "like",
      count: dailyLikes,
    });
    
    // Generate comments (5-25 per day)
    const dailyComments = Math.floor(Math.random() * 20) + 5;
    await trackEngagement.mutateAsync({
      clientId,
      platformId,
      date,
      eventType: "comment",
      count: dailyComments,
    });
    
    // Generate shares (1-10 per day)
    const dailyShares = Math.floor(Math.random() * 10) + 1;
    await trackEngagement.mutateAsync({
      clientId,
      platformId,
      date,
      eventType: "share",
      count: dailyShares,
    });
    
    // Generate views (100-500 per day)
    const dailyViews = Math.floor(Math.random() * 400) + 100;
    await trackEngagement.mutateAsync({
      clientId,
      platformId,
      date,
      eventType: "view",
      count: dailyViews,
    });
    
    // Generate messages (2-15 per day)
    const dailyMessages = Math.floor(Math.random() * 13) + 2;
    await trackEngagement.mutateAsync({
      clientId,
      platformId,
      date,
      eventType: "message",
      count: dailyMessages,
    });
  };
  
  const generateFinancialData = async (date: Date) => {
    // Generate subscriptions (1-5 per day, $5-15 each)
    const dailySubscriptions = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < dailySubscriptions; i++) {
      const amount = Math.floor(Math.random() * 10) + 5;
      await trackFinancial.mutateAsync({
        clientId,
        date,
        transactionType: TransactionType.SUBSCRIPTION,
        amount,
        description: `Monthly subscription`,
      });
    }
    
    // Generate tips (0-10 per day, $1-50 each)
    const dailyTips = Math.floor(Math.random() * 11);
    for (let i = 0; i < dailyTips; i++) {
      const amount = Math.floor(Math.random() * 50) + 1;
      await trackFinancial.mutateAsync({
        clientId,
        date,
        transactionType: TransactionType.TIP,
        amount,
        description: `Tip from fan`,
      });
    }
    
    // Generate PPV content (0-3 per day, $3-20 each)
    const dailyPPV = Math.floor(Math.random() * 4);
    for (let i = 0; i < dailyPPV; i++) {
      const amount = Math.floor(Math.random() * 17) + 3;
      await trackFinancial.mutateAsync({
        clientId,
        date,
        transactionType: TransactionType.PPV_CONTENT,
        amount,
        description: `Pay-per-view content purchase`,
      });
    }
    
    // Generate direct messages (0-5 per day, $3-10 each)
    const dailyDMs = Math.floor(Math.random() * 6);
    for (let i = 0; i < dailyDMs; i++) {
      const amount = Math.floor(Math.random() * 7) + 3;
      await trackFinancial.mutateAsync({
        clientId,
        date,
        transactionType: TransactionType.DIRECT_MESSAGE,
        amount,
        description: `Direct message payment`,
      });
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mt-6">
      <h3 className="text-lg font-semibold mb-4">Generate Test Data</h3>
      
      <div className="flex items-center gap-4 mb-4">
        <div>
          <label htmlFor="daysToGenerate" className="block text-sm font-medium text-gray-700 mb-1">
            Days to generate:
          </label>
          <input
            type="number"
            id="daysToGenerate"
            min={1}
            max={90}
            value={daysToGenerate}
            onChange={(e) => setDaysToGenerate(parseInt(e.target.value) || 30)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isGenerating}
          />
        </div>
        
        <button
          onClick={generateRandomData}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-10 self-end"
        >
          {isGenerating ? "Generating..." : "Generate Test Data"}
        </button>
      </div>
      
      {status && (
        <div className={`text-sm ${status.includes("Error") ? "text-red-500" : "text-blue-500"}`}>
          {status}
        </div>
      )}
    </div>
  );
} 