import { Trade } from "@prisma/client";

export function calculateNetWorth(trades: Trade[]): number {
  var amount = 0;
  trades.forEach((t) => {
    const signedQty = t.type === "BUY" ? t.quantity : -t.quantity;
    amount += signedQty * t.price - t.fees;
  });
  return amount;
}

export const calculateTotalCost = (trades?: Trade[] | null): number => {
  if (!trades || !Array.isArray(trades)) {
    return 0;
  }

  return trades.reduce((total, trade) => {
    if (!trade) return total;
    const cost =
      trade.type === "BUY"
        ? trade.quantity * trade.price + trade.fees
        : -(trade.quantity * trade.price - trade.fees);
    return total + cost;
  }, 0);
};