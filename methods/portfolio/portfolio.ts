"use server";

import { prisma } from "@/lib/prisma";

// Get all portfolios for a user
export async function getPortfolios(userId: string) {
  return await prisma.portfolio.findMany({
    where: { userId },
    include: {
      Trade: true,
    },
  });
}
export async function getPortfolioById(id: string) {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: { Trade: true }, // so you can show assets & trade history
    });
    return portfolio;
  } catch (err) {
    console.error("Error fetching portfolio by id:", err);
    throw err;
  }
}
// Create a new portfolio
export async function createPortfolio(
  userId: string,
  name: string,
  description?: string
) {
  return await prisma.portfolio.create({
    data: {
      userId,
      name,
      description,
    },
  });
}

// Update portfolio
export async function updatePortfolio(
  id: string,
  updates: {
    name?: string;
    description?: string;
  }
) {
  return await prisma.portfolio.update({
    where: { id },
    data: {
      ...updates,
      updatedAt: new Date(),
    },
  });
}

// Delete portfolio
export async function deletePortfolio(id: string) {
  await prisma.trade.deleteMany({
    where: { portfolioId: id }, // cleanup trades first if cascade isn't set
  });

  await prisma.portfolio.delete({
    where: { id },
  });

  return true;
}
