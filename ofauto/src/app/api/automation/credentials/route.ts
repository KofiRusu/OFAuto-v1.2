import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { CredentialService } from "@/lib/execution-agent/credential-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse the request body
    const { platformId, credentials } = await req.json();

    if (!platformId || !credentials) {
      return new NextResponse("Missing platformId or credentials", { status: 400 });
    }

    // Check if the platform exists and belongs to the user
    const platform = await prisma.platform.findFirst({
      where: {
        id: platformId,
        user: {
          clerkId: userId,
        },
      },
    });

    if (!platform) {
      return new NextResponse("Platform not found or unauthorized", { status: 404 });
    }

    // Validate the credentials against required fields
    const credentialService = CredentialService.getInstance();
    const missingFields = credentialService.validateCredentialSet(
      platform.platformType.toUpperCase() as any,
      credentials
    );

    if (missingFields.length > 0) {
      return new NextResponse(
        `Missing required credentials: ${missingFields.join(", ")}`,
        { status: 400 }
      );
    }

    // Store the credentials
    const success = await credentialService.storeCredentials(platformId, credentials);

    if (!success) {
      return new NextResponse("Failed to store credentials", { status: 500 });
    }

    return new NextResponse("Credentials stored successfully", { status: 200 });
  } catch (error) {
    console.error("[CREDENTIALS_POST]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const platformId = searchParams.get("platformId");

    if (!platformId) {
      return new NextResponse("Missing platformId parameter", { status: 400 });
    }

    // Check if the platform exists and belongs to the user
    const platform = await prisma.platform.findFirst({
      where: {
        id: platformId,
        user: {
          clerkId: userId,
        },
      },
    });

    if (!platform) {
      return new NextResponse("Platform not found or unauthorized", { status: 404 });
    }

    // Get required credentials for this platform type
    const credentialService = CredentialService.getInstance();
    const requiredCredentials = credentialService.getRequiredCredentials(
      platform.platformType.toUpperCase() as any
    );

    // Get stored credentials
    const storedCredentials = await credentialService.getCredentials(platformId);

    // Check which credentials are missing
    const missingCredentials = requiredCredentials.filter(key => !storedCredentials[key]);

    return NextResponse.json({
      platformId,
      platformType: platform.platformType,
      requiredCredentials,
      storedCredentials: Object.keys(storedCredentials),
      missingCredentials,
      isComplete: missingCredentials.length === 0,
    });
  } catch (error) {
    console.error("[CREDENTIALS_GET]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const platformId = searchParams.get("platformId");

    if (!platformId) {
      return new NextResponse("Missing platformId parameter", { status: 400 });
    }

    // Check if the platform exists and belongs to the user
    const platform = await prisma.platform.findFirst({
      where: {
        id: platformId,
        user: {
          clerkId: userId,
        },
      },
    });

    if (!platform) {
      return new NextResponse("Platform not found or unauthorized", { status: 404 });
    }

    // Delete the credentials
    const credentialService = CredentialService.getInstance();
    const success = await credentialService.deleteCredentials(platformId);

    if (!success) {
      return new NextResponse("Failed to delete credentials", { status: 500 });
    }

    return new NextResponse("Credentials deleted successfully", { status: 200 });
  } catch (error) {
    console.error("[CREDENTIALS_DELETE]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
} 