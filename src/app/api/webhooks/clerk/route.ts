import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET env var");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");
  
  // If there are no svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }
  
  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);
  
  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);
  
  let evt: WebhookEvent;
  
  try {
    // Verify the webhook
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json({ error: "Error verifying webhook" }, { status: 400 });
  }
  
  const eventType = evt.type;
  
  // Handle the event
  try {
    switch (eventType) {
      case "user.created": {
        const { id, email_addresses, first_name, last_name } = evt.data;
        
        // Create a new user in your database
        await prisma.user.create({
          data: {
            clerkId: id,
            email: email_addresses[0].email_address,
            name: [first_name, last_name].filter(Boolean).join(' '),
            role: UserRole.USER, // Default role for new users
          },
        });
        
        break;
      }
      
      case "user.updated": {
        const { id, email_addresses, first_name, last_name } = evt.data;
        
        // Update user data
        await prisma.user.update({
          where: { clerkId: id },
          data: {
            email: email_addresses[0].email_address,
            name: [first_name, last_name].filter(Boolean).join(' '),
          },
        });
        
        break;
      }
      
      case "user.deleted": {
        const { id } = evt.data;
        
        // Delete the user from your database
        await prisma.user.delete({
          where: { clerkId: id },
        });
        
        break;
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook event:", error);
    return NextResponse.json(
      { error: "Error processing webhook event" },
      { status: 500 }
    );
  }
} 