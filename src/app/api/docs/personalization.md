# DM Personalization API Reference

This document provides technical details on how to use personalization with fallback chains in the OFAuto DM Campaigns API.

## Overview

The personalization system allows dynamic content insertion into DM templates using variables. The fallback chain feature ensures graceful degradation when some data is missing, maintaining a personalized feel for all messages.

## Endpoints

### Create DM Campaign

```
POST /api/dm-campaigns
```

Creates a new DM campaign with personalized message templates.

#### Request Body
```json
{
  "name": "Welcome Campaign",
  "platform": "onlyfans",
  "targetAudience": "New followers",
  "messageTemplate": "Hey {{firstName|username|\"friend\"}}, thanks for following me on {{platform}}!",
  "startDate": "2023-12-01T00:00:00Z",
  "endDate": "2023-12-31T23:59:59Z",
  "personalization": {
    "firstName": "User",
    "platform": "OnlyFans"
  }
}
```

#### Response
```json
{
  "id": "campaign_123456",
  "name": "Welcome Campaign",
  "status": "DRAFT",
  "messageTemplate": "Hey {{firstName|username|\"friend\"}}, thanks for following me on {{platform}}!",
  "createdAt": "2023-11-20T15:30:00Z",
  "updatedAt": "2023-11-20T15:30:00Z"
}
```

### Schedule a DM with Personalization

```
POST /api/dm-campaigns/{campaignId}/schedule
```

Schedules a DM for a specific target with personalized content.

#### Request Body
```json
{
  "target": {
    "userId": "user123",
    "username": "john_doe"
  },
  "scheduledDate": "2023-12-01T10:00:00Z",
  "personalization": {
    "firstName": "John",
    "offerCode": "SPECIAL25"
  }
}
```

#### Response
```json
{
  "id": "dm_message_789012",
  "status": "SCHEDULED",
  "scheduledDate": "2023-12-01T10:00:00Z",
  "content": "Hey John, thanks for following me on OnlyFans!",
  "createdAt": "2023-11-20T15:35:00Z"
}
```

## Personalization Data Structure

Personalization data is a simple key-value map that associates variable names with their values:

```json
{
  "firstName": "John",
  "username": "john_doe",
  "platform": "OnlyFans",
  "offerCode": "SPECIAL25"
}
```

## Fallback Chain Syntax

Fallback chains use the pipe character (`|`) to separate variables in order of priority:

```
{{firstName|username|"friend"}}
```

In this example:
1. If `firstName` has a value, it will be used
2. If `firstName` is empty or not provided, `username` will be used
3. If both are empty, the literal string "friend" will be used

## Personalization Process

When a message is sent, the following process occurs:

1. The system merges personalization data from multiple sources in this order of precedence:
   - Message-specific personalization data
   - Campaign-level personalization data

2. For each variable or fallback chain in the template:
   - The system tries each variable in the chain from left to right
   - The first non-empty value is used for substitution
   - If all values are empty, an empty string is used (or a global default if configured)

3. The final personalized message is sent to the target

## Error Handling

If a required personalization variable is missing and no valid fallback is available, the behavior depends on the environment:

- In development: The variable placeholder is preserved for debugging (e.g., `{{missingVar}}`)
- In production: The variable is replaced with an empty string or global fallback

## Best Practices

1. Always provide campaign-level fallback values for critical variables
2. Use fallback chains for variables that are essential to message flow
3. Include a literal string fallback as the last option in critical chains
4. Test your templates with the preview feature before activating campaigns
5. Keep personalization variable names simple and consistent across templates

## Example Templates

### Welcome Message
```
Hey {{firstName|username|"there"}}, thanks for following me on {{platform}}!
Check out my exclusive content {{subscriptionDays|"soon"}}!
```

### Re-engagement Message
```
Hi {{firstName|username|"follower"}},

I noticed you haven't been active for {{inactiveDays|"a while"}}. 
I'm sharing {{contentType|"special content"}} that I think you'd enjoy!

- {{creatorName}}
```

### Subscription Renewal
```
Your subscription is expiring in {{expirationDays|"a few days"}}!
Renew now to continue enjoying {{contentType|"premium content"}}
and get {{discount|"exclusive offers"}}!
``` 