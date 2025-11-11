import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { TradeDirection, TradeEventType, TradeStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { calculateRiskReward, calculateRMultiple, evaluatePlanCompliance } from '../services/calculationService';
import { evaluateRiskForNewTrade, evaluateRiskOnClose, calculateRiskAmount } from '../services/riskService';

const router = Router();

const tradeValidations = [
  body('symbol').isString(),
  body('direction').isIn(Object.values(TradeDirection)),
  body('plannedEntry').isFloat().toFloat(),
  body('plannedStopLoss').isFloat().toFloat(),
  body('plannedTakeProfit').isFloat().toFloat(),
  body('maxHoldMinutes').optional().isInt({ min: 1 }).toInt(),
  body('plannedRiskAmount').optional().isFloat({ min: 0 }).toFloat(),
  body('setupId').optional({ nullable: true }).isMongoId(),
  body('accountId').optional({ nullable: true }).isMongoId(),
  body('tags').optional().isArray(),
  body('tags.*').optional().isMongoId(),
];

const normalizeRelationId = (value: unknown): string | null | undefined => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (value === null) {
    return null;
  }
  return undefined;
};

const validateTradePlan = (direction: TradeDirection, entry: number, stop: number, takeProfit: number) => {
  if (direction === TradeDirection.LONG) {
    return stop < entry && entry < takeProfit;
  }
  return takeProfit < entry && entry < stop;
};

router.get(
  '/',
  query('status').optional().isIn(Object.values(TradeStatus)),
  query('setupId').optional().isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const userId = req.user!.id;
    const { status, symbol, direction, setupId, tag, from, to } = req.query;
    const trades = await prisma.trade.findMany({
      where: {
        userId,
        status: status ? (status as TradeStatus) : undefined,
        symbol: symbol ? { contains: symbol as string, mode: 'insensitive' } : undefined,
        direction: direction ? (direction as TradeDirection) : undefined,
        setupId: typeof setupId === 'string' ? setupId : undefined,
        createdAt: {
          gte: from ? new Date(from as string) : undefined,
          lte: to ? new Date(to as string) : undefined,
        },
        tags: tag
          ? {
              some: {
                tag: {
                  name: { contains: tag as string, mode: 'insensitive' },
                },
              },
            }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        setup: true,
        account: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ trades });
  },
);

router.post('/', tradeValidations, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const userId = req.user!.id;
  const {
    symbol,
    direction,
    plannedEntry,
    plannedStopLoss,
    plannedTakeProfit,
    maxHoldMinutes,
    setupId: rawSetupId,
    accountId: rawAccountId,
    notes,
    emotionalState,
    plannedRiskAmount,
    tags,
  } = req.body;

  if (!validateTradePlan(direction, plannedEntry, plannedStopLoss, plannedTakeProfit)) {
    return res.status(400).json({ message: 'Invalid plan for trade direction' });
  }

  const setupId = normalizeRelationId(rawSetupId);
  if (typeof setupId === 'string') {
    const setup = await prisma.setup.findFirst({ where: { id: setupId, userId } });
    if (!setup) {
      return res.status(400).json({ message: 'Invalid setup' });
    }
  }

  const accountId = normalizeRelationId(rawAccountId);
  if (typeof accountId === 'string') {
    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) {
      return res.status(400).json({ message: 'Invalid account' });
    }
  }

  const tagIds = Array.isArray(tags) ? (tags as string[]).filter((tagId) => typeof tagId === 'string') : [];

  if (tagIds.length) {
    const tagCount = await prisma.tag.count({ where: { id: { in: tagIds }, userId } });
    if (tagCount !== tagIds.length) {
      return res.status(400).json({ message: 'Invalid tag selection' });
    }
  }

  const riskReward = calculateRiskReward({
    plannedEntry,
    plannedStopLoss,
    plannedTakeProfit,
    direction,
  });

  const trade = await prisma.trade.create({
    data: {
      userId,
      symbol,
      direction,
      plannedEntry,
      plannedStopLoss,
      plannedTakeProfit,
      plannedRiskReward: riskReward,
      plannedRiskAmount,
      maxHoldMinutes,
      notes,
      emotionalState,
      setupId,
      accountId,
      tags: tagIds.length
        ? {
            create: tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
    include: {
      tags: { include: { tag: true } },
    },
  });

  const alerts = await evaluateRiskForNewTrade(userId, {
    plannedEntry,
    plannedStopLoss,
    direction,
    plannedRiskAmount,
  });

  res.status(201).json({ trade, alerts });
});

router.get('/:id', param('id').isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const id = req.params.id;
  const userId = req.user!.id;
  const trade = await prisma.trade.findFirst({
    where: { id, userId },
    include: {
      events: { orderBy: { occurredAt: 'asc' } },
      tags: { include: { tag: true } },
      setup: true,
      account: true,
      attachments: true,
    },
  });
  if (!trade) {
    return res.status(404).json({ message: 'Trade not found' });
  }
  res.json({ trade });
});

