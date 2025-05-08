import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/trpc';
import { TRPCError } from '@trpc/server';
import { UserRole } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import {
  GetFinancialTrendsSchema,
  AddFinancialMetricSchema,
  FinancialMetricSchema,
  FinancialSummarySchema,
} from '@/lib/schemas/financialMonitor';

const prisma = new PrismaClient();

// Create a manager-only procedure
const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if the user's role is either MANAGER or ADMIN from the request headers
  const userRole = ctx.auth.userRole;

  if (userRole !== UserRole.MANAGER && userRole !== UserRole.ADMIN) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only managers and administrators can access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Add any additional context needed by manager-only procedures
    },
  });
});

export const financialMonitorRouter = createTRPCRouter({
  /**
   * Get financial trends with filters
   * Restricted to MANAGER and ADMIN
   */
  getFinancialTrends: managerProcedure
    .input(GetFinancialTrendsSchema)
    .query(async ({ input, ctx }) => {
      try {
        const {
          userId,
          clientId,
          category,
          startDate,
          endDate,
          groupBy,
          includeTrend,
          includeVariance,
        } = input;

        // Build filter conditions
        const where: any = {};
        
        if (userId) {
          where.userId = userId;
        }
        
        if (clientId) {
          where.clientId = clientId;
        }
        
        if (category) {
          where.category = category;
        }
        
        if (startDate || endDate) {
          where.date = {};
          if (startDate) {
            where.date.gte = startDate;
          }
          if (endDate) {
            where.date.lte = endDate;
          }
        }

        // Query financial metrics with filters
        const financialMetrics = await prisma.financialMetric.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
        });

        // Process the results to add trend and variance if requested
        let processedMetrics = financialMetrics;
        
        if (includeTrend || includeVariance) {
          processedMetrics = calculateTrendsAndVariances(financialMetrics, groupBy);
        }

        return {
          success: true,
          metrics: processedMetrics,
        };
      } catch (error) {
        console.error('Error fetching financial trends:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch financial trends',
          cause: error,
        });
      }
    }),

  /**
   * Get financial summary
   * Restricted to MANAGER and ADMIN
   */
  getFinancialSummary: managerProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      userId: z.string().optional(),
      clientId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { startDate, endDate, userId, clientId } = input;
        
        // Define date range
        const queryStartDate = startDate || new Date(new Date().getFullYear(), 0, 1); // Default to start of current year
        const queryEndDate = endDate || new Date();
        
        // Build where clause
        const where: any = {
          date: {
            gte: queryStartDate,
            lte: queryEndDate,
          },
        };
        
        if (userId) {
          where.userId = userId;
        }
        
        if (clientId) {
          where.clientId = clientId;
        }
        
        // Define categories for revenue and expenses
        const revenueCategories = ['revenue', 'sales', 'income', 'commission'];
        const expenseCategories = ['expense', 'cost', 'fee', 'tax'];
        
        // Query metrics for the period
        const metrics = await prisma.financialMetric.findMany({
          where,
          orderBy: {
            date: 'asc',
          },
        });
        
        // Calculate total revenue and expenses
        let totalRevenue = 0;
        let totalExpenses = 0;
        
        // Track category totals
        const categoryTotals: Record<string, number> = {};
        
        metrics.forEach(metric => {
          const amount = Number(metric.amount);
          const category = metric.category.toLowerCase();
          
          // Update category totals
          categoryTotals[metric.category] = (categoryTotals[metric.category] || 0) + amount;
          
          // Determine if revenue or expense based on category
          if (revenueCategories.some(c => category.includes(c))) {
            totalRevenue += amount;
          } else if (expenseCategories.some(c => category.includes(c))) {
            totalExpenses += amount;
          } else {
            // Default logic: positive is revenue, negative is expense
            if (amount >= 0) {
              totalRevenue += amount;
            } else {
              totalExpenses += Math.abs(amount);
            }
          }
        });
        
        // Calculate net profit
        const netProfit = totalRevenue - totalExpenses;
        
        // Calculate top categories by amount
        const topCategories = Object.entries(categoryTotals)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
        
        // Get monthly trend
        const monthlyTrend = calculateMonthlyTrend(metrics, queryStartDate, queryEndDate);
        
        // Create summary object
        const summary = {
          totalRevenue,
          totalExpenses,
          netProfit,
          topCategories,
          monthlyTrend,
        };
        
        return {
          success: true,
          summary,
        };
      } catch (error) {
        console.error('Error getting financial summary:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get financial summary',
          cause: error,
        });
      }
    }),

  /**
   * Add a new financial metric
   * This is an internal procedure that can be used by other parts of the system
   */
  addFinancialMetric: protectedProcedure
    .input(AddFinancialMetricSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { userId, clientId, category, amount, currency, date, description } = input;

        // Create new financial metric
        const financialMetric = await prisma.financialMetric.create({
          data: {
            userId: userId || null,
            clientId: clientId || null,
            category,
            amount,
            currency,
            date,
            description: description || null,
          },
        });

        return {
          success: true,
          financialMetric,
        };
      } catch (error) {
        console.error('Error adding financial metric:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add financial metric',
          cause: error,
        });
      }
    }),
});

