import { prisma } from '../utils/prisma';
import { TradeDirection } from '@prisma/client';

interface RiskAlert {
  type: string;
  message: string;
}

export interface RiskTradeInput {
  plannedEntry: number;
  plannedStopLoss: number;
  direction: TradeDirection;
  plannedRiskAmount?: number | null;
}

export const evaluateRiskForNewTrade = async (userId: string, trade: RiskTradeInput) => {
  const alerts: RiskAlert[] = [];
  const policy = await prisma.riskPolicy.findUnique({ where: { userId } });
  if (!policy) {
    return alerts;
  }

  const riskPerTrade = trade.plannedRiskAmount ?? calculateRiskAmount(trade);
  if (policy.maxRiskPerTrade != null && riskPerTrade > policy.maxRiskPerTrade) {
    alerts.push({ type: 'MAX_RISK_PER_TRADE', message: 'Planned risk per trade exceeds configured limit' });
  }

  return alerts;
};

export const evaluateRiskOnClose = async (userId: string) => {
  const alerts: RiskAlert[] = [];
  const policy = await prisma.riskPolicy.findUnique({ where: { userId } });
  if (!policy) {
    return alerts;
  }

  if (policy.maxConsecutiveLosses != null) {
    const recentTrades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { closedAt: 'desc' },
      take: policy.maxConsecutiveLosses,
    });
    if (recentTrades.length === policy.maxConsecutiveLosses && recentTrades.every((t) => (t.pnl ?? 0) < 0)) {
      alerts.push({ type: 'MAX_CONSECUTIVE_LOSSES', message: 'Maximum consecutive losses reached' });
    }
  }

  if (policy.maxDailyLoss != null) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const trades = await prisma.trade.findMany({
      where: {
        userId,
        closedAt: {
          gte: startOfDay,
        },
      },
    });
    const dailyLoss = trades.reduce((acc, trade) => acc + Math.min(trade.pnl ?? 0, 0), 0);
    if (Math.abs(dailyLoss) > policy.maxDailyLoss) {
      alerts.push({ type: 'MAX_DAILY_LOSS', message: 'Daily loss limit exceeded' });
    }
  }

  return alerts;
};

export const calculateRiskAmount = (trade: Pick<RiskTradeInput, 'plannedEntry' | 'plannedStopLoss' | 'direction'>) => {
  if (trade.direction === TradeDirection.LONG) {
    return Math.abs(trade.plannedEntry - trade.plannedStopLoss);
  }
  return Math.abs(trade.plannedStopLoss - trade.plannedEntry);
};
