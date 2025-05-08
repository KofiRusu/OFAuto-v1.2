import ChatbotSettings from "@/components/ChatbotSettings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chatbot Settings | OFAuto",
  description: "Configure your chatbot personality and messaging style",
};

export default function ChatbotSettingsPage() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
      <ChatbotSettings />
    </div>
  );
} 