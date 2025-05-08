'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SuccessStory, SuccessTracker } from '@/lib/ai-strategy/success-tracker';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function SuccessStoriesPanel({ clientId }: { clientId?: string }) {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStories() {
      try {
        const tracker = new SuccessTracker();
        const successStories = await tracker.getSuccessStories(clientId);
        setStories(successStories);
      } catch (error) {
        console.error('Failed to load success stories:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStories();
  }, [clientId]);

  if (loading) {
    return <div className="p-8 text-center">Loading success stories...</div>;
  }

  if (stories.length === 0) {
    return <div className="p-8 text-center">No success stories available.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {stories.map((story) => (
        <Card key={story.id} className="overflow-hidden">
          {story.imageUrl && (
            <div className="relative h-48 w-full">
              <Image 
                src={story.imageUrl} 
                alt={story.title} 
                fill 
                className="object-cover"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle>{story.title}</CardTitle>
            <CardDescription>{story.industry}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-2">{story.description}</p>
            <div className="font-semibold text-green-600 mb-2">Result: {story.result}</div>
            <Badge variant="outline" className="mr-2">{story.strategyType}</Badge>
            <Badge variant="secondary">ROI: {story.roi}%</Badge>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">View Details</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 