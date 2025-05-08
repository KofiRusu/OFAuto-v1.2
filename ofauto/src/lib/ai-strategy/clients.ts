import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Initialize OpenAI client
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Anthropic client
export const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}); 