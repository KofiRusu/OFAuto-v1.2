import { organizationService } from "@/lib/services/organizationService";
import { DEFAULT_ORG_SETTINGS } from "@/lib/schemas/organization";
import { PrismaClient } from "@prisma/client";

// Mock PrismaClient
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    client: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

// Mock nanoid
jest.mock("nanoid", () => ({
  nanoid: jest.fn().mockReturnValue("ABC123"),
}));

describe("OrganizationService", () => {
  let prisma: jest.Mocked<any>;
  
  beforeEach(() => {
    prisma = new PrismaClient() as jest.Mocked<any>;
    jest.clearAllMocks();
  });
  
  describe("createReferralCode", () => {
    it("should generate a referral code with client name prefix", async () => {
      // Mock client data
      prisma.client.findUnique.mockResolvedValueOnce({
        name: "Test Client",
      });
      
      // Mock client check for existing code
      prisma.client.findUnique.mockResolvedValueOnce(null);
      
      // Mock client update
      prisma.client.update.mockResolvedValueOnce({
        id: "client-123",
        referralCode: "TES-ABC123",
      });
      
      const clientId = "client-123";
      const result = await organizationService.createReferralCode(clientId, prisma);
      
      expect(result).toBe("TES-ABC123");
      expect(prisma.client.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
        data: { referralCode: "TES-ABC123" },
      });
    });
    
    it("should handle special characters in client name", async () => {
      // Mock client with special characters
      prisma.client.findUnique.mockResolvedValueOnce({
        name: "Special-Chars!@#$%",
      });
      
      // Mock client check for existing code
      prisma.client.findUnique.mockResolvedValueOnce(null);
      
      // Mock client update
      prisma.client.update.mockResolvedValueOnce({
        id: "client-456",
        referralCode: "SPE-ABC123",
      });
      
      const clientId = "client-456";
      const result = await organizationService.createReferralCode(clientId, prisma);
      
      expect(result).toBe("SPE-ABC123");
      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
        data: { referralCode: "SPE-ABC123" },
      });
    });
    
    it("should throw an error if client not found", async () => {
      // Mock client not found
      prisma.client.findUnique.mockResolvedValueOnce(null);
      
      const clientId = "non-existent";
      
      await expect(organizationService.createReferralCode(clientId, prisma))
        .rejects.toThrow("Client not found");
    });
    
    it("should retry if code already exists", async () => {
      // First call - client data
      prisma.client.findUnique.mockResolvedValueOnce({
        name: "Duplicate",
      });
      
      // Second call - code exists check (found)
      prisma.client.findUnique.mockResolvedValueOnce({
        id: "another-client",
      });
      
      // Third call - second attempt client data
      prisma.client.findUnique.mockResolvedValueOnce({
        name: "Duplicate",
      });
      
      // Fourth call - code exists check (not found)
      prisma.client.findUnique.mockResolvedValueOnce(null);
      
      // Mock update call
      prisma.client.update.mockResolvedValueOnce({
        id: "client-789",
        referralCode: "DUP-ABC123",
      });
      
      const clientId = "client-789";
      const result = await organizationService.createReferralCode(clientId, prisma);
      
      expect(result).toBe("DUP-ABC123");
      expect(prisma.client.findUnique).toHaveBeenCalledTimes(4);
      expect(prisma.client.update).toHaveBeenCalledTimes(1);
    });
  });
  
  describe("mergeWithDefaultSettings", () => {
    it("should return default settings when no settings provided", () => {
      const result = organizationService.mergeWithDefaultSettings(null);
      expect(result).toEqual(DEFAULT_ORG_SETTINGS);
    });
    
    it("should merge existing settings with defaults", () => {
      const existingSettings = {
        branding: {
          primaryColor: "#FF0000",
        },
        features: {
          enableReferrals: false,
        },
      };
      
      const result = organizationService.mergeWithDefaultSettings(existingSettings);
      
      // Check that it merged properly
      expect(result.branding.primaryColor).toBe("#FF0000");
      expect(result.branding.secondaryColor).toBe(DEFAULT_ORG_SETTINGS.branding.secondaryColor);
      expect(result.features.enableReferrals).toBe(false);
      expect(result.features.enableActivityLogs).toBe(DEFAULT_ORG_SETTINGS.features.enableActivityLogs);
      expect(result.communication).toEqual(DEFAULT_ORG_SETTINGS.communication);
    });
    
    it("should handle empty objects", () => {
      const existingSettings = {};
      const result = organizationService.mergeWithDefaultSettings(existingSettings);
      expect(result).toEqual(DEFAULT_ORG_SETTINGS);
    });
  });
  
  describe("validateReferralCode", () => {
    it("should return client ID if code is valid", async () => {
      // Mock finding client with the referral code
      prisma.client.findUnique.mockResolvedValueOnce({
        id: "client-123",
      });
      
      const result = await organizationService.validateReferralCode("TEST-123", prisma);
      expect(result).toBe("client-123");
      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { referralCode: "TEST-123" },
        select: { id: true },
      });
    });
    
    it("should return null if code is invalid", async () => {
      // Mock not finding a client
      prisma.client.findUnique.mockResolvedValueOnce(null);
      
      const result = await organizationService.validateReferralCode("INVALID", prisma);
      expect(result).toBeNull();
    });
  });
}); 