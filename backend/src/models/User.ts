import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  // Registro do primeiro e do último acesso à aplicação, no formato 'yyyy-mm-dd hh-mm-ss'.
  first_login: { type: String, default: null },
  current_login: { type: String, default: null }
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User = model('User', userSchema);
