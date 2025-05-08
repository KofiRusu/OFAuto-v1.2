import { prisma } from "@/lib/prisma";
import { ChatbotMessageFeedback, ChatbotPersona } from "@prisma/client";

interface ToneAdjustment {
  tone: string;
  adjustment: number; // Positive values increase weight, negative values decrease weight
}

interface FeedbackProcessingResult {
  toneAdjustments: ToneAdjustment[];
  recommendations: string[];
}

/**
 * Process feedback on a chatbot message and learn from it
 * @param feedback The feedback record to process
 * @returns Promise resolving to processing results
 */
export async function processFeedback(
  feedback: ChatbotMessageFeedback
): Promise<FeedbackProcessingResult> {
  try {
    // Get the persona for this feedback
    const persona = await prisma.chatbotPersona.findUnique({
      where: { id: feedback.personaId },
    });

    if (!persona) {
      throw new Error(`Persona with ID ${feedback.personaId} not found`);
    }

    // Process the feedback and make adjustments
    const result = await calculateToneAdjustments(feedback, persona);

    // Update the feedback record with the tone impact
    await prisma.chatbotMessageFeedback.update({
      where: { id: feedback.id },
      data: {
        toneImpact: result.toneAdjustments,
      },
    });

    return result;
  } catch (error) {
    console.error("Error processing feedback:", error);
    return {
      toneAdjustments: [],
      recommendations: [],
    };
  }
}

/**
 * Calculate tone adjustments based on feedback
 */
async function calculateToneAdjustments(
  feedback: ChatbotMessageFeedback,
  persona: ChatbotPersona
): Promise<FeedbackProcessingResult> {
  const result: FeedbackProcessingResult = {
    toneAdjustments: [],
    recommendations: [],
  };

  // Base adjustment values
  const positiveAdjustment = 0.1;
  const negativeAdjustment = -0.15;
  const neutralAdjustment = 0;

  // Apply adjustment based on feedback type
  let adjustmentMultiplier = 0;
  switch (feedback.feedback) {
    case "positive":
      adjustmentMultiplier = positiveAdjustment;
      break;
    case "negative":
      adjustmentMultiplier = negativeAdjustment;
      break;
    case "neutral":
      adjustmentMultiplier = neutralAdjustment;
      break;
  }

  // Create tone adjustments for each keyword in the persona
  result.toneAdjustments = persona.toneKeywords.map((tone) => ({
    tone,
    adjustment: adjustmentMultiplier,
  }));

  // Check for patterns in similar messages with negative feedback
  if (feedback.feedback === "negative") {
    const similarFeedbacks = await prisma.chatbotMessageFeedback.findMany({
      where: {
        personaId: persona.id,
        feedback: "negative",
        messageText: {
          contains: extractKeyPhrase(feedback.messageText),
        },
      },
      take: 5,
    });

    // If we have multiple negatives on similar messages, generate recommendations
    if (similarFeedbacks.length > 2) {
      // Analyze what might be the issue with these messages
      result.recommendations.push(
        `Consider revising messages containing "${extractKeyPhrase(
          feedback.messageText
        )}". This phrase has received multiple negative feedbacks.`
      );

      // Suggest tone adjustments
      if (persona.toneKeywords.includes("flirty") && feedback.messageText.toLowerCase().includes("flirt")) {
        result.recommendations.push(
          "The flirty tone may be too strong. Try reducing it or balancing with friendly tone."
        );
      }

      if (persona.toneKeywords.includes("sarcastic")) {
        result.recommendations.push(
          "Sarcasm can be misinterpreted in messages. Consider using it more sparingly."
        );
      }
    }
  }

  return result;
}

/**
 * Extract key phrases from a message for analysis
 */
