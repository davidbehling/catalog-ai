import { Schema, model, type InferSchemaType } from 'mongoose';

const notificationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  // `true` quando o usuário visualiza a notificação.
  ready: { type: Boolean, default: false, index: true }
}, { timestamps: true });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;

export const Notification = model('Notification', notificationSchema);
