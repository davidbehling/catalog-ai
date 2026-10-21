import { Schema, model, type InferSchemaType } from 'mongoose';

const companySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true }
}, { timestamps: true });

export type CompanyDocument = InferSchemaType<typeof companySchema>;

export const Company = model('Company', companySchema);
