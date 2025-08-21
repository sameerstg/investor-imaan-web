"use server";

import { prisma } from "@/lib/prisma";

// Trade type for inputs
type TradeInput = {
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  fees: number;
};

// -------------------- CREATE TRADE --------------------
export async function createTrade(portfolioId: string, data: TradeInput) {
  return prisma.trade.create({
    data: {
      portfolioId,
      symbol: data.symbol,
      type: data.type,
      quantity: data.quantity,
      price: data.price,
      fees: data.fees,
    },
  });
}

// -------------------- UPDATE TRADE --------------------
export async function updateTrade(tradeId: string, data: TradeInput) {
  return prisma.trade.update({
    where: { id: tradeId },
    data: {
      symbol: data.symbol,
      type: data.type,
      quantity: data.quantity,
      price: data.price,
      fees: data.fees,
    },
  });
}

// -------------------- DELETE TRADE --------------------
export async function deleteTrade(tradeId: string) {
  return prisma.trade.delete({
    where: { id: tradeId },
  });
}

// -------------------- GET ALL TRADES FOR PORTFOLIO --------------------
export async function getTradesByPortfolio(portfolioId: string) {
  return prisma.trade.findMany({
    where: { portfolioId },
    orderBy: {
      tradeDate: "desc",
    },
  });
}

// -------------------- GET SINGLE TRADE --------------------
export async function getTradeById(tradeId: string) {
  return prisma.trade.findUnique({
    where: { id: tradeId },
  });
}
