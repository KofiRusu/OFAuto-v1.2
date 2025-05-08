import { Metadata } from "next";
import FollowerInteractionsList from "@/components/FollowerInteractionsList";

export const metadata: Metadata = {
  title: "Follower Interactions | OFAuto",
  description: "View and manage your follower interactions",
};

export default function FollowerInteractionsPage() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Follower Interactions</h2>
        <p className="text-muted-foreground">
          View sent messages and provide feedback to improve your chatbot
        </p>
      </div>
      
      <div className="space-y-4">
        <FollowerInteractionsList />
      </div>
    </div>
  );
} 