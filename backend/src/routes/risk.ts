import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/policy', async (req, res) => {
  const policy = await prisma.riskPolicy.findUnique({ where: { userId: req.user!.id } });
  res.json({ policy });
});

router.put(
  '/policy',
  body('maxRiskPerTrade').optional().isFloat({ min: 0 }),
  body('maxDailyLoss').optional().isFloat({ min: 0 }),
  body('maxConsecutiveLosses').optional().isInt({ min: 1 }),
  body('maxTradeDurationMinutes').optional().isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const policy = await prisma.riskPolicy.upsert({
      where: { userId: req.user!.id },
      update: {
        maxRiskPerTrade: req.body.maxRiskPerTrade,
        maxDailyLoss: req.body.maxDailyLoss,
        maxConsecutiveLosses: req.body.maxConsecutiveLosses,
        maxTradeDurationMinutes: req.body.maxTradeDurationMinutes,
      },
      create: {
        userId: req.user!.id,
        maxRiskPerTrade: req.body.maxRiskPerTrade,
        maxDailyLoss: req.body.maxDailyLoss,
        maxConsecutiveLosses: req.body.maxConsecutiveLosses,
        maxTradeDurationMinutes: req.body.maxTradeDurationMinutes,
      },
    });

    res.json({ policy });
  },
);

export default router;
