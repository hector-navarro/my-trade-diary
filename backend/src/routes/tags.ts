import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/', async (req, res) => {
  const tags = await prisma.tag.findMany({
    where: { userId: req.user!.id },
    orderBy: { name: 'asc' },
  });
  res.json({ tags });
});

router.post('/', body('name').isString(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const existing = await prisma.tag.findFirst({ where: { userId: req.user!.id, name: req.body.name } });
  if (existing) {
    return res.status(409).json({ message: 'Tag already exists' });
  }
  const tag = await prisma.tag.create({
    data: { name: req.body.name, userId: req.user!.id },
  });
  res.status(201).json({ tag });
});

router.put('/:id', param('id').isInt({ min: 1 }), body('name').isString(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const id = Number(req.params.id);
  const tag = await prisma.tag.findFirst({ where: { id, userId: req.user!.id } });
  if (!tag) {
    return res.status(404).json({ message: 'Tag not found' });
  }
  const updated = await prisma.tag.update({ where: { id }, data: { name: req.body.name } });
  res.json({ tag: updated });
});

router.delete('/:id', param('id').isInt({ min: 1 }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const id = Number(req.params.id);
  const tag = await prisma.tag.findFirst({ where: { id, userId: req.user!.id } });
  if (!tag) {
    return res.status(404).json({ message: 'Tag not found' });
  }
  await prisma.tradeTag.deleteMany({ where: { tagId: id } });
  await prisma.tag.delete({ where: { id } });
  res.status(204).send();
});

export default router;
