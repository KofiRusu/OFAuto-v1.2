import React, { useState } from 'react';
import Link from 'next/link';

interface CampaignItem {
  id: string;
  title: string;
  type: 'post' | 'dm' | 'experiment';
  platform: string;
  scheduledFor: Date;
  status: string;
}

export default function PlannerPage() {
  const [view, setView] = useState<'calendar' | 'kanban'>('calendar');
  
  // Mock data for demonstration
  const items: CampaignItem[] = [
    {
      id: '1',
      title: 'Weekly promotion post',
      type: 'post',
      platform: 'onlyfans',
      scheduledFor: new Date(2023, 5, 15, 12, 0),
      status: 'scheduled',
    },
    {
      id: '2',
      title: 'New subscriber welcome message',
      type: 'dm',
      platform: 'fansly',
      scheduledFor: new Date(2023, 5, 16, 9, 0),
      status: 'scheduled',
    },
    {
      id: '3',
      title: 'Content pricing A/B test',
      type: 'experiment',
      platform: 'patreon',
      scheduledFor: new Date(2023, 5, 17, 14, 30),
      status: 'scheduled',
    },
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-blue-500 hover:underline">
          &larr; Back to Home
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campaign Planner</h1>
        <div>
          <button 
            className={`px-4 py-2 mr-2 rounded ${view === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setView('calendar')}
          >
            Calendar
          </button>
          <button 
            className={`px-4 py-2 rounded ${view === 'kanban' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setView('kanban')}
          >
            Kanban
          </button>
        </div>
      </div>
      
      {view === 'calendar' ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Calendar View</h2>
          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 font-medium">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="border rounded-md h-32 p-2 overflow-y-auto">
                <div className="text-right text-sm text-gray-500 mb-1">{i + 1}</div>
                {i === 14 && (
                  <div className="bg-blue-100 p-2 rounded-md mb-1 text-sm">
                    <div className="font-medium">{items[0].title}</div>
                    <div className="text-xs text-gray-600">12:00 PM</div>
                  </div>
                )}
                {i === 15 && (
                  <div className="bg-yellow-100 p-2 rounded-md mb-1 text-sm">
                    <div className="font-medium">{items[1].title}</div>
                    <div className="text-xs text-gray-600">9:00 AM</div>
                  </div>
                )}
                {i === 16 && (
                  <div className="bg-green-100 p-2 rounded-md mb-1 text-sm">
                    <div className="font-medium">{items[2].title}</div>
                    <div className="text-xs text-gray-600">2:30 PM</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Kanban View</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-3 text-blue-700">Scheduled</h3>
              {items.map(item => (
                <div key={item.id} className="bg-white border p-3 rounded-md mb-2 shadow-sm">
                  <div className="flex justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      item.type === 'post' ? 'bg-blue-100 text-blue-800' : 
                      item.type === 'dm' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      item.platform === 'onlyfans' ? 'bg-red-100 text-red-800' : 
                      item.platform === 'fansly' ? 'bg-purple-100 text-purple-800' : 
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {item.platform}
                    </span>
                  </div>
                  <h4 className="font-medium mb-1">{item.title}</h4>
                  <div className="text-xs text-gray-600">
                    {item.scheduledFor.toLocaleDateString()} at {item.scheduledFor.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              ))}
            </div>
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-3 text-yellow-700">In Progress</h3>
              <div className="border border-dashed rounded-md p-6 flex items-center justify-center text-gray-400">
                No items
              </div>
            </div>
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-3 text-green-700">Completed</h3>
              <div className="border border-dashed rounded-md p-6 flex items-center justify-center text-gray-400">
                No items
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 