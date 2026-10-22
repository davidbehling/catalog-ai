import { Router } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product.js';
import { requireAdmin, requireAuth, requireCompany } from '../middleware/auth.js';

export const productsRouter = Router();

productsRouter.use(requireAuth);
productsRouter.use(requireCompany);

const productSchema = z.object({ name: z.string().min(1).max(120), description: z.string().min(1).max(2000), price: z.number().min(0), category: z.string().min(1).max(80), imageUrl: z.string().url().or(z.literal('')).optional() });

productsRouter.get('/', async (req, res, next) => {
  try {
    const products = await Product.find({ companyId: req.auth!.companyId }).sort({ createdAt: -1 }).lean();

    res.json({ products });
  } catch (error) {
    next(error); 
  }
});

productsRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    const input = productSchema.parse(req.body);
    const product = await Product.create({ ...input, companyId: req.auth!.companyId });

    res.status(201).json({ product });
  } catch (error) {
    next(error); 
  }
});

productsRouter.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const input = productSchema.partial().parse(req.body);
    const product = await Product.findOneAndUpdate({ _id: req.params.id, companyId: req.auth!.companyId }, { $set: input }, { new: true, runValidators: true });
    
    if (!product) { 
      res.status(404).json({ error: 'Produto não encontrado' }); 
      return; 
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

productsRouter.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, companyId: req.auth!.companyId });

    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
