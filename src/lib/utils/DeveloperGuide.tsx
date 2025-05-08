## Campaign Planner

The Campaign Planner module provides a visual interface for managing scheduled content across multiple platforms.

### Key Components

- `CampaignPlanner`: The main component that displays scheduled items in calendar or kanban view
- `CalendarGrid`: Displays items in a monthly or weekly calendar format
- `KanbanBoard`: Shows items in columns based on status (draft, scheduled, in progress, etc.)
- `CampaignCard`: Reusable card component for displaying post/DM/experiment information

### Data Flow

The Campaign Planner uses a unified `CampaignItem` type to represent different content types:

```typescript
export type CampaignItem = {
  id: string;
  title: string;
  type: 'post' | 'dm' | 'experiment';
  platform: string;
  scheduledFor: Date;
  status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'draft';
  content?: string;
  mediaUrls?: string[];
  recipientCount?: number;
  experimentVariant?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

The backend provides a helper function `getAllCampaignItems(clientId)` that aggregates data from:
- `ScheduledPost`
- `AutoDMTask`
- `CampaignExperiment`

### Adding New Post Types

To add a new content type to the planner:

1. Update the `campaignItemSchema` in `campaignPlanner.ts` with new properties
2. Add a new mapping function in `mapToCampaignItem` to convert your database entity
3. Update the query in `getAllCampaignItems` to include your new content type
4. Add UI support in `CampaignCard.tsx` for the new type

### Extending the Campaign Planner

Future improvements might include:
- Drag-and-drop to reschedule items in calendar view
- Team collaboration features with user assignments
- Analytics overlays to show performance metrics
- Bulk editing and multi-select functionality 