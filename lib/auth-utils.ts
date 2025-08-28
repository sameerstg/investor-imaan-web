"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface AuthResult {
  userId: string;
  session: any;
}

/**
 * Universal function to validate user authentication
 * @returns AuthResult with userId and session if authenticated
 * @throws Error if not authenticated
 */
export async function validateUser(): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized: User not authenticated");
  }

  return {
    userId: session.user.id,
    session,
  };
}

/**
 * Checks if the current user is authenticated and returns their user ID
 * @throws Error if user is not authenticated
 * @returns The authenticated user's ID
 */
export async function requireAuth(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

/**
 * Validate if user owns a specific portfolio
 * @param portfolioId - The portfolio ID to check
 * @returns The portfolio if user owns it
 * @throws Error if not authorized
 */
export async function validatePortfolioOwnership(portfolioId: string) {
  const { userId } = await validateUser();

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: { userId: true, id: true, name: true },
  });

  if (!portfolio || portfolio.userId !== userId) {
    throw new Error("Unauthorized: Portfolio not found or access denied");
  }

  return portfolio;
}

/**
 * Checks if the current user is authenticated and owns the specified portfolio
 * @param portfolioId - The ID of the portfolio to check ownership for
 * @throws Error if user is not authenticated or doesn't own the portfolio
 * @returns The authenticated user's ID
 */
export async function requireAuthAndPortfolioOwnership(portfolioId: string): Promise<string> {
  const userId = await requireAuth();

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: { userId: true },
  });

  if (!portfolio || portfolio.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

/**
 * Validate if user owns a specific trade (through portfolio ownership)
 * @param tradeId - The trade ID to check
 * @returns The trade with portfolio info if user owns it
 * @throws Error if not authorized
 */
export async function validateTradeOwnership(tradeId: string) {
  const { userId } = await validateUser();

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: { portfolio: true },
  });

  if (!trade || trade.portfolio.userId !== userId) {
    throw new Error("Unauthorized: Trade not found or access denied");
  }

  return trade;
}

/**
 * Checks if the current user is authenticated and owns the specified trade
 * @param tradeId - The ID of the trade to check ownership for
 * @throws Error if user is not authenticated or doesn't own the trade
 * @returns The authenticated user's ID
 */
export async function requireAuthAndTradeOwnership(tradeId: string): Promise<string> {
  const userId = await requireAuth();

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: { portfolio: true },
  });

  if (!trade || trade.portfolio.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

/**
 * Checks if the current user is authenticated and matches the provided user ID
 * @param expectedUserId - The expected user ID to match
 * @throws Error if user is not authenticated or IDs don't match
 * @returns The authenticated user's ID
 */
export async function requireAuthAndUserMatch(expectedUserId: string): Promise<string> {
  const userId = await requireAuth();

  if (userId !== expectedUserId) {
    throw new Error("Unauthorized");
  }

  return userId;
}
