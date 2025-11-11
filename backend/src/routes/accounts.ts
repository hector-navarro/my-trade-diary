import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/', async (req, res) => {
  const accounts = await prisma.account.findMany({
    where: { userId: req.user!.id },
    orderBy: { name: 'asc' },
  });
  res.json({ accounts });
});

router.post('/', body('name').isString(), body('currency').optional().isString(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const account = await prisma.account.create({
    data: {
      name: req.body.name,
      currency: req.body.currency,
      userId: req.user!.id,
    },
  });
  res.status(201).json({ account });
});

router.put('/:id', param('id').isInt({ min: 1 }), body('name').isString(), body('currency').optional().isString(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const id = Number(req.params.id);
  const account = await prisma.account.findFirst({ where: { id, userId: req.user!.id } });
  if (!account) {
    return res.status(404).json({ message: 'Account not found' });
  }
  const updated = await prisma.account.update({ where: { id }, data: { name: req.body.name, currency: req.body.currency } });
  res.json({ account: updated });
});

router.delete('/:id', param('id').isInt({ min: 1 }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const id = Number(req.params.id);
  const account = await prisma.account.findFirst({ where: { id, userId: req.user!.id } });
  if (!account) {
    return res.status(404).json({ message: 'Account not found' });
  }
  const openTrades = await prisma.trade.count({ where: { accountId: id, status: { in: ['OPEN', 'PLANNED'] } } });
  if (openTrades > 0) {
    return res.status(400).json({ message: 'Cannot delete account with open trades' });
  }
  await prisma.account.delete({ where: { id } });
  res.status(204).send();
});

export default router;
