import { ChatbotPersona } from "@prisma/client";

/**
 * Generate a dynamic system prompt for AI chatbot based on persona and context
 * @param persona ChatbotPersona configuration
 * @param context Additional context about the conversation or user
 * @returns Formatted system prompt string
 */
export function generateChatbotPrompt(
  persona: ChatbotPersona,
  context?: string
): string {
  // Core personality description
  let prompt = `You are a chatbot with a ${persona.toneKeywords.join(", ")} tone. `;
  
  // Purpose and goal
  prompt += `Your job is to message new followers with emotionally engaging but natural language. `;
  
  // General guidance
  prompt += `Avoid sounding robotic or repetitive. Use authentic, conversational language that feels personal. `;
  
  // If examples exist, reference them
  if (persona.examples && persona.examples.length > 0) {
    prompt += `Use responses similar to these examples:\n\n`;
    
    // Add each example
    persona.examples.forEach((example, index) => {
      prompt += `Example ${index + 1}: "${example}"\n`;
    });
    
    prompt += `\n`;
  }
  
  // Add contextual information if provided
  if (context) {
    prompt += `Context about the user: ${context}\n\n`;
  }
  
  // Final instructions
  prompt += `Keep messages concise, engaging, and authentic to the ${persona.name} personality type. `;
  prompt += `Your goal is to make the user feel valued and interested in continuing the conversation.`;
  
  return prompt;
}

/**
 * Generate multiple message variants based on a persona
 * @param persona ChatbotPersona configuration
 * @param userContext Optional context about the user
 * @param count Number of message variants to generate
 * @returns Array of message strings
 */
export function generateMessageVariants(
  persona: ChatbotPersona,
  userContext?: string,
  count: number = 3
): string[] {
  // This would normally call an LLM API to generate messages
  // For now, we'll return sample messages based on persona
  
  const messages: string[] = [];
  const greeting = getRandomGreeting(persona);
  
  for (let i = 0; i < count; i++) {
    if (persona.examples && persona.examples.length > i) {
      // Use example if available
      messages.push(persona.examples[i]);
    } else {
      // Generate a simple message based on tone
      const message = `${greeting} Thanks for following! I'm excited to connect with you.`;
      messages.push(message);
    }
  }
  
  return messages;
}

/**
 * Helper function to get a random greeting based on persona tone
 */
function getRandomGreeting(persona: ChatbotPersona): string {
  const flirtyGreetings = ["Hey there 😉", "Well hello there 💕", "Heyyy"];
  const friendlyGreetings = ["Hi there!", "Hey!", "Hello!"];
  const formalGreetings = ["Hello,", "Greetings,", "Good day,"];
  const casualGreetings = ["Hey!", "What's up?", "Howdy!"];
  
  const tones = persona.toneKeywords.map(t => t.toLowerCase());
  
  if (tones.some(t => ["flirty", "romantic", "seductive"].includes(t))) {
    return flirtyGreetings[Math.floor(Math.random() * flirtyGreetings.length)];
  }
  
  if (tones.some(t => ["formal", "professional", "serious"].includes(t))) {
    return formalGreetings[Math.floor(Math.random() * formalGreetings.length)];
  }
  
  if (tones.some(t => ["casual", "chill", "relaxed"].includes(t))) {
    return casualGreetings[Math.floor(Math.random() * casualGreetings.length)];
  }
  
  return friendlyGreetings[Math.floor(Math.random() * friendlyGreetings.length)];
} 