router.put('/:id', param('id').isMongoId(), tradeValidations, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const id = req.params.id;
  const userId = req.user!.id;
  const existing = await prisma.trade.findFirst({ where: { id, userId } });
  if (!existing) {
    return res.status(404).json({ message: 'Trade not found' });
  }

  const {
    symbol,
    direction,
    plannedEntry,
    plannedStopLoss,
    plannedTakeProfit,
    maxHoldMinutes,
    setupId: rawSetupId,
    accountId: rawAccountId,
    notes,
    emotionalState,
    plannedRiskAmount,
    tags,
  } = req.body;

  if (!validateTradePlan(direction, plannedEntry, plannedStopLoss, plannedTakeProfit)) {
    return res.status(400).json({ message: 'Invalid plan for trade direction' });
  }

  const setupId = normalizeRelationId(rawSetupId);
  if (typeof setupId === 'string') {
    const setup = await prisma.setup.findFirst({ where: { id: setupId, userId } });
    if (!setup) {
      return res.status(400).json({ message: 'Invalid setup' });
    }
  }

  const accountId = normalizeRelationId(rawAccountId);
  if (typeof accountId === 'string') {
    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) {
      return res.status(400).json({ message: 'Invalid account' });
    }
  }

  const tagIdsUpdate = Array.isArray(tags) ? (tags as string[]).filter((tagId) => typeof tagId === 'string') : [];

  if (tagIdsUpdate.length) {
    const tagCount = await prisma.tag.count({ where: { id: { in: tagIdsUpdate }, userId } });
    if (tagCount !== tagIdsUpdate.length) {
      return res.status(400).json({ message: 'Invalid tag selection' });
    }
  }

  const riskReward = calculateRiskReward({
    plannedEntry,
    plannedStopLoss,
    plannedTakeProfit,
    direction,
  });

  const trade = await prisma.trade.update({
    where: { id },
    data: {
      symbol,
      direction,
      plannedEntry,
      plannedStopLoss,
      plannedTakeProfit,
      plannedRiskReward: riskReward,
      plannedRiskAmount,
      maxHoldMinutes,
      notes,
      emotionalState,
      setupId,
      accountId,
      tags: {
        deleteMany: {},
        create: tagIdsUpdate.map((tagId) => ({ tagId })),
      },
    },
    include: {
      tags: { include: { tag: true } },
    },
  });

  res.json({ trade });
});

router.delete('/:id', param('id').isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const id = req.params.id;
  const userId = req.user!.id;
  const trade = await prisma.trade.findFirst({ where: { id, userId } });
  if (!trade) {
    return res.status(404).json({ message: 'Trade not found' });
  }
  await prisma.trade.update({
    where: { id },
    data: { status: TradeStatus.CANCELLED },
  });
  res.status(204).send();
});

router.post(
  '/:id/events',
  param('id').isMongoId(),
  body('type').isIn(Object.values(TradeEventType)),
  body('price').optional().isFloat({ min: 0 }).toFloat(),
  body('size').optional().isFloat({ min: 0 }).toFloat(),
  body('note').optional().isString(),
  body('occurredAt').optional().isISO8601(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const id = req.params.id;
    const userId = req.user!.id;
    const trade = await prisma.trade.findFirst({ where: { id, userId } });
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    const event = await prisma.tradeEvent.create({
      data: {
        tradeId: id,
        type: req.body.type,
        price: req.body.price,
        size: req.body.size,
        occurredAt: req.body.occurredAt ? new Date(req.body.occurredAt) : undefined,
        note: req.body.note,
      },
    });

    if (req.body.type === TradeEventType.ENTRY && trade.status === TradeStatus.PLANNED) {
      await prisma.trade.update({
        where: { id },
        data: { status: TradeStatus.OPEN, actualEntryPrice: req.body.price },
      });
    }

    res.status(201).json({ event });
  },
);

router.post(
  '/:id/close',
  param('id').isMongoId(),
  body('exitPrice').isFloat().toFloat(),
  body('closedAt').optional().isISO8601(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const id = req.params.id;
    const userId = req.user!.id;
    const trade = await prisma.trade.findFirst({
      where: { id, userId },
      include: { events: true },
    });
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    const exitPrice = Number(req.body.exitPrice);
    const risk = calculateRiskAmount({
      plannedEntry: trade.plannedEntry,
      plannedStopLoss: trade.plannedStopLoss,
      direction: trade.direction,
    });
    const pnl =
      trade.direction === TradeDirection.LONG ? exitPrice - trade.plannedEntry : trade.plannedEntry - exitPrice;
    const rMultiple = calculateRMultiple(trade, exitPrice);

    let events = trade.events;
    if (!events.some((event) => event.type === TradeEventType.EXIT)) {
      const exitEvent = await prisma.tradeEvent.create({
        data: {
          tradeId: id,
          type: TradeEventType.EXIT,
          price: exitPrice,
          occurredAt: req.body.closedAt ? new Date(req.body.closedAt) : new Date(),
        },
      });
      events = [...events, exitEvent];
    }

    const updated = await prisma.trade.update({
      where: { id },
      data: {
        status: TradeStatus.CLOSED,
        actualExitPrice: exitPrice,
        pnl,
        rMultiple,
        closedAt: req.body.closedAt ? new Date(req.body.closedAt) : new Date(),
        compliedWithPlan: evaluatePlanCompliance({
          trade: {
            ...trade,
            actualExitPrice: exitPrice,
            pnl,
            rMultiple,
          },
          events,
        }),
      },
      include: { events: true },
    });

    const alerts = await evaluateRiskOnClose(userId);

    res.json({ trade: updated, risk: { alerts, riskAmount: risk } });
  },
);

export default router;
