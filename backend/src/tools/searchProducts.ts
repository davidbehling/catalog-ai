import { Product } from '../models/Product.js';

export async function searchProductsForCompany(companyId: string, query: string) {
  const terms = query.trim().split(/\s+/).filter(Boolean).slice(0, 8);
  const filter: Record<string, unknown> = { companyId };

  if (terms.length) {
    filter.$or = terms.map((term) => ({ $or: [
      { name: { $regex: escapeRegex(term), $options: 'i' } },
      { description: { $regex: escapeRegex(term), $options: 'i' } },
      { category: { $regex: escapeRegex(term), $options: 'i' } }
    ] }));
  }

  return Product.find(filter).select('name description price category imageUrl').limit(8).lean();
}

function escapeRegex(value: string) { 
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}
