import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validate metrics schema
const metricsSchema = z.object({
  impressions: z.number().optional(),
  clicks: z.number().optional(),
  conversions: z.number().optional(),
  revenue: z.number().optional(),
  cost: z.number().optional(),
  roi: z.number().optional(),
  ctr: z.number().optional(),
  conversionRate: z.number().optional(),
  engagements: z.number().optional(),
  reach: z.number().optional(),
  // Platform-specific metrics
  platformMetrics: z.record(z.string(), z.any()).optional()
});

// Get campaign metrics
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
      columns: {
        id: true,
        name: true,
        metrics: true
      }
    });
    
    if (!campaign) {
      return NextResponse.json(
        { message: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(campaign.metrics || {});
  } catch (error) {
    console.error('Error fetching campaign metrics:', error);
    return NextResponse.json(
      { message: 'Failed to fetch campaign metrics' },
      { status: 500 }
    );
  }
}

// Update campaign metrics
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    // Validate metrics data
    const validatedMetrics = metricsSchema.parse(body);
    
    // Get existing campaign
    const existingCampaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
      columns: {
        id: true,
        name: true,
        metrics: true,
        userId: true,
        clientId: true
      }
    });
    
    if (!existingCampaign) {
      return NextResponse.json(
        { message: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Merge new metrics with existing ones
    const currentMetrics = existingCampaign.metrics || {};
    const updatedMetrics = {
      ...currentMetrics,
      ...validatedMetrics,
      // Calculate derived metrics
      ctr: validatedMetrics.clicks && validatedMetrics.impressions 
        ? (validatedMetrics.clicks / validatedMetrics.impressions) * 100 
        : currentMetrics.ctr,
      conversionRate: validatedMetrics.conversions && validatedMetrics.clicks 
        ? (validatedMetrics.conversions / validatedMetrics.clicks) * 100 
        : currentMetrics.conversionRate,
      roi: validatedMetrics.revenue && validatedMetrics.cost 
        ? ((validatedMetrics.revenue - validatedMetrics.cost) / validatedMetrics.cost) * 100 
        : currentMetrics.roi,
      lastUpdated: new Date().toISOString()
    };
    
    // Update campaign with new metrics
    const [updatedCampaign] = await db.update(campaigns)
      .set({
        metrics: updatedMetrics,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, id))
      .returning();
    
    // Emit real-time event for metrics update
    // @ts-ignore - req.emitCampaignMetricsUpdate exists but isn't typed in the Request
    if (req.emitCampaignMetricsUpdate) {
      // @ts-ignore
      req.emitCampaignMetricsUpdate({
        campaignId: id,
        name: existingCampaign.name,
        metrics: updatedMetrics,
        userId: existingCampaign.userId,
        clientId: existingCampaign.clientId
      });
    }
    
    return NextResponse.json(updatedMetrics);
  } catch (error) {
    console.error('Error updating campaign metrics:', error);
    
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
      { message: 'Failed to update campaign metrics' },
      { status: 500 }
    );
  }
} 