// Helper function to calculate trends and variances
function calculateTrendsAndVariances(metrics: any[], groupBy: string) {
  if (metrics.length === 0) return metrics;
  
  // Group metrics by the specified time period
  const groupedMetrics = groupMetricsByTimePeriod(metrics, groupBy);
  
  // Calculate trends and variances for each group
  const result = [];
  
  for (const [group, items] of Object.entries(groupedMetrics)) {
    // Sort items by date
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Process each item in the group
    for (let i = 0; i < items.length; i++) {
      const current = { ...items[i] };
      
      // Calculate trend (rate of change compared to previous period)
      if (i > 0) {
        const previous = items[i - 1];
        const percentChange = previous.amount !== 0 
          ? ((current.amount - previous.amount) / Math.abs(previous.amount)) * 100
          : 0;
        current.trend = Math.round(percentChange * 100) / 100; // Round to 2 decimal places
      } else {
        current.trend = 0; // First item has no trend
      }
      
      // Calculate variance (deviation from average)
      const sum = items.reduce((acc, item) => acc + Number(item.amount), 0);
      const avg = sum / items.length;
      current.variance = Math.round(((current.amount - avg) / avg) * 100 * 100) / 100;
      
      result.push(current);
    }
  }
  
  return result;
}

// Helper function to group metrics by time period
function groupMetricsByTimePeriod(metrics: any[], groupBy: string) {
  const result: Record<string, any[]> = {};
  
  metrics.forEach(metric => {
    const date = new Date(metric.date);
    let groupKey;
    
    switch (groupBy) {
      case 'day':
        groupKey = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        groupKey = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        groupKey = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'year':
        groupKey = `${date.getFullYear()}`;
        break;
      default:
        groupKey = date.toISOString().split('T')[0];
    }
    
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    
    result[groupKey].push(metric);
  });
  
  return result;
}

// Helper function to calculate monthly trend
function calculateMonthlyTrend(metrics: any[], startDate: Date, endDate: Date) {
  // Create a map of year-month to metrics
  const monthlyMetrics: Record<string, { revenue: number; expenses: number }> = {};
  
  // Initialize all months in the date range
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    monthlyMetrics[key] = { revenue: 0, expenses: 0 };
    current.setMonth(current.getMonth() + 1);
  }
  
  // Define categories for revenue and expenses
  const revenueCategories = ['revenue', 'sales', 'income', 'commission'];
  const expenseCategories = ['expense', 'cost', 'fee', 'tax'];
  
  // Populate with actual data
  metrics.forEach(metric => {
    const date = new Date(metric.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const amount = Number(metric.amount);
    const category = metric.category.toLowerCase();
    
    if (!monthlyMetrics[key]) {
      monthlyMetrics[key] = { revenue: 0, expenses: 0 };
    }
    
    // Categorize as revenue or expense
    if (revenueCategories.some(c => category.includes(c))) {
      monthlyMetrics[key].revenue += amount;
    } else if (expenseCategories.some(c => category.includes(c))) {
      monthlyMetrics[key].expenses += Math.abs(amount);
    } else {
      // Default logic: positive is revenue, negative is expense
      if (amount >= 0) {
        monthlyMetrics[key].revenue += amount;
      } else {
        monthlyMetrics[key].expenses += Math.abs(amount);
      }
    }
  });
  
  // Convert to array and sort by month
  return Object.entries(monthlyMetrics)
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
} 