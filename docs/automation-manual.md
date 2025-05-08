# Campaign Planner

## Overview of getCampaignSchedule()

The `getCampaignSchedule()` function is a unified data fetching mechanism that powers the Visual Campaign Planner. It gathers and normalizes data from multiple content scheduling systems into a consistent format for display in the UI.

### Data Sources

The function aggregates data from three primary sources:

1. **Scheduled Posts** (`ScheduledPost` table)
   - Regular content posts scheduled for platforms like OnlyFans, Fansly, etc.
   - Contains media, captions, and publishing times

2. **Automated DM Tasks** (`AutoDMTask` table)
   - Scheduled direct messages to subscribers or user segments
   - Contains message templates, recipient criteria, and sending times

3. **Campaign Experiments** (`CampaignExperiment` table)
   - A/B tests and other experimental campaign variants
   - Contains test parameters, variant details, and start/end times

### Unified Data Model

All data sources are mapped to a common `CampaignItem` schema to ensure consistent handling in the UI:

```typescript
{
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

### Filtering & Sorting

The function supports filtering by:
- Date range
- Platform
- Content type
- Status

Results are sorted chronologically by default (earliest scheduled items first).

### Usage Example

```typescript
// In a React component:
const { data: campaignItems } = trpc.campaignPlanner.getCampaignSchedule.useQuery({
  clientId: currentClient.id,
  startDate: new Date('2023-06-01'),
  endDate: new Date('2023-06-30'),
  platform: 'onlyfans',
  type: 'post',
  status: 'scheduled'
});
```

### Performance Considerations

- The function uses prisma's `findMany` with filters to efficiently query each data source
- For large datasets, consider implementing pagination by adding `skip` and `take` parameters
- Consider adding caching for frequently accessed date ranges

### Future Extensibility

To add new content types to the Campaign Planner:

1. Create a new database model for your content type
2. Add a new query in the `getAllCampaignItems` helper to fetch your content
3. Implement a mapping function in `mapToCampaignItem` to normalize your data
4. Update the UI components to support your new content type

The unified data model ensures that new content types can be easily integrated into the existing UI without major refactoring. 