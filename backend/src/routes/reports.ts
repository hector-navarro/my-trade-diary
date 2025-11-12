import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

const calculateDrawdown = (pnlSeries: number[]) => {
  let peak = 0;
  let maxDrawdown = 0;
  for (const value of pnlSeries) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = peak - value;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  return maxDrawdown;
};

router.get('/overview', async (req, res) => {
  const userId = req.user!.id;
  const trades = await prisma.trade.findMany({
    where: { userId, status: 'CLOSED' },
    orderBy: { closedAt: 'asc' },
  });

  const totalTrades = trades.length;
  const wins = trades.filter((trade) => (trade.pnl ?? 0) > 0).length;
  const winRate = totalTrades > 0 ? wins / totalTrades : 0;
  const averageR = totalTrades > 0 ? trades.reduce((acc, trade) => acc + (trade.rMultiple ?? 0), 0) / totalTrades : 0;
  const expectancy = totalTrades > 0 ? trades.reduce((acc, trade) => acc + (trade.pnl ?? 0), 0) / totalTrades : 0;
  const equityCurve = trades.reduce<{ equity: number; points: { closedAt: Date; equity: number }[] }>((acc, trade) => {
    const newEquity = acc.equity + (trade.pnl ?? 0);
    acc.equity = newEquity;
    acc.points.push({ closedAt: trade.closedAt ?? new Date(), equity: newEquity });
    return acc;
  }, { equity: 0, points: [] });

  const drawdown = calculateDrawdown(equityCurve.points.map((point) => point.equity));

  const bySymbol = await prisma.trade.groupBy({
    by: ['symbol'],
    where: { userId, status: 'CLOSED' },
    _count: { _all: true },
    _avg: { pnl: true, rMultiple: true },
    orderBy: { _count: { _all: 'desc' } },
    take: 5,
  });

  const bySetupRaw = await prisma.trade.groupBy({
    by: ['setupId'],
    where: { userId, status: 'CLOSED', setupId: { not: null } },
    _count: { _all: true },
    _avg: { pnl: true, rMultiple: true },
    orderBy: { _count: { _all: 'desc' } },
    take: 5,
  });

  const setupIds = bySetupRaw.map((item) => item.setupId).filter((id): id is string => typeof id === 'string' && id.length > 0);
  const setups = await prisma.setup.findMany({ where: { id: { in: setupIds } } });
  const setupMap = new Map(setups.map((setup) => [setup.id, setup]));
  const bySetup = bySetupRaw.map((item) => ({
    ...item,
    setupName: item.setupId ? setupMap.get(item.setupId)?.name ?? 'Unknown' : 'Unassigned',
  }));

  res.json({
    metrics: {
      totalTrades,
      winRate,
      averageR,
      expectancy,
      drawdown,
    },
    equityCurve: equityCurve.points,
    bySymbol,
    bySetup,
  });
});

router.get('/deviations', async (req, res) => {
  const userId = req.user!.id;
  const trades = await prisma.trade.findMany({
    where: { userId, status: 'CLOSED' },
    include: { events: true },
  });

  const deviations = trades.map((trade) => {
    const movedSLAgainstPlan = trade.events.some((event) =>
      event.type === 'MOVE_SL' &&
      ((trade.direction === 'LONG' && (event.price ?? trade.plannedStopLoss) > trade.plannedStopLoss) ||
        (trade.direction === 'SHORT' && (event.price ?? trade.plannedStopLoss) < trade.plannedStopLoss))),
    );
    const exitEvent = trade.events.find((event) => event.type === 'EXIT');
    const entryEvent = trade.events.find((event) => event.type === 'ENTRY');
    const exitedEarly = trade.compliedWithPlan === false && trade.rMultiple != null && trade.plannedRiskReward != null && trade.rMultiple < trade.plannedRiskReward - 0.1;
    let exceededTime = false;
    if (trade.maxHoldMinutes != null && exitEvent && entryEvent) {
      const duration = (new Date(exitEvent.occurredAt).getTime() - new Date(entryEvent.occurredAt).getTime()) / (1000 * 60);
      exceededTime = duration > trade.maxHoldMinutes;
    }
    return {
      tradeId: trade.id,
      symbol: trade.symbol,
      movedSLAgainstPlan,
      exitedEarly,
      exceededTime,
    };
  });

  res.json({ deviations });
});

export default router;
