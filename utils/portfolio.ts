import { Trade } from "@prisma/client";

export function calculateNetWorth(trades: Trade[]): number {
  var amount = 0;
  trades.forEach((t) => {
    const signedQty = t.type === "BUY" ? t.quantity : -t.quantity;
    amount += signedQty * t.price - t.fees;
  });
  return amount;
}