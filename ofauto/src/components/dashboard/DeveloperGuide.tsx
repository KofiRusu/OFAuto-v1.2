'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, FileCode, LucideShield, Database, Key, Beaker, Zap, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DeveloperGuide() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <FileCode className="mr-2 h-5 w-5" /> Developer Guide for User-Based API Customization
        </CardTitle>
        <CardDescription>
          Step-by-step instructions for adding new platforms, custom fields, and token management.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="backend">Backend Implementation</TabsTrigger>
            <TabsTrigger value="frontend">Frontend Integration</TabsTrigger>
            <TabsTrigger value="ai-features">AI Features</TabsTrigger>
            <TabsTrigger value="security">Security Best Practices</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <p>
              This guide outlines the process of extending the platform to support additional social media 
              services or content platforms. The OFAuto system is designed to be extensible, allowing new 
              integrations to be added with minimal code changes.
            </p>
            
            <h3 className="text-lg font-medium mt-6">Integration Architecture</h3>
            <p className="mb-4">
              OFAuto uses a layered approach to platform integration:
            </p>
            <ol className="list-decimal list-inside space-y-2 pl-4">
              <li>
                <strong>Credential Management Layer:</strong> Securely stores platform tokens/credentials
              </li>
              <li>
                <strong>Platform API Layer:</strong> Handles communication with external platforms
              </li>
              <li>
                <strong>Business Logic Layer:</strong> Implements core functionality using platform APIs
              </li>
              <li>
                <strong>User Interface Layer:</strong> Provides UI components for managing integrations
              </li>
              <li>
                <strong>AI Services Layer:</strong> Powers insights, personalization, and A/B testing
              </li>
            </ol>
            
            <h3 className="text-lg font-medium mt-6">Key Components</h3>
            <p className="mb-4">
              When adding a new platform, you'll need to modify these key components:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Database Schema:</strong> The ClientCredential table stores platform credentials
              </li>
              <li>
                <strong>tRPC Router:</strong> The platformConnections.ts router handles CRUD operations
              </li>
              <li>
                <strong>UI Components:</strong> ConnectedAccountsSection.tsx and ConnectPlatformModal.tsx 
              </li>
              <li>
                <strong>Platform-specific API Clients:</strong> Custom logic for platform authentication and API calls
              </li>
              <li>
                <strong>AI Features:</strong> reasoningService.ts, experiments, and personalization
              </li>
            </ul>
            
            <Alert className="mt-6">
              <LucideShield className="h-4 w-4" />
              <AlertTitle>Environment Variable Requirements</AlertTitle>
              <AlertDescription>
                New platforms may require additional environment variables. Ensure these are documented and 
                added to .env.example files. Key environment variables already used:
                <ul className="list-disc list-inside mt-2 pl-4">
                  <li><code>PLATFORM_CREDENTIAL_SECRET</code> - 64-character hex key for credential encryption</li>
                  <li><code>NEXT_PUBLIC_</code> prefixed variables for client-side configuration</li>
                  <li><code>OPENAI_API_KEY</code> - API key for OpenAI integration</li>
                  <li><code>ANTHROPIC_API_KEY</code> - API key for Anthropic integration (alternative to OpenAI)</li>
                  <li><code>LLM_PROVIDER</code> - Either 'openai' or 'anthropic'</li>
                  <li><code>LLM_MODEL</code> - Model name (e.g., 'gpt-4' or 'claude-2')</li>
                  <li>Platform-specific OAuth credentials (client IDs, secrets)</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          {/* Backend Implementation Tab */}
          <TabsContent value="backend" className="space-y-4">
            <h3 className="text-lg font-medium mb-4">1. Update Schema Type Definition</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto my-4">
              <pre className="text-sm text-gray-800">
                <code>{`// In src/lib/trpc/routers/platformConnections.ts
const platformTypeSchema = z.enum(['patreon', 'kofi', 'fansly', 'onlyfans', 'instagram']);
type PlatformType = z.infer<typeof platformTypeSchema>;`}</code>
              </pre>
            </div>
            
            <h3 className="text-lg font-medium mb-4">2. Create Platform-Specific Input Schema</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto my-4">
              <pre className="text-sm text-gray-800">
                <code>{`// Example for a platform using OAuth
const connectOAuthPlatformSchema = z.object({
  clientId: z.string(),
  platformType: z.literal('instagram'),
  accessToken: z.string().min(1, "Access token cannot be empty"),
  refreshToken: z.string().optional(),
  tokenExpiry: z.number().optional(),
});`}</code>
              </pre>
            </div>
            
            <h3 className="text-lg font-medium mb-4">3. Add Platform Connection Procedure</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto my-4">
              <pre className="text-sm text-gray-800">
                <code>{`// In the platformConnectionsRouter
connectInstagram: protectedProcedure
  .input(connectOAuthPlatformSchema)
  .mutation(async ({ ctx, input }) => {
    const { userId } = ctx;
    const { clientId, platformType, accessToken, refreshToken, tokenExpiry } = input;

    // Verify user has access to this clientId
    // ... ownership verification code

    // Store credentials
    const credentialToEncrypt = JSON.stringify({ 
      accessToken, 
      refreshToken, 
      tokenExpiry,
    });

    const encryptedData = encryptCredential(credentialToEncrypt);
    if (!encryptedData) {
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: 'Encryption failed' 
      });
    }

    await prisma.clientCredential.upsert({
      where: { clientId_platformType: { clientId, platformType } },
      update: {
        credential: encryptedData.encrypted,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
      },
      create: {
        clientId,
        platformType,
        credential: encryptedData.encrypted,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
      },
    });
    
    return { success: true, platform: platformType };
  }),`}</code>
              </pre>
            </div>
            
            <h3 className="text-lg font-medium mb-4">4. Create Platform API Client</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto my-4">
              <pre className="text-sm text-gray-800">
                <code>{`// src/lib/platforms/instagram.ts
import { prisma } from "@/lib/prisma";
import { decryptCredential } from "@/lib/security";

export class InstagramClient {
  private accessToken: string | null = null;
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  async initialize() {
    // Fetch credentials from database
    const credential = await prisma.clientCredential.findUnique({
      where: { 
        clientId_platformType: { 
          clientId: this.clientId, 
          platformType: 'instagram' 
        } 
      },
    });

    if (!credential) {
      throw new Error('Instagram credentials not found');
    }

    // Decrypt credentials
    const decrypted = decryptCredential({
      encrypted: credential.credential,
      iv: credential.iv,
      authTag: credential.authTag,
    });

    if (!decrypted) {
      throw new Error('Failed to decrypt Instagram credentials');
    }

    const { accessToken } = JSON.parse(decrypted);
    this.accessToken = accessToken;
  }

  // API methods for Instagram operations
  async getProfile() {
    if (!this.accessToken) await this.initialize();
    
    // API call implementation
    // const response = await fetch(...)
    // return response.json();
  }

  // Additional API methods...
}`}</code>
              </pre>
            </div>
            
            <Alert className="mt-6">
              <Database className="h-4 w-4" />
              <AlertTitle>Database Considerations</AlertTitle>
              <AlertDescription>
                No schema changes are typically needed to add a new platform. The ClientCredential model 
                already supports any platform type with a flexible credential storage design. Just update
                the platform type enum to include your new platform.
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          {/* Frontend Integration Tab */}
          <TabsContent value="frontend" className="space-y-4">
            <h3 className="text-lg font-medium mb-4">1. Update Platform Configuration</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto my-4">
              <pre className="text-sm text-gray-800">
                <code>{`// In ConnectedAccountsSection.tsx
const PLATFORMS = [
  { id: 'patreon', name: 'Patreon', icon: 'patreon-icon.svg', requiresOAuth: true },
  { id: 'kofi', name: 'Ko-fi', icon: 'kofi-icon.svg', requiresApiKey: true },
  { id: 'fansly', name: 'Fansly', icon: 'fansly-icon.svg', requiresUserPass: true },
  { id: 'onlyfans', name: 'OnlyFans', icon: 'onlyfans-icon.svg', requiresUserPass: true },
  // Add your new platform
  { id: 'instagram', name: 'Instagram', icon: 'instagram-icon.svg', requiresOAuth: true },
] as const;`}</code>
              </pre>
            </div>
            
            <h3 className="text-lg font-medium mb-4">2. Add Connection Form UI</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto my-4">
              <pre className="text-sm text-gray-800">
                <code>{`// In ConnectPlatformModal.tsx
// Add to the form renderer section
{platformType === 'instagram' && (
  <div className="text-center py-4">
    <p className="text-sm text-muted-foreground mb-4">
      Instagram requires connecting through their secure OAuth process.
    </p>
    <Button 
      type="button"
      onClick={() => onSubmit({} as FormData)}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Connect via Instagram
    </Button>
  </div>
)}`}</code>
              </pre>
            </div>
            
            <h3 className="text-lg font-medium mb-4">3. Implement OAuth Flow (for OAuth platforms)</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto my-4">
              <pre className="text-sm text-gray-800">
                <code>{`// For OAuth platforms, implement API routes
// src/app/api/connect/instagram/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get('clientId');
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing client ID' },
      { status: 400 }
    );
  }
  
  // Generate OAuth URL
  const redirectUri = \`\${process.env.NEXT_PUBLIC_APP_URL}/api/connect/instagram/callback\`;
  const oauthUrl = \`https://api.instagram.com/oauth/authorize?client_id=\${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=\${redirectUri}&scope=user_profile,user_media&response_type=code&state=\${clientId}\`;
  
  return NextResponse.redirect(oauthUrl);
}

// And implement a callback handler:
// src/app/api/connect/instagram/callback/route.ts`}</code>
              </pre>
            </div>
            
            <h3 className="text-lg font-medium mb-4">4. Add the connection handler to onSubmit</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto my-4">
              <pre className="text-sm text-gray-800">
                <code>{`// In ConnectPlatformModal.tsx, add to onSubmit function
else if (platformType === 'instagram') {
  // Redirect to OAuth endpoint
  window.location.href = \`/api/connect/instagram?clientId=\${clientId}\`;
  onClose();
}`}</code>
              </pre>
            </div>
            
            <h3 className="text-lg font-medium mb-4">5. Add to SocialMediaIntegrationSection (if applicable)</h3>
            <p>
              If your platform is a social media service, also update the SocialMediaIntegrationSection.tsx 
              component to include the new platform in its list of available services.
            </p>
          </TabsContent>
          
          {/* AI Features Tab */}
          <TabsContent value="ai-features" className="space-y-4">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              AI-Powered Insights System
            </h3>
            <p className="mb-4">
              The AI insights system provides data-driven recommendations based on analytics data and user behavior.
              It's built around a reasoning service that leverages LLMs (Large Language Models) to generate actionable insights.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-amber-50 p-5 rounded-lg border border-amber-100">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Insight Generation
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li><strong>Key Files:</strong> reasoningService.ts, callLLM.ts, insights.ts router</li>
                  <li><strong>Data Flow:</strong> Gather context → Format prompt → Call LLM → Parse response → Store in database</li>
                  <li><strong>Insight Types:</strong> Content strategy, revenue growth, engagement tactics, etc.</li>
                  <li><strong>Database:</strong> Insights stored in the Insight model with metadata</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Beaker className="h-4 w-4 text-purple-500" />
                  A/B Testing Framework
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li><strong>Key Files:</strong> CampaignExperiment model, experiments page, conclusion generation</li>
                  <li><strong>Data Flow:</strong> Create experiment → Collect data → Analyze results → Generate conclusion</li>
                  <li><strong>Features:</strong> Multi-variant testing, automatic performance analysis</li>
                  <li><strong>Database:</strong> CampaignExperiment model linked to Client model</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-100">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Advanced Personalization
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li><strong>Key Files:</strong> ClientPersona model, personalization page</li>
                  <li><strong>Data Flow:</strong> Define persona → Store preferences → Generate tailored insights</li>
                  <li><strong>Features:</strong> Target audience definition, brand voice, content preferences</li>
                  <li><strong>Database:</strong> ClientPersona model with 1:1 relationship to Client</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Code className="h-4 w-4 text-blue-500" />
                  Workflow Orchestration
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li><strong>Key Files:</strong> ReasoningService with trigger-based actions</li>
                  <li><strong>Data Flow:</strong> Monitor metrics → Trigger conditions → Execute actions</li>
                  <li><strong>Features:</strong> Automated responses to performance changes</li>
                  <li><strong>Integration:</strong> Connects with scheduler for action execution</li>
                </ul>
              </div>
            </div>
            
            <h3 className="text-lg font-medium mt-8 mb-4">Extending A/B Testing Capabilities</h3>
            
            <div className="bg-gray-50 p-4 rounded-md overflow-auto my-4">
              <pre className="text-sm text-gray-800">
                <code>{`// 1. Add a new variant type in CampaignVariant interface (reasoningService.ts)
export interface CampaignVariant {
  id: string;
  description: string;
  content?: string;
  audience?: string;
  pricingModel?: string;
  scheduleTimes?: string[];
  // Add your new variant property here
  customFeature?: string;
}

// 2. Update the campaign variant schema (insights.ts router)
const campaignVariantSchema = z.object({
  id: z.string(),
  description: z.string(),
  content: z.string().optional(),
  audience: z.string().optional(),
  pricingModel: z.string().optional(),
  scheduleTimes: z.array(z.string()).optional(),
  // Add your new variant property validation
  customFeature: z.string().optional(),
});

// 3. Update the ExperimentsPage UI to include the new field
<Input
  placeholder="Custom Feature (optional)"
  value={variant.customFeature || ''}
  onChange={(e) => handleVariantChange(variant.id, 'customFeature', e.target.value)}
/>`}</code>
              </pre>
            </div>
            
            <h3 className="text-lg font-medium mt-8 mb-4">Extending Personalization Features</h3>
            
            <div className="bg-gray-50 p-4 rounded-md overflow-auto my-4">
              <pre className="text-sm text-gray-800">
                <code>{`// 1. Update the ClientPersona interface and schema
export interface ClientPersonaData {
  id: string;
  targetAudience?: string;
  brandVoice?: string;
  preferences?: Record<string, any>;
  engagementPatterns?: Record<string, any>;
  // Add your new personalization field
  contentStrategy?: string;
  createdAt: Date;
}

// 2. Update the client persona schema for validation (insights.ts router)
const clientPersonaSchema = z.object({
  targetAudience: z.string().optional(),
  brandVoice: z.string().optional(),
  preferences: z.record(z.any()).optional(),
  engagementPatterns: z.record(z.any()).optional(),
  // Add your new field validation
  contentStrategy: z.string().optional(),
});

// 3. Update the PersonalizationPage UI to include the new field
<div className="grid gap-2">
  <Label htmlFor="contentStrategy">Content Strategy</Label>
  <Textarea
    id="contentStrategy"
    name="contentStrategy"
    placeholder="Describe your overall content strategy"
    value={personaForm.contentStrategy}
    onChange={handleInputChange}
    rows={3}
  />
</div>`}</code>
              </pre>
            </div>
            
            <h3 className="text-lg font-medium mt-8 mb-4">LLM Integration Best Practices</h3>
            
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Provider Abstraction:</strong> Use the callLLM utility to abstract away provider-specific details
              </li>
              <li>
                <strong>Prompt Engineering:</strong> Structure prompts with clear instructions and output format examples
              </li>
              <li>
                <strong>Response Parsing:</strong> Implement robust parsing with error handling for malformed responses
              </li>
              <li>
                <strong>Fallback Mechanics:</strong> Always include fallbacks for when the LLM API is unavailable
              </li>
              <li>
                <strong>Cache Considerations:</strong> Implement caching for expensive LLM operations
              </li>
            </ul>
            
            <Alert className="mt-6">
              <Database className="h-4 w-4" />
              <AlertTitle>Schema Considerations</AlertTitle>
              <AlertDescription>
                <p>
                  When extending AI features, consider these database design principles:
                </p>
                <ul className="list-disc list-inside mt-2 pl-4">
                  <li>Use flexible JSON fields (like metadata in Insight model) for evolving structures</li>
                  <li>Create explicit foreign key relationships for important entities</li>
                  <li>Design for analytical queries that may span multiple experiments</li>
                  <li>Consider data growth patterns when storing large volumes of experiment data</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          {/* Security Best Practices Tab */}
          <TabsContent value="security" className="space-y-4">
            <h3 className="text-lg font-medium mb-4">Token & Credential Security</h3>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Always use encryption:</strong> All tokens and credentials must be encrypted using the 
                encryptCredential/decryptCredential utilities before storage.
              </li>
              <li>
                <strong>Avoid storing passwords:</strong> Prefer OAuth or API keys over storing user passwords whenever possible.
              </li>
              <li>
                <strong>Never expose tokens:</strong> Never return raw tokens or credentials to the frontend.
              </li>
              <li>
                <strong>Verify user ownership:</strong> Always verify the user has permission to access/modify 
                the clientId they're operating on.
              </li>
            </ul>
            
            <Alert className="mt-6">
              <Key className="h-4 w-4" />
              <AlertTitle>Encryption Implementation</AlertTitle>
              <AlertDescription>
                <p>
                  OFAuto uses AES-256-GCM encryption with a 64-character hex key stored in the PLATFORM_CREDENTIAL_SECRET 
                  environment variable. The encryption process:
                </p>
                <ol className="list-decimal list-inside mt-2 pl-4">
                  <li>Generates a random initialization vector (IV)</li>
                  <li>Encrypts the data using the secret key and IV</li>
                  <li>Stores encrypted data, IV, and authentication tag separately</li>
                </ol>
                <p className="mt-2">
                  Never modify this encryption scheme without careful security review.
                </p>
              </AlertDescription>
            </Alert>
            
            <h3 className="text-lg font-medium mt-6">Token Management Best Practices</h3>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Token Refresh:</strong> For OAuth flows, implement automatic token refresh when tokens expire.
              </li>
              <li>
                <strong>Permission Scopes:</strong> Always request minimal permission scopes needed for functionality.
              </li>
              <li>
                <strong>Rate Limiting:</strong> Implement rate limiting to prevent API abuse or quota exhaustion.
              </li>
              <li>
                <strong>Audit Logging:</strong> Log all critical operations with platform APIs for troubleshooting.
              </li>
            </ul>
            
            <h3 className="text-lg font-medium mt-6">UI Security Guidelines</h3>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>User Notifications:</strong> Always inform users about what access they're granting.
              </li>
              <li>
                <strong>Security Warnings:</strong> Display appropriate warnings for higher-risk integrations.
              </li>
              <li>
                <strong>Connection Status:</strong> Provide clear indication of connection status.
              </li>
              <li>
                <strong>Error Handling:</strong> Implement user-friendly error handling without revealing sensitive details.
              </li>
            </ul>
          </TabsContent>
        </Tabs>
        
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-medium mb-4">Example: Adding Instagram Integration</h3>
          <p className="mb-4">
            The code examples above outline the process for adding Instagram as a new platform. To summarize:
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-4">
            <li>Update the platform type schema to include Instagram</li>
            <li>Create Instagram-specific input validation schema</li>
            <li>Implement a tRPC procedure for Instagram connection</li>
            <li>Create an InstagramClient class for API operations</li>
            <li>Add Instagram to the PLATFORMS array in the UI</li>
            <li>Implement OAuth flow routes for Instagram authentication</li>
            <li>Update the connection modal to handle Instagram auth flow</li>
          </ol>
          <p className="mt-4">
            These steps can be adapted for any new platform integration. The modularity of the system
            allows for easy extension without modifying existing platform integrations.
          </p>
          
          <h3 className="text-lg font-medium mt-8 mb-4">New AI Features Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border p-4 rounded-md">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Beaker className="h-4 w-4 text-purple-500" />
                A/B Testing Campaigns
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Create experiments with multiple variants to test different content strategies, pricing models, or engagement approaches.
                The system collects performance data and uses AI to analyze results and generate actionable conclusions.
              </p>
              <p className="text-xs font-medium">Key Files:</p>
              <ul className="text-xs list-disc pl-4">
                <li>models: CampaignExperiment, CampaignVariant</li>
                <li>pages: experiments/page.tsx</li>
                <li>backend: reasoningService.ts, insights.ts router</li>
              </ul>
            </div>
            
            <div className="border p-4 rounded-md">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Advanced Personalization
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Define client personas with target audience, brand voice, and content preferences. Generate tailored 
                recommendations that match specific client needs and engagement patterns.
              </p>
              <p className="text-xs font-medium">Key Files:</p>
              <ul className="text-xs list-disc pl-4">
                <li>models: ClientPersona</li>
                <li>pages: personalization/page.tsx</li>
                <li>backend: reasoningService.ts, insights.ts router</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 