function extractKeyPhrase(text: string): string {
  // This is a simplified implementation
  // In a real system, this would use NLP to find meaningful phrases
  
  // Remove common words
  const stopWords = ["the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "for", "to", "in", "with", "thanks"];
  
  // Split the text into words and filter out stop words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => !stopWords.includes(word) && word.length > 3);
  
  // Return the most common or significant phrase
  return words.length > 0 ? words[0] : "";
}

/**
 * Analyze feedback trends for a specific persona
 * @param personaId The persona ID to analyze
 * @returns Statistics and insights from feedback
 */
export async function analyzePersonaFeedback(personaId: string): Promise<PersonaFeedbackAnalysis> {
  try {
    // Get the persona
    const persona = await prisma.chatbotPersona.findUnique({
      where: { id: personaId },
    });

    if (!persona) {
      throw new Error(`Persona with ID ${personaId} not found`);
    }

    // Get all feedback for this persona
    const allFeedback = await prisma.chatbotMessageFeedback.findMany({
      where: { personaId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate statistics
    const positiveFeedback = allFeedback.filter((f) => f.feedback === "positive");
    const negativeFeedback = allFeedback.filter((f) => f.feedback === "negative");
    const neutralFeedback = allFeedback.filter((f) => f.feedback === "neutral");

    // Get recent samples
    const recentPositive = positiveFeedback.slice(0, 5);
    const recentNegative = negativeFeedback.slice(0, 5);

    // Analyze tone performance
    const tonePerformance = analyzeTonePerformance(persona.toneKeywords, allFeedback);

    return {
      persona,
      stats: {
        totalFeedback: allFeedback.length,
        positiveCount: positiveFeedback.length,
        negativeCount: negativeFeedback.length,
        neutralCount: neutralFeedback.length,
        positivePercentage: allFeedback.length > 0 
          ? Math.round((positiveFeedback.length / allFeedback.length) * 100) 
          : 0,
      },
      samples: {
        positive: recentPositive,
        negative: recentNegative,
      },
      tonePerformance,
      recommendations: generateRecommendations(persona, allFeedback),
    };
  } catch (error) {
    console.error("Error analyzing persona feedback:", error);
    return {
      persona: null,
      stats: {
        totalFeedback: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        positivePercentage: 0,
      },
      samples: {
        positive: [],
        negative: [],
      },
      tonePerformance: [],
      recommendations: [],
    };
  }
}

interface TonePerformance {
  tone: string;
  positiveRate: number;
  feedbackCount: number;
}

/**
 * Analyze performance of different tone keywords
 */
function analyzeTonePerformance(
  tones: string[],
  feedbacks: ChatbotMessageFeedback[]
): TonePerformance[] {
  return tones.map((tone) => {
    // Filter feedback that contains this tone
    const relevantFeedback = feedbacks.filter((f) => 
      f.messageText.toLowerCase().includes(tone.toLowerCase()));
    
    const positiveCount = relevantFeedback.filter((f) => f.feedback === "positive").length;
    
    return {
      tone,
      positiveRate: relevantFeedback.length > 0 
        ? Math.round((positiveCount / relevantFeedback.length) * 100) 
        : 0,
      feedbackCount: relevantFeedback.length,
    };
  }).sort((a, b) => b.positiveRate - a.positiveRate);
}

/**
 * Generate recommendations based on feedback patterns
 */
function generateRecommendations(
  persona: ChatbotPersona,
  feedbacks: ChatbotMessageFeedback[]
): string[] {
  const recommendations: string[] = [];
  
  // If there's enough feedback to analyze
  if (feedbacks.length >= 10) {
    // Check positive/negative ratio
    const positiveCount = feedbacks.filter((f) => f.feedback === "positive").length;
    const positiveRate = Math.round((positiveCount / feedbacks.length) * 100);
    
    if (positiveRate < 50) {
      recommendations.push(
        "This persona has a high negative feedback rate. Consider revising the tone or examples."
      );
    }
    
    // Check for common patterns in negative feedback
    const negativeFeedbacks = feedbacks.filter((f) => f.feedback === "negative");
    if (negativeFeedbacks.length >= 3) {
      // In a real system, this would use NLP to find common phrases
      recommendations.push(
        "Review negative feedback comments for patterns to improve messaging."
      );
    }
  } else if (feedbacks.length === 0) {
    recommendations.push(
      "No feedback data yet. Encourage users to provide feedback on messages."
    );
  } else {
    recommendations.push(
      "More feedback data is needed for comprehensive analysis."
    );
  }
  
  return recommendations;
}

export interface PersonaFeedbackAnalysis {
  persona: ChatbotPersona | null;
  stats: {
    totalFeedback: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    positivePercentage: number;
  };
  samples: {
    positive: ChatbotMessageFeedback[];
    negative: ChatbotMessageFeedback[];
  };
  tonePerformance: TonePerformance[];
  recommendations: string[];
} 