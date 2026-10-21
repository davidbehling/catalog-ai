import { Schema, model, type InferSchemaType } from 'mongoose';

const productSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, maxlength: 2000 },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: '' }
}, { timestamps: true });

productSchema.index({ companyId: 1, category: 1 });

export type ProductDocument = InferSchemaType<typeof productSchema>;

export const Product = model('Product', productSchema);
