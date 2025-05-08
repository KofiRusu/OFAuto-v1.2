import axios from 'axios';
import { prisma } from '@/lib/db';
import { CrmAccount } from '../schemas/crm';

/**
 * Test a CRM connection using the provided API key and domain
 * @param apiKey API key for CRM access
 * @param domain CRM domain (e.g. company.crm.com)
 * @returns boolean indicating if the connection was successful
 */
export async function testCrmConnection(apiKey: string, domain: string): Promise<boolean> {
  try {
    // Construct the CRM API endpoint URL
    const url = `https://${domain}/api/v1/ping`;
    
    // Make a test request to the CRM API
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });
    
    // If we get a successful response, the connection is working
    return response.status === 200;
  } catch (error) {
    console.error('Error testing CRM connection:', error);
    return false;
  }
}

/**
 * Fetch accounts from a connected CRM
 * @param connectionId ID of the CRM connection
 * @returns Array of CRM accounts
 */
export async function fetchCrmAccounts(connectionId: string): Promise<CrmAccount[]> {
  try {
    // First, get the connection details from the database
    const connection = await prisma.crmConnection.findUnique({
      where: { id: connectionId },
    });
    
    if (!connection) {
      throw new Error('CRM connection not found');
    }
    
    // Check if the connection is active
    if (connection.status !== 'CONNECTED') {
      throw new Error('CRM connection is not active');
    }
    
    // Construct the CRM API endpoint URL for accounts
    const url = `https://${connection.domain}/api/v1/accounts`;
    
    // Make the request to the CRM API
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${connection.apiKey}`,
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 second timeout for potentially large data
    });
    
    // Map the response to our CrmAccount schema
    // In a real implementation, this would handle different CRM providers with different response formats
    const accounts = response.data.accounts || response.data.data || [];
    
    return accounts.map((account: any) => ({
      id: account.id || account.accountId || '',
      name: account.name || account.accountName || '',
      email: account.email || account.primaryEmail || null,
      phone: account.phone || account.primaryPhone || null,
      type: account.type || account.accountType || null,
      source: 'crm' as const,
    }));
  } catch (error) {
    console.error('Error fetching CRM accounts:', error);
    throw new Error('Failed to fetch accounts from CRM: ' + (error as Error).message);
  }
}

/**
 * Get the current status of a CRM connection
 * @param connectionId ID of the CRM connection
 * @returns Object with status details
 */
export async function getCrmConnectionStatus(connectionId: string): Promise<{
  connected: boolean;
  connectionId: string;
  domain: string;
  lastSyncedAt: Date | null;
  error?: string;
}> {
  try {
    // Get the connection details from the database
    const connection = await prisma.crmConnection.findUnique({
      where: { id: connectionId },
    });
    
    if (!connection) {
      throw new Error('CRM connection not found');
    }
    
    // Test the connection
    const isConnected = await testCrmConnection(connection.apiKey, connection.domain);
    
    // If the connection status has changed, update it in the database
    if (isConnected && connection.status !== 'CONNECTED') {
      await prisma.crmConnection.update({
        where: { id: connectionId },
        data: { status: 'CONNECTED' },
      });
    } else if (!isConnected && connection.status !== 'FAILED') {
      await prisma.crmConnection.update({
        where: { id: connectionId },
        data: { status: 'FAILED' },
      });
    }
    
    return {
      connected: isConnected,
      connectionId: connection.id,
      domain: connection.domain,
      lastSyncedAt: connection.updatedAt,
    };
  } catch (error) {
    console.error('Error getting CRM connection status:', error);
    return {
      connected: false,
      connectionId,
      domain: '',
      lastSyncedAt: null,
      error: (error as Error).message,
    };
  }
} 