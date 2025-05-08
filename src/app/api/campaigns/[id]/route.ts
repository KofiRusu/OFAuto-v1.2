import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/shared/schema';
import { insertCampaignSchema } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Get a single campaign by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
      with: {
        client: true
      }
    });
    
    if (!campaign) {
      return NextResponse.json(
        { message: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { message: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

// Update a campaign
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    // Validate request body
    const validatedData = insertCampaignSchema.partial().parse(body);
    
    // Check if campaign exists
    const existingCampaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id)
    });
    
    if (!existingCampaign) {
      return NextResponse.json(
        { message: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Update campaign
    const [updatedCampaign] = await db.update(campaigns)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, id))
      .returning();
    
    // Emit real-time event for campaign update
    // @ts-ignore - req.emitCampaignUpdate exists but isn't typed in the Request
    if (req.emitCampaignUpdate) {
      // @ts-ignore
      req.emitCampaignUpdate({
        type: 'updated',
        campaignId: updatedCampaign.id,
        name: updatedCampaign.name,
        userId: updatedCampaign.userId,
        clientId: updatedCampaign.clientId
      });
    }
    
    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    
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
      { message: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// Delete a campaign
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if campaign exists
    const existingCampaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id)
    });
    
    if (!existingCampaign) {
      return NextResponse.json(
        { message: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Capture campaign data before deletion (for WebSocket event)
    const { name, userId, clientId } = existingCampaign;
    
    // Delete campaign
    await db.delete(campaigns).where(eq(campaigns.id, id));
    
    // Emit real-time event for campaign deletion
    // @ts-ignore - req.emitCampaignUpdate exists but isn't typed in the Request
    if (req.emitCampaignUpdate) {
      // @ts-ignore
      req.emitCampaignUpdate({
        type: 'deleted',
        campaignId: id,
        name,
        userId,
        clientId
      });
    }
    
    return NextResponse.json(
      { message: 'Campaign deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { message: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
} 