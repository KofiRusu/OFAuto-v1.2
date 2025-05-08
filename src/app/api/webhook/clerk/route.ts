import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    return new Response("Error: Missing webhook secret", {
      status: 500,
    });
  }

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", {
      status: 400,
    });
  }

  // Handle the webhook event
  const eventType = evt.type;
  
  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    // Default email is the first in the array
    const emailObject = email_addresses?.[0];
    const email = emailObject?.email_address;
    
    if (!email) {
      return new Response("Error: User missing email", { 
        status: 400 
      });
    }

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (!existingUser) {
        // Create new user
        await prisma.user.create({
          data: {
            id,
            email,
            name: [first_name, last_name].filter(Boolean).join(" "),
            role: UserRole.USER,
          },
        });
        
        console.log(`User created: ${id}`);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      return new Response("Error creating user", { 
        status: 500 
      });
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    // Default email is the first in the array
    const emailObject = email_addresses?.[0];
    const email = emailObject?.email_address;
    
    if (!email) {
      return new Response("Error: User missing email", { 
        status: 400 
      });
    }

    try {
      // Update user info
      await prisma.user.update({
        where: { id },
        data: {
          email,
          name: [first_name, last_name].filter(Boolean).join(" "),
        },
      });
      
      console.log(`User updated: ${id}`);
    } catch (error) {
      console.error("Error updating user:", error);
      return new Response("Error updating user", { 
        status: 500 
      });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    
    try {
      // Delete user (or mark as inactive)
      await prisma.user.delete({
        where: { id },
      });
      
      console.log(`User deleted: ${id}`);
    } catch (error) {
      console.error("Error deleting user:", error);
      return new Response("Error deleting user", { 
        status: 500 
      });
    }
  }

  return NextResponse.json({ success: true });
} 