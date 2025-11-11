import { Router } from 'express';
import { stringify } from 'csv-stringify';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/trades.csv', async (req, res) => {
  const trades = await prisma.trade.findMany({
    where: { userId: req.user!.id },
    include: {
      tags: { include: { tag: true } },
      setup: true,
      account: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const header = [
    'id',
    'status',
    'symbol',
    'direction',
    'plannedEntry',
    'plannedStopLoss',
    'plannedTakeProfit',
    'actualEntryPrice',
    'actualExitPrice',
    'pnl',
    'rMultiple',
    'compliedWithPlan',
    'setup',
    'account',
    'tags',
    'createdAt',
    'closedAt',
  ];

  const rows = trades.map((trade) => [
    trade.id,
    trade.status,
    trade.symbol,
    trade.direction,
    trade.plannedEntry,
    trade.plannedStopLoss,
    trade.plannedTakeProfit,
    trade.actualEntryPrice ?? '',
    trade.actualExitPrice ?? '',
    trade.pnl ?? '',
    trade.rMultiple ?? '',
    trade.compliedWithPlan ?? '',
    trade.setup?.name ?? '',
    trade.account?.name ?? '',
    trade.tags.map((tag) => tag.tag.name).join('|'),
    trade.createdAt.toISOString(),
    trade.closedAt ? trade.closedAt.toISOString() : '',
  ]);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="trades.csv"');

  stringify([header, ...rows]).pipe(res);
});

export default router;
