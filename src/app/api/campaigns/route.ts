import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/shared/schema';
import { insertCampaignSchema } from '@/shared/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';
import { z } from 'zod';

// Get all campaigns with optional filtering
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    const platform = url.searchParams.get('platform');
    const status = url.searchParams.get('status');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    let query = db.select().from(campaigns);
    
    // Apply filters if provided
    if (clientId) {
      query = query.where(eq(campaigns.clientId, clientId));
    }
    
    if (platform) {
      query = query.where(eq(campaigns.platform, platform));
    }
    
    if (status) {
      query = query.where(eq(campaigns.status, status));
    }
    
    if (fromDate) {
      query = query.where(gte(campaigns.startDate, new Date(fromDate)));
    }
    
    if (toDate) {
      query = query.where(lte(campaigns.endDate, new Date(toDate)));
    }
    
    // Apply sorting
    if (sortOrder === 'desc') {
      query = query.orderBy(desc(campaigns[sortBy as keyof typeof campaigns]));
    } else {
      query = query.orderBy(asc(campaigns[sortBy as keyof typeof campaigns]));
    }
    
    const campaigns = await query;
    
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { message: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// Create a new campaign
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validatedData = insertCampaignSchema.parse(body);
    
    // Initialize empty metrics for new campaign
    const campaignData = {
      ...validatedData,
      metrics: validatedData.metrics || {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        cost: 0,
        roi: 0
      }
    };
    
    // Insert campaign into database
    const [newCampaign] = await db.insert(campaigns)
      .values(campaignData)
      .returning();
    
    // Emit real-time event for campaign creation
    // @ts-ignore - req.emitCampaignUpdate exists but isn't typed in the Request
    if (req.emitCampaignUpdate) {
      // @ts-ignore
      req.emitCampaignUpdate({
        type: 'created',
        campaignId: newCampaign.id,
        name: newCampaign.name,
        userId: newCampaign.userId,
        clientId: newCampaign.clientId
      });
    }
    
    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: error.errors 
        }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Failed to create campaign' }, 
      { status: 500 }
    );
  }
} 