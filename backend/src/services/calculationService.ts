import { Trade, TradeEvent, TradeEventType, TradeDirection } from '@prisma/client';

export interface PlanComplianceInput {
  trade: Trade;
  events: TradeEvent[];
  toleranceR?: number;
}

export const calculateRiskReward = (trade: Pick<Trade, 'plannedTakeProfit' | 'plannedEntry' | 'plannedStopLoss' | 'direction'>) => {
  const risk = Math.abs(trade.plannedEntry - trade.plannedStopLoss);
  const reward = Math.abs(trade.plannedTakeProfit - trade.plannedEntry);
  if (risk === 0) {
    return 0;
  }
  return reward / risk;
};

export const calculateRMultiple = (trade: Pick<Trade, 'direction' | 'plannedEntry' | 'plannedStopLoss'>, resultPrice: number) => {
  const risk = trade.direction === TradeDirection.LONG
    ? trade.plannedEntry - trade.plannedStopLoss
    : trade.plannedStopLoss - trade.plannedEntry;
  if (risk === 0) {
    return 0;
  }
  const gain = trade.direction === TradeDirection.LONG
    ? resultPrice - trade.plannedEntry
    : trade.plannedEntry - resultPrice;
  return gain / risk;
};

export const evaluatePlanCompliance = ({ trade, events, toleranceR = 0.1 }: PlanComplianceInput) => {
  const moveSlAgainstPlan = events.some(
    (event) => event.type === TradeEventType.MOVE_SL &&
      ((trade.direction === TradeDirection.LONG && (event.price ?? trade.plannedStopLoss) > trade.plannedStopLoss) ||
        (trade.direction === TradeDirection.SHORT && (event.price ?? trade.plannedStopLoss) < trade.plannedStopLoss)),
  );

  const exitEvent = events.find((event) => event.type === TradeEventType.EXIT);
  if (!exitEvent || trade.actualExitPrice == null) {
    return false;
  }

  const rMultiple = calculateRMultiple(trade, trade.actualExitPrice);
  const targetR = calculateRiskReward(trade);
  const exitedEarly = targetR > 0 && rMultiple < targetR - toleranceR;

  const entryEvent = events.find((event) => event.type === TradeEventType.ENTRY);
  if (!entryEvent || trade.actualEntryPrice == null) {
    return false;
  }

  const durationMinutes = Math.abs(
    (new Date(exitEvent.occurredAt).getTime() - new Date(entryEvent.occurredAt).getTime()) /
      (1000 * 60),
  );

  const exceededTime = trade.maxHoldMinutes != null && durationMinutes > trade.maxHoldMinutes;

  return !(moveSlAgainstPlan || exitedEarly || exceededTime);
};
