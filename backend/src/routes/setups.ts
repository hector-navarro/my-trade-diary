import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/', async (req, res) => {
  const setups = await prisma.setup.findMany({
    where: { userId: req.user!.id },
    orderBy: { name: 'asc' },
  });
  res.json({ setups });
});

router.post('/', body('name').isString(), body('description').optional().isString(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const setup = await prisma.setup.create({
    data: {
      name: req.body.name,
      description: req.body.description,
      userId: req.user!.id,
    },
  });
  res.status(201).json({ setup });
});

router.put(
  '/:id',
  param('id').isMongoId(),
  body('name').isString(),
  body('description').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const id = req.params.id;
    const setup = await prisma.setup.findFirst({ where: { id, userId: req.user!.id } });
    if (!setup) {
      return res.status(404).json({ message: 'Setup not found' });
    }
    const updated = await prisma.setup.update({
      where: { id },
      data: { name: req.body.name, description: req.body.description },
    });
    res.json({ setup: updated });
  },
);

router.delete('/:id', param('id').isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const id = req.params.id;
  const setup = await prisma.setup.findFirst({ where: { id, userId: req.user!.id } });
  if (!setup) {
    return res.status(404).json({ message: 'Setup not found' });
  }
  await prisma.setup.delete({ where: { id } });
  res.status(204).send();
});

export default router;
